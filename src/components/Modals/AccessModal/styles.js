import { StyleSheet, Platform, Dimensions } from 'react-native';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  isMobile,
} from '../../../constants';

const { width: screenWidth } = Dimensions.get('window');
const IS_MOBILE = isMobile(screenWidth);

export const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    paddingTop: SPACING.md,
    paddingBottom: 80,
    paddingHorizontal: 0,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: SPACING.lg,
    }),
  },
  section: {
    marginHorizontal: IS_MOBILE ? SPACING.xs : SPACING.md,
    marginVertical: SPACING.sm,
    padding: IS_MOBILE ? SPACING.sm : SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
    }),
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
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginRight: 12,
  },
  userItemName: {
    flex: 1,
    fontSize: 16,
    color: '#000',
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
    color: '#000',
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
