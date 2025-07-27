import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Dimensions,
  Image,
  Animated,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSyncOnChange } from './src/hooks/useSyncOnChange';
// Conditionally import drag-and-drop libraries for iOS only
const DraggableFlatList = Platform.OS === 'ios' 
  ? require('react-native-draggable-flatlist').default 
  : null;
const ScaleDecorator = Platform.OS === 'ios' 
  ? require('react-native-draggable-flatlist').ScaleDecorator 
  : null;
// Conditionally import gesture handler for iOS only
const GestureHandlerModule = Platform.OS === 'ios' 
  ? require('react-native-gesture-handler')
  : null;
const GestureHandlerRootView = GestureHandlerModule?.GestureHandlerRootView;
const PanGestureHandler = GestureHandlerModule?.PanGestureHandler;
const State = GestureHandlerModule?.State;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Import DocumentPicker and RNFS with platform handling
let DocumentPicker = null;
let RNFS = null;

if (Platform.OS === 'web') {
  // Use web polyfills
  RNFS = require('./src/utils/platformHelpers.web').default;
  DocumentPicker = require('./src/utils/platformHelpers.web').DocumentPicker;
} else {
  // Use native modules
  DocumentPicker = Platform.OS === 'ios' ? require('react-native-document-picker').default : null;
  RNFS = require('react-native-fs');
}

import { Share, Linking } from 'react-native';

// Import our new constants and utilities
import {
  THEMES,
  COLORS,
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COMMON_EMOJIS,
  DEFAULT_USER_ICON,
  DEFAULT_ACTIVITY_EMOJI,
  PIN_LENGTH,
  TOAST_DURATION,
  isTablet,
  isMobile,
  calculateColumns,
  calculateCardWidth,
  getCardHeight,
  getCardPadding,
  getContainerPadding,
  CARD_LAYOUT,
  FAB_DIMENSIONS,
  BADGE_DIMENSIONS,
  getBadgeDimensions,
  FONT_SCALE,
  CUSTOM_IMAGE_SOURCES,
  FEATURE_FLAGS,
} from './src/constants';

// Import components
import { Toast, FAB, EditModeToolbar, Logo, ActivityLibrary, EmojiPicker, CelebrationView, ActivityModal, PreferencesModal, PinModal, AddUserModal, ContextModal, PlanningModal, PrivacyModal, SupportModal, ReorderModal, ShareModal, DataModal, UsersSecurityModal, ToolbarCustomizeModal, CompleteDayModal } from './src/components';
import { DEFAULT_CATEGORIES } from './src/components/ActivityLibrary/ActivityLibrary';
import OnboardingNew from './src/components/Onboarding/OnboardingNew';
import ShareView from './src/components/ShareView/ShareView';

// Component imports verified - all components are properly imported

// Import hooks
import { useToast } from './src/hooks';

// Import stores
import { useAppStore } from './src/stores';

// Import services
import syncService from './src/services/sync/syncService';

// Import utilities
import {
  setSecurePin,
  getSecurePin,
  hasSecurePin,
  verifyPin,
  migratePinToSecureStorage,
  removeSecurePin,
} from './src/utils/secureStorage';

// Get initial screen dimensions
const { width: initialScreenWidth, height: initialScreenHeight } = Dimensions.get('window');

// These will be recalculated in the component
const baseFontSize = isTablet() ? FONT_SCALE.tablet : FONT_SCALE.mobile;

// Helper function for Android modal bottom safety zones
const getAndroidModalBottomHeight = (insets) => {
  const isLargeDevice = isTablet() || initialScreenHeight > 800;
  return isLargeDevice 
    ? Math.max(insets.bottom * 1.2, 20) // Reduced by 40% (was 32, now 20)
    : Math.max(insets.bottom, 10); // Reduced by 40% (was 16, now 10)
};

// Common emojis for picker
const commonEmojis = COMMON_EMOJIS;

// AnimatedIcon component for slide-up animation
const AnimatedIcon = React.memo(({ name, size, color, translateY }) => {
  const slideY = React.useMemo(() => 
    translateY.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0], // Start 20 pixels below, animate to original position
    }),
    [translateY]
  );

  return (
    <Animated.View style={{ transform: [{ translateY: slideY }] }}>
      <Icon name={name} size={size} color={color} />
    </Animated.View>
  );
});


