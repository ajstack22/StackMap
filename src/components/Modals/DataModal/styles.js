import { StyleSheet, Platform, Dimensions } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS, isMobile } from '../../../constants';

const { width: screenWidth } = Dimensions.get('window');
const IS_MOBILE = isMobile(screenWidth);

export const styles = StyleSheet.create({
  // Container styles
  scrollContainer: {
    paddingTop: SPACING.md,  // Standardized top padding (16px)
    paddingBottom: 80,       // Consistent bottom padding for all tabs
    ...(Platform.OS === 'web' && {
      paddingHorizontal: SPACING.lg,
    }),
  },
  
  // Section styles
  section: {
    marginHorizontal: IS_MOBILE ? SPACING.xs : SPACING.md,
    marginVertical: SPACING.sm,
    padding: IS_MOBILE ? SPACING.sm : SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
    }),
    ...(!IS_MOBILE && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
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
  sectionFooter: {
    marginTop: SPACING.md,
  },
  
  // Empty state
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.md,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    marginTop: SPACING.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  // Export selection cards
  selectionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    elevation: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
    }),
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
    color: '#000',
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
    color: '#000',
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
    color: '#000',
  },
  importModeTextActive: {
    color: '#000',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  importModeDescription: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
    color: '#000',
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
    alignItems: 'center',
  },
  syncFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    minWidth: 250,
    alignSelf: 'center',
  },
  syncFeatureText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
  },
  
  syncStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.lg,
    marginHorizontal: 0,
    elevation: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
      },
    }),
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
    flexDirection: 'column',  // Ensure vertical layout
    width: '100%',
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
    flexDirection: 'column',
    alignItems: 'center',
  },
  recoveryPhrase: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#000',
    marginBottom: SPACING.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  recoveryInputContainer: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#333',
    marginBottom: SPACING.xs,
  },
  inputHelperText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  recoveryInput: {
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    fontSize: Platform.OS === 'web' ? 14 : 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#000',
    minHeight: Platform.OS === 'web' ? 60 : 50,
    textAlignVertical: 'top',
    width: '100%',
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.md,
    alignItems: 'center',
  },
  inPanelButtonContainer: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'center',
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    gap: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        ':hover': {
          borderColor: '#BDBDBD',
          backgroundColor: '#FAFAFA',
        },
      },
    }),
  },
  dangerButton: {
    borderColor: '#ffcdd2',
    backgroundColor: '#ffebee',
  },
  disabledButton: {
    opacity: 0.5,
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
    justifyContent: 'center',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: SPACING.sm,
    minWidth: 150,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 1,
      },
      web: {
        transition: 'all 0.2s ease',
      },
    }),
  },
  userSelectionCardActive: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
    elevation: 2,
  },
  userSelectionEmoji: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  userSelectionName: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
    flex: 1,
    minWidth: 60,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
  shareInfoBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    width: '100%',
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  shareInfoLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#666',
    marginBottom: SPACING.xs,
  },
  shareInfoValue: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#000',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  shareActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  mobileShareActions: {
    width: '100%',
  },
  syncActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  mobileSyncActions: {
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '100%',
    marginVertical: SPACING.lg,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    backgroundColor: '#FFFFFF',
    padding: SPACING.xl,
    marginHorizontal: SPACING.md,
    borderRadius: 16,
    elevation: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
      },
    }),
  },
  qrCodeLabel: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
    marginBottom: SPACING.md,
  },
  syncUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: SPACING.sm,
  },
  syncUrlText: {
    flex: 1,
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    marginRight: SPACING.sm,
  },
  copyIconButton: {
    padding: SPACING.xs,
  },
  keyActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.md,
    gap: SPACING.md,
  },
  keyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: SPACING.xs,
  },
  keyActionButtonText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#333',
  },
  shareKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  
  // Reset styles
  resetWarningContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  resetWarningTitle: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  resetWarningText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  resetInfoSection: {
    backgroundColor: '#ffebee',
    borderRadius: RADIUS.medium,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
  },
  resetInfoTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
    marginBottom: SPACING.md,
  },
  resetInfoList: {
    gap: SPACING.sm,
  },
  resetInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resetInfoText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  resetNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: RADIUS.small,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  resetNoteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
  },
});