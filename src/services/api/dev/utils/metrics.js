/**
 * Metrics Utility for StackMap Dev API
 *
 * Provides comprehensive metrics collection and reporting with:
 * - Performance metrics (response times, throughput)
 * - Business metrics (API usage, error rates)
 * - System metrics (memory, CPU, database performance)
 * - Custom metrics with labels and aggregation
 * - Time-series data collection and analysis
 */

const { DatabaseQuery } = require('./database');
const { RedisCache, CACHE_KEYS, CACHE_TTL } = require('./redis');
const { logger } = require('./logger');

/**
 * Metric types
 */
const METRIC_TYPES = {
    COUNTER: 'counter',
    GAUGE: 'gauge',
    HISTOGRAM: 'histogram',
    SUMMARY: 'summary'
};

/**
 * In-memory metrics store for real-time data
 */
class MetricsStore {
    constructor() {
        this.counters = new Map();
        this.gauges = new Map();
        this.histograms = new Map();
        this.summaries = new Map();
        this.startTime = Date.now();
    }


    incrementCounter(name, value = 1, labels = {}) {
        const key = this.buildMetricKey(name, labels);
        const current = this.counters.get(key) || 0;
        this.counters.set(key, current + value);

        // Persist to database periodically
        this.persistMetric(name, current + value, METRIC_TYPES.COUNTER, labels);
    }


    setGauge(name, value, labels = {}) {
        const key = this.buildMetricKey(name, labels);
        this.gauges.set(key, value);

        // Persist to database
        this.persistMetric(name, value, METRIC_TYPES.GAUGE, labels);
    }


    recordHistogram(name, value, labels = {}) {
        const key = this.buildMetricKey(name, labels);
        const histogram = this.histograms.get(key) || {
            count: 0,
            sum: 0,
            min: Infinity,
            max: -Infinity,
            buckets: {}
        };

        const metricValue = typeof value === 'number' ? value : parseFloat(value);
        if (!isNaN(metricValue)) {
            histogram.count++;
            histogram.sum += metricValue;
            histogram.min = Math.min(histogram.min, metricValue);
            histogram.max = Math.max(histogram.max, metricValue);
        }

        // Add to buckets (predefined buckets for response times)
        const buckets = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
        buckets.forEach(bucket => {
            if (metricValue <= bucket) {
                histogram.buckets[bucket] = (histogram.buckets[bucket] || 0) + 1;
            }
        });

        this.histograms.set(key, histogram);

        // Persist summary statistics
        this.persistMetric(name, histogram.sum / histogram.count, METRIC_TYPES.HISTOGRAM, {
            ...labels,
            stat: 'avg'
        });
    }


    recordSummary(name, value, labels = {}) {
        const key = this.buildMetricKey(name, labels);
        const summary = this.summaries.get(key) || {
            count: 0,
            sum: 0,
            quantiles: []
        };

        summary.count++;
        summary.sum += value;
        summary.quantiles.push(value);

        // Keep only last 1000 values for quantile calculation
        if (summary.quantiles.length > 1000) {
            summary.quantiles = summary.quantiles.slice(-1000);
        }

        this.summaries.set(key, summary);

        // Calculate and persist quantiles
        if (summary.quantiles.length >= 10) {
            const sorted = [...summary.quantiles].sort((a, b) => a - b);
            const quantiles = [0.5, 0.9, 0.95, 0.99];

            quantiles.forEach(q => {
                const index = Math.floor(sorted.length * q);
                const value = sorted[index];
                this.persistMetric(name, value, METRIC_TYPES.SUMMARY, {
                    ...labels,
                    quantile: q.toString()
                });
            });
        }
    }


