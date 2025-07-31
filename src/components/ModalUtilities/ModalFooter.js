import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants';

const ModalFooter = ({
  primaryButton,
  secondaryButton,
  tertiaryButton,
  theme,
  loading = false,
  insets,
  getAndroidModalBottomHeight,
}) => {
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
      >
        {loading && isPrimary ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            {button.icon && (
              <Icon
                name={button.icon}
                size={20}
                color={isPrimary ? 'white' : theme.primary}
                style={styles.buttonIcon}
              />
            )}
            <Text style={textStyle}>{button.label}</Text>
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
      <View style={[styles.footer, { backgroundColor: theme.light }]}>
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
      <SafeAreaView style={{ backgroundColor: theme.light }} />
      {Platform.OS === 'android' && getAndroidModalBottomHeight && (
        <View style={{ 
          backgroundColor: theme.light, 
          height: getAndroidModalBottomHeight(insets) 
        }} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  mainButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  tertiaryButtonContainer: {
    marginBottom: SPACING.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    minWidth: 100,
  },
  primaryButton: {
    ...SHADOWS.level2,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#333',
  },
  disabledButtonText: {
    color: '#999',
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
});

export default ModalFooter;