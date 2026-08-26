const asyncHandler = require('../middleware/asyncHandler');
const { validate } = require('../utils/validate');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const User = require('../models/User');

// ─── GET /api/v1/users/me ──────────────────────────────────────────────────

/**
 * Return the authenticated user's safe profile.
 * Route: GET /api/v1/users/me
 * Guard: authenticateUser
 */
const getMe = asyncHandler(async (req, res) => {
    // req.user is already populated by authenticateUser middleware
    return successResponse(res, req.user.toSafeObject(), 'Profile fetched successfully');
});

// ─── PATCH /api/v1/users/me ────────────────────────────────────────────────

/**
 * Update the authenticated user's profile.
 * Protected fields (role, email, password, isActive) cannot be changed via this endpoint.
 * Route: PATCH /api/v1/users/me
 * Guard: authenticateUser
 */
const updateMe = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    // Whitelist of updatable fields — role, email, password, isActive are NOT here
    const allowedFields = ['name', 'profilePicture', 'course', 'semester', 'learningGoal', 'dailyStudyTime'];
    const updates = {};

    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return errorResponse(res, 'No valid fields provided to update.', 400);
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
    );

    return successResponse(res, user.toSafeObject(), 'Profile updated successfully');
});

module.exports = { getMe, updateMe };
