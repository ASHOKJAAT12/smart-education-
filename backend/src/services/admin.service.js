const User = require('../models/User');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const Assessment = require('../models/Assessment');
const Progress = require('../models/Progress');
const AIConversation = require('../models/AIConversation');
const AuditLog = require('../models/AuditLog');

class AdminService {
    async getGlobalMetrics() {
        const [
            students,
            teachers,
            courses,
            subjects,
            topics,
            quizzes,
            assessments,
            aiStats
        ] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'teacher' }),
            Course.countDocuments(),
            Subject.countDocuments(),
            Topic.countDocuments(),
            Quiz.countDocuments(),
            Assessment.countDocuments(),
            AIConversation.aggregate([{ $group: { _id: null, totalRequests: { $sum: "$metadata.messageCount" } } }])
        ]);

        return {
            students,
            teachers,
            courses,
            subjects,
            topics,
            quizzes,
            assessments,
            aiRequests: aiStats[0]?.totalRequests || 0
        };
    }

    async getPlatformUsers(queryFilter) {
        // Expose all user metrics omitting highly sensitive hashes
        return User.find().select('-password -refreshToken').sort({ createdAt: -1 });
    }

    async updateUserStatus(userId, isActive) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        user.isActive = isActive;
        await user.save();
        return user.toSafeObject();
    }

    async updateUserRole(userId, userRole) {
        if (!['student', 'teacher', 'admin'].includes(userRole)) {
            throw new Error('Invalid structural role assignment applied.');
        }

        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        user.role = userRole;
        await user.save();
        return user.toSafeObject();
    }

    async fetchAuditLogs(queryFilter) {
        return AuditLog.find()
            .populate('actorId', 'name email role')
            .sort({ createdAt: -1 })
            .limit(100);
    }
}

module.exports = new AdminService();
