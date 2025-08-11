import React from 'react';
import { Text } from '../Typography';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  View,
  
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TYPOGRAPHY, SPACING } from '../../constants';

const ModalButton = ({
  onPress,
  label,
  icon,
  variant = 'primary', // 'primary', 'secondary', 'danger'
  disabled = false,
  loading = false,
  theme,
  style,
  textStyle,
  fullWidth = false,
  compact = false,
  hideOnDesktop = false,
}) => {
  // Hide button on desktop if specified
  if (Platform.OS === 'web' && hideOnDesktop) {
    return null;
  }
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButton);
      baseStyle.push({ backgroundColor: theme.primary });
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton);
    } else if (variant === 'danger') {
      baseStyle.push(styles.dangerButton);
    }
    
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    }
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidthButton);
    }
    
    if (compact) {
      baseStyle.push(styles.compactButton);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButtonText);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButtonText);
      baseStyle.push({ color: theme.primary });
    } else if (variant === 'danger') {
      baseStyle.push(styles.dangerButtonText);
    }
    
    if (textStyle) {
      baseStyle.push(textStyle);
    }
    
    return baseStyle;
  };
  
  const getIconColor = () => {
    if (variant === 'primary') return 'white';
    if (variant === 'secondary') return theme.primary;
    if (variant === 'danger') return '#d32f2f';
    return '#666';
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={variant === 'primary' ? 0.8 : 0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? 'white' : theme.primary} 
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <Icon
              name={icon}
              size={20}
              color={getIconColor()}
              style={styles.buttonIcon}
            />
          )}
          <Text style={getTextStyle()} numberOfLines={2}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg * 1.5,
    borderRadius: 12,
    minHeight: 48,
    minWidth: 160,
    alignSelf: 'center',
  },
  fullWidthButton: {
    width: '100%',
    alignSelf: 'stretch',
  },
  compactButton: {
    minWidth: 120,
    paddingHorizontal: SPACING.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  primaryButton: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        ':hover': {
          borderColor: '#BDBDBD',
          backgroundColor: '#FAFAFA',
        },
      },
    }),
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#ffcdd2',
    backgroundColor: '#ffebee',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#000',
  },
  dangerButtonText: {
    color: '#d32f2f',
  },
  buttonIcon: {
    marginRight: 4,
  },
});

export default ModalButton;