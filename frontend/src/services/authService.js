import api, { setAccessToken, clearAccessToken } from './api';

/**
 * Auth API service — all HTTP calls for authentication.
 */

/**
 * Register a new student account.
 * @param {{ name, email, password }} data
 */
export const register = async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
};

/**
 * Login with email + password.
 * @param {{ email, password }} credentials
 */
export const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
};

/**
 * Logout — invalidates refresh token on the server.
 */
export const logout = async () => {
    const res = await api.post('/auth/logout');
    return res.data;
};

/**
 * Request a password reset email.
 * @param {string} email
 */
export const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
};

/**
 * Reset password with the token from the email link.
 * @param {{ token, password }} data
 */
export const resetPassword = async (data) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
};

/**
 * Fetch the authenticated user's profile.
 */
export const getMe = async () => {
    const res = await api.get('/users/me');
    return res.data;
};

/**
 * Update the authenticated user's profile.
 * @param {object} updates
 */
export const updateMe = async (updates) => {
    const res = await api.patch('/users/me', updates);
    return res.data;
};
