// @ts-check
import React, { useMemo } from 'react';
import { FlatList, Dimensions, Platform } from 'react-native';
import { EditModeListItem } from './EditModeListItem';
import { styles } from './styles';
import { useEditMode } from '../../hooks/useEditMode';

export default function EditModeList({
  activities,
  onUpdate,
  onEdit,
  onLibrary,
  onToggle,
  onDelete,
  theme,
  contentPadding,
  displayMode,
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

  const renderItem = ({ item, index }) => (
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
      displayMode={displayMode}
    />
  );

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
      // Android performance optimizations
      removeClippedSubviews={Platform.OS === 'android'}
      maxToRenderPerBatch={Platform.OS === 'android' ? 5 : 10} // Smaller batches on Android
      updateCellsBatchingPeriod={Platform.OS === 'android' ? 100 : 50} // More time between batches
      windowSize={Platform.OS === 'android' ? 5 : 10} // Smaller window on Android
      initialNumToRender={Platform.OS === 'android' ? 8 : 10}
      // Additional Android optimizations
      legacyImplementation={false}
      disableVirtualization={false}
      directionalLockEnabled={true}
      scrollEventThrottle={16} // Better touch responsiveness
    />
  );
}
