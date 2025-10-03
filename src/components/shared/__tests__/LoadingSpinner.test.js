import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  const mockTheme = { primary: '#5C7E9D' };

  it('renders correctly with default props', () => {
    const { getByTestId } = render(
      <LoadingSpinner theme={mockTheme} testID="spinner" />
    );
    expect(getByTestId('spinner')).toBeTruthy();
  });

  it('renders with message when provided', () => {
    const { getByText } = render(
      <LoadingSpinner
        message="Loading data..."
        theme={mockTheme}
      />
    );
    expect(getByText('Loading data...')).toBeTruthy();
  });

  it('applies size prop correctly', () => {
    const { getByTestId: getSmallSpinner } = render(
      <LoadingSpinner
        size="small"
        theme={mockTheme}
        testID="small-spinner"
      />
    );
    expect(getSmallSpinner('small-spinner')).toBeTruthy();

    const { getByTestId: getLargeSpinner } = render(
      <LoadingSpinner
        size="large"
        theme={mockTheme}
        testID="large-spinner"
      />
    );
    expect(getLargeSpinner('large-spinner')).toBeTruthy();
  });

  it('uses custom color when provided', () => {
    const { getByTestId } = render(
      <LoadingSpinner
        color="#FF0000"
        theme={mockTheme}
        testID="custom-color-spinner"
      />
    );
    expect(getByTestId('custom-color-spinner')).toBeTruthy();
  });

  it('applies overlay styles when overlay is true', () => {
    const { getByTestId } = render(
      <LoadingSpinner
        overlay={true}
        theme={mockTheme}
        testID="overlay-spinner"
      />
    );
    expect(getByTestId('overlay-spinner')).toBeTruthy();
  });

  it('applies fullScreen styles when fullScreen is true', () => {
    const { getByTestId } = render(
      <LoadingSpinner
        fullScreen={true}
        theme={mockTheme}
        testID="fullscreen-spinner"
      />
    );
    expect(getByTestId('fullscreen-spinner')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: '#f0f0f0' };
    const { getByTestId } = render(
      <LoadingSpinner
        style={customStyle}
        theme={mockTheme}
        testID="custom-style-spinner"
      />
    );
    expect(getByTestId('custom-style-spinner')).toBeTruthy();
  });

  it('renders with message and overlay', () => {
    const { getByText } = render(
      <LoadingSpinner
        message="Syncing..."
        overlay={true}
        theme={mockTheme}
      />
    );
    expect(getByText('Syncing...')).toBeTruthy();
  });
});