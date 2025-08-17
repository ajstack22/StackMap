import { StyleSheet, Platform, Dimensions } from 'react-native';
import {
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  isMobile,
} from '../../../constants';

const { width: screenWidth } = Dimensions.get('window');
const IS_MOBILE = isMobile(screenWidth);

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  formPanel: {
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    padding: IS_MOBILE ? 16 : 20,
    margin: IS_MOBILE ? 16 : 20,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      : Platform.OS === 'android'
      ? {
          elevation: 3,
        }
      : {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }),
  },
  emojiSelector: {
    alignItems: 'center',
    marginBottom: 30,
  },
  selectedEmoji: {
    fontSize: 80,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginBottom: 8,
  },
  selectedEmojiImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  emojiSelectorLabel: {
    fontSize: 14,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  button: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.level1,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});
