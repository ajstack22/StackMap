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
    borderTopLeftRadius: RADIUS.xl || 16,
    borderTopRightRadius: RADIUS.xl || 16,
    paddingTop: SPACING.lg || 24,
    maxHeight: '90%',
    ...SHADOWS.level3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 24,
    paddingBottom: SPACING.md || 16,
    borderBottomWidth: 1,
    borderBottomColor: modalColors.borderLight,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl || 20,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: modalColors.text,
  },
  closeButton: {
    padding: SPACING.sm || 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg || 24,
  },
  section: {
    paddingVertical: SPACING.lg || 24,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg || 18,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: modalColors.text,
    marginBottom: SPACING.md || 16,
  },
  inputGroup: {
    marginBottom: SPACING.md || 16,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md || 16,
    color: modalColors.textSecondary,
    marginBottom: SPACING.sm || 8,
  },
  input: {
    borderWidth: 1,
    borderColor: modalColors.borderLight,
    borderRadius: RADIUS.md || 8,
    padding: SPACING.md || 16,
    fontSize: TYPOGRAPHY.sizes.md || 16,
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
    marginHorizontal: -(SPACING.xs || 4),
  },
  expirationOption: {
    paddingHorizontal: SPACING.md || 16,
    paddingVertical: SPACING.sm || 8,
    borderRadius: RADIUS.md || 8,
    borderWidth: 1,
    borderColor: modalColors.borderLight,
    backgroundColor: modalColors.backgroundLight,
    marginHorizontal: SPACING.xs || 4,
    marginBottom: SPACING.sm || 8,
  },
  expirationOptionActive: {
    borderColor: modalColors.primary,
    backgroundColor: modalColors.primary + '20',
  },
  expirationOptionText: {
    fontSize: TYPOGRAPHY.sizes.sm || 14,
    color: modalColors.textSecondary,
  },
  expirationOptionTextActive: {
    color: modalColors.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  checkboxGroup: {
    marginTop: SPACING.md || 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm || 8,
  },
  checkboxLabel: {
    marginLeft: SPACING.sm || 8,
    fontSize: TYPOGRAPHY.sizes.md || 16,
    color: modalColors.text,
  },
  tokenPreview: {
    backgroundColor: modalColors.backgroundLight,
    borderRadius: RADIUS.md || 8,
    padding: SPACING.lg || 24,
    alignItems: 'center',
    marginVertical: SPACING.lg || 24,
  },
  tokenLabel: {
    fontSize: TYPOGRAPHY.sizes.sm || 14,
    color: modalColors.textSecondary,
    marginBottom: SPACING.sm || 8,
  },
  tokenText: {
    fontSize: TYPOGRAPHY.sizes.xxl || 24,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: modalColors.primary,
    letterSpacing: 2,
  },
  tokenHint: {
    fontSize: TYPOGRAPHY.sizes.sm || 14,
    color: modalColors.textSecondary,
    marginTop: SPACING.sm || 8,
  },
  createButton: {
    backgroundColor: modalColors.primary,
    borderRadius: RADIUS.md || 8,
    paddingVertical: SPACING.md || 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg || 24,
    ...SHADOWS.level2,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md || 16,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.sm || 8,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl || 32,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.sizes.xl || 20,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: modalColors.text,
    marginTop: SPACING.md || 16,
    marginBottom: SPACING.lg || 24,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modalColors.backgroundLight,
    borderRadius: RADIUS.md || 8,
    padding: SPACING.md || 16,
    marginBottom: SPACING.md || 16,
    width: '100%',
  },
  urlText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm || 14,
    color: modalColors.text,
    marginRight: SPACING.sm || 8,
  },
  copyButton: {
    padding: SPACING.sm || 8,
  },
  recipientInfo: {
    fontSize: TYPOGRAPHY.sizes.md || 16,
    color: modalColors.textSecondary,
    marginBottom: SPACING.sm || 8,
  },
  expirationInfo: {
    fontSize: TYPOGRAPHY.sizes.sm || 14,
    color: modalColors.textSecondary,
    marginBottom: SPACING.lg || 24,
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    padding: SPACING.lg || 24,
    borderRadius: RADIUS.md || 8,
    marginBottom: SPACING.md || 16,
    alignItems: 'center',
    ...SHADOWS.level2,
  },
  qrCodeHint: {
    fontSize: TYPOGRAPHY.sizes.sm || 14,
    color: modalColors.textSecondary,
    marginBottom: SPACING.md || 16,
    textAlign: 'center',
  },
  newShareButton: {
    paddingVertical: SPACING.md || 16,
    paddingHorizontal: SPACING.lg || 24,
    borderRadius: RADIUS.md || 8,
    borderWidth: 1,
    borderColor: modalColors.primary,
  },
  newShareButtonText: {
    color: modalColors.primary,
    fontSize: TYPOGRAPHY.sizes.md || 16,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  activeSharesSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight || modalColors.borderLight,
    paddingTop: SPACING.lg || 24,
    marginTop: SPACING.lg || 24,
  },
  activeSharesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md || 16,
  },
  activeSharesTitle: {
    fontSize: TYPOGRAPHY.sizes.md || 16,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: modalColors.text,
  },
  sharesList: {
    marginTop: SPACING.sm || 8,
  },
  shareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: modalColors.backgroundLight,
    borderRadius: RADIUS.md || 8,
    padding: SPACING.md || 16,
    marginBottom: SPACING.sm || 8,
  },
  shareItemInfo: {
    flex: 1,
  },
  shareItemToken: {
    fontSize: TYPOGRAPHY.sizes.md || 16,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: modalColors.text,
    marginBottom: 2,
  },
  shareItemRecipient: {
    fontSize: TYPOGRAPHY.sizes.sm || 14,
    color: modalColors.textSecondary,
    marginBottom: 2,
  },
  shareItemExpires: {
    fontSize: TYPOGRAPHY.sizes.sm || 14,
    color: modalColors.textSecondary,
  },
  deleteShareButton: {
    padding: SPACING.sm || 8,
    marginLeft: SPACING.sm || 8,
  },
});

export default styles;