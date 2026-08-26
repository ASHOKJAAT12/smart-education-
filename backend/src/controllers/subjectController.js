const asyncHandler = require('../middleware/asyncHandler');
const Subject = require('../models/Subject');
const Course = require('../models/Course');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter, isOwnerOrAdmin } = require('../utils/queryHelper');

// ─── GET /subjects ─────────────────────────────────────────────────────────
const getSubjects = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const canSeeAll = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    const defaults = canSeeAll ? {} : { isPublished: true };
    const filter = buildContentFilter(req.query, defaults);

    const [subjects, total] = await Promise.all([
        Subject.find(filter)
            .populate('courseId', 'title')
            .populate('createdBy', 'firstName lastName')
            .sort({ order: 1, createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit),
        Subject.countDocuments(filter),
    ]);

    return paginatedResponse(res, subjects, buildPaginationMeta(total, pagination), 'Subjects fetched');
});

// ─── GET /subjects/:id ─────────────────────────────────────────────────────
const getSubjectById = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id)
        .populate('courseId', 'title level')
        .populate('createdBy', 'firstName lastName')
        .populate({
            path: 'topics',
            select: 'name description order difficulty estimatedMinutes isPublished',
            options: { sort: { order: 1 } },
        });

    if (!subject) {
        const err = new Error('Subject not found');
        err.statusCode = 404;
        throw err;
    }

    const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    if (!subject.isPublished && !isPrivileged) {
        const err = new Error('Subject not found');
        err.statusCode = 404;
        throw err;
    }

    return successResponse(res, subject, 'Subject fetched');
});

// ─── POST /subjects ────────────────────────────────────────────────────────
const createSubject = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    // Verify the course exists
    const course = await Course.findById(req.body.courseId);
    if (!course) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
    }

    // Teachers can only add subjects to their own courses
    if (req.user.role === 'teacher' && course.createdBy.toString() !== req.user._id.toString()) {
        const err = new Error('You can only add subjects to your own courses');
        err.statusCode = 403;
        throw err;
    }

    const subject = await Subject.create({
        ...req.body,
        isPublished: false,
        createdBy: req.user._id,
    });

    return successResponse(res, subject, 'Subject created', 201);
});

// ─── PATCH /subjects/:id ───────────────────────────────────────────────────
const updateSubject = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
        const err = new Error('Subject not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(subject, req.user)) {
        const err = new Error('You do not have permission to edit this subject');
        err.statusCode = 403;
        throw err;
    }

    const WHITELIST = ['name', 'description', 'order'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) subject[field] = req.body[field];
    });

    if (req.body.isPublished !== undefined && req.user.role === 'admin') {
        subject.isPublished = req.body.isPublished;
    }

    await subject.save();
    return successResponse(res, subject, 'Subject updated');
});

// ─── DELETE /subjects/:id ──────────────────────────────────────────────────
const deleteSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
        const err = new Error('Subject not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(subject, req.user)) {
        const err = new Error('You do not have permission to delete this subject');
        err.statusCode = 403;
        throw err;
    }

    await subject.deleteOne();
    return successResponse(res, null, 'Subject deleted');
});

module.exports = { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };
