/**
 * Standalone Health Endpoints Tests
 *
 * Simple integration tests for health endpoints without complex mocking
 * Focuses on verifying the endpoints respond correctly and meet performance requirements
 */

const request = require('supertest');
const express = require('express');
const healthController = require('../../controllers/healthController');

// Create minimal express app for testing health endpoints
const createTestApp = () => {
    const app = express();

    // Basic health endpoint
    app.get('/api/dev/v1/health', async (req, res) => {
        try {
            await healthController.basicHealthCheck(req, res);
        } catch (error) {
            res.status(500).json({ error: 'Health check failed' });
        }
    });

    // System health endpoint
    app.get('/api/dev/v1/health/system', async (req, res) => {
        try {
            await healthController.getSystemHealth(req, res);
        } catch (error) {
            res.status(500).json({ error: 'System health check failed' });
        }
    });

    // Database health endpoint
    app.get('/api/dev/v1/health/database', async (req, res) => {
        try {
            await healthController.getDatabaseHealth(req, res);
        } catch (error) {
            res.status(500).json({ error: 'Database health check failed' });
        }
    });

    // Redis health endpoint
    app.get('/api/dev/v1/health/redis', async (req, res) => {
        try {
            await healthController.getRedisHealth(req, res);
        } catch (error) {
            res.status(500).json({ error: 'Redis health check failed' });
        }
    });

    // Prometheus metrics endpoint
    app.get('/api/dev/v1/health/prometheus', async (req, res) => {
        try {
            await healthController.getPrometheusMetrics(req, res);
        } catch (error) {
            res.status(500).send('# Health metrics unavailable\n');
        }
    });

    return app;
};

describe('Health Endpoints - Standalone Tests', () => {
    let app;

    beforeAll(() => {
        app = createTestApp();
    });

    describe('GET /api/dev/v1/health', () => {
        it('should return basic health status', async () => {
            const response = await request(app)
                .get('/api/dev/v1/health')
                .expect(200);

            expect(response.body).toMatchObject({
                status: 'healthy',
                service: 'stackmap-dev-api',
                timestamp: expect.any(String),
                uptime: expect.any(Number)
            });

            expect(response.body.responseTime).toBeLessThan(100);
        });

        it('should respond within performance requirements', async () => {
            const start = Date.now();
            await request(app)
                .get('/api/dev/v1/health')
                .expect(200);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(100);
        });
    });

    describe('GET /api/dev/v1/health/system', () => {
        it('should return detailed system health', async () => {
            const response = await request(app)
                .get('/api/dev/v1/health/system')
                .query({ include: ['system', 'database', 'redis'] });

            // Should respond with either 200 (healthy) or 503 (unhealthy due to missing DB/Redis)
            expect([200, 503]).toContain(response.status);

            expect(response.body).toMatchObject({
                status: expect.stringMatching(/^(healthy|unhealthy|degraded)$/),
                service: 'stackmap-dev-api',
                components: expect.any(Object)
            });
        });

        it('should validate query parameters', async () => {
            const response = await request(app)
                .get('/api/dev/v1/health/system')
                .query({ include: 'invalid-component' });

            // Should not crash - either accept gracefully or return 400
            expect([200, 400].includes(response.status)).toBe(true);
        });

        it('should return Prometheus format when requested', async () => {
            const response = await request(app)
                .get('/api/dev/v1/health/system')
                .query({ format: 'prometheus' })
                .expect(200);

            expect(response.headers['content-type']).toContain('text/plain');
            expect(response.text).toContain('stackmap_dev_api_health');
        });
    });

    describe('Performance Requirements', () => {
        it('should handle concurrent requests', async () => {
            const concurrentRequests = 10;
            const promises = Array(concurrentRequests).fill().map(() =>
                request(app)
                    .get('/api/dev/v1/health')
                    .expect(200)
            );

            const start = Date.now();
            const responses = await Promise.all(promises);
            const duration = Date.now() - start;

            // All requests should complete within reasonable time
            expect(duration).toBeLessThan(1000);
            expect(responses).toHaveLength(concurrentRequests);
        });

        it('should meet response time requirements', async () => {
            const endpoints = [
                '/api/dev/v1/health',
                '/api/dev/v1/health/system',
                '/api/dev/v1/health/database',
                '/api/dev/v1/health/redis'
            ];

            for (const endpoint of endpoints) {
                const start = Date.now();
                const response = await request(app)
                    .get(endpoint);

                // Should respond (any status is fine, just needs to respond)
                expect([200, 503]).toContain(response.status);

                const duration = Date.now() - start;

                // Health endpoints should respond within 500ms
                expect(duration).toBeLessThan(500);
            }
        });
    });

    describe('Prometheus Metrics', () => {
        it('should return metrics in Prometheus format', async () => {
            const response = await request(app)
                .get('/api/dev/v1/health/prometheus')
                .expect(200);

            expect(response.headers['content-type']).toContain('text/plain');
            expect(response.text).toContain('stackmap_dev_api_health');
            expect(response.text).toContain('stackmap_dev_api_uptime');
        });
    });
});

module.exports = {};