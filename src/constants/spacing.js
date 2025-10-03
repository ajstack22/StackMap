/**
 * @fileoverview Spacing constants for consistent layout and spacing across the app
 *
 * These constants replace magic numbers for padding, margin, width, and height values.
 * Based on an 8px grid system for consistent visual rhythm.
 *
 * @module constants/spacing
 */

/**
 * Core spacing scale based on 8px grid
 * Use these for padding, margin, and gap values
 */
export const SPACING = {
  /** 2px - Minimal spacing, hairline separators */
  XXS: 2,
  /** 4px - Extra small spacing, tight content */
  XS: 4,
  /** 6px - Between XS and SM, subtle spacing */
  XS_MD: 6,
  /** 7px - Special case for logo padding */
  XS_LG: 7,
  /** 8px - Small spacing, compact layouts */
  SM: 8,
  /** 10px - Between SM and MD */
  SM_MD: 10,
  /** 12px - Medium-small spacing */
  MD_SM: 12,
  /** 15px - Almost medium spacing */
  MD_LG: 15,
  /** 16px - Default spacing, standard gap */
  MD: 16,
  /** 20px - Large spacing, section separation */
  LG: 20,
  /** 24px - Extra large spacing, major sections */
  XL: 24,
  /** 32px - Double extra large, generous spacing */
  XXL: 32,
  /** 35px - Special spacing for card content */
  XXL_MD: 35,
  /** 48px - Triple extra large, maximum spacing */
  XXXL: 48,
};

/**
 * Common dimensions for UI elements
 * Use these for width and height values
 */
export const DIMENSIONS = {
  /** Icon and avatar sizes */
  ICON: {
    /** 18px - Small icon size */
    SM: 18,
    /** 24px - Medium icon size */
    MD: 24,
    /** 32px - Large icon size */
    LG: 32,
    /** 40px - Extra large icon size */
    XL: 40,
    /** 48px - Double extra large icon */
    XXL: 48,
    /** 60px - FAB and special icons */
    XXXL: 60,
    /** 81px - User card emoji size */
    JUMBO: 81,
  },

  /** Component heights */
  HEIGHT: {
    /** 2.5px - Thin lines */
    HAIRLINE: 2.5,
    /** 5px - Thick lines */
    LINE: 5,
    /** 60px - Standard button/input height */
    BUTTON: 60,
    /** 100px - Card or section height */
    CARD: 100,
    /** 110px - Large card height */
    CARD_LG: 110,
  },

  /** Component widths */
  WIDTH: {
    /** 32px - Narrow element */
    NARROW: 32,
    /** 40px - Small button width */
    SM: 40,
    /** 60px - Standard element width */
    MD: 60,
    /** 81px - Square element matching emoji */
    SQUARE: 81,
  },
};

/**
 * Legacy spacing values for backward compatibility
 * @deprecated Use SPACING constants instead
 */
export const LEGACY_SPACING = {
  PADDING_4: SPACING.XS,
  PADDING_7: SPACING.XS_LG,
  PADDING_8: SPACING.SM,
  PADDING_10: SPACING.SM_MD,
  PADDING_12: SPACING.MD_SM,
  PADDING_15: SPACING.MD_LG,
  PADDING_16: SPACING.MD,
  PADDING_20: SPACING.LG,
  PADDING_24: SPACING.XL,
  PADDING_35: SPACING.XXL_MD,
};

/**
 * Helper function to get spacing value
 * @param {keyof typeof SPACING} size - The spacing size key
 * @returns {number} The spacing value in pixels
 */
export const getSpacing = (size) => {
  return SPACING[size] || SPACING.MD;
};

/**
 * Helper function to get dimension value
 * @param {'ICON' | 'HEIGHT' | 'WIDTH'} type - The dimension type
 * @param {string} size - The size key
 * @returns {number} The dimension value in pixels
 */
export const getDimension = (type, size) => {
  return DIMENSIONS[type]?.[size] || DIMENSIONS.ICON.MD;
};