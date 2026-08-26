const express = require('express');
const router = express.Router();
const { getQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz, startQuiz, submitQuiz, getQuizAttempt } = require('../controllers/quizController');
const { authenticateUser, optionalAuth } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');
const { createQuizValidators, updateQuizValidators } = require('../validators/courseValidators');

// All authenticated users can list/view published quizzes
router.get('/', authenticateUser, getQuizzes);
router.get('/:id', authenticateUser, getQuizById);

// Quiz Execute Hooks (Phase 8 Student Engine)
router.post('/:id/start', authenticateUser, startQuiz);
router.post('/attempts/:attemptId/submit', authenticateUser, submitQuiz);
router.get('/attempts/:attemptId', authenticateUser, getQuizAttempt);

// Manage quizzes: teacher + admin only
router.post('/', authenticateUser, authorizeRoles('teacher', 'admin'), createQuizValidators, createQuiz);
router.patch('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), updateQuizValidators, updateQuiz);
router.delete('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), deleteQuiz);

module.exports = router;
