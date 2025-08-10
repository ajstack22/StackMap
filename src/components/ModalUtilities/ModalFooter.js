import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TYPOGRAPHY, SPACING } from '../../constants';

const ModalFooter = ({
  primaryButton,
  secondaryButton,
  tertiaryButton,
  theme,
  loading = false,
  insets,
  getAndroidModalBottomHeight,
  showOnDesktop = false,
}) => {
  // Hide footer on desktop unless explicitly shown
  if (Platform.OS === 'web' && !showOnDesktop) {
    return null;
  }
  const renderButton = (button, isPrimary = false) => {
    if (!button) return null;

    const buttonStyle = [
      styles.button,
      isPrimary ? styles.primaryButton : styles.secondaryButton,
      isPrimary && { backgroundColor: theme.primary },
      button.disabled && styles.disabledButton,
    ];

    const textStyle = [
      styles.buttonText,
      isPrimary ? styles.primaryButtonText : styles.secondaryButtonText,
      !isPrimary && { color: theme.primary },
      button.disabled && styles.disabledButtonText,
    ];

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={button.onPress}
        disabled={button.disabled || loading}
        activeOpacity={isPrimary ? 0.8 : 0.7}
      >
        {loading && isPrimary ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            {button.icon && (
              <Icon
                name={button.icon}
                size={20}
                color={isPrimary ? 'white' : (button.disabled ? '#999' : theme.primary)}
                style={styles.buttonIcon}
              />
            )}
            <Text style={textStyle} numberOfLines={2}>{button.label}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  if (!primaryButton && !secondaryButton && !tertiaryButton) {
    return null;
  }

  return (
    <>
      <View style={styles.footer}>
        {tertiaryButton && (
          <View style={styles.tertiaryButtonContainer}>
            {renderButton(tertiaryButton)}
          </View>
        )}
        <View style={styles.mainButtonsContainer}>
          {secondaryButton && renderButton(secondaryButton)}
          {primaryButton && renderButton(primaryButton, true)}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  mainButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  tertiaryButtonContainer: {
    marginBottom: SPACING.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg * 1.5,
    borderRadius: 12,
    minWidth: 160,
    minHeight: 48,
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
      },
    }),
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
  disabledButtonText: {
    color: '#000',
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
});

export default ModalFooter;