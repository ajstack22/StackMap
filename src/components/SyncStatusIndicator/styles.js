import { StyleSheet, Platform } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, COLORS, SHADOWS } from '../../constants';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    marginVertical: SPACING.xs,
    ...SHADOWS.small,
  },
  
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    backgroundColor: 'white',
  },
  
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  detailsContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: SPACING.sm,
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: SPACING.xs,
    lineHeight: 16,
  },
  
  offlineText: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.small,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  
  retryButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});