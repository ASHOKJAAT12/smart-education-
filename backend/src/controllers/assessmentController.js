const Assessment = require('../models/Assessment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const AssessmentResult = require('../models/AssessmentResult');
const Question = require('../models/Question');
const Topic = require('../models/Topic');
const asyncHandler = require('../middleware/asyncHandler');

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
const catchAsync = asyncHandler;

exports.createAssessment = catchAsync(async (req, res, next) => {
    // Note: Creating the assessment for test seeding uses
    const newAssessment = await Assessment.create({
        ...req.body,
        createdBy: req.user._id,
    });
    res.status(201).json({ status: 'success', data: { assessment: newAssessment } });
});

exports.getAllAssessments = catchAsync(async (req, res, next) => {
    const assessments = await Assessment.find({ isActive: true }).select('-questionIds').populate('subjectId', 'name').populate('topicIds', 'name');
    res.status(200).json({ status: 'success', results: assessments.length, data: { assessments } });
});

exports.getAssessmentById = catchAsync(async (req, res, next) => {
    const assessment = await Assessment.findById(req.params.assessmentId).select('-questionIds').populate('subjectId', 'name').populate('topicIds', 'name');
    if (!assessment) return next(new AppError('Assessment not found', 404));
    res.status(200).json({ status: 'success', data: { assessment } });
});

exports.startAssessment = catchAsync(async (req, res, next) => {
    const assessment = await Assessment.findById(req.params.assessmentId);
    if (!assessment || !assessment.isActive) {
        return next(new AppError('Assessment not found or inactive', 404));
    }

    // Check if user already has an active attempt
    const activeAttempt = await AssessmentAttempt.findOne({
        studentId: req.user._id,
        assessmentId: assessment._id,
        status: 'in_progress'
    });

    if (activeAttempt) {
        if (new Date() > activeAttempt.expiresAt) {
            activeAttempt.status = 'expired';
            await activeAttempt.save();
        } else {
            // Populate questions for the attempt without revealing answers
            await activeAttempt.populate('questions.questionId', 'question options questionType difficulty');
            return res.status(200).json({ status: 'success', data: { attempt: activeAttempt } });
        }
    }

    // Balanced Selection Logic
    // Use aggregation to randomly sample per topic based on difficulty distribution.
    // For simplicity and hackathon, we fetch and sample in memory (assuming moderate question pool).
    const questions = await Question.find({
        subjectId: assessment.subjectId,
        topicId: { $in: assessment.topicIds }
    });

    const topicMap = {};
    assessment.topicIds.forEach(t => topicMap[t.toString()] = []);
    questions.forEach(q => {
        if (q.topicId && topicMap[q.topicId.toString()]) {
            topicMap[q.topicId.toString()].push(q);
        }
    });

    const selectedQuestions = [];
    const topicsCount = assessment.topicIds.length;
    let questionsPerTopic = Math.floor(assessment.totalQuestions / topicsCount);
    let remainder = assessment.totalQuestions % topicsCount;

    for (const [topicId, topicQuestions] of Object.entries(topicMap)) {
        // shuffle topicQuestions
        topicQuestions.sort(() => 0.5 - Math.random());
        let count = questionsPerTopic + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;

        let slice = topicQuestions.slice(0, count);
        slice.forEach(sq => {
            selectedQuestions.push({ questionId: sq._id, topicId: sq.topicId, difficulty: sq.difficulty });
        });
    }

    if (selectedQuestions.length === 0) {
        return next(new AppError('No questions available for this assessment', 400));
    }

    // trim to exact totalQuestions required (if any overlap)
    if (selectedQuestions.length > assessment.totalQuestions) {
        selectedQuestions.length = assessment.totalQuestions;
    }

    const newAttempt = await AssessmentAttempt.create({
        studentId: req.user._id,
        assessmentId: assessment._id,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + assessment.durationMinutes * 60000),
        status: 'in_progress',
        questions: selectedQuestions,
        answers: [],
    });

    await newAttempt.populate('questions.questionId', 'question options questionType difficulty');

    res.status(201).json({ status: 'success', data: { attempt: newAttempt } });
});

exports.getAttempt = catchAsync(async (req, res, next) => {
    const attempt = await AssessmentAttempt.findOne({
        _id: req.params.attemptId,
        studentId: req.user._id
    }).populate('questions.questionId', 'question options questionType difficulty');

    if (!attempt) return next(new AppError('Attempt not found', 404));

    res.status(200).json({ status: 'success', data: { attempt } });
});

