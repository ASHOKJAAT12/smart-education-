const express = require('express');
const router = express.Router();
const {
    getQuizzes,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    startQuiz,
    submitQuiz,
    getMyQuizAttempts,
    getQuizAttempt,
} = require('../controllers/quizController');
const { authenticateUser } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');
const { createQuizValidators, updateQuizValidators } = require('../validators/courseValidators');
const {
    startQuizValidators,
    submitQuizValidators,
    attemptIdValidators,
} = require('../validators/quizValidators');

// ─── Attempt routes ────────────────────────────────────────────────────────
// IMPORTANT: these are registered BEFORE '/:id' so that a request to
// /quizzes/attempts/... is not swallowed by the '/:id' parameter route.
router.get('/attempts', authenticateUser, getMyQuizAttempts);
router.get('/attempts/:attemptId', authenticateUser, attemptIdValidators, getQuizAttempt);
router.post('/attempts/:attemptId/submit', authenticateUser, submitQuizValidators, submitQuiz);

// ─── Listing / detail ──────────────────────────────────────────────────────
router.get('/', authenticateUser, getQuizzes);
router.get('/:id', authenticateUser, getQuizById);

// ─── Quiz execution ────────────────────────────────────────────────────────
router.post('/:id/start', authenticateUser, startQuizValidators, startQuiz);

// ─── Content management: teacher + admin only ──────────────────────────────
router.post('/', authenticateUser, authorizeRoles('teacher', 'admin'), createQuizValidators, createQuiz);
router.patch('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), updateQuizValidators, updateQuiz);
router.delete('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), deleteQuiz);

module.exports = router;
