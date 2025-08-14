import { StyleSheet, Platform, Dimensions } from 'react-native';
import { SPACING, RADIUS, TYPOGRAPHY, isMobile } from '../../../constants';

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
  contentSection: {
    marginHorizontal: IS_MOBILE ? SPACING.xs : SPACING.md,
    marginTop: 0,  // Content already has padding from scrollContainer
    marginBottom: SPACING.sm,
    ...(!IS_MOBILE && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  // Standardized tab header
  standardTabContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  standardTabTitle: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  standardTabDescription: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  // Complete Tab Styles
  summarySection: {
    alignItems: 'center',
    padding: IS_MOBILE ? 16 : 20,
    marginBottom: IS_MOBILE ? 16 : 20,
  },
  summaryCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 8,
    borderColor: '#4CAF50',
  },
  summaryPercentage: {
    fontSize: 36,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  motivationalMessage: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: IS_MOBILE ? 16 : 20,
    paddingHorizontal: IS_MOBILE ? 12 : 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  activityList: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 10,
  },
  completedActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  incompleteActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    opacity: 0.7,
  },
  activityIcon: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginRight: 10,
  },
  activityText: {
    flex: 1,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    minWidth: 160,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  archiveNote: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Plan Tab Styles
  planSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  planSectionTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: 'bold',
    color: '#000',
  },
  planCount: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    marginTop: 5,
  },
  planActivityList: {
    maxHeight: 300,
  },
  planActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  planActivityCardActive: {
    backgroundColor: '#f0f0f0',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  dragButtonsContainer: {
    flexDirection: 'column',
    marginRight: 10,
  },
  dragButton: {
    padding: 4,
  },
  planActivityIcon: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginHorizontal: 10,
  },
  planActivityText: {
    flex: 1,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  removeButton: {
    padding: 4,
  },
  templateToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  templateToggleText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#000',
  },
  templateSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#000',
  },
  templateList: {
    maxHeight: 250,
  },
  templateCategory: {
    marginBottom: 15,
  },
  templateCategoryName: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  templateActivities: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
  },
  templateActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
  },
  templateActivityIcon: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginRight: 8,
  },
  templateActivityText: {
    flex: 1,
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  
  // Complete Tab Styles (from CompleteDayModal)
  completeTopActionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 0,  // Removed extra top margin for consistency
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completeSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  completeSummaryIcon: {
    marginRight: 8,
  },
  completeExplanationText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  completeExplanationSubtext: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    marginBottom: 16,
  },
  completeSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  completeSectionGrid: {
    marginHorizontal: 0,
    marginBottom: 10,
  },
  completeSectionInner: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {
      elevation: 3,
    }),
  },
  completeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  completeSectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completeSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  completeSectionTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#000',
  },
  completeSectionCount: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    marginLeft: 8,
  },
  completeSectionDescription: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    marginBottom: 12,
  },
  completeActivitiesContainer: {
    gap: 8,
  },
  completeActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  completeActivityEmoji: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginRight: 12,
  },
  completeActivityTitle: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  completeActionIcon: {
    marginLeft: 8,
  },
  completeEmptyText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  // Grid layout styles
  sectionsContainer: {
    // Default stacked layout
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 10,
    justifyContent: 'space-between',
  },
  gridSection: {
    flex: 1,
    minWidth: 250,
    maxWidth: 600,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  
  // Plan Tab Selection Mode Styles
  planSelectionSection: {
    marginHorizontal: 20,
    marginTop: 0,  // Removed extra top margin for consistency
    marginBottom: 10,
  },
  usersList: {
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  userCardActive: {
    // borderColor will be set dynamically with theme.primary
    backgroundColor: '#f5f5f5',
  },
  userEmoji: {
    fontSize: 32,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  userName: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  userNameActive: {
    fontWeight: '700',
  },
  planSectionDescription: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginBottom: 12,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  viewModeToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  viewModeToggleActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: '500',
    color: '#000',
  },
  viewModeTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  dayToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  dayToggle: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  dayToggleActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dayToggleText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: '500',
    color: '#000',
  },
  dayToggleTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  
  // Day mode toggle styles
  dayModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  dayModeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  dayModeOptionActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dayModeText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: '500',
    color: '#000',
  },
  dayModeTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  
  // Day selection cards
  dayCardsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  dayCard: {
    flex: 1,
    maxWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardActive: {
    backgroundColor: '#fff',
    // borderColor will be set dynamically with theme.primary
  },
  dayTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
  },
  dayTitleActive: {
    color: '#000',
    fontWeight: '700',
  },
  
  // Plan Tab Planning Mode Header Styles
  planModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  planHeaderInfo: {
    flex: 1,
  },
  planHeaderUser: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: '700',
    color: '#000',
  },
  planHeaderDay: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  // Panel-based design styles
  formPanel: {
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    padding: IS_MOBILE ? 16 : 20,
    marginBottom: IS_MOBILE ? 16 : 20,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : Platform.OS === 'android' ? {
      elevation: 3,
    } : {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }),
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginHorizontal: -20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    gap: 8,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : Platform.OS === 'android' ? {
      elevation: 2,
    } : {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }),
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
});