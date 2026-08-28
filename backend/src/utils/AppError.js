const { ERROR_CODES } = require('../config/constants');

/**
 * AppError — the single operational error type used across SmartLearn AI.
 *
 * Any error created with AppError is considered "expected" (operational) and is
 * safe to surface to the client. Everything else is treated as an unexpected
 * internal failure by the global error handler and is masked in production.
 */
class AppError extends Error {
    /**
     * @param {string} message  Human-readable, client-safe message
     * @param {number} statusCode  HTTP status code
     * @param {string} [errorCode]  Stable machine-readable code from ERROR_CODES
     * @param {Array|object} [details]  Optional validation details (never secrets)
     */
    constructor(message, statusCode = 400, errorCode = undefined, details = undefined) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace?.(this, AppError);
    }
}

// ─── Convenience factories ──────────────────────────────────────────────────

const badRequest = (message = 'Invalid request', details) =>
    new AppError(message, 400, ERROR_CODES.VALIDATION_FAILED, details);

const unauthorized = (message = 'Authentication required.', code = ERROR_CODES.UNAUTHENTICATED) =>
    new AppError(message, 401, code);

const forbidden = (message = 'You do not have permission to perform this action.') =>
    new AppError(message, 403, ERROR_CODES.FORBIDDEN);

const notFound = (resource = 'Resource') =>
    new AppError(`${resource} not found`, 404, ERROR_CODES.NOT_FOUND);

const conflict = (message = 'Resource already exists') =>
    new AppError(message, 409, ERROR_CODES.CONFLICT);

const unprocessable = (message = 'Request could not be processed', details) =>
    new AppError(message, 422, ERROR_CODES.VALIDATION_FAILED, details);

const serviceUnavailable = (message = 'Service temporarily unavailable', code = ERROR_CODES.AI_UNAVAILABLE) =>
    new AppError(message, 503, code);

module.exports = {
    AppError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    unprocessable,
    serviceUnavailable,
};
