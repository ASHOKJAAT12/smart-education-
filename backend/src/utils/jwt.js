const jwt = require('jsonwebtoken');

/**
 * JWT utility — signs and verifies access and refresh tokens.
 *
 * Access token:  short-lived (15 min default), sent in Authorization header
 * Refresh token: long-lived (7 days default), stored hashed in DB
 */

/**
 * Sign an access token for a user.
 * @param {object} payload - { id, role }
 * @returns {string} signed JWT
 */
const signAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
};

/**
 * Sign a refresh token for a user.
 * @param {object} payload - { id }
 * @returns {string} signed JWT
 */
const signRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
};

/**
 * Verify an access token.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws jwt.JsonWebTokenError | jwt.TokenExpiredError
 */
const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
