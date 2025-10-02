import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { Text } from '../Typography';
import {
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
} from '../../constants';

const TabSelector = ({ activeTab, onTabChange, theme, tabs }) => {
  // Default tabs if none provided
  const defaultTabs = [
    { id: 'stackmap', label: 'StackMap Library', icon: null },
    { id: 'mylibrary', label: 'My Library', icon: null },
  ];

  const tabsToRender = tabs && tabs.length > 0 ? tabs : defaultTabs;

  const handleTabPress = (tabId) => {
    if (onTabChange && activeTab !== tabId) {
      onTabChange(tabId);
    }
  };

  return (
    <View style={styles.tabContainer}>
      {tabsToRender.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && [styles.activeTab, { backgroundColor: theme.primary }],
          ]}
          onPress={() => handleTabPress(tab.id)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  activeTab: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: isTablet() ? 16 : 14,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[600],
  },
  activeTabText: {
    color: 'white',
  },
});

TabSelector.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.any,
    })
  ),
};

export default TabSelector;