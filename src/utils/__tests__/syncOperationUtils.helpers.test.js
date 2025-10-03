/**
 * Tests for syncOperationUtils helper functions
 */

import {
  validateSyncStateUpdate,
  sanitizeSyncErrorMessage,
  checkSyncOperationRateLimit,
  calculateSyncRetryDelay
} from '../syncOperationUtils';

describe('syncOperationUtils helpers', () => {
  describe('validateSyncStateUpdate', () => {
    it('should reject non-object inputs', () => {
      const results = [
        validateSyncStateUpdate(null),
        validateSyncStateUpdate(undefined),
        validateSyncStateUpdate('string'),
        validateSyncStateUpdate(123),
        validateSyncStateUpdate([])
      ];

      results.forEach(result => {
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('State update must be an object');
      });
    });

    it('should validate boolean fields correctly', () => {
      const result = validateSyncStateUpdate({
        syncEnabled: true,
        syncStatusChecked: false
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual({
        syncEnabled: true,
        syncStatusChecked: false
      });
    });

    it('should reject invalid boolean fields', () => {
      const result = validateSyncStateUpdate({
        syncEnabled: 'true',
        syncStatusChecked: 1
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a boolean');
    });

    it('should validate string or null fields correctly', () => {
      const result = validateSyncStateUpdate({
        syncId: 'abc123',
        syncRecoveryPhrase: null,
        syncStatus: 'syncing'
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual({
        syncId: 'abc123',
        syncRecoveryPhrase: null,
        syncStatus: 'syncing'
      });
    });

    it('should reject invalid string fields', () => {
      const result = validateSyncStateUpdate({
        syncId: 123,
        syncStatus: false
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a string or null');
    });

    it('should validate lastSyncTime correctly', () => {
      const validResult = validateSyncStateUpdate({
        lastSyncTime: Date.now()
      });

      expect(validResult.isValid).toBe(true);

      const invalidResult = validateSyncStateUpdate({
        lastSyncTime: -100
      });

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('must be a positive number or null');
    });

    it('should reject unknown fields', () => {
      const result = validateSyncStateUpdate({
        syncEnabled: true,
        unknownField: 'value',
        anotherUnknown: 123
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid field: unknownField');
      expect(result.error).toContain('Invalid field: anotherUnknown');
    });

    it('should handle complex valid update', () => {
      const update = {
        syncEnabled: true,
        syncId: 'test-id',
        syncRecoveryPhrase: 'recovery-phrase',
        syncStatus: 'success',
        lastSyncTime: 1234567890,
        syncStatusChecked: true
      };

      const result = validateSyncStateUpdate(update);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual(update);
    });
  });

  describe('sanitizeSyncErrorMessage', () => {
    it('should handle invalid input types', () => {
      expect(sanitizeSyncErrorMessage(null)).toBe('Unknown sync error');
      expect(sanitizeSyncErrorMessage(undefined)).toBe('Unknown sync error');
      expect(sanitizeSyncErrorMessage(123)).toBe('Unknown sync error');
      expect(sanitizeSyncErrorMessage({})).toBe('Unknown sync error');
    });

    it('should handle empty strings', () => {
      expect(sanitizeSyncErrorMessage('')).toBe('Sync operation failed');
      expect(sanitizeSyncErrorMessage('   ')).toBe('Sync operation failed');
    });

    it('should redact recovery phrases (32-char hex)', () => {
      const message = 'Error with phrase: a1b2c3d4e5f678901234567890123456'; // 32 chars hex
      const sanitized = sanitizeSyncErrorMessage(message);
      expect(sanitized).toContain('[REDACTED_PHRASE]');
      expect(sanitized).not.toContain('a1b2c3d4');
    });

    it('should redact sync IDs (15-16 char hex)', () => {
      const message = 'Sync ID abc123def456789 not found';
      const sanitized = sanitizeSyncErrorMessage(message);
      expect(sanitized).toContain('[REDACTED_ID]');
      expect(sanitized).not.toContain('abc123def456789');
    });

    it('should redact API tokens (>16 chars alphanumeric)', () => {
      const message = 'Token Bearer1234567890ABCDEFGHIJ invalid';
      const sanitized = sanitizeSyncErrorMessage(message);
      expect(sanitized).toContain('[REDACTED_TOKEN]');
      expect(sanitized).not.toContain('Bearer1234567890');
    });

    it('should sanitize URLs preserving domain', () => {
      const message = 'Failed to connect to https://example.com/api/secret/path';
      const sanitized = sanitizeSyncErrorMessage(message);
      expect(sanitized).toBe('Failed to connect to https://example.com[REDACTED_PATH]');
    });

    it('should handle malformed URLs', () => {
      const message = 'URL not-a-valid-url is invalid';
      const sanitized = sanitizeSyncErrorMessage(message);
      expect(sanitized).toBe('URL [REDACTED_URL] is invalid');
    });

    it('should handle complex message with multiple sensitive data', () => {
      const message = 'Sync failed for ID abc123def456789 with phrase a1b2c3d4e5f678901234567890123456 at https://api.example.com/sync/data';
      const sanitized = sanitizeSyncErrorMessage(message);

      expect(sanitized).toContain('[REDACTED_ID]');
      expect(sanitized).toContain('[REDACTED_PHRASE]');
      expect(sanitized).toContain('https://api.example.com[REDACTED_PATH]');
      expect(sanitized).not.toContain('abc123def456789');
      expect(sanitized).not.toContain('a1b2c3d4');
      expect(sanitized).not.toContain('/sync/data');
    });

    it('should return default message if only redacted content remains', () => {
      const message = 'a1b2c3d4e5f678901234567890123456'; // 32 chars hex - will be fully redacted
      const sanitized = sanitizeSyncErrorMessage(message);
      expect(sanitized).toBe('Sync operation failed');
    });
  });

  describe('checkSyncOperationRateLimit', () => {
    const now = Date.now();

    it('should not rate limit invalid timestamps', () => {
      const results = [
        checkSyncOperationRateLimit({ lastOperationTime: null }),
        checkSyncOperationRateLimit({ lastOperationTime: undefined }),
        checkSyncOperationRateLimit({ lastOperationTime: 0 }),
        checkSyncOperationRateLimit({ lastOperationTime: -100 }),
        checkSyncOperationRateLimit({ lastOperationTime: 'invalid' })
      ];

      results.forEach(result => {
        expect(result.isRateLimited).toBe(false);
        expect(result.waitTimeMs).toBeUndefined();
      });
    });

    it('should handle time anomalies (clock going backwards)', () => {
      const futureTime = now + 10000;
      const result = checkSyncOperationRateLimit({
        lastOperationTime: futureTime
      });

      expect(result.isRateLimited).toBe(false);
    });

    it('should rate limit manual operations (5 seconds)', () => {
      const recentTime = now - 3000; // 3 seconds ago
      const result = checkSyncOperationRateLimit({
        lastOperationTime: recentTime,
        operationType: 'manual'
      });

      expect(result.isRateLimited).toBe(true);
      expect(result.waitTimeMs).toBeGreaterThan(1000);
      expect(result.waitTimeMs).toBeLessThanOrEqual(2000);
    });

    it('should rate limit enable operations (10 seconds)', () => {
      const recentTime = now - 8000; // 8 seconds ago
      const result = checkSyncOperationRateLimit({
        lastOperationTime: recentTime,
        operationType: 'enable'
      });

      expect(result.isRateLimited).toBe(true);
      expect(result.waitTimeMs).toBeGreaterThan(1000);
      expect(result.waitTimeMs).toBeLessThanOrEqual(2000);
    });

    it('should rate limit restore operations (10 seconds)', () => {
      const recentTime = now - 9000; // 9 seconds ago
      const result = checkSyncOperationRateLimit({
        lastOperationTime: recentTime,
        operationType: 'restore'
      });

      expect(result.isRateLimited).toBe(true);
      expect(result.waitTimeMs).toBeGreaterThan(0);
      expect(result.waitTimeMs).toBeLessThanOrEqual(1000);
    });

    it('should rate limit disable operations (2 seconds)', () => {
      const recentTime = now - 1000; // 1 second ago
      const result = checkSyncOperationRateLimit({
        lastOperationTime: recentTime,
        operationType: 'disable'
      });

      expect(result.isRateLimited).toBe(true);
      expect(result.waitTimeMs).toBeGreaterThan(900);
      expect(result.waitTimeMs).toBeLessThanOrEqual(1000);
    });

    it('should use custom interval for default type', () => {
      const recentTime = now - 7000; // 7 seconds ago
      const result = checkSyncOperationRateLimit({
        lastOperationTime: recentTime,
        operationType: 'default',
        minIntervalMs: 10000
      });

      expect(result.isRateLimited).toBe(true);
      expect(result.waitTimeMs).toBeGreaterThan(2000);
      expect(result.waitTimeMs).toBeLessThanOrEqual(3000);
    });

    it('should not rate limit when enough time has passed', () => {
      const oldTime = now - 20000; // 20 seconds ago

      const operations = ['manual', 'enable', 'restore', 'disable', 'default'];
      operations.forEach(op => {
        const result = checkSyncOperationRateLimit({
          lastOperationTime: oldTime,
          operationType: op
        });

        expect(result.isRateLimited).toBe(false);
        expect(result.waitTimeMs).toBeUndefined();
      });
    });

    it('should handle unknown operation types', () => {
      const recentTime = now - 3000; // 3 seconds ago
      const result = checkSyncOperationRateLimit({
        lastOperationTime: recentTime,
        operationType: 'unknown'
      });

      // Should use default interval (5 seconds)
      expect(result.isRateLimited).toBe(true);
      expect(result.waitTimeMs).toBeGreaterThan(1000);
      expect(result.waitTimeMs).toBeLessThanOrEqual(2000);
    });
  });

  describe('calculateSyncRetryDelay', () => {
    it('should handle invalid attempt counts', () => {
      expect(calculateSyncRetryDelay(0)).toBe(1000);
      expect(calculateSyncRetryDelay(-1)).toBe(1000);
      expect(calculateSyncRetryDelay(null)).toBe(1000);
      expect(calculateSyncRetryDelay(undefined)).toBe(1000);
      expect(calculateSyncRetryDelay('invalid')).toBe(1000);
    });

    it('should handle invalid base delays', () => {
      expect(calculateSyncRetryDelay(1, -100)).toBe(1000);
      expect(calculateSyncRetryDelay(1, null)).toBe(1000);
      expect(calculateSyncRetryDelay(1, 'invalid')).toBe(1000);
    });

    it('should handle invalid max delays', () => {
      expect(calculateSyncRetryDelay(1, 1000, -100)).toBe(1000);
      expect(calculateSyncRetryDelay(1, 1000, 500)).toBe(1000); // Max less than base
      expect(calculateSyncRetryDelay(1, 1000, null)).toBe(1000);
    });

    it('should calculate exponential backoff correctly', () => {
      expect(calculateSyncRetryDelay(1)).toBe(1000); // 2^0 * 1000 = 1000
      expect(calculateSyncRetryDelay(2)).toBe(2000); // 2^1 * 1000 = 2000
      expect(calculateSyncRetryDelay(3)).toBe(4000); // 2^2 * 1000 = 4000
      expect(calculateSyncRetryDelay(4)).toBe(8000); // 2^3 * 1000 = 8000
      expect(calculateSyncRetryDelay(5)).toBe(16000); // 2^4 * 1000 = 16000
    });

    it('should cap at maximum delay', () => {
      expect(calculateSyncRetryDelay(6)).toBe(30000); // Would be 32000, capped at 30000
      expect(calculateSyncRetryDelay(10)).toBe(30000); // Would be 512000, capped at 30000
    });

    it('should use custom base delay', () => {
      expect(calculateSyncRetryDelay(1, 500)).toBe(500);
      expect(calculateSyncRetryDelay(2, 500)).toBe(1000);
      expect(calculateSyncRetryDelay(3, 500)).toBe(2000);
    });

    it('should use custom max delay', () => {
      expect(calculateSyncRetryDelay(5, 1000, 10000)).toBe(10000); // Would be 16000, capped at 10000
      expect(calculateSyncRetryDelay(10, 1000, 50000)).toBe(50000); // Would be 512000, capped at 50000
    });

    it('should handle edge cases', () => {
      // Very large attempt count
      expect(calculateSyncRetryDelay(100, 1000, 60000)).toBe(60000);

      // Custom values
      expect(calculateSyncRetryDelay(3, 2000, 15000)).toBe(8000); // 2^2 * 2000 = 8000
      expect(calculateSyncRetryDelay(4, 2000, 15000)).toBe(15000); // Would be 16000, capped
    });
  });
});