const express = require('express');
const router = express.Router();
const { getStudentAnalytics, getQuizHistory } = require('../controllers/progressController');
const { authenticateUser } = require('../middleware/authenticate');

router.use(authenticateUser);

router.get('/', getStudentAnalytics);
router.get('/quiz-history', getQuizHistory);

module.exports = router;
