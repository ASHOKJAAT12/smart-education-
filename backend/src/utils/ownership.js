/**
 * Ownership / authorization resolution for teacher-managed content.
 *
 * Single source of truth for the rule stated in docs/spec-11-security-plan.md:
 * "Teacher can only modify resources they created (createdBy === req.user._id).
 *  Admin has full access."
 *
 * Ownership is ALWAYS derived from the authenticated user (req.user). Values
 * coming from the client (body / query / params) are never treated as proof of
 * ownership.
 *
 * Content hierarchy used to resolve authority:
 *
 *   Teacher
 *     └── Course (createdBy)
 *           ├── Subject
 *           │     └── Topic
 *           │           └── LearningResource
 *           └── Quiz / Question (own createdBy)
 *
 * Unauthorized access is reported as "not found" so a teacher cannot probe for
 * the existence of another teacher's content by ID.
 */

const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const LearningResource = require('../models/LearningResource');
const { notFound } = require('./AppError');

const isAdmin = (user) => user?.role === 'admin';

/**
 * Mongo filter fragment restricting a query to content owned by the
 * authenticated user. Admins are intentionally unrestricted.
 *
 * @param {object} user req.user
 * @param {string} [field] ownership field on the model ('createdBy' | 'uploadedBy')
 * @returns {object} `{}` for admins, `{ [field]: user._id }` otherwise
 */
const ownerFilter = (user, field = 'createdBy') => (isAdmin(user) ? {} : { [field]: user._id });

/**
 * IDs of the courses the user may manage.
 * @returns {Promise<Array|null>} null means "no restriction" (admin)
 */
const getOwnedCourseIds = async (user) => {
    if (isAdmin(user)) return null;
    const courses = await Course.find({ createdBy: user._id }).select('_id').lean();
    return courses.map((c) => c._id);
};

/** IDs of the subjects living under courses the user may manage. */
const getOwnedSubjectIds = async (user) => {
    if (isAdmin(user)) return null;
    const courseIds = await getOwnedCourseIds(user);
    const subjects = await Subject.find({ courseId: { $in: courseIds } }).select('_id').lean();
    return subjects.map((s) => s._id);
};

/** IDs of the topics living under courses the user may manage. */
const getOwnedTopicIds = async (user) => {
    if (isAdmin(user)) return null;
    const subjectIds = await getOwnedSubjectIds(user);
    const topics = await Topic.find({ subjectId: { $in: subjectIds } }).select('_id').lean();
    return topics.map((t) => t._id);
};

/**
 * Load a course the user is allowed to manage.
 * @throws AppError 404 when it does not exist OR belongs to somebody else
 */
const getAuthorizedCourse = async (courseId, user, { select } = {}) => {
    const query = Course.findOne({ _id: courseId, ...ownerFilter(user) });
    if (select) query.select(select);
    const course = await query;
    if (!course) throw notFound('Course');
    return course;
};

/** True when the user may manage the given course. */
const ownsCourse = async (courseId, user) => {
    if (isAdmin(user)) return Boolean(await Course.exists({ _id: courseId }));
    return Boolean(await Course.exists({ _id: courseId, createdBy: user._id }));
};

/**
 * Load a subject whose PARENT COURSE the user is allowed to manage.
 * Checking `subject.createdBy` alone is not sufficient: authority over a
 * subject follows the course it belongs to.
 */
const getAuthorizedSubject = async (subjectId, user) => {
    const subject = await Subject.findById(subjectId);
    if (!subject) throw notFound('Subject');
    if (isAdmin(user)) return subject;
    if (!(await ownsCourse(subject.courseId, user))) throw notFound('Subject');
    return subject;
};

/** Load a topic whose Subject → Course chain the user is allowed to manage. */
const getAuthorizedTopic = async (topicId, user) => {
    const topic = await Topic.findById(topicId);
    if (!topic) throw notFound('Topic');
    if (isAdmin(user)) return topic;

    const subject = await Subject.findById(topic.subjectId).select('courseId');
    if (!subject) throw notFound('Topic');
    if (!(await ownsCourse(subject.courseId, user))) throw notFound('Topic');
    return topic;
};

/**
 * Load a learning resource the user may manage.
 *
 * A resource is manageable when the user uploaded it OR when it hangs off a
 * topic inside one of their courses (ownership inherited from the hierarchy).
 */
const getAuthorizedResource = async (resourceId, user, { withPublicId = false } = {}) => {
    const query = LearningResource.findById(resourceId);
    if (withPublicId) query.select('+publicId');
    const resource = await query;
    if (!resource) throw notFound('Resource');
    if (isAdmin(user)) return resource;

    if (resource.uploadedBy?.toString() === user._id.toString()) return resource;

    // Inherit authority directly from the Course.
    if (resource.courseId && (await ownsCourse(resource.courseId, user))) return resource;

    // Fallback for older legacy schema resources lacking explicit courseId.
    if (resource.topicId) {
        const topic = await Topic.findById(resource.topicId).select('subjectId');
        if (topic) {
            const subject = await Subject.findById(topic.subjectId).select('courseId');
            if (subject && (await ownsCourse(subject.courseId, user))) return resource;
        }
    }

    throw notFound('Resource');
};

module.exports = {
    isAdmin,
    ownerFilter,
    ownsCourse,
    getOwnedCourseIds,
    getOwnedSubjectIds,
    getOwnedTopicIds,
    getAuthorizedCourse,
    getAuthorizedSubject,
    getAuthorizedTopic,
    getAuthorizedResource,
};
