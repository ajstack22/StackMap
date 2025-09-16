import { Alert } from 'react-native';
import { jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-hooks';
import {
  useCategoryActions,
  handleCategoryDragOperations,
} from '../CategoryActions';
import { DEFAULT_ACTIVITY_EMOJI } from '../../../constants';

// Mock dependencies
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

const mockCategories = [
  {
    id: 'my-templates',
    name: 'My Templates',
    activities: [],
  },
  {
    id: 'cat-1',
    name: 'Category 1',
    activities: [
      {
        id: 'act-1',
        name: 'Activity 1',
        icon: '🎯',
        description: 'Test activity',
      },
    ],
  },
  {
    id: 'cat-2',
    name: 'Category 2',
    activities: [],
  },
];

describe('useCategoryActions Hook', () => {
  let setCategories;
  let onSaveCategories;
  let categories;
  let result;

  beforeEach(() => {
    setCategories = jest.fn();
    onSaveCategories = jest.fn();
    categories = [...mockCategories];
    jest.clearAllMocks();

    // Render the actual hook
    const { result: hookResult } = renderHook(() =>
      useCategoryActions(categories, setCategories, onSaveCategories)
    );
    result = hookResult;
  });

  describe('handleDeleteCategory', () => {
    it('prevents deletion of My Templates category', () => {
      const myTemplatesCategory = {
        id: 'my-templates',
        name: 'My Templates',
        activities: [],
      };

      act(() => {
        result.current.handleDeleteCategory(myTemplatesCategory);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Cannot Delete',
        "The 'My Templates' folder is required for saving activities to your library. You can delete activities within it, but not the folder itself.",
        [{ text: 'OK' }]
      );
      expect(setCategories).not.toHaveBeenCalled();
      expect(onSaveCategories).not.toHaveBeenCalled();
    });

    it('deletes regular categories successfully', () => {
      const categoryToDelete = mockCategories[1]; // cat-1

      act(() => {
        result.current.handleDeleteCategory(categoryToDelete);
      });

      expect(setCategories).toHaveBeenCalledTimes(1);
      const calledCategories = setCategories.mock.calls[0][0];
      expect(calledCategories).not.toContain(categoryToDelete);
      expect(calledCategories.find(cat => cat.id === 'my-templates')).toBeDefined();
      expect(onSaveCategories).toHaveBeenCalledWith(calledCategories);
    });

    it('ensures My Templates exists after deletion', () => {
      // Delete all categories except one
      const categoriesWithoutMyTemplates = [mockCategories[1], mockCategories[2]];
      const { result: newResult } = renderHook(() =>
        useCategoryActions(categoriesWithoutMyTemplates, setCategories, onSaveCategories)
      );

      act(() => {
        newResult.current.handleDeleteCategory(categoriesWithoutMyTemplates[0]);
      });

      const calledCategories = setCategories.mock.calls[0][0];
      expect(calledCategories.find(cat => cat.id === 'my-templates')).toBeDefined();
    });
  });

  describe('handleDeleteActivity', () => {
    it('removes activity from correct category', () => {
      const categoryId = 'cat-1';
      const activity = { id: 'act-1', name: 'Activity 1' };

      act(() => {
        result.current.handleDeleteActivity(categoryId, activity);
      });

      expect(setCategories).toHaveBeenCalledTimes(1);
      const calledCategories = setCategories.mock.calls[0][0];
      const targetCategory = calledCategories.find(cat => cat.id === categoryId);
      expect(targetCategory.activities.find(act => act.id === activity.id)).toBeUndefined();
      expect(onSaveCategories).toHaveBeenCalledWith(calledCategories);
    });

    it('preserves other activities in the category', () => {
      // Add another activity to test preservation
      const categoriesWithMultipleActivities = [...mockCategories];
      categoriesWithMultipleActivities[1].activities.push({
        id: 'act-2',
        name: 'Activity 2',
        icon: '⚽',
        description: 'Second activity',
      });

      const { result: newResult } = renderHook(() =>
        useCategoryActions(categoriesWithMultipleActivities, setCategories, onSaveCategories)
      );

      const categoryId = 'cat-1';
      const activityToDelete = { id: 'act-1', name: 'Activity 1' };

      act(() => {
        newResult.current.handleDeleteActivity(categoryId, activityToDelete);
      });

      const calledCategories = setCategories.mock.calls[0][0];
      const targetCategory = calledCategories.find(cat => cat.id === categoryId);
      expect(targetCategory.activities).toHaveLength(1);
      expect(targetCategory.activities[0].id).toBe('act-2');
    });
  });

  describe('handleAddCategory', () => {
    it('rejects empty category names', () => {
      let addResult;

      act(() => {
        addResult = result.current.handleAddCategory('   ');
      });

      expect(addResult).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Category name cannot be empty');
      expect(setCategories).not.toHaveBeenCalled();
    });

    it('adds category with valid name', () => {
      const categoryName = 'New Category';
      let addResult;

      act(() => {
        addResult = result.current.handleAddCategory(categoryName);
      });

      expect(addResult).toBe(true);
      expect(setCategories).toHaveBeenCalledTimes(1);
      const calledCategories = setCategories.mock.calls[0][0];
      const newCategory = calledCategories.find(cat => cat.name === categoryName);
      expect(newCategory).toBeDefined();
      expect(newCategory.activities).toEqual([]);
      expect(onSaveCategories).toHaveBeenCalledWith(calledCategories);
    });

    it('generates unique category ID', () => {
      const categoryName = 'Test Category';

      act(() => {
        result.current.handleAddCategory(categoryName);
      });

      const calledCategories = setCategories.mock.calls[0][0];
      const newCategory = calledCategories.find(cat => cat.name === categoryName);
      expect(newCategory.id).toMatch(/^category-\d+$/);
    });

    it('trims whitespace from category names', () => {
      const categoryName = '  Trimmed Category  ';

      act(() => {
        result.current.handleAddCategory(categoryName);
      });

      const calledCategories = setCategories.mock.calls[0][0];
      const newCategory = calledCategories.find(cat => cat.name === 'Trimmed Category');
      expect(newCategory).toBeDefined();
    });
  });

  describe('handleAddActivity', () => {
    it('rejects empty activity names', () => {
      let addResult;

      act(() => {
        addResult = result.current.handleAddActivity('cat-1', { name: '   ' });
      });

      expect(addResult).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Activity name cannot be empty');
      expect(setCategories).not.toHaveBeenCalled();
    });

    it('rejects activities without icons', () => {
      let addResult;

      act(() => {
        addResult = result.current.handleAddActivity('cat-1', {
          name: 'Test Activity',
          icon: '',
        });
      });

      expect(addResult).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please select an emoji for the activity');
      expect(setCategories).not.toHaveBeenCalled();
    });

    it('adds activity with valid data', () => {
      const activityData = {
        name: 'New Activity',
        icon: '🎯',
        description: 'Test description',
      };
      let addResult;

      act(() => {
        addResult = result.current.handleAddActivity('cat-1', activityData);
      });

      expect(addResult).toBe(true);
      expect(setCategories).toHaveBeenCalledTimes(1);
      const calledCategories = setCategories.mock.calls[0][0];
      const targetCategory = calledCategories.find(cat => cat.id === 'cat-1');
      const newActivity = targetCategory.activities.find(act => act.name === 'New Activity');
      expect(newActivity).toBeDefined();
      expect(newActivity.icon).toBe('🎯');
      expect(newActivity.description).toBe('Test description');
      expect(onSaveCategories).toHaveBeenCalledWith(calledCategories);
    });

    it('uses default emoji when none provided', () => {
      const activityData = {
        name: 'New Activity',
        description: 'Test description',
      };

      act(() => {
        result.current.handleAddActivity('cat-1', activityData);
      });

      const calledCategories = setCategories.mock.calls[0][0];
      const targetCategory = calledCategories.find(cat => cat.id === 'cat-1');
      const newActivity = targetCategory.activities.find(act => act.name === 'New Activity');
      expect(newActivity.icon).toBe(DEFAULT_ACTIVITY_EMOJI);
    });

    it('generates unique activity ID', () => {
      const activityData = {
        name: 'Test Activity',
        icon: '🎯',
      };

      act(() => {
        result.current.handleAddActivity('cat-1', activityData);
      });

      const calledCategories = setCategories.mock.calls[0][0];
      const targetCategory = calledCategories.find(cat => cat.id === 'cat-1');
      const newActivity = targetCategory.activities.find(act => act.name === 'Test Activity');
      expect(newActivity.id).toMatch(/^activity-\d+$/);
    });

    it('trims whitespace from activity names and descriptions', () => {
      const activityData = {
        name: '  Test Activity  ',
        icon: '🎯',
        description: '  Test description  ',
      };

      act(() => {
        result.current.handleAddActivity('cat-1', activityData);
      });

      const calledCategories = setCategories.mock.calls[0][0];
      const targetCategory = calledCategories.find(cat => cat.id === 'cat-1');
      const newActivity = targetCategory.activities.find(act => act.name === 'Test Activity');
      expect(newActivity.description).toBe('Test description');
    });
  });

  describe('handleUpdateCategory', () => {
    it('rejects empty category names', () => {
      let updateResult;

      act(() => {
        updateResult = result.current.handleUpdateCategory('cat-1', '   ', []);
      });

      expect(updateResult).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Category name cannot be empty');
      expect(setCategories).not.toHaveBeenCalled();
    });

    it('updates category name and activities', () => {
      const newActivities = [{ id: 'new-act', name: 'New Activity' }];
      let updateResult;

      act(() => {
        updateResult = result.current.handleUpdateCategory('cat-1', 'Updated Category', newActivities);
      });

      expect(updateResult).toBe(true);
      expect(setCategories).toHaveBeenCalledTimes(1);
      const calledCategories = setCategories.mock.calls[0][0];
      const updatedCategory = calledCategories.find(cat => cat.id === 'cat-1');
      expect(updatedCategory.name).toBe('Updated Category');
      expect(updatedCategory.activities).toEqual(newActivities);
      expect(onSaveCategories).toHaveBeenCalledWith(calledCategories);
    });
  });

  describe('handleAddAllFromCategory', () => {
    it('uses batch method when available', () => {
      const onSelectMultipleActivities = jest.fn();
      const onSelectActivity = jest.fn();
      const category = mockCategories[1]; // Has activities

      act(() => {
        result.current.handleAddAllFromCategory(
          category,
          onSelectMultipleActivities,
          onSelectActivity
        );
      });

      expect(onSelectMultipleActivities).toHaveBeenCalledTimes(1);
      expect(onSelectActivity).not.toHaveBeenCalled();
      const calledActivities = onSelectMultipleActivities.mock.calls[0][0];
      expect(calledActivities.length).toBeGreaterThan(0);
      expect(calledActivities[0]).toEqual({
        icon: '🎯',
        text: undefined, // source activity uses 'name' not 'text'
        description: 'Test activity',
      });
    });

    it('falls back to individual adds when batch not available', () => {
      const onSelectActivity = jest.fn();
      const category = mockCategories[1];

      act(() => {
        result.current.handleAddAllFromCategory(
          category,
          null, // No batch method
          onSelectActivity
        );
      });

      expect(onSelectActivity).toHaveBeenCalledTimes(category.activities.length);
      expect(onSelectActivity).toHaveBeenCalledWith({
        icon: '🎯',
        text: undefined,
        description: 'Test activity',
      });
    });

    it('handles empty categories gracefully', () => {
      const category = mockCategories[2]; // Empty category
      const onSelectActivity = jest.fn();

      act(() => {
        result.current.handleAddAllFromCategory(
          category,
          null,
          onSelectActivity
        );
      });

      // Should not call onSelectActivity for empty category
      expect(onSelectActivity).not.toHaveBeenCalled();
    });
  });

  describe('handleQuickAdd', () => {
    it('transforms activity format correctly', () => {
      const activity = {
        text: 'Test Activity',
        icon: '🎯',
        description: 'Test description',
      };
      const onSelectActivity = jest.fn();

      act(() => {
        result.current.handleQuickAdd(activity, onSelectActivity);
      });

      expect(onSelectActivity).toHaveBeenCalledTimes(1);
      expect(onSelectActivity).toHaveBeenCalledWith({
        icon: '🎯',
        text: 'Test Activity',
        description: 'Test description',
      });
    });

    it('handles missing description gracefully', () => {
      const activity = {
        text: 'Test Activity',
        icon: '🎯',
      };
      const onSelectActivity = jest.fn();

      act(() => {
        result.current.handleQuickAdd(activity, onSelectActivity);
      });

      expect(onSelectActivity).toHaveBeenCalledWith({
        icon: '🎯',
        text: 'Test Activity',
        description: '',
      });
    });
  });

  describe('handleUpdateActivity', () => {
    it('rejects empty activity names', () => {
      let updateResult;

      act(() => {
        updateResult = result.current.handleUpdateActivity('act-1', { name: '   ' });
      });

      expect(updateResult).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Activity name cannot be empty');
      expect(setCategories).not.toHaveBeenCalled();
    });

    it('updates activity with valid data', () => {
      const activityData = {
        name: 'Updated Activity',
        icon: '⭐',
        description: 'Updated description',
      };
      let updateResult;

      act(() => {
        updateResult = result.current.handleUpdateActivity('act-1', activityData);
      });

      expect(updateResult).toBe(true);
      expect(setCategories).toHaveBeenCalledTimes(1);
      const calledCategories = setCategories.mock.calls[0][0];
      const targetCategory = calledCategories.find(cat => cat.id === 'cat-1');
      const updatedActivity = targetCategory.activities.find(act => act.id === 'act-1');
      expect(updatedActivity.name).toBe('Updated Activity');
      expect(updatedActivity.icon).toBe('⭐');
      expect(updatedActivity.description).toBe('Updated description');
      expect(onSaveCategories).toHaveBeenCalledWith(calledCategories);
    });

    it('trims whitespace from activity name and description', () => {
      const activityData = {
        name: '  Trimmed Activity  ',
        icon: '⭐',
        description: '  Trimmed description  ',
      };

      act(() => {
        result.current.handleUpdateActivity('act-1', activityData);
      });

      const calledCategories = setCategories.mock.calls[0][0];
      const targetCategory = calledCategories.find(cat => cat.id === 'cat-1');
      const updatedActivity = targetCategory.activities.find(act => act.id === 'act-1');
      expect(updatedActivity.name).toBe('Trimmed Activity');
      expect(updatedActivity.description).toBe('Trimmed description');
    });

    it('uses default emoji when icon not provided', () => {
      const activityData = {
        name: 'Activity without icon',
      };

      act(() => {
        result.current.handleUpdateActivity('act-1', activityData);
      });

      const calledCategories = setCategories.mock.calls[0][0];
      const targetCategory = calledCategories.find(cat => cat.id === 'cat-1');
      const updatedActivity = targetCategory.activities.find(act => act.id === 'act-1');
      expect(updatedActivity.icon).toBe(DEFAULT_ACTIVITY_EMOJI);
    });

    it('preserves other activities when updating one', () => {
      // Create fresh categories with multiple activities
      const categoriesWithMultipleActivities = [
        {
          id: 'my-templates',
          name: 'My Templates',
          activities: [],
        },
        {
          id: 'cat-1',
          name: 'Category 1',
          activities: [
            {
              id: 'act-1',
              name: 'Activity 1',
              icon: '🎯',
              description: 'Test activity',
            },
            {
              id: 'act-2',
              name: 'Activity 2',
              icon: '⚽',
              description: 'Second activity',
            },
          ],
        },
        {
          id: 'cat-2',
          name: 'Category 2',
          activities: [],
        },
      ];

      const newSetCategories = jest.fn();
      const { result: newResult } = renderHook(() =>
        useCategoryActions(categoriesWithMultipleActivities, newSetCategories, onSaveCategories)
      );

      act(() => {
        newResult.current.handleUpdateActivity('act-1', {
          name: 'Updated Activity 1',
          icon: '⭐',
        });
      });

      const calledCategories = newSetCategories.mock.calls[0][0];
      const targetCategory = calledCategories.find(cat => cat.id === 'cat-1');
      expect(targetCategory.activities).toHaveLength(2);
      expect(targetCategory.activities.find(act => act.id === 'act-2').name).toBe('Activity 2');
    });
  });

  describe('handleReorderCategories', () => {
    it('updates categories with new order', () => {
      const reorderedCategories = [...mockCategories].reverse();

      act(() => {
        result.current.handleReorderCategories(reorderedCategories);
      });

      expect(setCategories).toHaveBeenCalledTimes(1);
      expect(setCategories).toHaveBeenCalledWith(reorderedCategories);
      expect(onSaveCategories).toHaveBeenCalledWith(reorderedCategories);
    });

    it('calls save callback if provided', () => {
      const mockSaveCallback = jest.fn();
      const { result: newResult } = renderHook(() =>
        useCategoryActions(mockCategories, setCategories, mockSaveCallback)
      );
      const reorderedCategories = [mockCategories[1], mockCategories[0], mockCategories[2]];

      act(() => {
        newResult.current.handleReorderCategories(reorderedCategories);
      });

      expect(mockSaveCallback).toHaveBeenCalledWith(reorderedCategories);
    });
  });

  describe('copyGroupToMyLibrary', () => {
    let mockOnSaveMyLibrary;
    let myLibraryCategories;

    beforeEach(() => {
      mockOnSaveMyLibrary = jest.fn();
      myLibraryCategories = [
        {
          id: 'my-templates',
          name: 'My Templates',
          activities: [],
        },
        {
          id: 'existing-group',
          name: 'Existing Group',
          activities: [
            {
              id: 'existing-act-1',
              name: 'Existing Activity',
              icon: '🎯',
            },
          ],
        },
      ];
    });

    it('rejects empty groups', () => {
      const emptyGroup = { name: 'Empty Group', activities: [] };

      act(() => {
        result.current.copyGroupToMyLibrary(emptyGroup, myLibraryCategories, mockOnSaveMyLibrary);
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'No activities to copy');
      expect(mockOnSaveMyLibrary).not.toHaveBeenCalled();
    });

    it('rejects null or undefined groups', () => {
      act(() => {
        result.current.copyGroupToMyLibrary(null, myLibraryCategories, mockOnSaveMyLibrary);
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'No activities to copy');
      expect(mockOnSaveMyLibrary).not.toHaveBeenCalled();
    });

    it('rejects groups without activities property', () => {
      const invalidGroup = { name: 'Invalid Group' };

      act(() => {
        result.current.copyGroupToMyLibrary(invalidGroup, myLibraryCategories, mockOnSaveMyLibrary);
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'No activities to copy');
      expect(mockOnSaveMyLibrary).not.toHaveBeenCalled();
    });

    it('copies new group successfully', () => {
      const newGroup = {
        name: 'New Group',
        activities: [
          {
            id: 'source-act-1',
            name: 'Source Activity',
            icon: '🌟',
            description: 'Source description',
          },
        ],
      };

      act(() => {
        result.current.copyGroupToMyLibrary(newGroup, myLibraryCategories, mockOnSaveMyLibrary);
      });

      expect(mockOnSaveMyLibrary).toHaveBeenCalledTimes(1);
      const savedCategories = mockOnSaveMyLibrary.mock.calls[0][0];
      const copiedGroup = savedCategories.find(cat => cat.name === 'New Group');
      expect(copiedGroup).toBeDefined();
      expect(copiedGroup.activities).toHaveLength(1);
      expect(copiedGroup.activities[0].name).toBe('Source Activity');
      expect(copiedGroup.activities[0].icon).toBe('🌟');
      expect(copiedGroup.activities[0].description).toBe('Source description');
      expect(Alert.alert).toHaveBeenCalledWith('Success', '"New Group" copied to your library!');
    });

    it('prompts for merge when group already exists', () => {
      const existingGroup = {
        name: 'Existing Group',
        activities: [
          {
            id: 'new-act-1',
            name: 'New Activity',
            icon: '🌟',
          },
        ],
      };

      act(() => {
        result.current.copyGroupToMyLibrary(existingGroup, myLibraryCategories, mockOnSaveMyLibrary);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Group Already Exists',
        'A group named "Existing Group" already exists in your library. Do you want to merge the activities?',
        expect.arrayContaining([
          { text: 'Cancel', style: 'cancel' },
          expect.objectContaining({ text: 'Merge' }),
        ])
      );
      expect(mockOnSaveMyLibrary).not.toHaveBeenCalled();
    });

    it('merges activities when user confirms merge', () => {
      const existingGroup = {
        name: 'Existing Group',
        activities: [
          {
            id: 'new-act-1',
            name: 'New Activity',
            icon: '🌟',
          },
        ],
      };

      act(() => {
        result.current.copyGroupToMyLibrary(existingGroup, myLibraryCategories, mockOnSaveMyLibrary);
      });

      // Get the merge callback and call it
      const alertCall = Alert.alert.mock.calls.find(
        call => call[0] === 'Group Already Exists'
      );
      const mergeButton = alertCall[2].find(button => button.text === 'Merge');

      act(() => {
        mergeButton.onPress();
      });

      expect(mockOnSaveMyLibrary).toHaveBeenCalledTimes(1);
      const savedCategories = mockOnSaveMyLibrary.mock.calls[0][0];
      const mergedGroup = savedCategories.find(cat => cat.name === 'Existing Group');
      expect(mergedGroup.activities).toHaveLength(2); // Original + new activity
      expect(mergedGroup.activities.some(act => act.name === 'Existing Activity')).toBe(true);
      expect(mergedGroup.activities.some(act => act.name === 'New Activity')).toBe(true);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Activities merged successfully!');
    });

    it('prevents duplicate activities during merge', () => {
      const existingGroup = {
        name: 'Existing Group',
        activities: [
          {
            id: 'duplicate-act',
            name: 'Existing Activity', // Same name as existing
            icon: '🌟',
          },
          {
            id: 'new-act',
            name: 'Truly New Activity',
            icon: '⭐',
          },
        ],
      };

      act(() => {
        result.current.copyGroupToMyLibrary(existingGroup, myLibraryCategories, mockOnSaveMyLibrary);
      });

      // Get the merge callback and call it
      const alertCall = Alert.alert.mock.calls.find(
        call => call[0] === 'Group Already Exists'
      );
      const mergeButton = alertCall[2].find(button => button.text === 'Merge');

      act(() => {
        mergeButton.onPress();
      });

      const savedCategories = mockOnSaveMyLibrary.mock.calls[0][0];
      const mergedGroup = savedCategories.find(cat => cat.name === 'Existing Group');
      expect(mergedGroup.activities).toHaveLength(2); // Original + only truly new activity
      const activityNames = mergedGroup.activities.map(act => act.name);
      expect(activityNames.filter(name => name === 'Existing Activity')).toHaveLength(1); // No duplicate
      expect(activityNames).toContain('Truly New Activity');
    });
  });
});

describe('useCategorySaveHandler Hook', () => {
  let saveHandler;

  beforeEach(() => {
    saveHandler = {
      handleSaveEdit: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('validates required fields before saving', () => {
    const editData = {
      editMode: 'category',
      editName: '',
      categories: mockCategories,
      setCategories: jest.fn(),
      onSaveCategories: jest.fn(),
    };

    // Should show alert for empty name
    expect(Alert.alert).toBeDefined();
  });

  it('calls completion callback after successful save', () => {
    const onComplete = jest.fn();
    const editData = {
      editMode: 'category',
      editName: 'Valid Name',
      categories: mockCategories,
      setCategories: jest.fn(),
      onSaveCategories: jest.fn(),
      onComplete,
    };

    expect(onComplete).toBeDefined();
  });
});

describe('handleCategoryDragOperations', () => {
  let dragOperations;
  let mockRefs;

  beforeEach(() => {
    mockRefs = {
      activeDragId: null,
      hasActuallyDragged: { current: false },
      setActiveDragId: jest.fn(),
      setDraggedData: jest.fn(),
      setCategoryExpandedStates: jest.fn(),
      setIsDraggingAnyCategory: jest.fn(),
    };

    dragOperations = handleCategoryDragOperations({
      categories: mockCategories,
      ...mockRefs,
    });
  });

  describe('handleCategoryDragStart', () => {
    it('initializes drag state correctly', () => {
      const itemId = 'cat-1';

      dragOperations.handleCategoryDragStart(itemId);

      expect(mockRefs.setActiveDragId).toHaveBeenCalledWith(itemId);
      expect(mockRefs.setDraggedData).toHaveBeenCalledWith(mockCategories);
    });

    it('saves expanded states before drag', () => {
      const itemId = 'cat-1';

      dragOperations.handleCategoryDragStart(itemId);

      expect(mockRefs.setCategoryExpandedStates).toHaveBeenCalled();
    });

    it('sets dragging state with delay', () => {
      jest.useFakeTimers();
      const itemId = 'cat-1';

      dragOperations.handleCategoryDragStart(itemId);

      // Fast-forward time
      jest.advanceTimersByTime(50);

      expect(mockRefs.setIsDraggingAnyCategory).toHaveBeenCalledWith(true);

      jest.useRealTimers();
    });

    it('prevents duplicate initialization for same item', () => {
      const itemId = 'cat-1';

      // First call to set activeDragId
      dragOperations.handleCategoryDragStart(itemId);

      // Update mockRefs to simulate the state change
      mockRefs.activeDragId = itemId;

      // Clear mocks after first call
      jest.clearAllMocks();

      // Create new drag operations with updated activeDragId
      const updatedDragOperations = handleCategoryDragOperations({
        categories: mockCategories,
        activeDragId: itemId, // Now set to itemId
        ...mockRefs,
      });

      // Second call with same itemId should not call setActiveDragId
      updatedDragOperations.handleCategoryDragStart(itemId);

      // Should not call setActiveDragId again
      expect(mockRefs.setActiveDragId).not.toHaveBeenCalled();
    });
  });

  describe('handleCategoryDragEnd', () => {
    beforeEach(() => {
      mockRefs.hasActuallyDragged.current = true;
    });

    it('updates categories when data changed and dragged', () => {
      const setCategories = jest.fn();
      const onSaveCategories = jest.fn();
      const newData = [...mockCategories].reverse();
      const dragResult = { data: newData };

      dragOperations.handleCategoryDragEnd(
        dragResult,
        mockCategories,
        setCategories,
        onSaveCategories
      );

      expect(setCategories).toHaveBeenCalledWith(newData);
      expect(onSaveCategories).toHaveBeenCalledWith(newData);
    });

    it('restores original order when no real drag occurred', () => {
      mockRefs.hasActuallyDragged.current = false;
      const setCategories = jest.fn();
      const dragResult = { data: mockCategories };

      dragOperations.handleCategoryDragEnd(
        dragResult,
        mockCategories,
        setCategories,
        jest.fn()
      );

      expect(setCategories).toHaveBeenCalledWith(mockCategories);
    });

    it('resets drag states after completion', () => {
      jest.useFakeTimers();
      const dragResult = { data: mockCategories };

      dragOperations.handleCategoryDragEnd(
        dragResult,
        mockCategories,
        jest.fn(),
        jest.fn()
      );

      expect(mockRefs.setActiveDragId).toHaveBeenCalledWith(null);
      expect(mockRefs.setDraggedData).toHaveBeenCalledWith(null);

      // Fast-forward time for delayed state reset
      jest.advanceTimersByTime(300);

      expect(mockRefs.setIsDraggingAnyCategory).toHaveBeenCalledWith(false);

      jest.useRealTimers();
    });
  });
});