import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../Typography';
import {
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
} from '../../constants';

const TabSelector = ({ activeTab, onTabChange, theme }) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'stackmap' && [styles.activeTab, { backgroundColor: theme.primary }],
        ]}
        onPress={() => onTabChange('stackmap')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'stackmap' && styles.activeTabText,
          ]}
        >
          StackMap Library
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'mylibrary' && [styles.activeTab, { backgroundColor: theme.primary }],
        ]}
        onPress={() => onTabChange('mylibrary')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'mylibrary' && styles.activeTabText,
          ]}
        >
          My Library
        </Text>
      </TouchableOpacity>
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

export default TabSelector;