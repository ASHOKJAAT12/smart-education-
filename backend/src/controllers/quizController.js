const asyncHandler = require('../middleware/asyncHandler');
const Quiz = require('../models/Quiz');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter } = require('../utils/queryHelper');
const { isAdmin, ownerFilter } = require('../utils/ownership');
const QuizAttempt = require('../models/QuizAttempt');
const Question = require('../models/Question');
const masteryService = require('../services/mastery.service');
const streakService = require('../services/streak.service');
const logger = require('../utils/logger');
const { AppError, notFound, forbidden } = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

// ─── GET /quizzes ──────────────────────────────────────────────────────────
const getQuizzes = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const filter = buildContentFilter(req.query, {});
    const publishedRequested = req.query.published !== undefined;

    if (req.ownerScoped && !isAdmin(req.user)) {
        // Teacher management: only quizzes the teacher owns.
        Object.assign(filter, ownerFilter(req.user));
        if (!publishedRequested) delete filter.isPublished;
    } else if (isAdmin(req.user)) {
        if (!publishedRequested) delete filter.isPublished;
    } else if (req.user && req.user.role === 'teacher') {
        // Catalogue browsing: published quizzes plus the teacher's own drafts.
        delete filter.isPublished;
        filter.$and = [
            ...(filter.$and || []),
            { $or: [{ isPublished: true }, { createdBy: req.user._id }] },
        ];
    } else if (!publishedRequested) {
        filter.isPublished = true;
    }

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

    if (!quiz) throw notFound('Quiz');

    const ownerId = quiz.createdBy?._id || quiz.createdBy;
    const isOwner = req.user && ownerId && ownerId.toString() === req.user._id.toString();

    // Owner-scoped detail: another teacher's quiz must look like a missing one.
    if (req.ownerScoped && !isAdmin(req.user) && !isOwner) throw notFound('Quiz');

    // Drafts are visible to admins and to the owning teacher only.
    if (!quiz.isPublished && !isAdmin(req.user) && !isOwner) throw notFound('Quiz');

    return successResponse(res, quiz, 'Quiz fetched');
});

// ─── POST /quizzes ─────────────────────────────────────────────────────────
const createQuiz = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    // Whitelisted fields only — a client-supplied createdBy is ignored.
    const {
        title, description, questions, difficulty, durationMinutes, passingScore, subjectId, topicId,
    } = req.body;

    const quiz = await Quiz.create({
        title,
        description,
        questions,
        difficulty,
        durationMinutes,
        passingScore,
        subjectId,
        topicId,
        isPublished: false,
        createdBy: req.user._id,
    });

    return successResponse(res, quiz, 'Quiz created', 201);
});

/**
 * Load a quiz the caller may mutate. Ownership is part of the query so that
 * knowing the id of another teacher's quiz grants nothing.
 */
const findOwnQuiz = async (id, user) => {
    const quiz = await Quiz.findOne({ _id: id, ...ownerFilter(user) });
    if (!quiz) throw notFound('Quiz');
    return quiz;
};

// ─── PATCH /quizzes/:id ────────────────────────────────────────────────────
const updateQuiz = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const quiz = await findOwnQuiz(req.params.id, req.user);

    const WHITELIST = ['title', 'description', 'questions', 'difficulty', 'durationMinutes', 'passingScore', 'subjectId', 'topicId'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) quiz[field] = req.body[field];
    });

    if (req.body.isPublished !== undefined && isAdmin(req.user)) {
        quiz.isPublished = req.body.isPublished;
    }

    await quiz.save();
    return successResponse(res, quiz, 'Quiz updated');
});

// ─── DELETE /quizzes/:id ───────────────────────────────────────────────────
const deleteQuiz = asyncHandler(async (req, res) => {
    const quiz = await findOwnQuiz(req.params.id, req.user);

    await quiz.deleteOne();
    return successResponse(res, null, 'Quiz deleted');
});

// ─── POST /quizzes/:id/start ──────────────────────────────────────────────────
const startQuiz = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id).select(
        'title topicId subjectId questions isPublished durationMinutes'
    );
    if (!quiz) throw notFound('Quiz');

    // Students may only attempt published quizzes.
    if (!quiz.isPublished && req.user.role === 'student') throw notFound('Quiz');

    if (!quiz.questions || quiz.questions.length === 0) {
        throw new AppError('This quiz has no questions yet.', 409, ERROR_CODES.CONFLICT);
    }

    // Resume an existing in-progress attempt rather than creating duplicates.
    const existing = await QuizAttempt.findOne({
        studentId: req.user._id,
        quizId: quiz._id,
        status: 'in-progress',
    }).select('_id expiresAt');

    if (existing) {
        return successResponse(
            res,
            { attemptId: existing._id, expiresAt: existing.expiresAt, resumed: true },
            'Resumed your in-progress attempt'
        );
    }

    const startedAt = new Date();
    const expiresAt = quiz.durationMinutes
        ? new Date(startedAt.getTime() + quiz.durationMinutes * 60_000)
        : undefined;

    const attempt = await QuizAttempt.create({
        studentId: req.user._id,
        quizId: quiz._id,
        topicId: quiz.topicId,
        subjectId: quiz.subjectId,
        status: 'in-progress',
        startedAt,
        expiresAt,
        totalQuestions: quiz.questions.length,
        quizTitleSnapshot: quiz.title,
        answers: [],
    });

    return successResponse(
        res,
        { attemptId: attempt._id, expiresAt: attempt.expiresAt, resumed: false },
        'Quiz attempt started',
        201
    );
});

