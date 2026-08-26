const express = require('express');
const router = express.Router();
const { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { authenticateUser } = require('../middleware/authenticate');
const { authorizeRoles } = require('../middleware/authorize');
const { optionalAuth } = require('../middleware/authenticate');
const { uploadSingle } = require('../middleware/upload');
const { createCourseValidators, updateCourseValidators } = require('../validators/courseValidators');

// Public (with optional auth to determine visibility)
router.get('/', optionalAuth, getCourses);
router.get('/:id', optionalAuth, getCourseById);

// Teacher + Admin only
router.post(
    '/',
    authenticateUser,
    authorizeRoles('teacher', 'admin'),
    uploadSingle('thumbnail'),
    createCourseValidators,
    createCourse
);
router.patch(
    '/:id',
    authenticateUser,
    authorizeRoles('teacher', 'admin'),
    uploadSingle('thumbnail'),
    updateCourseValidators,
    updateCourse
);
router.delete(
    '/:id',
    authenticateUser,
    authorizeRoles('teacher', 'admin'),
    deleteCourse
);

module.exports = router;
