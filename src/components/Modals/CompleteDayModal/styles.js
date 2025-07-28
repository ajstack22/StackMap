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
  // 🚨 CRITICAL iOS FIX - DO NOT CHANGE 🚨
  // iOS modals will expand beyond content without these EXACT constraints
  modalScrollView: {
    flex: 1,  // REQUIRED: Must have flex: 1 for proper iOS layout
  },
  scrollContent: {
    // CRITICAL: iOS must NOT have flexGrow or panels become huge
    ...(Platform.OS === 'ios' ? {} : { flexGrow: 1 }),
  },
  
  // Top Action Container
  topActionContainer: {
    backgroundColor: '#f8f9fa',
    padding: SPACING.lg,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    ...(Platform.OS === 'ios' && {
      alignSelf: 'stretch',
    }),
  },
  topIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  explanationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  explanationSubtext: {
    fontSize: 14,
    color: '#000',  // Changed from #666 for accessibility
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  
  // Sections
  section: {
    backgroundColor: 'white',
    marginTop: SPACING.md,
    marginBottom: 0,
    marginHorizontal: SPACING.md,  // Same as summary/top containers
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && {
      alignSelf: 'stretch',
    }),
  },
  sectionInner: {
    padding: SPACING.lg,
    // 🚨 CRITICAL iOS CONSTRAINT - NEVER REMOVE 🚨
    // Without these exact values, panels will expand to fill screen
    ...(Platform.OS === 'ios' && {
      flex: 0,       // MUST be 0 to prevent expansion
      flexGrow: 0,   // MUST be 0 to prevent growing
      flexShrink: 1, // Allow shrinking if needed
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,  // Reduced margin
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
  },
  sectionCount: {
    fontSize: 16,
    color: '#666',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginLeft: SPACING.xs,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#000',  // Changed for accessibility
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginBottom: SPACING.md,
    lineHeight: 18,
    textAlign: 'center',
  },
  
  // Activities Container
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',  // Center the activity cards
    marginTop: SPACING.sm,
    marginLeft: -SPACING.xs,
    marginRight: -SPACING.xs,
    ...(Platform.OS === 'ios' && {
      width: '100%',
      flexGrow: 0, // Prevent expansion
      flexShrink: 1, // Allow shrinking
    }),
  },
  
  // Activity Card
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: RADIUS.md,
    paddingVertical: Platform.OS === 'ios' ? 8 : 12,
    paddingHorizontal: Platform.OS === 'ios' ? 8 : 16, // Reduced iOS padding for more text space
    marginLeft: Platform.OS === 'ios' ? 4 : SPACING.xs,
    marginRight: Platform.OS === 'ios' ? 4 : SPACING.xs,
    marginBottom: Platform.OS === 'ios' ? 6 : SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    minHeight: Platform.OS === 'ios' ? 36 : 44,
    flexBasis: 'auto', // Allow cards to size based on content
    flexGrow: 0,
    // 🚨 iOS HEIGHT FIX - REQUIRED TO PREVENT PANEL EXPANSION 🚨
    ...(Platform.OS === 'ios' && {
      height: 'auto',    // Let height adjust to content
      maxHeight: 60,     // Prevent excessive expansion
      minWidth: '45%',   // Take up more width to show text
    }),
  },
  actionIcon: {
    marginLeft: SPACING.sm,
  },
  activityEmoji: {
    fontSize: 18,
    marginRight: Platform.OS === 'ios' ? 6 : SPACING.sm, // Less margin on iOS
  },
  activityTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 14,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  activityText: {
    fontSize: 12,
    color: '#000',  // Changed from #666 for accessibility
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#000',  // Changed from #999 for accessibility
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontStyle: 'italic',
    padding: SPACING.md,
    textAlign: 'center',
    width: '100%',
  },
  
  // Summary
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    padding: SPACING.lg,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...(Platform.OS === 'ios' && {
      alignSelf: 'stretch',
    }),
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryIcon: {
    marginRight: SPACING.xs,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
  },
  summaryContent: {
    gap: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  summaryText: {
    fontSize: 14,
    color: '#000',  // Changed from #333 for consistency
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    flex: 1,
  },
  
  // Actions
  actionContainer: {
    backgroundColor: 'white',
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: RADIUS.full,
    marginTop: SPACING.lg,
    ...SHADOWS.level2,
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    letterSpacing: 0.3,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
});