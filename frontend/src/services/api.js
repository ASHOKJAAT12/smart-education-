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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// ─── Response Interceptor ─────────────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            // If the failure is from the refresh endpoint itself, we must abort
            if (original.url.includes('/auth/refresh')) {
                window.dispatchEvent(new Event('auth:logout'));
                return Promise.reject(error);
            }

            original._retry = true;

            if (isRefreshing) {
                // If a refresh is already in progress, queue this request
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        original.headers.Authorization = `Bearer ${token}`;
                        return api(original);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            isRefreshing = true;

            try {
                // Call the new refresh endpoint
                const { data } = await axios.get(`${BASE_URL}/api/v1/auth/refresh`, {
                    withCredentials: true // Extremely important to send httpOnly cookie
                });

                const newAccessToken = data.data.accessToken;

                // Update in-memory token
                setAccessToken(newAccessToken);
                // The SessionStorage backup used for cross-tab or initial boot
                sessionStorage.setItem('sl_access_token', newAccessToken);

                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                original.headers.Authorization = `Bearer ${newAccessToken}`;

                // Process the queued requests
                processQueue(null, newAccessToken);

                return api(original);
            } catch (err) {
                // Refresh failed completely
                processQueue(err, null);
                window.dispatchEvent(new Event('auth:logout'));
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
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
