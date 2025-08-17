import { StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
    elevation: 999999,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    zIndex: 1000000,
    elevation: 1000000,
    ...SHADOWS.level3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    ...SHADOWS.level1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
    textAlign: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
  },
});
