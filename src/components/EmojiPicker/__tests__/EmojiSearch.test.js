import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import EmojiSearch, { performEmojiSearch } from '../EmojiSearch';

// Mock constants
jest.mock('../../../constants', () => ({
  TYPOGRAPHY: {
    sizes: { lg: 18, md: 16, sm: 14, xs: 12 },
    fontFamily: { regular: 'Comic Relief' },
  },
  SPACING: { xl: 24, lg: 20, md: 16, sm: 12, xs: 8 },
  RADIUS: { lg: 12, md: 8 },
  COLORS: {
    gray: {
      900: '#000',
      600: '#666',
      500: '#999',
      100: '#f5f5f5',
    },
  },
  isTablet: () => false,
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

const mockTheme = {
  primary: '#667eea',
  light: '#E8F0FE',
};

const mockEmojiCategories = {
  Smileys: ['😀', '😃', '😄'],
  Animals: ['🐶', '🐱'],
  Custom: [
    { name: 'Test Image', src: 'test.png' },
  ],
};

const mockEmojiSearchIndex = {
  '😀': {
    emoji: '😀',
    searchTerms: ['grinning', 'face', 'smile'],
    category: 'Smileys',
    sortOrder: 1,
  },
  '😃': {
    emoji: '😃',
    searchTerms: ['smiley', 'face', 'happy'],
    category: 'Smileys',
    sortOrder: 2,
  },
  '🐶': {
    emoji: '🐶',
    searchTerms: ['dog', 'face', 'animal'],
    category: 'Animals',
    sortOrder: 1,
  },
};

describe('EmojiSearch', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: jest.fn(),
    onClearSearch: jest.fn(),
    detectedEmoji: '',
    onSelectDetectedEmoji: jest.fn(),
    theme: mockTheme,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input correctly', () => {
    render(<EmojiSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search, type, or paste emoji...');
    expect(searchInput).toBeTruthy();
  });

  it('calls onSearchChange when text input changes', () => {
    const onSearchChange = jest.fn();
    render(<EmojiSearch {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText('Search, type, or paste emoji...');
    fireEvent.changeText(searchInput, 'dog');

    expect(onSearchChange).toHaveBeenCalledWith('dog');
  });

  it('shows clear button when searchQuery is not empty', () => {
    render(<EmojiSearch {...defaultProps} searchQuery="test" />);

    const clearButton = screen.getByTestId('clear-search');
    expect(clearButton).toBeTruthy();
  });

  it('calls onClearSearch when clear button is pressed', () => {
    const onClearSearch = jest.fn();
    render(
      <EmojiSearch
        {...defaultProps}
        searchQuery="test"
        onClearSearch={onClearSearch}
      />
    );

    const clearButton = screen.getByTestId('clear-search');
    fireEvent.press(clearButton);

    expect(onClearSearch).toHaveBeenCalled();
  });

  it('shows detected emoji section when emoji is detected', () => {
    render(
      <EmojiSearch
        {...defaultProps}
        searchQuery="😀"
        detectedEmoji="😀"
      />
    );

    const detectedEmojiText = screen.getByText('Tap to use your emoji:');
    expect(detectedEmojiText).toBeTruthy();

    const emojiButton = screen.getByText('😀');
    expect(emojiButton).toBeTruthy();
  });

  it('calls onSelectDetectedEmoji when detected emoji button is pressed', () => {
    const onSelectDetectedEmoji = jest.fn();
    render(
      <EmojiSearch
        {...defaultProps}
        searchQuery="😀"
        detectedEmoji="😀"
        onSelectDetectedEmoji={onSelectDetectedEmoji}
      />
    );

    const emojiButton = screen.getByText('😀');
    fireEvent.press(emojiButton);

    expect(onSelectDetectedEmoji).toHaveBeenCalled();
  });
});

describe('performEmojiSearch', () => {
  it('returns empty results for empty search query', () => {
    const result = performEmojiSearch('', mockEmojiCategories, mockEmojiSearchIndex);

    expect(result.filteredItems).toEqual([]);
    expect(result.detectedEmoji).toBe('');
  });

  it('searches emojis by search terms', () => {
    const result = performEmojiSearch('dog', mockEmojiCategories, mockEmojiSearchIndex);

    expect(result.filteredItems).toHaveLength(1);
    expect(result.filteredItems[0]).toEqual({
      type: 'emoji',
      icon: '🐶',
      category: 'Animals',
    });
  });

  it('searches custom images by name', () => {
    const result = performEmojiSearch('test', mockEmojiCategories, mockEmojiSearchIndex);

    expect(result.filteredItems).toHaveLength(1);
    expect(result.filteredItems[0]).toEqual({
      type: 'image',
      name: 'Test Image',
      src: 'test.png',
      category: 'Custom',
    });
  });

  it('detects emoji in search query', () => {
    const result = performEmojiSearch('😀 happy', mockEmojiCategories, mockEmojiSearchIndex);

    expect(result.detectedEmoji).toBe('😀');
  });

  it('searches case-insensitively', () => {
    const result = performEmojiSearch('DOG', mockEmojiCategories, mockEmojiSearchIndex);

    expect(result.filteredItems).toHaveLength(1);
    expect(result.filteredItems[0].icon).toBe('🐶');
  });

  it('handles partial matches in search terms', () => {
    const result = performEmojiSearch('grin', mockEmojiCategories, mockEmojiSearchIndex);

    expect(result.filteredItems).toHaveLength(1);
    expect(result.filteredItems[0].icon).toBe('😀');
  });
});