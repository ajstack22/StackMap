import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SHADOWS, TYPOGRAPHY, SPACING, RADIUS, isTablet } from '../../constants';

const EditModeToolbar = ({
  onExit,
  onAdd,
  onLibrary,
  onCompleteDay,
  theme,
  position = 'bottom',
  visible = true,
  onAnimationComplete,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: position === 'top' ? -100 : 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }
  }, [visible, position, onAnimationComplete]);

  // Define all actions
  const actions = [
    { id: 'add', label: 'Add', icon: 'add', onPress: onAdd, color: theme.primary },
    { id: 'library', label: 'Library', icon: 'collections-bookmark', onPress: onLibrary, color: theme.primary, disabled: true },
    { id: 'complete', label: 'Complete', icon: 'today', onPress: onCompleteDay, color: theme.primary, disabled: true },
  ];

  // Since we only have 3 actions now, we can show all of them on both mobile and tablet
  const visibleActions = actions;
  const overflowActions = [];
  const showMore = false;

  const renderAction = ({ item }) => (
    <TouchableOpacity
      style={[styles.actionPill, item.disabled && styles.disabledPill]}
      onPress={item.disabled ? null : item.onPress}
      disabled={item.disabled}
    >
      <Icon 
        name={item.icon} 
        size={isTablet() ? 24 : 22} 
        color={item.disabled ? '#999' : item.color} 
      />
      <Text style={[
        styles.actionLabel,
        { color: item.disabled ? '#999' : item.color }
      ]}>
        {item.label}
        {item.disabled && ' *'}
      </Text>
    </TouchableOpacity>
  );

  const renderMoreMenuItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.moreMenuItem, item.disabled && styles.disabledMenuItem]}
      onPress={() => {
        setShowMoreMenu(false);
        if (!item.disabled && item.onPress) {
          item.onPress();
        }
      }}
      disabled={item.disabled}
    >
      <Icon 
        name={item.icon} 
        size={24} 
        color={item.disabled ? '#999' : item.color} 
      />
      <Text style={[
        styles.moreMenuLabel,
        { color: item.disabled ? '#999' : item.color }
      ]}>
        {item.label}
        {item.disabled && ' *'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
      ]}>
        <SafeAreaView style={[
          styles.safeArea,
          { backgroundColor: theme.primary },
        ]}>
          <View style={styles.toolbarContainer}>
            {/* Theme-colored background with fade animation */}
            <Animated.View style={[styles.backgroundBar, { backgroundColor: theme.primary, opacity: backgroundOpacity }]} />
            
            {/* Animated toolbar that slides from behind */}
            <Animated.View
              style={[
                styles.toolbar,
                {
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            >
              {visibleActions.map(action => (
                <View key={action.id}>
                  {renderAction({ item: action })}
                </View>
              ))}
              
              {showMore && (
                <TouchableOpacity
                  style={styles.actionPill}
                  onPress={() => setShowMoreMenu(true)}
                >
                  <Icon name="more-horiz" size={isTablet() ? 24 : 22} color={theme.primary} />
                  <Text style={[styles.actionLabel, { color: theme.primary }]}>
                    More
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>

      {/* More Menu Modal */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity
          style={styles.moreMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={[styles.moreMenuContainer, { backgroundColor: 'white' }]}>
            <FlatList
              data={overflowActions}
              renderItem={renderMoreMenuItem}
              keyExtractor={item => item.id}
              ItemSeparatorComponent={() => <View style={styles.moreMenuSeparator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  safeArea: {
  },
  topPosition: {
    top: 0,
  },
  bottomPosition: {
    bottom: 0,
  },
  toolbarContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
    gap: SPACING.sm,
    position: 'relative',
    zIndex: 1,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: isTablet() ? SPACING.lg : SPACING.md * 1.1,
    paddingVertical: isTablet() ? SPACING.md * 0.75 : SPACING.sm * 1.1,
    borderRadius: RADIUS.round,
    gap: SPACING.sm,
    ...SHADOWS.level1,
  },
  disabledPill: {
    opacity: 0.6,
  },
  actionLabel: {
    fontSize: isTablet() ? 16 : 15,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  moreMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMenuContainer: {
    width: '80%',
    maxWidth: 300,
    borderRadius: RADIUS.lg,
    ...SHADOWS.level3,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  disabledMenuItem: {
    opacity: 0.6,
  },
  moreMenuLabel: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  moreMenuSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});

export default EditModeToolbar;