/**
 * Database Utility for StackMap Dev API
 *
 * Provides MySQL database connection management and utility functions with:
 * - Connection pooling for high performance
 * - Automatic retry logic and failover handling
 * - Query performance monitoring and optimization
 * - SQL injection prevention and security measures
 * - Health monitoring and statistics collection
 */

const mysql = require('mysql2/promise');
const { getDatabaseConfig, initializeTables, testConnection, getDatabaseStats } = require('../config/database');
const { logger } = require('./logger');

/**
 * Database connection pool
 */
let dbPool = null;
let isConnected = false;
let connectionRetries = 0;
const maxRetries = 5;

/**
 * Query performance tracking
 */
const queryStats = {
    totalQueries: 0,
    slowQueries: 0,
    errorQueries: 0,
    avgResponseTime: 0,
    slowQueryThreshold: 1000 // 1 second
};

/**
 * Initialize database connection pool
 */
const initializeDatabase = async () => {
    try {
        const config = getDatabaseConfig();

        // Create connection pool
        dbPool = mysql.createPool(config);

        // Test initial connection
        const connection = await dbPool.getConnection();
        logger.info('Database connection pool created successfully');

        // Initialize tables
        await initializeTables(connection);

        // Release test connection
        connection.release();

        isConnected = true;
        connectionRetries = 0;

        // Set up connection event handlers
        setupPoolEventHandlers();

        return dbPool;

    } catch (error) {
        connectionRetries++;
        logger.error(`Database initialization failed (attempt ${connectionRetries}/${maxRetries}):`, error);

        if (connectionRetries < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000);
            logger.info(`Retrying database connection in ${delay}ms`);
            setTimeout(initializeDatabase, delay);
        } else {
            logger.error('Max database connection retries reached');
            isConnected = false;
        }

        throw error;
    }
};

/**
 * Setup pool event handlers
 */
const setupPoolEventHandlers = () => {
    if (!dbPool) return;

    dbPool.on('connection', (connection) => {
        logger.debug(`New database connection established as id ${connection.threadId}`);
    });

    dbPool.on('error', (error) => {
        logger.error('Database pool error:', error);
        if (error.code === 'PROTOCOL_CONNECTION_LOST') {
            isConnected = false;
            // Attempt to reconnect
            setTimeout(() => initializeDatabase(), 5000);
        }
    });

    dbPool.on('release', (connection) => {
        logger.debug(`Database connection ${connection.threadId} released`);
    });
};

/**
 * Close database connection pool
 */
const closeDatabase = async () => {
    try {
        if (dbPool) {
            await dbPool.end();
            dbPool = null;
            isConnected = false;
            logger.info('Database connection pool closed');
        }
    } catch (error) {
        logger.error('Error closing database pool:', error);
    }
};

/**
 * Check database health
 */
const isDatabaseHealthy = async () => {
    try {
        if (!dbPool || !isConnected) {
            return false;
        }

        const connection = await dbPool.getConnection();
        const health = await testConnection(connection);
        connection.release();

        return health.status === 'healthy';
    } catch (error) {
        logger.warn('Database health check failed:', error);
        isConnected = false;
        return false;
    }
};

/**
 * Database Query Interface
 */
