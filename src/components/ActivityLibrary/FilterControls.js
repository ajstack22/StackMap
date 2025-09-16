import React from 'react';

/**
 * FilterControls component that provides filtering logic for activities and categories
 * Contains utility functions and hooks for managing filter state
 */

/**
 * Filter activities based on search query
 * @param {Array} activities - Array of activity objects
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered activities
 */
export const getFilteredActivities = (activities, searchQuery) => {
  if (!searchQuery) return activities;

  const query = searchQuery.toLowerCase();
  return activities.filter(activity => {
    const activityIcon = activity.icon || '';
    return (
      (activity.text || '').toLowerCase().includes(query) ||
      activityIcon.includes(searchQuery)
    );
  });
};

/**
 * Filter categories based on search query
 * Filters by category name and activities within categories
 * @param {Array} categories - Array of category objects
 * @param {Object} stackMapLibrary - StackMap library data
 * @param {string} activeTab - Current active tab ('stackmap' or 'mylibrary')
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered categories
 */
export const getFilteredCategories = (categories, stackMapLibrary, activeTab, searchQuery) => {
  const dataToFilter = activeTab === 'stackmap'
    ? stackMapLibrary?.activityGroups || []
    : categories;

  return dataToFilter.filter(category => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    // Check category name
    if (category.name.toLowerCase().includes(query)) return true;

    // Check activities within category
    return category.activities.some(
      activity =>
        (activity.text || '').toLowerCase().includes(query) ||
        (activity.icon || '').includes(searchQuery),
    );
  });
};

/**
 * Hook for managing filter state and operations
 * @param {Array} initialCategories - Initial categories data
 * @param {Object} stackMapLibrary - StackMap library data
 * @returns {Object} Filter state and operations
 */
export const useFilterControls = (initialCategories = [], stackMapLibrary = null) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('stackmap');

  // Get filtered categories based on current search and tab
  const filteredCategories = React.useMemo(() => {
    return getFilteredCategories(initialCategories, stackMapLibrary, activeTab, searchQuery);
  }, [initialCategories, stackMapLibrary, activeTab, searchQuery]);

  // Handle search query changes
  const handleSearchChange = React.useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Clear search query
  const handleSearchClear = React.useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle tab changes
  const handleTabChange = React.useCallback((tab) => {
    setActiveTab(tab);
    // Clear search when switching tabs for better UX
    setSearchQuery('');
  }, []);

  return {
    // State
    searchQuery,
    activeTab,
    filteredCategories,

    // Actions
    handleSearchChange,
    handleSearchClear,
    handleTabChange,
    setSearchQuery,
    setActiveTab,
  };
};

/**
 * Helper function to check if category has activities matching search
 * @param {Object} category - Category object
 * @param {string} searchQuery - Search query string
 * @returns {boolean} True if category has matching activities
 */
export const categoryHasMatchingActivities = (category, searchQuery) => {
  if (!searchQuery) return true;

  const query = searchQuery.toLowerCase();
  return category.activities.some(activity =>
    (activity.text || '').toLowerCase().includes(query) ||
    (activity.icon || '').includes(searchQuery)
  );
};

/**
 * Helper function to get search suggestions based on activities
 * @param {Array} categories - Array of category objects
 * @param {number} maxSuggestions - Maximum number of suggestions to return
 * @returns {Array} Array of search suggestion strings
 */
export const getSearchSuggestions = (categories, maxSuggestions = 5) => {
  const suggestions = new Set();

  categories.forEach(category => {
    // Add category name as suggestion
    if (category.name && suggestions.size < maxSuggestions) {
      suggestions.add(category.name.toLowerCase());
    }

    // Add activity names as suggestions
    category.activities.forEach(activity => {
      if (activity.text && suggestions.size < maxSuggestions) {
        suggestions.add(activity.text.toLowerCase());
      }
    });
  });

  return Array.from(suggestions);
};

/**
 * Helper function to highlight search matches in text
 * @param {string} text - Text to highlight
 * @param {string} searchQuery - Search query to highlight
 * @returns {string} Text with highlighted matches
 */
export const highlightSearchMatch = (text, searchQuery) => {
  if (!searchQuery || !text) return text;

  const query = searchQuery.toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(query);

  if (index === -1) return text;

  return text.substring(0, index) +
         text.substring(index, index + query.length) +
         text.substring(index + query.length);
};

// Default export for the main component (empty since this is primarily a utility module)
const FilterControls = () => {
  return null;
};

export default FilterControls;