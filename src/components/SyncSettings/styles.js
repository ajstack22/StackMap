import { StyleSheet } from 'react-native';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../constants';

export const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.sm,
    color: '#333',
  },
  
  description: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#666',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  
  primaryButtonText: {
    color: 'white',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  
  buttonIcon: {
    marginRight: SPACING.xs,
  },
  
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  
  joinSyncContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#f5f5f5',
    borderRadius: RADIUS.md,
  },
  
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#666',
    marginBottom: SPACING.xs,
  },
  
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    marginBottom: SPACING.md,
    backgroundColor: 'white',
  },
  
  joinButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  
  statusContainer: {
    marginBottom: SPACING.lg,
  },
  
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  statusText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#4CAF50',
    marginLeft: SPACING.xs,
  },
  
  statsContainer: {
    marginTop: SPACING.sm,
    paddingLeft: SPACING.xl,
  },
  
  statsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#666',
    marginBottom: SPACING.xs,
  },
  
  recoveryContainer: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  
  recoveryTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.xs,
    color: '#333',
  },
  
  recoveryWarning: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#FF6B6B',
    marginBottom: SPACING.md,
  },
  
  recoveryPhraseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: SPACING.sm,
  },
  
  recoveryPhrase: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: 'monospace',
    color: '#333',
    flex: 1,
    marginRight: SPACING.sm,
  },
  
  hideButton: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  
  hideButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  
  actionButtons: {
    marginBottom: SPACING.lg,
  },
  
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  
  dangerButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  
  dangerButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#FF6B6B',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
  },
  
  infoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#666',
    marginLeft: SPACING.xs,
    flex: 1,
    lineHeight: 18,
  },
  
  reenterButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: '#e0e0e0',
  },
  
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#666',
  },
});