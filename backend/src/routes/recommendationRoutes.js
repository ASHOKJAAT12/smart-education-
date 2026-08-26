const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const { authenticateUser } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles('student'));

router.get('/', recommendationController.getRecommendations);
router.get('/path', recommendationController.getLearningPath);

module.exports = router;
