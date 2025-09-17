// @ts-check
import {
  generateRecoveryPhrase,
  isValidRecoveryPhrase,
  parseSyncKey,
  formatRecoveryPhraseDisplay,
  createInviteUrl,
  validateClipboardSyncContent,
  extractRecoveryPhrase,
  generateInviteCode,
  calculateInviteExpiration,
  isInviteExpired,
  formatTimeUntilExpiration,
} from '../recoveryPhraseUtils';

describe('recoveryPhraseUtils', () => {
  describe('generateRecoveryPhrase', () => {
    it('generates 32-character hex phrase', () => {
      const phrase = generateRecoveryPhrase();
      expect(phrase).toHaveLength(32);
      expect(/^[a-f0-9]+$/.test(phrase)).toBe(true);
    });

    it('generates different phrases on each call', () => {
      const phrase1 = generateRecoveryPhrase();
      const phrase2 = generateRecoveryPhrase();
      expect(phrase1).not.toBe(phrase2);
    });

    it('generates valid hex characters only', () => {
      const phrase = generateRecoveryPhrase();
      const validChars = '0123456789abcdef';

      for (let char of phrase) {
        expect(validChars.includes(char)).toBe(true);
      }
    });

    it('works with crypto API mocked', () => {
      const originalCrypto = global.crypto;

      // Test with crypto API
      const mockGetRandomValues = jest.fn((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256; // Predictable values for testing
        }
      });

      global.crypto = {
        getRandomValues: mockGetRandomValues
      };

      const phrase = generateRecoveryPhrase();
      expect(phrase).toHaveLength(32);
      expect(mockGetRandomValues).toHaveBeenCalled();

      global.crypto = originalCrypto;
    });

    it('throws error without crypto API', () => {
      const originalCrypto = global.crypto;
      global.crypto = undefined;

      expect(() => generateRecoveryPhrase()).toThrow(
        'Crypto API not available. Recovery phrase generation requires a secure random number generator.'
      );

      global.crypto = originalCrypto;
    });
  });

  describe('isValidRecoveryPhrase', () => {
    it('validates correct 32-char hex phrases', () => {
      const validPhrases = [
        'abcdef1234567890abcdef1234567890',
        'ABCDEF1234567890ABCDEF1234567890',
        '0123456789abcdef0123456789abcdef',
        'ffffffffffffffffffffffffffffffff',
      ];

      validPhrases.forEach(phrase => {
        const result = isValidRecoveryPhrase(phrase);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('rejects phrases with wrong length', () => {
      const wrongLength = [
        'abc',
        'abcdef1234567890abcdef12345678901', // 31 chars
        'abcdef1234567890abcdef12345678901a', // 33 chars
      ];

      wrongLength.forEach(phrase => {
        const result = isValidRecoveryPhrase(phrase);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Recovery phrase must be exactly 32 characters');
      });
    });

    it('rejects phrases with non-hex characters', () => {
      const invalidPhrases = [
        'ghijkl1234567890abcdef1234567890',
        'abcdef1234567890abcdef123456789g',
        'abcdef 234567890abcdef1234567890', // space
        'abcdef@234567890abcdef123456789', // special char
      ];

      invalidPhrases.forEach(phrase => {
        const result = isValidRecoveryPhrase(phrase);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Recovery phrase must contain only hexadecimal characters (0-9, a-f)');
      });
    });

    it('handles invalid inputs', () => {
      const invalidInputs = [null, undefined, '', 123, {}, []];

      invalidInputs.forEach(input => {
        const result = isValidRecoveryPhrase(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Recovery phrase is required');
      });
    });

    it('trims whitespace', () => {
      const phrase = '  abcdef1234567890abcdef1234567890  ';
      const result = isValidRecoveryPhrase(phrase);
      expect(result.isValid).toBe(true);
    });
  });

  describe('parseSyncKey', () => {
    it('parses URL format correctly', () => {
      const url = 'https://stackmap.app/sync/invite123#abcdef1234567890abcdef1234567890';
      const result = parseSyncKey(url);

      expect(result).toEqual({
        keyOnly: 'invite123#abcdef1234567890abcdef1234567890',
        fullUrl: url,
        inviteCode: 'invite123',
        recoveryPhrase: 'abcdef1234567890abcdef1234567890'
      });
    });

    it('parses key-only format correctly', () => {
      const key = 'invite456#fedcba0987654321fedcba0987654321';
      const result = parseSyncKey(key);

      expect(result).toEqual({
        keyOnly: key,
        fullUrl: null,
        inviteCode: 'invite456',
        recoveryPhrase: 'fedcba0987654321fedcba0987654321'
      });
    });

    it('parses recovery phrase only', () => {
      const phrase = 'abcdef1234567890abcdef1234567890';
      const result = parseSyncKey(phrase);

      expect(result).toEqual({
        keyOnly: phrase,
        fullUrl: null,
        inviteCode: null,
        recoveryPhrase: phrase
      });
    });

    it('returns null for invalid inputs', () => {
      const invalidInputs = [
        null,
        undefined,
        '',
        'https://example.com', // No # fragment
        'invalidkey', // Not hex, wrong length
        'abc#def', // Invalid recovery phrase
      ];

      invalidInputs.forEach(input => {
        expect(parseSyncKey(input)).toBeNull();
      });
    });

    it('handles URLs with different domains', () => {
      const url = 'https://example.com/path/invite789#1234567890abcdef1234567890abcdef';
      const result = parseSyncKey(url);

      expect(result.inviteCode).toBe('invite789');
      expect(result.recoveryPhrase).toBe('1234567890abcdef1234567890abcdef');
    });
  });

  describe('formatRecoveryPhraseDisplay', () => {
    it('formats 32-char phrase with spaces', () => {
      const phrase = 'abcdef1234567890abcdef1234567890';
      const result = formatRecoveryPhraseDisplay(phrase);
      expect(result).toBe('abcdef12 34567890 abcdef12 34567890');
    });

    it('removes existing spaces before formatting', () => {
      const phrase = 'abcd ef12 3456 7890abcdef1234567890';
      const result = formatRecoveryPhraseDisplay(phrase);
      expect(result).toBe('abcdef12 34567890 abcdef12 34567890');
    });

    it('returns as-is for non-32-char strings', () => {
      const shortPhrase = 'abcdef';
      expect(formatRecoveryPhraseDisplay(shortPhrase)).toBe(shortPhrase);

      const longPhrase = 'abcdef1234567890abcdef1234567890123';
      expect(formatRecoveryPhraseDisplay(longPhrase)).toBe(longPhrase);
    });

    it('handles invalid inputs', () => {
      expect(formatRecoveryPhraseDisplay(null)).toBe('');
      expect(formatRecoveryPhraseDisplay(undefined)).toBe('');
      expect(formatRecoveryPhraseDisplay(123)).toBe('');
    });
  });

  describe('createInviteUrl', () => {
    it('creates valid invite URL', () => {
      const phrase = 'abcdef1234567890abcdef1234567890';
      const code = 'invite123';
      const result = createInviteUrl(phrase, code);

      expect(result).toBe('https://stackmap.app/sync/invite123#abcdef1234567890abcdef1234567890');
    });

    it('accepts custom base URL', () => {
      const phrase = 'abcdef1234567890abcdef1234567890';
      const code = 'invite123';
      const baseUrl = 'https://custom.com';
      const result = createInviteUrl(phrase, code, baseUrl);

      expect(result).toBe('https://custom.com/sync/invite123#abcdef1234567890abcdef1234567890');
    });

    it('throws error for missing parameters', () => {
      const phrase = 'abcdef1234567890abcdef1234567890';

      expect(() => createInviteUrl('', 'code')).toThrow('Recovery phrase and invite code are required');
      expect(() => createInviteUrl(phrase, '')).toThrow('Recovery phrase and invite code are required');
      expect(() => createInviteUrl(null, 'code')).toThrow('Recovery phrase and invite code are required');
    });

    it('throws error for invalid recovery phrase', () => {
      const invalidPhrase = 'invalid';
      const code = 'invite123';

      expect(() => createInviteUrl(invalidPhrase, code)).toThrow('Recovery phrase must contain only hexadecimal characters (0-9, a-f)');
    });
  });

  describe('validateClipboardSyncContent', () => {
    it('validates URL format', () => {
      const url = 'https://stackmap.app/sync/invite123#abcdef1234567890abcdef1234567890';
      const result = validateClipboardSyncContent(url);

      expect(result.isValid).toBe(true);
      expect(result.type).toBe('url');
    });

    it('validates key format', () => {
      const key = 'invite123#abcdef1234567890abcdef1234567890';
      const result = validateClipboardSyncContent(key);

      expect(result.isValid).toBe(true);
      expect(result.type).toBe('key');
    });

    it('validates phrase format', () => {
      const phrase = 'abcdef1234567890abcdef1234567890';
      const result = validateClipboardSyncContent(phrase);

      expect(result.isValid).toBe(true);
      expect(result.type).toBe('phrase');
    });

    it('rejects invalid URLs', () => {
      const invalidUrl = 'https://example.com/invalid';
      const result = validateClipboardSyncContent(invalidUrl);

      expect(result.isValid).toBe(false);
      expect(result.type).toBe('invalid');
      expect(result.error).toBe('Invalid invite URL format');
    });

    it('rejects invalid content', () => {
      const invalidContent = 'random text';
      const result = validateClipboardSyncContent(invalidContent);

      expect(result.isValid).toBe(false);
      expect(result.type).toBe('invalid');
      expect(result.error).toBe('Content is not a valid sync key, URL, or recovery phrase');
    });

    it('handles empty content', () => {
      const result = validateClipboardSyncContent('');
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('invalid');
      expect(result.error).toBe('No content provided');
    });
  });

  describe('extractRecoveryPhrase', () => {
    it('extracts phrase from URL', () => {
      const url = 'https://stackmap.app/sync/invite123#abcdef1234567890abcdef1234567890';
      const result = extractRecoveryPhrase(url);
      expect(result).toBe('abcdef1234567890abcdef1234567890');
    });

    it('extracts phrase from key format', () => {
      const key = 'invite123#fedcba0987654321fedcba0987654321';
      const result = extractRecoveryPhrase(key);
      expect(result).toBe('fedcba0987654321fedcba0987654321');
    });

    it('extracts phrase from direct phrase', () => {
      const phrase = '1234567890abcdef1234567890abcdef';
      const result = extractRecoveryPhrase(phrase);
      expect(result).toBe('1234567890abcdef1234567890abcdef');
    });

    it('returns null for invalid content', () => {
      const invalid = 'invalid content';
      expect(extractRecoveryPhrase(invalid)).toBeNull();
    });
  });

  describe('generateInviteCode', () => {
    it('generates code with default length', () => {
      const code = generateInviteCode();
      expect(code).toHaveLength(8);
      expect(/^[A-Za-z0-9]+$/.test(code)).toBe(true);
    });

    it('generates code with custom length', () => {
      const code = generateInviteCode(12);
      expect(code).toHaveLength(12);
      expect(/^[A-Za-z0-9]+$/.test(code)).toBe(true);
    });

    it('generates different codes on each call', () => {
      const code1 = generateInviteCode();
      const code2 = generateInviteCode();
      expect(code1).not.toBe(code2);
    });

    it('works with crypto API', () => {
      const originalCrypto = global.crypto;
      const mockGetRandomValues = jest.fn((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 62; // Within valid range
        }
      });

      global.crypto = { getRandomValues: mockGetRandomValues };

      const code = generateInviteCode(5);
      expect(code).toHaveLength(5);
      expect(mockGetRandomValues).toHaveBeenCalled();

      global.crypto = originalCrypto;
    });

    it('throws error without crypto API', () => {
      const originalCrypto = global.crypto;
      global.crypto = undefined;

      expect(() => generateInviteCode(3)).toThrow(
        'Crypto API not available. Invite code generation requires a secure random number generator.'
      );

      global.crypto = originalCrypto;
    });
  });

  describe('calculateInviteExpiration', () => {
    const fixedTime = 1705123200000;

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(fixedTime);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('calculates expiration for default 24 hours', () => {
      const expiration = calculateInviteExpiration();
      const expected = fixedTime + (24 * 60 * 60 * 1000);
      expect(expiration).toBe(expected);
    });

    it('calculates expiration for custom hours', () => {
      const expiration = calculateInviteExpiration(12);
      const expected = fixedTime + (12 * 60 * 60 * 1000);
      expect(expiration).toBe(expected);
    });

    it('throws error for invalid hours', () => {
      expect(() => calculateInviteExpiration(0)).toThrow('Hours must be a positive number');
      expect(() => calculateInviteExpiration(-5)).toThrow('Hours must be a positive number');
      expect(() => calculateInviteExpiration('invalid')).toThrow('Hours must be a positive number');
    });
  });

  describe('isInviteExpired', () => {
    const fixedTime = 1705123200000;

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(fixedTime);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns false for future expiration', () => {
      const futureTime = fixedTime + 3600000; // 1 hour future
      expect(isInviteExpired(futureTime)).toBe(false);
    });

    it('returns true for past expiration', () => {
      const pastTime = fixedTime - 3600000; // 1 hour past
      expect(isInviteExpired(pastTime)).toBe(true);
    });

    it('returns true for current time (edge case)', () => {
      expect(isInviteExpired(fixedTime)).toBe(false);
      expect(isInviteExpired(fixedTime - 1)).toBe(true);
    });

    it('returns true for invalid timestamps', () => {
      expect(isInviteExpired(null)).toBe(true);
      expect(isInviteExpired(undefined)).toBe(true);
      expect(isInviteExpired('invalid')).toBe(true);
    });
  });

  describe('formatTimeUntilExpiration', () => {
    const fixedTime = 1705123200000;

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(fixedTime);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('formats hours and minutes remaining', () => {
      const expiration = fixedTime + (2 * 60 * 60 * 1000) + (30 * 60 * 1000); // 2h 30m
      expect(formatTimeUntilExpiration(expiration)).toBe('2h 30m remaining');
    });

    it('formats minutes only when less than 1 hour', () => {
      const expiration = fixedTime + (45 * 60 * 1000); // 45 minutes
      expect(formatTimeUntilExpiration(expiration)).toBe('45m remaining');
    });

    it('handles exactly 1 hour', () => {
      const expiration = fixedTime + (60 * 60 * 1000); // 1 hour
      expect(formatTimeUntilExpiration(expiration)).toBe('1h 0m remaining');
    });

    it('returns "Expired" for past times', () => {
      const pastTime = fixedTime - 1000;
      expect(formatTimeUntilExpiration(pastTime)).toBe('Expired');
    });

    it('handles invalid timestamps', () => {
      expect(formatTimeUntilExpiration(null)).toBe('Invalid expiration');
      expect(formatTimeUntilExpiration(undefined)).toBe('Invalid expiration');
      expect(formatTimeUntilExpiration('invalid')).toBe('Invalid expiration');
    });

    it('handles very small remaining times', () => {
      const expiration = fixedTime + 30000; // 30 seconds
      expect(formatTimeUntilExpiration(expiration)).toBe('0m remaining');
    });
  });
});