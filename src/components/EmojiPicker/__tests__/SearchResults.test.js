import React from 'react';
import { render } from '@testing-library/react-native';
import SearchResults from '../SearchResults';

// Mock constants
jest.mock('../../../constants', () => ({
  SHADOWS: { level2: { shadowOpacity: 0.1 } },
  TYPOGRAPHY: {
    sizes: { lg: 18, md: 16, sm: 14, xs: 12 },
    fontFamily: { regular: 'Comic Relief' },
  },
  SPACING: { xl: 24, lg: 20, md: 16, sm: 12, xs: 8 },
  RADIUS: { lg: 12, md: 8 },
  COLORS: {
    gray: { 900: '#000', 200: '#e5e5e5' },
  },
  isTablet: () => false,
  getCustomImageSource: jest.fn((src) => ({ uri: `mock://${src}` })),
}));

const mockFilteredItems = [
  { type: 'emoji', icon: '😀', category: 'Smileys' },
  { type: 'emoji', icon: '🐶', category: 'Animals' },
  { type: 'image', name: 'Test Image', src: 'test.png', category: 'Custom' },
];

describe('SearchResults Component', () => {
  const defaultProps = {
    filteredItems: mockFilteredItems,
    numColumns: 6,
    selectedCategory: 'Smileys',
    selectedSkinTone: null,
    selectedEmoji: '',
    onSelect: jest.fn(),
    isSearching: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<SearchResults {...defaultProps} />);

    const container = getByTestId('search-results-container');
    expect(container).toBeTruthy();
  });

  it('renders with empty filtered items', () => {
    const { getByTestId } = render(
      <SearchResults {...defaultProps} filteredItems={[]} />
    );

    const container = getByTestId('search-results-container');
    expect(container).toBeTruthy();
  });

  it('handles skin tone props correctly', () => {
    const { getByTestId } = render(
      <SearchResults
        {...defaultProps}
        selectedCategory="People"
        selectedSkinTone="🏻"
      />
    );

    const container = getByTestId('search-results-container');
    expect(container).toBeTruthy();
  });

  it('handles selected emoji prop', () => {
    const { getByTestId } = render(
      <SearchResults
        {...defaultProps}
        selectedEmoji="😀"
      />
    );

    const container = getByTestId('search-results-container');
    expect(container).toBeTruthy();
  });

  it('handles custom image selection', () => {
    const { getByTestId } = render(
      <SearchResults
        {...defaultProps}
        selectedEmoji="image:test.png"
      />
    );

    const container = getByTestId('search-results-container');
    expect(container).toBeTruthy();
  });

  it('handles different column counts', () => {
    const { getByTestId } = render(
      <SearchResults
        {...defaultProps}
        numColumns={8}
      />
    );

    const container = getByTestId('search-results-container');
    expect(container).toBeTruthy();
  });

  it('handles search state', () => {
    const { getByTestId } = render(
      <SearchResults
        {...defaultProps}
        isSearching={true}
      />
    );

    const container = getByTestId('search-results-container');
    expect(container).toBeTruthy();
  });
});