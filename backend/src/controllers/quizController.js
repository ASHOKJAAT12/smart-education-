const asyncHandler = require('../middleware/asyncHandler');
const Quiz = require('../models/Quiz');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter, isOwnerOrAdmin } = require('../utils/queryHelper');
const QuizAttempt = require('../models/QuizAttempt');
const Question = require('../models/Question');
const masteryService = require('../services/mastery.service');
const streakService = require('../services/streak.service');

// ─── GET /quizzes ──────────────────────────────────────────────────────────
const getQuizzes = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const canSeeAll = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    const defaults = canSeeAll ? {} : { isPublished: true };
    const filter = buildContentFilter(req.query, defaults);

    const [quizzes, total] = await Promise.all([
        Quiz.find(filter)
            .populate('subjectId', 'name')
            .populate('topicId', 'name')
            .populate('createdBy', 'firstName lastName')
            .select('-questions') // don't expose question list in list view
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit),
        Quiz.countDocuments(filter),
    ]);

    return paginatedResponse(res, quizzes, buildPaginationMeta(total, pagination), 'Quizzes fetched');
});

// ─── GET /quizzes/:id ──────────────────────────────────────────────────────
const getQuizById = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id)
        .populate('subjectId', 'name')
        .populate('topicId', 'name')
        .populate('createdBy', 'firstName lastName')
        .populate({
            path: 'questions',
            select: 'question options difficulty questionType',   // do NOT expose correctAnswer/explanation in quiz view
        });

    if (!quiz) {
        const err = new Error('Quiz not found');
        err.statusCode = 404;
        throw err;
    }

    const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    if (!quiz.isPublished && !isPrivileged) {
        const err = new Error('Quiz not found');
        err.statusCode = 404;
        throw err;
    }

    return successResponse(res, quiz, 'Quiz fetched');
});

// ─── POST /quizzes ─────────────────────────────────────────────────────────
const createQuiz = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const quiz = await Quiz.create({
        ...req.body,
        isPublished: false,
        createdBy: req.user._id,
    });

    return successResponse(res, quiz, 'Quiz created', 201);
});

// ─── PATCH /quizzes/:id ────────────────────────────────────────────────────
const updateQuiz = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
        const err = new Error('Quiz not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(quiz, req.user)) {
        const err = new Error('You do not have permission to edit this quiz');
        err.statusCode = 403;
        throw err;
    }

    const WHITELIST = ['title', 'description', 'questions', 'difficulty', 'durationMinutes', 'passingScore', 'subjectId', 'topicId'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) quiz[field] = req.body[field];
    });

    if (req.body.isPublished !== undefined && req.user.role === 'admin') {
        quiz.isPublished = req.body.isPublished;
    }

    await quiz.save();
    return successResponse(res, quiz, 'Quiz updated');
});

// ─── DELETE /quizzes/:id ───────────────────────────────────────────────────
const deleteQuiz = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
        const err = new Error('Quiz not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(quiz, req.user)) {
        const err = new Error('You do not have permission to delete this quiz');
        err.statusCode = 403;
        throw err;
    }

    await quiz.deleteOne();
    return successResponse(res, null, 'Quiz deleted');
});

// ─── POST /quizzes/:id/start ──────────────────────────────────────────────────
const startQuiz = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    // Establish attempt context in DB
    const attempt = await QuizAttempt.create({
        studentId: req.user._id,
        quizId: quiz._id,
        topicId: quiz.topicId,
        status: 'in-progress',
        answers: []
    });

    return successResponse(res, { attemptId: attempt._id }, 'Formal Quiz Execution Began', 201);
});

// ─── POST /quizzes/attempts/:attemptId/submit ───────────────────────────────
const submitQuiz = asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const { answers } = req.body; // Array of { questionId, selectedOption }

    const attempt = await QuizAttempt.findOne({ _id: attemptId, studentId: req.user._id }).populate('quizId');
    if (!attempt) return res.status(404).json({ success: false, error: 'Attempt not found' });
    if (attempt.status === 'submitted') return res.status(400).json({ success: false, error: 'Attempt already finalized!' });

    // Gather truth map from server-side Question definitions, stripping frontend of authority
    const quizQuestions = await Question.find({ _id: { $in: attempt.quizId.questions } });
    const questionMap = quizQuestions.reduce((map, q) => { map[q._id.toString()] = q; return map; }, {});

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const validatedAnswers = answers.map(ans => {
        const qData = questionMap[ans.questionId];
        if (!qData) return null; // Corrupted client payload
        const isCorrect = (ans.selectedOption === qData.correctAnswer);
        if (!ans.selectedOption || ans.selectedOption === '') unansweredCount++;
        else if (isCorrect) correctCount++;
        else incorrectCount++;

        return { questionId: ans.questionId, selectedOption: ans.selectedOption, isCorrect };
    }).filter(a => a !== null);

    const scorePercentage = Math.round((correctCount / quizQuestions.length) * 100) || 0;

    attempt.answers = validatedAnswers;
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.unansweredCount = unansweredCount;
    attempt.scorePercentage = scorePercentage;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    await attempt.save();

    // ── TRIGGER PHASE 8 ADAPTIVE MASTER LEARNING LOOP ──
    await masteryService.updateTopicMastery(
        req.user._id,
        attempt.topicId,
        attempt.quizId.subjectId,
        scorePercentage
    );
    await streakService.logActivityAndRefreshStreak(req.user._id);

    return successResponse(res, { attemptId: attempt._id, scorePercentage }, 'Quiz attempt successfully evaluated and adaptive pipelines fired.');
});

// ─── GET /quizzes/attempts/:attemptId ───────────────────────────────────────
const getQuizAttempt = asyncHandler(async (req, res) => {
    const attempt = await QuizAttempt.findOne({ _id: req.params.attemptId, studentId: req.user._id })
        .populate('quizId', 'title description passingScore')
        .populate({
            path: 'answers.questionId',
            select: 'title options correctAnswer explanation difficulty'
        }); // Full exposition allowed since the attempt is sealed lock.

    if (!attempt) return res.status(404).json({ success: false, error: 'Attempt not found' });
    return successResponse(res, attempt, 'Quiz Results Compiled');
});


module.exports = { getQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz, startQuiz, submitQuiz, getQuizAttempt };
