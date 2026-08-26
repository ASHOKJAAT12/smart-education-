const mongoose = require('mongoose');

const assessmentResultSchema = new mongoose.Schema(
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
        attemptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AssessmentAttempt',
            required: [true, 'Attempt ID is required'],
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: [true, 'Subject ID is required'],
        },
        overallScore: {
            type: Number,
            required: true,
            min: 0,
        },
        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        correctAnswers: {
            type: Number,
            required: true,
            default: 0,
        },
        incorrectAnswers: {
            type: Number,
            required: true,
            default: 0,
        },
        unansweredAnswers: {
            type: Number,
            required: true,
            default: 0,
        },
        timeTaken: {
            type: Number, // in seconds
            required: true,
        },
        topicPerformance: [
            {
                topicId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Topic',
                    required: true,
                },
                topicName: {
                    type: String,
                    required: true,
                },
                totalQuestions: {
                    type: Number,
                    required: true,
                    default: 0,
                },
                correctAnswers: {
                    type: Number,
                    required: true,
                    default: 0,
                },
                accuracy: {
                    type: Number,
                    required: true,
                    min: 0,
                    max: 100,
                },
                masteryLevel: {
                    type: String,
                    enum: ['weak', 'needs_improvement', 'good', 'mastered'],
                    required: true,
                },
            },
        ],
        strongTopics: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Topic',
            },
        ],
        averageTopics: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Topic',
            },
        ],
        weakTopics: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Topic',
            },
        ],
        strongestTopic: {
            topicId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Topic',
                default: null,
            },
            name: String,
        },
        weakestTopic: {
            topicId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Topic',
                default: null,
            },
            name: String,
        },
        completedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

assessmentResultSchema.index({ studentId: 1, assessmentId: 1 });
assessmentResultSchema.index({ studentId: 1, completedAt: -1 });

const AssessmentResult = mongoose.model('AssessmentResult', assessmentResultSchema);
module.exports = AssessmentResult;
