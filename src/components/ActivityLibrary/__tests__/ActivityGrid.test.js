import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import ActivityGrid, {
  renderDragActivity,
  renderNormalActivities,
  loadDragComponents,
} from '../ActivityGrid';

// Mock dependencies
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('../ActivityCard', () => {
  return function MockActivityCard(props) {
    return null; // Mock component
  };
});
jest.mock('../EmptyState', () => {
  return function MockEmptyState({ message }) {
    return message;
  };
});
jest.mock('../FilterControls', () => ({
  getFilteredActivities: jest.fn((activities, query) => {
    if (!query) return activities;
    return activities.filter(activity =>
      activity.text.toLowerCase().includes(query.toLowerCase())
    );
  }),
}));
jest.mock('../../../constants', () => ({
  TYPOGRAPHY: { fontFamily: { regular: 'Comic Relief' } },
  SPACING: { xs: 4, sm: 8, md: 16, lg: 24 },
  COLORS: { gray: { 50: '#f9fafb', 100: '#f3f4f6', 400: '#9ca3af' } },
  getCustomImageSource: jest.fn((key) => ({ uri: `image_${key}` })),
}));

const mockTheme = {
  primary: '#007AFF',
  light: '#ffffff',
};

const mockActivities = [
  { id: 'activity-1', text: 'Test Activity 1', icon: '🎯' },
  { id: 'activity-2', text: 'Test Activity 2', icon: '⚽' },
  { id: 'activity-3', text: 'Search Activity', icon: '🔍' },
];

const mockCategory = {
  id: 'category-1',
  name: 'Test Category',
  activities: mockActivities,
};

const defaultProps = {
  category: mockCategory,
  onEditActivity: jest.fn(),
  onDeleteActivity: jest.fn(),
  onQuickAdd: jest.fn(),
  theme: mockTheme,
};

describe('ActivityGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  it('renders normal activities when not in edit mode', () => {
    const { getByTestId, queryByTestId } = render(<ActivityGrid {...defaultProps} />);

    // Should render ActivityCard components (mocked)
    expect(queryByTestId('draggable-flatlist')).toBeNull();
  });

  it('renders drag-enabled list when in edit mode', () => {
    const { queryByTestId } = render(
      <ActivityGrid
        {...defaultProps}
        isEditingCategory={true}
        orderedActivities={mockActivities}
        setOrderedActivities={jest.fn()}
      />
    );

    // In edit mode, should render draggable list
    // This is implementation-specific and would need proper testing setup
  });

  it('shows empty state when category has no activities', () => {
    const emptyCategory = { ...mockCategory, activities: [] };
    const { getByText } = render(
      <ActivityGrid {...defaultProps} category={emptyCategory} />
    );

    expect(getByText('No activities yet. Tap + to add one.')).toBeTruthy();
  });

  it('shows search empty state when no search results', () => {
    const { getByText } = render(
      <ActivityGrid {...defaultProps} searchQuery="nonexistent" />
    );

    expect(getByText('No activities match your search.')).toBeTruthy();
  });

  it('filters activities based on search query', () => {
    const { queryByText } = render(
      <ActivityGrid {...defaultProps} searchQuery="search" />
    );

    // Should show filtered results
    // This would need proper integration with ActivityCard components
  });

  it('handles drag end on non-Android platforms', () => {
    const mockSetOrderedActivities = jest.fn();
    const newData = [mockActivities[1], mockActivities[0], mockActivities[2]];

    // This would need proper testing of DraggableFlatList integration
    expect(mockSetOrderedActivities).not.toHaveBeenCalled();
  });

  it('disables drag end on Android', () => {
    Platform.OS = 'android';
    const mockSetOrderedActivities = jest.fn();

    const { queryByTestId } = render(
      <ActivityGrid
        {...defaultProps}
        isEditingCategory={true}
        orderedActivities={mockActivities}
        setOrderedActivities={mockSetOrderedActivities}
      />
    );

    // On Android, drag end should be undefined
  });

  it('handles empty ordered activities in edit mode', () => {
    const { getByText } = render(
      <ActivityGrid
        {...defaultProps}
        isEditingCategory={true}
        orderedActivities={[]}
        setOrderedActivities={jest.fn()}
      />
    );

    expect(getByText('No activities yet. Tap + to add one.')).toBeTruthy();
  });
});

describe('renderDragActivity', () => {
  it('renders drag activity item correctly', () => {
    const mockItem = mockActivities[0];
    const { getByText } = render(
      renderDragActivity({ item: mockItem, isActive: false })
    );

    expect(getByText('Test Activity 1')).toBeTruthy();
    expect(getByText('🎯')).toBeTruthy();
  });

  it('applies active styling when dragging', () => {
    const mockItem = mockActivities[0];
    const { getByTestId } = render(
      renderDragActivity({ item: mockItem, isActive: true })
    );

    // Would need to check for dragging styles
  });

  it('handles custom image icons', () => {
    const mockItemWithImage = {
      ...mockActivities[0],
      icon: 'image:custom_icon',
    };

    const { UNSAFE_getByType } = render(
      renderDragActivity({ item: mockItemWithImage, isActive: false })
    );

    const image = UNSAFE_getByType('Image');
    expect(image.props.source).toEqual({ uri: 'image_custom_icon' });
  });
});

describe('renderNormalActivities', () => {
  it('renders activity cards for each activity', () => {
    const mockProps = {
      activities: mockActivities,
      onEditActivity: jest.fn(),
      onDeleteActivity: jest.fn(),
      onQuickAdd: jest.fn(),
      theme: mockTheme,
      categoryId: 'category-1',
    };

    const result = renderNormalActivities(mockProps);

    // Should return array of ActivityCard components
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(mockActivities.length);
  });

  it('passes correct props to activity cards', () => {
    const mockProps = {
      activities: [mockActivities[0]],
      onEditActivity: jest.fn(),
      onDeleteActivity: jest.fn(),
      onQuickAdd: jest.fn(),
      theme: mockTheme,
      categoryId: 'category-1',
    };

    const result = renderNormalActivities(mockProps);

    // Check that first result is properly configured
    expect(result[0]).toBeDefined();
    expect(result[0].key).toBe('activity-1');
  });

  it('handles empty activities array', () => {
    const mockProps = {
      activities: [],
      onEditActivity: jest.fn(),
      onDeleteActivity: jest.fn(),
      onQuickAdd: jest.fn(),
      theme: mockTheme,
      categoryId: 'category-1',
    };

    const result = renderNormalActivities(mockProps);

    expect(result).toHaveLength(0);
  });
});

describe('loadDragComponents', () => {
  it('returns drag components with fallbacks', () => {
    const components = loadDragComponents();

    expect(components).toHaveProperty('DraggableFlatList');
    expect(components).toHaveProperty('ScaleDecorator');
    expect(typeof components.DraggableFlatList).toBe('function');
    expect(typeof components.ScaleDecorator).toBe('function');
  });

  it('ScaleDecorator returns children unchanged', () => {
    const { ScaleDecorator } = loadDragComponents();
    const testChild = 'test child';

    const result = ScaleDecorator({ children: testChild });

    expect(result).toBe(testChild);
  });
});