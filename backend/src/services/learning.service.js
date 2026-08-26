const Recommendation = require('../models/Recommendation');
const Topic = require('../models/Topic');

/**
 * Figures out the absolute most intelligent next physical UI route for the student to visit.
 */
exports.getNextBestAction = async (studentId) => {
    // The undisputed deterministic truth comes from Phase 6 Priority Engine
    const topRec = await Recommendation.findOne({ studentId, isCompleted: false })
        .sort({ priorityScore: -1 })
        .populate('topicId', 'name subjectId');

    if (!topRec || !topRec.topicId) {
        return {
            message: "You are entirely caught up!",
            actionType: "explore",
            route: "/student/courses"
        };
    }

    // Identify if they should "Learn" or "Practice" based on raw mastery metrics embedded inside the recommendation
    // Wait, Recommendation doesn't hold 'mastery' directly, it calculates Priority based on it.
    // If it's the highest priority, we push them into Practice by default if it's a retention struggle, 
    // or Learn if it's a completely blind initial concept. 
    // Since we don't carry mastery on Rec, let's strictly push to /learn as the canonical hub.

    return {
        message: `Priority: Master ${topRec.topicId.name}`,
        actionType: "learn",
        route: `/student/topics/${topRec.topicId._id}/learn`,
        topicData: topRec.topicId
    };
};
