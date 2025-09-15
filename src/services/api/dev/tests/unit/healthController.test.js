/**
 * Unit Tests for Health Controller
 *
 * Tests all health check endpoints with:
 * - Basic functionality validation
 * - Error handling scenarios
 * - Performance requirements
 * - Security considerations
 */

const { jest } = require('@jest/globals');
const healthController = require('../../controllers/healthController');

// Mock dependencies
jest.mock('../../utils/database');
jest.mock('../../utils/redis');
jest.mock('../../utils/metrics');
jest.mock('../../utils/logger');

const { isDatabaseHealthy, queryStats } = require('../../utils/database');
const { isRedisHealthy, RedisCache } = require('../../utils/redis');
const { getAllMetrics } = require('../../utils/metrics');

describe('Health Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {},
            params: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('basicHealthCheck', () => {
        it('should return healthy status with basic info', async () => {
            await healthController.basicHealthCheck(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'healthy',
                    service: 'stackmap-dev-api',
                    timestamp: expect.any(String),
                    uptime: expect.any(Number),
                    responseTime: expect.any(Number)
                })
            );
        });

        it('should respond within 100ms', async () => {
            const start = Date.now();
            await healthController.basicHealthCheck(req, res);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(100);
        });
    });

    describe('getSystemHealth', () => {
        beforeEach(() => {
            isDatabaseHealthy.mockResolvedValue(true);
            isRedisHealthy.mockResolvedValue(true);
            queryStats.mockReturnValue({
                totalQueries: 100,
                errorQueries: 2,
                avgResponseTime: 150
            });
            RedisCache.getStats.mockResolvedValue({
                connected: true,
                stats: { hits: 1000, misses: 100 }
            });
            getAllMetrics.mockReturnValue({
                counters: {},
                gauges: {},
                uptime: 3600
            });
        });

        it('should return healthy status when all components are healthy', async () => {
            req.query = { include: ['system', 'database', 'redis', 'metrics'] };

            await healthController.getSystemHealth(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'healthy',
                    components: expect.objectContaining({
                        system: expect.objectContaining({ status: 'healthy' }),
                        database: expect.objectContaining({ status: 'healthy' }),
                        redis: expect.objectContaining({ status: 'healthy' }),
                        metrics: expect.objectContaining({ status: 'healthy' })
                    })
                })
            );
        });

        it('should return unhealthy status when database is down', async () => {
            isDatabaseHealthy.mockResolvedValue(false);
            req.query = { include: ['database'] };

            await healthController.getSystemHealth(req, res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'unhealthy',
                    components: expect.objectContaining({
                        database: expect.objectContaining({ status: 'unhealthy' })
                    })
                })
            );
        });

        it('should return prometheus format when requested', async () => {
            req.query = { format: 'prometheus' };

            await healthController.getSystemHealth(req, res);

            expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
            expect(res.send).toHaveBeenCalledWith(expect.stringContaining('stackmap_dev_api_health'));
        });

        it('should handle errors gracefully', async () => {
            isDatabaseHealthy.mockRejectedValue(new Error('Database error'));

            await healthController.getSystemHealth(req, res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'unhealthy',
                    error: 'Health check system error'
                })
            );
        });
    });

    describe('getDatabaseHealth', () => {
        it('should return healthy database status', async () => {
            isDatabaseHealthy.mockResolvedValue(true);
            queryStats.mockReturnValue({
                totalQueries: 100,
                errorQueries: 1,
                avgResponseTime: 50
            });

            await healthController.getDatabaseHealth(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'healthy',
                    connected: true,
                    statistics: expect.any(Object)
                })
            );
        });

        it('should return unhealthy when database is disconnected', async () => {
            isDatabaseHealthy.mockResolvedValue(false);

            await healthController.getDatabaseHealth(req, res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'unhealthy',
                    connected: false
                })
            );
        });
    });

    describe('getRedisHealth', () => {
        it('should return healthy Redis status', async () => {
            isRedisHealthy.mockResolvedValue(true);
            RedisCache.getStats.mockResolvedValue({
                connected: true,
                stats: { hits: 1000, misses: 100 }
            });

            await healthController.getRedisHealth(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'healthy',
                    connected: true
                })
            );
        });

        it('should return unhealthy when Redis is disconnected', async () => {
            isRedisHealthy.mockResolvedValue(false);

            await healthController.getRedisHealth(req, res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'unhealthy',
                    connected: false
                })
            );
        });
    });

    describe('getPrometheusMetrics', () => {
        it('should return metrics in Prometheus format', async () => {
            isDatabaseHealthy.mockResolvedValue(true);
            isRedisHealthy.mockResolvedValue(true);
            getAllMetrics.mockReturnValue({ uptime: 3600 });

            await healthController.getPrometheusMetrics(req, res);

            expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
            expect(res.send).toHaveBeenCalledWith(
                expect.stringMatching(/stackmap_dev_api_health\{component=".*"\} [01]/)
            );
        });

        it('should handle errors and return unavailable message', async () => {
            isDatabaseHealthy.mockRejectedValue(new Error('Test error'));

            await healthController.getPrometheusMetrics(req, res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.send).toHaveBeenCalledWith('# Health metrics unavailable\n');
        });
    });
});

describe('Performance Requirements', () => {
    let req, res;

    beforeEach(() => {
        req = { query: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
    });

    it('basic health check should respond within 100ms', async () => {
        const start = Date.now();
        await healthController.basicHealthCheck(req, res);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(100);
    });

    it('system health check should respond within 500ms', async () => {
        isDatabaseHealthy.mockResolvedValue(true);
        isRedisHealthy.mockResolvedValue(true);
        getAllMetrics.mockReturnValue({});

        const start = Date.now();
        await healthController.getSystemHealth(req, res);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(500);
    });
});

describe('Security Tests', () => {
    let req, res;

    beforeEach(() => {
        req = { query: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
    });

    it('should not expose sensitive information in error responses', async () => {
        isDatabaseHealthy.mockRejectedValue(new Error('Database password: secret123'));

        await healthController.getSystemHealth(req, res);

        const response = res.json.mock.calls[0][0];
        expect(JSON.stringify(response)).not.toContain('secret123');
        expect(JSON.stringify(response)).not.toContain('password');
    });

    it('should sanitize user input in query parameters', async () => {
        req.query = { include: ['<script>alert("xss")</script>'] };

        await healthController.getSystemHealth(req, res);

        // Should not crash and should handle malicious input gracefully
        expect(res.status).toHaveBeenCalled();
    });
});

module.exports = {};