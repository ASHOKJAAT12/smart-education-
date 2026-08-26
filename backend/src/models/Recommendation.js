const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
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
    priorityScore: {
        type: Number,
        required: true,
        default: 0,
    },
    reason: {
        type: String,
        required: true,
    },
    recommendedAction: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'discarded'],
        default: 'active',
    }
}, { timestamps: true });

// For fetching rapid ordered active recommendations
recommendationSchema.index({ studentId: 1, status: 1, priorityScore: -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
