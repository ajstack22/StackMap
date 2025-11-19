


export const SPACING = {
  XXS: 2,
  XS: 4,
  XS_MD: 6,
  XS_LG: 7,
  SM: 8,
  SM_MD: 10,
  MD_SM: 12,
  MD_LG: 15,
  MD: 16,
  LG: 20,
  XL: 24,
  XXL: 32,
  XXL_MD: 35,
  XXXL: 48,
};


export const DIMENSIONS = {
  ICON: {
    SM: 18,
    MD: 24,
    LG: 32,
    XL: 40,
    XXL: 48,
    XXXL: 60,
    JUMBO: 81,
  },

  HEIGHT: {
    HAIRLINE: 2.5,
    LINE: 5,
    BUTTON: 60,
    CARD: 100,
    CARD_LG: 110,
  },

  WIDTH: {
    NARROW: 32,
    SM: 40,
    MD: 60,
    SQUARE: 81,
  },
};


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


export const getSpacing = (size) => {
  return SPACING[size] || SPACING.MD;
};


export const getDimension = (type, size) => {
  return DIMENSIONS[type]?.[size] || DIMENSIONS.ICON.MD;
};