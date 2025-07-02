import { Dimensions } from 'react-native';

// Screen dimensions
export const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device type helpers
export const isTablet = () => screenWidth >= 768;
export const isMobile = () => screenWidth <= 600;

// Font scale multipliers
export const FONT_SCALE = {
  mobile: 1,
  tablet: 1.2, // 20% larger on tablets
};

// Card layout constants
export const CARD_LAYOUT = {
  minWidth: 280,
  gap: 19, // ~1.2rem in pixels
  containerPaddingMobile: 16, // 1rem
  containerPaddingTablet: 24, // 1.5rem
};

// Helper functions
export const getContainerPadding = () => {
  return screenWidth <= 600 ? CARD_LAYOUT.containerPaddingMobile : CARD_LAYOUT.containerPaddingTablet;
};

export const calculateColumns = (width = screenWidth) => {
  const containerPadding = getContainerPadding();
  const availableWidth = width - (containerPadding * 2);
  const numColumns = Math.floor((availableWidth + CARD_LAYOUT.gap) / (CARD_LAYOUT.minWidth + CARD_LAYOUT.gap)) || 1;
  return numColumns;
};

export const calculateCardWidth = (width = screenWidth) => {
  const containerPadding = getContainerPadding();
  const availableWidth = width - (containerPadding * 2);
  const numColumns = calculateColumns(width);
  const totalGaps = (numColumns - 1) * CARD_LAYOUT.gap;
  const cardWidth = (availableWidth - totalGaps) / numColumns;
  return cardWidth;
};

export const getCardHeight = () => {
  return isTablet() ? 400 : 320;
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