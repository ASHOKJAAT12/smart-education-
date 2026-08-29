const asyncHandler = require('../middleware/asyncHandler');
const LearningResource = require('../models/LearningResource');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter } = require('../utils/queryHelper');
const {
    isAdmin,
    getOwnedTopicIds,
    getAuthorizedResource,
    getAuthorizedTopic,
} = require('../utils/ownership');
const { notFound } = require('../utils/AppError');
const { uploadResource, deleteFile } = require('../services/cloudinaryService');

// ─── GET /resources ────────────────────────────────────────────────────────
const getResources = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const filter = buildContentFilter(req.query, {});
    const publishedRequested = req.query.published !== undefined;

    if (req.ownerScoped && !isAdmin(req.user)) {
        // Resources the teacher uploaded, or that hang off their own courses.
        const topicIds = await getOwnedTopicIds(req.user);
        filter.$and = [
            ...(filter.$and || []),
            { $or: [{ uploadedBy: req.user._id }, { topicId: { $in: topicIds } }] },
        ];
        if (!publishedRequested) delete filter.isPublished;
    } else if (isAdmin(req.user)) {
        if (!publishedRequested) delete filter.isPublished;
    } else if (req.user && req.user.role === 'teacher') {
        const topicIds = await getOwnedTopicIds(req.user);
        delete filter.isPublished;
        filter.$and = [
            ...(filter.$and || []),
            {
                $or: [
                    { isPublished: true },
                    { uploadedBy: req.user._id },
                    { topicId: { $in: topicIds } },
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

    const { type, topicId, title, description } = req.body;
    let url = req.body.url || null;
    let publicId = null;

    // Resources may only be attached to a topic inside the teacher's own course.
    // getAuthorizedTopic throws 404 for someone else's topic.
    await getAuthorizedTopic(topicId, req.user);

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
        topicId,
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

    const WHITELIST = ['title', 'description'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) resource[field] = req.body[field];
    });

    if (req.body.isPublished !== undefined && isAdmin(req.user)) {
        resource.isPublished = req.body.isPublished;
    }

    // Replace file if a new one is uploaded
    if (req.file) {
        if (resource.publicId) await deleteFile(resource.publicId, resource.type === 'image' ? 'image' : 'raw').catch(() => { });
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
        const resType = resource.type === 'image' ? 'image' : resource.type === 'video' ? 'video' : 'raw';
        await deleteFile(resource.publicId, resType).catch(() => { });
    }

    await resource.deleteOne();
    return successResponse(res, null, 'Resource deleted');
});

module.exports = { getResources, getResourceById, createResource, updateResource, deleteResource };
