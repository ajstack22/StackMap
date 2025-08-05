import { StyleSheet, Platform } from 'react-native';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../../constants';

export const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    width: Platform.OS === 'web' ? 480 : '90%',
    maxWidth: 480,
    maxHeight: Platform.OS === 'web' ? '90vh' : '80%',
    height: Platform.OS === 'web' ? 'auto' : undefined,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...SHADOWS.level3,
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.md,
    padding: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    minHeight: 0, // Important for flex children with scroll
  },
  statusSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold || '600',
    marginBottom: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#f3f4f6',
    borderRadius: RADIUS.md,
  },
  statusText: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#fee2e2',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    marginLeft: SPACING.sm,
    color: '#dc2626',
    fontSize: TYPOGRAPHY.sizes.sm,
    flex: 1,
  },
  previewSection: {
    marginTop: SPACING.sm,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  previewLabel: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    flex: 1,
  },
  previewValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold || '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingLeft: SPACING.xl,
  },
  userIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    flex: 1,
  },
  userActivities: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  lastUpdated: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  lastUpdatedText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  actionPanel: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    ...SHADOWS.level1,
  },
  actionButtonText: {
    color: 'white',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold || '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});