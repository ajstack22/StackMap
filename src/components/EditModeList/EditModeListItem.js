import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles, getTabletStyles } from './styles';

export const EditModeListItem = React.memo(({
  item,
  index,
  totalCount,
  onEdit,
  onDelete,
  onToggle,
  onLibrary,
  onMove,
  onMoveUp,
  onMoveDown,
  theme,
  isTablet
}) => {
  const itemStyles = isTablet ? getTabletStyles() : styles;
  
  const handleDelete = () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Delete Activity',
        `Are you sure you want to delete "${item.text || item.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete }
        ]
      );
    } else {
      // For Android and Web, parent should show ConfirmModal
      onDelete();
    }
  };
  
  return (
    <TouchableOpacity
      onPress={onEdit}
      activeOpacity={0.7}
      style={itemStyles.listItem}
    >
      {/* Main content area */}
      <View style={itemStyles.contentRow}>
        <Text style={itemStyles.emoji}>{item.emoji || item.icon || '📝'}</Text>
        <View style={itemStyles.textContent}>
          <Text style={itemStyles.title} numberOfLines={1}>
            {item.text || item.title || 'Untitled'}
          </Text>
          {item.description && (
            <Text style={itemStyles.description} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        
        {/* Position indicator */}
        <Text style={itemStyles.positionText}>
          {index + 1} of {totalCount}
        </Text>
      </View>
      
      {/* Unified actions row */}
      <View style={itemStyles.actionsRow}>
        {/* Reorder buttons - consistent across all platforms */}
        <View style={itemStyles.reorderButtons}>
          <TouchableOpacity
            onPress={() => onMoveUp(index)}
            disabled={index === 0}
            style={[itemStyles.reorderButton, index === 0 && itemStyles.disabled]}
            accessibilityLabel="Move up"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon 
              name="arrow-upward" 
              size={isTablet ? 24 : 20} 
              color={index === 0 ? '#ccc' : theme.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => onMoveDown(index)}
            disabled={index === totalCount - 1}
            style={[itemStyles.reorderButton, index === totalCount - 1 && itemStyles.disabled]}
            accessibilityLabel="Move down"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon 
              name="arrow-downward" 
              size={isTablet ? 24 : 20} 
              color={index === totalCount - 1 ? '#ccc' : theme.primary} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Other actions */}
        <View style={itemStyles.actionButtons}>
          <TouchableOpacity
            onPress={onToggle}
            style={itemStyles.actionButton}
            accessibilityLabel={item.completed ? "Mark incomplete" : "Mark complete"}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon 
              name={item.completed ? "check-box" : "check-box-outline-blank"} 
              size={isTablet ? 28 : 24} 
              color={theme.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onLibrary}
            style={itemStyles.actionButton}
            accessibilityLabel="Add to library"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon 
              name="library-add" 
              size={isTablet ? 28 : 24} 
              color={theme.primary} 
            />
          </TouchableOpacity>
          
          {onMove && (
            <TouchableOpacity
              onPress={onMove}
              style={itemStyles.actionButton}
              accessibilityLabel="Move to tomorrow"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon 
                name="swap-horiz" 
                size={isTablet ? 28 : 24} 
                color={theme.primary} 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={handleDelete}
            style={itemStyles.actionButton}
            accessibilityLabel="Delete activity"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon 
              name="delete" 
              size={isTablet ? 28 : 24} 
              color="#e53e3e" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});