import api from './api';

/**
 * Health service — checks that the backend API is reachable.
 */
export const checkHealth = async () => {
    const response = await api.get('/health');
    return response.data;
};
