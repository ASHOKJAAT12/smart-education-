const Progress = require('../models/Progress');
const Recommendation = require('../models/Recommendation');
const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');
const AssessmentResult = require('../models/AssessmentResult');
const masteryService = require('./mastery.service');
const logger = require('../utils/logger');
const { AppError } = require('../utils/AppError');
const {
    MASTERY_LEVELS,
    RECOMMENDATION_LIMITS,
    RECOMMENDATION_STATUS,
} = require('../config/constants');

/**
 * Recommendation Service — deterministic priority engine.
 *
 * Mastery classification is NOT duplicated here; it is imported from
 * mastery.service so recommendations, dashboards and analytics agree.
 */

/**
 * Score how urgently a topic needs attention. Higher = more urgent.
 * Pure function — easy to reason about and unit test.
 *
 * @param {object} progress Progress document (or plain object)
 * @returns {{ priorityScore: number, reason: string, recommendedAction: string }}
 */
const calculateTopicPriority = (progress) => {
    const masteryScore = progress.masteryScore || 0;
    const level = masteryService.classifyMastery(masteryScore);

    let score = 100 - masteryScore; // weaker mastery ⇒ higher priority
    let reason = 'This topic needs attention to build a solid foundation.';
    let recommendedAction = 'Learn fundamentals';

    const attempts = progress.attemptCount || 0;
    const recent = progress.recentAccuracy || 0;
    const average = progress.averageAccuracy || 0;

    // Recent performance has declined versus lifetime accuracy.
    if (attempts > 0 && recent < average - RECOMMENDATION_LIMITS.DECLINE_DELTA) {
        score += RECOMMENDATION_LIMITS.DECLINE_BONUS;
        reason = 'Your recent performance in this topic has declined.';
        recommendedAction = 'Revision practice';
    }

    // Repeated attempts without reaching a passable mastery.
    if (
        attempts >= RECOMMENDATION_LIMITS.STRUGGLE_ATTEMPT_THRESHOLD &&
        level === MASTERY_LEVELS.WEAK
    ) {
        score += RECOMMENDATION_LIMITS.STRUGGLE_BONUS;
        reason = 'You have struggled with this across multiple attempts.';
        recommendedAction = 'Targeted conceptual review';
    }

    // Action guidance follows the canonical mastery band.
    if (level === MASTERY_LEVELS.WEAK) {
        recommendedAction = recommendedAction === 'Revision practice' ? recommendedAction : 'Learn fundamentals';
    } else if (level === MASTERY_LEVELS.NEEDS_IMPROVEMENT) {
        recommendedAction = 'Practice standard questions';
    } else if (level === MASTERY_LEVELS.GOOD) {
        recommendedAction = 'Attempt advanced challenges';
    } else {
        // Mastered — keep it in rotation for retention only.
        score = Math.max(0, score - RECOMMENDATION_LIMITS.MASTERED_PENALTY);
        reason = 'You have mastered this — occasional revision keeps it fresh.';
        recommendedAction = 'Quick Quiz';
    }

    return { priorityScore: Math.round(score), reason, recommendedAction };
};

/**
 * Regenerate the student's active recommendation set from current Progress.
 * Idempotent: safe to call after every scored activity.
 *
 * @param {string} studentId
 * @returns {Promise<Array>} the persisted recommendations
 */
const generateRecommendations = async (studentId) => {
    // Lean read — we only need scoring fields, not full hydrated documents.
    const progresses = await Progress.find({ studentId })
        .select('topicId subjectId masteryScore attemptCount recentAccuracy averageAccuracy')
        .lean();

    if (!progresses.length) return [];

    const ranked = progresses
        .filter((p) => p.topicId && p.subjectId)
        .map((p) => ({ progress: p, ...calculateTopicPriority(p) }))
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, RECOMMENDATION_LIMITS.MAX_ACTIVE);

    if (!ranked.length) return [];

    // Replace the active set atomically-ish: discard old, insert new.
    await Recommendation.updateMany(
        { studentId, status: RECOMMENDATION_STATUS.ACTIVE },
        { $set: { status: RECOMMENDATION_STATUS.DISCARDED } }
    );

    const docs = ranked.map((rec) => ({
        studentId,
        subjectId: rec.progress.subjectId,
        topicId: rec.progress.topicId,
        priorityScore: rec.priorityScore,
        reason: rec.reason,
        recommendedAction: rec.recommendedAction,
        status: RECOMMENDATION_STATUS.ACTIVE,
    }));

    await Recommendation.insertMany(docs);
    return docs;
};

