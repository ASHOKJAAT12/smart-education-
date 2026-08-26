const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, logout, forgot, reset } = require('../controllers/authController');
const {
    registerValidators,
    loginValidators,
    forgotPasswordValidators,
    resetPasswordValidators,
} = require('../validators/authValidators');
const { authenticateUser } = require('../middleware/authenticate');

const router = express.Router();

// ─── Auth-specific rate limiters ──────────────────────────────────────────

// Strict limiter for login/register: 10 attempts / 15 min per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many attempts. Please wait 15 minutes.' },
});

// Forgot password: 5 requests / hour per IP to prevent abuse
const forgotLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many reset requests. Please try again in an hour.' },
});

// ─── Routes ───────────────────────────────────────────────────────────────

// POST /api/v1/auth/register
router.post('/register', authLimiter, registerValidators, register);

// POST /api/v1/auth/login
router.post('/login', authLimiter, loginValidators, login);

// POST /api/v1/auth/logout  (protected)
router.post('/logout', authenticateUser, logout);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', forgotLimiter, forgotPasswordValidators, forgot);

// POST /api/v1/auth/reset-password
router.post('/reset-password', resetPasswordValidators, reset);

module.exports = router;
