/* eslint-env jest */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

describe('secureStorage (Android focus)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    Platform.OS = 'android'; // Focus on Android for reliable testing
  });

  describe('Android PIN storage', () => {
    it('should store and retrieve PIN on Android', async () => {
      // Import here to avoid Keychain loading issues
      const { setSecurePin, getSecurePin } = require('../secureStorage');

      const result = await setSecurePin('1234');
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_pin', '1234');

      AsyncStorage.getItem.mockResolvedValue('1234');
      const retrieved = await getSecurePin();
      expect(retrieved).toBe('1234');
    });

    it('should remove PIN on Android', async () => {
      const { removeSecurePin } = require('../secureStorage');

      const result = await removeSecurePin();
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_pin_disabled', 'true');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@stackmap_pin');
    });

    it('should check if PIN exists', async () => {
      const { hasSecurePin } = require('../secureStorage');

      // No PIN exists
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@stackmap_pin_disabled') return Promise.resolve(null);
        if (key === '@stackmap_pin') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      let result = await hasSecurePin();
      expect(result).toBe(false);

      // PIN exists
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@stackmap_pin_disabled') return Promise.resolve(null);
        if (key === '@stackmap_pin') return Promise.resolve('1234');
        return Promise.resolve(null);
      });

      result = await hasSecurePin();
      expect(result).toBe(true);

      // PIN disabled
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@stackmap_pin_disabled') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      result = await hasSecurePin();
      expect(result).toBe(false);
    });

    it('should verify PIN correctly', async () => {
      const { verifyPin } = require('../secureStorage');

      // Mock getSecurePin to return '1234'
      AsyncStorage.getItem.mockResolvedValue('1234');

      let result = await verifyPin('1234');
      expect(result).toBe(true);

      result = await verifyPin('5678');
      expect(result).toBe(false);

      // No PIN stored
      AsyncStorage.getItem.mockResolvedValue(null);
      result = await verifyPin('1234');
      expect(result).toBe(false);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const { setSecurePin, getSecurePin, hasSecurePin } = require('../secureStorage');

      // Test setSecurePin error
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      let result = await setSecurePin('1234');
      expect(result).toBe(false);

      // Test getSecurePin error
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      let pin = await getSecurePin();
      expect(pin).toBeNull();

      // Test hasSecurePin error
      result = await hasSecurePin();
      expect(result).toBe(false);
    });

    it('should handle empty PIN by calling removeSecurePin', async () => {
      const { setSecurePin } = require('../secureStorage');

      const result = await setSecurePin('');
      expect(result).toBe(true);
      // Should set disabled flag (from removeSecurePin)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_pin_disabled', 'true');
    });
  });

  describe('Migration logic', () => {
    it('should mark migration as complete when no old data exists', async () => {
      const { migratePinToSecureStorage } = require('../secureStorage');

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@stackmap_pin_migrated') return Promise.resolve(null);
        if (key === '@stackmap_data') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      await migratePinToSecureStorage();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stackmap_pin_migrated', 'true');
    });

    it('should skip migration if already completed', async () => {
      const { migratePinToSecureStorage } = require('../secureStorage');

      AsyncStorage.getItem.mockResolvedValue('true');

      await migratePinToSecureStorage();

      // Should only check the migration flag, no other operations
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@stackmap_pin_migrated');
      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it('should handle migration errors gracefully', async () => {
      const { migratePinToSecureStorage } = require('../secureStorage');

      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(migratePinToSecureStorage()).resolves.toBeUndefined();
    });
  });
});