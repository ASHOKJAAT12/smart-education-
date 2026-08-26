const { validationResult } = require('express-validator');

/**
 * Runs express-validator validation and returns errors if any.
 * Call this at the top of any controller that uses validators.
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @returns {{ hasErrors: boolean }} — if hasErrors is true, response is already sent
 */
const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
        return { hasErrors: true };
    }
    return { hasErrors: false };
};

module.exports = { validate };
