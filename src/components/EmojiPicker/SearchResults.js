import React from 'react';
import { Text } from '../Typography';
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
  getCustomImageSource,
} from '../../constants';
import { applySkinTone, supportsSkinTone } from './skinToneUtils';

const SearchResults = ({
  filteredItems,
  numColumns,
  selectedCategory,
  selectedSkinTone,
  selectedEmoji,
  onSelect,
  isSearching = false,
}) => {
  const renderItem = ({ item }) => {
    if (item.type === 'placeholder') {
      return <View style={styles.emojiItem} testID={`placeholder-${item.id}`} />;
    }

    // Apply skin tone if applicable
    let displayEmoji = item.icon;
    if (
      item.type === 'emoji' &&
      selectedCategory === 'People' &&
      selectedSkinTone &&
      supportsSkinTone(item.icon)
    ) {
      displayEmoji = applySkinTone(item.icon, selectedSkinTone);
    }

    const isSelected =
      item.type === 'emoji'
        ? selectedEmoji === displayEmoji
        : selectedEmoji === `image:${item.src}`;

    return (
      <TouchableOpacity
        style={[styles.emojiItem, isSelected && styles.selectedItem]}
        onPress={() =>
          onSelect(
            item.type === 'emoji' ? { ...item, icon: displayEmoji } : item,
          )
        }
      >
        {item.type === 'emoji' ? (
          <Text style={styles.emoji}>{displayEmoji}</Text>
        ) : (
          <Image
            source={getCustomImageSource(item.src)}
            style={styles.customImage}
            resizeMode="contain"
            testID={`custom-image-${item.src}`}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Prepare data with placeholders for proper grid alignment
  const prepareGridData = items => {
    const itemsWithPlaceholders = [...items];
    const remainder = itemsWithPlaceholders.length % numColumns;
    if (remainder !== 0) {
      for (let i = 0; i < numColumns - remainder; i++) {
        itemsWithPlaceholders.push({ type: 'placeholder', id: `placeholder-${i}` });
      }
    }
    return itemsWithPlaceholders;
  };

  const gridData = prepareGridData(filteredItems);

  return (
    <View style={styles.container} testID="search-results-container">
      <FlatList
        data={gridData}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.type === 'emoji'
            ? item.icon
            : item.type === 'placeholder'
            ? item.id
            : item.src
        }
        numColumns={numColumns}
        contentContainerStyle={styles.emojiGrid}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        windowSize={
          Platform.OS === 'web' ? 21 : Platform.OS === 'android' ? 10 : 21
        }
        maxToRenderPerBatch={
          Platform.OS === 'web' ? 50 : Platform.OS === 'android' ? 10 : 15
        }
        initialNumToRender={Platform.OS === 'web' ? 50 : 20}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  emojiGrid: {
    paddingVertical: SPACING.md,
    paddingHorizontal: Platform.OS === 'android' ? SPACING.sm : SPACING.md,
    paddingBottom: Platform.OS === 'android' ? 80 : SPACING.md, // Extra bottom padding for Android
  },
  emojiItem: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin:
      Platform.OS === 'web'
        ? 4
        : Platform.OS === 'android'
        ? 2
        : isTablet()
        ? SPACING.xs
        : 3,
    borderRadius: RADIUS.md,
    minHeight:
      Platform.OS === 'web'
        ? 56
        : isTablet()
        ? 64
        : Platform.OS === 'android'
        ? 52
        : 60,
  },
  selectedItem: {
    backgroundColor: COLORS.gray[200],
  },
  emoji: {
    fontSize:
      Platform.OS === 'web'
        ? 28
        : isTablet()
        ? 42
        : Platform.OS === 'android'
        ? 28
        : 32,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'center',
  },
  customImage: {
    width: isTablet() ? 48 : 36,
    height: isTablet() ? 48 : 36,
  },
});

export default SearchResults;