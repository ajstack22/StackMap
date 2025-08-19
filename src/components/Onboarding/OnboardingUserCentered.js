// @ts-check
import React, { useState, useRef, useEffect } from 'react';
import { Text, TextInput } from '../Typography';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_USER_ICON } from '../../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../Logo/Logo';
import syncService from '../../services/sync/syncService';
import encryptionService from '../../services/sync/encryptionService';
import { useAppStore, useUserStore } from '../../stores';
import {
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  THEMES,
} from '../../constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = () => screenWidth >= 768;
const isMobileWeb = () =>
  Platform.OS === 'web' && Dimensions.get('window').width < 768;

const OnboardingUserCentered = ({
  onComplete,
  onImport,
  syncSetupPhrase = null,
  onShowPrivacy,
}) => {
  const defaultTheme = {
    primary: THEMES?.stackBlue?.primary || '#5C7E9D',
    dark: THEMES?.stackBlue?.dark || '#4A6680',
    light: THEMES?.stackBlue?.light || '#7896B3',
    text: '#000000',
    textSecondary: '#666666',
    background: '#FFFFFF',
    card: '#F5F5F5',
  };

  // Navigation state
  const [currentStep, setCurrentStep] = useState('welcome');
  const [navigationHistory, setNavigationHistory] = useState(['welcome']);

  // User choices state
  const [userJourney, setUserJourney] = useState({
    journeyType: null, // 'new' or 'existing'
    userType: null, // 'self', 'helper', 'group'
    deviceStrategy: null, // 'single' or 'multi'
    syncEnabled: false,
    pinEnabled: false,
  });

  // User data state
  const [userName, setUserName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_USER_ICON);
  const [users, setUsers] = useState([]);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Sync state
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncPreviewData, setSyncPreviewData] = useState(null);
  const [generatedSyncCode, setGeneratedSyncCode] = useState('');
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Quick emoji options
  const quickEmojis = [DEFAULT_USER_ICON, '😎', '🎯', '⭐', '🚀'];
  
  // Generate sync code when reaching the syncCreate step
  useEffect(() => {
    if (currentStep === 'syncCreate' && !generatedSyncCode) {
      generateNewSyncCode();
    }
  }, [currentStep, generatedSyncCode]);

  // Pre-populate if coming from sync URL
  useEffect(() => {
    if (syncSetupPhrase) {
      setRecoveryPhrase(syncSetupPhrase);
      setUserJourney(prev => ({ ...prev, journeyType: 'existing' }));
      setCurrentStep('syncImport');
    }
  }, [syncSetupPhrase]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Step transition animation
  const animateStepTransition = (nextStep) => {
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
    
    setNavigationHistory(prev => [...prev, nextStep]);
    setCurrentStep(nextStep);
  };

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const previousStep = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      animateStepTransition(previousStep);
    }
  };

  // Generate a new sync code
  const generateNewSyncCode = () => {
    const bytes = new Uint8Array(16);
    if (Platform.OS === 'web') {
      crypto.getRandomValues(bytes);
    } else {
      // Use better randomness on mobile with timestamp and Math.random
      const timestamp = Date.now();
      for (let i = 0; i < 16; i++) {
        // Mix timestamp with random for better entropy
        const seed = timestamp + i + Math.random() * 1000000;
        bytes[i] = Math.floor((Math.random() * seed) % 256);
      }
    }
    const hexCode = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('[Onboarding] Generated new sync code:', hexCode);
    setGeneratedSyncCode(hexCode);
    return hexCode;
  };

  // Copy sync code to clipboard
  const copySyncCode = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(generatedSyncCode);
      } else {
        const Clipboard = require('@react-native-clipboard/clipboard').default;
        Clipboard.setString(generatedSyncCode);
      }
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Fetch sync preview
  const fetchSyncPreview = async () => {
    setSyncLoading(true);
    setSyncError('');
    
    try {
      const phraseToUse = recoveryPhrase.trim().replace(/\s+/g, '');
      
      console.log('[Onboarding] Checking sync code:', phraseToUse);
      
      if (phraseToUse.length !== 32 || !/^[a-f0-9]+$/i.test(phraseToUse)) {
        throw new Error('Invalid sync code format');
      }

      await syncService.initialize(phraseToUse);
      console.log('[Onboarding] After initialize, syncId:', syncService.syncId);
      
      const pullResult = await syncService.pullData();
      console.log('[Onboarding] Pull result:', pullResult);
      
      if (!pullResult || !pullResult.data) {
        console.error('[Onboarding] No data found. pullResult:', pullResult);
        throw new Error('No data found for this sync code');
      }

      const users = pullResult.data.users || {};
      const userCount = Object.keys(users).filter(id => !users[id].deleted).length;
      
      setSyncPreviewData({
        userCount,
        users: Object.values(users).filter(u => !u.deleted).map(u => ({
          name: u.name,
          icon: u.icon || u.emoji || DEFAULT_USER_ICON,
        })),
        hasLibrary: pullResult.data.library && pullResult.data.library.categories?.length > 0,
      });
    } catch (error) {
      setSyncError(error.message || 'Failed to fetch sync data');
    } finally {
      setSyncLoading(false);
    }
  };

  // Import sync data
  const importSyncData = async () => {
    setSyncLoading(true);
    setSyncError('');
    
    try {
      const phraseToUse = recoveryPhrase.trim().replace(/\s+/g, '');
      
      await syncService.initialize(phraseToUse);
      const pullResult = await syncService.pullData();
      
      if (!pullResult || !pullResult.data) {
        throw new Error('Failed to import data');
      }

      // Enable sync and complete onboarding with imported data
      await AsyncStorage.setItem('syncEnabled', 'true');
      await AsyncStorage.setItem('syncRecoveryPhrase', phraseToUse);
      
      onComplete({
        importedData: pullResult.data,
        syncEnabled: true,
        recoveryPhrase: phraseToUse,
      });
    } catch (error) {
      setSyncError(error.message || 'Failed to import data');
    } finally {
      setSyncLoading(false);
    }
  };

  // Create new sync
  const createNewSync = async () => {
    setSyncLoading(true);
    setSyncError('');
    
    try {
      // First, create users in the store before setting up sync
      if (users.length > 0) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const usersObj = {};
        let firstUserId = null;
        
        // Create starter activities for the first user - same as in App.js
        const starterActivities = [
          {
            id: `${timestamp}_1_${randomId}`,
            text: 'Welcome to StackMap!',
            icon: '👋',
            description: 'Tap activities to mark them complete',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_2_${randomId}`,
            text: 'Try Edit Mode',
            icon: '✏️',
            description: 'Use the edit button to add, remove, and organize activities',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_3_${randomId}`,
            text: 'Switch Users',
            icon: '👤',
            description: 'Tap your user pill to switch users or check-in',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_4_${randomId}`,
            text: 'Share with Providers',
            icon: '🔗',
            description: 'Share your activities with caregivers via QR code or link',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_5_${randomId}`,
            text: 'Sync Across Devices',
            icon: '🔄',
            description: 'Keep your data synced with zero-knowledge encryption',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_6_${randomId}`,
            text: 'Import & Export',
            icon: '📦',
            description: 'Backup your data or transfer between devices',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_7_${randomId}`,
            text: 'Preferences',
            icon: '🎨',
            description: 'Tap the palette icon to customize colors, animations, and display',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_8_${randomId}`,
            text: 'Activities',
            icon: '📋',
            description: 'Tap the + icon to add new activities and build your library',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_9_${randomId}`,
            text: 'Day',
            icon: '📅',
            description: 'Use the calendar icon to plan tomorrow or review past days',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_10_${randomId}`,
            text: 'Access',
            icon: '👥',
            description: 'Add multiple users with the crown icon in preferences',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_11_${randomId}`,
            text: 'Data',
            icon: '💾',
            description: 'Backup, restore, sync, and manage your StackMap data',
            pinned: false,
            completed: false
          },
          {
            id: `${timestamp}_12_${randomId}`,
            text: 'Explore the Library',
            icon: '📚',
            description: 'Check out pre-made activity templates in the StackMap Library',
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
        
        // Set users in store
        useUserStore.getState().setUsers(usersObj);
        
        // Set the first user as current user
        useAppStore.getState().setCurrentUser(firstUserId);
        
        // Log to verify users were set with activities
        const verifyState = useAppStore.getState();
        console.log('[Onboarding] After setting users, state check:', {
          hasUsers: !!verifyState.users,
          userCount: Object.keys(verifyState.users || {}).length,
          firstUserActivities: verifyState.users?.[firstUserId]?.days?.today?.activities?.length || 0,
          firstUserName: verifyState.users?.[firstUserId]?.name
        });
        
        // Wait longer for store to fully update before sync
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Use the already generated code, or generate a new one if needed
      let syncCode = generatedSyncCode;
      if (!syncCode) {
        syncCode = generateNewSyncCode();
        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('[Onboarding] Using sync code for initialization:', syncCode);
      
      // Initialize will create the sync group if it doesn't exist
      await syncService.initialize(syncCode);
      
      // Don't force sync here - the periodic sync will handle it
      // Since we're not marking as synced in initialize for new syncs,
      // the first periodic sync will push all the data
      
      await AsyncStorage.setItem('syncEnabled', 'true');
      await AsyncStorage.setItem('syncRecoveryPhrase', syncCode);
      
      setUserJourney(prev => ({ ...prev, syncEnabled: true }));
      animateStepTransition('syncSuccess');
    } catch (error) {
      console.error('Sync creation error:', error);
      // If sync already exists (409), generate a new code for retry
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

  // Render step content - render JSX directly to avoid component recreation
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'userType':
        return renderUserTypeStep();
      case 'deviceStrategy':
        return renderDeviceStrategyStep();
      case 'userSetup':
        return renderUserSetupStep();
      case 'pinSetup':
        return renderPinSetupStep();
      case 'syncChoice':
        return renderSyncChoiceStep();
      case 'syncCreate':
        return renderSyncCreateStep();
      case 'existingUser':
        return renderExistingUserStep();
      case 'syncImport':
        return renderSyncImportStep();
      case 'syncSuccess':
        return renderSyncSuccessStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  // Step Render Functions (not components to avoid recreation)
  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.logoSection}>
        <Logo size={screenWidth >= 768 ? 100 : 80} theme={defaultTheme} color={defaultTheme.primary} />
        <Text style={styles.logoText}>StackMap</Text>
        <Text style={styles.tagline}>Better days through shared understanding</Text>
      </View>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: defaultTheme.primary }]}
          onPress={() => {
            setUserJourney(prev => ({ ...prev, journeyType: 'new' }));
            animateStepTransition('userType');
          }}
        >
          <Text style={styles.buttonText}>I'm new to StackMap</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            setUserJourney(prev => ({ ...prev, journeyType: 'existing' }));
            animateStepTransition('existingUser');
          }}
        >
          <Text style={[styles.secondaryButtonText, { color: defaultTheme.primary }]}>
            I already use StackMap
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footerLinks}>
        <TouchableOpacity
          style={styles.footerLink}
          onPress={() => onShowPrivacy?.()}
        >
          <Text style={[styles.footerLinkText, { color: defaultTheme.primary }]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
        
        {Platform.OS === 'web' && (
          <>
            <Text style={styles.footerSeparator}>•</Text>
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => {
                if (Platform.OS === 'web') {
                  window.open('https://buymeacoffee.com/adamstackmap', '_blank');
                }
              }}
            >
              <Text style={[styles.footerLinkText, { color: defaultTheme.primary }]}>
                Support StackMap
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const renderExistingUserStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Restore Your StackMap</Text>
      <Text style={styles.subtitle}>
        How would you like to recover your data?
      </Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionCard, { borderColor: defaultTheme.primary }]}
          onPress={() => animateStepTransition('syncImport')}
        >
          <Icon name="cloud-download" size={40} color={defaultTheme.primary} />
          <Text style={styles.optionTitle}>Join Sync</Text>
          <Text style={styles.optionDescription}>
            Connect with your other devices using a sync code
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.optionCard, { borderColor: defaultTheme.primary }]}
          onPress={async () => {
            try {
              const result = await onImport();
              if (result && result.success) {
                // Import was successful, complete onboarding with imported data
                onComplete({
                  importedData: result.data,
                  isImport: true,
                });
              }
            } catch (error) {
              console.error('Import failed:', error);
            }
          }}
        >
          <Icon name="upload-file" size={40} color={defaultTheme.primary} />
          <Text style={styles.optionTitle}>Import Backup</Text>
          <Text style={styles.optionDescription}>
            Restore from a local backup file
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => {
          setUserJourney(prev => ({ ...prev, journeyType: 'new' }));
          animateStepTransition('userType');
        }}
      >
        <Text style={[styles.skipButtonText, { color: defaultTheme.textSecondary }]}>
          Start fresh instead
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderUserTypeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Who will use StackMap?</Text>
      <Text style={styles.subtitle}>
        This helps us customize your experience
      </Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionCard, { borderColor: defaultTheme.primary }]}
          onPress={() => {
            setUserJourney(prev => ({ ...prev, userType: 'self' }));
            animateStepTransition('deviceStrategy');
          }}
        >
          <Icon name="person" size={40} color={defaultTheme.primary} />
          <Text style={styles.optionTitle}>Just Me</Text>
          <Text style={styles.optionDescription}>
            I'll use this for my own activities
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.optionCard, { borderColor: defaultTheme.primary }]}
          onPress={() => {
            setUserJourney(prev => ({ ...prev, userType: 'helper' }));
            animateStepTransition('deviceStrategy');
          }}
        >
          <Icon name="supervisor-account" size={40} color={defaultTheme.primary} />
          <Text style={styles.optionTitle}>I'm Helping Someone</Text>
          <Text style={styles.optionDescription}>
            Parent, caregiver, or teacher
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.optionCard, { borderColor: defaultTheme.primary }]}
          onPress={() => {
            setUserJourney(prev => ({ ...prev, userType: 'group' }));
            animateStepTransition('deviceStrategy');
          }}
        >
          <Icon name="groups" size={40} color={defaultTheme.primary} />
          <Text style={styles.optionTitle}>Multiple People</Text>
          <Text style={styles.optionDescription}>
            Family or classroom sharing
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDeviceStrategyStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>How many devices?</Text>
      <Text style={styles.subtitle}>
        Will you use StackMap on multiple devices?
      </Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionCard, { borderColor: defaultTheme.primary }]}
          onPress={() => {
            setUserJourney(prev => ({ ...prev, deviceStrategy: 'single' }));
            animateStepTransition('userSetup');
          }}
        >
          <Icon name="smartphone" size={40} color={defaultTheme.primary} />
          <Text style={styles.optionTitle}>Just This Device</Text>
          <Text style={styles.optionDescription}>
            I'll only use StackMap here
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.optionCard, { borderColor: defaultTheme.primary }]}
          onPress={() => {
            setUserJourney(prev => ({ ...prev, deviceStrategy: 'multi', syncEnabled: true }));
            animateStepTransition('userSetup');
          }}
        >
          <Icon name="devices" size={40} color={defaultTheme.primary} />
          <Text style={styles.optionTitle}>Multiple Devices</Text>
          <Text style={styles.optionDescription}>
            Phone, tablet, computer, etc.
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => animateStepTransition('userSetup')}
      >
        <Text style={[styles.skipButtonText, { color: defaultTheme.textSecondary }]}>
          I'll decide later
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderUserSetupStep = () => {
    const addUser = () => {
      if (userName.trim()) {
        const newUser = {
          id: Date.now().toString(),
          name: userName.trim(),
          icon: selectedEmoji,
        };
        setUsers([...users, newUser]);
        setUserName('');
        setSelectedEmoji(DEFAULT_USER_ICON);
      }
    };

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.title}>
          {users.length === 0 ? 'Create Your First User' : 'Add Another User?'}
        </Text>
        <Text style={styles.subtitle}>
          {userJourney.userType === 'helper' 
            ? 'Add the person you\'re helping'
            : 'Set up your profile'}
        </Text>
        
        {users.length > 0 && (
          <View style={styles.usersList}>
            {users.map(user => (
              <View key={user.id} style={styles.userPill}>
                <Text style={styles.userPillEmoji}>{user.icon}</Text>
                <Text style={styles.userPillName}>{user.name}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="words"
          />
          
          <View style={styles.emojiSelector}>
            {quickEmojis.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiOption,
                  selectedEmoji === emoji && { backgroundColor: defaultTheme.light },
                ]}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: defaultTheme.primary }]}
            onPress={addUser}
            disabled={!userName.trim()}
          >
            <Text style={styles.buttonText}>
              {users.length === 0 ? 'Add User' : 'Add Another'}
            </Text>
          </TouchableOpacity>
          
          {users.length > 0 && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                if (userJourney.userType === 'group' || userJourney.userType === 'helper') {
                  animateStepTransition('pinSetup');
                } else if (userJourney.deviceStrategy === 'multi') {
                  animateStepTransition('syncCreate');
                } else {
                  animateStepTransition('complete');
                }
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: defaultTheme.primary }]}>
                Continue
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderPinSetupStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Protect with PIN?</Text>
      <Text style={styles.subtitle}>
        Keep your StackMap secure with a 4-digit PIN
      </Text>
      
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder="Enter 4-digit PIN"
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
        />
        
        {pin.length === 4 && (
          <TextInput
            style={styles.input}
            placeholder="Confirm PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={4}
          />
        )}
        
        {pinError && (
          <Text style={styles.errorText}>{pinError}</Text>
        )}
      </View>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: defaultTheme.primary }]}
          onPress={() => {
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
          disabled={pin.length !== 4 || confirmPin.length !== 4}
        >
          <Text style={styles.buttonText}>Set PIN</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            if (userJourney.deviceStrategy === 'multi') {
              animateStepTransition('syncCreate');
            } else {
              animateStepTransition('complete');
            }
          }}
        >
          <Text style={[styles.skipButtonText, { color: defaultTheme.textSecondary }]}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSyncChoiceStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Enable Sync?</Text>
      <Text style={styles.subtitle}>
        Access your StackMap on multiple devices
      </Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionCard, { borderColor: defaultTheme.primary }]}
          onPress={() => animateStepTransition('syncCreate')}
        >
          <Icon name="cloud-upload" size={40} color={defaultTheme.primary} />
          <Text style={styles.optionTitle}>Create New Sync</Text>
          <Text style={styles.optionDescription}>
            Start syncing across devices
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.optionCard, { borderColor: defaultTheme.primary }]}
          onPress={() => animateStepTransition('syncImport')}
        >
          <Icon name="cloud-download" size={40} color={defaultTheme.primary} />
          <Text style={styles.optionTitle}>Join Existing Sync</Text>
          <Text style={styles.optionDescription}>
            Connect to another device
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => animateStepTransition('complete')}
      >
        <Text style={[styles.skipButtonText, { color: defaultTheme.textSecondary }]}>
          Skip for now
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSyncCreateStep = () => (
      <View style={styles.stepContainer}>
        <Text style={styles.title}>Your Sync Code</Text>
        <Text style={styles.subtitle}>
          Save this code to sync with other devices
        </Text>
        
        <View style={styles.syncCodeContainer}>
          <Text style={styles.syncCode}>{generatedSyncCode}</Text>
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: defaultTheme.primary }]}
            onPress={copySyncCode}
          >
            <Icon name="content-copy" size={20} color="#fff" />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
        
        {showCopiedToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>Copied to clipboard!</Text>
          </View>
        )}
        
        <Text style={styles.warningText}>
          ⚠️ Save this code securely. You'll need it to sync other devices.
        </Text>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: defaultTheme.primary }]}
            onPress={createNewSync}
            disabled={syncLoading}
          >
            {syncLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enable Sync</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {syncError && (
          <Text style={styles.errorText}>{syncError}</Text>
        )}
      </View>
    );

  const renderSyncImportStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Enter Sync Code</Text>
      <Text style={styles.subtitle}>
        Join an existing StackMap
      </Text>
      
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder="Enter 32-character sync code"
          value={recoveryPhrase}
          onChangeText={setRecoveryPhrase}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {recoveryPhrase.length > 0 && (
          <Text style={styles.charCount}>
            {recoveryPhrase.replace(/\s+/g, '').length}/32 characters
          </Text>
        )}
      </View>
      
      {syncPreviewData && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Found StackMap with:</Text>
          <Text style={styles.previewText}>
            • {syncPreviewData.userCount} user{syncPreviewData.userCount !== 1 ? 's' : ''}
          </Text>
          {syncPreviewData.hasLibrary && (
            <Text style={styles.previewText}>• Activity library</Text>
          )}
        </View>
      )}
      
      <View style={styles.optionsContainer}>
        {!syncPreviewData ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: defaultTheme.primary }]}
            onPress={fetchSyncPreview}
            disabled={syncLoading || recoveryPhrase.replace(/\s+/g, '').length !== 32}
          >
            {syncLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Check Code</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: defaultTheme.primary }]}
            onPress={importSyncData}
            disabled={syncLoading}
          >
            {syncLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Import & Continue</Text>
            )}
          </TouchableOpacity>
        )}
        
        {!syncSetupPhrase && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => animateStepTransition('userType')}
          >
            <Text style={[styles.skipButtonText, { color: defaultTheme.textSecondary }]}>
              Start fresh instead
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {syncError && (
        <Text style={styles.errorText}>{syncError}</Text>
      )}
    </View>
  );

  const renderSyncSuccessStep = () => (
    <View style={styles.stepContainer}>
      <Icon name="check-circle" size={80} color={defaultTheme.primary} />
      <Text style={styles.title}>Sync Enabled!</Text>
      <Text style={styles.subtitle}>
        Your StackMap will sync across all your devices
      </Text>
      
      <View style={styles.successInfo}>
        <Text style={styles.infoText}>
          Your sync code has been saved securely
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: defaultTheme.primary }]}
        onPress={() => animateStepTransition('complete')}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <Icon name="celebration" size={80} color={defaultTheme.primary} />
      <Text style={styles.title}>All Set!</Text>
      <Text style={styles.subtitle}>
        Your StackMap is ready to use
      </Text>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Your Setup:</Text>
        <Text style={styles.summaryText}>
          • {users.length} user{users.length !== 1 ? 's' : ''} created
        </Text>
        {userJourney.pinEnabled && (
          <Text style={styles.summaryText}>• PIN protection enabled</Text>
        )}
        {userJourney.syncEnabled && (
          <Text style={styles.summaryText}>• Sync enabled</Text>
        )}
      </View>
      
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: defaultTheme.primary }]}
        onPress={completeOnboarding}
      >
        <Text style={styles.buttonText}>Start Using StackMap</Text>
      </TouchableOpacity>
    </View>
  );

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

