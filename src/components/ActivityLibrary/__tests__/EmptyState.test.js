import React from 'react';
import { render } from '@testing-library/react-native';
import EmptyState, {
  getEmptyStateMessage,
  EmptyStateTypes,
  PresetEmptyState
} from '../EmptyState';

// Mock dependencies
jest.mock('../../../constants', () => ({
  TYPOGRAPHY: { fontFamily: { regular: 'Comic Relief' } },
  SPACING: { lg: 24 },
}));

describe('EmptyState', () => {
  it('renders the message correctly', () => {
    const message = 'No items found';
    const { getByText } = render(<EmptyState message={message} />);

    expect(getByText(message)).toBeTruthy();
  });

  it('applies custom styles correctly', () => {
    const message = 'Custom styled message';
    const customStyle = { backgroundColor: 'red' };
    const customTextStyle = { fontSize: 20 };

    const { getByText } = render(
      <EmptyState
        message={message}
        style={customStyle}
        textStyle={customTextStyle}
      />
    );

    const textElement = getByText(message);
    expect(textElement).toBeTruthy();
  });

  it('handles empty message gracefully', () => {
    const { getByText } = render(<EmptyState message="" />);

    expect(getByText('')).toBeTruthy();
  });
});

describe('getEmptyStateMessage', () => {
  it('returns correct message when no activities', () => {
    const message = getEmptyStateMessage('NO_ACTIVITIES', false, false, '');
    expect(message).toBe('No activities yet. Tap + to add one.');
  });

  it('returns correct message for search with no results', () => {
    const message = getEmptyStateMessage('NO_SEARCH_RESULTS', true, true, 'test');
    expect(message).toBe('No activities match your search.');
  });

  it('returns general message as fallback', () => {
    const message = getEmptyStateMessage('UNKNOWN', true, false, '');
    expect(message).toBe('No activities found.');
  });
});

describe('EmptyStateTypes', () => {
  it('contains all expected types', () => {
    expect(EmptyStateTypes.NO_ACTIVITIES).toBeDefined();
    expect(EmptyStateTypes.NO_SEARCH_RESULTS).toBeDefined();
    expect(EmptyStateTypes.NO_CATEGORY_ACTIVITIES).toBeDefined();
    expect(EmptyStateTypes.GENERAL).toBeDefined();
  });

  it('has correct structure for each type', () => {
    Object.values(EmptyStateTypes).forEach(type => {
      expect(type).toHaveProperty('message');
      expect(type).toHaveProperty('icon');
      expect(typeof type.message).toBe('string');
      expect(typeof type.icon).toBe('string');
    });
  });

  it('has correct messages for each type', () => {
    expect(EmptyStateTypes.NO_ACTIVITIES.message).toBe('No activities yet. Tap + to add one.');
    expect(EmptyStateTypes.NO_SEARCH_RESULTS.message).toBe('No activities match your search.');
    expect(EmptyStateTypes.NO_CATEGORY_ACTIVITIES.message).toBe('This category is empty. Add some activities!');
    expect(EmptyStateTypes.GENERAL.message).toBe('No activities found.');
  });
});

describe('PresetEmptyState', () => {
  it('renders with default GENERAL type', () => {
    const { getByText } = render(<PresetEmptyState />);

    expect(getByText(EmptyStateTypes.GENERAL.message)).toBeTruthy();
  });

  it('renders with specified type', () => {
    const { getByText } = render(<PresetEmptyState type="NO_ACTIVITIES" />);

    expect(getByText(EmptyStateTypes.NO_ACTIVITIES.message)).toBeTruthy();
  });

  it('uses custom message when provided', () => {
    const customMessage = 'Custom empty state message';
    const { getByText } = render(
      <PresetEmptyState type="NO_ACTIVITIES" customMessage={customMessage} />
    );

    expect(getByText(customMessage)).toBeTruthy();
  });

  it('falls back to GENERAL type for invalid type', () => {
    const { getByText } = render(<PresetEmptyState type="INVALID_TYPE" />);

    expect(getByText(EmptyStateTypes.GENERAL.message)).toBeTruthy();
  });

  it('passes through additional props', () => {
    const customStyle = { backgroundColor: 'blue' };
    const { getByText } = render(
      <PresetEmptyState style={customStyle} />
    );

    const textElement = getByText(EmptyStateTypes.GENERAL.message);
    expect(textElement).toBeTruthy();
  });

  it('handles NO_SEARCH_RESULTS type correctly', () => {
    const { getByText } = render(<PresetEmptyState type="NO_SEARCH_RESULTS" />);

    expect(getByText(EmptyStateTypes.NO_SEARCH_RESULTS.message)).toBeTruthy();
  });

  it('handles NO_CATEGORY_ACTIVITIES type correctly', () => {
    const { getByText } = render(<PresetEmptyState type="NO_CATEGORY_ACTIVITIES" />);

    expect(getByText(EmptyStateTypes.NO_CATEGORY_ACTIVITIES.message)).toBeTruthy();
  });
});