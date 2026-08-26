const Course = require('../models/Course');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Topic = require('../models/Topic');
const Progress = require('../models/Progress');
const QuizAttempt = require('../models/QuizAttempt');

class TeacherAnalyticsService {
    /**
     * Get the master list of courses owned by a teacher.
     */
    async getTeacherCourseIds(teacherId) {
        const courses = await Course.find({ createdBy: teacherId }).select('_id');
        return courses.map(c => c._id);
    }

    /**
     * Primary High-Level Dashboard Widget Data
     */
    async getDashboardMetrics(teacherId) {
        const courseIds = await this.getTeacherCourseIds(teacherId);

        const [studentsCount, activeQuizzes, topics] = await Promise.all([
            User.countDocuments({ role: 'student', course: { $in: courseIds } }),
            Quiz.countDocuments({ createdBy: teacherId, isPublished: true }),
            Topic.find({ createdBy: teacherId }).select('resources')
        ]);

        let publishedResources = 0;
        topics.forEach(t => {
            if (t.resources) publishedResources += t.resources.length;
        });

        return {
            courses: courseIds.length,
            students: studentsCount,
            activeQuizzes,
            publishedResources
        };
    }

    /**
     * Identify the lowest mastery topics under the teacher's jurisdiction
     */
    async getMostDifficultTopics(teacherId) {
        const topics = await Topic.find({ createdBy: teacherId }).select('_id title subjectId');
        if (!topics.length) return [];

        const topicIds = topics.map(t => t._id);

        const weakTopicsAggr = await Progress.aggregate([
            { $match: { topicId: { $in: topicIds } } },
            {
                $group: {
                    _id: "$topicId",
                    averageMastery: { $avg: "$masteryScore" },
                    studentsCount: { $sum: 1 }
                }
            },
            { $sort: { averageMastery: 1 } },
            { $limit: 4 }
        ]);

        return weakTopicsAggr.map(aggr => {
            const topicMeta = topics.find(t => t._id.toString() === aggr._id.toString());
            return {
                topicId: aggr._id,
                title: topicMeta ? topicMeta.title : 'Unknown Topic',
                averageMastery: Math.round(aggr.averageMastery),
                studentsCount: aggr.studentsCount
            };
        });
    }

    /**
     * Fetches detailed analytics mapped uniquely to each student under this teacher
     */
    async getStudentPerformance(teacherId) {
        const courseIds = await this.getTeacherCourseIds(teacherId);

        // Find all students in teacher's courses
        const students = await User.find({ role: 'student', course: { $in: courseIds } })
            .select('_id name email lastLoginAt profilePicture');

        if (!students.length) return [];

        const studentIds = students.map(s => s._id);

        // Aggregate their progress globally
        const progressAggr = await Progress.aggregate([
            { $match: { studentId: { $in: studentIds } } },
            {
                $group: {
                    _id: "$studentId",
                    overallMastery: { $avg: "$masteryScore" },
                    topicsDone: {
                        $sum: { $cond: [{ $gte: ["$masteryScore", 50] }, 1, 0] }
                    }
                }
            }
        ]);

        // Merge aggregation with student records
        const results = students.map(student => {
            const p = progressAggr.find(x => x._id.toString() === student._id.toString());
            return {
                studentId: student._id,
                name: student.name,
                email: student.email,
                avatar: student.profilePicture,
                lastActive: student.lastLoginAt,
                overallMastery: p ? Math.round(p.overallMastery) : 0,
                topicsDone: p ? p.topicsDone : 0
            };
        });

        // Sort by lowest mastery first so teachers can prioritize help
        return results.sort((a, b) => a.overallMastery - b.overallMastery);
    }
}

module.exports = new TeacherAnalyticsService();
