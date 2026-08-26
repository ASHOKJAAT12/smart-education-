const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateUser } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');

// ─── ADMIN PERIMETER SHIELD ────────────────────────────────────────────────
// Reject absolutely any traffic that is not completely authenticated and possessing an 'admin' role.
router.use(authenticateUser);
router.use(authorizeRoles('admin'));

// ─── PLATFORM OVERVIEW ─────────────────────────────────────────────────────
router.get('/health', adminController.getPlatformHealth);
router.get('/dashboard/metrics', adminController.getPlatformMetrics);

// ─── USER MANAGEMENT EXCLUSIVES ─────────────────────────────────────────────
// (Basic GET lists could arguably be retrieved via global paths, but these might return deeper PII or inactive/banned users)
router.get('/users', adminController.getPlatformUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);

// ─── AUDIT TRAIL ────────────────────────────────────────────────────────────
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
