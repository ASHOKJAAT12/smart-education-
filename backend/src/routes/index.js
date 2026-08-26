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
const studentRoutes = require('./studentRoutes');
const assessmentRoutes = require('./assessmentRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const studyPlanRoutes = require('./studyPlanRoutes');
const aiRoutes = require('./aiRoutes');
const progressRoutes = require('./progressRoutes');
const teacherRoutes = require('./teacherRoutes'); // Phase 9
const router = express.Router();

/**
 * Central route registry.
 * All API routes are mounted here and prefixed with /api/v1 in app.js.
 *
 * Phase 1: /health
 * Phase 2: /auth, /users
 * Phase 3: /courses, /subjects, /topics, /resources, /questions, /quizzes
 * Phase 4: /student
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
router.use('/student', studentRoutes);

// Phase 5: Assessments
router.use('/assessments', assessmentRoutes);

// Phase 6: Recommendations
router.use('/recommendations', recommendationRoutes);
router.use('/study-plan', studyPlanRoutes);

// Phase 7: Smart AI
router.use('/ai', aiRoutes);

// Phase 8: Core Adaptive Architecture Engine
router.use('/progress', progressRoutes);

module.exports = router;
