/**
 * Database Configuration for StackMap Dev API
 *
 * Provides secure database connection configuration with:
 * - Connection pooling for performance
 * - SSL configuration for production
 * - Retry logic for connection failures
 * - Query timeout management
 * - Connection health monitoring
 */

const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');

/**
 * Database configuration based on environment
 */
const getDatabaseConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        // Connection settings
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'stackmap',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'stackmap_dev',

        // SSL configuration
        ssl: isProduction ? {
            rejectUnauthorized: true,
            ca: process.env.DB_SSL_CA,
            cert: process.env.DB_SSL_CERT,
            key: process.env.DB_SSL_KEY
        } : false,

        // Pool configuration
        connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 10,
        queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 20,
        acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
        timeout: parseInt(process.env.DB_TIMEOUT) || 60000,

        // Reconnection settings
        reconnect: true,
        idleTimeout: 300000, // 5 minutes
        maxReconnects: 3,

        // Character set
        charset: 'utf8mb4',

        // Timezone
        timezone: 'Z',

        // Additional options
        multipleStatements: false, // Security: prevent SQL injection via multiple statements
        dateStrings: false,
        debug: !isProduction && process.env.DB_DEBUG === 'true',

        // Connection flags
        flags: [
            'COMPRESS',
            'PROTOCOL_41',
            'TRANSACTIONS'
        ]
    };
};

/**
 * Table schema definitions for dev API
 */
const SCHEMA_DEFINITIONS = {
    dev_api_logs: `
        CREATE TABLE IF NOT EXISTS dev_api_logs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            request_id VARCHAR(36) NOT NULL,
            endpoint VARCHAR(255) NOT NULL,
            method VARCHAR(10) NOT NULL,
            user_id VARCHAR(255),
            ip_address VARCHAR(45) NOT NULL,
            user_agent TEXT,
            request_body JSON,
            response_status INT NOT NULL,
            response_time_ms INT NOT NULL,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_endpoint (endpoint),
            INDEX idx_created_at (created_at),
            INDEX idx_user_id (user_id),
            INDEX idx_request_id (request_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,

    dev_api_rate_limits: `
        CREATE TABLE IF NOT EXISTS dev_api_rate_limits (
            id VARCHAR(255) PRIMARY KEY,
            hits INT NOT NULL DEFAULT 0,
            reset_time TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_reset_time (reset_time)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,

    dev_api_metrics: `
        CREATE TABLE IF NOT EXISTS dev_api_metrics (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            metric_name VARCHAR(255) NOT NULL,
            metric_value DECIMAL(15,4) NOT NULL,
            metric_type ENUM('counter', 'gauge', 'histogram', 'summary') NOT NULL,
            labels JSON,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_metric_name (metric_name),
            INDEX idx_timestamp (timestamp),
            INDEX idx_metric_type (metric_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,

    dev_api_health_checks: `
        CREATE TABLE IF NOT EXISTS dev_api_health_checks (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            service_name VARCHAR(255) NOT NULL,
            status ENUM('healthy', 'unhealthy', 'degraded') NOT NULL,
            response_time_ms INT NOT NULL,
            error_message TEXT,
            details JSON,
            checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_service_name (service_name),
            INDEX idx_checked_at (checked_at),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,

    dev_api_admin_actions: `
        CREATE TABLE IF NOT EXISTS dev_api_admin_actions (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            admin_user_id VARCHAR(255) NOT NULL,
            action_type VARCHAR(100) NOT NULL,
            resource_type VARCHAR(100) NOT NULL,
            resource_id VARCHAR(255),
            action_details JSON,
            ip_address VARCHAR(45) NOT NULL,
            user_agent TEXT,
            performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_admin_user_id (admin_user_id),
            INDEX idx_action_type (action_type),
            INDEX idx_performed_at (performed_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
};

/**
 * Initialize database tables with proper schema
 */
const initializeTables = async (connection) => {
    try {
        logger.info('Initializing database tables for Dev API');

        for (const [tableName, schema] of Object.entries(SCHEMA_DEFINITIONS)) {
            await connection.execute(schema);
            logger.info(`Table ${tableName} created/verified`);
        }

        logger.info('Database tables initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize database tables:', error);
        throw error;
    }
};

/**
 * Test database connection health
 */
const testConnection = async (connection) => {
    try {
        const startTime = Date.now();
        await connection.execute('SELECT 1 as health_check');
        const responseTime = Date.now() - startTime;

        return {
            status: 'healthy',
            responseTime,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        logger.error('Database health check failed:', error);
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Get database statistics
 */
const getDatabaseStats = async (connection) => {
    try {
        const [connectionStats] = await connection.execute(`
            SHOW STATUS WHERE
            Variable_name IN ('Connections', 'Threads_connected', 'Threads_running', 'Uptime')
        `);

        const [processStats] = await connection.execute('SHOW PROCESSLIST');

        const stats = {};
        connectionStats.forEach(stat => {
            stats[stat.Variable_name.toLowerCase()] = stat.Value;
        });

        stats.active_connections = processStats.length;

        return stats;
    } catch (error) {
        logger.error('Failed to get database stats:', error);
        throw error;
    }
};

module.exports = {
    getDatabaseConfig,
    SCHEMA_DEFINITIONS,
    initializeTables,
    testConnection,
    getDatabaseStats
};