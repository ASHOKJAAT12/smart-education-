/**
 * Query helper utilities — reusable pagination and filter building.
 * Used across all education resource endpoints.
 */

/**
 * Parse pagination params from request query.
 * @param {object} query - req.query
 * @returns {{ page, limit, skip }}
 */
const parsePagination = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Build a pagination response envelope.
 * @param {Array} items
 * @param {number} total - total matching documents
 * @param {object} pagination - { page, limit }
 * @returns {object}
 */
const buildPaginationMeta = (total, pagination) => ({
    page: pagination.page,
    limit: pagination.limit,
    totalItems: total,
    totalPages: Math.ceil(total / pagination.limit),
});

/**
 * Build a MongoDB filter for education content.
 * Handles isPublished, difficulty, category, level, courseId, subjectId, topicId.
 *
 * @param {object} query - req.query
 * @param {object} defaults - { isPublished: true } for student views
 * @returns {object} MongoDB filter
 */
const buildContentFilter = (query, defaults = {}) => {
    const filter = { ...defaults };

    // Published filter
    if (query.published === 'all') {
        delete filter.isPublished; // admin/teacher: see all
    } else if (query.published === 'false') {
        filter.isPublished = false;
    } else if (!('isPublished' in filter)) {
        filter.isPublished = true; // default to published
    }

    // RelationID filters
    if (query.courseId) filter.courseId = query.courseId;
    if (query.subjectId) filter.subjectId = query.subjectId;
    if (query.topicId) filter.topicId = query.topicId;

    // Attribute filters
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.category) filter.category = new RegExp(query.category, 'i');
    if (query.level) filter.level = query.level;
    if (query.type) filter.type = query.type;

    // Text search (basic — Phase 4+ can add Atlas Search)
    if (query.search) {
        filter.$or = [
            { title: new RegExp(query.search, 'i') },
            { name: new RegExp(query.search, 'i') },
            { description: new RegExp(query.search, 'i') },
        ];
    }

    return filter;
};

/**
 * Check ownership: returns true if the user is admin OR owns the resource.
 *
 * @deprecated Prefer the helpers in utils/ownership.js. They resolve authority
 * through the content hierarchy (Course → Subject → Topic → Resource) and put
 * ownership inside the database query, which this function cannot do.
 *
 * @param {object} resource - Mongoose document with createdBy or uploadedBy
 * @param {object} user - req.user
 */
const isOwnerOrAdmin = (resource, user) => {
    if (user.role === 'admin') return true;
    const ownerId = resource.createdBy || resource.uploadedBy;
    return ownerId && ownerId.toString() === user._id.toString();
};

module.exports = { parsePagination, buildPaginationMeta, buildContentFilter, isOwnerOrAdmin };
