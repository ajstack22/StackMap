import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput } from '../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
} from '../../constants';

/**
 * SearchBar component for filtering activities and categories
 * Provides a text input with search icon and clear functionality
 */
const SearchBar = ({
  searchQuery,
  onSearchChange,
  onSearchClear,
  placeholder = 'Search activities...',
  style,
  testID,
}) => {
  return (
    <View style={[styles.searchContainer, style]} testID={testID}>
      <Icon
        name="search"
        size={20}
        color={COLORS.gray[500]}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray[500]}
        value={searchQuery}
        onChangeText={onSearchChange}
        returnKeyType="search"
        accessibilityLabel="Search input"
        accessibilityHint="Type to search through activities and categories"
        testID="search-input"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onSearchClear}
          accessibilityLabel="Clear search"
          accessibilityHint="Tap to clear the search query"
          testID="clear-search-button"
        >
          <Icon name="clear" size={20} color={COLORS.gray[500]} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet() ? 16 : 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    paddingVertical: SPACING.sm,
  },
  clearButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
});

export default SearchBar;