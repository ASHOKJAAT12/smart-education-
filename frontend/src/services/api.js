import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Centralized Axios instance for all SmartLearn API calls.
 *
 * - Automatically attaches the Authorization header when an access token exists.
 * - Silently refreshes the token on 401 responses (Phase 2: will be fully wired).
 * - Normalises error messages for consistent UI error handling.
 */
const api = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    withCredentials: true,  // required for httpOnly refresh-token cookie
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// ─── In-memory access token store ─────────────────────────────────────────
// Tokens are kept in memory (not localStorage) to prevent XSS attacks.
let _accessToken = null;

export const setAccessToken = (token) => { _accessToken = token; };
export const clearAccessToken = () => { _accessToken = null; };

// ─── Request Interceptor ──────────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        if (_accessToken) {
            config.headers.Authorization = `Bearer ${_accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        // Silent token refresh on 401 (Phase 2 will fully implement this)
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            // Phase 2: attempt refresh here
        }

        // Normalise error message
        const message =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'An unexpected error occurred';

        error.userMessage = message;
        return Promise.reject(error);
    }
);

export default api;
