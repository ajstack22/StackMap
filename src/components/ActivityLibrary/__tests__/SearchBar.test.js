import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: jest.fn(),
    onSearchClear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByTestId, getByPlaceholderText } = render(
      <SearchBar {...defaultProps} />
    );

    expect(getByTestId('search-input')).toBeTruthy();
    expect(getByPlaceholderText('Search activities...')).toBeTruthy();
  });

  it('renders with custom placeholder', () => {
    const { getByPlaceholderText } = render(
      <SearchBar {...defaultProps} placeholder="Custom placeholder" />
    );

    expect(getByPlaceholderText('Custom placeholder')).toBeTruthy();
  });

  it('displays search query value', () => {
    const { getByDisplayValue } = render(
      <SearchBar {...defaultProps} searchQuery="test query" />
    );

    expect(getByDisplayValue('test query')).toBeTruthy();
  });

  it('calls onSearchChange when text input changes', () => {
    const { getByTestId } = render(<SearchBar {...defaultProps} />);
    const input = getByTestId('search-input');

    fireEvent.changeText(input, 'new search');

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('new search');
  });

  it('shows clear button when search query is not empty', () => {
    const { getByTestId } = render(
      <SearchBar {...defaultProps} searchQuery="test" />
    );

    expect(getByTestId('clear-search-button')).toBeTruthy();
  });

  it('hides clear button when search query is empty', () => {
    const { queryByTestId } = render(
      <SearchBar {...defaultProps} searchQuery="" />
    );

    expect(queryByTestId('clear-search-button')).toBeNull();
  });

  it('calls onSearchClear when clear button is pressed', () => {
    const { getByTestId } = render(
      <SearchBar {...defaultProps} searchQuery="test" />
    );
    const clearButton = getByTestId('clear-search-button');

    fireEvent.press(clearButton);

    expect(defaultProps.onSearchClear).toHaveBeenCalledTimes(1);
  });

  it('applies custom style prop', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <SearchBar {...defaultProps} style={customStyle} testID="search-bar" />
    );

    const searchBar = getByTestId('search-bar');
    expect(searchBar.props.style).toContain(customStyle);
  });

  it('has proper accessibility labels', () => {
    const { getByTestId, getByLabelText } = render(
      <SearchBar {...defaultProps} searchQuery="test" />
    );

    expect(getByLabelText('Search input')).toBeTruthy();
    expect(getByLabelText('Clear search')).toBeTruthy();
  });

  it('supports testID prop', () => {
    const { getByTestId } = render(
      <SearchBar {...defaultProps} testID="custom-search-bar" />
    );

    expect(getByTestId('custom-search-bar')).toBeTruthy();
  });
});