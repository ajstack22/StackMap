import React, { useState, useRef } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
  DEFAULT_ACTIVITY_EMOJI,
} from '../../constants';

// Default activity categories with starter activities
const DEFAULT_CATEGORIES = [
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
    ],
  },
  {
    id: 'my-templates',
    name: 'My Templates',
    activities: [],
  },
];

const ActivityRow = ({ 
  activity, 
  onEdit, 
  onDelete, 
  onQuickAdd,
  theme,
  slideAnim,
}) => {
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
    <Animated.View style={[
      styles.activityRow,
      {
        transform: [{ translateX: slideAnim }],
        opacity: slideAnim.interpolate({
          inputRange: [-100, 0],
          outputRange: [0, 1],
        }),
      },
    ]}>
      <View style={styles.activityInfo}>
        <Text style={styles.activityEmoji}>{activity.emoji}</Text>
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
          onPress={() => onQuickAdd(activity)}
        >
          <Icon name="add" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
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
  theme,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const expandAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(1)).current;

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
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
    setIsExpanded(!isExpanded);
  };

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

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  // Create slide animations for each activity
  const slideAnims = useRef(
    category.activities.map(() => new Animated.Value(0))
  ).current;

  React.useEffect(() => {
    // Animate activities in sequence when expanded
    if (isExpanded) {
      const animations = slideAnims.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 200,
          delay: index * 50,
          useNativeDriver: true,
        })
      );
      Animated.stagger(50, animations).start();
    } else {
      // Reset animations when collapsed
      slideAnims.forEach(anim => anim.setValue(-100));
    }
  }, [isExpanded]);

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <TouchableOpacity
          style={styles.categoryTitleContainer}
          onPress={toggleExpand}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Icon name="chevron-right" size={24} color={theme.primary} />
          </Animated.View>
          <Text style={[styles.categoryTitle, { color: theme.primary }]}>
            {category.name}
          </Text>
          <Text style={styles.activityCount}>
            ({category.activities.length})
          </Text>
        </TouchableOpacity>
        
        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onEditCategory(category)}
          >
            <Icon name="edit" size={20} color={theme.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleDeleteCategory}
          >
            <Icon name="delete" size={20} color={COLORS.error} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onAddActivity(category)}
          >
            <Icon name="add" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Animated.View style={[
        styles.activitiesList,
        {
          maxHeight: expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1000],
          }),
          opacity: expandAnim,
        },
      ]}>
        {category.activities.map((activity, index) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            onEdit={onEditActivity}
            onDelete={(activity) => onDeleteActivity(category.id, activity)}
            onQuickAdd={onQuickAdd}
            theme={theme}
            slideAnim={slideAnims[index] || new Animated.Value(0)}
          />
        ))}
        {category.activities.length === 0 && (
          <Text style={styles.emptyMessage}>
            No activities yet. Tap + to add one.
          </Text>
        )}
      </Animated.View>
    </View>
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
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

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
              ? { ...act, name: editName, emoji: editEmoji || DEFAULT_ACTIVITY_EMOJI }
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
  };

  const handleQuickAdd = (activity) => {
    if (onSelectActivity) {
      onSelectActivity(activity);
      onClose();
    }
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
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {categories.map(category => (
          <CategorySection
            key={category.id}
            category={category}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onEditActivity={handleEditActivity}
            onDeleteActivity={handleDeleteActivity}
            onQuickAdd={handleQuickAdd}
            onAddActivity={handleAddActivity}
            theme={theme}
          />
        ))}
        
        <TouchableOpacity
          style={[styles.addCategoryButton, { borderColor: theme.primary }]}
          onPress={handleAddCategory}
        >
          <Icon name="add" size={20} color={theme.primary} />
          <Text style={[styles.addCategoryText, { color: theme.primary }]}>
            Add New Category
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
                <Text style={styles.emojiLabel}>Select Emoji:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.emojiPicker}
                >
                  {['🎯', '🌅', '🛏️', '🦷', '🚿', '👔', '🥞', '🥪', 
                    '🍽️', '🍿', '👨‍🍳', '🎮', '🏃', '📚', '📱', '📝', '🧹', '💪', 
                    '🎵', '🎨', '🚗', '🛒', '🏥', '💊', '🎉', '🎁', '⚽', '🏀', 
                    '🎾', '🏊', '🚴', '🧩', '🎲', '🎪', '🎭'].map((emoji, index) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiOption,
                        editEmoji === emoji && styles.selectedEmoji,
                      ]}
                      onPress={() => setEditEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editButton, styles.cancelButton]}
                onPress={() => setEditMode(null)}
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
    marginBottom: SPACING.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTitle: {
    fontSize: isTablet() ? 18 : 16,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  activityCount: {
    fontSize: isTablet() ? 14 : 12,
    color: COLORS.gray[500],
    marginLeft: SPACING.xs,
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
  emptyMessage: {
    textAlign: 'center',
    color: COLORS.gray[500],
    fontStyle: 'italic',
    padding: SPACING.lg,
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
  },
  editInput: {
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: isTablet() ? 16 : 14,
    marginBottom: SPACING.md,
  },
  emojiLabel: {
    fontSize: isTablet() ? 16 : 14,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  emojiPicker: {
    marginBottom: SPACING.md,
  },
  emojiOption: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    marginRight: SPACING.xs,
    backgroundColor: COLORS.gray[100],
  },
  selectedEmoji: {
    backgroundColor: COLORS.gray[300],
  },
  emojiText: {
    fontSize: 24,
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
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ActivityLibrary;