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
  minWidth: 320, // Increased for better readability
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
  
  // DEBUG: Log calculation details
  console.log('📐 Column Calculation:', {
    screenWidth: width,
    containerPadding: containerPadding,
    availableWidth: availableWidth,
    isTablet: isTablet(width),
    platform: Platform.OS
  });
  
  // Special handling for iPad devices
  // Use simpler, more predictable breakpoints
  if (Platform.OS === 'ios' && isTablet(width)) {
    // Use available width (after padding) for breakpoints
    if (availableWidth < 650) {
      console.log('📐 iPad: 1 column (available < 650)');
      return 1;
    }
    if (availableWidth < 950) {
      console.log('📐 iPad: 2 columns (available < 950)');
      return 2;
    }
    if (availableWidth < 1250) {
      console.log('📐 iPad: 3 columns (available < 1250)');
      return 3;
    }
    console.log('📐 iPad: 4 columns (available >= 1250)');
    return 4;
  }
  
  // Standard breakpoints for other platforms
  if (width < 600) {
    return 1;
  }
  
  if (width < 900) {
    return 2;
  }
  
  return 3;
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
  // Reduce height for tablets to better fit when in 2-column layout
  return isTablet() ? 240 : 280; // Reduced from 320 to 240 for tablets
};

export const getCardPadding = () => {
  // Reduce padding on tablets to give more space for content
  return isTablet() ? 25 : 35; // Reduced from 45 to 25 for tablets
};

// FAB dimensions - use function to avoid module-level Platform.OS access
export const getFABDimensions = () => ({
  mobile: {
    size: Platform.OS === 'web' ? 60 : 72,
    iconSize: Platform.OS === 'web' ? 26 : 31,
  },
  tablet: {
    size: Platform.OS === 'web' ? 60 : 96,
    iconSize: Platform.OS === 'web' ? 26 : 38,
  },
});

// For backward compatibility
export const FAB_DIMENSIONS = {
  mobile: { size: 72, iconSize: 31 },
  tablet: { size: 96, iconSize: 38 },
};

// Badge dimensions (number and completion circles)
export const getBadgeDimensions = () => {
  const baseSize = isTablet() ? 70 : 54;
  const baseIconSize = isTablet() ? 36 : 28;
  
  // Reduce by 30% on web only
  const webReduction = Platform.OS === 'web' ? 0.7 : 1;
  
  return {
    size: Math.round(baseSize * webReduction),
    iconSize: Math.round(baseIconSize * webReduction),
  };
};

// For backward compatibility
export const BADGE_DIMENSIONS = getBadgeDimensions();

// Header dimensions
export const HEADER_DIMENSIONS = {
  titleSize: isTablet() ? 36 : 28,
  subtitleSize: isTablet() ? 18 : 14,
  emojiSize: isTablet() ? 24 : 20,
};