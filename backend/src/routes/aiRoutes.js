const express = require('express');
const aiController = require('../controllers/aiController');
const { authenticateUser } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');
const { aiChatLimiter, aiGenerationLimiter } = require('../middleware/rateLimiters');
const {
    chatValidators,
    conversationIdValidators,
    summarizeValidators,
    explainValidators,
    generateQuizValidators,
} = require('../validators/aiValidators');

const router = express.Router();

/**
 * AI routes.
 *
 * Every route requires authentication. Conversation access is additionally
 * scoped to the authenticated user inside the controller's query filters, so a
 * valid token for student A cannot reach student B's conversations.
 *
 * Rate limits are per-user and tiered: chat is cheap-ish and frequent,
 * generation is expensive and rare.
 */
router.use(authenticateUser);
router.use(authorizeRoles('student', 'teacher', 'admin'));

// ─── Conversation ──────────────────────────────────────────────────────────
router.post('/chat', aiChatLimiter, chatValidators, aiController.postChat);
router.get('/conversations', aiController.getConversations);
router.get('/conversations/:id', conversationIdValidators, aiController.getConversationById);
router.delete('/conversations/:id', conversationIdValidators, aiController.deleteConversation);

// ─── Generation (expensive) ────────────────────────────────────────────────
router.post('/summarize', aiGenerationLimiter, summarizeValidators, aiController.postSummarize);
router.post('/explain', aiGenerationLimiter, explainValidators, aiController.postExplain);
router.post('/generate-quiz', aiGenerationLimiter, generateQuizValidators, aiController.postGenerateQuiz);

module.exports = router;
