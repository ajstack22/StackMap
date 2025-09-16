import { Alert } from 'react-native';
import { DEFAULT_ACTIVITY_EMOJI } from '../../constants';

// Hook for managing category save operations
const useCategorySaveHandler = () => {
  const handleSaveEdit = ({
    editMode,
    editName,
    editEmoji,
    editDescription,
    editingItem,
    selectedCategoryId,
    categories,
    setCategories,
    onSaveCategories,
    onComplete,
  }) => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    let newCategories = [...categories];

    switch (editMode) {
      case 'category':
        newCategories = categories.map(cat =>
          cat.id === editingItem.id ? { ...cat, name: editName } : cat,
        );
        break;

      case 'activity':
        newCategories = categories.map(cat => ({
          ...cat,
          activities: cat.activities.map(act =>
            act.id === editingItem.id
              ? {
                  ...act,
                  name: editName,
                  icon: editEmoji || DEFAULT_ACTIVITY_EMOJI,
                  description: editDescription,
                }
              : act,
          ),
        }));
        break;

      case 'new-category':
        const newCategoryId = `category-${Date.now()}`;
        newCategories.push({
          id: newCategoryId,
          name: editName,
          activities: [],
        });
        break;

      case 'new-activity':
        if (!editEmoji) {
          Alert.alert('Error', 'Please select an emoji for the activity');
          return;
        }
        const newActivityId = `activity-${Date.now()}`;
        newCategories = categories.map(cat =>
          cat.id === selectedCategoryId
            ? {
                ...cat,
                activities: [
                  ...cat.activities,
                  {
                    id: newActivityId,
                    name: editName,
                    icon: editEmoji || DEFAULT_ACTIVITY_EMOJI,
                    description: editDescription,
                  },
                ],
              }
            : cat,
        );
        break;
    }

    setCategories(newCategories);
    if (onSaveCategories) onSaveCategories(newCategories);
    if (onComplete) onComplete();
  };

  return { handleSaveEdit };
};

export { useCategorySaveHandler };