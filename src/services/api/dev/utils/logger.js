/**
 * Logging Utility for StackMap Dev API
 *
 * Provides comprehensive logging functionality with:
 * - Multiple log levels (error, warn, info, debug)
 * - Structured logging with metadata
 * - Security-aware log sanitization
 * - Performance monitoring integration
 * - File and console output options
 */

const fs = require('fs');
const path = require('path');

// Handle SanitizationUtils import safely for testing
let SanitizationUtils;
try {
    ({ SanitizationUtils } = require('../config/security'));
} catch (error) {
    // Fallback for tests - provide a simple sanitizer
    SanitizationUtils = {
        sanitizeObject: (obj) => obj
    };
}

/**
 * Log levels with priority
 */
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

/**
 * Logger configuration
 */
const LOGGER_CONFIG = {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
    enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
    logDir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
    maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    enableStructured: process.env.ENABLE_STRUCTURED_LOGGING !== 'false',
    enableSanitization: process.env.ENABLE_LOG_SANITIZATION !== 'false'
};

/**
 * Logger class
 */
class Logger {
    constructor() {
        this.config = LOGGER_CONFIG;
        this.currentLogFile = null;
        this.logFileStream = null;

        // Initialize file logging if enabled
        if (this.config.enableFile) {
            this.initializeFileLogging();
        }
    }


    initializeFileLogging() {
        try {
            // Ensure log directory exists
            if (!fs.existsSync(this.config.logDir)) {
                fs.mkdirSync(this.config.logDir, { recursive: true });
            }

            // Create log file with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            this.currentLogFile = path.join(this.config.logDir, `dev-api-${timestamp}.log`);

            // Create write stream
            this.logFileStream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });

            // Handle stream errors
            this.logFileStream.on('error', (error) => {
                this.config.enableFile = false;
            });

            this.rotateLogsIfNeeded();
        } catch (error) {
            this.config.enableFile = false;
        }
    }


    rotateLogsIfNeeded() {
        try {
            if (!this.currentLogFile || !fs.existsSync(this.currentLogFile)) {
                return;
            }

            const stats = fs.statSync(this.currentLogFile);
            if (stats.size > this.config.maxFileSize) {
                // Close current stream
                if (this.logFileStream) {
                    this.logFileStream.end();
                }

                // Create new log file
                this.initializeFileLogging();

                // Clean up old log files
                this.cleanupOldLogFiles();
            }
        } catch (error) {
            // Error rotating log files
        }
    }


    cleanupOldLogFiles() {
        try {
            const logFiles = fs.readdirSync(this.config.logDir)
                .filter(file => file.startsWith('dev-api-') && file.endsWith('.log'))
                .map(file => ({
                    name: file,
                    path: path.join(this.config.logDir, file),
                    stats: fs.statSync(path.join(this.config.logDir, file))
                }))
                .sort((a, b) => b.stats.mtime - a.stats.mtime);

            // Remove files beyond the limit
            if (logFiles.length > this.config.maxFiles) {
                const filesToDelete = logFiles.slice(this.config.maxFiles);
                filesToDelete.forEach(file => {
                    fs.unlinkSync(file.path);
                });
            }
        } catch (error) {
            // Error cleaning up old log files
        }
    }


    shouldLog(level) {
        return LOG_LEVELS[level] <= LOG_LEVELS[this.config.level];
    }


    formatMessage(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();

        if (this.config.enableStructured) {
            // Structured JSON logging
            const logEntry = {
                timestamp,
                level: level.toUpperCase(),
                message,
                ...metadata
            };

            // Sanitize sensitive data if enabled
            if (this.config.enableSanitization && SanitizationUtils && SanitizationUtils.sanitizeObject) {
                return JSON.stringify(SanitizationUtils.sanitizeObject(logEntry));
            }

            return JSON.stringify(logEntry);
        } else {
            // Simple text logging
            const metaStr = Object.keys(metadata).length > 0 ?
                ` | ${JSON.stringify(metadata)}` : '';
            return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
        }
    }


    writeLog(level, message, metadata = {}) {
        if (!this.shouldLog(level)) {
            return;
        }

        const formattedMessage = this.formatMessage(level, message, metadata);

        // Console output
        if (this.config.enableConsole) {
            const consoleMethod = level === 'error' ? 'error' :
                                 level === 'warn' ? 'warn' : 'log';
            console[consoleMethod](formattedMessage);
        }

        // File output
        if (this.config.enableFile && this.logFileStream) {
            this.logFileStream.write(formattedMessage + '\n');
            this.rotateLogsIfNeeded();
        }
    }


    error(message, metadata = {}) {
        // Include stack trace for errors
        if (metadata.error && metadata.error instanceof Error) {
            metadata.stack = metadata.error.stack;
            metadata.error = metadata.error.message;
        }

        this.writeLog('error', message, metadata);
    }


    warn(message, metadata = {}) {
        this.writeLog('warn', message, metadata);
    }


    info(message, metadata = {}) {
        this.writeLog('info', message, metadata);
    }


    debug(message, metadata = {}) {
        this.writeLog('debug', message, metadata);
    }


    logRequest(req, res, responseTime) {
        const metadata = {
            method: req.method,
            url: req.url,
            requestId: req.requestId,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            contentLength: res.get('Content-Length') || 0
        };

        // Add user info if available
        if (req.user) {
            metadata.userId = req.user.id;
        }

        const message = `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`;

        if (res.statusCode >= 400) {
            this.warn(message, metadata);
        } else {
            this.info(message, metadata);
        }
    }


    logSecurity(event, details = {}) {
        this.warn(`Security Event: ${event}`, {
            event,
            ...details,
            timestamp: new Date().toISOString()
        });
    }


    logPerformance(metric, value, tags = {}) {
        this.info(`Performance: ${metric}`, {
            metric,
            value,
            tags,
            timestamp: new Date().toISOString()
        });
    }


    close() {
        if (this.logFileStream) {
            this.logFileStream.end();
            this.logFileStream = null;
        }
    }
}

/**
 * Create and export logger instance
 */
const logger = new Logger();


const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        logger.logRequest(req, res, responseTime);
        originalEnd.apply(this, args);
    };

    next();
};


const createChildLogger = (context = {}) => {
    return {
        error: (message, metadata = {}) => logger.error(message, { ...context, ...metadata }),
        warn: (message, metadata = {}) => logger.warn(message, { ...context, ...metadata }),
        info: (message, metadata = {}) => logger.info(message, { ...context, ...metadata }),
        debug: (message, metadata = {}) => logger.debug(message, { ...context, ...metadata })
    };
};

// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, closing logger');
    logger.close();
});

process.on('SIGINT', () => {
    logger.info('Received SIGINT, closing logger');
    logger.close();
});

module.exports = {
    logger,
    requestLogger,
    createChildLogger,
    LOG_LEVELS,
    LOGGER_CONFIG
};