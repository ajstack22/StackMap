import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';

interface ModalButtonProps {
  onPress: () => void;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  theme: any;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  compact?: boolean;
  hideOnDesktop?: boolean;
}

declare const ModalButton: React.FC<ModalButtonProps>;
export default ModalButton;