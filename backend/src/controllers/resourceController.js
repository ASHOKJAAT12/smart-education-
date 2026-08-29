const asyncHandler = require('../middleware/asyncHandler');
const LearningResource = require('../models/LearningResource');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter } = require('../utils/queryHelper');
const {
    isAdmin,
    getAuthorizedCourse,
    getAuthorizedSubject,
    getAuthorizedResource,
    getAuthorizedTopic,
} = require('../utils/ownership');
const { notFound, badRequest } = require('../utils/AppError');
const { uploadResource, deleteFile } = require('../services/cloudinaryService');

// ─── GET /resources ────────────────────────────────────────────────────────
const getResources = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const filter = buildContentFilter(req.query, {});
    const publishedRequested = req.query.published !== undefined;

    if (req.ownerScoped && !isAdmin(req.user)) {
        // Resources the teacher uploaded, or that hang off their own courses. (Handled natively by courseId field)
        const Subject = require('../models/Subject');
        const Course = require('../models/Course');
        const courseIds = (await Course.find({ createdBy: req.user._id }).select('_id').lean()).map(c => c._id);

        filter.$and = [
            ...(filter.$and || []),
            { $or: [{ uploadedBy: req.user._id }, { courseId: { $in: courseIds } }] },
        ];
        if (!publishedRequested) delete filter.isPublished;
    } else if (isAdmin(req.user)) {
        if (!publishedRequested) delete filter.isPublished;
    } else if (req.user && req.user.role === 'teacher') {
        const Course = require('../models/Course');
        const courseIds = (await Course.find({ createdBy: req.user._id }).select('_id').lean()).map(c => c._id);
        delete filter.isPublished;
        filter.$and = [
            ...(filter.$and || []),
            {
                $or: [
                    { isPublished: true },
                    { uploadedBy: req.user._id },
                    { courseId: { $in: courseIds } },
                ],
            },
        ];
    } else if (!publishedRequested) {
        filter.isPublished = true;
    }

    const [resources, total] = await Promise.all([
        LearningResource.find(filter)
            .select('-publicId')
            .populate('topicId', 'name subjectId')
            .populate('uploadedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit),
        LearningResource.countDocuments(filter),
    ]);

    return paginatedResponse(res, resources, buildPaginationMeta(total, pagination), 'Resources fetched');
});

// ─── GET /resources/:id ────────────────────────────────────────────────────
const getResourceById = asyncHandler(async (req, res) => {
    // Owner-scoped detail: resolve authority through the content hierarchy.
    if (req.ownerScoped) {
        const owned = await getAuthorizedResource(req.params.id, req.user);
        await owned.populate([
            { path: 'topicId', select: 'name' },
            { path: 'uploadedBy', select: 'firstName lastName' },
        ]);
        return successResponse(res, owned, 'Resource fetched');
    }

    const resource = await LearningResource.findById(req.params.id)
        .select('-publicId')
        .populate('topicId', 'name')
        .populate('uploadedBy', 'firstName lastName');

    if (!resource) throw notFound('Resource');

    if (!resource.isPublished && !isAdmin(req.user)) {
        // Unpublished resources are only visible to the admin or the owner.
        const ownerId = resource.uploadedBy?._id || resource.uploadedBy;
        const isOwner = req.user && ownerId && ownerId.toString() === req.user._id.toString();
        if (!isOwner) throw notFound('Resource');
    }

    return successResponse(res, resource, 'Resource fetched');
});

// ─── POST /resources ───────────────────────────────────────────────────────
const createResource = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    const { type, courseId, subjectId, topicId, title, description, order } = req.body;
    let url = req.body.url || null;
    let publicId = null;

    if (!courseId) throw badRequest('Course ID is required');

    // Authority over course
    await getAuthorizedCourse(courseId, req.user);

    // Structural validations to prevent tampering
    if (subjectId) {
        const Subject = require('../models/Subject');
        const subject = await Subject.findById(subjectId);
        if (!subject || subject.courseId.toString() !== courseId.toString()) throw badRequest('Invalid subject for this course');
    }

    if (topicId) {
        const Topic = require('../models/Topic');
        const Subject = require('../models/Subject');
        const topic = await Topic.findById(topicId);
        if (!topic) throw badRequest('Topic not found');
        const subject = await Subject.findById(topic.subjectId);
        if (!subject || subject.courseId.toString() !== courseId.toString()) throw badRequest('Invalid topic for this course');
    }

    if (type === 'link') {
        // For links, URL must be provided in body — no file upload
        if (!url) {
            const err = new Error('URL is required for link resources');
            err.statusCode = 400;
            throw err;
        }
    } else {
        // For file-based resources, req.file must be present
        if (!req.file) {
            const err = new Error('File upload is required for this resource type');
            err.statusCode = 400;
            throw err;
        }
        const uploaded = await uploadResource(req.file.buffer, type);
        url = uploaded.url;
        publicId = uploaded.publicId;
    }

    const resource = await LearningResource.create({
        title,
        description,
        type,
        url,
        publicId,
        courseId,
        subjectId: subjectId || null,
        topicId: topicId || null,
        order: Number(order) || 0,
        uploadedBy: req.user._id,
        isPublished: false,
    });

    return successResponse(res, { ...resource.toObject(), publicId: undefined }, 'Resource created', 201);
});

