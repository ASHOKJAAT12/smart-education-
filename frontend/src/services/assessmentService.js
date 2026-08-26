import api from './api';

export const assessmentService = {
    getAvailableAssessments: async () => {
        const response = await api.get('/assessments');
        return response.data;
    },
    getAssessmentById: async (assessmentId) => {
        const response = await api.get(`/assessments/${assessmentId}`);
        return response.data;
    },
    startAssessment: async (assessmentId) => {
        const response = await api.post(`/assessments/${assessmentId}/start`);
        return response.data;
    },
    getAttempt: async (attemptId) => {
        const response = await api.get(`/assessments/attempts/${attemptId}`);
        return response.data;
    },
    submitAssessment: async (attemptId, answers) => {
        const response = await api.post(`/assessments/attempts/${attemptId}/submit`, { answers });
        return response.data;
    },
    getResult: async (attemptId) => {
        const response = await api.get(`/assessments/results/${attemptId}`);
        return response.data;
    },
    getMyResults: async (params) => {
        const response = await api.get('/assessments/my-results', { params });
        return response.data;
    }
};
