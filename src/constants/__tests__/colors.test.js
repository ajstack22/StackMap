import {
  COLORS,
  getColor,
  GRAY,
  TEXT,
  BRAND,
  SEMANTIC,
  UI,
  OPACITY,
  COLOR_BORDERS,
  COLOR_SHADOWS
} from '../colors';

describe('Color Constants', () => {
  describe('COLORS object structure', () => {
    it('should have all required top-level properties', () => {
      expect(COLORS).toHaveProperty('white');
      expect(COLORS).toHaveProperty('black');
      expect(COLORS).toHaveProperty('gray');
      expect(COLORS).toHaveProperty('text');
      expect(COLORS).toHaveProperty('brand');
      expect(COLORS).toHaveProperty('semantic');
      expect(COLORS).toHaveProperty('ui');
      expect(COLORS).toHaveProperty('opacity');
      expect(COLORS).toHaveProperty('borders');
      expect(COLORS).toHaveProperty('shadows');
    });

    it('should have valid hex color values for base colors', () => {
      expect(COLORS.white).toBe('#ffffff');
      expect(COLORS.black).toBe('#000000');
    });
  });

  describe('Gray scale', () => {
    it('should have all gray scale values', () => {
      expect(COLORS.gray[50]).toBe('#fafafa');
      expect(COLORS.gray[100]).toBe('#f5f5f5');
      expect(COLORS.gray[200]).toBe('#f0f0f0');
      expect(COLORS.gray[300]).toBe('#e8e8e8');
      expect(COLORS.gray[400]).toBe('#e0e0e0');
      expect(COLORS.gray[500]).toBe('#bdbdbd');
      expect(COLORS.gray[550]).toBe('#999999');
      expect(COLORS.gray[600]).toBe('#757575');
      expect(COLORS.gray[650]).toBe('#666666');
      expect(COLORS.gray[700]).toBe('#616161');
      expect(COLORS.gray[750]).toBe('#333333');
      expect(COLORS.gray[800]).toBe('#424242');
      expect(COLORS.gray[900]).toBe('#212121');
    });
  });

  describe('Text colors', () => {
    it('should have all text color variants', () => {
      expect(COLORS.text.primary).toBe('#000000');
      expect(COLORS.text.secondary).toBe('#666666');
      expect(COLORS.text.tertiary).toBe('#999999');
      expect(COLORS.text.muted).toBe('#4a5568');
      expect(COLORS.text.subtle).toBe('#6c757d');
      expect(COLORS.text.dark).toBe('#2c3e50');
      expect(COLORS.text.medium).toBe('#495057');
      expect(COLORS.text.emphasis).toBe('#333333');
    });
  });

  describe('Brand colors', () => {
    it('should have StackMap brand colors', () => {
      expect(COLORS.brand.stackBlue).toBe('#5c7e9d');
      expect(COLORS.brand.stackBlueDark).toBe('#4a6680');
      expect(COLORS.brand.stackBlueLight).toBe('#7896b3');
      expect(COLORS.brand.stackBlueSubtle).toBe('#8fa5b8');
    });
  });

  describe('Semantic colors', () => {
    it('should have error colors', () => {
      expect(COLORS.semantic.error).toBe('#f44336');
      expect(COLORS.semantic.errorDark).toBe('#d32f2f');
      expect(COLORS.semantic.errorBright).toBe('#e53e3e');
      expect(COLORS.semantic.danger).toBe('#e74c3c');
    });

    it('should have success colors', () => {
      expect(COLORS.semantic.success).toBe('#4caf50');
      expect(COLORS.semantic.successDark).toBe('#2e7d32');
      expect(COLORS.semantic.successLight).toBe('#58d68d');
    });

    it('should have warning colors', () => {
      expect(COLORS.semantic.warning).toBe('#ff9800');
      expect(COLORS.semantic.warningDark).toBe('#f57c00');
      expect(COLORS.semantic.warningLight).toBe('#dc7633');
    });

    it('should have info colors', () => {
      expect(COLORS.semantic.info).toBe('#007aff');
      expect(COLORS.semantic.infoMaterial).toBe('#0d6efd');
      expect(COLORS.semantic.infoLight).toBe('#74b9ff');
    });

    it('should have primary colors', () => {
      expect(COLORS.semantic.primary).toBe('#667eea');
      expect(COLORS.semantic.primaryDark).toBe('#4488ff');
      expect(COLORS.semantic.primaryDeep).toBe('#2266dd');
    });
  });

  describe('UI colors', () => {
    it('should have accent colors', () => {
      expect(COLORS.ui.pink).toBe('#d63384');
      expect(COLORS.ui.purple).toBe('#6f42c1');
      expect(COLORS.ui.orangeAccent).toBe('#fdb462');
      expect(COLORS.ui.peachAccent).toBe('#ffaa88');
    });

    it('should have background colors', () => {
      expect(COLORS.ui.bgOverlay).toBe('#fff9e6');
      expect(COLORS.ui.bgGreenTint).toBe('#e8f5e9');
      expect(COLORS.ui.bgGrayLight).toBe('#cbd5e0');
      expect(COLORS.ui.bgDark).toBe('#2d3748');
    });
  });

  describe('Opacity variants', () => {
    it('should have black opacity variants', () => {
      expect(COLORS.opacity.blackOverlay05).toBe('rgba(0, 0, 0, 0.05)');
      expect(COLORS.opacity.blackOverlay08).toBe('rgba(0, 0, 0, 0.08)');
      expect(COLORS.opacity.blackOverlay10).toBe('rgba(0, 0, 0, 0.1)');
      expect(COLORS.opacity.blackOverlay50).toBe('rgba(0, 0, 0, 0.5)');
      expect(COLORS.opacity.blackOverlay80).toBe('rgba(0, 0, 0, 0.8)');
    });

    it('should have white opacity variants', () => {
      expect(COLORS.opacity.whiteOverlay10).toBe('rgba(255, 255, 255, 0.1)');
      expect(COLORS.opacity.whiteOverlay20).toBe('rgba(255, 255, 255, 0.2)');
      expect(COLORS.opacity.whiteOverlay50).toBe('rgba(255, 255, 255, 0.5)');
      expect(COLORS.opacity.whiteOverlay80).toBe('rgba(255, 255, 255, 0.8)');
      expect(COLORS.opacity.whiteOverlay95).toBe('rgba(255, 255, 255, 0.95)');
    });

    it('should have brand color opacity variants', () => {
      expect(COLORS.opacity.stackBlueOverlay10).toBe('rgba(92, 126, 157, 0.1)');
      expect(COLORS.opacity.stackBlueOverlay20).toBe('rgba(92, 126, 157, 0.2)');
    });
  });

  describe('Border colors', () => {
    it('should have all border variants', () => {
      expect(COLORS.borders.default).toBe('rgba(0, 0, 0, 0.08)');
      expect(COLORS.borders.subtle).toBe('rgba(0, 0, 0, 0.1)');
      expect(COLORS.borders.light).toBe('#e8e8e8');
      expect(COLORS.borders.medium).toBe('#e0e0e0');
      expect(COLORS.borders.focus).toBe('rgba(102, 126, 234, 0.5)');
      expect(COLORS.borders.white10).toBe('rgba(255, 255, 255, 0.1)');
    });
  });

  describe('Shadow colors', () => {
    it('should have shadow color variants', () => {
      expect(COLORS.shadows.default).toBe('#000000');
      expect(COLORS.shadows.light).toBe('rgba(0, 0, 0, 0.1)');
      expect(COLORS.shadows.medium).toBe('rgba(0, 0, 0, 0.15)');
      expect(COLORS.shadows.heavy).toBe('rgba(0, 0, 0, 0.3)');
    });
  });

  describe('getColor helper function', () => {
    it('should retrieve nested color values', () => {
      expect(getColor('gray.500')).toBe('#bdbdbd');
      expect(getColor('text.primary')).toBe('#000000');
      expect(getColor('brand.stackBlue')).toBe('#5c7e9d');
      expect(getColor('semantic.success')).toBe('#4caf50');
    });

    it('should return fallback for invalid paths', () => {
      expect(getColor('invalid.path')).toBe('#000000');
      expect(getColor('invalid.path', '#ff0000')).toBe('#ff0000');
      expect(getColor('gray.999')).toBe('#000000');
    });

    it('should handle single-level paths', () => {
      expect(getColor('white')).toBe('#ffffff');
      expect(getColor('black')).toBe('#000000');
    });
  });

  describe('Named exports', () => {
    it('should export color groups as named constants', () => {
      expect(GRAY).toBe(COLORS.gray);
      expect(TEXT).toBe(COLORS.text);
      expect(BRAND).toBe(COLORS.brand);
      expect(SEMANTIC).toBe(COLORS.semantic);
      expect(UI).toBe(COLORS.ui);
      expect(OPACITY).toBe(COLORS.opacity);
      expect(COLOR_BORDERS).toBe(COLORS.borders);
      expect(COLOR_SHADOWS).toBe(COLORS.shadows);
    });
  });

  describe('Color consistency', () => {
    it('should have consistent color formats', () => {
      // Check hex colors are valid
      const hexRegex = /^#[0-9a-f]{6}$/i;
      expect(COLORS.white).toMatch(hexRegex);
      expect(COLORS.black).toMatch(hexRegex);
      expect(COLORS.gray[500]).toMatch(hexRegex);
      expect(COLORS.text.primary).toMatch(hexRegex);

      // Check rgba colors are valid
      const rgbaRegex = /^rgba?\(\d{1,3},\s*\d{1,3},\s*\d{1,3}(,\s*\d?\.?\d+)?\)$/;
      expect(COLORS.opacity.blackOverlay50).toMatch(rgbaRegex);
      expect(COLORS.borders.default).toMatch(rgbaRegex);
    });

    it('should ensure commonly used colors match legacy values', () => {
      // These tests ensure backward compatibility
      expect(COLORS.text.primary).toBe('#000000'); // Was #000
      expect(COLORS.text.secondary).toBe('#666666'); // Was #666
      expect(COLORS.semantic.error).toBe('#f44336'); // Material red
      expect(COLORS.semantic.success).toBe('#4caf50'); // Material green
      expect(COLORS.brand.stackBlue).toBe('#5c7e9d'); // StackMap signature color
    });
  });

  describe('Use case coverage', () => {
    it('should have colors for all common use cases', () => {
      // Text hierarchy
      expect(COLORS.text).toHaveProperty('primary');
      expect(COLORS.text).toHaveProperty('secondary');
      expect(COLORS.text).toHaveProperty('tertiary');

      // Semantic states
      expect(COLORS.semantic).toHaveProperty('error');
      expect(COLORS.semantic).toHaveProperty('success');
      expect(COLORS.semantic).toHaveProperty('warning');
      expect(COLORS.semantic).toHaveProperty('info');

      // Borders
      expect(COLORS.borders).toHaveProperty('default');
      expect(COLORS.borders).toHaveProperty('focus');

      // Shadows
      expect(COLORS.shadows).toHaveProperty('default');
      expect(COLORS.shadows).toHaveProperty('light');
      expect(COLORS.shadows).toHaveProperty('medium');
    });
  });
});