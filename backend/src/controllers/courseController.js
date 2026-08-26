const asyncHandler = require('../middleware/asyncHandler');
const Course = require('../models/Course');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter, isOwnerOrAdmin } = require('../utils/queryHelper');
const { uploadThumbnail, deleteFile } = require('../services/cloudinaryService');

// ─── GET /courses ──────────────────────────────────────────────────────────
const getCourses = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);

    // Students / anonymous: see only published. Teachers/admins: can pass ?published=all
    const canSeeAll = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    const defaults = canSeeAll ? {} : { isPublished: true };
    const filter = buildContentFilter(req.query, defaults);

    const [courses, total] = await Promise.all([
        Course.find(filter)
            .select('-publicId')
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit),
        Course.countDocuments(filter),
    ]);

    return paginatedResponse(res, courses, buildPaginationMeta(total, pagination), 'Courses fetched');
});

// ─── GET /courses/:id ──────────────────────────────────────────────────────
const getCourseById = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id)
        .select('-publicId')
        .populate('createdBy', 'firstName lastName')
        .populate({
            path: 'subjects',
            select: 'name description order isPublished',
            options: { sort: { order: 1 } },
        });

    if (!course) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
    }

    // Students can only see published courses
    const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    if (!course.isPublished && !isPrivileged) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
    }

    return successResponse(res, course, 'Course fetched');
});

// ─── POST /courses ─────────────────────────────────────────────────────────
const createCourse = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    let thumbnail = null;
    let publicId = null;

    // Optional thumbnail upload
    if (req.file) {
        const uploaded = await uploadThumbnail(req.file.buffer);
        thumbnail = uploaded.url;
        publicId = uploaded.publicId;
    }

    const course = await Course.create({
        ...req.body,
        thumbnail,
        publicId,
        isPublished: false, // always start unpublished
        createdBy: req.user._id,
    });

    return successResponse(res, course, 'Course created', 201);
});

// ─── PATCH /courses/:id ────────────────────────────────────────────────────
const updateCourse = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const course = await Course.findById(req.params.id);
    if (!course) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(course, req.user)) {
        const err = new Error('You do not have permission to edit this course');
        err.statusCode = 403;
        throw err;
    }

    const WHITELIST = ['title', 'description', 'category', 'level'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) course[field] = req.body[field];
    });

    // Only admins can publish
    if (req.body.isPublished !== undefined && req.user.role === 'admin') {
        course.isPublished = req.body.isPublished;
    }

    // Replace thumbnail if file provided
    if (req.file) {
        if (course.publicId) await deleteFile(course.publicId, 'image').catch(() => { });
        const uploaded = await uploadThumbnail(req.file.buffer);
        course.thumbnail = uploaded.url;
        course.publicId = uploaded.publicId;
    }

    await course.save();
    course.publicId = undefined; // strip from response
    return successResponse(res, course, 'Course updated');
});

// ─── DELETE /courses/:id ───────────────────────────────────────────────────
const deleteCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id).select('+publicId');
    if (!course) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
    }

    if (!isOwnerOrAdmin(course, req.user)) {
        const err = new Error('You do not have permission to delete this course');
        err.statusCode = 403;
        throw err;
    }

    if (course.publicId) await deleteFile(course.publicId, 'image').catch(() => { });
    await course.deleteOne();

    return successResponse(res, null, 'Course deleted');
});

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse };
