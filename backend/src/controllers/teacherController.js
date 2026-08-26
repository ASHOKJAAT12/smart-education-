const teacherAnalyticsService = require('../services/teacherAnalytics.service');
const { errorResponse, successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const Question = require('../models/Question');

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

exports.getQuestions = asyncHandler(async (req, res) => {
    // Hackathon bypass: Allow teachers to see ALL questions in the bank instead of just their own
    const items = await Question.find({}).sort({ createdAt: -1 }).limit(100);
    return successResponse(res, items, 'Teacher questions fetched');
});
