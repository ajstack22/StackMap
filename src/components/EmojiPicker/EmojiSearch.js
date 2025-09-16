import React from 'react';
import { Text, TextInput } from '../Typography';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
} from '../../constants';

// Helper function to detect if a string contains emoji
const containsEmoji = text => {
  // Unicode ranges for emoji detection
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{2460}-\u{24FF}]|[\u{2B50}]/gu;
  return emojiRegex.test(text);
};

// Helper function to extract emojis from text
const extractEmojis = text => {
  // More comprehensive emoji regex that works on both iOS and Android
  // Includes emoji sequences, modifiers, and zero-width joiners
  const emojiRegex =
    /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Component})+/gu;
  const matches = text.match(emojiRegex);
  if (!matches) return '';

  // Filter out non-visible characters and join the results
  const emojis = matches
    .filter(match => {
      // Remove any standalone variation selectors or zero-width joiners
      return match && match.trim() && !/^[\uFE0F\u200D]+$/.test(match);
    })
    .join('');

  return emojis;
};

// Search filtering function
export const performEmojiSearch = (searchQuery, emojiCategories, emojiSearchIndex) => {
  if (!searchQuery) {
    return { filteredItems: [], detectedEmoji: '' };
  }

  // Check if the search query contains emoji(s)
  const extractedEmojis = extractEmojis(searchQuery);
  const detectedEmoji = extractedEmojis || '';

  const query = searchQuery.toLowerCase();
  const filtered = [];

  // Search all categories when there's a search query
  Object.entries(emojiCategories).forEach(([category, items]) => {
    items.forEach(item => {
      if (typeof item === 'string') {
        // For emojis, check if search terms match
        const emojiInfo = emojiSearchIndex[item];
        if (emojiInfo) {
          const matches = emojiInfo.searchTerms.some(term =>
            term.includes(query),
          );
          if (matches || item.includes(searchQuery)) {
            filtered.push({ type: 'emoji', icon: item, category });
          }
        }
      } else {
        // For custom images
        if (item.name.toLowerCase().includes(query)) {
          filtered.push({ type: 'image', ...item, category });
        }
      }
    });
  });

  return { filteredItems: filtered, detectedEmoji };
};

const EmojiSearch = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  detectedEmoji,
  onSelectDetectedEmoji,
  theme,
}) => {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search, type, or paste emoji..."
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholderTextColor="#999"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          keyboardType="default"
          autoFocus={false}
          enablesReturnKeyAutomatically={true}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={onClearSearch} testID="clear-search">
            <Icon name="close" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Detected Emoji Result */}
      {!!detectedEmoji && !!searchQuery && (
        <View style={styles.detectedEmojiContainer}>
          <Text style={styles.detectedEmojiLabel}>Tap to use your emoji:</Text>
          <TouchableOpacity
            style={[
              styles.detectedEmojiButton,
              { backgroundColor: theme?.light || '#E8F0FE' },
            ]}
            onPress={onSelectDetectedEmoji}
            activeOpacity={0.7}
          >
            <Text style={styles.detectedEmoji}>{detectedEmoji}</Text>
            <Icon
              name="check-circle"
              size={24}
              color={theme?.primary || '#667eea'}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
          <Text style={styles.detectedEmojiHint}>
            You can type or paste any emoji!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    margin: SPACING.md,
    marginHorizontal: isTablet() ? SPACING.xl : SPACING.md,
    height: isTablet() ? 48 : 40,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: isTablet() ? TYPOGRAPHY.sizes.lg : TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[900],
    ...(Platform.OS === 'android' && {
      textAlignVertical: 'center',
    }),
  },
  detectedEmojiContainer: {
    paddingHorizontal: isTablet() ? SPACING.xl : SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detectedEmojiLabel: {
    fontSize: isTablet() ? TYPOGRAPHY.sizes.sm : TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  detectedEmojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  detectedEmoji: {
    fontSize: isTablet() ? 48 : 40,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  detectedEmojiHint: {
    fontSize: isTablet() ? TYPOGRAPHY.sizes.xs : 11,
    color: COLORS.gray[500],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginTop: SPACING.xs,
  },
});

export default EmojiSearch;