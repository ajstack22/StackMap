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
    maxHeight: '80%',
    ...SHADOWS.level3,
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
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
});