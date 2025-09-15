/**
 * Analytics Controller for StackMap Dev API
 *
 * Handles analytics and reporting endpoints with:
 * - API usage patterns and trends
 * - Performance metrics and analysis
 * - User behavior analytics
 * - Error analysis and reporting
 */

const { MetricsAnalyzer } = require('../utils/metrics');
const { DatabaseQuery } = require('../utils/database');
const { logger } = require('../utils/logger');

const getUsageAnalytics = async (req, res) => {
    const { start, end, period = '24h', metric, groupBy = 'day' } = req.query;
    const startTime = Date.now();

    try {
        const usage = await MetricsAnalyzer.getAPIPerformanceSummary(period);

        res.json({
            success: true,
            data: usage,
            responseTime: Date.now() - startTime
        });
    } catch (error) {
        logger.error('Failed to get usage analytics:', error);
        throw error;
    }
};

const getPerformanceAnalytics = async (req, res) => {
    const { start, end, period = '24h', metric, endpoint } = req.query;
    const startTime = Date.now();

    try {
        const performance = await MetricsAnalyzer.getAPIPerformanceSummary(period);

        res.json({
            success: true,
            data: performance,
            responseTime: Date.now() - startTime
        });
    } catch (error) {
        logger.error('Failed to get performance analytics:', error);
        throw error;
    }
};

const getUserAnalytics = async (req, res) => {
    const { userId } = req.params;
    const { start, end, period = '7d', includeDetails = false } = req.query;
    const startTime = Date.now();

    try {
        // Mock user analytics - in real implementation would query user-specific data
        const userAnalytics = {
            userId,
            period: { start, end, period },
            summary: {
                totalRequests: 150,
                avgResponseTime: 245,
                errorRate: 2.1,
                lastActive: new Date().toISOString()
            },
            trends: [],
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: userAnalytics,
            responseTime: Date.now() - startTime
        });
    } catch (error) {
        logger.error('Failed to get user analytics:', error);
        throw error;
    }
};

module.exports = {
    getUsageAnalytics,
    getPerformanceAnalytics,
    getUserAnalytics
};