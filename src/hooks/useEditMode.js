import { useState, useCallback, useRef } from 'react';
import {
  reorderArray,
  moveItemUp,
  moveItemDown,
  batchDelete,
  triggerHaptic,
  configureReorderAnimation,
} from '../components/EditModeList/utils';

export const useEditMode = (initialActivities, onUpdate) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [undoStack, setUndoStack] = useState([]);

  // Use ref to always have current activities
  const activitiesRef = useRef(initialActivities);
  activitiesRef.current = initialActivities;

  const updateActivities = useCallback(
    newActivities => {
      // Save for undo using current activities from ref
      setUndoStack(prev => [...prev, activitiesRef.current].slice(-10)); // Keep last 10

      // Notify parent
      if (onUpdate) {
        onUpdate(newActivities);
      }
    },
    [onUpdate], // Remove initialActivities from dependencies
  );

  const handleMoveUp = useCallback(
    index => {
      if (index <= 0) return;

      triggerHaptic('selection');
      configureReorderAnimation(); // Smooth animation
      const newActivities = moveItemUp(activitiesRef.current, index);
      updateActivities(newActivities);
    },
    [updateActivities],
  );

  const handleMoveDown = useCallback(
    index => {
      if (index >= activitiesRef.current.length - 1) return;

      triggerHaptic('selection');
      configureReorderAnimation(); // Smooth animation
      const newActivities = moveItemDown(activitiesRef.current, index);
      updateActivities(newActivities);
    },
    [updateActivities],
  );

  const handleReorder = useCallback(
    (fromIndex, toIndex) => {
      triggerHaptic('selection');
      configureReorderAnimation(); // Smooth animation
      const newActivities = reorderArray(
        activitiesRef.current,
        fromIndex,
        toIndex,
      );
      updateActivities(newActivities);
    },
    [updateActivities],
  );

  const handleDelete = useCallback(
    itemOrId => {
      triggerHaptic('warning');
      configureReorderAnimation(); // Smooth animation for list adjustment
      const id = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
      const newActivities = activitiesRef.current.map(a =>
        a.id === id ? { ...a, deleted: true, deletedAt: Date.now() } : a,
      );
      updateActivities(newActivities);
    },
    [updateActivities],
  );

  const handleBatchDelete = useCallback(() => {
    if (selectedItems.size === 0) return;

    triggerHaptic('warning');
    configureReorderAnimation(); // Smooth animation for batch delete
    const newActivities = batchDelete(
      activitiesRef.current,
      Array.from(selectedItems),
    );
    updateActivities(newActivities);
    setSelectedItems(new Set());
  }, [initialActivities, selectedItems, updateActivities]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    triggerHaptic('success');
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    if (onUpdate) {
      onUpdate(previousState);
    }
  }, [undoStack, onUpdate]);

  const toggleSelection = useCallback(item => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) {
        newSet.delete(item.id);
      } else {
        newSet.add(item.id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(activitiesRef.current.map(a => a.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  return {
    selectedItems,
    canUndo: undoStack.length > 0,

    // Actions
    handleMoveUp,
    handleMoveDown,
    handleReorder,
    handleDelete,
    handleBatchDelete,
    handleUndo,

    // Selection
    toggleSelection,
    selectAll,
    clearSelection,
  };
};
