const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const { authenticateUser } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles('student'));

router.get('/today', recommendationController.getTodayPlan);
router.post('/generate', recommendationController.postGeneratePlan);
router.patch('/:itemId', recommendationController.updatePlanItemStatus);

module.exports = router;
