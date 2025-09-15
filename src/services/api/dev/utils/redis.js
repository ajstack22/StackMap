/**
 * Redis Utility for StackMap Dev API
 *
 * Provides Redis connection management and utility functions with:
 * - Connection pooling and health monitoring
 * - Automatic retry and failover handling
 * - Cluster support for production environments
 * - Performance optimized caching operations
 * - Graceful degradation when Redis is unavailable
 */

const Redis = require('redis');
const { getRedisConfig, CACHE_KEYS, CACHE_TTL, setupRedisEventHandlers, CacheUtils } = require('../config/redis');
const { logger } = require('./logger');

/**
 * Redis client instances
 */
let redisClient = null;
let redisCluster = null;
let isConnected = false;
let connectionRetries = 0;
const maxRetries = 5;

/**
 * Connect to Redis
 */
const connectRedis = async () => {
    try {
        const config = getRedisConfig();

        if (config.cluster) {
            // Cluster configuration
            const { Cluster } = require('ioredis');
            redisCluster = new Cluster(config.nodes, config.options);

            setupRedisEventHandlers(redisCluster);

            await redisCluster.ping();
            redisClient = redisCluster;
            logger.info(`Connected to Redis cluster with ${config.nodes.length} nodes`);
        } else {
            // Single instance configuration
            redisClient = Redis.createClient(config.options);

            setupRedisEventHandlers(redisClient);

            await redisClient.connect();
            await redisClient.ping();
            logger.info(`Connected to Redis at ${config.options.host}:${config.options.port}`);
        }

        isConnected = true;
        connectionRetries = 0;
        return redisClient;

    } catch (error) {
        connectionRetries++;
        logger.error(`Redis connection failed (attempt ${connectionRetries}/${maxRetries}):`, error);

        if (connectionRetries < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000);
            logger.info(`Retrying Redis connection in ${delay}ms`);
            setTimeout(connectRedis, delay);
        } else {
            logger.error('Max Redis connection retries reached, operating without cache');
            isConnected = false;
        }

        throw error;
    }
};

/**
 * Disconnect from Redis
 */
const disconnectRedis = async () => {
    try {
        if (redisClient) {
            await redisClient.quit();
            redisClient = null;
            redisCluster = null;
            isConnected = false;
            logger.info('Redis connection closed');
        }
    } catch (error) {
        logger.error('Error closing Redis connection:', error);
    }
};

/**
 * Check if Redis is connected and healthy
 */
const isRedisHealthy = async () => {
    try {
        if (!redisClient || !isConnected) {
            return false;
        }

        await redisClient.ping();
        return true;
    } catch (error) {
        logger.warn('Redis health check failed:', error);
        isConnected = false;
        return false;
    }
};

/**
 * Redis Cache Interface
 */
class RedisCache {
    /**
     * Get value from cache
     */
    static async get(key) {
        try {
            if (!isConnected || !redisClient) {
                return null;
            }

            const value = await redisClient.get(key);
            return value ? CacheUtils.deserialize(value) : null;
        } catch (error) {
            logger.warn('Redis GET error:', { key, error: error.message });
            return null;
        }
    }

    /**
     * Set value in cache with TTL
     */
    static async set(key, value, ttl = CACHE_TTL.API_RESPONSE_FAST) {
        try {
            if (!isConnected || !redisClient) {
                return false;
            }

            const serializedValue = CacheUtils.serialize(value);
            await redisClient.setEx(key, ttl, serializedValue);
            return true;
        } catch (error) {
            logger.warn('Redis SET error:', { key, ttl, error: error.message });
            return false;
        }
    }

    /**
     * Delete key from cache
     */
    static async del(key) {
        try {
            if (!isConnected || !redisClient) {
                return false;
            }

            await redisClient.del(key);
            return true;
        } catch (error) {
            logger.warn('Redis DEL error:', { key, error: error.message });
            return false;
        }
    }

    /**
     * Check if key exists
     */
    static async exists(key) {
        try {
            if (!isConnected || !redisClient) {
                return false;
            }

            const result = await redisClient.exists(key);
            return result === 1;
        } catch (error) {
            logger.warn('Redis EXISTS error:', { key, error: error.message });
            return false;
        }
    }

    /**
     * Set key expiration
     */
    static async expire(key, ttl) {
        try {
            if (!isConnected || !redisClient) {
                return false;
            }

            await redisClient.expire(key, ttl);
            return true;
        } catch (error) {
            logger.warn('Redis EXPIRE error:', { key, ttl, error: error.message });
            return false;
        }
    }

    /**
     * Increment counter
     */
    static async incr(key, amount = 1) {
        try {
            if (!isConnected || !redisClient) {
                return null;
            }

            const result = await redisClient.incrBy(key, amount);
            return result;
        } catch (error) {
            logger.warn('Redis INCR error:', { key, amount, error: error.message });
            return null;
        }
    }

    /**
     * Get multiple keys
     */
    static async mget(keys) {
        try {
            if (!isConnected || !redisClient || !keys.length) {
                return [];
            }

            const values = await redisClient.mGet(keys);
            return values.map(value => value ? CacheUtils.deserialize(value) : null);
        } catch (error) {
            logger.warn('Redis MGET error:', { keys: keys.length, error: error.message });
            return new Array(keys.length).fill(null);
        }
    }

    /**
     * Set multiple keys
     */
    static async mset(keyValues, ttl = CACHE_TTL.API_RESPONSE_FAST) {
        try {
            if (!isConnected || !redisClient || !keyValues.length) {
                return false;
            }

            // Prepare key-value pairs
            const pairs = [];
            keyValues.forEach(({ key, value }) => {
                pairs.push(key, CacheUtils.serialize(value));
            });

            await redisClient.mSet(pairs);

            // Set TTL for each key if specified
            if (ttl > 0) {
                const promises = keyValues.map(({ key }) => redisClient.expire(key, ttl));
                await Promise.all(promises);
            }

            return true;
        } catch (error) {
            logger.warn('Redis MSET error:', { count: keyValues.length, error: error.message });
            return false;
        }
    }

