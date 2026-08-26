const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true,
    },
    masteryScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    masteryLevel: {
        type: String,
        enum: ['weak', 'needs_improvement', 'good', 'mastered'],
        default: 'weak',
    },
    attemptCount: {
        type: Number,
        default: 0,
    },
    correctCount: {
        type: Number,
        default: 0,
    },
    incorrectCount: {
        type: Number,
        default: 0,
    },
    averageAccuracy: {
        type: Number,
        default: 0,
    },
    recentAccuracy: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'needs_improvement', 'mastered'],
        default: 'not_started',
    },
    firstAttemptAt: {
        type: Date,
    },
    lastAttemptAt: {
        type: Date,
    }
}, { timestamps: true });

// Ensure a student only has one progress record per topic.
progressSchema.index({ studentId: 1, topicId: 1 }, { unique: true });
progressSchema.index({ studentId: 1, subjectId: 1 });

module.exports = mongoose.model('Progress', progressSchema);
