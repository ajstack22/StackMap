/* eslint-env jest */

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(options => options.ios || options.default)
  }
}));

import { Platform } from 'react-native';
import {
  THEMES,
  SHADOWS,
  BORDERS,
  SPACING,
  RADIUS,
  ANIMATION,
  TYPOGRAPHY
} from '../theme';
// COLORS has been moved to ../colors.js

describe('constants/theme', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
  });

  describe('THEMES', () => {
    it('should have all expected theme names', () => {
      const expectedThemes = [
        // Chromatic colors
        'crimson', 'cherry', 'scarlet', 'rust', 'tangerine', 'amber', 'gold',
        'olive', 'emerald', 'forest', 'ocean', 'sapphire', 'navy', 'indigo', 'plum',
        // Neurodiversity-friendly colors
        'sage', 'dustyBlue', 'stackBlue', 'terracotta', 'lavender', 'slate'
      ];

      expectedThemes.forEach(themeName => {
        expect(THEMES).toHaveProperty(themeName);
      });
    });

    it('should have exactly 21 themes', () => {
      expect(Object.keys(THEMES)).toHaveLength(21);
    });

    it('should have primary, dark, and light variants for each theme', () => {
      Object.values(THEMES).forEach(theme => {
        expect(theme).toHaveProperty('primary');
        expect(theme).toHaveProperty('dark');
        expect(theme).toHaveProperty('light');
        expect(typeof theme.primary).toBe('string');
        expect(typeof theme.dark).toBe('string');
        expect(typeof theme.light).toBe('string');
      });
    });

    it('should have valid hex color format', () => {
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      Object.values(THEMES).forEach(theme => {
        expect(theme.primary).toMatch(hexColorRegex);
        expect(theme.dark).toMatch(hexColorRegex);
        expect(theme.light).toMatch(hexColorRegex);
      });
    });

    it('should have specific color values for key themes', () => {
      expect(THEMES.crimson.primary).toBe('#DC143C');
      expect(THEMES.stackBlue.primary).toBe('#5C7E9D');
      expect(THEMES.sage.primary).toBe('#6B7F6B');
    });

    it('should have logical color relationships (all colors are different)', () => {
      Object.values(THEMES).forEach(theme => {
        expect(theme.primary).not.toBe(theme.dark);
        expect(theme.primary).not.toBe(theme.light);
        expect(theme.dark).not.toBe(theme.light);
      });
    });
  });

  // COLORS tests deprecated - COLORS moved to ../colors.js
  // See src/constants/__tests__/colors.test.js for color constant tests

  describe('SHADOWS', () => {
    it('should have 4 shadow levels', () => {
      expect(SHADOWS).toHaveProperty('level1');
      expect(SHADOWS).toHaveProperty('level2');
      expect(SHADOWS).toHaveProperty('level3');
      expect(SHADOWS).toHaveProperty('level4');
    });

    it('should have required shadow properties for each level', () => {
      Object.values(SHADOWS).forEach(shadow => {
        expect(shadow).toHaveProperty('shadowColor');
        expect(shadow).toHaveProperty('shadowOffset');
        expect(shadow).toHaveProperty('shadowOpacity');
        expect(shadow).toHaveProperty('shadowRadius');
        expect(shadow).toHaveProperty('elevation');
      });
    });

    it('should have shadowOffset with width and height', () => {
      Object.values(SHADOWS).forEach(shadow => {
        expect(shadow.shadowOffset).toHaveProperty('width');
        expect(shadow.shadowOffset).toHaveProperty('height');
        expect(typeof shadow.shadowOffset.width).toBe('number');
        expect(typeof shadow.shadowOffset.height).toBe('number');
      });
    });

    it('should have progressive shadow intensity', () => {
      expect(SHADOWS.level1.shadowOpacity).toBeLessThan(SHADOWS.level2.shadowOpacity);
      expect(SHADOWS.level2.shadowOpacity).toBeLessThan(SHADOWS.level3.shadowOpacity);
      expect(SHADOWS.level3.shadowOpacity).toBeLessThan(SHADOWS.level4.shadowOpacity);

      expect(SHADOWS.level1.shadowRadius).toBeLessThan(SHADOWS.level2.shadowRadius);
      expect(SHADOWS.level2.shadowRadius).toBeLessThan(SHADOWS.level3.shadowRadius);
      expect(SHADOWS.level3.shadowRadius).toBeLessThan(SHADOWS.level4.shadowRadius);

      expect(SHADOWS.level1.elevation).toBeLessThan(SHADOWS.level2.elevation);
      expect(SHADOWS.level2.elevation).toBeLessThan(SHADOWS.level3.elevation);
      expect(SHADOWS.level3.elevation).toBeLessThan(SHADOWS.level4.elevation);
    });

    it('should use black shadow color', () => {
      Object.values(SHADOWS).forEach(shadow => {
        expect(shadow.shadowColor).toBe('#000');
      });
    });

    it('should have specific values for level1', () => {
      expect(SHADOWS.level1.shadowOffset).toEqual({ width: 0, height: 2 });
      expect(SHADOWS.level1.shadowOpacity).toBe(0.08);
      expect(SHADOWS.level1.shadowRadius).toBe(4);
      expect(SHADOWS.level1.elevation).toBe(2);
    });
  });

  describe('BORDERS', () => {
    it('should have default, subtle, and focus border styles', () => {
      expect(BORDERS).toHaveProperty('default');
      expect(BORDERS).toHaveProperty('subtle');
      expect(BORDERS).toHaveProperty('focus');
    });

    it('should have borderWidth and borderColor for each style', () => {
      Object.values(BORDERS).forEach(border => {
        expect(border).toHaveProperty('borderWidth');
        expect(border).toHaveProperty('borderColor');
        expect(typeof border.borderWidth).toBe('number');
        expect(typeof border.borderColor).toBe('string');
      });
    });

    it('should have consistent border widths', () => {
      expect(BORDERS.default.borderWidth).toBe(2);
      expect(BORDERS.subtle.borderWidth).toBe(2);
      expect(BORDERS.focus.borderWidth).toBe(2);
    });

    it('should have valid color formats', () => {
      // RGBA colors should match pattern
      const rgbaRegex = /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/;
      expect(BORDERS.default.borderColor).toMatch(rgbaRegex);
      expect(BORDERS.subtle.borderColor).toMatch(rgbaRegex);
      expect(BORDERS.focus.borderColor).toMatch(rgbaRegex);
    });
  });

  describe('SPACING', () => {
    it('should have all spacing sizes', () => {
      expect(SPACING).toHaveProperty('xs');
      expect(SPACING).toHaveProperty('sm');
      expect(SPACING).toHaveProperty('md');
      expect(SPACING).toHaveProperty('lg');
      expect(SPACING).toHaveProperty('xl');
      expect(SPACING).toHaveProperty('xxl');
    });

    it('should have correct values', () => {
      expect(SPACING.xs).toBe(4);
      expect(SPACING.sm).toBe(8);
      expect(SPACING.md).toBe(16);
      expect(SPACING.lg).toBe(24);
      expect(SPACING.xl).toBe(32);
      expect(SPACING.xxl).toBe(48);
    });

    it('should have progressive values', () => {
      expect(SPACING.xs).toBeLessThan(SPACING.sm);
      expect(SPACING.sm).toBeLessThan(SPACING.md);
      expect(SPACING.md).toBeLessThan(SPACING.lg);
      expect(SPACING.lg).toBeLessThan(SPACING.xl);
      expect(SPACING.xl).toBeLessThan(SPACING.xxl);
    });

    it('should have all number values', () => {
      Object.values(SPACING).forEach(value => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      });
    });
  });

  describe('RADIUS', () => {
    it('should have all radius sizes', () => {
      expect(RADIUS).toHaveProperty('sm');
      expect(RADIUS).toHaveProperty('md');
      expect(RADIUS).toHaveProperty('lg');
      expect(RADIUS).toHaveProperty('xl');
      expect(RADIUS).toHaveProperty('xxl');
      expect(RADIUS).toHaveProperty('round');
    });

    it('should have correct values', () => {
      expect(RADIUS.sm).toBe(4);
      expect(RADIUS.md).toBe(8);
      expect(RADIUS.lg).toBe(12);
      expect(RADIUS.xl).toBe(16);
      expect(RADIUS.xxl).toBe(20);
      expect(RADIUS.round).toBe(9999);
    });

    it('should have progressive values (except round)', () => {
      expect(RADIUS.sm).toBeLessThan(RADIUS.md);
      expect(RADIUS.md).toBeLessThan(RADIUS.lg);
      expect(RADIUS.lg).toBeLessThan(RADIUS.xl);
      expect(RADIUS.xl).toBeLessThan(RADIUS.xxl);
      expect(RADIUS.round).toBeGreaterThan(RADIUS.xxl);
    });

    it('should have all number values', () => {
      Object.values(RADIUS).forEach(value => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      });
    });
  });

  describe('ANIMATION', () => {
    it('should have timing values', () => {
      expect(ANIMATION).toHaveProperty('fast');
      expect(ANIMATION).toHaveProperty('normal');
      expect(ANIMATION).toHaveProperty('slow');
    });

    it('should have correct values', () => {
      expect(ANIMATION.fast).toBe(200);
      expect(ANIMATION.normal).toBe(300);
      expect(ANIMATION.slow).toBe(500);
    });

    it('should have progressive timing', () => {
      expect(ANIMATION.fast).toBeLessThan(ANIMATION.normal);
      expect(ANIMATION.normal).toBeLessThan(ANIMATION.slow);
    });

    it('should have all number values', () => {
      Object.values(ANIMATION).forEach(value => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      });
    });
  });

  describe('TYPOGRAPHY', () => {
    it('should have fontFamily, sizes, and weights', () => {
      expect(TYPOGRAPHY).toHaveProperty('fontFamily');
      expect(TYPOGRAPHY).toHaveProperty('sizes');
      expect(TYPOGRAPHY).toHaveProperty('weights');
    });

    describe('fontFamily', () => {
      it('should have regular, medium, and bold variants', () => {
        expect(TYPOGRAPHY.fontFamily).toHaveProperty('regular');
        expect(TYPOGRAPHY.fontFamily).toHaveProperty('medium');
        expect(TYPOGRAPHY.fontFamily).toHaveProperty('bold');
      });

      it('should have string values for all variants', () => {
        expect(typeof TYPOGRAPHY.fontFamily.regular).toBe('string');
        expect(typeof TYPOGRAPHY.fontFamily.medium).toBe('string');
        expect(typeof TYPOGRAPHY.fontFamily.bold).toBe('string');
      });
    });

    describe('sizes', () => {
      it('should have all size variants', () => {
        const expectedSizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'];
        expectedSizes.forEach(size => {
          expect(TYPOGRAPHY.sizes).toHaveProperty(size);
        });
      });

      it('should have correct values', () => {
        expect(TYPOGRAPHY.sizes.xs).toBe(12);
        expect(TYPOGRAPHY.sizes.sm).toBe(14);
        expect(TYPOGRAPHY.sizes.md).toBe(16);
        expect(TYPOGRAPHY.sizes.lg).toBe(18);
        expect(TYPOGRAPHY.sizes.xl).toBe(20);
        expect(TYPOGRAPHY.sizes.xxl).toBe(24);
        expect(TYPOGRAPHY.sizes.xxxl).toBe(28);
      });

      it('should have progressive sizing', () => {
        expect(TYPOGRAPHY.sizes.xs).toBeLessThan(TYPOGRAPHY.sizes.sm);
        expect(TYPOGRAPHY.sizes.sm).toBeLessThan(TYPOGRAPHY.sizes.md);
        expect(TYPOGRAPHY.sizes.md).toBeLessThan(TYPOGRAPHY.sizes.lg);
        expect(TYPOGRAPHY.sizes.lg).toBeLessThan(TYPOGRAPHY.sizes.xl);
        expect(TYPOGRAPHY.sizes.xl).toBeLessThan(TYPOGRAPHY.sizes.xxl);
        expect(TYPOGRAPHY.sizes.xxl).toBeLessThan(TYPOGRAPHY.sizes.xxxl);
      });

      it('should have all number values', () => {
        Object.values(TYPOGRAPHY.sizes).forEach(size => {
          expect(typeof size).toBe('number');
          expect(size).toBeGreaterThan(0);
        });
      });
    });

    describe('weights', () => {
      it('should have all weight variants', () => {
        expect(TYPOGRAPHY.weights).toHaveProperty('normal');
        expect(TYPOGRAPHY.weights).toHaveProperty('medium');
        expect(TYPOGRAPHY.weights).toHaveProperty('semibold');
        expect(TYPOGRAPHY.weights).toHaveProperty('bold');
      });

      it('should have correct values', () => {
        expect(TYPOGRAPHY.weights.normal).toBe('400');
        expect(TYPOGRAPHY.weights.medium).toBe('500');
        expect(TYPOGRAPHY.weights.semibold).toBe('600');
        expect(TYPOGRAPHY.weights.bold).toBe('700');
      });

      it('should have all string values', () => {
        Object.values(TYPOGRAPHY.weights).forEach(weight => {
          expect(typeof weight).toBe('string');
          expect(weight).toMatch(/^\d{3}$/);
        });
      });

      it('should have progressive weights', () => {
        const weights = Object.values(TYPOGRAPHY.weights).map(w => parseInt(w, 10));
        expect(weights[0]).toBeLessThan(weights[1]);
        expect(weights[1]).toBeLessThan(weights[2]);
        expect(weights[2]).toBeLessThan(weights[3]);
      });
    });
  });

  describe('module structure', () => {
    it('should export all expected constants', () => {
      const themeModule = require('../theme');
      expect(themeModule).toHaveProperty('THEMES');
      // COLORS moved to ../colors.js
      expect(themeModule).toHaveProperty('SHADOWS');
      expect(themeModule).toHaveProperty('BORDERS');
      expect(themeModule).toHaveProperty('SPACING');
      expect(themeModule).toHaveProperty('RADIUS');
      expect(themeModule).toHaveProperty('ANIMATION');
      expect(themeModule).toHaveProperty('TYPOGRAPHY');
    });

    it('should have constants that are objects', () => {
      expect(typeof THEMES).toBe('object');
      // COLORS moved to ../colors.js
      expect(typeof SHADOWS).toBe('object');
      expect(typeof BORDERS).toBe('object');
      expect(typeof SPACING).toBe('object');
      expect(typeof RADIUS).toBe('object');
      expect(typeof ANIMATION).toBe('object');
      expect(typeof TYPOGRAPHY).toBe('object');
    });
  });
});