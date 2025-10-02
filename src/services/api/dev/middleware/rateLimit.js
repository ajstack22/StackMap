/**
 * Rate Limiting Middleware for StackMap Dev API
 *
 * Provides comprehensive rate limiting with:
 * - Multiple rate limiting strategies (IP, user, endpoint-based)
 * - Configurable limits for read/write operations
 * - Redis-backed distributed rate limiting
 * - Sliding window algorithm for accurate limits
 * - Graceful degradation when Redis is unavailable
 * - Detailed metrics and logging
 */

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { RATE_LIMIT_CONFIG } = require('../config/security');
const { rateLimiter, RedisCache, CACHE_KEYS } = require('../utils/redis');
const { logger } = require('../utils/logger');
const { MetricsCollector } = require('../utils/metrics');

/**
 * Rate limit store using Redis for distributed rate limiting
 */
class RedisRateLimitStore {
    constructor() {
        this.prefix = 'rate_limit:';
        this.fallbackStore = new Map(); // In-memory fallback when Redis is unavailable
    }

    /**
     * Increment rate limit counter
     */
    async incr(key) {
        try {
            const result = await rateLimiter.checkLimit(
                key,
                100, // Default limit
                60000 // 1 minute window
            );

            return {
                totalHits: result.current,
                resetTime: new Date(result.resetTime)
            };

        } catch (error) {
            logger.warn('Redis rate limit store error, using fallback:', error);
            return this.inMemoryIncr(key);
        }
    }

    /**
     * Fallback in-memory rate limiting
     */
    inMemoryIncr(key) {
        const now = Date.now();
        const windowMs = 60000; // 1 minute
        const limit = 100;

        if (!this.fallbackStore.has(key)) {
            this.fallbackStore.set(key, {
                count: 0,
                resetTime: now + windowMs
            });
        }

        const record = this.fallbackStore.get(key);

        // Reset if window has expired
        if (now > record.resetTime) {
            record.count = 0;
            record.resetTime = now + windowMs;
        }

        record.count++;

        return {
            totalHits: record.count,
            resetTime: new Date(record.resetTime)
        };
    }

    /**
     * Decrement rate limit counter (not used by express-rate-limit)
     */
    async decrement(key) {
        // Not implemented as express-rate-limit doesn't use this
        return;
    }

    /**
     * Reset rate limit counter
     */
    async resetKey(key) {
        try {
            await RedisCache.del(`${this.prefix}${key}`);
            this.fallbackStore.delete(key);
        } catch (error) {
            logger.warn('Failed to reset rate limit key:', error);
        }
    }
}

/**
 * Create rate limit store instance
 */
const rateLimitStore = new RedisRateLimitStore();

/**
 * Key generator functions for different rate limiting strategies
 */
const keyGenerators = {
    /**
     * IP-based rate limiting with proper IPv6 support using ipKeyGenerator helper
     */
    ip: (req) => {
        // Get IP from various sources, with validation
        let ip = req.ip ||
                req.connection?.remoteAddress ||
                req.socket?.remoteAddress ||
                req.headers['x-forwarded-for']?.split(',')[0]?.trim();

        // Validate IP format to prevent injection
        if (!ip || ip === 'unknown') {
            ip = 'unknown';
            return `ip:${ip}`;
        }

        // Basic IP format validation with improved IPv6 regex
        // eslint-disable-next-line security/detect-unsafe-regex -- IPv4 validation with bounded octet ranges
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        // eslint-disable-next-line security/detect-unsafe-regex -- IPv6 validation with bounded segment count
        const ipv6Regex = /^(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
        const ipv6MappedRegex = /^::ffff:[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/;

        if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip) && !ipv6MappedRegex.test(ip)) {
            logger.warn('Invalid IP format detected:', { ip: ip.substring(0, 20) });
            ip = 'invalid';
            return `ip:${ip}`;
        }

        try {
            // Use ipKeyGenerator helper for proper IPv6 handling
            // IPv6 subnet of 64 bits is commonly used for rate limiting to balance
            // security and preventing excessive blocking
            const ipv6Subnet = 64;
            const processedIp = ipKeyGenerator(ip, ipv6Subnet);

            return `ip:${processedIp}`;
        } catch (error) {
            // Fallback to original IP if ipKeyGenerator fails
            logger.warn('ipKeyGenerator failed, using original IP:', { error: error.message, ip: ip.substring(0, 20) });
            return `ip:${ip}`;
        }
    },

    /**
     * User-based rate limiting with validation
     */
    user: (req) => {
        if (req.user && req.user.id) {
            // Validate user ID format to prevent injection
            const userId = req.user.id.toString();
            if (!/^[a-zA-Z0-9_-]{1,50}$/.test(userId)) {
                logger.warn('Invalid user ID format for rate limiting:', { userId: userId.substring(0, 20) });
                return keyGenerators.ip(req);
            }
            return `user:${userId}`;
        }
        return keyGenerators.ip(req);
    },

    /**
     * Endpoint-based rate limiting
     */
    endpoint: (req) => {
        const baseKey = req.user ? keyGenerators.user(req) : keyGenerators.ip(req);
        const endpoint = req.route ? req.route.path : req.path;
        return `${baseKey}:endpoint:${endpoint}`;
    },

    /**
     * Method-based rate limiting
     */
    method: (req) => {
        const baseKey = req.user ? keyGenerators.user(req) : keyGenerators.ip(req);
        return `${baseKey}:method:${req.method}`;
    }
};

