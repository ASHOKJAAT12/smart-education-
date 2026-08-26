const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const Recommendation = require('../models/Recommendation');
const StudyPlan = require('../models/StudyPlan');
const { generateDailyStudyPlan } = require('../services/recommendationService');

// ─── GET /api/v1/recommendations ─────────────────────────────────────────────
exports.getRecommendations = asyncHandler(async (req, res) => {
    const recommendations = await Recommendation.find({
        studentId: req.user._id,
        status: 'active'
    })
        .sort({ priorityScore: -1 })
        .populate('topicId', 'name description difficulty')
        .populate('subjectId', 'name');

    return successResponse(res, { recommendations }, 'Recommendations fetched successfully');
});

// ─── GET /api/v1/learning-path ──────────────────────────────────────────────
// For now, this acts as a directed list of recommendations mapped into a "path" format
exports.getLearningPath = asyncHandler(async (req, res) => {
    const recommendations = await Recommendation.find({
        studentId: req.user._id,
        status: 'active'
    })
        .sort({ priorityScore: -1 })
        .populate('topicId', 'name');

    const path = recommendations.map((r, index) => ({
        step: index + 1,
        topicId: r.topicId._id,
        topicName: r.topicId.name,
        action: r.recommendedAction,
        isNext: index === 0
    }));

    return successResponse(res, { path }, 'Learning path generated');
});

// ─── GET /api/v1/study-plan/today ───────────────────────────────────────────
exports.getTodayPlan = asyncHandler(async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const plan = await StudyPlan.findOne({ studentId: req.user._id, date: today })
        .populate('items.topicId', 'name');

    if (!plan) {
        return successResponse(res, { plan: null }, 'No current plan. Please generate one.', 200);
    }
    return successResponse(res, { plan }, 'Today\'s study plan fetched');
});

// ─── POST /api/v1/study-plan/generate ───────────────────────────────────────
exports.postGeneratePlan = asyncHandler(async (req, res) => {
    try {
        const plan = await generateDailyStudyPlan(req.user._id);

        // Re-fetch with populated names to return to client immediately
        const populatedPlan = await StudyPlan.findById(plan._id).populate('items.topicId', 'name');

        return successResponse(res, { plan: populatedPlan }, 'New study plan generated successfully');
    } catch (err) {
        return errorResponse(res, err.message, 400);
    }
});

// ─── PATCH /api/v1/study-plan/:itemId ───────────────────────────────────────
exports.updatePlanItemStatus = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'in_progress', 'completed', 'skipped'];
    if (!allowedStatuses.includes(status)) {
        return errorResponse(res, 'Invalid status', 400);
    }

    const today = new Date().toISOString().split('T')[0];
    const plan = await StudyPlan.findOne({ studentId: req.user._id, date: today });

    if (!plan) return errorResponse(res, 'Study plan not found for today', 404);

    const item = plan.items.id(itemId);
    if (!item) return errorResponse(res, 'Plan item not found', 404);

    item.status = status;

    // Check if the overall plan is completed
    const allDone = plan.items.every(i => i.status === 'completed' || i.status === 'skipped');
    if (allDone) {
        plan.status = 'completed';
    } else {
        const anyStarted = plan.items.some(i => i.status !== 'pending');
        if (anyStarted) plan.status = 'in_progress';
    }

    await plan.save();

    return successResponse(res, { item }, 'Item updated successfully');
});
