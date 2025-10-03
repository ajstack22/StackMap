import { Dimensions, Platform } from 'react-native';
import { THEMES } from '../../../constants';

const { width: screenWidth } = Dimensions.get('window');

export const isTablet = () => screenWidth >= 768;
export const isMobileWeb = () =>
  Platform.OS === 'web' && Dimensions.get('window').width < 768;

export const defaultTheme = {
  primary: THEMES?.stackBlue?.primary || '#5C7E9D',
  dark: THEMES?.stackBlue?.dark || '#4A6680',
  light: THEMES?.stackBlue?.light || '#7896B3',
  text: '#000000',
  textSecondary: '#666666',
  background: '#FFFFFF',
  card: '#F5F5F5',
};

export const getInitialStep = (syncSetupPhrase) => {
  if (Platform.OS === 'web' && window.syncInviteData) {
    return 'syncImport';  // Go directly to sync import for invite URLs
  }
  if (syncSetupPhrase) {
    return 'syncImport';  // Also for legacy sync URLs
  }
  return 'welcome';
};

export const getInitialJourney = (syncSetupPhrase) => {
  const baseJourney = {
    journeyType: null, // 'new' or 'existing'
    userType: null, // 'self', 'helper', 'group'
    deviceStrategy: null, // 'single' or 'multi'
    syncEnabled: false,
    pinEnabled: false,
  };

  if ((Platform.OS === 'web' && window.syncInviteData) || syncSetupPhrase) {
    baseJourney.journeyType = 'existing';  // Set as existing user for sync invites
  }

  return baseJourney;
};

export const determineNextStep = (currentStep, userJourney) => {
  switch (currentStep) {
    case 'welcome':
      return 'existing';
    case 'existing':
      if (userJourney.journeyType === 'new') {
        return 'userType';
      } else {
        return 'syncImport';
      }
    case 'userType':
      return 'deviceStrategy';
    case 'deviceStrategy':
      if (userJourney.deviceStrategy === 'multi') {
        return 'pinSetup';
      } else {
        return 'userSetup';
      }
    case 'pinSetup':
      return 'syncChoice';
    case 'syncChoice':
      if (userJourney.syncEnabled) {
        return 'syncCreate';
      } else {
        return 'userSetup';
      }
    case 'syncCreate':
      return 'userSetup';
    case 'userSetup':
      return 'complete';
    case 'syncImport':
      return 'syncSuccess';
    case 'syncSuccess':
      return 'complete';
    default:
      return 'complete';
  }
};