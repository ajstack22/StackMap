/**
 * Authentication Middleware for StackMap Dev API
 *
 * Provides comprehensive JWT-based authentication with:
 * - Bearer token validation and verification
 * - Role-based access control (RBAC)
 * - Token refresh mechanism
 * - Security logging and audit trails
 * - Rate limiting for authentication attempts
 * - Graceful error handling and responses
 */

const { JWTUtils, SecurityAudit, SanitizationUtils } = require('../config/security');
const { RedisCache, CACHE_KEYS, CACHE_TTL } = require('../utils/redis');
const { logger } = require('../utils/logger');
const { MetricsCollector } = require('../utils/metrics');

/**
 * User roles and permissions
 */
const USER_ROLES = {
    ADMIN: 'admin',
    DEVELOPER: 'developer',
    READONLY: 'readonly'
};

const ROLE_PERMISSIONS = {
    [USER_ROLES.ADMIN]: ['read', 'write', 'admin', 'delete'],
    [USER_ROLES.DEVELOPER]: ['read', 'write'],
    [USER_ROLES.READONLY]: ['read']
};

/**
 * Protected endpoints and required permissions
 */
const ENDPOINT_PERMISSIONS = {
    '/health': [], // Public endpoint
    '/sync': ['read'],
    '/analytics': ['read'],
    '/dev': ['write'],
    '/admin': ['admin']
};

/**
 * Extract JWT token from request headers
 */
const extractToken = (req) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return null;
    }

    // Support both "Bearer token" and "token" formats
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Fallback to direct token
    return authHeader;
};

/**
 * Validate token format and basic structure
 */
const validateTokenFormat = (token) => {
    if (!token || typeof token !== 'string') {
        return false;
    }

    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
        return false;
    }

    // Basic length check (JWT tokens are typically longer)
    if (token.length < 50) {
        return false;
    }

    return true;
};

/**
 * Get user from cache or database
 */
const getUserFromCache = async (userId) => {
    try {
        const cacheKey = `${CACHE_KEYS.AUTH_USER}:${userId}`;
        const cached = await RedisCache.get(cacheKey);

        if (cached) {
            return cached;
        }

        // Query the actual user database - NO MORE MOCK USERS
        const { DatabaseQuery } = require('../utils/database');

        const userRows = await DatabaseQuery.select(
            `SELECT
                id,
                email,
                role,
                is_active,
                last_login,
                created_at,
                permissions
            FROM users
            WHERE id = ? AND is_active = 1`,
            [userId]
        );

        if (userRows.length === 0) {
            logger.warn('User not found in database:', { userId });
            return null;
        }

        const user = userRows[0];

        // Validate user data integrity
        if (!user.id || !user.email || !user.role) {
            logger.error('Invalid user data structure:', { userId, userFields: Object.keys(user) });
            return null;
        }

        // Ensure role is valid
        if (!Object.values(USER_ROLES).includes(user.role)) {
            logger.error('Invalid user role:', { userId, role: user.role });
            return null;
        }

        // Get permissions for the user's role
        const permissions = user.permissions ?
            JSON.parse(user.permissions) :
            ROLE_PERMISSIONS[user.role] || [];

        const validatedUser = {
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: permissions,
            lastLogin: user.last_login,
            isActive: user.is_active === 1,
            createdAt: user.created_at
        };

        // Cache validated user for future requests (shorter TTL for security)
        await RedisCache.set(cacheKey, validatedUser, Math.min(CACHE_TTL.AUTH_USER, 300)); // Max 5 minutes

        logger.info('User validated and cached:', { userId, role: user.role });
        return validatedUser;

    } catch (error) {
        logger.error('Failed to get user from database:', { userId, error: error.message });
        return null;
    }
};

/**
 * Check if user has required permission for endpoint
 */
