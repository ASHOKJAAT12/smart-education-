/**
 * asyncHandler — wraps async Express route handlers so errors are forwarded
 * to the global error middleware via next() instead of crashing the process.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
