import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  SHADOWS, 
  FAB_DIMENSIONS,
  isTablet,
} from '../../constants';

const FAB = ({ 
  onPress, 
  icon, 
  position = {},
  theme,
  style,
  ...props 
}) => {
  const fabSize = isTablet() ? FAB_DIMENSIONS.tablet : FAB_DIMENSIONS.mobile;
  const rotation = useRef(new Animated.Value(0)).current;
  const previousIcon = useRef(icon);
  
  useEffect(() => {
    // Only animate between edit and close icons
    if ((previousIcon.current === 'edit' && icon === 'close') || 
        (previousIcon.current === 'close' && icon === 'edit')) {
      
      // Determine rotation direction
      const toValue = previousIcon.current === 'edit' && icon === 'close' ? 0.25 : -0.25;
      
      Animated.timing(rotation, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    previousIcon.current = icon;
  }, [icon]);
  
  const spin = rotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-360deg', '0deg', '360deg']
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
      <Animated.View style={{ 
        transform: [
          { rotate: spin },
          { scaleX: icon === 'edit' ? -1 : 1 } // Flip edit icon horizontally only
        ] 
      }}>
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