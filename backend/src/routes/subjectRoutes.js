const express = require('express');
const router = express.Router();
const { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { authenticateUser, optionalAuth } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');
const { createSubjectValidators, updateSubjectValidators } = require('../validators/courseValidators');

router.get('/', optionalAuth, getSubjects);
router.get('/:id', optionalAuth, getSubjectById);

router.post('/', authenticateUser, authorizeRoles('teacher', 'admin'), createSubjectValidators, createSubject);
router.patch('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), updateSubjectValidators, updateSubject);
router.delete('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), deleteSubject);

module.exports = router;
