/**
 * Color Constants for StackMap
 *
 * This file contains all color constants used throughout the application.
 * Colors are organized by semantic meaning and usage patterns.
 *
 * @module constants/colors
 */

/**
 * Core color palette extracted from inline styles
 * All colors preserve their exact original values
 */
export const COLORS = {
  // Base colors
  white: '#ffffff',
  black: '#000000',

  // Gray scale (50 = lightest, 900 = darkest)
  // Used for: backgrounds, borders, disabled states, secondary text
  gray: {
    50: '#fafafa',   // HSL(0, 0%, 98%) - Used for light backgrounds (#FAFAFA)
    100: '#f5f5f5',  // HSL(0, 0%, 96%) - Very light gray backgrounds
    200: '#f0f0f0',  // HSL(0, 0%, 94%) - Light gray backgrounds
    300: '#e8e8e8',  // HSL(0, 0%, 91%) - Border colors
    400: '#e0e0e0',  // HSL(0, 0%, 88%) - Dividers, light borders
    500: '#bdbdbd',  // HSL(0, 0%, 74%) - Disabled text
    550: '#999999',  // HSL(0, 0%, 60%) - Secondary text (#999)
    600: '#757575',  // HSL(0, 0%, 46%) - Icons, secondary elements
    650: '#666666',  // HSL(0, 0%, 40%) - Common text color (#666)
    700: '#616161',  // HSL(0, 0%, 38%) - Dark secondary text
    750: '#333333',  // HSL(0, 0%, 20%) - Dark text (#333)
    800: '#424242',  // HSL(0, 0%, 26%) - Very dark text
    900: '#212121',  // HSL(0, 0%, 13%) - Darkest gray
  },

  // Text colors
  text: {
    primary: '#000000',        // Primary text color
    secondary: '#666666',       // Secondary text (used 36 times)
    tertiary: '#999999',        // Tertiary/disabled text
    muted: '#4a5568',          // Muted text color
    subtle: '#6c757d',         // Subtle gray text
    dark: '#2c3e50',          // Dark blue-gray text
    medium: '#495057',         // Medium gray text
    light: '#718096',          // Light gray text
    lighter: '#95a5a6',        // Lighter gray text
    info: '#5d6d7e',           // Info text color
    emphasis: '#333333',       // Emphasized dark text
  },

  // Brand colors
  brand: {
    stackBlue: '#5c7e9d',      // StackMap signature blue
    stackBlueDark: '#4a6680',  // Darker variant
    stackBlueLight: '#7896b3', // Lighter variant
    stackBlueSubtle: '#8fa5b8', // Subtle variant
  },

  // Semantic colors
  semantic: {
    // Error/Danger colors
    error: '#f44336',          // Material red
    errorDark: '#d32f2f',      // Darker error
    errorBright: '#e53e3e',    // Bright error
    errorIntense: '#dd2222',   // Intense red
    errorMuted: '#dc2626',     // Muted error
    danger: '#e74c3c',         // Alternative danger
    dangerLight: '#ec7063',    // Light danger
    dangerBright: '#ff4444',   // Bright danger

    // Success colors
    success: '#4caf50',        // Material green
    successDark: '#2e7d32',    // Dark green
    successLight: '#58d68d',   // Light green

    // Warning colors
    warning: '#ff9800',        // Material orange
    warningDark: '#f57c00',    // Dark orange
    warningLight: '#dc7633',   // Light orange
    warningYellow: '#f4d03f',  // Yellow warning

    // Info colors
    info: '#007aff',           // iOS blue
    infoMaterial: '#0d6efd',  // Bootstrap blue
    infoLight: '#74b9ff',     // Light blue
    infoDeep: '#5dade2',       // Deep blue
    infoSubtle: '#5499c7',     // Subtle blue

    // Primary action colors
    primary: '#667eea',        // Primary purple
    primaryDark: '#4488ff',    // Primary blue variant
    primaryDeep: '#2266dd',    // Deep primary
  },

  // UI element colors
  ui: {
    // Decorative/accent colors
    pink: '#d63384',           // Pink accent
    pinkLight: '#f06292',      // Light pink
    purple: '#6f42c1',         // Purple accent
    purpleLight: '#af7ac5',    // Light purple

    // Special backgrounds
    bgOverlay: '#fff9e6',      // Light yellow background
    bgGreenTint: '#e8f5e9',    // Green tinted background
    bgGrayLight: '#cbd5e0',    // Light gray background
    bgGrayMuted: '#bdc3c7',    // Muted gray background
    bgDark: '#2d3748',         // Dark background
    bgNavy: '#34495e',         // Navy background
    bgMuted: '#7f8c8d',        // Muted background
    bgSubtle: '#85929e',       // Subtle background
    bgBrown: '#5d4e37',        // Brown background

    // Special colors
    orangeAccent: '#fdb462',   // Orange accent
    peachAccent: '#ffaa88',    // Peach accent
    blueAccent: '#88aaff',     // Blue accent
  },

  // Opacity variants (for rgba conversions)
  opacity: {
    // Black with opacity
    blackOverlay05: 'rgba(0, 0, 0, 0.05)',
    blackOverlay08: 'rgba(0, 0, 0, 0.08)',
    blackOverlay10: 'rgba(0, 0, 0, 0.1)',
    blackOverlay12: 'rgba(0, 0, 0, 0.12)',
    blackOverlay15: 'rgba(0, 0, 0, 0.15)',
    blackOverlay50: 'rgba(0, 0, 0, 0.5)',
    blackOverlay70: 'rgba(0, 0, 0, 0.7)',
    blackOverlay80: 'rgba(0, 0, 0, 0.8)',

    // White with opacity
    whiteOverlay10: 'rgba(255, 255, 255, 0.1)',
    whiteOverlay15: 'rgba(255, 255, 255, 0.15)',
    whiteOverlay20: 'rgba(255, 255, 255, 0.2)',
    whiteOverlay30: 'rgba(255, 255, 255, 0.3)',
    whiteOverlay50: 'rgba(255, 255, 255, 0.5)',
    whiteOverlay70: 'rgba(255, 255, 255, 0.7)',
    whiteOverlay80: 'rgba(255, 255, 255, 0.8)',
    whiteOverlay90: 'rgba(255, 255, 255, 0.9)',
    whiteOverlay95: 'rgba(255, 255, 255, 0.95)',

    // Brand color with opacity (StackMap blue: 92, 126, 157)
    stackBlueOverlay10: 'rgba(92, 126, 157, 0.1)',
    stackBlueOverlay20: 'rgba(92, 126, 157, 0.2)',
    stackBlueOverlay50: 'rgba(102, 126, 234, 0.5)', // Focus border color
  },

  // Border colors
  borders: {
    default: 'rgba(0, 0, 0, 0.08)',
    subtle: 'rgba(0, 0, 0, 0.1)',
    light: '#e8e8e8',
    medium: '#e0e0e0',
    focus: 'rgba(102, 126, 234, 0.5)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white30: 'rgba(255, 255, 255, 0.3)',
    white50: 'rgba(255, 255, 255, 0.5)',
  },

  // Shadow colors
  shadows: {
    default: '#000000',
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.15)',
    heavy: 'rgba(0, 0, 0, 0.3)',
  },
};

/**
 * Helper function to get color with fallback
 * @param {string} colorPath - Dot notation path to color (e.g., 'gray.500')
 * @param {string} fallback - Fallback color if path not found
 * @returns {string} The color value
 */
export const getColor = (colorPath, fallback = '#000000') => {
  const paths = colorPath.split('.');
  let current = COLORS;

  for (const path of paths) {
    if (current && typeof current === 'object' && path in current) {
      current = current[path];
    } else {
      return fallback;
    }
  }

  return current || fallback;
};

/**
 * Export individual color groups for convenience
 */
export const {
  gray: GRAY,
  text: TEXT,
  brand: BRAND,
  semantic: SEMANTIC,
  ui: UI,
  opacity: OPACITY,
  borders: COLOR_BORDERS,
  shadows: COLOR_SHADOWS
} = COLORS;

// Default export for backward compatibility
export default COLORS;