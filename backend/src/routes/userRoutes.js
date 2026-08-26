const express = require('express');
const { getMe, updateMe, updateAvatar, completeOnboarding, getOnboardingStatus } = require('../controllers/userController');
const { authenticateUser } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');
const { updateMeValidators, onboardingValidators } = require('../validators/authValidators');
const { uploadSingle } = require('../middleware/upload');

const router = express.Router();

// All user routes require authentication
router.use(authenticateUser);

// GET  /api/v1/users/me
router.get('/me', getMe);

// PATCH /api/v1/users/me — update profile text fields
router.patch('/me', updateMeValidators, updateMe);

// PATCH /api/v1/users/me/avatar — upload/replace profile picture
router.patch('/me/avatar', uploadSingle('avatar'), updateAvatar);

// POST /api/v1/users/onboarding — save/update onboarding data
router.post('/onboarding', authorizeRoles('student'), onboardingValidators, completeOnboarding);

// GET /api/v1/users/onboarding-status
router.get('/onboarding-status', getOnboardingStatus);

module.exports = router;
