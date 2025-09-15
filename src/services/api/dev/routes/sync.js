/**
 * Sync Monitoring Routes for StackMap Dev API
 *
 * Provides comprehensive sync system monitoring endpoints:
 * - Sync status monitoring for individual sync groups
 * - Global sync statistics and performance metrics
 * - Sync diagnostics and troubleshooting information
 * - Sync audit logs and activity tracking
 * - Sync error analysis and reporting
 */

const express = require('express');
const { validationMiddleware } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const syncController = require('../controllers/syncController');

const router = express.Router();

/**
 * @route   GET /api/dev/v1/sync/status/:syncId
 * @desc    Get detailed status for a specific sync group
 * @access  Private (requires 'read' permission)
 * @param   syncId - 32-character hex sync ID
 * @response 200 - Sync status information
 * @response 404 - Sync group not found
 */
router.get(
    '/status/:syncId',
    requirePermission('read'),
    validationMiddleware.sync.getStatus,
    asyncHandler(syncController.getSyncStatus)
);

/**
 * @route   GET /api/dev/v1/sync/stats
 * @desc    Get global sync statistics and performance metrics
 * @access  Private (requires 'read' permission)
 * @query   start - Start date for time range (ISO 8601)
 * @query   end - End date for time range (ISO 8601)
 * @query   period - Predefined time period (1h, 6h, 24h, 7d, 30d)
 * @query   page - Page number for pagination (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @response 200 - Sync statistics
 */
router.get(
    '/stats',
    requirePermission('read'),
    validationMiddleware.sync.getStats,
    asyncHandler(syncController.getSyncStats)
);

/**
 * @route   GET /api/dev/v1/sync/diagnostics/:syncId
 * @desc    Get detailed diagnostics for sync troubleshooting
 * @access  Private (requires 'read' permission)
 * @param   syncId - 32-character hex sync ID
 * @query   includeData - Include actual sync data in response (default: false)
 * @query   depth - Diagnostic depth level 1-5 (default: 3)
 * @response 200 - Sync diagnostics information
 * @response 404 - Sync group not found
 */
router.get(
    '/diagnostics/:syncId',
    requirePermission('read'),
    validationMiddleware.sync.getDiagnostics,
    asyncHandler(syncController.getSyncDiagnostics)
);

/**
 * @route   GET /api/dev/v1/sync/audit
 * @desc    Get sync audit logs and activity tracking
 * @access  Private (requires 'read' permission)
 * @query   start - Start date for time range (ISO 8601)
 * @query   end - End date for time range (ISO 8601)
 * @query   period - Predefined time period (1h, 6h, 24h, 7d, 30d)
 * @query   syncId - Filter by specific sync ID
 * @query   action - Filter by action type (create, update, delete, read)
 * @query   userId - Filter by user ID
 * @query   page - Page number for pagination (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @response 200 - Sync audit logs
 */
router.get(
    '/audit',
    requirePermission('read'),
    validationMiddleware.sync.getAuditLog,
    asyncHandler(syncController.getSyncAuditLog)
);

/**
 * @route   GET /api/dev/v1/sync/errors
 * @desc    Get sync error analysis and reporting
 * @access  Private (requires 'read' permission)
 * @query   start - Start date for time range (ISO 8601)
 * @query   end - End date for time range (ISO 8601)
 * @query   period - Predefined time period (1h, 6h, 24h, 7d, 30d)
 * @query   severity - Filter by error severity (low, medium, high, critical)
 * @query   type - Filter by error type
 * @query   page - Page number for pagination (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @response 200 - Sync error analysis
 */
router.get(
    '/errors',
    requirePermission('read'),
    asyncHandler(syncController.getSyncErrors)
);

/**
 * @route   GET /api/dev/v1/sync/performance
 * @desc    Get sync performance metrics and trends
 * @access  Private (requires 'read' permission)
 * @query   start - Start date for time range (ISO 8601)
 * @query   end - End date for time range (ISO 8601)
 * @query   period - Predefined time period (1h, 6h, 24h, 7d, 30d)
 * @query   metric - Specific metric to analyze (latency, throughput, errors)
 * @response 200 - Sync performance metrics
 */
router.get(
    '/performance',
    requirePermission('read'),
    asyncHandler(syncController.getSyncPerformance)
);

/**
 * @route   GET /api/dev/v1/sync/active
 * @desc    Get currently active sync operations
 * @access  Private (requires 'read' permission)
 * @response 200 - Active sync operations
 */
router.get(
    '/active',
    requirePermission('read'),
    asyncHandler(syncController.getActiveSyncOperations)
);

/**
 * @route   POST /api/dev/v1/sync/test/:syncId
 * @desc    Test sync connectivity and performance for a specific sync group
 * @access  Private (requires 'write' permission)
 * @param   syncId - 32-character hex sync ID
 * @response 200 - Sync test results
 * @response 404 - Sync group not found
 */
router.post(
    '/test/:syncId',
    requirePermission('write'),
    asyncHandler(syncController.testSyncConnectivity)
);

/**
 * @route   GET /api/dev/v1/sync/summary
 * @desc    Get high-level sync system summary
 * @access  Private (requires 'read' permission)
 * @response 200 - Sync system summary
 */
router.get(
    '/summary',
    requirePermission('read'),
    asyncHandler(syncController.getSyncSummary)
);

module.exports = router;