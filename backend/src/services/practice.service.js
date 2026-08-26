const Question = require('../models/Question');
const Progress = require('../models/Progress');

/**
 * Dynamically binds question bounds according to exact performance parameters.
 */
exports.fetchAdaptivePracticeSession = async (studentId, topicId) => {
    // 1. Fetch current standing
    const progress = await Progress.findOne({ studentId, topicId });
    const score = progress ? progress.masteryScore : 0;

    // 2. Determine ideal difficulty bracket (Adaptive)
    let targetDifficulty = 'easy'; // Fallback
    if (score >= 70) targetDifficulty = 'hard';
    else if (score >= 40) targetDifficulty = 'medium';

    // 3. Fetch up to 10 Questions prioritizing that bracket, but injecting some adjacent variance
    // Example: If target is medium, fetch 7 mediums, 3 hards. Or 7 mediums, 3 easys.
    let qs = await Question.find({ topicId, difficulty: targetDifficulty }).limit(7);

    if (qs.length < 10) {
        // Fallback fetch remaining generically if strict difficulty query starves
        const remaining = await Question.find({
            topicId,
            _id: { $nin: qs.map(q => q._id) }
        }).limit(10 - qs.length);
        qs = [...qs, ...remaining];
    }

    // 4. Return the randomized pool
    return qs.sort(() => 0.5 - Math.random());
};
