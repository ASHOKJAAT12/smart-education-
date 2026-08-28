const mongoose = require('mongoose');
const Progress = require('../models/Progress');
const logger = require('../utils/logger');
const {
    MASTERY_THRESHOLDS,
    MASTERY_LEVELS,
    MASTERY_WEIGHTS,
    PROGRESS_STATUS,
} = require('../config/constants');

/**
 * Mastery Service — THE authoritative implementation of mastery for SmartLearn AI.
 *
 * Every activity that produces a score (diagnostic assessment, practice session,
 * formal quiz, AI quiz) funnels through `recordActivity`. Nothing else may write
 * masteryScore / masteryLevel, which guarantees the platform has one definition
 * of "Mastered" across student dashboard, teacher analytics and admin analytics.
 *
 * Formula:
 *   masteryScore = round(recentScore * 0.6 + historicalAverageAccuracy * 0.4)
 *
 * Historical average accuracy is derived from cumulative correct/incorrect counts,
 * so it is a true lifetime accuracy rather than an average-of-averages.
 */

/**
 * Classify a 0–100 mastery score into the canonical mastery level.
 * @param {number} score
 * @returns {'weak'|'needs_improvement'|'good'|'mastered'}
 */
const classifyMastery = (score) => {
    const value = Number.isFinite(score) ? score : 0;
    if (value >= MASTERY_THRESHOLDS.MASTERED) return MASTERY_LEVELS.MASTERED;
    if (value >= MASTERY_THRESHOLDS.GOOD) return MASTERY_LEVELS.GOOD;
    if (value >= MASTERY_THRESHOLDS.NEEDS_IMPROVEMENT) return MASTERY_LEVELS.NEEDS_IMPROVEMENT;
    return MASTERY_LEVELS.WEAK;
};

/** Derive the persisted progress status from a mastery score. */
const deriveStatus = (score) =>
    score >= MASTERY_THRESHOLDS.MASTERED ? PROGRESS_STATUS.MASTERED : PROGRESS_STATUS.NEEDS_IMPROVEMENT;

/** Clamp any numeric score into the valid 0–100 range. */
const clampScore = (value) => Math.min(100, Math.max(0, Math.round(Number(value) || 0)));

/**
 * Blend a fresh score with historical accuracy.
 * @param {number} recentScore 0–100
 * @param {number} historicalAccuracy 0–100
 */
const blendMastery = (recentScore, historicalAccuracy) =>
    clampScore(recentScore * MASTERY_WEIGHTS.RECENT + historicalAccuracy * MASTERY_WEIGHTS.HISTORICAL);

/**
 * Record a completed learning activity and recalculate mastery for one topic.
 *
 * @param {object} params
 * @param {string} params.studentId
 * @param {string} params.topicId
 * @param {string} params.subjectId  Required when creating the first Progress doc
 * @param {number} params.correct    Number of correct answers in this activity
 * @param {number} params.incorrect  Number of incorrect (or unanswered) answers
 * @param {number} [params.scorePercentage]  Optional pre-computed accuracy (0–100)
 * @returns {Promise<object|null>} Updated Progress document
 */
const recordActivity = async ({
    studentId,
    topicId,
    subjectId,
    correct = 0,
    incorrect = 0,
    scorePercentage,
}) => {
    if (!studentId || !topicId) return null;

    const answered = correct + incorrect;
    const recentScore =
        scorePercentage !== undefined
            ? clampScore(scorePercentage)
            : answered > 0
                ? clampScore((correct / answered) * 100)
                : 0;

    const now = new Date();
    let progress = await Progress.findOne({ studentId, topicId });

    if (!progress) {
        if (!subjectId) {
            // Progress.subjectId is required; without it we cannot create a valid record.
            logger.warn('mastery.skip_create_missing_subject', { topicId: String(topicId) });
            return null;
        }

        progress = new Progress({
            studentId,
            subjectId,
            topicId,
            masteryScore: recentScore,
            masteryLevel: classifyMastery(recentScore),
            attemptCount: 1,
            correctCount: correct,
            incorrectCount: incorrect,
            averageAccuracy: recentScore,
            recentAccuracy: recentScore,
            status: deriveStatus(recentScore),
            firstAttemptAt: now,
            lastAttemptAt: now,
        });
    } else {
        const totalCorrect = (progress.correctCount || 0) + correct;
        const totalIncorrect = (progress.incorrectCount || 0) + incorrect;
        const totalAnswered = totalCorrect + totalIncorrect;

        const historicalAccuracy =
            totalAnswered > 0 ? clampScore((totalCorrect / totalAnswered) * 100) : progress.averageAccuracy || 0;

        progress.attemptCount = (progress.attemptCount || 0) + 1;
        progress.correctCount = totalCorrect;
        progress.incorrectCount = totalIncorrect;
        progress.averageAccuracy = historicalAccuracy;
        progress.recentAccuracy = recentScore;
        progress.masteryScore = blendMastery(recentScore, historicalAccuracy);
        progress.masteryLevel = classifyMastery(progress.masteryScore);
        progress.status = deriveStatus(progress.masteryScore);
        progress.lastAttemptAt = now;
        if (!progress.firstAttemptAt) progress.firstAttemptAt = now;
    }

    await progress.save();

    // Mastery changed → recommendation priorities are stale. Refresh them, but a
    // recommendation failure must never fail the student's submission.
    try {
        // Required lazily to avoid a circular import at module load time.
        const recommendationService = require('./recommendationService');
        await recommendationService.generateRecommendations(studentId);
    } catch (err) {
        logger.warn('mastery.recommendation_refresh_failed', {
            studentId: String(studentId),
            error: err.message,
        });
    }

    return progress;
};

/**
 * Backwards-compatible wrapper retained for Phase 8 call sites.
 * Prefer `recordActivity` for new code — it carries correct/incorrect counts and
 * therefore produces a truthful lifetime accuracy.
 */
const updateTopicMastery = async (studentId, topicId, subjectId, incomingScorePercentage) =>
    recordActivity({
        studentId,
        topicId,
        subjectId,
        scorePercentage: incomingScorePercentage,
        correct: 0,
        incorrect: 0,
    });

/**
 * Aggregate a student's overall mastery using the canonical definition:
 * the mean masteryScore across all topics the student has attempted.
 */
const getOverallMastery = async (studentId) => {
    const [row] = await Progress.aggregate([
        { $match: { studentId: new mongoose.Types.ObjectId(String(studentId)) } },
        {
            $group: {
                _id: null,
                averageMastery: { $avg: '$masteryScore' },
                topicsAttempted: { $sum: 1 },
                topicsMastered: {
                    $sum: { $cond: [{ $gte: ['$masteryScore', MASTERY_THRESHOLDS.MASTERED] }, 1, 0] },
                },
            },
        },
    ]);

    return {
        averageMastery: row ? Math.round(row.averageMastery) : 0,
        topicsAttempted: row ? row.topicsAttempted : 0,
        topicsMastered: row ? row.topicsMastered : 0,
    };
};

module.exports = {
    classifyMastery,
    deriveStatus,
    blendMastery,
    clampScore,
    recordActivity,
    updateTopicMastery,
    getOverallMastery,
};
