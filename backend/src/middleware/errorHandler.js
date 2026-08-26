/**
 * Global error handling middleware.
 * Must always be the LAST middleware registered in app.js.
 *
 * Formats all errors into a consistent JSON envelope:
 * {
 *   "success": false,
 *   "error": "Human-readable message",
 *   "stack": "..." (development only)
 * }
 */
const errorHandler = (err, req, res, next) => {
    // Default to 500 if no statusCode was set
    const statusCode = err.statusCode || err.status || 500;

    // Mongoose validation errors → 400
    let message = err.message || 'Internal Server Error';
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        message = messages.join(', ');
        return res.status(400).json({ success: false, error: message });
    }

    // Mongoose duplicate key error → 409
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `A record with this ${field} already exists`;
        return res.status(409).json({ success: false, error: message });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token expired' });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, error: `Invalid ${err.path}: ${err.value}` });
    }

    const response = {
        success: false,
        error: message,
    };

    // Only expose stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    // Log server errors
    if (statusCode >= 500) {
        console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err);
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
