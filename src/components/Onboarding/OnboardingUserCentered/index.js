// @ts-check
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { DEFAULT_USER_ICON } from '../../../constants';
import syncService from '../../../services/sync';
import minimalSync from '../../../services/sync/minimalSyncService';
import syncStoreIntegration from '../../../services/sync/syncStoreIntegration';
import { useAppStore, useUserStore, useSettingsStore } from '../../../stores';
import { generateSecureRandomString } from '../../../utils/secureId';
import { sanitizeUsers, sanitizeUser } from '../../../utils/validation';

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

  // Auto-load recovery phrase from URL fragment (no invite codes)
  useEffect(() => {
    if (currentStep === 'syncImport') {
      if (Platform.OS === 'web' && window.location && window.location.hash) {
        const hashPhrase = window.location.hash.substring(1);
        if (hashPhrase && hashPhrase.length === 32) {
          setRecoveryPhrase(hashPhrase);
          // Clear hash from URL
          window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
      }
    }
  }, [currentStep]);

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

  // Memoized handlers to prevent child re-renders and focus loss
  const handleAddUser = useCallback((newUser) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
  }, []);

  const handleUserSetupContinue = useCallback(() => {
    if (userJourney.userType?.toLowerCase().trim() === 'group' ||
        userJourney.userType?.toLowerCase().trim() === 'helper') {
      animateStepTransition('pinSetup');
    } else if (userJourney.deviceStrategy === 'multi') {
      animateStepTransition('syncChoice');
    } else {
      animateStepTransition('complete');
    }
  }, [userJourney.userType, userJourney.deviceStrategy]);

  const handleSyncSuccessContinue = useCallback(() => {
    animateStepTransition('complete');
  }, []);

  // Create new sync
  const createNewSync = async () => {
    setSyncLoading(true);
    setSyncError('');

    try {
      // First, create users in the store before setting up sync
      if (users.length) {
        const timestamp = Date.now();
        // Each activity now gets its own unique random ID to prevent collisions
        const usersObj = {};
        let firstUserId = null;

        // Create starter activities for the first user
        const starterActivities = [
          {
            id: `${timestamp}_1_${generateSecureRandomString(9)}`,
            text: 'Welcome to StackMap!',
            icon: '👋',
            description: 'Tap activities to mark them complete',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_2_${generateSecureRandomString(9)}`,
            text: 'Try Edit Mode',
            icon: '✏️',
            description: 'Use the edit button to add, remove, and organize activities',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_3_${generateSecureRandomString(9)}`,
            text: 'Switch Users',
            icon: '👤',
            description: 'Tap your user pill to switch users or check-in',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_4_${generateSecureRandomString(9)}`,
            text: 'Share with Providers',
            icon: '🔗',
            description: 'Share your activities with caregivers via QR code or link',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_5_${generateSecureRandomString(9)}`,
            text: 'Sync Across Devices',
            icon: '🔄',
            description: 'Keep your data synced with zero-knowledge encryption',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_6_${generateSecureRandomString(9)}`,
            text: 'Import & Export',
            icon: '📦',
            description: 'Backup your data or transfer between devices',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_7_${generateSecureRandomString(9)}`,
            text: 'Preferences',
            icon: '🎨',
            description: 'Tap the palette icon to customize colors, animations, and display',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_8_${generateSecureRandomString(9)}`,
            text: 'Activities',
            icon: '📋',
            description: 'Tap the + icon to add new activities and build your library',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_9_${generateSecureRandomString(9)}`,
            text: 'Day',
            icon: '📅',
            description: 'Use the calendar icon to plan tomorrow or review past days',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_10_${generateSecureRandomString(9)}`,
            text: 'Access',
            icon: '👥',
            description: 'Add multiple users with the crown icon in preferences',
            pinned: false,
            completed: false
          }
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

        // Set users in store with error handling and retry
        let retryCount = 0;
        const maxRetries = 3;
        let storeSuccess = false;

        while (retryCount < maxRetries && !storeSuccess) {
          try {
            // Attempt to set users in store
            useUserStore.getState().setUsers(usersObj);
            useAppStore.getState().setCurrentUser(firstUserId);

            // Verify the store operations succeeded
            const storedUsers = useUserStore.getState().users;
            const currentUser = useAppStore.getState().currentUser;

            if (storedUsers && Object.keys(storedUsers).length > 0 && currentUser === firstUserId) {
              storeSuccess = true;
            } else {
              throw new Error('Store update verification failed');
            }
          } catch (storeError) {
            retryCount++;
            console.error(`Store update attempt ${retryCount} failed:`, storeError);

            if (retryCount < maxRetries) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
            } else {
              // Final attempt failed, throw error
              throw new Error('Failed to save user data after multiple attempts. Please try again.');
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      let syncCode = generatedSyncCode;
      if (!syncCode) {
        syncCode = generateNewSyncCode();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await syncService.enable(syncCode);

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
      if (!recoveryPhrase || recoveryPhrase.length !== 32) {
        throw new Error('Valid 32-character recovery phrase is required');
      }

      // PHASE 1 DIAGNOSTIC: Set isSyncing flag to prevent race condition
      console.log('[PHASE1] Setting isSyncing=true before data import');
      if (syncStoreIntegration) {
        syncStoreIntegration.isSyncing = true;
      }

      // Join sync using recovery phrase only
      const result = await minimalSync.joinSync(recoveryPhrase);

      if (result && result.success) {
        // Extract users from synced data if available
        if (result.data && result.data.users) {
          // CRITICAL: Do NOT sanitize sync data!
          // Sync data is TRUSTED - encrypted from user's own device
          // sanitizeUsers() destroys the days field causing catastrophic data loss
          // Only validate required fields to prevent crashes
          try {
            const syncedUsers = Object.values(result.data.users || {})
              .filter(user => {
                // Validate structure without destroying data
                if (!user || typeof user !== 'object') {
                  console.warn('[OnboardingSync] Invalid user: not an object');
                  return false;
                }

                // Required fields check
                if (!user.id || typeof user.id !== 'string') {
                  console.warn('[OnboardingSync] Invalid user missing id:', {
                    hasId: !!user.id,
                    idType: typeof user.id
                  });
                  return false;
                }

                if (!user.name || typeof user.name !== 'string') {
                  console.warn('[OnboardingSync] Invalid user missing name:', {
                    userId: user.id,
                    hasName: !!user.name,
                    nameType: typeof user.name
                  });
                  return false;
                }

                // Skip deleted users
                if (user.deleted) {
                  console.log('[OnboardingSync] Skipping deleted user:', user.id);
                  return false;
                }

                return true;
              });

            // Log successful import for debugging
            console.log('[OnboardingSync] Successfully imported users:', {
              count: syncedUsers.length,
              users: syncedUsers.map(u => ({
                id: u.id,
                name: u.name,
                hasIcon: !!u.icon,
                hasDays: !!u.days,
                hasActivities: !!u.activities,
                daysKeys: u.days ? Object.keys(u.days) : [],
                activitiesType: typeof u.activities
              }))
            });

            if (syncedUsers.length > 0) {
              setUsers(syncedUsers);
              setImportResult(result);
              setUserJourney(prev => ({ ...prev, syncEnabled: true }));

              // PHASE 1 DIAGNOSTIC: Wait for AsyncStorage flush, then reset flag
              console.log('[PHASE1] Waiting 2000ms for AsyncStorage flush...');
              await new Promise(resolve => setTimeout(resolve, 2000));
              console.log('[PHASE1] Resetting isSyncing=false after flush');
              if (syncStoreIntegration) {
                syncStoreIntegration.isSyncing = false;
              }

              // Skip to completion since users are already set up
              animateStepTransition('complete');
              return;
            }
          } catch (error) {
            console.error('[OnboardingSync] Error processing sync data:', error);
            // PHASE 1 DIAGNOSTIC: Reset flag on error
            if (syncStoreIntegration) {
              syncStoreIntegration.isSyncing = false;
            }
            throw new Error('Failed to import sync data. Please try again.');
          }
        }

        // No users in sync data, proceed to user setup
        setImportResult(result);
        setUserJourney(prev => ({ ...prev, syncEnabled: true }));

        // PHASE 1 DIAGNOSTIC: Wait for AsyncStorage flush, then reset flag
        console.log('[PHASE1] Waiting 2000ms for AsyncStorage flush...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('[PHASE1] Resetting isSyncing=false after flush');
        if (syncStoreIntegration) {
          syncStoreIntegration.isSyncing = false;
        }

        animateStepTransition('syncSuccess');
      } else {
        throw new Error('Failed to import sync data');
      }
    } catch (error) {
      setImportError(error.message || 'Failed to import sync data');
      // PHASE 1 DIAGNOSTIC: Ensure flag is reset on any error
      if (syncStoreIntegration) {
        syncStoreIntegration.isSyncing = false;
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    // CRITICAL FIX: When joining sync, wrap users in importedData structure
    // App.js expects onboardingData.importedData.users (line 1123)
    // NOT onboardingData.users (which triggers starter card creation)
    if (importResult && importResult.data) {
      // This is a sync import - use the correct structure
      const onboardingData = {
        importedData: importResult.data, // Contains users, currentUser, library, etc.
        pin: userJourney.pinEnabled ? pin : null,
        syncEnabled: userJourney.syncEnabled,
        recoveryPhrase: userJourney.syncEnabled ? (generatedSyncCode || recoveryPhrase) : null,
      };

      console.log('[OnboardingSync] Completing onboarding with importedData:', {
        userCount: Object.keys(importResult.data.users || {}).length,
        hasCurrentUser: !!importResult.data.currentUser,
        hasLibrary: !!importResult.data.library
      });

      onComplete(onboardingData);
    } else {
      // Regular onboarding (not sync import)
      const onboardingData = {
        users,
        pin: userJourney.pinEnabled ? pin : null,
        syncEnabled: userJourney.syncEnabled,
        recoveryPhrase: userJourney.syncEnabled ? (generatedSyncCode || recoveryPhrase) : null,
      };

      onComplete(onboardingData);
    }
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
            onAddUser={handleAddUser}
            onContinue={handleUserSetupContinue}
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
            recoveryPhrase={recoveryPhrase}
            setRecoveryPhrase={setRecoveryPhrase}
            syncLoading={syncLoading}
            syncError={syncError}
            isImporting={isImporting}
            importError={importError}
            onImport={importSyncData}
          />
        );

      case 'syncSuccess':
        return (
          <SyncSuccessScreen
            theme={defaultTheme}
            generatedSyncCode={generatedSyncCode || recoveryPhrase}
            importResult={importResult}
            onContinue={handleSyncSuccessContinue}
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
        <View style={[
          styles.safeArea,
          Platform.OS !== 'web' ? { paddingTop: insets.top } : null
        ]}>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OnboardingUserCentered;