const SafeAreaView = ({ children, style }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ paddingTop: insets.top, paddingBottom: insets.bottom }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: screenWidth >= 768 ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: screenWidth >= 768 ? 32 : 28,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: 'bold',
    color: '#000',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: screenWidth >= 768 ? 18 : 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    marginTop: SPACING.lg,
  },
  primaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: '#5C7E9D',
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: '600',
  },
  skipButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  optionCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: '600',
    color: '#000',
    marginTop: SPACING.sm,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginBottom: SPACING.md,
  },
  emojiSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  emojiOption: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  emojiText: {
    fontSize: 30,
  },
  usersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.round,
    margin: SPACING.xs,
  },
  userPillEmoji: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  userPillName: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  charCount: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    textAlign: 'right',
  },
  syncCodeContainer: {
    backgroundColor: '#f5f5f5',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginVertical: SPACING.lg,
    width: '100%',
  },
  syncCode: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#000',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginLeft: SPACING.xs,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  warningText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#ff9800',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  previewContainer: {
    backgroundColor: '#f5f5f5',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: '600',
    color: '#000',
    marginBottom: SPACING.sm,
  },
  previewText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    marginBottom: SPACING.xs,
  },
  successInfo: {
    backgroundColor: '#e8f5e9',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.lg,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#2e7d32',
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: '#f5f5f5',
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.lg,
    width: '100%',
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: '600',
    color: '#000',
    marginBottom: SPACING.sm,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    marginBottom: SPACING.xs,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoText: {
    fontSize: screenWidth >= 768 ? 36 : 32,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: 'bold',
    color: '#000',
    marginTop: SPACING.md,
  },
  tagline: {
    fontSize: screenWidth >= 768 ? 16 : 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  footerLink: {
    padding: SPACING.sm,
  },
  footerLinkText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: SPACING.sm,
  },
});

export default OnboardingUserCentered;