import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SHADOWS, FAB_DIMENSIONS, isTablet } from '../../constants';

const FAB = ({ onPress, icon, position = {}, theme, style, ...props }) => {
  const fabSize = isTablet() ? FAB_DIMENSIONS.tablet : FAB_DIMENSIONS.mobile;
  const [rotation] = useState(() => new Animated.Value(0));
  const previousIcon = useRef(icon);

  useEffect(() => {
    // Only animate between edit and edit-off icons
    if (
      (previousIcon.current === 'edit' && icon === 'edit-off') ||
      (previousIcon.current === 'edit-off' && icon === 'edit')
    ) {
      // Always animate a full rotation and return to 0
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }

    previousIcon.current = icon;
  }, [icon]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          width: fabSize.size,
          height: fabSize.size,
          borderRadius: fabSize.size / 2,
          backgroundColor: style?.backgroundColor || 'white',
          ...position,
        },
        SHADOWS.level3,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      {...props}
    >
      <Animated.View
        style={{
          transform: [{ rotate: spin }],
        }}
      >
        <Icon
          name={icon}
          size={fabSize.iconSize}
          color={theme?.primary || '#667eea'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FAB;
