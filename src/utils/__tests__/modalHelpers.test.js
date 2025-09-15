/* eslint-env jest */
import { Platform } from 'react-native';
import { getAndroidModalBottomHeight } from '../modalHelpers';

describe('modalHelpers', () => {
  describe('getAndroidModalBottomHeight', () => {
    beforeEach(() => {
      // Reset Platform.OS to default
      Platform.OS = 'android';
    });

    it('should return bottom inset height on Android', () => {
      const insets = { bottom: 24, top: 0, left: 0, right: 0 };
      const result = getAndroidModalBottomHeight(insets);
      expect(result).toBe(24);
    });

    it('should return 0 on iOS', () => {
      Platform.OS = 'ios';
      const insets = { bottom: 24, top: 0, left: 0, right: 0 };
      const result = getAndroidModalBottomHeight(insets);
      expect(result).toBe(0);
    });

    it('should return 0 on web', () => {
      Platform.OS = 'web';
      const insets = { bottom: 24, top: 0, left: 0, right: 0 };
      const result = getAndroidModalBottomHeight(insets);
      expect(result).toBe(0);
    });

    it('should handle null insets on Android', () => {
      Platform.OS = 'android';
      const result = getAndroidModalBottomHeight(null);
      expect(result).toBe(0);
    });

    it('should handle undefined insets on Android', () => {
      Platform.OS = 'android';
      const result = getAndroidModalBottomHeight(undefined);
      expect(result).toBe(0);
    });

    it('should handle insets without bottom property on Android', () => {
      Platform.OS = 'android';
      const insets = { top: 44, left: 0, right: 0 };
      const result = getAndroidModalBottomHeight(insets);
      expect(result).toBe(0);
    });

    it('should handle zero bottom inset on Android', () => {
      Platform.OS = 'android';
      const insets = { bottom: 0, top: 44, left: 0, right: 0 };
      const result = getAndroidModalBottomHeight(insets);
      expect(result).toBe(0);
    });

    it('should handle large bottom inset values on Android', () => {
      Platform.OS = 'android';
      const insets = { bottom: 100, top: 44, left: 0, right: 0 };
      const result = getAndroidModalBottomHeight(insets);
      expect(result).toBe(100);
    });
  });
});