const asyncHandler = require('../middleware/asyncHandler');
const { validate } = require('../utils/validate');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const cloudinaryService = require('../services/cloudinaryService');

// ─── GET /api/v1/users/me ─────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('course', 'title category level').populate('subjects', 'name description');
    return successResponse(res, user.toSafeObject(), 'Profile fetched successfully');
});

// ─── PATCH /api/v1/users/me ───────────────────────────────────────────────────
const updateMe = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const allowedFields = ['name', 'semester', 'learningGoal', 'dailyStudyTime'];
    const updates = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
        return errorResponse(res, 'No valid fields provided to update.', 400);
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true })
        .populate('course', 'title category level')
        .populate('subjects', 'name description');

    return successResponse(res, user.toSafeObject(), 'Profile updated successfully');
});

// ─── PATCH /api/v1/users/me/avatar ────────────────────────────────────────────
const updateAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        return errorResponse(res, 'Please upload an image file.', 400);
    }

    // Fetch current publicId with select (it's excluded by default)
    const existing = await User.findById(req.user._id).select('+profilePicturePublicId');

    // Delete old Cloudinary asset if it exists
    if (existing.profilePicturePublicId) {
        try { await cloudinaryService.deleteFile(existing.profilePicturePublicId); } catch (_) { /* tolerate */ }
    }

    const result = await cloudinaryService.uploadThumbnail(req.file.buffer, req.file.mimetype, {
        folder: 'smartlearn/avatars',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    });

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { profilePicture: result.secure_url, profilePicturePublicId: result.public_id } },
        { new: true }
    );

    return successResponse(res, { profilePicture: user.profilePicture }, 'Profile picture updated');
});

// ─── POST /api/v1/users/onboarding ───────────────────────────────────────────
const completeOnboarding = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const { courseId, subjects, semester, learningGoal, dailyStudyTime } = req.body;

    const updates = { onboardingCompleted: true };
    if (courseId !== undefined) updates.course = courseId || null;
    if (subjects !== undefined) updates.subjects = subjects || [];
    if (semester !== undefined) updates.semester = semester || null;
    if (learningGoal !== undefined) updates.learningGoal = learningGoal || null;
    if (dailyStudyTime !== undefined) updates.dailyStudyTime = dailyStudyTime || null;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true })
        .populate('course', 'title category level')
        .populate('subjects', 'name description');

    return successResponse(res, user.toSafeObject(), 'Onboarding saved successfully');
});

// ─── GET /api/v1/users/onboarding-status ────────────────────────────────────
const getOnboardingStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('course', 'title category level thumbnail')
        .populate('subjects', 'name description');

    return successResponse(res, {
        onboardingCompleted: user.onboardingCompleted,
        course: user.course,
        subjects: user.subjects,
        semester: user.semester,
        learningGoal: user.learningGoal,
        dailyStudyTime: user.dailyStudyTime,
    }, 'Onboarding status fetched');
});

module.exports = { getMe, updateMe, updateAvatar, completeOnboarding, getOnboardingStatus };
