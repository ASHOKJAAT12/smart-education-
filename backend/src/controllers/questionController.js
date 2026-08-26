const asyncHandler = require('../middleware/asyncHandler');
const Question = require('../models/Question');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter, isOwnerOrAdmin } = require('../utils/queryHelper');

// ─── GET /questions ────────────────────────────────────────────────────────
// Teachers and admins only — students access questions via Quiz
const getQuestions = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const filter = buildContentFilter(req.query, {});

    const [questions, total] = await Promise.all([
        Question.find(filter)
            .populate('subjectId', 'name')
            .populate('topicId', 'name')
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit),
        Question.countDocuments(filter),
    ]);

    return paginatedResponse(res, questions, buildPaginationMeta(total, pagination), 'Questions fetched');
});

// ─── GET /questions/:id ────────────────────────────────────────────────────
const getQuestionById = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id)
        .populate('subjectId', 'name')
        .populate('topicId', 'name')
        .populate('createdBy', 'firstName lastName');

    if (!question) {
        const err = new Error('Question not found');
        err.statusCode = 404;
        throw err;
    }

    return successResponse(res, question, 'Question fetched');
});

// ─── POST /questions ───────────────────────────────────────────────────────
const createQuestion = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    // Validate that correctAnswer is within options range
    if (req.body.options && req.body.correctAnswer >= req.body.options.length) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: [{ field: 'correctAnswer', message: 'correctAnswer index is out of range for the provided options' }],
        });
    }

    const question = await Question.create({
        ...req.body,
        isPublished: false,
        createdBy: req.user._id,
    });

    return successResponse(res, question, 'Question created', 201);
});

// ─── PATCH /questions/:id ──────────────────────────────────────────────────
const updateQuestion = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const question = await Question.findById(req.params.id);
    if (!question) {
        const err = new Error('Question not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(question, req.user)) {
        const err = new Error('You do not have permission to edit this question');
        err.statusCode = 403;
        throw err;
    }

    const WHITELIST = ['question', 'options', 'correctAnswer', 'explanation', 'difficulty', 'subjectId', 'topicId'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) question[field] = req.body[field];
    });

    if (req.body.isPublished !== undefined && req.user.role === 'admin') {
        question.isPublished = req.body.isPublished;
    }

    // Re-validate correctAnswer range after potential options update
    if (question.correctAnswer >= question.options.length) {
        const err = new Error('correctAnswer index is out of range for the provided options');
        err.statusCode = 400;
        throw err;
    }

    await question.save();
    return successResponse(res, question, 'Question updated');
});

// ─── DELETE /questions/:id ─────────────────────────────────────────────────
const deleteQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);
    if (!question) {
        const err = new Error('Question not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(question, req.user)) {
        const err = new Error('You do not have permission to delete this question');
        err.statusCode = 403;
        throw err;
    }

    await question.deleteOne();
    return successResponse(res, null, 'Question deleted');
});

module.exports = { getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion };
