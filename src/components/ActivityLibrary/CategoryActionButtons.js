import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  SPACING,
} from '../../constants';

// Helper function to render category actions based on mode
const renderCategoryActions = ({
  isReadOnly,
  isMobile,
  category,
  theme,
  onCopyToMyLibrary,
  handleAddAll,
  justAddedAll,
  menuButtonRef,
  showMenu,
  setShowMenu,
  setMenuPosition,
  handleStartEditCategory,
  handleDeleteCategory,
  onAddActivity,
}) => {
  if (isReadOnly) {
    // Read-only actions for StackMap Library
    return (
      <>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onCopyToMyLibrary && onCopyToMyLibrary(category)}
          title="Copy to My Library"
        >
          <Icon name="content-copy" size={20} color="white" />
        </TouchableOpacity>
        {category.activities.length > 0 && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleAddAll}
            disabled={justAddedAll}
          >
            <Icon
              name={justAddedAll ? 'check' : 'add'}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        )}
      </>
    );
  }

  if (isMobile) {
    return (
      <TouchableOpacity
        ref={menuButtonRef}
        style={styles.iconButton}
        onPress={() => {
          if (menuButtonRef.current && !showMenu) {
            menuButtonRef.current.measure(
              (x, y, width, height, pageX, pageY) => {
                setMenuPosition({ x: pageX, y: pageY + height });
              },
            );
          }
          setShowMenu(!showMenu);
        }}
      >
        <Icon name="more-vert" size={20} color="white" />
      </TouchableOpacity>
    );
  }

  // Desktop actions
  return (
    <>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleStartEditCategory}
      >
        <Icon name="edit" size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.iconButton,
          category.id === 'my-templates' && styles.disabledButton,
        ]}
        onPress={
          category.id === 'my-templates' ? undefined : handleDeleteCategory
        }
        disabled={category.id === 'my-templates'}
      >
        <Icon
          name="delete"
          size={20}
          color={category.id === 'my-templates' ? '#999' : 'white'}
        />
      </TouchableOpacity>

      {category.activities.length > 0 && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleAddAll}
          disabled={justAddedAll}
        >
          <Icon
            name={justAddedAll ? 'check' : 'add'}
            size={20}
            color="white"
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => onAddActivity(category)}
      >
        <Icon name="library-add" size={20} color="white" />
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export { renderCategoryActions };