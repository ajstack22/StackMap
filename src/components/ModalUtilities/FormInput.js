import React from 'react';
import PropTypes from 'prop-types';
import { Text, TextInput } from '../Typography';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TYPOGRAPHY, SPACING, RADIUS } from '../../constants';

const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  showPasswordToggle = false,
  onTogglePassword,
  editable = true,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  maxLength,
  leftIcon,
  rightIcon,
  onRightIconPress,
  theme,
  style,
  inputStyle,
  required = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          multiline && styles.multilineContainer,
          error && styles.errorContainer,
          !editable && styles.disabledContainer,
        ]}
      >
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color="#666"
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
        />

        {showPasswordToggle && (
          <TouchableOpacity
            onPress={onTogglePassword}
            style={styles.rightIconButton}
          >
            <Icon
              name={secureTextEntry ? 'visibility' : 'visibility-off'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        )}

        {rightIcon && !showPasswordToggle && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            disabled={!onRightIconPress}
          >
            <Icon name={rightIcon} size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginBottom: SPACING.xs,
  },
  required: {
    color: '#e53e3e',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: RADIUS.md,
    backgroundColor: 'white',
  },
  multilineContainer: {
    alignItems: 'flex-start',
  },
  errorContainer: {
    borderColor: '#e53e3e',
  },
  disabledContainer: {
    backgroundColor: '#f5f5f5',
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIcon: {
    marginLeft: SPACING.md,
  },
  rightIconButton: {
    padding: SPACING.md,
  },
  errorText: {
    fontSize: 12,
    color: '#e53e3e',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginTop: SPACING.xs,
  },
});

FormInput.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  multiline: PropTypes.bool,
  numberOfLines: PropTypes.number,
  secureTextEntry: PropTypes.bool,
  showPasswordToggle: PropTypes.bool,
  onTogglePassword: PropTypes.func,
  editable: PropTypes.bool,
  keyboardType: PropTypes.string,
  autoCapitalize: PropTypes.string,
  autoCorrect: PropTypes.bool,
  maxLength: PropTypes.number,
  leftIcon: PropTypes.string,
  rightIcon: PropTypes.string,
  onRightIconPress: PropTypes.func,
  theme: PropTypes.object,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  inputStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  required: PropTypes.bool,
};

export default FormInput;
