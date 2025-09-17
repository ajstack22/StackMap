// @ts-check
import {
  getFileExtension,
  validateFileType,
  generateExportFilename,
  parseStackMapFilename,
  formatFileSize,
  validateFileSize,
  extractFileInfo,
  validateJsonFileContent,
  generateFilePreview,
  sanitizeFilename,
  generateUniqueFilename,
} from '../fileProcessingUtils';

describe('fileProcessingUtils', () => {
  describe('getFileExtension', () => {
    it('extracts extension from simple filename', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('data.json')).toBe('json');
      expect(getFileExtension('image.PNG')).toBe('png');
    });

    it('extracts extension from path with directories', () => {
      expect(getFileExtension('/path/to/file.txt')).toBe('txt');
      expect(getFileExtension('C:\\Users\\file.json')).toBe('json');
    });

    it('handles multiple dots in filename', () => {
      expect(getFileExtension('backup.2024.01.15.json')).toBe('json');
      expect(getFileExtension('my.file.with.dots.txt')).toBe('txt');
    });

    it('handles files without extension', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('file.')).toBe('');
      expect(getFileExtension('.gitignore')).toBe('gitignore');
    });

    it('handles invalid inputs', () => {
      expect(getFileExtension('')).toBe('');
      expect(getFileExtension(null)).toBe('');
      expect(getFileExtension(undefined)).toBe('');
      expect(getFileExtension(123)).toBe('');
    });
  });

  describe('validateFileType', () => {
    it('validates allowed file types with default extensions', () => {
      const result = validateFileType('data.json');
      expect(result.isValid).toBe(true);
      expect(result.extension).toBe('json');
      expect(result.error).toBeUndefined();
    });

    it('validates allowed file types with custom extensions', () => {
      const allowedTypes = ['txt', 'csv', 'json'];

      expect(validateFileType('data.txt', allowedTypes).isValid).toBe(true);
      expect(validateFileType('data.csv', allowedTypes).isValid).toBe(true);
      expect(validateFileType('data.json', allowedTypes).isValid).toBe(true);
    });

    it('rejects disallowed file types', () => {
      const result = validateFileType('image.png');
      expect(result.isValid).toBe(false);
      expect(result.extension).toBe('png');
      expect(result.error).toBe('Unsupported file type. Allowed: json');
    });

    it('rejects files without extension', () => {
      const result = validateFileType('README');
      expect(result.isValid).toBe(false);
      expect(result.extension).toBe('');
      expect(result.error).toBe('File has no extension');
    });

    it('handles case insensitive extensions', () => {
      const result = validateFileType('DATA.JSON');
      expect(result.isValid).toBe(true);
      expect(result.extension).toBe('json');
    });
  });

  describe('generateExportFilename', () => {
    const fixedDate = new Date('2024-01-15T14:30:45Z');

    it('generates filename with default prefix and timestamp', () => {
      const result = generateExportFilename('stackmap-export', fixedDate);
      expect(result).toBe('stackmap-export-2024-01-15-14-30-45.json');
    });

    it('generates filename without time', () => {
      const result = generateExportFilename('stackmap-export', fixedDate, false);
      expect(result).toBe('stackmap-export-2024-01-15.json');
    });

    it('generates filename with custom prefix', () => {
      const result = generateExportFilename('my-backup', fixedDate);
      expect(result).toBe('my-backup-2024-01-15-14-30-45.json');
    });

    it('uses current time when no timestamp provided', () => {
      const result = generateExportFilename();
      expect(result).toMatch(/^stackmap-export-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.json$/);
    });

    it('handles edge cases with time formatting', () => {
      const edgeDate = new Date('2024-12-31T23:59:59Z');
      const result = generateExportFilename('test', edgeDate);
      expect(result).toBe('test-2024-12-31-23-59-59.json');
    });
  });

  describe('parseStackMapFilename', () => {
    it('parses standard StackMap export filename with time', () => {
      const result = parseStackMapFilename('stackmap-export-2024-01-15-14-30-45.json');

      expect(result.isStackMapExport).toBe(true);
      expect(result.prefix).toBe('stackmap-export');
      expect(result.date).toBe('2024-01-15');
      expect(result.time).toBe('14:30:45');
    });

    it('parses StackMap export filename without time', () => {
      const result = parseStackMapFilename('stackmap-export-2024-01-15.json');

      expect(result.isStackMapExport).toBe(true);
      expect(result.prefix).toBe('stackmap-export');
      expect(result.date).toBe('2024-01-15');
      expect(result.time).toBeUndefined();
    });

    it('parses custom StackMap filename', () => {
      const result = parseStackMapFilename('my-stackmap-backup-2024-01-15.json');

      expect(result.isStackMapExport).toBe(true);
      expect(result.prefix).toBe('my-stackmap-backup');
      expect(result.date).toBe('2024-01-15');
    });

    it('rejects non-StackMap filenames', () => {
      const nonStackMapFiles = [
        'other-export-2024-01-15.json',
        'backup-2024-01-15.json',
        'data-file.json',
        'stackmap.json' // Missing date pattern
      ];

      nonStackMapFiles.forEach(filename => {
        const result = parseStackMapFilename(filename);
        expect(result.isStackMapExport).toBe(false);
      });
    });

    it('handles invalid patterns', () => {
      const invalidFiles = [
        'stackmap-export-invalid-date.json',
        'stackmap-export-2024-13-32.json', // Invalid date
        'stackmap-export.json'
      ];

      invalidFiles.forEach(filename => {
        const result = parseStackMapFilename(filename);
        expect(result.isStackMapExport).toBe(false);
      });
    });

    it('handles invalid inputs', () => {
      const invalidInputs = ['', null, undefined, 123];

      invalidInputs.forEach(input => {
        const result = parseStackMapFilename(input);
        expect(result.isStackMapExport).toBe(false);
      });
    });

    it('handles case insensitive prefix matching', () => {
      const result = parseStackMapFilename('STACKMAP-export-2024-01-15.json');
      expect(result.isStackMapExport).toBe(true);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(100)).toBe('100.0 B');
      expect(formatFileSize(1023)).toBe('1023.0 B');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });

    it('formats very large sizes', () => {
      const terabyte = 1024 * 1024 * 1024 * 1024;
      expect(formatFileSize(terabyte)).toBe('1.0 TB');
      expect(formatFileSize(terabyte * 1000)).toBe('1000.0 TB');
    });

    it('handles custom decimal places', () => {
      expect(formatFileSize(1536, 0)).toBe('2 KB');
      expect(formatFileSize(1536, 2)).toBe('1.50 KB');
      expect(formatFileSize(1536, 3)).toBe('1.500 KB');
    });

    it('handles invalid inputs', () => {
      expect(formatFileSize(-100)).toBe('0 B');
      expect(formatFileSize('invalid')).toBe('0 B');
      expect(formatFileSize(null)).toBe('0 B');
      expect(formatFileSize(undefined)).toBe('0 B');
    });
  });

  describe('validateFileSize', () => {
    it('validates files within size limits', () => {
      const result = validateFileSize(5 * 1024 * 1024, 10); // 5MB with 10MB limit

      expect(result.isValid).toBe(true);
      expect(result.size).toBe('5.0 MB');
      expect(result.error).toBeUndefined();
    });

    it('rejects files exceeding size limits', () => {
      const result = validateFileSize(15 * 1024 * 1024, 10); // 15MB with 10MB limit

      expect(result.isValid).toBe(false);
      expect(result.size).toBe('15.0 MB');
      expect(result.error).toBe('File too large (15.0 MB). Maximum: 10 MB');
    });

    it('uses default size limit', () => {
      const result = validateFileSize(15 * 1024 * 1024); // 15MB with default 10MB limit

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum: 10 MB');
    });

    it('handles edge case at exact limit', () => {
      const result = validateFileSize(10 * 1024 * 1024, 10); // Exactly 10MB

      expect(result.isValid).toBe(true);
      expect(result.size).toBe('10.0 MB');
    });

    it('handles invalid inputs', () => {
      const invalidInputs = [-100, 'invalid', null, undefined];

      invalidInputs.forEach(input => {
        const result = validateFileSize(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid file size');
      });
    });
  });

  describe('extractFileInfo', () => {
    it('extracts info from File object', () => {
      const mockFile = new File(['content'], 'test.json', {
        type: 'application/json',
        lastModified: 1642204800000
      });

      const result = extractFileInfo(mockFile);

      expect(result.name).toBe('test.json');
      expect(result.size).toBe(7); // 'content' is 7 bytes
      expect(result.type).toBe('application/json');
      expect(result.lastModified).toBe(1642204800000);
    });

    it('extracts info from metadata object', () => {
      const metadata = {
        name: 'data.json',
        size: 1024,
        type: 'application/json',
        mtime: 1642204800000
      };

      const result = extractFileInfo(metadata);

      expect(result.name).toBe('data.json');
      expect(result.size).toBe(1024);
      expect(result.type).toBe('application/json');
      expect(result.lastModified).toBe(1642204800000);
    });

    it('handles missing properties gracefully', () => {
      const incompleteData = {
        name: 'test.txt'
        // Missing size, type, etc.
      };

      const result = extractFileInfo(incompleteData);

      expect(result.name).toBe('test.txt');
      expect(result.size).toBe(0);
      expect(result.type).toBeUndefined();
      expect(result.lastModified).toBeUndefined();
    });

    it('handles invalid inputs', () => {
      const invalidInputs = [null, undefined, 'string', 123];

      invalidInputs.forEach(input => {
        const result = extractFileInfo(input);
        expect(result.name).toBe('');
        expect(result.size).toBe(0);
      });
    });
  });

  describe('validateJsonFileContent', () => {
    it('validates valid StackMap export JSON', () => {
      const validData = {
        version: '4.0',
        users: { '1': { name: 'Test User' } },
        library: { categories: [] },
        exportDate: '2024-01-15'
      };

      const result = validateJsonFileContent(JSON.stringify(validData));

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.info.version).toBe('4.0');
      expect(result.info.userCount).toBe(1);
      expect(result.info.hasLibrary).toBe(true);
    });

    it('validates StackMap export with activity cards', () => {
      const validData = {
        version: '4.0',
        activityCards: [
          { text: 'Activity 1', icon: '🎯' },
          { text: 'Activity 2', icon: '⚽' }
        ]
      };

      const result = validateJsonFileContent(JSON.stringify(validData));

      expect(result.isValid).toBe(true);
      expect(result.info.activityCardCount).toBe(2);
    });

    it('rejects invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      const result = validateJsonFileContent(invalidJson);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('rejects JSON without version field', () => {
      const dataWithoutVersion = { users: {} };
      const result = validateJsonFileContent(JSON.stringify(dataWithoutVersion));

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing version field - not a valid StackMap export');
    });

    it('rejects JSON with no importable data', () => {
      const emptyData = { version: '4.0' };
      const result = validateJsonFileContent(JSON.stringify(emptyData));

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No importable data found in file');
    });

    it('handles non-object JSON', () => {
      const result = validateJsonFileContent('"just a string"');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('JSON does not contain valid data object');
    });

    it('handles empty or invalid input', () => {
      const invalidInputs = ['', null, undefined, 123];

      invalidInputs.forEach(input => {
        const result = validateJsonFileContent(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('No content provided');
      });
    });
  });

  describe('generateFilePreview', () => {
    it('generates preview for complete export data', () => {
      const exportData = {
        version: '4.0',
        exportDate: '2024-01-15',
        users: {
          '1': { name: 'User1' },
          '2': { name: 'User2' }
        },
        library: {
          categories: [
            { name: 'Category1' },
            { name: 'Category2' }
          ]
        },
        settings: { theme: 'dark' }
      };

      const result = generateFilePreview(exportData);

      expect(result.summary).toBe('StackMap export with 2 users, activity library, app settings');
      expect(result.details).toContain('Version: 4.0');
      expect(result.details).toContain('Exported: 2024-01-15');
      expect(result.details).toContain('Users: 2');
      expect(result.details).toContain('Library categories: 2');
      expect(result.details).toContain('Includes app settings');
      expect(result.warnings).toHaveLength(0);
    });

    it('generates preview with warnings for incomplete data', () => {
      const incompleteData = {
        users: {} // Empty users object
      };

      const result = generateFilePreview(incompleteData);

      expect(result.warnings).toContain('Missing version information');
      expect(result.warnings).toContain('No users in export');
    });

    it('handles single user correctly', () => {
      const singleUserData = {
        version: '4.0',
        users: { '1': { name: 'SingleUser' } }
      };

      const result = generateFilePreview(singleUserData);

      expect(result.summary).toBe('StackMap export with 1 user');
    });

    it('handles object-format library categories', () => {
      const objectCategoriesData = {
        version: '4.0',
        users: { '1': { name: 'User' } },
        library: {
          categories: {
            'cat1': { name: 'Category1' },
            'cat2': { name: 'Category2' }
          }
        }
      };

      const result = generateFilePreview(objectCategoriesData);

      expect(result.details).toContain('Library categories: 2');
    });

    it('handles invalid input', () => {
      const invalidInputs = [null, undefined, 'string', 123];

      invalidInputs.forEach(input => {
        const result = generateFilePreview(input);
        expect(result.summary).toBe('No data to preview');
        expect(result.warnings).toContain('Invalid file data');
      });
    });
  });

  describe('sanitizeFilename', () => {
    it('removes invalid characters', () => {
      const invalidFilename = 'file<>:"/\\|?*.txt';
      const result = sanitizeFilename(invalidFilename);
      expect(result).toBe('file-.txt');
    });

    it('replaces spaces with dashes', () => {
      const spacedFilename = 'my file name.txt';
      const result = sanitizeFilename(spacedFilename);
      expect(result).toBe('my-file-name.txt');
    });

    it('consolidates multiple dashes', () => {
      const multiDashFilename = 'file---with--many-dashes.txt';
      const result = sanitizeFilename(multiDashFilename);
      expect(result).toBe('file-with-many-dashes.txt');
    });

    it('removes leading and trailing dashes', () => {
      const edgeDashFilename = '-file-name-.txt';
      const result = sanitizeFilename(edgeDashFilename);
      expect(result).toBe('file-name-.txt');
    });

    it('adds .json extension if missing', () => {
      const noExtFilename = 'filename';
      const result = sanitizeFilename(noExtFilename);
      expect(result).toBe('filename.json');
    });

    it('preserves existing .json extension', () => {
      const jsonFilename = 'file.json';
      const result = sanitizeFilename(jsonFilename);
      expect(result).toBe('file.json');
    });

    it('truncates very long filenames', () => {
      const longFilename = 'a'.repeat(250) + '.txt';
      const result = sanitizeFilename(longFilename);
      expect(result.length).toBeLessThanOrEqual(205); // 200 chars + '.json'
      expect(result.endsWith('.json')).toBe(true);
    });

    it('uses default name for invalid input', () => {
      const invalidInputs = ['', null, undefined, 123];

      invalidInputs.forEach(input => {
        const result = sanitizeFilename(input);
        expect(result).toBe('export.json');
      });
    });

    it('uses custom default name', () => {
      const result = sanitizeFilename('', 'backup');
      expect(result).toBe('backup.json');
    });
  });

  describe('generateUniqueFilename', () => {
    it('returns original filename if unique', () => {
      const filename = 'test.json';
      const existing = ['other.json', 'another.json'];

      const result = generateUniqueFilename(filename, existing);
      expect(result).toBe('test.json');
    });

    it('adds number when filename exists', () => {
      const filename = 'test.json';
      const existing = ['test.json', 'other.json'];

      const result = generateUniqueFilename(filename, existing);
      expect(result).toBe('test (1).json');
    });

    it('increments number for multiple conflicts', () => {
      const filename = 'test.json';
      const existing = ['test.json', 'test (1).json', 'test (2).json'];

      const result = generateUniqueFilename(filename, existing);
      expect(result).toBe('test (3).json');
    });

    it('handles files without extension', () => {
      const filename = 'README';
      const existing = ['README'];

      const result = generateUniqueFilename(filename, existing);
      expect(result).toBe('README (1).');
    });

    it('preserves extension correctly', () => {
      const filename = 'file.backup.json';
      const existing = ['file.backup.json'];

      const result = generateUniqueFilename(filename, existing);
      expect(result).toBe('file.backup (1).json');
    });

    it('handles empty existing files array', () => {
      const filename = 'test.json';
      const result = generateUniqueFilename(filename, []);
      expect(result).toBe('test.json');
    });

    it('limits counter to prevent infinite loop', () => {
      const filename = 'test.json';
      // Create array with many existing files
      const existing = Array.from({ length: 1000 }, (_, i) =>
        i === 0 ? 'test.json' : `test (${i}).json`
      );

      const result = generateUniqueFilename(filename, existing);
      expect(result).toBe('test (1000).json');
    });
  });
});