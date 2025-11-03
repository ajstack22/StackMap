import { Dimensions, Platform } from 'react-native';

// Screen dimensions
export const { width: screenWidth, height: screenHeight } =
  Dimensions.get('window');

// Device type helpers
export const isTablet = width => {
  const currentWidth = width || Dimensions.get('window').width;
  return currentWidth >= 768;
};
export const isMobile = width => {
  const currentWidth = width || Dimensions.get('window').width;
  return currentWidth <= 600;
};

// Tablet landscape detection (uses real-time dimensions)
export const isTabletLandscape = () => {
  const { width, height } = Dimensions.get('window');
  // Tablet landscape: wide enough to be tablet AND wider than tall
  return width >= 1000 && width > height;
};

// Font scale multipliers
export const FONT_SCALE = {
  mobile: 1,
  tablet: 1.2, // 20% larger on tablets
};

// Card layout constants
export const CARD_LAYOUT = {
  minWidth: 280, // Reduced to allow 3 columns on iPad landscape
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
  if (width <= 1200) return CARD_LAYOUT.containerPaddingTablet;
  return CARD_LAYOUT.containerPaddingDesktop;
};

export const calculateColumns = (width = screenWidth) => {
  const containerPadding = getContainerPadding(width);
  const availableWidth = width - containerPadding * 2;

  // Web should use standard responsive breakpoints
  if (Platform.OS === 'web') {
    if (width < 768) {
      return 1;
    }
    if (width < 1200) {
      return 2;
    }
    return 3; // 3 columns for 1200px and above
  }

  // Android tablets: Always 2 columns (portrait ~800px, landscape ~1280px)
  if (Platform.OS === 'android' && width >= 768) {
    return 2;
  }

  // Special handling for iOS tablets
  // Force 2 columns for ALL iPad orientations to ensure centering works
  // iPad Mini/11": ~810-1080px, iPad Pro 12.9": ~1024-1366px
  if (Platform.OS === 'ios' && width >= 768) {
    // All iPads get 2 columns for consistent centering behavior
    return 2;
  }

  // Standard breakpoints for all platforms
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
  const availableWidth = width - containerPadding * 2;
  const numColumns = calculateColumns(width);

  // For single column, use fixed width but respect available space
  if (numColumns === 1) {
    return Math.min(CARD_LAYOUT.singleColumnMaxWidth, availableWidth);
  }

  // For web, we still need to calculate proper widths
  // Remove this web-specific check to use same calculation as native

  // For native, calculate exact widths
  const totalGaps = (numColumns - 1) * CARD_LAYOUT.gap;
  const cardWidth = (availableWidth - totalGaps) / numColumns;

  // For iPad portrait and Android tablets (2 columns), use same calculation
  if (
    (Platform.OS === 'ios' || Platform.OS === 'android') &&
    isTablet(width) &&
    numColumns === 2
  ) {
    // Use the same width calculation as Android tablets
    // This ensures cards fill the space properly without being too narrow
    return cardWidth;
  }

  // For landscape (3 columns), let cards be narrower to fit
  if (numColumns === 3) {
    return Math.min(cardWidth, CARD_LAYOUT.maxWidth);
  }

  // Default: enforce minimum width
  return Math.min(
    Math.max(cardWidth, CARD_LAYOUT.minWidth),
    CARD_LAYOUT.maxWidth,
  );
};

export const getCardHeight = () => {
  // Use generous height for all devices
  return 320; // Increased height for better content display
};

export const getCardPadding = () => {
  // Use same padding for all devices
  return 35; // Generous padding
};

// FAB dimensions
export const FAB_DIMENSIONS = {
  mobile: {
    size: Platform.OS === 'web' ? 60 : 72,
    iconSize: Platform.OS === 'web' ? 26 : 31,
  },
  tablet: {
    size: Platform.OS === 'web' ? 60 : 96,
    iconSize: Platform.OS === 'web' ? 26 : 38,
  },
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
