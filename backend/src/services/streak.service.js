const User = require('../models/User'); // We will assume streak lives directly on User metadata for quick global retrieval

/**
 * Analyzes activity pulses and ensures a contiguous daily chain is tracked accurately.
 */
exports.logActivityAndRefreshStreak = async (studentId) => {
    const user = await User.findById(studentId);
    if (!user) return null;

    const now = new Date();
    const todayStr = now.toDateString(); // "Wed Aug 26 2026"

    // Ensure metadata structure exists gracefully
    if (!user.learningMetadata) {
        user.learningMetadata = { currentStreak: 0, lastActivityDate: null };
    }

    const lastDate = user.learningMetadata.lastActivityDate;

    if (!lastDate) {
        // Baseline init
        user.learningMetadata.currentStreak = 1;
        user.learningMetadata.lastActivityDate = now;
    } else {
        const lastDateStr = lastDate.toDateString();

        if (todayStr !== lastDateStr) {
            // Is it exactly the following day? (Difference of ~24h conceptually)
            // Simplified check: Midnight boundary math
            const msInDay = 1000 * 60 * 60 * 24;
            const diffInDays = Math.floor((now.getTime() - lastDate.getTime()) / msInDay);

            if (diffInDays <= 1) { // Same logical continuous window
                user.learningMetadata.currentStreak += 1;
            } else if (diffInDays > 1) { // Chain Broken
                user.learningMetadata.currentStreak = 1;
            }
            user.learningMetadata.lastActivityDate = now;
        }
        // If it equals todayStr, they already logged activity today. Don't increment streak arbitrarily per-click.
    }

    await user.save();
    return user.learningMetadata.currentStreak;
};
