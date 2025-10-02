/**
 * Tests for animation constants
 */

import { ANIMATION_DURATION, ANIMATION_EASING, delay } from '../animations';

describe('animations', () => {
  describe('ANIMATION_DURATION', () => {
    it('should define all timing constants', () => {
      expect(ANIMATION_DURATION.INSTANT).toBe(0);
      expect(ANIMATION_DURATION.MICRO).toBe(50);
      expect(ANIMATION_DURATION.FAST).toBe(100);
      expect(ANIMATION_DURATION.NORMAL).toBe(200);
      expect(ANIMATION_DURATION.SLOW).toBe(300);
      expect(ANIMATION_DURATION.MODAL_DELAY).toBe(300);
    });

    it('should have all values as numbers', () => {
      Object.values(ANIMATION_DURATION).forEach(value => {
        expect(typeof value).toBe('number');
      });
    });

    it('should have all non-negative values', () => {
      Object.values(ANIMATION_DURATION).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('ANIMATION_EASING', () => {
    it('should define all easing constants', () => {
      expect(ANIMATION_EASING.LINEAR).toBe('linear');
      expect(ANIMATION_EASING.EASE_IN_OUT).toBe('ease-in-out');
      expect(ANIMATION_EASING.EASE_OUT).toBe('ease-out');
      expect(ANIMATION_EASING.EASE_IN).toBe('ease-in');
    });

    it('should have all values as strings', () => {
      Object.values(ANIMATION_EASING).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('delay', () => {
    it('should return a promise', () => {
      const result = delay(100);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve after specified duration', async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;

      // Allow 10ms tolerance for timer precision
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });

    it('should work with ANIMATION_DURATION constants', async () => {
      const start = Date.now();
      await delay(ANIMATION_DURATION.MICRO);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });
});
