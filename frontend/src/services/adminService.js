import api from './api';

export const adminService = {
    getPlatformHealth: () => api.get('/admin/health'),
    getPlatformMetrics: () => api.get('/admin/dashboard/metrics'),

    getPlatformUsers: () => api.get('/admin/users'),
    updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
    updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),

    getAuditLogs: () => api.get('/admin/audit-logs')
};
