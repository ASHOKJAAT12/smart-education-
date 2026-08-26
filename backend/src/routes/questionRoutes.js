const express = require('express');
const router = express.Router();
const { getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion } = require('../controllers/questionController');
const { authenticateUser } = require('../middleware/authenticate');
const { authorizeRoles } = require('../middleware/authorize');
const { createQuestionValidators, updateQuestionValidators } = require('../validators/courseValidators');

// Teacher + Admin only — students access questions via Quiz
router.get('/', authenticateUser, authorizeRoles('teacher', 'admin'), getQuestions);
router.get('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), getQuestionById);
router.post('/', authenticateUser, authorizeRoles('teacher', 'admin'), createQuestionValidators, createQuestion);
router.patch('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), updateQuestionValidators, updateQuestion);
router.delete('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), deleteQuestion);

module.exports = router;
