import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Animated,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
  DEFAULT_ACTIVITY_EMOJI,
  CUSTOM_IMAGE_SOURCES,
} from '../../constants';
import EmojiPicker from '../EmojiPicker';

// Default activity categories with starter activities
const DEFAULT_CATEGORIES = [
  {
    id: 'my-templates',
    name: 'My Templates',
    activities: [],
  },
  {
    id: 'daily-routines',
    name: 'Daily Routines',
    activities: [
      { id: 'morning-routine', name: 'Morning Routine', emoji: '🌅' },
      { id: 'bedtime', name: 'Bedtime', emoji: '🛏️' },
      { id: 'brush-teeth', name: 'Brush Teeth', emoji: '🦷' },
      { id: 'shower', name: 'Shower', emoji: '🚿' },
      { id: 'get-dressed', name: 'Get Dressed', emoji: '👔' },
    ],
  },
  {
    id: 'meals',
    name: 'Meals',
    activities: [
      { id: 'breakfast', name: 'Breakfast', emoji: '🥞' },
      { id: 'lunch', name: 'Lunch', emoji: '🥪' },
      { id: 'dinner', name: 'Dinner', emoji: '🍽️' },
      { id: 'snack', name: 'Snack', emoji: '🍿' },
      { id: 'cooking', name: 'Cooking', emoji: '👨‍🍳' },
    ],
  },
  {
    id: 'activities',
    name: 'Activities',
    activities: [
      { id: 'playtime', name: 'Playtime', emoji: '🎮' },
      { id: 'outside-play', name: 'Outside Play', emoji: '🏃' },
      { id: 'reading', name: 'Reading', emoji: '📚' },
      { id: 'screen-time', name: 'Screen Time', emoji: '📱' },
      { id: 'homework', name: 'Homework', emoji: '📝' },
      { id: 'chores', name: 'Chores', emoji: '🧹' },
      { id: 'exercise', name: 'Exercise', emoji: '💪' },
      { id: 'music', name: 'Music', emoji: '🎵' },
      { id: 'art', name: 'Art & Crafts', emoji: '🎨' },
      { id: 'occupational-therapy', name: 'Occupational Therapy', emoji: '🏥' },
      { id: 'speech-therapy', name: 'Speech Therapy', emoji: '💬' },
      { id: 'sensory-break', name: 'Sensory Break', emoji: '🌈' },
      { id: 'doctor-appointment', name: 'Doctor\'s Appointment', emoji: '👨‍⚕️' },
      { id: 'dentist-appointment', name: 'Dentist Appointment', emoji: '🦷' },
      { id: 'school', name: 'School', emoji: '🏫' },
      { id: 'work', name: 'Work', emoji: '💼' },
      { id: 'stim-time', name: 'Stim Time', emoji: '✨' },
    ],
  },
];

