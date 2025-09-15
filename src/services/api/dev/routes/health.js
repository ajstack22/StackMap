/**
 * Health Check Routes for StackMap Dev API
 *
 * Provides comprehensive health monitoring endpoints:
 * - System health (CPU, memory, uptime)
 * - Database connectivity and performance
 * - Redis connectivity and cache status
 * - API performance metrics
 * - External service dependencies
 * - Overall service status
 */

const express = require('express');
const { validationMiddleware } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const healthController = require('../controllers/healthController');

const router = express.Router();

/**
 * @route   GET /api/dev/v1/health
 * @desc    Basic health check - quick response for load balancers
 * @access  Public (no authentication required)
 * @response 200 - Service is healthy
 * @response 503 - Service is unhealthy
 */
router.get(
    '/',
    asyncHandler(healthController.basicHealthCheck)
);

/**
 * @route   GET /api/dev/v1/health/system
 * @desc    Detailed system health information
 * @access  Public
 * @query   include - Array of components to include (system, database, redis, metrics)
 * @query   format - Response format (json, prometheus)
 * @response 200 - System health details
 * @response 503 - One or more systems are unhealthy
 */
router.get(
    '/system',
    validationMiddleware.health.getSystemHealth,
    asyncHandler(healthController.getSystemHealth)
);

/**
 * @route   GET /api/dev/v1/health/database
 * @desc    Database connectivity and performance health
 * @access  Public
 * @response 200 - Database is healthy
 * @response 503 - Database is unhealthy
 */
router.get(
    '/database',
    asyncHandler(healthController.getDatabaseHealth)
);

/**
 * @route   GET /api/dev/v1/health/redis
 * @desc    Redis connectivity and cache performance
 * @access  Public
 * @response 200 - Redis is healthy
 * @response 503 - Redis is unhealthy
 */
router.get(
    '/redis',
    asyncHandler(healthController.getRedisHealth)
);

/**
 * @route   GET /api/dev/v1/health/metrics
 * @desc    API performance metrics and statistics
 * @access  Public
 * @response 200 - Metrics information
 */
router.get(
    '/metrics',
    asyncHandler(healthController.getMetricsHealth)
);

/**
 * @route   GET /api/dev/v1/health/dependencies
 * @desc    External service dependencies health
 * @access  Public
 * @response 200 - All dependencies are healthy
 * @response 503 - One or more dependencies are unhealthy
 */
router.get(
    '/dependencies',
    asyncHandler(healthController.getDependenciesHealth)
);

/**
 * @route   GET /api/dev/v1/health/detailed
 * @desc    Comprehensive health report with all components
 * @access  Public
 * @response 200 - Detailed health report
 * @response 503 - Service is unhealthy
 */
router.get(
    '/detailed',
    asyncHandler(healthController.getDetailedHealth)
);

/**
 * @route   GET /api/dev/v1/health/prometheus
 * @desc    Health metrics in Prometheus format
 * @access  Public
 * @response 200 - Prometheus metrics
 */
router.get(
    '/prometheus',
    asyncHandler(healthController.getPrometheusMetrics)
);

module.exports = router;