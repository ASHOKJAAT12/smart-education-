const mongoose = require('mongoose');

const attemptAnswerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOption: { type: String, default: null },
    isCorrect: { type: Boolean, default: null }
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }, // Bound natively for quick indexing down the pipeline
    status: { type: String, enum: ['in-progress', 'submitted', 'abandoned'], default: 'in-progress' },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    answers: [attemptAnswerSchema],
    scorePercentage: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
