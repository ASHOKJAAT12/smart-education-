const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const courseController = require('../controllers/courseController');
const subjectController = require('../controllers/subjectController');
const topicController = require('../controllers/topicController');
const questionController = require('../controllers/questionController');
const quizController = require('../controllers/quizController');
const resourceController = require('../controllers/resourceController');
const { authenticateUser } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');
const scopeToOwner = require('../middleware/ownerScope');
const { uploadSingle } = require('../middleware/upload');
const {
    createCourseValidators,
    updateCourseValidators,
    createSubjectValidators,
    updateSubjectValidators,
    createTopicValidators,
    updateTopicValidators,
    createResourceValidators,
    updateResourceValidators,
    createQuestionValidators,
    updateQuestionValidators,
    createQuizValidators,
    updateQuizValidators,
} = require('../validators/courseValidators');

// Every route in here is STRICTLY bound to Teachers (and Admins looking in)
router.use(authenticateUser);
router.use(authorizeRoles('teacher', 'admin'));

/**
 * Everything below is a *management* surface: it must only ever expose content
 * the authenticated teacher owns. `scopeToOwner` marks the request as
 * owner-scoped and strips any client-supplied ownership hints; the controllers
 * then derive ownership from req.user. Admins remain unrestricted.
 */
router.use(scopeToOwner);

// ─── Analytics Hub ────────────────────────────────────────────────────────
router.get('/dashboard', teacherController.getTeacherDashboard);
router.get('/students', teacherController.getTeacherStudents);

// ─── Content management (ownership enforced in every controller) ──────────

// Course
router.get('/courses', courseController.getCourses);
router.get('/courses/:id', courseController.getCourseById);
router.post('/courses', uploadSingle('thumbnail'), createCourseValidators, courseController.createCourse);
router.patch('/courses/:id', uploadSingle('thumbnail'), updateCourseValidators, courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);

// Subject
router.get('/subjects', subjectController.getSubjects);
router.get('/subjects/:id', subjectController.getSubjectById);
router.post('/subjects', createSubjectValidators, subjectController.createSubject);
router.patch('/subjects/:id', updateSubjectValidators, subjectController.updateSubject);
router.delete('/subjects/:id', subjectController.deleteSubject);

// Topic
router.get('/topics', topicController.getTopics);
router.get('/topics/:id', topicController.getTopicById);
router.post('/topics', createTopicValidators, topicController.createTopic);
router.patch('/topics/:id', updateTopicValidators, topicController.updateTopic);
router.delete('/topics/:id', topicController.deleteTopic);

// Learning resources
router.get('/courses/:courseId/materials', resourceController.getCourseMaterials);
router.get('/resources', resourceController.getResources);
router.get('/resources/:id', resourceController.getResourceById);
router.post('/resources', uploadSingle('file'), createResourceValidators, resourceController.createResource);
router.patch('/resources/:id', uploadSingle('file'), updateResourceValidators, resourceController.updateResource);
router.patch('/resources/:id/publish', resourceController.publishResource);
router.patch('/resources/:id/unpublish', resourceController.unpublishResource);
router.delete('/resources/:id', resourceController.deleteResource);

// Questions
router.get('/questions', questionController.getQuestions);
router.get('/questions/:id', questionController.getQuestionById);
router.post('/questions', createQuestionValidators, questionController.createQuestion);
router.patch('/questions/:id', updateQuestionValidators, questionController.updateQuestion);
router.delete('/questions/:id', questionController.deleteQuestion);

// Quizzes
router.get('/quizzes', quizController.getQuizzes);
router.get('/quizzes/:id', quizController.getQuizById);
router.post('/quizzes', createQuizValidators, quizController.createQuiz);
router.patch('/quizzes/:id', updateQuizValidators, quizController.updateQuiz);
router.delete('/quizzes/:id', quizController.deleteQuiz);

module.exports = router;
