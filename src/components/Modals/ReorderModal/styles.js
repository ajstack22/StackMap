import { StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, COLORS, SHADOWS } from '../../../constants';

export const styles = StyleSheet.create({
  reorderModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reorderModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: RADIUS.lg,
    padding: 24,
    ...SHADOWS.level3,
  },
  reorderModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'center',
    marginBottom: 20,
  },
  reorderActivityPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: RADIUS.md,
    marginBottom: 20,
  },
  reorderActivityEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  reorderActivityText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
  },
  reorderModalLabel: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginBottom: 16,
    textAlign: 'center',
  },
  positionSelector: {
    maxHeight: 60,
    marginBottom: 20,
  },
  positionSelectorContent: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  positionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  positionButtonCurrent: {
    borderWidth: 2,
  },
  positionButtonSelected: {
    borderWidth: 0,
  },
  positionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
  },
  positionPreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  positionPreviewText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  formPanel: {
    backgroundColor: '#f9f9f9',
    borderRadius: RADIUS.md,
    padding: 20,
  },
  positionSection: {
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});