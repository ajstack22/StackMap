/**
 * Redis Configuration for StackMap Dev API
 *
 * Provides Redis connection configuration with:
 * - Connection pooling and retry logic
 * - Cluster support for production
 * - Security configurations
 * - Performance optimizations
 * - Health monitoring
 */

const { logger } = require('../utils/logger');

/**
 * Redis configuration based on environment
 */
const getRedisConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    const baseConfig = {
        // Connection settings
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,

        // Connection pool settings
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxLoadingTime: 5000,

        // Connection timeout
        connectTimeout: 10000,
        commandTimeout: 5000,
        lazyConnect: true,

        // Keep alive
        keepAlive: 30000,

        // Reconnection settings
        reconnectOnError: (err) => {
            logger.warn('Redis reconnect on error:', err.message);
            const targetError = 'READONLY';
            return err.message.includes(targetError);
        },

        retryDelayOnClusterDown: 300,
        enableOfflineQueue: false,

        // Performance settings
        compression: 'gzip',
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'stackmap:dev:',

        // Family: 4 for IPv4, 6 for IPv6
        family: 4,

        // Security configurations
        // Disable dangerous Redis commands in production
        disabledCommands: isProduction ? [
            'FLUSHDB',    // Delete all keys in current database
            'FLUSHALL',   // Delete all keys in all databases
            'KEYS',       // List all keys (performance risk)
            'CONFIG',     // Modify Redis configuration
            'SHUTDOWN',   // Shutdown Redis server
            'DEBUG',      // Debug commands
            'EVAL',       // Execute Lua scripts (security risk)
            'EVALSHA',    // Execute cached Lua scripts
            'SCRIPT',     // Script management commands
            'SLOWLOG',    // Slow query log access
            'LASTSAVE',   // Get last save time
            'SAVE',       // Synchronous save to disk
            'BGSAVE',     // Background save to disk
            'BGREWRITEAOF' // Background rewrite AOF
        ] : [],

        // TLS/SSL configuration for production
        tls: isProduction && process.env.REDIS_TLS_ENABLED === 'true' ? {
            rejectUnauthorized: true,
            requestCert: true,
            ca: process.env.REDIS_TLS_CA_CERT,
            cert: process.env.REDIS_TLS_CLIENT_CERT,
            key: process.env.REDIS_TLS_CLIENT_KEY
        } : undefined,

        // Additional security options
        stringNumbers: false,  // Don't convert number strings to numbers automatically
        dropBufferSupport: true,  // Disable Buffer support to reduce attack surface
    };

    // Production cluster configuration
    if (isProduction && process.env.REDIS_CLUSTER_NODES) {
        const clusterNodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
            const [host, port] = node.trim().split(':');
            return { host, port: parseInt(port) || 6379 };
        });

        return {
            cluster: true,
            nodes: clusterNodes,
            options: {
                ...baseConfig,
                enableReadyCheck: false,
                redisOptions: {
                    password: process.env.REDIS_PASSWORD,
                    ...baseConfig
                }
            }
        };
    }

    // Single instance configuration
    return {
        cluster: false,
        options: baseConfig
    };
};

/**
 * Cache key patterns for different data types
 */
const CACHE_KEYS = {
    // Health check cache
    HEALTH_CHECK: 'health:check:{service}',
    HEALTH_STATS: 'health:stats:system',

    // Rate limiting cache
    RATE_LIMIT: 'rate_limit:{identifier}',
    RATE_LIMIT_STATS: 'rate_limit:stats',

    // Sync monitoring cache
    SYNC_STATUS: 'sync:status:{sync_id}',
    SYNC_STATS: 'sync:stats:global',
    SYNC_DIAGNOSTICS: 'sync:diagnostics:{sync_id}',

    // Analytics cache
    ANALYTICS_USAGE: 'analytics:usage:{period}',
    ANALYTICS_PERFORMANCE: 'analytics:performance:{metric}',
    ANALYTICS_USER: 'analytics:user:{user_id}',

    // Session and auth cache
    AUTH_TOKEN: 'auth:token:{token_hash}',
    AUTH_USER: 'auth:user:{user_id}',

    // Admin metrics cache
    ADMIN_METRICS: 'admin:metrics:{metric_type}',
    ADMIN_CONFIG: 'admin:config:current',

    // API response cache
    API_RESPONSE: 'api:response:{endpoint}:{params_hash}'
};

