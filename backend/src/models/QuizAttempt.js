const mongoose = require('mongoose');

/**
 * QuizAttempt — a student's execution of a formal quiz.
 *
 * `selectedOption` stores the ZERO-BASED INDEX of the chosen option, matching
 * Question.correctAnswer (also an index). Storing the option *text* previously
 * made grading impossible because index !== text, so every answer scored wrong.
 * `null` means the question was left unanswered.
 *
 * `questionSnapshot` preserves the graded question count at submission time so
 * historical attempts stay interpretable even if the quiz is later edited.
 */
const attemptAnswerSchema = new mongoose.Schema(
    {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOption: { type: Number, default: null, min: 0 },
        isCorrect: { type: Boolean, default: null },
    },
    { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
        topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        status: {
            type: String,
            enum: ['in-progress', 'submitted', 'abandoned'],
            default: 'in-progress',
        },
        startedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
        submittedAt: { type: Date },
        answers: [attemptAnswerSchema],
        totalQuestions: { type: Number, default: 0 },
        scorePercentage: { type: Number, default: 0, min: 0, max: 100 },
        correctCount: { type: Number, default: 0 },
        incorrectCount: { type: Number, default: 0 },
        unansweredCount: { type: Number, default: 0 },
        /** Immutable label copies so results remain readable after content edits. */
        quizTitleSnapshot: { type: String, default: '' },
    },
    { timestamps: true }
);

// ─── Indexes (reflect actual query patterns) ───────────────────────────────
// Quiz history: find by student, newest first.
quizAttemptSchema.index({ studentId: 1, createdAt: -1 });
// Resume / duplicate-attempt guard: student + quiz + status.
quizAttemptSchema.index({ studentId: 1, quizId: 1, status: 1 });
// Teacher/admin analytics: attempts per topic over time.
quizAttemptSchema.index({ topicId: 1, submittedAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
