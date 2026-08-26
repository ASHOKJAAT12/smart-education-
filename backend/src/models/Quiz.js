const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Quiz title is required'],
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
            default: null,
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Topic',
            default: null,
        },
        // Array of ObjectId refs — de-normalised from Question collection
        // Keeps questions reusable across multiple quizzes
        questions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Question',
            },
        ],
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard', 'mixed'],
            default: 'mixed',
        },
        durationMinutes: {
            type: Number,
            required: [true, 'Duration is required'],
            min: [1, 'Duration must be at least 1 minute'],
            max: [180, 'Duration must be at most 180 minutes'],
        },
        passingScore: {
            // Percentage (0–100)
            type: Number,
            required: [true, 'Passing score is required'],
            min: [0, 'Passing score must be >= 0'],
            max: [100, 'Passing score must be <= 100'],
            default: 60,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────
quizSchema.index({ subjectId: 1 });
quizSchema.index({ topicId: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ isPublished: 1 });
quizSchema.index({ difficulty: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;
