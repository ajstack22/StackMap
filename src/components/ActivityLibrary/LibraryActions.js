import React from 'react';
import { View, StyleSheet } from 'react-native';
import SearchBar from './SearchBar';
import SortControls from './SortControls';
import {
  SPACING,
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
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSearchClear={onSearchClear}
        style={styles.searchBarContainer}
      />
      <SortControls
        isSortMode={isSortMode}
        onSortToggle={onSortToggle}
        theme={theme}
      />
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
  searchBarContainer: {
    flex: 1,
  },
});

export default LibraryActions;