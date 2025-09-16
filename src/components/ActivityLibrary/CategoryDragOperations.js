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

export { handleCategoryDragOperations };