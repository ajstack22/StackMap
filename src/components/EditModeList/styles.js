import { StyleSheet, Platform } from 'react-native';

// Base styles used on all platforms
const baseStyles = {
  listContainer: {
    paddingVertical: 8,
  },
  
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
  },
  
  listItem: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }
    })
  },
  
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  emoji: {
    fontSize: Platform.select({
      web: 28,
      default: 24
    }),
    marginRight: 12,
  },
  
  textContent: {
    flex: 1,
  },
  
  title: {
    fontSize: 16,
    fontFamily: 'ComicRelief',
    color: '#000',
    fontWeight: Platform.select({
      ios: '700',
      android: '800',
      web: '600'
    }),
  },
  
  description: {
    fontSize: 14,
    fontFamily: 'ComicRelief',
    color: '#666',
    marginTop: 2,
  },
  
  positionText: {
    fontSize: 12,
    fontFamily: 'ComicRelief',
    color: '#999',
    marginLeft: 8,
  },
  
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f0f0f0',
  },
  
  reorderButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  
  reorderButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
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
    padding: 8,
    borderRadius: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  disabled: {
    opacity: 0.5,
  }
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
    },
    emoji: {
      ...baseStyles.emoji,
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
    positionText: {
      ...baseStyles.positionText,
      fontSize: 14,
    },
    reorderButton: {
      ...baseStyles.reorderButton,
      padding: 10,
      minWidth: 48,
      minHeight: 48,
    },
    actionButton: {
      ...baseStyles.actionButton,
      padding: 10,
      minWidth: 48,
      minHeight: 48,
    }
  });
};