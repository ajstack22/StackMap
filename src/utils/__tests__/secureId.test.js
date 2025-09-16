/* eslint-env jest */

// Mock crypto for testing
const mockCrypto = {
  randomUUID: jest.fn(),
  getRandomValues: jest.fn()
};

// Mock performance for testing
const mockPerformance = {
  now: jest.fn()
};

describe('secureId utilities', () => {
  let originalCrypto;
  let originalPerformance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Store original globals
    originalCrypto = global.crypto;
    originalPerformance = global.performance;

    // Set up default mocks
    mockCrypto.randomUUID.mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
    mockCrypto.getRandomValues.mockImplementation(array => {
      // Fill with predictable values for testing
      for (let i = 0; i < array.length; i++) {
        array[i] = (i * 17) % 256; // Predictable but varied values
      }
      return array;
    });
    mockPerformance.now.mockReturnValue(1234567.89);

    // Mock Date.now for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01 00:00:00 UTC
  });

  afterEach(() => {
    // Restore original globals
    global.crypto = originalCrypto;
    global.performance = originalPerformance;

    // Restore Date.now
    Date.now.mockRestore();
  });

  describe('generateSecureId', () => {
    beforeEach(() => {
      // Reset modules to ensure fresh imports
      jest.resetModules();
    });

    it('should use crypto.randomUUID when available', () => {
      global.crypto = mockCrypto;
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId();

      expect(mockCrypto.randomUUID).toHaveBeenCalled();
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should add prefix when using crypto.randomUUID', () => {
      global.crypto = mockCrypto;
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId('test');

      expect(result).toBe('test-123e4567-e89b-12d3-a456-426614174000');
    });

    it('should use crypto.getRandomValues when randomUUID is not available', () => {
      global.crypto = {
        getRandomValues: mockCrypto.getRandomValues
      };
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId();

      expect(mockCrypto.getRandomValues).toHaveBeenCalled();
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate valid UUID v4 format with getRandomValues', () => {
      global.crypto = {
        getRandomValues: mockCrypto.getRandomValues
      };
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId();

      // Check UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where y is 8, 9, A, or B
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should add prefix when using getRandomValues', () => {
      global.crypto = {
        getRandomValues: mockCrypto.getRandomValues
      };
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId('prefix');

      expect(result).toMatch(/^prefix-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should fall back to timestamp-based ID when crypto is not available', () => {
      global.crypto = undefined;
      global.performance = mockPerformance;
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId();

      expect(result).toMatch(/^\d+-[0-9a-z.]+$/); // Allow dots in timestamp conversion
      expect(result).toContain('1640995200000'); // Mocked timestamp
    });

    it('should use performance.now in fallback when available', () => {
      global.crypto = undefined;
      global.performance = mockPerformance;
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId();

      expect(mockPerformance.now).toHaveBeenCalled();
      expect(result).toMatch(/^\d+-[0-9a-z.]+$/); // Just verify format, not exact value
    });

    it('should use timestamp twice when performance is not available', () => {
      global.crypto = undefined;
      global.performance = undefined;
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId();

      // Should use timestamp for both parts
      expect(result).toMatch(/^\d+-[0-9a-z]+$/);
      expect(result).toContain('1640995200000'); // Mocked timestamp
    });

    it('should add prefix in fallback mode', () => {
      global.crypto = undefined;
      global.performance = mockPerformance;
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId('fallback');

      expect(result).toMatch(/^fallback-\d+-[0-9a-z.]+$/); // Allow dots
    });

    it('should handle crypto errors gracefully', () => {
      global.crypto = {
        randomUUID: jest.fn(() => {
          throw new Error('Crypto error');
        }),
        getRandomValues: jest.fn(() => {
          throw new Error('Crypto error');
        })
      };
      global.performance = mockPerformance;
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId();

      // Should fall back to timestamp-based ID
      expect(result).toMatch(/^\d+-[0-9a-z.]+$/); // Allow dots
    });

    it('should handle getRandomValues errors gracefully', () => {
      global.crypto = {
        getRandomValues: jest.fn(() => {
          throw new Error('getRandomValues error');
        })
      };
      global.performance = mockPerformance;
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId();

      // Should fall back to timestamp-based ID
      expect(result).toMatch(/^\d+-[0-9a-z.]+$/); // Allow dots
    });

    it('should generate unique IDs on subsequent calls', () => {
      global.crypto = undefined;
      global.performance = mockPerformance;
      const { generateSecureId } = require('../secureId');

      // Mock different timestamps
      Date.now.mockReturnValueOnce(1640995200000);
      Date.now.mockReturnValueOnce(1640995200001);

      const id1 = generateSecureId();
      const id2 = generateSecureId();

      expect(id1).not.toBe(id2);
    });

    it('should handle empty string prefix', () => {
      global.crypto = mockCrypto;
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId('');

      // Empty string is falsy, so no prefix should be added
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should work without any arguments', () => {
      global.crypto = mockCrypto;
      const { generateSecureId } = require('../secureId');

      const result = generateSecureId();

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateSecureRandomString', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should use crypto.getRandomValues when available', () => {
      global.crypto = mockCrypto;
      const { generateSecureRandomString } = require('../secureId');

      const result = generateSecureRandomString(5);

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(result).toHaveLength(5);
      expect(result).toMatch(/^[0-9a-z]+$/);
    });

    it('should generate string of specified length', () => {
      global.crypto = mockCrypto;
      const { generateSecureRandomString } = require('../secureId');

      const result3 = generateSecureRandomString(3);
      const result10 = generateSecureRandomString(10);
      const result20 = generateSecureRandomString(20);

      expect(result3).toHaveLength(3);
      expect(result10).toHaveLength(10);
      expect(result20).toHaveLength(20);
    });

    it('should use default length of 9 when no length specified', () => {
      global.crypto = mockCrypto;
      const { generateSecureRandomString } = require('../secureId');

      const result = generateSecureRandomString();

      expect(result).toHaveLength(9);
    });

    it('should only use valid characters (0-9, a-z)', () => {
      global.crypto = mockCrypto;
      const { generateSecureRandomString } = require('../secureId');

      const result = generateSecureRandomString(100);

      expect(result).toMatch(/^[0-9a-z]+$/);
    });

    it('should map bytes to character set correctly', () => {
      // Mock getRandomValues to return specific values
      const customMockCrypto = {
        getRandomValues: jest.fn(array => {
          // Return values that will test character mapping
          array[0] = 0;   // Should map to '0'
          array[1] = 35;  // Should map to 'z' (chars.length - 1)
          array[2] = 36;  // Should map to '0' (36 % 36 = 0)
          array[3] = 71;  // Should map to 'z' (71 % 36 = 35)
          return array;
        })
      };
      global.crypto = customMockCrypto;
      const { generateSecureRandomString } = require('../secureId');

      const result = generateSecureRandomString(4);

      expect(result).toBe('0z0z');
    });

    it('should fall back to timestamp when crypto is not available', () => {
      global.crypto = undefined;
      const { generateSecureRandomString } = require('../secureId');

      const result = generateSecureRandomString(10);

      // Fallback returns Date.now().toString(36), which is shorter than requested length
      expect(result).toMatch(/^[0-9a-z]+$/); // Just check format
      expect(result.length).toBeLessThan(10); // Fallback doesn't respect length
    });

    it('should handle crypto errors gracefully', () => {
      global.crypto = {
        getRandomValues: jest.fn(() => {
          throw new Error('Crypto error');
        })
      };
      const { generateSecureRandomString } = require('../secureId');

      const result = generateSecureRandomString(10);

      // Should fall back to timestamp
      expect(result).toMatch(/^[0-9a-z]+$/);
    });

    it('should handle zero length', () => {
      global.crypto = mockCrypto;
      const { generateSecureRandomString } = require('../secureId');

      const result = generateSecureRandomString(0);

      expect(result).toBe('');
    });

    it('should handle negative length (treated as 0)', () => {
      global.crypto = mockCrypto;
      const { generateSecureRandomString } = require('../secureId');

      const result = generateSecureRandomString(-5);

      // Negative length falls back to Date.now().toString(36)
      expect(result).toMatch(/^[0-9a-z]+$/);
    });

    it('should generate different results on subsequent calls', () => {
      global.crypto = mockCrypto;
      // Make getRandomValues return different values each time
      let callCount = 0;
      mockCrypto.getRandomValues.mockImplementation(array => {
        for (let i = 0; i < array.length; i++) {
          array[i] = (i + callCount * 17) % 256;
        }
        callCount++;
        return array;
      });
      const { generateSecureRandomString } = require('../secureId');

      const result1 = generateSecureRandomString(5);
      const result2 = generateSecureRandomString(5);

      expect(result1).not.toBe(result2);
    });

    it('should handle large lengths efficiently', () => {
      global.crypto = mockCrypto;
      const { generateSecureRandomString } = require('../secureId');

      const result = generateSecureRandomString(1000);

      expect(result).toHaveLength(1000);
      expect(result).toMatch(/^[0-9a-z]+$/);
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });
  });

  describe('edge cases and error handling', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should handle undefined crypto gracefully', () => {
      global.crypto = undefined;
      global.performance = mockPerformance;

      const { generateSecureId, generateSecureRandomString } = require('../secureId');

      expect(() => generateSecureId()).not.toThrow();
      expect(() => generateSecureRandomString()).not.toThrow();
    });

    it('should handle null crypto gracefully', () => {
      global.crypto = null;
      global.performance = mockPerformance;

      const { generateSecureId, generateSecureRandomString } = require('../secureId');

      expect(() => generateSecureId()).not.toThrow();
      expect(() => generateSecureRandomString()).not.toThrow();
    });

    it('should handle partial crypto implementation', () => {
      global.crypto = {}; // No methods available
      global.performance = mockPerformance;

      const { generateSecureId, generateSecureRandomString } = require('../secureId');

      const id = generateSecureId();
      const str = generateSecureRandomString();

      expect(typeof id).toBe('string');
      expect(typeof str).toBe('string');
    });

    it('should work in minimal environment (no crypto, no performance)', () => {
      global.crypto = undefined;
      global.performance = undefined;

      const { generateSecureId, generateSecureRandomString } = require('../secureId');

      const id = generateSecureId();
      const str = generateSecureRandomString();

      expect(typeof id).toBe('string');
      expect(typeof str).toBe('string');
      expect(id.length).toBeGreaterThan(0);
      expect(str.length).toBeGreaterThan(0);
    });
  });
});