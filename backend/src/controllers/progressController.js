const asyncHandler = require('../middleware/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const Progress = require('../models/Progress');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');

// ─── GET /progress ─────────────────────────────────────────────────────────
exports.getStudentAnalytics = asyncHandler(async (req, res) => {
    // Collect broad analytics
    const rawProgress = await Progress.find({ studentId: req.user._id }).populate('topicId', 'name');
    const user = await User.findById(req.user._id).select('learningMetadata');
    const streak = user?.learningMetadata?.currentStreak || 0;

    let totalScore = 0;
    const topicBreakdown = [];

    rawProgress.forEach(p => {
        totalScore += p.masteryScore;
        topicBreakdown.push({
            topicId: p.topicId._id,
            name: p.topicId.name,
            masteryScore: p.masteryScore,
            level: p.masteryLevel
        });
    });

    const averageMastery = rawProgress.length > 0 ? Math.round(totalScore / rawProgress.length) : 0;

    return successResponse(res, {
        streak,
        averageMastery,
        topics: topicBreakdown
    }, 'Student universal learning analytics retrieved');
});

// ─── GET /quiz-history ─────────────────────────────────────────────────────
exports.getQuizHistory = asyncHandler(async (req, res) => {
    const attempts = await QuizAttempt.find({ studentId: req.user._id, status: 'submitted' })
        .sort({ submittedAt: -1 })
        .populate('quizId', 'title')
        .populate('topicId', 'name');

    return successResponse(res, { history: attempts }, 'Past quiz attempt executions isolated');
});
