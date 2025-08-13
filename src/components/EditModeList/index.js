import React, { useMemo, useEffect, useRef } from 'react';
import { 
  FlatList, 
  View,
  Dimensions,
  Platform,
  Animated 
} from 'react-native';
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
  theme 
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  const {
    handleMoveUp,
    handleMoveDown,
    handleDelete,
  } = useEditMode(activities, onUpdate);
  
  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
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
      onDelete={() => onDelete ? onDelete(item) : handleDelete(item)}
      onToggle={() => onToggle(item)}
      onLibrary={() => onLibrary(item)}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      theme={theme}
      isTablet={isTablet()}
    />
  );
  
  // Memoize key extractor for performance
  const keyExtractor = useMemo(() => (item) => item.id, []);
  
  return (
    <Animated.View 
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <FlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[
          styles.listContainer,
          { 
            flexGrow: 1,
            ...(Platform.OS === 'web' && { alignItems: 'stretch' })
          }
        ]}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={10}
      />
    </Animated.View>
  );
}