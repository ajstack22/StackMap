// @ts-check
import {
  formatFileDisplayName,
  validateImportData,
  parseImportFile,
  extractImportPreview,
  validateSyncKey,
  validateRecoveryPhrase,
  formatTimeAgo,
  validateExportSelections,
} from '../importExportValidation';

describe('importExportValidation', () => {
  describe('formatFileDisplayName', () => {
    it('formats standard StackMap export filename with date only', () => {
      const file = {
        name: 'stackmap-export-2024-01-15.json',
        size: 2048,
      };

      const result = formatFileDisplayName(file);
      expect(result).toBe('2024-01-15 (2 KB)');
    });

    it('formats StackMap export filename with date and time', () => {
      const file = {
        name: 'stackmap-export-2024-01-15-14-30-45.json',
        size: 4096,
      };

      const result = formatFileDisplayName(file);
      expect(result).toBe('2024-01-15 at 14:30:45 (4 KB)');
    });

    it('handles file without size', () => {
      const file = {
        name: 'stackmap-export-2024-01-15.json',
      };

      const result = formatFileDisplayName(file);
      expect(result).toBe('2024-01-15');
    });

    it('returns original name for non-matching filenames', () => {
      const file = {
        name: 'some-other-file.json',
        size: 1024,
      };

      const result = formatFileDisplayName(file);
      expect(result).toBe('some-other-file.json');
    });

    it('handles invalid file objects', () => {
      expect(formatFileDisplayName(null)).toBe('Unknown file');
      expect(formatFileDisplayName(undefined)).toBe('Unknown file');
      expect(formatFileDisplayName({})).toBe('Unknown file');
      expect(formatFileDisplayName({ size: 1024 })).toBe('Unknown file');
    });

    it('calculates file size correctly', () => {
      const testCases = [
        { size: 0, expected: '0 KB' },
        { size: 512, expected: '1 KB' },
        { size: 1024, expected: '1 KB' },
        { size: 1536, expected: '2 KB' },
        { size: 10240, expected: '10 KB' },
      ];

      testCases.forEach(({ size, expected }) => {
        const file = {
          name: 'stackmap-export-2024-01-15.json',
          size,
        };
        const result = formatFileDisplayName(file);
        expect(result).toContain(expected);
      });
    });
  });

  describe('validateImportData', () => {
    it('validates valid import data with users', () => {
      const data = {
        version: '4.0',
        users: {
          '1': { name: 'Test User', icon: '👤' },
        },
      };

      const result = validateImportData(data);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('validates valid import data with library', () => {
      const data = {
        version: '4.0',
        library: {
          categories: [
            { name: 'Test Category', activities: [] },
          ],
        },
      };

      const result = validateImportData(data);
      expect(result.isValid).toBe(true);
    });

    it('validates valid import data with activity cards', () => {
      const data = {
        version: '4.0',
        activityCards: [
          { text: 'Test Activity', icon: '🎯' },
        ],
      };

      const result = validateImportData(data);
      expect(result.isValid).toBe(true);
    });

    it('rejects data without version', () => {
      const data = {
        users: { '1': { name: 'Test' } },
      };

      const result = validateImportData(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid StackMap export file');
    });

    it('rejects data with no importable content', () => {
      const data = {
        version: '4.0',
        // No users, activityCards, or library
      };

      const result = validateImportData(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Export file contains no importable data');
    });

    it('rejects invalid data types', () => {
      expect(validateImportData(null).isValid).toBe(false);
      expect(validateImportData(undefined).isValid).toBe(false);
      expect(validateImportData('string').isValid).toBe(false);
      expect(validateImportData(123).isValid).toBe(false);
      expect(validateImportData([]).isValid).toBe(false);
    });
  });

  describe('parseImportFile', () => {
    it('parses valid JSON with valid data', () => {
      const validData = {
        version: '4.0',
        users: { '1': { name: 'Test' } },
      };
      const fileContent = JSON.stringify(validData);

      const result = parseImportFile(fileContent);
      expect(result.data).toEqual(validData);
      expect(result.error).toBeUndefined();
    });

    it('handles invalid JSON', () => {
      const invalidJson = '{ invalid json }';

      const result = parseImportFile(invalidJson);
      expect(result.data).toBeUndefined();
      expect(result.error).toContain('Invalid JSON file');
    });

    it('handles valid JSON with invalid data structure', () => {
      const invalidData = { version: '4.0' }; // No importable data
      const fileContent = JSON.stringify(invalidData);

      const result = parseImportFile(fileContent);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Export file contains no importable data');
    });

    it('handles empty string', () => {
      const result = parseImportFile('');
      expect(result.error).toContain('Invalid JSON file');
    });

    it('includes file info in error context', () => {
      const fileInfo = { name: 'test.json', size: 100 };
      const result = parseImportFile('invalid', fileInfo);
      expect(result.error).toContain('Invalid JSON file');
    });
  });

  describe('extractImportPreview', () => {
    it('extracts user information correctly', () => {
      const data = {
        version: '4.0',
        users: {
          'user1': {
            name: 'Alice',
            icon: '👩',
            days: {
              '2024-01-15': {
                activities: [
                  { text: 'Activity 1' },
                  { text: 'Activity 2' },
                ],
              },
            },
          },
          'user2': {
            name: 'Bob',
            emoji: '👨', // Test fallback to emoji
            days: {
              '2024-01-15': {
                activities: [{ text: 'Activity 3' }],
              },
            },
          },
        },
      };

      const preview = extractImportPreview(data);

      expect(preview.users).toHaveLength(2);
      expect(preview.users[0]).toEqual({
        id: 'user1',
        name: 'Alice',
        icon: '👩',
        activityCount: 2,
      });
      expect(preview.users[1]).toEqual({
        id: 'user2',
        name: 'Bob',
        icon: '👨',
        activityCount: 1,
      });
      expect(preview.totalActivities).toBe(3);
    });

    it('handles users without names or icons', () => {
      const data = {
        version: '4.0',
        users: {
          'user1': {
            days: {
              '2024-01-15': {
                activities: [{ text: 'Activity 1' }],
              },
            },
          },
        },
      };

      const preview = extractImportPreview(data);

      expect(preview.users[0].name).toBe('Unnamed User');
      expect(preview.users[0].icon).toBe('👤');
    });

    it('counts library items from array format', () => {
      const data = {
        version: '4.0',
        users: {},
        library: {
          categories: [
            {
              name: 'Category 1',
              activities: [
                { text: 'Library Activity 1' },
                { text: 'Library Activity 2' },
              ],
            },
            {
              name: 'Category 2',
              activities: [{ text: 'Library Activity 3' }],
            },
          ],
        },
      };

      const preview = extractImportPreview(data);
      expect(preview.totalLibraryItems).toBe(3);
    });

    it('counts library items from object format', () => {
      const data = {
        version: '4.0',
        users: {},
        library: {
          categories: {
            'cat1': {
              activities: [{ text: 'Activity 1' }],
            },
            'cat2': {
              activities: [{ text: 'Activity 2' }, { text: 'Activity 3' }],
            },
          },
        },
      };

      const preview = extractImportPreview(data);
      expect(preview.totalLibraryItems).toBe(3);
    });

    it('detects settings presence', () => {
      const dataWithSettings = {
        version: '4.0',
        users: {},
        settings: { theme: 'dark' },
      };

      const dataWithTheme = {
        version: '4.0',
        users: {},
        currentTheme: 'light',
      };

      const dataWithBanner = {
        version: '4.0',
        users: {},
        bannerPosition: 'top',
      };

      const dataWithoutSettings = {
        version: '4.0',
        users: {},
      };

      expect(extractImportPreview(dataWithSettings).hasSettings).toBe(true);
      expect(extractImportPreview(dataWithTheme).hasSettings).toBe(true);
      expect(extractImportPreview(dataWithBanner).hasSettings).toBe(true);
      expect(extractImportPreview(dataWithoutSettings).hasSettings).toBe(false);
    });

    it('handles missing version', () => {
      const data = { users: {} };
      const preview = extractImportPreview(data);
      expect(preview.version).toBe('Unknown');
    });
  });

  describe('validateSyncKey', () => {
    it('validates URL format sync keys', () => {
      const validUrl = 'https://stackmap.app/sync/invite123#abcdef1234567890abcdef1234567890';
      const result = validateSyncKey(validUrl);
      expect(result.isValid).toBe(true);
    });

    it('validates direct recovery phrase format', () => {
      const validPhrase = 'abcdef1234567890abcdef1234567890';
      const result = validateSyncKey(validPhrase);
      expect(result.isValid).toBe(true);
    });

    it('rejects invalid URL format', () => {
      const invalidUrl = 'https://stackmap.app/sync/invite123';
      const result = validateSyncKey(invalidUrl);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid invite URL format');
    });

    it('rejects empty or invalid input', () => {
      expect(validateSyncKey('').isValid).toBe(false);
      expect(validateSyncKey(null).isValid).toBe(false);
      expect(validateSyncKey(undefined).isValid).toBe(false);
      expect(validateSyncKey(123).isValid).toBe(false);
    });
  });

  describe('validateRecoveryPhrase', () => {
    it('validates correct 32-character hex phrases', () => {
      const validPhrases = [
        'abcdef1234567890abcdef1234567890',
        'ABCDEF1234567890ABCDEF1234567890',
        '0123456789abcdef0123456789abcdef',
        'ffffffffffffffffffffffffffffffff',
      ];

      validPhrases.forEach(phrase => {
        const result = validateRecoveryPhrase(phrase);
        expect(result.isValid).toBe(true);
      });
    });

    it('rejects phrases with wrong length', () => {
      const wrongLengthPhrases = [
        'abc', // too short
        'abcdef1234567890abcdef12345678901', // 31 chars
        'abcdef1234567890abcdef12345678901a', // 33 chars
        'abcdef1234567890abcdef1234567890123', // too long
      ];

      wrongLengthPhrases.forEach(phrase => {
        const result = validateRecoveryPhrase(phrase);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Recovery phrase must be exactly 32 characters');
      });
    });

    it('rejects phrases with non-hex characters', () => {
      const invalidPhrases = [
        'ghijkl1234567890abcdef1234567890', // contains g, h, i, j, k, l
        'abcdef1234567890abcdef123456789g', // contains g
        'abcdef 234567890abcdef1234567890', // contains space
        'abcdef@234567890abcdef123456789', // contains @
      ];

      invalidPhrases.forEach(phrase => {
        const result = validateRecoveryPhrase(phrase);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Recovery phrase must contain only hexadecimal characters (0-9, a-f)');
      });
    });

    it('handles edge cases', () => {
      expect(validateRecoveryPhrase('').isValid).toBe(false);
      expect(validateRecoveryPhrase(null).isValid).toBe(false);
      expect(validateRecoveryPhrase(undefined).isValid).toBe(false);
      expect(validateRecoveryPhrase('   ').isValid).toBe(false);
    });

    it('trims whitespace before validation', () => {
      const phraseWithSpaces = '  abcdef1234567890abcdef1234567890  ';
      const result = validateRecoveryPhrase(phraseWithSpaces);
      expect(result.isValid).toBe(true);
    });
  });

  describe('formatTimeAgo', () => {
    const now = 1705123200000; // Fixed timestamp for consistent testing

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(now);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('formats "just now" for recent timestamps', () => {
      const recent = now - 30000; // 30 seconds ago
      expect(formatTimeAgo(recent)).toBe('just now');
    });

    it('formats minutes correctly', () => {
      const oneMinute = now - 60000;
      const fiveMinutes = now - 300000;

      expect(formatTimeAgo(oneMinute)).toBe('1 minute ago');
      expect(formatTimeAgo(fiveMinutes)).toBe('5 minutes ago');
    });

    it('formats hours correctly', () => {
      const oneHour = now - 3600000;
      const threeHours = now - 10800000;

      expect(formatTimeAgo(oneHour)).toBe('1 hour ago');
      expect(formatTimeAgo(threeHours)).toBe('3 hours ago');
    });

    it('formats days correctly', () => {
      const oneDay = now - 86400000;
      const threeDays = now - 259200000;

      expect(formatTimeAgo(oneDay)).toBe('1 day ago');
      expect(formatTimeAgo(threeDays)).toBe('3 days ago');
    });

    it('handles invalid timestamps', () => {
      expect(formatTimeAgo(null)).toBe('Unknown time');
      expect(formatTimeAgo(undefined)).toBe('Unknown time');
      expect(formatTimeAgo('string')).toBe('Unknown time');
      expect(formatTimeAgo(0)).toBe('Unknown time');
    });

    it('handles future timestamps', () => {
      const future = now + 3600000; // 1 hour in future
      expect(formatTimeAgo(future)).toBe('just now'); // Negative diff rounds to 0
    });
  });

  describe('validateExportSelections', () => {
    const mockAvailableData = {
      users: {
        'user1': { name: 'Alice' },
        'user2': { name: 'Bob' },
      },
      library: { categories: [] },
      settings: { theme: 'dark' },
    };

    it('validates selections with users', () => {
      const selections = {
        users: { 'user1': true, 'user2': false },
        library: false,
        settings: false,
      };

      const result = validateExportSelections(selections, mockAvailableData);
      expect(result.isValid).toBe(true);
    });

    it('validates selections with library only', () => {
      const selections = {
        users: {},
        library: true,
        settings: false,
      };

      const result = validateExportSelections(selections, mockAvailableData);
      expect(result.isValid).toBe(true);
    });

    it('validates selections with settings only', () => {
      const selections = {
        users: {},
        library: false,
        settings: true,
      };

      const result = validateExportSelections(selections, mockAvailableData);
      expect(result.isValid).toBe(true);
    });

    it('rejects selections with no items selected', () => {
      const selections = {
        users: { 'user1': false, 'user2': false },
        library: false,
        settings: false,
      };

      const result = validateExportSelections(selections, mockAvailableData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please select at least one item to export');
    });

    it('rejects selections with invalid user IDs', () => {
      const selections = {
        users: { 'user1': true, 'invalidUser': true },
        library: false,
        settings: false,
      };

      const result = validateExportSelections(selections, mockAvailableData);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Selected users not found: invalidUser');
    });

    it('handles multiple invalid user IDs', () => {
      const selections = {
        users: { 'invalid1': true, 'invalid2': true },
        library: false,
        settings: false,
      };

      const result = validateExportSelections(selections, mockAvailableData);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid1, invalid2');
    });

    it('handles invalid selections input', () => {
      expect(validateExportSelections(null, mockAvailableData).isValid).toBe(false);
      expect(validateExportSelections(undefined, mockAvailableData).isValid).toBe(false);
      expect(validateExportSelections('string', mockAvailableData).isValid).toBe(false);
    });
  });
});