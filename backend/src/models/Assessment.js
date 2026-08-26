const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Assessment title is required'],
            trim: true,
            maxlength: [150, 'Title must be at most 150 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description must be at most 500 characters'],
            default: '',
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: [true, 'Subject ID is required'],
        },
        topicIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Topic',
            },
        ],
        questionIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Question',
            },
        ],
        durationMinutes: {
            type: Number,
            required: [true, 'Duration is required'],
            min: [1, 'Duration must be at least 1 minute'],
            max: [180, 'Duration must be at most 180 minutes'],
        },
        totalQuestions: {
            type: Number,
            required: [true, 'Total questions count is required'],
            min: [1, 'Must have at least 1 question'],
        },
        difficultyDistribution: {
            easy: { type: Number, default: 40 },
            medium: { type: Number, default: 40 },
            hard: { type: Number, default: 20 },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

assessmentSchema.index({ subjectId: 1, isActive: 1 });
assessmentSchema.index({ createdBy: 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);
module.exports = Assessment;
