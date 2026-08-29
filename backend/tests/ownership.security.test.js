/**
 * Teacher content-isolation security tests.
 *
 * Proves that a teacher can only see and mutate content they own, while admins
 * keep full access and students keep the publication-based access policy.
 *
 * Runs the real Express app over HTTP against the configured MongoDB. Every
 * fixture name is prefixed with PREFIX and removed in cleanup(), so no
 * pre-existing data is modified.
 *
 * Usage (from backend/):  npm run test:security
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const app = require('../src/app');
const { signAccessToken } = require('../src/utils/jwt');

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Subject = require('../src/models/Subject');
const Topic = require('../src/models/Topic');
const LearningResource = require('../src/models/LearningResource');
const Question = require('../src/models/Question');
const Quiz = require('../src/models/Quiz');

const PREFIX = 'sectest-isolation';
const PASSWORD = 'SecTest1234';

let baseUrl;
let server;
const created = {
    users: [], courses: [], subjects: [], topics: [], resources: [], questions: [], quizzes: [],
};

const results = [];
const record = (name, passed, detail = '') => {
    results.push({ name, passed, detail });
    console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const expectStatus = (name, res, expected) => {
    const list = Array.isArray(expected) ? expected : [expected];
    record(name, list.includes(res.status), `got ${res.status}, expected ${list.join('/')}`);
};

/** Minimal HTTP helper returning { status, body }. */
const call = async (method, path, { token, body } = {}) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    let parsed = null;
    try {
        parsed = await res.json();
    } catch {
        parsed = null;
    }
    return { status: res.status, body: parsed };
};

const makeUser = async (label, role) => {
    const user = await User.create({
        name: `${PREFIX} ${label}`,
        email: `${PREFIX}-${label}@example.com`.toLowerCase(),
        password: PASSWORD,
        role,
        isActive: true,
    });
    return { user, token: signAccessToken({ id: user._id.toString(), role }) };
};

const seedFixtures = async (teacherA) => {
    const course = await Course.create({
        title: `${PREFIX} Data Structures`,
        description: 'Owned by teacher A for isolation testing.',
        category: 'Computer Science',
        level: 'beginner',
        isPublished: false,
        createdBy: teacherA.user._id,
    });
    created.courses.push(course._id);

    const subject = await Subject.create({
        name: `${PREFIX} Trees`,
        courseId: course._id,
        isPublished: false,
        createdBy: teacherA.user._id,
    });
    created.subjects.push(subject._id);

    const topic = await Topic.create({
        name: `${PREFIX} AVL Rotations`,
        subjectId: subject._id,
        isPublished: false,
        createdBy: teacherA.user._id,
    });
    created.topics.push(topic._id);

    const resource = await LearningResource.create({
        title: `${PREFIX} Rotation notes`,
        type: 'link',
        url: 'https://example.com/avl',
        courseId: course._id,
        topicId: topic._id,
        uploadedBy: teacherA.user._id,
        isPublished: false,
    });
    created.resources.push(resource._id);

    const question = await Question.create({
        question: `${PREFIX} Which rotation fixes a left-left imbalance?`,
        options: ['Right rotation', 'Left rotation', 'No rotation', 'Double rotation'],
        correctAnswer: 0,
        topicId: topic._id,
        subjectId: subject._id,
        isPublished: false,
        createdBy: teacherA.user._id,
    });
    created.questions.push(question._id);

    const quiz = await Quiz.create({
        title: `${PREFIX} AVL quiz`,
        durationMinutes: 20,
        passingScore: 60,
        questions: [question._id],
        topicId: topic._id,
        subjectId: subject._id,
        isPublished: false,
        createdBy: teacherA.user._id,
    });
    created.quizzes.push(quiz._id);

    return { course, subject, topic, resource, question, quiz };
};

/** Publish a course for the student-visibility check. */
const publishCourse = (courseId) => Course.updateOne({ _id: courseId }, { isPublished: true });

const cleanup = async () => {
    await Promise.all([
        Quiz.deleteMany({ title: new RegExp(`^${PREFIX}`) }),
        Question.deleteMany({ question: new RegExp(`^${PREFIX}`) }),
        LearningResource.deleteMany({ title: new RegExp(`^${PREFIX}`) }),
        Topic.deleteMany({ name: new RegExp(`^${PREFIX}`) }),
        Subject.deleteMany({ name: new RegExp(`^${PREFIX}`) }),
        Course.deleteMany({ title: new RegExp(`^${PREFIX}`) }),
        User.deleteMany({ email: new RegExp(`^${PREFIX}`) }),
    ]);
};

const api = {
    PREFIX, PASSWORD, call, makeUser, seedFixtures, publishCourse, record, expectStatus, results,
};

module.exports = api;

// ─── Runner ────────────────────────────────────────────────────────────────
if (require.main === module) {
    const runCases = require('./ownership.security.cases');

    (async () => {
        let exitCode = 0;
        try {
            await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
            console.log('db connected');

            server = app.listen(0);
            await new Promise((resolve) => server.once('listening', resolve));
            baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
            console.log(`test server on ${baseUrl}`);

            // Start from a clean slate in case a previous run aborted.
            await cleanup();
            console.log('fixtures reset\n');
            await runCases(api);

            const failed = results.filter((r) => !r.passed);
            console.log(`\n${results.length - failed.length}/${results.length} security checks passed.`);
            if (failed.length) {
                console.error(`\n${failed.length} check(s) FAILED:`);
                failed.forEach((f) => console.error(`  - ${f.name} (${f.detail})`));
                exitCode = 1;
            } else {
                console.log('ALL_ISOLATION_CHECKS_PASSED');
            }
        } catch (err) {
            console.error('Test run crashed:', err);
            exitCode = 1;
        } finally {
            await cleanup().catch((err) => console.error('Cleanup failed:', err.message));
            if (server) server.close();
            await mongoose.disconnect().catch(() => { });
        }
        process.exit(exitCode);
    })();
}

