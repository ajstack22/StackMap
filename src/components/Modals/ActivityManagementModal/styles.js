import { StyleSheet, Platform, Dimensions } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, isMobile } from '../../../constants';

const { width: screenWidth } = Dimensions.get('window');
const IS_MOBILE = isMobile(screenWidth);

export const styles = StyleSheet.create({
  // Container styles
  scrollContainer: {
    paddingTop: SPACING.md,  // Standardized top padding (16px)
    paddingBottom: 80,       // Consistent bottom padding for all tabs
    // Remove horizontal padding - handled by addFormContainer
    // iOS constraint to prevent overgrowth
    ...(Platform.OS === 'ios' ? {} : { flexGrow: 1 }),
  },
  contentSection: {
    marginHorizontal: IS_MOBILE ? SPACING.xs : SPACING.md,
    marginVertical: SPACING.sm,
    ...(!IS_MOBILE && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  // Library Tab Styles
  libraryContentPanel: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: IS_MOBILE ? 16 : 20,
    marginVertical: IS_MOBILE ? 16 : 20,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...(!IS_MOBILE && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
    // iOS max height constraint to prevent oversized panels
    ...(Platform.OS === 'ios' && IS_MOBILE && {
      maxHeight: '80%',
    }),
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    } : Platform.OS === 'android' ? {
      elevation: 1,
    } : {
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }),
  },
  searchContainer: {
    paddingHorizontal: IS_MOBILE ? 16 : 20,
    paddingTop: IS_MOBILE ? 16 : 20,
    paddingBottom: 12,
    ...(!IS_MOBILE && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  listContainer: {
    paddingHorizontal: IS_MOBILE ? 16 : 20,
    // paddingBottom handled by scrollContainer
    ...(!IS_MOBILE && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
    // iOS constraints to prevent panels from being too large
    ...(Platform.OS === 'ios' && { 
      flex: 0, 
      flexGrow: 0, 
      flexShrink: 1 
    }),
  },
  categoryContainer: {
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  categoryNameInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 0,
  },
  activityCount: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    marginRight: 12,
  },
  activitiesList: {
    paddingBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    // iOS height constraint to prevent oversized cards
    ...(Platform.OS === 'ios' && { 
      height: 48, 
      maxHeight: 48 
    }),
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginRight: 12,
  },
  activityName: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    flex: 1,
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 8,
  },
  addAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    marginRight: 8,
  },
  addAllButtonText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
  },
  editingActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  emojiInput: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    width: 40,
    textAlign: 'center',
    marginRight: 12,
  },
  nameInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 4,
    color: '#000',
  },
  saveButton: {
    padding: 8,
    marginLeft: 8,
  },
  cancelButton: {
    padding: 8,
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addActivityText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    marginLeft: 8,
  },
  addActivityForm: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addCategoryForm: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {
      elevation: 5,
    }),
  },
  addCategoryActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
  },

  // Add Tab Styles
  addFormContainer: {
    paddingHorizontal: IS_MOBILE ? 12 : 20,
    paddingTop: 0,  // Content already has padding from scrollContainer
    paddingBottom: IS_MOBILE ? 12 : 20,
    ...(!IS_MOBILE && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  formPanel: {
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    padding: IS_MOBILE ? 16 : 20,
    marginBottom: IS_MOBILE ? 16 : 20,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : Platform.OS === 'android' ? {
      elevation: 3,
    } : {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }),
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emojiSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedEmoji: {
    fontSize: 32,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginRight: 12,
  },
  emojiSelectorText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  categorySelector: {
    marginTop: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: '#e6f2ff',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  categoryChipTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  quickTemplates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickTemplate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  quickTemplateIcon: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  quickTemplateText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    gap: 8,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : Platform.OS === 'android' ? {
      elevation: 2,
    } : {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }),
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginHorizontal: -20,
  },
  notification: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    zIndex: 9999,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    } : Platform.OS === 'android' ? {
      elevation: 5,
    } : {
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    }),
  },
  notificationText: {
    color: 'white',
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Library tabs
  libraryTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: IS_MOBILE ? 12 : 20,
    paddingTop: IS_MOBILE ? 8 : 12,
    paddingBottom: 8,
    gap: 8,
    ...(!IS_MOBILE && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  libraryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: RADIUS.md,
    gap: 6,
  },
  activeLibraryTab: {
    backgroundColor: '#007AFF',
  },
  libraryTabText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: '500',
    color: '#666',
  },
  activeLibraryTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Section headers for library sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#000',
  },
});