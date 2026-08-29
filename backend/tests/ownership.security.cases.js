/**
 * Isolation test cases. Driven by tests/ownership.security.test.js.
 *
 * Acceptance criteria covered:
 *   1-2   teacher list scoping
 *   3-6   cross-teacher read / update / delete / publish denial
 *   7-11  subject, topic, resource, question, quiz isolation
 *   12-13 dashboard + analytics scoping
 *   14    admin retains full access
 *   15    students still see published courses
 *   16-17 ownership on create comes from the token
 */

module.exports = async function runCases(api) {
    const { call, makeUser, seedFixtures, publishCourse, record, expectStatus } = api;

    const teacherA = await makeUser('teacher-a', 'teacher');
    const teacherB = await makeUser('teacher-b', 'teacher');
    const admin = await makeUser('admin', 'admin');
    const student = await makeUser('student', 'student');

    const fx = await seedFixtures(teacherA);
    const courseId = fx.course._id.toString();

    // ── Test 1: Teacher A sees their own course ────────────────────────────
    const aList = await call('GET', '/teacher/courses?limit=50', { token: teacherA.token });
    const aIds = (aList.body?.data || []).map((c) => c._id);
    record('T1 Teacher A sees own course in /teacher/courses', aIds.includes(courseId));

    // ── Test 2: Teacher B does NOT see it ─────────────────────────────────
    const bList = await call('GET', '/teacher/courses?limit=50', { token: teacherB.token });
    const bIds = (bList.body?.data || []).map((c) => c._id);
    record("T2 Teacher B cannot see Teacher A's course in the list", !bIds.includes(courseId));

    // A query-string ownership hint must not widen the scope.
    const spoof = await call('GET', `/teacher/courses?createdBy=${teacherA.user._id}&limit=50`, {
        token: teacherB.token,
    });
    const spoofIds = (spoof.body?.data || []).map((c) => c._id);
    record('T2b createdBy query param cannot widen teacher scope', !spoofIds.includes(courseId));

    // ── Test 3: direct read by id is denied ───────────────────────────────
    expectStatus('T3 Teacher B GET course by id → 404',
        await call('GET', `/teacher/courses/${courseId}`, { token: teacherB.token }), 404);

    // ── Test 4: update denied ─────────────────────────────────────────────
    expectStatus('T4 Teacher B PATCH course → 404',
        await call('PATCH', `/teacher/courses/${courseId}`, {
            token: teacherB.token, body: { title: 'hijacked title' },
        }), 404);

    // ── Test 5: delete denied ─────────────────────────────────────────────
    expectStatus('T5 Teacher B DELETE course → 404',
        await call('DELETE', `/teacher/courses/${courseId}`, { token: teacherB.token }), 404);

    // ── Test 6: publish denied ────────────────────────────────────────────
    expectStatus('T6 Teacher B cannot publish the course',
        await call('PATCH', `/teacher/courses/${courseId}`, {
            token: teacherB.token, body: { isPublished: true },
        }), 404);

    // Even the owner cannot self-publish (pre-existing rule: admins publish).
    const selfPublish = await call('PATCH', `/teacher/courses/${courseId}`, {
        token: teacherA.token, body: { isPublished: true },
    });
    record('T6b Owner publish request does not flip isPublished',
        selfPublish.status === 200 && selfPublish.body?.data?.isPublished === false);

    // ── Test 7: subject isolation ─────────────────────────────────────────
    const subjectId = fx.subject._id.toString();
    expectStatus('T7 Teacher B PATCH subject → 404',
        await call('PATCH', `/teacher/subjects/${subjectId}`, {
            token: teacherB.token, body: { name: 'hijacked subject' },
        }), 404);
    expectStatus('T7b Teacher B DELETE subject → 404',
        await call('DELETE', `/teacher/subjects/${subjectId}`, { token: teacherB.token }), 404);
    expectStatus('T7c Teacher B cannot add a subject to the course',
        await call('POST', '/teacher/subjects', {
            token: teacherB.token, body: { name: 'sectest-isolation intruder', courseId },
        }), [403, 404]);

    // ── Test 8: topic isolation ───────────────────────────────────────────
    const topicId = fx.topic._id.toString();
    expectStatus('T8 Teacher B PATCH topic → 404',
        await call('PATCH', `/teacher/topics/${topicId}`, {
            token: teacherB.token, body: { name: 'hijacked topic' },
        }), 404);
    expectStatus('T8b Teacher B DELETE topic → 404',
        await call('DELETE', `/teacher/topics/${topicId}`, { token: teacherB.token }), 404);
    expectStatus('T8c Teacher B cannot add a topic to the subject',
        await call('POST', '/teacher/topics', {
            token: teacherB.token, body: { name: 'sectest-isolation intruder', subjectId },
        }), [403, 404]);

    // ── Test 9: resource isolation ────────────────────────────────────────
    const resourceId = fx.resource._id.toString();
    expectStatus('T9 Teacher B GET resource → 404',
        await call('GET', `/teacher/resources/${resourceId}`, { token: teacherB.token }), 404);
    expectStatus('T9b Teacher B PATCH resource → 404',
        await call('PATCH', `/teacher/resources/${resourceId}`, {
            token: teacherB.token, body: { title: 'hijacked resource' },
        }), 404);
    expectStatus('T9c Teacher B DELETE resource → 404',
        await call('DELETE', `/teacher/resources/${resourceId}`, { token: teacherB.token }), 404);

    // ── Test 10: question isolation (drafts stay private) ─────────────────
    const questionId = fx.question._id.toString();
    const bQuestions = await call('GET', '/teacher/questions?limit=100', { token: teacherB.token });
    const bQuestionIds = (bQuestions.body?.data || []).map((q) => q._id);
    record("T10 Teacher B does not see Teacher A's question", !bQuestionIds.includes(questionId));
    expectStatus('T10b Teacher B PATCH question → 404',
        await call('PATCH', `/teacher/questions/${questionId}`, {
            token: teacherB.token, body: { isPublished: true },
        }), 404);
    expectStatus('T10c Teacher B DELETE question → 404',
        await call('DELETE', `/teacher/questions/${questionId}`, { token: teacherB.token }), 404);

    // ── Test 11: quiz isolation ───────────────────────────────────────────
    const quizId = fx.quiz._id.toString();
    const bQuizzes = await call('GET', '/teacher/quizzes?limit=50', { token: teacherB.token });
    const bQuizIds = (bQuizzes.body?.data || []).map((q) => q._id);
    record("T11 Teacher B does not see Teacher A's quiz", !bQuizIds.includes(quizId));
    expectStatus('T11b Teacher B PATCH quiz → 404',
        await call('PATCH', `/teacher/quizzes/${quizId}`, {
            token: teacherB.token, body: { durationMinutes: 1, passingScore: 0 },
        }), 404);
    expectStatus('T11c Teacher B DELETE quiz → 404',
        await call('DELETE', `/teacher/quizzes/${quizId}`, { token: teacherB.token }), 404);


    // ── Test 12/13: dashboard + analytics are teacher-scoped ──────────────
    const aDash = await call('GET', '/teacher/dashboard', { token: teacherA.token });
    const bDash = await call('GET', '/teacher/dashboard', { token: teacherB.token });
    record('T12 Teacher A dashboard counts their course',
        (aDash.body?.data?.metrics?.courses || 0) >= 1,
        `courses=${aDash.body?.data?.metrics?.courses}`);
    record('T13 Teacher B dashboard does not count it',
        (bDash.body?.data?.metrics?.courses || 0) === 0,
        `courses=${bDash.body?.data?.metrics?.courses}`);

    const bStudents = await call('GET', '/teacher/students', { token: teacherB.token });
    record('T13b Teacher B student analytics is empty',
        (bStudents.body?.data?.students || []).length === 0);

    // ── Test 14: admin keeps full access ──────────────────────────────────
    const adminList = await call('GET', '/teacher/courses?limit=100', { token: admin.token });
    const adminIds = (adminList.body?.data || []).map((c) => c._id);
    record('T14 Admin sees the course in the management list', adminIds.includes(courseId));
    expectStatus('T14b Admin can read the course by id',
        await call('GET', `/teacher/courses/${courseId}`, { token: admin.token }), 200);
    const adminPublish = await call('PATCH', `/teacher/courses/${courseId}`, {
        token: admin.token, body: { isPublished: true },
    });
    record('T14c Admin can publish the course',
        adminPublish.status === 200 && adminPublish.body?.data?.isPublished === true);

    // ── Test 15: students still see published courses ─────────────────────
    await publishCourse(fx.course._id);
    const studentList = await call('GET', '/courses?limit=100', { token: student.token });
    const studentIds = (studentList.body?.data || []).map((c) => c._id);
    record('T15 Student sees the published course', studentIds.includes(courseId));
    expectStatus('T15b Student can read the published course by id',
        await call('GET', `/courses/${courseId}`, { token: student.token }), 200);

    // ── Test 16: ownership on create comes from the token, not the body ────
    const forged = await call('POST', '/teacher/courses', {
        token: teacherB.token,
        body: {
            title: 'sectest-isolation forged owner',
            description: 'Attempts to set createdBy to teacher A.',
            category: 'Computer Science',
            createdBy: teacherA.user._id.toString(),
        },
    });
    record('T16 Created course is owned by the authenticated teacher',
        forged.status === 201 && String(forged.body?.data?.createdBy) === String(teacherB.user._id),
        `status=${forged.status} createdBy=${forged.body?.data?.createdBy}`);

    // ── Test 17: the reverse direction is isolated too ─────────────────────
    const aListAfter = await call('GET', '/teacher/courses?limit=50', { token: teacherA.token });
    const aIdsAfter = (aListAfter.body?.data || []).map((c) => c._id);
    record("T17 Teacher A does not see Teacher B's new course",
        !aIdsAfter.includes(String(forged.body?.data?._id)));
};

