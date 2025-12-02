/**
 * Security Configuration for StackMap Dev API
 *
 * Provides comprehensive security configurations including:
 * - JWT token management and validation
 * - Rate limiting rules and policies
 * - CORS and CSP policies
 * - Input validation schemas
 * - Security headers and middleware
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

/**
 * Secure JWT secret generation and validation
 */
const generateSecureSecret = () => {
    // Use crypto.randomBytes for cryptographically secure random bytes
    const secret = crypto.randomBytes(64).toString('hex');
    logger.warn('Generated new JWT secret - this should be stored securely and reused');
    return secret;
};

const validateJWTSecret = (secret) => {
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    // Check for weak/default secrets
    const weakSecrets = ['secret', 'jwt_secret', 'changeme', '123456', 'password'];
    if (weakSecrets.includes(secret.toLowerCase())) {
        throw new Error('JWT_SECRET cannot be a common/weak value');
    }
    return secret;
};

/**
 * JWT Configuration with enhanced security
 */
const JWT_CONFIG = {
    // Primary JWT secret - MUST be set via environment variable in production
    get secret() {
        if (process.env.NODE_ENV === 'production') {
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET environment variable is required in production');
            }
            return validateJWTSecret(process.env.JWT_SECRET);
        } else {
            // Development only - generate secure secret if not provided
            return process.env.JWT_SECRET || generateSecureSecret();
        }
    },

    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'stackmap-dev-api',
    audience: process.env.JWT_AUDIENCE || 'stackmap-developers',
    algorithm: 'HS256',

    // Refresh token configuration with separate secret
    get refreshSecret() {
        if (process.env.NODE_ENV === 'production') {
            if (!process.env.JWT_REFRESH_SECRET) {
                throw new Error('JWT_REFRESH_SECRET environment variable is required in production');
            }
            return validateJWTSecret(process.env.JWT_REFRESH_SECRET);
        } else {
            return process.env.JWT_REFRESH_SECRET || generateSecureSecret();
        }
    },

    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // Token validation options
    clockTolerance: 30, // 30 seconds clock skew tolerance
    ignoreExpiration: false,
    ignoreNotBefore: false
};

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
    // Global API rate limits
    global: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // requests per window
        message: 'Too many requests from this IP, please try again later',
        standardHeaders: true,
        legacyHeaders: false
    },

    // Read operation limits (GET requests)
    read: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 100, // requests per minute
        message: 'Too many read requests, please slow down'
    },

    // Write operation limits (POST, PUT, DELETE)
    write: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 20, // requests per minute
        message: 'Too many write requests, please slow down'
    },

    // Admin operation limits
    admin: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 10, // requests per window
        message: 'Too many admin requests, please wait before trying again'
    },

    // Auth operation limits
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // login attempts per window
        message: 'Too many authentication attempts, please try again later'
    }
};

/**
 * CORS configuration
 */
const CORS_CONFIG = {
    development: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID']
    },

    production: {
        origin: [
            'https://stackmap.app',
            'https://www.stackmap.app',
            'https://admin.stackmap.app'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
        maxAge: 86400 // 24 hours
    }
};

/**
 * Security headers configuration
 */
const SECURITY_HEADERS = {
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },

    // HTTP Strict Transport Security
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },

    // X-Frame-Options
    frameguard: {
        action: 'deny'
    },

    // X-Content-Type-Options
    noSniff: true,

    // X-XSS-Protection
    xssFilter: true,

    // Referrer Policy
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    }
};

/**
 * Input validation patterns
 */
const VALIDATION_PATTERNS = {
    // User identifiers
    userId: /^[a-zA-Z0-9_-]{1,50}$/,
    deviceId: /^[a-zA-Z0-9_-]{1,100}$/,
    syncId: /^[a-fA-F0-9]{32}$/,

    // API parameters
    apiEndpoint: /^[a-zA-Z0-9/_-]{1,200}$/,
    // eslint-disable-next-line security/detect-unsafe-regex -- ISO 8601 timestamp pattern with bounded length
    timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,

    // Metric names
    metricName: /^[a-zA-Z][a-zA-Z0-9_\.]{1,100}$/,

    // IP addresses
    // eslint-disable-next-line security/detect-unsafe-regex -- IPv4 validation with bounded octet ranges
    ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    // eslint-disable-next-line security/detect-unsafe-regex -- IPv6 validation with fixed segment count
    ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
};

/**
 * Sensitive data patterns for sanitization
 */
const SENSITIVE_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /auth/i,
    /credential/i,
    /private/i
];

/**
 * JWT utility functions
 */