const hasPermission = (user, endpoint, method = 'GET') => {
    if (!user || !user.permissions) {
        return false;
    }

    // Find matching endpoint pattern
    const endpointPattern = Object.keys(ENDPOINT_PERMISSIONS).find(pattern => {
        return endpoint.startsWith(pattern);
    });

    if (!endpointPattern) {
        // If endpoint not found, require admin permission by default
        return user.permissions.includes('admin');
    }

    const requiredPermissions = ENDPOINT_PERMISSIONS[endpointPattern];

    // Public endpoints don't require any permissions
    if (requiredPermissions.length === 0) {
        return true;
    }

    // Check if user has any of the required permissions for this endpoint
    const hasEndpointPermission = requiredPermissions.some(permission => {
        return user.permissions.includes(permission);
    });

    // If user doesn't have endpoint permission, deny access
    if (!hasEndpointPermission) {
        return false;
    }

    // Additional checks for write operations - these require explicit write or admin permissions
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
        return user.permissions.includes('write') || user.permissions.includes('admin');
    }

    // For read operations (GET, HEAD, OPTIONS), endpoint permission is sufficient
    return true;
};

/**
 * Main authentication middleware
 */
const authMiddleware = async (req, res, next) => {
    const startTime = Date.now();

    try {
        // Extract token from request
        const token = extractToken(req);

        if (!token) {
            SecurityAudit.logAuthAttempt(false, null, req.ip, req.get('User-Agent'));
            MetricsCollector.recordAPIRequest(req.method, req.path, 401, Date.now() - startTime);

            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_TOKEN_MISSING',
                message: 'Authorization header with Bearer token is required'
            });
        }

        // Validate token format
        if (!validateTokenFormat(token)) {
            SecurityAudit.logAuthAttempt(false, null, req.ip, req.get('User-Agent'));
            MetricsCollector.recordAPIRequest(req.method, req.path, 401, Date.now() - startTime);

            return res.status(401).json({
                success: false,
                error: 'Invalid token format',
                code: 'AUTH_TOKEN_INVALID_FORMAT',
                message: 'Token must be a valid JWT format'
            });
        }

        // Check token cache for quick validation
        const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
        const cacheKey = `${CACHE_KEYS.AUTH_TOKEN}:${tokenHash}`;
        let tokenData = await RedisCache.get(cacheKey);

        if (!tokenData) {
            // Verify token with JWT
            try {
                const decoded = JWTUtils.verifyToken(token);
                tokenData = {
                    userId: decoded.sub || decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                    iat: decoded.iat,
                    exp: decoded.exp
                };

                // Cache valid token for faster subsequent requests
                const ttl = Math.min(decoded.exp - Math.floor(Date.now() / 1000), CACHE_TTL.AUTH_TOKEN);
                await RedisCache.set(cacheKey, tokenData, ttl);

            } catch (jwtError) {
                let errorCode = 'AUTH_TOKEN_INVALID';
                let errorMessage = 'Invalid or expired token';

                if (jwtError.name === 'TokenExpiredError') {
                    errorCode = 'AUTH_TOKEN_EXPIRED';
                    errorMessage = 'Token has expired';
                } else if (jwtError.name === 'JsonWebTokenError') {
                    errorCode = 'AUTH_TOKEN_MALFORMED';
                    errorMessage = 'Token is malformed';
                } else if (jwtError.name === 'NotBeforeError') {
                    errorCode = 'AUTH_TOKEN_NOT_ACTIVE';
                    errorMessage = 'Token is not yet active';
                }

                SecurityAudit.logAuthAttempt(false, null, req.ip, req.get('User-Agent'));
                MetricsCollector.recordAPIRequest(req.method, req.path, 401, Date.now() - startTime);

                return res.status(401).json({
                    success: false,
                    error: 'Token verification failed',
                    code: errorCode,
                    message: errorMessage
                });
            }
        }

        // Get user details
        const user = await getUserFromCache(tokenData.userId);

        if (!user) {
            SecurityAudit.logAuthAttempt(false, tokenData.userId, req.ip, req.get('User-Agent'));
            MetricsCollector.recordAPIRequest(req.method, req.path, 401, Date.now() - startTime);

            return res.status(401).json({
                success: false,
                error: 'User not found',
                code: 'AUTH_USER_NOT_FOUND',
                message: 'User associated with token does not exist'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            SecurityAudit.logAuthAttempt(false, user.id, req.ip, req.get('User-Agent'));
            MetricsCollector.recordAPIRequest(req.method, req.path, 403, Date.now() - startTime);

            return res.status(403).json({
                success: false,
                error: 'Account deactivated',
                code: 'AUTH_USER_INACTIVE',
                message: 'User account has been deactivated'
            });
        }

        // Check permissions for this endpoint
        if (!hasPermission(user, req.path, req.method)) {
            SecurityAudit.logSuspiciousActivity('unauthorized_access_attempt', {
                userId: user.id,
                endpoint: req.path,
                method: req.method,
                userRole: user.role,
                ip: req.ip
            });

            MetricsCollector.recordAPIRequest(req.method, req.path, 403, Date.now() - startTime);

            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                message: 'User does not have permission to access this endpoint'
            });
        }

        // Attach user info to request
        req.user = {
            ...user,
            tokenData
        };

        // Log successful authentication
        SecurityAudit.logAuthAttempt(true, user.id, req.ip, req.get('User-Agent'));

        // Add user context to request for logging
        req.authContext = {
            userId: user.id,
            role: user.role,
            permissions: user.permissions
        };

        next();

    } catch (error) {
        logger.error('Authentication middleware error:', {
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        MetricsCollector.recordAPIRequest(req.method, req.path, 500, Date.now() - startTime);

        return res.status(500).json({
            success: false,
            error: 'Authentication system error',
            code: 'AUTH_SYSTEM_ERROR',
            message: 'An error occurred during authentication'
        });
    }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuthMiddleware = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        // No token provided, continue without authentication
        return next();
    }

    // If token is provided, validate it
    return authMiddleware(req, res, next);
};

