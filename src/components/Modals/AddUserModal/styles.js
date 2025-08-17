import { StyleSheet, Platform } from 'react-native';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants';

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    zIndex: 1000,
    elevation: 1000,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    color: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  emojiSelector: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  selectedEmoji: {
    fontSize: 80,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginBottom: 10,
  },
  emojiSelectorLabel: {
    fontSize: 16,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  input: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: 18,
    marginBottom: 20,
    backgroundColor: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  button: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'normal',
    color: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
});
