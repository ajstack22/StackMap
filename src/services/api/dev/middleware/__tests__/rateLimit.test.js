/**
 * Test for Rate Limit Middleware IPv6 fixes
 *
 * Tests that the ipKeyGenerator helper function is properly used for IPv6 support
 * and that both IPv4 and IPv6 addresses are handled correctly.
 */

const { jest } = require('@jest/globals');

// Mock express-rate-limit before requiring the middleware
const mockIpKeyGenerator = jest.fn((ip, subnet) => ip);
jest.mock('express-rate-limit', () => ({
    rateLimit: jest.fn(() => (req, res, next) => next()),
    ipKeyGenerator: mockIpKeyGenerator
}));

// Mock other dependencies
jest.mock('../../config/security', () => ({
    RATE_LIMIT_CONFIG: {
        global: { windowMs: 900000, max: 1000, message: 'Too many requests' },
        read: { windowMs: 60000, max: 100, message: 'Too many read requests' },
        write: { windowMs: 60000, max: 20, message: 'Too many write requests' },
        admin: { windowMs: 300000, max: 10, message: 'Too many admin requests' },
        auth: { windowMs: 300000, max: 5, message: 'Too many auth requests' }
    }
}));

jest.mock('../../utils/redis', () => ({
    rateLimiter: {
        checkLimit: jest.fn().mockResolvedValue({ current: 1, resetTime: Date.now() + 60000, remaining: 99 })
    },
    RedisCache: {
        del: jest.fn().mockResolvedValue(true),
        keys: jest.fn().mockResolvedValue([]),
        getStats: jest.fn().mockResolvedValue({ connected: true })
    },
    CACHE_KEYS: {}
}));

jest.mock('../../utils/logger', () => ({
    logger: {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
    }
}));

jest.mock('../../utils/metrics', () => ({
    MetricsCollector: {
        recordAPIRequest: jest.fn()
    }
}));

const { keyGenerators } = require('../rateLimit');

