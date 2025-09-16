import React from 'react';
import { Text } from '../Typography';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
} from '../../constants';

// Helper function to render mobile dropdown menu
export const renderMobileDropdownMenu = ({
  activity,
  theme,
  onEdit,
  onDelete,
  setShowMenu,
  screenWidth,
  menuPosition,
}) => {
  return (
    <View
      style={[
        styles.menuDropdown,
        {
          top: menuPosition.y,
          right: Math.max(20, screenWidth - menuPosition.x),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowMenu(false);
          onEdit(activity);
        }}
      >
        <Icon name="edit" size={20} color={theme.primary} />
        <Text
          style={[
            styles.menuItemText,
            { color: theme.primary },
          ]}
        >
          Edit Activity
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, styles.menuItemDanger]}
        onPress={() => {
          setShowMenu(false);
          onDelete(activity);
        }}
      >
        <Icon name="delete" size={20} color={COLORS.error} />
        <Text
          style={[styles.menuItemText, { color: COLORS.error }]}
        >
          Delete Activity
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Helper function to render mobile center menu
export const renderMobileCenterMenu = ({
  activity,
  theme,
  onEdit,
  onDelete,
  setShowMenu,
}) => {
  return (
    <View style={styles.centerMenuContainer}>
      <View style={styles.centerMenuCard}>
        <Text
          style={[
            styles.activityName,
            {
              textAlign: 'center',
              marginBottom: SPACING.md,
              fontSize: 18,
            },
          ]}
        >
          {activity.text}
        </Text>

        <TouchableOpacity
          style={[
            styles.menuItem,
            { paddingHorizontal: SPACING.lg },
          ]}
          onPress={() => {
            setShowMenu(false);
            onEdit(activity);
          }}
        >
          <Icon name="edit" size={24} color={theme.primary} />
          <Text
            style={[
              styles.menuItemText,
              { color: theme.primary, fontSize: 18 },
            ]}
          >
            Edit Activity
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuItem,
            styles.menuItemDanger,
            { paddingHorizontal: SPACING.lg },
          ]}
          onPress={() => {
            setShowMenu(false);
            onDelete(activity);
          }}
        >
          <Icon name="delete" size={24} color={COLORS.error} />
          <Text
            style={[
              styles.menuItemText,
              { color: COLORS.error, fontSize: 18 },
            ]}
          >
            Delete Activity
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  menuDropdown: {
    position: 'absolute',
    borderRadius: RADIUS.lg,
    backgroundColor: 'white',
    ...SHADOWS.level3,
    minWidth: 220,
    maxHeight: 300,
    paddingVertical: SPACING.sm,
  },
  centerMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  centerMenuCard: {
    backgroundColor: 'white',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    ...SHADOWS.level3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  menuItemText: {
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
  },
  activityName: {
    fontSize: isTablet() ? 16 : 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
});