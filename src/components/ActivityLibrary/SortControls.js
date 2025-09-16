import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  SPACING,
  RADIUS,
  COLORS,
} from '../../constants';

/**
 * SortControls component that provides sorting functionality for categories
 * Includes sort mode toggle and drag-and-drop operations
 */

/**
 * Sort button component for toggling sort mode
 */
export const SortButton = ({ isSortMode, onSortToggle, theme }) => (
  <TouchableOpacity
    style={[
      styles.sortButton,
      isSortMode && [styles.activeSortButton, { backgroundColor: theme.primary }],
    ]}
    onPress={onSortToggle}
    accessibilityLabel={isSortMode ? "Exit sort mode" : "Enter sort mode"}
    testID="sort-toggle-button"
  >
    <Icon
      name={isSortMode ? "check" : "sort"}
      size={20}
      color={isSortMode ? "white" : COLORS.gray[600]}
    />
  </TouchableOpacity>
);

/**
 * Hook for managing sort mode state and operations
 * @param {Array} categories - Categories to sort
 * @param {Object} categoryExpandedStates - Current expanded states of categories
 * @param {Function} setCategoryExpandedStates - Setter for category expanded states
 * @returns {Object} Sort state and operations
 */
export const useSortControls = (
  categories,
  categoryExpandedStates,
  setCategoryExpandedStates
) => {
  const [isSortMode, setIsSortMode] = React.useState(false);
  const [savedExpandedStates, setSavedExpandedStates] = React.useState({});
  const [activeDragId, setActiveDragId] = React.useState(null);
  const [draggedData, setDraggedData] = React.useState(null);
  const [isDraggingAnyCategory, setIsDraggingAnyCategory] = React.useState(false);
  const hasActuallyDragged = React.useRef(false);

  /**
   * Toggle sort mode on/off
   */
  const toggleSortMode = React.useCallback(() => {
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
  }, [
    isSortMode,
    categories,
    categoryExpandedStates,
    setCategoryExpandedStates,
    savedExpandedStates,
  ]);

  /**
   * Handle category drag start
   */
  const handleCategoryDragStart = React.useCallback((itemId) => {
    if (activeDragId !== itemId) {
      setActiveDragId(itemId);
      hasActuallyDragged.current = false;
      setDraggedData([...categories]); // Save original order

      // Save current expanded states before any animations
      const states = {};
      categories.forEach(cat => {
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
  }, [activeDragId, categories, categoryExpandedStates, setCategoryExpandedStates]);

  /**
   * Handle category drag end
   */
  const handleCategoryDragEnd = React.useCallback(({ data }, onSaveCategories) => {
    // Only update if we actually dragged (data changed)
    const dataChanged = JSON.stringify(data) !== JSON.stringify(draggedData);

    if (dataChanged && hasActuallyDragged.current) {
      // Real drag occurred with reordering
      if (onSaveCategories) onSaveCategories(data);
      return data; // Return new order for parent to update
    } else {
      // No real drag, restore original order
      if (draggedData && onSaveCategories) {
        onSaveCategories(draggedData);
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

    return draggedData; // Return original order
  }, [draggedData]);

  /**
   * Get drag event handlers for FlatList
   */
  const getDragEventHandlers = React.useCallback((activeTab) => {
    const shouldDisableDrag = Platform.OS === 'android' || activeTab === 'stackmap';

    return {
      onDragBegin: shouldDisableDrag
        ? undefined
        : (index) => {
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
  }, [categories, handleCategoryDragStart, handleCategoryDragEnd]);

  return {
    // State
    isSortMode,
    savedExpandedStates,
    activeDragId,
    isDraggingAnyCategory,
    draggedData,

    // Actions
    toggleSortMode,
    handleCategoryDragStart,
    handleCategoryDragEnd,
    getDragEventHandlers,

    // Setters (for advanced usage)
    setIsSortMode,
    setSavedExpandedStates,
    setActiveDragId,
    setIsDraggingAnyCategory,
  };
};

/**
 * Helper function to determine if drag should be disabled
 * @param {string} activeTab - Current active tab
 * @param {boolean} isSortMode - Whether sort mode is active
 * @returns {boolean} True if drag should be disabled
 */
export const shouldDisableDrag = (activeTab, isSortMode) => {
  return Platform.OS === 'android' || activeTab === 'stackmap' || !isSortMode;
};

/**
 * Helper function to get activation distance for drag
 * @param {string} activeTab - Current active tab
 * @param {boolean} isSortMode - Whether sort mode is active
 * @returns {number} Activation distance in pixels
 */
export const getDragActivationDistance = (activeTab, isSortMode) => {
  if (activeTab === 'stackmap') return 999999; // Effectively disable
  return isSortMode ? 0 : 20; // Immediate activation in sort mode, normal otherwise
};

/**
 * Helper function to determine scroll enabled state
 * @param {boolean} isDraggingAnyCategory - Whether any category is being dragged
 * @param {boolean} isSortMode - Whether sort mode is active
 * @returns {boolean} True if scrolling should be enabled
 */
export const isScrollEnabled = (isDraggingAnyCategory, isSortMode) => {
  return !isDraggingAnyCategory && !isSortMode;
};

const styles = StyleSheet.create({
  sortButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
  },
  activeSortButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

// Default export for the main component
const SortControls = ({ isSortMode, onSortToggle, theme }) => {
  return (
    <SortButton
      isSortMode={isSortMode}
      onSortToggle={onSortToggle}
      theme={theme}
    />
  );
};

export default SortControls;