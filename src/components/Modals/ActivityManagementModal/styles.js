import { StyleSheet, Platform } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS } from '../../../constants';

export const styles = StyleSheet.create({
  // Container styles
  scrollContainer: {
    paddingVertical: SPACING.sm,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: SPACING.lg,
    }),
  },
  contentSection: {
    marginHorizontal: SPACING.xs, // Reduced from SPACING.md
    marginVertical: SPACING.sm,
    ...(Platform.OS === 'web' && {
      marginHorizontal: SPACING.md, // Keep original spacing on web
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  // Library Tab Styles
  searchContainer: {
    paddingHorizontal: 12, // Reduced from 20
    paddingTop: 12, // Reduced from 20
    paddingBottom: 10,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: 20, // Keep original padding on web
      paddingTop: 20,
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  listContainer: {
    paddingHorizontal: 12, // Reduced from 20
    paddingBottom: 100,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: 20, // Keep original padding on web
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  categoryContainer: {
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  categoryNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 0,
  },
  activityCount: {
    fontSize: 14,
    color: '#000',
    marginRight: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
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
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  activityName: {
    fontSize: 15,
    color: '#000',
    flex: 1,
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chooseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chooseButtonText: {
    color: 'white',
    fontSize: 13,
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
    width: 40,
    textAlign: 'center',
    marginRight: 12,
  },
  nameInput: {
    flex: 1,
    fontSize: 15,
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
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },

  // Add Tab Styles
  addFormContainer: {
    padding: 12, // Reduced from 20
    ...(Platform.OS === 'web' && {
      padding: 20, // Keep original padding on web
    }),
  },
  formPanel: {
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    padding: 16, // Reduced from 20
    marginBottom: 16, // Reduced from 20
    ...(Platform.OS === 'web' && {
      padding: 20, // Keep original padding on web
      marginBottom: 20,
    }),
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
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    marginRight: 12,
  },
  emojiSelectorText: {
    fontSize: 16,
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
  },
  quickTemplateText: {
    fontSize: 14,
    color: '#000',
  },
});