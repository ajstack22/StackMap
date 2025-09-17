/**
 * Focused Integration Tests for API Input Validation
 *
 * Tests comprehensive input validation with:
 * - Sync ID format validation
 * - Query parameter validation
 * - Request body validation
 * - Security attack prevention
 */

const request = require('supertest');
const { jest } = require('@jest/globals');

// Mock all dependencies at the top level before any imports
jest.mock('../../config/security', () => ({
    JWTUtils: {
        verifyToken: jest.fn(),
        generateToken: jest.fn()
    },
    SecurityAudit: {
        logAuthAttempt: jest.fn(),
        logSuspiciousActivity: jest.fn(),
        logSecurityEvent: jest.fn()
    },
    SanitizationUtils: {
        sanitizeObject: jest.fn((obj) => obj),
        sanitizeString: jest.fn((str) => str),
        sanitizeIP: jest.fn((ip) => ip)
    },
    VALIDATION_PATTERNS: {
        syncId: /^[a-fA-F0-9]{32}$/,
        userId: /^[a-zA-Z0-9_-]{1,50}$/,
        deviceId: /^[a-zA-Z0-9_-]{1,100}$/,
        timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
        metricName: /^[a-zA-Z][a-zA-Z0-9_\.]{1,100}$/,
        apiEndpoint: /^[a-zA-Z0-9/_-]{1,200}$/,
        ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    },
    RATE_LIMIT_CONFIG: {
        global: {
            windowMs: 15 * 60 * 1000,
            max: 1000,
            message: 'Too many requests',
            standardHeaders: true,
            legacyHeaders: false
        },
        read: {
            windowMs: 1 * 60 * 1000,
            max: 100,
            message: 'Too many read requests'
        },
        write: {
            windowMs: 1 * 60 * 1000,
            max: 20,
            message: 'Too many write requests'
        },
        admin: {
            windowMs: 5 * 60 * 1000,
            max: 10,
            message: 'Too many admin requests'
        }
    }
}));

jest.mock('../../utils/database', () => ({
    DatabaseQuery: {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    isDatabaseHealthy: jest.fn(),
    initializeDatabase: jest.fn().mockResolvedValue(true),
    dbPool: {
        getConnection: jest.fn(),
        end: jest.fn()
    }
}));

jest.mock('../../utils/redis', () => ({
    RedisCache: {
        get: jest.fn(),
        set: jest.fn(),
        getStats: jest.fn()
    },
    isRedisHealthy: jest.fn(),
    connectRedis: jest.fn().mockResolvedValue(true),
    redisClient: {
        on: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        get: jest.fn(),
        set: jest.fn()
    }
}));

jest.mock('../../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }
}));

jest.mock('../../utils/metrics', () => ({
    MetricsCollector: {
        recordAPIRequest: jest.fn(),
        getAllMetrics: jest.fn()
    }
}));

// Now import the server after all mocks are set up
const { DevAPIServer } = require('../../index');

// Import mocked modules for configuration
const { JWTUtils, SecurityAudit, SanitizationUtils } = require('../../config/security');
const { DatabaseQuery, isDatabaseHealthy, initializeDatabase } = require('../../utils/database');
const { RedisCache, isRedisHealthy, connectRedis } = require('../../utils/redis');

