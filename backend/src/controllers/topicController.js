const asyncHandler = require('../middleware/asyncHandler');
const Topic = require('../models/Topic');
const Subject = require('../models/Subject');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter } = require('../utils/queryHelper');
const {
    isAdmin,
    ownsCourse,
    getOwnedSubjectIds,
    getAuthorizedTopic,
} = require('../utils/ownership');
const { notFound, forbidden } = require('../utils/AppError');
const practiceService = require('../services/practice.service');
const streakService = require('../services/streak.service');
const LearningResource = require('../models/LearningResource');
const Progress = require('../models/Progress');

// ─── GET /topics ───────────────────────────────────────────────────────────
const getTopics = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const filter = buildContentFilter(req.query, {});
    const publishedRequested = req.query.published !== undefined;

    if (req.ownerScoped && !isAdmin(req.user)) {
        // Restrict to topics under the authenticated teacher's own courses.
        const subjectIds = await getOwnedSubjectIds(req.user);
        if (filter.subjectId) {
            const parent = await Subject.findById(filter.subjectId).select('courseId');
            if (!parent || !(await ownsCourse(parent.courseId, req.user))) throw notFound('Subject');
        } else {
            filter.subjectId = { $in: subjectIds };
        }
        if (!publishedRequested) delete filter.isPublished;
    } else if (isAdmin(req.user)) {
        if (!publishedRequested) delete filter.isPublished;
    } else if (req.user && req.user.role === 'teacher') {
        // Catalogue browsing: published topics plus the teacher's own drafts.
        const subjectIds = await getOwnedSubjectIds(req.user);
        delete filter.isPublished;
        filter.$and = [
            ...(filter.$and || []),
            { $or: [{ isPublished: true }, { subjectId: { $in: subjectIds } }] },
        ];
    } else if (!publishedRequested) {
        filter.isPublished = true;
    }

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

    if (!topic) throw notFound('Topic');

    const parentCourseId = topic.subjectId?.courseId;
    const isOwner =
        req.user && req.user.role !== 'student' && parentCourseId
            ? await ownsCourse(parentCourseId, req.user)
            : false;

    // Owner-scoped detail: another teacher's topic must look like a missing one.
    if (req.ownerScoped && !isAdmin(req.user) && !isOwner) throw notFound('Topic');

    // Drafts are visible to admins and to the owning teacher only.
    if (!topic.isPublished && !isAdmin(req.user) && !isOwner) throw notFound('Topic');

    return successResponse(res, topic, 'Topic fetched');
});

// ─── POST /topics ──────────────────────────────────────────────────────────
const createTopic = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    // The parent subject must exist and its course must belong to the teacher.
    const subject = await Subject.findById(req.body.subjectId).select('_id courseId');
    if (!subject) throw notFound('Subject');

    if (!isAdmin(req.user) && !(await ownsCourse(subject.courseId, req.user))) {
        throw forbidden('You can only add topics to your own courses');
    }

    const { name, description, order, difficulty, estimatedMinutes, subjectId } = req.body;

    const topic = await Topic.create({
        name,
        description,
        order,
        difficulty,
        estimatedMinutes,
        subjectId,
        isPublished: false,
        createdBy: req.user._id,
    });

    return successResponse(res, topic, 'Topic created', 201);
});

// ─── PATCH /topics/:id ────────────────────────────────────────────────────
const updateTopic = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    // Authority follows Topic → Subject → Course.
    const topic = await getAuthorizedTopic(req.params.id, req.user);

    const WHITELIST = ['name', 'description', 'order', 'difficulty', 'estimatedMinutes'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) topic[field] = req.body[field];
    });

    if (req.body.isPublished !== undefined && isAdmin(req.user)) {
        topic.isPublished = req.body.isPublished;
    }

    await topic.save();
    return successResponse(res, topic, 'Topic updated');
});

// ─── DELETE /topics/:id ───────────────────────────────────────────────────
const deleteTopic = asyncHandler(async (req, res) => {
    const topic = await getAuthorizedTopic(req.params.id, req.user);

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
