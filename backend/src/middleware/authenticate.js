const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');

/**
 * authenticateUser — protects routes by verifying the JWT access token.
 *
 * Reads the token from: Authorization: Bearer <token>
 * On success: populates req.user with the safe user object.
 * On failure: returns 401.
 */
const authenticateUser = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = verifyAccessToken(token);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
        }
        return res.status(401).json({ success: false, error: 'Invalid token.' });
    }

    const user = await User.findById(decoded.id).select('-password -passwordResetToken -passwordResetExpires -refreshToken');

    if (!user) {
        return res.status(401).json({ success: false, error: 'User not found.' });
    }

    if (!user.isActive) {
        return res.status(403).json({ success: false, error: 'Account is inactive. Contact support.' });
    }

    req.user = user;
    next();
});

/**
 * optionalAuth — attaches req.user if token is present and valid, but never blocks the request.
 * Used for public GET endpoints that show more data to authenticated users.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).select('-password -passwordResetToken -passwordResetExpires -refreshToken');
        if (user && user.isActive) req.user = user;
    } catch (_) {
        // Invalid / expired token — silently continue as unauthenticated
    }
    next();
});

module.exports = { authenticateUser, optionalAuth };
