import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../Logo/Logo';
import SyncStatusIndicator from '../SyncStatusIndicator';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  THEMES,
} from '../../constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = () => screenWidth >= 768;
const isMobileWeb = () => Platform.OS === 'web' && Dimensions.get('window').width < 768;

// Updated: 2025-07-18 16:45 - Fixed mobile layout
const OnboardingNew = ({ onComplete, onImport, isAbbreviated = false, syncSetupPhrase = null }) => {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [userName, setUserName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [users, setUsers] = useState([]);
  const [emojiInputValue, setEmojiInputValue] = useState('');
  const [importSuccessful, setImportSuccessful] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeFeature, setActiveFeature] = useState(0);
  
  // Sync-related state
  const [recoveryInput, setRecoveryInput] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start at 0 for fade in
  const slideAnim = useRef(new Animated.Value(0)).current;
  const featureFadeAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  
  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const quickEmojis = ['😊', '😎', '🎯', '⭐', '🚀'];
  
  const features = [
    {
      id: 'preferences',
      icon: 'palette',
      title: 'Preferences',
      bullets: [
        'Set theme',
        'Show/hide card completion status/number/time',
        'Celebration customization'
      ]
    },
    {
      id: 'user',
      icon: null, // Will show user pill
      title: 'User Check-In',
      bullets: [
        'Change User',
        'Check-in on day/feelings/weather/temperature',
        'In edit mode shortcut to Planning (Day/User)'
      ]
    },
    {
      id: 'edit',
      icon: 'edit',
      title: 'Edit Mode',
      bullets: [
        'Create new activities or add from Library',
        'Get ahead on tomorrow with planning',
        'User and backups settings'
      ]
    }
  ];

  const transitionTo = (nextScreen) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentScreen(nextScreen);
      slideAnim.setValue(50);
      
      // Reset sync state when entering sync screen
      if (nextScreen === 'sync') {
        setRecoveryInput('');
        setSyncError('');
      }
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const addUser = () => {
    if (userName.trim()) {
      setUsers([...users, { name: userName.trim(), emoji: selectedEmoji }]);
      setUserName('');
      setSelectedEmoji('😊');
      
      if (users.length === 0) {
        transitionTo('features');
      } else {
        transitionTo('setupPin');
      }
    }
  };

  // Carousel effect for features
  useEffect(() => {
    if (currentScreen === 'features') {
      const interval = setInterval(() => {
        Animated.timing(featureFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setActiveFeature((prev) => (prev + 1) % features.length);
          Animated.timing(featureFadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      }, 4000); // 4 seconds per feature

      return () => clearInterval(interval);
    }
  }, [currentScreen, activeFeature]);

  const renderContent = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={[styles.welcomeContent, {
              paddingTop: Platform.OS === 'web' ? styles.welcomeContent.paddingTop : (40 + insets.top),
              paddingBottom: Platform.OS === 'web' ? styles.welcomeContent.paddingBottom : (20 + insets.bottom)
            }]}
            showsVerticalScrollIndicator={false}
          >
            <Logo size={Platform.OS === 'web' ? 80 : 60} theme={{ primary: THEMES.stackBlue.primary }} color={THEMES.stackBlue.primary} />
            <Text style={styles.welcomeTitle}>StackMap</Text>
            <Text style={styles.welcomeSubtitle}>Routine Ready</Text>
            
            <View style={styles.cardsContainer}>
              <View style={styles.card}>
                <Text style={styles.cardIcon}>🧠</Text>
                <Text style={styles.cardDescription}>Built to help people that think differently</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardIcon}>💬</Text>
                <Text style={styles.cardDescription}>Creates shared context{'\n'}for conversations</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardIcon}>🔄</Text>
                <Text style={styles.cardDescription}>A routine built around routines</Text>
              </View>
            </View>

            {isAbbreviated ? (
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => transitionTo('features')}
              >
                <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>Continue</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => transitionTo('createUser')}
                >
                  <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>Start Fresh</Text>
                </TouchableOpacity>
                
                <View style={styles.secondaryButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.secondaryButton, styles.secondaryButtonEqual]}
                    onPress={async () => {
                      try {
                        await onImport();
                        // If import was successful, mark it and go to features
                        setImportSuccessful(true);
                        transitionTo('features');
                      } catch (error) {
                        // Import was cancelled or failed, stay on welcome screen
                        console.log('Import cancelled or failed');
                      }
                    }}
                  >
                    <Icon name="folder-open" size={20} color={THEMES.stackBlue.primary} style={styles.buttonIcon} />
                    <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Restore StackMap</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.secondaryButton, styles.secondaryButtonEqual]}
                    onPress={() => transitionTo('sync')}
                  >
                    <Icon name="cloud-sync" size={20} color={THEMES.stackBlue.primary} style={styles.buttonIcon} />
                    <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Sync StackMap</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        );

      case 'createUser':
        return (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.createUserContainer, {
              paddingTop: Platform.OS === 'web' ? SPACING.xxl : (SPACING.xxl + insets.top),
              paddingBottom: Platform.OS === 'web' ? SPACING.xxl : (SPACING.xxl + insets.bottom)
            }]}
          >
            <Text style={styles.screenTitle}>
              {users.length === 0 ? "Let's create your first user" : "Add another user"}
            </Text>
            
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter name"
                placeholderTextColor={COLORS.gray[400]}
                value={userName}
                onChangeText={setUserName}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={addUser}
              />
              
              <Text style={styles.inputLabel}>Choose an emoji</Text>
              <View style={styles.emojiSelection}>
                {quickEmojis.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      selectedEmoji === emoji && styles.emojiSelected
                    ]}
                    onPress={() => {
                      setSelectedEmoji(emoji);
                      setEmojiInputValue('');
                    }}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.orText}>or</Text>
              
              <View style={styles.emojiInputContainer}>
                <TextInput
                  style={[styles.emojiInput, emojiInputValue && { fontSize: 28 }]}
                  placeholder="Enter emoji here"
                  placeholderTextColor={COLORS.gray[400]}
                  value={emojiInputValue}
                  onChangeText={(text) => {
                    // Handle clearing
                    if (text === '') {
                      setEmojiInputValue('');
                      return;
                    }
                    
                    // Check if the text contains only ASCII characters (reject these)
                    if (/^[a-zA-Z0-9\s\.,!?@#$%^&*()_+\-=\[\]{};':"\\|<>\/~`]+$/.test(text)) {
                      // It's only regular characters - keep previous value
                      return;
                    }
                    
                    // For anything else (emojis, special characters), accept it
                    // This includes emojis with variation selectors like 🗺️
                    setSelectedEmoji(text);
                    setEmojiInputValue(text);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={4}
                />
              </View>
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Preview:</Text>
              <View style={styles.userPill}>
                <Text style={styles.pillEmoji}>{selectedEmoji}</Text>
                <Text style={styles.pillName}>{userName || 'Your name'}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, !userName.trim() && styles.disabledButton]}
              onPress={addUser}
              disabled={!userName.trim()}
            >
              <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>
                {users.length === 0 ? 'Continue' : 'Add User'}
              </Text>
            </TouchableOpacity>

            {users.length === 0 && (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => transitionTo('welcome')}
              >
                <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Back</Text>
              </TouchableOpacity>
            )}

          </KeyboardAvoidingView>
        );

      case 'features':
        const currentFeature = features[activeFeature];
        return (
          <View style={styles.featuresContainer}>
            <ScrollView 
              style={styles.scrollContent} 
              contentContainerStyle={[styles.featuresScrollContent, {
                paddingBottom: Platform.OS === 'web' ? SPACING.lg : (40 + insets.bottom),
                paddingTop: Platform.OS === 'web' ? styles.featuresScrollContent.paddingTop : (60 + insets.top)
              }]}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.screenTitle}>How to use StackMap</Text>
              
              {syncEnabled && (
                <View style={{ marginBottom: SPACING.lg, alignItems: 'center' }}>
                  <SyncStatusIndicator theme={THEMES.stackBlue} />
                </View>
              )}
              
              {importSuccessful && (
                <View style={{ marginBottom: SPACING.lg, alignItems: 'center' }}>
                  <View style={styles.successBanner}>
                    <Icon name="check-circle" size={20} color={THEMES.stackBlue.primary} />
                    <Text style={styles.successText}>Data imported successfully!</Text>
                  </View>
                </View>
              )}
              
              <View style={(Platform.OS === 'web' && !isMobileWeb()) ? styles.desktopFeatureLayout : null}>
              <View style={[styles.controlsRow, (Platform.OS === 'web' && !isMobileWeb()) && styles.controlsRowDesktop]}>
                {features.map((feature, index) => (
                  <TouchableOpacity
                    key={feature.id}
                    style={styles.fabItem}
                    onPress={() => setActiveFeature(index)}
                  >
                    {feature.icon ? (
                      <View style={[
                        styles.whiteFab,
                        activeFeature === index && styles.activeFab
                      ]}>
                        <Icon 
                          name={feature.icon} 
                          size={Platform.OS === 'web' ? 28 : (isTablet() ? 44 : 32)} 
                          color={activeFeature === index ? 'white' : THEMES.stackBlue.primary} 
                        />
                      </View>
                    ) : (
                      <View style={[
                        styles.userPill,
                        activeFeature === index && styles.activeUserPill
                      ]}>
                        <Text style={styles.pillEmoji}>{users[0]?.emoji || '😊'}</Text>
                        <Text style={[
                          styles.pillName,
                          activeFeature === index && styles.activePillName
                        ]}>{users[0]?.name || 'User'}</Text>
                      </View>
                    )}
                    <Text style={[
                      styles.fabLabel,
                      activeFeature === index && styles.activeFabLabel
                    ]}>{feature.id === 'user' ? 'User' : feature.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.featureDetailsWrapper}>
                <Animated.View 
                  style={[
                    styles.featureDetails,
                    { opacity: featureFadeAnim }
                  ]}
                >
                  <Text style={styles.featureTitle}>{currentFeature.title}</Text>
                  <View style={styles.bulletList}>
                    {currentFeature.bullets.map((bullet, index) => (
                      <View key={index} style={styles.bulletRow}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              </View>
              </View>

              <View style={styles.carouselIndicators}>
                {features.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      activeFeature === index && styles.activeIndicator
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => {
                  if (isAbbreviated) {
                    // For abbreviated onboarding, complete without user/pin setup
                    onComplete({ isAbbreviated: true, syncSetupPhrase });
                  } else if (users.length > 0) {
                    transitionTo('setupPin');
                  } else {
                    transitionTo('createUser');
                  }
                }}
              >
                <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>
                  {isAbbreviated ? 'Continue to StackMap' : (users.length > 0 ? 'Continue to StackMap' : 'Create First User')}
                </Text>
              </TouchableOpacity>

              {!isAbbreviated && users.length < 3 && (
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={() => transitionTo('createUser')}
                >
                  <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Add Another User</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        );

      case 'sync':
        const handleSyncSetup = async () => {
          setSyncLoading(true);
          setSyncError('');
          
          try {
            const syncService = require('../../services/sync/syncService').default;
            
            // First check if this is an existing sync group
            const syncId = await syncService.generateSyncId(recoveryInput.trim());
            const deviceId = await syncService.encryptionService.getDeviceId();
            
            // Try to fetch existing sync data
            const checkUrl = `${syncService.API_BASE_URL}/pull.php?sync_id=${syncId}&device_id=${deviceId}`;
            const checkResponse = await fetch(checkUrl);
            
            if (checkResponse.status === 404) {
              // Sync group doesn't exist - invalid recovery phrase for joining
              throw new Error('Invalid recovery phrase - no sync group found');
            }
            
            // Now initialize with the recovery phrase
            await syncService.initialize(recoveryInput.trim());
            
            // Check if sync restored users
            const { useAppStore } = require('../../stores');
            const syncedUsers = useAppStore.getState().users;
            
            if (syncedUsers && Object.keys(syncedUsers).length > 0) {
              // Users already exist from sync, skip user creation
              const userList = Object.values(syncedUsers);
              setUsers(userList);
              setSyncEnabled(true);
              
              // Go to features carousel to complete onboarding nicely
              transitionTo('features');
            } else {
              // No users in sync but group exists, continue to user creation
              setSyncEnabled(true);
              transitionTo('createUser');
            }
          } catch (error) {
            // Stay on sync screen with error message
            if (error.message.includes('Invalid recovery phrase')) {
              setSyncError('Invalid recovery phrase. Please check and try again.');
            } else if (error.message.includes('Network')) {
              setSyncError('Network error. Please check your connection and try again.');
            } else {
              setSyncError(error.message || 'Failed to join sync. Please try again.');
            }
          } finally {
            setSyncLoading(false);
          }
        };
        
        return (
          <View style={styles.container}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView 
                style={styles.scrollContent} 
                contentContainerStyle={[styles.syncContent, {
                  paddingBottom: Platform.OS === 'web' ? SPACING.xl : (20 + insets.bottom),
                  paddingTop: Platform.OS === 'web' ? SPACING.xl : (20 + insets.top)
                }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Logo size={isTablet() ? 50 : 40} theme={{ primary: THEMES.stackBlue.primary }} color={THEMES.stackBlue.primary} />
                <Text style={styles.screenTitle}>Sync Your StackMap</Text>
                <Text style={styles.screenSubtitle}>
                  Connect to your existing sync group
                </Text>
                
                <View style={styles.syncFeatures}>
                  <View style={styles.syncFeature}>
                    <View style={styles.syncFeatureIcon}>
                      <Icon name="lock" size={20} color={THEMES.stackBlue.primary} />
                    </View>
                    <Text style={styles.syncFeatureText}>End-to-end encrypted</Text>
                  </View>
                  <View style={styles.syncFeature}>
                    <View style={styles.syncFeatureIcon}>
                      <Icon name="sync" size={20} color={THEMES.stackBlue.primary} />
                    </View>
                    <Text style={styles.syncFeatureText}>Automatic sync</Text>
                  </View>
                  <View style={styles.syncFeature}>
                    <View style={styles.syncFeatureIcon}>
                      <Icon name="devices" size={20} color={THEMES.stackBlue.primary} />
                    </View>
                    <Text style={styles.syncFeatureText}>Multi-device support</Text>
                  </View>
                </View>
                
                <View style={styles.formSection}>
                  <Text style={styles.inputLabel}>Recovery Phrase</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      fontSize: isTablet() ? 16 : 14,
                      borderColor: syncError ? COLORS.error : COLORS.gray[300],
                    }]}
                    placeholder="Enter your recovery phrase"
                    placeholderTextColor={COLORS.gray[400]}
                    value={recoveryInput}
                    onChangeText={(text) => {
                      setRecoveryInput(text);
                      if (syncError) setSyncError(''); // Clear error when typing
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={Platform.OS === 'web'}
                  />
                  {syncError ? (
                    <Text style={styles.errorText}>{syncError}</Text>
                  ) : null}
                </View>
                
                <View style={styles.buttonGroup}>
                  <TouchableOpacity 
                    style={[styles.primaryButton, syncLoading && styles.disabledButton]}
                    onPress={handleSyncSetup}
                    disabled={syncLoading || !recoveryInput.trim()}
                  >
                    {syncLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>Join Sync</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={() => transitionTo('welcome')}
                  >
                    <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Back</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        );

      case 'setupPin':
        const handlePinSetup = () => {
          if (pin && pin === confirmPin) {
            transitionTo('complete');
          } else if (pin !== confirmPin) {
            setPinError('PINs do not match');
          }
        };
        
        return (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.createUserContainer, {
              paddingTop: Platform.OS === 'web' ? SPACING.xxl : (SPACING.xxl + insets.top),
              paddingBottom: Platform.OS === 'web' ? SPACING.xxl : (SPACING.xxl + insets.bottom)
            }]}
          >
            <Text style={styles.screenTitle}>Secure Your StackMap</Text>
            <Text style={styles.screenSubtitle}>
              Set up a PIN to protect your edit mode and settings (optional)
            </Text>
            
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Create PIN</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter 4-6 digit PIN"
                placeholderTextColor={COLORS.gray[400]}
                value={pin}
                onChangeText={(text) => {
                  setPinError('');
                  setPin(text.replace(/\D/g, ''));
                }}
                keyboardType="numeric"
                secureTextEntry={true}
                maxLength={6}
                autoFocus
              />
              
              <Text style={[styles.inputLabel, { marginTop: 20 }]}>Confirm PIN</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Re-enter PIN"
                placeholderTextColor={COLORS.gray[400]}
                value={confirmPin}
                onChangeText={(text) => {
                  setPinError('');
                  setConfirmPin(text.replace(/\D/g, ''));
                }}
                keyboardType="numeric"
                secureTextEntry={true}
                maxLength={6}
              />
              
              {pinError ? (
                <Text style={styles.errorText}>{pinError}</Text>
              ) : null}
            </View>
            
            <TouchableOpacity 
              style={[styles.primaryButton, (!pin || pin.length < 4 || !confirmPin) && styles.disabledButton]}
              onPress={handlePinSetup}
              disabled={!pin || pin.length < 4 || !confirmPin}
            >
              <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>
                Set PIN
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryButton, { marginTop: 10 }]}
              onPress={() => {
                setPin('');
                setConfirmPin('');
                transitionTo('complete');
              }}
            >
              <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Skip for Now</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        );

      case 'complete':
        return (
          <View style={[styles.completeContainer, {
            paddingTop: Platform.OS === 'web' ? SPACING.xxl : (SPACING.xxl + insets.top),
            paddingBottom: Platform.OS === 'web' ? SPACING.xxl : (SPACING.xxl + insets.bottom)
          }]}>
            <View style={styles.successIcon}>
              <Icon name="check-circle" size={80} color={THEMES.stackBlue.primary} />
            </View>
            <Text style={styles.screenTitle}>All set!</Text>
            <Text style={styles.completeText}>
              {users.length} user{users.length !== 1 ? 's' : ''} created
            </Text>
            
            <View style={styles.usersList}>
              {users.map((user, index) => (
                <View key={index} style={styles.userPill}>
                  <Text style={styles.pillEmoji}>{user.emoji}</Text>
                  <Text style={styles.pillName}>{user.name}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => onComplete({ users, pin: pin || null })}
            >
              <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>Start Using StackMap</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && (
        <StatusBar 
          backgroundColor="#f8f9fa"
          barStyle="dark-content"
        />
      )}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {renderContent()}
      </Animated.View>
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Button text base style for consistent centering
  buttonTextBase: {
    textAlign: 'center',
    flex: 0,
  },
  // New welcome page styles
  welcomeContent: {
    paddingTop: Platform.OS === 'web' ? 60 : 40,
    paddingBottom: Platform.OS === 'web' ? 40 : 20,
    paddingHorizontal: Platform.OS === 'web' ? 40 : 16,
    alignItems: 'center',
    minHeight: Platform.OS === 'web' ? '100%' : undefined,
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
  },
  welcomeTitle: {
    fontSize: Platform.OS === 'web' ? 48 : 36,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: THEMES.stackBlue.primary,
    marginTop: Platform.OS === 'web' ? 16 : 12,
  },
  welcomeSubtitle: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
    marginTop: 4,
  },
  cardsContainer: {
    flexDirection: isMobileWeb() || Platform.OS !== 'web' ? 'column' : 'row',
    gap: Platform.OS === 'web' ? 16 : 12,
    marginTop: Platform.OS === 'web' ? 40 : 24,
    marginBottom: Platform.OS === 'web' ? 40 : 24,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
  },
  card: {
    flex: (Platform.OS === 'web' && !isMobileWeb()) ? 1 : undefined,
    backgroundColor: 'white',
    paddingVertical: Platform.OS === 'web' ? 24 : 20,
    paddingHorizontal: Platform.OS === 'web' ? 24 : 20,
    borderRadius: Platform.OS === 'android' ? 8 : 12,
    alignItems: 'center',
    width: (Platform.OS === 'web' && !isMobileWeb()) ? undefined : '100%',
    ...SHADOWS.level2,
    elevation: Platform.OS === 'android' ? 2 : undefined,
  },
  cardIcon: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[700],
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 20 : 18,
  },
  secondaryButtonsContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 10,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 400 : 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 400 : 350,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonEqual: {
    flex: 1,
    minWidth: undefined,
    maxWidth: undefined,
  },
  secondaryButton: {
    backgroundColor: 'white',
    paddingHorizontal: Platform.OS === 'web' ? 16 : 14,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEMES.stackBlue.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOWS.level1,
  },
  secondaryButtonText: {
    color: THEMES.stackBlue.primary,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  
  // Original styles continue below
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingVertical: SPACING.xxl,
  },
  welcomeScrollContent: {
    paddingTop: Platform.OS === 'web' ? SPACING.xxl * 2 : SPACING.lg,
    paddingBottom: Platform.OS === 'web' ? SPACING.xxl * 2 : SPACING.lg,
    paddingHorizontal: Platform.OS === 'web' ? SPACING.xxl * 2 : SPACING.md,
    alignItems: 'center',
    minHeight: Platform.OS === 'web' ? '100%' : undefined,
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  featuresContainer: {
    flex: 1,
  },
  featuresScrollContent: {
    paddingTop: Platform.OS === 'web' ? SPACING.lg : (Platform.OS === 'ios' ? 10 : 60),
    paddingBottom: Platform.OS === 'web' ? SPACING.lg : (Platform.OS === 'ios' ? 10 : 80),
    paddingHorizontal: Platform.OS === 'web' ? SPACING.xl : SPACING.md,
    maxWidth: Platform.OS === 'web' ? 900 : '100%',
    alignSelf: Platform.OS === 'web' ? 'center' : 'stretch',
    width: '100%',
    flexGrow: Platform.OS === 'web' ? 0 : 1,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? SPACING.lg : SPACING.sm,
  },
  appName: {
    fontSize: isTablet() ? 48 : 40,
    fontFamily: Platform.OS === 'android' ? 'ComicRelief-Bold' : TYPOGRAPHY.fontFamily.bold,
    color: THEMES.stackBlue.primary,
    marginTop: SPACING.lg,
  },
  tagline: {
    fontSize: isTablet() ? 18 : 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
    marginTop: SPACING.sm,
  },
  infoCards: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: Platform.OS === 'web' ? SPACING.md : SPACING.sm,
    marginTop: Platform.OS === 'web' ? SPACING.lg : SPACING.xs,
    marginBottom: Platform.OS === 'web' ? SPACING.xl * 2 : SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  infoCard: {
    flex: Platform.OS === 'web' ? 1 : 0,
    backgroundColor: 'white',
    paddingVertical: Platform.OS === 'web' ? SPACING.lg : SPACING.md,
    paddingHorizontal: Platform.OS === 'web' ? SPACING.lg : SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    minHeight: Platform.OS === 'web' ? 120 : 80,
    justifyContent: 'center',
    width: Platform.OS === 'web' ? 'auto' : '90%',
    ...SHADOWS.level2,
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  cardText: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[700],
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 16 : 20,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  screenTitle: {
    fontSize: isTablet() ? 28 : 24,
    fontFamily: Platform.OS === 'android' ? 'ComicRelief-Bold' : TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[900],
    textAlign: 'center',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  screenSubtitle: {
    fontSize: isTablet() ? 16 : 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
    marginBottom: SPACING.sm,
    textAlign: 'center',
    marginHorizontal: SPACING.lg,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  createUserContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[700],
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  textInput: {
    height: 48,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[900],
    backgroundColor: 'white',
    marginBottom: SPACING.lg,
    width: '100%',
    textAlign: 'center',
    ...SHADOWS.level1,
  },
  emojiSelection: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  emojiOption: {
    width: 56,
    height: 56,
    borderRadius: Platform.OS === 'android' ? 8 : RADIUS.lg,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    elevation: Platform.OS === 'android' ? 1 : undefined,
  },
  emojiSelected: {
    borderColor: THEMES.stackBlue.primary,
    backgroundColor: THEMES.stackBlue.light,
  },
  emojiText: {
    fontSize: 28,
  },
  emojiInput: {
    height: 60,
    borderWidth: 2,
    borderColor: THEMES.stackBlue.primary,
    borderRadius: RADIUS.lg,
    fontSize: 16,
    color: COLORS.gray[700],
    backgroundColor: 'white',
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    width: '100%',
  },
  emojiInputContainer: {
    width: 200,
    marginBottom: SPACING.md,
  },
  orText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[500],
    marginVertical: SPACING.xs,
    textAlign: 'center',
  },
  previewSection: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
    marginBottom: SPACING.sm,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: Platform.OS === 'web' ? SPACING.md : SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 30,
    gap: SPACING.xs,
    minHeight: Platform.OS === 'web' ? 56 : (isTablet() ? 70 : 50),
    ...SHADOWS.level3,
  },
  pillEmoji: {
    fontSize: Platform.OS === 'web' ? 24 : (isTablet() ? 28 : 24),
  },
  pillName: {
    fontSize: Platform.OS === 'web' ? 16 : (isTablet() ? 18 : 16),
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[900],
  },
  primaryButton: {
    backgroundColor: THEMES.stackBlue.primary,
    paddingHorizontal: Platform.OS === 'web' ? 32 : 28,
    paddingVertical: Platform.OS === 'web' ? 14 : (Platform.OS === 'ios' ? 16 : 14),
    borderRadius: Platform.OS === 'android' ? 4 : 8,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'row',
    marginTop: Platform.OS === 'web' ? 16 : (Platform.OS === 'ios' ? 16 : 32),
    width: Platform.OS === 'web' ? 'auto' : '100%',
    maxWidth: 300,
    minWidth: Platform.OS === 'web' ? 150 : undefined,
    alignSelf: 'center',
    ...SHADOWS.level2,
    elevation: Platform.OS === 'android' ? 3 : undefined,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'white',
    paddingHorizontal: Platform.OS === 'web' ? 32 : 28,
    paddingVertical: Platform.OS === 'web' ? 14 : 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'row',
    marginTop: Platform.OS === 'web' ? 8 : 16,
    borderWidth: 2,
    borderColor: THEMES.stackBlue.primary,
    width: Platform.OS === 'web' ? 'auto' : '100%',
    maxWidth: 300,
    minWidth: Platform.OS === 'web' ? 150 : undefined,
    alignSelf: 'center',
    ...SHADOWS.level1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: THEMES.stackBlue.primary,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.gray[300],
  },
  desktopFeatureLayout: {
    flexDirection: 'row',
    gap: SPACING.lg,
    alignItems: 'flex-start',
    marginTop: SPACING.md,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Platform.OS === 'web' ? SPACING.lg : SPACING.lg,
    marginTop: Platform.OS === 'web' ? SPACING.lg : 0,
    marginBottom: Platform.OS === 'web' ? SPACING.xl : (Platform.OS === 'ios' ? 24 : 50),
  },
  controlsRowDesktop: {
    flexDirection: 'column',
    marginTop: 0,
    marginBottom: 0,
  },
  fabItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  whiteFab: {
    width: Platform.OS === 'web' ? 60 : (isTablet() ? 110 : 70),
    height: Platform.OS === 'web' ? 60 : (isTablet() ? 110 : 70),
    borderRadius: Platform.OS === 'web' ? 30 : (isTablet() ? 55 : 35),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.level3,
    elevation: Platform.OS === 'android' ? 4 : undefined,
  },
  fabLabel: {
    fontSize: Platform.OS === 'web' ? 16 : 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[700],
    marginTop: Platform.OS === 'web' ? 0 : SPACING.sm,
    marginLeft: Platform.OS === 'web' ? SPACING.sm : 0,
    textAlign: Platform.OS === 'web' ? 'left' : 'center',
  },
  activeFab: {
    backgroundColor: THEMES.stackBlue.primary,
  },
  activeUserPill: {
    backgroundColor: THEMES.stackBlue.primary,
  },
  activePillName: {
    color: 'white',
  },
  activeFabLabel: {
    color: THEMES.stackBlue.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  featureDetailsWrapper: {
    minHeight: Platform.OS === 'web' ? 220 : (Platform.OS === 'ios' ? 260 : 380),
    marginBottom: Platform.OS === 'web' ? 0 : (Platform.OS === 'ios' ? 16 : 40),
  },
  featureDetails: {
    paddingHorizontal: Platform.OS === 'web' ? SPACING.md : SPACING.sm,
    marginTop: Platform.OS === 'web' ? 0 : SPACING.sm,
    marginBottom: Platform.OS === 'web' ? 0 : SPACING.xs,
    justifyContent: 'flex-start',
    flex: Platform.OS === 'web' ? 1 : undefined,
  },
  featureTitle: {
    fontSize: Platform.OS === 'web' ? 24 : 20,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[800],
    textAlign: 'center',
    marginBottom: Platform.OS === 'web' ? SPACING.lg : SPACING.md,
  },
  bulletList: {
    alignSelf: 'center',
    maxWidth: Platform.OS === 'web' ? 400 : 320,
    width: '100%',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web' ? 'rgba(92, 126, 157, 0.05)' : 'transparent',
    padding: Platform.OS === 'web' ? SPACING.lg : SPACING.sm,
    borderRadius: Platform.OS === 'web' ? RADIUS.lg : 0,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: Platform.OS === 'web' ? SPACING.md : SPACING.md,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
    width: '100%',
  },
  bulletPoint: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: THEMES.stackBlue.primary,
    marginRight: Platform.OS === 'web' ? SPACING.md : SPACING.sm,
    flexShrink: 0,
    fontWeight: 'bold',
  },
  bulletText: {
    flex: 1,
    fontSize: Platform.OS === 'web' ? 16 : 15,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[700],
    lineHeight: Platform.OS === 'web' ? 24 : 22,
    textAlign: 'left',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: Platform.OS === 'web' ? SPACING.md : 0,
    marginBottom: Platform.OS === 'web' ? SPACING.sm : (Platform.OS === 'ios' ? 16 : 50),
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray[300],
  },
  activeIndicator: {
    backgroundColor: THEMES.stackBlue.primary,
    width: 24,
  },
  usersList: {
    gap: SPACING.md,
    marginVertical: SPACING.xl,
    alignItems: 'center',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  successIcon: {
    marginBottom: SPACING.lg,
  },
  completeText: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  syncContent: {
    paddingTop: Platform.OS === 'web' ? 60 : 40,
    paddingBottom: Platform.OS === 'web' ? 40 : 20,
    paddingHorizontal: Platform.OS === 'web' ? 40 : 16,
    alignItems: 'center',
    minHeight: Platform.OS === 'web' ? '100%' : undefined,
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
  },
  syncFeatures: {
    width: '100%',
    maxWidth: 400,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  syncFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: SPACING.sm,
  },
  syncFeatureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncFeatureText: {
    fontSize: isTablet() ? 15 : 13,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.gray[700],
    flex: 1,
    lineHeight: isTablet() ? 18 : 16,
  },
  buttonGroup: {
    width: '100%',
    maxWidth: 400,
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  syncInfoText: {
    fontSize: Platform.OS === 'web' ? 13 : 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: Platform.OS === 'web' ? 18 : 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.error,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  recoveryPhraseContainer: {
    backgroundColor: 'white',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginVertical: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.level2,
  },
  recoveryPhraseLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  recoveryPhrase: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.gray[900],
    textAlign: 'center',
    marginVertical: SPACING.md,
    lineHeight: Platform.OS === 'web' ? 26 : 24,
  },
  recoveryPhraseWarning: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#ff9800',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  successText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: THEMES.stackBlue.primary,
  },
});

export default OnboardingNew;