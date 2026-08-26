const express = require('express');
const { getMe, updateMe } = require('../controllers/userController');
const { authenticateUser } = require('../middleware/authenticate');
const { updateMeValidators } = require('../validators/authValidators');

const router = express.Router();

// All user routes require authentication
router.use(authenticateUser);

// GET  /api/v1/users/me — get own profile
router.get('/me', getMe);

// PATCH /api/v1/users/me — update own profile (whitelisted fields only)
router.patch('/me', updateMeValidators, updateMe);

module.exports = router;
