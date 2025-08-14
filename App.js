import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Dimensions,
  Image,
  Animated,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';

// Import our custom Text and TextInput components that use Comic Relief
import { Text, TextInput } from './src/components/Typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Keychain from 'react-native-keychain'; // Removed - not used and causing crash
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
  // Use native modules for both iOS and Android
  try {
    DocumentPicker = require('react-native-document-picker').default;
  } catch (e) {
    console.warn('DocumentPicker not available:', e);
    DocumentPicker = null;
  }
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
import { Toast, FAB, EditModeToolbar, Logo, ActivityLibrary, EmojiPicker, CelebrationView, ActivityModal, PreferencesModal, AddUserModal, ContextModal, PrivacyModal, SupportModal, ReorderModal, DataModal, AccessModal, SettingsModal, ConfirmModal, DayManagementModal, ActivityManagementModal, BuyMeCoffeeButton, SyncPreviewModal } from './src/components';
import EditModeList from './src/components/EditModeList';
import { EMPTY_CATEGORIES } from './src/components/ActivityLibrary/ActivityLibrary';
import OnboardingNew from './src/components/Onboarding/OnboardingNew';
import ShareView from './src/components/ShareView/ShareView';
import PinModal from './src/components/Modals/PinModal';
import { STACKMAP_LIBRARY } from './src/constants/stackMapLibrary';

// Component imports verified - all components are properly imported

// Import hooks
import { useToast } from './src/hooks';

// Import stores
import { useAppStore } from './src/stores';

// Import services
import syncService from './src/services/sync/syncService';
import encryptionService from './src/services/sync/encryptionService';

