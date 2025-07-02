import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
} from './src/constants';

// Import components
import { Toast, FAB } from './src/components';

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

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate layout values using our utilities
const numColumns = calculateColumns(screenWidth);
const cardWidth = calculateCardWidth(screenWidth);
const cardHeight = getCardHeight();
const baseFontSize = isTablet() ? FONT_SCALE.tablet : FONT_SCALE.mobile;

// Common emojis for picker
const commonEmojis = COMMON_EMOJIS;

const App = () => {
  const insets = useSafeAreaInsets();
  
  // Use our custom hooks
  const { toast, showToast, hideToast } = useToast();
  
  // State
  const [currentTheme, setCurrentTheme] = useState('purple');
  const [bannerPosition, setBannerPosition] = useState('top');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState({});
  const [activities, setActivities] = useState([]);
  const [currentDay, setCurrentDay] = useState('today');
  const [templates, setTemplates] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModeSettingsModal, setShowEditModeSettingsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityEmoji, setActivityEmoji] = useState(DEFAULT_ACTIVITY_EMOJI);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // User management state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmoji, setNewUserEmoji] = useState(DEFAULT_USER_ICON);
  const [showUserEmojiPicker, setShowUserEmojiPicker] = useState(false);
  
  // PIN protection state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [hasPinProtection, setHasPinProtection] = useState(false);


  // Load data on mount and migrate PIN if needed
  useEffect(() => {
    loadData();
    migratePinToSecureStorage();
    // Check if PIN protection is enabled
    hasSecurePin().then(setHasPinProtection);
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (currentUser) {
      saveData();
    }
  }, [activities, currentTheme, bannerPosition, currentDay]);

  // Load activities when day changes
  useEffect(() => {
    if (currentUser && users[currentUser]) {
      setActivities(users[currentUser]?.days?.[currentDay]?.activities || []);
    }
  }, [currentDay, currentUser]);
  
  // Handle PIN input
  useEffect(() => {
    if (pinInput.length === PIN_LENGTH && !isSettingPin) {
      // Verify PIN
      verifyPin(pinInput).then(isValid => {
        if (isValid) {
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
          const colorMap = {
            '#667eea': 'purple',
            '#3182ce': 'blue',
            '#48bb78': 'green',
            '#f56565': 'red',
            '#ed8936': 'orange',
            '#ed64a6': 'pink'
          };
          setCurrentTheme(colorMap[migratedData.globalSettings.themeColor] || 'purple');
        }
        
        setBannerPosition(migratedData.globalSettings?.bannerPosition || 'top');
        // PIN is now handled by secure storage
        setCurrentDay(migratedData.currentDay || 'today');
        setTemplates(migratedData.templates || []);
        
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
              [currentDay]: { activities }
            },
            lastActive: new Date().toISOString()
          }
        },
        globalSettings: {
          themeColor: THEMES[currentTheme].primary,
          displayMode: 'numbers',
          enableDayManagement: true,
          // PIN is now stored securely, not in AsyncStorage
          pinEnabled: await hasSecurePin(),
          bannerPosition: bannerPosition
        },
        templates: templates || []
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
          editModePin,
          pinEnabled: editModePin !== null
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
              setEditModePin(migratedData.globalSettings?.editModePin || null);
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

  const renderActivity = ({ item, drag, isActive }) => {
    const index = activities.findIndex(a => a.id === item.id);
    const CardContent = (
      <TouchableOpacity
        style={[
          styles.activityCard,
          item.completed && [
            styles.completedCard,
            {
              backgroundColor: `${theme.primary}15`, // 15 is hex for ~8% opacity
              borderColor: theme.primary,
              shadowColor: theme.primary,
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
        {/* Emoji */}
        <Text style={styles.activityEmoji}>{item.emoji || '🎯'}</Text>
        
        {/* Title */}
        <Text style={[
          styles.activityTitle,
          item.completed && [styles.completedText, { color: theme.dark }]
        ]}>
          {item.text || item.title || ''}
        </Text>
        
        {/* Description */}
        {item.description ? (
          <Text style={[
            styles.activityDescription,
            item.completed && [styles.completedText, { color: theme.dark, opacity: 0.8 }]
          ]}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Edit Mode Actions */}
      {isEditMode && (
        <View style={styles.editActions}>
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
          <TouchableOpacity
            onPress={() => deleteActivity(item.id)}
            style={styles.editButton}
          >
            <Icon name="delete" size={20} color="#f56565" />
          </TouchableOpacity>
        </View>
      )}
      </TouchableOpacity>
    );
    
    // Only wrap with ScaleDecorator when drag functionality is available (single column)
    if (numColumns === 1 && drag) {
      return <ScaleDecorator>{CardContent}</ScaleDecorator>;
    }
    
    return CardContent;
  };

  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={[styles.logoBar, styles.logoBar1]} />
            <View style={[styles.logoBar, styles.logoBar2]} />
            <View style={[styles.logoBar, styles.logoBar3]} />
          </View>
          <Text style={styles.headerTitle}>StackMap</Text>
        </View>
        <TouchableOpacity 
          style={styles.subtitlePill}
          onPress={() => setShowUserModal(true)}
        >
          <Text style={styles.subtitleEmoji}>
            {users[currentUser]?.icon || '😀'}
          </Text>
          <Text style={styles.subtitleDay}>
            {currentDay === 'today' ? 'Today' : 'Tomorrow'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render emoji picker inline instead of as a modal
  const EmojiPicker = () => (
    <View style={styles.emojiPickerInline}>
      <View style={styles.emojiPickerHeader}>
        <Text style={styles.emojiPickerTitle}>Choose an emoji</Text>
        <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      <View style={styles.emojiGrid}>
        {commonEmojis.map(emoji => (
          <TouchableOpacity
            key={emoji}
            style={styles.emojiOption}
            onPress={() => {
              setActivityEmoji(emoji);
              setShowEmojiPicker(false);
            }}
          >
            <Text style={styles.emojiOptionText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Calculate FAB position - they should always sit on the banner
  // For iPhone in bottom banner mode: center on header content area
  // The FABs need to be lower, centered on the banner content
  const fabBottom = bannerPosition === 'bottom' 
    ? isTablet 
      ? insets.bottom + 15 // Tablets: move down to prevent overlap with banner content
      : insets.bottom + 20 // iPhone: much lower, just above home bar with minimal offset
    : null; // Will use top positioning for top banner
    
  const fabTop = bannerPosition === 'top'
    ? insets.top + (isTablet ? 20 : 20) // Same positioning as bottom mode for iPhone
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
          {/* Exit Edit Mode Button */}
          {isEditMode && (
            <TouchableOpacity 
              style={[styles.exitEditButton, { backgroundColor: 'rgba(255, 82, 82, 0.9)' }]}
              onPress={() => setIsEditMode(false)}
            >
              <Icon name="close" size={18} color="white" />
              <Text style={styles.exitEditText}>Exit Edit Mode</Text>
            </TouchableOpacity>
          )}
          
          {numColumns > 1 ? (
            <FlatList
              data={activities}
              renderItem={({ item, index }) => renderActivity({ item, drag: () => {}, isActive: false })}
              keyExtractor={item => item.id}
              numColumns={numColumns}
              columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>No activities yet</Text>
                  <Text style={styles.emptySubtext}>
                    {isEditMode ? 'Tap + to add an activity' : 'Use the edit button to add your first activity'}
                  </Text>
                </View>
              }
            />
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
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>No activities yet</Text>
                  <Text style={styles.emptySubtext}>
                    {isEditMode ? 'Tap + to add an activity' : 'Use the edit button to add your first activity'}
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
          position={{ bottom: fabBottom, top: fabTop, left: 20 }}
          theme={theme}
        />

        <FAB
          icon={isEditMode ? "add" : "edit"}
          onPress={() => {
            if (isEditMode) {
              setShowActivityModal(true);
            } else {
              setShowEditModeSettingsModal(true);
            }
          }}
          position={{ bottom: fabBottom, top: fabTop, right: 20 }}
          theme={theme}
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
                {showEmojiPicker ? (
                <EmojiPicker />
              ) : (
                <>
                  {/* Emoji Selector */}
                  <TouchableOpacity 
                    style={styles.emojiSelector}
                    onPress={() => setShowEmojiPicker(true)}
                  >
                    <Text style={styles.selectedEmoji}>{activityEmoji}</Text>
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
              )}
              </ScrollView>
            </KeyboardAvoidingView>
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
              {Object.keys(THEMES).map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: THEMES[color].primary },
                    currentTheme === color && styles.colorSelected
                  ]}
                  onPress={() => setCurrentTheme(color)}
                >
                  {currentTheme === color && <Icon name="check" size={24} color="white" />}
                </TouchableOpacity>
              ))}
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

            {/* Day Selection Section */}
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

            {/* Import/Export Section */}
            <Text style={styles.sectionTitle}>Data Management</Text>
            <View style={styles.dataManagementSection}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary, marginBottom: 10 }]}
                onPress={exportData}
              >
                <Icon name="file-download" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Export Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={importData}
              >
                <Icon name="file-upload" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Import Data</Text>
              </TouchableOpacity>
              
              <Text style={styles.dataManagementHint}>
                Export your data to share with the web app or import data from a previous export
              </Text>
            </View>
          </ScrollView>
          </View>
          <SafeAreaView style={{ backgroundColor: theme.light }} />
        </View>
      </Modal>
      
      {/* Edit Mode Settings Modal */}
      <Modal
        visible={showEditModeSettingsModal}
        animationType="slide"
        onRequestClose={() => setShowEditModeSettingsModal(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={{ backgroundColor: theme.primary }}>
            <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
              <Text style={styles.modalTitle}>Edit Mode</Text>
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
              <TouchableOpacity
                style={styles.addUserButton}
                onPress={() => setShowAddUserModal(true)}
              >
                <Icon name="add" size={24} color={theme.primary} />
                <Text style={styles.addUserText}>Add User</Text>
              </TouchableOpacity>
            </View>
            
            {/* Edit Mode PIN Section */}
            <Text style={styles.sectionTitle}>Edit Mode PIN</Text>
            <View style={styles.pinSection}>
              {hasPinProtection ? (
                <>
                  <Text style={styles.pinStatus}>PIN protection is enabled</Text>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#f56565', marginTop: 10 }]}
                    onPress={async () => {
                      await setSecurePin(null);
                      setHasPinProtection(false);
                      showToast({ message: 'PIN protection removed' });
                    }}
                  >
                    <Text style={styles.buttonText}>Remove PIN</Text>
                  </TouchableOpacity>
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
                    <Text style={styles.buttonText}>Set PIN</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            {/* Enter Edit Mode Button */}
            <View style={styles.enterEditModeSection}>
              <TouchableOpacity
                style={[styles.button, styles.enterEditModeButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  if (hasPinProtection) {
                    setShowPinModal(true);
                    setShowEditModeSettingsModal(false);
                  } else {
                    setIsEditMode(true);
                    setShowEditModeSettingsModal(false);
                  }
                }}
              >
                <Icon name="edit" size={20} color="white" />
                <Text style={styles.buttonText}>Enter Edit Mode</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          </View>
          <SafeAreaView style={{ backgroundColor: theme.light }} />
        </View>
      </Modal>
      
      {/* Add User Modal */}
      <Modal
        visible={showAddUserModal}
        animationType="slide"
        onRequestClose={() => setShowAddUserModal(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={{ backgroundColor: theme.primary }}>
            <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
              <Text style={styles.modalTitle}>Add New User</Text>
              <TouchableOpacity onPress={() => {
                setShowAddUserModal(false);
                setNewUserName('');
                setNewUserEmoji('😀');
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
              
              {showUserEmojiPicker && (
                <View style={styles.emojiPickerInline}>
                  <View style={styles.emojiGrid}>
                    {commonEmojis.map(emoji => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.emojiOption}
                        onPress={() => {
                          setNewUserEmoji(emoji);
                          setShowUserEmojiPicker(false);
                        }}
                      >
                        <Text style={styles.emojiOptionText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="User name"
                value={newUserName}
                onChangeText={setNewUserName}
                autoFocus
              />
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={addUser}
              >
                <Text style={styles.buttonText}>Add User</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
          </View>
          <SafeAreaView style={{ backgroundColor: theme.light }} />
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
            
            <View style={styles.pinButtonContainer}>
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
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
  },
  columnWrapper: {
    gap: CARD_LAYOUT.gap,
  },
  activityCard: {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    padding: getCardPadding(),
    marginBottom: SPACING.md,
    marginHorizontal: 0, // Spacing handled by columnWrapper on tablets
    ...SHADOWS.level2,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignSelf: 'center',
  },
  completedCard: {
    transform: [{ scale: 1.01 }],
    backgroundColor: 'rgba(102, 126, 234, 0.12)', // Semi-transparent primary
    borderColor: THEMES.purple.primary,
    borderWidth: 2,
    ...SHADOWS.level2,
    shadowColor: THEMES.purple.primary,
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
  },
  activityEmoji: {
    fontSize: 65 * baseFontSize,
    marginBottom: 15 * baseFontSize,
  },
  activityTitle: {
    fontSize: 23 * baseFontSize,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8 * baseFontSize,
    fontFamily: 'ComicNeue-Regular',
  },
  activityDescription: {
    fontSize: 17 * baseFontSize,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22 * baseFontSize,
    fontFamily: 'ComicNeue-Regular',
  },
  completedText: {
    color: '#4a5bc7', // Darker theme color for better contrast
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
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
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
    gap: 15,
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
  pinButtonContainer: {
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
  // Data management styles
  dataManagementSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dataManagementHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'ComicNeue-Regular',
    lineHeight: 20,
  },
});

export default App;