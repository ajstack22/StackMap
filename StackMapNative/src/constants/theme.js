import { Platform } from 'react-native';

// Color themes - designed for accessibility with white text
// First 15: Chromatic order with WCAG AA compliance for white text (includes rainbow spectrum)
// Last 5: Neurodiversity-friendly colors (calming, reduced sensory load)
export const THEMES = {
  // Chromatic order - Rainbow spectrum (Red -> Orange -> Yellow -> Green -> Blue -> Purple -> Pink)
  crimson: { primary: '#DC143C', dark: '#B91C3C', light: '#E85D75' },      // Deep crimson red
  cherry: { primary: '#DE3163', dark: '#C42953', light: '#E85A7F' },       // Bright cherry (rainbow red)
  scarlet: { primary: '#CD5C5C', dark: '#B94545', light: '#D98181' },      // Softer red
  rust: { primary: '#B7410E', dark: '#963508', light: '#D4642E' },         // Rust orange
  tangerine: { primary: '#F28500', dark: '#D47200', light: '#FF9A33' },    // Bright tangerine (rainbow orange)
  amber: { primary: '#D97706', dark: '#B45309', light: '#F59E0B' },        // Deep amber
  gold: { primary: '#B8860B', dark: '#996F09', light: '#D4A017' },         // Rich gold (rainbow yellow)
  olive: { primary: '#6B8E23', dark: '#556B2F', light: '#8FBC8F' },        // Olive green
  emerald: { primary: '#2D8659', dark: '#236B48', light: '#3FA760' },      // Rich emerald (rainbow green)
  forest: { primary: '#228B22', dark: '#1C6E1C', light: '#3CB371' },       // Forest green
  ocean: { primary: '#2C7A7B', dark: '#1F5F5F', light: '#4C9A9B' },        // Ocean teal
  sapphire: { primary: '#0F52BA', dark: '#0B3D8A', light: '#3770CF' },     // Bright sapphire (rainbow blue)
  navy: { primary: '#2C5282', dark: '#1E3A5F', light: '#3B6FA0' },         // Navy blue
  indigo: { primary: '#4C1D95', dark: '#3B1674', light: '#6B46B5' },       // Deep indigo
  plum: { primary: '#8B5CF6', dark: '#7C3AED', light: '#A78BFA' },         // Rich plum
  
  // Neurodiversity-friendly colors
  sage: { primary: '#6B7F6B', dark: '#556655', light: '#8B9F8B' },         // Calming sage - reduces anxiety
  dustyBlue: { primary: '#4A6480', dark: '#3B5066', light: '#6B859F' },    // Muted blue - ADHD focus
  stackBlue: { primary: '#5C7E9D', dark: '#4A6680', light: '#7896B3' },    // StackMap blue - ADHD/neurodiverse friendly
  terracotta: { primary: '#A0522D', dark: '#804020', light: '#C07550' },   // Warm earth - grounding
  lavender: { primary: '#7B68A6', dark: '#65538C', light: '#9785BD' },     // Soft purple - sensory comfort
  slate: { primary: '#64748B', dark: '#475569', light: '#8B95A6' }         // Neutral slate - low stimulation
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

// Typography (with Comic Relief)
export const TYPOGRAPHY = {
  fontFamily: {
    regular: Platform.select({
      ios: 'Comic Relief',
      android: 'ComicRelief-Regular',
      web: "'Comic Neue', 'Comic Sans MS', cursive"
    }),
    medium: Platform.select({
      ios: 'Comic Relief',
      android: 'ComicRelief-Regular',
      web: "'Comic Neue', 'Comic Sans MS', cursive"
    }),
    bold: Platform.select({
      ios: 'Comic Relief', // iOS uses same family with fontWeight
      android: 'ComicRelief-Bold',
      web: "'Comic Neue', 'Comic Sans MS', cursive"
    }),
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