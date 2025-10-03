import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  const mockTheme = { primary: '#5C7E9D' };

  it('renders with default props', () => {
    const { getByText } = render(
      <EmptyState theme={mockTheme} />
    );
    expect(getByText('📋')).toBeTruthy();
    expect(getByText('No data')).toBeTruthy();
  });

  it('renders with custom icon and title', () => {
    const { getByText } = render(
      <EmptyState
        icon="📦"
        title="No items found"
        theme={mockTheme}
      />
    );
    expect(getByText('📦')).toBeTruthy();
    expect(getByText('No items found')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <EmptyState
        title="No results"
        subtitle="Try adjusting your filters"
        theme={mockTheme}
      />
    );
    expect(getByText('No results')).toBeTruthy();
    expect(getByText('Try adjusting your filters')).toBeTruthy();
  });

  it('renders action button when actionText and onAction are provided', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="No activities"
        actionText="Add Activity"
        onAction={onAction}
        theme={mockTheme}
      />
    );

    const button = getByText('Add Activity');
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when only actionText is provided', () => {
    const { queryByText } = render(
      <EmptyState
        title="No data"
        actionText="Add Item"
        theme={mockTheme}
      />
    );

    expect(queryByText('Add Item')).toBeNull();
  });

  it('does not render action button when only onAction is provided', () => {
    const { queryByText } = render(
      <EmptyState
        title="No data"
        onAction={() => {}}
        theme={mockTheme}
      />
    );

    expect(queryByText('Add Item')).toBeNull();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: '#f0f0f0' };
    const { getByText } = render(
      <EmptyState
        title="Empty"
        style={customStyle}
        theme={mockTheme}
      />
    );

    expect(getByText('Empty')).toBeTruthy();
  });
});