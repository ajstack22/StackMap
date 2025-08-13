import { StyleSheet, Platform, Dimensions } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, COLORS, SHADOWS } from '../../../constants';

const { height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  bottomSheetContainer: {
    borderTopLeftRadius: RADIUS.xl || 24,
    borderTopRightRadius: RADIUS.xl || 24,
    maxHeight: screenHeight * 0.85,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopLeftRadius: RADIUS.xl || 24,
    borderTopRightRadius: RADIUS.xl || 24,
  },
  
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
  },
  
  bottomSheetContent: {
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
  },
  
  // White panels with rounded corners
  whitePanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg || 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  panelTitle: {
    fontSize: 14,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#666',
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Activity card in panel
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
  },
  
  activityEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  
  activityTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  
  // Neighbors visualization
  neighborsContainer: {
    alignItems: 'stretch',
  },
  
  neighborSection: {
    marginBottom: SPACING.sm,
  },
  
  neighborLabel: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#999',
    marginBottom: SPACING.xs,
  },
  
  neighborCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    borderRadius: RADIUS.medium,
    padding: SPACING.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  
  neighborEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  
  neighborText: {
    flex: 1,
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#333',
  },
  
  neighborPlaceholder: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#999',
    fontStyle: 'italic',
    padding: SPACING.sm,
  },
  
  currentPositionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.medium,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  
  currentPositionText: {
    fontSize: 14,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
    marginLeft: SPACING.xs,
  },
  
  // Position controls
  positionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: '#F8F9FA',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
  },
  
  positionIndicator: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  
  positionLabel: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#999',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  
  positionNumber: {
    fontSize: 28,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  
  arrowIcon: {
    marginHorizontal: SPACING.md,
  },
  
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: SPACING.sm,
  },
  
  sliderLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#333',
    minWidth: 25,
    textAlign: 'center',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  inputLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#333',
    marginRight: SPACING.md,
  },
  
  positionInput: {
    flex: 1,
    maxWidth: 80,
    borderWidth: 1,
    borderRadius: RADIUS.small,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.medium,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8E9EA',
    gap: SPACING.xs,
  },
  
  quickButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  
  quickButtonText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  
  disabledText: {
    color: '#ccc',
  },
  
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
  },
  
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  
  cancelButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#333',
  },
  
  confirmButton: {},
  
  confirmButtonText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
  },

  // Legacy styles (kept for backwards compatibility but unused)
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
    overflow: 'hidden',
    ...SHADOWS.level3,
  },
  reorderModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'center',
    marginBottom: 20,
    width: '100%',
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
    height: 60,
    marginBottom: 20,
    ...(Platform.OS === 'web' ? {
      overflowX: 'auto',
      overflowY: 'hidden',
    } : {
      overflow: 'hidden',
    }),
  },
  positionSelectorContent: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'center',
    minHeight: 60,
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
    width: '100%',
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
    overflow: 'hidden',
  },
  positionSection: {
    alignItems: 'center',
    width: '100%',
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