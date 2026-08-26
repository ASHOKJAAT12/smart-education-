const express = require('express');
const { getDashboard } = require('../controllers/studentController');
const { authenticateUser } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');

const router = express.Router();

// All student routes: must be authenticated + student role
router.use(authenticateUser);
router.use(authorizeRoles('student'));

// GET /api/v1/student/dashboard
router.get('/dashboard', getDashboard);

module.exports = router;
