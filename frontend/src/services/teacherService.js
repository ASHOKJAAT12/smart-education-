import api from './api';

/**
 * Teacher-scoped API surface.
 *
 * These endpoints are enforced server-side to return only content owned by the
 * authenticated teacher (admins see everything). The UI must use these rather
 * than the public /courses, /subjects, ... routes for management screens — the
 * frontend never filters unauthorized data itself.
 */
export const teacherService = {
    getDashboardMetrics: () => api.get('/teacher/dashboard'),
    getStudentAnalytics: () => api.get('/teacher/students'),

    // ─── Courses ─────────────────────────────────────────────────────────────
    getTeacherCourses: (params = {}) => api.get('/teacher/courses', { params }),
    getTeacherCourseById: (id) => api.get(`/teacher/courses/${id}`),
    createCourse: (formData) =>
        api.post('/teacher/courses', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    updateCourse: (id, formData) =>
        api.patch(`/teacher/courses/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteCourse: (id) => api.delete(`/teacher/courses/${id}`),

    // ─── Subjects / Topics ───────────────────────────────────────────────────
    getSubjects: (params = {}) => api.get('/teacher/subjects', { params }),
    createSubject: (data) => api.post('/teacher/subjects', data),
    updateSubject: (id, data) => api.patch(`/teacher/subjects/${id}`, data),
    deleteSubject: (id) => api.delete(`/teacher/subjects/${id}`),

    getTopics: (params = {}) => api.get('/teacher/topics', { params }),
    createTopic: (data) => api.post('/teacher/topics', data),
    updateTopic: (id, data) => api.patch(`/teacher/topics/${id}`, data),
    deleteTopic: (id) => api.delete(`/teacher/topics/${id}`),

    // ─── Questions ───────────────────────────────────────────────────────────
    getTeacherQuestions: (params = {}) => api.get('/teacher/questions', { params }),
    updateQuestion: (id, data) => api.patch(`/teacher/questions/${id}`, data),
    deleteQuestion: (id) => api.delete(`/teacher/questions/${id}`),

    // ─── Quizzes ─────────────────────────────────────────────────────────────
    getQuizzes: (params = {}) => api.get('/teacher/quizzes', { params }),
    createQuiz: (data) => api.post('/teacher/quizzes', data),
    updateQuiz: (id, data) => api.patch(`/teacher/quizzes/${id}`, data),
    deleteQuiz: (id) => api.delete(`/teacher/quizzes/${id}`),

    // ─── Materials ───────────────────────────────────────────────────────────
    getCourseMaterials: (courseId) => api.get(`/teacher/courses/${courseId}/materials`),
    createMaterial: (formData) => api.post('/teacher/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    updateMaterial: (id, formData) => api.patch(`/teacher/resources/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteMaterial: (id) => api.delete(`/teacher/resources/${id}`),
    publishMaterial: (id) => api.patch(`/teacher/resources/${id}/publish`),
    unpublishMaterial: (id) => api.patch(`/teacher/resources/${id}/unpublish`),

    generateQuestions: (data) => api.post('/ai/generate-quiz', data), // ownership bound to the caller's token
};
