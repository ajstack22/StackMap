/**
 * @file Card.js
 * @description Reusable card container component with consistent styling
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity
} from 'react-native';
import { SPACING } from '../../constants';

/**
 * Card component for consistent container styling
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {Function} [props.onPress] - Optional press handler (makes card touchable)
 * @param {Object} [props.style] - Additional styles
 * @param {boolean} [props.noPadding=false] - Remove default padding
 * @param {boolean} [props.noShadow=false] - Remove shadow/elevation
 * @param {string} [props.variant='default'] - Card variant (default, outlined, flat)
 * @param {boolean} [props.disabled=false] - Whether card is disabled
 * @returns {React.Component} Styled card container
 */
const Card = ({
  children,
  onPress,
  style,
  noPadding = false,
  noShadow = false,
  variant = 'default',
  disabled = false
}) => {
  const getCardStyles = () => {
    const baseStyles = [styles.card];

    if (!noShadow && variant !== 'flat') {
      baseStyles.push(styles.shadow);
    }

    if (variant === 'outlined') {
      baseStyles.push(styles.outlined);
    } else if (variant === 'flat') {
      baseStyles.push(styles.flat);
    }

    if (!noPadding) {
      baseStyles.push(styles.padding);
    }

    if (disabled) {
      baseStyles.push(styles.disabled);
    }

    if (style) {
      baseStyles.push(style);
    }

    return baseStyles;
  };

  const content = (
    <View style={getCardStyles()}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.sm,
  },
  padding: {
    padding: SPACING.md,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
      web: {
        boxShadow: 'none',
      },
    }),
  },
  flat: {
    backgroundColor: '#F5F5F5',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
      web: {
        boxShadow: 'none',
      },
    }),
  },
  disabled: {
    opacity: 0.6,
  },
});

Card.propTypes = {
  children: PropTypes.node.isRequired,
  onPress: PropTypes.func,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  noPadding: PropTypes.bool,
  noShadow: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'outlined', 'flat']),
  disabled: PropTypes.bool,
};

export default Card;