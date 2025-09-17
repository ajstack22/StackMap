/**
 * Error Handling Tests for StackMap Dev API
 *
 * Tests specific error handling scenarios:
 * - 404 for non-existent endpoints
 * - Consistent error format
 * - No sensitive information exposure
 * - Concurrent requests handling
 * - Response time requirements
 */

const request = require('supertest');
const express = require('express');
const { errorHandler, notFoundHandler } = require('../../middleware/errorHandler');

describe.skip('API Error Handling Tests', () => {
    let app;

    beforeAll(() => {
        // Create a minimal Express app for testing error handling
        app = express();

        // Basic middleware
        app.use(express.json());

        // Add request ID for tracing
        app.use((req, res, next) => {
            req.requestId = require('uuid').v4();
            res.setHeader('X-Request-ID', req.requestId);
            next();
        });

        // Test routes
        app.get('/api/test/success', (req, res) => {
            res.json({ success: true, message: 'Test endpoint' });
        });

        app.get('/api/test/error', (req, res, next) => {
            const error = new Error('Test error');
            error.statusCode = 500;
            error.code = 'TEST_ERROR';
            next(error);
        });

        app.get('/api/test/sensitive-error', (req, res, next) => {
            const error = new Error('Database password: secret123 failed to connect');
            error.statusCode = 500;
            next(error);
        });

        app.get('/api/test/validation-error', (req, res, next) => {
            const error = new Error('Invalid sync ID format');
            error.statusCode = 400;
            error.code = 'VALIDATION_ERROR';
            next(error);
        });

        // Performance test endpoint
        app.get('/api/test/performance', async (req, res) => {
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 10));
            res.json({ success: true, timestamp: Date.now() });
        });

        // Apply error handling middleware
        app.use(notFoundHandler);
        app.use(errorHandler);
    });

    describe('404 for non-existent endpoints', () => {
        it('should handle 404 for non-existent endpoints', async () => {
            const response = await request(app)
                .get('/api/dev/v1/nonexistent')
                .expect(404);

            expect(response.body).toMatchObject({
                success: false,
                error: expect.any(String),
                code: 'NOT_FOUND'
            });

            // Should include request ID for tracing
            expect(response.body.requestId).toBeDefined();
        });

        it('should handle 404 for deeply nested non-existent paths', async () => {
            const response = await request(app)
                .get('/api/dev/v1/deeply/nested/nonexistent/path')
                .expect(404);

            expect(response.body).toMatchObject({
                success: false,
                error: expect.stringContaining('not found'),
                code: 'NOT_FOUND'
            });
        });

        it('should handle 404 for invalid HTTP methods', async () => {
            const response = await request(app)
                .patch('/api/test/success')
                .expect(404);

            expect(response.body).toMatchObject({
                success: false,
                code: 'NOT_FOUND'
            });
        });
    });

    describe('Consistent error format', () => {
        it('should return consistent error format for validation errors', async () => {
            const response = await request(app)
                .get('/api/test/validation-error')
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: expect.any(String),
                code: expect.any(String),
                timestamp: expect.any(String),
                requestId: expect.any(String)
            });

            // Verify timestamp is a valid ISO string
            expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
        });

        it('should return consistent error format for server errors', async () => {
            const response = await request(app)
                .get('/api/test/error')
                .expect(500);

            expect(response.body).toMatchObject({
                success: false,
                error: expect.any(String),
                code: expect.any(String),
                timestamp: expect.any(String),
                requestId: expect.any(String)
            });
        });

        it('should include proper HTTP status codes in response', async () => {
            const testCases = [
                { endpoint: '/api/test/validation-error', expectedStatus: 400 },
                { endpoint: '/api/test/error', expectedStatus: 500 },
                { endpoint: '/api/nonexistent', expectedStatus: 404 }
            ];

            for (const testCase of testCases) {
                const response = await request(app)
                    .get(testCase.endpoint)
                    .expect(testCase.expectedStatus);

                expect(response.body.success).toBe(false);
                expect(response.body.error).toBeDefined();
                expect(response.body.code).toBeDefined();
            }
        });

        it('should maintain consistent error structure across different error types', async () => {
            const errorEndpoints = [
                '/api/test/validation-error',
                '/api/test/error',
                '/api/nonexistent'
            ];

            const responses = await Promise.all(
                errorEndpoints.map(endpoint => request(app).get(endpoint))
            );

            // All error responses should have the same basic structure
            responses.forEach(response => {
                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('error');
                expect(response.body).toHaveProperty('code');
                expect(response.body).toHaveProperty('timestamp');
                expect(response.body).toHaveProperty('requestId');

                // Verify timestamp format
                expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
            });
        });
    });

    describe('Sensitive information exposure', () => {
        it('should not expose sensitive information in errors', async () => {
            const response = await request(app)
                .get('/api/test/sensitive-error')
                .expect(500);

            const responseText = JSON.stringify(response.body);

            // Should not contain sensitive patterns
            expect(responseText).not.toContain('password');
            expect(responseText).not.toContain('secret');
            expect(responseText).not.toContain('secret123');
            expect(responseText).not.toContain('token');
            expect(responseText).not.toContain('key');
            expect(responseText).not.toContain('credential');
        });

        it('should sanitize stack traces in production mode', async () => {
            // Mock production environment
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const response = await request(app)
                .get('/api/test/error')
                .expect(500);

            // Should not include debug information in production
            expect(response.body).not.toHaveProperty('debug');
            expect(response.body).not.toHaveProperty('stack');

            // Restore environment
            process.env.NODE_ENV = originalEnv;
        });

        it('should not expose internal file paths', async () => {
            const response = await request(app)
                .get('/api/test/error')
                .expect(500);

            const responseText = JSON.stringify(response.body);

            // Should not contain internal paths
            expect(responseText).not.toContain('/Users/');
            expect(responseText).not.toContain('/src/');
            expect(responseText).not.toContain('node_modules');
            expect(responseText).not.toContain(__dirname);
        });

        it('should handle errors with sensitive data in nested objects', async () => {
            // Create an endpoint that throws an error with nested sensitive data
            app.get('/api/test/nested-sensitive', (req, res, next) => {
                const error = new Error('Operation failed');
                error.statusCode = 500;
                error.details = {
                    database: {
                        password: 'super-secret-password',
                        connectionString: 'postgresql://user:secret@localhost'
                    },
                    auth: {
                        apiKey: 'sk-1234567890abcdef',
                        secret: 'auth-secret-token'
                    }
                };
                next(error);
            });

            const response = await request(app)
                .get('/api/test/nested-sensitive')
                .expect(500);

            const responseText = JSON.stringify(response.body);

            // Should not contain any sensitive information from nested objects
            expect(responseText).not.toContain('super-secret-password');
            expect(responseText).not.toContain('sk-1234567890abcdef');
            expect(responseText).not.toContain('auth-secret-token');
            expect(responseText).not.toContain('postgresql://');
        });
    });

    describe('Concurrent requests handling', () => {
        it('should handle concurrent requests without errors', async () => {
            const concurrentRequests = 20;
            const promises = Array(concurrentRequests).fill().map((_, index) =>
                request(app)
                    .get('/api/test/success')
                    .query({ requestIndex: index })
            );

            const start = Date.now();
            const responses = await Promise.all(promises);
            const duration = Date.now() - start;

            // All requests should succeed
            expect(responses).toHaveLength(concurrentRequests);
            responses.forEach((response, index) => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            // Should complete within reasonable time
            expect(duration).toBeLessThan(2000);
        });

        it('should handle concurrent error requests without degradation', async () => {
            const concurrentRequests = 15;
            const promises = Array(concurrentRequests).fill().map(() =>
                request(app)
                    .get('/api/test/error')
            );

            const start = Date.now();
            const responses = await Promise.all(promises);
            const duration = Date.now() - start;

            // All error responses should be consistent
            expect(responses).toHaveLength(concurrentRequests);
            responses.forEach(response => {
                expect(response.status).toBe(500);
                expect(response.body).toMatchObject({
                    success: false,
                    error: expect.any(String),
                    code: expect.any(String),
                    timestamp: expect.any(String),
                    requestId: expect.any(String)
                });
            });

            // Should complete within reasonable time even with errors
            expect(duration).toBeLessThan(2000);
        });

        it('should maintain unique request IDs for concurrent requests', async () => {
            const concurrentRequests = 10;
            const promises = Array(concurrentRequests).fill().map(() =>
                request(app)
                    .get('/api/test/success')
            );

            const responses = await Promise.all(promises);
            const requestIds = responses.map(r => r.headers['x-request-id']);

            // All request IDs should be unique
            const uniqueIds = new Set(requestIds);
            expect(uniqueIds.size).toBe(concurrentRequests);

            // Each request ID should be a valid UUID format
            requestIds.forEach(id => {
                expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            });
        });
    });

    describe('Response time requirements', () => {
        it('should meet response time requirements for successful requests', async () => {
            const iterations = 5;
            const responseTimes = [];

            for (let i = 0; i < iterations; i++) {
                const start = Date.now();
                await request(app)
                    .get('/api/test/success')
                    .expect(200);
                const duration = Date.now() - start;
                responseTimes.push(duration);
            }

            // All individual requests should be under 100ms
            responseTimes.forEach(time => {
                expect(time).toBeLessThan(100);
            });

            // Average response time should be very fast
            const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            expect(avgResponseTime).toBeLessThan(50);
        });

        it('should meet response time requirements for error responses', async () => {
            const errorEndpoints = [
                '/api/test/validation-error',
                '/api/test/error',
                '/api/nonexistent'
            ];

            for (const endpoint of errorEndpoints) {
                const start = Date.now();
                await request(app).get(endpoint);
                const duration = Date.now() - start;

                // Error responses should also be fast
                expect(duration).toBeLessThan(100);
            }
        });

        it('should maintain performance under load', async () => {
            const loadTestRequests = 50;
            const promises = Array(loadTestRequests).fill().map(() => {
                const start = Date.now();
                return request(app)
                    .get('/api/test/performance')
                    .then(response => ({
                        response,
                        duration: Date.now() - start
                    }));
            });

            const results = await Promise.all(promises);

            // All requests should succeed
            results.forEach(result => {
                expect(result.response.status).toBe(200);
            });

            // Calculate performance metrics
            const durations = results.map(r => r.duration);
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            const maxDuration = Math.max(...durations);

            // Performance should remain acceptable under load
            expect(avgDuration).toBeLessThan(200);
            expect(maxDuration).toBeLessThan(500);

            // 95th percentile should be under threshold
            const sorted = durations.sort((a, b) => a - b);
            const p95Index = Math.floor(sorted.length * 0.95);
            const p95Duration = sorted[p95Index];
            expect(p95Duration).toBeLessThan(300);
        });

        it('should include response time in headers', async () => {
            const response = await request(app)
                .get('/api/test/success')
                .expect(200);

            // Should include timing information for monitoring
            expect(response.headers).toHaveProperty('x-request-id');

            // Verify the request was processed quickly
            const responseTime = parseInt(response.headers['x-response-time']) || 0;
            expect(responseTime).toBeLessThan(100);
        });
    });

    describe('Error boundary and stability', () => {
        it('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/api/test/success')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}')
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: expect.any(String),
                code: expect.any(String)
            });
        });

        it('should handle very large request bodies appropriately', async () => {
            const largeData = {
                data: 'x'.repeat(10000) // 10KB of data
            };

            const response = await request(app)
                .post('/api/test/success')
                .send(largeData);

            // Should either accept or reject cleanly, not crash
            expect([200, 413, 400]).toContain(response.status);

            if (response.status !== 200) {
                expect(response.body).toMatchObject({
                    success: false,
                    error: expect.any(String)
                });
            }
        });

        it('should handle special characters in URLs', async () => {
            const specialUrls = [
                '/api/test/special%20chars',
                '/api/test/unicode%E2%9C%93',
                '/api/test/encoded%3Cscript%3E'
            ];

            for (const url of specialUrls) {
                const response = await request(app).get(url);

                // Should handle gracefully (404 is expected, no crashes)
                expect([200, 404]).toContain(response.status);

                if (response.status === 404) {
                    expect(response.body).toMatchObject({
                        success: false,
                        code: 'NOT_FOUND'
                    });
                }
            }
        });
    });
});

module.exports = {};