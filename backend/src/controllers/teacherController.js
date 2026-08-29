const teacherAnalyticsService = require('../services/teacherAnalytics.service');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

exports.getTeacherDashboard = asyncHandler(async (req, res, next) => {
    const teacherId = req.user._id;

    const [metrics, difficultTopics] = await Promise.all([
        teacherAnalyticsService.getDashboardMetrics(teacherId),
        teacherAnalyticsService.getMostDifficultTopics(teacherId)
    ]);

    return successResponse(res, { metrics, difficultTopics }, 'Teacher dashboard analytics generated');
});

exports.getTeacherStudents = asyncHandler(async (req, res, next) => {
    const teacherId = req.user._id;
    const students = await teacherAnalyticsService.getStudentPerformance(teacherId);

    return successResponse(res, { students }, 'Student analytics fetched');
});
