/**
 * Standardized API response helpers.
 * All controller responses should use these instead of calling res.json() directly.
 */

/**
 * Send a success response.
 * @param {object} res - Express response object
 * @param {*} data - Response payload
 * @param {string} message - Human-readable success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Send an error response.
 * Prefer using next(error) and letting errorHandler.js handle it.
 * Use this only for simple, anticipated error cases.
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 400)
 */
const errorResponse = (res, message = 'Something went wrong', statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        error: message,
    });
};

/**
 * Send a paginated success response.
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination,
    });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
