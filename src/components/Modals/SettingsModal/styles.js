import { StyleSheet, Platform, Dimensions } from 'react-native';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  isMobile,
} from '../../../constants';

const { width: screenWidth } = Dimensions.get('window');
const IS_MOBILE = isMobile(screenWidth);

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
    paddingTop: SPACING.md,
    paddingHorizontal: 0,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: SPACING.lg,
      paddingBottom: 80,
    }),
    ...(Platform.OS === 'android' && {
      flex: 1,
    }),
  },
  section: {
    marginHorizontal: IS_MOBILE ? SPACING.xs : SPACING.md,
    marginVertical: SPACING.xs,
    padding: IS_MOBILE ? SPACING.md : SPACING.lg,
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
  description: {
    fontSize: 14,
    color: '#000',
    marginBottom: SPACING.lg,
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  buttonsList: {
    marginTop: SPACING.sm,
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
  settingDescription: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginTop: SPACING.xs,
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
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: SPACING.md,
    marginHorizontal: -SPACING.md,
  },
  celebrationScrollView: {
    marginBottom: SPACING.md,
  },
  celebrationOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  celebrationOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    backgroundColor: 'white',
    minWidth: 70,
    alignItems: 'center',
  },
  celebrationActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  celebrationText: {
    fontSize: 14,
    color: COLORS.gray[700],
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  celebrationTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  // Standardized tab header
  standardTabContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  standardTabTitle: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  standardTabDescription: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
});
