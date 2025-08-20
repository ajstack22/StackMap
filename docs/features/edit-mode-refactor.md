# Edit Mode Refactor - Implementation Guide

## Vision
Transform the edit mode from a card-based interface to a streamlined list-based interface that provides better visibility and more intuitive interaction patterns, similar to modern email clients.

## Goals
1. **Improved Visibility**: Display more activities at once with compact list view
2. **Better Interaction**: Clear action buttons for common operations
3. **Consistent Reordering**: Same button-based approach on all platforms
4. **Platform Consistency**: Identical experience across all platforms for predictability

## Core Features

### List Item Display
- **Emoji**: Activity icon/emoji prominently displayed
- **Title**: Full activity title
- **Description**: Truncated description (if space permits)
- **Visual Hierarchy**: Clear separation between items

### Actions Per Item
1. **Edit**: Tap anywhere on the item (except buttons) to edit
2. **Add to Library**: Save as template for reuse
3. **Delete**: Remove activity with undo support
4. **Completion Toggle**: Mark as complete/incomplete  
5. **Move**: Transfer between Today/Tomorrow (when in both days mode)

### Reordering
- Up/down arrow buttons for all platforms
- Clear visual feedback when moving items
- Smooth animations during reorder
- Position indicator (e.g., "3 of 10")

## Technical Architecture

### Component Structure
```
EditModeList/
├── index.js              # Single unified component for all platforms
├── EditModeListItem.js   # Unified list item component
├── styles.js             # Unified styles with tablet adjustments
├── utils.js              # Shared utilities (reorder, animations)
└── __tests__/           # Component tests
```

### Platform Implementation (Unified Approach)

#### Consistent Cross-Platform Design
Since Android has reliability issues with drag-and-drop in modals and we need consistent behavior across all platforms, ALL platforms will use the same button-based approach:

- **Primary Interaction**: Up/down arrow buttons for reordering
- **Visual Consistency**: Same list-based layout on all platforms
- **No Drag Handles**: Avoiding platform-specific drag implementations
- **Accessibility First**: Button-based approach works for all users
- **Predictable Behavior**: Users get the same experience everywhere

#### Benefits of Unified Approach
- No platform-specific bugs or quirks
- Easier to maintain and test
- Consistent user experience
- Better accessibility by default
- Simpler implementation

## Implementation Details

### Main Component (EditModeList)
```javascript
// src/components/EditModeList/index.js
import React from 'react';
import { FlatList, View, TouchableOpacity, Dimensions } from 'react-native';
import { EditModeListItem } from './EditModeListItem';
import { styles } from './styles';
import { useEditMode } from '../../hooks/useEditMode';

export default function EditModeList({ 
  activities, 
  onUpdate, 
  onEdit,
  onLibrary,
  onToggle,
  onMove,
  theme 
}) {
  const { handleMoveUp, handleMoveDown, handleDelete } = useEditMode(activities, onUpdate);
  
  const isTablet = () => {
    const { width, height } = Dimensions.get('window');
    return Math.min(width, height) >= 600;
  };
  
  const renderItem = ({ item, index }) => (
    <EditModeListItem
      item={item}
      index={index}
      totalCount={activities.length}
      onEdit={() => onEdit(item)}
      onDelete={() => handleDelete(item)}
      onToggle={() => onToggle(item)}
      onLibrary={() => onLibrary(item)}
      onMove={onMove ? () => onMove(item) : null}
      onMoveUp={() => handleMoveUp(index)}
      onMoveDown={() => handleMoveDown(index)}
      theme={theme}
      isTablet={isTablet()}
    />
  );
  
  return (
    <FlatList
      data={activities}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
    />
  );
}
```

