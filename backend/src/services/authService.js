const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('./emailService');

/**
 * AuthService — all auth business logic lives here.
 * Controllers call these functions and handle HTTP responses.
 */

// ─── Register ─────────────────────────────────────────────────────────────

/**
 * Register a new user.
 * Students self-register (role defaults to 'student').
 * Teacher/admin accounts can only be created by existing admins (handled in controller).
 *
 * @param {object} userData - { name, email, password }
 * @returns {{ user, accessToken, refreshToken }}
 */
const registerUser = async ({ name, email, password }) => {
    // Check for duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
        const error = new Error('An account with this email already exists.');
        error.statusCode = 409;
        throw error;
    }

    // Create user — password is hashed by the pre-save hook
    const user = await User.create({ name, email, password });

    // Issue tokens
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    // Store hashed refresh token
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefresh;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch((err) =>
        console.warn('Welcome email failed:', err.message)
    );

    return { user: user.toSafeObject(), accessToken, refreshToken };
};

// ─── Login ────────────────────────────────────────────────────────────────

/**
 * Authenticate a user by email + password.
 * @param {string} email
 * @param {string} password
 * @returns {{ user, accessToken, refreshToken }}
 */
const loginUser = async (email, password) => {
    // Select password explicitly (excluded by default)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error('Your account has been deactivated. Please contact support.');
        error.statusCode = 403;
        throw error;
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        throw error;
    }

    // Issue tokens
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    // Store hashed refresh token + update login timestamp
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefresh;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    return { user: user.toSafeObject(), accessToken, refreshToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────

/**
 * Invalidate refresh token on logout.
 * @param {string} userId
 */
const logoutUser = async (userId) => {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
};

// ─── Forgot Password ──────────────────────────────────────────────────────

/**
 * Initiate password reset — generates a secure random token,
 * stores its SHA-256 hash in the DB, and emails the plain token.
 *
 * @param {string} email
 */
const forgotPassword = async (email) => {
    const user = await User.findOne({ email });

    // Return silently if email not found — prevents email enumeration
    if (!user) return;

    // Generate 32-byte random token
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send email with the PLAIN token (hashed version stays in DB)
    await sendPasswordResetEmail(user.email, plainToken);
};

// ─── Reset Password ───────────────────────────────────────────────────────

/**
 * Validate the reset token and update the user's password.
 * @param {string} plainToken - token from the URL
 * @param {string} newPassword
 */
const resetPassword = async (plainToken, newPassword) => {
    // Hash the incoming token to compare with what's stored
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() }, // not expired
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
        const error = new Error('Invalid or expired password reset token.');
        error.statusCode = 400;
        throw error;
    }

    // Update password — pre-save hook hashes it
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshToken = null; // invalidate all sessions on password change
    await user.save();
};

// ─── Refresh Token ────────────────────────────────────────────────────────
/**
 * Validate refresh token and issue new token pair.
 * @param {string} token - refresh token from httpOnly cookie
 */
const refreshTokens = async (token) => {
    let decoded;
    try {
        decoded = verifyRefreshToken(token);
    } catch (err) {
        const error = new Error('Refresh token is invalid or expired.');
        error.statusCode = 401;
        throw error;
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.refreshToken) {
        const error = new Error('Invalid session.');
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(token, user.refreshToken);
    if (!isMatch) {
        const error = new Error('Session compromised or invalid.');
        error.statusCode = 401;
        throw error;
    }

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save({ validateBeforeSave: false });

    return { user: user.toSafeObject(), accessToken, refreshToken };
};

module.exports = { registerUser, loginUser, logoutUser, forgotPassword, resetPassword, refreshTokens };
