const Course = require('../models/Course');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Topic = require('../models/Topic');
const LearningResource = require('../models/LearningResource');
const Progress = require('../models/Progress');
const QuizAttempt = require('../models/QuizAttempt');

/**
 * Teacher analytics are scoped to the courses the teacher owns.
 *
 * Scope is always resolved from Course.createdBy and then walked down the
 * hierarchy (Course → Subject → Topic → Resource), so metrics can never include
 * another teacher's classrooms even if a document's own `createdBy` differs
 * (e.g. content created by an admin inside the teacher's course).
 */
class TeacherAnalyticsService {
    /**
     * Get the master list of courses owned by a teacher.
     */
    async getTeacherCourseIds(teacherId) {
        const courses = await Course.find({ createdBy: teacherId }).select('_id').lean();
        return courses.map(c => c._id);
    }

    /** Subjects under the teacher's own courses. */
    async getTeacherSubjectIds(teacherId) {
        const courseIds = await this.getTeacherCourseIds(teacherId);
        const subjects = await Subject.find({ courseId: { $in: courseIds } }).select('_id').lean();
        return subjects.map(s => s._id);
    }

    /** Topics under the teacher's own courses. */
    async getTeacherTopicIds(teacherId) {
        const subjectIds = await this.getTeacherSubjectIds(teacherId);
        const topics = await Topic.find({ subjectId: { $in: subjectIds } }).select('_id').lean();
        return topics.map(t => t._id);
    }

    /**
     * Primary High-Level Dashboard Widget Data
     */
    async getDashboardMetrics(teacherId) {
        const courseIds = await this.getTeacherCourseIds(teacherId);
        const topicIds = await this.getTeacherTopicIds(teacherId);

        const [studentsCount, activeQuizzes, publishedResources] = await Promise.all([
            User.countDocuments({ role: 'student', course: { $in: courseIds } }),
            Quiz.countDocuments({ createdBy: teacherId, isPublished: true }),
            LearningResource.countDocuments({ topicId: { $in: topicIds }, isPublished: true }),
        ]);

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
        const subjectIds = await this.getTeacherSubjectIds(teacherId);
        const topics = await Topic.find({ subjectId: { $in: subjectIds } })
            .select('_id name subjectId')
            .lean();
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
                // Topic documents store the label in `name`.
                title: topicMeta ? topicMeta.name : 'Unknown Topic',
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
        const topicIds = await this.getTeacherTopicIds(teacherId);

        // Find all students in teacher's courses
        const students = await User.find({ role: 'student', course: { $in: courseIds } })
            .select('_id name email lastLoginAt profilePicture');

        if (!students.length) return [];

        const studentIds = students.map(s => s._id);

        // Aggregate progress for the teacher's own topics only, so mastery is not
        // diluted or inflated by work the student did in another teacher's course.
        const progressAggr = await Progress.aggregate([
            { $match: { studentId: { $in: studentIds }, topicId: { $in: topicIds } } },
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
