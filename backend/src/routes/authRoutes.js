const express = require('express');
const { register, login, logout, forgot, reset, refreshToken } = require('../controllers/authController');
const {
    registerValidators,
    loginValidators,
    forgotPasswordValidators,
    resetPasswordValidators,
} = require('../validators/authValidators');
const { authenticateUser } = require('../middleware/authenticate');
const {
    loginLimiter,
    registerLimiter,
    passwordResetLimiter,
} = require('../middleware/rateLimiters');

const router = express.Router();

/**
 * Auth routes.
 *
 * Rate limiters are defined centrally in middleware/rateLimiters.js so limits
 * are consistent and tunable in one place. Login only counts *failed* attempts,
 * so a legitimate user is never locked out by signing in normally.
 */

// POST /api/v1/auth/register
router.post('/register', registerLimiter, registerValidators, register);

// POST /api/v1/auth/login
router.post('/login', loginLimiter, loginValidators, login);

// POST /api/v1/auth/logout  (protected)
router.post('/logout', authenticateUser, logout);

// GET /api/v1/auth/refresh
router.get('/refresh', refreshToken);

// POST /api/v1/auth/forgot-password — sends email, so tightly limited
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidators, forgot);

// POST /api/v1/auth/reset-password — token guessing must also be throttled
router.post('/reset-password', passwordResetLimiter, resetPasswordValidators, reset);

module.exports = router;
