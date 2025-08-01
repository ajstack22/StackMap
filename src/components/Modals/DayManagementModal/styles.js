import { StyleSheet, Platform, Dimensions } from 'react-native';
import { SPACING, isMobile } from '../../../constants';

const { width: screenWidth } = Dimensions.get('window');
const IS_MOBILE = isMobile(screenWidth);

export const styles = StyleSheet.create({
  // Container styles
  scrollContainer: {
    paddingVertical: SPACING.sm,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: SPACING.lg,
    }),
  },
  contentSection: {
    marginHorizontal: IS_MOBILE ? SPACING.xs : SPACING.md,
    marginVertical: SPACING.sm,
    ...(!IS_MOBILE && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
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
    fontWeight: 'bold',
    color: '#000',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
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
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  motivationalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: IS_MOBILE ? 16 : 20,
    paddingHorizontal: IS_MOBILE ? 12 : 20,
  },
  sectionTitle: {
    fontSize: 18,
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
    marginRight: 10,
  },
  activityText: {
    flex: 1,
    fontSize: 16,
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
    fontWeight: '600',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  archiveNote: {
    fontSize: 12,
    color: '#666',
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
    fontWeight: 'bold',
    color: '#000',
  },
  planCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
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
    marginHorizontal: 10,
  },
  planActivityText: {
    flex: 1,
    fontSize: 16,
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
    fontWeight: '600',
    color: '#666',
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
    marginRight: 8,
  },
  templateActivityText: {
    flex: 1,
    fontSize: 14,
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
    marginTop: 20,
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
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  completeExplanationSubtext: {
    fontSize: 14,
    color: '#666',
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
    fontWeight: '600',
    color: '#000',
  },
  completeSectionCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  completeSectionDescription: {
    fontSize: 14,
    color: '#666',
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
    marginRight: 12,
  },
  completeActivityTitle: {
    fontSize: 15,
    color: '#000',
  },
  completeActionIcon: {
    marginLeft: 8,
  },
  completeEmptyText: {
    fontSize: 14,
    color: '#999',
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
    marginTop: 20,
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
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
  },
  userEmoji: {
    fontSize: 32,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  userNameActive: {
    fontWeight: '700',
  },
  planSectionDescription: {
    fontSize: 14,
    color: '#666',
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
    fontWeight: '500',
    color: '#666',
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
    fontWeight: '500',
    color: '#666',
  },
  dayToggleTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  
  // Plan Tab Planning Mode Header Styles
  planHeader: {
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
    fontWeight: '700',
    color: '#000',
  },
  planHeaderDay: {
    fontSize: 14,
    color: '#666',
  },
});