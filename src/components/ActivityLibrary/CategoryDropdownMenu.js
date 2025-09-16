import React from 'react';
import { Text } from '../Typography';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
} from '../../constants';

// Helper function to render mobile dropdown menu
const renderMobileDropdownMenu = ({
  category,
  theme,
  handleStartEditCategory,
  handleAddAll,
  justAddedAll,
  onAddActivity,
  handleDeleteCategory,
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
          handleStartEditCategory();
        }}
      >
        <Icon name="edit" size={20} color={theme.primary} />
        <Text
          style={[
            styles.menuItemText,
            { color: theme.primary },
          ]}
        >
          Edit Name
        </Text>
      </TouchableOpacity>

      {category.activities.length > 0 && (
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            setShowMenu(false);
            handleAddAll();
          }}
          disabled={justAddedAll}
        >
          <Icon
            name={justAddedAll ? 'done-all' : 'add'}
            size={20}
            color={justAddedAll ? 'white' : theme.primary}
          />
          <Text
            style={[
              styles.menuItemText,
              {
                color: justAddedAll ? 'white' : theme.primary,
                fontWeight: justAddedAll ? 'bold' : 'normal',
              },
            ]}
          >
            {justAddedAll ? 'Added!' : 'Add All to Cards'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowMenu(false);
          onAddActivity(category);
        }}
      >
        <Icon name="library-add" size={20} color={theme.primary} />
        <Text
          style={[
            styles.menuItemText,
            { color: theme.primary },
          ]}
        >
          Add New Activity
        </Text>
      </TouchableOpacity>

      {category.id !== 'my-templates' && (
        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemDanger]}
          onPress={() => {
            setShowMenu(false);
            handleDeleteCategory();
          }}
        >
          <Icon name="delete" size={20} color={COLORS.error} />
          <Text
            style={[
              styles.menuItemText,
              { color: COLORS.error },
            ]}
          >
            Delete Category
          </Text>
        </TouchableOpacity>
      )}
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
    ...(Platform.OS === 'web' && {
      overflowY: 'auto',
    }),
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
});

export { renderMobileDropdownMenu };