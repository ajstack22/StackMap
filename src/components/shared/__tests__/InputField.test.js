import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import InputField from '../InputField';

describe('InputField', () => {
  const mockTheme = { primary: '#5C7E9D' };

  it('renders correctly with value', () => {
    const { getByDisplayValue } = render(
      <InputField
        value="Test Value"
        onChangeText={() => {}}
        theme={mockTheme}
      />
    );
    expect(getByDisplayValue('Test Value')).toBeTruthy();
  });

  it('shows label when provided', () => {
    const { getByText } = render(
      <InputField
        value=""
        label="Email"
        onChangeText={() => {}}
        theme={mockTheme}
      />
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <InputField
        value="initial"
        onChangeText={onChangeText}
        theme={mockTheme}
      />
    );

    fireEvent.changeText(getByDisplayValue('initial'), 'new value');
    expect(onChangeText).toHaveBeenCalledWith('new value');
  });

  it('shows placeholder when value is empty', () => {
    const { getByPlaceholderText } = render(
      <InputField
        value=""
        placeholder="Enter text"
        onChangeText={() => {}}
        theme={mockTheme}
      />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('shows error message when error prop is provided', () => {
    const { getByText } = render(
      <InputField
        value=""
        error="This field is required"
        onChangeText={() => {}}
        theme={mockTheme}
      />
    );
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('is disabled when editable is false', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <InputField
        value="disabled"
        editable={false}
        onChangeText={onChangeText}
        theme={mockTheme}
      />
    );

    const input = getByDisplayValue('disabled');
    expect(input.props.editable).toBe(false);
  });

  it('enables secure text entry for passwords', () => {
    const { getByDisplayValue } = render(
      <InputField
        value="password"
        secure={true}
        onChangeText={() => {}}
        theme={mockTheme}
      />
    );

    const input = getByDisplayValue('password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('enables multiline when prop is true', () => {
    const { getByDisplayValue } = render(
      <InputField
        value="multiline text"
        multiline={true}
        numberOfLines={3}
        onChangeText={() => {}}
        theme={mockTheme}
      />
    );

    const input = getByDisplayValue('multiline text');
    expect(input.props.multiline).toBe(true);
    expect(input.props.numberOfLines).toBe(3);
  });

  it('respects maxLength prop', () => {
    const { getByDisplayValue } = render(
      <InputField
        value="test"
        maxLength={10}
        onChangeText={() => {}}
        theme={mockTheme}
      />
    );

    const input = getByDisplayValue('test');
    expect(input.props.maxLength).toBe(10);
  });
});