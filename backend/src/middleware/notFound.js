/**
 * notFound middleware — catches any request that didn't match a registered route
 * and formats it as a consistent JSON 404 response.
 */
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

module.exports = notFound;
