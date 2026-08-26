/**
 * authorizeRoles — role-based access control middleware factory.
 *
 * Must be used AFTER authenticateUser (requires req.user).
 *
 * Usage:
 *   router.get('/admin-only', authenticateUser, authorizeRoles('admin'), handler)
 *   router.get('/staff',      authenticateUser, authorizeRoles('teacher', 'admin'), handler)
 *
 * @param {...string} roles - Allowed roles
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Authentication required.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. This route requires one of the following roles: ${roles.join(', ')}.`,
            });
        }

        next();
    };
};

module.exports = authorizeRoles;
