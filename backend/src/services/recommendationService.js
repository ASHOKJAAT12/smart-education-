const Progress = require('../models/Progress');
const Recommendation = require('../models/Recommendation');
const Topic = require('../models/Topic');
const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');
const AssessmentResult = require('../models/AssessmentResult');

/**
 * Normalizes mastery level from a score bounds.
 */
const getMasteryLevel = (score) => {
    if (score >= 80) return 'mastered';
    if (score >= 60) return 'good';
    if (score >= 40) return 'needs_improvement';
    return 'weak';
};

/**
 * Calculates priority score iteratively based on mathematical signals.
 * @param {Object} progress - Document from Progress Model
 * @param {Object} user - User Object containing learning goals 
 */
const calculateTopicPriority = (progress, user) => {
    let score = 100 - progress.masteryScore; // Base: weaker means higher priority
    let reason = "This topic needs attention to build a solid foundation.";
    let action = "Learn fundamentals";

    // Recency Decline weight: Recent is worse than average
    if (progress.attemptCount > 0 && progress.recentAccuracy < progress.averageAccuracy - 10) {
        score += 15;
        reason = "Your recent performance in this topic has declined.";
        action = "Revision practice";
    }

    // Struggle weight (High attempts, low accuracy)
    if (progress.attemptCount >= 3 && progress.masteryScore < 50) {
        score += 25;
        reason = "You have struggled with this across multiple attempts.";
        action = "Targeted conceptual review";
    }

    // Goal alignment (Mock alignment check for demonstration - would use tags/metadata in a real mapping)
    // E.g., if learningGoal is "exam_prep", we bump up 'medium/hard' topics

    // Prerequisite simulation (If it's a weak score, recommend fundamentals)
    if (progress.masteryLevel === 'weak') {
        action = "Learn fundamentals";
    } else if (progress.masteryLevel === 'needs_improvement') {
        action = "Practice standard questions";
    } else if (progress.masteryLevel === 'good') {
        action = "Attempt advanced challenges";
    } else {
        score = Math.max(0, score - 50); // Heavily penalize priority if already mastered
        reason = "You have mastered this, occasional revision recommended.";
        action = "Quick Quiz";
    }

    // Cap the score at 100 visually or let it exceed naturally as an absolute sorting bound.
    return { priorityScore: Math.round(score), reason, recommendedAction: action };
};

/**
 * Main Recommendation Engine Loop. Call this when new data is persisted (i.e., after an assessment).
 */
const generateRecommendations = async (studentId) => {
    const user = await User.findById(studentId);
    if (!user) throw new Error('User not found');

    const progresses = await Progress.find({ studentId }).populate('topicId');
    if (!progresses || progresses.length === 0) return []; // Nothing to recommend until Assessment/Quiz is taken

    // Clear old active recommendations logically
    await Recommendation.updateMany({ studentId, status: 'active' }, { status: 'discarded' });

    let calculatedRecs = progresses.map(p => {
        const { priorityScore, reason, recommendedAction } = calculateTopicPriority(p, user);
        return {
            topicId: p.topicId._id,
            subjectId: p.subjectId,
            priorityScore,
            reason,
            recommendedAction,
            // Pass Topic Name implicitly for ease of debugging internally if needed
            topicName: p.topicId.name
        };
    });

    // Prerequisite processing: Sort by score DESC
    calculatedRecs.sort((a, b) => b.priorityScore - a.priorityScore);

    // Limit to top 5 recommendations to prevent cognitive overload
    const topRecs = calculatedRecs.slice(0, 5);

    // Persist to DB
    const recDocs = topRecs.map(rec => ({
        studentId,
        subjectId: rec.subjectId,
        topicId: rec.topicId,
        priorityScore: rec.priorityScore,
        reason: rec.reason,
        recommendedAction: rec.recommendedAction,
        status: 'active'
    }));

    await Recommendation.insertMany(recDocs);
    return recDocs;
};

/**
 * Updates or creates Progress documents from an Assessment Result payload.
 * Should be called asynchronously so as not to block typical http responses.
 */
