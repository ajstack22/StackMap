// @ts-check
import {
  validateSyncOperationParams,
  createSyncOperationResult,
  validateSyncStateUpdate,
  calculateSyncRetryDelay,
  validateSyncPreviewData,
  sanitizeSyncErrorMessage,
  validateDeviceInviteParams,
  checkSyncOperationRateLimit,
} from '../syncOperationUtils';

describe('syncOperationUtils', () => {
  describe('validateSyncOperationParams', () => {
    it('validates enable operation', () => {
      const params = { type: 'enable' };
      const result = validateSyncOperationParams(params);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('validates restore operation with valid recovery phrase', () => {
      const params = {
        type: 'restore',
        recoveryPhrase: 'abcdef1234567890abcdef1234567890'
      };
      const result = validateSyncOperationParams(params);
      expect(result.isValid).toBe(true);
    });

    it('validates disable operation', () => {
      const params = { type: 'disable' };
      const result = validateSyncOperationParams(params);
      expect(result.isValid).toBe(true);
    });

    it('validates manual sync operation', () => {
      const params = { type: 'manual' };
      const result = validateSyncOperationParams(params);
      expect(result.isValid).toBe(true);
    });

    it('validates delete server operation', () => {
      const params = { type: 'deleteServer' };
      const result = validateSyncOperationParams(params);
      expect(result.isValid).toBe(true);
    });

    it('rejects invalid operation type', () => {
      const params = { type: 'invalid' };
      const result = validateSyncOperationParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid operation type');
    });

    it('rejects missing operation type', () => {
      const params = {};
      const result = validateSyncOperationParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid operation type');
    });

    it('rejects restore operation without recovery phrase', () => {
      const params = { type: 'restore' };
      const result = validateSyncOperationParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Recovery phrase is required for restore operations');
    });

    it('rejects restore operation with empty recovery phrase', () => {
      const params = { type: 'restore', recoveryPhrase: '   ' };
      const result = validateSyncOperationParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Recovery phrase cannot be empty');
    });

    it('rejects restore operation with invalid recovery phrase format', () => {
      const invalidPhrases = [
        'tooshort',
        'ghijkl1234567890abcdef1234567890', // invalid hex chars
        'abcdef1234567890abcdef12345678901', // wrong length (31 chars)
      ];

      invalidPhrases.forEach(phrase => {
        const params = { type: 'restore', recoveryPhrase: phrase };
        const result = validateSyncOperationParams(params);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Recovery phrase must be a 32-character hexadecimal string');
      });
    });

    it('handles invalid input parameters', () => {
      const invalidInputs = [null, undefined, 'string', 123, []];

      invalidInputs.forEach(input => {
        const result = validateSyncOperationParams(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Sync operation parameters are required');
      });
    });
  });

  describe('createSyncOperationResult', () => {
    it('creates successful result with all fields', () => {
      const params = {
        success: true,
        message: 'Sync enabled successfully',
        syncId: 'sync123',
        recoveryPhrase: 'abcdef1234567890abcdef1234567890',
        isNewSync: true,
        data: { extra: 'info' }
      };

      const result = createSyncOperationResult(params);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Sync enabled successfully');
      expect(result.syncId).toBe('sync123');
      expect(result.recoveryPhrase).toBe('abcdef1234567890abcdef1234567890');
      expect(result.isNewSync).toBe(true);
      expect(result.data).toEqual({ extra: 'info' });
      expect(typeof result.timestamp).toBe('number');
    });

    it('creates failure result with minimal fields', () => {
      const params = {
        success: false,
        message: 'Sync failed'
      };

      const result = createSyncOperationResult(params);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Sync failed');
      expect(result.syncId).toBeUndefined();
      expect(result.recoveryPhrase).toBeUndefined();
      expect(result.isNewSync).toBeUndefined();
      expect(result.data).toBeUndefined();
      expect(typeof result.timestamp).toBe('number');
    });

    it('coerces types correctly', () => {
      const params = {
        success: 'true', // string -> boolean
        message: 123,    // number -> string
        syncId: 'test123', // needed for isNewSync to be included
        isNewSync: 'false' // string -> boolean
      };

      const result = createSyncOperationResult(params);

      expect(result.success).toBe(true); // truthy string becomes true
      expect(result.message).toBe('123');
      expect(result.isNewSync).toBe(true); // truthy string becomes true
    });

    it('excludes optional fields when not provided', () => {
      const params = { success: true };

      const result = createSyncOperationResult(params);

      expect(result.success).toBe(true);
      expect(result.message).toBe('');
      expect(result).not.toHaveProperty('syncId');
      expect(result).not.toHaveProperty('recoveryPhrase');
      expect(result).not.toHaveProperty('isNewSync');
      expect(result).not.toHaveProperty('data');
    });

    it('only includes isNewSync for successful operations with sync data', () => {
      const successWithSync = {
        success: true,
        syncId: 'sync123',
        isNewSync: true
      };

      const successWithoutSync = {
        success: true,
        isNewSync: true
      };

      const result1 = createSyncOperationResult(successWithSync);
      const result2 = createSyncOperationResult(successWithoutSync);

      expect(result1.isNewSync).toBe(true);
      expect(result2).not.toHaveProperty('isNewSync');
    });
  });

  describe('validateSyncStateUpdate', () => {
    it('validates valid state update', () => {
      const stateUpdate = {
        syncEnabled: true,
        syncId: 'sync123',
        syncRecoveryPhrase: 'phrase',
        syncStatus: 'idle',
        lastSyncTime: 1234567890,
        syncStatusChecked: true
      };

      const result = validateSyncStateUpdate(stateUpdate);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual(stateUpdate);
    });

    it('validates partial state update', () => {
      const stateUpdate = {
        syncEnabled: false,
        lastSyncTime: null
      };

      const result = validateSyncStateUpdate(stateUpdate);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual(stateUpdate);
    });

    it('rejects invalid field names', () => {
      const stateUpdate = {
        syncEnabled: true,
        invalidField: 'value'
      };

      const result = validateSyncStateUpdate(stateUpdate);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid field: invalidField');
    });

    it('rejects invalid boolean fields', () => {
      const stateUpdate = {
        syncEnabled: 'true', // string instead of boolean
        syncStatusChecked: 1  // number instead of boolean
      };

      const result = validateSyncStateUpdate(stateUpdate);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('syncEnabled must be a boolean');
      expect(result.error).toContain('syncStatusChecked must be a boolean');
    });

    it('rejects invalid string fields', () => {
      const stateUpdate = {
        syncId: 123,        // number instead of string/null
        syncStatus: true    // boolean instead of string/null
      };

      const result = validateSyncStateUpdate(stateUpdate);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('syncId must be a string or null');
      expect(result.error).toContain('syncStatus must be a string or null');
    });

    it('rejects invalid lastSyncTime', () => {
      const stateUpdate = {
        lastSyncTime: 'invalid', // string instead of number/null
      };

      const result = validateSyncStateUpdate(stateUpdate);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('lastSyncTime must be a positive number or null');
    });

    it('rejects negative lastSyncTime', () => {
      const stateUpdate = {
        lastSyncTime: -1000
      };

      const result = validateSyncStateUpdate(stateUpdate);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('lastSyncTime must be a positive number or null');
    });

    it('handles invalid input types', () => {
      const invalidInputs = [null, undefined, 'string', 123, []];

      invalidInputs.forEach(input => {
        const result = validateSyncStateUpdate(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('State update must be an object');
      });
    });
  });

  describe('calculateSyncRetryDelay', () => {
    it('calculates exponential backoff correctly', () => {
      expect(calculateSyncRetryDelay(1)).toBe(1000);  // 2^0 * 1000
      expect(calculateSyncRetryDelay(2)).toBe(2000);  // 2^1 * 1000
      expect(calculateSyncRetryDelay(3)).toBe(4000);  // 2^2 * 1000
      expect(calculateSyncRetryDelay(4)).toBe(8000);  // 2^3 * 1000
      expect(calculateSyncRetryDelay(5)).toBe(16000); // 2^4 * 1000
    });

    it('respects maximum delay', () => {
      const maxDelay = 10000;
      expect(calculateSyncRetryDelay(10, 1000, maxDelay)).toBe(maxDelay);
      expect(calculateSyncRetryDelay(15, 1000, maxDelay)).toBe(maxDelay);
    });

    it('uses custom base delay', () => {
      const baseDelay = 500;
      expect(calculateSyncRetryDelay(1, baseDelay)).toBe(500);
      expect(calculateSyncRetryDelay(2, baseDelay)).toBe(1000);
      expect(calculateSyncRetryDelay(3, baseDelay)).toBe(2000);
    });

    it('handles invalid attempt count', () => {
      expect(calculateSyncRetryDelay(0)).toBe(1000);     // default base delay
      expect(calculateSyncRetryDelay(-1)).toBe(1000);    // default base delay
      expect(calculateSyncRetryDelay('invalid')).toBe(1000); // default base delay
    });

    it('handles invalid base delay', () => {
      expect(calculateSyncRetryDelay(1, -500)).toBe(1000); // uses default 1000
      expect(calculateSyncRetryDelay(1, 'invalid')).toBe(1000); // uses default 1000
    });

    it('handles invalid max delay', () => {
      expect(calculateSyncRetryDelay(1, 1000, 500)).toBe(1000); // maxDelay < baseDelay, uses default 30000
      expect(calculateSyncRetryDelay(10, 1000, 'invalid')).toBe(30000); // uses default 30000
    });
  });

  describe('validateSyncPreviewData', () => {
    it('validates valid preview data', () => {
      const previewData = {
        users: [
          { name: 'Alice', icon: '👩', activityCount: 5 },
          { name: 'Bob', icon: '👨', activityCount: 3 }
        ],
        totalLibraryItems: 10,
        lastUpdated: '2024-01-15T12:00:00Z'
      };

      const result = validateSyncPreviewData(previewData);

      expect(result.isValid).toBe(true);
      expect(result.summary.totalUsers).toBe(2);
      expect(result.summary.totalActivities).toBe(8);
      expect(result.summary.totalLibraryItems).toBe(10);
      expect(result.summary.hasValidStructure).toBe(true);
    });

    it('validates preview data with only library items', () => {
      const previewData = {
        users: [],
        totalLibraryItems: 15,
        lastUpdated: '2024-01-15T12:00:00Z'
      };

      const result = validateSyncPreviewData(previewData);

      expect(result.isValid).toBe(true);
      expect(result.summary.totalUsers).toBe(0);
      expect(result.summary.totalActivities).toBe(0);
      expect(result.summary.totalLibraryItems).toBe(15);
      expect(result.summary.hasValidStructure).toBe(true);
    });

    it('validates preview data with only users', () => {
      const previewData = {
        users: [
          { name: 'User1', activityCount: 2 }
        ],
        totalLibraryItems: 0
      };

      const result = validateSyncPreviewData(previewData);

      expect(result.isValid).toBe(true);
      expect(result.summary.hasValidStructure).toBe(true);
    });

    it('rejects empty preview data', () => {
      const previewData = {
        users: [],
        totalLibraryItems: 0
      };

      const result = validateSyncPreviewData(previewData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Preview data contains no importable content');
      expect(result.summary.hasValidStructure).toBe(false);
    });

    it('validates users with missing names', () => {
      const previewData = {
        users: [
          { name: 'ValidUser', activityCount: 1 },
          { activityCount: 2 }, // missing name
          { name: '', activityCount: 0 } // empty name
        ],
        totalLibraryItems: 5
      };

      const result = validateSyncPreviewData(previewData);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('User at index 1 missing valid name');
      expect(result.error).toContain('User at index 2 missing valid name');
    });

    it('handles invalid lastUpdated timestamp', () => {
      const previewData = {
        users: [{ name: 'User', activityCount: 1 }],
        lastUpdated: 'invalid-date'
      };

      const result = validateSyncPreviewData(previewData);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid lastUpdated timestamp');
    });

    it('handles missing or invalid input', () => {
      const invalidInputs = [null, undefined, 'string', 123, []];

      invalidInputs.forEach(input => {
        const result = validateSyncPreviewData(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Preview data is required');
      });
    });

    it('handles users with invalid activity counts', () => {
      const previewData = {
        users: [
          { name: 'User1', activityCount: 5 },
          { name: 'User2', activityCount: 'invalid' },
          { name: 'User3', activityCount: -1 },
          { name: 'User4' } // missing activityCount
        ],
        totalLibraryItems: 1
      };

      const result = validateSyncPreviewData(previewData);

      expect(result.isValid).toBe(true); // Should still be valid overall
      expect(result.summary.totalActivities).toBe(5); // Only valid counts added
    });
  });

  describe('sanitizeSyncErrorMessage', () => {
    it('sanitizes recovery phrases', () => {
      const message = 'Error with phrase abcdef1234567890abcdef1234567890 failed';
      const result = sanitizeSyncErrorMessage(message);
      expect(result).toBe('Error with phrase [REDACTED_PHRASE] failed');
    });

    it('sanitizes sync IDs', () => {
      const message = 'Sync ID abc123def456789 not found';
      const result = sanitizeSyncErrorMessage(message);
      expect(result).toBe('Sync ID [REDACTED_ID] not found');
    });

    it('sanitizes long tokens', () => {
      const message = 'Token abcdefghijklmnopqrstuvwxyz123456789 is invalid';
      const result = sanitizeSyncErrorMessage(message);
      expect(result).toBe('Token [REDACTED_TOKEN] is invalid');
    });

    it('preserves short error codes', () => {
      const message = 'Error code 404 occurred';
      const result = sanitizeSyncErrorMessage(message);
      expect(result).toBe('Error code 404 occurred');
    });

    it('sanitizes URLs while preserving domain', () => {
      const message = 'Failed to connect to https://api.example.com/sync/secret/path';
      const result = sanitizeSyncErrorMessage(message);
      expect(result).toBe('Failed to connect to https://api.example.com[REDACTED_PATH]');
    });

    it('handles malformed URLs', () => {
      const message = 'Invalid URL: not-a-valid-url';
      const result = sanitizeSyncErrorMessage(message);
      expect(result).toBe('Invalid URL: [REDACTED_URL]');
    });

    it('handles empty or invalid input', () => {
      expect(sanitizeSyncErrorMessage('')).toBe('Sync operation failed');
      expect(sanitizeSyncErrorMessage(null)).toBe('Unknown sync error');
      expect(sanitizeSyncErrorMessage(undefined)).toBe('Unknown sync error');
      expect(sanitizeSyncErrorMessage(123)).toBe('Unknown sync error');
    });

    it('handles message that becomes empty after sanitization', () => {
      const message = 'abcdef1234567890abcdef1234567890'; // Only a recovery phrase
      const result = sanitizeSyncErrorMessage(message);
      expect(result).toBe('Sync operation failed');
    });

    it('preserves normal error messages', () => {
      const message = 'Network connection failed';
      const result = sanitizeSyncErrorMessage(message);
      expect(result).toBe('Network connection failed');
    });
  });

  describe('validateDeviceInviteParams', () => {
    it('validates default parameters', () => {
      const result = validateDeviceInviteParams();
      expect(result.isValid).toBe(true);
      expect(result.normalized).toEqual({
        expirationHours: 24,
        maxUses: 5,
        description: 'Device invite'
      });
    });

    it('validates custom parameters', () => {
      const params = {
        expirationHours: 12,
        maxUses: 3,
        description: 'Test invite'
      };

      const result = validateDeviceInviteParams(params);
      expect(result.isValid).toBe(true);
      expect(result.normalized).toEqual(params);
    });

    it('rejects invalid expiration hours', () => {
      const invalidCases = [
        { expirationHours: 0 },
        { expirationHours: -5 },
        { expirationHours: 10000 }, // > 8760
        { expirationHours: 'invalid' }
      ];

      invalidCases.forEach(params => {
        const result = validateDeviceInviteParams(params);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Expiration hours must be between 1 and 8760');
      });
    });

    it('rejects invalid max uses', () => {
      const invalidCases = [
        { maxUses: 0 },
        { maxUses: -1 },
        { maxUses: 101 }, // > 100
        { maxUses: 'invalid' }
      ];

      invalidCases.forEach(params => {
        const result = validateDeviceInviteParams(params);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Max uses must be between 1 and 100');
      });
    });

    it('floors fractional max uses', () => {
      const params = { maxUses: 3.7 };
      const result = validateDeviceInviteParams(params);
      expect(result.isValid).toBe(true);
      expect(result.normalized.maxUses).toBe(3);
    });

    it('rejects invalid descriptions', () => {
      const params = { description: 123 };
      const result = validateDeviceInviteParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Description must be a string');
    });

    it('rejects descriptions that are too long', () => {
      const params = { description: 'a'.repeat(101) };
      const result = validateDeviceInviteParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Description must be 100 characters or less');
    });

    it('trims and defaults empty descriptions', () => {
      const params = { description: '   ' };
      const result = validateDeviceInviteParams(params);
      expect(result.isValid).toBe(true);
      expect(result.normalized.description).toBe('Device invite');
    });

    it('handles partial parameters', () => {
      const params = { expirationHours: 6 };
      const result = validateDeviceInviteParams(params);
      expect(result.isValid).toBe(true);
      expect(result.normalized).toEqual({
        expirationHours: 6,
        maxUses: 5,
        description: 'Device invite'
      });
    });
  });

  describe('checkSyncOperationRateLimit', () => {
    const fixedTime = 1705123200000;

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(fixedTime);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('allows operation when no previous operation', () => {
      const params = { lastOperationTime: 0 };
      const result = checkSyncOperationRateLimit(params);
      expect(result.isRateLimited).toBe(false);
      expect(result.waitTimeMs).toBeUndefined();
    });

    it('allows operation when enough time has passed', () => {
      const params = { lastOperationTime: fixedTime - 10000 }; // 10 seconds ago
      const result = checkSyncOperationRateLimit(params);
      expect(result.isRateLimited).toBe(false);
    });

    it('rate limits when not enough time has passed', () => {
      const params = { lastOperationTime: fixedTime - 3000 }; // 3 seconds ago
      const result = checkSyncOperationRateLimit(params);
      expect(result.isRateLimited).toBe(true);
      expect(result.waitTimeMs).toBe(2000); // 5000 - 3000
    });

    it('uses custom minimum interval', () => {
      const params = {
        lastOperationTime: fixedTime - 8000, // 8 seconds ago
        minIntervalMs: 10000 // 10 second minimum
      };
      const result = checkSyncOperationRateLimit(params);
      expect(result.isRateLimited).toBe(true);
      expect(result.waitTimeMs).toBe(2000); // 10000 - 8000
    });

    it('uses operation-specific intervals', () => {
      const testCases = [
        { operationType: 'manual', expectedInterval: 5000 },
        { operationType: 'enable', expectedInterval: 10000 },
        { operationType: 'restore', expectedInterval: 10000 },
        { operationType: 'disable', expectedInterval: 2000 },
      ];

      testCases.forEach(({ operationType, expectedInterval }) => {
        const params = {
          lastOperationTime: fixedTime - 1000, // 1 second ago
          operationType
        };
        const result = checkSyncOperationRateLimit(params);
        expect(result.isRateLimited).toBe(true);
        expect(result.waitTimeMs).toBe(expectedInterval - 1000);
      });
    });

    it('allows disable operations with shorter interval', () => {
      const params = {
        lastOperationTime: fixedTime - 3000, // 3 seconds ago
        operationType: 'disable'
      };
      const result = checkSyncOperationRateLimit(params);
      expect(result.isRateLimited).toBe(false); // 3s > 2s interval for disable
    });

    it('handles invalid lastOperationTime', () => {
      const invalidTimes = [null, undefined, 'invalid', -1];

      invalidTimes.forEach(lastOperationTime => {
        const params = { lastOperationTime };
        const result = checkSyncOperationRateLimit(params);
        expect(result.isRateLimited).toBe(false);
      });
    });

    it('uses default interval for unknown operation types', () => {
      const params = {
        lastOperationTime: fixedTime - 3000, // 3 seconds ago
        operationType: 'unknown',
        minIntervalMs: 4000
      };
      const result = checkSyncOperationRateLimit(params);
      expect(result.isRateLimited).toBe(true);
      expect(result.waitTimeMs).toBe(1000); // 4000 - 3000
    });
  });
});