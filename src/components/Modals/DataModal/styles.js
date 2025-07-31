import { StyleSheet, Platform } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants';

export const styles = StyleSheet.create({
  // Section styles
  section: {
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
  },
  
  // Empty state
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#333',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#999',
    marginTop: SPACING.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  // Export selection cards
  selectionCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  checkboxContainer: {
    marginRight: SPACING.md,
  },
  selectionContent: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginBottom: 2,
  },
  selectionDescription: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
  },
  selectionCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
  },
  
  // Import styles
  fileInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  fileInfoContent: {
    flex: 1,
  },
  fileInfoName: {
    fontSize: 15,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
  },
  fileInfoDate: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    marginTop: 2,
  },
  
  importModeContainer: {
    marginBottom: SPACING.lg,
  },
  importModeTitle: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginBottom: SPACING.sm,
  },
  importModeOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  importModeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: SPACING.sm,
  },
  importModeOptionActive: {
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
  },
  importModeText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#666',
  },
  importModeTextActive: {
    color: '#000',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  importModeDescription: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    textAlign: 'center',
  },
  
  importSelectionsContainer: {
    marginTop: SPACING.md,
  },
  importCategory: {
    marginTop: SPACING.md,
  },
  importCategoryTitle: {
    fontSize: 15,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginBottom: SPACING.sm,
  },
  importItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    gap: SPACING.sm,
  },
  importItemEmoji: {
    fontSize: 20,
  },
  importItemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  importItemCount: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
  },
  selectAllButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.small,
    backgroundColor: '#f5f5f5',
  },
  selectAllText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
  },
  
  // Sync styles
  syncInfoContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  syncTitle: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  syncDescription: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  syncFeatures: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  syncFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  syncFeatureText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
  },
  
  syncStatusCard: {
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  syncStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  syncStatusInfo: {
    flex: 1,
  },
  syncStatusTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
  },
  syncStatusId: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    marginTop: 2,
  },
  
  recoveryPhraseCard: {
    backgroundColor: '#fff3e0',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  recoveryPhraseWarning: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#f57c00',
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  recoveryPhraseContainer: {
    backgroundColor: 'white',
    borderRadius: RADIUS.small,
    padding: SPACING.md,
    width: '100%',
    marginBottom: SPACING.md,
  },
  recoveryPhrase: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#000',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  recoveryInputContainer: {
    marginBottom: SPACING.md,
  },
  recoveryInput: {
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  syncActions: {
    gap: SPACING.sm,
  },
  syncActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: SPACING.sm,
  },
  syncActionText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
  },
  
  // Buttons
  buttonContainer: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.medium,
    gap: SPACING.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  dangerButton: {
    borderColor: '#ffcdd2',
    backgroundColor: '#ffebee',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: RADIUS.small,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#d32f2f',
  },
  
  // Share styles
  syncRequiredContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  syncRequiredTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  syncRequiredText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  shareSection: {
    marginBottom: SPACING.lg,
  },
  shareSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  shareSectionTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
  },
  
  userSelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  userSelectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: SPACING.sm,
    minWidth: 120,
  },
  userSelectionCardActive: {
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
  },
  userSelectionEmoji: {
    fontSize: 24,
  },
  userSelectionName: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
    flex: 1,
  },
  
  shareField: {
    marginBottom: SPACING.md,
  },
  shareFieldLabel: {
    fontSize: 14,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginBottom: SPACING.xs,
  },
  shareInput: {
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  expirationOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  expirationOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  expirationOptionActive: {
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
  },
  expirationOptionText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#666',
  },
  expirationOptionTextActive: {
    color: '#000',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  
  shareOptions: {
    gap: SPACING.sm,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  shareOptionText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  
  userSharesContainer: {
    marginTop: SPACING.md,
  },
  userSharesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  userSharesEmoji: {
    fontSize: 20,
  },
  userSharesName: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    flex: 1,
  },
  userSharesCount: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
  },
  
  activeShareCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  activeShareInfo: {
    flex: 1,
  },
  activeShareRecipient: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
    marginBottom: 2,
  },
  activeShareDate: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
  },
  activeShareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: 4,
  },
  activeShareBadgeText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#4caf50',
  },
  activeShareDelete: {
    padding: SPACING.xs,
  },
  
  shareSuccessContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  shareSuccessTitle: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  shareUrlContainer: {
    width: '100%',
  },
  shareUrlLabel: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  shareUrlBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  shareUrl: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#000',
    textAlign: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  qrCodeLabel: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
    marginBottom: SPACING.md,
  },
});