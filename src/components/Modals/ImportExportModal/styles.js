import { StyleSheet } from 'react-native';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: SPACING.sm,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  tabTextActive: {
    color: '#333',
  },
  
  // Content styles
  tabContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#333',
    marginLeft: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  
  // Selection card styles
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.level2,
  },
  checkboxContainer: {
    marginRight: SPACING.sm,
  },
  selectionContent: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#333',
    marginBottom: 2,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  selectionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#666',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  selectionCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    marginLeft: SPACING.sm,
  },
  countText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#666',
    marginRight: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  
  // Button styles
  buttonContainer: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    ...SHADOWS.level2,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
    marginLeft: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  
  // Import specific styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#999',
    marginTop: SPACING.md,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  
  // File info card
  fileInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fileInfoContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  fileInfoName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#333',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  fileInfoDate: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#666',
    marginTop: 2,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  
  // Import mode styles
  importModeContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.level1,
  },
  importModeTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#333',
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  importModeOptions: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  importModeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  importModeOptionActive: {
    borderColor: 'transparent',
    backgroundColor: '#f0f8ff',
  },
  importModeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#666',
    marginLeft: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  importModeTextActive: {
    color: '#333',
  },
  importModeDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  
  // Import selections
  importSelectionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.level1,
  },
  importCategory: {
    marginBottom: SPACING.lg,
  },
  importCategoryTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#333',
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  importItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  importItemEmoji: {
    fontSize: TYPOGRAPHY.sizes.xl,
    marginHorizontal: SPACING.sm,
  },
  importItemText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#333',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  importItemCount: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#666',
    marginLeft: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  selectAllButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: '#f5f5f5',
    marginTop: SPACING.xs,
  },
  selectAllText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#666',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
});