const { validationResult } = require('express-validator');
const { ERROR_CODES } = require('../config/constants');

/**
 * Runs express-validator and, if the request is invalid, sends a 400 using the
 * same envelope as the global error handler:
 *
 * { success, message, error, errorCode, details }
 *
 * `error` mirrors `message` for backwards compatibility with earlier phases of
 * the frontend that read `data.error`.
 *
 * @param {object} req Express request
 * @param {object} res Express response
 * @returns {{ hasErrors: boolean }} when true, the response has already been sent
 */
const validate = (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return { hasErrors: false };

    const message = 'Validation failed';
    res.status(400).json({
        success: false,
        message,
        error: message,
        errorCode: ERROR_CODES.VALIDATION_FAILED,
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });

    return { hasErrors: true };
};

module.exports = { validate };