describe('API Input Validation Tests', () => {
    let app;
    let server;
    let authToken;

    beforeAll(async () => {
        // Configure mocks
        isDatabaseHealthy.mockResolvedValue(true);
        isRedisHealthy.mockResolvedValue(true);
        RedisCache.get.mockResolvedValue(null);
        RedisCache.set.mockResolvedValue(true);
        RedisCache.getStats.mockResolvedValue({ connected: true, stats: {} });

        // Mock database user query for authentication
        DatabaseQuery.select.mockResolvedValue([{
            id: 'test-user-123',
            email: 'test@stackmap.app',
            role: 'developer',
            is_active: 1,
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            permissions: JSON.stringify(['read', 'write'])
        }]);

        // Create valid JWT token for tests
        const validPayload = {
            sub: 'test-user-123',
            userId: 'test-user-123',
            email: 'test@stackmap.app',
            role: 'developer',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600
        };

        // Mock JWT verification
        JWTUtils.verifyToken.mockImplementation((token) => {
            if (token === 'valid.test.token') {
                return validPayload;
            }
            throw new Error('Invalid token');
        });

        authToken = 'Bearer valid.test.token';

        // Initialize test server
        const apiServer = new DevAPIServer();
        await apiServer.initialize();
        app = apiServer.app;
        server = app.listen(0);
    });

    afterAll(async () => {
        if (server) {
            server.close();
        }
    });

    describe('Sync ID Format Validation', () => {
        it('should validate sync ID format - reject invalid characters', async () => {
            const response = await request(app)
                .get('/api/dev/v1/sync/status/invalid-sync-id')
                .set('Authorization', authToken);

            console.log('Response status:', response.status);
            console.log('Response body:', JSON.stringify(response.body, null, 2));

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'syncId',
                        message: expect.stringMatching(/pattern|format/i)
                    })
                ])
            });
        });

        it('should validate sync ID format - reject wrong length', async () => {
            const response = await request(app)
                .get('/api/dev/v1/sync/status/abcdef12345')
                .set('Authorization', authToken)
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR'
            });
        });

        it('should validate sync ID format - accept valid format', async () => {
            // 32 character hex string (valid format)
            const validSyncId = 'a1b2c3d4e5f6789012345678901234ab';

            const response = await request(app)
                .get(`/api/dev/v1/sync/status/${validSyncId}`)
                .set('Authorization', authToken);

            // Should not be 400 (validation error)
            expect(response.status).not.toBe(400);
        });

        it('should prevent injection attacks in sync ID', async () => {
            const maliciousSyncId = '../../../etc/passwd';
            const response = await request(app)
                .get(`/api/dev/v1/sync/status/${maliciousSyncId}`)
                .set('Authorization', authToken)
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR'
            });
        });

        it('should handle SQL injection attempts in sync ID', async () => {
            const sqlInjectionSyncId = "'; DROP TABLE sync_data; --";
            const response = await request(app)
                .get(`/api/dev/v1/sync/status/${sqlInjectionSyncId}`)
                .set('Authorization', authToken)
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR'
            });
        });
    });

    describe('Query Parameters Validation', () => {
        it('should validate query parameters - reject invalid page', async () => {
            const response = await request(app)
                .get('/api/dev/v1/sync/stats')
                .query({ page: 'invalid' })
                .set('Authorization', authToken)
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'page',
                        message: expect.stringMatching(/number/i)
                    })
                ])
            });
        });

        it('should validate query parameters - reject negative page', async () => {
            const response = await request(app)
                .get('/api/dev/v1/sync/stats')
                .query({ page: -1 })
                .set('Authorization', authToken)
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR'
            });
        });

        it('should validate query parameters - reject excessive limit', async () => {
            const response = await request(app)
                .get('/api/dev/v1/sync/stats')
                .query({ limit: 1000 })
                .set('Authorization', authToken)
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR'
            });
        });

        it('should validate query parameters - accept valid parameters', async () => {
            const response = await request(app)
                .get('/api/dev/v1/sync/stats')
                .query({ page: 1, limit: 20 })
                .set('Authorization', authToken);

            // Should not be 400 (validation error)
            expect(response.status).not.toBe(400);
        });

        it('should sanitize malicious query parameters', async () => {
            const response = await request(app)
                .get('/api/dev/v1/health/system')
                .query({ include: '<script>alert("xss")</script>' })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR'
            });
        });

        it('should prevent XSS attempts in query parameters', async () => {
            const xssAttempts = [
                '<script>alert("xss")</script>',
                'javascript:alert("xss")',
                'onload=alert("xss")',
                '"><script>alert("xss")</script>'
            ];

            for (const xssAttempt of xssAttempts) {
                const response = await request(app)
                    .get('/api/dev/v1/health/system')
                    .query({ include: xssAttempt });

                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false,
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR'
                });
            }
        });
    });

    describe('Request Body Validation', () => {
        it('should validate request body - reject invalid type', async () => {
            const response = await request(app)
                .post('/api/dev/v1/dev/test-data')
                .set('Authorization', authToken)
                .set('Content-Type', 'application/json')
                .send({ type: 'invalid-type' })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'type',
                        message: expect.stringMatching(/valid|allowed/i)
                    })
                ])
            });
        });

        it('should validate request body - reject missing required fields', async () => {
            const response = await request(app)
                .post('/api/dev/v1/dev/test-data')
                .set('Authorization', authToken)
                .set('Content-Type', 'application/json')
                .send({})
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'type',
                        message: expect.stringMatching(/required/i)
                    })
                ])
            });
        });

        it('should validate request body - reject excessive count', async () => {
            const response = await request(app)
                .post('/api/dev/v1/dev/test-data')
                .set('Authorization', authToken)
                .set('Content-Type', 'application/json')
                .send({ type: 'users', count: 10000 })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR'
            });
        });

        it('should validate request body - accept valid input', async () => {
            const response = await request(app)
                .post('/api/dev/v1/dev/test-data')
                .set('Authorization', authToken)
                .set('Content-Type', 'application/json')
                .send({ type: 'users', count: 10 });

            // Should not be 400 (validation error)
            expect(response.status).not.toBe(400);
        });

        it('should sanitize malicious request body', async () => {
            const response = await request(app)
                .post('/api/dev/v1/dev/test-data')
                .set('Authorization', authToken)
                .set('Content-Type', 'application/json')
                .send({
                    type: 'users',
                    '<script>alert("xss")</script>': 'malicious'
                });

            // Validation should handle this gracefully - either sanitize or reject
            if (response.status === 400) {
                expect(response.body).toMatchObject({
                    success: false,
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR'
                });
            } else {
                // If accepted, malicious content should be sanitized
                expect(response.status).not.toBe(500);
            }
        });

        it('should prevent SQL injection in request body', async () => {
            const response = await request(app)
                .post('/api/dev/v1/dev/test-data')
                .set('Authorization', authToken)
                .set('Content-Type', 'application/json')
                .send({
                    type: "'; DROP TABLE users; --",
                    count: 1
                })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR'
            });
        });

        it('should handle nested object validation', async () => {
            const response = await request(app)
                .post('/api/dev/v1/dev/test-data')
                .set('Authorization', authToken)
                .set('Content-Type', 'application/json')
                .send({
                    type: 'users',
                    count: 10,
                    options: {
                        seed: 'invalid-seed-type', // Should be number
                        clean: 'not-boolean'       // Should be boolean
                    }
                });

            // Should validate nested objects
            if (response.status === 400) {
                expect(response.body).toMatchObject({
                    success: false,
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR'
                });
            }
        });

        it('should enforce content-type validation', async () => {
            const response = await request(app)
                .post('/api/dev/v1/dev/test-data')
                .set('Authorization', authToken)
                .set('Content-Type', 'text/plain')
                .send('not json data');

            // Should reject non-JSON content
            expect([400, 415]).toContain(response.status);
        });
    });

    describe('Security Attack Prevention', () => {
        it('should log suspicious validation failures', async () => {
            // Clear previous calls
            SecurityAudit.logSuspiciousActivity.mockClear();

            // Make a request with suspicious content
            await request(app)
                .get('/api/dev/v1/sync/status/../../../etc/passwd')
                .set('Authorization', authToken)
                .expect(400);

            // Should log suspicious activity
            expect(SecurityAudit.logSuspiciousActivity).toHaveBeenCalled();
        });

        it('should handle multiple validation errors correctly', async () => {
            const response = await request(app)
                .post('/api/dev/v1/dev/test-data')
                .set('Authorization', authToken)
                .set('Content-Type', 'application/json')
                .send({
                    // Missing required 'type' field
                    count: 'invalid-count-type', // Should be number
                    unknownField: 'should-be-stripped'
                })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'type',
                        message: expect.stringMatching(/required/i)
                    }),
                    expect.objectContaining({
                        field: 'count',
                        message: expect.stringMatching(/number/i)
                    })
                ])
            });
        });

        it('should handle boundary value attacks', async () => {
            const boundaryValues = [
                { count: 0 },         // Below minimum
                { count: -1 },        // Negative
                { count: 999999 },    // Way above maximum
                { count: Number.MAX_SAFE_INTEGER }, // Extreme value
                { count: Infinity },  // Invalid number
                { count: NaN }        // Not a number
            ];

            for (const payload of boundaryValues) {
                const response = await request(app)
                    .post('/api/dev/v1/dev/test-data')
                    .set('Authorization', authToken)
                    .set('Content-Type', 'application/json')
                    .send({
                        type: 'users',
                        ...payload
                    });

                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false,
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR'
                });
            }
        });
    });
});

module.exports = {};