    buildMetricKey(name, labels) {
        // Ensure labels are safe for key construction to prevent injection-like issues
        const safeLabels = Object.fromEntries(
            Object.entries(labels).map(([k, v]) => [
                String(k).replace(/[{}=,]/g, '_'), // Sanitize keys
                String(v).replace(/[{}=,]/g, '_')  // Sanitize values
            ])
        );

        const labelStr = Object.entries(safeLabels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join(',');

        return labelStr ? `${name}{${labelStr}}` : name;
    }


    async persistMetric(name, value, type, labels) {
        try {
            // Don't block the main thread
            setImmediate(async () => {
                // Ensure labels are stored as a string, and prevent direct object injection into SQL
                const safeLabels = JSON.stringify(labels);
                await DatabaseQuery.insert(
                    'INSERT INTO dev_api_metrics (metric_name, metric_value, metric_type, labels) VALUES (?, ?, ?, ?)',
                    [name, value, type, safeLabels]
                );
            });
        } catch (error) {
            // Silently fail to avoid impacting API performance
            logger.debug('Failed to persist metric:', { name, error: error.message });
        }
    }


    getAllMetrics() {
        return {
            counters: Object.fromEntries(this.counters),
            gauges: Object.fromEntries(this.gauges),
            histograms: Object.fromEntries(this.histograms),
            summaries: Object.fromEntries(this.summaries),
            uptime: Date.now() - this.startTime
        };
    }


    reset() {
        this.counters.clear();
        this.gauges.clear();
        this.histograms.clear();
        this.summaries.clear();
        this.startTime = Date.now();
    }
}

// Global metrics store instance
const metricsStore = new MetricsStore();

/**
 * Predefined metrics for common use cases
 */
const Metrics = {
    // API metrics
    API_REQUESTS_TOTAL: 'api_requests_total',
    API_REQUEST_DURATION: 'api_request_duration_ms',
    API_ERRORS_TOTAL: 'api_errors_total',
    API_RESPONSE_SIZE: 'api_response_size_bytes',

    // Database metrics
    DB_QUERIES_TOTAL: 'db_queries_total',
    DB_QUERY_DURATION: 'db_query_duration_ms',
    DB_CONNECTIONS_ACTIVE: 'db_connections_active',
    DB_ERRORS_TOTAL: 'db_errors_total',

    // Redis metrics
    REDIS_OPERATIONS_TOTAL: 'redis_operations_total',
    REDIS_OPERATION_DURATION: 'redis_operation_duration_ms',
    REDIS_CACHE_HITS: 'redis_cache_hits_total',
    REDIS_CACHE_MISSES: 'redis_cache_misses_total',

    // System metrics
    MEMORY_USAGE: 'memory_usage_bytes',
    CPU_USAGE: 'cpu_usage_percent',
    DISK_USAGE: 'disk_usage_bytes',

    // Business metrics
    SYNC_OPERATIONS_TOTAL: 'sync_operations_total',
    SYNC_ERRORS_TOTAL: 'sync_errors_total',
    ACTIVE_USERS: 'active_users',
    DATA_PROCESSED: 'data_processed_bytes'
};

/**
 * Metrics collection interface
 */
const MetricsCollector = {

    recordAPIRequest(method, endpoint, statusCode, duration, responseSize = 0) {
        const labels = { method, endpoint, status: statusCode.toString() };

        metricsStore.incrementCounter(Metrics.API_REQUESTS_TOTAL, 1, labels);
        metricsStore.recordHistogram(Metrics.API_REQUEST_DURATION, duration, labels);

        if (responseSize > 0) {
            metricsStore.recordHistogram(Metrics.API_RESPONSE_SIZE, responseSize, labels);
        }

        if (statusCode >= 400) {
            metricsStore.incrementCounter(Metrics.API_ERRORS_TOTAL, 1, {
                method,
                endpoint,
                status: statusCode.toString()
            });
        }
    },


    recordDatabaseQuery(operation, table, duration, success = true) {
        const labels = { operation, table };

        metricsStore.incrementCounter(Metrics.DB_QUERIES_TOTAL, 1, labels);
        metricsStore.recordHistogram(Metrics.DB_QUERY_DURATION, duration, labels);

        if (!success) {
            metricsStore.incrementCounter(Metrics.DB_ERRORS_TOTAL, 1, labels);
        }
    },


    recordRedisOperation(operation, duration, success = true, cacheHit = null) {
        const labels = { operation };

        metricsStore.incrementCounter(Metrics.REDIS_OPERATIONS_TOTAL, 1, labels);
        metricsStore.recordHistogram(Metrics.REDIS_OPERATION_DURATION, duration, labels);

        if (cacheHit === true) {
            metricsStore.incrementCounter(Metrics.REDIS_CACHE_HITS, 1);
        } else if (cacheHit === false) {
            metricsStore.incrementCounter(Metrics.REDIS_CACHE_MISSES, 1);
        }
    },


    recordSystemMetrics() {
        const usage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        metricsStore.setGauge(Metrics.MEMORY_USAGE, usage.heapUsed, { type: 'heap' });
        metricsStore.setGauge(Metrics.MEMORY_USAGE, usage.external, { type: 'external' });
        metricsStore.setGauge(Metrics.MEMORY_USAGE, usage.rss, { type: 'rss' });

        // CPU usage as percentage (approximation)
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
        metricsStore.setGauge(Metrics.CPU_USAGE, cpuPercent);
    },


    recordSyncOperation(operation, success = true, dataSize = 0) {
        const labels = { operation };

        metricsStore.incrementCounter(Metrics.SYNC_OPERATIONS_TOTAL, 1, labels);

        if (!success) {
            metricsStore.incrementCounter(Metrics.SYNC_ERRORS_TOTAL, 1, labels);
        }

        if (dataSize > 0) {
            metricsStore.incrementCounter(Metrics.DATA_PROCESSED, dataSize, labels);
        }
    },


    setActiveUsers(count) {
        metricsStore.setGauge(Metrics.ACTIVE_USERS, count);
    }
};

/**
 * Metrics aggregation and analysis
 */
const MetricsAnalyzer = {

    async getAPIPerformanceSummary(timeRange = '1h') {
        try {
            const cacheKey = `${CACHE_KEYS.ADMIN_METRICS}:api_performance:${timeRange}`;
            const cached = await RedisCache.get(cacheKey);

            if (cached) {
                return cached;
            }

            const timeFilter = this.getTimeFilter(timeRange);
            const query = `
                SELECT
                    metric_name,
                    JSON_EXTRACT(labels, '$.endpoint') as endpoint,
                    JSON_EXTRACT(labels, '$.method') as method,
                    AVG(metric_value) as avg_value,
                    MIN(metric_value) as min_value,
                    MAX(metric_value) as max_value,
                    COUNT(*) as count
                FROM dev_api_metrics
                WHERE metric_name IN (?, ?)
                AND timestamp >= ?
                GROUP BY metric_name, endpoint, method
                ORDER BY avg_value DESC
            `;

            const results = await DatabaseQuery.select(query, [
                Metrics.API_REQUEST_DURATION,
                Metrics.API_REQUESTS_TOTAL,
                timeFilter
            ]);

            const summary = this.processPerformanceResults(results);
            await RedisCache.set(cacheKey, summary, CACHE_TTL.ADMIN_METRICS);

            return summary;

        } catch (error) {
            logger.error('Failed to get API performance summary:', error);
            return null;
        }
    },


    async getErrorRateAnalysis(timeRange = '1h') {
        try {
            const timeFilter = this.getTimeFilter(timeRange);
            const query = `
                SELECT
                    JSON_EXTRACT(labels, '$.endpoint') as endpoint,
                    JSON_EXTRACT(labels, '$.status') as status,
                    COUNT(*) as count
                FROM dev_api_metrics
                WHERE metric_name = ?
                AND timestamp >= ?
                GROUP BY endpoint, status
                ORDER BY count DESC
            `;

            const results = await DatabaseQuery.select(query, [
                Metrics.API_REQUESTS_TOTAL,
                timeFilter
            ]);

            return this.processErrorResults(results);

        } catch (error) {
            logger.error('Failed to get error rate analysis:', error);
            return null;
        }
    },


    async getResourceUsageTrends(timeRange = '24h') {
        try {
            const timeFilter = this.getTimeFilter(timeRange);
            const query = `
                SELECT
                    metric_name,
                    JSON_EXTRACT(labels, '$.type') as resource_type,
                    AVG(metric_value) as avg_value,
                    MIN(metric_value) as min_value,
                    MAX(metric_value) as max_value,
                    DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour
                FROM dev_api_metrics
                WHERE metric_name IN (?, ?, ?)
                AND timestamp >= ?
                GROUP BY metric_name, resource_type, hour
                ORDER BY hour DESC
            `;

            const results = await DatabaseQuery.select(query, [
                Metrics.MEMORY_USAGE,
                Metrics.CPU_USAGE,
                Metrics.DB_CONNECTIONS_ACTIVE,
                timeFilter
            ]);

            return this.processResourceResults(results);

        } catch (error) {
            logger.error('Failed to get resource usage trends:', error);
            return null;
        }
    },


    getTimeFilter(timeRange) {
        const now = new Date();
        const ranges = {
            '1h': new Date(now.getTime() - 60 * 60 * 1000),
            '6h': new Date(now.getTime() - 6 * 60 * 60 * 1000),
            '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
            '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        };

        return ranges[timeRange] || ranges['1h'];
    },


    processPerformanceResults(results) {
        const endpoints = {};

        results.forEach(row => {
            const endpoint = row.endpoint || 'unknown';
            const method = row.method || 'unknown';
            const key = `${method} ${endpoint}`;

            if (!endpoints[key]) {
                endpoints[key] = {
                    endpoint,
                    method,
                    requests: 0,
                    avgResponseTime: 0,
                    minResponseTime: Infinity,
                    maxResponseTime: 0
                };
            }

            if (row.metric_name === Metrics.API_REQUESTS_TOTAL) {
                endpoints[key].requests += row.count;
            } else if (row.metric_name === Metrics.API_REQUEST_DURATION) {
                endpoints[key].avgResponseTime = row.avg_value;
                endpoints[key].minResponseTime = Math.min(endpoints[key].minResponseTime, row.min_value);
                endpoints[key].maxResponseTime = Math.max(endpoints[key].maxResponseTime, row.max_value);
            }
        });

        return Object.values(endpoints).sort((a, b) => b.requests - a.requests);
    },


    processErrorResults(results) {
        const summary = {
            totalRequests: 0,
            totalErrors: 0,
            errorRate: 0,
            endpoints: {}
        };

        results.forEach(row => {
            const endpoint = row.endpoint || 'unknown';
            const status = parseInt(row.status, 10);
            const count = row.count;

            if (!summary.endpoints[endpoint]) {
                summary.endpoints[endpoint] = {
                    totalRequests: 0,
                    errors: 0,
                    errorRate: 0
                };
            }

            summary.endpoints[endpoint].totalRequests += count;
            summary.totalRequests += count;

            if (status >= 400) {
                summary.endpoints[endpoint].errors += count;
                summary.totalErrors += count;
            }
        });

        // Calculate error rates
        summary.errorRate = summary.totalRequests > 0 ?
            (summary.totalErrors / summary.totalRequests) * 100 : 0;

        Object.keys(summary.endpoints).forEach(endpoint => {
            const ep = summary.endpoints[endpoint];
            ep.errorRate = ep.totalRequests > 0 ?
                (ep.errors / ep.totalRequests) * 100 : 0;
        });

        return summary;
    },


    processResourceResults(results) {
        const trends = {};

        results.forEach(row => {
            const metric = row.metric_name;
            const type = row.resource_type || 'default';
            const key = `${metric}_${type}`;

            if (!trends[key]) {
                trends[key] = {
                    metric,
                    type,
                    dataPoints: []
                };
            }

            trends[key].dataPoints.push({
                timestamp: row.hour,
                avg: row.avg_value,
                min: row.min_value,
                max: row.max_value
            });
        });

        return Object.values(trends);
    }
};

// Start collecting system metrics periodically
setInterval(() => {
    MetricsCollector.recordSystemMetrics();
}, 30000); // Every 30 seconds

module.exports = {
    METRIC_TYPES,
    Metrics,
    MetricsCollector,
    MetricsAnalyzer,
    metricsStore,
    getAllMetrics: () => metricsStore.getAllMetrics(),
    resetMetrics: () => metricsStore.reset()
};