// Import utilities
import {
  setSecurePin,
  getSecurePin,
  hasSecurePin,
  verifyPin,
  migratePinToSecureStorage,
  removeSecurePin,
  debugPinStorage,
} from './src/utils/securePinStorage';
import { debugPINStatus } from './tools/DEBUG_PIN';

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
  const [showEditModeList, setShowEditModeList] = useState(false);
  const [editToolbarMoreExpanded, setEditToolbarMoreExpanded] = useState(false);
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
  const [deleteConfirmActivity, setDeleteConfirmActivity] = useState(null);
  const [newPosition, setNewPosition] = useState('');
  
  // PIN protection state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  // Share modal state
  const [shareUserId, setShareUserId] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [hasPinProtection, setHasPinProtection] = useState(false);
  const [showResetAppConfirm, setShowResetAppConfirm] = useState(false);
  
  // New modal states
  const [showDataModal, setShowDataModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessModalActiveTab, setAccessModalActiveTab] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDayManagementModal, setShowDayManagementModal] = useState(false);
  const [dayManagementActiveTab, setDayManagementActiveTab] = useState(0);
  const [showActivityManagementModal, setShowActivityManagementModal] = useState(false);
  const [activityManagementActiveTab, setActivityManagementActiveTab] = useState(0);
  const [showSyncPreviewModal, setShowSyncPreviewModal] = useState(false);
  const [syncPreviewPhrase, setSyncPreviewPhrase] = useState(null);
  const [showOnboardingImport, setShowOnboardingImport] = useState(false);
  const [onboardingImportData, setOnboardingImportData] = useState(null);
  
  
  // Screen dimensions state
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  
  // Calculate layout values based on current screen dimensions
  const numColumns = calculateColumns(screenDimensions.width);
  // Debug logging for Android tablets
  if (Platform.OS === 'android' && screenDimensions.width >= 600) {
    console.warn(`Android tablet dimensions - width: ${screenDimensions.width}, columns: ${numColumns}`);
  }
  const cardWidth = calculateCardWidth(screenDimensions.width);
  
  // Debug logging for Android tablet issue
  if (Platform.OS === 'android') {
    console.log(`[App.js] Android width: ${screenDimensions.width}, numColumns: ${numColumns}, cardWidth: ${cardWidth}`);
  }
  const cardHeight = getCardHeight();
  
  // DEBUG for Android tablet  
  if (Platform.OS === 'android') {
    console.warn('Android debug:', {
      width: screenDimensions.width,
      numColumns,
      cardWidth,
      isTablet: isTablet(screenDimensions.width)
    });
  }
  
  
  
  // Activity library state
  // activityCategories now in Zustand store
  const [addedToLibraryIds, setAddedToLibraryIds] = useState(new Set());
  
  // Animation values
  const [editModeIconRotation] = useState(() => new Animated.Value(0));
  const [editModeToolbarTranslate] = useState(() => new Animated.Value(100));
  const [editIconsTranslateY] = useState(() => new Animated.Value(0));
  const [editIconsOpacity] = useState(() => new Animated.Value(0));
  const [contentFadeAnim] = useState(() => new Animated.Value(1));
  const [editListFadeAnim] = useState(() => new Animated.Value(0));
  
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
  const [isInitializing, setIsInitializing] = useState(false); // Prevent race conditions
  
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Get the raw query string to handle + characters properly
      const search = window.location.search;
      // Initial URL check
      const urlParams = new URLSearchParams(search);
      const token = urlParams.get('share');
      let syncPhrase = urlParams.get('sync');
      const privacyParam = urlParams.has('privacy');
      const supportParam = urlParams.has('supportus');
      
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
        decoded: syncPhrase ? decodeURIComponent(syncPhrase) : null,
        privacy: privacyParam,
        supportus: supportParam
      });
      
      if (token) {
        setShareToken(token);
      } else if (syncPhrase) {
        // Store sync phrase to handle after app initializes
        setSyncSetupPhrase(syncPhrase);
      }
      
      // Store URL params in state to handle them properly
      if (privacyParam) {
        window.urlOpenPrivacy = true;
      }
      if (supportParam) {
        window.urlOpenSupport = true;
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
      // Checking Zustand hydration
      
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
  
  // Handle URL parameter modals after hydration
  useEffect(() => {
    if (!isHydrated) return;
    
    // Check if we should open modals from URL params
    if (Platform.OS === 'web') {
      // Use a longer delay to ensure everything is mounted
      setTimeout(() => {
        if (window.urlOpenPrivacy) {
          console.log('[App] Opening privacy modal from URL param');
          setShowPrivacyModal(true);
          window.urlOpenPrivacy = false;
        }
        if (window.urlOpenSupport) {
          console.log('[App] Opening support modal from URL param');
          setShowSupportModal(true);
          window.urlOpenSupport = false;
        }
      }, 1000);
    }
  }, [isHydrated]);
  
  // Check sync status
  useEffect(() => {
    if (!isHydrated) return;
    
    // Don't check sync status during onboarding to prevent flashes
    if (showOnboarding || showSetupWizard) return;
    
    const checkSyncStatus = async () => {
      const enabled = await syncService.isEnabled();
      setSyncEnabled(enabled);
    };
    
    checkSyncStatus();
  }, [isHydrated, showOnboarding, showSetupWizard]);
  
  // Load data on mount and migrate PIN if needed
  useEffect(() => {
    // If onboarding is already showing, don't run initialization
    if (showOnboarding) {
      // Onboarding already active, skipping initialization
      return;
    }
    
    if (!isHydrated) return;
    
    // Prevent multiple initialization runs
    if (isInitializing) {
      // Already initializing, skipping duplicate run
      return;
    }
    
    const initializeApp = async () => {
      setIsInitializing(true);
      
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
      // IMPORTANT: Only show onboarding on initial load, not if already showing
      if (!hasCompletedOnboarding && Object.keys(users).length === 0 && !showOnboarding) {
        // Showing onboarding - no users and not completed
        setShowOnboarding(true);
        setIsInitializing(false);
        return; // Don't create default user, wait for onboarding
      }
      
      // Initialize default user if none exists and onboarding is complete
      // IMPORTANT: Never create a default user if we're showing onboarding
      if (hasCompletedOnboarding && Object.keys(users).length === 0 && !showOnboarding) {
        // WARNING: hasCompletedOnboarding is true but no users exist
        // This is likely a bad state from a failed reset - fix it
        // Fixing bad state - resetting hasCompletedOnboarding to false
        setHasCompletedOnboarding(false);
        setShowOnboarding(true);
        setIsInitializing(false);
        return; // Don't create a default user
      }
      
      // Always check secure storage as the source of truth for PIN
      const hasPIN = await hasSecurePin();
      
      setHasPinProtection(hasPIN);
      setIsInitializing(false);
    };
    
    initializeApp();
    
    // Removed automatic PIN clearing - this was causing issues with onboarding PIN setup
    // Users can set PIN during onboarding, so we shouldn't clear it automatically
    
    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });
    
    return () => subscription?.remove();
  }, [isHydrated, hasCompletedOnboarding, users, currentTheme, bannerPosition, activities, currentDay, currentUser, addUser, setCurrentUser, showOnboarding]);

  // Data is now automatically persisted through Zustand

  // Helper function to clean up activities array and ensure no gaps
  const cleanupActivities = (activitiesArray) => {
    if (!activitiesArray || !Array.isArray(activitiesArray)) return [];
    
    // Filter out any null, undefined, or deleted items
    const validActivities = activitiesArray.filter(a => a && !a.deleted);
    
    // If there are any gaps in the array (e.g., missing indices), this will fix them
    return validActivities;
  };

  // Load activities when day changes
  useEffect(() => {
    console.log('[DEBUG App.js] Activity loading effect triggered');
    console.log('[DEBUG App.js] - currentUser:', currentUser);
    console.log('[DEBUG App.js] - currentDay:', currentDay);
    console.log('[DEBUG App.js] - users exist:', !!users);
    console.log('[DEBUG App.js] - user keys:', Object.keys(users || {}));
    
    if (currentUser && users[currentUser]) {
      const rawActivities = users[currentUser]?.days?.[currentDay]?.activities || [];
      console.log(`[DEBUG App.js] Found ${rawActivities.length} activities for user ${currentUser} on ${currentDay}`);
      
      // Debug log for iOS
      if (Platform.OS === 'ios' && rawActivities.length > 0) {
        console.log('🔍 iOS: Loading activities:', JSON.stringify(rawActivities.slice(0, 3), null, 2));
      }
      
      // Log if activities will be cleared
      if (rawActivities.length === 0) {
        console.log('[DEBUG App.js] No activities found, will show default cards');
      } else {
        console.log('[DEBUG App.js] First activity:', rawActivities[0]?.text || rawActivities[0]?.name);
      }
      
      setActivities(cleanupActivities(rawActivities));
    } else {
      console.log('[DEBUG App.js] User not found or not ready:', { currentUser, userExists: !!users[currentUser] });
    }
  }, [currentDay, currentUser, users, setActivities]);
  
  // Handle sync setup from URL parameter
  useEffect(() => {
    if (syncSetupPhrase && isHydrated && hasCompletedOnboarding && !showOnboarding && currentTheme) {
      // Only show sync preview modal if user has already completed onboarding
      // (returning user with sync URL)
      // If they're a new user, onboarding will handle the sync
      setTimeout(() => {
        // Auto-open sync preview modal with sync setup
        // Opening sync preview modal for sync setup
        // Current theme set
        setSyncPreviewPhrase(syncSetupPhrase);
        setShowSyncPreviewModal(true);
      }, 100);
      
      // Clear the URL parameter
      if (Platform.OS === 'web') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      // Clear the state as well
      setSyncSetupPhrase(null);
    }
  }, [syncSetupPhrase, isHydrated, hasCompletedOnboarding, showOnboarding, currentTheme]);
  
  // Animate edit mode transition
  useEffect(() => {
    if (isEditMode) {
      // Entering edit mode with smooth transition
      setShowEditModeList(true);
      
      // Smooth crossfade from regular content to edit list
      Animated.parallel([
        // Fade out regular content
        Animated.timing(contentFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        // Fade in edit list at the same time
        Animated.timing(editListFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Rotate edit mode icon
        Animated.timing(editModeIconRotation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
      
      // Show the edit toolbar
      setShowEditToolbar(true);
    } else {
      // Exiting edit mode with smooth transition
      // Smooth crossfade from edit list back to regular content
      Animated.parallel([
        // Fade out edit list
        Animated.timing(editListFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        // Fade in regular content at the same time
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Rotate edit mode icon back
        Animated.timing(editModeIconRotation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        // Hide toolbar and list after animation completes
        setShowEditToolbar(false);
        setShowEditModeList(false);
        setEditToolbarMoreExpanded(false);
      });
    }
  }, [isEditMode]);
  
  // Handle PIN input
  useEffect(() => {
    if (pinInput.length === PIN_LENGTH && !isSettingPin) {
      console.log('[App] Verifying PIN, input:', pinInput);
      
      // Run debug when PIN verification happens
      debugPINStatus().then(() => {
        console.log('[App] Debug complete, now verifying PIN...');
      });
      
      // Verify PIN
      verifyPin(pinInput).then(async (isValid) => {
        console.log('[App] PIN verification result:', isValid);
        if (isValid) {
          // PIN for main edit mode
          console.log('[App] PIN valid, entering edit mode');
          setIsEditMode(true);
          setShowPinModal(false);
          setPinInput('');
        } else {
          // Double-check if there's actually a PIN set
          const actuallyHasPin = await hasSecurePin();
          console.log('[App] Actually has PIN?:', actuallyHasPin);
          if (!actuallyHasPin) {
            // No PIN exists, so just enter edit mode
            console.log('[App] No PIN set, entering edit mode anyway');
            setHasPinProtection(false);
            setIsEditMode(true);
            setShowPinModal(false);
            setPinInput('');
          } else {
            console.log('[App] Invalid PIN entered');
            Alert.alert('Incorrect PIN', 'Please try again');
            setPinInput('');
          }
        }
      });
    }
  }, [pinInput, isSettingPin]);
  
  // Handle PIN setting
  useEffect(() => {
    if (isSettingPin) {
      if (!confirmPin && pinInput.length === PIN_LENGTH) {
        console.log('[App] PIN setting - first entry:', pinInput);
        // Move to confirm step
        setConfirmPin(pinInput);
        setPinInput('');
        showToast({ message: 'Now re-enter PIN to confirm' });
      } else if (confirmPin && pinInput.length === PIN_LENGTH) {
        console.log('[App] PIN setting - confirmation:', pinInput, 'matches?', pinInput === confirmPin);
        // Verify confirmation
        if (pinInput === confirmPin) {
          console.log('[App] PINs match, saving...');
          setSecurePin(pinInput).then(success => {
            console.log('[App] PIN save result:', success);
            if (success) {
              setShowPinModal(false);
              setPinInput('');
              setConfirmPin('');
              setIsSettingPin(false);
              setHasPinProtection(true);
              showToast({ message: 'PIN set successfully' });
              // Verify it was saved
              hasSecurePin().then(hasPin => {
                console.log('[App] Verification after save - has PIN?:', hasPin);
              });
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
      
      // Check if we have imported data to restore
      const importedDataStr = await AsyncStorage.getItem('@stackmap_import_temp');
      if (importedDataStr) {
        console.log('[ONBOARDING] Found imported data, applying it now...');
        const importedData = JSON.parse(importedDataStr);
        
        // Apply all the imported data NOW that onboarding is complete
        if (importedData.users) {
          setUsers(importedData.users);
          const currentUserId = importedData.currentUser || importedData.currentUserId || Object.keys(importedData.users)[0];
          if (currentUserId && importedData.users[currentUserId]) {
            setCurrentUser(currentUserId);
            const userData = importedData.users[currentUserId];
            setCurrentDay(userData.currentDay || importedData.currentDay || 'today');
            const userActivities = userData.days?.[userData.currentDay || importedData.currentDay || 'today']?.activities || [];
            setActivities(userActivities.filter(a => !a.deleted));
            
            // Restore user settings
            if (userData.settings) {
              if (userData.settings.theme) setCurrentTheme(userData.settings.theme);
              if (userData.settings.displayMode) setDisplayMode(userData.settings.displayMode);
              if (userData.settings.bannerPosition) setBannerPosition(userData.settings.bannerPosition);
              if (userData.settings.taskCelebration) setTaskCelebration(userData.settings.taskCelebration);
              if (userData.settings.routineCelebration) setRoutineCelebration(userData.settings.routineCelebration);
            }
          }
        }
        
        // Restore global settings
        if (importedData.globalSettings) {
          if (importedData.globalSettings.currentTheme) setCurrentTheme(importedData.globalSettings.currentTheme);
          if (importedData.globalSettings.displayMode) setDisplayMode(importedData.globalSettings.displayMode);
          if (importedData.globalSettings.bannerPosition) setBannerPosition(importedData.globalSettings.bannerPosition);
          if (importedData.globalSettings.taskCelebration) setTaskCelebration(importedData.globalSettings.taskCelebration);
          if (importedData.globalSettings.routineCelebration) setRoutineCelebration(importedData.globalSettings.routineCelebration);
        }
        
        // Restore activity categories
        if (importedData.activityCategories) {
          setActivityCategories(importedData.activityCategories);
        }
        
        // Clean up temp storage
        await AsyncStorage.removeItem('@stackmap_import_temp');
        
        // Mark onboarding as completed and show main app
        setHasCompletedOnboarding(true);
        setShowOnboarding(false);
        showToast({ message: 'Data restored successfully' });
        return;
      }
      
      // Mark onboarding as completed
      setHasCompletedOnboarding(true);
      
      // Handle abbreviated onboarding (sync URL flow)
      if (onboardingData?.isAbbreviated && onboardingData?.syncSetupPhrase) {
        console.log('Abbreviated onboarding completed - sync already handled');
        
        // Clear the sync setup phrase to prevent duplicate modal
        setSyncSetupPhrase(null);
        
        // Ensure theme is set before showing main app
        const storeState = useAppStore.getState();
        if (!storeState.currentTheme) {
          console.log('Setting default theme after sync onboarding');
          setCurrentTheme('stackBlue');
        }
        
        // Set showOnboarding to false to show main app
        setShowOnboarding(false);
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
      
      // Create starter activities - explain StackMap features
      const starterActivities = [
        { 
          id: `activity_${timestamp}_1`, 
          text: 'Welcome to StackMap!',
          title: 'Welcome to StackMap!',  // Keep title for backward compatibility
          emoji: '👋',
          description: 'Tap activities to mark them complete',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_2`, 
          text: 'Try Edit Mode',
          title: 'Try Edit Mode',  // Keep title for backward compatibility
          emoji: '✏️',
          description: 'Use the edit button to add, remove, and organize activities',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_3`, 
          text: 'Switch Users',
          title: 'Switch Users',  // Keep title for backward compatibility
          emoji: '👤',
          description: 'Tap your user pill to switch users or check-in',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_4`, 
          text: 'Share with Providers',
          title: 'Share with Providers',  // Keep title for backward compatibility
          emoji: '🔗',
          description: 'Share your activities with caregivers via QR code or link',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_5`, 
          text: 'Sync Across Devices',
          title: 'Sync Across Devices',  // Keep title for backward compatibility
          emoji: '🔄',
          description: 'Keep your data synced with zero-knowledge encryption',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_6`, 
          text: 'Import & Export',
          title: 'Import & Export',  // Keep title for backward compatibility
          emoji: '📦',
          description: 'Backup your data or transfer between devices',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_7`, 
          text: 'Preferences',
          title: 'Preferences',  // Keep title for backward compatibility
          emoji: '🎨',
          description: 'Tap the palette icon to customize colors, animations, and display',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_8`, 
          text: 'Activities',
          title: 'Activities',  // Keep title for backward compatibility
          emoji: '📋',
          description: 'Tap the + icon to add new activities and build your library',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_9`, 
          text: 'Day',
          title: 'Day',  // Keep title for backward compatibility
          emoji: '📅',
          description: 'Use the calendar icon to plan tomorrow or review past days',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_10`, 
          text: 'Access',
          title: 'Access',  // Keep title for backward compatibility
          emoji: '👥',
          description: 'Manage users and set a PIN to protect Edit Mode',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_11`, 
          text: 'Data',
          title: 'Data',  // Keep title for backward compatibility
          emoji: '💾',
          description: 'Backup, restore, sync, and manage your StackMap data',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_12`, 
          text: 'Explore the Library',
          title: 'Explore the Library',  // Keep title for backward compatibility
          emoji: '📚',
          description: 'Check out pre-made activity templates in the StackMap Library',
          pinned: false 
        },
      ];
      
      // Create each user from onboarding
      onboardingData.users.forEach((userData, index) => {
        const userId = `user_${timestamp}_${index}`;
        if (index === 0) firstUserId = userId;
        
        // Debug log for iOS
        if (Platform.OS === 'ios' && index === 0) {
          console.log('🔍 iOS: Starter activities being saved:', JSON.stringify(starterActivities.slice(0, 3), null, 2));
        }
        
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

  const handleOnboardingImportComplete = async (selectedData) => {
    try {
      console.log('[IMPORT] Import selection complete, processing data...');
      
      // Save to temporary storage for onboarding to retrieve
      console.log('[IMPORT] Saving import data temporarily for onboarding...');
      await AsyncStorage.setItem('@stackmap_import_temp', JSON.stringify(selectedData));
      
      // Close the modal
      setShowDataModal(false);
      setShowOnboardingImport(false);
      setOnboardingImportData(null);
      
      showToast({ message: 'Data imported successfully' });
      
      // Prepare summary for onboarding
      const summary = {
        users: selectedData.users ? Object.keys(selectedData.users).length : 0,
        activities: selectedData.activityCards ? selectedData.activityCards.length : 0,
        hasPin: selectedData.globalSettings?.pinEnabled || false,
        userData: selectedData.users || {}
      };
      
      console.log('[IMPORT] Returning summary to onboarding:', summary);
      
      // Resolve the promise from importDataForOnboarding
      if (window.__onboardingImportResolve) {
        window.__onboardingImportResolve({
          success: true,
          summary: summary
        });
        delete window.__onboardingImportResolve;
      }
    } catch (error) {
      console.error('[IMPORT] Error completing import:', error);
      showToast({ message: 'Failed to import data', type: 'error' });
      
      // Reject the promise
      if (window.__onboardingImportResolve) {
        window.__onboardingImportResolve({
          success: false,
          error: error.message
        });
        delete window.__onboardingImportResolve;
      }
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
      
      // Create starter activities - educational cards explaining StackMap features
      const timestamp = Date.now();
      const starterActivities = [
        { 
          id: `activity_${timestamp}_1`, 
          text: 'Welcome to StackMap!',
          title: 'Welcome to StackMap!',  // Keep title for backward compatibility
          emoji: '👋',
          description: 'Tap activities to mark them complete',
          pinned: false 
        },
        { 
          id: `activity_${timestamp}_2`, 
          text: 'Try Edit Mode',
          title: 'Try Edit Mode',  // Keep title for backward compatibility
          emoji: '✏️',
          description: 'Use the edit button to add, remove, and organize activities',
          pinned: false 
        },
        { id: `activity_${timestamp}_3`, text: 'Switch Users', title: 'Switch Users', emoji: '👤', description: 'Tap your user pill to switch users or check-in', pinned: false },
        { id: `activity_${timestamp}_4`, text: 'Share with Providers', title: 'Share with Providers', emoji: '🔗', description: 'Share your activities with caregivers via QR code or link', pinned: false },
        { id: `activity_${timestamp}_5`, text: 'Sync Across Devices', title: 'Sync Across Devices', emoji: '🔄', description: 'Keep your data synced with zero-knowledge encryption', pinned: false },
        { id: `activity_${timestamp}_6`, text: 'Import & Export', title: 'Import & Export', emoji: '📦', description: 'Backup your data or transfer between devices', pinned: false },
        { id: `activity_${timestamp}_7`, text: 'Preferences', title: 'Preferences', emoji: '🎨', description: 'Tap the palette icon to customize colors, animations, and display', pinned: false },
        { id: `activity_${timestamp}_8`, text: 'Activities', title: 'Activities', emoji: '📋', description: 'Tap the + icon to add new activities and build your library', pinned: false },
        { id: `activity_${timestamp}_9`, text: 'Day', title: 'Day', emoji: '📅', description: 'Use the calendar icon to plan tomorrow or review past days', pinned: false },
        { id: `activity_${timestamp}_10`, text: 'Access', title: 'Access', emoji: '👥', description: 'Manage users and set a PIN to protect Edit Mode', pinned: false },
        { id: `activity_${timestamp}_11`, text: 'Data', title: 'Data', emoji: '💾', description: 'Backup, restore, sync, and manage your StackMap data', pinned: false },
        { id: `activity_${timestamp}_12`, text: 'Explore the Library', title: 'Explore the Library', emoji: '📚', description: 'Check out pre-made activity templates in the StackMap Library', pinned: false },
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

  // Ensure theme is always defined, even if currentTheme is undefined
  const theme = currentTheme && THEMES[currentTheme] ? THEMES[currentTheme] : THEMES.stackBlue;
  
  // Log for debugging
  if (!currentTheme) {
    // currentTheme is undefined, using default stackBlue theme
    // THEMES object available
    // isHydrated checked
  }
  
  // Double-check theme is valid
  if (!theme || typeof theme !== 'object') {
    console.error('[App] Theme is invalid:', theme);
    // Force a valid theme
    return (
      <View style={{ flex: 1, backgroundColor: '#0095FF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 20 }}>Loading theme...</Text>
      </View>
    );
  }

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

  const toggleActivity = async (id) => {
    const activity = activities.find(a => a.id === id);
    const wasCompleted = activity?.completed;
    
    // Get device ID for tracking who completed the activity
    const deviceId = await encryptionService.getDeviceId();
    
    const newActivities = activities.map(activity => {
      if (activity.id === id) {
        if (!activity.completed) {
          // Completing the activity - add timestamp and device info
          return { 
            ...activity, 
            completed: true,
            completedAt: Date.now(),
            completedBy: deviceId
          };
        } else {
          // Uncompleting the activity - remove timestamp and device info
          const { completedAt, completedBy, ...activityWithoutCompletion } = activity;
          return {
            ...activityWithoutCompletion,
            completed: false
          };
        }
      }
      return activity;
    });
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
    
    // Check if we just completed an activity (skip animations in edit mode)
    if (!wasCompleted && activity && !isEditMode) {
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

  const addActivity = async () => {
    if (!activityTitle.trim()) return;
    
    // Get device ID for enhanced activity IDs
    const deviceId = await encryptionService.getDeviceId();
    
    const newActivity = {
      id: `activity_${deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    // Initialize with empty categories if none exist
    let categories = activityCategories || EMPTY_CATEGORIES;
    
    // If activityCategories was null or empty array, set it to default
    if (!activityCategories || activityCategories.length === 0) {
      console.log('Initializing activity categories with default template');
      categories = EMPTY_CATEGORIES;
      setActivityCategories(EMPTY_CATEGORIES);
    }
    
    // Create a new array to avoid mutating state
    const updatedCategories = [...categories];
    
    // Find My Templates category
    let myTemplatesIndex = updatedCategories.findIndex(cat => cat.id === 'my-templates');
    
    // If My Templates doesn't exist, create it
    if (myTemplatesIndex === -1) {
      console.log('Creating My Templates category');
      updatedCategories.push({
        id: 'my-templates',
        name: 'My Templates',
        icon: '⭐',
        activities: []
      });
      myTemplatesIndex = updatedCategories.length - 1;
    }
    
    if (myTemplatesIndex !== -1) {
      // Create a template from the activity
      const template = {
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: activity.text || activity.title || 'Untitled',
        emoji: activity.emoji || activity.icon || '🎯',  // Check both emoji and icon fields
        description: activity.description || '',
      };
      
      // Add to My Templates
      updatedCategories[myTemplatesIndex] = {
        ...updatedCategories[myTemplatesIndex],
        activities: [...(updatedCategories[myTemplatesIndex].activities || []), template]
      };
      
      setActivityCategories(updatedCategories);
      
      // Add to tracking set to show checkmark
      setAddedToLibraryIds(prev => new Set([...prev, activity.id]));
      
      // Remove from tracking after delay
      setTimeout(() => {
        setAddedToLibraryIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(activity.id);
          return newSet;
        });
      }, 10000);
      
      showToast({ message: 'Added to My Templates' });
      console.log('Added to library:', template);
    } else {
      showToast({ message: 'Could not find My Templates category' });
      console.error('My Templates category not found in:', categories);
    }
  };
  
  // Handle adding user from AddUserModal
  const handleAddUser = (userName, userEmoji) => {
    console.log('handleAddUser called with:', { userName, userEmoji, emojiType: typeof userEmoji });
    const userId = `user_${Date.now()}`;
    const newUser = {
      id: userId,
      name: userName,
      icon: userEmoji,
      emoji: userEmoji, // Also store in emoji field for compatibility
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
    
    console.log('Creating new user:', newUser);
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
    console.log('handleUpdateUser called with:', { userId, userName, userEmoji, emojiType: typeof userEmoji });
    // Use the store's updateUser method to properly update the user
    updateUser(userId, {
      name: userName,
      icon: userEmoji,
      emoji: userEmoji // Also update emoji field for compatibility
    });
    
    setNewUserName('');
    setNewUserEmoji('😀');
    setEditingUser(null);
    setShowAddUserModal(false);
    showToast({ message: `Updated user: ${userName}` });
  };

  // PIN handlers
  const handlePinChange = () => {
    setIsSettingPin(true);
    setShowPinModal(true);
  };

  const handlePinRemove = async () => {
    try {
      const removed = await removeSecurePin();
      // PIN removal attempted
      
      // Small delay to ensure async operations complete on Android
      if (Platform.OS === 'android') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Always check if PIN was actually removed
      const stillHasPin = await hasSecurePin();
      // PIN removal verified
      
      if (!stillHasPin) {
        setHasPinProtection(false);
        showToast({ message: 'PIN protection removed' });
      } else {
        // PIN still exists after removal attempt
        // Force UI update even if removal check failed
        setHasPinProtection(false);
        showToast({ message: 'PIN removed (please restart app if issues persist)' });
      }
    } catch (error) {
      // Error removing PIN
      // Force UI update even on error to prevent crash
      setHasPinProtection(false);
      showToast({ message: 'PIN removed (please restart app if issues persist)' });
    }
  };

  const handlePinEnable = () => {
    setIsSettingPin(true);
    setShowPinModal(true);
  };

  const handlePinSet = async (pin) => {
    try {
      console.log('[App] Setting PIN, length:', pin?.length);
      // Use secure storage to save PIN
      const success = await setSecurePin(pin);
      console.log('[App] setSecurePin result:', success);
      
      if (success) {
        // Immediately verify the PIN was stored
        const verifyStored = await hasSecurePin();
        console.log('[App] Verification after set - hasSecurePin:', verifyStored);
        
        setHasPinProtection(true);
        setIsSettingPin(false);
        showToast({ message: 'PIN set successfully' });
      } else {
        showToast({ message: 'Failed to set PIN', type: 'error' });
      }
    } catch (error) {
      console.log('[App] Error setting PIN:', error);
      showToast({ message: 'Failed to set PIN', type: 'error' });
    }
  };

  const handlePinVerify = async (pin) => {
    try {
      // Use secure storage to verify PIN
      const isValid = await verifyPin(pin);
      return isValid;
    } catch (error) {
      // Error verifying PIN
      return false;
    }
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
    
    // Show success message
    showToast({ 
      message: 'Day completed! Activities reorganized.',
      duration: 3000,
    });
  };

  // Import data function for onboarding (doesn't hide onboarding)
  const importDataForOnboarding = async () => {
    console.log('[IMPORT] ========== STARTING IMPORT FLOW ==========');
    console.log('[IMPORT] Current state:', {
      hasCompletedOnboarding,
      showOnboarding,
      users: Object.keys(users).length,
      currentUser
    });
    
    try {
      let fileContent;
      
      if (Platform.OS === 'web') {
        // Web implementation using file input
        fileContent = await new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = reject;
              reader.readAsText(file);
            } else {
              reject(new Error('No file selected'));
            }
          };
          input.click();
        });
      } else if (Platform.OS === 'android') {
        // Android: Search for StackMap export files
        let jsonFiles = [];
        
        const searchPaths = [
          RNFS.DownloadDirectoryPath,
          RNFS.ExternalDirectoryPath,
          `${RNFS.ExternalDirectoryPath}/Documents`,
          RNFS.DocumentDirectoryPath,
        ];
        
        for (const path of searchPaths) {
          try {
            // First check if the directory exists
            const exists = await RNFS.exists(path);
            if (!exists) {
              console.log(`[Import] Directory does not exist: ${path}`);
              continue;
            }
            
            const files = await RNFS.readDir(path);
            const foundFiles = files.filter(f => 
              f.name.endsWith('.json') && 
              f.name.toLowerCase().includes('stackmap')
            );
            jsonFiles = jsonFiles.concat(foundFiles);
            console.log(`[Import] Found ${foundFiles.length} files in ${path}`);
          } catch (e) {
            // Skip paths we can't access
            console.log(`[Import] Cannot access directory: ${path}`, e.message);
          }
        }
        
        // Remove duplicates based on file name
        const uniqueFiles = Array.from(new Map(jsonFiles.map(f => [f.name, f])).values());
        
        if (uniqueFiles.length === 0) {
          Alert.alert(
            'No Backup Files Found',
            'No StackMap backup files were found. Please export a backup first from the Data modal.',
            [{ text: 'OK' }]
          );
          return false;
        }
        
        // Sort files by modified time (newest first)
        uniqueFiles.sort((a, b) => b.mtime - a.mtime);
        
        // If multiple files exist, let user choose
        if (uniqueFiles.length > 1) {
          // Show selection dialog
          const selectedFile = await new Promise((resolve) => {
            const fileOptions = uniqueFiles.slice(0, 5).map(f => {
              // Parse the filename to get date and time
              const match = f.name.match(/stackmap-export-(\d{4}-\d{2}-\d{2})-?(\d{2}-\d{2}-\d{2})?/);
              let displayName = f.name;
              
              if (match) {
                const date = match[1];
                const time = match[2] ? match[2].replace(/-/g, ':') : '';
                displayName = time ? `${date} at ${time}` : date;
                
                // Add file size
                const sizeKB = Math.round(f.size / 1024);
                displayName += ` (${sizeKB} KB)`;
              }
              
              return {
                text: displayName,
                onPress: () => resolve(f)
              };
            });
            
            // Handle Android's button limit
            const buttons = [...fileOptions];
            
            // If we have more than 5 files total, add a note about showing only the most recent
            if (uniqueFiles.length > 5) {
              buttons.push({
                text: `More (${uniqueFiles.length - 5} older)`,
                onPress: () => {
                  Alert.alert(
                    'Additional Files',
                    `Showing only the 5 most recent backups. ${uniqueFiles.length - 5} older backup(s) not shown.\n\nTo use an older backup, delete some recent exports first.`,
                    [{ text: 'OK', onPress: () => resolve(null) }]
                  );
                }
              });
            }
            
            buttons.push({ text: 'Cancel', style: 'cancel', onPress: () => resolve(null) });
            
            // Ensure we don't exceed Android's limit
            while (buttons.length > 4) {
              buttons.splice(buttons.length - 2, 1);
            }
            
            Alert.alert(
              'Select Backup to Import',
              `Found ${uniqueFiles.length} backups. Showing ${Math.min(uniqueFiles.length, 5)} most recent:`,
              buttons
            );
          });
          
          if (!selectedFile) {
            console.log('[Import] User cancelled file selection');
            return false;
          }
          
          console.log(`[Import] User selected file: ${selectedFile.path}`);
          try {
            fileContent = await RNFS.readFile(selectedFile.path, 'utf8');
            console.log(`[Import] Successfully read file, length: ${fileContent.length}`);
          } catch (readError) {
            console.error(`[Import] Failed to read file:`, readError);
            Alert.alert('Error', `Could not read the backup file: ${readError.message}`);
            return false;
          }
        } else {
          // Single file - use it directly
          const mostRecentFile = uniqueFiles[0];
          console.log(`[Import] Only one file found, using: ${mostRecentFile.path}`);
          console.log(`[Import] File details:`, mostRecentFile);
          
          try {
            fileContent = await RNFS.readFile(mostRecentFile.path, 'utf8');
            console.log(`[Import] Successfully read file, length: ${fileContent.length}`);
          } catch (readError) {
            console.error(`[Import] Failed to read file:`, readError);
            Alert.alert('Error', `Could not read the backup file: ${readError.message}`);
            return false;
          }
        }
        
      } else if (Platform.OS === 'ios' && DocumentPicker) {
        // iOS implementation using DocumentPicker
        const result = await DocumentPicker.pick({
          type: [DocumentPicker.types.json],
          copyTo: 'cachesDirectory'
        });
        
        if (!result || result.length === 0) {
          return false; // User cancelled
        }
        
        const file = result[0];
        if (file.fileCopyUri) {
          fileContent = await RNFS.readFile(file.fileCopyUri, 'utf8');
          await RNFS.unlink(file.fileCopyUri);
        } else {
          throw new Error('Could not read the selected file');
        }
      } else {
        Alert.alert('Error', 'File import is not available on this platform');
        return false;
      }
      
      console.log(`[Import] Parsing JSON data...`);
      let importedData;
      try {
        importedData = JSON.parse(fileContent);
        console.log(`[Import] Successfully parsed JSON`);
      } catch (parseError) {
        console.error(`[Import] Failed to parse JSON:`, parseError);
        Alert.alert('Error', 'The selected file is not a valid JSON file');
        return false;
      }
      
      console.log(`[Import] Running migration...`);
      // Validate and restore the data
      const migratedData = migrateDataStructure(importedData);
      console.log(`[Import] Migration complete`);
      
      // IMPORTANT: During onboarding, we should NOT update the Zustand store
      // The data will be set when onboarding completes
      // Just validate that we have users to import
      if (!migratedData.users || Object.keys(migratedData.users).length === 0) {
        console.warn('[IMPORT] No users found in import data');
      }
      
      // Set the import data and show DataModal
      console.log('[IMPORT] Showing import selection modal...');
      setOnboardingImportData(migratedData);
      setShowOnboardingImport(true);
      // Set DataModal to import tab
      setShowDataModal(true);
      
      // Return a promise that will resolve when the modal completes
      return new Promise((resolve) => {
        // Store the resolve function to be called when import completes
        window.__onboardingImportResolve = resolve;
      });
    } catch (error) {
      console.error('[IMPORT] Import error:', error);
      console.error('[IMPORT] Error stack:', error.stack);
      showToast({ message: 'Failed to import data', type: 'error' });
      return false;
    }
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
            // First check if the directory exists
            const exists = await RNFS.exists(path);
            if (!exists) {
              console.log(`[Import] Directory does not exist: ${path}`);
              continue;
            }
            
            const files = await RNFS.readDir(path);
            const foundFiles = files.filter(f => 
              f.name.endsWith('.json') && 
              f.name.toLowerCase().includes('stackmap')
            );
            jsonFiles = jsonFiles.concat(foundFiles);
            console.log(`[Import] Found ${foundFiles.length} files in ${path}`);
          } catch (e) {
            // Skip paths we can't access
            console.log(`[Import] Cannot access directory: ${path}`, e.message);
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
          
          // Show file picker with cascading alerts to handle Android's 3-button limit
          const showFilePicker = async (startIndex = 0) => {
            const filesPerPage = 2; // Show 2 files + navigation options
            const endIndex = Math.min(startIndex + filesPerPage, uniqueFiles.length);
            const filesToShow = uniqueFiles.slice(startIndex, endIndex);
            
            const fileOptions = filesToShow.map(f => {
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
            
            const buttons = [...fileOptions];
            
            // Add "More" button if there are more files
            if (endIndex < uniqueFiles.length) {
              buttons.push({
                text: `Show More (${uniqueFiles.length - endIndex} more)`,
                onPress: () => showFilePicker(endIndex)
              });
            } else if (startIndex > 0) {
              // If we're not on the first page, add a "Back" option
              buttons.push({
                text: 'Show Previous',
                onPress: () => showFilePicker(Math.max(0, startIndex - filesPerPage))
              });
            }
            
            // Always add cancel at the end
            buttons.push({ text: 'Cancel', style: 'cancel' });
            
            // Ensure we don't exceed 4 buttons (Android limit)
            while (buttons.length > 4) {
              buttons.splice(buttons.length - 2, 1); // Remove the second-to-last button
            }
            
            const pageInfo = uniqueFiles.length > filesPerPage 
              ? `Showing ${startIndex + 1}-${endIndex} of ${uniqueFiles.length} backups:`
              : `Found ${uniqueFiles.length} backups:`;
            
            Alert.alert('Select Backup to Import', pageInfo, buttons);
          };
          
          await showFilePicker();
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
        // Templates now handled through activityCategories
        setCurrentDay(importedCurrentDay);
        
        // Set first user as current if available
        const userIds = Object.keys(migratedData.users || {});
        if (userIds.length > 0) {
          setCurrentUser(userIds[0]);
          const rawActivities = migratedData.users[userIds[0]].days?.[importedCurrentDay]?.activities || [];
          setActivities(cleanupActivities(rawActivities));
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
  
  // Handle import from DataModal
  const handleImportComplete = async (importData) => {
    try {
      console.log('=== handleImportComplete called ===');
      console.log('Import mode:', importData.mode);
      console.log('Import users:', importData.users ? Object.keys(importData.users) : 'none');
      console.log('Import users data:', importData.users);
      
      // Disable sync before importing to prevent conflicts
      if (await syncService.isEnabled()) {
        console.log('Disabling sync before import...');
        await syncService.disable();
      }
      
      if (importData.mode === 'fresh') {
        console.log('FRESH IMPORT - clearing all data first');
        // Fresh import - clear everything and replace with selected items only
        
        // Clear ALL existing data comprehensively
        setUsers({});
        setActivityCategories([]);
        setActivities([]);
        setTemplates({});
        setUserContextData({});
        setCurrentUser(null);
        setCurrentDay('today');
        setDayMode('today');
        
        // Allow state to settle before importing new data
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Restore selected users
        if (importData.users && Object.keys(importData.users).length > 0) {
          console.log('Restoring users from import:', Object.keys(importData.users));
          
          // Validate and clean user data before importing
          const validatedUsers = {};
          Object.entries(importData.users).forEach(([userId, user]) => {
            // Ensure user has valid name and icon
            const validatedUser = {
              ...user,
              name: user.name && typeof user.name === 'string' && user.name.trim() ? user.name : 'User',
              icon: user.icon && typeof user.icon === 'string' ? user.icon : '👤'
            };
            validatedUsers[userId] = validatedUser;
            console.log(`Validated user ${userId}: name="${validatedUser.name}", icon="${validatedUser.icon}"`);
          });
          
          setUsers(validatedUsers);
          
          // Set first imported user as current
          const userIds = Object.keys(validatedUsers);
          setCurrentUser(userIds[0]);
          
          const userData = validatedUsers[userIds[0]];
          setCurrentDay(userData.currentDay || 'today');
          
          const userActivities = userData.days?.[userData.currentDay || 'today']?.activities || [];
          setActivities(cleanupActivities(userActivities));
          
          // Restore user theme
          if (userData.settings?.theme) {
            setCurrentTheme(userData.settings.theme);
          }
        } else {
          console.log('WARNING: No users in import data, creating default user');
          // No users imported, create a default one
          const defaultUserId = Date.now().toString();
          const defaultUser = {
            id: defaultUserId,
            name: 'User',
            icon: '👤',
            settings: { theme: 'stackBlue' },
            days: { today: { activities: [] }, tomorrow: { activities: [] } }
          };
          setUsers({ [defaultUserId]: defaultUser });
          setCurrentUser(defaultUserId);
        }
        
        // Restore templates by converting to activityCategories format
        if (importData.templates) {
          const categoriesArray = [];
          Object.entries(importData.templates).forEach(([categoryId, category]) => {
            categoriesArray.push({
              id: categoryId,
              name: category.name,
              activities: (category.activities || []).map(activity => ({
                id: activity.id,
                name: activity.text,
                emoji: activity.icon
              }))
            });
          });
          setActivityCategories(categoriesArray);
        }
        
        // Restore global settings
        if (importData.globalSettings) {
          if (importData.globalSettings.currentTheme) {
            setCurrentTheme(importData.globalSettings.currentTheme);
          }
          if (importData.globalSettings.bannerPosition) {
            setBannerPosition(importData.globalSettings.bannerPosition);
          }
        }
        
      } else {
        // Merge mode - add to existing data
        
        // Merge users
        if (importData.users && Object.keys(importData.users).length > 0) {
          console.log('MERGE MODE - merging users');
          const mergedUsers = { ...users };
          
          // Add imported users, creating unique names if duplicates exist
          Object.entries(importData.users).forEach(([userId, user]) => {
            // Validate user data
            const validatedUser = {
              ...user,
              name: user.name && typeof user.name === 'string' && user.name.trim() ? user.name : 'User',
              icon: user.icon && typeof user.icon === 'string' ? user.icon : '👤'
            };
            
            // Check if user with same name already exists
            const existingUserEntry = Object.entries(mergedUsers).find(([id, u]) => u.name === validatedUser.name);
            
            if (existingUserEntry) {
              const [existingUserId, existingUser] = existingUserEntry;
              console.log(`User "${validatedUser.name}" already exists, merging data`);
              
              // Merge the user's days data (activities)
              const mergedDays = { ...existingUser.days };
              if (validatedUser.days) {
                Object.entries(validatedUser.days).forEach(([day, dayData]) => {
                  if (!mergedDays[day]) {
                    mergedDays[day] = dayData;
                  } else {
                    // Merge activities for this day
                    const existingActivities = mergedDays[day].activities || [];
                    const newActivities = dayData.activities || [];
                    
                    // Add new activities that don't already exist (by ID)
                    const existingIds = new Set(existingActivities.map(a => a.id));
                    const uniqueNewActivities = newActivities.filter(a => !existingIds.has(a.id));
                    
                    mergedDays[day] = {
                      ...dayData,
                      activities: [...existingActivities, ...uniqueNewActivities]
                    };
                  }
                });
              }
              
              // Update the existing user with merged data
              mergedUsers[existingUserId] = {
                ...existingUser,
                ...validatedUser,
                days: mergedDays,
                // Preserve existing user's ID and certain settings
                id: existingUserId,
                name: existingUser.name // Keep original name
              };
            } else {
              // User doesn't exist, add as new
              console.log(`Adding new user "${validatedUser.name}"`);
              const newUserId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
              mergedUsers[newUserId] = {
                ...validatedUser,
                id: newUserId
              };
            }
          });
          
          setUsers(mergedUsers);
        }
        
        // Merge activity cards
        if (importData.activityCards && importData.activityCards.length > 0) {
          const currentUserData = users[currentUser];
          if (currentUserData) {
            const currentActivities = [...activities];
            
            // Add imported activities with new IDs to avoid conflicts
            importData.activityCards.forEach(activity => {
              const newActivity = {
                ...activity,
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                completed: false,
                pinned: false,
              };
              currentActivities.push(newActivity);
            });
            
            setActivities(currentActivities);
            
            // Update user data
            const updatedUsers = { ...users };
            updatedUsers[currentUser] = {
              ...currentUserData,
              days: {
                ...currentUserData.days,
                [currentDay]: {
                  ...currentUserData.days?.[currentDay],
                  activities: currentActivities
                }
              }
            };
            setUsers(updatedUsers);
          }
        }
        
        // Merge templates
        if (importData.templates && Object.keys(importData.templates).length > 0) {
          const currentCategories = [...(activityCategories || [])];
          
          Object.entries(importData.templates).forEach(([categoryId, category]) => {
            // Check if category already exists
            const existingCategoryIndex = currentCategories.findIndex(c => c.name === category.name);
            
            if (existingCategoryIndex !== -1) {
              // Merge activities into existing category
              const existingCategory = currentCategories[existingCategoryIndex];
              const existingActivities = existingCategory.activities || [];
              const newActivities = category.activities || [];
              
              newActivities.forEach(newActivity => {
                // Check if activity already exists by name
                if (!existingActivities.some(a => a.name === newActivity.text)) {
                  existingActivities.push({
                    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: newActivity.text,
                    emoji: newActivity.icon
                  });
                }
              });
              
              currentCategories[existingCategoryIndex] = {
                ...existingCategory,
                activities: existingActivities
              };
            } else {
              // Add new category
              currentCategories.push({
                id: categoryId,
                name: category.name,
                activities: (category.activities || []).map(activity => ({
                  id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                  name: activity.text,
                  emoji: activity.icon
                }))
              });
            }
          });
          
          setActivityCategories(currentCategories);
        }
      }
      
      // Hide onboarding if showing
      if (showOnboarding) {
        setShowOnboarding(false);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Error', 'Failed to import data. Please try again.');
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
              // Templates now handled through activityCategories
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
    console.log('[Reset] resetApp called - Starting reset process...');
    // User confirmed reset, performing reset
    try {
      await performReset();
      console.log('[Reset] Reset completed successfully');
    } catch (error) {
      console.error('[Reset] Reset failed:', error);
      // Show error to user
      showToast({ message: 'Reset failed: ' + (error.message || 'Unknown error'), type: 'error' });
    }
  };

  const performReset = async () => {
      try {
              // Starting reset flow
              showToast({ message: 'Starting reset...', type: 'info' });
              
              // IMPORTANT: Disable sync FIRST to prevent syncing the reset state to other devices
              if (await syncService.isEnabled()) {
                // Disabling sync before reset
                await syncService.disable();
              }
              
              // Step 1: Clearing AsyncStorage
              showToast({ message: 'Clearing data...', type: 'info' });
              // Clear ALL AsyncStorage keys to ensure complete reset
              const allKeys = await AsyncStorage.getAllKeys();
              if (allKeys.length > 0) {
                await AsyncStorage.multiRemove(allKeys);
                // Verify they're actually cleared
                const keysAfterClear = await AsyncStorage.getAllKeys();
              }
              
              // Clear MMKV storage if it exists
              if (Platform.OS !== 'web') {
                try {
                  const { MMKV } = require('react-native-mmkv');
                  // Clear main storage
                  const mainStorage = new MMKV({ id: 'stackmap-storage' });
                  mainStorage.clearAll();
                  
                  // Clear PIN storage
                  const pinStorage = new MMKV({ 
                    id: 'stackmap-pin-storage',
                    encryptionKey: 'StackMap-PIN-2025-Secure-Key'
                  });
                  pinStorage.clearAll();
                } catch (mmkvError) {
                  console.log('MMKV clear error (may not be initialized):', mmkvError);
                }
              }
              
              // Clear PIN using our secure storage utility
              try {
                // Use our secure storage utility to remove PIN
                await removeSecurePin();
                // PIN cleared successfully
              } catch (pinError) {
                // Continue with reset even if PIN clearing fails
              }
              
              // Step 2: Resetting Zustand store
              showToast({ message: 'Resetting app state...', type: 'info' });
              // CRITICAL: Reset hasCompletedOnboarding FIRST to prevent race conditions
              setHasCompletedOnboarding(false);
              
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
              
              // Step 3: Store reset complete
              // Templates now handled through activityCategories
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
              // Don't close DataModal here - it handles its own closing
              // setShowDataModal(false);
              setShowAccessModal(false);
              setShowResetAppConfirm(false);
              
        // Show success toast
        showToast({ message: 'App reset successfully', type: 'success' });
        
        // Step 4: Triggering onboarding display
        
        // Force the app to reinitialize by setting hydrated to false briefly
        setIsHydrated(false);
        
        // Show onboarding after a brief delay to ensure state is cleared
        setTimeout(async () => {
          // Step 5: Setting onboarding visible
          setHasCompletedOnboarding(false);
          setShowOnboarding(true);
          setIsHydrated(true);
          
          // Final verification
          const finalKeys = await AsyncStorage.getAllKeys();
          console.log('[Reset] Final AsyncStorage keys:', finalKeys);
          
          // On iOS, we may need to force a refresh
          if (Platform.OS === 'ios') {
            // Force re-render by updating a dummy state
            setCurrentTheme('stackBlue');
          }
          
          // Reset flow complete
        }, 100);
      } catch (error) {
        // Reset error occurred
        showToast({ message: 'Reset error: ' + (error.message || error.toString()), type: 'error' });
        throw error; // Re-throw to handle in resetApp
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

  const renderActivity = ({ item, index, drag, isActive, customWidth }) => {
    // Get the actual index from the filtered activities array
    const filteredActivities = activities.filter(a => !a.deleted);
    
    // Debug log to verify this function is being called
    if (Platform.OS === 'ios') {
      console.log('renderActivity called - item:', item.text, 'provided index:', index);
    }
    
    // Use the provided index if available, otherwise calculate from filtered array
    let actualIndex;
    if (index !== undefined && index !== null) {
      // Trust the index provided by FlatList/DraggableFlatList
      actualIndex = index;
    } else {
      // Fallback: calculate from filtered array
      actualIndex = filteredActivities.findIndex(a => a.id === item.id);
      
      // Debug warning if we had to fallback
      if (__DEV__ && Platform.OS === 'ios') {
        console.warn('Had to calculate index for:', item.text, 'Found:', actualIndex);
      }
    }
    
    const CardContent = (
      <View style={{ position: 'relative' }}>
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
        onPress={() => toggleActivity(item.id)}
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
          <Text 
            style={[
              styles.activityEmoji
            ]}
            accessible={false}
            importantForAccessibility="no"
          >
            {item.emoji || item.icon || '🎯'}
          </Text>
        )}
        
        {/* Title */}
        <View style={{ width: '100%', alignItems: 'center' }}>
          <Text 
            style={[
              styles.activityTitle,
              item.completed && [styles.completedText, { color: 'white' }]
            ]}
            numberOfLines={2}
            allowFontScaling={false}
          >
            {item.text || item.title || item.name || 'Untitled Activity'}
          </Text>
        </View>
        
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

      {/* Edit Mode Actions - Removed: Using EditModeList instead */}
      {false && (
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
      
      {/* Number/Time Badge - moved outside card TouchableOpacity */}
      {displayMode !== 'none' && (
        <TouchableOpacity
          style={[
            styles.numberBadge, 
            { backgroundColor: theme.primary },
            displayMode === 'time' && styles.timeBadge
          ]}
          onPress={() => {
            if (isEditMode && displayMode === 'numbers') {
              promptReorderActivity(item, actualIndex + 1);
            }
          }}
          disabled={!isEditMode || displayMode !== 'numbers'}
        >
          <Text style={displayMode === 'time' ? [
            styles.numberText,
            styles.timeText,
            { 
              textShadowColor: 'rgba(255, 255, 255, 0.8)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2
            }
          ] : styles.numberText}>
            {displayMode === 'time' 
              ? (item.time || '--:--')
              : actualIndex + 1
            }
          </Text>
        </TouchableOpacity>
      )}
      </View>
    );
    
    // Wrap with ScaleDecorator only when drag functionality is available and we're in DraggableFlatList on iOS
    // Additional check: only use if we're in single column mode (DraggableFlatList is only used then)
    if (drag && typeof drag === 'function' && !customWidth && Platform.OS === 'ios' && ScaleDecorator && numColumns === 1) {
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
          const rawActivities = users[currentUser]?.days?.[newDay]?.activities || [];
          setActivities(cleanupActivities(rawActivities));
          
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
          backgroundColor: theme.light,
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
          {(Platform.OS === 'android' && numColumns === 2) && console.warn(`Android: Should render 2 columns! Width: ${screenDimensions.width}`)}
          
          {/* Edit Mode List - Positioned absolutely for crossfade */}
          {showEditModeList && (
            <Animated.View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: editListFadeAnim,
              zIndex: isEditMode ? 2 : 0,
            }}>
              <EditModeList
              activities={activities.filter(a => !a.deleted).map(a => ({
                ...a,
                addedToLibrary: addedToLibraryIds.has(a.id)
              }))}
              contentPadding={{
                // Use 8px padding to match the gap between cards (4px marginVertical × 2)
                // Base 124px when toolbar visible, 184px when More is expanded
                // Edit mode toolbar is OPPOSITE from banner, so flip the padding
                paddingTop: bannerPosition === 'bottom' ? 
                  (showEditToolbar ? (editToolbarMoreExpanded ? 184 : 124) : 94) : 8,
                paddingBottom: bannerPosition === 'top' ? 
                  (showEditToolbar ? (editToolbarMoreExpanded ? 184 : 124) : 94) : 8
              }}
              onUpdate={(newActivities) => {
                // Filter out deleted items before saving
                const activeActivities = newActivities.filter(a => !a.deleted);
                setActivities(newActivities);
                // Update the users state to persist the change
                if (currentUser && users[currentUser]) {
                  const updatedUsers = { ...users };
                  if (!updatedUsers[currentUser].days) {
                    updatedUsers[currentUser].days = {};
                  }
                  if (!updatedUsers[currentUser].days[currentDay]) {
                    updatedUsers[currentUser].days[currentDay] = { activities: [] };
                  }
                  updatedUsers[currentUser].days[currentDay].activities = activeActivities;
                  setUsers(updatedUsers);
                }
              }}
              onEdit={(item) => {
                setEditingActivity(item);
                setActivityTitle(item.text || '');
                setActivityDescription(item.description || '');
                setActivityEmoji(item.emoji || DEFAULT_ACTIVITY_EMOJI);
                setActivityTime(item.time || '');
                setShowActivityModal(true);
              }}
              onLibrary={addActivityToLibrary}
              onToggle={(item) => toggleActivity(item.id)}
              onDelete={(item) => {
                // For iOS, the EditModeListItem will handle Alert.alert
                // For Android/Web, show the ConfirmModal
                if (Platform.OS === 'ios') {
                  deleteActivity(item.id);
                } else {
                  setDeleteConfirmActivity(item);
                }
              }}
              theme={theme}
            />
            </Animated.View>
          )}
          
          {/* Regular Content - Also animated for crossfade */}
          <Animated.View style={{
            flex: 1,
            opacity: contentFadeAnim,
          }}>
          {(numColumns > 1) ? (
            <>
            {Platform.OS === 'android' && console.warn(`Android: ENTERING multi-column branch with ${numColumns} columns`)}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={[
                styles.listContent,
                { 
                  paddingHorizontal: getContainerPadding(screenDimensions.width),
                }
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
                <View 
                  style={[
                  styles.gridContainer,
                  {
                    // Multi-column layout for all platforms
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: Platform.OS === 'web' ? 'center' : 
                      ((Platform.OS === 'android' || (Platform.OS === 'ios' && isTablet(screenDimensions.width))) && numColumns === 2 ? 'space-evenly' : 'flex-start'),
                    alignItems: 'flex-start',
                    alignContent: 'flex-start', // CRITICAL for Android flexWrap to work!
                    width: '100%',
                    ...(Platform.OS === 'android' && { minHeight: 200 }), // Android needs height for flexWrap
                  }
                ]}>
                  {activities.filter(a => !a.deleted).map((item, index) => {
                    return (
                      <View 
                        key={item.id} 
                        style={[
                          styles.cardWrapper,
                          Platform.OS === 'web' ? {
                            // Web uses flexbox with gaps
                            margin: CARD_LAYOUT.gap / 2,
                            flex: numColumns > 1 ? '0 0 auto' : '0 0 100%',
                            width: numColumns === 1 ? '100%' : `calc(${100/numColumns}% - ${CARD_LAYOUT.gap}px)`,
                            maxWidth: numColumns === 1 ? CARD_LAYOUT.singleColumnMaxWidth : CARD_LAYOUT.maxWidth,
                          } : {
                            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                            // CRITICAL FOR ANDROID TABLETS - DO NOT CHANGE THIS!!!!!!!
                            // Android tablets MUST use percentage widths (48%) for flexWrap to work
                            // calculateCardWidth() DOES NOT WORK on Android with flexWrap
                            // This took HOURS to figure out - Android's flexWrap is broken with calculated widths
                            // iPad portrait also benefits from percentage widths for consistent layout
                            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                            width: (Platform.OS === 'android' || (Platform.OS === 'ios' && isTablet(screenDimensions.width))) && numColumns === 2 
                              ? '48%'  // MUST BE PERCENTAGE FOR ANDROID AND IPAD FLEXWRAP TO WORK!!!
                              : calculateCardWidth(screenDimensions.width),
                            marginBottom: CARD_LAYOUT.gap,
                            marginRight: (Platform.OS === 'android' || (Platform.OS === 'ios' && isTablet(screenDimensions.width))) && numColumns === 2 
                              ? 0  // No margin needed with percentage widths on Android and iPad
                              : (numColumns > 1 ? CARD_LAYOUT.gap : 0),
                            maxWidth: CARD_LAYOUT.maxWidth, // Enforce max width of 450px
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
                          index,
                          drag: null, 
                          isActive: false
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
            </>
          ) : Platform.OS === 'ios' ? (
            (() => {
              // Pre-filter the data once
              const filteredData = activities.filter(a => !a.deleted);
              
              // Create a map of item IDs to their indices for O(1) lookup
              const indexMap = {};
              filteredData.forEach((item, idx) => {
                indexMap[item.id] = idx;
              });
              
              return (
                <DraggableFlatList
                  data={filteredData}
                  renderItem={({ item, drag, isActive }) => {
                    // Use the pre-calculated index map
                    const correctIndex = indexMap[item.id] ?? 0;
                    
                    // Always log for debugging
                    console.log('iOS DraggableFlatList - item:', item.text, 'id:', item.id, 'correctIndex:', correctIndex);
                    console.log('indexMap:', JSON.stringify(indexMap));
                    
                    return renderActivity({ item, index: correctIndex, drag, isActive });
                  }}
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
                styles.listContent
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
              );
            })()
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
                Platform.OS === 'web' && { alignItems: 'center' }
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
          </Animated.View>
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
            console.log('[FAB] Edit button pressed', {
              isEditMode,
              hasPinProtection,
              showPinModal
            });
            if (isEditMode) {
              setIsEditMode(false);
              // Switch to today when exiting edit mode
              if (currentDay !== 'today') {
                setCurrentDay('today');
              }
              // The toolbar will be removed after animation completes
            } else {
              if (hasPinProtection) {
                // Ensure we're in verification mode, not setup mode
                setIsSettingPin(false);
                setPinInput('');
                setConfirmPin('');
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
      
      {/* Delete Activity Confirmation Modal */}
      {Platform.OS !== 'ios' && (
        <ConfirmModal
          visible={!!deleteConfirmActivity}
          onClose={() => setDeleteConfirmActivity(null)}
          onConfirm={() => {
            if (deleteConfirmActivity) {
              deleteActivity(deleteConfirmActivity.id);
              setDeleteConfirmActivity(null);
            }
          }}
          theme={theme}
          title="Delete Activity"
          message={`Are you sure you want to delete "${deleteConfirmActivity?.text || deleteConfirmActivity?.title || 'this activity'}"?`}
          confirmText="Delete"
          confirmButtonColor="#e53e3e"
          icon="delete"
          iconColor="#e53e3e"
        />
      )}
      
      {/* EditModeSettingsModal removed - functionality distributed to specific modals */}
      
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
          onData={() => setShowDataModal(true)}
          onUsers={() => {
            setAccessModalActiveTab(0);
            setShowAccessModal(true);
          }}
          onCustomize={() => setShowSettingsModal(true)}
          onSupport={() => setShowSupportModal(true)}
          toolbarOrder={toolbarOrder}
          moreButtonPosition={moreButtonPosition}
          onDayManagement={(tab) => {
            setDayManagementActiveTab(tab === 'plan' ? 0 : 1);
            // Use setTimeout to ensure state update happens first
            setTimeout(() => {
              setShowDayManagementModal(true);
            }, 0);
          }}
          onActivityManagement={(tab) => {
            console.log('EditModeToolbar clicked:', tab);
            const tabIndex = tab === 'add' ? 0 : 1;
            console.log('Setting activityManagementActiveTab to:', tabIndex);
            setActivityManagementActiveTab(tabIndex);
            // Use setTimeout to ensure state update happens first
            setTimeout(() => {
              console.log('Opening modal with tab index:', tabIndex);
              setShowActivityManagementModal(true);
            }, 0);
          }}
          theme={theme}
          position={bannerPosition === 'top' ? 'bottom' : 'top'}
          onAnimationComplete={() => {
            if (!isEditMode) {
              setShowEditToolbar(false);
            }
          }}
          onMoreToggle={(expanded) => setEditToolbarMoreExpanded(expanded)}
        />
      )}
      
      {/* Activity Library Modal */}
      <ActivityLibrary
        visible={showActivityLibrary}
        onClose={() => setShowActivityLibrary(false)}
        showToast={showToast}
        categories={activityCategories}
        onSaveCategories={setActivityCategories}
        onSelectActivity={async (activity) => {
            // Get device ID for enhanced activity IDs
            const deviceId = await encryptionService.getDeviceId();
            
            // Create a new activity from the template with unique ID
            const newActivity = {
              ...activity,
              id: `${deviceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: activity.name || activity.text || '', // Map 'name' to 'text' for consistency
              description: activity.description || '', // Explicitly preserve description
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
              message: `✅ Added: ${activity.emoji} ${newActivity.text}`,
              duration: 2000,
            });
          }}
          onSelectMultipleActivities={async (activitiesToAdd) => {
            // Get device ID for enhanced activity IDs
            const deviceId = await encryptionService.getDeviceId();
            
            // Create all new activities at once
            const newActivities = activitiesToAdd.map((activity, index) => ({
              ...activity,
              id: `${deviceId}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
              text: activity.name || activity.text || '', // Map 'name' to 'text' for consistency
              description: activity.description || '', // Explicitly preserve description
              completed: false,
              pinned: false,
            }));
            
            // Ensure we don't have any gaps in the activities array
            const validActivities = activities.filter(a => a && !a.deleted);
            const updatedActivities = [...validActivities, ...newActivities];
            
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
              message: `✅ Added ${newActivities.length} activities`,
              duration: 2000,
            });
          }}
        theme={theme}
      />
      
      {/* Privacy Policy Modal */}
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        insets={insets}
        getAndroidModalBottomHeight={getAndroidModalBottomHeight}
        styles={styles}
        onShowSupport={() => {
          setShowPrivacyModal(false);
          setTimeout(() => setShowSupportModal(true), 300);
        }}
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
      
      {/* Context Modal - Available in both normal and edit modes */}
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

      
      
      {/* Data Modal */}
      <DataModal
        visible={showDataModal}
        onClose={() => {
          setShowDataModal(false);
          // If we're in onboarding import mode, cancel it
          if (showOnboardingImport) {
            setShowOnboardingImport(false);
            setOnboardingImportData(null);
            if (window.__onboardingImportResolve) {
              window.__onboardingImportResolve({
                success: false,
                error: 'User cancelled'
              });
              delete window.__onboardingImportResolve;
            }
          }
        }}
        theme={theme}
        users={users}
        currentUser={currentUser}
        currentDay={currentDay}
        templates={templates}
        activityCategories={activityCategories}
        currentTheme={currentTheme}
        bannerPosition={bannerPosition}
        hasSecurePin={hasPinProtection}
        showToast={showToast}
        onImportComplete={showOnboardingImport ? handleOnboardingImportComplete : handleImportComplete}
        onSyncStatusChange={(enabled) => setSyncEnabled(enabled)}
        onShowSupport={() => {
          setShowDataModal(false);
          setTimeout(() => setShowSupportModal(true), 300);
        }}
        onReset={resetApp}
        isOnboarding={showOnboardingImport}
        onboardingImportData={onboardingImportData}
        initialTab={showOnboardingImport ? 2 : undefined}
      />

      {/* Sync Preview Modal - always use stackBlue theme for consistency */}
      <SyncPreviewModal
        visible={showSyncPreviewModal}
        onClose={() => {
          setShowSyncPreviewModal(false);
          setSyncPreviewPhrase(null);
        }}
        onConfirm={async () => {
          setShowSyncPreviewModal(false);
          setSyncPreviewPhrase(null);
          // Reload the page to show the synced data
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }}
        syncPhrase={syncPreviewPhrase}
        theme={{
          primary: THEMES.stackBlue?.primary || '#5C7E9D',
          dark: THEMES.stackBlue?.dark || '#4A6680',
          light: THEMES.stackBlue?.light || '#7896B3',
          text: '#000000',
          textSecondary: '#666666',
          background: '#FFFFFF',
          card: '#F5F5F5'
        }}
        showToast={showToast}
      />
      
      {/* Users & Security Modal */}
      <AccessModal
        visible={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        theme={theme}
        users={users}
        currentUser={currentUser}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onSelectUser={(userId) => {
          setCurrentUser(userId);
          const userActivities = users[userId]?.days?.[currentDay]?.activities || [];
          setActivities(userActivities.filter(a => !a.deleted));
          if (users[userId]?.settings?.theme) {
            setCurrentTheme(users[userId].settings.theme);
          }
        }}
        onDeleteUser={deleteUser}
        hasSecurePin={hasPinProtection}
        onSetPin={handlePinSet}
        onRemovePin={handlePinRemove}
        onVerifyPin={handlePinVerify}
        showToast={showToast}
        insets={insets}
        getAndroidModalBottomHeight={getAndroidModalBottomHeight}
        initialTab={accessModalActiveTab}
        setNewUserEmoji={setNewUserEmoji}
        showUserEmojiPicker={showUserEmojiPicker}
        setShowUserEmojiPicker={setShowUserEmojiPicker}
        editingUser={editingUser}
        setEditingUser={setEditingUser}
        handleAddUser={handleAddUser}
        handleUpdateUser={handleUpdateUser}
      />
      
      {/* Add/Edit User Modal - Only render when AccessModal is not visible */}
      {/* On iOS, this modal is rendered inside AccessModal for proper stacking */}
      {(Platform.OS !== 'ios' || !showAccessModal) && (
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
      )}
      
      {/* Settings Modal */}
      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        theme={theme}
        currentOrder={toolbarOrder}
        moreButtonPosition={moreButtonPosition}
        onSaveOrder={setToolbarOrder}
        onSaveMorePosition={setMoreButtonPosition}
        showToast={showToast}
        // Display settings
        bannerPosition={bannerPosition}
        setBannerPosition={setBannerPosition}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        taskCelebration={taskCelebration}
        setTaskCelebration={setTaskCelebration}
        routineCelebration={routineCelebration}
        setRoutineCelebration={setRoutineCelebration}
        onSaveBannerPosition={saveBannerPositionPreference}
        onSaveDisplayMode={saveDisplayModePreference}
        onSaveCelebration={saveCelebrationPreference}
      />
      
      {/* Day Management Modal */}
      <DayManagementModal
        visible={showDayManagementModal}
        onClose={() => setShowDayManagementModal(false)}
        theme={theme}
        activities={activities}
        completedCount={activities.filter(a => a.completed).length}
        totalCount={activities.length}
        onCompleteDay={handleCompleteDayConfirm}
        onPlanTomorrow={() => {/* TODO: Implement plan tomorrow */}}
        showToast={showToast}
        templates={(() => {
          // Transform activityCategories to templates format
          const templatesObject = {};
          if (activityCategories && Array.isArray(activityCategories)) {
            activityCategories.forEach(category => {
              templatesObject[category.id] = {
                name: category.name,
                activities: (category.activities || []).map(activity => ({
                  id: activity.id,
                  text: activity.name,
                  icon: activity.emoji
                }))
              };
            });
          }
          return templatesObject;
        })()}
        users={users}
        currentUser={currentUser}
        tomorrowActivities={users[currentUser]?.days?.tomorrow?.activities || []}
        onUpdateTomorrowActivities={(planData) => {
          // Update activities for the specified user and day
          const updatedUsers = { ...users };
          if (!updatedUsers[planData.userId]) return;
          
          if (!updatedUsers[planData.userId].days) {
            updatedUsers[planData.userId].days = {};
          }
          if (!updatedUsers[planData.userId].days[planData.day]) {
            updatedUsers[planData.userId].days[planData.day] = {};
          }
          
          updatedUsers[planData.userId].days[planData.day].activities = planData.activities;
          setUsers(updatedUsers);
          
          showToast({ message: 'Plan saved successfully!' });
          setShowDayManagementModal(false);
        }}
        initialActiveTab={dayManagementActiveTab}
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
        }}
      />
      
      {/* Activity Management Modal */}
      <ActivityManagementModal
        visible={showActivityManagementModal}
        onClose={() => setShowActivityManagementModal(false)}
        theme={theme}
        categories={activityCategories}
        showToast={showToast}
        onSaveCategories={setActivityCategories}
        stackMapLibrary={STACKMAP_LIBRARY}
        onAddActivity={async (activity) => {
          // Get device ID for enhanced activity IDs
          const deviceId = await encryptionService.getDeviceId();
          
          const newActivity = {
            id: `${deviceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: activity.name || activity.text,
            description: activity.description || '', // Preserve description from library
            icon: activity.emoji || activity.icon,
            completed: false,
            pinned: false,
            deleted: false,
            type: 'task',
            ...(activity.isPersonal && { isPersonal: true })
          };
          setActivities([...activities, newActivity]);
          showToast({ message: `Added "${newActivity.text}" to today's activities` });
        }}
        onSelectActivity={async (activity) => {
          // Get device ID for enhanced activity IDs
          const deviceId = await encryptionService.getDeviceId();
          
          const newActivity = {
            id: `${deviceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: activity.name || activity.text,
            description: activity.description || '', // Preserve description from library
            emoji: activity.emoji || activity.icon || DEFAULT_ACTIVITY_EMOJI,
            completed: false,
            pinned: false,
            deleted: false,
            type: 'task'
          };
          setActivities([...activities, newActivity]);
          showToast({ message: `Added "${newActivity.text}" to today's activities` });
        }}
        onSelectMultipleActivities={async (activitiesToAdd) => {
          // Get device ID for enhanced activity IDs
          const deviceId = await encryptionService.getDeviceId();
          
          // Create all new activities at once
          const newActivities = activitiesToAdd.map((activity, index) => ({
            id: `${deviceId}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            text: activity.name || activity.text || '',
            description: activity.description || '', // Preserve description from library
            emoji: activity.emoji || activity.icon || DEFAULT_ACTIVITY_EMOJI,
            completed: false,
            pinned: false,
            deleted: false,
            type: 'task'
          }));
          
          // Add all new activities at once
          setActivities([...activities, ...newActivities]);
          showToast({ message: `Added ${newActivities.length} activities to today!` });
        }}
        initialTab={activityManagementActiveTab}
      />
      
      
      {/* PIN Modal for Edit Mode - Standalone for when not in Users & Security modal */}
      {showPinModal && !showAccessModal && (
        <PinModal
          visible={showPinModal}
          onClose={() => {
            setShowPinModal(false);
            setPinInput('');
            setIsSettingPin(false);
            setConfirmPin('');
          }}
          theme={theme}
          pinInput={pinInput}
          pinLength={PIN_LENGTH}
          setPinInput={setPinInput}
          isSettingPin={isSettingPin}
          confirmPin={confirmPin}
        />
      )}
      
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
  console.log('[RENDER] Checking showOnboarding:', showOnboarding, 'isHydrated:', isHydrated);
  if (showOnboarding) {
    console.log('[RENDER] ========== RENDERING ONBOARDING ==========');
    return (
      <>
        <OnboardingNew
          onComplete={handleOnboardingComplete}
          onImport={async () => {
            // Create a version of importData that doesn't hide onboarding
            const result = await importDataForOnboarding();
            if (!result || !result.success) {
              throw new Error('Import cancelled or failed');
            }
            return result; // RETURN THE RESULT SO ONBOARDING CAN USE IT!
          }}
          onShowPrivacy={() => setShowPrivacyModal(true)}
          isAbbreviated={!!syncSetupPhrase}
          syncSetupPhrase={syncSetupPhrase}
        />
      
      {/* Privacy Policy Modal - Available during onboarding for App Store */}
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        insets={insets}
        getAndroidModalBottomHeight={getAndroidModalBottomHeight}
        styles={styles}
        onShowSupport={() => {
          setShowPrivacyModal(false);
          setTimeout(() => setShowSupportModal(true), 300);
        }}
      />
      
      {/* Support Modal - Available during onboarding */}
      <SupportModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        showToast={showToast}
        theme={theme}
      />
      
      {/* Data Modal - Available during onboarding for import */}
      <DataModal
        visible={showDataModal}
        onClose={() => {
          setShowDataModal(false);
          // If we're in onboarding import mode, cancel it
          if (showOnboardingImport) {
            setShowOnboardingImport(false);
            setOnboardingImportData(null);
            if (window.__onboardingImportResolve) {
              window.__onboardingImportResolve({
                success: false,
                error: 'User cancelled'
              });
              delete window.__onboardingImportResolve;
            }
          }
        }}
        theme={theme}
        users={users}
        currentUser={currentUser}
        currentDay={currentDay}
        templates={templates}
        activityCategories={activityCategories}
        currentTheme={currentTheme}
        bannerPosition={bannerPosition}
        hasSecurePin={hasPinProtection}
        showToast={showToast}
        onImportComplete={handleOnboardingImportComplete}
        onSyncStatusChange={(enabled) => setSyncEnabled(enabled)}
        onShowSupport={() => {
          setShowDataModal(false);
          setTimeout(() => setShowSupportModal(true), 300);
        }}
        onReset={resetApp}
        isOnboarding={showOnboardingImport}
        onboardingImportData={onboardingImportData}
        initialTab={0}
      />
      </>
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  subtitleEmojiEdit: {
    // No change needed for emoji in edit mode
  },
  subtitleText: {
    fontSize: Platform.OS === 'web' ? (isTablet() ? 15 : 12) : (isTablet() ? 18 : 14),
    fontWeight: '500',
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  subtitleDay: {
    fontSize: isTablet() ? 18 : 14,
    color: '#000',
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
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start', // center on web, flex-start on native for proper multi-column
    alignItems: 'flex-start',
    width: '100%',
  },
  cardWrapper: {
    ...(Platform.OS === 'web' ? {
      maxWidth: CARD_LAYOUT.maxWidth,
    } : {
      // Width is set dynamically in the component, not here
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
    top: isTablet() ? 15 : 15,
    left: isTablet() ? 15 : 15,
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
    color: '#000',
  },
  numberBadge: {
    position: 'absolute',
    top: isTablet() ? 15 : 15,
    right: isTablet() ? 15 : 15,
    width: getBadgeDimensions().size,
    height: getBadgeDimensions().size,
    borderRadius: getBadgeDimensions().size / 2,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
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
    padding: 35,  // Use same padding for all devices
    gap: 15,  // Use same gap for all devices
  },
  activityEmoji: {
    fontSize: isTablet() ? 62 : 64.8,  // 30% larger for tablets (was 48, now 62)
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: isTablet() ? 78 : 81,  // Adjusted line height for tablets
    marginBottom: 0,  // Gap is handled by parent
  },
  activityImage: {
    width: 81,  // Match emoji height
    height: 81,
    marginBottom: 0,
  },
  activityTitle: {
    fontSize: isTablet() ? 23 : 23,  // 30% larger for tablets (was 18, now 23)
    fontFamily: Platform.select({
      ios: 'ComicRelief-Bold',
      android: 'ComicRelief-Bold',
      web: "'Comic Relief', 'Comic Sans MS', cursive"
    }),
    fontWeight: Platform.OS === 'android' ? 'normal' : 'bold',  // Made bolder - was '600', now 'bold'
    color: '#000',
    textAlign: 'center',
    lineHeight: isTablet() ? 23 * 1.2 : 23 * 1.2,  // Adjusted line height
    // fontFamily: TYPOGRAPHY.fontFamily.bold, // TEMPORARILY DISABLED TO TEST
    marginBottom: 4,  // PWA's 0.25rem
    ...(isTablet() && { 
      minHeight: 25,
      width: '100%',
    }),
  },
  activityDescription: {
    fontSize: isTablet() ? 14 : 17.3,  // Smaller text on tablets for better fit
    fontFamily: Platform.OS === 'android' ? 'ComicRelief-Regular' : 'Comic Relief',
    color: '#000',
    textAlign: 'center',
    lineHeight: isTablet() ? 14 * 1.3 : 17.3 * 1.3,  // Adjusted line height
    // fontFamily: TYPOGRAPHY.fontFamily.regular, // TEMPORARILY DISABLED TO TEST
  },
  completedText: {
    color: 'white',
    fontWeight: Platform.OS === 'android' ? 'normal' : '700',  // Android uses font file, not weight
    fontFamily: Platform.select({
      ios: 'ComicRelief-Bold',
      android: 'ComicRelief-Bold',
      web: "'Comic Relief', 'Comic Sans MS', cursive"
    }),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 60,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
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
  timeText: {
    fontSize: isTablet() ? 20 : 18,
    fontWeight: '900', // Maximum bold weight
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    color: '#000',
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
    borderColor: '#000',
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
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  toggleTextActive: {
    color: '#000',
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
    color: '#000',
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  userItemName: {
    fontSize: 16,
    flex: 1,
    color: '#000',
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
    color: '#000',
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
    color: '#000',
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginBottom: 8,
  },
  reorderActivityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
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
    color: '#000',
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
    color: '#000',
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
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});

export default App;