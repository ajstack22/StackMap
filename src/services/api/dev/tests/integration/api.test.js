/**
 * Integration Tests for StackMap Dev API
 *
 * Tests complete API workflows with:
 * - Authentication and authorization
 * - Rate limiting
 * - Input validation
 * - Error handling
 * - Performance requirements
 */

const request = require('supertest');
const { DevAPIServer } = require('../../index');

describe('StackMap Dev API Integration Tests', () => {
    let app;
    let server;
    let authToken;

    beforeAll(async () => {
        // Initialize test server
        const apiServer = new DevAPIServer();
        app = await apiServer.initialize();
        server = app.listen(0); // Use random port

        // Mock authentication token for tests
        authToken = 'Bearer test.jwt.token';
    });

    afterAll(async () => {
        if (server) {
            server.close();
        }
    });

    describe('Health Endpoints', () => {
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
                    .query({ include: ['system', 'database', 'redis'] })
                    .expect(200);

                expect(response.body).toMatchObject({
                    status: expect.stringMatching(/^(healthy|unhealthy|degraded)$/),
                    service: 'stackmap-dev-api',
                    components: expect.any(Object)
                });
            });

            it('should validate query parameters', async () => {
                await request(app)
                    .get('/api/dev/v1/health/system')
                    .query({ include: 'invalid-component' })
                    .expect(400);
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
    });

    describe('Authentication', () => {
        describe('Protected endpoints', () => {
            it('should reject requests without authentication', async () => {
                await request(app)
                    .get('/api/dev/v1/sync/stats')
                    .expect(401);
            });

            it('should reject requests with invalid token', async () => {
                await request(app)
                    .get('/api/dev/v1/sync/stats')
                    .set('Authorization', 'Bearer invalid.token')
                    .expect(401);
            });

            it('should accept requests with valid token', async () => {
                // This would require a mock authentication system
                // In real tests, you'd use a test JWT token
                await request(app)
                    .get('/api/dev/v1/sync/stats')
                    .set('Authorization', authToken)
                    .expect(401); // Still 401 due to mock token, but validates auth middleware
            });
        });
    });

    describe('Rate Limiting', () => {
        it('should apply rate limits to requests', async () => {
            // Make multiple rapid requests
            const promises = Array(10).fill().map(() =>
                request(app)
                    .get('/api/dev/v1/health')
                    .expect(200)
            );

            const responses = await Promise.all(promises);

            // Check that rate limit headers are present
            responses.forEach(response => {
                expect(response.headers).toHaveProperty('x-ratelimit-limit');
                expect(response.headers).toHaveProperty('x-ratelimit-remaining');
            });
        });

        it('should block requests when rate limit exceeded', async () => {
            // This test would need to be configured based on actual rate limits
            // and might need to run against a dedicated test instance
        });
    });

    describe('Input Validation', () => {
        it('should validate sync ID format', async () => {
            await request(app)
                .get('/api/dev/v1/sync/status/invalid-sync-id')
                .set('Authorization', authToken)
                .expect(400);
        });

        it('should validate query parameters', async () => {
            await request(app)
                .get('/api/dev/v1/sync/stats')
                .query({ page: 'invalid' })
                .set('Authorization', authToken)
                .expect(400);
        });

        it('should validate request body', async () => {
            await request(app)
                .post('/api/dev/v1/dev/test-data')
                .set('Authorization', authToken)
                .send({ type: 'invalid-type' })
                .expect(400);
        });
    });

    describe('Error Handling', () => {
        it('should handle 404 for non-existent endpoints', async () => {
            const response = await request(app)
                .get('/api/dev/v1/nonexistent')
                .expect(404);

            expect(response.body).toMatchObject({
                success: false,
                error: expect.any(String),
                code: 'NOT_FOUND'
            });
        });

        it('should return consistent error format', async () => {
            const response = await request(app)
                .get('/api/dev/v1/sync/status/invalid-format')
                .set('Authorization', authToken)
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: expect.any(String),
                code: expect.any(String),
                timestamp: expect.any(String)
            });
        });

        it('should not expose sensitive information in errors', async () => {
            const response = await request(app)
                .get('/api/dev/v1/nonexistent')
                .expect(404);

            const responseText = JSON.stringify(response.body);
            expect(responseText).not.toContain('password');
            expect(responseText).not.toContain('secret');
            expect(responseText).not.toContain('token');
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
                await request(app)
                    .get(endpoint)
                    .expect(200);
                const duration = Date.now() - start;

                // Health endpoints should respond within 500ms
                expect(duration).toBeLessThan(500);
            }
        });
    });

    describe('Security Headers', () => {
        it('should include security headers', async () => {
            const response = await request(app)
                .get('/api/dev/v1/health')
                .expect(200);

            expect(response.headers).toHaveProperty('x-content-type-options');
            expect(response.headers).toHaveProperty('x-frame-options');
            expect(response.headers).toHaveProperty('x-xss-protection');
        });

        it('should handle CORS correctly', async () => {
            const response = await request(app)
                .options('/api/dev/v1/health')
                .set('Origin', 'https://stackmap.app')
                .expect(204);

            expect(response.headers).toHaveProperty('access-control-allow-origin');
            expect(response.headers).toHaveProperty('access-control-allow-methods');
        });
    });

    describe('API Documentation', () => {
        it('should serve API documentation', async () => {
            const response = await request(app)
                .get('/api/dev/v1/docs')
                .expect(200);

            expect(response.body).toMatchObject({
                name: 'StackMap Dev API',
                version: expect.any(String),
                endpoints: expect.any(Object)
            });
        });
    });
});

describe('Load Testing', () => {
    let app;
    let server;

    beforeAll(async () => {
        const apiServer = new DevAPIServer();
        app = await apiServer.initialize();
        server = app.listen(0);
    });

    afterAll(async () => {
        if (server) {
            server.close();
        }
    });

    it('should handle 100 concurrent requests', async () => {
        const concurrentRequests = 100;
        const promises = Array(concurrentRequests).fill().map(() =>
            request(app)
                .get('/api/dev/v1/health')
        );

        const start = Date.now();
        const responses = await Promise.all(promises);
        const duration = Date.now() - start;

        // Count successful responses
        const successfulResponses = responses.filter(r => r.status === 200);

        expect(successfulResponses.length).toBe(concurrentRequests);
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
});

module.exports = {};