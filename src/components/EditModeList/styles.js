import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';

// Base styles used on all platforms
const baseStyles = {
  listContainer: {
    paddingVertical: 8,
    paddingHorizontal: Platform.select({
      web: 16,
      default: 0,
    }),
  },

  listItem: {
    backgroundColor: COLORS.white,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    padding: 12,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadows.default,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: `0 1px 3px ${COLORS.opacity.blackOverlay10}`,
        // Smooth transitions for web
        transition: 'all 0.25s ease-in-out',
        willChange: 'transform',
      },
    }),
  },

  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  emoji: {
    fontSize: Platform.select({
      web: 28,
      default: 24,
    }),
    marginRight: 12,
  },

  textContent: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontFamily: 'ComicRelief',
    color: COLORS.text.primary,
    fontWeight: Platform.select({
      ios: '700',
      android: '800',
      web: '600',
    }),
  },

  description: {
    fontSize: 14,
    fontFamily: 'ComicRelief',
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  editButton: {
    padding: 4,
    borderRadius: 4,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadows.default,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 3px 6px ${COLORS.opacity.blackOverlay15}`,
      },
    }),
  },

  timeBadge: {
    width: 'auto',
    paddingHorizontal: 10,
    minWidth: 50,
  },

  numberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'ComicRelief',
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },

  reorderButtons: {
    flexDirection: 'row',
    gap: 4,
  },

  reorderButton: {
    padding: 4,
    borderRadius: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  actionButton: {
    padding: 4,
    borderRadius: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.borders.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadows.default,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: `0 2px 4px ${COLORS.opacity.blackOverlay10}`,
      },
    }),
  },

  disabledCircle: {
    opacity: 0.5,
  },

  bookmarkAdded: {
    borderWidth: 0,
    // backgroundColor set dynamically via inline style (theme.primary)
  },

  completionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.borders.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadows.default,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: `0 2px 4px ${COLORS.opacity.blackOverlay10}`,
      },
    }),
  },

  completionCircleCompleted: {
    borderWidth: 0,
    // backgroundColor is set dynamically via inline style (theme.primary)
  },

  checkmark: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'ComicRelief',
  },

  checkmarkIncomplete: {
    // color will be set dynamically to theme.primary
  },

  disabled: {
    opacity: 0.5,
  },
};

export const styles = StyleSheet.create(baseStyles);

// Tablet-specific adjustments (keeping consistency)
export const getTabletStyles = () => {
  return StyleSheet.create({
    ...baseStyles,
    listItem: {
      ...baseStyles.listItem,
      padding: 16,
      marginHorizontal: 12,
      marginVertical: 6,
      maxWidth: 900,
    },
    emoji: {
      ...baseStyles.icon,
      fontSize: 32,
    },
    title: {
      ...baseStyles.title,
      fontSize: 18,
    },
    description: {
      ...baseStyles.description,
      fontSize: 15,
    },
    editButton: {
      ...baseStyles.editButton,
      padding: 6,
      minWidth: 52,
      minHeight: 52,
    },
    editButtonCircle: {
      ...baseStyles.editButtonCircle,
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    timeBadge: {
      ...baseStyles.timeBadge,
      paddingHorizontal: 12,
      minWidth: 56,
    },
    numberText: {
      ...baseStyles.numberText,
      fontSize: 18,
    },
    reorderButton: {
      ...baseStyles.reorderButton,
      padding: 6,
      minWidth: 48,
      minHeight: 48,
    },
    actionButton: {
      ...baseStyles.actionButton,
      padding: 6,
      minWidth: 48,
      minHeight: 48,
    },
    actionCircle: {
      ...baseStyles.actionCircle,
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    completionCircle: {
      ...baseStyles.completionCircle,
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    checkmark: {
      ...baseStyles.checkmark,
      fontSize: 20,
    },
  });
};
