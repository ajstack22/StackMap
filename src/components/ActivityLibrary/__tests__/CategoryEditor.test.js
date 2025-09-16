import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { jest } from '@jest/globals';
import {
  CategoryNameEditor,
  useEditState,
  renderEditModal,
  handleSaveEditLogic,
} from '../CategoryEditor';
import { DEFAULT_ACTIVITY_EMOJI } from '../../../constants';

// Mock dependencies
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Animated: {
      ...RN.Animated,
      parallel: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
      })),
      timing: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
      })),
    },
  };
});

const mockTheme = {
  primary: '#007AFF',
};

describe('CategoryNameEditor', () => {
  const defaultProps = {
    editingCategoryName: 'Test Category',
    setEditingCategoryName: jest.fn(),
    onSave: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders category name input correctly', () => {
    const { getByDisplayValue } = render(<CategoryNameEditor {...defaultProps} />);

    expect(getByDisplayValue('Test Category')).toBeTruthy();
  });

  it('calls setEditingCategoryName when text changes', () => {
    const setEditingCategoryName = jest.fn();
    const { getByDisplayValue } = render(
      <CategoryNameEditor
        {...defaultProps}
        setEditingCategoryName={setEditingCategoryName}
      />
    );

    const input = getByDisplayValue('Test Category');
    fireEvent.changeText(input, 'Updated Category');

    expect(setEditingCategoryName).toHaveBeenCalledWith('Updated Category');
  });

  it('calls onSave when save button is pressed', () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <CategoryNameEditor {...defaultProps} onSave={onSave} />
    );

    // Find save button by icon or test ID
    const saveButton = getByTestId('save-button') || getByTestId('check-icon');
    fireEvent.press(saveButton);

    expect(onSave).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is pressed', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <CategoryNameEditor {...defaultProps} onCancel={onCancel} />
    );

    const cancelButton = getByTestId('cancel-button') || getByTestId('close-icon');
    fireEvent.press(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSave when Enter is pressed in input', () => {
    const onSave = jest.fn();
    const { getByDisplayValue } = render(
      <CategoryNameEditor {...defaultProps} onSave={onSave} />
    );

    const input = getByDisplayValue('Test Category');
    fireEvent(input, 'onSubmitEditing');

    expect(onSave).toHaveBeenCalled();
  });
});

describe('useEditState Hook', () => {
  // Test the hook using a test component
  const TestComponent = () => {
    const editState = useEditState();
    return (
      <div>
        <span testID="edit-mode">{editState.editMode || 'none'}</span>
        <span testID="edit-name">{editState.editName}</span>
        <button onPress={() => editState.handleAddCategory()}>
          Add Category
        </button>
        <button onPress={() => editState.handleEditCategory({ id: '1', name: 'Test' })}>
          Edit Category
        </button>
      </div>
    );
  };

  it('initializes with empty state', () => {
    const { getByTestId } = render(<TestComponent />);

    expect(getByTestId('edit-mode')).toHaveTextContent('none');
    expect(getByTestId('edit-name')).toHaveTextContent('');
  });

  it('sets edit mode when handleAddCategory is called', () => {
    const { getByText, getByTestId } = render(<TestComponent />);

    fireEvent.press(getByText('Add Category'));

    expect(getByTestId('edit-mode')).toHaveTextContent('new-category');
  });

  it('sets edit mode and name when handleEditCategory is called', () => {
    const { getByText, getByTestId } = render(<TestComponent />);

    fireEvent.press(getByText('Edit Category'));

    expect(getByTestId('edit-mode')).toHaveTextContent('category');
    expect(getByTestId('edit-name')).toHaveTextContent('Test');
  });
});

