const { body } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validators for all auth endpoints.
 * Uses express-validator chained rules.
 * Run through the validate() util in the controller.
 */

/**
 * POST /auth/register
 */
const registerValidators = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

/**
 * POST /auth/login
 */
const loginValidators = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),
];

/**
 * POST /auth/forgot-password
 */
const forgotPasswordValidators = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
];

/**
 * POST /auth/reset-password
 */
const resetPasswordValidators = [
    body('token')
        .notEmpty().withMessage('Reset token is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

/**
 * PATCH /users/me
 */
const updateMeValidators = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
    body('course').optional().trim(),
    body('semester').optional().trim(),
    body('learningGoal').optional().trim(),
    body('dailyStudyTime')
        .optional()
        .isInt({ min: 0, max: 1440 }).withMessage('Daily study time must be 0–1440 minutes'),
];

/**
 * POST /users/onboarding
 */
const onboardingValidators = [
    body('courseId')
        .optional({ nullable: true })
        .custom((val) => !val || mongoose.isValidObjectId(val))
        .withMessage('courseId must be a valid ID'),

    body('subjects')
        .optional({ nullable: true })
        .isArray().withMessage('subjects must be an array')
        .custom((arr) => arr.every((id) => mongoose.isValidObjectId(id)))
        .withMessage('Each subject must be a valid ID'),

    body('semester')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 20 }).withMessage('Semester must be at most 20 characters'),

    body('learningGoal')
        .optional({ nullable: true })
        .isIn(['exam_prep', 'deepen_knowledge', 'career', 'revision'])
        .withMessage('Invalid learning goal'),

    body('dailyStudyTime')
        .optional({ nullable: true })
        .isInt({ min: 15, max: 480 }).withMessage('Daily study time must be 15–480 minutes'),
];

module.exports = {
    registerValidators,
    loginValidators,
    forgotPasswordValidators,
    resetPasswordValidators,
    updateMeValidators,
    onboardingValidators,
};
