const mongoose = require('mongoose');

const studyPlanItemSchema = new mongoose.Schema({
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true,
    },
    activityType: {
        type: String,
        enum: ['learn', 'practice', 'quiz', 'revision'],
        required: true,
    },
    durationMinutes: {
        type: Number,
        required: true,
        min: 1,
    },
    order: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'skipped'],
        default: 'pending',
    }
}, { _id: true }); // Ensure subdocs get IDs for easy PATCH operations

const studyPlanSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String,
        // e.g. "2026-08-27"
        required: true,
    },
    totalMinutes: {
        type: Number,
        required: true,
    },
    items: [studyPlanItemSchema],
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending',
    }
}, { timestamps: true });

studyPlanSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
