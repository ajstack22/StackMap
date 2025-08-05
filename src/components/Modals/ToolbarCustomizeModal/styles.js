import { StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants';

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    color: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  modalContent: {
    padding: 20,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
      margin: '0 auto',
    }),
  },
  description: {
    fontSize: 14,
    color: '#000',
    marginBottom: SPACING.lg,
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  buttonsList: {
    marginBottom: SPACING.lg,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  buttonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.level1,
  },
  buttonItemDragging: {
    opacity: 0.8,
    borderColor: COLORS.info,
    backgroundColor: '#ebf8ff',
  },
  dragHandle: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  buttonIcon: {
    marginRight: SPACING.md,
  },
  buttonLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[900],
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  buttonPosition: {
    fontSize: 12,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  overflowIndicator: {
    backgroundColor: '#fffff0',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  overflowText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  webButtonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.level1,
  },
  buttonItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  webButtonControls: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderLeftWidth: 1,
    borderLeftColor: COLORS.gray[200],
  },
  webControlButton: {
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webControlButtonDisabled: {
    opacity: 0.3,
  },
  morePositionSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    padding: 4,
  },
  toggle: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: 'white',
    ...SHADOWS.level1,
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  toggleTextActive: {
    color: COLORS.gray[900],
    fontWeight: '600',
  },
  previewSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  previewNote: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: SPACING.md,
    fontStyle: 'italic',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  previewToolbar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.level1,
  },
  previewButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
  },
  previewButtonIcon: {
    marginBottom: 4,
  },
  previewButtonLabel: {
    fontSize: 10,
    color: COLORS.gray[700],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  previewOverflow: {
    padding: SPACING.sm,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  resetButtonText: {
    color: COLORS.gray[700],
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  saveButton: {
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.level1,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  closeButton: {
    padding: SPACING.xs,
  },
});