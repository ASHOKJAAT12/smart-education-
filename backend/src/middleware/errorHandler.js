const { AppError } = require('../utils/AppError');
const logger = require('../utils/logger');
const { ERROR_CODES } = require('../config/constants');

/**
 * Global error handler — must be the LAST middleware registered in app.js.
 *
 * Response envelope (stable contract for the frontend):
 * {
 *   "success": false,
 *   "message": "Readable message",
 *   "errorCode": "OPTIONAL_CODE",
 *   "details": [ ... ]        // validation only
 * }
 *
 * `error` is also emitted as an alias of `message` because earlier phases of the
 * frontend read `data.error`. Both keys always carry the same client-safe text.
 *
 * Security: only errors we deliberately created (AppError) or recognise
 * (Mongoose/JWT/multer) have their message forwarded. Anything else is replaced
 * with a generic message in production so internal details, file paths,
 * connection strings and provider errors cannot leak.
 */

const IS_PROD = process.env.NODE_ENV === 'production';

const send = (res, statusCode, message, errorCode, details) => {
    const body = { success: false, message, error: message };
    if (errorCode) body.errorCode = errorCode;
    if (details) body.details = details;
    return res.status(statusCode).json(body);
};

// eslint-disable-next-line no-unused-vars -- Express requires the 4-arg signature
const errorHandler = (err, req, res, next) => {
    // Never try to write a second set of headers.
    if (res.headersSent) return undefined;

    const context = {
        method: req.method,
        path: req.originalUrl,
        userId: req.user?._id ? String(req.user._id) : undefined,
        role: req.user?.role,
    };

    // ── Errors we raised deliberately ──────────────────────────────────────
    if (err instanceof AppError || err.isOperational) {
        if (err.statusCode >= 500) logger.error('http.server_error', { ...context, error: err.message });
        return send(res, err.statusCode || 400, err.message, err.errorCode, err.details);
    }

    // ── Mongoose validation → 422 (well-formed request, invalid content) ───
    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors || {}).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return send(res, 422, 'Validation failed', ERROR_CODES.VALIDATION_FAILED, details);
    }

    // ── Duplicate key → 409. Field name only; never echo the value, which
    //    could be another user's email. ──────────────────────────────────────
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return send(res, 409, `A record with this ${field} already exists`, ERROR_CODES.CONFLICT);
    }

    // ── Invalid ObjectId / cast failure → 400 ─────────────────────────────
    if (err.name === 'CastError') {
        return send(res, 400, `Invalid value for ${err.path}`, ERROR_CODES.VALIDATION_FAILED);
    }

    // ── JWT ───────────────────────────────────────────────────────────────
    if (err.name === 'TokenExpiredError') {
        logger.authFailure('token_expired', context);
        return send(res, 401, 'Your session has expired. Please sign in again.', ERROR_CODES.TOKEN_EXPIRED);
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
        logger.authFailure('token_invalid', context);
        return send(res, 401, 'Invalid authentication token.', ERROR_CODES.TOKEN_INVALID);
    }

    // ── Uploads (multer) ──────────────────────────────────────────────────
    if (err.name === 'MulterError') {
        const message =
            err.code === 'LIMIT_FILE_SIZE'
                ? 'The uploaded file is too large.'
                : err.code === 'LIMIT_UNEXPECTED_FILE'
                    ? 'Unexpected file field in upload.'
                    : 'The file could not be uploaded.';
        logger.uploadFailure({ ...context, code: err.code });
        return send(res, 400, message, ERROR_CODES.UPLOAD_REJECTED);
    }

    // ── Malformed JSON body from express.json() ───────────────────────────
    if (err.type === 'entity.parse.failed') {
        return send(res, 400, 'Request body is not valid JSON.', ERROR_CODES.VALIDATION_FAILED);
    }
    if (err.type === 'entity.too.large') {
        return send(res, 413, 'Request body is too large.', ERROR_CODES.VALIDATION_FAILED);
    }

    // ── Unknown / unexpected ──────────────────────────────────────────────
    // Log the full error server-side; return a generic message to the client.
    logger.error('http.unhandled_error', {
        ...context,
        name: err.name,
        error: err.message,
        stack: IS_PROD ? undefined : err.stack,
    });

    const statusCode = err.statusCode || err.status || 500;
    const safeMessage =
        statusCode < 500 && err.message
            ? err.message
            : IS_PROD
                ? 'Something went wrong. Please try again.'
                : err.message || 'Internal Server Error';

    return send(res, statusCode, safeMessage, ERROR_CODES.INTERNAL);
};

module.exports = errorHandler;
