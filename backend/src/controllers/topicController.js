const asyncHandler = require('../middleware/asyncHandler');
const Topic = require('../models/Topic');
const Subject = require('../models/Subject');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter, isOwnerOrAdmin } = require('../utils/queryHelper');

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

module.exports = { getTopics, getTopicById, createTopic, updateTopic, deleteTopic };