### List Item Component
```javascript
// src/components/EditModeList/EditModeListItem.js
import React from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import MaterialIcons from '../VectorIcons';
import { styles, getTabletStyles } from './styles';

export const EditModeListItem = ({
  item, index, totalCount, onEdit, onDelete, onToggle, 
  onLibrary, onMove, onMoveUp, onMoveDown, theme, isTablet
}) => {
  const itemStyles = isTablet ? getTabletStyles() : styles;
  
  const handleDelete = () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Delete Activity',
        `Are you sure you want to delete "${item.text || item.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(item) }
        ]
      );
    } else {
      onDelete(item);
    }
  };
  
  return (
    <TouchableOpacity onPress={onEdit} style={itemStyles.listItem}>
      {/* Content Row */}
      <View style={itemStyles.contentRow}>
        <Text style={itemStyles.emoji}>{item.icon || item.emoji}</Text>
        <View style={itemStyles.textContent}>
          <Text style={itemStyles.title} numberOfLines={1}>
            {item.text || item.title}
          </Text>
          {item.description && (
            <Text style={itemStyles.description} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
      
      {/* Actions Row */}
      <View style={itemStyles.actionsRow}>
        {/* Reorder Buttons */}
        <View style={itemStyles.reorderButtons}>
          <TouchableOpacity
            onPress={() => onMoveUp(index)}
            disabled={index === 0}
            style={[itemStyles.reorderButton, index === 0 && itemStyles.disabled]}
          >
            <MaterialIcons 
              name="arrow-upward" 
              size={isTablet ? 24 : 20} 
              color={index === 0 ? '#ccc' : theme.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => onMoveDown(index)}
            disabled={index === totalCount - 1}
            style={[itemStyles.reorderButton, index === totalCount - 1 && itemStyles.disabled]}
          >
            <MaterialIcons 
              name="arrow-downward" 
              size={isTablet ? 24 : 20} 
              color={index === totalCount - 1 ? '#ccc' : theme.primary} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Action Buttons */}
        <View style={itemStyles.actionButtons}>
          <TouchableOpacity onPress={onToggle} style={itemStyles.actionButton}>
            <MaterialIcons 
              name={item.completed ? "check-box" : "check-box-outline-blank"} 
              size={isTablet ? 28 : 24} 
              color={theme.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onLibrary} style={itemStyles.actionButton}>
            <MaterialIcons name="library-add" size={isTablet ? 28 : 24} color={theme.primary} />
          </TouchableOpacity>
          
          {onMove && (
            <TouchableOpacity onPress={onMove} style={itemStyles.actionButton}>
              <MaterialIcons name="swap-horiz" size={isTablet ? 28 : 24} color={theme.primary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={handleDelete} style={itemStyles.actionButton}>
            <MaterialIcons name="delete" size={isTablet ? 28 : 24} color="#e53e3e" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};
```

### Shared Utilities
```javascript
// src/components/EditModeList/utils.js

export const reorderArray = (array, fromIndex, toIndex) => {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

export const moveItemUp = (array, index) => {
  if (index <= 0) return array;
  return reorderArray(array, index, index - 1);
};

export const moveItemDown = (array, index) => {
  if (index >= array.length - 1) return array;
  return reorderArray(array, index, index + 1);
};

export const triggerHaptic = (type = 'selection') => {
  if (Platform.OS === 'ios') {
    const Haptics = require('expo-haptics');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } else if (Platform.OS === 'android') {
    const { Vibration } = require('react-native');
    Vibration.vibrate(10);
  }
};
```

### Edit Mode Hook
```javascript
// src/hooks/useEditMode.js
import { useState, useCallback } from 'react';
import { moveItemUp, moveItemDown, triggerHaptic } from '../components/EditModeList/utils';

export const useEditMode = (initialActivities, onUpdate) => {
  const [activities, setActivities] = useState(initialActivities);
  const [undoStack, setUndoStack] = useState([]);
  
  const updateActivities = useCallback((newActivities) => {
    setUndoStack(prev => [...prev, activities].slice(-10));
    setActivities(newActivities);
    if (onUpdate) onUpdate(newActivities);
  }, [activities, onUpdate]);
  
  const handleMoveUp = useCallback((index) => {
    if (index <= 0) return;
    triggerHaptic('selection');
    const newActivities = moveItemUp(activities, index);
    updateActivities(newActivities);
  }, [activities, updateActivities]);
  
  const handleMoveDown = useCallback((index) => {
    if (index >= activities.length - 1) return;
    triggerHaptic('selection');
    const newActivities = moveItemDown(activities, index);
    updateActivities(newActivities);
  }, [activities, updateActivities]);
  
  const handleDelete = useCallback((item) => {
    triggerHaptic('warning');
    const newActivities = activities.filter(a => a.id !== item.id);
    updateActivities(newActivities);
  }, [activities, updateActivities]);
  
  return {
    activities,
    handleMoveUp,
    handleMoveDown,
    handleDelete,
  };
};
```

## Implementation Phases

### Phase 1: Core List View
- Basic list rendering
- Item layout with emoji, title, description
- Tap to edit functionality

### Phase 2: Action Buttons
- Add action button row
- Implement each action
- Add confirmation modals where needed

### Phase 3: Animations & Polish
- Add smooth reorder animations
- Implement haptic feedback
- Visual feedback for actions

### Phase 4: Testing & Optimization
- Performance optimization for large lists
- Accessibility enhancements
- Cross-platform testing

## Platform-Specific Considerations

### iOS (Phone & Tablet)
- Use native Alert.alert for confirmations
- Respect iOS design language
- Handle Safe Area insets
- iPad responsive layouts

### Android (Phone & Tablet)
- Use ConfirmModal instead of Alert.alert
- Follow Material Design guidelines
- Handle back button in edit mode
- Tablet responsive layouts

### Web (Desktop & Mobile)
- Mouse and touch support
- Keyboard navigation
- Responsive breakpoints
- PWA considerations

## Testing Strategy
- Unit tests for utility functions
- Component testing with Jest/Testing Library
- Platform-specific manual testing
- Accessibility testing
- Performance benchmarking with 100+ items

## Integration with App.js
```javascript
// Replace existing edit mode with:
{editMode && (
  <EditModeList
    activities={activities}
    onUpdate={setActivities}
    onEdit={handleEditActivity}
    onLibrary={handleAddToLibrary}
    onToggle={handleToggleComplete}
    onMove={dayMode === 'both' ? handleMoveDay : null}
    theme={theme}
  />
)}
```

## Performance Considerations
- Use React.memo for list items
- Implement proper keyExtractor
- Avoid frequent state updates
- Test with 100+ activities
- Use native driver for animations

## Accessibility Features
- Screen reader support
- High contrast compliance
- Large touch targets (44px minimum)
- Clear accessibility labels
- Keyboard navigation support

## Related Documentation
- [Field Conventions](./field-conventions.md) - Proper field naming
- [Typography System](./typography-system.md) - Font usage
- [Testing Guide](../testing/README.md) - Testing procedures