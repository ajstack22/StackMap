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

// Dropdown menu logic moved to CategoryDropdownMenu.js

// Helper function to render mobile center menu
const renderMobileCenterMenu = ({
  category,
  theme,
  handleStartEditCategory,
  handleAddAll,
  justAddedAll,
  onAddActivity,
  handleDeleteCategory,
  setShowMenu,
}) => {
  return (
    <View style={styles.centerMenuContainer}>
      <View style={styles.centerMenuCard}>
        <Text
          style={[
            styles.categoryTitle,
            {
              color: theme.primary,
              textAlign: 'center',
              marginBottom: SPACING.md,
              fontSize: 18,
            },
          ]}
        >
          {category.name}
        </Text>

        <TouchableOpacity
          style={[
            styles.menuItem,
            { paddingHorizontal: SPACING.lg },
          ]}
          onPress={() => {
            setShowMenu(false);
            handleStartEditCategory();
          }}
        >
          <Icon name="edit" size={24} color={theme.primary} />
          <Text
            style={[
              styles.menuItemText,
              { color: theme.primary, fontSize: 18 },
            ]}
          >
            Edit Name
          </Text>
        </TouchableOpacity>

        {category.activities.length > 0 && (
          <TouchableOpacity
            style={[
              styles.menuItem,
              { paddingHorizontal: SPACING.lg },
            ]}
            onPress={() => {
              setShowMenu(false);
              handleAddAll();
            }}
            disabled={justAddedAll}
          >
            <Icon
              name={justAddedAll ? 'done-all' : 'add'}
              size={24}
              color={justAddedAll ? 'white' : theme.primary}
            />
            <Text
              style={[
                styles.menuItemText,
                {
                  color: justAddedAll ? 'white' : theme.primary,
                  fontSize: 18,
                  fontWeight: justAddedAll ? 'bold' : 'normal',
                },
              ]}
            >
              {justAddedAll ? 'Added!' : 'Add All to Cards'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.menuItem,
            { paddingHorizontal: SPACING.lg },
          ]}
          onPress={() => {
            setShowMenu(false);
            onAddActivity(category);
          }}
        >
          <Icon name="library-add" size={24} color={theme.primary} />
          <Text
            style={[
              styles.menuItemText,
              { color: theme.primary, fontSize: 18 },
            ]}
          >
            Add New Activity
          </Text>
        </TouchableOpacity>

        {category.id !== 'my-templates' && (
          <TouchableOpacity
            style={[
              styles.menuItem,
              styles.menuItemDanger,
              { paddingHorizontal: SPACING.lg },
            ]}
            onPress={() => {
              setShowMenu(false);
              handleDeleteCategory();
            }}
          >
            <Icon name="delete" size={24} color={COLORS.error} />
            <Text
              style={[
                styles.menuItemText,
                { color: COLORS.error, fontSize: 18 },
              ]}
            >
              Delete Category
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
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

export { renderMobileCenterMenu };