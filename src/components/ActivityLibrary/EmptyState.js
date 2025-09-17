import React from 'react';
import { Text } from '../Typography';
import { StyleSheet } from 'react-native';
import {
  TYPOGRAPHY,
  SPACING,
} from '../../constants';

const EmptyState = ({ message, style, textStyle }) => {
  return (
    <Text style={[styles.emptyMessage, style, textStyle]}>
      {message}
    </Text>
  );
};

// Helper function to determine appropriate empty state message
export const getEmptyStateMessage = (type, hasActivities, hasSearch, searchQuery) => {
  if (!hasActivities) {
    return "No activities yet. Tap + to add one.";
  }

  if (hasSearch) {
    return "No activities match your search.";
  }

  return "No activities found.";
};

// Predefined empty state configurations
export const EmptyStateTypes = {
  NO_ACTIVITIES: {
    message: "No activities yet. Tap + to add one.",
    icon: "add_circle_outline",
  },
  NO_SEARCH_RESULTS: {
    message: "No activities match your search.",
    icon: "search_off",
  },
  NO_CATEGORY_ACTIVITIES: {
    message: "This category is empty. Add some activities!",
    icon: "folder_open",
  },
  GENERAL: {
    message: "No activities found.",
    icon: "inbox",
  }
};

// Component with preset configurations
export const PresetEmptyState = ({ type = 'GENERAL', customMessage, ...props }) => {
  const config = EmptyStateTypes[type] || EmptyStateTypes.GENERAL;
  const message = customMessage || config.message;

  return <EmptyState message={message} {...props} />;
};

const styles = StyleSheet.create({
  emptyMessage: {
    textAlign: 'center',
    color: 'white',
    fontStyle: 'italic',
    padding: SPACING.lg,
    opacity: 0.8,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
});

export default EmptyState;