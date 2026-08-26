import api from './api';

export const aiService = {
    // Conversational Tutor
    chat: (data) => api.post('/ai/chat', data),
    getConversations: () => api.get('/ai/conversations'),
    getConversationById: (id) => api.get(`/ai/conversations/${id}`),
    deleteConversation: (id) => api.delete(`/ai/conversations/${id}`),

    // Quick Actions & Specialized Generators
    summarize: (topicId) => api.post('/ai/summarize', { topicId }),
    explain: (topicId, concept) => api.post('/ai/explain', { topicId, concept }),
    generateQuiz: (data) => api.post('/ai/generate-quiz', data),
};
