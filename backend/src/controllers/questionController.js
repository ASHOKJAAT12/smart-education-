const asyncHandler = require('../middleware/asyncHandler');
const Question = require('../models/Question');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter } = require('../utils/queryHelper');
const { isAdmin, ownerFilter } = require('../utils/ownership');
const { notFound, badRequest } = require('../utils/AppError');

/**
 * Question visibility follows the platform's existing moderation rule:
 * questions start as drafts (`isPublished: false`) and join the shared bank once
 * approved. Therefore:
 *   - drafts stay private to their author (and admins);
 *   - approved questions remain shared across teachers, as designed;
 *   - owner-scoped requests (`/teacher/questions`) return only the caller's own
 *     questions, so the Question Bank screen manages nothing but its own content.
 */

// ─── GET /questions ────────────────────────────────────────────────────────
// Teachers and admins only — students access questions via Quiz
const getQuestions = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const filter = buildContentFilter(req.query, {});
    const publishedRequested = req.query.published !== undefined;

    if (req.ownerScoped && !isAdmin(req.user)) {
        Object.assign(filter, ownerFilter(req.user));
        if (!publishedRequested) delete filter.isPublished;
    } else if (isAdmin(req.user)) {
        if (!publishedRequested) delete filter.isPublished;
    } else {
        // Shared bank: approved questions plus the caller's own drafts.
        delete filter.isPublished;
        filter.$and = [
            ...(filter.$and || []),
            { $or: [{ isPublished: true }, { createdBy: req.user._id }] },
        ];
    }

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

    if (!question) throw notFound('Question');

    const ownerId = question.createdBy?._id || question.createdBy;
    const isOwner = ownerId && ownerId.toString() === req.user._id.toString();

    // Owner-scoped detail returns nothing but the caller's own questions.
    if (req.ownerScoped && !isAdmin(req.user) && !isOwner) throw notFound('Question');

    // Unapproved drafts stay private to their author.
    if (!question.isPublished && !isAdmin(req.user) && !isOwner) throw notFound('Question');

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

    const { question, options, correctAnswer, explanation, difficulty, questionType, subjectId, topicId } = req.body;

    const created = await Question.create({
        question,
        options,
        correctAnswer,
        explanation,
        difficulty,
        questionType,
        subjectId,
        topicId,
        isPublished: false,
        createdBy: req.user._id,
    });

    return successResponse(res, created, 'Question created', 201);
});

/**
 * Load a question the caller may mutate. Ownership is part of the query, so a
 * teacher cannot probe for another teacher's question by trying ids.
 */
const findOwnQuestion = async (id, user) => {
    const question = await Question.findOne({ _id: id, ...ownerFilter(user) });
    if (!question) throw notFound('Question');
    return question;
};

// ─── PATCH /questions/:id ──────────────────────────────────────────────────
const updateQuestion = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const question = await findOwnQuestion(req.params.id, req.user);

    const WHITELIST = ['question', 'options', 'correctAnswer', 'explanation', 'difficulty', 'subjectId', 'topicId'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) question[field] = req.body[field];
    });

    if (req.body.isPublished !== undefined && isAdmin(req.user)) {
        question.isPublished = req.body.isPublished;
    }

    // Re-validate correctAnswer range after potential options update
    if (question.correctAnswer >= question.options.length) {
        throw badRequest('correctAnswer index is out of range for the provided options');
    }

    await question.save();
    return successResponse(res, question, 'Question updated');
});

// ─── DELETE /questions/:id ─────────────────────────────────────────────────
const deleteQuestion = asyncHandler(async (req, res) => {
    const question = await findOwnQuestion(req.params.id, req.user);

    await question.deleteOne();
    return successResponse(res, null, 'Question deleted');
});

module.exports = { getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion };
