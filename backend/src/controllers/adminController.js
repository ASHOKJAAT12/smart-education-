const adminService = require('../services/admin.service');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

exports.getPlatformHealth = asyncHandler(async (req, res, next) => {
    // Determine database readiness natively from mongoose
    const dbState = mongoose.connection.readyState === 1 ? 'healthy' : 'degraded';

    // Evaluate external providers cleanly (without leaking keys)
    const aiConfigured = !!process.env.AI_API_KEY;
    const cloudinaryConfigured = !!process.env.CLOUDINARY_API_KEY;
    const emailConfigured = !!(process.env.SMTP_HOST || process.env.EMAIL_HOST);

    return successResponse(res, {
        api: 'healthy',
        database: dbState,
        ai: aiConfigured ? 'configured' : 'offline',
        cloudinary: cloudinaryConfigured ? 'configured' : 'offline',
        email: emailConfigured ? 'configured' : 'offline'
    }, 'Platform health validated');
});

exports.getPlatformMetrics = asyncHandler(async (req, res, next) => {
    const metrics = await adminService.getGlobalMetrics();
    return successResponse(res, metrics, 'Platform metrics retrieved successfully');
});

exports.getPlatformUsers = asyncHandler(async (req, res, next) => {
    const users = await adminService.getPlatformUsers(req.query);
    return successResponse(res, users, 'Users retrieved');
});

exports.updateUserStatus = asyncHandler(async (req, res, next) => {
    const { isActive } = req.body;
    const user = await adminService.updateUserStatus(req.params.id, isActive);

    // Rigorously log the privileged mutation
    await AuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: req.params.id,
        ipAddress: req.ip
    });

    return successResponse(res, user, 'User status successfully updated');
});

exports.updateUserRole = asyncHandler(async (req, res, next) => {
    const { role } = req.body;
    const user = await adminService.updateUserRole(req.params.id, role);

    await AuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'ROLE_CHANGED',
        entityType: 'User',
        entityId: req.params.id,
        metadata: { assignedRole: role },
        ipAddress: req.ip
    });

    return successResponse(res, user, 'User role successfully updated');
});

exports.getAuditLogs = asyncHandler(async (req, res, next) => {
    const logs = await adminService.fetchAuditLogs(req.query);
    return successResponse(res, logs, 'System audit logs retrieved');
});
