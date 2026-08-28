const { body, param } = require('express-validator');
const { AI_LIMITS } = require('../config/constants');

/**
 * Validators for AI endpoints.
 *
 * These enforce request-size and question-count ceilings at the edge, before any
 * provider call is made — an oversized or malformed request should cost nothing.
 */

const chatValidators = [
    body('message')
        .isString()
        .withMessage('message must be text')
        .bail()
        .trim()
        .isLength({ min: 1, max: AI_LIMITS.MAX_MESSAGE_CHARS })
        .withMessage(`message must be between 1 and ${AI_LIMITS.MAX_MESSAGE_CHARS} characters`),

    body('conversationId').optional({ nullable: true }).isMongoId().withMessage('Invalid conversationId'),
    body('topicId').optional({ nullable: true }).isMongoId().withMessage('Invalid topicId'),
];

const conversationIdValidators = [param('id').isMongoId().withMessage('Invalid conversation id')];

const summarizeValidators = [body('topicId').isMongoId().withMessage('topicId must be a valid id')];

const explainValidators = [
    body('topicId').isMongoId().withMessage('topicId must be a valid id'),
    body('concept')
        .isString()
        .withMessage('concept must be text')
        .bail()
        .trim()
        .isLength({ min: 1, max: AI_LIMITS.MAX_CONCEPT_CHARS })
        .withMessage(`concept must be between 1 and ${AI_LIMITS.MAX_CONCEPT_CHARS} characters`),
];

const generateQuizValidators = [
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
    chatValidators,
    conversationIdValidators,
    summarizeValidators,
    explainValidators,
    generateQuizValidators,
};
