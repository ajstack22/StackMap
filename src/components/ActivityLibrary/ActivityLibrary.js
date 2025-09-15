import React, { useState, useRef, useEffect } from 'react';
import { Text, TextInput } from '../Typography';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  ScrollView,
  SafeAreaView,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfirmModal from '../Modals/ConfirmModal';

// Use standard FlatList for all platforms (draggable functionality removed)
let DraggableFlatList = FlatList;
let ScaleDecorator = ({ children }) => children;

// Simplified loader function for compatibility
const loadDragComponents = () => {
  return {
    DraggableFlatList: FlatList,
    ScaleDecorator: ({ children }) => children,
  };
};
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
  DEFAULT_ACTIVITY_EMOJI,
  CUSTOM_IMAGE_SOURCES,
  getCustomImageSource,
} from '../../constants';
import EmojiPicker from '../EmojiPicker';

// Empty template for new users - no pre-loaded activities
// Users can create their own activity groups in My Library
// StackMap Library provides curated activity groups separately

const ActivityRow = ({ activity, onEdit, onDelete, onQuickAdd, theme }) => {
  const [justAdded, setJustAdded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuButtonRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 480;
  const insets = useSafeAreaInsets();
  const handleDelete = () => {
    if (Platform.OS === 'web') {
      setShowDeleteConfirm(true);
    } else {
      Alert.alert(
        'Delete Activity',
        `Are you sure you want to delete "${activity.text}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              onDelete(activity);
            },
          },
        ],
      );
    }
  };

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityInfo}>
        {activity.icon && activity.icon.startsWith('image:') ? (
          <Image
            source={getCustomImageSource(activity.icon.substring(6))}
            style={styles.activityImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.activityEmoji}>{activity.icon || ''}</Text>
        )}
        <Text style={styles.activityName}>{activity.text}</Text>
      </View>

      <View style={styles.activityActions}>
        {isMobile ? (
          <>
            <TouchableOpacity
              style={[styles.addIconButton, { marginRight: SPACING.xs, backgroundColor: justAdded ? '#4CAF50' : theme.primary }]}
              onPress={() => {
                onQuickAdd(activity);
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 1500);
              }}
              disabled={justAdded}
            >
              <Icon
                name={justAdded ? 'check' : 'add'}
                size={20}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              ref={menuButtonRef}
              style={styles.iconButton}
              onPress={() => {
                if (menuButtonRef.current && !showMenu) {
                  menuButtonRef.current.measure(
                    (x, y, width, height, pageX, pageY) => {
                      setMenuPosition({ x: pageX, y: pageY + height });
                    },
                  );
                }
                setShowMenu(!showMenu);
              }}
            >
              <Icon name="more-vert" size={20} color={theme.primary} />
            </TouchableOpacity>

            {showMenu && (
              <Modal
                transparent={true}
                visible={showMenu}
                onRequestClose={() => setShowMenu(false)}
                animationType="fade"
              >
                <TouchableOpacity
                  style={styles.menuOverlay}
                  activeOpacity={1}
                  onPress={() => setShowMenu(false)}
                >
                  {Platform.OS === 'web' ? (
                    <View
                      style={[
                        styles.menuDropdown,
                        {
                          top: menuPosition.y,
                          right: Math.max(20, screenWidth - menuPosition.x),
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          setShowMenu(false);
                          onEdit(activity);
                        }}
                      >
                        <Icon name="edit" size={20} color={theme.primary} />
                        <Text
                          style={[
                            styles.menuItemText,
                            { color: theme.primary },
                          ]}
                        >
                          Edit Activity
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.menuItem, styles.menuItemDanger]}
                        onPress={() => {
                          setShowMenu(false);
                          handleDelete();
                        }}
                      >
                        <Icon name="delete" size={20} color={COLORS.error} />
                        <Text
                          style={[styles.menuItemText, { color: COLORS.error }]}
                        >
                          Delete Activity
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.centerMenuContainer}>
                      <View style={styles.centerMenuCard}>
                        <Text
                          style={[
                            styles.activityName,
                            {
                              textAlign: 'center',
                              marginBottom: SPACING.md,
                              fontSize: 18,
                            },
                          ]}
                        >
                          {activity.text}
                        </Text>

                        <TouchableOpacity
                          style={[
                            styles.menuItem,
                            { paddingHorizontal: SPACING.lg },
                          ]}
                          onPress={() => {
                            setShowMenu(false);
                            onEdit(activity);
                          }}
                        >
                          <Icon name="edit" size={24} color={theme.primary} />
                          <Text
                            style={[
                              styles.menuItemText,
                              { color: theme.primary, fontSize: 18 },
                            ]}
                          >
                            Edit Activity
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.menuItem,
                            styles.menuItemDanger,
                            { paddingHorizontal: SPACING.lg },
                          ]}
                          onPress={() => {
                            setShowMenu(false);
                            handleDelete();
                          }}
                        >
                          <Icon name="delete" size={24} color={COLORS.error} />
                          <Text
                            style={[
                              styles.menuItemText,
                              { color: COLORS.error, fontSize: 18 },
                            ]}
                          >
                            Delete Activity
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </Modal>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onEdit(activity)}
            >
              <Icon name="edit" size={20} color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
              <Icon name="delete" size={20} color={COLORS.error} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addIconButton, { backgroundColor: justAdded ? '#4CAF50' : theme.primary }]}
              onPress={() => {
                onQuickAdd(activity);
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 1500);
              }}
              disabled={justAdded}
            >
              <Icon
                name={justAdded ? 'check' : 'add'}
                size={20}
                color="white"
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {Platform.OS === 'web' && (
        <ConfirmModal
          visible={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            onDelete(activity);
            setShowDeleteConfirm(false);
          }}
          theme={theme}
          title="Delete Activity"
          message={`Are you sure you want to delete "${activity.text}"?`}
          confirmText="Delete"
          confirmButtonColor="#e53e3e"
          icon="delete"
          iconColor="#e53e3e"
        />
      )}
    </View>
  );
};

// Helper function to render mobile dropdown menu
const renderMobileDropdownMenu = ({
  category,
  theme,
  handleStartEditCategory,
  handleAddAll,
  justAddedAll,
  onAddActivity,
  handleDeleteCategory,
  setShowMenu,
  screenWidth,
  menuPosition,
}) => {
  return (
    <View
      style={[
        styles.menuDropdown,
        {
          top: menuPosition.y,
          right: Math.max(20, screenWidth - menuPosition.x),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowMenu(false);
          handleStartEditCategory();
        }}
      >
        <Icon name="edit" size={20} color={theme.primary} />
        <Text
          style={[
            styles.menuItemText,
            { color: theme.primary },
          ]}
        >
          Edit Name
        </Text>
      </TouchableOpacity>

      {category.activities.length > 0 && (
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            setShowMenu(false);
            handleAddAll();
          }}
          disabled={justAddedAll}
        >
          <Icon
            name={justAddedAll ? 'done-all' : 'add'}
            size={20}
            color={justAddedAll ? 'white' : theme.primary}
          />
          <Text
            style={[
              styles.menuItemText,
              {
                color: justAddedAll ? 'white' : theme.primary,
                fontWeight: justAddedAll ? 'bold' : 'normal',
              },
            ]}
          >
            {justAddedAll ? 'Added!' : 'Add All to Cards'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowMenu(false);
          onAddActivity(category);
        }}
      >
        <Icon name="library-add" size={20} color={theme.primary} />
        <Text
          style={[
            styles.menuItemText,
            { color: theme.primary },
          ]}
        >
          Add New Activity
        </Text>
      </TouchableOpacity>

      {category.id !== 'my-templates' && (
        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemDanger]}
          onPress={() => {
            setShowMenu(false);
            handleDeleteCategory();
          }}
        >
          <Icon name="delete" size={20} color={COLORS.error} />
          <Text
            style={[
              styles.menuItemText,
              { color: COLORS.error },
            ]}
          >
            Delete Category
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Helper function to render mobile center menu
const renderMobileCenterMenu = ({
  category,
  theme,
  handleStartEditCategory,
  handleAddAll,
  justAddedAll,
  onAddActivity,
  handleDeleteCategory,
  setShowMenu,
}) => {
  return (
    <View style={styles.centerMenuContainer}>
      <View style={styles.centerMenuCard}>
        <Text
          style={[
            styles.categoryTitle,
            {
              color: theme.primary,
              textAlign: 'center',
              marginBottom: SPACING.md,
              fontSize: 18,
            },
          ]}
        >
          {category.name}
        </Text>

        <TouchableOpacity
          style={[
            styles.menuItem,
            { paddingHorizontal: SPACING.lg },
          ]}
          onPress={() => {
            setShowMenu(false);
            handleStartEditCategory();
          }}
        >
          <Icon name="edit" size={24} color={theme.primary} />
          <Text
            style={[
              styles.menuItemText,
              { color: theme.primary, fontSize: 18 },
            ]}
          >
            Edit Name
          </Text>
        </TouchableOpacity>

        {category.activities.length > 0 && (
          <TouchableOpacity
            style={[
              styles.menuItem,
              { paddingHorizontal: SPACING.lg },
            ]}
            onPress={() => {
              setShowMenu(false);
              handleAddAll();
            }}
            disabled={justAddedAll}
          >
            <Icon
              name={justAddedAll ? 'done-all' : 'add'}
              size={24}
              color={justAddedAll ? 'white' : theme.primary}
            />
            <Text
              style={[
                styles.menuItemText,
                {
                  color: justAddedAll ? 'white' : theme.primary,
                  fontSize: 18,
                  fontWeight: justAddedAll ? 'bold' : 'normal',
                },
              ]}
            >
              {justAddedAll ? 'Added!' : 'Add All to Cards'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.menuItem,
            { paddingHorizontal: SPACING.lg },
          ]}
          onPress={() => {
            setShowMenu(false);
            onAddActivity(category);
          }}
        >
          <Icon name="library-add" size={24} color={theme.primary} />
          <Text
            style={[
              styles.menuItemText,
              { color: theme.primary, fontSize: 18 },
            ]}
          >
            Add New Activity
          </Text>
        </TouchableOpacity>

        {category.id !== 'my-templates' && (
          <TouchableOpacity
            style={[
              styles.menuItem,
              styles.menuItemDanger,
              { paddingHorizontal: SPACING.lg },
            ]}
            onPress={() => {
              setShowMenu(false);
              handleDeleteCategory();
            }}
          >
            <Icon name="delete" size={24} color={COLORS.error} />
            <Text
              style={[
                styles.menuItemText,
                { color: COLORS.error, fontSize: 18 },
              ]}
            >
              Delete Category
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Helper function to render mobile menu
const renderMobileMenu = ({
  showMenu,
  setShowMenu,
  category,
  theme,
  screenWidth,
  menuPosition,
  handleStartEditCategory,
  handleAddAll,
  justAddedAll,
  onAddActivity,
  handleDeleteCategory,
}) => {
  if (!showMenu) return null;

  return (
    <Modal
      transparent={true}
      visible={showMenu}
      onRequestClose={() => setShowMenu(false)}
      animationType="fade"
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={() => setShowMenu(false)}
      >
        {Platform.OS === 'web'
          ? renderMobileDropdownMenu({
              category,
              theme,
              handleStartEditCategory,
              handleAddAll,
              justAddedAll,
              onAddActivity,
              handleDeleteCategory,
              setShowMenu,
              screenWidth,
              menuPosition,
            })
          : renderMobileCenterMenu({
              category,
              theme,
              handleStartEditCategory,
              handleAddAll,
              justAddedAll,
              onAddActivity,
              handleDeleteCategory,
              setShowMenu,
            })}
      </TouchableOpacity>
    </Modal>
  );
};

// Helper function to render category actions based on mode
const renderCategoryActions = ({
  isReadOnly,
  isMobile,
  category,
  theme,
  onCopyToMyLibrary,
  handleAddAll,
  justAddedAll,
  menuButtonRef,
  showMenu,
  setShowMenu,
  setMenuPosition,
  handleStartEditCategory,
  handleDeleteCategory,
  onAddActivity,
}) => {
  if (isReadOnly) {
    // Read-only actions for StackMap Library
    return (
      <>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onCopyToMyLibrary && onCopyToMyLibrary(category)}
          title="Copy to My Library"
        >
          <Icon name="content-copy" size={20} color="white" />
        </TouchableOpacity>
        {category.activities.length > 0 && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleAddAll}
            disabled={justAddedAll}
          >
            <Icon
              name={justAddedAll ? 'check' : 'add'}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        )}
      </>
    );
  }

  if (isMobile) {
    return (
      <TouchableOpacity
        ref={menuButtonRef}
        style={styles.iconButton}
        onPress={() => {
          if (menuButtonRef.current && !showMenu) {
            menuButtonRef.current.measure(
              (x, y, width, height, pageX, pageY) => {
                setMenuPosition({ x: pageX, y: pageY + height });
              },
            );
          }
          setShowMenu(!showMenu);
        }}
      >
        <Icon name="more-vert" size={20} color="white" />
      </TouchableOpacity>
    );
  }

  // Desktop actions
  return (
    <>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleStartEditCategory}
      >
        <Icon name="edit" size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.iconButton,
          category.id === 'my-templates' && styles.disabledButton,
        ]}
        onPress={
          category.id === 'my-templates' ? undefined : handleDeleteCategory
        }
        disabled={category.id === 'my-templates'}
      >
        <Icon
          name="delete"
          size={20}
          color={category.id === 'my-templates' ? '#999' : 'white'}
        />
      </TouchableOpacity>

      {category.activities.length > 0 && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleAddAll}
          disabled={justAddedAll}
        >
          <Icon
            name={justAddedAll ? 'check' : 'add'}
            size={20}
            color="white"
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => onAddActivity(category)}
      >
        <Icon name="library-add" size={20} color="white" />
      </TouchableOpacity>
    </>
  );
};

// Helper function to filter activities based on search query
const getFilteredActivities = (activities, searchQuery) => {
  if (!searchQuery) return activities;

  const query = searchQuery.toLowerCase();
  return activities.filter(activity => {
    const activityIcon = activity.icon || '';
    return (
      (activity.text || '').toLowerCase().includes(query) ||
      activityIcon.includes(searchQuery)
    );
  });
};

// Helper function to render activities list content
const renderActivitiesListContent = ({
  isEditingCategory,
  orderedActivities,
  setOrderedActivities,
  category,
  searchQuery,
  onEditActivity,
  onDeleteActivity,
  onQuickAdd,
  theme,
}) => {
  if (isEditingCategory) {
    return orderedActivities.length > 0 ? (
      <DraggableFlatList
        data={orderedActivities}
        onDragEnd={
          Platform.OS === 'android'
            ? undefined
            : ({ data }) => setOrderedActivities(data)
        }
        keyExtractor={item => item.id}
        renderItem={({ item, drag, isActive }) => (
          <ScaleDecorator>
            <TouchableOpacity
              onLongPress={undefined}
              disabled={isActive}
              style={[styles.activityRow, isActive && styles.draggingRow]}
            >
              <View style={styles.activityInfo}>
                {item.icon && item.icon.startsWith('image:') ? (
                  <Image
                    source={getCustomImageSource(item.icon.substring(6))}
                    style={styles.activityImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.activityEmoji}>
                    {item.icon || ''}
                  </Text>
                )}
                <Text style={styles.activityName}>{item.text}</Text>
              </View>
              <View style={styles.dragHandle}>
                <Icon
                  name="drag-handle"
                  size={24}
                  color={COLORS.gray[400]}
                />
              </View>
            </TouchableOpacity>
          </ScaleDecorator>
        )}
      />
    ) : (
      <Text style={styles.emptyMessage}>
        No activities yet. Tap + to add one.
      </Text>
    );
  }

  const filteredActivities = getFilteredActivities(category.activities, searchQuery);

  return (
    <>
      {filteredActivities.map((activity, originalIndex) => (
        <ActivityRow
          key={activity.id}
          activity={activity}
          onEdit={onEditActivity}
          onDelete={activity => onDeleteActivity(category.id, activity)}
          onQuickAdd={onQuickAdd}
          theme={theme}
        />
      ))}
      {category.activities.length === 0 && (
        <Text style={styles.emptyMessage}>
          No activities yet. Tap + to add one.
        </Text>
      )}
      {category.activities.length > 0 && filteredActivities.length === 0 && (
        <Text style={styles.emptyMessage}>
          No activities match your search.
        </Text>
      )}
    </>
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
  onAddAllFromCategory,
  onUpdateCategory,
  onCopyToMyLibrary,
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
  isReadOnly,
}) => {
  const isEditingCategory = editingCategoryId === category.id;
  const [isExpanded, setIsExpanded] = useState(
    expandedState !== undefined ? expandedState : true,
  );
  const [editingCategoryName, setEditingCategoryName] = useState(category.name);
  const [orderedActivities, setOrderedActivities] = useState(
    category.activities,
  );
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [justAddedAll, setJustAddedAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuButtonRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 480;
  const insets = useSafeAreaInsets();
  // Use useRef for Animated values to avoid re-creation issues
  const expandAnim = useRef(
    new Animated.Value(
      expandedState !== undefined ? (expandedState ? 1 : 0) : 1,
    ),
  ).current;
  const rotateAnim = useRef(
    new Animated.Value(
      expandedState !== undefined ? (expandedState ? 1 : 0) : 1,
    ),
  ).current;
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
      onUpdateCategory(
        category.id,
        editingCategoryName.trim(),
        orderedActivities,
      );
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
    if (drag && typeof drag === 'function') {
      drag();
    }
  };

  // onDragStart is now handled at the parent level via onDragBegin

  const handleDeleteCategory = () => {
    if (Platform.OS === 'web') {
      setShowDeleteConfirm(true);
    } else {
      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete "${category.name}" and all its activities?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDeleteCategory(category),
          },
        ],
      );
    }
  };

  const handleAddAll = () => {
    onAddAllFromCategory(category);
    setJustAddedAll(true);
    setTimeout(() => setJustAddedAll(false), 1500);
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
      onLongPress={undefined}
      delayLongPress={isSortMode ? 150 : 250}
      activeOpacity={0.95}
      disabled={isActive || !isSortMode}
    >
      <View style={[styles.categoryHeader, { backgroundColor: theme.primary }]}>
        {isSortMode && !isReadOnly && (
          <View style={styles.categoryDragHandle}>
            <Icon
              name="drag-handle"
              size={24}
              color="rgba(255, 255, 255, 0.7)"
            />
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
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="close" size={20} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.categoryTitleContainer}
              onPress={toggleExpand}
            >
              <Animated.View
                style={{ transform: [{ rotate: animatedStyles.rotation }] }}
              >
                <Icon name="chevron-right" size={24} color="white" />
              </Animated.View>
              <Text style={styles.categoryTitle}>{category.name}</Text>
              <Text style={styles.activityCount}>
                ({category.activities.length})
              </Text>
            </TouchableOpacity>

            <View style={styles.categoryActions}>
              {renderCategoryActions({
                isReadOnly,
                isMobile,
                category,
                theme,
                onCopyToMyLibrary,
                handleAddAll,
                justAddedAll,
                menuButtonRef,
                showMenu,
                setShowMenu,
                setMenuPosition,
                handleStartEditCategory,
                handleDeleteCategory,
                onAddActivity,
              })}
              {renderMobileMenu({
                showMenu,
                setShowMenu,
                category,
                theme,
                screenWidth,
                menuPosition,
                handleStartEditCategory,
                handleAddAll,
                justAddedAll,
                onAddActivity,
                handleDeleteCategory,
              })}
            </View>
          </>
        )}
      </View>

      <Animated.View
        style={[
          styles.activitiesList,
          {
            maxHeight: animatedStyles.maxHeight,
            opacity: animatedStyles.opacity,
          },
        ]}
      >
        {renderActivitiesListContent({
          isEditingCategory,
          orderedActivities,
          setOrderedActivities,
          category,
          searchQuery,
          onEditActivity,
          onDeleteActivity,
          onQuickAdd,
          theme,
        })}
      </Animated.View>

      {Platform.OS === 'web' && (
        <ConfirmModal
          visible={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            onDeleteCategory(category);
            setShowDeleteConfirm(false);
          }}
          theme={theme}
          title="Delete Category"
          message={`Are you sure you want to delete "${category.name}" and all its activities?`}
          confirmText="Delete"
          confirmButtonColor="#e53e3e"
          icon="delete"
          iconColor="#e53e3e"
        />
      )}
    </TouchableOpacity>
  );
};

// Helper function to handle save edit logic
const handleSaveEditLogic = ({
  editMode,
  editName,
  editEmoji,
  editDescription,
  editingItem,
  selectedCategoryId,
  categories,
  DEFAULT_ACTIVITY_EMOJI,
}) => {
  if (!editName.trim()) {
    Alert.alert('Error', 'Name cannot be empty');
    return null;
  }

  let newCategories = [...categories];

  switch (editMode) {
    case 'category':
      newCategories = categories.map(cat =>
        cat.id === editingItem.id ? { ...cat, name: editName } : cat,
      );
      break;

    case 'activity':
      newCategories = categories.map(cat => ({
        ...cat,
        activities: cat.activities.map(act =>
          act.id === editingItem.id
            ? {
                ...act,
                name: editName,
                icon: editEmoji || DEFAULT_ACTIVITY_EMOJI,
                description: editDescription,
              }
            : act,
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
        return null;
      }
      const newActivityId = `activity-${Date.now()}`;
      newCategories = categories.map(cat =>
        cat.id === selectedCategoryId
          ? {
              ...cat,
              activities: [
                ...cat.activities,
                {
                  id: newActivityId,
                  name: editName,
                  icon: editEmoji || DEFAULT_ACTIVITY_EMOJI,
                  description: editDescription,
                },
              ],
            }
          : cat,
      );
      break;
  }

  return newCategories;
};

// Helper function to handle category drag operations
const handleCategoryDragOperations = ({
  categories,
  activeDragId,
  hasActuallyDragged,
  setActiveDragId,
  setDraggedData,
  setCategoryExpandedStates,
  setIsDraggingAnyCategory,
}) => {
  const handleCategoryDragStart = itemId => {
    // Save the initial state when drag might begin
    if (activeDragId !== itemId) {
      setActiveDragId(itemId);
      hasActuallyDragged.current = false;
      setDraggedData([...categories]); // Save original order

      // Save current expanded states before any animations
      const states = {};
      categories.forEach(cat => {
        // Get actual expanded state from the component if available
        const currentExpanded = true; // Default to true if not tracked
        states[cat.id] = currentExpanded;
      });
      setCategoryExpandedStates(states);

      // Small delay to let state update propagate
      setTimeout(() => {
        setIsDraggingAnyCategory(true);
      }, 50);
    }
  };

  const handleCategoryDragEnd = ({ data }, draggedData, setCategories, onSaveCategories) => {
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

  return { handleCategoryDragStart, handleCategoryDragEnd };
};

// Helper function to handle sort mode operations
const handleSortModeOperations = ({
  isSortMode,
  categories,
  categoryExpandedStates,
  setSavedExpandedStates,
  setCategoryExpandedStates,
  setIsSortMode,
}) => {
  const toggleSortMode = () => {
    if (!isSortMode) {
      // Entering sort mode - save current states and collapse all
      const currentStates = {};
      categories.forEach(cat => {
        currentStates[cat.id] =
          categoryExpandedStates[cat.id] !== undefined
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
      setCategoryExpandedStates({}); // This should be restored from saved states
    }
    setIsSortMode(!isSortMode);
  };

  return { toggleSortMode };
};

// Helper function to render header
const renderHeader = (theme, onClose) => (
  <SafeAreaView style={{ backgroundColor: theme.primary }}>
    <View style={[styles.header, { backgroundColor: theme.primary }]}>
      <View style={styles.headerLeft}>
        <Icon
          name="collections-bookmark"
          size={24}
          color="white"
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>Activity Library</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="close" size={20} color="white" />
        </View>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

// Helper function to render tab selector
const renderTabSelector = (activeTab, setActiveTab, theme) => (
  <View style={styles.tabContainer}>
    <TouchableOpacity
      style={[
        styles.tab,
        activeTab === 'stackmap' && [
          styles.activeTab,
          { backgroundColor: theme.primary },
        ],
      ]}
      onPress={() => setActiveTab('stackmap')}
    >
      <Icon
        name="auto-awesome"
        size={20}
        color={activeTab === 'stackmap' ? 'white' : theme.primary}
      />
      <Text
        style={[
          styles.tabText,
          activeTab === 'stackmap' && styles.activeTabText,
        ]}
      >
        StackMap Library
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.tab,
        activeTab === 'mylibrary' && [
          styles.activeTab,
          { backgroundColor: theme.primary },
        ],
      ]}
      onPress={() => setActiveTab('mylibrary')}
    >
      <Icon
        name="folder"
        size={20}
        color={activeTab === 'mylibrary' ? 'white' : theme.primary}
      />
      <Text
        style={[
          styles.tabText,
          activeTab === 'mylibrary' && styles.activeTabText,
        ]}
      >
        My Library
      </Text>
    </TouchableOpacity>
  </View>
);

// Helper function to render search and sort bar
const renderSearchAndSortBar = (
  searchQuery,
  setSearchQuery,
  isSortMode,
  setIsSortMode,
  setSavedExpandedStates,
  setCategoryExpandedStates,
  categoryExpandedStates,
  savedExpandedStates,
  categories,
  theme
) => (
  <View style={styles.controlsBar}>
    <View
      style={[styles.searchContainer, { backgroundColor: 'white' }]}
    >
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
        { backgroundColor: isSortMode ? theme.primary : 'white' },
      ]}
      onPress={() => {
        if (!isSortMode) {
          // Entering sort mode - save current states and collapse all
          const currentStates = {};
          categories.forEach(cat => {
            currentStates[cat.id] =
              categoryExpandedStates[cat.id] !== undefined
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
);

// Helper function to filter categories based on search
const getFilteredCategories = (categories, stackMapLibrary, activeTab, searchQuery) => {
  const dataToFilter = activeTab === 'stackmap'
    ? stackMapLibrary?.activityGroups || []
    : categories;

  return dataToFilter.filter(category => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    // Check category name
    if (category.name.toLowerCase().includes(query)) return true;
    // Check activities within category
    return category.activities.some(
      activity =>
        (activity.text || '').toLowerCase().includes(query) ||
        (activity.icon || '').includes(searchQuery),
    );
  });
};

// Helper function to get drag event handlers
const getDragEventHandlers = (
  activeTab,
  categories,
  handleCategoryDragStart,
  handleCategoryDragEnd,
  hasActuallyDragged
) => {
  const shouldDisableDrag = Platform.OS === 'android' || activeTab === 'stackmap';

  return {
    onDragBegin: shouldDisableDrag
      ? undefined
      : index => {
          const draggedItem = categories[index];
          if (draggedItem) {
            handleCategoryDragStart(draggedItem.id);
          }
        },
    onPlaceholderIndexChange: Platform.OS === 'android'
      ? undefined
      : () => {
          hasActuallyDragged.current = true;
        },
    onDragEnd: shouldDisableDrag ? undefined : handleCategoryDragEnd,
  };
};

// Helper function to render edit modal
const renderEditModal = (
  editMode,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  editEmoji,
  setShowEmojiPicker,
  getCustomImageSource,
  theme,
  setEditMode,
  handleSaveEdit
) => {
  if (!editMode) return null;

  return (
    <View style={styles.editModal}>
      <View style={styles.editModalContent}>
        <Text style={styles.editModalTitle}>
          {editMode === 'new-category'
            ? 'New Category'
            : editMode === 'new-activity'
            ? 'New Activity'
            : editMode === 'category'
            ? 'Edit Category'
            : 'Edit Activity'}
        </Text>

        <TextInput
          style={styles.editInput}
          value={editName}
          onChangeText={setEditName}
          placeholder="Name"
          placeholderTextColor="#999999"
          autoFocus
        />

        {(editMode === 'activity' || editMode === 'new-activity') && (
          <View>
            <TextInput
              style={[styles.editInput, styles.descriptionInput]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Description (optional)"
              placeholderTextColor="#999999"
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
                  source={getCustomImageSource(editEmoji.substring(6))}
                  style={styles.selectedEmojiImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.selectedEmoji}>
                  {editEmoji || '🎯'}
                </Text>
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
            style={[
              styles.editButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={handleSaveEdit}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const ActivityLibrary = ({
  visible,
  onClose,
  onSelectActivity,
  onSelectMultipleActivities,
  theme,
  categories: customCategories,
  onSaveCategories,
  stackMapLibrary,
  myLibrary,
  onCopyGroupToMyLibrary,
  showToast,
}) => {
  // Load drag components
  const { DraggableFlatList: DraggableList, ScaleDecorator: Decorator } =
    loadDragComponents();
  if (!DraggableFlatList) DraggableFlatList = DraggableList;
  if (!ScaleDecorator) ScaleDecorator = Decorator;

  const insets = useSafeAreaInsets();
  // Use myLibrary if provided, otherwise fall back to legacy categories
  const [categories, setCategories] = useState(
    myLibrary?.activityGroups ||
      customCategories || [
        { id: 'my-templates', name: 'My Templates', activities: [] },
      ],
  );
  const [activeTab, setActiveTab] = useState('stackmap'); // 'stackmap' or 'mylibrary'
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

  // Ensure My Templates folder always exists
  useEffect(() => {
    const hasMyTemplates = categories.some(cat => cat.id === 'my-templates');
    if (!hasMyTemplates) {
      const myTemplatesCategory = {
        id: 'my-templates',
        name: 'My Templates',
        activities: [],
      };
      const newCategories = [...categories, myTemplatesCategory];
      setCategories(newCategories);
      if (onSaveCategories) onSaveCategories(newCategories);
    }
  }, []);

  // Edit handlers
  const handleEditCategory = category => {
    setEditingItem(category);
    setEditMode('category');
    setEditName(category.name);
  };

  const handleEditActivity = activity => {
    setEditingItem(activity);
    setEditMode('activity');
    // Use text field only
    setEditName(activity.text || '');
    // Use icon field only
    setEditEmoji(activity.icon || '');
    setEditDescription(activity.description || '');
  };

  const handleDeleteCategory = category => {
    // Prevent deletion of My Templates folder
    if (category.id === 'my-templates') {
      Alert.alert(
        'Cannot Delete',
        "The 'My Templates' folder is required for saving activities to your library. You can delete activities within it, but not the folder itself.",
        [{ text: 'OK' }],
      );
      return;
    }

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
    if (onSaveCategories) {
      onSaveCategories(newCategories);
    } else {}
  };

  const handleAddCategory = () => {
    setEditMode('new-category');
    setEditName('');
  };

  const handleAddActivity = category => {
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
          cat.id === editingItem.id ? { ...cat, name: editName } : cat,
        );
        break;

      case 'activity':
        newCategories = categories.map(cat => ({
          ...cat,
          activities: cat.activities.map(act =>
            act.id === editingItem.id
              ? {
                  ...act,
                  name: editName,
                  icon: editEmoji || DEFAULT_ACTIVITY_EMOJI,
                  description: editDescription,
                }
              : act,
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
                activities: [
                  ...cat.activities,
                  {
                    id: newActivityId,
                    name: editName,
                    icon: editEmoji || DEFAULT_ACTIVITY_EMOJI,
                    description: editDescription,
                  },
                ],
              }
            : cat,
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

  const handleQuickAdd = activity => {
    if (onSelectActivity) {
      // Transform library activity to match expected format
      onSelectActivity({
        icon: activity.icon,
        text: activity.text,
        description: activity.description || '', // Include description if present
      });
      // Don't close the modal - user likely wants to add more activities
    }
  };

  const handleAddAllFromCategory = category => {
    if (category.activities.length > 0) {
      // Check if we have the batch method available
      if (onSelectMultipleActivities) {
        // Use batch method for better performance
        const activitiesToAdd = category.activities.map(activity => ({
          icon: activity.icon,
          text: activity.text,
          description: activity.description || '',
        }));

        onSelectMultipleActivities(activitiesToAdd);
      } else if (onSelectActivity) {
        // Fallback to individual adds
        category.activities.forEach(activity => {
          onSelectActivity({
            icon: activity.icon,
            text: activity.text,
            description: activity.description || '',
          });
        });
      } else {
        return;
      }
    }
  };

  const handleUpdateCategory = (categoryId, newName, newActivities) => {
    const newCategories = categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, name: newName, activities: newActivities }
        : cat,
    );
    setCategories(newCategories);
    if (onSaveCategories) onSaveCategories(newCategories);
  };

  const handleStartEditCategory = categoryId => {
    setEditingCategoryId(categoryId);
  };

  const handleEndEditCategory = () => {
    setEditingCategoryId(null);
  };

  const [activeDragId, setActiveDragId] = useState(null);
  const [draggedData, setDraggedData] = useState(null);
  const hasActuallyDragged = useRef(false);

  const handleCategoryDragStart = itemId => {
    // Save the initial state when drag might begin
    if (activeDragId !== itemId) {
      setActiveDragId(itemId);
      hasActuallyDragged.current = false;
      setDraggedData([...categories]); // Save original order

      // Save current expanded states before any animations
      const states = {};
      categories.forEach(cat => {
        // Get actual expanded state from the component if available
        const currentExpanded =
          cat.id in categoryExpandedStates
            ? categoryExpandedStates[cat.id]
            : true;
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
      [categoryId]: isExpanded,
    }));
  };

  const filteredCategories = getFilteredCategories(
    categories,
    stackMapLibrary,
    activeTab,
    searchQuery
  );

  const dragHandlers = getDragEventHandlers(
    activeTab,
    categories,
    handleCategoryDragStart,
    handleCategoryDragEnd,
    hasActuallyDragged
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.light }]}>
        {Platform.OS === 'android' && (
          <StatusBar
            backgroundColor={theme.primary}
            barStyle="light-content"
            translucent={false}
          />
        )}
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: theme.primary,
              height: StatusBar.currentHeight || 24,
            }}
          />
        )}
        {renderHeader(theme, onClose)}

        <View style={[styles.contentWrapper, { backgroundColor: theme.light }]}>
          {renderTabSelector(activeTab, setActiveTab, theme)}
          {renderSearchAndSortBar(
            searchQuery,
            setSearchQuery,
            isSortMode,
            setIsSortMode,
            setSavedExpandedStates,
            setCategoryExpandedStates,
            categoryExpandedStates,
            savedExpandedStates,
            categories,
            theme
          )}
          <DraggableFlatList
            data={filteredCategories}
            onDragBegin={dragHandlers.onDragBegin}
            onPlaceholderIndexChange={dragHandlers.onPlaceholderIndexChange}
            onDragEnd={dragHandlers.onDragEnd}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0 }}
            scrollEnabled={!isDraggingAnyCategory && !isSortMode}
            activationDistance={
              activeTab === 'stackmap' ? 999999 : isSortMode ? 0 : 20
            }
            renderItem={({ item, drag, isActive }) => (
              <ScaleDecorator activeScale={0.98}>
                <CategorySection
                  category={item}
                  onEditCategory={
                    activeTab === 'mylibrary' ? handleEditCategory : undefined
                  }
                  onDeleteCategory={
                    activeTab === 'mylibrary' ? handleDeleteCategory : undefined
                  }
                  onEditActivity={
                    activeTab === 'mylibrary' ? handleEditActivity : undefined
                  }
                  onDeleteActivity={
                    activeTab === 'mylibrary' ? handleDeleteActivity : undefined
                  }
                  onQuickAdd={handleQuickAdd}
                  onAddActivity={
                    activeTab === 'mylibrary' ? handleAddActivity : undefined
                  }
                  onAddAllFromCategory={handleAddAllFromCategory}
                  onUpdateCategory={
                    activeTab === 'mylibrary' ? handleUpdateCategory : undefined
                  }
                  onCopyToMyLibrary={
                    activeTab === 'stackmap'
                      ? onCopyGroupToMyLibrary
                      : undefined
                  }
                  isReadOnly={activeTab === 'stackmap'}
                  theme={theme}
                  editingCategoryId={editingCategoryId}
                  onStartEditCategory={handleStartEditCategory}
                  onEndEditCategory={handleEndEditCategory}
                  drag={drag}
                  isActive={isActive}
                  isDraggingAnyCategory={isDraggingAnyCategory}
                  expandedState={
                    isDraggingAnyCategory || isSortMode
                      ? false
                      : categoryExpandedStates[item.id]
                  }
                  onExpandedChange={handleExpandedChange}
                  searchQuery={searchQuery}
                  isSortMode={isSortMode}
                />
              </ScaleDecorator>
            )}
            ListFooterComponent={() =>
              activeTab === 'mylibrary' ? (
                <TouchableOpacity
                  style={[styles.addCategoryButton, { borderColor: 'white' }]}
                  onPress={handleAddCategory}
                >
                  <Icon name="add" size={20} color="white" />
                  <Text style={[styles.addCategoryText, { color: 'white' }]}>
                    Add New Activity Group
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>

        {/* Edit Modal */}
        {renderEditModal(
          editMode,
          editName,
          setEditName,
          editDescription,
          setEditDescription,
          editEmoji,
          setShowEmojiPicker,
          getCustomImageSource,
          theme,
          setEditMode,
          handleSaveEdit
        )}

        {/* Emoji Picker Modal */}
        <EmojiPicker
          mode="modal"
          visible={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelect={icon => {
            setEditEmoji(icon);
            setShowEmojiPicker(false);
          }}
          theme={theme}
          selectedEmoji={editEmoji}
          showCustomImages={true}
        />

        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: theme.light,
              height: insets.bottom || 0,
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    padding: 4,
    ...SHADOWS.level1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  activeTab: {
    ...SHADOWS.level1,
  },
  tabText: {
    fontSize: isTablet() ? 15 : 13,
    fontWeight: '600',
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  activeTabText: {
    color: 'white',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: isTablet() ? 22 : 20,
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal', // Android uses bold font file
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
    color: '#000',
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
  addIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  disabledButton: {
    opacity: 0.5,
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
    color: '#000000', // Explicit black text color for Android devices
    backgroundColor: 'white', // Ensure white background
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
  menuOverlay: {
    flex: 1,
    backgroundColor:
      Platform.OS === 'web' ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDropdown: {
    position: 'absolute',
    borderRadius: RADIUS.lg,
    backgroundColor: 'white',
    ...SHADOWS.level3,
    minWidth: 220,
    maxHeight: 300,
    paddingVertical: SPACING.sm,
    ...(Platform.OS === 'web' && {
      overflowY: 'auto',
    }),
  },
  centerMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  centerMenuCard: {
    backgroundColor: 'white',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    ...SHADOWS.level3,
  },
  mobileMenuContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mobileMenuCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.lg,
    ...SHADOWS.level3,
  },
  mobileMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  menuItemText: {
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
  },
});

// Export empty template for initialization with My Templates category
export const EMPTY_CATEGORIES = [
  {
    id: 'my-templates',
    name: 'My Templates',
    icon: '⭐',
    activities: [],
  },
];

export default ActivityLibrary;
