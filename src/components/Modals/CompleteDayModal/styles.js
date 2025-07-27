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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Platform.OS === 'ios' ? 0 : SPACING.xs,
  },
  
  // Top Action Container
  topActionContainer: {
    backgroundColor: 'white',
    paddingVertical: Platform.OS === 'ios' ? SPACING.lg : SPACING.xl,
    paddingHorizontal: Platform.OS === 'ios' ? SPACING.md : SPACING.lg,
    margin: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
    marginBottom: SPACING.xs,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  explanationText: {
    fontSize: Platform.OS === 'ios' ? 15 : 16,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'center',
    lineHeight: Platform.OS === 'ios' ? 20 : 22,
    marginBottom: Platform.OS === 'ios' ? 4 : SPACING.xs,
  },
  explanationSubtext: {
    fontSize: Platform.OS === 'ios' ? 13 : 14,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'center',
    marginBottom: Platform.OS === 'ios' ? SPACING.xs : SPACING.sm,
  },
  
  // Sections
  section: {
    backgroundColor: 'white',
    marginTop: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
    marginBottom: 0,
    marginHorizontal: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.lg,
    paddingHorizontal: Platform.OS === 'ios' ? SPACING.md : SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? SPACING.xs : SPACING.sm,
  },
  sectionIconContainer: {
    width: Platform.OS === 'ios' ? 36 : 40,
    height: Platform.OS === 'ios' ? 36 : 40,
    borderRadius: Platform.OS === 'ios' ? 18 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'ios' ? 17 : 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'normal',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
  },
  sectionCount: {
    fontSize: 16,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginLeft: SPACING.xs,
  },
  sectionDescription: {
    fontSize: Platform.OS === 'ios' ? 12 : 13,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginBottom: Platform.OS === 'ios' ? SPACING.xs : SPACING.sm,
    opacity: 0.7,
  },
  
  // Activities Container
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Platform.OS === 'ios' ? SPACING.xs : SPACING.sm,
    marginLeft: Platform.OS === 'ios' ? 0 : -SPACING.xs,
  },
  
  // Activity Card
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? '#f8f8f8' : 'white',
    borderRadius: Platform.OS === 'ios' ? RADIUS.md : RADIUS.lg,
    paddingVertical: Platform.OS === 'ios' ? 8 : 12,
    paddingHorizontal: Platform.OS === 'ios' ? 12 : 16,
    marginLeft: Platform.OS === 'ios' ? 0 : SPACING.xs,
    marginRight: Platform.OS === 'ios' ? SPACING.xs : 0,
    marginBottom: Platform.OS === 'ios' ? 6 : SPACING.sm,
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 1 : 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.03 : 0.06,
    shadowRadius: Platform.OS === 'ios' ? 2 : 4,
    elevation: Platform.OS === 'ios' ? 1 : 2,
  },
  actionIcon: {
    marginLeft: 'auto',
    marginRight: SPACING.xs,
  },
  activityEmoji: {
    fontSize: Platform.OS === 'ios' ? 18 : 20,
    marginRight: Platform.OS === 'ios' ? 6 : SPACING.xs,
  },
  activityText: {
    fontSize: Platform.OS === 'ios' ? 13 : 14,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontStyle: 'italic',
  },
  
  // Summary
  summaryContainer: {
    backgroundColor: 'white',
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.lg,
    paddingHorizontal: Platform.OS === 'ios' ? SPACING.md : SPACING.lg,
    marginTop: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
    marginHorizontal: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
    marginBottom: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'normal',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginBottom: SPACING.sm,
  },
  summaryText: {
    fontSize: 14,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: 22,
    marginBottom: SPACING.xs,
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
    paddingVertical: Platform.OS === 'ios' ? 14 : 16,
    paddingHorizontal: Platform.OS === 'ios' ? 32 : 40,
    borderRadius: RADIUS.xl,
    marginTop: Platform.OS === 'ios' ? SPACING.md : SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : 'normal',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    letterSpacing: 0.5,
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