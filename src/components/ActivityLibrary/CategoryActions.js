import { Alert } from 'react-native';
import { DEFAULT_ACTIVITY_EMOJI } from '../../constants';
import { handleCategoryDragOperations } from './CategoryDragOperations';
import { generateSecureId } from '../../utils/secureId';

// Category CRUD operations
const useCategoryActions = (categories, setCategories, onSaveCategories) => {
  // Ensure My Templates folder always exists
  const ensureMyTemplatesExists = (categoriesList) => {
    const hasMyTemplates = categoriesList.some(cat => cat.id === 'my-templates');
    if (!hasMyTemplates) {
      const myTemplatesCategory = {
        id: 'my-templates',
        name: 'My Templates',
        activities: [],
      };
      return [...categoriesList, myTemplatesCategory];
    }
    return categoriesList;
  };

  const handleDeleteCategory = (category) => {
    // Prevent deletion of My Templates folder
    if (category.id === 'my-templates') {
      Alert.alert(
        'Cannot Delete',
        "The 'My Templates' folder is required for saving activities to your library. You can delete activities within it, but not the folder itself.",
        [{ text: 'OK' }],
      );
      return;
    }

    const newCategories = categories.filter(c => c.id !== category.id);
    const updatedCategories = ensureMyTemplatesExists(newCategories);
    setCategories(updatedCategories);
    if (onSaveCategories) onSaveCategories(updatedCategories);
  };

  const handleDeleteActivity = (categoryId, activity) => {
    const newCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          activities: cat.activities.filter(a => a.id !== activity.id),
        };
      }
      return cat;
    });

    setCategories(newCategories);
    if (onSaveCategories) {
      onSaveCategories(newCategories);
    }
  };

  const handleAddCategory = (categoryName) => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return false;
    }

    const newCategoryId = `category-${Date.now()}`;
    const newCategories = [
      ...categories,
      {
        id: newCategoryId,
        name: categoryName.trim(),
        activities: [],
      },
    ];

    setCategories(newCategories);
    if (onSaveCategories) onSaveCategories(newCategories);
    return true;
  };

  const handleAddActivity = (categoryId, activityData) => {
    const { name, icon = DEFAULT_ACTIVITY_EMOJI, description = '' } = activityData;

    if (!name.trim()) {
      Alert.alert('Error', 'Activity name cannot be empty');
      return false;
    }

    if (!icon) {
      Alert.alert('Error', 'Please select an emoji for the activity');
      return false;
    }

    const newActivityId = `activity-${Date.now()}`;
    const newCategories = categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            activities: [
              ...cat.activities,
              {
                id: newActivityId,
                name: name.trim(),
                icon: icon,
                description: description.trim(),
              },
            ],
          }
        : cat,
    );

    setCategories(newCategories);
    if (onSaveCategories) onSaveCategories(newCategories);
    return true;
  };

  const handleUpdateCategory = (categoryId, newName, newActivities) => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return false;
    }

    const newCategories = categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, name: newName.trim(), activities: newActivities }
        : cat,
    );

    setCategories(newCategories);
    if (onSaveCategories) onSaveCategories(newCategories);
    return true;
  };

  const handleUpdateActivity = (activityId, activityData) => {
    const { name, icon = DEFAULT_ACTIVITY_EMOJI, description = '' } = activityData;

    if (!name.trim()) {
      Alert.alert('Error', 'Activity name cannot be empty');
      return false;
    }

    const newCategories = categories.map(cat => ({
      ...cat,
      activities: cat.activities.map(act =>
        act.id === activityId
          ? {
              ...act,
              name: name.trim(),
              icon: icon,
              description: description.trim(),
            }
          : act,
      ),
    }));

    setCategories(newCategories);
    if (onSaveCategories) onSaveCategories(newCategories);
    return true;
  };

  const handleReorderCategories = (reorderedCategories) => {
    setCategories(reorderedCategories);
    if (onSaveCategories) onSaveCategories(reorderedCategories);
  };

  const handleAddAllFromCategory = (category, onSelectMultipleActivities, onSelectActivity) => {
    if (category.activities.length > 0) {
      // Check if we have the batch method available
      if (onSelectMultipleActivities) {
        // Use batch method for better performance
        const activitiesToAdd = category.activities.map(activity => ({
          icon: activity.icon,
          text: activity.text,
          description: activity.description || '',
        }));

        onSelectMultipleActivities(activitiesToAdd);
      } else if (onSelectActivity) {
        // Fallback to individual adds
        category.activities.forEach(activity => {
          onSelectActivity({
            icon: activity.icon,
            text: activity.text,
            description: activity.description || '',
          });
        });
      }
    }
  };

  const handleQuickAdd = (activity, onSelectActivity) => {
    if (onSelectActivity) {
      // Transform library activity to match expected format
      onSelectActivity({
        icon: activity.icon,
        text: activity.text,
        description: activity.description || '', // Include description if present
      });
      // Don't close the modal - user likely wants to add more activities
    }
  };

  // Merge new activities into existing category
  const mergeActivitiesIntoCategory = (existingGroup, newActivities) => {
    const mergedActivities = [...existingGroup.activities];

    newActivities.forEach(newActivity => {
      const exists = mergedActivities.some(
        existing => existing.name === newActivity.name
      );
      if (!exists) {
        mergedActivities.push({
          ...newActivity,
          id: generateSecureId('activity'),
        });
      }
    });

    return mergedActivities;
  };

  // Handle merge confirmation for existing group
  const handleMergeGroup = (existingGroup, group, myLibraryCategories, onSaveMyLibrary) => {
    const mergedActivities = mergeActivitiesIntoCategory(existingGroup, group.activities);

    const updatedCategories = myLibraryCategories.map(cat =>
      cat.id === existingGroup.id
        ? { ...cat, activities: mergedActivities }
        : cat
    );

    if (onSaveMyLibrary) onSaveMyLibrary(updatedCategories);
    Alert.alert('Success', 'Activities merged successfully!');
  };

  // Create new group with activities
  const createNewGroupInLibrary = (group, myLibraryCategories, onSaveMyLibrary) => {
    const newGroup = {
      id: `category-${Date.now()}`,
      name: group.name,
      activities: group.activities.map(activity => ({
        ...activity,
        id: generateSecureId('activity'),
      })),
    };

    const updatedCategories = [...myLibraryCategories, newGroup];
    if (onSaveMyLibrary) onSaveMyLibrary(updatedCategories);
    Alert.alert('Success', `"${group.name}" copied to your library!`);
  };

  // Show merge confirmation dialog
  const showMergeConfirmation = (group, existingGroup, myLibraryCategories, onSaveMyLibrary) => {
    Alert.alert(
      'Group Already Exists',
      `A group named "${group.name}" already exists in your library. Do you want to merge the activities?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: () => handleMergeGroup(existingGroup, group, myLibraryCategories, onSaveMyLibrary),
        },
      ]
    );
  };

  const copyGroupToMyLibrary = (group, myLibraryCategories, onSaveMyLibrary) => {
    if (!group || !group.activities || group.activities.length === 0) {
      Alert.alert('Error', 'No activities to copy');
      return;
    }

    const existingGroup = myLibraryCategories.find(cat => cat.name === group.name);

    if (existingGroup) {
      showMergeConfirmation(group, existingGroup, myLibraryCategories, onSaveMyLibrary);
      return;
    }

    createNewGroupInLibrary(group, myLibraryCategories, onSaveMyLibrary);
  };

  return {
    handleDeleteCategory,
    handleDeleteActivity,
    handleAddCategory,
    handleAddActivity,
    handleUpdateCategory,
    handleUpdateActivity,
    handleReorderCategories,
    handleAddAllFromCategory,
    handleQuickAdd,
    copyGroupToMyLibrary,
    ensureMyTemplatesExists,
  };
};

// Save handler logic moved to CategorySaveHandler.js

export {
  handleCategoryDragOperations,
  useCategoryActions,
};