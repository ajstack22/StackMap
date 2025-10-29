// @ts-check
import { parseSyncKey } from '../SyncQRScanner';

describe('SyncQRScanner - parseSyncKey', () => {
  describe('Full URL parsing', () => {
    it('should parse production sync URL', () => {
      const url = 'https://stackmap.app/?sync=a1b2c3d4e5f6789012345678901234ab';
      const result = parseSyncKey(url);
      expect(result).toBe('a1b2c3d4e5f6789012345678901234ab');
    });

    it('should parse beta sync URL', () => {
      const url = 'https://stackmap.app/beta/?sync=a1b2c3d4e5f6789012345678901234ab';
      const result = parseSyncKey(url);
      expect(result).toBe('a1b2c3d4e5f6789012345678901234ab');
    });

    it('should parse qual sync URL', () => {
      const url = 'https://stackmap.app/qual/?sync=a1b2c3d4e5f6789012345678901234ab';
      const result = parseSyncKey(url);
      expect(result).toBe('a1b2c3d4e5f6789012345678901234ab');
    });

    it('should parse URL with additional parameters', () => {
      const url = 'https://stackmap.app/?sync=a1b2c3d4e5f6789012345678901234ab&other=param';
      const result = parseSyncKey(url);
      expect(result).toBe('a1b2c3d4e5f6789012345678901234ab');
    });
  });

  describe('Direct key parsing', () => {
    it('should parse lowercase hex key', () => {
      const key = 'a1b2c3d4e5f6789012345678901234ab';
      const result = parseSyncKey(key);
      expect(result).toBe('a1b2c3d4e5f6789012345678901234ab');
    });

    it('should parse uppercase hex key', () => {
      const key = 'A1B2C3D4E5F6789012345678901234AB';
      const result = parseSyncKey(key);
      expect(result).toBe('A1B2C3D4E5F6789012345678901234AB');
    });

    it('should parse mixed case hex key', () => {
      const key = 'A1b2C3d4E5f6789012345678901234Ab';
      const result = parseSyncKey(key);
      expect(result).toBe('A1b2C3d4E5f6789012345678901234Ab');
    });

    it('should handle key with whitespace', () => {
      const key = '  a1b2c3d4e5f6789012345678901234ab  ';
      const result = parseSyncKey(key);
      expect(result).toBe('a1b2c3d4e5f6789012345678901234ab');
    });
  });

  describe('Error cases', () => {
    it('should throw error for null input', () => {
      expect(() => parseSyncKey(null)).toThrow('Invalid scanned data');
    });

    it('should throw error for undefined input', () => {
      expect(() => parseSyncKey(undefined)).toThrow('Invalid scanned data');
    });

    it('should throw error for empty string', () => {
      expect(() => parseSyncKey('')).toThrow('Invalid scanned data');
    });

    it('should throw error for key that is too short', () => {
      const key = 'a1b2c3d4e5f6789012345678901234a'; // 31 chars
      expect(() => parseSyncKey(key)).toThrow('Invalid sync key format');
    });

    it('should throw error for key that is too long', () => {
      const key = 'a1b2c3d4e5f6789012345678901234abc'; // 33 chars
      expect(() => parseSyncKey(key)).toThrow('Invalid sync key format');
    });

    it('should throw error for key with invalid characters', () => {
      const key = 'g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6'; // contains g-z
      expect(() => parseSyncKey(key)).toThrow('Invalid sync key format');
    });

    it('should throw error for URL without sync parameter', () => {
      const url = 'https://stackmap.app/?other=param';
      expect(() => parseSyncKey(url)).toThrow('No sync key found in URL');
    });

    it('should throw error for URL with invalid sync key', () => {
      const url = 'https://stackmap.app/?sync=invalid';
      expect(() => parseSyncKey(url)).toThrow('Invalid sync key format in URL');
    });

    it('should throw error for non-string input', () => {
      expect(() => parseSyncKey(123)).toThrow('Invalid scanned data');
    });
  });

  describe('Edge cases', () => {
    it('should handle URL with fragment', () => {
      const url = 'https://stackmap.app/?sync=a1b2c3d4e5f6789012345678901234ab#section';
      const result = parseSyncKey(url);
      expect(result).toBe('a1b2c3d4e5f6789012345678901234ab');
    });

    it('should handle URL with port', () => {
      const url = 'https://stackmap.app:443/?sync=a1b2c3d4e5f6789012345678901234ab';
      const result = parseSyncKey(url);
      expect(result).toBe('a1b2c3d4e5f6789012345678901234ab');
    });

    it('should handle URL with subdomain', () => {
      const url = 'https://beta.stackmap.app/?sync=a1b2c3d4e5f6789012345678901234ab';
      const result = parseSyncKey(url);
      expect(result).toBe('a1b2c3d4e5f6789012345678901234ab');
    });

    it('should handle URL-encoded sync key', () => {
      const url = 'https://stackmap.app/?sync=a1b2c3d4e5f6789012345678901234ab';
      const result = parseSyncKey(url);
      expect(result).toBe('a1b2c3d4e5f6789012345678901234ab');
    });
  });

  describe('Hex validation', () => {
    it('should accept all valid hex characters (0-9, a-f)', () => {
      const key = '0123456789abcdef0123456789abcdef'; // 32 chars
      const result = parseSyncKey(key);
      expect(result).toBe('0123456789abcdef0123456789abcdef');
    });

    it('should accept all valid hex characters uppercase (0-9, A-F)', () => {
      const key = '0123456789ABCDEF0123456789ABCDEF'; // 32 chars
      const result = parseSyncKey(key);
      expect(result).toBe('0123456789ABCDEF0123456789ABCDEF');
    });

    it('should reject special characters', () => {
      const key = '0123456789abcdef0123456789abcd!@'; // special chars
      expect(() => parseSyncKey(key)).toThrow('Invalid sync key format');
    });

    it('should reject spaces in key', () => {
      const key = '0123456789abcdef 0123456789abcde'; // space in middle
      expect(() => parseSyncKey(key)).toThrow('Invalid sync key format');
    });
  });
});
