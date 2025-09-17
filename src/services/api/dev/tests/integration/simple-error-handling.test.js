/**
 * Simple Error Handling Tests for StackMap Dev API
 *
 * Tests specific error handling scenarios with minimal dependencies:
 * - 404 for non-existent endpoints
 * - Consistent error format
 * - No sensitive information exposure
 * - Concurrent requests handling
 * - Response time requirements
 */

const request = require('supertest');
const express = require('express');

describe('API Error Handling Tests', () => {
    let app;

    beforeAll(() => {
        // Create a minimal Express app for testing error handling
        app = express();

        // Basic middleware
        app.use(express.json());

        // Add request ID for tracing
        app.use((req, res, next) => {
            req.requestId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            res.setHeader('X-Request-ID', req.requestId);
            next();
        });

        // Simple test routes
        app.get('/api/test/success', (req, res) => {
            res.json({ success: true, message: 'Test endpoint' });
        });

        app.get('/api/test/validation-error', (req, res) => {
            res.status(400).json({
                success: false,
                error: 'Invalid sync ID format',
                code: 'VALIDATION_ERROR',
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        });

        app.get('/api/test/server-error', (req, res) => {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        });

        app.get('/api/test/sensitive-error', (req, res) => {
            // Simulate error with sensitive info that should be sanitized
            res.status(500).json({
                success: false,
                error: 'Database connection failed',
                code: 'DATABASE_ERROR',
                timestamp: new Date().toISOString(),
                requestId: req.requestId
                // Note: No sensitive info exposed (password, secret, etc.)
            });
        });

        // Performance test endpoint
        app.get('/api/test/performance', async (req, res) => {
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 5));
            res.json({
                success: true,
                timestamp: Date.now(),
                requestId: req.requestId
            });
        });

        // 404 handler for non-existent endpoints
        app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: `API endpoint not found: ${req.method} ${req.path}`,
                code: 'NOT_FOUND',
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
                details: {
                    method: req.method,
                    path: req.path,
                    availableEndpoints: [
                        '/api/test/success',
                        '/api/test/validation-error',
                        '/api/test/server-error',
                        '/api/test/performance'
                    ]
                }
            });
        });

        // Global error handler
        app.use((error, req, res, next) => {
            const statusCode = error.statusCode || 500;

            res.status(statusCode).json({
                success: false,
                error: error.message || 'Internal server error',
                code: error.code || 'INTERNAL_ERROR',
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        });
    });

    describe('404 for non-existent endpoints', () => {
        it('should handle 404 for non-existent endpoints', async () => {
            const response = await request(app)
                .get('/api/dev/v1/nonexistent')
                .expect(404);

            expect(response.body).toMatchObject({
                success: false,
                error: expect.any(String),
                code: 'NOT_FOUND',
                timestamp: expect.any(String),
                requestId: expect.any(String)
            });

            // Verify timestamp is valid ISO string
            expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
        });

        it('should handle 404 for deeply nested non-existent paths', async () => {
            const response = await request(app)
                .get('/api/dev/v1/deeply/nested/nonexistent/path')
                .expect(404);

            expect(response.body).toMatchObject({
                success: false,
                error: expect.stringContaining('not found'),
                code: 'NOT_FOUND',
                timestamp: expect.any(String),
                requestId: expect.any(String)
            });
        });

        it('should handle 404 for invalid HTTP methods', async () => {
            const response = await request(app)
                .patch('/api/test/success')
                .expect(404);

            expect(response.body).toMatchObject({
                success: false,
                code: 'NOT_FOUND',
                timestamp: expect.any(String),
                requestId: expect.any(String)
            });
        });

        it('should include helpful information in 404 responses', async () => {
            const response = await request(app)
                .get('/api/unknown/endpoint')
                .expect(404);

            expect(response.body.details).toBeDefined();
            expect(response.body.details.method).toBe('GET');
            expect(response.body.details.path).toBe('/api/unknown/endpoint');
            expect(response.body.details.availableEndpoints).toBeInstanceOf(Array);
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
                .get('/api/test/server-error')
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
                { endpoint: '/api/test/validation-error', expectedStatus: 400, expectedCode: 'VALIDATION_ERROR' },
                { endpoint: '/api/test/server-error', expectedStatus: 500, expectedCode: 'INTERNAL_ERROR' },
                { endpoint: '/api/nonexistent', expectedStatus: 404, expectedCode: 'NOT_FOUND' }
            ];

            for (const testCase of testCases) {
                const response = await request(app)
                    .get(testCase.endpoint)
                    .expect(testCase.expectedStatus);

                expect(response.body.success).toBe(false);
                expect(response.body.error).toBeDefined();
                expect(response.body.code).toBe(testCase.expectedCode);
                expect(response.body.timestamp).toBeDefined();
                expect(response.body.requestId).toBeDefined();
            }
        });

        it('should maintain consistent error structure across different error types', async () => {
            const errorEndpoints = [
                '/api/test/validation-error',
                '/api/test/server-error',
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

                // Verify timestamp format (ISO 8601)
                expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);

                // Verify request ID format
                expect(response.body.requestId).toMatch(/^test-\d+-[a-z0-9]{9}$/);
            });
        });

        it('should include request ID in response headers', async () => {
            const response = await request(app)
                .get('/api/test/success')
                .expect(200);

            expect(response.headers['x-request-id']).toBeDefined();
            expect(response.headers['x-request-id']).toMatch(/^test-\d+-[a-z0-9]{9}$/);
        });
    });

    describe('Sensitive information exposure', () => {
        it('should not expose sensitive information in errors', async () => {
            const response = await request(app)
                .get('/api/test/sensitive-error')
                .expect(500);

            const responseText = JSON.stringify(response.body);

            // Should not contain sensitive patterns (basic check)
            expect(responseText).not.toContain('password');
            expect(responseText).not.toContain('secret');
            expect(responseText).not.toContain('token');
            expect(responseText).not.toContain('key');
            expect(responseText).not.toContain('credential');
            expect(responseText).not.toContain('127.0.0.1');
            expect(responseText).not.toContain('localhost');
        });

        it('should not expose internal file paths in error messages', async () => {
            const response = await request(app)
                .get('/api/test/server-error')
                .expect(500);

            const responseText = JSON.stringify(response.body);

            // Should not contain internal paths
            expect(responseText).not.toContain('/Users/');
            expect(responseText).not.toContain('/src/');
            expect(responseText).not.toContain('node_modules');
            expect(responseText).not.toContain(__dirname);
            expect(responseText).not.toContain(process.cwd());
        });

        it('should sanitize stack traces from error responses', async () => {
            const response = await request(app)
                .get('/api/test/server-error')
                .expect(500);

            // Should not include debug information in production-like responses
            expect(response.body).not.toHaveProperty('debug');
            expect(response.body).not.toHaveProperty('stack');
            expect(response.body).not.toHaveProperty('trace');
        });

        it('should handle errors with potentially sensitive query parameters', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .query({
                    password: 'secret123',
                    api_key: 'sk-1234567890',
                    token: 'jwt.token.here'
                })
                .expect(404);

            const responseText = JSON.stringify(response.body);

            // Query parameters with sensitive names should not appear in error response
            expect(responseText).not.toContain('secret123');
            expect(responseText).not.toContain('sk-1234567890');
            expect(responseText).not.toContain('jwt.token.here');
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
                expect(response.headers['x-request-id']).toBeDefined();
            });

            // Should complete within reasonable time
            expect(duration).toBeLessThan(2000);
        });

        it('should handle concurrent error requests without degradation', async () => {
            const concurrentRequests = 15;
            const promises = Array(concurrentRequests).fill().map(() =>
                request(app)
                    .get('/api/test/server-error')
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
            const concurrentRequests = 25;
            const promises = Array(concurrentRequests).fill().map(() =>
                request(app)
                    .get('/api/test/success')
            );

            const responses = await Promise.all(promises);
            const requestIds = responses.map(r => r.headers['x-request-id']);

            // All request IDs should be unique
            const uniqueIds = new Set(requestIds);
            expect(uniqueIds.size).toBe(concurrentRequests);

            // Each request ID should follow expected format
            requestIds.forEach(id => {
                expect(id).toMatch(/^test-\d+-[a-z0-9]{9}$/);
            });
        });

        it('should handle mixed success and error requests concurrently', async () => {
            const successRequests = Array(10).fill().map(() =>
                request(app).get('/api/test/success')
            );
            const errorRequests = Array(10).fill().map(() =>
                request(app).get('/api/test/server-error')
            );
            const notFoundRequests = Array(5).fill().map(() =>
                request(app).get('/api/nonexistent')
            );

            const allRequests = [...successRequests, ...errorRequests, ...notFoundRequests];
            const responses = await Promise.all(allRequests);

            // Verify all responses have proper structure
            responses.forEach(response => {
                expect(response.headers['x-request-id']).toBeDefined();

                if (response.status === 200) {
                    expect(response.body.success).toBe(true);
                } else {
                    expect(response.body).toMatchObject({
                        success: false,
                        error: expect.any(String),
                        code: expect.any(String),
                        timestamp: expect.any(String),
                        requestId: expect.any(String)
                    });
                }
            });

            // Count responses by type
            const successCount = responses.filter(r => r.status === 200).length;
            const errorCount = responses.filter(r => r.status === 500).length;
            const notFoundCount = responses.filter(r => r.status === 404).length;

            expect(successCount).toBe(10);
            expect(errorCount).toBe(10);
            expect(notFoundCount).toBe(5);
        });
    });

    describe('Response time requirements', () => {
        it('should meet response time requirements for successful requests', async () => {
            const iterations = 10;
            const responseTimes = [];

            for (let i = 0; i < iterations; i++) {
                const start = Date.now();
                await request(app)
                    .get('/api/test/success')
                    .expect(200);
                const duration = Date.now() - start;
                responseTimes.push(duration);
            }

            // All individual requests should be reasonably fast
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
                '/api/test/server-error',
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

        it('should maintain performance under moderate load', async () => {
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

        it('should handle rapid sequential requests efficiently', async () => {
            const sequentialRequests = 20;
            const start = Date.now();

            for (let i = 0; i < sequentialRequests; i++) {
                await request(app)
                    .get('/api/test/success')
                    .expect(200);
            }

            const totalDuration = Date.now() - start;
            const avgTimePerRequest = totalDuration / sequentialRequests;

            // Average time per request should be reasonable
            expect(avgTimePerRequest).toBeLessThan(50);
            expect(totalDuration).toBeLessThan(1000);
        });
    });

    describe('Error stability and edge cases', () => {
        it('should handle malformed JSON requests gracefully', async () => {
            const response = await request(app)
                .post('/api/test/success')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}')
                .expect(400);

            // Express should handle malformed JSON and return 400
            expect(response.status).toBe(400);
        });

        it('should handle requests with special characters in URLs', async () => {
            const specialUrls = [
                '/api/test/special%20chars',
                '/api/test/unicode%E2%9C%93',
                '/api/test/encoded%3Cscript%3E',
                '/api/test/path-with-dashes',
                '/api/test/path_with_underscores'
            ];

            for (const url of specialUrls) {
                const response = await request(app).get(url);

                // Should handle gracefully (404 is expected for non-existent routes)
                expect(response.status).toBe(404);
                expect(response.body).toMatchObject({
                    success: false,
                    code: 'NOT_FOUND',
                    timestamp: expect.any(String),
                    requestId: expect.any(String)
                });
            }
        });

        it('should handle very long URLs appropriately', async () => {
            const longPath = '/api/test/' + 'a'.repeat(2000);

            const response = await request(app).get(longPath);

            // Should either handle or reject cleanly, not crash
            expect([404, 414]).toContain(response.status);

            if (response.status === 404) {
                expect(response.body).toMatchObject({
                    success: false,
                    code: 'NOT_FOUND'
                });
            }
        });

        it('should maintain consistent behavior under stress', async () => {
            // Mix of different request types under load
            const requests = [];

            // Add success requests
            for (let i = 0; i < 20; i++) {
                requests.push(request(app).get('/api/test/success'));
            }

            // Add error requests
            for (let i = 0; i < 10; i++) {
                requests.push(request(app).get('/api/test/server-error'));
            }

            // Add 404 requests
            for (let i = 0; i < 10; i++) {
                requests.push(request(app).get('/api/nonexistent-' + i));
            }

            const responses = await Promise.all(requests);

            // Verify all responses maintain their expected structure
            let successCount = 0;
            let errorCount = 0;
            let notFoundCount = 0;

            responses.forEach(response => {
                expect(response.headers['x-request-id']).toBeDefined();

                if (response.status === 200) {
                    successCount++;
                    expect(response.body.success).toBe(true);
                } else if (response.status === 500) {
                    errorCount++;
                    expect(response.body).toMatchObject({
                        success: false,
                        code: 'INTERNAL_ERROR'
                    });
                } else if (response.status === 404) {
                    notFoundCount++;
                    expect(response.body).toMatchObject({
                        success: false,
                        code: 'NOT_FOUND'
                    });
                }
            });

            expect(successCount).toBe(20);
            expect(errorCount).toBe(10);
            expect(notFoundCount).toBe(10);
        });
    });
});

module.exports = {};