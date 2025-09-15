/**
 * Development Controller for StackMap Dev API
 *
 * Handles development and debugging endpoints
 */

const { logger } = require('../utils/logger');

const generateTestData = async (req, res) => {
    const { type, count = 10, options = {} } = req.body;
    const startTime = Date.now();

    try {
        // Mock test data generation
        const testData = {
            type,
            count,
            generated: new Date().toISOString(),
            data: Array(count).fill(null).map((_, i) => ({
                id: `test_${type}_${i}`,
                created: new Date().toISOString()
            }))
        };

        logger.info('Test data generated', { type, count, user: req.user.id });

        res.json({
            success: true,
            data: testData,
            responseTime: Date.now() - startTime
        });
    } catch (error) {
        logger.error('Failed to generate test data:', error);
        throw error;
    }
};

const getDebugInfo = async (req, res) => {
    const { include = ['config', 'metrics'], format = 'json' } = req.query;
    const startTime = Date.now();

    try {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            included: include
        };

        res.json({
            success: true,
            data: debugInfo,
            responseTime: Date.now() - startTime
        });
    } catch (error) {
        logger.error('Failed to get debug info:', error);
        throw error;
    }
};

module.exports = {
    generateTestData,
    getDebugInfo
};