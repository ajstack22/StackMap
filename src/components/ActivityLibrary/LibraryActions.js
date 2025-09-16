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

const LibraryActions = ({
  searchQuery,
  onSearchChange,
  onSearchClear,
  isSortMode,
  onSortToggle,
  theme,
}) => {
  return (
    <View style={styles.actionsContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon
          name="search"
          size={20}
          color={COLORS.gray[500]}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search activities..."
          placeholderTextColor={COLORS.gray[500]}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onSearchClear}
            accessibilityLabel="Clear search"
          >
            <Icon name="clear" size={20} color={COLORS.gray[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Toggle Button */}
      <TouchableOpacity
        style={[
          styles.sortButton,
          isSortMode && [styles.activeSortButton, { backgroundColor: theme.primary }],
        ]}
        onPress={onSortToggle}
        accessibilityLabel={isSortMode ? "Exit sort mode" : "Enter sort mode"}
      >
        <Icon
          name={isSortMode ? "check" : "sort"}
          size={20}
          color={isSortMode ? "white" : COLORS.gray[600]}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flex: 1,
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
  sortButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
  },
  activeSortButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default LibraryActions;