const updateProgressFromAssessment = async (resultId) => {
    const result = await AssessmentResult.findById(resultId);
    if (!result) return;

    for (const tp of result.topicPerformance) {
        // Upsert logic for Progress tracking
        let progress = await Progress.findOne({ studentId: result.userId, topicId: tp.topicId });

        if (!progress) {
            progress = new Progress({
                studentId: result.userId,
                subjectId: result.subjectId || null,
                topicId: tp.topicId,
                masteryScore: tp.accuracy,
                masteryLevel: tp.masteryLevel,
                attemptCount: 1,
                correctCount: tp.correct,
                incorrectCount: tp.incorrect,
                averageAccuracy: tp.accuracy,
                recentAccuracy: tp.accuracy,
                status: tp.accuracy >= 80 ? 'mastered' : 'needs_improvement',
                firstAttemptAt: new Date(),
                lastAttemptAt: new Date(),
            });
        } else {
            // Update rolling averages
            const newTotalTries = progress.attemptCount + 1;
            const newTotalCorrect = progress.correctCount + tp.correct;
            const newTotalIncorrect = progress.incorrectCount + tp.incorrect;

            const totalQuestions = newTotalCorrect + newTotalIncorrect;
            const newAvgAccuracy = totalQuestions > 0 ? (newTotalCorrect / totalQuestions) * 100 : 0;

            progress.attemptCount = newTotalTries;
            progress.correctCount = newTotalCorrect;
            progress.incorrectCount = newTotalIncorrect;
            progress.averageAccuracy = newAvgAccuracy;
            progress.recentAccuracy = tp.accuracy;

            // Recalculate Mastery Score (Weighted recent logic: 60% recent, 40% historical)
            progress.masteryScore = (tp.accuracy * 0.6) + (progress.averageAccuracy * 0.4);
            progress.masteryLevel = getMasteryLevel(progress.masteryScore);

            progress.status = progress.masteryScore >= 80 ? 'mastered' : 'needs_improvement';
            progress.lastAttemptAt = new Date();
        }
        await progress.save();
    }

    // Regenerate recommendations with fresh data
    await generateRecommendations(result.userId);
};

/**
 * Generates a bounded daily study plan automatically fitting the user's allowed `dailyStudyTime`.
 */
const generateDailyStudyPlan = async (studentId) => {
    const user = await User.findById(studentId);
    if (!user) throw new Error('User not found');

    const availableTime = user.dailyStudyTime || 60; // default 60
    const today = new Date().toISOString().split('T')[0];

    // Check if one already exists for today
    let plan = await StudyPlan.findOne({ studentId, date: today });
    if (plan) return plan;

    // Get active recommendations
    const activeRecs = await Recommendation.find({ studentId, status: 'active' }).sort({ priorityScore: -1 }).populate('topicId');
    if (activeRecs.length === 0) {
        throw new Error('No active recommendations. Please take an assessment first.');
    }

    const items = [];
    let timeRemaining = availableTime;
    let order = 1;

    for (const rec of activeRecs) {
        if (timeRemaining <= 0) break;

        // Allocate chunks based on priority
        // Very high priority gets larger chunks, but capped to ensure variety.
        let duration = rec.priorityScore > 80 ? 30 : 20;
        if (timeRemaining < duration) {
            duration = timeRemaining;
        }

        // Determine activity type from recommendation action text logically
        let activityType = 'practice';
        if (rec.recommendedAction.includes('fundamentals')) activityType = 'learn';
        else if (rec.recommendedAction.includes('Quiz')) activityType = 'quiz';
        else if (rec.recommendedAction.includes('Revision')) activityType = 'revision';

        items.push({
            topicId: rec.topicId._id,
            activityType,
            durationMinutes: duration,
            order: order++,
            status: 'pending'
        });

        timeRemaining -= duration;
    }

    // Attempt to pad with practice if there is unused time remaining (say > 10 mins leftover)
    if (timeRemaining >= 10 && activeRecs.length > 0) {
        items.push({
            topicId: activeRecs[0].topicId._id, // Add final practice mapping to highest prio topic
            activityType: 'practice',
            durationMinutes: timeRemaining,
            order: order++,
            status: 'pending'
        });
    }

    plan = new StudyPlan({
        studentId,
        date: today,
        totalMinutes: availableTime,
        items,
        status: 'pending'
    });

    await plan.save();
    return plan;
};


module.exports = {
    updateProgressFromAssessment,
    generateRecommendations,
    generateDailyStudyPlan
};
