import api from './api';

export const quizService = {
    getQuizzes: (params) => api.get('/quizzes', { params }),
    getQuizById: (id) => api.get(`/quizzes/${id}`),
    startQuiz: (id) => api.post(`/quizzes/${id}/start`),
    submitQuiz: (attemptId, data) => api.post(`/quizzes/attempts/${attemptId}/submit`, data),
    getAttempt: (attemptId) => api.get(`/quizzes/attempts/${attemptId}`)
};

export const learningService = {
    getTopicLearning: (id) => api.get(`/topics/${id}/learning`),
    startPractice: (id) => api.post(`/topics/${id}/practice/start`),
    getProgressAnalytics: () => api.get('/progress'),
    getQuizHistory: () => api.get('/progress/quiz-history')
};
