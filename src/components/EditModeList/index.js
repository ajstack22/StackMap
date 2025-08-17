// @ts-check
import React, { useMemo } from 'react';
import { FlatList, View, Dimensions, Platform } from 'react-native';
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
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={10}
      initialNumToRender={10}
    />
  );
}
