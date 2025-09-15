/**
 * StackMap Dev API Infrastructure
 *
 * RESTful API for StackMap development and monitoring
 * Provides endpoints for health checks, sync monitoring, analytics, and admin functions
 *
 * Security Features:
 * - JWT Authentication with Bearer tokens
 * - Rate limiting (100 req/min read, 20 req/min write)
 * - Input validation with Joi schemas
 * - SQL injection prevention
 * - Comprehensive audit logging
 *
 * Performance Features:
 * - Redis caching for performance
 * - Connection pooling
 * - Gzip compression
 * - Request logging with Morgan
 *
 * @author StackMap Development Team
 * @version 1.0.0
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Middleware imports
const { authMiddleware } = require('./middleware/auth');
const { rateLimitMiddleware } = require('./middleware/rateLimit');
const { validationMiddleware } = require('./middleware/validation');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route imports
const healthRoutes = require('./routes/health');
const syncRoutes = require('./routes/sync');
const analyticsRoutes = require('./routes/analytics');
const devRoutes = require('./routes/dev');
const adminRoutes = require('./routes/admin');

// Utils imports
const { logger } = require('./utils/logger');
const { redisClient, connectRedis } = require('./utils/redis');
const { dbPool, initializeDatabase } = require('./utils/database');

class DevAPIServer {
    constructor() {
        this.app = express();
        this.port = process.env.DEV_API_PORT || 3001;
        this.environment = process.env.NODE_ENV || 'development';
        this.isProduction = this.environment === 'production';
    }

    /**
     * Initialize server with middleware and routes
     */
    async initialize() {
        try {
            // Initialize external services
            await this.initializeServices();

            // Configure middleware
            this.configureMiddleware();

            // Configure routes
            this.configureRoutes();

            // Configure error handling
            this.configureErrorHandling();

            logger.info('Dev API server initialized successfully');
            return this;
        } catch (error) {
            logger.error('Failed to initialize Dev API server:', error);
            throw error;
        }
    }

    /**
     * Initialize external services (Redis, Database)
     */
    async initializeServices() {
        try {
            // Initialize Redis connection
            await connectRedis();
            logger.info('Redis connection established');

            // Initialize database connection pool
            await initializeDatabase();
            logger.info('Database connection pool established');

        } catch (error) {
            logger.error('Failed to initialize services:', error);
            throw error;
        }
    }

    /**
     * Configure Express middleware stack
     */
    configureMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: this.isProduction ? ['https://stackmap.app'] : true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Compression and parsing
        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        const logFormat = this.isProduction ? 'combined' : 'dev';
        this.app.use(morgan(logFormat, {
            stream: {
                write: (message) => logger.info(message.trim())
            }
        }));

        // Add request ID for tracing
        this.app.use((req, res, next) => {
            req.requestId = require('uuid').v4();
            res.setHeader('X-Request-ID', req.requestId);
            next();
        });

        // Rate limiting middleware
        this.app.use('/api/dev/v1', rateLimitMiddleware);
    }

    /**
     * Configure API routes
     */
    configureRoutes() {
        // API base path
        const apiBase = '/api/dev/v1';

        // Public health check (no auth required)
        this.app.use(`${apiBase}/health`, healthRoutes);

        // Protected routes (require authentication)
        this.app.use(`${apiBase}/sync`, authMiddleware, syncRoutes);
        this.app.use(`${apiBase}/analytics`, authMiddleware, analyticsRoutes);
        this.app.use(`${apiBase}/dev`, authMiddleware, devRoutes);
        this.app.use(`${apiBase}/admin`, authMiddleware, adminRoutes);

        // API documentation route
        this.app.get(`${apiBase}/docs`, (req, res) => {
            res.json({
                name: 'StackMap Dev API',
                version: '1.0.0',
                description: 'Development and monitoring API for StackMap',
                endpoints: {
                    health: `${apiBase}/health`,
                    sync: `${apiBase}/sync`,
                    analytics: `${apiBase}/analytics`,
                    dev: `${apiBase}/dev`,
                    admin: `${apiBase}/admin`
                },
                documentation: 'https://docs.stackmap.app/dev-api'
            });
        });

        // Root redirect
        this.app.get('/', (req, res) => {
            res.redirect(`${apiBase}/docs`);
        });
    }

    /**
     * Configure error handling middleware
     */
    configureErrorHandling() {
        // 404 handler
        this.app.use(notFoundHandler);

        // Global error handler
        this.app.use(errorHandler);
    }

    /**
     * Start the server
     */
    async start() {
        try {
            await this.initialize();

            const server = this.app.listen(this.port, () => {
                logger.info(`Dev API server running on port ${this.port} in ${this.environment} mode`);
                logger.info(`API documentation available at http://localhost:${this.port}/api/dev/v1/docs`);
            });

            // Graceful shutdown handling
            this.setupGracefulShutdown(server);

            return server;
        } catch (error) {
            logger.error('Failed to start Dev API server:', error);
            process.exit(1);
        }
    }

    /**
     * Setup graceful shutdown handlers
     */
    setupGracefulShutdown(server) {
        const gracefulShutdown = async (signal) => {
            logger.info(`Received ${signal}, shutting down gracefully`);

            // Stop accepting new connections
            server.close(async () => {
                try {
                    // Close Redis connection
                    if (redisClient && redisClient.isOpen) {
                        await redisClient.quit();
                        logger.info('Redis connection closed');
                    }

                    // Close database pool
                    if (dbPool) {
                        await dbPool.end();
                        logger.info('Database connection pool closed');
                    }

                    logger.info('Dev API server shut down gracefully');
                    process.exit(0);
                } catch (error) {
                    logger.error('Error during graceful shutdown:', error);
                    process.exit(1);
                }
            });

            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger.error('Forceful shutdown after timeout');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }

    /**
     * Get Express app instance
     */
    getApp() {
        return this.app;
    }
}

// Export both the class and a default instance
const devAPIServer = new DevAPIServer();

module.exports = {
    DevAPIServer,
    devAPIServer,
    startDevAPI: () => devAPIServer.start()
};