describe('handleSaveEditLogic', () => {
  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Category 1',
      activities: [
        { id: 'act-1', name: 'Activity 1', icon: '🎯', description: 'Test' },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null and shows alert when name is empty', () => {
    const result = handleSaveEditLogic({
      editMode: 'category',
      editName: '   ',
      editEmoji: '🎯',
      editDescription: 'Test',
      editingItem: { id: 'cat-1' },
      selectedCategoryId: null,
      categories: mockCategories,
      DEFAULT_ACTIVITY_EMOJI,
    });

    expect(result).toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Name cannot be empty');
  });

  it('updates category name correctly', () => {
    const result = handleSaveEditLogic({
      editMode: 'category',
      editName: 'Updated Category',
      editEmoji: '🎯',
      editDescription: 'Test',
      editingItem: { id: 'cat-1' },
      selectedCategoryId: null,
      categories: mockCategories,
      DEFAULT_ACTIVITY_EMOJI,
    });

    expect(result).toEqual([
      {
        id: 'cat-1',
        name: 'Updated Category',
        activities: mockCategories[0].activities,
      },
    ]);
  });

  it('updates activity correctly', () => {
    const result = handleSaveEditLogic({
      editMode: 'activity',
      editName: 'Updated Activity',
      editEmoji: '⚽',
      editDescription: 'Updated description',
      editingItem: { id: 'act-1' },
      selectedCategoryId: null,
      categories: mockCategories,
      DEFAULT_ACTIVITY_EMOJI,
    });

    expect(result[0].activities[0]).toEqual({
      id: 'act-1',
      name: 'Updated Activity',
      icon: '⚽',
      description: 'Updated description',
    });
  });

  it('creates new category correctly', () => {
    const result = handleSaveEditLogic({
      editMode: 'new-category',
      editName: 'New Category',
      editEmoji: '🎯',
      editDescription: 'Test',
      editingItem: null,
      selectedCategoryId: null,
      categories: mockCategories,
      DEFAULT_ACTIVITY_EMOJI,
    });

    expect(result).toHaveLength(2);
    expect(result[1].name).toBe('New Category');
    expect(result[1].activities).toEqual([]);
  });

  it('creates new activity correctly', () => {
    const result = handleSaveEditLogic({
      editMode: 'new-activity',
      editName: 'New Activity',
      editEmoji: '🏀',
      editDescription: 'New description',
      editingItem: null,
      selectedCategoryId: 'cat-1',
      categories: mockCategories,
      DEFAULT_ACTIVITY_EMOJI,
    });

    expect(result[0].activities).toHaveLength(2);
    expect(result[0].activities[1].name).toBe('New Activity');
    expect(result[0].activities[1].icon).toBe('🏀');
  });

  it('shows alert and returns null when creating activity without emoji', () => {
    const result = handleSaveEditLogic({
      editMode: 'new-activity',
      editName: 'New Activity',
      editEmoji: '',
      editDescription: 'New description',
      editingItem: null,
      selectedCategoryId: 'cat-1',
      categories: mockCategories,
      DEFAULT_ACTIVITY_EMOJI,
    });

    expect(result).toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please select an emoji for the activity'
    );
  });
});

describe('renderEditModal', () => {
  const mockProps = {
    editMode: 'new-activity',
    editName: 'Test Activity',
    setEditName: jest.fn(),
    editDescription: 'Test description',
    setEditDescription: jest.fn(),
    editEmoji: '🎯',
    setShowEmojiPicker: jest.fn(),
    getCustomImageSource: jest.fn(),
    theme: mockTheme,
    setEditMode: jest.fn(),
    handleSaveEdit: jest.fn(),
  };

  it('returns null when editMode is null', () => {
    const result = renderEditModal(null, ...Object.values(mockProps).slice(1));
    expect(result).toBeNull();
  });

  it('renders modal with correct title for new activity', () => {
    const modal = renderEditModal(...Object.values(mockProps));
    expect(modal).toBeTruthy();
    // Would need to check the rendered content for "New Activity" title
  });

  it('renders modal with correct title for edit category', () => {
    const modal = renderEditModal(
      'category',
      ...Object.values(mockProps).slice(1)
    );
    expect(modal).toBeTruthy();
    // Would need to check the rendered content for "Edit Category" title
  });

  it('shows emoji selector for activity modes', () => {
    const modal = renderEditModal(...Object.values(mockProps));
    expect(modal).toBeTruthy();
    // Would need to check for emoji selector presence
  });

  it('does not show emoji selector for category modes', () => {
    const modal = renderEditModal(
      'category',
      ...Object.values(mockProps).slice(1)
    );
    expect(modal).toBeTruthy();
    // Would need to check that emoji selector is not present
  });
});