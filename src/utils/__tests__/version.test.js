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

    it('should handle localStorage errors on web', async () => {
      Platform.OS = 'web';
      const { setVersion } = require('../version');

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      const result = await setVersion('25.01.15.8');

      expect(result).toBeNull();
    });
  });
});