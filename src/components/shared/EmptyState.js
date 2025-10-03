/**
 * @file EmptyState.js
 * @description Reusable empty state component for no data scenarios
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Text } from '../Typography';
import { SPACING, TYPOGRAPHY } from '../../constants';

/**
 * EmptyState component for consistent empty/no data displays
 * @param {Object} props - Component props
 * @param {string} [props.icon='📋'] - Emoji or icon to display
 * @param {string} [props.title='No data'] - Main empty state message
 * @param {string} [props.subtitle] - Optional subtitle/description
 * @param {string} [props.actionText] - Optional action button text
 * @param {Function} [props.onAction] - Optional action button handler
 * @param {Object} [props.style] - Additional container styles
 * @param {Object} props.theme - Theme object with colors
 * @returns {React.ReactElement} Styled empty state component
 */
const EmptyState = ({
  icon = '📋',
  title = 'No data',
  subtitle,
  actionText,
  onAction,
  style,
  theme
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>
        {icon}
      </Text>
      <Text style={styles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
      {actionText && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme?.primary || '#5C7E9D' }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    minHeight: 200,
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    maxWidth: 280,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  actionButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actionText: PropTypes.string,
  onAction: PropTypes.func,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  theme: PropTypes.object,
};

export default EmptyState;