/**
 * Apply a diagnostic assessment result to Progress via the mastery service,
 * then refresh recommendations.
 *
 * @param {string} resultId AssessmentResult._id
 */
const updateProgressFromAssessment = async (resultId) => {
    const result = await AssessmentResult.findById(resultId).lean();
    if (!result) {
        logger.warn('recommendation.assessment_result_missing', { resultId: String(resultId) });
        return;
    }

    for (const tp of result.topicPerformance || []) {
        const total = tp.totalQuestions || 0;
        const correct = tp.correctAnswers || 0;

        await masteryService.recordActivity({
            studentId: result.studentId,
            topicId: tp.topicId,
            subjectId: result.subjectId,
            correct,
            incorrect: Math.max(0, total - correct),
            scorePercentage: tp.accuracy,
        });
    }

    // recordActivity already refreshes recommendations, but call once more so a
    // multi-topic assessment ends with a single consistent ranking.
    await generateRecommendations(result.studentId);
};

/** Map a recommended action string to a study-plan activity type. */
const resolveActivityType = (recommendedAction = '') => {
    const action = recommendedAction.toLowerCase();
    if (action.includes('fundamental')) return 'learn';
    if (action.includes('quiz')) return 'quiz';
    if (action.includes('revision')) return 'revision';
    return 'practice';
};

const todayKey = () => new Date().toISOString().split('T')[0];

/**
 * Get or create today's study plan.
 *
 * Important: an existing plan is NEVER regenerated. Student progress against
 * plan items (completed / skipped) must survive page refreshes.
 *
 * @param {string} studentId
 * @param {object} [options]
 * @param {boolean} [options.force] Rebuild today's plan from scratch (explicit user action)
 */
const generateDailyStudyPlan = async (studentId, { force = false } = {}) => {
    const user = await User.findById(studentId).select('dailyStudyTime').lean();
    if (!user) throw new AppError('Student not found', 404);

    const availableTime = user.dailyStudyTime || 60;
    const date = todayKey();

    const existing = await StudyPlan.findOne({ studentId, date });
    if (existing && !force) return existing;

    const activeRecs = await Recommendation.find({
        studentId,
        status: RECOMMENDATION_STATUS.ACTIVE,
    })
        .sort({ priorityScore: -1 })
        .select('topicId recommendedAction priorityScore')
        .lean();

    if (!activeRecs.length) {
        throw new AppError(
            'No recommendations available yet. Complete a diagnostic assessment or a quiz first.',
            409
        );
    }

    const items = [];
    let timeRemaining = availableTime;
    let order = 1;

    for (const rec of activeRecs) {
        if (timeRemaining <= 0) break;
        let duration = rec.priorityScore > 80 ? 30 : 20;
        if (timeRemaining < duration) duration = timeRemaining;

        items.push({
            topicId: rec.topicId,
            activityType: resolveActivityType(rec.recommendedAction),
            durationMinutes: duration,
            order: order++,
            status: 'pending',
        });

        timeRemaining -= duration;
    }

    // Use any meaningful leftover time on the highest-priority topic.
    if (timeRemaining >= 10) {
        items.push({
            topicId: activeRecs[0].topicId,
            activityType: 'practice',
            durationMinutes: timeRemaining,
            order: order++,
            status: 'pending',
        });
    }

    if (existing) {
        existing.items = items;
        existing.totalMinutes = availableTime;
        existing.status = 'pending';
        await existing.save();
        return existing;
    }

    return StudyPlan.create({
        studentId,
        date,
        totalMinutes: availableTime,
        items,
        status: 'pending',
    });
};

module.exports = {
    calculateTopicPriority,
    generateRecommendations,
    updateProgressFromAssessment,
    generateDailyStudyPlan,
    todayKey,
};