// ─── POST /quizzes/attempts/:attemptId/submit ───────────────────────────────
/**
 * Grades a quiz entirely server-side.
 *
 * `selectedOption` is the zero-based index of the chosen option and is compared
 * against Question.correctAnswer (also an index). The client never supplies
 * correctness, scores, or mastery — those are derived here.
 */
const submitQuiz = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const { attemptId } = req.params;
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];

    // Ownership is enforced in the query filter — a student can never load
    // another student's attempt, regardless of the id they supply.
    const attempt = await QuizAttempt.findOne({ _id: attemptId, studentId: req.user._id });
    if (!attempt) throw notFound('Attempt');

    if (attempt.status === 'submitted') {
        // Idempotent guard against double submission (double-click, retry, back button).
        throw new AppError('This attempt has already been submitted.', 409, ERROR_CODES.CONFLICT);
    }

    const quiz = await Quiz.findById(attempt.quizId).select('questions subjectId topicId passingScore');
    if (!quiz) throw notFound('Quiz');

    // Server-side source of truth for the graded question set.
    const quizQuestions = await Question.find({ _id: { $in: quiz.questions } }).select(
        'correctAnswer options'
    );
    const questionMap = new Map(quizQuestions.map((q) => [q._id.toString(), q]));
    const totalQuestions = quizQuestions.length;

    // Keep only the first answer per question so a crafted payload cannot
    // submit the same question repeatedly to inflate the score.
    const seen = new Set();
    const gradedAnswers = [];

    for (const ans of answers) {
        const questionId = String(ans?.questionId || '');
        const question = questionMap.get(questionId);
        if (!question || seen.has(questionId)) continue;
        seen.add(questionId);

        const raw = ans.selectedOption;
        const index = Number.isInteger(raw) ? raw : Number.isInteger(Number(raw)) ? Number(raw) : null;
        const isWithinRange = index !== null && index >= 0 && index < question.options.length;
        const selectedOption = isWithinRange ? index : null;

        gradedAnswers.push({
            questionId,
            selectedOption,
            isCorrect: selectedOption === null ? null : selectedOption === question.correctAnswer,
        });
    }

    const correctCount = gradedAnswers.filter((a) => a.isCorrect === true).length;
    const answeredCount = gradedAnswers.filter((a) => a.selectedOption !== null).length;
    const incorrectCount = answeredCount - correctCount;
    // Questions never submitted at all also count as unanswered.
    const unansweredCount = totalQuestions - answeredCount;

    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    attempt.answers = gradedAnswers;
    attempt.totalQuestions = totalQuestions;
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.unansweredCount = unansweredCount;
    attempt.scorePercentage = scorePercentage;
    attempt.subjectId = attempt.subjectId || quiz.subjectId;
    attempt.topicId = attempt.topicId || quiz.topicId;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    await attempt.save();

    // ── Adaptive loop: progress → mastery → recommendations ──
    // Unanswered questions count as incorrect for mastery: the student did not
    // demonstrate the knowledge. This matches the score shown to the student.
    await masteryService.recordActivity({
        studentId: req.user._id,
        topicId: attempt.topicId,
        subjectId: attempt.subjectId,
        correct: correctCount,
        incorrect: incorrectCount + unansweredCount,
        scorePercentage,
    });

    // Streak tracking must never block a successful submission.
    try {
        await streakService.logActivityAndRefreshStreak(req.user._id);
    } catch (err) {
        logger.warn('quiz.streak_update_failed', { error: err.message });
    }

    return successResponse(res, {
        attemptId: attempt._id,
        scorePercentage,
        correctCount,
        incorrectCount,
        unansweredCount,
        totalQuestions,
        passed: quiz.passingScore ? scorePercentage >= quiz.passingScore : undefined,
    }, 'Quiz submitted and progress updated');
});

// ─── GET /quizzes/attempts ─────────────────────────────────────────────────
/** Paginated quiz history for the authenticated student (lightweight list). */
const getMyQuizAttempts = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const filter = { studentId: req.user._id, status: 'submitted' };

    const [attempts, total] = await Promise.all([
        QuizAttempt.find(filter)
            // Exclude the answers array — the list view never needs it and it
            // is by far the largest field on the document.
            .select('quizId quizTitleSnapshot topicId scorePercentage correctCount incorrectCount unansweredCount totalQuestions submittedAt')
            .populate('quizId', 'title passingScore')
            .populate('topicId', 'name')
            .sort({ submittedAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit),
        QuizAttempt.countDocuments(filter),
    ]);

    return paginatedResponse(res, attempts, buildPaginationMeta(total, pagination), 'Quiz history fetched');
});

// ─── GET /quizzes/attempts/:attemptId ───────────────────────────────────────
const getQuizAttempt = asyncHandler(async (req, res) => {
    // Ownership enforced in the filter. Admins/teachers use the analytics APIs.
    const attempt = await QuizAttempt.findOne({
        _id: req.params.attemptId,
        studentId: req.user._id,
    })
        .populate('quizId', 'title description passingScore')
        .populate({
            path: 'answers.questionId',
            // Correct answers and explanations are only revealed once the
            // attempt is finalized (checked below).
            select: 'question options correctAnswer explanation difficulty',
        });

    if (!attempt) throw notFound('Attempt');

    if (attempt.status !== 'submitted') {
        throw new AppError(
            'This attempt is still in progress. Submit it to see your results.',
            409,
            ERROR_CODES.CONFLICT
        );
    }

    return successResponse(res, attempt, 'Quiz results fetched');
});


module.exports = {
    getQuizzes,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    startQuiz,
    submitQuiz,
    getMyQuizAttempts,
    getQuizAttempt,
};
