/**
 * Health Controller for StackMap Dev API
 *
 * Handles all health check endpoints with comprehensive monitoring:
 * - System resource monitoring (CPU, memory, disk)
 * - Database connection and query performance
 * - Redis connectivity and cache statistics
 * - API performance metrics and error rates
 * - External dependency health checks
 * - Prometheus-compatible metrics export
 */

const os = require('os');
const fs = require('fs');
const { isDatabaseHealthy, queryStats } = require('../utils/database');
const { isRedisHealthy, RedisCache } = require('../utils/redis');
const { getAllMetrics } = require('../utils/metrics');
const { logger } = require('../utils/logger');

/**
 * Basic health check for load balancers
 * Fast response with minimal overhead
 */
const basicHealthCheck = async (req, res) => {
    const startTime = Date.now();

    // Quick check - just verify the service is running
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'stackmap-dev-api',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        responseTime: Date.now() - startTime
    };

    res.status(200).json(health);
};

/**
 * Get system health with detailed component status
 */
const getSystemHealth = async (req, res) => {
    const startTime = Date.now();
    const { include = ['system', 'database', 'redis', 'metrics'], format = 'json' } = req.query;

    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'stackmap-dev-api',
        version: process.env.npm_package_version || '1.0.0',
        components: {}
    };

    let overallHealthy = true;

    try {
        // System health
        if (include.includes('system')) {
            health.components.system = await getSystemComponentHealth();
            if (health.components.system.status !== 'healthy') {
                overallHealthy = false;
            }
        }

        // Database health
        if (include.includes('database')) {
            health.components.database = await getDatabaseComponentHealth();
            if (health.components.database.status !== 'healthy') {
                overallHealthy = false;
            }
        }

        // Redis health
        if (include.includes('redis')) {
            health.components.redis = await getRedisComponentHealth();
            if (health.components.redis.status !== 'healthy') {
                overallHealthy = false;
            }
        }

        // Metrics health
        if (include.includes('metrics')) {
            health.components.metrics = await getMetricsComponentHealth();
            if (health.components.metrics.status !== 'healthy') {
                overallHealthy = false;
            }
        }

        health.status = overallHealthy ? 'healthy' : 'unhealthy';
        health.responseTime = Date.now() - startTime;

        // Format response
        if (format === 'prometheus') {
            return res.set('Content-Type', 'text/plain').send(formatPrometheusHealth(health));
        }

        const statusCode = overallHealthy ? 200 : 503;
        res.status(statusCode).json(health);

    } catch (error) {
        logger.error('System health check failed:', error);

        const errorHealth = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check system error',
            responseTime: Date.now() - startTime
        };

        res.status(503).json(errorHealth);
    }
};

/**
 * Get database-specific health information
 */
const getDatabaseHealth = async (req, res) => {
    const startTime = Date.now();

    try {
        const dbHealth = await getDatabaseComponentHealth();
        dbHealth.responseTime = Date.now() - startTime;

        const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(dbHealth);

    } catch (error) {
        logger.error('Database health check failed:', error);

        res.status(503).json({
            status: 'unhealthy',
            error: 'Database health check failed',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime
        });
    }
};

/**
 * Get Redis-specific health information
 */
const getRedisHealth = async (req, res) => {
    const startTime = Date.now();

    try {
        const redisHealth = await getRedisComponentHealth();
        redisHealth.responseTime = Date.now() - startTime;

        const statusCode = redisHealth.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(redisHealth);

    } catch (error) {
        logger.error('Redis health check failed:', error);

        res.status(503).json({
            status: 'unhealthy',
            error: 'Redis health check failed',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime
        });
    }
};

/**
 * Get API metrics health information
 */
const getMetricsHealth = async (req, res) => {
    const startTime = Date.now();

    try {
        const metricsHealth = await getMetricsComponentHealth();
        metricsHealth.responseTime = Date.now() - startTime;

        res.status(200).json(metricsHealth);

    } catch (error) {
        logger.error('Metrics health check failed:', error);

        res.status(503).json({
            status: 'unhealthy',
            error: 'Metrics health check failed',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime
        });
    }
};

/**
 * Get external dependencies health
 */
