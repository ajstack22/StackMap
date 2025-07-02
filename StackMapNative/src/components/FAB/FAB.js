import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
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
      <Icon 
        name={icon} 
        size={fabSize.iconSize} 
        color={theme?.primary || '#667eea'} 
      />
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