// ─── PATCH /resources/:id ──────────────────────────────────────────────────
const updateResource = asyncHandler(async (req, res) => {
    const { hasErrors } = validate(req, res);
    if (hasErrors) return;

    // Authority: uploader, or the owner of the parent course hierarchy.
    const resource = await getAuthorizedResource(req.params.id, req.user, { withPublicId: true });

    const WHITELIST = ['title', 'description', 'courseId', 'subjectId', 'topicId', 'order', 'isPublished'];

    // Check if new structural elements are valid
    if (req.body.topicId) {
        const Topic = require('../models/Topic');
        const Subject = require('../models/Subject');
        const topic = await Topic.findById(req.body.topicId);
        const subject = topic ? await Subject.findById(topic.subjectId) : null;
        if (!subject || subject.courseId.toString() !== (req.body.courseId || resource.courseId).toString()) {
            throw badRequest('Invalid topic structure assignment');
        }
    }

    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) resource[field] = req.body[field];
    });

    // Replace file if a new one is uploaded
    if (req.file) {
        if (resource.publicId) {
            const resType = resource.type === 'video' ? 'video' : (resource.type === 'document' ? 'raw' : 'image');
            await deleteFile(resource.publicId, resType).catch(() => { });
        }
        const uploaded = await uploadResource(req.file.buffer, resource.type);
        resource.url = uploaded.url;
        resource.publicId = uploaded.publicId;
    }

    await resource.save();
    return successResponse(res, { ...resource.toObject(), publicId: undefined }, 'Resource updated');
});

// ─── DELETE /resources/:id ─────────────────────────────────────────────────
const deleteResource = asyncHandler(async (req, res) => {
    const resource = await getAuthorizedResource(req.params.id, req.user, { withPublicId: true });

    // Clean up Cloudinary asset
    if (resource.publicId) {
        const resType = resource.type === 'video' ? 'video' : (resource.type === 'document' ? 'raw' : 'image');
        await deleteFile(resource.publicId, resType).catch(() => { });
    }

    await resource.deleteOne();
    return successResponse(res, null, 'Resource deleted');
});

// ─── GET /courses/:courseId/materials ──────────────────────────────────────
const getCourseMaterials = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    if (!courseId) throw badRequest('Course ID is required');

    // Scoped resolution
    if (req.ownerScoped && !isAdmin(req.user)) {
        await getAuthorizedCourse(courseId, req.user);
    }

    const filter = { courseId };

    // Students/Public routes hide anything not explicitly published.
    // However, if the requested is ownerScoped, or requester is Admin, it shows EVERYTHING (Drafts + Published)
    if (!req.ownerScoped && !isAdmin(req.user)) {
        filter.isPublished = true;
    }

    const resources = await LearningResource.find(filter)
        .select('-publicId')
        .sort({ order: 1, createdAt: -1 });

    return successResponse(res, resources, 'Course materials fetched');
});

// ─── PUBLISH TOGGLES ───────────────────────────────────────────────────────
const togglePublish = asyncHandler(async (req, res, status) => {
    const resource = await getAuthorizedResource(req.params.id, req.user);
    resource.isPublished = status;
    await resource.save();
    return successResponse(res, { ...resource.toObject(), publicId: undefined }, `Resource ${status ? 'published' : 'unpublished'} successfully`);
});
const publishResource = (req, res) => togglePublish(req, res, true);
const unpublishResource = (req, res) => togglePublish(req, res, false);

module.exports = {
    getResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource,
    getCourseMaterials,
    publishResource,
    unpublishResource
};
