const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const aiService = require('../services/ai/ai.service');
const AIConversation = require('../models/AIConversation');
const Topic = require('../models/Topic');
const Progress = require('../models/Progress');
const Question = require('../models/Question');
const logger = require('../utils/logger');
const { AppError, notFound, badRequest, serviceUnavailable } = require('../utils/AppError');
const { sanitizePrompt, validateGeneratedBatch } = require('../utils/aiGuard');
const { parsePagination, buildPaginationMeta } = require('../utils/queryHelper');
const { AI_LIMITS, ERROR_CODES } = require('../config/constants');

/**
 * AI controller.
 *
 * Invariants enforced here:
 *  - Conversations are scoped to req.user._id in the query filter, so a student
 *    can never read or mutate another student's conversation.
 *  - User input is sanitized for prompt injection before reaching the provider.
 *  - Provider errors are logged server-side and returned as a generic 503 —
 *    raw provider messages can contain endpoint URLs and key fragments.
 *  - AI failure never corrupts stored state or blocks core learning features.
 */

/** Convert any provider failure into a safe, user-facing 503. */
const toSafeAiError = (err, operation, context) => {
    logger.aiFailure(operation, { ...context, error: err.message });

    if (err instanceof AppError) return err;

    // The provider key being absent is a configuration problem, not a user error.
    const notConfigured = /api key|not configured|missing key/i.test(err.message || '');

    return serviceUnavailable(
        notConfigured
            ? 'The AI assistant is not configured on this server yet.'
            : 'The AI assistant is temporarily unavailable. Your learning progress is unaffected.',
        notConfigured ? ERROR_CODES.AI_NOT_CONFIGURED : ERROR_CODES.AI_UNAVAILABLE
    );
};

// ─── POST /ai/chat ─────────────────────────────────────────────────────────
exports.postChat = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const { topicId, conversationId } = req.body;

    const { text: message, wasFiltered } = sanitizePrompt(req.body.message, AI_LIMITS.MAX_MESSAGE_CHARS);
    if (!message) throw badRequest('Message cannot be empty.');

    if (wasFiltered) {
        logger.warn('ai.prompt_filtered', { userId: String(req.user._id) });
    }

    // Ownership is part of the filter, not a post-hoc check.
    let conversation;
    if (conversationId) {
        conversation = await AIConversation.findOne({
            _id: conversationId,
            studentId: req.user._id,
        });
        if (!conversation) throw notFound('Conversation');

        if (conversation.messages.length >= AI_LIMITS.MAX_MESSAGES_PER_CONVERSATION) {
            throw new AppError(
                'This conversation has reached its maximum length. Please start a new one.',
                409,
                ERROR_CODES.CONFLICT
            );
        }
    } else {
        conversation = new AIConversation({
            studentId: req.user._id,
            topicId: topicId || null,
            title: message.slice(0, 60),
        });
    }

    // Fetch fresh mastery context so the model never reasons from stale numbers.
    let topicData = null;
    let progressData = null;
    if (conversation.topicId) {
        [topicData, progressData] = await Promise.all([
            Topic.findById(conversation.topicId).select('name description difficulty').lean(),
            Progress.findOne({ studentId: req.user._id, topicId: conversation.topicId })
                .select('masteryScore masteryLevel attemptCount')
                .lean(),
        ]);
    }

    // Only persist once the provider has actually answered, so a failed request
    // leaves no dangling user message behind.
    const history = conversation.messages.slice(-AI_LIMITS.MAX_HISTORY_MESSAGES);

    let reply;
    try {
        reply = await aiService.askTutor(history, message, topicData, progressData);
    } catch (err) {
        throw toSafeAiError(err, 'chat', { userId: String(req.user._id) });
    }

    conversation.messages.push({ role: 'user', content: message });
    conversation.messages.push({ role: 'assistant', content: reply });
    conversation.metadata.messageCount = conversation.messages.length;
    await conversation.save();

    return successResponse(res, { conversationId: conversation._id, reply }, 'Reply generated');
});

