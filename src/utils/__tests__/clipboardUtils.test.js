// @ts-check
import {
  validateClipboardText,
  extractClipboardData,
  formatTextForClipboard,
  generateClipboardMessage,
  sanitizeClipboardContent,
  validateClipboardSize,
} from '../clipboardUtils';

describe('clipboardUtils', () => {
  describe('validateClipboardText', () => {
    it('validates recovery phrase format', () => {
      const phrase = 'abcdef1234567890abcdef1234567890';
      const result = validateClipboardText(phrase);

      expect(result.isValid).toBe(true);
      expect(result.type).toBe('recovery_phrase');
      expect(result.metadata.phrase).toBe(phrase);
      expect(result.metadata.length).toBe(32);
    });

    it('validates sync key format', () => {
      const key = 'invite123#abcdef1234567890abcdef1234567890';
      const result = validateClipboardText(key);

      expect(result.isValid).toBe(true);
      expect(result.type).toBe('sync_key');
      expect(result.metadata.inviteCode).toBe('invite123');
      expect(result.metadata.recoveryPhrase).toBe('abcdef1234567890abcdef1234567890');
      expect(result.metadata.fullKey).toBe(key);
    });

    it('validates invite URL format', () => {
      const url = 'https://stackmap.app/sync/invite123#abcdef1234567890abcdef1234567890';
      const result = validateClipboardText(url);

      expect(result.isValid).toBe(true);
      expect(result.type).toBe('invite_url');
      expect(result.metadata.domain).toBe('stackmap.app');
      expect(result.metadata.inviteCode).toBe('invite123');
      expect(result.metadata.recoveryPhrase).toBe('abcdef1234567890abcdef1234567890');
      expect(result.metadata.fullUrl).toBe(url);
    });

    it('validates StackMap export JSON', () => {
      const exportData = JSON.stringify({
        version: '4.0',
        users: { '1': { name: 'Test User' } },
        library: { categories: [] },
        exportDate: '2024-01-15'
      });

      const result = validateClipboardText(exportData);

      expect(result.isValid).toBe(true);
      expect(result.type).toBe('export_data');
      expect(result.metadata.version).toBe('4.0');
      expect(result.metadata.hasUsers).toBe(true);
      expect(result.metadata.hasLibrary).toBe(true);
      expect(result.metadata.exportDate).toBe('2024-01-15');
    });

    it('rejects invalid recovery phrase', () => {
      const invalidPhrase = 'invalid123';
      const result = validateClipboardText(invalidPhrase);

      expect(result.isValid).toBe(false);
      expect(result.type).toBe('unknown');
      expect(result.error).toBe('Content is not a recognized sync format');
    });

    it('rejects URL without recovery phrase fragment', () => {
      const invalidUrl = 'https://stackmap.app/sync/invite123';
      const result = validateClipboardText(invalidUrl);

      expect(result.isValid).toBe(false);
      expect(result.type).toBe('url');
      expect(result.error).toBe('URL missing recovery phrase fragment');
    });

    it('rejects URL with invalid recovery phrase', () => {
      const invalidUrl = 'https://stackmap.app/sync/invite123#invalidphrase';
      const result = validateClipboardText(invalidUrl);

      expect(result.isValid).toBe(false);
      expect(result.type).toBe('url');
      expect(result.error).toBe('URL contains invalid recovery phrase');
    });

    it('rejects sync key with invalid format', () => {
      const invalidKey = 'invalid#key#format';
      const result = validateClipboardText(invalidKey);

      expect(result.isValid).toBe(false);
      expect(result.type).toBe('key');
      expect(result.error).toBe('Invalid key format - must contain exactly one # separator');
    });

    it('rejects sync key with missing invite code', () => {
      const invalidKey = '#abcdef1234567890abcdef1234567890';
      const result = validateClipboardText(invalidKey);

      expect(result.isValid).toBe(false);
      expect(result.type).toBe('key');
      expect(result.error).toBe('Missing invite code');
    });

    it('rejects sync key with invalid recovery phrase', () => {
      const invalidKey = 'invite123#invalidphrase';
      const result = validateClipboardText(invalidKey);

      expect(result.isValid).toBe(false);
      expect(result.type).toBe('key');
      expect(result.error).toBe('Invalid recovery phrase format');
    });

    it('rejects JSON that is not StackMap export', () => {
      const nonStackMapJson = JSON.stringify({
        some: 'other',
        data: 'format'
      });

      const result = validateClipboardText(nonStackMapJson);

      expect(result.isValid).toBe(false);
      expect(result.type).toBe('json');
      expect(result.error).toBe('JSON does not appear to be StackMap export data');
    });

    it('rejects invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      const result = validateClipboardText(invalidJson);

      expect(result.isValid).toBe(false);
      expect(result.type).toBe('json');
      expect(result.error).toBe('Invalid JSON format');
    });

    it('rejects malformed URLs', () => {
      const malformedUrl = 'http://invalid url with spaces';
      const result = validateClipboardText(malformedUrl);

      expect(result.isValid).toBe(false);
      expect(result.type).toBe('url');
      expect(result.error).toBe('Invalid URL format');
    });

    it('handles invalid input types', () => {
      const invalidInputs = [null, undefined, 123, {}, []];

      invalidInputs.forEach(input => {
        const result = validateClipboardText(input);
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('unknown');
        expect(result.error).toBe('Invalid text content');
      });
    });

    it('handles empty and whitespace strings', () => {
      const emptyInputs = ['', '   ', '\n\t'];

      emptyInputs.forEach(input => {
        const result = validateClipboardText(input);
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('unknown');
        expect(result.error).toBe('Content is not a recognized sync format');
      });
    });
  });

  describe('extractClipboardData', () => {
    it('extracts recovery phrase data', () => {
      const validationResult = {
        isValid: true,
        type: 'recovery_phrase',
        metadata: {
          phrase: 'abcdef1234567890abcdef1234567890',
          length: 32
        }
      };

      const result = extractClipboardData(validationResult);

      expect(result).toEqual({
        recoveryPhrase: 'abcdef1234567890abcdef1234567890'
      });
    });

    it('extracts sync key data', () => {
      const validationResult = {
        isValid: true,
        type: 'sync_key',
        metadata: {
          inviteCode: 'invite123',
          recoveryPhrase: 'abcdef1234567890abcdef1234567890',
          fullKey: 'invite123#abcdef1234567890abcdef1234567890'
        }
      };

      const result = extractClipboardData(validationResult);

      expect(result).toEqual({
        recoveryPhrase: 'abcdef1234567890abcdef1234567890',
        inviteCode: 'invite123'
      });
    });

    it('extracts invite URL data', () => {
      const validationResult = {
        isValid: true,
        type: 'invite_url',
        metadata: {
          domain: 'stackmap.app',
          inviteCode: 'invite123',
          recoveryPhrase: 'abcdef1234567890abcdef1234567890',
          fullUrl: 'https://stackmap.app/sync/invite123#abcdef1234567890abcdef1234567890'
        }
      };

      const result = extractClipboardData(validationResult);

      expect(result).toEqual({
        recoveryPhrase: 'abcdef1234567890abcdef1234567890',
        inviteCode: 'invite123',
        url: 'https://stackmap.app/sync/invite123#abcdef1234567890abcdef1234567890'
      });
    });

    it('extracts export data', () => {
      const validationResult = {
        isValid: true,
        type: 'export_data',
        metadata: {
          version: '4.0',
          hasUsers: true,
          hasLibrary: false,
          size: 1024
        }
      };

      const result = extractClipboardData(validationResult);

      expect(result).toEqual({
        data: {
          version: '4.0',
          hasUsers: true,
          hasLibrary: false,
          size: 1024
        }
      });
    });

    it('returns null for invalid validation results', () => {
      const invalidResults = [
        null,
        undefined,
        { isValid: false },
        { isValid: true, type: 'unknown' },
        { isValid: true, type: 'recovery_phrase' }, // missing metadata
      ];

      invalidResults.forEach(result => {
        expect(extractClipboardData(result)).toBeNull();
      });
    });

    it('returns null for unrecognized types', () => {
      const unknownResult = {
        isValid: true,
        type: 'unknown_type',
        metadata: { some: 'data' }
      };

      expect(extractClipboardData(unknownResult)).toBeNull();
    });
  });

  describe('formatTextForClipboard', () => {
    it('formats recovery phrase by removing spaces and lowercasing', () => {
      const phrase = 'ABCD EF12 3456 7890 ABCD EF12 3456 7890';
      const result = formatTextForClipboard(phrase, 'phrase');
      expect(result).toBe('abcdef1234567890abcdef1234567890');
    });

    it('formats sync key properly', () => {
      const key = '  invite123  # ABCD EF12 3456 7890 ABCD EF12 3456 7890  ';
      const result = formatTextForClipboard(key, 'key');
      expect(result).toBe('invite123#abcdef1234567890abcdef1234567890');
    });

    it('formats URL by trimming', () => {
      const url = '  https://stackmap.app/sync/invite123#phrase  ';
      const result = formatTextForClipboard(url, 'url');
      expect(result).toBe('https://stackmap.app/sync/invite123#phrase');
    });

    it('formats JSON by minifying', () => {
      const json = '{\n  "version": "4.0",\n  "users": {}\n}';
      const result = formatTextForClipboard(json, 'json');
      expect(result).toBe('{"version":"4.0","users":{}}');
    });

    it('handles invalid JSON by trimming', () => {
      const invalidJson = '  { invalid json }  ';
      const result = formatTextForClipboard(invalidJson, 'json');
      expect(result).toBe('{ invalid json }');
    });

    it('defaults to trimming for unknown types', () => {
      const text = '  some text  ';
      const result = formatTextForClipboard(text, 'unknown');
      expect(result).toBe('some text');
    });

    it('handles invalid input', () => {
      expect(formatTextForClipboard(null, 'phrase')).toBe('');
      expect(formatTextForClipboard(undefined, 'phrase')).toBe('');
      expect(formatTextForClipboard(123, 'phrase')).toBe('');
    });
  });

  describe('generateClipboardMessage', () => {
    it('generates success messages for copy operations', () => {
      expect(generateClipboardMessage('copy', 'phrase', true)).toBe('Recovery phrase copied to clipboard!');
      expect(generateClipboardMessage('copy', 'key', true)).toBe('Sync key copied to clipboard!');
      expect(generateClipboardMessage('copy', 'url', true)).toBe('Invite URL copied to clipboard!');
      expect(generateClipboardMessage('copy', 'data', true)).toBe('Export data copied to clipboard!');
    });

    it('generates success messages for paste operations', () => {
      expect(generateClipboardMessage('paste', 'phrase', true)).toBe('Recovery phrase pasted successfully!');
      expect(generateClipboardMessage('paste', 'key', true)).toBe('Sync key pasted successfully!');
    });

    it('generates success messages for validation operations', () => {
      expect(generateClipboardMessage('validate', 'phrase', true)).toBe('Valid recovery phrase detected');
      expect(generateClipboardMessage('validate', 'url', true)).toBe('Valid invite URL detected');
    });

    it('generates error messages for failed operations', () => {
      expect(generateClipboardMessage('copy', 'phrase', false)).toBe('Failed to copy recovery phrase. Please try selecting and copying manually.');
      expect(generateClipboardMessage('paste', 'key', false)).toBe('Failed to paste sync key. Please try again.');
      expect(generateClipboardMessage('validate', 'url', false)).toBe('Invalid invite URL format');
    });

    it('uses custom error messages when provided', () => {
      const customError = 'Custom error message';
      expect(generateClipboardMessage('copy', 'phrase', false, customError)).toBe(customError);
      expect(generateClipboardMessage('validate', 'key', false, customError)).toBe(customError);
    });

    it('handles unknown content types', () => {
      expect(generateClipboardMessage('copy', 'unknown', true)).toBe('Content copied to clipboard!');
      expect(generateClipboardMessage('paste', 'unknown', false)).toBe('Failed to paste content. Please try again.');
    });

    it('handles unknown operations', () => {
      expect(generateClipboardMessage('unknown', 'phrase', true)).toBe('Operation completed successfully');
      expect(generateClipboardMessage('unknown', 'key', false)).toBe('Operation failed');
    });
  });

  describe('sanitizeClipboardContent', () => {
    it('sanitizes recovery phrases', () => {
      const content = 'Error with phrase abcdef1234567890abcdef1234567890 failed';
      const result = sanitizeClipboardContent(content);
      expect(result).toBe('Error with phrase [RECOVERY_PHRASE] failed');
    });

    it('sanitizes invite URLs', () => {
      const content = 'https://stackmap.app/sync/invite123#abcdef1234567890abcdef1234567890';
      const result = sanitizeClipboardContent(content);
      expect(result).toBe('https://stackmap.app/sync/[INVITE_CODE]#[RECOVERY_PHRASE]');
    });

    it('sanitizes sync keys', () => {
      const content = 'Key: invite123#abcdef1234567890abcdef1234567890';
      const result = sanitizeClipboardContent(content);
      expect(result).toBe('Key: [INVITE_CODE]#[RECOVERY_PHRASE]');
    });

    it('sanitizes JSON user data', () => {
      const content = JSON.stringify({
        version: '4.0',
        users: { '1': { name: 'Secret User', data: 'sensitive' } },
        library: { categories: [] }
      });

      const result = sanitizeClipboardContent(content);
      const parsed = JSON.parse(result);

      expect(parsed.version).toBe('4.0');
      expect(parsed.users).toBe('[SANITIZED_USER_DATA]');
      expect(parsed.library).toEqual({ categories: [] });
    });

    it('handles invalid JSON gracefully', () => {
      const content = '{ invalid json with abcdef1234567890abcdef1234567890 }';
      const result = sanitizeClipboardContent(content);
      expect(result).toBe('{ invalid json with [RECOVERY_PHRASE] }');
    });

    it('handles invalid input', () => {
      expect(sanitizeClipboardContent(null)).toBe('[INVALID_CONTENT]');
      expect(sanitizeClipboardContent(undefined)).toBe('[INVALID_CONTENT]');
      expect(sanitizeClipboardContent(123)).toBe('[INVALID_CONTENT]');
    });

    it('preserves non-sensitive content', () => {
      const content = 'Normal message without sensitive data';
      const result = sanitizeClipboardContent(content);
      expect(result).toBe('Normal message without sensitive data');
    });
  });

  describe('validateClipboardSize', () => {
    it('validates content within size limits', () => {
      const content = 'Small content';
      const result = validateClipboardSize(content);

      expect(result.isValid).toBe(true);
      expect(result.size).toBeLessThan(1);
      expect(result.error).toBeUndefined();
    });

    it('validates content with custom size limit', () => {
      const content = 'a'.repeat(500); // 500 bytes
      const result = validateClipboardSize(content, 1); // 1KB limit

      expect(result.isValid).toBe(true);
      expect(result.size).toBeLessThan(1);
    });

    it('rejects content exceeding size limits', () => {
      const content = 'a'.repeat(2048); // 2KB content
      const result = validateClipboardSize(content, 1); // 1KB limit

      expect(result.isValid).toBe(false);
      expect(result.size).toBeGreaterThan(1);
      expect(result.error).toContain('Content too large');
      expect(result.error).toContain('Maximum allowed: 1KB');
    });

    it('calculates size correctly', () => {
      const content = 'x'.repeat(1024); // Exactly 1KB
      const result = validateClipboardSize(content, 1);

      expect(result.isValid).toBe(true); // Exactly 1KB should be valid
      expect(result.size).toBe(1);
    });

    it('handles empty content', () => {
      const result = validateClipboardSize('');
      expect(result.isValid).toBe(true);
      expect(result.size).toBe(0);
    });

    it('handles invalid input', () => {
      const invalidInputs = [null, undefined, 123, {}, []];

      invalidInputs.forEach(input => {
        const result = validateClipboardSize(input);
        expect(result.isValid).toBe(false);
        expect(result.size).toBe(0);
        expect(result.error).toBe('No content provided');
      });
    });

    it('uses default size limit when not provided', () => {
      const largeContent = 'a'.repeat(2 * 1024 * 1024); // 2MB content
      const result = validateClipboardSize(largeContent);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum allowed: 1024KB');
    });
  });
});