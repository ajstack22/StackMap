/**
 * @file LoadingSpinner.js
 * @description Reusable loading spinner component with consistent styling
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Text } from '../Typography';
import { SPACING, TYPOGRAPHY } from '../../constants';
import Logo from '../Logo/Logo';

/**
 * LoadingSpinner component for consistent loading indicators
 * @param {Object} props - Component props
 * @param {string} [props.size='large'] - Spinner size (small, large)
 * @param {string} [props.color] - Spinner color
 * @param {string} [props.message] - Optional loading message
 * @param {boolean} [props.overlay=false] - Show as overlay with background
 * @param {boolean} [props.fullScreen=false] - Cover full screen
 * @param {boolean} [props.showLogo=false] - Show StackMap logo above spinner
 * @param {boolean} [props.transparentBackground=false] - Use transparent background instead of white box
 * @param {Object} [props.style] - Additional container styles
 * @param {Object} props.theme - Theme object with colors
 * @returns {React.ReactElement} Styled loading spinner component
 */
const LoadingSpinner = ({
  size = 'large',
  color,
  message,
  overlay = false,
  fullScreen = false,
  showLogo = false,
  transparentBackground = false,
  style,
  theme,
  testID
}) => {
  const spinnerColor = color || theme?.primary || '#5C7E9D';

  const getContainerStyles = () => {
    const baseStyles = [styles.container];

    if (overlay) {
      baseStyles.push(styles.overlay);
    }

    if (fullScreen) {
      baseStyles.push(styles.fullScreen);
    }

    if (style) {
      baseStyles.push(style);
    }

    return baseStyles;
  };

  const contentStyles = transparentBackground
    ? [styles.content, styles.transparentContent]
    : styles.content;

  return (
    <View style={getContainerStyles()} testID={testID}>
      <View style={contentStyles}>
        {showLogo && (
          <View style={styles.logoContainer}>
            <Logo size={80} color={spinnerColor} theme={theme} />
          </View>
        )}
        <ActivityIndicator
          size={size}
          color={spinnerColor}
        />
        {Boolean(message) && (
          <Text style={styles.message}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    borderRadius: 12,
    minWidth: 100,
    minHeight: 100,
  },
  message: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  logoContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transparentContent: {
    backgroundColor: 'transparent',
    minWidth: 0,
    minHeight: 0,
  },
});

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'large']),
  color: PropTypes.string,
  message: PropTypes.string,
  overlay: PropTypes.bool,
  fullScreen: PropTypes.bool,
  showLogo: PropTypes.bool,
  transparentBackground: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  theme: PropTypes.object,
  testID: PropTypes.string,
};

export default LoadingSpinner;