    /**
     * Get keys matching pattern using secure SCAN command
     */
    static async keys(pattern) {
        try {
            if (!isConnected || !redisClient) {
                return [];
            }

            // Always use SCAN instead of KEYS command for security and performance
            const keys = [];
            let cursor = 0;
            const maxIterations = 1000; // Prevent infinite loops
            let iterations = 0;

            do {
                // Validate pattern to prevent regex injection
                if (!/^[a-zA-Z0-9:*_-]+$/.test(pattern)) {
                    throw new Error('Invalid pattern format');
                }

                const result = await redisClient.scan(cursor, {
                    MATCH: pattern,
                    COUNT: 100
                });

                cursor = result.cursor;
                keys.push(...result.keys);
                iterations++;

                // Safety check to prevent infinite loops
                if (iterations > maxIterations) {
                    logger.warn('Redis SCAN exceeded max iterations:', { pattern, iterations });
                    break;
                }
            } while (cursor !== 0);

            logger.debug('Redis SCAN completed:', { pattern, keyCount: keys.length, iterations });
            return keys;
        } catch (error) {
            logger.warn('Redis SCAN error:', { pattern, error: error.message });
            return [];
        }
    }

    /**
     * Delete keys matching pattern
     */
    static async deletePattern(pattern) {
        try {
            if (!isConnected || !redisClient) {
                return 0;
            }

            const keys = await this.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }

            await redisClient.del(keys);
            return keys.length;
        } catch (error) {
            logger.warn('Redis DELETE PATTERN error:', { pattern, error: error.message });
            return 0;
        }
    }

    /**
     * Get cache statistics
     */
    static async getStats() {
        try {
            if (!isConnected || !redisClient) {
                return null;
            }

            const info = await redisClient.info('stats');
            const memory = await redisClient.info('memory');
            const keyspace = await redisClient.info('keyspace');

            return {
                connected: isConnected,
                stats: this.parseRedisInfo(info),
                memory: this.parseRedisInfo(memory),
                keyspace: this.parseRedisInfo(keyspace)
            };
        } catch (error) {
            logger.warn('Redis STATS error:', error);
            return null;
        }
    }

    /**
     * Parse Redis INFO response
     */
    static parseRedisInfo(info) {
        const result = {};
        const lines = info.split('\r\n');

        lines.forEach(line => {
            if (line && !line.startsWith('#')) {
                const [key, value] = line.split(':');
                if (key && value) {
                    result[key] = isNaN(value) ? value : parseFloat(value);
                }
            }
        });

        return result;
    }
}

/**
 * Cache wrapper with automatic fallback
 */
const cacheWrapper = {
    /**
     * Get from cache with fallback function
     */
    async getOrSet(key, fallbackFn, ttl = CACHE_TTL.API_RESPONSE_FAST) {
        try {
            // Try to get from cache first
            const cached = await RedisCache.get(key);
            if (cached !== null) {
                logger.debug('Cache hit', { key });
                return cached;
            }

            // Cache miss - call fallback function
            logger.debug('Cache miss', { key });
            const result = await fallbackFn();

            // Store in cache for next time
            if (result !== null && result !== undefined) {
                await RedisCache.set(key, result, ttl);
            }

            return result;
        } catch (error) {
            logger.warn('Cache wrapper error:', { key, error: error.message });
            // Always call fallback on error
            return await fallbackFn();
        }
    },

    /**
     * Invalidate cache entries by pattern
     */
    async invalidate(pattern) {
        try {
            const deleted = await RedisCache.deletePattern(pattern);
            logger.info('Cache invalidated', { pattern, deleted });
            return deleted;
        } catch (error) {
            logger.warn('Cache invalidation error:', { pattern, error: error.message });
            return 0;
        }
    }
};

/**
 * Rate limiting using Redis
 */
const rateLimiter = {
    /**
     * Check rate limit for identifier
     */
    async checkLimit(identifier, limit, windowMs) {
        try {
            if (!isConnected || !redisClient) {
                // Allow request if Redis is not available
                return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs };
            }

            const key = CacheUtils.buildKey(CACHE_KEYS.RATE_LIMIT, { identifier });
            const now = Date.now();
            const windowStart = now - windowMs;

            // Use Redis ZCOUNT and ZADD for sliding window rate limiting
            const pipe = redisClient.multi();

            // Remove expired entries
            pipe.zRemRangeByScore(key, '-inf', windowStart);

            // Count current requests in window
            pipe.zCard(key);

            // Add current request
            pipe.zAdd(key, { score: now, value: `${now}:${Math.random()}` });

            // Set expiration
            pipe.expire(key, Math.ceil(windowMs / 1000));

            const results = await pipe.exec();
            const requestCount = results[1][1];

            const allowed = requestCount < limit;
            const remaining = Math.max(0, limit - requestCount - 1);
            const resetTime = now + windowMs;

            return { allowed, remaining, resetTime, current: requestCount };

        } catch (error) {
            logger.warn('Rate limiter error:', { identifier, error: error.message });
            // Allow request on error
            return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs };
        }
    }
};

module.exports = {
    connectRedis,
    disconnectRedis,
    isRedisHealthy,
    redisClient: () => redisClient,
    RedisCache,
    cacheWrapper,
    rateLimiter,
    CACHE_KEYS,
    CACHE_TTL
};