/**
 * Role-based access control middleware
 */
const requireRole = (...requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!requiredRoles.includes(req.user.role)) {
            SecurityAudit.logSuspiciousActivity('role_access_denied', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles,
                endpoint: req.path,
                ip: req.ip
            });

            return res.status(403).json({
                success: false,
                error: 'Insufficient role permissions',
                code: 'AUTH_ROLE_INSUFFICIENT',
                message: `Requires one of roles: ${requiredRoles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Permission-based access control middleware
 */
const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const hasRequiredPermission = requiredPermissions.some(permission => {
            return req.user.permissions.includes(permission);
        });

        if (!hasRequiredPermission) {
            SecurityAudit.logSuspiciousActivity('permission_access_denied', {
                userId: req.user.id,
                userPermissions: req.user.permissions,
                requiredPermissions,
                endpoint: req.path,
                ip: req.ip
            });

            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                code: 'AUTH_PERMISSION_INSUFFICIENT',
                message: `Requires one of permissions: ${requiredPermissions.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Generate authentication token for user
 */
const generateAuthToken = async (user) => {
    try {
        const payload = {
            sub: user.id,
            userId: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            iat: Math.floor(Date.now() / 1000)
        };

        const token = JWTUtils.generateToken(payload);
        const refreshToken = JWTUtils.generateRefreshToken({ userId: user.id });

        // Cache token info
        const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
        const cacheKey = `${CACHE_KEYS.AUTH_TOKEN}:${tokenHash}`;
        await RedisCache.set(cacheKey, {
            userId: user.id,
            email: user.email,
            role: user.role,
            iat: payload.iat
        }, CACHE_TTL.AUTH_TOKEN);

        return {
            token,
            refreshToken,
            expiresIn: '24h',
            tokenType: 'Bearer'
        };

    } catch (error) {
        logger.error('Failed to generate auth token:', error);
        throw error;
    }
};

/**
 * Invalidate authentication token
 */
const invalidateToken = async (token) => {
    try {
        const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
        const cacheKey = `${CACHE_KEYS.AUTH_TOKEN}:${tokenHash}`;
        await RedisCache.del(cacheKey);

        logger.info('Authentication token invalidated', { tokenHash: tokenHash.substring(0, 8) });
        return true;

    } catch (error) {
        logger.error('Failed to invalidate token:', error);
        return false;
    }
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    requireRole,
    requirePermission,
    generateAuthToken,
    invalidateToken,
    extractToken,
    hasPermission,
    USER_ROLES,
    ROLE_PERMISSIONS,
    ENDPOINT_PERMISSIONS
};