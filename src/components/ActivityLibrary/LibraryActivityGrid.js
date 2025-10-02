import React from 'react';
import { Text } from '../Typography';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LibraryActivityCard from './LibraryActivityCard';
import EmptyState, { getEmptyStateMessage } from './EmptyState';
import { getFilteredActivities } from './FilterControls';
import {
  TYPOGRAPHY,
  SPACING,
  COLORS,
  getCustomImageSource,
} from '../../constants';

// Use standard FlatList for all platforms (draggable functionality handled externally)
let DraggableFlatList = FlatList;
let ScaleDecorator = ({ children }) => children;

// Simplified loader function for compatibility
const loadDragComponents = () => {
  return {
    DraggableFlatList: FlatList,
    ScaleDecorator: ({ children }) => children,
  };
};

// Helper function to render drag-enabled activity item
const renderDragActivity = ({ item, isActive }) => {
  return (
    <TouchableOpacity
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
  );
};

// Helper function to render normal activity items
const renderNormalActivities = ({
  activities,
  onEditActivity,
  onDeleteActivity,
  onQuickAdd,
  theme,
  categoryId,
}) => {
  return activities.map((activity, originalIndex) => (
    <LibraryActivityCard
      key={activity.id}
      activity={activity}
      onEdit={onEditActivity}
      onDelete={activity => onDeleteActivity(categoryId, activity)}
      onQuickAdd={onQuickAdd}
      theme={theme}
    />
  ));
};

// Main ActivityGrid component
const ActivityGrid = ({
  category,
  isEditingCategory = false,
  orderedActivities = [],
  setOrderedActivities,
  searchQuery = '',
  onEditActivity,
  onDeleteActivity,
  onQuickAdd,
  theme,
}) => {
  // Load drag components if needed
  const { DraggableFlatList: DraggableList, ScaleDecorator: Decorator } =
    loadDragComponents();
  if (!DraggableFlatList) DraggableFlatList = DraggableList;
  if (!ScaleDecorator) ScaleDecorator = Decorator;

  // Handle edit mode with drag-and-drop
  if (isEditingCategory) {
    if (orderedActivities.length) {
      return (
        <DraggableFlatList
          data={orderedActivities}
          onDragEnd={
            Platform.OS === 'android'
              ? undefined
              : ({ data }) => setOrderedActivities && setOrderedActivities(data)
          }
          keyExtractor={item => item.id}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator>
              {renderDragActivity({ item, isActive })}
            </ScaleDecorator>
          )}
        />
      );
    } else {
      return (
        <EmptyState message="No activities yet. Tap + to add one." />
      );
    }
  }

  // Handle normal display mode
  const filteredActivities = getFilteredActivities(category.activities, searchQuery);

  if (!category.activities.length) {
    return <EmptyState message="No activities yet. Tap + to add one." />;
  }

  if (category.activities.length && !filteredActivities.length) {
    return <EmptyState message="No activities match your search." />;
  }

  // Render filtered activities
  return (
    <View style={styles.activitiesContainer}>
      {renderNormalActivities({
        activities: filteredActivities,
        onEditActivity,
        onDeleteActivity,
        onQuickAdd,
        theme,
        categoryId: category.id,
      })}
    </View>
  );
};

// Export helper functions for external use
export {
  renderDragActivity,
  renderNormalActivities,
  getEmptyStateMessage,
  loadDragComponents,
};

const styles = StyleSheet.create({
  activitiesContainer: {
    maxWidth: 375,
    width: '100%',
    alignSelf: 'center',
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs / 2,
    // Platform-specific alignment for proper grid layout
    ...Platform.select({
      android: { alignContent: 'flex-start' },
      ios: {},
      web: { alignContent: 'flex-start' },
    }),
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderRadius: 12,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityEmoji: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginRight: SPACING.sm,
  },
  activityImage: {
    width: 24,
    height: 24,
    marginRight: SPACING.sm,
  },
  activityName: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
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
});

export default ActivityGrid;