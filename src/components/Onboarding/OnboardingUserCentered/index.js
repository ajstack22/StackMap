// @ts-check
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DeferredStorage from '../../../utils/deferredStorage';
import { DEFAULT_USER_ICON } from '../../../constants';
import syncService from '../../../services/sync';
import minimalSync from '../../../services/sync/minimalSyncService';
import { useAppStore, useUserStore, useSettingsStore } from '../../../stores';
import { generateSecureRandomString } from '../../../utils/secureId';

// Import screens
import {
  WelcomeScreen,
  ExistingUserScreen,
  UserTypeScreen,
  DeviceStrategyScreen,
  UserSetupScreen,
  PinSetupScreen,
  CompleteScreen,
} from './screens';

// Import helpers and styles
import {
  defaultTheme,
  getInitialStep,
  getInitialJourney,
  determineNextStep
} from './helpers';
import { styles } from './styles';
import SyncCreateScreen from './screens/SyncCreateScreen';
import SyncImportScreen from './screens/SyncImportScreen';
import SyncSuccessScreen from './screens/SyncSuccessScreen';
import SyncChoiceScreen from './screens/SyncChoiceScreen';

const OnboardingUserCentered = ({
  onComplete,
  onImport,
  syncSetupPhrase = null,
  onShowPrivacy,
  onShowSupport,
}) => {
  // Navigation state
  const [currentStep, setCurrentStep] = useState(() => getInitialStep(syncSetupPhrase));
  const [navigationHistory, setNavigationHistory] = useState(() => [getInitialStep(syncSetupPhrase)]);

  // User journey state
  const [userJourney, setUserJourney] = useState(() => getInitialJourney(syncSetupPhrase));

  // User data state
  const [userName, setUserName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_USER_ICON);
  const [users, setUsers] = useState([]);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Sync state
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [generatedSyncCode, setGeneratedSyncCode] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncPreviewData, setSyncPreviewData] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [generatedInviteCode, setGeneratedInviteCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Generate sync code
  const generateNewSyncCode = () => {
    // Generate using the same secure method as syncService
    const newCode = generateSecureRandomString(32);
    setGeneratedSyncCode(newCode);
    return newCode;
  };

  // Initialize sync code on mount
  useEffect(() => {
    if (userJourney.deviceStrategy === 'multi' && !generatedSyncCode) {
      generateNewSyncCode();
    }
  }, [userJourney.deviceStrategy]);

  // Auto-fetch sync preview for invite URLs
  useEffect(() => {
    if (currentStep === 'syncImport') {
      const fetchSyncPreview = async () => {
        if (Platform.OS === 'web' && window.syncInviteData) {
          const { inviteCode, recoveryPhrase } = window.syncInviteData;

          if (inviteCode && recoveryPhrase) {
            setInviteCode(inviteCode);
            setRecoveryPhrase(recoveryPhrase);
            setSyncLoading(true);

            try {
              const preview = await minimalSync.validateInviteCode(inviteCode);
              if (preview && preview.users) {
                setSyncPreviewData(preview);
              } else {
                setSyncError('Invalid sync invite link');
              }
            } catch (error) {
              setSyncError(`Could not load sync preview: ${error.message || error}`);
            } finally {
              setSyncLoading(false);
            }
          }
        }
      };

      if (!syncPreviewData) {
        setTimeout(() => {
          fetchSyncPreview();
        }, 500);
      }
    }
  }, [currentStep]);

  // Auto-import sync data when preview is fetched from invite URL
  useEffect(() => {
    if (syncPreviewData && currentStep === 'syncImport' && Platform.OS === 'web' && window.syncInviteData) {
      if (window.syncInviteData.inviteCode && window.syncInviteData.recoveryPhrase) {
        setTimeout(() => {
          importSyncData();
        }, 500);
      }
    }
  }, [syncPreviewData]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Step transition animation - optimized for iOS performance
  const animateStepTransition = (nextStep) => {
    if (Platform.OS === 'ios') {
      fadeAnim.setValue(0.9);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }

    setNavigationHistory(prev => [...prev, nextStep]);
    setCurrentStep(nextStep);
  };

  // Navigation
  const goBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const previousStep = newHistory[newHistory.length - 1];

      animateStepTransition(previousStep);
      setNavigationHistory(newHistory);
    }
  };

  // Create new sync
  const createNewSync = async () => {
    setSyncLoading(true);
    setSyncError('');

    try {
      // First, create users in the store before setting up sync
      if (users.length) {
        const timestamp = Date.now();
        const randomId = generateSecureRandomString(9);
        const usersObj = {};
        let firstUserId = null;

        // Create starter activities for the first user
        const starterActivities = [
          {
            id: `${timestamp}_1_${randomId}`,
            text: 'Welcome to StackMap!',
            icon: '👋',
            description: 'Tap activities to mark them complete',
            pinned: false,
            completed: false
          },
          // ... (all other starter activities omitted for brevity)
        ];

        users.forEach((user, index) => {
          const userId = `user_${index + 1}`;
          if (index === 0) firstUserId = userId;

          usersObj[userId] = {
            id: userId,
            name: user.name,
            icon: user.icon,
            emoji: user.icon, // Keep for backwards compatibility
            days: {
              today: { activities: index === 0 ? starterActivities : [] },
              tomorrow: { activities: [] }
            },
            deleted: false
          };
        });

        // Set users in store
        useUserStore.getState().setUsers(usersObj);
        useAppStore.getState().setCurrentUser(firstUserId);

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      let syncCode = generatedSyncCode;
      if (!syncCode) {
        syncCode = generateNewSyncCode();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await syncService.enable(syncCode);

      try {
        const inviteResult = await syncService.createInviteCode(24, 5, 'Initial setup');
        if (inviteResult && inviteResult.inviteCode) {
          setGeneratedInviteCode(inviteResult.inviteCode);
        }
      } catch (inviteError) {
        // Non-critical error - sync still works without invite code
      }

      setUserJourney(prev => ({ ...prev, syncEnabled: true }));
      animateStepTransition('syncSuccess');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        generateNewSyncCode();
        setSyncError('This sync code is already in use. A new code has been generated. Please try again.');
      } else {
        setSyncError(error.message || 'Failed to create sync. Please try again.');
      }
    } finally {
      setSyncLoading(false);
    }
  };

  // Import sync data
  const importSyncData = async () => {
    setIsImporting(true);
    setImportError('');

    try {
      let actualInviteCode = inviteCode;
      let actualRecoveryPhrase = recoveryPhrase;

      if (Platform.OS === 'web' && window.syncInviteData) {
        actualInviteCode = window.syncInviteData.inviteCode || inviteCode;
        actualRecoveryPhrase = window.syncInviteData.recoveryPhrase || recoveryPhrase;
      }

      if (!actualRecoveryPhrase || !actualInviteCode) {
        throw new Error('Recovery phrase and invite code are required');
      }

      const result = await minimalSync.joinWithInviteCode(
        actualInviteCode,
        actualRecoveryPhrase
      );

      if (result && result.success) {
        setImportResult(result);
        setUserJourney(prev => ({ ...prev, syncEnabled: true }));
        animateStepTransition('syncSuccess');
      } else {
        throw new Error('Failed to import sync data');
      }
    } catch (error) {
      setImportError(error.message || 'Failed to import sync data');
    } finally {
      setIsImporting(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    const onboardingData = {
      users,
      pin: userJourney.pinEnabled ? pin : null,
      syncEnabled: userJourney.syncEnabled,
      recoveryPhrase: userJourney.syncEnabled ? (generatedSyncCode || recoveryPhrase) : null,
    };

    onComplete(onboardingData);
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomeScreen
            theme={defaultTheme}
            onNewUser={() => {
              setUserJourney(prev => ({ ...prev, journeyType: 'new' }));
              animateStepTransition('userType');
            }}
            onExistingUser={() => {
              setUserJourney(prev => ({ ...prev, journeyType: 'existing' }));
              animateStepTransition('existingUser');
            }}
            onShowPrivacy={onShowPrivacy}
            onShowSupport={onShowSupport}
          />
        );

      case 'existingUser':
        return (
          <ExistingUserScreen
            theme={defaultTheme}
            onJoinSync={() => animateStepTransition('syncImport')}
            onImportBackup={async () => {
              try {
                const result = await onImport();
                if (result && result.success) {
                  onComplete({
                    importedData: result.data,
                    isImport: true,
                  });
                }
              } catch (error) {
                // Handle error
              }
            }}
            onStartFresh={() => {
              setUserJourney(prev => ({ ...prev, journeyType: 'new' }));
              animateStepTransition('userType');
            }}
          />
        );

      case 'userType':
        return (
          <UserTypeScreen
            theme={defaultTheme}
            onSelectUserType={(type) => {
              setUserJourney(prev => ({ ...prev, userType: type }));
              animateStepTransition('deviceStrategy');
            }}
          />
        );

      case 'deviceStrategy':
        return (
          <DeviceStrategyScreen
            theme={defaultTheme}
            onSelectStrategy={(strategy) => {
              setUserJourney(prev => ({
                ...prev,
                deviceStrategy: strategy,
                syncEnabled: strategy === 'multi'
              }));
              animateStepTransition('userSetup');
            }}
            onSkip={() => animateStepTransition('userSetup')}
          />
        );

      case 'userSetup':
        return (
          <UserSetupScreen
            theme={defaultTheme}
            users={users}
            userName={userName}
            setUserName={setUserName}
            selectedEmoji={selectedEmoji}
            setSelectedEmoji={setSelectedEmoji}
            userJourney={userJourney}
            onAddUser={(newUser) => setUsers([...users, newUser])}
            onContinue={() => {
              if (userJourney.userType?.toLowerCase().trim() === 'group' ||
                  userJourney.userType?.toLowerCase().trim() === 'helper') {
                animateStepTransition('pinSetup');
              } else if (userJourney.deviceStrategy === 'multi') {
                animateStepTransition('syncChoice');
              } else {
                animateStepTransition('complete');
              }
            }}
          />
        );

      case 'pinSetup':
        return (
          <PinSetupScreen
            theme={defaultTheme}
            pin={pin}
            setPin={setPin}
            confirmPin={confirmPin}
            setConfirmPin={setConfirmPin}
            pinError={pinError}
            onSetPin={() => {
              if (pin !== confirmPin) {
                setPinError('PINs do not match');
                return;
              }
              setUserJourney(prev => ({ ...prev, pinEnabled: true }));
              if (userJourney.deviceStrategy === 'multi') {
                animateStepTransition('syncCreate');
              } else {
                animateStepTransition('complete');
              }
            }}
            onSkip={() => {
              if (userJourney.deviceStrategy === 'multi') {
                animateStepTransition('syncCreate');
              } else {
                animateStepTransition('complete');
              }
            }}
          />
        );

      case 'syncChoice':
        return (
          <SyncChoiceScreen
            theme={defaultTheme}
            onEnableSync={() => {
              setUserJourney(prev => ({ ...prev, syncEnabled: true }));
              animateStepTransition('syncCreate');
            }}
            onSkip={() => {
              setUserJourney(prev => ({ ...prev, syncEnabled: false }));
              animateStepTransition('complete');
            }}
          />
        );

      case 'syncCreate':
        return (
          <SyncCreateScreen
            theme={defaultTheme}
            generatedSyncCode={generatedSyncCode}
            syncLoading={syncLoading}
            syncError={syncError}
            onCreateSync={createNewSync}
            onSkip={() => animateStepTransition('complete')}
          />
        );

      case 'syncImport':
        return (
          <SyncImportScreen
            theme={defaultTheme}
            inviteCode={inviteCode}
            setInviteCode={setInviteCode}
            recoveryPhrase={recoveryPhrase}
            setRecoveryPhrase={setRecoveryPhrase}
            syncPreviewData={syncPreviewData}
            syncLoading={syncLoading}
            syncError={syncError}
            isImporting={isImporting}
            importError={importError}
            onImport={importSyncData}
            onFetchPreview={async () => {
              if (!inviteCode) {
                setSyncError('Please enter an invite code');
                return;
              }

              setSyncLoading(true);
              setSyncError('');

              try {
                const preview = await minimalSync.validateInviteCode(inviteCode);
                if (preview && preview.users) {
                  setSyncPreviewData(preview);
                } else {
                  setSyncError('Invalid invite code');
                }
              } catch (error) {
                setSyncError(`Failed to fetch preview: ${error.message || error}`);
              } finally {
                setSyncLoading(false);
              }
            }}
          />
        );

      case 'syncSuccess':
        return (
          <SyncSuccessScreen
            theme={defaultTheme}
            generatedSyncCode={generatedSyncCode || recoveryPhrase}
            generatedInviteCode={generatedInviteCode}
            importResult={importResult}
            onContinue={() => animateStepTransition('complete')}
          />
        );

      case 'complete':
        return (
          <CompleteScreen
            theme={defaultTheme}
            users={users}
            userJourney={userJourney}
            onComplete={completeOnboarding}
          />
        );

      default:
        return null;
    }
  };

  // SafeAreaView component for web compatibility
  const SafeAreaView = ({ children, style }) => {
    if (Platform.OS === 'web') {
      return <View style={style}>{children}</View>;
    }
    return <View style={[style, { paddingTop: insets.top }]}>{children}</View>;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView style={styles.safeArea}>
          {currentStep !== 'welcome' && navigationHistory.length > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
            >
              <Icon name="arrow-back" size={24} color={defaultTheme.primary} />
            </TouchableOpacity>
          )}

          <Animated.View
            key={currentStep}
            style={[
              styles.contentContainer,
              { opacity: fadeAnim },
            ]}
          >
            {renderStepContent()}
          </Animated.View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OnboardingUserCentered;