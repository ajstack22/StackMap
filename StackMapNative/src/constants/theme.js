// Color themes
export const THEMES = {
  purple: { primary: '#667eea', dark: '#4a5bc7', light: '#8a9ff5' },
  blue: { primary: '#3182ce', dark: '#2c5aa0', light: '#63b3ed' },
  green: { primary: '#48bb78', dark: '#38a169', light: '#68d391' },
  red: { primary: '#f56565', dark: '#e53e3e', light: '#fc8181' },
  orange: { primary: '#ed8936', dark: '#dd6b20', light: '#f6ad55' },
  pink: { primary: '#ed64a6', dark: '#d53f8c', light: '#f687b3' },
};

// Common colors
export const COLORS = {
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f5f5f5',
    100: '#f0f0f0',
    200: '#e8e8e8',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  error: '#f56565',
  success: '#48bb78',
  warning: '#ed8936',
  info: '#4299e1',
};

// Shadow system
export const SHADOWS = {
  // Level 1 - Subtle (Buttons, Edit buttons)
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  // Level 2 - Default (Cards, Pills, Badges)
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  // Level 3 - Elevated (FABs, Toasts, Modals)
  level3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  // Level 4 - High (Dragging, Active states)
  level4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Border styles
export const BORDERS = {
  default: {
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  subtle: {
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  focus: {
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.5)',
  },
};

// Spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius scale
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 9999,
};

// Animation constants
export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Typography (with Comic Neue)
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'ComicNeue-Regular',
    bold: 'ComicNeue-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};