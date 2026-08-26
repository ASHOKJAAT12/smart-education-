const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const courseController = require('../controllers/courseController');
const subjectController = require('../controllers/subjectController');
const topicController = require('../controllers/topicController');
const questionController = require('../controllers/questionController');
const quizController = require('../controllers/quizController');
const { authenticateUser } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');

// Every route in here is STRICTLY bound to Teachers (and Admins looking in)
router.use(authenticateUser);
router.use(authorizeRoles('teacher', 'admin'));

// ─── Analytics Hub ────────────────────────────────────────────────────────
router.get('/dashboard', teacherController.getTeacherDashboard);
router.get('/students', teacherController.getTeacherStudents);

// ─── Content Proxies ──────────────────────────────────────────────────────
const autoBoundCreatedBy = (req, res, next) => {
    req.query.createdBy = req.user._id; // Force filters downwards
    next();
};

// Course
router.get('/courses', autoBoundCreatedBy, courseController.getCourses);
router.post('/courses', courseController.createCourse);
router.patch('/courses/:id', courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);

// Subject
router.get('/courses/:courseId/subjects', autoBoundCreatedBy, subjectController.getSubjects);
router.post('/courses/:courseId/subjects', subjectController.createSubject);
router.patch('/subjects/:subjectId', subjectController.updateSubject);
router.delete('/subjects/:subjectId', subjectController.deleteSubject);

// Topic
router.get('/subjects/:subjectId/topics', autoBoundCreatedBy, topicController.getTopics);
router.post('/subjects/:subjectId/topics', topicController.createTopic);
router.patch('/topics/:topicId', topicController.updateTopic);
router.delete('/topics/:topicId', topicController.deleteTopic);

// Questions
router.get('/questions', autoBoundCreatedBy, questionController.getQuestions);
router.get('/questions/:id', questionController.getQuestionById);
router.post('/questions', questionController.createQuestion);
router.patch('/questions/:id', questionController.updateQuestion);
router.delete('/questions/:id', questionController.deleteQuestion);

// Quizzes
router.get('/quizzes', autoBoundCreatedBy, quizController.getQuizzes);
router.post('/quizzes', quizController.createQuiz);
router.patch('/quizzes/:id', quizController.updateQuiz);
router.delete('/quizzes/:id', quizController.deleteQuiz);

module.exports = router;
