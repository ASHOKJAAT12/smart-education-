const express = require('express');
const assessmentController = require('../controllers/assessmentController');
const { authenticateUser } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');
const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Student only routes for taking the test
router.post('/:assessmentId/start', authorizeRoles('student'), assessmentController.startAssessment);
router.post('/attempts/:attemptId/submit', authorizeRoles('student'), assessmentController.submitAssessment);
router.get('/attempts/:attemptId', authorizeRoles('student'), assessmentController.getAttempt);
router.get('/results/:attemptId', authorizeRoles('student'), assessmentController.getResult);
router.get('/my-results', authorizeRoles('student'), assessmentController.getMyResults);

// General viewing of assessments (teachers might create, students might view available)
router.get('/', assessmentController.getAllAssessments);
router.get('/:assessmentId', assessmentController.getAssessmentById);

// Optionally an admin/teacher can create an assessment (skipping validation middleware for now for brevity)
router.post('/', authorizeRoles('teacher', 'admin'), assessmentController.createAssessment);

module.exports = router;
