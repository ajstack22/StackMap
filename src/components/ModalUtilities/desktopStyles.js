import { Platform } from 'react-native';
import { SPACING } from '../../constants';

export const getDesktopSectionStyle = () => {
  if (Platform.OS === 'web') {
    return {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    };
  }
  return {};
};

export const getDesktopScrollStyle = () => {
  if (Platform.OS === 'web') {
    return {
      paddingHorizontal: SPACING.lg,
    };
  }
  return {};
};

export const getDesktopContentStyle = () => {
  if (Platform.OS === 'web') {
    return {
      alignItems: 'center',
    };
  }
  return {};
};