/**
 * Secure rate limiting skip function with proper validation
 */
const skipRateLimit = (req) => {
    // Only allow health checks to skip rate limiting
    if (req.path === '/api/dev/v1/health' || req.path === '/api/dev/v1/health/ping') {
        return true;
    }

    // REMOVED: Admin bypass in development (security vulnerability)
    // REMOVED: Internal service header bypass (easily spoofed)

    // Only allow skipping for authenticated system health checks
    if (req.path.startsWith('/api/dev/v1/health/') &&
        req.user &&
        req.user.role === 'admin' &&
        req.headers['x-request-source'] === 'system-monitor' &&
        process.env.SYSTEM_MONITOR_SECRET === req.headers['x-monitor-secret']) {
        return true;
    }

    return false;
};

/**
 * Rate limit exceeded handler (modern v7+ syntax)
 * Handles both logging and response when rate limit is exceeded
 */
const handleRateLimitExceeded = (req, res, next, options) => {
    const identifier = req.user ? req.user.id : req.ip;

    logger.warn('Rate limit exceeded', {
        identifier,
        endpoint: req.path,
        method: req.method,
        limit: options.max,
        windowMs: options.windowMs,
        userAgent: req.get('User-Agent')
    });

    MetricsCollector.recordAPIRequest(req.method, req.path, 429, 0);

    // Log suspicious activity for excessive requests
    if (req.rateLimit && req.rateLimit.remaining === 0) {
        const { SecurityAudit } = require('../config/security');
        SecurityAudit.logSuspiciousActivity('rate_limit_exceeded', {
            identifier,
            endpoint: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    }

    // Send the rate limit exceeded response
    res.status(429).json(options.message);
};

/**
 * Create rate limiter with custom configuration
 */
const createRateLimiter = (config) => {
    return rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        message: {
            success: false,
            error: config.message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(config.windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        store: rateLimitStore,
        keyGenerator: config.keyGenerator || keyGenerators.ip,
        skip: skipRateLimit,
        handler: handleRateLimitExceeded
    });
};

/**
 * Global rate limiter (applied to all requests)
 */
const globalRateLimit = createRateLimiter({
    ...RATE_LIMIT_CONFIG.global,
    keyGenerator: keyGenerators.ip
});

/**
 * Read operation rate limiter
 */
const readRateLimit = createRateLimiter({
    ...RATE_LIMIT_CONFIG.read,
    keyGenerator: keyGenerators.user
});

/**
 * Write operation rate limiter
 */
const writeRateLimit = createRateLimiter({
    ...RATE_LIMIT_CONFIG.write,
    keyGenerator: keyGenerators.user
});

/**
 * Admin operation rate limiter
 */
const adminRateLimit = createRateLimiter({
    ...RATE_LIMIT_CONFIG.admin,
    keyGenerator: keyGenerators.user
});

/**
 * Authentication rate limiter
 */
const authRateLimit = createRateLimiter({
    ...RATE_LIMIT_CONFIG.auth,
    keyGenerator: keyGenerators.ip
});

/**
 * Dynamic rate limiting middleware based on request type
 */
const dynamicRateLimit = (req, res, next) => {
    // Determine which rate limiter to apply based on request
    let limiter = globalRateLimit;

    // Admin endpoints
    if (req.path.includes('/admin')) {
        limiter = adminRateLimit;
    }
    // Write operations
    else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        limiter = writeRateLimit;
    }
    // Read operations
    else if (req.method === 'GET') {
        limiter = readRateLimit;
    }

    return limiter(req, res, next);
};

/**
 * Rate limiting middleware that applies appropriate limits
 */
const rateLimitMiddleware = (req, res, next) => {
    // Apply dynamic rate limiting
    return dynamicRateLimit(req, res, next);
};

/**
 * Get rate limit status for a user/IP
 */
const getRateLimitStatus = async (identifier, type = 'ip') => {
    try {
        const key = `${type}:${identifier}`;
        const config = type === 'user' ? RATE_LIMIT_CONFIG.read : RATE_LIMIT_CONFIG.global;

        const result = await rateLimiter.checkLimit(
            key,
            config.max,
            config.windowMs
        );

        return {
            identifier,
            type,
            limit: config.max,
            remaining: result.remaining,
            resetTime: new Date(result.resetTime),
            windowMs: config.windowMs
        };

    } catch (error) {
        logger.warn('Failed to get rate limit status:', error);
        return null;
    }
};

/**
 * Reset rate limit for a user/IP (admin function)
 */
const resetRateLimit = async (identifier, type = 'ip') => {
    try {
        const key = `${type}:${identifier}`;
        await rateLimitStore.resetKey(key);

        logger.info('Rate limit reset', { identifier, type });
        return true;

    } catch (error) {
        logger.error('Failed to reset rate limit:', error);
        return false;
    }
};

/**
 * Get rate limiting statistics
 */
const getRateLimitStats = async () => {
    try {
        // Get current rate limit data from Redis
        const patterns = [
            'rate_limit:ip:*',
            'rate_limit:user:*',
            'rate_limit:endpoint:*'
        ];

        const stats = {
            total: 0,
            byType: {
                ip: 0,
                user: 0,
                endpoint: 0
            },
            topOffenders: [],
            averageRequestsPerMinute: 0
        };

        for (const pattern of patterns) {
            const keys = await RedisCache.keys(pattern);
            const type = pattern.split(':')[1];
            stats.byType[type] = keys.length;
            stats.total += keys.length;
        }

        return stats;

    } catch (error) {
        logger.error('Failed to get rate limit stats:', error);
        return null;
    }
};

/**
 * Middleware to add rate limit headers to response
 */
const addRateLimitHeaders = (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
        // Add rate limit headers if available
        if (req.rateLimit) {
            res.set({
                'X-RateLimit-Limit': req.rateLimit.limit,
                'X-RateLimit-Remaining': req.rateLimit.remaining,
                'X-RateLimit-Reset': new Date(req.rateLimit.resetTime).toISOString()
            });
        }

        return originalSend.call(this, data);
    };

    next();
};

/**
 * Create custom rate limiter for specific endpoints
 */
const createCustomRateLimit = (options) => {
    const config = {
        windowMs: options.windowMs || 60000, // 1 minute default
        max: options.max || 100,
        message: options.message || 'Too many requests',
        keyGenerator: options.keyGenerator || keyGenerators.ip,
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        skipFailedRequests: options.skipFailedRequests || false
    };

    return createRateLimiter(config);
};

module.exports = {
    rateLimitMiddleware,
    globalRateLimit,
    readRateLimit,
    writeRateLimit,
    adminRateLimit,
    authRateLimit,
    dynamicRateLimit,
    addRateLimitHeaders,
    createCustomRateLimit,
    getRateLimitStatus,
    resetRateLimit,
    getRateLimitStats,
    keyGenerators,
    rateLimitStore
};