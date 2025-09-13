import { TextProps, TextInputProps } from 'react-native';
import React from 'react';

export const Text: React.ForwardRefExoticComponent<
  TextProps & React.RefAttributes<any>
>;
export const TextInput: React.ForwardRefExoticComponent<
  TextInputProps & React.RefAttributes<any>
>;

export { Text as RNText, TextInput as RNTextInput } from 'react-native';

declare const Typography: {
  Text: typeof Text;
  TextInput: typeof TextInput;
};

export default Typography;
