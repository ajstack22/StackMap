import { Dimensions, Platform } from 'react-native';

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
  minWidth: 280, // Reduced to allow 2 columns on iPad portrait (768px)
  maxWidth: 450, // Comfortable max width
  gap: 20, // Balanced gap for better column breakpoints
  containerPaddingMobile: 16, // 1rem
  containerPaddingTablet: 24, // 1.5rem  
  containerPaddingDesktop: 48, // 3rem - reasonable padding for wide screens
  singleColumnMaxWidth: 450, // Max width for single column
};

// Helper functions
export const getContainerPadding = (width = screenWidth) => {
  if (width <= 600) return CARD_LAYOUT.containerPaddingMobile;
  if (width <= 1024) return CARD_LAYOUT.containerPaddingTablet;
  return CARD_LAYOUT.containerPaddingDesktop;
};

export const calculateColumns = (width = screenWidth) => {
  const containerPadding = getContainerPadding(width);
  const availableWidth = width - (containerPadding * 2);
  
  // Special handling for iPad devices
  // Force 2 columns for iPad in portrait mode (width < height)
  // This covers iPad Mini, iPad Air, iPad Pro in portrait
  if (Platform.OS === 'ios' && isTablet(width)) {
    // If it's a tablet and width is less than 1024 (portrait orientation)
    if (width < 1024) {
      return 2;
    }
  }
  
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
  if (Platform.OS === 'web') {
    return 'auto';
  }
  
  // For native, calculate exact widths
  const totalGaps = (numColumns - 1) * CARD_LAYOUT.gap;
  const cardWidth = (availableWidth - totalGaps) / numColumns;
  return Math.min(cardWidth, CARD_LAYOUT.maxWidth);
};

export const getCardHeight = () => {
  return isTablet() ? 320 : 280; // Good proportions with 350px width
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