const getDependenciesHealth = async (req, res) => {
    const startTime = Date.now();

    try {
        const dependencies = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            dependencies: {}
        };

        let overallHealthy = true;

        // Check StackMap main API (if applicable)
        dependencies.dependencies.stackmap_api = await checkExternalService(
            'https://stackmap.app/api/health',
            'StackMap Main API'
        );

        if (dependencies.dependencies.stackmap_api.status !== 'healthy') {
            overallHealthy = false;
        }

        // Check sync API
        dependencies.dependencies.sync_api = await checkExternalService(
            'https://stackmap.app/qual/api/sync/health.php',
            'Sync API'
        );

        if (dependencies.dependencies.sync_api.status !== 'healthy') {
            overallHealthy = false;
        }

        dependencies.status = overallHealthy ? 'healthy' : 'degraded';
        dependencies.responseTime = Date.now() - startTime;

        const statusCode = overallHealthy ? 200 : 503;
        res.status(statusCode).json(dependencies);

    } catch (error) {
        logger.error('Dependencies health check failed:', error);

        res.status(503).json({
            status: 'unhealthy',
            error: 'Dependencies health check failed',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime
        });
    }
};

/**
 * Get comprehensive detailed health report
 */
const getDetailedHealth = async (req, res) => {
    const startTime = Date.now();

    try {
        const detailed = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'stackmap-dev-api',
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            components: {},
            summary: {}
        };

        let overallHealthy = true;

        // Get all component health
        detailed.components.system = await getSystemComponentHealth();
        detailed.components.database = await getDatabaseComponentHealth();
        detailed.components.redis = await getRedisComponentHealth();
        detailed.components.metrics = await getMetricsComponentHealth();

        // Check overall health
        Object.values(detailed.components).forEach(component => {
            if (component.status !== 'healthy') {
                overallHealthy = false;
            }
        });

        // Create summary
        detailed.summary = {
            totalComponents: Object.keys(detailed.components).length,
            healthyComponents: Object.values(detailed.components).filter(c => c.status === 'healthy').length,
            unhealthyComponents: Object.values(detailed.components).filter(c => c.status !== 'healthy').length
        };

        detailed.status = overallHealthy ? 'healthy' : 'unhealthy';
        detailed.responseTime = Date.now() - startTime;

        const statusCode = overallHealthy ? 200 : 503;
        res.status(statusCode).json(detailed);

    } catch (error) {
        logger.error('Detailed health check failed:', error);

        res.status(503).json({
            status: 'unhealthy',
            error: 'Detailed health check failed',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime
        });
    }
};

/**
 * Get health metrics in Prometheus format
 */
const getPrometheusMetrics = async (req, res) => {
    try {
        const health = {
            components: {
                system: await getSystemComponentHealth(),
                database: await getDatabaseComponentHealth(),
                redis: await getRedisComponentHealth(),
                metrics: await getMetricsComponentHealth()
            }
        };

        const prometheus = formatPrometheusHealth(health);
        res.set('Content-Type', 'text/plain').send(prometheus);

    } catch (error) {
        logger.error('Prometheus health metrics failed:', error);
        res.status(503).send('# Health metrics unavailable\n');
    }
};

/**
 * Helper: Get system component health
 */