/**
 * Cache TTL (Time To Live) configurations in seconds
 */
const CACHE_TTL = {
    // Short-lived cache (1-5 minutes)
    HEALTH_CHECK: 60,           // 1 minute
    RATE_LIMIT: 300,            // 5 minutes
    API_RESPONSE_FAST: 60,      // 1 minute

    // Medium-lived cache (5-30 minutes)
    SYNC_STATUS: 300,           // 5 minutes
    ANALYTICS_REALTIME: 900,    // 15 minutes
    AUTH_TOKEN: 1800,           // 30 minutes

    // Long-lived cache (1-24 hours)
    ANALYTICS_HOURLY: 3600,     // 1 hour
    SYNC_STATS: 3600,           // 1 hour
    ADMIN_METRICS: 3600,        // 1 hour

    // Very long-lived cache (24+ hours)
    ANALYTICS_DAILY: 86400,     // 24 hours
    USER_PREFERENCES: 86400,    // 24 hours
    ADMIN_CONFIG: 86400         // 24 hours
};

/**
 * Redis event handlers
 */
const setupRedisEventHandlers = (client) => {
    client.on('connect', () => {
        logger.info('Redis client connected');
    });

    client.on('ready', () => {
        logger.info('Redis client ready for commands');
    });

    client.on('error', (error) => {
        logger.error('Redis client error:', error);
    });

    client.on('close', () => {
        logger.warn('Redis client connection closed');
    });

    client.on('reconnecting', (delay) => {
        logger.info(`Redis client reconnecting in ${delay}ms`);
    });

    client.on('end', () => {
        logger.info('Redis client connection ended');
    });
};

/**
 * Redis health check
 */
const testRedisConnection = async (client) => {
    try {
        const startTime = Date.now();
        const pong = await client.ping();
        const responseTime = Date.now() - startTime;

        if (pong === 'PONG') {
            return {
                status: 'healthy',
                responseTime,
                timestamp: new Date().toISOString()
            };
        } else {
            throw new Error('Unexpected ping response: ' + pong);
        }
    } catch (error) {
        logger.error('Redis health check failed:', error);
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Get Redis instance information
 */
const getRedisInfo = async (client) => {
    try {
        const info = await client.info();
        const lines = info.split('\r\n');
        const result = {};

        lines.forEach(line => {
            if (line && !line.startsWith('#')) {
                const [key, value] = line.split(':');
                if (key && value) {
                    result[key] = isNaN(value) ? value : parseFloat(value);
                }
            }
        });

        return result;
    } catch (error) {
        logger.error('Failed to get Redis info:', error);
        throw error;
    }
};

/**
 * Cache utility functions
 */
const CacheUtils = {
    /**
     * Build cache key from pattern and parameters
     */
    buildKey: (pattern, params = {}) => {
        let key = pattern;
        Object.entries(params).forEach(([param, value]) => {
            key = key.replace(`{${param}}`, value);
        });
        return key;
    },

    /**
     * Hash parameters for cache key generation
     */
    hashParams: (params) => {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
    },

    /**
     * Serialize data for Redis storage
     */
    serialize: (data) => {
        try {
            return JSON.stringify(data);
        } catch (error) {
            logger.error('Failed to serialize cache data:', error);
            throw error;
        }
    },

    /**
     * Deserialize data from Redis
     */
    deserialize: (data) => {
        try {
            return JSON.parse(data);
        } catch (error) {
            logger.error('Failed to deserialize cache data:', error);
            throw error;
        }
    }
};

module.exports = {
    getRedisConfig,
    CACHE_KEYS,
    CACHE_TTL,
    setupRedisEventHandlers,
    testRedisConnection,
    getRedisInfo,
    CacheUtils
};