const ActivityRow = ({ 
  activity, 
  onEdit, 
  onDelete, 
  onQuickAdd,
  theme,
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const handleDelete = () => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(activity) },
      ]
    );
  };

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityInfo}>
        {activity.emoji && activity.emoji.startsWith('image:') ? (
          <Image 
            source={CUSTOM_IMAGE_SOURCES[activity.emoji.substring(6)]}
            style={styles.activityImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.activityEmoji}>{activity.emoji}</Text>
        )}
        <Text style={styles.activityName}>{activity.name}</Text>
      </View>
      
      <View style={styles.activityActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onEdit(activity)}
        >
          <Icon name="edit" size={20} color={theme.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleDelete}
        >
          <Icon name="delete" size={20} color={COLORS.error} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            onQuickAdd(activity);
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 1500);
          }}
          disabled={justAdded}
        >
          <Icon 
            name={justAdded ? "check" : "add"} 
            size={20} 
            color={justAdded ? '#4CAF50' : theme.primary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CategorySection = ({ 
  category, 
  onEditCategory,
  onDeleteCategory,
  onEditActivity,
  onDeleteActivity,
  onQuickAdd,
  onAddActivity,
  onUpdateCategory,
  theme,
  editingCategoryId,
  onStartEditCategory,
  onEndEditCategory,
  drag,
  isActive,
  isDraggingAnyCategory,
  expandedState,
  onExpandedChange,
  searchQuery,
  isSortMode,
}) => {
  const isEditingCategory = editingCategoryId === category.id;
  const [isExpanded, setIsExpanded] = useState(expandedState !== undefined ? expandedState : true);
  const [editingCategoryName, setEditingCategoryName] = useState(category.name);
  const [orderedActivities, setOrderedActivities] = useState(category.activities);
  // Use useRef for Animated values to avoid re-creation issues
  const expandAnim = useRef(new Animated.Value(expandedState !== undefined ? (expandedState ? 1 : 0) : 1)).current;
  const rotateAnim = useRef(new Animated.Value(expandedState !== undefined ? (expandedState ? 1 : 0) : 1)).current;
  const isDragStarting = useRef(false);
  const isMounted = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setOrderedActivities(category.activities);
  }, [category.activities]);

  // Update expanded state when it changes
  useEffect(() => {
    if (expandedState !== undefined) {
      setIsExpanded(expandedState);
      // Animate to the new state
      const toValue = expandedState ? 1 : 0;
      Animated.parallel([
        Animated.timing(expandAnim, {
          toValue,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(rotateAnim, {
          toValue,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [expandedState, isSortMode]);

  // Collapse when any category starts dragging
  useEffect(() => {
    if (isDraggingAnyCategory && isExpanded) {
      // Animate collapse smoothly
      Animated.parallel([
        Animated.timing(expandAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Only update state after animation completes if still mounted
        if (isMounted.current) {
          setIsExpanded(false);
        }
      });
    }
  }, [isDraggingAnyCategory]);

  const handleStartEditCategory = () => {
    onStartEditCategory(category.id);
    setEditingCategoryName(category.name);
  };

  const handleSaveCategory = () => {
    if (editingCategoryName.trim()) {
      onUpdateCategory(category.id, editingCategoryName.trim(), orderedActivities);
      onEndEditCategory();
    }
  };

  const handleCancelEdit = () => {
    setEditingCategoryName(category.name);
    setOrderedActivities(category.activities);
    onEndEditCategory();
  };

  const toggleExpand = () => {
    // Don't allow expand/collapse in sort mode
    if (isSortMode) return;
    
    const newExpanded = !isExpanded;
    const toValue = newExpanded ? 1 : 0;
    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    if (isMounted.current) {
      setIsExpanded(newExpanded);
      if (onExpandedChange) {
        onExpandedChange(category.id, newExpanded);
      }
    }
  };

  const handleDragStart = () => {
    // Just initiate the drag without collapsing yet
    drag();
  };
  
  // onDragStart is now handled at the parent level via onDragBegin

  const handleDeleteCategory = () => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}" and all its activities?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteCategory(category) },
      ]
    );
  };

  // Create stable interpolations using useRef to avoid re-creation
  const animatedStylesRef = useRef({
    rotation: rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '90deg'],
    }),
    maxHeight: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1500],
    }),
    opacity: expandAnim.interpolate({
      inputRange: [0, 0.8, 1],
      outputRange: [0, 1, 1],
    }),
  });
  const animatedStyles = animatedStylesRef.current;

  // Remove slide animations since we simplified ActivityRow


  return (
    <TouchableOpacity
      style={[styles.categorySection, isActive && styles.draggingCategory]}
      onLongPress={isSortMode ? handleDragStart : undefined}
      delayLongPress={isSortMode ? 150 : 250}
      activeOpacity={0.95}
      disabled={isActive || !isSortMode}
    >
      <View style={[styles.categoryHeader, { backgroundColor: theme.primary }]}>
        {isSortMode && (
          <View style={styles.categoryDragHandle}>
            <Icon name="drag-handle" size={24} color="rgba(255, 255, 255, 0.7)" />
          </View>
        )}
        {isEditingCategory ? (
          <>
            <View style={styles.categoryEditContainer}>
              <TextInput
                style={styles.categoryEditInput}
                value={editingCategoryName}
                onChangeText={setEditingCategoryName}
                autoFocus
                onSubmitEditing={handleSaveCategory}
              />
            </View>
            
            <View style={styles.categoryActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleSaveCategory}
              >
                <Icon name="check" size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleCancelEdit}
              >
                <Icon name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.categoryTitleContainer}
              onPress={toggleExpand}
            >
              <Animated.View style={{ transform: [{ rotate: animatedStyles.rotation }] }}>
                <Icon name="chevron-right" size={24} color="white" />
              </Animated.View>
              <Text style={styles.categoryTitle}>
                {category.name}
              </Text>
              <Text style={styles.activityCount}>
                ({category.activities.length})
              </Text>
            </TouchableOpacity>
            
            <View style={styles.categoryActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleStartEditCategory}
              >
                <Icon name="edit" size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleDeleteCategory}
              >
                <Icon name="delete" size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => onAddActivity(category)}
              >
                <Icon name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      
      <Animated.View style={[
        styles.activitiesList,
        {
          maxHeight: animatedStyles.maxHeight,
          opacity: animatedStyles.opacity,
        },
      ]}>
        {isEditingCategory ? (
          orderedActivities.length > 0 ? (
            <DraggableFlatList
              data={orderedActivities}
              onDragEnd={({ data }) => setOrderedActivities(data)}
              keyExtractor={(item) => item.id}
              renderItem={({ item, drag, isActive }) => (
                <ScaleDecorator>
                  <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    style={[
                      styles.activityRow,
                      isActive && styles.draggingRow,
                    ]}
                  >
                    <View style={styles.activityInfo}>
                      {item.emoji && item.emoji.startsWith('image:') ? (
                        <Image 
                          source={CUSTOM_IMAGE_SOURCES[item.emoji.substring(6)]}
                          style={styles.activityImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.activityEmoji}>{item.emoji}</Text>
                      )}
                      <Text style={styles.activityName}>{item.name}</Text>
                    </View>
                    <View style={styles.dragHandle}>
                      <Icon name="drag-handle" size={24} color={COLORS.gray[400]} />
                    </View>
                  </TouchableOpacity>
                </ScaleDecorator>
              )}
            />
          ) : (
            <Text style={styles.emptyMessage}>
              No activities yet. Tap + to add one.
            </Text>
          )
        ) : (
          <>
            {category.activities
              .map((activity, originalIndex) => {
                if (searchQuery) {
                  const query = searchQuery.toLowerCase();
                  const matches = activity.name.toLowerCase().includes(query) ||
                                activity.emoji.includes(searchQuery);
                  if (!matches) return null;
                }
                
                return (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    onEdit={onEditActivity}
                    onDelete={(activity) => onDeleteActivity(category.id, activity)}
                    onQuickAdd={onQuickAdd}
                    theme={theme}
                  />
                );
              })
              .filter(Boolean)}
            {category.activities.length === 0 && (
              <Text style={styles.emptyMessage}>
                No activities yet. Tap + to add one.
              </Text>
            )}
            {category.activities.length > 0 && 
             category.activities.filter(activity => {
               if (!searchQuery) return true;
               const query = searchQuery.toLowerCase();
               return activity.name.toLowerCase().includes(query) ||
                      activity.emoji.includes(searchQuery);
             }).length === 0 && (
              <Text style={styles.emptyMessage}>
                No activities match your search.
              </Text>
            )}
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const ActivityLibrary = ({ 
  visible, 
  onClose, 
  onSelectActivity,
  theme,
  categories: customCategories,
  onSaveCategories,
}) => {
  const [categories, setCategories] = useState(customCategories || DEFAULT_CATEGORIES);
  const [editingItem, setEditingItem] = useState(null);
  const [editMode, setEditMode] = useState(null); // 'category', 'activity', 'new-category', 'new-activity'
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDraggingAnyCategory, setIsDraggingAnyCategory] = useState(false);
  const [categoryExpandedStates, setCategoryExpandedStates] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortMode, setIsSortMode] = useState(false);
  const [savedExpandedStates, setSavedExpandedStates] = useState({});

  // Edit handlers
  const handleEditCategory = (category) => {
    setEditingItem(category);
    setEditMode('category');
    setEditName(category.name);
  };

  const handleEditActivity = (activity) => {
    setEditingItem(activity);
    setEditMode('activity');
    setEditName(activity.name);
    setEditEmoji(activity.emoji);
    setEditDescription(activity.description || '');
  };

  const handleDeleteCategory = (category) => {
    const newCategories = categories.filter(c => c.id !== category.id);
    setCategories(newCategories);
    if (onSaveCategories) onSaveCategories(newCategories);
  };

  const handleDeleteActivity = (categoryId, activity) => {
    const newCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          activities: cat.activities.filter(a => a.id !== activity.id),
        };
      }
      return cat;
    });
    setCategories(newCategories);
    if (onSaveCategories) onSaveCategories(newCategories);
  };

  const handleAddCategory = () => {
    setEditMode('new-category');
    setEditName('');
  };

  const handleAddActivity = (category) => {
    setSelectedCategoryId(category.id);
    setEditMode('new-activity');
    setEditName('');
    setEditEmoji(DEFAULT_ACTIVITY_EMOJI);
    setEditDescription('');
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    let newCategories = [...categories];

    switch (editMode) {
      case 'category':
        newCategories = categories.map(cat =>
          cat.id === editingItem.id ? { ...cat, name: editName } : cat
        );
        break;

      case 'activity':
        newCategories = categories.map(cat => ({
          ...cat,
          activities: cat.activities.map(act =>
            act.id === editingItem.id 
              ? { ...act, name: editName, emoji: editEmoji || DEFAULT_ACTIVITY_EMOJI, description: editDescription }
              : act
          ),
        }));
        break;

      case 'new-category':
        const newCategoryId = `category-${Date.now()}`;
        newCategories.push({
          id: newCategoryId,
          name: editName,
          activities: [],
        });
        break;

      case 'new-activity':
        if (!editEmoji) {
          Alert.alert('Error', 'Please select an emoji for the activity');
          return;
        }
        const newActivityId = `activity-${Date.now()}`;
        newCategories = categories.map(cat =>
          cat.id === selectedCategoryId
            ? {
                ...cat,
                activities: [...cat.activities, {
                  id: newActivityId,
                  name: editName,
                  emoji: editEmoji,
                  description: editDescription,
                }],
              }
            : cat
        );
        break;
    }

    setCategories(newCategories);
    if (onSaveCategories) onSaveCategories(newCategories);
    setEditMode(null);
    setEditingItem(null);
    setEditName('');
    setEditEmoji('');
    setEditDescription('');
    setShowEmojiPicker(false);
  };

  const handleQuickAdd = (activity) => {
    if (onSelectActivity) {
      // Transform library activity to match expected format
      onSelectActivity({
        emoji: activity.emoji,
        text: activity.name, // Map 'name' to 'text'
        title: activity.name, // Also include as 'title' for compatibility
        description: activity.description || '', // Include description if present
      });
      // Don't close the modal - user likely wants to add more activities
    }
  };

  const handleUpdateCategory = (categoryId, newName, newActivities) => {
    const newCategories = categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, name: newName, activities: newActivities }
        : cat
    );
    setCategories(newCategories);
    if (onSaveCategories) onSaveCategories(newCategories);
  };

  const handleStartEditCategory = (categoryId) => {
    setEditingCategoryId(categoryId);
  };

  const handleEndEditCategory = () => {
    setEditingCategoryId(null);
  };

  const [activeDragId, setActiveDragId] = useState(null);
  const [draggedData, setDraggedData] = useState(null);
  const hasActuallyDragged = useRef(false);
  
  const handleCategoryDragStart = (itemId) => {
    // Save the initial state when drag might begin
    if (activeDragId !== itemId) {
      setActiveDragId(itemId);
      hasActuallyDragged.current = false;
      setDraggedData([...categories]); // Save original order
      
      // Save current expanded states before any animations
      const states = {};
      categories.forEach(cat => {
        // Get actual expanded state from the component if available
        const currentExpanded = cat.id in categoryExpandedStates ? categoryExpandedStates[cat.id] : true;
        states[cat.id] = currentExpanded;
      });
      setCategoryExpandedStates(states);
      
      // Small delay to let state update propagate
      setTimeout(() => {
        setIsDraggingAnyCategory(true);
      }, 50);
    }
  };

  const handleCategoryDragEnd = ({ data }) => {
    // Only update if we actually dragged (data changed)
    const dataChanged = JSON.stringify(data) !== JSON.stringify(draggedData);
    
    if (dataChanged && hasActuallyDragged.current) {
      // Real drag occurred with reordering
      setCategories(data);
      if (onSaveCategories) onSaveCategories(data);
    } else {
      // No real drag, restore original order
      if (draggedData) {
        setCategories(draggedData);
      }
    }
    
    // Reset drag states
    setActiveDragId(null);
    setDraggedData(null);
    hasActuallyDragged.current = false;
    
    // Restore expanded states after a delay
    setTimeout(() => {
      setIsDraggingAnyCategory(false);
    }, 300);
  };

  const handleExpandedChange = (categoryId, isExpanded) => {
    setCategoryExpandedStates(prev => ({
      ...prev,
      [categoryId]: isExpanded
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.light }]}>
      <SafeAreaView style={{ backgroundColor: theme.primary }}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <Text style={styles.headerTitle}>Activity Library</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={[styles.contentWrapper, { backgroundColor: theme.light }]}>
        {/* Search and Sort Bar */}
        <View style={styles.controlsBar}>
          <View style={[styles.searchContainer, { backgroundColor: 'white' }]}>
            <Icon name="search" size={20} color={COLORS.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search activities..."
              placeholderTextColor={COLORS.gray[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.sortButton,
              { backgroundColor: isSortMode ? theme.primary : 'white' }
            ]}
            onPress={() => {
              if (!isSortMode) {
                // Entering sort mode - save current states and collapse all
                const currentStates = {};
                categories.forEach(cat => {
                  currentStates[cat.id] = categoryExpandedStates[cat.id] !== undefined 
                    ? categoryExpandedStates[cat.id] 
                    : true;
                });
                setSavedExpandedStates(currentStates);
                
                // Collapse all categories
                const collapsedStates = {};
                categories.forEach(cat => {
                  collapsedStates[cat.id] = false;
                });
                setCategoryExpandedStates(collapsedStates);
              } else {
                // Exiting sort mode - restore saved states
                setCategoryExpandedStates(savedExpandedStates);
              }
              setIsSortMode(!isSortMode);
            }}
          >
            <Icon 
              name="swap-vert" 
              size={24} 
              color={isSortMode ? 'white' : theme.primary} 
            />
          </TouchableOpacity>
        </View>
        <DraggableFlatList
          data={categories.filter(category => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            // Check category name
            if (category.name.toLowerCase().includes(query)) return true;
            // Check activities within category
            return category.activities.some(activity => 
              activity.name.toLowerCase().includes(query) ||
              activity.emoji.includes(searchQuery)
            );
          })}
          onDragBegin={(index) => {
            const draggedItem = categories[index];
            if (draggedItem) {
              handleCategoryDragStart(draggedItem.id);
            }
          }}
          onPlaceholderIndexChange={() => {
            // This fires when items actually move positions
            hasActuallyDragged.current = true;
          }}
          onDragEnd={handleCategoryDragEnd}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING.lg }}
          scrollEnabled={!isDraggingAnyCategory && !isSortMode}
          activationDistance={isSortMode ? 0 : 20}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator activeScale={0.98}>
              <CategorySection
                category={item}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onEditActivity={handleEditActivity}
                onDeleteActivity={handleDeleteActivity}
                onQuickAdd={handleQuickAdd}
                onAddActivity={handleAddActivity}
                onUpdateCategory={handleUpdateCategory}
                theme={theme}
                editingCategoryId={editingCategoryId}
                onStartEditCategory={handleStartEditCategory}
                onEndEditCategory={handleEndEditCategory}
                drag={drag}
                isActive={isActive}
                isDraggingAnyCategory={isDraggingAnyCategory}
                expandedState={isDraggingAnyCategory || isSortMode ? false : categoryExpandedStates[item.id]}
                onExpandedChange={handleExpandedChange}
                searchQuery={searchQuery}
                isSortMode={isSortMode}
              />
            </ScaleDecorator>
          )}
          ListFooterComponent={() => (
            <TouchableOpacity
              style={[styles.addCategoryButton, { borderColor: theme.primary }]}
              onPress={handleAddCategory}
            >
              <Icon name="add" size={20} color={theme.primary} />
              <Text style={[styles.addCategoryText, { color: theme.primary }]}>
                Add New Category
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Edit Modal */}
      {editMode && (
        <View style={styles.editModal}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>
              {editMode === 'new-category' ? 'New Category' :
               editMode === 'new-activity' ? 'New Activity' :
               editMode === 'category' ? 'Edit Category' : 'Edit Activity'}
            </Text>
            
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Name"
              autoFocus
            />
            
            {(editMode === 'activity' || editMode === 'new-activity') && (
              <View>
                <TextInput
                  style={[styles.editInput, styles.descriptionInput]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Description (optional)"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                
                <Text style={styles.emojiLabel}>Select Emoji:</Text>
                <TouchableOpacity
                  style={styles.emojiSelector}
                  onPress={() => setShowEmojiPicker(true)}
                >
                  {editEmoji && editEmoji.startsWith('image:') ? (
                    <Image 
                      source={CUSTOM_IMAGE_SOURCES[editEmoji.substring(6)]}
                      style={styles.selectedEmojiImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.selectedEmoji}>{editEmoji || '🎯'}</Text>
                  )}
                  <Text style={styles.emojiSelectorLabel}>Tap to change</Text>
                </TouchableOpacity>
                
              </View>
            )}
            
            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editButton, styles.cancelButton]}
                onPress={() => {
                  setEditMode(null);
                  setShowEmojiPicker(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {/* Emoji Picker Modal */}
      <EmojiPicker 
        mode="modal"
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={(emoji) => {
          setEditEmoji(emoji);
          setShowEmojiPicker(false);
        }}
        theme={theme}
        selectedEmoji={editEmoji}
        showCustomImages={true}
      />
      
      <SafeAreaView style={{ backgroundColor: theme.light }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    padding: SPACING.md,
  },
  controlsBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: 44,
    borderRadius: RADIUS.lg,
    ...SHADOWS.level1,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet() ? 16 : 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[900],
  },
  sortButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    ...SHADOWS.level1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: isTablet() ? 22 : 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  categorySection: {
    marginBottom: SPACING.md,
    backgroundColor: 'transparent',
    minHeight: 60,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.level1,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTitle: {
    fontSize: isTablet() ? 20 : 18,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
  },
  activityCount: {
    fontSize: isTablet() ? 14 : 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  activitiesList: {
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.lg,
    ...SHADOWS.level1,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityEmoji: {
    fontSize: isTablet() ? 28 : 24,
    marginRight: SPACING.sm,
  },
  activityImage: {
    width: isTablet() ? 28 : 24,
    height: isTablet() ? 28 : 24,
    marginRight: SPACING.sm,
  },
  activityName: {
    fontSize: isTablet() ? 16 : 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  activityActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  categoryEditContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  categoryEditInput: {
    fontSize: isTablet() ? 20 : 18,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: SPACING.xs,
  },
  dragHandle: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
    justifyContent: 'center',
  },
  draggingRow: {
    backgroundColor: COLORS.gray[100],
    opacity: 0.9,
  },
  categoryDragHandle: {
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.md,
    justifyContent: 'center',
  },
  draggingCategory: {
    opacity: 0.9,
    elevation: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  emptyMessage: {
    textAlign: 'center',
    color: 'white',
    fontStyle: 'italic',
    padding: SPACING.lg,
    opacity: 0.8,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
  },
  addCategoryText: {
    marginLeft: SPACING.sm,
    fontSize: isTablet() ? 16 : 14,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  editModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContent: {
    backgroundColor: 'white',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.level3,
  },
  editModalTitle: {
    fontSize: isTablet() ? 20 : 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  editInput: {
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: isTablet() ? 16 : 14,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emojiLabel: {
    fontSize: isTablet() ? 16 : 14,
    marginBottom: SPACING.sm,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  emojiSelector: {
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  selectedEmoji: {
    fontSize: 48,
    marginBottom: SPACING.xs,
  },
  selectedEmojiImage: {
    width: 48,
    height: 48,
    marginBottom: SPACING.xs,
  },
  emojiSelectorLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  editButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray[200],
  },
  cancelButtonText: {
    color: COLORS.gray[700],
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});

export default ActivityLibrary;
export { DEFAULT_CATEGORIES };