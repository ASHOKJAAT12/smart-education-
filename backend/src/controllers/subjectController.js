const asyncHandler = require('../middleware/asyncHandler');
const Subject = require('../models/Subject');
const Course = require('../models/Course');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter } = require('../utils/queryHelper');
const {
    isAdmin,
    ownsCourse,
    getOwnedCourseIds,
    getAuthorizedSubject,
} = require('../utils/ownership');
const { notFound, forbidden } = require('../utils/AppError');

// ─── GET /subjects ─────────────────────────────────────────────────────────
const getSubjects = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const filter = buildContentFilter(req.query, {});
    const publishedRequested = req.query.published !== undefined;

    if (req.ownerScoped && !isAdmin(req.user)) {
        // Restrict to subjects under the authenticated teacher's own courses.
        const courseIds = await getOwnedCourseIds(req.user);
        if (filter.courseId) {
            // A courseId was requested explicitly: honour it only if owned.
            if (!(await ownsCourse(filter.courseId, req.user))) throw notFound('Course');
        } else {
            filter.courseId = { $in: courseIds };
        }
        if (!publishedRequested) delete filter.isPublished;
    } else if (isAdmin(req.user)) {
        if (!publishedRequested) delete filter.isPublished;
    } else if (req.user && req.user.role === 'teacher') {
        // Catalogue browsing: published subjects plus the teacher's own drafts.
        const courseIds = await getOwnedCourseIds(req.user);
        delete filter.isPublished;
        filter.$and = [
            ...(filter.$and || []),
            { $or: [{ isPublished: true }, { courseId: { $in: courseIds } }] },
        ];
    } else if (!publishedRequested) {
        filter.isPublished = true;
    }

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
        .populate('courseId', 'title level createdBy')
        .populate('createdBy', 'firstName lastName')
        .populate({
            path: 'topics',
            select: 'name description order difficulty estimatedMinutes isPublished',
            options: { sort: { order: 1 } },
        });

    if (!subject) throw notFound('Subject');

    // Owner-scoped detail: only subjects under the teacher's own courses.
    if (req.ownerScoped && !isAdmin(req.user)) {
        const parentCourseOwner = subject.courseId?.createdBy;
        if (!parentCourseOwner || parentCourseOwner.toString() !== req.user._id.toString()) {
            throw notFound('Subject');
        }
        return successResponse(res, subject, 'Subject fetched');
    }

    // Drafts are visible to admins and to the owning teacher only.
    const parentOwner = subject.courseId?.createdBy;
    const isOwner = req.user && parentOwner && parentOwner.toString() === req.user._id.toString();
    if (!subject.isPublished && !isAdmin(req.user) && !isOwner) throw notFound('Subject');

    return successResponse(res, subject, 'Subject fetched');
});

// ─── POST /subjects ────────────────────────────────────────────────────────
const createSubject = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    // Teachers may only add subjects to courses they own. Admins may target any
    // existing course. Either way the course must exist.
    const course = await Course.findById(req.body.courseId).select('_id createdBy');
    if (!course) throw notFound('Course');

    if (!isAdmin(req.user) && course.createdBy.toString() !== req.user._id.toString()) {
        throw forbidden('You can only add subjects to your own courses');
    }

    const { name, description, order, courseId } = req.body;

    const subject = await Subject.create({
        name,
        description,
        order,
        courseId,
        isPublished: false,
        createdBy: req.user._id,
    });

    return successResponse(res, subject, 'Subject created', 201);
});

// ─── PATCH /subjects/:id ───────────────────────────────────────────────────
const updateSubject = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    // Authority follows the parent course, not just subject.createdBy.
    const subject = await getAuthorizedSubject(req.params.id, req.user);

    const WHITELIST = ['name', 'description', 'order'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) subject[field] = req.body[field];
    });

    if (req.body.isPublished !== undefined && isAdmin(req.user)) {
        subject.isPublished = req.body.isPublished;
    }

    await subject.save();
    return successResponse(res, subject, 'Subject updated');
});

// ─── DELETE /subjects/:id ──────────────────────────────────────────────────
const deleteSubject = asyncHandler(async (req, res) => {
    const subject = await getAuthorizedSubject(req.params.id, req.user);

    await subject.deleteOne();
    return successResponse(res, null, 'Subject deleted');
});

module.exports = { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };
