/**
 * Analytics Routes for StackMap Dev API
 *
 * Provides comprehensive analytics and reporting endpoints:
 * - API usage analytics and trends
 * - Performance metrics and monitoring
 * - User behavior analysis
 * - Error rate analysis and reporting
 * - Custom metric tracking
 */

const express = require('express');
const { validationMiddleware } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

/**
 * @route   GET /api/dev/v1/analytics/usage
 * @desc    Get API usage analytics and trends
 * @access  Private (requires 'read' permission)
 */
router.get(
    '/usage',
    requirePermission('read'),
    validationMiddleware.analytics.getUsage,
    asyncHandler(analyticsController.getUsageAnalytics)
);

/**
 * @route   GET /api/dev/v1/analytics/performance
 * @desc    Get API performance metrics
 * @access  Private (requires 'read' permission)
 */
router.get(
    '/performance',
    requirePermission('read'),
    validationMiddleware.analytics.getPerformance,
    asyncHandler(analyticsController.getPerformanceAnalytics)
);

/**
 * @route   GET /api/dev/v1/analytics/users/:userId
 * @desc    Get user-specific analytics
 * @access  Private (requires 'read' permission)
 */
router.get(
    '/users/:userId',
    requirePermission('read'),
    validationMiddleware.analytics.getUserAnalytics,
    asyncHandler(analyticsController.getUserAnalytics)
);

module.exports = router;