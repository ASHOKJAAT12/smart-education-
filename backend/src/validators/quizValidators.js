const { body, param } = require('express-validator');
const { AI_LIMITS } = require('../config/constants');

/**
 * Validators for quiz execution (start / submit / results).
 *
 * These run before the controller so malformed payloads are rejected with a
 * 400 + structured details rather than reaching Mongoose or the grading logic.
 */

const objectId = (name, location = param) =>
    location(name).isMongoId().withMessage(`${name} must be a valid id`);

const startQuizValidators = [objectId('id')];

const submitQuizValidators = [
    objectId('attemptId'),

    body('answers')
        .isArray({ max: 200 })
        .withMessage('answers must be an array of at most 200 entries'),

    body('answers.*.questionId')
        .isMongoId()
        .withMessage('Each answer must reference a valid questionId'),

    // selectedOption is the ZERO-BASED index of the chosen option.
    // null / absent means "not answered", which is explicitly allowed.
    body('answers.*.selectedOption')
        .optional({ nullable: true })
        .isInt({ min: 0, max: 20 })
        .withMessage('selectedOption must be a non-negative option index')
        .toInt(),
];

const attemptIdValidators = [objectId('attemptId')];

/** Practice sessions are graded per-question against the same index contract. */
const practiceSubmitValidators = [
    body('topicId').isMongoId().withMessage('topicId must be a valid id'),
    body('answers').isArray({ max: 100 }).withMessage('answers must be an array'),
    body('answers.*.questionId').isMongoId().withMessage('Invalid questionId'),
    body('answers.*.selectedOption')
        .optional({ nullable: true })
        .isInt({ min: 0, max: 20 })
        .withMessage('selectedOption must be a non-negative option index')
        .toInt(),
];

/** AI quiz generation limits mirror the constants used by the AI service. */
const aiQuizValidators = [
    body('topicId').isMongoId().withMessage('topicId must be a valid id'),
    body('questionCount')
        .optional()
        .isInt({ min: AI_LIMITS.MIN_QUESTION_COUNT, max: AI_LIMITS.MAX_QUESTION_COUNT })
        .withMessage(
            `questionCount must be between ${AI_LIMITS.MIN_QUESTION_COUNT} and ${AI_LIMITS.MAX_QUESTION_COUNT}`
        )
        .toInt(),
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('difficulty must be easy, medium or hard'),
];

module.exports = {
    startQuizValidators,
    submitQuizValidators,
    attemptIdValidators,
    practiceSubmitValidators,
    aiQuizValidators,
};
