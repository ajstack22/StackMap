import React, { useState, useEffect } from 'react';
import { Text } from '../Typography';
import {
  View,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { isTablet } from '../../constants';
import emojiData from 'emoji-datasource-apple/emoji.json';
import EmojiSearch, { performEmojiSearch } from './EmojiSearch';
import SearchResults from './SearchResults';
import CategoryTabs from './CategoryTabs';
import SkinToneSelector from './SkinToneSelector';
import { CUSTOM_IMAGES } from './constants';
import { styles } from './styles';

// Create emoji search index from emoji data
const createEmojiSearchIndex = () => {
  const searchIndex = {};
  emojiData.forEach(emoji => {
    if (emoji.unified) {
      // Convert unified code to actual emoji
      const emojiChar = String.fromCodePoint(
        ...emoji.unified.split('-').map(u => parseInt(u, 16)),
      );

      // Index by short names, keywords, and category
      const searchTerms = [
        ...(emoji.short_names || []),
        ...(emoji.keywords || []),
        emoji.category,
      ];

      searchIndex[emojiChar] = {
        emoji: emojiChar,
        shortNames: emoji.short_names || [],
        keywords: emoji.keywords || [],
        category: emoji.category,
      };
    }
  });
  return searchIndex;
};

const EMOJI_SEARCH_INDEX = createEmojiSearchIndex();

// Build comprehensive emoji categories from the full dataset
const buildEmojiCategories = () => {
  const categories = {
    People: [],
    Nature: [],
    Food: [],
    Activities: [],
    Travel: [],
    Objects: [],
    Symbols: [],
    Flags: [],
  };

  // Category mapping from emoji-datasource to our display categories
  const categoryMap = {
    'Smileys & Emotion': 'People',
    'People & Body': 'People',
    'Animals & Nature': 'Nature',
    'Food & Drink': 'Food',
    'Travel & Places': 'Travel',
    'Activities': 'Activities',
    'Objects': 'Objects',
    'Symbols': 'Symbols',
    'Flags': 'Flags',
  };

  emojiData.forEach(emoji => {
    if (emoji.unified && !emoji.obsoleted_by && !emoji.obsoletes) {
      const emojiChar = String.fromCodePoint(
        ...emoji.unified.split('-').map(u => parseInt(u, 16)),
      );

      const targetCategory = categoryMap[emoji.category];
      if (targetCategory && categories[targetCategory]) {
        categories[targetCategory].push(emojiChar);
      }
    }
  });

  return categories;
};

const EMOJI_CATEGORIES = buildEmojiCategories();

const EmojiPickerMain = ({
  visible = false,
  onClose,
  onSelect,
  mode = 'modal', // 'modal' or 'inline'
  theme,
  selectedEmoji,
  showCustomImages = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('People');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [categoryKeys, setCategoryKeys] = useState(
    Object.keys(EMOJI_CATEGORIES),
  );
  const [selectedSkinTone, setSelectedSkinTone] = useState(null);
  const [detectedEmoji, setDetectedEmoji] = useState('');

  // Calculate columns based on screen size and platform
  const numColumns =
    Platform.OS === 'web'
      ? isTablet()
        ? 10
        : 8
      : isTablet()
      ? 10
      : Platform.OS === 'android'
      ? 6
      : 5;

  // Initialize categories with custom images
  useEffect(() => {
    if (showCustomImages) {
      // Add Custom category dynamically
      if (!EMOJI_CATEGORIES.Custom) {
        EMOJI_CATEGORIES.Custom = CUSTOM_IMAGES;
      }
      setCategoryKeys(Object.keys(EMOJI_CATEGORIES));
      setSelectedCategory('People');
    } else {
      // Remove Custom category if it exists
      if (EMOJI_CATEGORIES.Custom) {
        delete EMOJI_CATEGORIES.Custom;
      }
      setCategoryKeys(Object.keys(EMOJI_CATEGORIES));
      setSelectedCategory('People');
    }
  }, [showCustomImages]);

  // Filter items based on search
  useEffect(() => {
    if (searchQuery) {
      const { filteredItems: searchResults, detectedEmoji: searchDetectedEmoji } =
        performEmojiSearch(searchQuery, EMOJI_CATEGORIES, EMOJI_SEARCH_INDEX);
      setFilteredItems(searchResults);
      setDetectedEmoji(searchDetectedEmoji);
    } else {
      // No search, show selected category
      setDetectedEmoji('');
      const items = EMOJI_CATEGORIES[selectedCategory] || [];
      setFilteredItems(
        items.map(item =>
          typeof item === 'string'
            ? { type: 'emoji', icon: item, category: selectedCategory }
            : { type: 'image', ...item, category: selectedCategory },
        ),
      );
    }
  }, [searchQuery, selectedCategory]);

  const handleSelect = item => {
    if (item.type === 'emoji') {
      onSelect(item.icon);
    } else {
      // For custom images, we'll use a special format
      onSelect(`image:${item.src}`);
    }
    if (mode === 'modal') {
      onClose();
    }
    setSearchQuery('');
  };

  const content = (
    <View
      style={[styles.container, mode === 'inline' && styles.inlineContainer]}
    >
      {/* Header */}
      {mode === 'modal' && (
        <View style={styles.header}>
          <Text style={styles.title}>Choose an emoji</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Component */}
      <EmojiSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        detectedEmoji={detectedEmoji}
        onSelectDetectedEmoji={() => handleSelect({ type: 'emoji', icon: detectedEmoji })}
        theme={theme}
      />

      {/* Category Tabs */}
      {!searchQuery && (
        <CategoryTabs
          categories={categoryKeys}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}

      {/* Skin Tone Selector */}
      {selectedCategory === 'People' && !searchQuery && (
        <SkinToneSelector
          selectedSkinTone={selectedSkinTone}
          onSelectSkinTone={setSelectedSkinTone}
        />
      )}

      {/* Search Results Grid */}
      <SearchResults
        filteredItems={filteredItems}
        numColumns={numColumns}
        selectedCategory={selectedCategory}
        selectedSkinTone={selectedSkinTone}
        selectedEmoji={selectedEmoji}
        onSelect={handleSelect}
        isSearching={!!searchQuery}
      />
    </View>
  );

  if (mode === 'inline') {
    return content;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalContent}
          onPress={e => e.stopPropagation()}
        >
          {content}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default EmojiPickerMain;