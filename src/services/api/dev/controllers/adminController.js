/**
 * Admin Controller for StackMap Dev API
 *
 * Handles administrative functions
 */

const { getAllMetrics } = require('../utils/metrics');
const { logger } = require('../utils/logger');

const getSystemMetrics = async (req, res) => {
    const { start, end, period = '1h', type, name, format = 'json' } = req.query;
    const startTime = Date.now();

    try {
        const metrics = getAllMetrics();

        res.json({
            success: true,
            data: metrics,
            responseTime: Date.now() - startTime
        });
    } catch (error) {
        logger.error('Failed to get system metrics:', error);
        throw error;
    }
};

const updateConfiguration = async (req, res) => {
    const { section, config, reason } = req.body;
    const startTime = Date.now();

    try {
        logger.info('Configuration update requested', {
            section,
            reason,
            admin: req.user.id
        });

        // Mock configuration update
        const result = {
            section,
            updated: new Date().toISOString(),
            admin: req.user.id,
            reason
        };

        res.json({
            success: true,
            data: result,
            responseTime: Date.now() - startTime
        });
    } catch (error) {
        logger.error('Failed to update configuration:', error);
        throw error;
    }
};

const setMaintenanceMode = async (req, res) => {
    const { enabled, message, duration, allowedIPs } = req.body;
    const startTime = Date.now();

    try {
        logger.warn('Maintenance mode changed', {
            enabled,
            message,
            duration,
            admin: req.user.id
        });

        const result = {
            maintenanceMode: enabled,
            message,
            duration,
            allowedIPs,
            setBy: req.user.id,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: result,
            responseTime: Date.now() - startTime
        });
    } catch (error) {
        logger.error('Failed to set maintenance mode:', error);
        throw error;
    }
};

module.exports = {
    getSystemMetrics,
    updateConfiguration,
    setMaintenanceMode
};