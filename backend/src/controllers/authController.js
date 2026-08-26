const asyncHandler = require('../middleware/asyncHandler');
const { validate } = require('../utils/validate');
const { successResponse } = require('../utils/apiResponse');
const {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
} = require('../services/authService');

// ─── Register ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Public — creates a student account.
 */
const register = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const { name, email, password } = req.body;

    // Role is ALWAYS 'student' for self-registration
    const { user, accessToken, refreshToken } = await registerUser({ name, email, password });

    // Send refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return successResponse(res, { user, accessToken }, 'Account created successfully', 201);
});

// ─── Login ────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/login
 * Public.
 */
const login = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await loginUser(email, password);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, { user, accessToken }, 'Logged in successfully');
});

// ─── Logout ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/logout
 * Protected — requires a valid access token.
 */
const logout = asyncHandler(async (req, res) => {
    await logoutUser(req.user._id);

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    return successResponse(res, null, 'Logged out successfully');
});

// ─── Forgot Password ──────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/forgot-password
 * Public. Always responds with the same message to prevent email enumeration.
 */
const forgot = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    await forgotPassword(req.body.email);

    // Always return the same message regardless of whether email exists
    return successResponse(
        res,
        null,
        'If an account with that email exists, a password reset link has been sent.'
    );
});

// ─── Reset Password ───────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/reset-password
 * Public.
 */
const reset = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const { token, password } = req.body;
    await resetPassword(token, password);

    return successResponse(res, null, 'Password reset successfully. Please log in.');
});

module.exports = { register, login, logout, forgot, reset };
