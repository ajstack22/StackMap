/**
 * Error Handling Middleware for StackMap Dev API
 *
 * Provides comprehensive error handling with:
 * - Structured error responses with consistent format
 * - Security-conscious error sanitization (no sensitive data exposure)
 * - Different error handling for development vs production
 * - Detailed logging with context and stack traces
 * - Performance monitoring and error rate tracking
 * - Custom error types for different scenarios
 */

const { SanitizationUtils, SecurityAudit } = require('../config/security');
const { logger } = require('../utils/logger');
const { MetricsCollector } = require('../utils/metrics');

/**
 * Custom error classes for different error types
 */
class APIError extends Error {
    constructor(message, statusCode = 500, code = 'API_ERROR', details = null) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends APIError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

class AuthenticationError extends APIError {
    constructor(message, code = 'AUTHENTICATION_ERROR') {
        super(message, 401, code);
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends APIError {
    constructor(message, code = 'AUTHORIZATION_ERROR') {
        super(message, 403, code);
        this.name = 'AuthorizationError';
    }
}

class NotFoundError extends APIError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

class ConflictError extends APIError {
    constructor(message, details = null) {
        super(message, 409, 'CONFLICT', details);
        this.name = 'ConflictError';
    }
}

class RateLimitError extends APIError {
    constructor(retryAfter = 60) {
        super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

class ServiceUnavailableError extends APIError {
    constructor(service = 'Service', reason = 'temporarily unavailable') {
        super(`${service} is ${reason}`, 503, 'SERVICE_UNAVAILABLE');
        this.name = 'ServiceUnavailableError';
    }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (error, req, isDevelopment = false) => {
    const baseResponse = {
        success: false,
        error: error.message || 'An error occurred',
        code: error.code || 'INTERNAL_ERROR',
        timestamp: error.timestamp || new Date().toISOString()
    };

    // Add request ID for tracing
    if (req.requestId) {
        baseResponse.requestId = req.requestId;
    }

    // Add error details if available
    if (error.details) {
        baseResponse.details = error.details;
    }

    // Add retry information for rate limit errors
    if (error instanceof RateLimitError) {
        baseResponse.retryAfter = error.retryAfter;
    }

    // In development, include more debugging information
    if (isDevelopment) {
        baseResponse.debug = {
            stack: error.stack,
            name: error.name,
            statusCode: error.statusCode
        };

        // Add request context in development
        baseResponse.request = {
            method: req.method,
            url: req.url,
            headers: SanitizationUtils.sanitizeObject(req.headers),
            body: SanitizationUtils.sanitizeObject(req.body),
            query: req.query,
            params: req.params
        };
    }

    return baseResponse;
};

/**
 * Get HTTP status code from error
 */
const getStatusCode = (error) => {
    // Custom API errors have statusCode property
    if (error.statusCode) {
        return error.statusCode;
    }

    // Handle specific error types
    if (error.name === 'ValidationError') {
        return 400;
    }

    if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
        return 401;
    }

    if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
        return 403;
    }

    if (error.name === 'NotFoundError' || error.message.includes('not found')) {
        return 404;
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return 503;
    }

    if (error.code === 'ETIMEDOUT') {
        return 408;
    }

    // Default to 500 for unknown errors
    return 500;
};

/**
 * Determine if error should be logged as a warning or error
 */
const getLogLevel = (statusCode) => {
    if (statusCode >= 500) {
        return 'error';
    }
    if (statusCode >= 400) {
        return 'warn';
    }
    return 'info';
};

/**
 * Check if error contains sensitive information
 */
const hasSensitiveInfo = (error) => {
    const sensitivePatterns = [
        /password/i,
        /token/i,
        /secret/i,
        /key/i,
        /credential/i,
        /authorization/i
    ];

    const errorString = error.message + (error.stack || '');
    return sensitivePatterns.some(pattern => pattern.test(errorString));
};

/**
 * Sanitize error for safe logging/response
 */
const sanitizeError = (error, isDevelopment = false) => {
    // Don't sanitize in development for debugging
    if (isDevelopment) {
        return error;
    }

    // If error contains sensitive info, create a generic error
    if (hasSensitiveInfo(error)) {
        const sanitized = new APIError(
            'An internal error occurred',
            error.statusCode || 500,
            'INTERNAL_ERROR'
        );

        // Preserve the original error for internal logging
        sanitized._originalError = error;
        return sanitized;
    }

    return error;
};

/**
 * Main error handling middleware
 */
const errorHandler = (error, req, res, next) => {
    const startTime = Date.now();
    const isDevelopment = process.env.NODE_ENV === 'development';

    try {
        // Sanitize error for security
        const sanitizedError = sanitizeError(error, isDevelopment);
        const statusCode = getStatusCode(sanitizedError);
        const logLevel = getLogLevel(statusCode);

        // Create error context for logging
        const errorContext = {
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
                statusCode
            },
            request: {
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                requestId: req.requestId
            },
            user: req.user ? {
                id: req.user.id,
                role: req.user.role
            } : null,
            responseTime: Date.now() - startTime
        };

        // Add stack trace for server errors in development
        if (statusCode >= 500 && isDevelopment) {
            errorContext.error.stack = error.stack;
        }

        // Log the error
        logger[logLevel]('API Error occurred', errorContext);

        // Record metrics
        MetricsCollector.recordAPIRequest(
            req.method,
            req.path,
            statusCode,
            Date.now() - startTime
        );

        // Log security events for certain error types
        if (statusCode === 401 || statusCode === 403) {
            SecurityAudit.logSecurityEvent('access_denied', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.path,
                method: req.method,
                statusCode,
                userId: req.user?.id
            });
        }

        // Check for repeated errors (possible attack)
        if (statusCode >= 400 && req.ip) {
            SecurityAudit.logSuspiciousActivity('repeated_errors', {
                ip: req.ip,
                endpoint: req.path,
                statusCode,
                errorCount: 1 // In production, implement proper counting
            });
        }

        // Format error response
        const errorResponse = formatErrorResponse(sanitizedError, req, isDevelopment);

        // Set appropriate headers
        res.status(statusCode);

        // Add retry-after header for rate limit errors
        if (sanitizedError instanceof RateLimitError) {
            res.set('Retry-After', sanitizedError.retryAfter.toString());
        }

        // Add CORS headers if needed
        if (req.get('Origin')) {
            res.set('Access-Control-Allow-Origin', req.get('Origin'));
            res.set('Access-Control-Allow-Credentials', 'true');
        }

        // Send error response
        res.json(errorResponse);

    } catch (handlerError) {
        // Fallback error handling if the error handler itself fails
        logger.error('Error handler failed', {
            originalError: error.message,
            handlerError: handlerError.message,
            stack: handlerError.stack,
            requestId: req.requestId
        });

        // Send minimal error response
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'ERROR_HANDLER_FAILED',
            requestId: req.requestId
        });
    }
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError('API endpoint');
    error.details = {
        method: req.method,
        path: req.path,
        availableEndpoints: [
            '/api/dev/v1/health',
            '/api/dev/v1/sync',
            '/api/dev/v1/analytics',
            '/api/dev/v1/dev',
            '/api/dev/v1/admin'
        ]
    };

    next(error);
};

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Create custom error response
 */
const createError = (message, statusCode = 500, code = 'API_ERROR', details = null) => {
    return new APIError(message, statusCode, code, details);
};

/**
 * Handle uncaught exceptions and unhandled promise rejections
 */
const setupGlobalErrorHandlers = () => {
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', {
            error: error.message,
            stack: error.stack
        });

        // In production, exit gracefully
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Promise Rejection', {
            reason: reason instanceof Error ? reason.message : reason,
            stack: reason instanceof Error ? reason.stack : undefined,
            promise: promise.toString()
        });

        // In production, exit gracefully
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    });
};

// Set up global error handlers
setupGlobalErrorHandlers();

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    createError,

    // Error classes
    APIError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    ServiceUnavailableError,

    // Utility functions
    formatErrorResponse,
    getStatusCode,
    sanitizeError,
    setupGlobalErrorHandlers
};