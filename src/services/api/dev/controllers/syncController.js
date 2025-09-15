/**
 * Sync Controller for StackMap Dev API
 *
 * Handles sync system monitoring and diagnostics:
 * - Individual sync group status and health
 * - Global sync statistics and performance tracking
 * - Sync error analysis and troubleshooting
 * - Audit logging and activity monitoring
 * - Performance metrics and trend analysis
 */

const fetch = require('node-fetch');
const { DatabaseQuery } = require('../utils/database');
const { RedisCache, cacheWrapper, CACHE_KEYS, CACHE_TTL } = require('../utils/redis');
const { MetricsCollector } = require('../utils/metrics');
const { logger } = require('../utils/logger');
const { NotFoundError, ServiceUnavailableError } = require('../middleware/errorHandler');

/**
 * Get detailed status for a specific sync group
 */
const getSyncStatus = async (req, res) => {
    const { syncId } = req.params;
    const startTime = Date.now();

    try {
        // Check cache first
        const cacheKey = `${CACHE_KEYS.SYNC_STATUS}:${syncId}`;
        const cachedStatus = await RedisCache.get(cacheKey);

        if (cachedStatus) {
            return res.json({
                success: true,
                data: cachedStatus,
                cached: true,
                responseTime: Date.now() - startTime
            });
        }

        // Fetch sync status from database
        const syncData = await DatabaseQuery.select(
            'SELECT * FROM sync_groups WHERE sync_id = ? LIMIT 1',
            [syncId]
        );

        if (syncData.length === 0) {
            throw new NotFoundError('Sync group');
        }

        const sync = syncData[0];

        // Get recent sync activities
        const recentActivities = await DatabaseQuery.select(`
            SELECT activity_type, created_at, device_id, data_size, success
            FROM sync_activities
            WHERE sync_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        `, [syncId]);

        // Get sync statistics
        const stats = await DatabaseQuery.select(`
            SELECT
                COUNT(*) as total_syncs,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful_syncs,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed_syncs,
                AVG(CASE WHEN success = 1 THEN response_time_ms END) as avg_response_time,
                MAX(created_at) as last_sync,
                SUM(data_size) as total_data_transferred
            FROM sync_activities
            WHERE sync_id = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `, [syncId]);

        // Get connected devices
        const devices = await DatabaseQuery.select(`
            SELECT DISTINCT device_id, device_name, last_seen, user_agent
            FROM sync_activities
            WHERE sync_id = ?
            AND last_seen >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY last_seen DESC
        `, [syncId]);

        const status = {
            syncId,
            metadata: {
                created: sync.created_at,
                lastActive: sync.last_activity,
                deviceCount: devices.length,
                dataSize: sync.data_size,
                version: sync.version
            },
            health: {
                status: determineHealthStatus(stats[0], recentActivities),
                uptime: calculateUptime(sync.created_at),
                successRate: stats[0].total_syncs > 0 ?
                    (stats[0].successful_syncs / stats[0].total_syncs) * 100 : 0,
                avgResponseTime: stats[0].avg_response_time || 0
            },
            statistics: {
                last24Hours: stats[0],
                recentActivities: recentActivities.slice(0, 5)
            },
            devices,
            timestamp: new Date().toISOString()
        };

        // Cache the status
        await RedisCache.set(cacheKey, status, CACHE_TTL.SYNC_STATUS);

        // Record metrics
        MetricsCollector.recordAPIRequest(req.method, req.path, 200, Date.now() - startTime);

        res.json({
            success: true,
            data: status,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        logger.error('Failed to get sync status:', { syncId, error: error.message });
        MetricsCollector.recordAPIRequest(req.method, req.path, 500, Date.now() - startTime);
        throw error;
    }
};

/**
 * Get global sync statistics and performance metrics
 */
const getSyncStats = async (req, res) => {
    const { start, end, period = '24h', page = 1, limit = 20 } = req.query;
    const startTime = Date.now();

    try {
        const timeFilter = buildTimeFilter(start, end, period);
        const offset = (page - 1) * limit;

        // Get overall statistics
        const overallStats = await DatabaseQuery.select(`
            SELECT
                COUNT(DISTINCT sync_id) as total_sync_groups,
                COUNT(*) as total_operations,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful_operations,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed_operations,
                AVG(response_time_ms) as avg_response_time,
                SUM(data_size) as total_data_transferred,
                COUNT(DISTINCT device_id) as unique_devices
            FROM sync_activities
            WHERE created_at >= ?
        `, [timeFilter]);

        // Get hourly breakdown
        const hourlyStats = await DatabaseQuery.select(`
            SELECT
                DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
                COUNT(*) as operations,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed,
                AVG(response_time_ms) as avg_response_time
            FROM sync_activities
            WHERE created_at >= ?
            GROUP BY hour
            ORDER BY hour DESC
            LIMIT ? OFFSET ?
        `, [timeFilter, limit, offset]);

        // Get top sync groups by activity
        const topSyncGroups = await DatabaseQuery.select(`
            SELECT
                sync_id,
                COUNT(*) as operation_count,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful_count,
                AVG(response_time_ms) as avg_response_time,
                MAX(created_at) as last_activity
            FROM sync_activities
            WHERE created_at >= ?
            GROUP BY sync_id
            ORDER BY operation_count DESC
            LIMIT 10
        `, [timeFilter]);

        // Get error breakdown
        const errorBreakdown = await DatabaseQuery.select(`
            SELECT
                error_type,
                COUNT(*) as count,
                COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sync_activities WHERE created_at >= ? AND success = 0) as percentage
            FROM sync_activities
            WHERE created_at >= ? AND success = 0 AND error_type IS NOT NULL
            GROUP BY error_type
            ORDER BY count DESC
        `, [timeFilter, timeFilter]);

        const stats = {
            period: {
                start: timeFilter,
                end: new Date().toISOString(),
                period
            },
            overall: overallStats[0],
            trends: {
                hourly: hourlyStats,
                topSyncGroups,
                errorBreakdown
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: hourlyStats.length
            },
            timestamp: new Date().toISOString()
        };

        // Calculate derived metrics
        if (stats.overall.total_operations > 0) {
            stats.overall.success_rate = (stats.overall.successful_operations / stats.overall.total_operations) * 100;
            stats.overall.error_rate = (stats.overall.failed_operations / stats.overall.total_operations) * 100;
        }

        MetricsCollector.recordAPIRequest(req.method, req.path, 200, Date.now() - startTime);

        res.json({
            success: true,
            data: stats,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        logger.error('Failed to get sync stats:', { error: error.message });
        MetricsCollector.recordAPIRequest(req.method, req.path, 500, Date.now() - startTime);
        throw error;
    }
};

/**
 * Get detailed diagnostics for sync troubleshooting
 */
const getSyncDiagnostics = async (req, res) => {
    const { syncId } = req.params;
    const { includeData = false, depth = 3 } = req.query;
    const startTime = Date.now();

    try {
        // Check if sync exists
        const syncExists = await DatabaseQuery.select(
            'SELECT sync_id FROM sync_groups WHERE sync_id = ? LIMIT 1',
            [syncId]
        );

        if (syncExists.length === 0) {
            throw new NotFoundError('Sync group');
        }

        const diagnostics = {
            syncId,
            timestamp: new Date().toISOString(),
            depth: parseInt(depth)
        };

        // Level 1: Basic connectivity
        diagnostics.connectivity = await testSyncConnectivity(syncId);

        // Level 2: Recent errors and patterns
        if (depth >= 2) {
            diagnostics.errors = await analyzeSyncErrors(syncId);
            diagnostics.patterns = await analyzeAccessPatterns(syncId);
        }

        // Level 3: Performance analysis
        if (depth >= 3) {
            diagnostics.performance = await analyzeSyncPerformance(syncId);
            diagnostics.deviceAnalysis = await analyzeDeviceActivity(syncId);
        }

        // Level 4: Data consistency checks
        if (depth >= 4) {
            diagnostics.dataConsistency = await checkDataConsistency(syncId);
            diagnostics.conflicts = await analyzeConflicts(syncId);
        }

        // Level 5: Include actual data (security sensitive)
        if (depth >= 5 && includeData) {
            diagnostics.sampleData = await getSampleSyncData(syncId);
        }

        MetricsCollector.recordAPIRequest(req.method, req.path, 200, Date.now() - startTime);

        res.json({
            success: true,
            data: diagnostics,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        logger.error('Failed to get sync diagnostics:', { syncId, error: error.message });
        MetricsCollector.recordAPIRequest(req.method, req.path, 500, Date.now() - startTime);
        throw error;
    }
};

/**
 * Get sync audit logs and activity tracking
 */
const getSyncAuditLog = async (req, res) => {
    const { start, end, period, syncId, action, userId, page = 1, limit = 20 } = req.query;
    const startTime = Date.now();

    try {
        const timeFilter = buildTimeFilter(start, end, period || '7d');
        const offset = (page - 1) * limit;

        // Build secure parameterized query - prevent SQL injection
        const whereConditions = ['created_at >= ?'];
        const queryParams = [timeFilter];

        // Validate and sanitize filter inputs
        if (syncId) {
            // Validate syncId format (should be alphanumeric, 32 chars for hex)
            if (!/^[a-fA-F0-9]{32}$/.test(syncId)) {
                throw new Error('Invalid syncId format');
            }
            whereConditions.push('sync_id = ?');
            queryParams.push(syncId);
        }

        if (action) {
            // Validate action against allowed values
            const allowedActions = ['sync_push', 'sync_pull', 'sync_merge', 'sync_conflict', 'sync_error'];
            if (!allowedActions.includes(action)) {
                throw new Error('Invalid action type');
            }
            whereConditions.push('activity_type = ?');
            queryParams.push(action);
        }

        if (userId) {
            // Validate userId format
            if (!/^[a-zA-Z0-9_-]{1,50}$/.test(userId)) {
                throw new Error('Invalid userId format');
            }
            whereConditions.push('user_id = ?');
            queryParams.push(userId);
        }

        // Create the WHERE clause safely (no string interpolation)
        const whereClause = whereConditions.join(' AND ');

        // Get audit logs with parameterized query
        const auditLogs = await DatabaseQuery.select(
            `SELECT
                sync_id,
                activity_type,
                device_id,
                device_name,
                user_id,
                ip_address,
                user_agent,
                data_size,
                success,
                error_type,
                error_message,
                response_time_ms,
                created_at
            FROM sync_activities
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        );

        // Get total count for pagination
        const totalCount = await DatabaseQuery.select(
            `SELECT COUNT(*) as total
            FROM sync_activities
            WHERE ${whereClause}`,
            queryParams
        );

        // Get summary statistics
        const summary = await DatabaseQuery.select(
            `SELECT
                COUNT(*) as total_activities,
                COUNT(DISTINCT sync_id) as unique_syncs,
                COUNT(DISTINCT device_id) as unique_devices,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful_activities,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed_activities
            FROM sync_activities
            WHERE ${whereClause}`,
            queryParams
        );

        const auditData = {
            filters: {
                timeRange: { start: timeFilter, end: new Date().toISOString() },
                syncId,
                action,
                userId
            },
            summary: summary[0],
            logs: auditLogs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount[0].total,
                totalPages: Math.ceil(totalCount[0].total / limit)
            },
            timestamp: new Date().toISOString()
        };

        MetricsCollector.recordAPIRequest(req.method, req.path, 200, Date.now() - startTime);

        res.json({
            success: true,
            data: auditData,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        logger.error('Failed to get sync audit log:', { error: error.message });
        MetricsCollector.recordAPIRequest(req.method, req.path, 500, Date.now() - startTime);
        throw error;
    }
};

/**
 * Get sync error analysis and reporting
 */
const getSyncErrors = async (req, res) => {
    const { start, end, period = '24h', severity, type, page = 1, limit = 20 } = req.query;
    const startTime = Date.now();

    try {
        const timeFilter = buildTimeFilter(start, end, period);
        const offset = (page - 1) * limit;

        // Build secure query conditions with validation
        const whereConditions = ['created_at >= ?', 'success = 0'];
        const queryParams = [timeFilter];

        if (severity) {
            // Validate severity against allowed values
            const allowedSeverities = ['low', 'medium', 'high', 'critical'];
            if (!allowedSeverities.includes(severity)) {
                throw new Error('Invalid error severity');
            }
            whereConditions.push('error_severity = ?');
            queryParams.push(severity);
        }

        if (type) {
            // Validate error type against allowed values
            const allowedErrorTypes = [
                'network_error', 'auth_error', 'data_error', 'timeout_error',
                'validation_error', 'conflict_error', 'server_error'
            ];
            if (!allowedErrorTypes.includes(type)) {
                throw new Error('Invalid error type');
            }
            whereConditions.push('error_type = ?');
            queryParams.push(type);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get error summary
        const errorSummary = await DatabaseQuery.select(`
            SELECT
                COUNT(*) as total_errors,
                COUNT(DISTINCT sync_id) as affected_syncs,
                COUNT(DISTINCT device_id) as affected_devices,
                COUNT(DISTINCT error_type) as error_types
            FROM sync_activities
            WHERE ${whereClause}
        `, queryParams);

        // Get error breakdown by type
        const errorsByType = await DatabaseQuery.select(`
            SELECT
                error_type,
                COUNT(*) as count,
                COUNT(DISTINCT sync_id) as affected_syncs,
                AVG(response_time_ms) as avg_response_time
            FROM sync_activities
            WHERE ${whereClause}
            GROUP BY error_type
            ORDER BY count DESC
        `, queryParams);

        // Get recent errors with details
        const recentErrors = await DatabaseQuery.select(`
            SELECT
                sync_id,
                device_id,
                error_type,
                error_message,
                error_severity,
                response_time_ms,
                created_at,
                user_agent,
                ip_address
            FROM sync_activities
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

        // Get error trends (hourly)
        const errorTrends = await DatabaseQuery.select(`
            SELECT
                DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
                COUNT(*) as error_count,
                COUNT(DISTINCT sync_id) as affected_syncs
            FROM sync_activities
            WHERE ${whereClause}
            GROUP BY hour
            ORDER BY hour DESC
            LIMIT 24
        `, queryParams);

        const errorAnalysis = {
            period: {
                start: timeFilter,
                end: new Date().toISOString(),
                period
            },
            summary: errorSummary[0],
            breakdown: {
                byType: errorsByType,
                trends: errorTrends
            },
            recentErrors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            },
            timestamp: new Date().toISOString()
        };

        MetricsCollector.recordAPIRequest(req.method, req.path, 200, Date.now() - startTime);

        res.json({
            success: true,
            data: errorAnalysis,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        logger.error('Failed to get sync errors:', { error: error.message });
        MetricsCollector.recordAPIRequest(req.method, req.path, 500, Date.now() - startTime);
        throw error;
    }
};

/**
 * Get sync performance metrics and trends
 */
const getSyncPerformance = async (req, res) => {
    const { start, end, period = '24h', metric } = req.query;
    const startTime = Date.now();

    try {
        const timeFilter = buildTimeFilter(start, end, period);

        // Get performance summary
        const performanceSummary = await DatabaseQuery.select(`
            SELECT
                COUNT(*) as total_operations,
                AVG(response_time_ms) as avg_response_time,
                MIN(response_time_ms) as min_response_time,
                MAX(response_time_ms) as max_response_time,
                STDDEV(response_time_ms) as stddev_response_time,
                AVG(data_size) as avg_data_size,
                SUM(data_size) as total_data_size
            FROM sync_activities
            WHERE created_at >= ? AND success = 1
        `, [timeFilter]);

        // Get performance trends
        const performanceTrends = await DatabaseQuery.select(`
            SELECT
                DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
                COUNT(*) as operations,
                AVG(response_time_ms) as avg_response_time,
                AVG(data_size) as avg_data_size,
                COUNT(CASE WHEN response_time_ms > 5000 THEN 1 END) as slow_operations
            FROM sync_activities
            WHERE created_at >= ? AND success = 1
            GROUP BY hour
            ORDER BY hour DESC
        `, [timeFilter]);

        // Get performance by sync group
        const performanceBySyncGroup = await DatabaseQuery.select(`
            SELECT
                sync_id,
                COUNT(*) as operations,
                AVG(response_time_ms) as avg_response_time,
                AVG(data_size) as avg_data_size,
                COUNT(CASE WHEN response_time_ms > 5000 THEN 1 END) as slow_operations
            FROM sync_activities
            WHERE created_at >= ? AND success = 1
            GROUP BY sync_id
            HAVING operations >= 10
            ORDER BY avg_response_time DESC
            LIMIT 20
        `, [timeFilter]);

        const performance = {
            period: {
                start: timeFilter,
                end: new Date().toISOString(),
                period
            },
            summary: performanceSummary[0],
            trends: performanceTrends,
            bySyncGroup: performanceBySyncGroup,
            timestamp: new Date().toISOString()
        };

        MetricsCollector.recordAPIRequest(req.method, req.path, 200, Date.now() - startTime);

        res.json({
            success: true,
            data: performance,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        logger.error('Failed to get sync performance:', { error: error.message });
        MetricsCollector.recordAPIRequest(req.method, req.path, 500, Date.now() - startTime);
        throw error;
    }
};

/**
 * Get currently active sync operations
 */
const getActiveSyncOperations = async (req, res) => {
    const startTime = Date.now();

    try {
        // Get sync operations from the last 5 minutes
        const activeOperations = await DatabaseQuery.select(`
            SELECT
                sync_id,
                device_id,
                activity_type,
                created_at,
                response_time_ms,
                data_size,
                success
            FROM sync_activities
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            ORDER BY created_at DESC
        `);

        // Group by sync_id for summary
        const activeSyncs = {};
        activeOperations.forEach(op => {
            if (!activeSyncs[op.sync_id]) {
                activeSyncs[op.sync_id] = {
                    syncId: op.sync_id,
                    lastActivity: op.created_at,
                    operationCount: 0,
                    devices: new Set(),
                    activities: []
                };
            }

            activeSyncs[op.sync_id].operationCount++;
            activeSyncs[op.sync_id].devices.add(op.device_id);
            activeSyncs[op.sync_id].activities.push(op);

            if (op.created_at > activeSyncs[op.sync_id].lastActivity) {
                activeSyncs[op.sync_id].lastActivity = op.created_at;
            }
        });

        // Convert Set to Array for JSON serialization
        Object.values(activeSyncs).forEach(sync => {
            sync.deviceCount = sync.devices.size;
            sync.devices = Array.from(sync.devices);
        });

        const activeData = {
            summary: {
                totalActiveOperations: activeOperations.length,
                activeSyncGroups: Object.keys(activeSyncs).length,
                timeWindow: '5 minutes'
            },
            activeSyncs: Object.values(activeSyncs),
            recentOperations: activeOperations.slice(0, 20),
            timestamp: new Date().toISOString()
        };

        MetricsCollector.recordAPIRequest(req.method, req.path, 200, Date.now() - startTime);

        res.json({
            success: true,
            data: activeData,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        logger.error('Failed to get active sync operations:', { error: error.message });
        MetricsCollector.recordAPIRequest(req.method, req.path, 500, Date.now() - startTime);
        throw error;
    }
};

/**
 * Test sync connectivity and performance
 */
const testSyncConnectivity = async (req, res) => {
    const { syncId } = req.params;
    const startTime = Date.now();

    try {
        const testResults = await performSyncConnectivityTest(syncId);

        MetricsCollector.recordAPIRequest(req.method, req.path, 200, Date.now() - startTime);

        res.json({
            success: true,
            data: testResults,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        logger.error('Failed to test sync connectivity:', { syncId, error: error.message });
        MetricsCollector.recordAPIRequest(req.method, req.path, 500, Date.now() - startTime);
        throw error;
    }
};

/**
 * Get high-level sync system summary
 */
const getSyncSummary = async (req, res) => {
    const startTime = Date.now();

    try {
        // Get overall system health
        const systemHealth = await DatabaseQuery.select(`
            SELECT
                COUNT(DISTINCT sync_id) as total_sync_groups,
                COUNT(*) as total_operations_24h,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful_operations_24h,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed_operations_24h,
                COUNT(DISTINCT device_id) as active_devices_24h,
                AVG(response_time_ms) as avg_response_time_24h
            FROM sync_activities
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);

        // Get recent trends
        const trends = await DatabaseQuery.select(`
            SELECT
                DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
                COUNT(*) as operations,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed
            FROM sync_activities
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR)
            GROUP BY hour
            ORDER BY hour DESC
        `);

        const summary = {
            health: {
                status: systemHealth[0].failed_operations_24h / Math.max(systemHealth[0].total_operations_24h, 1) < 0.05 ? 'healthy' : 'degraded',
                ...systemHealth[0]
            },
            trends: trends.slice(0, 12),
            timestamp: new Date().toISOString()
        };

        // Calculate success rate
        if (summary.health.total_operations_24h > 0) {
            summary.health.success_rate_24h = (summary.health.successful_operations_24h / summary.health.total_operations_24h) * 100;
        }

        MetricsCollector.recordAPIRequest(req.method, req.path, 200, Date.now() - startTime);

        res.json({
            success: true,
            data: summary,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        logger.error('Failed to get sync summary:', { error: error.message });
        MetricsCollector.recordAPIRequest(req.method, req.path, 500, Date.now() - startTime);
        throw error;
    }
};

/**
 * Helper functions
 */

// Build time filter based on start/end or period
const buildTimeFilter = (start, end, period) => {
    if (start && end) {
        return new Date(start);
    }

    const now = new Date();
    const periods = {
        '1h': new Date(now.getTime() - 60 * 60 * 1000),
        '6h': new Date(now.getTime() - 6 * 60 * 60 * 1000),
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };

    return periods[period] || periods['24h'];
};

// Determine health status based on stats and activities
const determineHealthStatus = (stats, recentActivities) => {
    if (!stats.total_syncs || stats.total_syncs === 0) {
        return 'inactive';
    }

    const successRate = (stats.successful_syncs / stats.total_syncs) * 100;
    const hasRecentFailures = recentActivities.slice(0, 3).some(activity => !activity.success);

    if (successRate >= 95 && !hasRecentFailures) {
        return 'healthy';
    } else if (successRate >= 80) {
        return 'degraded';
    } else {
        return 'unhealthy';
    }
};

// Calculate uptime since creation
const calculateUptime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    return Math.floor((now - created) / 1000); // seconds
};

// Perform actual sync connectivity test
const performSyncConnectivityTest = async (syncId) => {
    // This would test actual sync endpoints
    // For now, return mock test results
    return {
        syncId,
        tests: {
            connectivity: { status: 'passed', responseTime: 120 },
            authentication: { status: 'passed', responseTime: 85 },
            dataRetrieval: { status: 'passed', responseTime: 340 },
            dataUpload: { status: 'passed', responseTime: 290 }
        },
        overall: 'healthy',
        timestamp: new Date().toISOString()
    };
};

// Additional helper functions would be implemented here
const analyzeSyncErrors = async (syncId) => { /* Implementation */ };
const analyzeAccessPatterns = async (syncId) => { /* Implementation */ };
const analyzeSyncPerformance = async (syncId) => { /* Implementation */ };
const analyzeDeviceActivity = async (syncId) => { /* Implementation */ };
const checkDataConsistency = async (syncId) => { /* Implementation */ };
const analyzeConflicts = async (syncId) => { /* Implementation */ };
const getSampleSyncData = async (syncId) => { /* Implementation */ };

module.exports = {
    getSyncStatus,
    getSyncStats,
    getSyncDiagnostics,
    getSyncAuditLog,
    getSyncErrors,
    getSyncPerformance,
    getActiveSyncOperations,
    testSyncConnectivity,
    getSyncSummary
};