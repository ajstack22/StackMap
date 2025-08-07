import { StyleSheet, Platform, Dimensions } from 'react-native';
import { TYPOGRAPHY, SPACING, isTablet } from '../../constants';

const { width: screenWidth } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 56,
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerIcon: {
    marginRight: SPACING.sm,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderBottomWidth: 0,
    width: '100%',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginRight: 0,
    marginLeft: 0,
    gap: 0,
    position: 'relative',
    justifyContent: 'center',
    flex: 1,
    height: 48,
  },
  tabActive: {
    // Modern flat design - no borders, just background
  },
  tabText: {
    fontSize: Platform.OS === 'web' ? 14 : (isTablet() ? 15 : 14),
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabTextActive: {
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 15,
    letterSpacing: 0,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden', // Clip content during transitions
  },
  tabContent: {
    flex: 1,
    width: '100%',
  },
});