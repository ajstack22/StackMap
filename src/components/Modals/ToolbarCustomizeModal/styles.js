import { StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants';

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
    ...SHADOWS.level3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: SPACING.lg,
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  buttonsList: {
    marginBottom: SPACING.lg,
  },
  buttonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
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
    color: COLORS.gray[500],
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
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  previewToolbar: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
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
    borderRadius: RADIUS.lg,
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
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  saveButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});