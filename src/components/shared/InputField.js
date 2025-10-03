/**
 * @file InputField.js
 * @description Reusable input field component with label and validation
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  TextInput,
  StyleSheet,
  Platform
} from 'react-native';
import { Text } from '../Typography';
import { SPACING, TYPOGRAPHY } from '../../constants';

/**
 * InputField component for consistent text input styling
 * @param {Object} props - Component props
 * @param {string} props.value - Input value
 * @param {Function} props.onChangeText - Text change handler
 * @param {string} [props.label] - Optional field label
 * @param {string} [props.placeholder] - Input placeholder text
 * @param {string} [props.error] - Error message to display
 * @param {boolean} [props.multiline=false] - Enable multiline input
 * @param {number} [props.numberOfLines=1] - Number of lines for multiline
 * @param {boolean} [props.secure=false] - Secure text entry for passwords
 * @param {string} [props.keyboardType='default'] - Keyboard type
 * @param {boolean} [props.autoCapitalize='sentences'] - Auto capitalization
 * @param {boolean} [props.editable=true] - Whether input is editable
 * @param {number} [props.maxLength] - Maximum character length
 * @param {Object} [props.style] - Additional container styles
 * @param {Object} [props.inputStyle] - Additional input styles
 * @param {Object} props.theme - Theme object with colors
 * @returns {React.Component} Styled input field component
 */
const InputField = ({
  value,
  onChangeText,
  label,
  placeholder,
  error,
  multiline = false,
  numberOfLines = 1,
  secure = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  maxLength,
  style,
  inputStyle,
  theme
}) => {
  const getInputStyles = () => {
    const baseStyles = [styles.input];

    if (multiline) {
      baseStyles.push(styles.multilineInput);
      baseStyles.push({ minHeight: numberOfLines * 24 });
    }

    if (error) {
      baseStyles.push(styles.errorInput);
    }

    if (!editable) {
      baseStyles.push(styles.disabledInput);
    }

    if (inputStyle) {
      baseStyles.push(inputStyle);
    }

    return baseStyles;
  };

  return (
    <View style={[styles.container, style]}>
      {Boolean(label) && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        style={getInputStyles()}
        multiline={multiline}
        numberOfLines={numberOfLines}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {Boolean(error) && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    ...Platform.select({
      ios: {
        paddingVertical: SPACING.md,
      },
      android: {
        paddingVertical: SPACING.sm,
      },
      web: {
        outlineWidth: 0,
        paddingVertical: SPACING.md,
      },
    }),
  },
  multilineInput: {
    paddingTop: SPACING.md,
    textAlignVertical: 'top',
  },
  errorInput: {
    borderColor: '#d32f2f',
    borderWidth: 2,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999999',
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
});

InputField.propTypes = {
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  multiline: PropTypes.bool,
  numberOfLines: PropTypes.number,
  secure: PropTypes.bool,
  keyboardType: PropTypes.string,
  autoCapitalize: PropTypes.string,
  editable: PropTypes.bool,
  maxLength: PropTypes.number,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  inputStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  theme: PropTypes.object,
};

export default InputField;