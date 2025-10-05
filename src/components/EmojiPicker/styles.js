import { StyleSheet, Platform } from 'react-native';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
} from '../../constants';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    flex: 1,
  },
  inlineContainer: {
    borderRadius: RADIUS.lg,
    backgroundColor: '#f5f5f5',
    height: Platform.OS === 'web' ? 400 : 300,
    maxHeight: Platform.OS === 'web' ? 400 : 300,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height:
      Platform.OS === 'web' ? '70%' : Platform.OS === 'android' ? '75%' : '80%',
    maxHeight:
      Platform.OS === 'web' ? 600 : Platform.OS === 'android' ? '75%' : '80%',
    maxWidth: isTablet() ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
    ...SHADOWS.level3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingHorizontal: isTablet() ? SPACING.xl : SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: isTablet() ? TYPOGRAPHY.sizes.xl : TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[900],
  },
  categoryContainer: {
    paddingHorizontal: isTablet() ? SPACING.xl : SPACING.md,
    marginBottom: SPACING.sm,
    height: isTablet() ? 44 : 36,
  },
  categoryTab: {
    paddingHorizontal: isTablet() ? SPACING.lg : SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray[100],
    height: isTablet() ? 40 : 32,
    justifyContent: 'center',
  },
  selectedCategoryTab: {
    backgroundColor: '#667eea',
  },
  categoryText: {
    fontSize: isTablet() ? TYPOGRAPHY.sizes.md : TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[700],
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  skinToneContainer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: isTablet() ? SPACING.xl : SPACING.md,
  },
  skinToneOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  skinToneOption: {
    width: isTablet() ? 44 : 36,
    height: isTablet() ? 44 : 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
  },
  selectedSkinTone: {
    backgroundColor: '#667eea',
  },
  skinToneEmoji: {
    fontSize: isTablet() ? 26 : 22,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
  },
});