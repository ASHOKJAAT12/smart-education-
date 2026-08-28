const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const { ERROR_CODES } = require('../config/constants');

/**
 * Rate limiters, tiered by how expensive and how abusable each endpoint is.
 *
 * Expensive endpoints (AI generation, uploads, email sending) get much tighter
 * budgets than ordinary reads. Authenticated requests are keyed by user id so
 * one user on a shared/NAT IP cannot exhaust everyone else's budget, while
 * unauthenticated requests fall back to IP.
 */

const IS_TEST = process.env.NODE_ENV === 'test';

/** Key by authenticated user when available; otherwise by IP. */
const keyByUserOrIp = (req) => (req.user?._id ? `u:${req.user._id}` : `ip:${req.ip}`);

const buildHandler = (name, message) => (req, res) => {
    logger.warn('security.rate_limited', {
        limiter: name,
        method: req.method,
        path: req.originalUrl,
        userId: req.user?._id ? String(req.user._id) : undefined,
    });

    return res.status(429).json({
        success: false,
        message,
        error: message,
        errorCode: ERROR_CODES.RATE_LIMITED,
    });
};

const makeLimiter = ({ name, windowMs, max, message, keyGenerator = keyByUserOrIp, skipSuccessful = false }) =>
    rateLimit({
        windowMs,
        // Effectively disabled under tests so the suite is not throttled.
        max: IS_TEST ? 1_000_000 : max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator,
        skipSuccessfulRequests: skipSuccessful,
        handler: buildHandler(name, message),
    });

// ─── General API traffic ───────────────────────────────────────────────────
const generalLimiter = makeLimiter({
    name: 'general',
    windowMs: 60 * 1000,
    max: 200,
    message: 'Too many requests. Please slow down and try again shortly.',
});

// ─── Authentication ────────────────────────────────────────────────────────
/**
 * Login: keyed by IP (the user is not authenticated yet) and only failures
 * count, so a legitimate user signing in repeatedly is never blocked while
 * credential stuffing is throttled hard.
 */
const loginLimiter = makeLimiter({
    name: 'login',
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
    keyGenerator: (req) => `ip:${req.ip}`,
    skipSuccessful: true,
});

const registerLimiter = makeLimiter({
    name: 'register',
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many accounts created from this network. Please try again later.',
    keyGenerator: (req) => `ip:${req.ip}`,
});

/** Password reset triggers outbound email — abuse costs money and reputation. */
const passwordResetLimiter = makeLimiter({
    name: 'password_reset',
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many password reset requests. Please try again in an hour.',
    keyGenerator: (req) => `ip:${req.ip}`,
});

// ─── AI ────────────────────────────────────────────────────────────────────
/** Chat: per-user, since each message costs a provider call. */
const aiChatLimiter = makeLimiter({
    name: 'ai_chat',
    windowMs: 60 * 1000,
    max: 15,
    message: 'You are sending messages very quickly. Please wait a moment before asking again.',
});

/** Generation is the most expensive operation on the platform. */
const aiGenerationLimiter = makeLimiter({
    name: 'ai_generation',
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: 'You have reached the AI generation limit. Please try again in a few minutes.',
});

// ─── Uploads ───────────────────────────────────────────────────────────────
const uploadLimiter = makeLimiter({
    name: 'upload',
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: 'Too many uploads. Please wait a few minutes before uploading again.',
});

// ─── Privileged admin operations ───────────────────────────────────────────
const adminSensitiveLimiter = makeLimiter({
    name: 'admin_sensitive',
    windowMs: 5 * 60 * 1000,
    max: 30,
    message: 'Too many administrative operations in a short period. Please slow down.',
});

module.exports = {
    generalLimiter,
    loginLimiter,
    registerLimiter,
    passwordResetLimiter,
    aiChatLimiter,
    aiGenerationLimiter,
    uploadLimiter,
    adminSensitiveLimiter,
};