const App = () => {
  const insets = useSafeAreaInsets();
  
  // Use our custom hooks
  const { toast, showToast, hideToast } = useToast();
  
  // Enable automatic sync on state changes
  useSyncOnChange();
  
  // Zustand store - using a single selector for better performance
  const {
    currentTheme,
    setCurrentTheme,
    bannerPosition,
    setBannerPosition,
    soundEnabled,
    setSoundEnabled,
    taskCelebration,
    setTaskCelebration,
    routineCelebration,
    setRoutineCelebration,
    toolbarOrder,
    setToolbarOrder,
    moreButtonPosition,
    setMoreButtonPosition,
    users,
    setUsers,
    addUser,
    updateUser,
    updateUserActivities,
    deleteUser: deleteUserFromStore,
    currentUser,
    setCurrentUser,
    activities,
    setActivities,
    currentDay,
    setCurrentDay,
    displayMode,
    setDisplayMode,
    dayMode,
    setDayMode,
    templates,
    setTemplates,
    activityCategories,
    setActivityCategories,
    userContextData,
    setUserContextData,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
  } = useAppStore();
  
  // State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  // Removed - now using Zustand store
  const [isEditMode, setIsEditMode] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserDayModal, setShowUserDayModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showActivityLibrary, setShowActivityLibrary] = useState(false);
  // Removed - now using Zustand store
  
  // Force ScrollView recalculation on Android modals
  const preferencesScrollRef = useRef(null);
  const settingsScrollRef = useRef(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityEmoji, setActivityEmoji] = useState(DEFAULT_ACTIVITY_EMOJI);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEditToolbar, setShowEditToolbar] = useState(false);
  const [showEditIcons, setShowEditIcons] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  
  // User management state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmoji, setNewUserEmoji] = useState(DEFAULT_USER_ICON);
  const [showUserEmojiPicker, setShowUserEmojiPicker] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  // Removed - now using Zustand store
  
  // Display mode and celebrations
  // Removed - now using Zustand store
  const [showCelebration, setShowCelebration] = useState(null);
  const [activityTime, setActivityTime] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderingActivity, setReorderingActivity] = useState(null);
  const [newPosition, setNewPosition] = useState('');
  
  // PIN protection state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUserId, setShareUserId] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [hasPinProtection, setHasPinProtection] = useState(false);
  
  // New modal states
  const [showDataModal, setShowDataModal] = useState(false);
  const [showUsersSecurityModal, setShowUsersSecurityModal] = useState(false);
  const [showToolbarCustomizeModal, setShowToolbarCustomizeModal] = useState(false);
  const [showCompleteDayModal, setShowCompleteDayModal] = useState(false);
  
  
  // Screen dimensions state
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  
  // Calculate layout values based on current screen dimensions
  const numColumns = calculateColumns(screenDimensions.width);
  const cardWidth = calculateCardWidth(screenDimensions.width);
  const cardHeight = getCardHeight();
  
  // Activity library state
  // activityCategories now in Zustand store
  const [addedToLibraryIds, setAddedToLibraryIds] = useState(new Set());
  
  // Animation values
  const [editModeIconRotation] = useState(() => new Animated.Value(0));
  const [editModeToolbarTranslate] = useState(() => new Animated.Value(100));
  const [editIconsTranslateY] = useState(() => new Animated.Value(0));
  const [editIconsOpacity] = useState(() => new Animated.Value(0));
  
  // ScrollView refs for forcing measurement on Android
  
  // Force re-render keys for Android scroll fix
  const [settingsScrollKey, setSettingsScrollKey] = useState(0);
  const [preferencesScrollKey, setPreferencesScrollKey] = useState(0);
  
  // Pre-create interpolated values to avoid creating them during render
  const editIconsTranslateYInterpolated = React.useMemo(() => 
    editIconsTranslateY.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0]
    }),
    [editIconsTranslateY]
  );

  // Check for share token in URL (web only)
  const [shareToken, setShareToken] = useState(null);
  const [syncSetupPhrase, setSyncSetupPhrase] = useState(null);
  
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Get the raw query string to handle + characters properly
      const search = window.location.search;
      const urlParams = new URLSearchParams(search);
      const token = urlParams.get('share');
      let syncPhrase = urlParams.get('sync');
      
      // If we have a sync phrase, we need to handle + characters that might be in base64
      if (syncPhrase && search.includes('sync=')) {
        // Extract the raw sync parameter value to preserve + characters
        const syncMatch = search.match(/[?&]sync=([^&]+)/);
        if (syncMatch) {
          // Don't decode - the value is already decoded by URLSearchParams
          // but we need to check if + was incorrectly converted to space
          syncPhrase = syncMatch[1].replace(/ /g, '+');
        }
      }
      
      console.log('[App] URL params:', { 
        search: window.location.search,
        syncPhrase,
        decoded: syncPhrase ? decodeURIComponent(syncPhrase) : null 
      });
      
      if (token) {
        setShareToken(token);
      } else if (syncPhrase) {
        // Store sync phrase to handle after app initializes
        setSyncSetupPhrase(syncPhrase);
      }
    }
  }, []);

  // Wait for Zustand store to hydrate from AsyncStorage
  useEffect(() => {
    const checkHydration = async () => {
      // Give Zustand time to load persisted state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check Zustand persisted data directly
      const zustandData = await AsyncStorage.getItem('stackmap-storage');
      console.log('[App] Checking Zustand hydration:', zustandData ? 'Data exists' : 'No data');
      
      if (zustandData) {
        try {
          const parsed = JSON.parse(zustandData);
          console.log('[App] Zustand persisted state:', {
            hasCompletedOnboarding: parsed?.state?.hasCompletedOnboarding,
            usersCount: Object.keys(parsed?.state?.users || {}).length
          });
        } catch (e) {
          console.error('[App] Error parsing Zustand data:', e);
        }
      }
      
      setIsHydrated(true);
    };
    
    checkHydration();
  }, []);
  
  // Check sync status
  useEffect(() => {
    if (!isHydrated) return;
    
    const checkSyncStatus = async () => {
      const enabled = await syncService.isEnabled();
      setSyncEnabled(enabled);
    };
    
    checkSyncStatus();
  }, [isHydrated]);
  
  // Load data on mount and migrate PIN if needed
  useEffect(() => {
    if (!isHydrated) return;
    
    const initializeApp = async () => {
      // Log Zustand store state for debugging
      console.log('[App] Zustand store after hydration:', {
        currentTheme,
        bannerPosition,
        users: Object.keys(users).length,
        currentUser,
        activities: activities.length,
        currentDay,
        hasCompletedOnboarding
      });
      
      
      await migratePinToSecureStorage();
      
      // Check if we should show onboarding
      if (!hasCompletedOnboarding && Object.keys(users).length === 0) {
        console.log('[App] Showing onboarding - no users and not completed');
        setShowOnboarding(true);
        return; // Don't create default user, wait for onboarding
      }
      
      // Initialize default user if none exists and onboarding is complete
      if (hasCompletedOnboarding && Object.keys(users).length === 0) {
        console.log('[App] Creating default user - onboarding complete but no users');
        const newUserId = `user_${Date.now()}`;
        const newUser = {
          id: newUserId,
          name: 'My Activities',
          icon: '😊',
          days: {
            today: { activities: [] },
            tomorrow: { activities: [] }
          },
          settings: {
            taskCelebration: 'rainbow',
            routineCelebration: 'rainbow',
            soundEnabled: true,
            theme: 'stackBlue',
          },
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        addUser(newUserId, newUser);
        setCurrentUser(newUserId);
      }
      
      // Always check secure storage as the source of truth for PIN
      const hasPIN = await hasSecurePin();
      setHasPinProtection(hasPIN);
    };
    
    initializeApp();
    
    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });
    
    return () => subscription?.remove();
  }, [isHydrated, hasCompletedOnboarding, users, currentTheme, bannerPosition, activities, currentDay, currentUser, addUser, setCurrentUser]);

  // Data is now automatically persisted through Zustand

  // Load activities when day changes
  useEffect(() => {
    if (currentUser && users[currentUser]) {
      setActivities(users[currentUser]?.days?.[currentDay]?.activities || []);
    }
  }, [currentDay, currentUser, users, setActivities]);
  
  // Handle sync setup from URL parameter
  useEffect(() => {
    if (syncSetupPhrase && isHydrated && hasCompletedOnboarding && !showOnboarding) {
      // Sync setup functionality moved to data modal
      // TODO: Auto-open data modal for sync setup
      // Clear the URL parameter
      if (Platform.OS === 'web') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [syncSetupPhrase, isHydrated, hasCompletedOnboarding, showOnboarding]);
  
  // Animate icons when edit mode changes
  useEffect(() => {
    if (isEditMode) {
      // Entering edit mode: slide up from below with fade in
      // IMPORTANT: Set initial opacity to 0 BEFORE showing the icons to prevent flash
      editIconsOpacity.setValue(0);
      editIconsTranslateY.setValue(0);
      
      // Now show the edit icons (they'll be invisible due to opacity: 0)
      setShowEditIcons(true);
      
      // Small delay to ensure the opacity is applied before animation starts
      setTimeout(() => {
        // Animate both translation and opacity together
        Animated.parallel([
          Animated.timing(editIconsTranslateY, {
            toValue: 1,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(editIconsOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      }, 10);
      
      // Also animate the main edit mode icon
      Animated.timing(editModeIconRotation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      
      // Show the edit toolbar
      setShowEditToolbar(true);
    } else {
      // Exiting edit mode: slide back down with delayed fade out
      // Start slide down immediately
      Animated.timing(editIconsTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        // Hide the edit icons after animation completes
        setShowEditIcons(false);
      });
      
      // Delay the fade out by 200ms, then fade for 100ms
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(editIconsOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
      
      // Also animate the main edit mode icon
      Animated.timing(editModeIconRotation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [isEditMode]);
  
  // Handle PIN input
  useEffect(() => {
    if (pinInput.length === PIN_LENGTH && !isSettingPin) {
      // Verify PIN
      verifyPin(pinInput).then(isValid => {
        if (isValid) {
          // PIN for main edit mode
          setIsEditMode(true);
          setShowPinModal(false);
          setPinInput('');
        } else {
          Alert.alert('Incorrect PIN', 'Please try again');
          setPinInput('');
        }
      });
    }
  }, [pinInput, isSettingPin]);
  
  // Handle PIN setting
  useEffect(() => {
    if (isSettingPin) {
      if (!confirmPin && pinInput.length === PIN_LENGTH) {
        // Move to confirm step
        setConfirmPin(pinInput);
        setPinInput('');
        showToast({ message: 'Now re-enter PIN to confirm' });
      } else if (confirmPin && pinInput.length === PIN_LENGTH) {
        // Verify confirmation
        if (pinInput === confirmPin) {
          setSecurePin(pinInput).then(success => {
            if (success) {
              setShowPinModal(false);
              setPinInput('');
              setConfirmPin('');
              setIsSettingPin(false);
              setHasPinProtection(true);
              showToast({ message: 'PIN set successfully' });
            } else {
              Alert.alert('Error', 'Failed to save PIN. Please try again.');
              setPinInput('');
              setConfirmPin('');
            }
          });
        } else {
          Alert.alert('PINs do not match', 'Please try again');
          setPinInput('');
          setConfirmPin('');
        }
      }
    }
  }, [pinInput, confirmPin, isSettingPin, showToast]);

  // Migrate data from old RN format to PWA format
  const migrateDataStructure = (data) => {
    if (!data) return data;
    
    // If already version 3 with correct structure, return as-is
    if (data.version === 3 && data.templates !== undefined) {
      return data;
    }
    
    // Migrate users
    const migratedUsers = {};
    Object.entries(data.users || {}).forEach(([userId, user]) => {
      migratedUsers[userId] = {
        ...user,
        id: user.id || userId,
        icon: user.icon || '😊',
        settings: user.settings || {
          taskCelebration: 'rainbow',
          routineCelebration: 'rainbow',
          soundEnabled: true,
          theme: 'stackBlue'
        },
        createdAt: user.createdAt || new Date().toISOString(),
        lastActive: user.lastActive || new Date().toISOString()
      };
      
      // Migrate activities
      if (user.days) {
        Object.keys(user.days).forEach(day => {
          if (user.days[day].activities) {
            migratedUsers[userId].days[day].activities = user.days[day].activities.map(activity => ({
              ...activity,
              id: activity.id?.startsWith('activity_') ? activity.id : `activity_${activity.id}`,
              text: activity.text || activity.title || '',
              description: activity.description || '',
              pinned: activity.pinned !== undefined ? activity.pinned : false,
              activityType: activity.activityType || 'normal',
              time: activity.time || null,
              createdAt: activity.createdAt || activity.created || new Date().toISOString()
            }));
          }
        });
      }
    });
    
    return {
      ...data,
      version: 3,
      currentDay: data.currentDay || 'today',
      users: migratedUsers,
      globalSettings: {
        ...data.globalSettings,
        enableDayManagement: data.globalSettings?.enableDayManagement !== undefined ? 
          data.globalSettings.enableDayManagement : true,
        pinEnabled: data.globalSettings?.pinEnabled !== undefined ? 
          data.globalSettings.pinEnabled : (data.globalSettings?.editModePin !== null)
      },
      templates: data.templates || []
    };
  };

  // Removed loadData - now using Zustand persistence

  // Removed saveData - now using Zustand persistence

  const handleOnboardingComplete = async (onboardingData) => {
    try {
      console.log('handleOnboardingComplete called with:', onboardingData);
      
      // Mark onboarding as completed
      setHasCompletedOnboarding(true);
      
      // Handle abbreviated onboarding (sync URL flow)
      if (onboardingData?.isAbbreviated && onboardingData?.syncSetupPhrase) {
        console.log('Abbreviated onboarding - will trigger sync after setup');
        // Set showOnboarding to false to show main app
        setShowOnboarding(false);
        // Sync setup functionality moved to data modal
        return;
      }
      
      // If no onboarding data provided (shouldn't happen), create default user
      if (!onboardingData || !onboardingData.users || onboardingData.users.length === 0) {
        console.warn('No users provided from onboarding, creating default user');
        const newUserId = `user_${Date.now()}`;
        const newUser = {
          id: newUserId,
          name: 'My Activities',
          icon: '😊',
          days: {
            today: { activities: [] },
            tomorrow: { activities: [] }
          },
          settings: {
            taskCelebration: 'rainbow',
            routineCelebration: 'rainbow',
            soundEnabled: true,
            theme: 'stackBlue',
          },
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        
        const newUsers = { [newUserId]: newUser };
        setUsers(newUsers);
        setCurrentUser(newUserId);
        setActivities([]);
        setShowOnboarding(false);
        
        // Save the data
        const dataToSave = {
          version: 3,
          currentUserId: newUserId,
          currentDay: 'today',
          users: newUsers,
          globalSettings: {
            themeColor: currentTheme,
            bannerPosition: bannerPosition,
            displayMode: displayMode,
            taskCelebration: taskCelebration,
            routineCelebration: routineCelebration,
            pinEnabled: onboardingData?.pin ? true : false,
            pin: onboardingData?.pin || null
          },
          templates: templates,
          activityCategories: activityCategories
        };
        // Data is now persisted automatically through Zustand
        return;
      }
      
      // Create users from onboarding data
      const timestamp = Date.now();
      const newUsers = {};
      let firstUserId = null;
      
      // Create starter activities - mix of welcome cards and common routines
      const starterActivities = [
        { 
          id: `activity_${timestamp}_1`, 
          title: 'Welcome to StackMap!', 
          emoji: '👋',
          description: 'Tap activities to mark them complete',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_2`, 
          title: 'Try Edit Mode', 
          emoji: '✏️',
          description: 'Use the edit button to add your own activities',
          pinned: false 
        },
        { id: `activity_${timestamp}_3`, title: 'Morning Routine', emoji: '🌅', pinned: true, pinnedOrder: 0 },
        { id: `activity_${timestamp}_4`, title: 'Brush Teeth', emoji: '🦷', pinned: true, pinnedOrder: 1 },
        { id: `activity_${timestamp}_5`, title: 'Take Medication', emoji: '💊', pinned: true, pinnedOrder: 2 },
        { id: `activity_${timestamp}_6`, title: 'Breakfast', emoji: '🥞', pinned: false },
        { id: `activity_${timestamp}_7`, title: 'Exercise', emoji: '🏃', pinned: false },
        { id: `activity_${timestamp}_8`, title: 'Work/Study', emoji: '💻', pinned: false },
        { id: `activity_${timestamp}_9`, title: 'Lunch', emoji: '🥗', pinned: false },
        { id: `activity_${timestamp}_10`, title: 'Take a Break', emoji: '☕', pinned: false },
        { id: `activity_${timestamp}_11`, title: 'Dinner', emoji: '🍽️', pinned: false },
        { id: `activity_${timestamp}_12`, title: 'Relax', emoji: '🎮', pinned: false },
        { id: `activity_${timestamp}_13`, title: 'Bedtime Routine', emoji: '🛏️', pinned: false },
        { id: `activity_${timestamp}_14`, title: 'Sleep', emoji: '😴', pinned: false },
      ];
      
      // Create each user from onboarding
      onboardingData.users.forEach((userData, index) => {
        const userId = `user_${timestamp}_${index}`;
        if (index === 0) firstUserId = userId;
        
        const newUser = {
          id: userId,
          name: userData.name,
          icon: userData.emoji,
          days: {
            today: { activities: index === 0 ? starterActivities : [] },
            tomorrow: { activities: [] }
          },
          settings: {
            taskCelebration: 'rainbow',
            routineCelebration: 'rainbow',
            soundEnabled: true,
            theme: 'stackBlue',
          },
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        
        newUsers[userId] = newUser;
      });
      
      // Set state with the new users
      setUsers(newUsers);
      setCurrentUser(firstUserId);
      setActivities(starterActivities);
      setShowOnboarding(false);
      
      // Handle PIN if provided
      if (onboardingData.pin) {
        setHasPinProtection(true);
        await setSecurePin(onboardingData.pin);
      }
      
      // Show welcome message after a short delay
      setTimeout(() => {
        showToast({ message: 'Welcome to StackMap! 🎉 Tap activities to mark them complete.', type: 'success' });
      }, 500);
      
      // Save the data with the new values
      const dataToSave = {
        version: 3,
        currentUserId: firstUserId,
        currentDay: 'today',
        users: newUsers,
        globalSettings: {
          themeColor: currentTheme,
          bannerPosition: bannerPosition,
          displayMode: displayMode,
          taskCelebration: taskCelebration,
          routineCelebration: routineCelebration,
          pinEnabled: onboardingData.pin ? true : false
        },
        templates: templates,
        activityCategories: activityCategories
      };
      // Data is now persisted automatically through Zustand
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still hide onboarding on error
      setShowOnboarding(false);
    }
  };

  const handleSetupWizardComplete = async (setupData) => {
    try {
      // Mark onboarding as completed
      setHasCompletedOnboarding(true);
      
      // Set PIN if provided
      if (setupData.pin) {
        await setSecurePin(setupData.pin);
        setHasPinProtection(true);
      }
      
      // Create users from setup data
      const newUsers = {};
      let firstUserId = null;
      
      // Create starter activities - mix of welcome cards and common routines
      const timestamp = Date.now();
      const starterActivities = [
        { 
          id: `activity_${timestamp}_1`, 
          title: 'Welcome to StackMap!', 
          emoji: '👋',
          description: 'Tap activities to mark them complete',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_2`, 
          title: 'Try Edit Mode', 
          emoji: '✏️',
          description: 'Use the edit button to add your own activities',
          pinned: false 
        },
        { id: `activity_${timestamp}_3`, title: 'Morning Routine', emoji: '🌅', pinned: true, pinnedOrder: 0 },
        { id: `activity_${timestamp}_4`, title: 'Brush Teeth', emoji: '🦷', pinned: true, pinnedOrder: 1 },
        { id: `activity_${timestamp}_5`, title: 'Take Medication', emoji: '💊', pinned: true, pinnedOrder: 2 },
        { id: `activity_${timestamp}_6`, title: 'Breakfast', emoji: '🥞', pinned: false },
        { id: `activity_${timestamp}_7`, title: 'Exercise', emoji: '🏃', pinned: false },
        { id: `activity_${timestamp}_8`, title: 'Work/Study', emoji: '💻', pinned: false },
        { id: `activity_${timestamp}_9`, title: 'Lunch', emoji: '🥗', pinned: false },
        { id: `activity_${timestamp}_10`, title: 'Take a Break', emoji: '☕', pinned: false },
        { id: `activity_${timestamp}_11`, title: 'Dinner', emoji: '🍽️', pinned: false },
        { id: `activity_${timestamp}_12`, title: 'Relax', emoji: '🎮', pinned: false },
        { id: `activity_${timestamp}_13`, title: 'Bedtime Routine', emoji: '🛏️', pinned: false },
        { id: `activity_${timestamp}_14`, title: 'Sleep', emoji: '😴', pinned: false },
      ];
      
      // Create each user from the setup data
      setupData.users.forEach((userData, index) => {
        const userId = `user_${Date.now()}_${index}`;
        if (index === 0) firstUserId = userId;
        
        // Only give starter activities to the first user
        const userActivities = index === 0 ? starterActivities : [];
        
        newUsers[userId] = {
          id: userId,
          name: userData.name,
          icon: userData.emoji,
          days: {
            today: { activities: userActivities },
            tomorrow: { activities: [] }
          },
          settings: {
            taskCelebration: 'rainbow',
            routineCelebration: 'rainbow',
            soundEnabled: true,
            theme: 'stackBlue',
          },
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
      });
      
      setUsers(newUsers);
      setCurrentUser(firstUserId);
      setActivities(newUsers[firstUserId].days.today.activities);
      setShowSetupWizard(false);
      
      // Show welcome message after a short delay
      setTimeout(() => {
        const userNames = setupData.users.map(u => u.name).join(', ');
        const message = setupData.users.length === 1 
          ? `Welcome, ${userNames}! 🎉 Tap activities to mark them complete.`
          : `Welcome ${userNames}! 🎉 Use the user menu to switch between users.`;
        showToast({ message, type: 'success' });
      }, 500);
      
      // Save the data with the new values
      const dataToSave = {
        version: 3,
        currentUserId: firstUserId,
        currentDay: 'today',
        users: newUsers,
        globalSettings: {
          themeColor: currentTheme,
          bannerPosition: bannerPosition,
          displayMode: displayMode,
          taskCelebration: taskCelebration,
          routineCelebration: routineCelebration,
          pinEnabled: setupData.pin ? true : hasPinProtection
        },
        templates: templates,
        activityCategories: activityCategories
      };
      // Data is now persisted automatically through Zustand
    } catch (error) {
      console.error('Error completing setup wizard:', error);
      // Still hide setup wizard on error
      setShowSetupWizard(false);
    }
  };

  const handleOnboardingSkip = async () => {
    try {
      // Mark onboarding as completed
      setHasCompletedOnboarding(true);
      
      // Create default user without starter activities
      const newUserId = `user_${Date.now()}`;
      const newUser = {
        id: newUserId,
        name: 'My Activities',
        icon: '😊',
        days: {
          today: { activities: [] },
          tomorrow: { activities: [] }
        },
        settings: {
          taskCelebration: 'rainbow',
          routineCelebration: 'rainbow',
          soundEnabled: true,
          theme: 'stackBlue',
        },
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      
      const newUsers = { [newUserId]: newUser };
      setUsers(newUsers);
      setCurrentUser(newUserId);
      setActivities([]);
      setShowOnboarding(false);
      
      // Save the data with the new values
      const dataToSave = {
        version: 3,
        currentUserId: newUserId,
        currentDay: 'today',
        users: newUsers,
        globalSettings: {
          themeColor: currentTheme,
          bannerPosition: bannerPosition,
          displayMode: displayMode,
          taskCelebration: taskCelebration,
          routineCelebration: routineCelebration,
          pinEnabled: hasPinProtection
        },
        templates: templates,
        activityCategories: activityCategories
      };
      // Data is now persisted automatically through Zustand
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      // Still hide onboarding on error
      setShowOnboarding(false);
      setShowSetupWizard(false);
    }
  };

  const theme = THEMES[currentTheme] || THEMES.stackBlue;

  // Helper to update auto-update shares after activity changes
  const updateAutoUpdateShares = async (userId) => {
    try {
      if (await syncService.isEnabled() && await syncService.hasAutoUpdateShares(userId)) {
        // Use a small delay to batch multiple updates
        if (updateAutoUpdateShares.timeout) {
          clearTimeout(updateAutoUpdateShares.timeout);
        }
        updateAutoUpdateShares.timeout = setTimeout(async () => {
          await syncService.updateActiveShares(userId);
          console.log('Auto-update shares refreshed');
        }, 1000); // 1 second delay to batch updates
      }
    } catch (error) {
      console.log('Share update skipped:', error.message);
    }
  };

  const toggleActivity = (id) => {
    const activity = activities.find(a => a.id === id);
    const wasCompleted = activity?.completed;
    
    const newActivities = activities.map(activity => 
      activity.id === id ? { ...activity, completed: !activity.completed } : activity
    );
    setActivities(newActivities);
    
    // Update the users state to persist the change
    if (currentUser && users[currentUser]) {
      const updatedUsers = {
        ...users,
        [currentUser]: {
          ...users[currentUser],
          days: {
            ...users[currentUser].days,
            [currentDay]: {
              activities: newActivities
            }
          }
        }
      };
      setUsers(updatedUsers);
      
      // Update auto-update shares
      updateAutoUpdateShares(currentUser);
    }
    
    // Check if we just completed an activity
    if (!wasCompleted && activity) {
      // Check if all activities are now completed
      const allCompleted = newActivities.every(a => a.completed);
      
      if (allCompleted && newActivities.length > 0) {
        // Show routine celebration (fireworks for completing all tasks)
        if (routineCelebration !== 'none') {
          setShowCelebration({ type: 'fireworks', theme: routineCelebration });
        }
      } else {
        // Show task celebration (confetti for individual tasks)
        if (taskCelebration !== 'none') {
          setShowCelebration({ type: 'confetti', theme: taskCelebration });
        }
      }
    }
  };

  const moveActivity = (index, direction) => {
    const newActivities = [...activities];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= activities.length) return;
    
    // Swap activities
    [newActivities[index], newActivities[newIndex]] = [newActivities[newIndex], newActivities[index]];
    
    setActivities(newActivities);
    
    // Save immediately after reordering
    if (currentUser && users[currentUser]) {
      const updatedUsers = { ...users };
      if (!updatedUsers[currentUser].days) {
        updatedUsers[currentUser].days = {};
      }
      if (!updatedUsers[currentUser].days[currentDay]) {
        updatedUsers[currentUser].days[currentDay] = { activities: [] };
      }
      updatedUsers[currentUser].days[currentDay].activities = newActivities;
      setUsers(updatedUsers);
    }
  };

  const togglePin = async (id) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;
    
    const newPinnedState = !activity.pinned;
    
    // Update current day's activity
    const updatedActivities = activities.map(a => 
      a.id === id ? { ...a, pinned: newPinnedState } : a
    );
    setActivities(updatedActivities);
    
    // Update tomorrow's matching activity
    const tomorrowActivities = users[currentUser]?.days?.tomorrow?.activities || [];
    const matchingActivity = tomorrowActivities.find(a => 
      a.emoji === activity.emoji && a.text === activity.text
    );
    
    if (newPinnedState && !matchingActivity) {
      // Pin: Create on tomorrow if doesn't exist
      const newTomorrowActivity = {
        ...activity,
        id: 'activity_' + Date.now() + '_tomorrow',
        completed: false,
        pinned: true,
        createdAt: new Date().toISOString()
      };
      
      const updatedUsers = {
        ...users,
        [currentUser]: {
          ...users[currentUser],
          days: {
            ...users[currentUser].days,
            tomorrow: {
              activities: [...tomorrowActivities, newTomorrowActivity]
            }
          }
        }
      };
      setUsers(updatedUsers);
    } else if (matchingActivity) {
      // Update existing matching activity's pinned state
      const updatedTomorrowActivities = tomorrowActivities.map(a =>
        a.emoji === activity.emoji && a.text === activity.text
          ? { ...a, pinned: newPinnedState }
          : a
      );
      
      const updatedUsers = {
        ...users,
        [currentUser]: {
          ...users[currentUser],
          days: {
            ...users[currentUser].days,
            tomorrow: {
              activities: updatedTomorrowActivities
            }
          }
        }
      };
      setUsers(updatedUsers);
    }
  };

  const addActivity = () => {
    if (!activityTitle.trim()) return;
    
    const newActivity = {
      id: 'activity_' + Date.now(),
      text: activityTitle,
      description: activityDescription || '',
      emoji: activityEmoji,
      completed: false,
      pinned: false,
      activityType: 'normal',
      time: activityTime || null,
      createdAt: new Date().toISOString()
    };
    
    let newActivities;
    if (editingActivity) {
      newActivities = activities.map(a => 
        a.id === editingActivity.id 
          ? { ...a, text: activityTitle, description: activityDescription || '', emoji: activityEmoji, time: activityTime || null } 
          : a
      );
    } else {
      newActivities = [...activities, newActivity];
    }
    
    setActivities(newActivities);
    
    // Update the users state to persist the change
    if (currentUser && users[currentUser]) {
      const updatedUsers = {
        ...users,
        [currentUser]: {
          ...users[currentUser],
          days: {
            ...users[currentUser].days,
            [currentDay]: {
              activities: newActivities
            }
          }
        }
      };
      setUsers(updatedUsers);
      
      // Update auto-update shares
      updateAutoUpdateShares(currentUser);
    }
    
    resetActivityForm();
    setShowActivityModal(false);
  };

  const resetActivityForm = () => {
    setActivityTitle('');
    setActivityDescription('');
    setActivityEmoji('🎯');
    setActivityTime('');
    setEditingActivity(null);
  };

  const deleteActivity = (id) => {
    const deletedActivity = activities.find(a => a.id === id);
    const deletedIndex = activities.findIndex(a => a.id === id);
    
    // Mark the activity as deleted instead of removing it
    const updatedActivities = activities.map(a => 
      a.id === id ? { ...a, deleted: true, deletedAt: Date.now() } : a
    );
    setActivities(updatedActivities);
    
    // Update the users state to persist the change
    if (currentUser && users[currentUser]) {
      const updatedUsers = {
        ...users,
        [currentUser]: {
          ...users[currentUser],
          days: {
            ...users[currentUser].days,
            [currentDay]: {
              activities: updatedActivities
            }
          }
        }
      };
      setUsers(updatedUsers);
      
      // Update auto-update shares
      updateAutoUpdateShares(currentUser);
    }
    
    // Show toast with undo
    showToast({
      message: 'Activity deleted',
      action: {
        label: 'Undo',
        onPress: () => {
          // Restore the activity by removing the deleted flag
          setActivities(prevActivities => 
            prevActivities.map(a => 
              a.id === id ? { ...a, deleted: false, deletedAt: undefined } : a
            )
          );
          
          // Also restore in users state
          if (currentUser && users[currentUser]) {
            const currentUserData = users[currentUser];
            const currentActivities = currentUserData?.days?.[currentDay]?.activities || [];
            const restoredActivities = currentActivities.map(a => 
              a.id === id ? { ...a, deleted: false, deletedAt: undefined } : a
            );
            
            updateUser(currentUser, {
              days: {
                ...currentUserData.days,
                [currentDay]: {
                  activities: restoredActivities
                }
              }
            });
          }
        }
      }
    });
  };

  const reorderActivities = (fromIndex, toIndex) => {
    const newActivities = [...activities];
    const [movedActivity] = newActivities.splice(fromIndex, 1);
    newActivities.splice(toIndex, 0, movedActivity);
    setActivities(newActivities);
    
    // Save immediately
    if (currentUser && users[currentUser]) {
      updateUserActivities(currentUser, currentDay, newActivities);
    }
  };

  const promptReorderActivity = (activity, currentPosition) => {
    setReorderingActivity({ activity, currentPosition });
    setNewPosition(currentPosition.toString());
    setShowReorderModal(true);
  };

  const handleReorder = () => {
    if (newPosition && !isNaN(newPosition)) {
      const newIndex = parseInt(newPosition) - 1;
      const currentIndex = activities.findIndex(a => a.id === reorderingActivity.activity.id);
      
      if (newIndex >= 0 && newIndex < activities.length && currentIndex !== -1 && currentIndex !== newIndex) {
        reorderActivities(currentIndex, newIndex);
        showToast({ message: `Moved to position ${newPosition}` });
      }
    }
    setShowReorderModal(false);
    setReorderingActivity(null);
    setNewPosition('');
  };

  const addActivityToLibrary = (activity) => {
    // Initialize with default categories if none exist
    const categories = activityCategories || DEFAULT_CATEGORIES;
    const updatedCategories = [...categories];
    
    // Find My Templates category
    const myTemplatesIndex = updatedCategories.findIndex(cat => cat.id === 'my-templates');
    
    if (myTemplatesIndex !== -1) {
      // Create a template from the activity
      const template = {
        id: `template-${Date.now()}`,
        name: activity.text || activity.title || 'Untitled',
        emoji: activity.emoji || '🎯',
        description: activity.description || '',
      };
      
      // Add to My Templates
      updatedCategories[myTemplatesIndex] = {
        ...updatedCategories[myTemplatesIndex],
        activities: [...updatedCategories[myTemplatesIndex].activities, template]
      };
      
      setActivityCategories(updatedCategories);
      
      // Add to tracking set
      setAddedToLibraryIds(prev => new Set([...prev, activity.id]));
      
      // Remove from tracking after delay
      setTimeout(() => {
        setAddedToLibraryIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(activity.id);
          return newSet;
        });
      }, 1500);
      
      showToast({ message: 'Added to My Templates' });
    } else {
      showToast({ message: 'Could not find My Templates category' });
    }
  };
  
  // Handle adding user from AddUserModal
  const handleAddUser = (userName, userEmoji) => {
    const userId = `user_${Date.now()}`;
    const newUser = {
      id: userId,
      name: userName,
      icon: userEmoji,
      days: {
        today: { activities: [] },
        tomorrow: { activities: [] }
      },
      settings: {
        taskCelebration: 'rainbow',
        routineCelebration: 'rainbow',
        soundEnabled: true,
        theme: currentTheme || 'stackBlue',
      },
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    
    addUser(userId, newUser);
    
    setCurrentUser(userId);
    setActivities([]);
    setNewUserName('');
    setNewUserEmoji('😀');
    setEditingUser(null);
    setShowAddUserModal(false);
    showToast({ message: `Added user: ${userName}` });
  };

  // Handle updating user from AddUserModal
  const handleUpdateUser = (userId, userName, userEmoji) => {
    const updatedUsers = {
      ...users,
      [userId]: {
        ...users[userId],
        name: userName,
        icon: userEmoji
      }
    };
    
    setUsers(updatedUsers);
    setNewUserName('');
    setNewUserEmoji('😀');
    setEditingUser(null);
    setShowAddUserModal(false);
    showToast({ message: `Updated user: ${userName}` });
  };

  // Delete user function
  const deleteUser = (userId) => {
    // Check if this is the last user
    const userKeys = Object.keys(users);
    if (userKeys.length === 1) {
      if (Platform.OS === 'web') {
        window.alert('You must have at least one user.');
      } else {
        Alert.alert('Cannot Delete', 'You must have at least one user.');
      }
      return;
    }

    // Get user info for toast message
    const deletedUserName = users[userId]?.name || 'User';

    // Remove the user
    deleteUserFromStore(userId);

    // If we're deleting the current user, switch to another user
    if (currentUser === userId) {
      const updatedUsers = { ...users };
      delete updatedUsers[userId];
      const remainingUserIds = Object.keys(updatedUsers);
      if (remainingUserIds.length > 0) {
        const newCurrentUser = remainingUserIds[0];
        const newUser = updatedUsers[newCurrentUser];
        
        // Switch to the new user
        setCurrentUser(newCurrentUser);
        
        // Load the new user's activities for current day
        const newUserActivities = newUser?.days?.[currentDay]?.activities || [];
        setActivities(newUserActivities);
        
        // Load the new user's theme
        if (newUser?.settings?.theme) {
          setCurrentTheme(newUser.settings.theme);
        }
        
        // Load the new user's celebration settings
        if (newUser?.settings) {
          setTaskCelebration(newUser.settings.taskCelebration || 'rainbow');
          setRoutineCelebration(newUser.settings.routineCelebration || 'rainbow');
          setSoundEnabled(newUser.settings.soundEnabled !== false);
        }
      }
    }

    showToast({ message: `Deleted user: ${deletedUserName}` });
  };

  // Export data function
  const exportData = async () => {
    try {
      const data = {
        version: 3,
        currentDay,
        users,
        globalSettings: {
          currentTheme,
          bannerPosition,
          defaultView: 'normal',
          displayMode: 'numbers',
          enableDayManagement: true,
          pinEnabled: await hasSecurePin()
        },
        templates,
        exportDate: new Date().toISOString()
      };

      const jsonData = JSON.stringify(data, null, 2);
      const now = new Date();
      // Use local date instead of UTC
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `stackmap-export-${dateStr}-${timeStr}.json`;
      
      if (Platform.OS === 'android') {
        // Try to save directly to Downloads folder
        try {
          const downloadsPath = RNFS.DownloadDirectoryPath;
          const filePath = `${downloadsPath}/${fileName}`;
          
          await RNFS.writeFile(filePath, jsonData, 'utf8');
          
          // Show success dialog with share option
          Alert.alert(
            'Export Successful!',
            `Your data has been saved to:\nDownloads/${fileName}\n\nWould you like to share it to another app?`,
            [
              {
                text: 'No Thanks',
                style: 'cancel',
                onPress: () => {
                  showToast({ message: 'Export saved to Downloads' });
                }
              },
              {
                text: 'Share',
                onPress: async () => {
                  try {
                    await Share.share({
                      url: `file://${filePath}`,
                      title: 'StackMap Export',
                      message: `Exported: ${fileName}`,
                    });
                  } catch (shareError) {
                    console.log('Share cancelled:', shareError);
                  }
                }
              }
            ]
          );
        } catch (error) {
          console.error('Export error:', error);
          // Try app's external directory as fallback
          try {
            const externalPath = `${RNFS.ExternalDirectoryPath}/${fileName}`;
            await RNFS.writeFile(externalPath, jsonData, 'utf8');
            showToast({ message: `Saved to app folder: ${fileName}` });
          } catch (fallbackError) {
            Alert.alert('Export Error', 'Failed to save file. ' + fallbackError.message);
          }
        }
      } else {
        // iOS: Use share sheet
        const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        await RNFS.writeFile(filePath, jsonData, 'utf8');
        
        if (Platform.OS === 'web') {
          // Web: Use blob URL for sharing
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          try {
            await navigator.share({
              title: 'Export StackMap Data',
              text: `StackMap export: ${fileName}`,
              files: [new File([blob], fileName, { type: 'application/json' })]
            });
          } catch (shareError) {
            // Fallback to download if share fails
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
          } finally {
            URL.revokeObjectURL(url);
          }
        } else {
          const shareResult = await Share.share({
            url: `file://${filePath}`,
            title: 'Export StackMap Data',
          });
          
          if (shareResult && shareResult.action !== Share.dismissedAction) {
            showToast({ message: 'Data exported successfully' });
          }
        }
        
        if (Platform.OS !== 'web') {
          await RNFS.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Error', 'Failed to export data. Please check app permissions.');
    }
  };

  // Complete day handler
  const handleCompleteDayConfirm = (organizedActivities) => {
    // Destructure the organized activities
    const { toKeepForToday, fromTomorrowToToday, forNewTomorrow } = organizedActivities;
    
    // Reset completed status for kept activities
    const keptActivities = toKeepForToday.map(a => ({ ...a, completed: false }));
    
    // Combine kept activities with tomorrow's activities
    const newTodayActivities = [...keptActivities, ...fromTomorrowToToday];
    
    // Update users data
    const updatedUsers = {
      ...users,
      [currentUser]: {
        ...users[currentUser],
        days: {
          ...users[currentUser].days,
          today: { activities: newTodayActivities },
          tomorrow: { activities: forNewTomorrow }
        }
      }
    };
    
    setUsers(updatedUsers);
    setActivities(newTodayActivities);
    
    // Exit edit mode
    setIsEditMode(false);
    
    // Close the modal
    setShowCompleteDayModal(false);
    
    // Show success message
    showToast({ 
      message: 'Day completed! Activities reorganized.',
      duration: 3000,
    });
  };

  // Import data function
  const importData = async () => {
    // For Android, try to access app's external files directory
    if (Platform.OS === 'android') {
      try {
        // First check app's documents directory (where exports might be saved)
        const documentsPath = `${RNFS.ExternalDirectoryPath}/Documents`;
        let jsonFiles = [];
        
        // Try to create Documents directory if it doesn't exist
        try {
          await RNFS.mkdir(documentsPath);
        } catch (e) {
          // Directory might already exist
        }
        
        // Check multiple locations where files might be
        const searchPaths = [
          RNFS.DownloadDirectoryPath,
          RNFS.ExternalDirectoryPath,
          `${RNFS.ExternalDirectoryPath}/Documents`,
          RNFS.DocumentDirectoryPath,
        ];
        
        for (const path of searchPaths) {
          try {
            const files = await RNFS.readDir(path);
            const foundFiles = files.filter(f => 
              f.name.endsWith('.json') && 
              f.name.toLowerCase().includes('stackmap')
            );
            jsonFiles = jsonFiles.concat(foundFiles);
          } catch (e) {
            // Skip paths we can't access
          }
        }
        
        // Remove duplicates based on file name (not path)
        // This ensures we don't show the same backup file multiple times
        // even if it exists in different directories
        const uniqueFiles = Array.from(new Map(jsonFiles.map(f => [f.name, f])).values());
        
        
        if (uniqueFiles.length === 0) {
          Alert.alert(
            'No StackMap Files Found',
            'To import data:\n\n1. First export your data using the Export button\n2. The file will be saved via the share menu\n3. Save it to your device storage\n4. Try importing again\n\nNote: On newer Android versions, apps have limited file access.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // If multiple files, show picker
        if (uniqueFiles.length > 1) {
          // Sort files by modified time (newest first)
          uniqueFiles.sort((a, b) => b.mtime - a.mtime);
          
          // Android Alert can only show 3 buttons max, so if we have more files,
          // we need to show them in batches or use a different approach
          if (uniqueFiles.length > 2) {
            // Show only the 2 most recent files + a "Show More" option
            const recentFiles = uniqueFiles.slice(0, 2);
            const fileOptions = recentFiles.map(f => {
              // Parse the filename to get date and time
              const match = f.name.match(/stackmap-export-(\d{4}-\d{2}-\d{2})-?(\d{2}-\d{2}-\d{2})?/);
              let displayName = f.name;
              
              if (match) {
                const date = match[1];
                const time = match[2] ? match[2].replace(/-/g, ':') : '';
                
                // Just show the raw date and time from filename
                // to avoid timezone confusion
                displayName = time ? `${date} at ${time}` : date;
                
                // Add file size
                const sizeKB = Math.round(f.size / 1024);
                displayName += ` (${sizeKB} KB)`;
              }
              
              return {
                text: displayName,
                onPress: () => importFromFile(f.path, f.name)
              };
            });
            
            Alert.alert(
              'Select Backup to Import',
              `Found ${uniqueFiles.length} backups. Showing 2 most recent:`,
              [
                ...fileOptions,
                {
                  text: 'Show All Files',
                  onPress: () => {
                    // Show all files with their full paths
                    const allFilesInfo = uniqueFiles.map((f, index) => {
                      const match = f.name.match(/stackmap-export-(\d{4}-\d{2}-\d{2})-?(\d{2}-\d{2}-\d{2})?/);
                      let info = `${index + 1}. `;
                      if (match) {
                        const date = match[1];
                        const time = match[2] ? match[2].replace(/-/g, ':') : '';
                        info += time ? `${date} at ${time}` : date;
                      } else {
                        info += f.name;
                      }
                      info += ` (${Math.round(f.size / 1024)} KB)`;
                      return info;
                    }).join('\n');
                    
                    Alert.alert(
                      'All Backup Files',
                      allFilesInfo + '\n\nTo import a specific file, use a file manager app to open it with StackMap.',
                      [{ text: 'OK', onPress: () => importData() }]
                    );
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          } else {
            // 2 or fewer files, show them all
            const fileOptions = uniqueFiles.map(f => {
              // Parse the filename to get date and time
              const match = f.name.match(/stackmap-export-(\d{4}-\d{2}-\d{2})-?(\d{2}-\d{2}-\d{2})?/);
              let displayName = f.name;
              
              if (match) {
                const date = match[1];
                const time = match[2] ? match[2].replace(/-/g, ':') : '';
                
                // Just show the raw date and time from filename
                // to avoid timezone confusion
                displayName = time ? `${date} at ${time}` : date;
                
                // Add file size
                const sizeKB = Math.round(f.size / 1024);
                displayName += ` (${sizeKB} KB)`;
              }
              
              return {
                text: displayName,
                onPress: () => importFromFile(f.path, f.name)
              };
            });
            
            Alert.alert(
              'Select Backup to Import',
              `Found ${uniqueFiles.length} StackMap backups:`,
              [...fileOptions, { text: 'Cancel', style: 'cancel' }]
            );
          }
        } else {
          // Single file found - show confirmation
          const f = uniqueFiles[0];
          const match = f.name.match(/stackmap-export-(\d{4}-\d{2}-\d{2})-?(\d{2}-\d{2}-\d{2})?/);
          let fileInfo = f.name;
          
          if (match) {
            const date = match[1];
            const time = match[2] ? match[2].replace(/-/g, ':') : '';
            fileInfo = time ? `${date} at ${time}` : date;
          }
          
          Alert.alert(
            'Import Backup?',
            `Found backup from ${fileInfo}\n\nThis will replace all your current data.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Import', 
                style: 'destructive',
                onPress: () => importFromFile(f.path, f.name)
              }
            ]
          );
        }
      } catch (error) {
        console.error('Import error:', error);
        Alert.alert(
          'Import Error', 
          'Unable to access files. This is normal on newer Android versions due to storage restrictions.\n\nTry using a file manager app to share the JSON file with StackMap.'
        );
      }
      return;
    }
    
    // iOS uses DocumentPicker
    try {
      console.log('Starting import process...');
      const result = await DocumentPicker.pick({
        type: Platform.OS === 'web' ? 'application/json' : [DocumentPicker.types.json],
        copyTo: 'cachesDirectory',
      });
      
      console.log('DocumentPicker result:', result);
      
      let fileContent;
      
      // Web implementation includes content directly
      if (Platform.OS === 'web' && result[0]?.content) {
        console.log('Using web content path');
        fileContent = result[0].content;
      } else if (result[0]?.fileCopyUri) {
        // Native implementation needs to read the file
        console.log('Using native file path');
        fileContent = await RNFS.readFile(result[0].fileCopyUri, 'utf8');
        // Clean up temporary file
        await RNFS.unlink(result[0].fileCopyUri);
      } else {
        console.error('No valid file content found in result:', result);
        Alert.alert('Error', 'Could not read the selected file');
        return;
      }
      
      console.log('File content length:', fileContent?.length);
      
      // Parse and validate the data
      let importedData;
      try {
        console.log('Parsing JSON...');
        importedData = JSON.parse(fileContent);
        console.log('Parsed data:', importedData);
      } catch (e) {
        console.error('JSON parse error:', e);
        Alert.alert('Error', 'Invalid file format. Please select a valid StackMap export file.');
        return;
      }
      
      // Migrate data if needed
      console.log('Migrating data structure...');
      const migratedData = migrateDataStructure(importedData);
      console.log('Migrated data:', migratedData);
      
      // Confirm import
      console.log('Showing import confirmation dialog...');
      
      const confirmImport = async () => {
        console.log('User confirmed import, applying data...');
        
        // Disable sync before importing to prevent conflicts
        if (await syncService.isEnabled()) {
          console.log('Disabling sync before import...');
          await syncService.disable();
        }
        
        // Update state with imported data
        const importedCurrentDay = migratedData.currentDay || 'today';
        
        setUsers(migratedData.users || {});
        setCurrentTheme(migratedData.globalSettings?.currentTheme || 'stackBlue');
        setBannerPosition(migratedData.globalSettings?.bannerPosition || 'top');
        // PIN is now handled by secure storage, not imported
        setTemplates(migratedData.templates || []);
        setCurrentDay(importedCurrentDay);
        
        // Set first user as current if available
        const userIds = Object.keys(migratedData.users || {});
        if (userIds.length > 0) {
          setCurrentUser(userIds[0]);
          const activities = migratedData.users[userIds[0]].days?.[importedCurrentDay]?.activities || [];
          setActivities(activities.filter(a => !a.deleted));
          // Load the first user's theme
          if (migratedData.users[userIds[0]]?.settings?.theme) {
            setCurrentTheme(migratedData.users[userIds[0]].settings.theme);
          }
        }
        
        // Save to storage
        await AsyncStorage.setItem('@stackmap_data', JSON.stringify(migratedData));
        
        showToast({ message: 'Data imported successfully' });
        
        // Hide onboarding if we're in it
        if (showOnboarding) {
          setShowOnboarding(false);
        }
      };
      
      // Show confirmation dialog - use platform-specific approach
      if (Platform.OS === 'web') {
        if (window.confirm('This will replace all your current data. Are you sure?')) {
          await confirmImport();
        }
      } else {
        Alert.alert(
          'Import Data',
          'This will replace all your current data. Are you sure?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Import',
              style: 'destructive',
              onPress: confirmImport
            }
          ]
        );
      }
    } catch (error) {
      console.error('Import catch block - error:', error);
      if (DocumentPicker && DocumentPicker.isCancel && DocumentPicker.isCancel(error)) {
        // User cancelled the picker
        console.log('User cancelled file picker');
      } else {
        console.error('Import error details:', error.message, error.stack);
        Alert.alert('Import Error', `Failed to import data: ${error.message}`);
      }
    }
  };
  
  // Helper function to import from a file path
  const importFromFile = async (filePath, fileName) => {
    try {
      // Read the file content
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      
      // Parse and validate the data
      let importedData;
      try {
        importedData = JSON.parse(fileContent);
      } catch (e) {
        Alert.alert('Error', 'Invalid file format. Please select a valid StackMap export file.');
        return;
      }
      
      // Migrate data if needed
      const migratedData = migrateDataStructure(importedData);
      
      // Parse file info for better display
      let fileDisplayName = fileName;
      const match = fileName.match(/stackmap-export-(\d{4}-\d{2}-\d{2})-?(\d{2}-\d{2}-\d{2})?/);
      if (match) {
        const date = match[1];
        const time = match[2] ? match[2].replace(/-/g, ':') : '';
        fileDisplayName = time ? `${date} at ${time}` : date;
      }
      
      // Show import preview
      const userCount = Object.keys(migratedData.users || {}).length;
      const userNames = Object.values(migratedData.users || {}).map(u => u.name).join(', ');
      
      // Confirm import
      Alert.alert(
        'Import Backup',
        `From: ${fileDisplayName}\nUsers: ${userNames} (${userCount} total)\n\n⚠️ This will replace all your current data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              // Disable sync before importing to prevent conflicts
              if (await syncService.isEnabled()) {
                console.log('Disabling sync before import...');
                await syncService.disable();
              }
              
              // Update state with imported data
              const importedCurrentDay = migratedData.currentDay || 'today';
              
              setUsers(migratedData.users || {});
              setCurrentTheme(migratedData.globalSettings?.currentTheme || 'stackBlue');
              setBannerPosition(migratedData.globalSettings?.bannerPosition || 'top');
              // PIN is now handled by secure storage, not imported
              setTemplates(migratedData.templates || []);
              setCurrentDay(importedCurrentDay);
              
              // Set first user as current if available
              const userIds = Object.keys(migratedData.users || {});
              if (userIds.length > 0) {
                setCurrentUser(userIds[0]);
                const activities = migratedData.users[userIds[0]].days?.[importedCurrentDay]?.activities || [];
          setActivities(activities.filter(a => !a.deleted));
                // Load the first user's theme
                if (migratedData.users[userIds[0]]?.settings?.theme) {
                  setCurrentTheme(migratedData.users[userIds[0]].settings.theme);
                }
              }
              
              // Save to storage
              await AsyncStorage.setItem('@stackmap_data', JSON.stringify(migratedData));
              
              showToast({ message: 'Data imported successfully' });
        
        // Hide onboarding if we're in it
        if (showOnboarding) {
          setShowOnboarding(false);
        }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Import from file error:', error);
      Alert.alert('Import Error', 'Failed to read or process the file');
    }
  };

  const resetApp = async () => {
    const message = 'This will delete all your data and reset the app to its initial state. You will need to go through the onboarding again. Are you sure?';
    
    const performReset = async () => {
      try {
              // IMPORTANT: Disable sync FIRST to prevent syncing the reset state to other devices
              if (await syncService.isEnabled()) {
                console.log('Disabling sync before reset...');
                await syncService.disable();
              }
              
              // Clear all AsyncStorage including Zustand storage
              await AsyncStorage.removeItem('@stackmap_data');
              await AsyncStorage.removeItem('@stackmap_hasCompletedOnboarding');
              await AsyncStorage.removeItem('@stackmap_pin_migrated');
              await AsyncStorage.removeItem('userPin'); // Legacy PIN storage
              await AsyncStorage.removeItem('stackMapData'); // Legacy storage key
              await AsyncStorage.removeItem('stackmap-storage'); // Zustand storage
              
              // Clear sync-related storage
              await AsyncStorage.removeItem('@sync_enabled');
              await AsyncStorage.removeItem('@sync_id');
              await AsyncStorage.removeItem('@sync_last_version');
              
              // Skip PIN clearing on Android due to keychain library issues
              // The PIN will be effectively cleared when we reset hasPinProtection state
              
              // Reset Zustand store to initial values
              setUsers({});
              setCurrentUser(null);
              setActivities([]);
              setCurrentTheme('stackBlue');
              setBannerPosition('top');
              setTaskCelebration('rainbow');
              setRoutineCelebration('rainbow');
              setCurrentDay('today');
              
              // Reset local state
              setDisplayMode('numbers');
              setTemplates([]);
              setIsEditMode(false);
              setHasPinProtection(false);
              setActivityCategories(null);
              setAddedToLibraryIds(new Set());
              
              // Reset form states
              setActivityTitle('');
              setActivityDescription('');
              setActivityEmoji(DEFAULT_ACTIVITY_EMOJI);
              setActivityTime('');
              setNewUserName('');
              setNewUserEmoji(DEFAULT_USER_ICON);
              setEditingUser(null);
              setEditingActivity(null);
              
              // Close all modals
              setShowAddUserModal(false);
              setShowEmojiPicker(false);
              setShowActivityLibrary(false);
              setShowActivityModal(false);
              setShowUserModal(false);
              setShowUserDayModal(false);
              setShowUserEmojiPicker(false);
              setShowPrivacyModal(false);
              setShowSupportModal(false);
              setShowReorderModal(false);
              setShowPinModal(false);
              
        // Show success toast
        showToast({ message: 'App reset successfully', type: 'success' });
        
        // Show onboarding after a brief delay
        setTimeout(() => {
          setShowOnboarding(true);
        }, 500);
      } catch (error) {
        console.error('Reset error:', error);
        if (Platform.OS === 'web') {
          window.alert('Failed to reset app data');
        } else {
          Alert.alert('Reset Error', 'Failed to reset app data');
        }
      }
    };
    
    // Show confirmation dialog
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        performReset();
      }
    } else {
      Alert.alert(
        'Reset App',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset Everything',
            style: 'destructive',
            onPress: performReset
          }
        ]
      );
    }
  };

  // Preference save helpers
  const saveThemePreference = (newTheme) => {
    // Theme is saved automatically via useEffect when currentTheme changes
    if (currentUser && users[currentUser]) {
      const updatedUsers = { ...users };
      updatedUsers[currentUser].settings.theme = newTheme;
      setUsers(updatedUsers);
    }
  };

  const saveBannerPositionPreference = (position) => {
    // Banner position is saved automatically via useEffect
  };

  const saveDisplayModePreference = (mode) => {
    // Display mode is saved automatically via useEffect
  };

  const saveCelebrationPreference = (type, celebration) => {
    if (currentUser && users[currentUser]) {
      const updatedUsers = { ...users };
      if (type === 'task') {
        updatedUsers[currentUser].settings.taskCelebration = celebration;
      } else if (type === 'routine') {
        updatedUsers[currentUser].settings.routineCelebration = celebration;
      }
      setUsers(updatedUsers);
    }
  };

  const renderActivity = ({ item, drag, isActive, customWidth }) => {
    const index = activities.findIndex(a => a.id === item.id);
    const CardContent = (
      <TouchableOpacity
        style={[
          styles.activityCard,
          customWidth && { width: customWidth },
          numColumns === 1 && Platform.OS === 'web' && { width: calculateCardWidth(screenDimensions.width), maxWidth: CARD_LAYOUT.singleColumnMaxWidth },
          item.completed && [
            styles.completedCard,
            {
              backgroundColor: theme.light, // Solid light theme color
              borderColor: theme.primary,
            }
          ],
          isActive && styles.draggingCard
        ]}
        onPress={() => !isEditMode && toggleActivity(item.id)}
        onLongPress={() => isEditMode && drag && Platform.OS === 'ios' ? drag() : null}
        disabled={isActive}
        activeOpacity={0.9}
      >
      {/* Completion Circle */}
      <View style={[
        styles.completionCircle,
        item.completed && [styles.completionCircleCompleted, { backgroundColor: theme.primary }]
      ]}>
        <Text style={[
          styles.checkmark,
          !item.completed && styles.checkmarkIncomplete
        ]}>✓</Text>
      </View>

      {/* Number/Time Badge */}
      {displayMode !== 'none' && (
        <TouchableOpacity
          style={[
            styles.numberBadge, 
            { backgroundColor: theme.primary },
            displayMode === 'time' && styles.timeBadge
          ]}
          onPress={() => {
            if (isEditMode && displayMode === 'numbers') {
              promptReorderActivity(item, index + 1);
            }
          }}
          disabled={!isEditMode || displayMode !== 'numbers'}
        >
          <Text style={displayMode === 'time' ? [
            styles.numberText,
            styles.timeText,
            { 
              textShadowColor: 'rgba(255, 255, 255, 0.8)',
              textShadowOffset: { width: 0.5, height: 0.5 },
              textShadowRadius: 0.5
            }
          ] : styles.numberText}>
            {displayMode === 'time' 
              ? (item.time || '--:--')
              : index + 1
            }
          </Text>
        </TouchableOpacity>
      )}

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Emoji or Custom Image */}
        {item.emoji && item.emoji.startsWith('image:') ? (
          <Image 
            source={CUSTOM_IMAGE_SOURCES[item.emoji.substring(6)]}
            style={styles.activityImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.activityEmoji}>{item.emoji || '🎯'}</Text>
        )}
        
        {/* Title */}
        <Text style={[
          styles.activityTitle,
          item.completed && [styles.completedText, { color: 'white' }]
        ]}>
          {item.text || item.title || ''}
        </Text>
        
        {/* Description */}
        {item.description ? (
          <Text style={[
            styles.activityDescription,
            item.completed && [styles.completedText, { color: 'white', opacity: 0.9 }]
          ]}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Edit Mode Actions */}
      {showEditIcons && (
        <>
          {/* Reorder buttons for Android and Web */}
          {(Platform.OS === 'android' || Platform.OS === 'web') && !customWidth && (
            <View style={styles.reorderButtons}>
              <TouchableOpacity
                onPress={() => moveActivity(index, 'up')}
                disabled={index === 0}
                style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
              >
                <Icon name="arrow-upward" size={24} color={index === 0 ? '#ddd' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveActivity(index, 'down')}
                disabled={index === activities.length - 1}
                style={[styles.reorderButton, index === activities.length - 1 && styles.reorderButtonDisabled]}
              >
                <Icon name="arrow-downward" size={24} color={index === activities.length - 1 ? '#ddd' : '#666'} />
              </TouchableOpacity>
            </View>
          )}
          {/* Center Actions - Edit and Add to Library */}
          <View style={styles.editActions}>
            <Animated.View
              style={{
                opacity: editIconsOpacity,
                transform: [{
                  translateY: editIconsTranslateYInterpolated
                }]
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setEditingActivity(item);
                  setActivityTitle(item.text || item.title || '');
                  setActivityDescription(item.description || '');
                  setActivityEmoji(item.emoji || '🎯');
                  setActivityTime(item.time || '');
                  setShowActivityModal(true);
                }}
                style={styles.editButton}
              >
                <Icon name="edit" size={20} color={theme.primary} />
              </TouchableOpacity>
            </Animated.View>
            <Animated.View
              style={{
                opacity: editIconsOpacity,
                transform: [{
                  translateY: editIconsTranslateYInterpolated
                }]
              }}
            >
              <TouchableOpacity
                onPress={() => addActivityToLibrary(item)}
                style={styles.editButton}
                disabled={addedToLibraryIds.has(item.id)}
              >
                <Icon 
                  name={addedToLibraryIds.has(item.id) ? "check" : "library-add"} 
                  size={20} 
                  color={addedToLibraryIds.has(item.id) ? '#4CAF50' : theme.primary} 
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          {/* Bottom Left - Pin */}
          <Animated.View
            style={[
              styles.pinButtonContainer,
              {
                opacity: editIconsOpacity,
                transform: [{
                  translateY: editIconsTranslateYInterpolated
                }]
              }
            ]}
          >
            <TouchableOpacity
              onPress={() => togglePin(item.id)}
              style={[
                styles.editButton,
                {
                  backgroundColor: item.pinned ? theme.primary : '#e8e8e8',
                }
              ]}
            >
              <Icon 
                name="push-pin" 
                size={20} 
                color={item.pinned ? 'white' : '#666'} 
              />
            </TouchableOpacity>
          </Animated.View>
          
          {/* Bottom Right - Delete */}
          <Animated.View
            style={[
              styles.deleteButtonContainer,
              {
                opacity: editIconsOpacity,
                transform: [{
                  translateY: editIconsTranslateYInterpolated
                }]
              }
            ]}
          >
            <TouchableOpacity
              onPress={() => deleteActivity(item.id)}
              style={[
                styles.editButton,
                {
                  backgroundColor: '#f56565',
                }
              ]}
            >
              <Icon name="delete" size={20} color="white" />
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
      </TouchableOpacity>
    );
    
    // Wrap with ScaleDecorator only when drag functionality is available and we're in DraggableFlatList on iOS
    if (drag && typeof drag === 'function' && !customWidth && Platform.OS === 'ios' && ScaleDecorator) {
      const ValidScaleDecorator = ScaleDecorator;
      return <ValidScaleDecorator>{CardContent}</ValidScaleDecorator>;
    }
    
    return CardContent;
  };

  const Header = ({ position = 'top' }) => {
    const handleSwipeGesture = ({ nativeEvent }) => {
      if (State && nativeEvent.state === State.END) {
        const { translationY, velocityY } = nativeEvent;
        
        // Check if it's a vertical swipe (threshold of 30 pixels or velocity > 800)
        if (Math.abs(translationY) > 30 || Math.abs(velocityY) > 800) {
          // Toggle between today and tomorrow
          const newDay = currentDay === 'today' ? 'tomorrow' : 'today';
          setCurrentDay(newDay);
          setActivities(users[currentUser]?.days?.[newDay]?.activities || []);
          
          // Show a quick toast to confirm the change
          showToast({ 
            message: `Switched to ${newDay === 'today' ? 'Today' : 'Tomorrow'}`,
            duration: 1500,
          });
        }
      }
    };

    return (
      <View style={[
        styles.header,
        position === 'bottom' && Platform.OS === 'android' && {
          paddingVertical: isTablet() ? 14 : 10,
          paddingTop: isTablet() ? 16 : 12,
          paddingBottom: isTablet() ? 12 : 8,
          minHeight: isTablet() ? 70 : 60,
        }
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Logo size={isTablet() ? 40 : 32} theme={theme} />
            <Text style={styles.headerTitle}>StackMap</Text>
          </View>
          {Platform.OS === 'ios' && PanGestureHandler ? (
            <PanGestureHandler
              onHandlerStateChange={handleSwipeGesture}
              activeOffsetY={[-10, 10]} // Activate after 10 pixels of movement
            >
              <TouchableOpacity 
                style={[styles.subtitlePill, isEditMode && styles.subtitlePillEdit]}
                onPress={() => setShowUserDayModal(true)}
              >
                <Text style={[styles.subtitleEmoji, isEditMode && styles.subtitleEmojiEdit]}>
                  {users[currentUser]?.icon || '😀'}
                </Text>
                <Text style={[styles.subtitleDay, isEditMode && styles.subtitleDayEdit]}>
                  {isEditMode ? (currentDay === 'today' ? 'Today' : 'Tomorrow') : (users[currentUser]?.name || 'User')}
                </Text>
              </TouchableOpacity>
            </PanGestureHandler>
          ) : (
            <TouchableOpacity 
              style={[styles.subtitlePill, isEditMode && styles.subtitlePillEdit]}
              onPress={() => setShowUserDayModal(true)}
            >
              <Text style={[styles.subtitleEmoji, isEditMode && styles.subtitleEmojiEdit]}>
                {users[currentUser]?.icon || '😀'}
              </Text>
              <Text style={[styles.subtitleDay, isEditMode && styles.subtitleDayEdit]}>
                {isEditMode ? (currentDay === 'today' ? 'Today' : 'Tomorrow') : (users[currentUser]?.name || 'User')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };


  // Calculate FAB position - they should always sit on the banner
  // For iPhone in bottom banner mode: center on header content area
  // The FABs need to be lower, centered on the banner content
  const fabBottom = bannerPosition === 'bottom' 
    ? isTablet() 
      ? insets.bottom + 25 // Tablets: centered on banner
      : Platform.OS === 'android'
        ? Math.max(insets.bottom + 25, 35) // Android: centered on banner with minimum
        : insets.bottom + 20 // iPhone: just above home bar
    : null; // Will use top positioning for top banner
    
  const fabTop = bannerPosition === 'top'
    ? Platform.OS === 'web'
      ? 25 // Web: center on 110px header (110/2 - 60/2 = 25)
      : Platform.OS === 'android'
        ? (StatusBar.currentHeight || 24) + 25 // Android: moved up to better center on banner
        : insets.top + (isTablet() ? 15 : 25) // iOS: moved up for better centering
    : null;
    
  // All components are properly loaded and ready to render
  
  const AppContent = (
    <>
      <StatusBar 
        barStyle={bannerPosition === 'top' ? 'light-content' : 'dark-content'} 
        backgroundColor={bannerPosition === 'top' ? theme.primary : theme.light} 
        translucent={false}
      />
      <View style={[
        styles.container, 
        { 
          backgroundColor: theme.light
        }
      ]}>
        {/* Status Bar Background when banner is at bottom - not needed on web */}
        {bannerPosition === 'bottom' && Platform.OS !== 'web' && (
          Platform.OS === 'ios' ? (
            <SafeAreaView style={{ backgroundColor: theme.primary }} />
          ) : (
            // On Android, show colored block only when edit mode toolbar is not visible at top
            !(isEditMode && showEditToolbar) && (
              <View style={{ 
                backgroundColor: theme.primary, 
                height: StatusBar.currentHeight || 24,
                width: '100%'
              }} />
            )
          )
        )}
        
        {/* Top Banner */}
        {bannerPosition === 'top' && (
          Platform.OS === 'web' ? (
            <View style={{ backgroundColor: theme.primary }}>
              <Header />
            </View>
          ) : (
            <SafeAreaView style={{ 
              backgroundColor: theme.primary,
              paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
            }}>
              <Header />
            </SafeAreaView>
          )
        )}
        
        {/* Main Content Area */}
        <View style={styles.contentArea}>
          {(numColumns > 1) ? (
            <ScrollView
              style={Platform.OS === 'web' ? { 
                flex: 1,
                height: '100%',
              } : undefined}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={[
                styles.listContent,
                { paddingHorizontal: getContainerPadding(screenDimensions.width) },
                isEditMode && bannerPosition === 'bottom' && { paddingTop: 70 },
                isEditMode && showEditToolbar && bannerPosition === 'bottom' && { paddingTop: Platform.OS === 'android' ? 120 : 110 },
                isEditMode && showEditToolbar && bannerPosition === 'top' && { paddingBottom: Platform.OS === 'android' ? 120 : 110 }
              ]}
            >
              {activities.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>No activities yet</Text>
                  <Text style={styles.emptySubtext}>
                    {isEditMode ? 'Tap Add to create an activity' : 'Tap the edit button to add your first activity'}
                  </Text>
                </View>
              ) : (
                <View style={[
                  styles.gridContainer, 
                  Platform.OS === 'web' ? {
                    display: 'grid',
                    gridTemplateColumns: numColumns === 1 
                      ? '1fr' 
                      : `repeat(${numColumns}, minmax(0, ${CARD_LAYOUT.singleColumnMaxWidth}px))`,
                    rowGap: CARD_LAYOUT.gap,
                    columnGap: CARD_LAYOUT.gap,
                    justifyContent: 'center',
                    ...(numColumns === 1 && {
                      justifyItems: 'center',
                      maxWidth: CARD_LAYOUT.singleColumnMaxWidth,
                      marginLeft: 'auto',
                      marginRight: 'auto',
                    }),
                  } : {
                    // No negative margins needed
                  }
                ]}>
                  {activities.filter(a => !a.deleted).map((item, index) => {
                    return (
                      <View 
                        key={item.id} 
                        style={[
                          styles.cardWrapper,
                          Platform.OS !== 'web' && {
                            width: numColumns > 1 
                              ? calculateCardWidth(screenDimensions.width) - CARD_LAYOUT.gap
                              : calculateCardWidth(screenDimensions.width),
                            marginBottom: CARD_LAYOUT.gap,
                            // Add horizontal margin only for multi-column layouts
                            ...(numColumns > 1 && {
                              marginHorizontal: CARD_LAYOUT.gap / 2,
                            }),
                          },
                          numColumns === 1 && { 
                            maxWidth: CARD_LAYOUT.singleColumnMaxWidth,
                            marginLeft: 'auto',
                            marginRight: 'auto',
                          }
                        ]}
                      >
                        {renderActivity({ 
                          item, 
                          drag: () => {}, 
                          isActive: false,
                          customWidth: true
                        })}
                      </View>
                    );
                  })}
                  {/* Add invisible placeholders to fill the last row */}
                  {(() => {
                    const filteredCount = activities.filter(a => !a.deleted).length;
                    const remainder = filteredCount % numColumns;
                    if (remainder > 0) {
                      const placeholders = [];
                      for (let i = 0; i < (numColumns - remainder); i++) {
                        placeholders.push(
                          <View 
                            key={`placeholder-${i}`} 
                            style={styles.cardWrapper}
                          />
                        );
                      }
                      return placeholders;
                    }
                    return null;
                  })()}
                </View>
              )}
            </ScrollView>
          ) : Platform.OS === 'ios' ? (
            <DraggableFlatList
              data={activities.filter(a => !a.deleted)}
              renderItem={renderActivity}
              keyExtractor={item => item.id}
              onDragEnd={({ data }) => {
                setActivities(data);
                // Save immediately after reordering
                if (currentUser && users[currentUser]) {
                  const updatedUsers = { ...users };
                  if (!updatedUsers[currentUser].days) {
                    updatedUsers[currentUser].days = {};
                  }
                  if (!updatedUsers[currentUser].days[currentDay]) {
                    updatedUsers[currentUser].days[currentDay] = { activities: [] };
                  }
                  updatedUsers[currentUser].days[currentDay].activities = data;
                  setUsers(updatedUsers);
                }
              }}
              contentContainerStyle={[
                styles.listContent,
                isEditMode && bannerPosition === 'bottom' && { paddingTop: 70 },
                isEditMode && showEditToolbar && bannerPosition === 'bottom' && { paddingTop: Platform.OS === 'android' ? 120 : 110 },
                isEditMode && showEditToolbar && bannerPosition === 'top' && { paddingBottom: Platform.OS === 'android' ? 120 : 110 }
              ]}
              ItemSeparatorComponent={() => <View style={{ height: CARD_LAYOUT.gap }} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>No activities yet</Text>
                  <Text style={styles.emptySubtext}>
                    {isEditMode ? 'Tap Add to create an activity' : 'Tap the edit button to add your first activity'}
                  </Text>
                </View>
              }
            />
          ) : (
            // Android/Web fallback - regular FlatList with reorder buttons
            <FlatList
              data={activities.filter(a => !a.deleted)}
              renderItem={renderActivity}
              keyExtractor={item => item.id}
              ItemSeparatorComponent={() => <View style={{ height: CARD_LAYOUT.gap }} />}
              style={Platform.OS === 'web' ? { 
                flex: 1,
                height: '100%',
              } : undefined}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={[
                styles.listContent,
                { paddingHorizontal: getContainerPadding(screenDimensions.width) },
                Platform.OS === 'web' && { alignItems: 'center' },
                isEditMode && bannerPosition === 'bottom' && { paddingTop: 70 },
                isEditMode && showEditToolbar && bannerPosition === 'bottom' && { paddingTop: Platform.OS === 'android' ? 120 : 110 },
                isEditMode && showEditToolbar && bannerPosition === 'top' && { paddingBottom: Platform.OS === 'android' ? 120 : 110 }
              ]}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>No activities yet</Text>
                  <Text style={styles.emptySubtext}>
                    {isEditMode ? 'Tap Add to create an activity' : 'Tap the edit button to add your first activity'}
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {/* Bottom Banner */}
        {bannerPosition === 'bottom' && (
          Platform.OS === 'web' ? (
            <View style={{ backgroundColor: theme.primary }}>
              <Header position="bottom" />
            </View>
          ) : (
            <>
              <SafeAreaView style={{ 
                backgroundColor: theme.primary,
                paddingBottom: Platform.OS === 'android' ? 0 : 0 
              }}>
                <Header position="bottom" />
              </SafeAreaView>
              {Platform.OS === 'android' && (
                <View style={{ 
                  backgroundColor: theme.primary, 
                  height: isTablet() 
                    ? Math.max(insets.bottom, 24) // Tablets: use actual inset or 24px
                    : Math.max(insets.bottom, 16) // Phones: use actual inset or 16px
                }} />
              )}
            </>
          )
        )}
        
        {/* Bottom Safe Area for Mobile only */}
        {bannerPosition === 'top' && Platform.OS !== 'web' && (
          Platform.OS === 'ios' ? (
            <SafeAreaView style={{ backgroundColor: theme.primary }} />
          ) : (
            // On Android, show colored block for navigation bar
            <View style={{ 
              backgroundColor: theme.primary, 
              height: getAndroidModalBottomHeight(insets),
              width: '100%'
            }} />
          )
        )}
        
        {/* FABs - Positioned on the banner */}
        <FAB
          icon="palette"
          onPress={() => {
            setShowUserModal(true);
          }}
          onLongPress={() => {
            setShowUserModal(true);
          }}
          position={{ bottom: fabBottom, top: fabTop, left: 20 }}
          theme={theme}
        />

        <FAB
          icon={isEditMode ? "edit-off" : "edit"}
          onPress={() => {
            if (isEditMode) {
              setIsEditMode(false);
              // Switch to today when exiting edit mode
              if (currentDay !== 'today') {
                setCurrentDay('today');
              }
              // The toolbar will be removed after animation completes
            } else {
              if (hasPinProtection) {
                setShowPinModal(true);
              } else {
                setIsEditMode(true);
              }
            }
          }}
          position={{ bottom: fabBottom, top: fabTop, right: 20 }}
          theme={isEditMode ? { primary: 'white' } : theme}
          style={isEditMode ? { backgroundColor: '#f56565' } : {}}
        />
      </View>

      {/* Add/Edit Activity Modal */}
      <ActivityModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        theme={theme}
        insets={insets}
        // Form state
        activityTitle={activityTitle}
        setActivityTitle={setActivityTitle}
        activityDescription={activityDescription}
        setActivityDescription={setActivityDescription}
        activityEmoji={activityEmoji}
        setActivityEmoji={setActivityEmoji}
        activityTime={activityTime}
        setActivityTime={setActivityTime}
        // Edit mode
        editingActivity={editingActivity}
        // Actions
        onSave={addActivity}
        onReset={resetActivityForm}
        // Emoji picker
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        // Android specific
        getAndroidModalBottomHeight={getAndroidModalBottomHeight}
      />

      {/* Preferences Modal */}
      <PreferencesModal
        visible={showUserModal}
        onClose={() => setShowUserModal(false)}
        theme={theme}
        insets={insets}
        // State
        currentTheme={currentTheme}
        setCurrentTheme={setCurrentTheme}
        bannerPosition={bannerPosition}
        setBannerPosition={setBannerPosition}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        taskCelebration={taskCelebration}
        setTaskCelebration={setTaskCelebration}
        routineCelebration={routineCelebration}
        setRoutineCelebration={setRoutineCelebration}
        preferencesScrollKey={preferencesScrollKey}
        setPreferencesScrollKey={setPreferencesScrollKey}
        // Actions
        onSaveTheme={saveThemePreference}
        onSaveBannerPosition={saveBannerPositionPreference}
        onSaveDisplayMode={saveDisplayModePreference}
        onSaveCelebration={saveCelebrationPreference}
        onPrivacyPress={() => {
          setShowUserModal(false);
          setTimeout(() => setShowPrivacyModal(true), 300);
        }}
        onSupportPress={() => {
          setShowUserModal(false);
          setTimeout(() => setShowSupportModal(true), 300);
        }}
        // Android specific
        getAndroidModalBottomHeight={getAndroidModalBottomHeight}
      />
      
      
      {/* EditModeSettingsModal removed - functionality distributed to specific modals */}
      
      {/* Add/Edit User Modal */}
      <AddUserModal
        visible={showAddUserModal}
        onClose={() => {
          setShowAddUserModal(false);
          setEditingUser(null);
        }}
        theme={theme}
        insets={insets}
        newUserName={newUserName}
        setNewUserName={setNewUserName}
        newUserEmoji={newUserEmoji}
        setNewUserEmoji={setNewUserEmoji}
        showUserEmojiPicker={showUserEmojiPicker}
        setShowUserEmojiPicker={setShowUserEmojiPicker}
        editingUser={editingUser}
        users={users}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        showToast={showToast}
        getAndroidModalBottomHeight={getAndroidModalBottomHeight}
      />
      
      {/* PIN Modal */}
      <PinModal
        visible={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPinInput('');
          setConfirmPin('');
          setIsSettingPin(false);
        }}
        theme={theme}
        pinInput={pinInput}
        setPinInput={setPinInput}
        isSettingPin={isSettingPin}
        confirmPin={confirmPin}
      />

      {/* Edit Mode Toolbar */}
      {showEditToolbar && (
        <EditModeToolbar
          visible={isEditMode}
          onExit={() => {
            setIsEditMode(false);
            // Switch to today when exiting edit mode
            if (currentDay !== 'today') {
              setCurrentDay('today');
            }
          }}
          onAdd={() => setShowActivityModal(true)}
          onLibrary={() => setShowActivityLibrary(true)}
          onPlan={() => setShowUserDayModal(true)}
          onShare={syncEnabled ? () => {
            setShareUserId(currentUser);
            setShowShareModal(true);
          } : null}
          onData={() => setShowDataModal(true)}
          onUsers={() => setShowUsersSecurityModal(true)}
          onCustomize={() => setShowToolbarCustomizeModal(true)}
          toolbarOrder={toolbarOrder}
          moreButtonPosition={moreButtonPosition}
          onCompleteDay={() => setShowCompleteDayModal(true)}
          theme={theme}
          position={bannerPosition === 'top' ? 'bottom' : 'top'}
          onAnimationComplete={() => {
            if (!isEditMode) {
              setShowEditToolbar(false);
            }
          }}
        />
      )}
      
      {/* Activity Library Modal */}
      <ActivityLibrary
        visible={showActivityLibrary}
        onClose={() => setShowActivityLibrary(false)}
          onSelectActivity={(activity) => {
            // Create a new activity from the template
            const newActivity = {
              ...activity,
              id: Date.now().toString(),
              completed: false,
              pinned: false,
            };
            
            const updatedActivities = [...activities, newActivity];
            
            // Update the current day's activities
            const updatedUsers = {
              ...users,
              [currentUser]: {
                ...users[currentUser],
                days: {
                  ...users[currentUser].days,
                  [currentDay]: {
                    ...users[currentUser].days?.[currentDay],
                    activities: updatedActivities
                  }
                }
              }
            };
            
            setUsers(updatedUsers);
            setActivities(updatedActivities);
            showToast({ 
              message: `✅ Added: ${activity.emoji} ${activity.name || activity.text}`,
              duration: 2000,
            });
          }}
        theme={theme}
        categories={activityCategories}
        onSaveCategories={setActivityCategories}
      />
      
      {/* Privacy Policy Modal */}
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        insets={insets}
        getAndroidModalBottomHeight={getAndroidModalBottomHeight}
        styles={styles}
      />
      
      {/* Reorder Modal */}
      <ReorderModal
        visible={showReorderModal}
        onClose={() => {
          setShowReorderModal(false);
          setReorderingActivity(null);
          setNewPosition('');
        }}
        theme={theme}
        reorderingActivity={reorderingActivity}
        activities={activities}
        newPosition={newPosition}
        setNewPosition={setNewPosition}
        onReorder={handleReorder}
        styles={styles}
      />
      
      {/* Support Us Modal */}
      <SupportModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        insets={insets}
        getAndroidModalBottomHeight={getAndroidModalBottomHeight}
        styles={styles}
      />
      
      {/* Toast Notification */}
      <Toast
        toast={toast}
        onDismiss={hideToast}
        theme={theme}
      />
      
      {/* Celebration View */}
      {showCelebration && (
        <CelebrationView
          type={showCelebration.type}
          theme={showCelebration.theme}
          onComplete={() => setShowCelebration(null)}
        />
      )}
      
      {/* Context Modal - Normal Mode */}
      {!isEditMode && (
        <ContextModal
          visible={showUserDayModal}
          onClose={() => setShowUserDayModal(false)}
          currentUser={currentUser}
          users={users}
          theme={theme}
          onUserChange={(userId) => {
            setCurrentUser(userId);
            if (users[userId]?.settings?.theme) {
              setCurrentTheme(users[userId].settings.theme);
            }
          }}
          onSave={(contextData) => {
            // Save context data for the selected user
            const userToSave = contextData.user || currentUser;
            const updatedContextData = {
              ...userContextData,
              [userToSave]: contextData
            };
            setUserContextData(updatedContextData);
            // User context is now persisted automatically through Zustand
            showToast({ message: 'Context saved!' });
            
            // Only close modal if it's not an auto-save
            if (!contextData.autoSave) {
              setShowUserDayModal(false);
            }
          }}
        />
      )}

      {/* Planning Modal - Edit Mode */}
      {isEditMode && (
        <PlanningModal
          visible={showUserDayModal}
          onClose={() => setShowUserDayModal(false)}
          currentUser={currentUser}
          currentDay={currentDay}
          users={users}
          theme={theme}
          dayMode={dayMode}
          setDayMode={setDayMode}
          onSelectUserDay={(userId, day) => {
            setCurrentUser(userId);
            setCurrentDay(day);
            const dayActivities = users[userId]?.days?.[day]?.activities || [];
            setActivities(dayActivities.filter(a => !a.deleted));
            // Load the selected user's theme
            if (users[userId]?.settings?.theme) {
              setCurrentTheme(users[userId].settings.theme);
            }
            showToast({ message: `Planning ${users[userId].name}'s ${day === 'today' ? 'Today' : 'Tomorrow'}` });
          }}
        />
      )}
      
      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareUserId(null);
        }}
        theme={theme}
        user={shareUserId ? users[shareUserId] : null}
        userId={shareUserId}
        showToast={showToast}
      />
      
      {/* Data Modal */}
      <DataModal
        visible={showDataModal}
        onClose={() => setShowDataModal(false)}
        theme={theme}
        onExportData={exportData}
        onImportData={importData}
        onResetApp={resetApp}
        showToast={showToast}
        onSyncStatusChange={(enabled) => setSyncEnabled(enabled)}
      />
      
      {/* Users & Security Modal */}
      <UsersSecurityModal
        visible={showUsersSecurityModal}
        onClose={() => setShowUsersSecurityModal(false)}
        theme={theme}
        users={users}
        currentUser={currentUser}
        onUserSelect={(userId) => {
          setCurrentUser(userId);
          const userActivities = users[userId]?.days?.[currentDay]?.activities || [];
          setActivities(userActivities.filter(a => !a.deleted));
          if (users[userId]?.settings?.theme) {
            setCurrentTheme(users[userId].settings.theme);
          }
          showToast({ message: `Switched to ${users[userId].name}` });
        }}
        onUserEdit={(userId, userName, userIcon) => {
          setEditingUserId(userId);
          setEditingUserName(userName);
          setEditingUserIcon(userIcon);
          setShowAddUserModal(true);
        }}
        onUserDelete={deleteUser}
        onAddUser={() => setShowAddUserModal(true)}
        hasPinProtection={hasPinProtection}
        onPinChange={() => {
          setIsSettingPin(true);
          setShowPinModal(true);
        }}
        onPinRemove={async () => {
          await removeSecurePin();
          setHasPinProtection(false);
          showToast({ message: 'PIN protection removed' });
        }}
        onPinEnable={() => {
          setIsSettingPin(true);
          setShowPinModal(true);
        }}
        showToast={showToast}
      />
      
      {/* Toolbar Customize Modal */}
      <ToolbarCustomizeModal
        visible={showToolbarCustomizeModal}
        onClose={() => setShowToolbarCustomizeModal(false)}
        theme={theme}
        currentOrder={toolbarOrder}
        moreButtonPosition={moreButtonPosition}
        onSaveOrder={setToolbarOrder}
        onSaveMorePosition={setMoreButtonPosition}
        showToast={showToast}
      />
      
      {/* Complete Day Modal */}
      <CompleteDayModal
        visible={showCompleteDayModal}
        onClose={() => setShowCompleteDayModal(false)}
        theme={theme}
        activities={activities}
        showToast={showToast}
        onCompleteDay={handleCompleteDayConfirm}
        currentUser={currentUser}
        users={users}
      />
      </>
  );

  // Show setup wizard if needed
  // SetupWizard component not implemented yet
  // if (showSetupWizard) {
  //   return (
  //     <SetupWizard
  //       onComplete={handleSetupWizardComplete}
  //       onSkip={handleOnboardingSkip}
  //     />
  //   );
  // }
  
  // Don't render until store is hydrated
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0095FF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }
  
  // Show share view if share token is present
  if (shareToken) {
    return <ShareView shareToken={shareToken} theme={theme} />;
  }
  
  // Show onboarding if needed (kept for backward compatibility)
  if (showOnboarding) {
    return (
      <OnboardingNew
        onComplete={handleOnboardingComplete}
        onImport={async () => {
          try {
            // Don't hide onboarding until import succeeds
            await importData();
            // Only hide onboarding if import was successful
            // (importData will have already set showOnboarding to false if successful)
          } catch (error) {
            console.log('Import cancelled or failed, staying in onboarding');
            // Stay in onboarding if import fails
          }
        }}
        isAbbreviated={!!syncSetupPhrase}
        syncSetupPhrase={syncSetupPhrase}
      />
    );
  }

  // Wrap with GestureHandlerRootView for iOS only (gesture handler not available on web)
  if (Platform.OS === 'ios' && GestureHandlerRootView) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        {AppContent}
      </GestureHandlerRootView>
    );
  }

  return AppContent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    position: 'relative',
    ...(Platform.OS === 'web' && {
      overflow: 'hidden',
      height: '100%',
    }),
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    paddingVertical: Platform.OS === 'web' ? 20 : (Platform.OS === 'android' ? 12 : 20),
    paddingHorizontal: Platform.OS === 'web' ? 80 : 20, // 60px FAB + 20px margin
    paddingTop: Platform.OS === 'web' ? 20 : (Platform.OS === 'android' ? 16 : 20),
    paddingBottom: Platform.OS === 'web' ? 20 : (Platform.OS === 'android' ? 10 : 20),
    ...(Platform.OS === 'web' && {
      height: 110,
      justifyContent: 'center',
    }),
    ...(Platform.OS === 'android' && {
      minHeight: 70,
      justifyContent: 'center',
      alignItems: 'center',
    }),
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBar: {
    width: 18,
    borderRadius: 1.25,
    backgroundColor: '#667eea',
    marginVertical: 1.5,
  },
  logoBar1: { height: 2.5 },
  logoBar2: { height: 2.5 },
  logoBar3: { height: 5 },
  headerTitle: {
    fontSize: Platform.OS === 'web' ? (isTablet() ? 36 : 25) : (isTablet() ? 36 : 28),
    fontWeight: Platform.OS === 'web' ? '700' : (Platform.OS === 'ios' ? 'bold' : 'normal'),
    color: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  subtitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'web' ? 6 : SPACING.sm, // 20% reduction from 8px
    borderRadius: RADIUS.round,
    marginTop: Platform.OS === 'web' ? 3 : 5, // Tighter gap on native too
    gap: SPACING.sm,
    ...SHADOWS.level2,
  },
  subtitlePillEdit: {
    backgroundColor: 'white',
  },
  subtitleEmoji: {
    fontSize: Platform.OS === 'web' 
      ? (isTablet() ? 21 : 21)  // Reduced by 15% from 24.5px
      : (isTablet() ? 31 : 20), // Keep native sizes unchanged
  },
  subtitleEmojiEdit: {
    // No change needed for emoji in edit mode
  },
  subtitleText: {
    fontSize: Platform.OS === 'web' ? (isTablet() ? 15 : 12) : (isTablet() ? 18 : 14),
    fontWeight: '500',
    color: '#333',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  subtitleDay: {
    fontSize: isTablet() ? 18 : 14,
    color: '#333',
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  subtitleDayEdit: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  exitEditButton: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
    gap: 6,
  },
  exitEditText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  listContent: {
    paddingTop: 24, // Keep consistent top padding
    paddingBottom: 24, // Reduced from 100 to match top padding
    paddingHorizontal: getContainerPadding(),
  },
  webScrollView: {
    height: '100%',
  },
  columnWrapper: {
    gap: CARD_LAYOUT.gap,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
  },
  cardWrapper: {
    ...(Platform.OS === 'web' ? {
      maxWidth: CARD_LAYOUT.maxWidth,
    } : {
      width: calculateCardWidth(),
      marginBottom: CARD_LAYOUT.gap,
      marginLeft: CARD_LAYOUT.gap / 2,
      marginRight: CARD_LAYOUT.gap / 2,
    }),
  },
  activityCard: {
    width: '100%', // Fill the wrapper
    height: getCardHeight(),
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    padding: getCardPadding(),
    ...SHADOWS.level2,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    position: 'relative',
  },
  completedCard: {
    transform: [{ scale: 1.01 }],
    // backgroundColor will be set dynamically with theme color
    borderWidth: 2,
    ...SHADOWS.level3, // Slightly stronger shadow for completed cards
    elevation: 8, // Ensure Android shadow is visible
  },
  draggingCard: {
    opacity: 0.9,
    ...SHADOWS.level4,
  },
  completionCircle: {
    position: 'absolute',
    top: isTablet() ? 20 : 15,
    left: isTablet() ? 20 : 15,
    width: getBadgeDimensions().size,
    height: getBadgeDimensions().size,
    borderRadius: getBadgeDimensions().size / 2,
    backgroundColor: '#e8e8e8',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
  },
  completionCircleCompleted: {
    // backgroundColor is set dynamically in renderActivity
  },
  checkmark: {
    color: 'white',
    fontSize: getBadgeDimensions().iconSize,
    fontWeight: 'bold',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  checkmarkIncomplete: {
    color: '#666',
  },
  numberBadge: {
    position: 'absolute',
    top: isTablet() ? 20 : 15,
    right: isTablet() ? 20 : 15,
    width: getBadgeDimensions().size,
    height: getBadgeDimensions().size,
    borderRadius: getBadgeDimensions().size / 2,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
  },
  timeBadge: {
    width: 'auto',
    minWidth: getBadgeDimensions().size,
    paddingHorizontal: 16,
    borderRadius: getBadgeDimensions().size / 2, // Creates pill shape
  },
  numberText: {
    color: 'white',
    fontSize: getBadgeDimensions().iconSize, // Match checkmark size
    fontWeight: 'bold',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 35,  // Match PWA's 35px padding
    gap: 15,  // PWA uses 15px gap between elements
  },
  activityEmoji: {
    fontSize: 64.8,  // Match PWA's 4.05rem = 64.8px
    lineHeight: 81,  // Match PWA's height
    marginBottom: 0,  // Gap is handled by parent
  },
  activityImage: {
    width: 81,  // Match emoji height
    height: 81,
    marginBottom: 0,
  },
  activityTitle: {
    fontSize: 23,  // Match PWA's 1.44rem = 23.04px  
    fontWeight: Platform.OS === 'android' ? 'normal' : '600',  // Android uses font file, not weight
    color: '#333',
    textAlign: 'center',
    lineHeight: 23 * 1.2,  // Match PWA's line-height: 1.2
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    marginBottom: 4,  // PWA's 0.25rem
  },
  activityDescription: {
    fontSize: 17.3,  // Match PWA's 1.08rem = 17.28px
    color: '#666',
    textAlign: 'center',
    lineHeight: 17.3 * 1.3,  // Match PWA's line-height: 1.3
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  completedText: {
    color: 'white',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#4a5568',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  editActions: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  reorderButtons: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -20 }], // Adjust to center between number badge and delete button
    flexDirection: 'column',
    gap: 8,
  },
  reorderButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.level1,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  reorderButtonDisabled: {
    opacity: 0.3,
    backgroundColor: '#f5f5f5',
  },
  pinButtonContainer: {
    position: 'absolute',
    bottom: 15,
    left: 15,
  },
  deleteButtonContainer: {
    position: 'absolute',
    bottom: 15,
    right: 15,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
  },
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
  modalTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal', // Android uses bold font file
    color: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  timeText: {
    fontSize: isTablet() ? 20 : 18,
    fontWeight: '900', // Maximum bold weight
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    color: '#333',
    marginBottom: 15,
    marginTop: 20,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -7.5,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  toggle: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#e0e0e0',
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  toggleTextActive: {
    color: '#333',
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  emojiPickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  emojiOption: {
    width: '16.66%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionText: {
    fontSize: 30,
  },
  emojiPickerInline: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 20,
  },
  // User management styles
  usersList: {
    marginBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  userItemActive: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  userItemEmoji: {
    fontSize: 24,
  },
  userItemName: {
    fontSize: 16,
    flex: 1,
    color: '#333',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  userItemNameActive: {
    fontWeight: 'bold',
  },
  editUserButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteUserButton: {
    padding: 8,
    marginLeft: 4,
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    gap: 8,
  },
  addUserText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  // PIN styles
  pinSection: {
    marginBottom: 20,
  },
  pinStatus: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  pinButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    justifyContent: 'center',
  },
  pinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  pinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  enterEditModeSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  enterEditModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dataManagementSection: {
    gap: 10,
  },
  modalEditModeButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  editModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.round,
    gap: SPACING.sm,
    ...SHADOWS.level1,
  },
  editModePillText: {
    fontSize: isTablet() ? 16 : 14,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  celebrationScrollView: {
    marginBottom: 20,
  },
  celebrationOptions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 5,
  },
  celebrationOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  celebrationActive: {
    // Background color will be set inline with theme.primary
  },
  celebrationText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#333',
  },
  celebrationTextActive: {
    color: 'white',
  },
  infoSection: {
    marginTop: 30,
    gap: 1,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  infoButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  privacyContent: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  privacyHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#2c3e50',
    paddingBottom: 16,
    marginBottom: 24,
  },
  privacyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  privacyDate: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  privacySection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  privacySubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  privacyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
    marginBottom: 8,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  privacyBold: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  privacyList: {
    marginTop: 8,
  },
  privacyListItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
    marginBottom: 4,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  privacyFooter: {
    backgroundColor: '#e9ecef',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  privacyFooterText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  supportContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff5f8',
  },
  supportHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  supportHeart: {
    fontSize: 48,
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#d63384',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  supportSubtitle: {
    fontSize: 18,
    color: '#6f42c1',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  supportMessageBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b9d',
    shadowColor: '#ff6b9d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  supportWaysSection: {
    marginBottom: 24,
  },
  supportSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d63384',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  supportOptionFun: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  supportIconBig: {
    fontSize: 32,
    marginRight: 16,
    width: 40,
    textAlign: 'center',
  },
  supportOptionContent: {
    flex: 1,
  },
  supportOptionTitleFun: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d63384',
    marginBottom: 4,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  supportOptionTextFun: {
    fontSize: 14,
    lineHeight: 20,
    color: '#495057',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  supportContactBox: {
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0d6efd',
  },
  supportContactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d6efd',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  supportContactText: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  supportFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ffc0cb',
  },
  supportFooterText: {
    fontSize: 16,
    color: '#6f42c1',
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  draggableGrid: {
    flex: 1,
  },
  reorderModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reorderModalContent: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
    borderRadius: 16,
    ...SHADOWS.level3,
  },
  reorderModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  reorderActivityPreview: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
  },
  reorderActivityEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  reorderActivityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  reorderModalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  positionSelector: {
    maxHeight: 60,
    marginBottom: 16,
  },
  positionSelectorContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  positionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  positionButtonCurrent: {
    backgroundColor: 'white',
    borderWidth: 2,
  },
  positionButtonSelected: {
    transform: [{ scale: 1.1 }],
  },
  positionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  positionPreview: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  positionPreviewText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  reorderModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  reorderModalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderModalButtonCancel: {
    backgroundColor: '#e0e0e0',
  },
  reorderModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});

export default App;