/**
 * @file PrimaryButton.js
 * @description Reusable primary button component with consistent styling across platforms
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  View
} from 'react-native';
import { Text } from '../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SPACING, TYPOGRAPHY } from '../../constants';

/**
 * PrimaryButton component for consistent button styling
 * @param {Object} props - Component props
 * @param {Function} props.onPress - Button press handler
 * @param {string} props.title - Button text
 * @param {string} [props.icon] - Optional icon name
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {boolean} [props.loading=false] - Show loading indicator
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, danger)
 * @param {Object} [props.style] - Additional styles
 * @param {Object} [props.textStyle] - Additional text styles
 * @param {boolean} [props.fullWidth=false] - Whether button spans full width
 * @param {Object} props.theme - Theme object with colors
 * @returns {React.Component} Styled button component
 */
const PrimaryButton = ({
  onPress,
  title,
  icon,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
  fullWidth = false,
  theme
}) => {
  const getButtonStyles = () => {
    const baseStyles = [styles.button];

    if (variant === 'primary') {
      baseStyles.push(styles.primaryButton);
      baseStyles.push({ backgroundColor: theme?.primary || '#5C7E9D' });
    } else if (variant === 'secondary') {
      baseStyles.push(styles.secondaryButton);
      baseStyles.push({ borderColor: theme?.primary || '#5C7E9D' });
    } else if (variant === 'danger') {
      baseStyles.push(styles.dangerButton);
    }

    if (disabled || loading) {
      baseStyles.push(styles.disabled);
    }

    if (fullWidth) {
      baseStyles.push(styles.fullWidth);
    }

    if (style) {
      baseStyles.push(style);
    }

    return baseStyles;
  };

  const getTextStyles = () => {
    const baseStyles = [styles.buttonText];

    if (variant === 'primary') {
      baseStyles.push(styles.primaryText);
    } else if (variant === 'secondary') {
      baseStyles.push(styles.secondaryText);
      baseStyles.push({ color: theme?.primary || '#5C7E9D' });
    } else if (variant === 'danger') {
      baseStyles.push(styles.dangerText);
    }

    if (textStyle) {
      baseStyles.push(textStyle);
    }

    return baseStyles;
  };

  const getIconColor = () => {
    if (variant === 'primary') return '#FFFFFF';
    if (variant === 'secondary') return theme?.primary || '#5C7E9D';
    if (variant === 'danger') return '#d32f2f';
    return '#666666';
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : (theme?.primary || '#5C7E9D')}
        />
      ) : (
        <View style={styles.content}>
          {Boolean(icon) && (
            <Icon
              name={icon}
              size={20}
              color={getIconColor()}
              style={styles.icon}
            />
          )}
          <Text style={getTextStyles()} numberOfLines={1}>
            {title}
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
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  primaryButton: {
    backgroundColor: '#5C7E9D',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#5C7E9D',
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '700' : '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#5C7E9D',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  icon: {
    marginRight: SPACING.xs,
  },
});

PrimaryButton.propTypes = {
  onPress: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  textStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  fullWidth: PropTypes.bool,
  theme: PropTypes.object,
};

export default PrimaryButton;