import api from './api';

// ─── Courses ──────────────────────────────────────────────────────────────────
export const getCourses = (params = {}) => api.get('/courses', { params });
export const getCourseById = (id) => api.get(`/courses/${id}`);
export const createCourse = (formData) => api.post('/courses', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateCourse = (id, formData) => api.patch(`/courses/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteCourse = (id) => api.delete(`/courses/${id}`);
export const getCourseMaterials = (courseId) => api.get(`/courses/${courseId}/materials`);

// ─── Subjects ─────────────────────────────────────────────────────────────────
export const getSubjects = (params = {}) => api.get('/subjects', { params });
export const getSubjectById = (id) => api.get(`/subjects/${id}`);
export const createSubject = (data) => api.post('/subjects', data);
export const updateSubject = (id, data) => api.patch(`/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);

// ─── Topics ───────────────────────────────────────────────────────────────────
export const getTopics = (params = {}) => api.get('/topics', { params });
export const getTopicById = (id) => api.get(`/topics/${id}`);
export const createTopic = (data) => api.post('/topics', data);
export const updateTopic = (id, data) => api.patch(`/topics/${id}`, data);
export const deleteTopic = (id) => api.delete(`/topics/${id}`);

// ─── Resources ────────────────────────────────────────────────────────────────
export const getResources = (params = {}) => api.get('/resources', { params });
export const createResource = (formData) => api.post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateResource = (id, data) => api.patch(`/resources/${id}`, data);
export const deleteResource = (id) => api.delete(`/resources/${id}`);

// ─── Questions ────────────────────────────────────────────────────────────────
export const getQuestions = (params = {}) => api.get('/questions', { params });
export const createQuestion = (data) => api.post('/questions', data);
export const updateQuestion = (id, data) => api.patch(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export const getQuizzes = (params = {}) => api.get('/quizzes', { params });
export const getQuizById = (id) => api.get(`/quizzes/${id}`);
export const createQuiz = (data) => api.post('/quizzes', data);
export const updateQuiz = (id, data) => api.patch(`/quizzes/${id}`, data);
export const deleteQuiz = (id) => api.delete(`/quizzes/${id}`);
