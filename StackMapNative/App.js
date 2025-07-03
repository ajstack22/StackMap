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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

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
} from './src/constants';

// Import components
import { Toast, FAB, EditModeToolbar, Logo, ActivityLibrary, EmojiPicker } from './src/components';
import { DEFAULT_CATEGORIES } from './src/components/ActivityLibrary/ActivityLibrary';

// Import hooks
import { useToast } from './src/hooks';

// Import utilities
import {
  setSecurePin,
  getSecurePin,
  hasSecurePin,
  verifyPin,
  migratePinToSecureStorage,
} from './src/utils/secureStorage';

// Get initial screen dimensions
const { width: initialScreenWidth, height: initialScreenHeight } = Dimensions.get('window');

// These will be recalculated in the component
const baseFontSize = isTablet() ? FONT_SCALE.tablet : FONT_SCALE.mobile;

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
  
  // State
  const [currentTheme, setCurrentTheme] = useState('navy');
  const [bannerPosition, setBannerPosition] = useState('top');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState({});
  const [activities, setActivities] = useState([]);
  const [currentDay, setCurrentDay] = useState('today');
  const [templates, setTemplates] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserDayModal, setShowUserDayModal] = useState(false);
  const [showEditModeSettingsModal, setShowEditModeSettingsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showActivityLibrary, setShowActivityLibrary] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityEmoji, setActivityEmoji] = useState(DEFAULT_ACTIVITY_EMOJI);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEditToolbar, setShowEditToolbar] = useState(false);
  const [showEditIcons, setShowEditIcons] = useState(false);
  
  // User management state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmoji, setNewUserEmoji] = useState(DEFAULT_USER_ICON);
  const [showUserEmojiPicker, setShowUserEmojiPicker] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [dayMode, setDayMode] = useState('today'); // 'today' or 'both'
  
  // PIN protection state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [hasPinProtection, setHasPinProtection] = useState(false);
  
  
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
  const [activityCategories, setActivityCategories] = useState(null);
  const [addedToLibraryIds, setAddedToLibraryIds] = useState(new Set());
  
  // Animation values
  const [editModeIconRotation] = useState(() => new Animated.Value(0));
  const [editModeToolbarTranslate] = useState(() => new Animated.Value(100));
  const [editIconsTranslateY] = useState(() => new Animated.Value(0));
  const [editIconsOpacity] = useState(() => new Animated.Value(0));
  
  // Pre-create interpolated values to avoid creating them during render
  const editIconsTranslateYInterpolated = React.useMemo(() => 
    editIconsTranslateY.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0]
    }),
    [editIconsTranslateY]
  );

  // Load data on mount and migrate PIN if needed
  useEffect(() => {
    const initializeApp = async () => {
      await migratePinToSecureStorage();
      await loadData();
      // Only check secure PIN if we didn't restore the state from saved data
      const savedData = await AsyncStorage.getItem('stackMapData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // If pinEnabled is explicitly set in saved data, use that value
        if (parsedData.globalSettings?.pinEnabled !== undefined) {
          setHasPinProtection(parsedData.globalSettings.pinEnabled);
        } else {
          // No saved PIN state, check secure storage
          const hasPIN = await hasSecurePin();
          setHasPinProtection(hasPIN);
        }
      } else {
        // No saved data at all, check secure storage
        const hasPIN = await hasSecurePin();
        setHasPinProtection(hasPIN);
      }
    };
    
    initializeApp();
    
    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });
    
    return () => subscription?.remove();
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (currentUser) {
      saveData();
    }
  }, [users, activities, currentTheme, bannerPosition, currentDay, activityCategories, hasPinProtection]);

  // Load activities when day changes
  useEffect(() => {
    if (currentUser && users[currentUser]) {
      setActivities(users[currentUser]?.days?.[currentDay]?.activities || []);
    }
  }, [currentDay, currentUser]);
  
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
            useNativeDriver: true,
          }),
          Animated.timing(editIconsOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 10);
      
      // Also animate the main edit mode icon
      Animated.timing(editModeIconRotation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Show the edit toolbar
      setShowEditToolbar(true);
    } else {
      // Exiting edit mode: slide back down with delayed fade out
      // Start slide down immediately
      Animated.timing(editIconsTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
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
          useNativeDriver: true,
        }),
      ]).start();
      
      // Also animate the main edit mode icon
      Animated.timing(editModeIconRotation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
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
          soundEnabled: true
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

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('stackMapData');
      if (savedData) {
        const data = JSON.parse(savedData);
        
        // Migration: Convert old RN format to PWA format
        const migratedData = migrateDataStructure(data);
        
        setUsers(migratedData.users || {});
        
        // Handle theme color
        if (migratedData.globalSettings?.themeColor) {
          // Map old color codes to new theme names
          const colorMap = {
            '#667eea': 'plum',     // old purple -> plum
            '#3182ce': 'navy',     // old blue -> navy
            '#48bb78': 'forest',   // old green -> forest
            '#f56565': 'crimson',  // old red -> crimson
            '#ed8936': 'rust',     // old orange -> rust
            '#ed64a6': 'lavender'  // old pink -> lavender
          };
          // Also check if it's already a valid theme name
          const validTheme = Object.keys(THEMES).includes(migratedData.globalSettings.themeColor) 
            ? migratedData.globalSettings.themeColor 
            : colorMap[migratedData.globalSettings.themeColor];
          setCurrentTheme(validTheme || 'navy');
        }
        
        setBannerPosition(migratedData.globalSettings?.bannerPosition || 'top');
        // Restore PIN protection state from saved data
        if (migratedData.globalSettings?.pinEnabled !== undefined) {
          setHasPinProtection(migratedData.globalSettings.pinEnabled);
        }
        setCurrentDay(migratedData.currentDay || 'today');
        setTemplates(migratedData.templates || []);
        setActivityCategories(migratedData.activityCategories || null);
        
        // Set current user and load activities
        const userId = migratedData.currentUserId || Object.keys(migratedData.users || {})[0];
        if (userId && migratedData.users[userId]) {
          setCurrentUser(userId);
          setActivities(migratedData.users[userId]?.days?.[currentDay]?.activities || []);
        }
      } else {
        // First time - create default user
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
            soundEnabled: true
          },
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        setUsers({ [newUserId]: newUser });
        setCurrentUser(newUserId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      const data = {
        version: 3,
        currentUserId: currentUser,
        currentDay: currentDay,
        users: {
          ...users,
          [currentUser]: {
            ...users[currentUser],
            days: {
              ...users[currentUser]?.days,
              [currentDay]: { activities },
              // Preserve tomorrow's activities if we're on today view
              ...(currentDay === 'today' && users[currentUser]?.days?.tomorrow ? {
                tomorrow: users[currentUser].days.tomorrow
              } : {})
            },
            lastActive: new Date().toISOString()
          }
        },
        globalSettings: {
          themeColor: THEMES[currentTheme].primary,
          displayMode: 'numbers',
          enableDayManagement: true,
          // Save the current PIN protection state
          pinEnabled: hasPinProtection,
          bannerPosition: bannerPosition
        },
        templates: templates || [],
        activityCategories: activityCategories
      };
      await AsyncStorage.setItem('stackMapData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const theme = THEMES[currentTheme] || THEMES.purple;

  const toggleActivity = (id) => {
    const newActivities = activities.map(activity => 
      activity.id === id ? { ...activity, completed: !activity.completed } : activity
    );
    setActivities(newActivities);
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
      time: null,
      createdAt: new Date().toISOString()
    };
    
    if (editingActivity) {
      const newActivities = activities.map(a => 
        a.id === editingActivity.id 
          ? { ...a, text: activityTitle, description: activityDescription || '', emoji: activityEmoji } 
          : a
      );
      setActivities(newActivities);
    } else {
      setActivities([...activities, newActivity]);
    }
    
    resetActivityForm();
    setShowActivityModal(false);
  };

  const resetActivityForm = () => {
    setActivityTitle('');
    setActivityDescription('');
    setActivityEmoji('🎯');
    setEditingActivity(null);
  };

  const deleteActivity = (id) => {
    const deletedActivity = activities.find(a => a.id === id);
    const deletedIndex = activities.findIndex(a => a.id === id);
    
    // Remove the activity
    const updatedActivities = activities.filter(a => a.id !== id);
    setActivities(updatedActivities);
    
    // Show toast with undo
    showToast({
      message: 'Activity deleted',
      action: {
        label: 'Undo',
        onPress: () => {
          // Restore the activity at its original position
          setActivities(prevActivities => {
            const newActivities = [...prevActivities];
            newActivities.splice(deletedIndex, 0, deletedActivity);
            return newActivities;
          });
        }
      }
    });
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
  
  const addUser = () => {
    if (!newUserName.trim()) {
      Alert.alert('Error', 'Please enter a user name');
      return;
    }
    
    const userId = `user_${Date.now()}`;
    const newUser = {
      id: userId,
      name: newUserName.trim(),
      icon: newUserEmoji,
      days: {
        today: { activities: [] },
        tomorrow: { activities: [] }
      },
      settings: {
        taskCelebration: 'rainbow',
        routineCelebration: 'rainbow',
        soundEnabled: true
      },
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    
    setUsers(prevUsers => ({
      ...prevUsers,
      [userId]: newUser
    }));
    
    setCurrentUser(userId);
    setActivities([]);
    setNewUserName('');
    setNewUserEmoji('😀');
    setShowAddUserModal(false);
    showToast({ message: `Added user: ${newUser.name}` });
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
      const fileName = `stackmap-export-${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      // Write file to temporary location
      await RNFS.writeFile(filePath, jsonData, 'utf8');
      
      // Share the file
      await Share.open({
        url: `file://${filePath}`,
        type: 'application/json',
        title: 'Export StackMap Data',
        filename: fileName,
      });
      
      // Clean up temporary file
      await RNFS.unlink(filePath);
      
      showToast({ message: 'Data exported successfully' });
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Export error:', error);
        Alert.alert('Export Error', 'Failed to export data');
      }
    }
  };

  // Import data function
  const importData = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });
      
      if (!result[0]?.fileCopyUri) {
        Alert.alert('Error', 'Could not read the selected file');
        return;
      }
      
      // Read the file content
      const fileContent = await RNFS.readFile(result[0].fileCopyUri, 'utf8');
      
      // Clean up temporary file
      await RNFS.unlink(result[0].fileCopyUri);
      
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
      
      // Confirm import
      Alert.alert(
        'Import Data',
        'This will replace all your current data. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              // Update state with imported data
              setUsers(migratedData.users || {});
              setCurrentTheme(migratedData.globalSettings?.currentTheme || 'purple');
              setBannerPosition(migratedData.globalSettings?.bannerPosition || 'top');
              // PIN is now handled by secure storage, not imported
              setTemplates(migratedData.templates || []);
              setCurrentDay(migratedData.currentDay || 'today');
              
              // Set first user as current if available
              const userIds = Object.keys(migratedData.users || {});
              if (userIds.length > 0) {
                setCurrentUser(userIds[0]);
                setActivities(migratedData.users[userIds[0]].days?.[currentDay]?.activities || []);
              }
              
              // Save to storage
              await AsyncStorage.setItem('@stackmap_data', JSON.stringify(migratedData));
              
              showToast({ message: 'Data imported successfully' });
            }
          }
        ]
      );
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled the picker
      } else {
        console.error('Import error:', error);
        Alert.alert('Import Error', 'Failed to import data');
      }
    }
  };

  const renderActivity = ({ item, drag, isActive, customWidth }) => {
    const index = activities.findIndex(a => a.id === item.id);
    const CardContent = (
      <TouchableOpacity
        style={[
          styles.activityCard,
          customWidth && { width: customWidth },
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
        onLongPress={() => isEditMode && drag ? drag() : setIsEditMode(true)}
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

      {/* Number Badge */}
      <View style={[styles.numberBadge, { backgroundColor: theme.primary }]}>
        <Text style={styles.numberText}>{index + 1}</Text>
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
    
    // Only wrap with ScaleDecorator when drag functionality is available (single column)
    if (numColumns === 1 && drag) {
      return <ScaleDecorator>{CardContent}</ScaleDecorator>;
    }
    
    return CardContent;
  };

  const Header = () => {
    const handleSwipeGesture = ({ nativeEvent }) => {
      if (nativeEvent.state === State.END) {
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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Logo size={isTablet() ? 40 : 32} theme={theme} />
            <Text style={styles.headerTitle}>StackMap</Text>
          </View>
          <PanGestureHandler
            onHandlerStateChange={handleSwipeGesture}
            activeOffsetY={[-10, 10]} // Activate after 10 pixels of movement
          >
            <TouchableOpacity 
              style={styles.subtitlePill}
              onPress={() => setShowUserDayModal(true)}
            >
              <Text style={styles.subtitleEmoji}>
                {users[currentUser]?.icon || '😀'}
              </Text>
              <Text style={styles.subtitleDay}>
                {currentDay === 'today' ? 'Today' : 'Tomorrow'}
              </Text>
            </TouchableOpacity>
          </PanGestureHandler>
        </View>
      </View>
    );
  };


  // Calculate FAB position - they should always sit on the banner
  // For iPhone in bottom banner mode: center on header content area
  // The FABs need to be lower, centered on the banner content
  const fabBottom = bannerPosition === 'bottom' 
    ? isTablet() 
      ? insets.bottom + 15 // Tablets: move down to prevent overlap with banner content
      : insets.bottom + 20 // iPhone: much lower, just above home bar with minimal offset
    : null; // Will use top positioning for top banner
    
  const fabTop = bannerPosition === 'top'
    ? insets.top + (isTablet() ? 20 : 20) // Same positioning as bottom mode for iPhone
    : null;
    
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <>
      <StatusBar barStyle="light-content" backgroundColor={theme.dark} />
      <View style={[styles.container, { backgroundColor: theme.light }]}>
        {/* Status Bar Background when banner is at bottom */}
        {bannerPosition === 'bottom' && (
          <SafeAreaView style={{ backgroundColor: theme.primary }} />
        )}
        
        {/* Top Banner */}
        {bannerPosition === 'top' && (
          <SafeAreaView style={{ backgroundColor: theme.primary }}>
            <Header />
          </SafeAreaView>
        )}
        
        {/* Main Content Area */}
        <View style={styles.contentArea}>
          {numColumns > 1 ? (
            <ScrollView
              contentContainerStyle={[
                styles.listContent,
                isEditMode && bannerPosition === 'bottom' && { paddingTop: 70 }
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
                <View style={styles.gridContainer}>
                  {activities.map((item, index) => {
                    const isLastInRow = (index + 1) % numColumns === 0;
                    const isInLastRow = index >= Math.floor(activities.length / numColumns) * numColumns;
                    
                    return (
                      <View 
                        key={item.id} 
                        style={{ 
                          width: cardWidth,
                          marginHorizontal: CARD_LAYOUT.gap / 2,
                          marginBottom: SPACING.md,
                          // Add invisible placeholders to maintain grid structure
                          ...(isInLastRow && !isLastInRow && index === activities.length - 1 && {
                            marginRight: 'auto',
                            marginLeft: 'auto',
                          }),
                        }}
                      >
                        {renderActivity({ 
                          item, 
                          drag: () => {}, 
                          isActive: false,
                          customWidth: cardWidth
                        })}
                      </View>
                    );
                  })}
                  {/* Add invisible placeholders to fill the last row */}
                  {(() => {
                    const remainder = activities.length % numColumns;
                    if (remainder > 0) {
                      const placeholders = [];
                      for (let i = 0; i < (numColumns - remainder); i++) {
                        placeholders.push(
                          <View 
                            key={`placeholder-${i}`} 
                            style={{ 
                              width: cardWidth,
                              marginHorizontal: CARD_LAYOUT.gap / 2,
                              marginBottom: SPACING.md,
                            }} 
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
          ) : (
            <DraggableFlatList
              data={activities}
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
                isEditMode && bannerPosition === 'bottom' && { paddingTop: 70 }
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
          <SafeAreaView style={{ backgroundColor: theme.primary }}>
            <Header />
          </SafeAreaView>
        )}
        
        {/* Status Bar Background when banner is at top */}
        {bannerPosition === 'top' && (
          <SafeAreaView style={{ backgroundColor: theme.primary }} />
        )}
        
        {/* FABs - Positioned on the banner */}
        <FAB
          icon="palette"
          onPress={() => setShowUserModal(true)}
          onLongPress={() => setShowUserModal(true)}
          position={{ bottom: fabBottom, top: fabTop, left: 20 }}
          theme={theme}
        />

        <FAB
          icon={isEditMode ? "edit-off" : "edit"}
          onPress={() => {
            if (isEditMode) {
              setIsEditMode(false);
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
      <Modal
        visible={showActivityModal}
        animationType="slide"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={{ backgroundColor: theme.primary }}>
            <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
              <Text style={styles.modalTitle}>
                {editingActivity ? 'Edit Activity' : 'New Activity'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowActivityModal(false);
                resetActivityForm();
              }}>
                <Icon name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          
          <View style={{ flex: 1, backgroundColor: theme.light }}>
            <KeyboardAvoidingView 
              style={styles.modalContent}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <>
                  {/* Emoji Selector */}
                  <TouchableOpacity 
                    style={styles.emojiSelector}
                    onPress={() => setShowEmojiPicker(true)}
                  >
                    {activityEmoji && activityEmoji.startsWith('image:') ? (
                      <Image 
                        source={CUSTOM_IMAGE_SOURCES[activityEmoji.substring(6)]}
                        style={styles.selectedEmojiImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.selectedEmoji}>{activityEmoji}</Text>
                    )}
                    <Text style={styles.emojiSelectorLabel}>Tap to change</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={styles.input}
                    placeholder="Activity title"
                    value={activityTitle}
                    onChangeText={setActivityTitle}
                    autoFocus={!editingActivity}
                  />
                  
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description (optional)"
                    value={activityDescription}
                    onChangeText={setActivityDescription}
                    multiline
                    numberOfLines={3}
                  />
                  
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={addActivity}
                  >
                    <Text style={styles.buttonText}>
                      {editingActivity ? 'Save Changes' : 'Add Activity'}
                    </Text>
                  </TouchableOpacity>
                </>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
          <SafeAreaView style={{ backgroundColor: theme.light }} />
          
          {/* Emoji Picker Modal for Add Activity */}
          {showEmojiPicker && (
            <EmojiPicker 
              mode="modal"
              visible={true}
              onClose={() => setShowEmojiPicker(false)}
              onSelect={(emoji) => {
                setActivityEmoji(emoji);
                setShowEmojiPicker(false);
              }}
              theme={theme}
              selectedEmoji={activityEmoji}
              showCustomImages={true}
            />
          )}
        </View>
      </Modal>

      {/* User/Day Modal */}
      <Modal
        visible={showUserDayModal}
        animationType="slide"
        onRequestClose={() => setShowUserDayModal(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={{ backgroundColor: theme.primary }}>
            <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
              <Text style={styles.modalTitle}>Switch User/Day</Text>
              <TouchableOpacity onPress={() => setShowUserDayModal(false)}>
                <Icon name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          
          <View style={{ flex: 1, backgroundColor: theme.light }}>
            <ScrollView style={styles.modalContent}>
              {/* Users Section */}
              <Text style={styles.sectionTitle}>Users</Text>
              <View style={styles.usersList}>
                {Object.entries(users).map(([userId, user]) => (
                  <TouchableOpacity
                    key={userId}
                    style={[
                      styles.userItem,
                      currentUser === userId && styles.userItemActive
                    ]}
                    onPress={() => {
                      setCurrentUser(userId);
                      setActivities(user.days?.[currentDay]?.activities || []);
                      showToast({ message: `Switched to ${user.name}` });
                      setShowUserDayModal(false);
                    }}
                  >
                    <Text style={styles.userItemEmoji}>{user.icon}</Text>
                    <Text style={[
                      styles.userItemName,
                      currentUser === userId && styles.userItemNameActive
                    ]}>
                      {user.name}
                    </Text>
                    {currentUser === userId && (
                      <Icon name="check" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Day Selection */}
              <Text style={styles.sectionTitle}>Day</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggle, currentDay === 'today' && styles.toggleActive]}
                  onPress={() => setCurrentDay('today')}
                >
                  <Text style={[styles.toggleText, currentDay === 'today' && styles.toggleTextActive]}>
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggle, currentDay === 'tomorrow' && styles.toggleActive]}
                  onPress={() => setCurrentDay('tomorrow')}
                >
                  <Text style={[styles.toggleText, currentDay === 'tomorrow' && styles.toggleTextActive]}>
                    Tomorrow
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
          <SafeAreaView style={{ backgroundColor: theme.light }} />
        </View>
      </Modal>

      {/* Preferences Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={{ backgroundColor: theme.primary }}>
            <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
              <Text style={styles.modalTitle}>Preferences</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Icon name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          
          <View style={{ flex: 1, backgroundColor: theme.light }}>
            <ScrollView style={styles.modalContent}>
              {/* Theme Color Section */}
              <Text style={styles.sectionTitle}>Theme Color</Text>
              <View style={styles.colorGrid}>
                {Object.keys(THEMES).map((color, index) => {
                  // Force 5 colors per row
                  const isEndOfRow = (index + 1) % 5 === 0;
                  return (
                    <View key={color} style={{ width: '20%', padding: 7.5, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={[
                          styles.colorOption,
                          { backgroundColor: THEMES[color].primary },
                          currentTheme === color && styles.colorSelected
                        ]}
                        onPress={() => setCurrentTheme(color)}
                      >
                        {currentTheme === color && <Icon name="check" size={24} color="white" />}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Banner Position Section */}
              <Text style={styles.sectionTitle}>Banner Position</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggle, bannerPosition === 'top' && styles.toggleActive]}
                  onPress={() => setBannerPosition('top')}
                >
                  <Text style={[styles.toggleText, bannerPosition === 'top' && styles.toggleTextActive]}>
                    Top
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggle, bannerPosition === 'bottom' && styles.toggleActive]}
                  onPress={() => setBannerPosition('bottom')}
                >
                  <Text style={[styles.toggleText, bannerPosition === 'bottom' && styles.toggleTextActive]}>
                    Bottom
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
          <SafeAreaView style={{ backgroundColor: theme.light }} />
        </View>
      </Modal>
      
      {/* Settings Modal */}
      <Modal
        visible={showEditModeSettingsModal}
        animationType="slide"
        onRequestClose={() => setShowEditModeSettingsModal(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={{ backgroundColor: theme.primary }}>
            <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowEditModeSettingsModal(false)}>
                <Icon name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          
          <View style={{ flex: 1, backgroundColor: theme.light }}>
            <ScrollView style={styles.modalContent}>
              {/* User Management Section */}
            <Text style={styles.sectionTitle}>Users</Text>
            <View style={styles.usersList}>
              {Object.entries(users).map(([userId, user]) => (
                <TouchableOpacity
                  key={userId}
                  style={[
                    styles.userItem,
                    currentUser === userId && styles.userItemActive
                  ]}
                  onPress={() => {
                    setCurrentUser(userId);
                    setActivities(user.days?.[currentDay]?.activities || []);
                    showToast({ message: `Switched to ${user.name}` });
                  }}
                  onLongPress={() => {
                    Alert.alert(
                      'Delete User',
                      `Delete ${user.name}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            const updatedUsers = { ...users };
                            delete updatedUsers[userId];
                            setUsers(updatedUsers);
                            if (currentUser === userId) {
                              const newUserId = Object.keys(updatedUsers)[0];
                              setCurrentUser(newUserId);
                              setActivities(updatedUsers[newUserId].days?.[currentDay]?.activities || []);
                            }
                            showToast({ message: `Deleted ${user.name}` });
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.userItemEmoji}>{user.icon}</Text>
                  <Text style={[
                    styles.userItemName,
                    currentUser === userId && styles.userItemNameActive
                  ]}>
                    {user.name}
                  </Text>
                  {currentUser === userId && (
                    <Icon name="check" size={20} color={theme.primary} />
                  )}
                  <TouchableOpacity
                    style={styles.editUserButton}
                    onPress={() => {
                      setEditingUser(userId);
                      setNewUserName(user.name);
                      setNewUserEmoji(user.icon);
                      setShowEditModeSettingsModal(false);
                      setShowAddUserModal(true);
                    }}
                  >
                    <Icon name="edit" size={18} color="#666" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addUserButton}
                onPress={() => setShowAddUserModal(true)}
              >
                <Icon name="add" size={24} color={theme.primary} />
                <Text style={styles.addUserText}>Add User</Text>
              </TouchableOpacity>
            </View>
            
            {/* Day Mode Section */}
            <Text style={styles.sectionTitle}>Day Mode</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggle, dayMode === 'today' && styles.toggleActive]}
                onPress={() => setDayMode('today')}
              >
                <Text style={[styles.toggleText, dayMode === 'today' && styles.toggleTextActive]}>
                  Today Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggle, dayMode === 'both' && styles.toggleActive]}
                onPress={() => setDayMode('both')}
              >
                <Text style={[styles.toggleText, dayMode === 'both' && styles.toggleTextActive]}>
                  Today & Tomorrow
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Edit Mode PIN Section */}
            <Text style={styles.sectionTitle}>PIN Protection</Text>
            <View style={styles.pinSection}>
              {hasPinProtection ? (
                <>
                  <Text style={styles.pinStatus}>PIN protection is enabled</Text>
                  <View style={styles.pinButtons}>
                    <TouchableOpacity
                      style={[styles.pinButton, { backgroundColor: theme.primary }]}
                      onPress={() => {
                        setIsSettingPin(true);
                        setPinInput('');
                        setConfirmPin('');
                        setShowEditModeSettingsModal(false);
                        setShowPinModal(true);
                      }}
                    >
                      <Text style={styles.pinButtonText}>Change PIN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.pinButton, { backgroundColor: '#f56565' }]}
                      onPress={async () => {
                        Alert.alert(
                          'Remove PIN',
                          'Are you sure you want to remove PIN protection?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Remove',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await setSecurePin(null);
                                  setHasPinProtection(false);
                                  // Immediately save data to persist the PIN removal
                                  await saveData();
                                  showToast({ message: 'PIN removed' });
                                } catch (error) {
                                  console.error('Error removing PIN:', error);
                                  Alert.alert('Error', 'Failed to remove PIN. Please try again.');
                                }
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.pinButtonText}>Remove PIN</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.pinStatus}>No PIN set</Text>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary, marginTop: 10 }]}
                    onPress={() => {
                      setIsSettingPin(true);
                      setShowPinModal(true);
                      setShowEditModeSettingsModal(false);
                    }}
                  >
                    <Icon name="lock" size={20} color="white" />
                    <Text style={styles.buttonText}>Enable PIN</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            {/* Data Management Section */}
            <Text style={styles.sectionTitle}>Data Management</Text>
            <View style={styles.settingsSection}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary, marginBottom: 10 }]}
                onPress={exportData}
              >
                <Icon name="save-alt" size={20} color="white" />
                <Text style={styles.buttonText}>Export Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={importData}
              >
                <Icon name="folder-open" size={20} color="white" />
                <Text style={styles.buttonText}>Import Data</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          </View>
          <SafeAreaView style={{ backgroundColor: theme.light }} />
        </View>
      </Modal>
      
      {/* Add/Edit User Modal */}
      <Modal
        visible={showAddUserModal}
        animationType="slide"
        onRequestClose={() => setShowAddUserModal(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={{ backgroundColor: theme.primary }}>
            <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
              <Text style={styles.modalTitle}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAddUserModal(false);
                setNewUserName('');
                setNewUserEmoji('😀');
                setEditingUser(null);
              }}>
                <Icon name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          
          <View style={{ flex: 1, backgroundColor: theme.light }}>
            <KeyboardAvoidingView 
              style={styles.modalContent}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Emoji Selector */}
              <TouchableOpacity 
                style={styles.emojiSelector}
                onPress={() => setShowUserEmojiPicker(!showUserEmojiPicker)}
              >
                <Text style={styles.selectedEmoji}>{newUserEmoji}</Text>
                <Text style={styles.emojiSelectorLabel}>Tap to change</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="User name"
                value={newUserName}
                onChangeText={setNewUserName}
                autoFocus
              />
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={editingUser ? () => {
                  // Update existing user
                  if (!newUserName.trim()) {
                    Alert.alert('Error', 'Please enter a user name');
                    return;
                  }
                  
                  const updatedUsers = {
                    ...users,
                    [editingUser]: {
                      ...users[editingUser],
                      name: newUserName.trim(),
                      icon: newUserEmoji
                    }
                  };
                  
                  setUsers(updatedUsers);
                  setNewUserName('');
                  setNewUserEmoji('😀');
                  setEditingUser(null);
                  setShowAddUserModal(false);
                  showToast({ message: `Updated user: ${newUserName.trim()}` });
                } : addUser}
              >
                <Text style={styles.buttonText}>
                  {editingUser ? 'Save Changes' : 'Add User'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
          </View>
          <SafeAreaView style={{ backgroundColor: theme.light }} />
          
          {/* User Emoji Picker Modal */}
          {showUserEmojiPicker && (
            <EmojiPicker 
              mode="modal"
              visible={true}
              onClose={() => setShowUserEmojiPicker(false)}
              onSelect={(emoji) => {
                setNewUserEmoji(emoji);
                setShowUserEmojiPicker(false);
              }}
              theme={theme}
              selectedEmoji={newUserEmoji}
              showCustomImages={false}
            />
          )}
        </View>
      </Modal>
      
      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPinModal(false);
          setPinInput('');
          setConfirmPin('');
          setIsSettingPin(false);
        }}
      >
        <View style={styles.pinModalOverlay}>
          <View style={styles.pinModalContent}>
            <Text style={styles.pinModalTitle}>
              {isSettingPin ? 
                (confirmPin ? 'Confirm PIN' : 'Set New PIN') : 
                'Enter PIN'}
            </Text>
            
            <View style={styles.pinInputContainer}>
              {[0, 1, 2, 3].map(index => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    { borderColor: theme.primary },
                    pinInput.length > index && [
                      styles.pinDotFilled,
                      { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]
                  ]}
                />
              ))}
            </View>
            
            <View style={styles.pinKeypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
                <TouchableOpacity
                  key={num}
                  style={styles.pinKey}
                  onPress={() => {
                    if (isSettingPin && confirmPin) {
                      // During confirmation, we still use pinInput
                      if (pinInput.length < 4) {
                        setPinInput(pinInput + num);
                      }
                    } else {
                      // Initial PIN entry
                      if (pinInput.length < 4) {
                        setPinInput(pinInput + num);
                      }
                    }
                  }}
                >
                  <Text style={styles.pinKeyText}>{num}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.pinKey}
                onPress={() => {
                  setPinInput(pinInput.slice(0, -1));
                }}
              >
                <Icon name="backspace" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {isSettingPin && (
              <Text style={styles.pinHelperText}>
                {!confirmPin ? 
                  'Enter a 4-digit PIN' : 
                  (pinInput.length === 4 ? 
                    'PIN confirmed! Processing...' : 
                    `Re-enter PIN to confirm (${pinInput.length}/4)`)}
              </Text>
            )}
            
            <View style={styles.pinModalButtonContainer}>
              <TouchableOpacity
                style={styles.pinCancelButton}
                onPress={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setConfirmPin('');
                  setIsSettingPin(false);
                }}
              >
                <Text style={[styles.pinCancelText, { color: theme.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Mode Toolbar */}
      {showEditToolbar && (
        <EditModeToolbar
          visible={isEditMode}
          onExit={() => setIsEditMode(false)}
          onAdd={() => setShowActivityModal(true)}
          onLibrary={() => setShowActivityLibrary(true)}
          onSettings={() => setShowEditModeSettingsModal(true)}
          onCompleteDay={() => {
            const pinnedCount = activities.filter(a => a.pinned).length;
            const unpinnedCount = activities.filter(a => !a.pinned).length;
            
            const message = `Complete the day? This will:\n- Keep ${pinnedCount} pinned ${pinnedCount === 1 ? 'activity' : 'activities'}\n- Remove ${unpinnedCount} unpinned ${unpinnedCount === 1 ? 'activity' : 'activities'}`;
            
            Alert.alert(
              'Complete Day',
              message,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'OK', 
                  style: 'default',
                  onPress: () => {
                    // Get tomorrow's activities and move them to today
                    const tomorrowActivities = users[currentUser]?.days?.tomorrow?.activities || [];
                    
                    // Keep only pinned activities from today, reset their completed status
                    const keptActivities = activities
                      .filter(a => a.pinned)
                      .map(a => ({ ...a, completed: false }));
                    
                    // Combine kept activities with tomorrow's activities
                    const newTodayActivities = [...keptActivities, ...tomorrowActivities];
                    
                    // Update users data
                    const updatedUsers = {
                      ...users,
                      [currentUser]: {
                        ...users[currentUser],
                        days: {
                          ...users[currentUser].days,
                          today: { activities: newTodayActivities },
                          tomorrow: { 
                            activities: activities
                              .filter(a => a.pinned)
                              .map(a => ({ 
                                ...a, 
                                id: 'activity_' + Date.now() + '_' + Math.random(),
                                completed: false 
                              }))
                          }
                        }
                      }
                    };
                    
                    setUsers(updatedUsers);
                    setActivities(newTodayActivities);
                    
                    // Exit edit mode
                    setIsEditMode(false);
                    
                    // Show success message
                    showToast({ 
                      message: 'Day completed! Pinned activities kept for today.',
                      duration: 3000,
                    });
                  }
                },
              ]
            );
          }}
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
      <Modal
        visible={showActivityLibrary}
        animationType="slide"
        onRequestClose={() => setShowActivityLibrary(false)}
      >
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
      </Modal>
      
      {/* Toast Notification */}
      <Toast
        toast={toast}
        onDismiss={hideToast}
        theme={theme}
      />
      </>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontSize: isTablet() ? 36 : 28,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'ComicNeue-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  subtitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    marginTop: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.level2,
  },
  subtitleEmoji: {
    fontSize: isTablet() ? 24 : 20,
  },
  subtitleText: {
    fontSize: isTablet() ? 18 : 14,
    fontWeight: '500',
    color: '#333',
  },
  subtitleDay: {
    fontSize: isTablet() ? 18 : 14,
    color: '#333',
    fontWeight: '500',
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
    fontFamily: 'ComicNeue-Regular',
  },
  listContent: {
    padding: getContainerPadding(),
    paddingBottom: 100,
    paddingLeft: getContainerPadding() - (CARD_LAYOUT.gap / 2),
    paddingRight: getContainerPadding() - (CARD_LAYOUT.gap / 2),
  },
  columnWrapper: {
    gap: CARD_LAYOUT.gap,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  activityCard: {
    width: calculateCardWidth(),
    height: getCardHeight(),
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    padding: getCardPadding(),
    marginBottom: SPACING.md,
    marginHorizontal: 0, // Spacing handled by columnWrapper on tablets
    ...SHADOWS.level2,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignSelf: 'center',
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
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 23 * 1.2,  // Match PWA's line-height: 1.2
    marginBottom: 4,  // PWA's 0.25rem
    fontFamily: 'ComicNeue-Regular',
  },
  activityDescription: {
    fontSize: 17.3,  // Match PWA's 1.08rem = 17.28px
    color: '#666',
    textAlign: 'center',
    lineHeight: 17.3 * 1.3,  // Match PWA's line-height: 1.3
    fontFamily: 'ComicNeue-Regular',
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
    fontFamily: 'ComicNeue-Regular',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'ComicNeue-Regular',
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
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'ComicNeue-Bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  emojiSelector: {
    alignItems: 'center',
    marginBottom: 30,
  },
  selectedEmoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  selectedEmojiImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  emojiSelectorLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'ComicNeue-Regular',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontFamily: 'ComicNeue-Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    fontFamily: 'ComicNeue-Regular',
  },
  button: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: SPACING.sm,
    ...SHADOWS.level1,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'ComicNeue-Bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 20,
    fontFamily: 'ComicNeue-Bold',
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
    fontFamily: 'ComicNeue-Regular',
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
    fontFamily: 'ComicNeue-Bold',
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
    fontFamily: 'ComicNeue-Regular',
  },
  userItemNameActive: {
    fontWeight: 'bold',
  },
  editUserButton: {
    padding: 8,
    marginLeft: 8,
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
    fontFamily: 'ComicNeue-Regular',
  },
  // PIN styles
  pinSection: {
    marginBottom: 20,
  },
  pinStatus: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'ComicNeue-Regular',
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
    fontFamily: 'ComicNeue-Regular',
  },
  pinModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinModalContent: {
    backgroundColor: 'white',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    ...SHADOWS.level3,
  },
  pinModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    fontFamily: 'ComicNeue-Bold',
  },
  pinInputContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  pinDotFilled: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  pinKeypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    width: '100%',
    marginBottom: 20,
  },
  pinKey: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinKeyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'ComicNeue-Bold',
  },
  pinCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  pinCancelText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
    fontFamily: 'ComicNeue-Regular',
  },
  pinHelperText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'ComicNeue-Regular',
    textAlign: 'center',
    marginBottom: 10,
  },
  pinModalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
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
    fontFamily: 'ComicNeue-Regular',
  },
});

export default App;