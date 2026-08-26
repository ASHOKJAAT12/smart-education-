const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const aiService = require('../services/ai/ai.service');
const AIConversation = require('../models/AIConversation');
const Topic = require('../models/Topic');
const Progress = require('../models/Progress');
const Question = require('../models/Question');

// ─── AI CHAT (TUTOR) ──────────────────────────────────────────────────────────

exports.postChat = asyncHandler(async (req, res) => {
    const { topicId, conversationId, message } = req.body;

    if (!message || message.trim() === '') return errorResponse(res, 'Message cannot be empty', 400);
    if (message.length > 2000) return errorResponse(res, 'Message exceeds 2000 character limits', 400);

    let conversation;

    // 1. Resolve or Create secure Conversation Session
    if (conversationId) {
        conversation = await AIConversation.findOne({ _id: conversationId, studentId: req.user._id });
        if (!conversation) return errorResponse(res, 'Conversation not found or unauthorized', 404);
    } else {
        conversation = new AIConversation({
            studentId: req.user._id,
            topicId: topicId || null,
            title: message.substring(0, 30) + (message.length > 30 ? '...' : '')
        });
    }

    // 2. Fetch Topic & Mastery Extrinisic Context if Topic provided explicitly
    let topicData = null;
    let progressData = null;
    if (conversation.topicId) {
        topicData = await Topic.findById(conversation.topicId).select('name description difficulty');
        progressData = await Progress.findOne({ studentId: req.user._id, topicId: conversation.topicId });
    }

    // Append User Message immediately 
    conversation.messages.push({ role: 'user', content: message });
    conversation.metadata.messageCount += 1;

    // Truncate sliding window: LLM won't bleed full limits (last 10 msgs max)
    const historySlice = conversation.messages.slice(-10);

    // 3. Request LLM Completion
    try {
        const aiResponse = await aiService.askTutor(historySlice, message, topicData, progressData);

        // 4. Persistence
        conversation.messages.push({ role: 'assistant', content: aiResponse });
        conversation.metadata.messageCount += 1;
        await conversation.save();

        return successResponse(res, { conversationId: conversation._id, reply: aiResponse }, 'Success');
    } catch (err) {
        // Automatically pop the user message if AI provider failed, preventing dangling unresolved messages
        conversation.messages.pop();
        conversation.metadata.messageCount -= 1;
        if (conversation.isNew) {
            // Let it die in memory
        } else {
            await conversation.save();
        }
        return errorResponse(res, err.message, 503);
    }
});

exports.getConversations = asyncHandler(async (req, res) => {
    const history = await AIConversation.find({ studentId: req.user._id })
        .sort({ updatedAt: -1 })
        .select('title topicId updatedAt')
        .populate('topicId', 'name');
    return successResponse(res, { history }, 'Chat history retrieved');
});

exports.getConversationById = asyncHandler(async (req, res) => {
    const convo = await AIConversation.findOne({ _id: req.params.id, studentId: req.user._id })
        .populate('topicId', 'name');
    if (!convo) return errorResponse(res, 'Not found', 404);
    return successResponse(res, convo, 'Conversation retrieved');
});

exports.deleteConversation = asyncHandler(async (req, res) => {
    const convo = await AIConversation.findOneAndDelete({ _id: req.params.id, studentId: req.user._id });
    if (!convo) return errorResponse(res, 'Not found', 404);
    return successResponse(res, null, 'Deleted');
});

// ─── GENERATORS ───────────────────────────────────────────────────────────────

exports.postSummarize = asyncHandler(async (req, res) => {
    const { topicId } = req.body;
    if (!topicId) return errorResponse(res, 'TopicId required', 400);

    const topic = await Topic.findById(topicId);
    if (!topic) return errorResponse(res, 'Topic not found', 404);

    try {
        const summary = await aiService.summarizeTopic(topic);
        return successResponse(res, { summary }, 'Summary generated');
    } catch (err) {
        return errorResponse(res, err.message, 503);
    }
});

exports.postExplain = asyncHandler(async (req, res) => {
    const { topicId, concept } = req.body;
    if (!topicId || !concept) return errorResponse(res, 'topicId and concept required', 400);

    const topic = await Topic.findById(topicId);
    if (!topic) return errorResponse(res, 'Topic not found', 404);
    const progressData = await Progress.findOne({ studentId: req.user._id, topicId });

    try {
        const explanation = await aiService.explainConcept(topic, concept, progressData);
        return successResponse(res, { explanation }, 'Explanation generated');
    } catch (err) {
        return errorResponse(res, err.message, 503);
    }
});

exports.postGenerateQuiz = asyncHandler(async (req, res) => {
    const { topicId, difficulty = 'medium', questionCount = 5 } = req.body;

    if (questionCount > 10) return errorResponse(res, 'Max 10 questions permitted per generation', 400);
    if (!topicId) return errorResponse(res, 'TopicId required', 400);

    const topic = await Topic.findById(topicId);
    if (!topic) return errorResponse(res, 'Topic not found', 404);

    try {
        const questionsList = await aiService.generateQuiz(topic, difficulty, questionCount);

        // Validation check over the AI array output bounds
        if (!Array.isArray(questionsList) || questionsList.length === 0) {
            throw new Error("AI output validation failed: Expected an Array.");
        }

        // Sanitization & DB insertion tracking
        const dbReadyQs = questionsList.map(q => {
            // Guarantee exactly 4 options by padding/truncating if LLM hallucinated
            const sanitizedOpts = [...new Set(q.options)].slice(0, 4); // Strip dupes
            while (sanitizedOpts.length < 4) sanitizedOpts.push(q.correctAnswer + ' (Alternative Variant)');
            if (!sanitizedOpts.includes(q.correctAnswer)) sanitizedOpts[0] = q.correctAnswer;

            return {
                subjectId: topic.subjectId,
                topicId: topic._id,
                title: q.question,
                options: sanitizedOpts,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                difficulty: q.difficulty || difficulty,
                author: req.user._id, // Keep trace of who pushed the generation
                isPublished: false,   // Student generated are private by default
                metadata: {
                    source: "ai",
                    reviewStatus: "generated"
                }
            };
        });

        // Bulk insert to Questions Model immediately linking seamlessly to Quiz ingestion engine (Phase 8 prep)
        const inserted = await Question.insertMany(dbReadyQs);

        return successResponse(res, { questions: inserted }, 'Quiz successfully generated via AI and persisted safely to Question Engine.');
    } catch (err) {
        return errorResponse(res, err.message, 503);
    }
});
