import api from './api';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const register = (data) => api.post('/auth/register', data).then((r) => r.data);

export const login = (credentials) => api.post('/auth/login', credentials).then((r) => r.data);

export const logout = () => api.post('/auth/logout').then((r) => r.data);

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = (data) => api.post('/auth/reset-password', data).then((r) => r.data);

// ─── User profile ─────────────────────────────────────────────────────────────

export const getMe = () => api.get('/users/me').then((r) => r.data);

export const updateMe = (updates) => api.patch('/users/me', updates).then((r) => r.data);

// ─── Phase 4 — Onboarding & Dashboard ────────────────────────────────────────

export const getOnboardingStatus = () => api.get('/users/onboarding-status').then((r) => r.data);

export const completeOnboarding = (data) => api.post('/users/onboarding', data).then((r) => r.data);

export const getDashboard = () => api.get('/student/dashboard').then((r) => r.data);

export const uploadAvatar = (formData) =>
    api.patch('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
