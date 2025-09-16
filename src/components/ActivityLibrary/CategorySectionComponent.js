import React, { useState, useRef, useEffect } from 'react';
import { Text } from '../Typography';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ConfirmModal from '../Modals/ConfirmModal';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  isTablet,
} from '../../constants';
import LibraryActivityGrid from './LibraryActivityGrid';
import { CategoryNameEditor } from './CategoryEditor';
import CategoryMobileMenu from './CategoryMobileMenu';
import { renderCategoryActions } from './CategoryActionButtons';
import { useCategoryAnimations } from './CategoryAnimations';

const CategorySectionComponent = ({
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

  const { animatedStyles, toggleExpand: toggleExpandAnimation, isMounted } = useCategoryAnimations(
    expandedState,
    isSortMode,
    isDraggingAnyCategory,
    isExpanded,
    setIsExpanded
  );

  useEffect(() => {
    setOrderedActivities(category.activities);
  }, [category.activities]);

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
    toggleExpandAnimation(category.id, onExpandedChange, isSortMode);
  };

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
            <Icon name="drag-handle" size={24} color="rgba(255, 255, 255, 0.7)" />
          </View>
        )}
        {isEditingCategory ? (
          <CategoryNameEditor
            editingCategoryName={editingCategoryName}
            setEditingCategoryName={setEditingCategoryName}
            onSave={handleSaveCategory}
            onCancel={handleCancelEdit}
          />
        ) : (
          <>
            <TouchableOpacity
              style={styles.categoryTitleContainer}
              onPress={toggleExpand}
            >
              <Animated.View style={{ transform: [{ rotate: animatedStyles.rotation }] }}>
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
              <CategoryMobileMenu
                showMenu={showMenu}
                setShowMenu={setShowMenu}
                category={category}
                theme={theme}
                screenWidth={screenWidth}
                menuPosition={menuPosition}
                handleStartEditCategory={handleStartEditCategory}
                handleAddAll={handleAddAll}
                justAddedAll={justAddedAll}
                onAddActivity={onAddActivity}
                handleDeleteCategory={handleDeleteCategory}
              />
            </View>
          </>
        )}
      </View>

      <Animated.View
        style={[
          styles.activitiesList,
          { maxHeight: animatedStyles.maxHeight, opacity: animatedStyles.opacity },
        ]}
      >
        <LibraryActivityGrid
          category={category}
          isEditingCategory={isEditingCategory}
          orderedActivities={orderedActivities}
          setOrderedActivities={setOrderedActivities}
          searchQuery={searchQuery}
          onEditActivity={onEditActivity}
          onDeleteActivity={onDeleteActivity}
          onQuickAdd={onQuickAdd}
          theme={theme}
        />
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

const styles = StyleSheet.create({
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
});

export default CategorySectionComponent;