const asyncHandler = require('../middleware/asyncHandler');
const Topic = require('../models/Topic');
const Subject = require('../models/Subject');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { parsePagination, buildPaginationMeta, buildContentFilter, isOwnerOrAdmin } = require('../utils/queryHelper');
const practiceService = require('../services/practice.service');
const streakService = require('../services/streak.service');
const LearningResource = require('../models/LearningResource');
const Progress = require('../models/Progress');

// ─── GET /topics ───────────────────────────────────────────────────────────
const getTopics = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const canSeeAll = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    const defaults = canSeeAll ? {} : { isPublished: true };
    const filter = buildContentFilter(req.query, defaults);

    const [topics, total] = await Promise.all([
        Topic.find(filter)
            .populate('subjectId', 'name courseId')
            .populate('createdBy', 'firstName lastName')
            .sort({ order: 1, createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit),
        Topic.countDocuments(filter),
    ]);

    return paginatedResponse(res, topics, buildPaginationMeta(total, pagination), 'Topics fetched');
});

// ─── GET /topics/:id ───────────────────────────────────────────────────────
const getTopicById = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id)
        .populate('subjectId', 'name courseId')
        .populate('createdBy', 'firstName lastName');

    if (!topic) {
        const err = new Error('Topic not found');
        err.statusCode = 404;
        throw err;
    }

    const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    if (!topic.isPublished && !isPrivileged) {
        const err = new Error('Topic not found');
        err.statusCode = 404;
        throw err;
    }

    return successResponse(res, topic, 'Topic fetched');
});

// ─── POST /topics ──────────────────────────────────────────────────────────
const createTopic = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    // Verify the subject exists and teacher owns it
    const subject = await Subject.findById(req.body.subjectId);
    if (!subject) {
        const err = new Error('Subject not found');
        err.statusCode = 404;
        throw err;
    }

    if (req.user.role === 'teacher' && subject.createdBy.toString() !== req.user._id.toString()) {
        const err = new Error('You can only add topics to your own subjects');
        err.statusCode = 403;
        throw err;
    }

    const topic = await Topic.create({
        ...req.body,
        isPublished: false,
        createdBy: req.user._id,
    });

    return successResponse(res, topic, 'Topic created', 201);
});

// ─── PATCH /topics/:id ────────────────────────────────────────────────────
const updateTopic = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const topic = await Topic.findById(req.params.id);
    if (!topic) {
        const err = new Error('Topic not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(topic, req.user)) {
        const err = new Error('You do not have permission to edit this topic');
        err.statusCode = 403;
        throw err;
    }

    const WHITELIST = ['name', 'description', 'order', 'difficulty', 'estimatedMinutes'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) topic[field] = req.body[field];
    });

    if (req.body.isPublished !== undefined && req.user.role === 'admin') {
        topic.isPublished = req.body.isPublished;
    }

    await topic.save();
    return successResponse(res, topic, 'Topic updated');
});

// ─── DELETE /topics/:id ───────────────────────────────────────────────────
const deleteTopic = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
        const err = new Error('Topic not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(topic, req.user)) {
        const err = new Error('You do not have permission to delete this topic');
        err.statusCode = 403;
        throw err;
    }

    await topic.deleteOne();
    return successResponse(res, null, 'Topic deleted');
});

// ─── GET /topics/:id/learning ──────────────────────────────────────────────
const getTopicLearning = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });

    // Fetch attached verified resources
    const resources = await LearningResource.find({ topicId: topic._id, isPublished: true });

    // Fetch real-time progress map
    const progress = await Progress.findOne({ studentId: req.user._id, topicId: topic._id });

    // Mark daily activity streak conceptually just for reviewing deep learning content
    await streakService.logActivityAndRefreshStreak(req.user._id);

    return successResponse(res, { topic, resources, progress }, 'Topic learning package retrieved');
});

// ─── POST /topics/:id/practice/start ─────────────────────────────────────────
const startPractice = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });

    // Tap into adaptive intelligence service
    const questions = await practiceService.fetchAdaptivePracticeSession(req.user._id, topic._id);

    // Update daily streak tracker since doing practice matters
    await streakService.logActivityAndRefreshStreak(req.user._id);

    return successResponse(res, { questions }, 'Adaptive practice session initialized');
});

module.exports = { getTopics, getTopicById, createTopic, updateTopic, deleteTopic, getTopicLearning, startPractice };
