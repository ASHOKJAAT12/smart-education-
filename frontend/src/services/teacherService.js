import api from './api';

export const teacherService = {
    getDashboardMetrics: () => api.get('/teacher/dashboard'),
    getStudentAnalytics: () => api.get('/teacher/students'),

    // Content endpoints automatically map to standard routes strictly filtered by ownership in Phase 9 design
    getTeacherCourses: () => api.get('/teacher/courses'),
    getTeacherQuestions: () => api.get('/teacher/questions'),
    updateQuestion: (id, data) => api.patch(`/teacher/questions/${id}`, data),
    deleteQuestion: (id) => api.delete(`/teacher/questions/${id}`),
    generateQuestions: (data) => api.post('/ai/generate-quiz', data), // Shared service logic inherently bound by tokens
};
