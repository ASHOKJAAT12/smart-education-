const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const courseRoutes = require('./courseRoutes');
const subjectRoutes = require('./subjectRoutes');
const topicRoutes = require('./topicRoutes');
const resourceRoutes = require('./resourceRoutes');
const questionRoutes = require('./questionRoutes');
const quizRoutes = require('./quizRoutes');

const router = express.Router();

/**
 * Central route registry.
 * All API routes are mounted here and prefixed with /api/v1 in app.js.
 *
 * Phase 1: /health
 * Phase 2: /auth, /users
 * Phase 3: /courses, /subjects, /topics, /resources, /questions, /quizzes
 */
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/subjects', subjectRoutes);
router.use('/topics', topicRoutes);
router.use('/resources', resourceRoutes);
router.use('/questions', questionRoutes);
router.use('/quizzes', quizRoutes);

module.exports = router;

