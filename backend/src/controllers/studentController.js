const asyncHandler = require('../middleware/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Quiz = require('../models/Quiz');

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

        // ── Progress stats (Phase 5+ will populate these) ─────────────────
        progressAvailable: false,
        progressStats: null,
        // progressStats shape (for Phase 5 reference):
        // {
        //   overallMastery: 0-100,
        //   quizAccuracy: 0-100,
        //   completedTopics: number,
        //   totalTopics: number,
        //   studyTimeMinutes: number,
        //   recentQuizResults: [],
        //   weakAreas: [],
        //   strongAreas: [],
        // }

        // ── Recommendations (Phase 6) ──────────────────────────────────────
        recommendations: null,
    };

    return successResponse(res, dashboardData, 'Dashboard loaded');
});

module.exports = { getDashboard };