// ─── GET /ai/conversations ─────────────────────────────────────────────────
exports.getConversations = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const filter = { studentId: req.user._id };

    const [history, total] = await Promise.all([
        AIConversation.find(filter)
            // Exclude the messages array: a long chat history would otherwise
            // make this list response enormous.
            .select('title topicId updatedAt metadata.messageCount')
            .populate('topicId', 'name')
            .sort({ updatedAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit)
            .lean(),
        AIConversation.countDocuments(filter),
    ]);

    return paginatedResponse(res, history, buildPaginationMeta(total, pagination), 'Chat history fetched');
});

// ─── GET /ai/conversations/:id ─────────────────────────────────────────────
exports.getConversationById = asyncHandler(async (req, res) => {
    const conversation = await AIConversation.findOne({
        _id: req.params.id,
        studentId: req.user._id,
    })
        .populate('topicId', 'name')
        .lean();

    if (!conversation) throw notFound('Conversation');
    return successResponse(res, conversation, 'Conversation fetched');
});

// ─── DELETE /ai/conversations/:id ──────────────────────────────────────────
exports.deleteConversation = asyncHandler(async (req, res) => {
    const deleted = await AIConversation.findOneAndDelete({
        _id: req.params.id,
        studentId: req.user._id,
    }).select('_id');

    if (!deleted) throw notFound('Conversation');
    return successResponse(res, null, 'Conversation deleted');
});

// ─── POST /ai/summarize ────────────────────────────────────────────────────
exports.postSummarize = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const topic = await Topic.findById(req.body.topicId).select('name description difficulty').lean();
    if (!topic) throw notFound('Topic');

    try {
        const summary = await aiService.summarizeTopic(topic);
        return successResponse(res, { summary }, 'Summary generated');
    } catch (err) {
        throw toSafeAiError(err, 'summarize', { topicId: String(req.body.topicId) });
    }
});

// ─── POST /ai/explain ──────────────────────────────────────────────────────
exports.postExplain = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const { text: concept } = sanitizePrompt(req.body.concept, AI_LIMITS.MAX_CONCEPT_CHARS);
    if (!concept) throw badRequest('Please describe the concept you want explained.');

    const topic = await Topic.findById(req.body.topicId).select('name description difficulty').lean();
    if (!topic) throw notFound('Topic');

    // Current mastery drives the explanation depth.
    const progressData = await Progress.findOne({ studentId: req.user._id, topicId: topic._id })
        .select('masteryScore masteryLevel')
        .lean();

    try {
        const explanation = await aiService.explainConcept(topic, concept, progressData);
        return successResponse(res, { explanation }, 'Explanation generated');
    } catch (err) {
        throw toSafeAiError(err, 'explain', { topicId: String(topic._id) });
    }
});

// ─── POST /ai/generate-quiz ────────────────────────────────────────────────
/**
 * Generates draft questions. Everything the model returns is validated and
 * stored as `isPublished: false` — a teacher or admin must review and publish.
 */
exports.postGenerateQuiz = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const difficulty = req.body.difficulty || 'medium';
    const requested = Number(req.body.questionCount) || 5;
    const questionCount = Math.min(Math.max(requested, AI_LIMITS.MIN_QUESTION_COUNT), AI_LIMITS.MAX_QUESTION_COUNT);

    const topic = await Topic.findById(req.body.topicId).select('name description subjectId difficulty').lean();
    if (!topic) throw notFound('Topic');

    let generated;
    try {
        generated = await aiService.generateQuiz(topic, difficulty, questionCount);
    } catch (err) {
        throw toSafeAiError(err, 'generate_quiz', { topicId: String(topic._id) });
    }

    const { questions, rejected } = validateGeneratedBatch(generated, {
        subjectId: topic.subjectId,
        topicId: topic._id,
        createdBy: req.user._id,
        fallbackDifficulty: difficulty,
    });

    if (rejected.length > 0) {
        logger.warn('ai.questions_rejected', {
            topicId: String(topic._id),
            rejectedCount: rejected.length,
            reasons: rejected.map((r) => r.reason),
        });
    }

    if (questions.length === 0) {
        throw serviceUnavailable(
            'The AI could not produce valid questions for this topic. Please try again.',
            ERROR_CODES.AI_UNAVAILABLE
        );
    }

    const inserted = await Question.insertMany(questions);

    return successResponse(
        res,
        {
            questions: inserted,
            requested: questionCount,
            accepted: inserted.length,
            discarded: rejected.length,
        },
        'Draft questions generated. They require review before publication.',
        201
    );
});
