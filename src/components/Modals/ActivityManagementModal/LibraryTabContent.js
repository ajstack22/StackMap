import React, { useState, useRef, useEffect } from 'react';
import { Text, TextInput } from '../../Typography';
import {
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
  Animated,
  
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfirmModal from '../../Modals/ConfirmModal';
import { ModalFooter, FormInput } from '../../ModalUtilities';
import Logo from '../../Logo';
import { styles } from './styles';
import { DEFAULT_ACTIVITY_EMOJI } from '../../../constants';

// Empty template for new users - no pre-loaded activities
const EMPTY_TEMPLATE = [];

const LibraryTabContent = ({
  theme,
  categories,
  onSaveCategories,
  onSelectActivity,
  onSelectMultipleActivities,
  showToast,
  loading,
  stackMapLibrary,
  myLibrary,
}) => {
  // Start with empty categories if none provided
  const [localCategories, setLocalCategories] = useState(
    myLibrary?.activityGroups || categories || [{ id: 'my-templates', name: 'My Templates', activities: [] }]
  );
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const notificationOpacity = useRef(new Animated.Value(0)).current;
  const notificationTimer = useRef(null);

  useEffect(() => {
    setLocalCategories(
      myLibrary?.activityGroups || categories || [{ id: 'my-templates', name: 'My Templates', activities: [] }]
    );
  }, [categories, myLibrary]);

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

  const getFilteredData = () => {
    const myLibraryGroups = localCategories || [];
    const stackMapGroups = stackMapLibrary?.activityGroups || [];
    
    if (!searchQuery) {
      // Return all data when not searching
      return [...myLibraryGroups, ...stackMapGroups];
    }
    
    const query = searchQuery.toLowerCase();
    
    // Filter and combine both libraries
    const filterGroups = (groups) => {
      return groups.map(category => {
        const matchingActivities = category.activities?.filter(activity =>
          (activity.text || '').toLowerCase().includes(query) ||
          (activity.icon || activity.emoji || '')?.includes(query)
        ) || [];

        const categoryMatches = category.name.toLowerCase().includes(query);

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
    
    return [...filterGroups(myLibraryGroups), ...filterGroups(stackMapGroups)];
  };

  const renderActivity = (activity, categoryId) => {
    const isSystemProvided = stackMapLibrary?.activityGroups?.some(g => g.id === categoryId);

    return (
      <View style={styles.activityItem}>
        <View style={styles.activityContent}>
          <Text style={styles.activityEmoji}>{activity.icon || activity.emoji}</Text>
          <Text style={styles.activityName}>{activity.text}</Text>
        </View>
        <View style={styles.activityActions}>
          <TouchableOpacity
            onPress={() => {
              onSelectActivity(activity);
              showNotification(`Added: ${activity.icon || ''} ${activity.text || ''}`);
            }}
            style={styles.iconButton}
          >
            <Icon name="add" size={20} color={theme.primary} />
          </TouchableOpacity>
          {!isSystemProvided && (
            <TouchableOpacity
              onPress={() => {
                setItemToDelete({ type: 'activity', categoryId, activityId: activity.id });
                setShowDeleteConfirm(true);
              }}
              style={styles.iconButton}
            >
              <Icon name="delete" size={20} color="#e53e3e" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderCategory = ({ item: category }) => {
    const isExpanded = expandedCategories[category.id] || category.expanded;
    const isEditing = editingCategory === category.id;
    const isSystemProvided = category.isSystemProvided || stackMapLibrary?.activityGroups?.some(g => g.id === category.id);

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
              style={[styles.addAllButton, { borderColor: theme.primary }]}
            >
              <Text style={[styles.addAllButtonText, { color: theme.primary }]}>Add All</Text>
            </TouchableOpacity>
          )}
          {!isSystemProvided && category.id !== 'my-templates' && (
            <>
              <TouchableOpacity
                onPress={() => setEditingCategory(category.id)}
                style={styles.iconButton}
              >
                <Icon name="edit" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setItemToDelete({ type: 'category', categoryId: category.id });
                  setShowDeleteConfirm(true);
                }}
                style={styles.iconButton}
              >
                <Icon name="delete" size={20} color="#e53e3e" />
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
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.light }}>
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
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ flexGrow: 1 }, styles.scrollContainer]}
        style={{ flex: 1 }}
        nestedScrollEnabled={Platform.OS === 'android'}
        scrollEnabled={true}
      >
        {/* Single Consolidated Panel */}
        <View style={styles.libraryContentPanel}>
          {/* Header */}
          <View style={styles.standardTabContainer}>
            <Icon name="folder" size={48} color={theme.primary} />
            <Text style={styles.standardTabTitle}>Activity Library</Text>
            <Text style={styles.standardTabDescription}>
              Browse and select from saved activities
            </Text>
          </View>
          
          {/* Divider */}
          <View style={styles.divider} />
          <View style={styles.searchContainer}>
            <FormInput
              placeholder="Search activities..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon="search"
              theme={theme}
            />
          </View>
          {/* My Library Section */}
          {localCategories.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Icon name="folder" size={20} color="#000" />
                <Text style={styles.sectionTitle}>My Library</Text>
              </View>
              {localCategories
                .map(category => {
                  if (!searchQuery) return category;
                  const query = searchQuery.toLowerCase();
                  
                  // Filter activities within the category
                  const filteredActivities = category.activities?.filter(activity => 
                    (activity.text || '').toLowerCase().includes(query) ||
                    (activity.icon || activity.emoji || '')?.includes(query)
                  ) || [];
                  
                  // Check if category name matches
                  const categoryMatches = category.name.toLowerCase().includes(query);
                  
                  // Include category if name matches or has matching activities
                  if (categoryMatches || filteredActivities.length > 0) {
                    return {
                      ...category,
                      activities: categoryMatches ? category.activities : filteredActivities,
                      expanded: true // Auto-expand when searching
                    };
                  }
                  return null;
                })
                .filter(Boolean)
                .map(category => (
                  <View key={category.id}>
                    {renderCategory({ item: category })}
                  </View>
                ))}
            </>
          )}
          
          {/* StackMap Library Section */}
          {stackMapLibrary?.activityGroups && stackMapLibrary.activityGroups.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: localCategories.length > 0 ? 20 : 0 }]}>
                <Logo size={20} color="#000" theme={theme} />
                <Text style={styles.sectionTitle}>StackMap Library</Text>
              </View>
              {(stackMapLibrary.activityGroups || [])
                .map(category => {
                  if (!searchQuery) return category;
                  const query = searchQuery.toLowerCase();
                  
                  // Filter activities within the category
                  const filteredActivities = category.activities?.filter(activity => 
                    (activity.text || '').toLowerCase().includes(query) ||
                    (activity.icon || activity.emoji || '')?.includes(query)
                  ) || [];
                  
                  // Check if category name matches
                  const categoryMatches = category.name.toLowerCase().includes(query);
                  
                  // Include category if name matches or has matching activities
                  if (categoryMatches || filteredActivities.length > 0) {
                    return {
                      ...category,
                      activities: categoryMatches ? category.activities : filteredActivities,
                      expanded: true // Auto-expand when searching
                    };
                  }
                  return null;
                })
                .filter(Boolean)
                .map(category => (
                  <View key={category.id}>
                    {renderCategory({ item: category })}
                  </View>
                ))}
            </>
          )}

          {/* Removed Add Category functionality for now */}
        </View>
      </ScrollView>

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