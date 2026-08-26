const express = require('express');
const router = express.Router();
const { getTopics, getTopicById, createTopic, updateTopic, deleteTopic, getTopicLearning, startPractice } = require('../controllers/topicController');
const { authenticateUser, optionalAuth } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');
const { createTopicValidators, updateTopicValidators } = require('../validators/courseValidators');

router.get('/', optionalAuth, getTopics);
router.get('/:id', optionalAuth, getTopicById);
router.get('/:id/learning', authenticateUser, getTopicLearning);
router.post('/:id/practice/start', authenticateUser, startPractice);

router.post('/', authenticateUser, authorizeRoles('teacher', 'admin'), createTopicValidators, createTopic);
router.patch('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), updateTopicValidators, updateTopic);
router.delete('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), deleteTopic);

module.exports = router;
