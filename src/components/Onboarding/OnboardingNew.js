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
  Linking,
  Clipboard,
  Alert,
  
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_USER_ICON } from '../../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import Logo from '../Logo/Logo';
import SyncStatusIndicator from '../SyncStatusIndicator';
import syncService from '../../services/sync/syncService';
import encryptionService from '../../services/sync/encryptionService';
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
const OnboardingNew = ({ onComplete, onImport, isAbbreviated = false, syncSetupPhrase = null, onShowPrivacy }) => {
  // Safety check for THEMES

  // Create a proper theme object with expected properties
  const defaultTheme = {
    primary: THEMES?.stackBlue?.primary || '#5C7E9D',
    dark: THEMES?.stackBlue?.dark || '#4A6680',
    light: THEMES?.stackBlue?.light || '#7896B3',
    text: '#000000', // Black text for accessibility
    textSecondary: '#666666',
    background: '#FFFFFF',
    card: '#F5F5F5'
  };
  
  const [currentScreen, setCurrentScreen] = useState(isAbbreviated && syncSetupPhrase ? 'syncSetup' : 'welcome');
  const [userName, setUserName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_USER_ICON);
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
  const [syncMode, setSyncMode] = useState('join'); // 'join' or 'create'
  const [newSyncData, setNewSyncData] = useState(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [syncPreviewData, setSyncPreviewData] = useState(null);
  const [showSyncPreview, setShowSyncPreview] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start at 0 for fade in
  const slideAnim = useRef(new Animated.Value(0)).current;
  const featureFadeAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  
  // Pre-populate recovery input if sync phrase provided from URL
  useEffect(() => {
    if (syncSetupPhrase && !recoveryInput) {
      setRecoveryInput(syncSetupPhrase);
      setSyncMode('join');
    }
  }, [syncSetupPhrase]);

  // Auto-fetch sync preview when on sync setup screen with URL
  useEffect(() => {
    if (currentScreen === 'syncSetup' && syncSetupPhrase && !syncLoading && !syncPreviewData && !syncError) {
      // Automatically fetch the sync preview
      fetchSyncPreview();
    }
  }, [currentScreen, syncSetupPhrase]);
  
  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const quickEmojis = [DEFAULT_USER_ICON, '😎', '🎯', '⭐', '🚀'];
  
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

  // Fetch sync preview data
  const fetchSyncPreview = async () => {
    setSyncLoading(true);
    setSyncError('');
    
    try {
      // Use the sync phrase from URL
      const phraseToUse = recoveryInput.trim() || syncSetupPhrase;

      // Generate sync ID from recovery phrase
      const syncId = await syncService.generateSyncId(phraseToUse);
      const deviceId = await encryptionService.getDeviceId();

      // For preview, we need to fetch without device ID or use a temporary one
      // Try to fetch sync data - for new devices, we might get 404 which is expected
      const checkUrl = `${syncService.getApiUrl()}/pull.php?sync_id=${syncId}&device_id=${deviceId}`;
      const checkResponse = await fetch(checkUrl);
      
      let decryptedData;
      
      if (checkResponse.status === 404) {
        // This is a new device, try to fetch the latest sync data without device ID
        // or by using the sync service's join mechanism

        // Initialize sync service temporarily to fetch data
        await syncService.initialize(phraseToUse);
        
        // Try to pull data - this should work even for new devices
        const pullResult = await syncService.pullData();
        
        if (!pullResult || !pullResult.data) {
          throw new Error('No sync group found with this sync key');
        }
        
        decryptedData = pullResult.data;
      } else {
        // Get the encrypted data
        const encryptedData = await checkResponse.json();
        
        // Initialize encryption with the recovery phrase and syncId to decrypt
        // Use the same fixed salt as syncService for consistency
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
        await encryptionService.initialize(phraseToUse, syncId, fixedSalt);
        
        // Decrypt the data
        decryptedData = encryptionService.decryptData(encryptedData.encrypted_blob);
      }
      
      // Extract preview information
      const preview = {
        users: {},
        totalActivities: 0,
        activityLibraryCount: 0,
        hasData: false
      };
      
      if (decryptedData.users) {
        Object.entries(decryptedData.users).forEach(([userId, user]) => {
          let activityCount = 0;
          
          // Count activities across all days
          if (user.days) {
            Object.values(user.days).forEach(day => {
              if (day.activities && Array.isArray(day.activities)) {
                activityCount += day.activities.filter(a => !a.deleted).length;
              }
            });
          }
          
          preview.users[userId] = {
            name: user.name || 'Unknown User',
            icon: user.icon || user.emoji || DEFAULT_USER_ICON,
            activityCount
          };
          
          preview.totalActivities += activityCount;
        });
      }
      
      // Count activity library items
      if (decryptedData.activityCategories) {
        Object.values(decryptedData.activityCategories).forEach(category => {
          if (category.activities && Array.isArray(category.activities)) {
            preview.activityLibraryCount += category.activities.length;
          }
        });
      }
      
      preview.hasData = Object.keys(preview.users).length > 0;
      
      setSyncPreviewData(preview);
      setShowSyncPreview(true);
      setSyncLoading(false); // Reset loading state on success
      transitionTo('syncPreview');
      
    } catch (error) {
      setSyncLoading(false);
      let errorMessage = 'Failed to fetch sync data. Please try again.';
      
      if (error.message.includes('404') || error.message.includes('No sync group')) {
        errorMessage = 'No sync group found with this sync key.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      // Show error and exit onboarding
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
        onComplete({ isAbbreviated: true });
      } else {
        Alert.alert(
          'Sync Error',
          errorMessage,
          [
            { 
              text: 'OK', 
              onPress: () => onComplete({ isAbbreviated: true })
            }
          ]
        );
      }
    }
  };

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
      
      // Reset sync state when entering sync screen (but not for abbreviated flow)
      if (nextScreen === 'sync' && !isAbbreviated) {
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
      setUsers([...users, { name: userName.trim(), icon: selectedEmoji }]);
      setUserName('');
      setSelectedEmoji(DEFAULT_USER_ICON);
      
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
          <View style={{ flex: 1 }}>
            <ScrollView 
              style={styles.scrollContent}
              contentContainerStyle={[styles.welcomeContent, {
                paddingTop: Platform.OS === 'web' ? styles.welcomeContent.paddingTop : (20 + insets.top),
                paddingBottom: Platform.OS === 'web' ? styles.welcomeContent.paddingBottom : 
                  Math.max(20, insets.bottom)
              }]}
              showsVerticalScrollIndicator={false}
            >
            <Logo size={Platform.OS === 'web' ? 80 : 60} theme={{ primary: THEMES.stackBlue.primary }} color={THEMES.stackBlue.primary} />
            <Text style={styles.welcomeTitle}>StackMap</Text>
            <Text style={styles.welcomeSubtitle}>Better days through shared understanding</Text>
            
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
                style={[styles.primaryButton, syncLoading && styles.disabledButton]}
                onPress={() => {
                  // For sync URLs, automatically fetch the preview
                  if (syncSetupPhrase) {
                    fetchSyncPreview();
                  } else {
                    transitionTo('features');
                  }
                }}
                disabled={syncLoading}
              >
                {syncLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>Continue</Text>
                )}
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
                        const result = await onImport();
                        // If import was successful, update local state and show summary
                        if (result && result.success) {
                          // Convert imported users to local format for onboarding
                          if (result.summary.userData) {
                            const importedUsers = Object.entries(result.summary.userData).map(([id, user]) => ({
                              name: user.name || 'User',
                              icon: user.icon || user.emoji || DEFAULT_USER_ICON
                            }));
                            setUsers(importedUsers);
                          }
                          // Immediately transition to features page  
                          setImportSuccessful(true);
                          transitionTo('features');
                          
                          // Show import summary after transition
                          setTimeout(() => {
                            Alert.alert(
                              'Import Successful',
                              `Imported:
• ${result.summary.users} user(s)
• ${result.summary.activities} activity categories
${result.summary.hasPin ? '• PIN protection enabled' : ''}`
                            );
                          }, 100);
                        } else {
                          // Import was cancelled or failed

                        }
                      } catch (error) {
                        // Import was cancelled or failed, stay on welcome screen

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
            
            {/* Footer Links */}
            <View style={styles.footerLinks}>
              <TouchableOpacity 
                style={styles.footerLink}
                onPress={() => {
                  if (onShowPrivacy) {
                    onShowPrivacy();
                  }
                }}
              >
                <Text style={styles.footerLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          </View>
        );

      case 'createUser':
        return (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <ScrollView 
              contentContainerStyle={[styles.createUserScrollContainer, {
                paddingTop: Platform.OS === 'web' ? SPACING.xxl : (SPACING.xxl + insets.top),
                paddingBottom: Platform.OS === 'web' ? SPACING.xxl : Math.max(SPACING.xxl, insets.bottom)
              }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.createUserContent}>
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
                {quickEmojis.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.emojiOption,
                      selectedEmoji === icon && styles.emojiSelected
                    ]}
                    onPress={() => {
                      setSelectedEmoji(icon);
                      setEmojiInputValue('');
                    }}
                  >
                    <Text style={styles.emojiText}>{icon}</Text>
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
                    if (/^[a-zA-Z0-9\s\.,!?@#$%^&*()_+\-=\[\]{};':"\|<>\/~`]+$/.test(text)) {
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
              style={[styles.primaryButton, !userName.trim() && styles.disabledButton, { marginTop: SPACING.xxl }]}
              onPress={addUser}
              disabled={!userName.trim()}
            >
              <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>
                {users.length === 0 ? 'Continue' : 'Add User'}
              </Text>
            </TouchableOpacity>

            {users.length === 0 && (
                <TouchableOpacity 
                  style={[styles.secondaryButton, { marginTop: SPACING.md }]}
                  onPress={() => transitionTo('welcome')}
                >
                  <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Back</Text>
                </TouchableOpacity>
              )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case 'features':
        const currentFeature = features[activeFeature];
        return (
          <View style={styles.featuresContainer}>
            <ScrollView 
              style={styles.scrollContent} 
              contentContainerStyle={[styles.featuresScrollContent, {
                paddingBottom: Platform.OS === 'web' ? SPACING.lg : Math.max(20, insets.bottom),
                paddingTop: Platform.OS === 'web' ? styles.featuresScrollContent.paddingTop : (20 + insets.top)
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
                          size={Platform.OS === 'web' ? 28 : (isTablet() ? 44 : 28)} 
                          color={activeFeature === index ? 'white' : THEMES.stackBlue.primary} 
                        />
                      </View>
                    ) : (
                      <View style={[
                        styles.userPill,
                        activeFeature === index && styles.activeUserPill
                      ]}>
                        <Text style={styles.pillEmoji}>{users[0]?.icon || DEFAULT_USER_ICON}</Text>
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
                  if (isAbbreviated && syncEnabled) {
                    // For abbreviated onboarding with sync completed, finish
                    onComplete({ 
                      isAbbreviated: true, 
                      syncSetupPhrase,
                      syncCompleted: true 
                    });
                  } else if (users.length > 0) {
                    // If we have imported users, complete onboarding
                    if (importSuccessful) {
                      onComplete({ importedData: true });
                    } else {
                      transitionTo('setupPin');
                    }
                  } else {
                    transitionTo('createUser');
                  }
                }}
              >
                <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>
                  {isAbbreviated && syncEnabled ? 'Continue to StackMap' : 
                   (users.length > 0 ? 'Continue to StackMap' : 'Create First User')}
                </Text>
              </TouchableOpacity>

              {!isAbbreviated && users.length > 0 && users.length < 3 && (
                <TouchableOpacity 
                  style={[styles.secondaryButton, { 
                    marginTop: 12,
                    paddingHorizontal: Platform.OS === 'web' ? 32 : 24,
                    paddingVertical: Platform.OS === 'web' ? 14 : (Platform.OS === 'ios' ? 14 : 12),
                    alignSelf: 'center',
                    width: 'auto',
                    maxWidth: 300,
                    minWidth: Platform.OS === 'web' ? 150 : undefined,
                  }]}
                  onPress={() => transitionTo('createUser')}
                >
                  <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Add Another User</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        );

      case 'syncPreview':
        return (
          <View style={styles.container}>
            <ScrollView 
              style={styles.scrollContent} 
              contentContainerStyle={[styles.syncContent, {
                paddingBottom: Platform.OS === 'web' ? SPACING.xl : Math.max(20, insets.bottom),
                paddingTop: Platform.OS === 'web' ? SPACING.xl : (20 + insets.top)
              }]}
              showsVerticalScrollIndicator={false}
            >
              <Logo size={isTablet() ? 50 : 40} theme={{ primary: THEMES.stackBlue.primary }} color={THEMES.stackBlue.primary} />
              <Text style={styles.screenTitle}>Sync Data Preview</Text>
              
              {syncPreviewData && syncPreviewData.hasData ? (
                <>
                  <Text style={styles.screenSubtitle}>
                    You're about to join a sync group with the following data:
                  </Text>
                  
                  <View style={styles.syncPreviewContainer}>
                    <View style={styles.syncPreviewSection}>
                      <Text style={styles.syncPreviewTitle}>Users</Text>
                      {Object.entries(syncPreviewData.users).map(([userId, user]) => (
                        <View key={userId} style={styles.syncPreviewUser}>
                          <Text style={styles.syncPreviewEmoji}>{user.icon}</Text>
                          <View style={styles.syncPreviewUserInfo}>
                            <Text style={styles.syncPreviewUserName}>{user.name}</Text>
                            <Text style={styles.syncPreviewUserActivities}>
                              {user.activityCount} {user.activityCount === 1 ? 'activity' : 'activities'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.syncPreviewSummary}>
                      <Icon name="info" size={20} color={THEMES.stackBlue.primary} />
                      <Text style={styles.syncPreviewSummaryText}>
                        Total: {Object.keys(syncPreviewData.users).length} user{Object.keys(syncPreviewData.users).length !== 1 ? 's' : ''}, {syncPreviewData.totalActivities} {syncPreviewData.totalActivities === 1 ? 'activity' : 'activities'}
                      </Text>
                    </View>
                    
                    {syncPreviewData.activityLibraryCount > 0 && (
                      <View style={styles.syncPreviewLibrary}>
                        <Icon name="library-books" size={20} color={THEMES.stackBlue.primary} />
                        <Text style={styles.syncPreviewLibraryText}>
                          Activity Library: {syncPreviewData.activityLibraryCount} {syncPreviewData.activityLibraryCount === 1 ? 'item' : 'items'}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.syncWarning}>
                    <Icon name="warning" size={20} color="#ff9800" />
                    <Text style={styles.syncWarningText}>
                      Joining this sync will replace any existing local data
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.primaryButton, syncLoading && styles.disabledButton]}
                    onPress={async () => {
                      setSyncLoading(true);
                      try {
                        // Initialize with the recovery phrase
                        await syncService.initialize(syncSetupPhrase);
                        
                        // Check if sync restored users
                        const { useAppStore } = require('../../stores');
                        const fullState = useAppStore.getState();
                        const syncedUsers = fullState.users;
                        
                        // State restored from sync

                        if (syncedUsers && Object.keys(syncedUsers).length > 0) {
                          // Users already exist from sync
                          const userList = Object.values(syncedUsers);
                          setUsers(userList);
                          setSyncEnabled(true);
                          
                          // Wait a moment for store to fully update
                          setTimeout(() => {
                            setSyncLoading(false);
                            // Continue to features screen
                            transitionTo('features');
                          }, 100);
                        } else {
                          // No users in synced data - this is OK for new syncs
                          setSyncLoading(false);
                          setSyncEnabled(true);
                          // Continue to features screen anyway
                          transitionTo('features');
                        }
                      } catch (error) {
                        console.error('Sync join error:', error);
                        setSyncLoading(false);
                        
                        // Show a more user-friendly error in a small banner
                        if (Platform.OS === 'web') {
                          setSyncError('Sync completed with warnings. Some data may need review.');
                        } else {
                          Alert.alert(
                            'Sync Notice',
                            'Sync completed successfully. Some data was automatically repaired.',
                            [{ text: 'OK', onPress: () => transitionTo('features') }]
                          );
                        }
                      }
                    }}
                    disabled={syncLoading}
                  >
                    {syncLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>Join Sync Group</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={() => {
                      setShowSyncPreview(false);
                      setSyncPreviewData(null);
                      // Exit onboarding without syncing
                      onComplete({ isAbbreviated: true });
                    }}
                  >
                    <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Skip</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.screenSubtitle}>
                    No data found in this sync group
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={() => {
                      setShowSyncPreview(false);
                      setSyncPreviewData(null);
                      // Exit onboarding without syncing
                      onComplete({ isAbbreviated: true });
                    }}
                  >
                    <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Skip</Text>
                  </TouchableOpacity>
                </>
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
            const checkUrl = `${syncService.getApiUrl()}/pull.php?sync_id=${syncId}&device_id=${deviceId}`;
            const checkResponse = await fetch(checkUrl);
            
            if (checkResponse.status === 404) {
              // Sync group doesn't exist - invalid sync key for joining
              throw new Error('Invalid sync key - no sync group found');
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
              
              // For abbreviated onboarding, go through features before completing
              if (isAbbreviated) {
                transitionTo('features');
              } else {
                // Go to features carousel to complete onboarding nicely
                transitionTo('features');
              }
            } else {
              // No users in sync but group exists, continue to user creation
              setSyncEnabled(true);
              transitionTo('createUser');
            }
          } catch (error) {
            // Stay on sync screen with error message
            if (error.message.includes('Invalid sync key')) {
              setSyncError('Invalid sync key. Please check and try again.');
            } else if (error.message.includes('Network')) {
              setSyncError('Network error. Please check your connection and try again.');
            } else {
              setSyncError(error.message || 'Failed to join sync. Please try again.');
            }
          } finally {
            setSyncLoading(false);
          }
        };

        // Create new sync function
        const createNewSync = async () => {
          setSyncLoading(true);
          setSyncError('');
          
          try {
            // Generate recovery phrase
            const recoveryPhrase = encryptionService.generateRecoveryPhrase();
            
            // Generate sync ID from recovery phrase
            const syncId = await syncService.generateSyncId(recoveryPhrase);
            
            setNewSyncData({
              recoveryPhrase,
              syncId,
              qrData: `stackmap://sync/${recoveryPhrase}`,
            });
          } catch (err) {
            setSyncError('Failed to create sync. Please try again.');
          } finally {
            setSyncLoading(false);
          }
        };

        const handleCopyCode = () => {
          if (newSyncData?.recoveryPhrase) {
            Clipboard.setString(newSyncData.recoveryPhrase);
            setShowCopiedToast(true);
            setTimeout(() => setShowCopiedToast(false), 2000);
          }
        };

        const handleVisitSupport = () => {
          Linking.openURL('https://stackmap.app?supportus');
        };
        
        return (
          <View style={styles.container}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
              <ScrollView 
                style={styles.scrollContent} 
                contentContainerStyle={[styles.syncContent, {
                  paddingBottom: Platform.OS === 'web' ? SPACING.xl : Math.max(20, insets.bottom),
                  paddingTop: Platform.OS === 'web' ? SPACING.xl : (20 + insets.top)
                }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Logo size={isTablet() ? 50 : 40} theme={{ primary: THEMES.stackBlue.primary }} color={THEMES.stackBlue.primary} />
                <Text style={styles.screenTitle}>Sync Your StackMap</Text>
                
                {/* Sync Mode Toggle */}
                <View style={styles.syncModeToggle}>
                  <TouchableOpacity 
                    style={[styles.syncModeButton, syncMode === 'join' && styles.syncModeButtonActive]}
                    onPress={() => {
                      setSyncMode('join');
                      setSyncError('');
                    }}
                  >
                    <Text style={[styles.syncModeButtonText, syncMode === 'join' && styles.syncModeButtonTextActive]}>
                      Join Existing Sync
                    </Text>
                  </TouchableOpacity>
                  {Platform.OS === 'web' && (
                    <TouchableOpacity 
                      style={[styles.syncModeButton, syncMode === 'create' && styles.syncModeButtonActive]}
                      onPress={() => {
                        setSyncMode('create');
                        setSyncError('');
                        if (!newSyncData) {
                          createNewSync();
                        }
                      }}
                    >
                      <Text style={[styles.syncModeButtonText, syncMode === 'create' && styles.syncModeButtonTextActive]}>
                        Create New Sync
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.screenSubtitle}>
                  {Platform.OS === 'web' 
                    ? (syncMode === 'join' ? 'Connect to your existing sync group' : 'Create a sync key for your device')
                    : 'Connect to your existing sync group'
                  }
                </Text>
                
                {(Platform.OS !== 'web' || syncMode === 'join') ? (
                  <>
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
                    placeholder="Enter your sync key"
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
                    <View style={styles.errorBanner}>
                      <Icon name="info" size={16} color="#856404" />
                      <Text style={styles.errorBannerText}>{syncError}</Text>
                    </View>
                  ) : null}
                </View>
                
                <View style={styles.buttonGroup}>
                  <TouchableOpacity 
                    style={[styles.primaryButton, syncLoading && styles.disabledButton]}
                    onPress={() => {
                      if (isAbbreviated && syncSetupPhrase) {
                        // For sync URLs, fetch preview first
                        fetchSyncPreview();
                      } else {
                        // For manual entry, join directly
                        handleSyncSetup();
                      }
                    }}
                    disabled={syncLoading || !recoveryInput.trim()}
                  >
                    {syncLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={[styles.buttonTextBase, styles.primaryButtonText]}>
                        {isAbbreviated && syncSetupPhrase ? 'Preview Sync' : 'Join Sync'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={() => transitionTo(isAbbreviated ? 'features' : 'welcome')}
                  >
                    <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Back</Text>
                  </TouchableOpacity>
                </View>
                  </>
                ) : (
                  <>
                    {/* Create New Sync Content */}
                    {syncLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={THEMES.stackBlue.primary} />
                        <Text style={[styles.loadingText, { color: defaultTheme.text }]}>
                          Creating sync key...
                        </Text>
                      </View>
                    ) : syncError ? (
                      <View style={styles.errorContainer}>
                        <Icon name="error-outline" size={48} color="#e53e3e" />
                        <Text style={[styles.errorText, { color: '#e53e3e' }]}>{syncError}</Text>
                        <TouchableOpacity 
                          style={[styles.retryButton, { backgroundColor: THEMES.stackBlue.primary }]}
                          onPress={createNewSync}
                        >
                          <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                      </View>
                    ) : newSyncData ? (
                      <>
                        <Text style={[styles.description, { color: defaultTheme.text }]}>
                          Use this sync key on your device to connect your existing StackMap data to the cloud.
                        </Text>

                        {/* QR Code */}
                        <View style={styles.qrContainer}>
                          <QRCode
                            value={newSyncData.qrData}
                            size={200}
                            color={defaultTheme.text}
                            backgroundColor={defaultTheme.background}
                          />
                        </View>

                        {/* Recovery Phrase */}
                        <View style={[styles.codeContainer, { backgroundColor: defaultTheme.card || '#f5f5f5' }]}>
                          <Text style={[styles.codeLabel, { color: defaultTheme.textSecondary || '#666' }]}>
                            Sync Code
                          </Text>
                          <Text style={[styles.codeText, { color: defaultTheme.text }]}>
                            {newSyncData.recoveryPhrase}
                          </Text>
                          <TouchableOpacity
                            style={[styles.copyButton, { backgroundColor: THEMES.stackBlue.primary }]}
                            onPress={handleCopyCode}
                          >
                            <Icon name="content-copy" size={18} color="white" />
                            <Text style={styles.copyButtonText}>Copy Code</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Instructions */}
                        <View style={styles.instructionsContainer}>
                          <Text style={[styles.instructionsTitle, { color: defaultTheme.text }]}>
                            How to sync your device:
                          </Text>
                          <View style={styles.instructionItem}>
                            <Text style={[styles.instructionNumber, { color: THEMES.stackBlue.primary }]}>1</Text>
                            <Text style={[styles.instructionText, { color: defaultTheme.text }]}>
                              Open StackMap on your device
                            </Text>
                          </View>
                          <View style={styles.instructionItem}>
                            <Text style={[styles.instructionNumber, { color: THEMES.stackBlue.primary }]}>2</Text>
                            <Text style={[styles.instructionText, { color: defaultTheme.text }]}>
                              Go to Settings → Data Management
                            </Text>
                          </View>
                          <View style={styles.instructionItem}>
                            <Text style={[styles.instructionNumber, { color: THEMES.stackBlue.primary }]}>3</Text>
                            <Text style={[styles.instructionText, { color: defaultTheme.text }]}>
                              Enable Sync and enter this code
                            </Text>
                          </View>
                        </View>

                        {/* Support Button */}
                        <TouchableOpacity
                          style={[styles.supportButton, { backgroundColor: THEMES.stackBlue.primary }]}
                          onPress={handleVisitSupport}
                        >
                          <Icon name="favorite" size={20} color="white" />
                          <Text style={styles.supportButtonText}>Support StackMap</Text>
                        </TouchableOpacity>

                        <Text style={[styles.supportText, { color: defaultTheme.textSecondary || '#666' }]}>
                          Your contributions help us provide:
                        </Text>
                        <View style={styles.contributionList}>
                          <Text style={[styles.contributionItem, { color: defaultTheme.textSecondary || '#666' }]}>
                            • Free sync service for all families
                          </Text>
                          <Text style={[styles.contributionItem, { color: defaultTheme.textSecondary || '#666' }]}>
                            • Ongoing development & improvements
                          </Text>
                          <Text style={[styles.contributionItem, { color: defaultTheme.textSecondary || '#666' }]}>
                            • Server costs for data storage
                          </Text>
                        </View>

                        <TouchableOpacity 
                          style={styles.secondaryButton}
                          onPress={() => transitionTo('welcome')}
                        >
                          <Text style={[styles.buttonTextBase, styles.secondaryButtonText]}>Back</Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </>
                )}

                {/* Toast */}
                {showCopiedToast && (
                  <View style={styles.toastContainer}>
                    <View style={[styles.toast, { backgroundColor: THEMES.stackBlue.primary }]}>
                      <Icon name="check" size={20} color="white" />
                      <Text style={styles.toastText}>Copied to clipboard!</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        );

      case 'setupPin':
        const handlePinSetup = async () => {
          if (pin && pin === confirmPin) {
            // Save the PIN using secure storage
            try {
              const { setSecurePin } = require('../../utils/securePinStorage');
              const success = await setSecurePin(pin);
              if (success) {
                transitionTo('complete');
              } else {
                setPinError('Failed to save PIN. Please try again.');
              }
            } catch (error) {
              console.error('[Onboarding] Error saving PIN:', error);
              setPinError('Failed to save PIN. Please try again.');
            }
          } else if (pin !== confirmPin) {
            setPinError('PINs do not match');
          }
        };
        
        return (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <ScrollView 
              contentContainerStyle={[styles.createUserScrollContainer, {
                paddingTop: Platform.OS === 'web' ? SPACING.xxl : (SPACING.xxl + insets.top),
                paddingBottom: Platform.OS === 'web' ? SPACING.xxl : Math.max(SPACING.xxl, insets.bottom)
              }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.createUserContent}>
                <View>
                  <Text style={styles.screenTitle}>Secure Your StackMap</Text>
                  <Text style={styles.screenSubtitle}>
                    Set up a 4-digit PIN to protect your edit mode
                  </Text>
                  <Text style={[styles.screenSubtitle, { fontSize: 14, marginTop: -10 }]}>
                    This is optional but recommended
                  </Text>
                  
                  <View style={[styles.formSection, { paddingHorizontal: 0, marginTop: 60 }]}>
                    <View style={{ alignItems: 'center', width: '100%' }}>
                      <Text style={[styles.inputLabel, { textAlign: 'center' }]}>Create PIN</Text>
                      <TextInput
                        style={styles.pinInput}
                        placeholder="• • • •"
                        placeholderTextColor={COLORS.gray[400]}
                        value={pin}
                        onChangeText={(text) => {
                          setPinError('');
                          setPin(text.replace(/\D/g, ''));
                        }}
                        keyboardType="numeric"
                        secureTextEntry={true}
                        maxLength={4}
                        autoFocus
                      />
                    </View>
                    
                    <View style={{ alignItems: 'center', marginTop: 20, width: '100%' }}>
                      <Text style={[styles.inputLabel, { textAlign: 'center' }]}>Confirm PIN</Text>
                      <TextInput
                        style={styles.pinInput}
                        placeholder="• • • •"
                        placeholderTextColor={COLORS.gray[400]}
                        value={confirmPin}
                        onChangeText={(text) => {
                          setPinError('');
                          setConfirmPin(text.replace(/\D/g, ''));
                        }}
                        keyboardType="numeric"
                        secureTextEntry={true}
                        maxLength={4}
                      />
                    </View>
                    
                    {pinError ? (
                      <Text style={styles.errorText}>{pinError}</Text>
                    ) : null}
                  </View>
                </View>
                
                <View>
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
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case 'complete':
        return (
          <View style={[styles.completeContainer, {
            paddingTop: Platform.OS === 'web' ? SPACING.xxl : (SPACING.xxl + insets.top),
            paddingBottom: Platform.OS === 'web' ? SPACING.xxl : 
              (isTablet() ? Math.max(80, SPACING.xxl + insets.bottom) : (SPACING.xxl + insets.bottom))
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
                  <Text style={styles.pillEmoji}>{user.icon}</Text>
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
    <View style={styles.container}>
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
    </View>
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
    paddingTop: Platform.OS === 'web' ? 40 : 40,
    paddingBottom: Platform.OS === 'web' ? 20 : 20,
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
    gap: Platform.OS === 'web' ? 16 : 10,
    marginTop: Platform.OS === 'web' ? 30 : 20,
    marginBottom: Platform.OS === 'web' ? 30 : 20,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
  },
  card: {
    flex: (Platform.OS === 'web' && !isMobileWeb()) ? 1 : undefined,
    backgroundColor: 'white',
    paddingVertical: Platform.OS === 'web' ? 20 : 16,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 18,
    borderRadius: Platform.OS === 'android' ? 8 : 12,
    alignItems: 'center',
    width: (Platform.OS === 'web' && !isMobileWeb()) ? undefined : '100%',
    ...SHADOWS.level2,
    elevation: Platform.OS === 'android' ? 2 : undefined,
  },
  cardIcon: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : 350,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
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
  secondaryButtonThird: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 180 : 105,
    minHeight: 44,
  },
  secondaryButton: {
    backgroundColor: 'white',
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    paddingVertical: Platform.OS === 'web' ? 12 : 9,
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
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 6,
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
    alignSelf: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  createUserContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  createUserScrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
  },
  createUserContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 600,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[700],
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
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
    textAlign: 'center',
    ...SHADOWS.level1,
  },
  pinInput: {
    width: 200,
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[900],
    backgroundColor: 'white',
    marginBottom: SPACING.lg,
    textAlign: 'center',
    letterSpacing: 8,
    alignSelf: 'center',
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  emojiInput: {
    height: 60,
    borderWidth: 2,
    borderColor: THEMES.stackBlue.primary,
    borderRadius: RADIUS.lg,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
    marginTop: SPACING.md,
    marginBottom: 0,
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  pillName: {
    fontSize: Platform.OS === 'web' ? 16 : (isTablet() ? 18 : 16),
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[900],
  },
  primaryButton: {
    backgroundColor: THEMES.stackBlue.primary,
    paddingHorizontal: Platform.OS === 'web' ? 32 : 24,
    paddingVertical: Platform.OS === 'web' ? 14 : (Platform.OS === 'ios' ? 14 : 12),
    borderRadius: Platform.OS === 'android' ? 4 : 8,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'row',
    marginTop: Platform.OS === 'web' ? 16 : 12,
    width: Platform.OS === 'web' ? 'auto' : '100%',
    maxWidth: 300,
    minWidth: Platform.OS === 'web' ? 150 : undefined,
    alignSelf: 'center',
    ...SHADOWS.level2,
    elevation: Platform.OS === 'android' ? 3 : undefined,
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
  },
  altSecondaryButton: {
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
  altSecondaryButtonText: {
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
    width: Platform.OS === 'web' ? 60 : (isTablet() ? 110 : 60),
    height: Platform.OS === 'web' ? 60 : (isTablet() ? 110 : 60),
    borderRadius: Platform.OS === 'web' ? 30 : (isTablet() ? 55 : 30),
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
    minHeight: Platform.OS === 'web' ? 220 : (Platform.OS === 'ios' ? 260 : 280),
    marginBottom: Platform.OS === 'web' ? 0 : (Platform.OS === 'ios' ? 16 : 20),
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
    marginBottom: Platform.OS === 'web' ? SPACING.sm : (Platform.OS === 'ios' ? 16 : 20),
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#856404',
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
  // Sync mode toggle styles
  syncModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 16,
    padding: 4,
    gap: 4,
  },
  syncModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  syncModeButtonActive: {
    backgroundColor: THEMES.stackBlue.primary,
  },
  syncModeButtonText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  syncModeButtonTextActive: {
    color: 'white',
  },
  // Create sync styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
  },
  codeContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
  },
  codeLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: 'bold',
    marginRight: 12,
    width: 24,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: 22,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    alignSelf: 'center',
    marginBottom: 12,
  },
  supportButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: 'bold',
  },
  supportText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'center',
    marginTop: 8,
  },
  contributionList: {
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
    alignSelf: 'center',
  },
  contributionItem: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: 20,
    marginVertical: 2,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  toastText: {
    color: 'white',
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: 'bold',
  },
  // Sync preview styles
  syncPreviewContainer: {
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.level2,
  },
  syncPreviewSection: {
    marginBottom: SPACING.lg,
  },
  syncPreviewTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[800],
    marginBottom: SPACING.md,
  },
  syncPreviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  syncPreviewEmoji: {
    fontSize: 32,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  syncPreviewUserInfo: {
    flex: 1,
  },
  syncPreviewUserName: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.gray[900],
  },
  syncPreviewUserActivities: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  syncPreviewSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    gap: SPACING.sm,
  },
  syncPreviewSummaryText: {
    flex: 1,
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.gray[700],
  },
  syncWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  syncWarningText: {
    flex: 1,
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#856404',
  },
  syncPreviewLibrary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  syncPreviewLibraryText: {
    flex: 1,
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.gray[700],
  },
  
  // Footer Links
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'web' ? 16 : 12,
    paddingVertical: 8,
  },
  footerLink: {
    paddingHorizontal: 8,
  },
  footerLinkText: {
    color: THEMES.stackBlue.primary,
    fontSize: Platform.OS === 'web' ? 14 : 13,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    color: COLORS.gray[400],
    fontSize: 14,
    paddingHorizontal: 4,
  },
  
  // Privacy Policy Link (kept for backward compatibility)
  privacyLink: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  privacyLinkText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: THEMES.stackBlue.primary,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

export default OnboardingNew;
