import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfirmModal from '../../Modals/ConfirmModal';
import { ModalFooter, FormInput } from '../../ModalUtilities';
import { styles } from './styles';
import { DEFAULT_ACTIVITY_EMOJI } from '../../../constants';

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
    ],
  },
];

const LibraryTabContent = ({
  theme,
  categories = DEFAULT_CATEGORIES,
  onSaveCategories,
  onSelectActivity,
  onSelectMultipleActivities,
  showToast,
  loading,
}) => {
  const [localCategories, setLocalCategories] = useState(categories || DEFAULT_CATEGORIES);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityEmoji, setNewActivityEmoji] = useState(DEFAULT_ACTIVITY_EMOJI);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [notification, setNotification] = useState(null);
  const notificationOpacity = useRef(new Animated.Value(0)).current;
  const notificationTimer = useRef(null);

  useEffect(() => {
    setLocalCategories(categories || DEFAULT_CATEGORIES);
  }, [categories]);

  const showNotification = (message) => {
    setNotification(message);
    Animated.timing(notificationOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    if (notificationTimer.current) {
      clearTimeout(notificationTimer.current);
    }
    
    notificationTimer.current = setTimeout(() => {
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setNotification(null);
      });
    }, 2000);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      showToast({ message: 'Please enter a category name', type: 'error' });
      return;
    }

    const newCategory = {
      id: `custom-${Date.now()}`,
      name: newCategoryName.trim(),
      activities: []
    };

    const updatedCategories = [...localCategories, newCategory];
    setLocalCategories(updatedCategories);
    onSaveCategories(updatedCategories);
    setNewCategoryName('');
    setShowAddCategory(false);
    showToast({ message: 'Category added!' });
  };

  const handleEditCategory = (categoryId, newName) => {
    const updatedCategories = localCategories.map(cat =>
      cat.id === categoryId ? { ...cat, name: newName } : cat
    );
    setLocalCategories(updatedCategories);
    onSaveCategories(updatedCategories);
    setEditingCategory(null);
    showToast({ message: 'Category updated!' });
  };

  const handleDeleteCategory = (categoryId) => {
    const updatedCategories = localCategories.filter(cat => cat.id !== categoryId);
    setLocalCategories(updatedCategories);
    onSaveCategories(updatedCategories);
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    showToast({ message: 'Category deleted!' });
  };

  const handleAddActivity = (categoryId) => {
    if (!newActivityName.trim()) {
      showToast({ message: 'Please enter an activity name', type: 'error' });
      return;
    }

    const newActivity = {
      id: `activity-${Date.now()}`,
      name: newActivityName.trim(),
      emoji: newActivityEmoji
    };

    const updatedCategories = localCategories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          activities: [...(cat.activities || []), newActivity]
        };
      }
      return cat;
    });

    setLocalCategories(updatedCategories);
    onSaveCategories(updatedCategories);
    setEditingActivity(null);
    setNewActivityName('');
    setNewActivityEmoji(DEFAULT_ACTIVITY_EMOJI);
    showToast({ message: 'Activity added!' });
  };

  const handleEditActivity = (categoryId, activityId, updates) => {
    const updatedCategories = localCategories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          activities: cat.activities.map(act =>
            act.id === activityId ? { ...act, ...updates } : act
          )
        };
      }
      return cat;
    });

    setLocalCategories(updatedCategories);
    onSaveCategories(updatedCategories);
    setEditingActivity(null);
    showToast({ message: 'Activity updated!' });
  };

  const handleDeleteActivity = (categoryId, activityId) => {
    const updatedCategories = localCategories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          activities: cat.activities.filter(act => act.id !== activityId)
        };
      }
      return cat;
    });

    setLocalCategories(updatedCategories);
    onSaveCategories(updatedCategories);
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    showToast({ message: 'Activity deleted!' });
  };

  const getFilteredCategories = () => {
    if (!searchQuery) return localCategories;

    return localCategories.map(category => {
      const matchingActivities = category.activities?.filter(activity =>
        activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.emoji.includes(searchQuery)
      ) || [];

      const categoryMatches = category.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (categoryMatches || matchingActivities.length > 0) {
        return {
          ...category,
          activities: matchingActivities,
          expanded: true // Auto-expand matching categories
        };
      }
      return null;
    }).filter(Boolean);
  };

  const renderActivity = (activity, categoryId) => {
    const isEditing = editingActivity === `${categoryId}-${activity.id}`;

    if (isEditing) {
      return (
        <View style={styles.editingActivity}>
          <TextInput
            style={styles.emojiInput}
            value={activity.emoji}
            onChangeText={(text) => {
              const updatedCategories = localCategories.map(cat => {
                if (cat.id === categoryId) {
                  return {
                    ...cat,
                    activities: cat.activities.map(act =>
                      act.id === activity.id ? { ...act, emoji: text } : act
                    )
                  };
                }
                return cat;
              });
              setLocalCategories(updatedCategories);
            }}
            maxLength={2}
          />
          <TextInput
            style={styles.nameInput}
            value={activity.name}
            onChangeText={(text) => {
              const updatedCategories = localCategories.map(cat => {
                if (cat.id === categoryId) {
                  return {
                    ...cat,
                    activities: cat.activities.map(act =>
                      act.id === activity.id ? { ...act, name: text } : act
                    )
                  };
                }
                return cat;
              });
              setLocalCategories(updatedCategories);
            }}
            autoFocus
          />
          <TouchableOpacity
            onPress={() => handleEditActivity(categoryId, activity.id, activity)}
            style={styles.saveButton}
          >
            <Icon name="check" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setEditingActivity(null)}
            style={styles.cancelButton}
          >
            <Icon name="close" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.activityItem}>
        <View style={styles.activityContent}>
          <Text style={styles.activityEmoji}>{activity.emoji}</Text>
          <Text style={styles.activityName}>{activity.name}</Text>
        </View>
        <View style={styles.activityActions}>
          <TouchableOpacity
            onPress={() => {
              onSelectActivity(activity);
              showNotification(`Added: ${activity.emoji} ${activity.name}`);
            }}
            style={styles.actionButton}
          >
            <Icon name="add-circle" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setEditingActivity(`${categoryId}-${activity.id}`)}
            style={styles.actionButton}
          >
            <Icon name="edit" size={18} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setItemToDelete({ type: 'activity', categoryId, activityId: activity.id });
              setShowDeleteConfirm(true);
            }}
            style={styles.actionButton}
          >
            <Icon name="delete" size={18} color="#e53e3e" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCategory = ({ item: category }) => {
    const isExpanded = expandedCategories[category.id] || category.expanded;
    const isEditing = editingCategory === category.id;
    const isAddingActivity = editingActivity === `${category.id}-new`;

    return (
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category.id)}
        >
          <Icon
            name={isExpanded ? "expand-less" : "expand-more"}
            size={24}
            color="#000"
          />
          {isEditing ? (
            <TextInput
              style={styles.categoryNameInput}
              value={category.name}
              onChangeText={(text) => {
                const updatedCategories = localCategories.map(cat =>
                  cat.id === category.id ? { ...cat, name: text } : cat
                );
                setLocalCategories(updatedCategories);
              }}
              onBlur={() => handleEditCategory(category.id, category.name)}
              autoFocus
            />
          ) : (
            <Text style={styles.categoryName}>{category.name}</Text>
          )}
          <Text style={styles.activityCount}>
            ({category.activities?.length || 0})
          </Text>
          {category.activities && category.activities.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                // Add all activities from this category
                if (onSelectMultipleActivities) {
                  // Use batch method for proper state updates
                  onSelectMultipleActivities(category.activities);
                  showNotification(`Added ${category.activities.length} activities!`);
                } else if (onSelectActivity) {
                  // Fallback to individual adds (won't work properly)
                  category.activities.forEach(activity => {
                    onSelectActivity(activity);
                  });
                  showNotification(`Added ${category.activities.length} activities!`);
                }
              }}
              style={styles.addAllButton}
            >
              <Text style={styles.addAllButtonText}>Add All</Text>
            </TouchableOpacity>
          )}
          {category.id !== 'my-templates' && (
            <>
              <TouchableOpacity
                onPress={() => setEditingCategory(category.id)}
                style={styles.actionButton}
              >
                <Icon name="edit" size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setItemToDelete({ type: 'category', categoryId: category.id });
                  setShowDeleteConfirm(true);
                }}
                style={styles.actionButton}
              >
                <Icon name="delete" size={18} color="#e53e3e" />
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.activitiesList}>
            {category.activities?.map(activity => (
              <View key={activity.id}>
                {renderActivity(activity, category.id)}
              </View>
            ))}
            
            {isAddingActivity ? (
              <View style={styles.addActivityForm}>
                <TextInput
                  style={styles.emojiInput}
                  value={newActivityEmoji}
                  onChangeText={setNewActivityEmoji}
                  placeholder="🎯"
                  maxLength={2}
                />
                <TextInput
                  style={styles.nameInput}
                  value={newActivityName}
                  onChangeText={setNewActivityName}
                  placeholder="Activity name"
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => handleAddActivity(category.id)}
                  style={styles.saveButton}
                >
                  <Icon name="check" size={20} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEditingActivity(null);
                    setNewActivityName('');
                    setNewActivityEmoji(DEFAULT_ACTIVITY_EMOJI);
                  }}
                  style={styles.cancelButton}
                >
                  <Icon name="close" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addActivityButton}
                onPress={() => setEditingActivity(`${category.id}-new`)}
              >
                <Icon name="add" size={20} color={theme.primary} />
                <Text style={[styles.addActivityText, { color: theme.primary }]}>
                  Add Activity
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Inline Notification */}
      {notification && (
        <Animated.View
          style={[
            styles.notification,
            { opacity: notificationOpacity },
          ]}
        >
          <Text style={styles.notificationText}>{notification}</Text>
        </Animated.View>
      )}
      
      <View style={styles.searchContainer}>
        <FormInput
          placeholder="Search activities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          theme={theme}
        />
      </View>

      <FlatList
        data={getFilteredCategories()}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, styles.scrollContainer]}
        showsVerticalScrollIndicator={false}
      />

      {showAddCategory ? (
        <View style={styles.addCategoryForm}>
          <FormInput
            placeholder="Category name"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            autoFocus
            theme={theme}
          />
          <View style={styles.addCategoryActions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowAddCategory(false);
                setNewCategoryName('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={handleAddCategory}
            >
              <Text style={styles.primaryButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ModalFooter
          theme={theme}
          primaryButton={{
            label: 'Add Category',
            icon: 'add',
            onPress: () => setShowAddCategory(true),
          }}
          showOnDesktop={true}
        />
      )}

      <ConfirmModal
        visible={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={() => {
          if (itemToDelete?.type === 'category') {
            handleDeleteCategory(itemToDelete.categoryId);
          } else if (itemToDelete?.type === 'activity') {
            handleDeleteActivity(itemToDelete.categoryId, itemToDelete.activityId);
          }
        }}
        theme={theme}
        title={`Delete ${itemToDelete?.type === 'category' ? 'Category' : 'Activity'}`}
        message={`Are you sure you want to delete this ${itemToDelete?.type}?`}
        confirmText="Delete"
        confirmButtonColor="#e53e3e"
        icon="delete"
        iconColor="#e53e3e"
      />
    </View>
  );
};

export default React.memo(LibraryTabContent);