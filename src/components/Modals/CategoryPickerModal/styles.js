import { StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { Z_INDEX } from '../../../constants/zIndex';

export const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: Z_INDEX.CRITICAL,
    elevation: Z_INDEX.CRITICAL,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: RADIUS.xl,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    zIndex: Z_INDEX.MAX,
    elevation: Z_INDEX.MAX,
    ...SHADOWS.level3,
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryListContent: {
    padding: SPACING.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    backgroundColor: '#f8f8f8',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#999',
    marginLeft: SPACING.xs,
  },
  createCategoryButton: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#e0e8f0',
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
  },
  addIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  newCategoryContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#f8f8f8',
    borderRadius: RADIUS.md,
  },
  newCategoryInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  newCategoryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  newCategoryCancel: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  newCategoryCancelText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#666',
  },
  newCategoryCreate: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  newCategoryCreateDisabled: {
    opacity: 0.5,
  },
  newCategoryCreateText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#fff',
  },
  cancelButton: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#666',
  },
});
