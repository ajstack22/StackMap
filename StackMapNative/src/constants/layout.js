import { Dimensions } from 'react-native';

// Screen dimensions
export const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device type helpers
export const isTablet = (width) => {
  const currentWidth = width || Dimensions.get('window').width;
  return currentWidth >= 768;
};
export const isMobile = (width) => {
  const currentWidth = width || Dimensions.get('window').width;
  return currentWidth <= 600;
};

// Font scale multipliers
export const FONT_SCALE = {
  mobile: 1,
  tablet: 1.2, // 20% larger on tablets
};

// Card layout constants
export const CARD_LAYOUT = {
  minWidth: 450, // Must be > 400px height to maintain landscape
  maxWidth: 600, // Comfortable max width
  gap: 24, // ~1.5rem in pixels
  containerPaddingMobile: 16, // 1rem
  containerPaddingTablet: 24, // 1.5rem  
  containerPaddingDesktop: 80, // 5rem - more padding for wide screens
  singleColumnMaxWidth: 600, // Max width for single column
};

// Helper functions
export const getContainerPadding = (width = screenWidth) => {
  if (width <= 600) return CARD_LAYOUT.containerPaddingMobile;
  
  // With minWidth 450px, calculate breakpoints:
  // 1 column: needs 450px + padding
  // 2 columns: needs 924px + padding
  // 3 columns: needs 1398px + padding
  
  // Progressive padding
  if (width <= 800) return 32;   // 1 column territory
  if (width <= 1000) return 48;  // Approaching 2 columns
  if (width <= 1200) return 24;  // 2 column territory (less padding needed)
  if (width <= 1600) return 48;  // Approaching 3 columns
  return CARD_LAYOUT.containerPaddingDesktop; // 3+ columns
};

export const calculateColumns = (width = screenWidth) => {
  const containerPadding = getContainerPadding(width);
  const availableWidth = width - (containerPadding * 2);
  // Calculate columns based on minimum width without additional margins
  let numColumns = Math.floor((availableWidth + CARD_LAYOUT.gap) / (CARD_LAYOUT.minWidth + CARD_LAYOUT.gap)) || 1;
  
  // Cap at 3 columns maximum
  if (numColumns > 3) {
    numColumns = 3;
  }
  
  return numColumns;
};

export const calculateCardWidth = (width = screenWidth) => {
  const containerPadding = getContainerPadding(width);
  const availableWidth = width - (containerPadding * 2);
  const numColumns = calculateColumns(width);
  
  // For single column, use fixed width but respect available space
  if (numColumns === 1) {
    return Math.min(CARD_LAYOUT.singleColumnMaxWidth, availableWidth);
  }
  
  // For web with CSS Grid, we don't need to calculate exact widths
  if (typeof window !== 'undefined' && window.document) {
    return 'auto';
  }
  
  // For native, calculate exact widths
  const totalGaps = (numColumns - 1) * CARD_LAYOUT.gap;
  const cardWidth = (availableWidth - totalGaps) / numColumns;
  return Math.min(cardWidth, CARD_LAYOUT.maxWidth);
};

export const getCardHeight = () => {
  return isTablet() ? 360 : 300; // Good landscape ratio with 450px+ width
};

export const getCardPadding = () => {
  return isTablet() ? 45 : 35;
};

// FAB dimensions
export const FAB_DIMENSIONS = {
  mobile: {
    size: 72,
    iconSize: 31,
  },
  tablet: {
    size: 96,
    iconSize: 38,
  },
};

// Badge dimensions (number and completion circles)
export const getBadgeDimensions = () => ({
  size: isTablet() ? 70 : 54,
  iconSize: isTablet() ? 36 : 28,
});

// For backward compatibility
export const BADGE_DIMENSIONS = getBadgeDimensions();

// Header dimensions
export const HEADER_DIMENSIONS = {
  titleSize: isTablet() ? 36 : 28,
  subtitleSize: isTablet() ? 18 : 14,
  emojiSize: isTablet() ? 24 : 20,
};