// @ts-check
import React, { useMemo } from 'react';
import { FlatList, View, Dimensions, Platform, Animated } from 'react-native';
import { EditModeListItem } from './EditModeListItem';
import { styles } from './styles';
import { useEditMode } from '../../hooks/useEditMode';
import { ANIMATION_TIMING, ANIMATION_EASING } from '../../utils/animationUtils';

const AnimatedEditModeListItem = Animated.createAnimatedComponent(View);

export default function AnimatedEditModeList({
  activities,
  onUpdate,
  onEdit,
  onLibrary,
  onToggle,
  onDelete,
  theme,
  contentPadding,
  listItemAnimations = [],
}) {
  const { handleMoveUp, handleMoveDown, handleDelete } = useEditMode(
    activities,
    onUpdate,
  );

  // Detect if we need to adjust for tablets
  const isTablet = () => {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = width / height;
    return Math.min(width, height) >= 600 && aspectRatio > 1.2;
  };

  const renderItem = ({ item, index }) => {
    // Get the animation value for this item
    const animValue = listItemAnimations[index] || new Animated.Value(1);
    
    // Create interpolated values for staggered entrance
    const opacity = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    
    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });
    
    const scale = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.95, 1.02, 1],
    });

    return (
      <AnimatedEditModeListItem
        style={{
          opacity,
          transform: [
            { translateY },
            { scale }
          ],
        }}
      >
        <EditModeListItem
          item={item}
          index={index}
          totalCount={activities.length}
          onEdit={() => onEdit(item)}
          onDelete={() => (onDelete ? onDelete(item) : handleDelete(item))}
          onToggle={() => onToggle(item)}
          onLibrary={() => onLibrary(item)}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          theme={theme}
          isTablet={isTablet()}
        />
      </AnimatedEditModeListItem>
    );
  };

  // Memoize key extractor for performance
  const keyExtractor = useMemo(() => item => item.id, []);

  return (
    <FlatList
      data={activities}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      // No separator between items
      contentContainerStyle={[
        styles.listContainer,
        {
          flexGrow: 1,
          ...(Platform.OS === 'web' && { alignItems: 'stretch' }),
          ...contentPadding,
        },
      ]}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={10}
      initialNumToRender={10}
    />
  );
}