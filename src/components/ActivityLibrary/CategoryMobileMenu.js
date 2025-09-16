import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { renderMobileDropdownMenu } from './CategoryDropdownMenu';
import { renderMobileCenterMenu } from './CategoryMobileMenuComponents';

// Main mobile menu component
const CategoryMobileMenu = ({
  showMenu,
  setShowMenu,
  category,
  theme,
  screenWidth,
  menuPosition,
  handleStartEditCategory,
  handleAddAll,
  justAddedAll,
  onAddActivity,
  handleDeleteCategory,
}) => {
  if (!showMenu) return null;

  return (
    <Modal
      transparent={true}
      visible={showMenu}
      onRequestClose={() => setShowMenu(false)}
      animationType="fade"
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={() => setShowMenu(false)}
      >
        {Platform.OS === 'web'
          ? renderMobileDropdownMenu({
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
            })
          : renderMobileCenterMenu({
              category,
              theme,
              handleStartEditCategory,
              handleAddAll,
              justAddedAll,
              onAddActivity,
              handleDeleteCategory,
              setShowMenu,
            })}
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor:
      Platform.OS === 'web' ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryMobileMenu;