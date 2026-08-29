const asyncHandler = require('../middleware/asyncHandler');
const Course = require('../models/Course');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter } = require('../utils/queryHelper');
const { ownerFilter, isAdmin, getAuthorizedCourse } = require('../utils/ownership');
const { uploadThumbnail, deleteFile } = require('../services/cloudinaryService');

// ─── GET /courses ──────────────────────────────────────────────────────────
/**
 * Visibility rules:
 *  - owner-scoped request (teacher management, e.g. GET /teacher/courses):
 *      only courses owned by the authenticated user, drafts included.
 *  - admin: everything.
 *  - teacher browsing the catalogue: published courses plus their own drafts —
 *      never another teacher's unpublished content.
 *  - student / anonymous: existing student-access policy, unchanged.
 */
const getCourses = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const filter = buildContentFilter(req.query, {});
    const publishedRequested = req.query.published !== undefined;

    if (req.ownerScoped) {
        // Ownership comes from the authenticated user only — never from the query.
        Object.assign(filter, ownerFilter(req.user));
        if (!publishedRequested) delete filter.isPublished;
    } else if (isAdmin(req.user)) {
        if (!publishedRequested) delete filter.isPublished;
    } else if (req.user && req.user.role === 'teacher') {
        delete filter.isPublished;
        filter.$and = [
            ...(filter.$and || []),
            { $or: [{ isPublished: true }, { createdBy: req.user._id }] },
        ];
    } else if (req.user && req.user.role === 'student') {
        // Hackathon configuration (pre-existing): students may browse the whole
        // catalogue during onboarding. Left unchanged deliberately.
        delete filter.isPublished;
    }

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
    // Owner-scoped detail (teacher management): ownership is part of the query,
    // so another teacher's course is indistinguishable from a missing one.
    if (req.ownerScoped) {
        const owned = await getAuthorizedCourse(req.params.id, req.user, { select: '-publicId' });
        await owned.populate([
            { path: 'createdBy', select: 'firstName lastName' },
            {
                path: 'subjects',
                select: 'name description order isPublished',
                options: { sort: { order: 1 } },
            },
        ]);
        return successResponse(res, owned, 'Course fetched');
    }

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

    // Unpublished courses are visible to admins and to the owning teacher only.
    const ownerId = course.createdBy?._id || course.createdBy;
    const isOwner = req.user && ownerId && ownerId.toString() === req.user._id.toString();
    if (!course.isPublished && !isAdmin(req.user) && !isOwner) {
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

    // Only whitelisted fields are accepted. A client-supplied createdBy is
    // ignored: the authenticated user always becomes the owner.
    const { title, description, category, level } = req.body;

    const course = await Course.create({
        title,
        description,
        category,
        level,
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

    // Ownership is enforced inside the query, so knowing an id is not enough.
    const course = await getAuthorizedCourse(req.params.id, req.user, { select: '+publicId' });

    const WHITELIST = ['title', 'description', 'category', 'level'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) course[field] = req.body[field];
    });

    // Only admins can publish
    if (req.body.isPublished !== undefined && isAdmin(req.user)) {
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
    const course = await getAuthorizedCourse(req.params.id, req.user, { select: '+publicId' });

    if (course.publicId) await deleteFile(course.publicId, 'image').catch(() => { });
    await course.deleteOne();

    return successResponse(res, null, 'Course deleted');
});

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse };
