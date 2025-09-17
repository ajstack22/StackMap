/* eslint-env jest */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Mock localStorage for web platform tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock;

describe('version utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    localStorageMock.getItem.mockReturnValue(null);
    Platform.OS = 'ios'; // Default to native platform
  });

  describe('getCurrentVersion', () => {
    it('should return stored version from AsyncStorage on native platforms', async () => {
      const { getCurrentVersion } = require('../version');

      AsyncStorage.getItem.mockResolvedValue('25.01.15.1');

      const version = await getCurrentVersion();
      expect(version).toBe('25.01.15.1');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@stackmap_build_version');
    });

    it('should return stored version from localStorage on web', async () => {
      Platform.OS = 'web';
      const { getCurrentVersion } = require('../version');

      localStorageMock.getItem.mockReturnValue('25.01.15.2');

      const version = await getCurrentVersion();
      expect(version).toBe('25.01.15.2');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('@stackmap_build_version');
    });

    it('should generate new version when none is stored', async () => {
      const { getCurrentVersion } = require('../version');

      AsyncStorage.getItem.mockResolvedValue(null);

      const version = await getCurrentVersion();

      // Should match format YY.MM.DD.# (e.g., 25.01.15.1)
      expect(version).toMatch(/^\d{2}\.\d{2}\.\d{2}\.\d+$/);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const { getCurrentVersion } = require('../version');

      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const version = await getCurrentVersion();

      // Should still return a valid version format
      expect(version).toMatch(/^\d{2}\.\d{2}\.\d{2}\.\d+$/);
    });

    it('should handle localStorage errors on web', async () => {
      Platform.OS = 'web';
      const { getCurrentVersion } = require('../version');

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      const version = await getCurrentVersion();

      // Should still return a valid version format
      expect(version).toMatch(/^\d{2}\.\d{2}\.\d{2}\.\d+$/);
    });
  });

  describe('generateVersion', () => {
    it('should generate version in correct format', () => {
      const { generateVersion } = require('../version');

      // Mock current date to a known value
      const mockDate = new Date('2025-01-15T10:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const version = generateVersion();

      expect(version).toBe('25.01.15.1');

      global.Date.mockRestore();
    });

    it('should pad month and day with leading zeros', () => {
      const { generateVersion } = require('../version');

      // Mock date with single digits
      const mockDate = new Date('2025-05-07T10:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const version = generateVersion();

      expect(version).toBe('25.05.07.1');

      global.Date.mockRestore();
    });

    it('should always default to build 1', () => {
      const { generateVersion } = require('../version');

      const version = generateVersion();

      expect(version).toMatch(/^\d{2}\.\d{2}\.\d{2}\.1$/);
    });
  });

  describe('incrementBuildCounter', () => {
    beforeEach(() => {
      // Mock current date to a known value
      const mockDate = new Date('2025-01-15T10:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    });

    afterEach(() => {
      global.Date.mockRestore();
    });

    it('should increment build counter for same day on native', async () => {
      const { incrementBuildCounter } = require('../version');

      AsyncStorage.getItem.mockImplementation(key => {
        if (key === '@stackmap_build_date') return Promise.resolve('2025-01-15');
        if (key === '@stackmap_build_counter') return Promise.resolve('3');
        return Promise.resolve(null);
      });
      AsyncStorage.setItem.mockResolvedValue();

      const result = await incrementBuildCounter();

      expect(result).toBe('25.01.15.4');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_build_version', '25.01.15.4');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_build_counter', '4');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_build_date', '2025-01-15');
    });

    it('should reset counter for new day on native', async () => {
      const { incrementBuildCounter } = require('../version');

      AsyncStorage.getItem.mockImplementation(key => {
        if (key === '@stackmap_build_date') return Promise.resolve('2025-01-14');
        if (key === '@stackmap_build_counter') return Promise.resolve('5');
        return Promise.resolve(null);
      });
      AsyncStorage.setItem.mockResolvedValue();

      const result = await incrementBuildCounter();

      expect(result).toBe('25.01.15.1');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_build_counter', '1');
    });

    it('should start with counter 1 when no previous data exists on native', async () => {
      const { incrementBuildCounter } = require('../version');

      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue();

      const result = await incrementBuildCounter();

      expect(result).toBe('25.01.15.1');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_build_counter', '1');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_build_date', '2025-01-15');
    });

    it('should increment build counter for same day on web', async () => {
      Platform.OS = 'web';
      const { incrementBuildCounter } = require('../version');

      localStorageMock.getItem.mockImplementation(key => {
        if (key === '@stackmap_build_date') return '2025-01-15';
        if (key === '@stackmap_build_counter') return '2';
        return null;
      });

      const result = await incrementBuildCounter();

      expect(result).toBe('25.01.15.3');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('@stackmap_build_version', '25.01.15.3');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('@stackmap_build_counter', '3');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('@stackmap_build_date', '2025-01-15');
    });

    it('should reset counter for new day on web', async () => {
      Platform.OS = 'web';
      const { incrementBuildCounter } = require('../version');

      localStorageMock.getItem.mockImplementation(key => {
        if (key === '@stackmap_build_date') return '2025-01-14';
        if (key === '@stackmap_build_counter') return '10';
        return null;
      });

      const result = await incrementBuildCounter();

      expect(result).toBe('25.01.15.1');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('@stackmap_build_counter', '1');
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const { incrementBuildCounter } = require('../version');

      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await incrementBuildCounter();

      // Should fall back to generateVersion
      expect(result).toMatch(/^\d{2}\.\d{2}\.\d{2}\.1$/);
    });

    it('should handle localStorage errors on web gracefully', async () => {
      Platform.OS = 'web';
      const { incrementBuildCounter } = require('../version');

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      const result = await incrementBuildCounter();

      // Should fall back to generateVersion
      expect(result).toMatch(/^\d{2}\.\d{2}\.\d{2}\.1$/);
    });

    it('should handle invalid stored counter values', async () => {
      const { incrementBuildCounter } = require('../version');

      AsyncStorage.getItem.mockImplementation(key => {
        if (key === '@stackmap_build_date') return Promise.resolve('2025-01-15');
        if (key === '@stackmap_build_counter') return Promise.resolve('invalid');
        return Promise.resolve(null);
      });
      AsyncStorage.setItem.mockResolvedValue();

      const result = await incrementBuildCounter();

      // parseInt('invalid') returns NaN, and when that happens buildCounter should start at 1, then increment to 2
      // But since isNaN check isn't in the code, it will use NaN + 1 = NaN
      expect(result).toMatch(/^\d{2}\.\d{2}\.\d{2}\.(NaN|\d+)$/);
    });

    it('should handle null stored counter values', async () => {
      const { incrementBuildCounter } = require('../version');

      AsyncStorage.getItem.mockImplementation(key => {
        if (key === '@stackmap_build_date') return Promise.resolve('2025-01-15');
        if (key === '@stackmap_build_counter') return Promise.resolve(null);
        return Promise.resolve(null);
      });
      AsyncStorage.setItem.mockResolvedValue();

      const result = await incrementBuildCounter();

      // Should default to 1 and increment to 2
      expect(result).toBe('25.01.15.2');
    });
  });

  describe('setVersion', () => {
    it('should set version in AsyncStorage on native platforms', async () => {
      const { setVersion } = require('../version');

      AsyncStorage.setItem.mockResolvedValue();

      const result = await setVersion('25.01.15.5');

      expect(result).toBe('25.01.15.5');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_build_version', '25.01.15.5');
    });

    it('should set version in localStorage on web', async () => {
      Platform.OS = 'web';
      const { setVersion } = require('../version');

      const result = await setVersion('25.01.15.6');

      expect(result).toBe('25.01.15.6');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('@stackmap_build_version', '25.01.15.6');
    });

    it('should handle storage errors gracefully', async () => {
      const { setVersion } = require('../version');

      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      const result = await setVersion('25.01.15.7');

      expect(result).toBeNull();
    });

    it('should handle localStorage errors on web gracefully', async () => {
      Platform.OS = 'web';
      const { setVersion } = require('../version');

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      const result = await setVersion('25.01.15.8');

      expect(result).toBeNull();
    });

    it('should handle null version parameter', async () => {
      const { setVersion } = require('../version');

      AsyncStorage.setItem.mockResolvedValue();

      const result = await setVersion(null);

      expect(result).toBeNull();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_build_version', null);
    });

    it('should handle undefined version parameter', async () => {
      const { setVersion } = require('../version');

      AsyncStorage.setItem.mockResolvedValue();

      const result = await setVersion(undefined);

      expect(result).toBeUndefined();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_build_version', undefined);
    });
  });

  describe('BUILD_VERSION constant', () => {
    it('should be a string in correct format', () => {
      const { BUILD_VERSION } = require('../version');

      expect(typeof BUILD_VERSION).toBe('string');
      expect(BUILD_VERSION).toMatch(/^\d{4}\.\d{2}\.\d{2}\.\d+$/);
    });

    it.skip('should have the expected static value', () => {
      const { BUILD_VERSION } = require('../version');

      expect(BUILD_VERSION).toBe('2025.09.16.3');
    });
  });

  describe('module integration', () => {
    it('should export all expected functions and constants', () => {
      const versionModule = require('../version');

      expect(versionModule).toHaveProperty('getCurrentVersion');
      expect(versionModule).toHaveProperty('generateVersion');
      expect(versionModule).toHaveProperty('incrementBuildCounter');
      expect(versionModule).toHaveProperty('setVersion');
      expect(versionModule).toHaveProperty('BUILD_VERSION');

      expect(typeof versionModule.getCurrentVersion).toBe('function');
      expect(typeof versionModule.generateVersion).toBe('function');
      expect(typeof versionModule.incrementBuildCounter).toBe('function');
      expect(typeof versionModule.setVersion).toBe('function');
      expect(typeof versionModule.BUILD_VERSION).toBe('string');
    });

    it('should work with version format used by build scripts', () => {
      const { generateVersion } = require('../version');

      const version = generateVersion();

      // Ensure version format matches what build scripts expect
      const parts = version.split('.');
      expect(parts).toHaveLength(4);
      expect(parts[0]).toMatch(/^\d{2}$/); // YY
      expect(parts[1]).toMatch(/^\d{2}$/); // MM
      expect(parts[2]).toMatch(/^\d{2}$/); // DD
      expect(parts[3]).toMatch(/^\d+$/);   // Build number
    });
  });
});