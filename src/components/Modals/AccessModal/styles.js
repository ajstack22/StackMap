import { StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants';

export const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    padding: 20,
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  section: {
    marginBottom: 30,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  usersList: {
    backgroundColor: 'white',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.level1,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userItemActive: {
    backgroundColor: '#f0f9ff',
    borderColor: COLORS.info,
  },
  userItemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  userItemName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  userItemNameActive: {
    fontWeight: '600',
    color: COLORS.info,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  userActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  iconButton: {
    padding: SPACING.xs,
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
  },
  addUserText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    ...SHADOWS.level1,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  pinStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    ...SHADOWS.level1,
  },
  pinStatusIcon: {
    marginRight: SPACING.md,
  },
  pinStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    marginBottom: 2,
  },
  pinStatusSubtext: {
    fontSize: 14,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  enabledBadge: {
    backgroundColor: '#e6fffa',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    marginRight: SPACING.sm,
  },
  enabledText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  warningBox: {
    backgroundColor: '#fff8e1',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  warningText: {
    color: '#f57c00',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
});