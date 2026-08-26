const express = require('express');
const aiController = require('../controllers/aiController');
const { authenticateUser } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');
// A standard rate limiter mapping could be appended here sequentially.

const router = express.Router();

router.use(authenticateUser);
// Note: AI actions are universally open to students but tightly restricted to their user._id boundaries internally via Mongo lookups.
router.use(authorizeRoles('student', 'teacher', 'admin'));

// Conversational Endpoints 
router.post('/chat', aiController.postChat);
router.get('/conversations', aiController.getConversations);
router.get('/conversations/:id', aiController.getConversationById);
router.delete('/conversations/:id', aiController.deleteConversation);

// Educational Specialized Endpoints
router.post('/summarize', aiController.postSummarize);
router.post('/explain', aiController.postExplain);
router.post('/generate-quiz', aiController.postGenerateQuiz);

module.exports = router;
