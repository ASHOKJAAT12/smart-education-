import api from './api';

export const learningService = {
    getRecommendations: () => api.get('/recommendations'),
    getLearningPath: () => api.get('/recommendations/path'),
    getStudyPlan: () => api.get('/study-plan/today'),
    generateStudyPlan: () => api.post('/study-plan/generate'),
    updateStudyPlanItem: (itemId, status) => api.patch(`/study-plan/${itemId}`, { status }),
};
