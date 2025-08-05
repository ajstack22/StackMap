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
    borderRadius: RADIUS.large,
    width: Platform.OS === 'web' ? 480 : '90%',
    maxWidth: 480,
    maxHeight: '80%',
    ...SHADOWS.large,
  },
  header: {
    padding: SPACING.large,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xlarge,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  content: {
    flex: 1,
    padding: SPACING.large,
  },
  statusSection: {
    marginBottom: SPACING.large,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.medium,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.small,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.medium,
    backgroundColor: '#f3f4f6',
    borderRadius: RADIUS.medium,
  },
  statusText: {
    marginLeft: SPACING.small,
    fontSize: TYPOGRAPHY.sizes.medium,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.medium,
    backgroundColor: '#fee2e2',
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.medium,
  },
  errorText: {
    marginLeft: SPACING.small,
    color: '#dc2626',
    fontSize: TYPOGRAPHY.sizes.small,
    flex: 1,
  },
  previewSection: {
    marginTop: SPACING.small,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.small,
  },
  previewLabel: {
    marginLeft: SPACING.small,
    fontSize: TYPOGRAPHY.sizes.medium,
    flex: 1,
  },
  previewValue: {
    fontSize: TYPOGRAPHY.sizes.medium,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.small,
    paddingLeft: SPACING.xlarge,
  },
  userIcon: {
    fontSize: 20,
    marginRight: SPACING.small,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.small,
    flex: 1,
  },
  userActivities: {
    fontSize: TYPOGRAPHY.sizes.xsmall,
  },
  lastUpdated: {
    marginTop: SPACING.medium,
    paddingTop: SPACING.medium,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  lastUpdatedText: {
    fontSize: TYPOGRAPHY.sizes.xsmall,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xlarge,
  },
  loadingText: {
    marginTop: SPACING.medium,
    fontSize: TYPOGRAPHY.sizes.medium,
  },
});