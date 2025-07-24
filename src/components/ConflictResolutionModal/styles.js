import { StyleSheet, Platform } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, COLORS, SHADOWS } from '../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: 'transparent',
  },
  
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  contentContainer: {
    padding: SPACING.lg,
  },
  
  conflictInfo: {
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  
  conflictTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  
  conflictDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  choicesContainer: {
    gap: SPACING.md,
  },
  
  choiceCard: {
    backgroundColor: 'white',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  
  choiceCardHover: {
    borderColor: '#e0e0e0',
    transform: [{ scale: 0.98 }],
  },
  
  choiceCardSelected: {
    borderColor: '#4caf50',
    backgroundColor: '#f1f8e9',
  },
  
  choiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  choiceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  choiceLabelSelected: {
    color: '#4caf50',
  },
  
  valueContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: RADIUS.small,
    padding: SPACING.sm,
    minHeight: 60,
  },
  
  arrayCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  activityPreview: {
    marginTop: SPACING.xs,
  },
  
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  
  activityIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  
  activityName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  
  moreText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  completedCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  
  objectPreview: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  scalarValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  
  mergeNote: {
    fontSize: 12,
    color: '#4caf50',
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  
  resolvingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.medium,
  },
  
  resolvingText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: '#666',
  },
  
  footer: {
    backgroundColor: 'white',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  
  footerText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});