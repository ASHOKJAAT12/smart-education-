const mongoose = require('mongoose');

/**
 * Question model.
 *
 * questionType is extensible — only 'mcq' is implemented now.
 * Future types (fill-in-blank, true/false, short-answer) can be added
 * to the enum without breaking existing data.
 */
const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: [true, 'Question text is required'],
            trim: true,
            maxlength: [1000, 'Question must be at most 1000 characters'],
        },
        // For MCQ: exactly 4 options. Stored as array of strings.
        options: {
            type: [String],
            validate: {
                validator: function (v) {
                    if (this.questionType === 'mcq') return v.length >= 2 && v.length <= 6;
                    return true;
                },
                message: 'MCQ questions must have 2–6 options',
            },
            default: [],
        },
        // Index (0-based) of the correct option within options[]
        correctAnswer: {
            type: Number,
            required: [true, 'Correct answer is required'],
            min: [0, 'Correct answer index must be >= 0'],
        },
        explanation: {
            type: String,
            trim: true,
            maxlength: [2000, 'Explanation must be at most 2000 characters'],
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
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        },
        questionType: {
            type: String,
            enum: ['mcq'],   // extend here in future phases
            default: 'mcq',
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
questionSchema.index({ subjectId: 1 });
questionSchema.index({ topicId: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ questionType: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ isPublished: 1 });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