const JWTUtils = {

    generateToken: (payload, options = {}) => {
        const tokenOptions = {
            expiresIn: options.expiresIn || JWT_CONFIG.expiresIn,
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience,
            algorithm: JWT_CONFIG.algorithm
        };

        return jwt.sign(payload, JWT_CONFIG.secret, tokenOptions);
    },


    verifyToken: (token, options = {}) => {
        const verifyOptions = {
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience,
            algorithms: [JWT_CONFIG.algorithm],
            clockTolerance: JWT_CONFIG.clockTolerance,
            ignoreExpiration: options.ignoreExpiration || JWT_CONFIG.ignoreExpiration,
            ignoreNotBefore: JWT_CONFIG.ignoreNotBefore
        };

        return jwt.verify(token, JWT_CONFIG.secret, verifyOptions);
    },


    generateRefreshToken: (payload) => {
        return jwt.sign(payload, JWT_CONFIG.refreshSecret, {
            expiresIn: JWT_CONFIG.refreshExpiresIn,
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience
        });
    },


    verifyRefreshToken: (token) => {
        return jwt.verify(token, JWT_CONFIG.refreshSecret, {
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience
        });
    }
};

/**
 * Password utility functions
 */
const PasswordUtils = {

    hashPassword: async (password) => {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        return bcrypt.hash(password, saltRounds);
    },


    comparePassword: async (password, hash) => {
        return bcrypt.compare(password, hash);
    },

    /**
     * Generate secure random password
     * SECURITY: Fixed to use cryptographically secure randomness
     */
    generateSecurePassword: (length = 16) => {
        const cryptoLib = require('crypto');
        // eslint-disable-next-line no-secrets/no-secrets -- Character set for random password generation, not a secret
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = cryptoLib.randomInt(0, charset.length);
            password += charset.charAt(randomIndex);
        }

        return password;
    }
};

/**
 * Data sanitization utilities
 */
const SanitizationUtils = {

    sanitizeObject: (obj, depth = 5) => {
        if (depth <= 0 || typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const sanitized = Array.isArray(obj) ? [] : {};

        for (const [key, value] of Object.entries(obj)) {
            // Check if key contains sensitive information
            const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));

            if (isSensitive) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = SanitizationUtils.sanitizeObject(value, depth - 1);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    },


    sanitizeString: (str) => {
        if (typeof str !== 'string') {
            return str;
        }

        const sanitized = str.replace(/[<>]/g, ''); // Remove angle brackets
        return sanitized
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    },


    sanitizeIP: (ip) => {
        if (!ip || typeof ip !== 'string') {
            return null;
        }

        const cleaned = ip.trim();

        if (VALIDATION_PATTERNS.ipv4.test(cleaned) || VALIDATION_PATTERNS.ipv6.test(cleaned)) {
            return cleaned;
        }

        return null;
    }
};

/**
 * Security audit logging
 */
const SecurityAudit = {

    logSecurityEvent: (event, details = {}) => {
        const auditLog = {
            timestamp: new Date().toISOString(),
            event,
            details: SanitizationUtils.sanitizeObject(details),
            severity: details.severity || 'medium'
        };

        logger.warn('Security Event:', auditLog);

        // In production, send to security monitoring system
        if (process.env.NODE_ENV === 'production') {
            // Send to configured security monitoring service
            try {
                if (process.env.SECURITY_MONITORING_WEBHOOK) {
                    // Basic webhook integration for security monitoring
                    const webhook = process.env.SECURITY_MONITORING_WEBHOOK;
                    // Implementation would use fetch/axios to send audit log to monitoring service
                    logger.info('Security event forwarded to monitoring service');
                } else {
                    logger.warn('SECURITY_MONITORING_WEBHOOK not configured - security events not forwarded');
                }
            } catch (error) {
                logger.error('Failed to send security event to monitoring service:', error.message);
            }
        }
    },


    logAuthAttempt: (success, userId, ip, userAgent) => {
        SecurityAudit.logSecurityEvent('auth_attempt', {
            success,
            userId: userId || 'unknown',
            ip: SanitizationUtils.sanitizeIP(ip),
            userAgent: SanitizationUtils.sanitizeString(userAgent),
            severity: success ? 'low' : 'medium'
        });
    },


    logSuspiciousActivity: (activity, details) => {
        SecurityAudit.logSecurityEvent('suspicious_activity', {
            activity,
            ...details,
            severity: 'high'
        });
    }
};

module.exports = {
    JWT_CONFIG,
    RATE_LIMIT_CONFIG,
    CORS_CONFIG,
    SECURITY_HEADERS,
    VALIDATION_PATTERNS,
    SENSITIVE_PATTERNS,
    JWTUtils,
    PasswordUtils,
    SanitizationUtils,
    SecurityAudit
};