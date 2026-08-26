const Progress = require('../models/Progress');
const recommendationService = require('./recommendationService');

/**
 * Recalculates the Mastery Score safely after any formal Practice or Quiz activity.
 * Weight Ratio: 70% New Score + 30% Historical Score.
 */
exports.updateTopicMastery = async (studentId, topicId, subjectId, incomingScorePercentage) => {
    let progress = await Progress.findOne({ studentId, topicId });

    if (!progress) {
        // Initialize if first time catching this manually outside diagnostic logic
        progress = new Progress({
            studentId,
            topicId,
            subjectId,
            masteryScore: incomingScorePercentage,
            recentAccuracy: incomingScorePercentage,
            totalAttempts: 1,
            lastAttemptDate: new Date()
        });
    } else {
        // Core Mathematical Blending Logic
        // Ensures one incredibly high or low score does not instantaneously wipe out persistent historical standing
        const oldScore = progress.masteryScore || 0;
        const blendedScore = Math.round((incomingScorePercentage * 0.7) + (oldScore * 0.3));

        progress.masteryScore = blendedScore;
        progress.recentAccuracy = incomingScorePercentage; // Retains exact raw recency point for reference
        progress.totalAttempts += 1;
        progress.lastAttemptDate = new Date();
    }

    // Determine String classification bracket
    if (progress.masteryScore >= 80) progress.masteryLevel = 'advanced';
    else if (progress.masteryScore >= 50) progress.masteryLevel = 'intermediate';
    else progress.masteryLevel = 'beginner';

    await progress.save();

    // ── TRIGGER RECOMMENDATION ENGINE REFRESH ──
    // Because mastery inherently shifts priority, we must trigger Phase 6 instantly.
    try {
        await recommendationService.updateTopicPriority(studentId, topicId);
    } catch (err) {
        console.error("Non-fatal: Failed propagating recommendation update after mastery shift", err);
    }

    return progress;
};
