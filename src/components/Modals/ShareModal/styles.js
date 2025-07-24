import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../constants';

// Additional color definitions for the modal
const modalColors = {
  primary: '#667eea',
  text: '#1a202c',
  textSecondary: '#718096',
  borderLight: '#e2e8f0',
  backgroundLight: '#f7fafc',
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: RADIUS.xlarge,
    borderTopRightRadius: RADIUS.xlarge,
    paddingTop: SPACING.large,
    maxHeight: '90%',
    ...SHADOWS.level3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.large,
    paddingBottom: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: modalColors.borderLight,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xlarge,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: modalColors.text,
  },
  closeButton: {
    padding: SPACING.small,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.large,
  },
  section: {
    paddingVertical: SPACING.large,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.large,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: modalColors.text,
    marginBottom: SPACING.medium,
  },
  inputGroup: {
    marginBottom: SPACING.medium,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.medium,
    color: modalColors.textSecondary,
    marginBottom: SPACING.small,
  },
  input: {
    borderWidth: 1,
    borderColor: modalColors.borderLight,
    borderRadius: RADIUS.medium,
    padding: SPACING.medium,
    fontSize: TYPOGRAPHY.sizes.medium,
    color: modalColors.text,
    backgroundColor: modalColors.backgroundLight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  expirationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
  },
  expirationOption: {
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: modalColors.borderLight,
    backgroundColor: modalColors.backgroundLight,
  },
  expirationOptionActive: {
    borderColor: modalColors.primary,
    backgroundColor: modalColors.primary + '20',
  },
  expirationOptionText: {
    fontSize: TYPOGRAPHY.sizes.small,
    color: modalColors.textSecondary,
  },
  expirationOptionTextActive: {
    color: modalColors.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  checkboxGroup: {
    marginTop: SPACING.medium,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  checkboxLabel: {
    marginLeft: SPACING.small,
    fontSize: TYPOGRAPHY.sizes.medium,
    color: modalColors.text,
  },
  tokenPreview: {
    backgroundColor: modalColors.backgroundLight,
    borderRadius: RADIUS.medium,
    padding: SPACING.large,
    alignItems: 'center',
    marginVertical: SPACING.large,
  },
  tokenLabel: {
    fontSize: TYPOGRAPHY.sizes.small,
    color: modalColors.textSecondary,
    marginBottom: SPACING.small,
  },
  tokenText: {
    fontSize: TYPOGRAPHY.sizes.xxlarge,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: modalColors.primary,
    letterSpacing: 2,
  },
  tokenHint: {
    fontSize: TYPOGRAPHY.sizes.small,
    color: modalColors.textSecondary,
    marginTop: SPACING.small,
  },
  createButton: {
    backgroundColor: modalColors.primary,
    borderRadius: RADIUS.medium,
    paddingVertical: SPACING.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.large,
    ...SHADOWS.level2,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.medium,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.small,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xlarge,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.sizes.xlarge,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: modalColors.text,
    marginTop: SPACING.medium,
    marginBottom: SPACING.large,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modalColors.backgroundLight,
    borderRadius: RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
    width: '100%',
  },
  urlText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.small,
    color: modalColors.text,
    marginRight: SPACING.small,
  },
  copyButton: {
    padding: SPACING.small,
  },
  recipientInfo: {
    fontSize: TYPOGRAPHY.sizes.medium,
    color: modalColors.textSecondary,
    marginBottom: SPACING.small,
  },
  expirationInfo: {
    fontSize: TYPOGRAPHY.sizes.small,
    color: modalColors.textSecondary,
    marginBottom: SPACING.large,
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    padding: SPACING.large,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.medium,
    alignItems: 'center',
    ...SHADOWS.level2,
  },
  qrCodeHint: {
    fontSize: TYPOGRAPHY.sizes.small,
    color: modalColors.textSecondary,
    marginBottom: SPACING.medium,
    textAlign: 'center',
  },
  newShareButton: {
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: modalColors.primary,
  },
  newShareButtonText: {
    color: modalColors.primary,
    fontSize: TYPOGRAPHY.sizes.medium,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  activeSharesSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.large,
    marginTop: SPACING.large,
  },
  activeSharesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.medium,
  },
  activeSharesTitle: {
    fontSize: TYPOGRAPHY.sizes.medium,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: modalColors.text,
  },
  sharesList: {
    marginTop: SPACING.small,
  },
  shareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: modalColors.backgroundLight,
    borderRadius: RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.small,
  },
  shareItemInfo: {
    flex: 1,
  },
  shareItemToken: {
    fontSize: TYPOGRAPHY.sizes.medium,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: modalColors.text,
    marginBottom: 2,
  },
  shareItemRecipient: {
    fontSize: TYPOGRAPHY.sizes.small,
    color: modalColors.textSecondary,
    marginBottom: 2,
  },
  shareItemExpires: {
    fontSize: TYPOGRAPHY.sizes.small,
    color: modalColors.textSecondary,
  },
  deleteShareButton: {
    padding: SPACING.small,
    marginLeft: SPACING.small,
  },
});

export default styles;