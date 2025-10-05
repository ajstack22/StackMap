import React, { useState, useEffect } from 'react';
import { Text } from '../Typography';
import {
  View,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { isTablet } from '../../constants';
import EmojiSearch, { performEmojiSearch } from './EmojiSearch';
import SearchResults from './SearchResults';
import CategoryTabs from './CategoryTabs';
import SkinToneSelector from './SkinToneSelector';
import { CUSTOM_IMAGES } from './constants';
import { styles } from './styles';

// Lazy-loaded emoji data - will be loaded asynchronously
let cachedEmojiData = null;
let cachedEmojiSearchIndex = null;
let cachedEmojiCategories = null;
let loadingPromise = null;

// Async function to load emoji data
const loadEmojiData = async () => {
  if (cachedEmojiData) {
    return {
      emojiData: cachedEmojiData,
      searchIndex: cachedEmojiSearchIndex,
      categories: cachedEmojiCategories,
    };
  }

  // If already loading, return the existing promise
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = (async () => {
    try {
      // Dynamic import to avoid blocking the main thread
      const emojiDataModule = await import('emoji-datasource-apple/emoji.json');
      const emojiData = emojiDataModule.default || emojiDataModule;

      cachedEmojiData = emojiData;
      cachedEmojiSearchIndex = createEmojiSearchIndex(emojiData);
      cachedEmojiCategories = buildEmojiCategories(emojiData);

      return {
        emojiData: cachedEmojiData,
        searchIndex: cachedEmojiSearchIndex,
        categories: cachedEmojiCategories,
      };
    } catch (error) {
      console.error('Failed to load emoji data:', error);
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
};

// Create emoji search index from emoji data
const createEmojiSearchIndex = (emojiData) => {
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

// Build comprehensive emoji categories from the full dataset
const buildEmojiCategories = (emojiData) => {
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
    // Skip obsolete emojis and skin tone variants (they contain 1F3FB-1F3FF in unified)
    if (emoji.unified && !emoji.obsoleted_by && !emoji.obsoletes) {
      // Filter out emojis that already have skin tone modifiers
      const hasSkinTone = /1F3F[B-F]/.test(emoji.unified);
      if (hasSkinTone) {
        return; // Skip skin tone variants - we'll apply them dynamically
      }

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
  const [categoryKeys, setCategoryKeys] = useState([]);
  const [selectedSkinTone, setSelectedSkinTone] = useState(null);
  const [detectedEmoji, setDetectedEmoji] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [emojiCategories, setEmojiCategories] = useState({});
  const [emojiSearchIndex, setEmojiSearchIndex] = useState({});

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

  // Load emoji data asynchronously when component mounts or becomes visible
  useEffect(() => {
    let isMounted = true;

    const initializeEmojiData = async () => {
      if (visible || mode === 'inline') {
        try {
          setIsLoading(true);
          const { categories, searchIndex } = await loadEmojiData();

          if (isMounted) {
            setEmojiCategories(categories);
            setEmojiSearchIndex(searchIndex);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Failed to initialize emoji data:', error);
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };

    initializeEmojiData();

    return () => {
      isMounted = false;
    };
  }, [visible, mode]);

  // Initialize categories with custom images
  useEffect(() => {
    if (Object.keys(emojiCategories).length === 0) {
      return;
    }

    const categories = { ...emojiCategories };

    if (showCustomImages) {
      // Add Custom category dynamically
      if (!categories.Custom) {
        categories.Custom = CUSTOM_IMAGES;
      }
    } else {
      // Remove Custom category if it exists
      if (categories.Custom) {
        delete categories.Custom;
      }
    }

    // Ensure all keys are valid strings
    const validKeys = Object.keys(categories).filter(
      key => typeof key === 'string' && key.trim().length > 0
    );
    setCategoryKeys(validKeys);
  }, [showCustomImages, isLoading]);

  // Filter items based on search
  useEffect(() => {
    if (isLoading || Object.keys(emojiCategories).length === 0) {
      return;
    }

    if (searchQuery) {
      const { filteredItems: searchResults, detectedEmoji: searchDetectedEmoji } =
        performEmojiSearch(searchQuery, emojiCategories, emojiSearchIndex);
      setFilteredItems(searchResults);
      setDetectedEmoji(searchDetectedEmoji);
    } else {
      // No search, show selected category
      setDetectedEmoji('');
      const items = emojiCategories[selectedCategory] || [];
      setFilteredItems(
        items.map(item =>
          typeof item === 'string'
            ? { type: 'emoji', icon: item, category: selectedCategory }
            : { type: 'image', ...item, category: selectedCategory },
        ),
      );
    }
  }, [searchQuery, selectedCategory, isLoading, emojiCategories, emojiSearchIndex]);

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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme?.primary || '#007AFF'} />
          <Text style={styles.loadingText}>Loading emojis...</Text>
        </View>
      ) : (
        <>
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

          {/* Skin Tone Selector - Disabled for now */}
          {/* {selectedCategory === 'People' && !searchQuery && (
            <SkinToneSelector
              selectedSkinTone={selectedSkinTone}
              onSelectSkinTone={setSelectedSkinTone}
            />
          )} */}

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
        </>
      )}
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