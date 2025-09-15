/**
 * Admin Routes for StackMap Dev API
 *
 * Provides administrative endpoints:
 * - System metrics and monitoring
 * - Configuration management
 * - Maintenance mode control
 * - Security and audit functions
 */

const express = require('express');
const { validationMiddleware } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole, requirePermission } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

/**
 * @route   GET /api/dev/v1/admin/metrics
 * @desc    Get system metrics (admin only)
 * @access  Private (requires 'admin' permission)
 */
router.get(
    '/metrics',
    requirePermission('admin'),
    validationMiddleware.admin.getMetrics,
    asyncHandler(adminController.getSystemMetrics)
);

/**
 * @route   PUT /api/dev/v1/admin/config
 * @desc    Update system configuration (admin only)
 * @access  Private (requires 'admin' permission)
 */
router.put(
    '/config',
    requirePermission('admin'),
    validationMiddleware.admin.updateConfig,
    asyncHandler(adminController.updateConfiguration)
);

/**
 * @route   POST /api/dev/v1/admin/maintenance
 * @desc    Control maintenance mode (admin only)
 * @access  Private (requires 'admin' permission)
 */
router.post(
    '/maintenance',
    requirePermission('admin'),
    validationMiddleware.admin.maintenanceMode,
    asyncHandler(adminController.setMaintenanceMode)
);

module.exports = router;