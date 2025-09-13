// @ts-check
import React from 'react';
import { View, TouchableOpacity, Platform, Alert } from 'react-native';
import { Text } from '../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles, getTabletStyles } from './styles';

/**
 * @typedef {Object} EditModeListItemProps
 * @property {any} item
 * @property {number} index
 * @property {number} totalCount
 * @property {() => void} onEdit
 * @property {() => void} onDelete
 * @property {() => void} onToggle
 * @property {() => void} onLibrary
 * @property {(index: number) => void} onMoveUp
 * @property {(index: number) => void} onMoveDown
 * @property {any} theme
 * @property {boolean} isTablet
 * @property {string} displayMode
 */

export const EditModeListItem = React.memo(
  /**
   * @param {EditModeListItemProps} props
   */
  ({
    item,
    index,
    totalCount,
    onEdit,
    onDelete,
    onToggle,
    onLibrary,
    onMoveUp,
    onMoveDown,
    theme,
    isTablet,
    displayMode,
  }) => {
    const itemStyles = isTablet ? getTabletStyles() : styles;

    const handleDelete = () => {
      if (Platform.OS === 'ios') {
        Alert.alert(
          'Delete Activity',
          `Are you sure you want to delete "${
            item.text || item.name || item.title
          }"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ],
        );
      } else {
        // For Android and Web, parent should show ConfirmModal
        onDelete();
      }
    };

    return (
      <View style={itemStyles.listItem}>
        {/* Main content area */}
        <View style={itemStyles.contentRow}>
          <Text style={itemStyles.emoji}>{item.icon || '📝'}</Text>
          <View style={itemStyles.textContent}>
            <Text style={itemStyles.title} numberOfLines={1}>
              {item.text || item.name || item.title || 'Untitled'}
            </Text>
            {item.description && (
              <Text style={itemStyles.description} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>

          {/* Edit button - more prominent, replacing position indicator */}
          <TouchableOpacity
            onPress={onEdit}
            style={itemStyles.editButton}
            accessibilityLabel="Edit activity"
            accessibilityRole="button"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View
              style={[
                itemStyles.editButtonCircle,
                { backgroundColor: theme.primary },
              ]}
            >
              <Icon name="edit" size={isTablet ? 26 : 22} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Unified actions row */}
        <View style={itemStyles.actionsRow}>
          {/* Reorder buttons - consistent across all platforms */}
          <View style={itemStyles.reorderButtons}>
            <TouchableOpacity
              onPress={() => onMoveUp(index)}
              disabled={index === 0}
              style={[
                itemStyles.reorderButton,
                index === 0 && itemStyles.disabled,
              ]}
              accessibilityLabel="Move up"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View
                style={[
                  itemStyles.actionCircle,
                  index === 0 && itemStyles.disabledCircle,
                ]}
              >
                <Icon
                  name="arrow-upward"
                  size={isTablet ? 24 : 20}
                  color={index === 0 ? '#ccc' : theme.primary}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onMoveDown(index)}
              disabled={index === totalCount - 1}
              style={[
                itemStyles.reorderButton,
                index === totalCount - 1 && itemStyles.disabled,
              ]}
              accessibilityLabel="Move down"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View
                style={[
                  itemStyles.actionCircle,
                  index === totalCount - 1 && itemStyles.disabledCircle,
                ]}
              >
                <Icon
                  name="arrow-downward"
                  size={isTablet ? 24 : 20}
                  color={index === totalCount - 1 ? '#ccc' : theme.primary}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Other actions */}
          <View style={itemStyles.actionButtons}>
            {/* Number/Time Badge - aligned with other action buttons */}
            {displayMode !== 'none' && (
              <View style={itemStyles.actionButton}>
                <View
                  style={[
                    itemStyles.actionCircle,
                    { backgroundColor: theme.primary },
                    displayMode === 'time' && itemStyles.timeBadge,
                  ]}
                >
                  <Text style={itemStyles.numberText}>
                    {displayMode === 'time' ? item.time || '--:--' : index + 1}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={onToggle}
              style={itemStyles.actionButton}
              accessibilityLabel={
                item.completed ? 'Mark incomplete' : 'Mark complete'
              }
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View
                style={[
                  itemStyles.completionCircle,
                  item.completed && [
                    itemStyles.completionCircleCompleted,
                    { backgroundColor: theme.primary },
                  ],
                ]}
              >
                <Text
                  style={[
                    itemStyles.checkmark,
                    !item.completed && [
                      itemStyles.checkmarkIncomplete,
                      { color: theme.primary },
                    ],
                  ]}
                >
                  ✓
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onLibrary}
              style={itemStyles.actionButton}
              accessibilityLabel={
                item.addedToLibrary ? 'Already in library' : 'Add to library'
              }
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View
                style={[
                  itemStyles.actionCircle,
                  item.addedToLibrary && [
                    itemStyles.bookmarkAdded,
                    { backgroundColor: theme.primary },
                  ],
                ]}
              >
                <Icon
                  name="bookmark"
                  size={isTablet ? 24 : 20}
                  color={item.addedToLibrary ? '#fff' : theme.primary}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={itemStyles.actionButton}
              accessibilityLabel="Delete activity"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View style={itemStyles.actionCircle}>
                <Icon name="delete" size={isTablet ? 24 : 20} color="#e53e3e" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
  // Custom comparison for better performance on Android
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.text === nextProps.item.text &&
      prevProps.item.description === nextProps.item.description &&
      prevProps.item.icon === nextProps.item.icon &&
      prevProps.item.completed === nextProps.item.completed &&
      prevProps.item.addedToLibrary === nextProps.item.addedToLibrary &&
      prevProps.item.time === nextProps.item.time &&
      prevProps.index === nextProps.index &&
      prevProps.totalCount === nextProps.totalCount &&
      prevProps.theme.primary === nextProps.theme.primary &&
      prevProps.isTablet === nextProps.isTablet &&
      prevProps.displayMode === nextProps.displayMode
    );
  },
);