describe('Rate Limit Middleware IPv6 Support', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('keyGenerators.ip', () => {
        it('should use ipKeyGenerator helper for IPv4 addresses', () => {
            const mockReq = {
                ip: '192.168.1.100'
            };

            const result = keyGenerators.ip(mockReq);

            expect(mockIpKeyGenerator).toHaveBeenCalledWith('192.168.1.100', 64);
            expect(result).toBe('ip:192.168.1.100');
        });

        it('should use ipKeyGenerator helper for IPv6 addresses', () => {
            const mockReq = {
                ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
            };

            const result = keyGenerators.ip(mockReq);

            expect(mockIpKeyGenerator).toHaveBeenCalledWith('2001:0db8:85a3:0000:0000:8a2e:0370:7334', 64);
            expect(result).toBe('ip:2001:0db8:85a3:0000:0000:8a2e:0370:7334');
        });

        it('should use ipKeyGenerator helper for IPv6 mapped IPv4 addresses', () => {
            const mockReq = {
                ip: '::ffff:192.168.1.100'
            };

            const result = keyGenerators.ip(mockReq);

            expect(mockIpKeyGenerator).toHaveBeenCalledWith('::ffff:192.168.1.100', 64);
            expect(result).toBe('ip:::ffff:192.168.1.100');
        });

        it('should handle fallback to req.connection.remoteAddress', () => {
            const mockReq = {
                connection: { remoteAddress: '192.168.1.200' }
            };

            const result = keyGenerators.ip(mockReq);

            expect(mockIpKeyGenerator).toHaveBeenCalledWith('192.168.1.200', 64);
            expect(result).toBe('ip:192.168.1.200');
        });

        it('should handle fallback to x-forwarded-for header', () => {
            const mockReq = {
                headers: {
                    'x-forwarded-for': '192.168.1.200, 10.0.0.1'
                }
            };

            const result = keyGenerators.ip(mockReq);

            expect(mockIpKeyGenerator).toHaveBeenCalledWith('192.168.1.200', 64);
            expect(result).toBe('ip:192.168.1.200');
        });

        it('should return "unknown" for missing IP', () => {
            const mockReq = {
                headers: {}
            };

            const result = keyGenerators.ip(mockReq);

            expect(mockIpKeyGenerator).not.toHaveBeenCalled();
            expect(result).toBe('ip:unknown');
        });

        it('should return "invalid" for malformed IPs', () => {
            const mockReq = {
                ip: 'not-an-ip-address'
            };

            const { logger } = require('../../utils/logger');
            const result = keyGenerators.ip(mockReq);

            expect(mockIpKeyGenerator).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalledWith('Invalid IP format detected:', { ip: 'not-an-ip-address' });
            expect(result).toBe('ip:invalid');
        });

        it('should handle ipKeyGenerator errors gracefully', () => {
            mockIpKeyGenerator.mockImplementationOnce(() => {
                throw new Error('ipKeyGenerator failed');
            });

            const mockReq = {
                ip: '192.168.1.100'
            };

            const { logger } = require('../../utils/logger');
            const result = keyGenerators.ip(mockReq);

            expect(mockIpKeyGenerator).toHaveBeenCalledWith('192.168.1.100', 64);
            expect(logger.warn).toHaveBeenCalledWith('ipKeyGenerator failed, using original IP:', {
                error: 'ipKeyGenerator failed',
                ip: '192.168.1.100'
            });
            expect(result).toBe('ip:192.168.1.100');
        });

        it('should use 64-bit subnet for IPv6 rate limiting', () => {
            const mockReq = {
                ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
            };

            keyGenerators.ip(mockReq);

            expect(mockIpKeyGenerator).toHaveBeenCalledWith(
                '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
                64
            );
        });
    });

    describe('IPv6 subnet configuration', () => {
        it('should use 64-bit subnet for proper IPv6 rate limiting balance', () => {
            // IPv6 subnet of 64 bits is recommended for rate limiting to balance
            // security (prevent abuse) with usability (avoid blocking entire networks)
            const mockReq = {
                ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
            };

            keyGenerators.ip(mockReq);

            const [ip, subnet] = mockIpKeyGenerator.mock.calls[0];
            expect(subnet).toBe(64);
        });
    });

    describe('IP validation regex patterns', () => {
        const validIPv4s = [
            '192.168.1.1',
            '10.0.0.1',
            '172.16.0.1',
            '255.255.255.255',
            '0.0.0.0'
        ];

        const validIPv6s = [
            '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
            '2001:db8:85a3::8a2e:370:7334',
            '::1',
            '::',
            'fe80::1'
        ];

        const validIPv6Mapped = [
            '::ffff:192.168.1.1',
            '::ffff:10.0.0.1'
        ];

        const invalidIPs = [
            'not-an-ip',
            '256.256.256.256',
            '192.168.1',
            'gggg::1',
            '192.168.1.1.1'
        ];

        validIPv4s.forEach(ip => {
            it(`should accept valid IPv4 address: ${ip}`, () => {
                const mockReq = { ip };
                const result = keyGenerators.ip(mockReq);
                expect(mockIpKeyGenerator).toHaveBeenCalledWith(ip, 64);
                expect(result).toBe(`ip:${ip}`);
            });
        });

        validIPv6s.forEach(ip => {
            it(`should accept valid IPv6 address: ${ip}`, () => {
                const mockReq = { ip };
                const result = keyGenerators.ip(mockReq);
                expect(mockIpKeyGenerator).toHaveBeenCalledWith(ip, 64);
                expect(result).toBe(`ip:${ip}`);
            });
        });

        validIPv6Mapped.forEach(ip => {
            it(`should accept valid IPv6-mapped IPv4 address: ${ip}`, () => {
                const mockReq = { ip };
                const result = keyGenerators.ip(mockReq);
                expect(mockIpKeyGenerator).toHaveBeenCalledWith(ip, 64);
                expect(result).toBe(`ip:${ip}`);
            });
        });

        invalidIPs.forEach(ip => {
            it(`should reject invalid IP address: ${ip}`, () => {
                const mockReq = { ip };
                const result = keyGenerators.ip(mockReq);
                expect(mockIpKeyGenerator).not.toHaveBeenCalled();
                expect(result).toBe('ip:invalid');
            });
        });
    });
});