const getSystemComponentHealth = async () => {
    try {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const loadAverage = os.loadavg();

        // Calculate memory usage percentage
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsagePercent = (usedMemory / totalMemory) * 100;

        // Check disk space (if possible)
        let diskSpace = null;
        try {
            const stats = fs.statSync(process.cwd());
            diskSpace = {
                available: stats.size,
                used: stats.size - stats.free,
                total: stats.size
            };
        } catch (e) {
            // Disk space check not available on all systems
        }

        // Determine health status
        let status = 'healthy';
        const issues = [];

        if (memoryUsagePercent > 85) {
            status = 'degraded';
            issues.push('High memory usage');
        }

        if (loadAverage[0] > os.cpus().length * 2) {
            status = 'degraded';
            issues.push('High CPU load');
        }

        return {
            status,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                external: memoryUsage.external,
                rss: memoryUsage.rss,
                systemTotal: totalMemory,
                systemFree: freeMemory,
                usagePercent: Math.round(memoryUsagePercent * 100) / 100
            },
            cpu: {
                usage: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                },
                loadAverage: loadAverage,
                cores: os.cpus().length
            },
            disk: diskSpace,
            platform: {
                type: os.type(),
                platform: os.platform(),
                arch: os.arch(),
                release: os.release()
            },
            issues
        };

    } catch (error) {
        logger.error('System health check failed:', error);
        return {
            status: 'unhealthy',
            error: 'System health check failed',
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Helper: Get database component health
 */
const getDatabaseComponentHealth = async () => {
    try {
        const isHealthy = await isDatabaseHealthy();
        const stats = queryStats();

        let status = 'healthy';
        const issues = [];

        if (!isHealthy) {
            status = 'unhealthy';
            issues.push('Database connection failed');
        } else if (stats.errorQueries / stats.totalQueries > 0.1) {
            status = 'degraded';
            issues.push('High error rate');
        } else if (stats.avgResponseTime > 1000) {
            status = 'degraded';
            issues.push('Slow query performance');
        }

        return {
            status,
            timestamp: new Date().toISOString(),
            connected: isHealthy,
            statistics: stats,
            issues
        };

    } catch (error) {
        logger.error('Database health check failed:', error);
        return {
            status: 'unhealthy',
            error: 'Database health check failed',
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Helper: Get Redis component health
 */
const getRedisComponentHealth = async () => {
    try {
        const isHealthy = await isRedisHealthy();
        const stats = await RedisCache.getStats();

        let status = 'healthy';
        const issues = [];

        if (!isHealthy) {
            status = 'unhealthy';
            issues.push('Redis connection failed');
        }

        return {
            status,
            timestamp: new Date().toISOString(),
            connected: isHealthy,
            statistics: stats,
            issues
        };

    } catch (error) {
        logger.error('Redis health check failed:', error);
        return {
            status: 'unhealthy',
            error: 'Redis health check failed',
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Helper: Get metrics component health
 */
const getMetricsComponentHealth = async () => {
    try {
        const metrics = getAllMetrics();

        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            summary: {
                totalCounters: Object.keys(metrics.counters).length,
                totalGauges: Object.keys(metrics.gauges).length,
                totalHistograms: Object.keys(metrics.histograms).length,
                uptime: metrics.uptime
            },
            metrics: metrics
        };

    } catch (error) {
        logger.error('Metrics health check failed:', error);
        return {
            status: 'unhealthy',
            error: 'Metrics health check failed',
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Helper: Check external service health
 */
const checkExternalService = async (url, serviceName, timeout = 5000) => {
    const startTime = Date.now();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'StackMap-Dev-API-Health-Check'
            }
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;
        const isHealthy = response.status >= 200 && response.status < 300;

        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            name: serviceName,
            url,
            statusCode: response.status,
            responseTime,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        const responseTime = Date.now() - startTime;

        return {
            status: 'unhealthy',
            name: serviceName,
            url,
            error: error.name === 'AbortError' ? 'Timeout' : error.message,
            responseTime,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Helper: Format health data for Prometheus
 */
const formatPrometheusHealth = (health) => {
    const lines = [
        '# HELP stackmap_dev_api_health Health status of StackMap Dev API components',
        '# TYPE stackmap_dev_api_health gauge'
    ];

    if (health.components) {
        Object.entries(health.components).forEach(([component, data]) => {
            const healthValue = data.status === 'healthy' ? 1 : 0;
            lines.push(`stackmap_dev_api_health{component="${component}"} ${healthValue}`);
        });
    }

    lines.push('');
    lines.push('# HELP stackmap_dev_api_uptime Service uptime in seconds');
    lines.push('# TYPE stackmap_dev_api_uptime counter');
    lines.push(`stackmap_dev_api_uptime ${process.uptime()}`);

    return lines.join('\n');
};

module.exports = {
    basicHealthCheck,
    getSystemHealth,
    getDatabaseHealth,
    getRedisHealth,
    getMetricsHealth,
    getDependenciesHealth,
    getDetailedHealth,
    getPrometheusMetrics
};