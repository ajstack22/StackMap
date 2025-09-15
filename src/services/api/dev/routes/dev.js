/**
 * Development Routes for StackMap Dev API
 *
 * Provides development and debugging endpoints:
 * - Test data generation
 * - Debug information
 * - Environment status
 * - Testing utilities
 */

const express = require('express');
const { validationMiddleware } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const devController = require('../controllers/devController');

const router = express.Router();

/**
 * @route   POST /api/dev/v1/dev/test-data
 * @desc    Generate test data for development
 * @access  Private (requires 'write' permission)
 */
router.post(
    '/test-data',
    requirePermission('write'),
    validationMiddleware.dev.generateTestData,
    asyncHandler(devController.generateTestData)
);

/**
 * @route   GET /api/dev/v1/dev/debug
 * @desc    Get debug information
 * @access  Private (requires 'write' permission)
 */
router.get(
    '/debug',
    requirePermission('write'),
    validationMiddleware.dev.debugInfo,
    asyncHandler(devController.getDebugInfo)
);

module.exports = router;