import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';

interface FormInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  maxLength?: number;
  keyboardType?: string;
  autoCapitalize?: string;
  autoCorrect?: boolean;
  theme: any;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  required?: boolean;
}

declare const FormInput: React.FC<FormInputProps>;
export default FormInput;