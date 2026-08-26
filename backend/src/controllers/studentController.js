const asyncHandler = require('../middleware/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const streakService = require('../services/streak.service');
const learningService = require('../services/learning.service');

/**
 * GET /api/v1/student/dashboard
 *
 * Aggregates all data needed by the student dashboard into a single response.
 * Designed for easy extension in Phase 5+ (mastery, studyPlan, recommendations, quizResults).
 *
 * Auth: authenticateUser + student role
 */
const getDashboard = asyncHandler(async (req, res) => {
    // Load student with populated course + subjects
    const student = await User.findById(req.user._id)
        .populate('course', 'title category level thumbnail description')
        .populate('subjects', 'name description');

    // Phase 8 Engine Fetchers
    const progressList = await Progress.find({ studentId: req.user._id });
    const streak = student.learningMetadata?.currentStreak || 0;

    let totalM = 0;
    progressList.forEach(p => totalM += p.masteryScore);
    const overallMastery = progressList.length > 0 ? Math.round(totalM / progressList.length) : 0;

    // Evaluate Next Best Action using Phase 6/8 priority bridges
    const nextBestAction = await learningService.getNextBestAction(req.user._id);

    // Count published quizzes available for this student's subjects (for awareness, not fake progress)
    let availableQuizCount = 0;
    if (student.subjects && student.subjects.length > 0) {
        const subjectIds = student.subjects.map((s) => s._id);
        availableQuizCount = await Quiz.countDocuments({
            subjectId: { $in: subjectIds },
            isPublished: true,
        });
    }

    const dashboardData = {
        // ── Profile summary ──────────────────────────────────────────────
        profile: {
            _id: student._id,
            name: student.name,
            email: student.email,
            profilePicture: student.profilePicture,
            role: student.role,
        },

        // ── Onboarding state ─────────────────────────────────────────────
        onboarding: {
            completed: student.onboardingCompleted,
            course: student.course || null,
            subjects: student.subjects || [],
            semester: student.semester,
            learningGoal: student.learningGoal,
            dailyStudyTime: student.dailyStudyTime, // minutes
        },

        // ── Learning content counts ───────────────────────────────────────
        content: {
            subjectCount: student.subjects?.length || 0,
            availableQuizCount,
        },

        // ── Diagnostic assessment ─────────────────────────────────────────
        diagnostic: {
            taken: false,           // Phase 5 will set this from Assessment model
            score: null,
            completedAt: null,
        },

        // ── Phase 8 Progress Engine ───────────────────────────────────────
        progressAvailable: true,
        progressStats: {
            overallMastery,
            streak,
            nextBestAction,
            completedTopics: progressList.length
        }
    };

    return successResponse(res, dashboardData, 'Dashboard loaded');
});

module.exports = { getDashboard };