exports.submitAssessment = catchAsync(async (req, res, next) => {
    const attempt = await AssessmentAttempt.findOne({
        _id: req.params.attemptId,
        studentId: req.user._id
    });

    if (!attempt) return next(new AppError('Attempt not found', 404));

    if (attempt.status === 'submitted') {
        return next(new AppError('Attempt already submitted', 400));
    }

    // Process late submission
    if (new Date() > attempt.expiresAt) {
        attempt.status = 'expired';
        await attempt.save();
        return next(new AppError('Assessment expired', 400));
    }

    const { answers } = req.body; // array of { questionId, selectedAnswer }
    if (!Array.isArray(answers)) return next(new AppError('Invalid answers format', 400));

    // Fetch questions to evaluate answers
    const questionIds = attempt.questions.map(q => q.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = {};
    questions.forEach(q => questionMap[q._id.toString()] = q);

    let correct = 0;
    let incorrect = 0;

    const topicStats = {};
    attempt.questions.forEach(q => {
        const tId = q.topicId ? q.topicId.toString() : 'unknown';
        if (!topicStats[tId]) topicStats[tId] = { total: 0, correct: 0 };
        topicStats[tId].total += 1;
    });

    const processedAnswers = [];

    answers.forEach(ans => {
        if (!ans.questionId) return;
        const qIdStr = ans.questionId.toString();
        const qDoc = questionMap[qIdStr];
        if (!qDoc) return;

        let isCorrect = false;
        if (ans.selectedAnswer === qDoc.correctAnswer) {
            isCorrect = true;
            correct += 1;
        } else if (ans.selectedAnswer !== null && ans.selectedAnswer !== undefined) {
            incorrect += 1;
        }

        const tId = qDoc.topicId ? qDoc.topicId.toString() : 'unknown';
        if (isCorrect && topicStats[tId]) {
            topicStats[tId].correct += 1;
        }

        processedAnswers.push({
            questionId: ans.questionId,
            selectedAnswer: ans.selectedAnswer,
        });
    });

    const totalQuestions = attempt.questions.length;
    const unanswered = totalQuestions - correct - incorrect;
    const overallScore = correct;
    const percentage = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    const timeTaken = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

    const topicPerformance = [];
    const strongTopics = [];
    const averageTopics = [];
    const weakTopics = [];

    const topicIdsArray = Object.keys(topicStats).filter(id => id !== 'unknown');
    const topics = await Topic.find({ _id: { $in: topicIdsArray } });
    const topicNameMap = {};
    topics.forEach(t => topicNameMap[t._id.toString()] = t.name);

    for (const [tId, stats] of Object.entries(topicStats)) {
        if (tId === 'unknown') continue;
        const acc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        let mastery = 'weak';
        if (acc >= 80) mastery = 'mastered';
        else if (acc >= 60) mastery = 'good';
        else if (acc >= 40) mastery = 'needs_improvement';

        topicPerformance.push({
            topicId: tId,
            topicName: topicNameMap[tId] || 'Unknown',
            totalQuestions: stats.total,
            correctAnswers: stats.correct,
            accuracy: acc,
            masteryLevel: mastery
        });

        if (acc >= 80) strongTopics.push(tId);
        else if (acc >= 40) averageTopics.push(tId);
        else weakTopics.push(tId);
    }

    topicPerformance.sort((a, b) => b.accuracy - a.accuracy);
    const strongestTopic = topicPerformance.length > 0 ? { topicId: topicPerformance[0].topicId, name: topicPerformance[0].topicName } : null;
    const weakestTopic = topicPerformance.length > 0 ? { topicId: topicPerformance[topicPerformance.length - 1].topicId, name: topicPerformance[topicPerformance.length - 1].topicName } : null;

    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.answers = processedAnswers;
    attempt.score = overallScore;
    attempt.percentage = percentage;
    attempt.timeTaken = timeTaken;
    await attempt.save();

    const assessment = await Assessment.findById(attempt.assessmentId);

    const result = await AssessmentResult.create({
        studentId: req.user._id,
        assessmentId: attempt.assessmentId,
        attemptId: attempt._id,
        subjectId: assessment ? assessment.subjectId : null,
        overallScore,
        percentage,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
        unansweredAnswers: unanswered,
        timeTaken,
        topicPerformance,
        strongTopics,
        averageTopics,
        weakTopics,
        strongestTopic,
        weakestTopic
    });

    res.status(200).json({ status: 'success', data: { resultId: result._id } });
});

exports.getResult = catchAsync(async (req, res, next) => {
    const result = await AssessmentResult.findOne({
        attemptId: req.params.attemptId,
        studentId: req.user._id
    }).populate('assessmentId', 'title description totalQuestions durationMinutes')
        .populate('subjectId', 'name');

    if (!result) return next(new AppError('Result not found', 404));

    res.status(200).json({ status: 'success', data: { result } });
});

exports.getMyResults = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const sortParams = {};
    if (req.query.sort === 'score') sortParams.percentage = -1;
    else if (req.query.sort === 'oldest') sortParams.completedAt = 1;
    else sortParams.completedAt = -1;

    const results = await AssessmentResult.find({ studentId: req.user._id })
        .populate('assessmentId', 'title')
        .populate('subjectId', 'name')
        .sort(sortParams)
        .skip(skip)
        .limit(limit);

    const total = await AssessmentResult.countDocuments({ studentId: req.user._id });

    res.status(200).json({
        status: 'success',
        results: results.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        data: { results }
    });
});
