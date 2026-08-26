const asyncHandler = require('../middleware/asyncHandler');
const LearningResource = require('../models/LearningResource');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { validate } = require('../utils/validate');
const { parsePagination, buildPaginationMeta, buildContentFilter, isOwnerOrAdmin } = require('../utils/queryHelper');
const { uploadResource, deleteFile } = require('../services/cloudinaryService');

// ─── GET /resources ────────────────────────────────────────────────────────
const getResources = asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const canSeeAll = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    const defaults = canSeeAll ? {} : { isPublished: true };
    const filter = buildContentFilter(req.query, defaults);

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
    const resource = await LearningResource.findById(req.params.id)
        .select('-publicId')
        .populate('topicId', 'name')
        .populate('uploadedBy', 'firstName lastName');

    if (!resource) {
        const err = new Error('Resource not found');
        err.statusCode = 404;
        throw err;
    }

    const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    if (!resource.isPublished && !isPrivileged) {
        const err = new Error('Resource not found');
        err.statusCode = 404;
        throw err;
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

    const resource = await LearningResource.findById(req.params.id).select('+publicId');
    if (!resource) {
        const err = new Error('Resource not found');
        err.statusCode = 404;
        throw err;
    }

    // uploadedBy is the ownership field for resources
    if (req.user.role !== 'admin' && resource.uploadedBy.toString() !== req.user._id.toString()) {
        const err = new Error('You do not have permission to edit this resource');
        err.statusCode = 403;
        throw err;
    }

    const WHITELIST = ['title', 'description'];
    WHITELIST.forEach((field) => {
        if (req.body[field] !== undefined) resource[field] = req.body[field];
    });

    if (req.body.isPublished !== undefined && req.user.role === 'admin') {
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
    const resource = await LearningResource.findById(req.params.id).select('+publicId');
    if (!resource) {
        const err = new Error('Resource not found');
        err.statusCode = 404;
        throw err;
    }

    if (req.user.role !== 'admin' && resource.uploadedBy.toString() !== req.user._id.toString()) {
        const err = new Error('You do not have permission to delete this resource');
        err.statusCode = 403;
        throw err;
    }

    // Clean up Cloudinary asset
    if (resource.publicId) {
        const resType = resource.type === 'image' ? 'image' : resource.type === 'video' ? 'video' : 'raw';
        await deleteFile(resource.publicId, resType).catch(() => { });
    }

    await resource.deleteOne();
    return successResponse(res, null, 'Resource deleted');
});

module.exports = { getResources, getResourceById, createResource, updateResource, deleteResource };