class DatabaseQuery {
    /**
     * Execute a SELECT query with performance monitoring
     */
    static async select(query, params = []) {
        const startTime = Date.now();
        let connection = null;

        try {
            if (!dbPool || !isConnected) {
                throw new Error('Database not connected');
            }

            connection = await dbPool.getConnection();
            const [rows] = await connection.execute(query, params);

            const responseTime = Date.now() - startTime;
            this.updateQueryStats(responseTime, false);

            logger.debug('Database SELECT query executed', {
                query: this.sanitizeQuery(query),
                params: params.length,
                responseTime,
                rowCount: rows.length
            });

            return rows;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateQueryStats(responseTime, true);

            logger.error('Database SELECT query failed', {
                query: this.sanitizeQuery(query),
                params: params.length,
                responseTime,
                error: error.message
            });

            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Execute an INSERT query
     */
    static async insert(query, params = []) {
        const startTime = Date.now();
        let connection = null;

        try {
            if (!dbPool || !isConnected) {
                throw new Error('Database not connected');
            }

            connection = await dbPool.getConnection();
            const [result] = await connection.execute(query, params);

            const responseTime = Date.now() - startTime;
            this.updateQueryStats(responseTime, false);

            logger.debug('Database INSERT query executed', {
                query: this.sanitizeQuery(query),
                params: params.length,
                responseTime,
                insertId: result.insertId,
                affectedRows: result.affectedRows
            });

            return result;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateQueryStats(responseTime, true);

            logger.error('Database INSERT query failed', {
                query: this.sanitizeQuery(query),
                params: params.length,
                responseTime,
                error: error.message
            });

            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Execute an UPDATE query
     */
    static async update(query, params = []) {
        const startTime = Date.now();
        let connection = null;

        try {
            if (!dbPool || !isConnected) {
                throw new Error('Database not connected');
            }

            connection = await dbPool.getConnection();
            const [result] = await connection.execute(query, params);

            const responseTime = Date.now() - startTime;
            this.updateQueryStats(responseTime, false);

            logger.debug('Database UPDATE query executed', {
                query: this.sanitizeQuery(query),
                params: params.length,
                responseTime,
                affectedRows: result.affectedRows,
                changedRows: result.changedRows
            });

            return result;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateQueryStats(responseTime, true);

            logger.error('Database UPDATE query failed', {
                query: this.sanitizeQuery(query),
                params: params.length,
                responseTime,
                error: error.message
            });

            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Execute a DELETE query
     */
    static async delete(query, params = []) {
        const startTime = Date.now();
        let connection = null;

        try {
            if (!dbPool || !isConnected) {
                throw new Error('Database not connected');
            }

            connection = await dbPool.getConnection();
            const [result] = await connection.execute(query, params);

            const responseTime = Date.now() - startTime;
            this.updateQueryStats(responseTime, false);

            logger.debug('Database DELETE query executed', {
                query: this.sanitizeQuery(query),
                params: params.length,
                responseTime,
                affectedRows: result.affectedRows
            });

            return result;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateQueryStats(responseTime, true);

            logger.error('Database DELETE query failed', {
                query: this.sanitizeQuery(query),
                params: params.length,
                responseTime,
                error: error.message
            });

            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Execute a transaction
     */
    static async transaction(queries) {
        let connection = null;

        try {
            if (!dbPool || !isConnected) {
                throw new Error('Database not connected');
            }

            connection = await dbPool.getConnection();
            await connection.beginTransaction();

            const results = [];
            for (const { query, params = [] } of queries) {
                const [result] = await connection.execute(query, params);
                results.push(result);
            }

            await connection.commit();

            logger.debug('Database transaction completed', {
                queryCount: queries.length
            });

            return results;

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }

            logger.error('Database transaction failed', {
                queryCount: queries.length,
                error: error.message
            });

            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Get database statistics
     */
    static async getStats() {
        try {
            if (!dbPool || !isConnected) {
                return null;
            }

            const connection = await dbPool.getConnection();
            const dbStats = await getDatabaseStats(connection);
            connection.release();

            return {
                ...dbStats,
                pool: {
                    totalConnections: dbPool.pool._allConnections.length,
                    freeConnections: dbPool.pool._freeConnections.length,
                    usedConnections: dbPool.pool._allConnections.length - dbPool.pool._freeConnections.length
                },
                queries: queryStats
            };

        } catch (error) {
            logger.error('Failed to get database stats:', error);
            return null;
        }
    }

    /**
     * Update query performance statistics
     */
    static updateQueryStats(responseTime, isError) {
        queryStats.totalQueries++;

        if (isError) {
            queryStats.errorQueries++;
        }

        if (responseTime > queryStats.slowQueryThreshold) {
            queryStats.slowQueries++;
        }

        // Update average response time
        queryStats.avgResponseTime = (
            (queryStats.avgResponseTime * (queryStats.totalQueries - 1) + responseTime) /
            queryStats.totalQueries
        );
    }

    /**
     * Sanitize query for logging (remove sensitive data)
     */
    static sanitizeQuery(query) {
        // Remove potential passwords and sensitive data from logs
        return query
            .replace(/password\s*=\s*'[^']*'/gi, "password='[REDACTED]'")
            .replace(/secret\s*=\s*'[^']*'/gi, "secret='[REDACTED]'")
            .replace(/token\s*=\s*'[^']*'/gi, "token='[REDACTED]'");
    }
}

/**
 * Prepared statement cache for performance
 */
class PreparedStatementCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    /**
     * Get or create prepared statement
     */
    async getStatement(connection, query) {
        if (this.cache.has(query)) {
            return this.cache.get(query);
        }

        const statement = await connection.prepare(query);

        // Add to cache with LRU eviction
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(query, statement);
        return statement;
    }

    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
    }
}

// Create prepared statement cache instance
const preparedStatementCache = new PreparedStatementCache();

/**
 * Migration utilities
 */
const MigrationUtils = {
    /**
     * Check if table exists
     */
    async tableExists(tableName) {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                AND table_name = ?
            `;

            const result = await DatabaseQuery.select(query, [tableName]);
            return result[0].count > 0;
        } catch (error) {
            logger.error(`Failed to check if table ${tableName} exists:`, error);
            return false;
        }
    },

    /**
     * Get table schema
     */
    async getTableSchema(tableName) {
        try {
            const query = `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                AND table_name = ?
                ORDER BY ordinal_position
            `;

            return await DatabaseQuery.select(query, [tableName]);
        } catch (error) {
            logger.error(`Failed to get schema for table ${tableName}:`, error);
            return [];
        }
    }
};

module.exports = {
    initializeDatabase,
    closeDatabase,
    isDatabaseHealthy,
    DatabaseQuery,
    PreparedStatementCache,
    MigrationUtils,
    dbPool: () => dbPool,
    queryStats: () => ({ ...queryStats })
};