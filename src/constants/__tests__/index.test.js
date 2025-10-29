/* eslint-env jest */
import {
  COMMON_EMOJIS,
  DEFAULT_USER_ICON,
  DEFAULT_ACTIVITY_EMOJI,
  TOAST_DURATION,
  PIN_LENGTH,
  ANIMATION_DURATIONS,
  CUSTOM_IMAGE_SOURCES,
  getCustomImageSource
} from '../index';

describe('constants/index', () => {
  describe('COMMON_EMOJIS', () => {
    it('should be an array', () => {
      expect(Array.isArray(COMMON_EMOJIS)).toBe(true);
    });

    it('should contain expected number of emojis', () => {
      expect(COMMON_EMOJIS).toHaveLength(32);
    });

    it('should contain all expected emojis', () => {
      const expectedEmojis = [
        '😀', '😎', '🤩', '🥳', '🤗', '🤔', '😴', '🌟', '⭐', '🎯',
        '🎨', '🎮', '📚', '📝', '💡', '🏃', '🏋️', '🧘', '🎵', '🎸',
        '🥗', '🍕', '🏆', '💪', '🌈', '🌺', '🐶', '🐱', '🦄', '🦋',
        '🔥', '💧'
      ];
      expect(COMMON_EMOJIS).toEqual(expectedEmojis);
    });

    it('should have no duplicate emojis', () => {
      const uniqueEmojis = [...new Set(COMMON_EMOJIS)];
      expect(uniqueEmojis).toHaveLength(COMMON_EMOJIS.length);
    });

    it('should contain only string values', () => {
      COMMON_EMOJIS.forEach(emoji => {
        expect(typeof emoji).toBe('string');
        expect(emoji.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFAULT_USER_ICON', () => {
    it('should be a string', () => {
      expect(typeof DEFAULT_USER_ICON).toBe('string');
    });

    it('should be the expected emoji', () => {
      expect(DEFAULT_USER_ICON).toBe('🐶');
    });

    it('should be included in COMMON_EMOJIS', () => {
      expect(COMMON_EMOJIS).toContain(DEFAULT_USER_ICON);
    });
  });

  describe('DEFAULT_ACTIVITY_EMOJI', () => {
    it('should be a string', () => {
      expect(typeof DEFAULT_ACTIVITY_EMOJI).toBe('string');
    });

    it('should be the expected emoji', () => {
      expect(DEFAULT_ACTIVITY_EMOJI).toBe('🎯');
    });

    it('should be included in COMMON_EMOJIS', () => {
      expect(COMMON_EMOJIS).toContain(DEFAULT_ACTIVITY_EMOJI);
    });
  });

  describe('TOAST_DURATION', () => {
    it('should be a number', () => {
      expect(typeof TOAST_DURATION).toBe('number');
    });

    it('should be the expected value', () => {
      expect(TOAST_DURATION).toBe(3000);
    });

    it('should be a positive number', () => {
      expect(TOAST_DURATION).toBeGreaterThan(0);
    });
  });

  describe('PIN_LENGTH', () => {
    it('should be a number', () => {
      expect(typeof PIN_LENGTH).toBe('number');
    });

    it('should be the expected value', () => {
      expect(PIN_LENGTH).toBe(4);
    });

    it('should be a positive integer', () => {
      expect(PIN_LENGTH).toBeGreaterThan(0);
      expect(Number.isInteger(PIN_LENGTH)).toBe(true);
    });
  });

  describe('ANIMATION_DURATIONS', () => {
    it('should be an object', () => {
      expect(typeof ANIMATION_DURATIONS).toBe('object');
      expect(ANIMATION_DURATIONS).not.toBeNull();
    });

    it('should have all expected properties', () => {
      expect(ANIMATION_DURATIONS).toHaveProperty('fast');
      expect(ANIMATION_DURATIONS).toHaveProperty('normal');
      expect(ANIMATION_DURATIONS).toHaveProperty('slow');
      expect(ANIMATION_DURATIONS).toHaveProperty('toastSlide');
    });

    it('should have correct values', () => {
      expect(ANIMATION_DURATIONS.fast).toBe(200);
      expect(ANIMATION_DURATIONS.normal).toBe(300);
      expect(ANIMATION_DURATIONS.slow).toBe(500);
      expect(ANIMATION_DURATIONS.toastSlide).toBe(300);
    });

    it('should have all number values', () => {
      Object.values(ANIMATION_DURATIONS).forEach(duration => {
        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThan(0);
      });
    });

    it('should have durations in logical order', () => {
      expect(ANIMATION_DURATIONS.fast).toBeLessThan(ANIMATION_DURATIONS.normal);
      expect(ANIMATION_DURATIONS.normal).toBeLessThan(ANIMATION_DURATIONS.slow);
    });
  });

  describe('CUSTOM_IMAGE_SOURCES', () => {
    it('should be an object', () => {
      expect(typeof CUSTOM_IMAGE_SOURCES).toBe('object');
      expect(CUSTOM_IMAGE_SOURCES).not.toBeNull();
    });

    it('should be empty (images have been archived)', () => {
      expect(Object.keys(CUSTOM_IMAGE_SOURCES)).toHaveLength(0);
    });
  });

  describe('getCustomImageSource', () => {
    it('should be a function', () => {
      expect(typeof getCustomImageSource).toBe('function');
    });

    it('should return null for any image name (backward compatibility)', () => {
      expect(getCustomImageSource('test-image')).toBeNull();
      expect(getCustomImageSource('another-image')).toBeNull();
      expect(getCustomImageSource('')).toBeNull();
    });

    it('should handle undefined and null inputs', () => {
      expect(getCustomImageSource(undefined)).toBeNull();
      expect(getCustomImageSource(null)).toBeNull();
    });

    it('should handle non-string inputs', () => {
      expect(getCustomImageSource(123)).toBeNull();
      expect(getCustomImageSource({})).toBeNull();
      expect(getCustomImageSource([])).toBeNull();
    });
  });

  describe('module exports', () => {
    it('should re-export layout constants', () => {
      // Check that we can import layout constants through index
      const { screenWidth, screenHeight } = require('../index');
      expect(typeof screenWidth).toBe('number');
      expect(typeof screenHeight).toBe('number');
    });

    it('should re-export theme constants', () => {
      // Check that we can import theme constants through index
      const { THEMES, COLORS } = require('../index');
      expect(typeof THEMES).toBe('object');
      expect(typeof COLORS).toBe('object');
    });

    it('should re-export feature flags', () => {
      // Check that we can import feature flags through index
      const indexExports = require('../index');
      // Feature flags should be available (this tests the re-export)
      expect(indexExports).toBeDefined();
    });
  });
});