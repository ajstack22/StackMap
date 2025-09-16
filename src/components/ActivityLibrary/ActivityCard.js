import React, { useState, useRef } from 'react';
import { Text } from '../Typography';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ConfirmModal from '../Modals/ConfirmModal';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
  getCustomImageSource,
} from '../../constants';

// Import menu helpers from separate file
import { renderMobileDropdownMenu, renderMobileCenterMenu } from './ActivityCardMenus';

const ActivityCard = ({ activity, onEdit, onDelete, onQuickAdd, theme }) => {
  const [justAdded, setJustAdded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuButtonRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 480;

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      setShowDeleteConfirm(true);
    } else {
      Alert.alert(
        'Delete Activity',
        `Are you sure you want to delete "${activity.text}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              onDelete(activity);
            },
          },
        ],
      );
    }
  };

  const handleQuickAdd = () => {
    onQuickAdd(activity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleMenuToggle = () => {
    if (menuButtonRef.current && !showMenu) {
      menuButtonRef.current.measure(
        (x, y, width, height, pageX, pageY) => {
          setMenuPosition({ x: pageX, y: pageY + height });
        },
      );
    }
    setShowMenu(!showMenu);
  };

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityInfo}>
        {activity.icon && activity.icon.startsWith('image:') ? (
          <Image
            source={getCustomImageSource(activity.icon.substring(6))}
            style={styles.activityImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.activityEmoji}>{activity.icon || ''}</Text>
        )}
        <Text style={styles.activityName}>{activity.text}</Text>
      </View>

      <View style={styles.activityActions}>
        {isMobile ? (
          <>
            <TouchableOpacity
              style={[
                styles.addIconButton,
                {
                  marginRight: SPACING.xs,
                  backgroundColor: justAdded ? '#4CAF50' : theme.primary,
                },
              ]}
              onPress={handleQuickAdd}
              disabled={justAdded}
            >
              <Icon
                name={justAdded ? 'check' : 'add'}
                size={20}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              ref={menuButtonRef}
              style={styles.iconButton}
              onPress={handleMenuToggle}
            >
              <Icon name="more-vert" size={20} color={theme.primary} />
            </TouchableOpacity>

            {showMenu && (
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
                        activity,
                        theme,
                        onEdit,
                        onDelete: handleDelete,
                        setShowMenu,
                        screenWidth,
                        menuPosition,
                      })
                    : renderMobileCenterMenu({
                        activity,
                        theme,
                        onEdit,
                        onDelete: handleDelete,
                        setShowMenu,
                      })}
                </TouchableOpacity>
              </Modal>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onEdit(activity)}
            >
              <Icon name="edit" size={20} color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
              <Icon name="delete" size={20} color={COLORS.error} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addIconButton,
                {
                  backgroundColor: justAdded ? '#4CAF50' : theme.primary,
                },
              ]}
              onPress={handleQuickAdd}
              disabled={justAdded}
            >
              <Icon
                name={justAdded ? 'check' : 'add'}
                size={20}
                color="white"
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {Platform.OS === 'web' && (
        <ConfirmModal
          visible={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            onDelete(activity);
            setShowDeleteConfirm(false);
          }}
          theme={theme}
          title="Delete Activity"
          message={`Are you sure you want to delete "${activity.text}"?`}
          confirmText="Delete"
          confirmButtonColor="#e53e3e"
          icon="delete"
          iconColor="#e53e3e"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.lg,
    ...SHADOWS.level1,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityEmoji: {
    fontSize: isTablet() ? 28 : 24,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginRight: SPACING.sm,
  },
  activityImage: {
    width: isTablet() ? 28 : 24,
    height: isTablet() ? 28 : 24,
    marginRight: SPACING.sm,
  },
  activityName: {
    fontSize: isTablet() ? 16 : 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
  },
  activityActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  addIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor:
      Platform.OS === 'web' ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActivityCard;