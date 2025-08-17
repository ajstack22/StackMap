import React, { useState, useRef } from 'react';
import { Text } from '../Typography';
import { View, TouchableOpacity, FlatList } from 'react-native';

// Web-compatible draggable list implementation
export const DraggableList = ({
  data,
  renderItem,
  keyExtractor,
  onDragEnd,
  contentContainerStyle,
  ListFooterComponent,
  showsVerticalScrollIndicator,
  scrollEnabled,
  ...props
}) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
  const [items, setItems] = useState(data);
  const dragCounter = useRef(0);

  React.useEffect(() => {
    setItems(data);
  }, [data]);

  const handleDragStart = (e, item, index) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.target.innerHTML);
    }
    setDraggedItem({ item, index });
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedItem && draggedItem.index !== index) {
      setDraggedOverIndex(index);
    }
  };

  const handleDragLeave = e => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDraggedOverIndex(null);
    }
  };

  const handleDragOver = e => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    dragCounter.current = 0;

    if (draggedItem && draggedItem.index !== dropIndex) {
      const draggedItemContent = items[draggedItem.index];
      const newItems = [...items];

      // Remove the dragged item
      newItems.splice(draggedItem.index, 1);

      // Insert it at the new position
      newItems.splice(dropIndex, 0, draggedItemContent);

      setItems(newItems);

      if (onDragEnd) {
        onDragEnd({ data: newItems });
      }
    }

    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverIndex(null);
    dragCounter.current = 0;
  };

  const renderDraggableItem = ({ item, index }) => {
    const isDragging = draggedItem && draggedItem.index === index;
    const isDraggedOver = draggedOverIndex === index;

    return (
      <div
        draggable
        onDragStart={e => handleDragStart(e, item, index)}
        onDragEnter={e => handleDragEnter(e, index)}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={e => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        style={{
          opacity: isDragging ? 0.5 : 1,
          borderTop: isDraggedOver ? '2px solid #667eea' : 'none',
          cursor: 'move',
        }}
      >
        {renderItem({
          item,
          index,
          drag: () => {}, // Provide a no-op drag function for compatibility
          isActive: isDragging,
        })}
      </div>
    );
  };

  return (
    <FlatList
      {...props}
      data={items}
      renderItem={renderDraggableItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={contentContainerStyle}
      ListFooterComponent={ListFooterComponent}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      scrollEnabled={scrollEnabled}
    />
  );
};

// ScaleDecorator for web - just passes through children
export const ScaleDecorator = ({ children, activeScale = 0.98 }) => {
  return children;
};
