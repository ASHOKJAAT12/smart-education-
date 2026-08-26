const asyncHandler = require('../middleware/asyncHandler');
const Quiz = require('../models/Quiz');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter, isOwnerOrAdmin } = require('../utils/queryHelper');

// ─── GET /quizzes ──────────────────────────────────────────────────────────
const getQuizzes = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const canSeeAll = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    const defaults = canSeeAll ? {} : { isPublished: true };
    const filter = buildContentFilter(req.query, defaults);

    const [quizzes, total] = await Promise.all([
        Quiz.find(filter)
            .populate('subjectId', 'name')
            .populate('topicId', 'name')
            .populate('createdBy', 'firstName lastName')
            .select('-questions') // don't expose question list in list view
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit),
        Quiz.countDocuments(filter),
    ]);

    return paginatedResponse(res, quizzes, buildPaginationMeta(total, pagination), 'Quizzes fetched');
});

// ─── GET /quizzes/:id ──────────────────────────────────────────────────────
const getQuizById = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id)
        .populate('subjectId', 'name')
        .populate('topicId', 'name')
        .populate('createdBy', 'firstName lastName')
        .populate({
            path: 'questions',
            select: 'question options difficulty questionType',   // do NOT expose correctAnswer/explanation in quiz view
        });

    if (!quiz) {
        const err = new Error('Quiz not found');
        err.statusCode = 404;
        throw err;
    }

    const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    if (!quiz.isPublished && !isPrivileged) {
        const err = new Error('Quiz not found');
        err.statusCode = 404;
        throw err;
    }

    return successResponse(res, quiz, 'Quiz fetched');
});

// ─── POST /quizzes ─────────────────────────────────────────────────────────
const createQuiz = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const quiz = await Quiz.create({
        ...req.body,
        isPublished: false,
        createdBy: req.user._id,
    });

    return successResponse(res, quiz, 'Quiz created', 201);
});

// ─── PATCH /quizzes/:id ────────────────────────────────────────────────────
const updateQuiz = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
        const err = new Error('Quiz not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(quiz, req.user)) {
        const err = new Error('You do not have permission to edit this quiz');
        err.statusCode = 403;
        throw err;
    }

    const WHITELIST = ['title', 'description', 'questions', 'difficulty', 'durationMinutes', 'passingScore', 'subjectId', 'topicId'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) quiz[field] = req.body[field];
    });

    if (req.body.isPublished !== undefined && req.user.role === 'admin') {
        quiz.isPublished = req.body.isPublished;
    }

    await quiz.save();
    return successResponse(res, quiz, 'Quiz updated');
});

// ─── DELETE /quizzes/:id ───────────────────────────────────────────────────
const deleteQuiz = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
        const err = new Error('Quiz not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(quiz, req.user)) {
        const err = new Error('You do not have permission to delete this quiz');
        err.statusCode = 403;
        throw err;
    }

    await quiz.deleteOne();
    return successResponse(res, null, 'Quiz deleted');
});

module.exports = { getQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz };
