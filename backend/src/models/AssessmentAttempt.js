const mongoose = require('mongoose');

const assessmentAttemptSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student ID is required'],
        },
        assessmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assessment',
            required: [true, 'Assessment ID is required'],
        },
        startedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        submittedAt: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ['in_progress', 'submitted', 'expired'],
            default: 'in_progress',
        },
        // The subset of questions dynamically selected for this attempt
        questions: [
            {
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Question',
                    required: true,
                },
                topicId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Topic',
                },
                difficulty: {
                    type: String,
                }
            }
        ],
        answers: [
            {
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Question',
                    required: true,
                },
                selectedAnswer: {
                    type: Number, // index of option selected by the user
                    default: null,
                },
            },
        ],
        // Quick store score info for history tracking without needing full result payload
        score: {
            type: Number,
            default: null
        },
        percentage: {
            type: Number,
            default: null
        },
        timeTaken: {
            type: Number, // in seconds
            default: null
        },
    },
    { timestamps: true }
);

assessmentAttemptSchema.index({ studentId: 1, assessmentId: 1 });
assessmentAttemptSchema.index({ status: 1 });

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
module.exports = AssessmentAttempt;
