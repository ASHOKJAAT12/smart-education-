const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

// ─── Reusable helpers ─────────────────────────────────────────────────────

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const objectIdMsg = 'Must be a valid MongoDB ObjectId';

const difficultyEnum = ['easy', 'medium', 'hard'];

// ─── Course ───────────────────────────────────────────────────────────────

const createCourseValidators = [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }).withMessage('Max 120 characters'),
    body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }).withMessage('Max 1000 characters'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Level must be beginner, intermediate, or advanced'),
];

const updateCourseValidators = [
    body('title').optional().trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3–120 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Max 1000 characters'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
];

// ─── Subject ──────────────────────────────────────────────────────────────

const createSubjectValidators = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Max 100 characters'),
    body('courseId').notEmpty().withMessage('courseId is required')
        .custom(isValidObjectId).withMessage(objectIdMsg),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Max 500 characters'),
    body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
];

const updateSubjectValidators = [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Max 500 characters'),
    body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
];

// ─── Topic ────────────────────────────────────────────────────────────────

const createTopicValidators = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Max 100 characters'),
    body('subjectId').notEmpty().withMessage('subjectId is required')
        .custom(isValidObjectId).withMessage(objectIdMsg),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Max 1000 characters'),
    body('order').optional().isInt({ min: 0 }).withMessage('Non-negative integer'),
    body('difficulty').optional().isIn(difficultyEnum).withMessage('Must be easy, medium, or hard'),
    body('estimatedMinutes').optional().isInt({ min: 1, max: 300 }).withMessage('Must be 1–300 minutes'),
];

const updateTopicValidators = [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Max 1000 characters'),
    body('order').optional().isInt({ min: 0 }).withMessage('Non-negative integer'),
    body('difficulty').optional().isIn(difficultyEnum).withMessage('Must be easy, medium, or hard'),
    body('estimatedMinutes').optional().isInt({ min: 1, max: 300 }).withMessage('Must be 1–300 minutes'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
];

// ─── Learning Resource ────────────────────────────────────────────────────

const createResourceValidators = [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }).withMessage('Max 150 characters'),
    body('topicId').notEmpty().withMessage('topicId is required')
        .custom(isValidObjectId).withMessage(objectIdMsg),
    body('type').notEmpty().withMessage('Type is required')
        .isIn(['pdf', 'image', 'video', 'link', 'document']).withMessage('Must be pdf, image, video, link, or document'),
    body('url').if(body('type').equals('link')).isURL().withMessage('URL must be a valid URL for link resources'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Max 500 characters'),
];

const updateResourceValidators = [
    body('title').optional().trim().isLength({ max: 150 }).withMessage('Max 150 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Max 500 characters'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
];

// ─── Question ─────────────────────────────────────────────────────────────

const createQuestionValidators = [
    body('question').trim().notEmpty().withMessage('Question text is required').isLength({ max: 1000 }).withMessage('Max 1000 characters'),
    body('options').isArray({ min: 2, max: 6 }).withMessage('Must have 2–6 options'),
    body('options.*').isString().trim().notEmpty().withMessage('Each option must be a non-empty string'),
    body('correctAnswer').isInt({ min: 0 }).withMessage('correctAnswer must be a non-negative integer'),
    body('difficulty').optional().isIn(difficultyEnum).withMessage('Must be easy, medium, or hard'),
    body('questionType').optional().isIn(['mcq']).withMessage('Only mcq is supported'),
    body('explanation').optional().trim().isLength({ max: 2000 }).withMessage('Max 2000 characters'),
    body('subjectId').optional().custom((v) => !v || isValidObjectId(v)).withMessage(objectIdMsg),
    body('topicId').optional().custom((v) => !v || isValidObjectId(v)).withMessage(objectIdMsg),
];

const updateQuestionValidators = [
    body('question').optional().trim().isLength({ max: 1000 }).withMessage('Max 1000 characters'),
    body('options').optional().isArray({ min: 2, max: 6 }).withMessage('Must have 2–6 options'),
    body('correctAnswer').optional().isInt({ min: 0 }).withMessage('Non-negative integer'),
    body('difficulty').optional().isIn(difficultyEnum).withMessage('Must be easy, medium, or hard'),
    body('explanation').optional().trim().isLength({ max: 2000 }).withMessage('Max 2000 characters'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
];

// ─── Quiz ─────────────────────────────────────────────────────────────────

const createQuizValidators = [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }).withMessage('Max 150 characters'),
    body('durationMinutes').isInt({ min: 1, max: 180 }).withMessage('Duration must be 1–180 minutes'),
    body('passingScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Passing score must be 0–100'),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'mixed']).withMessage('Invalid difficulty'),
    body('questions').optional().isArray().withMessage('Questions must be an array'),
    body('questions.*').optional().custom(isValidObjectId).withMessage('Each question must be a valid ObjectId'),
    body('subjectId').optional().custom((v) => !v || isValidObjectId(v)).withMessage(objectIdMsg),
    body('topicId').optional().custom((v) => !v || isValidObjectId(v)).withMessage(objectIdMsg),
];

const updateQuizValidators = [
    body('title').optional().trim().isLength({ max: 150 }).withMessage('Max 150 characters'),
    body('durationMinutes').optional().isInt({ min: 1, max: 180 }).withMessage('Duration must be 1–180 minutes'),
    body('passingScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Passing score must be 0–100'),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'mixed']).withMessage('Invalid difficulty'),
    body('questions').optional().isArray().withMessage('Must be an array'),
    body('questions.*').optional().custom(isValidObjectId).withMessage('Must be a valid ObjectId'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
];

module.exports = {
    createCourseValidators,
    updateCourseValidators,
    createSubjectValidators,
    updateSubjectValidators,
    createTopicValidators,
    updateTopicValidators,
    createResourceValidators,
    updateResourceValidators,
    createQuestionValidators,
    updateQuestionValidators,
    createQuizValidators,
    updateQuizValidators,
};
