import React, { useState, useEffect } from 'react';
import TabbedModal from '../../TabbedModal';
import { TabContent } from '../../TabbedModal';
import LibraryTabContent from './LibraryTabContent';
import AddTabContent from './AddTabContent';

const ActivityManagementModal = ({
  visible,
  onClose,
  theme,
  showToast,
  categories,
  onSaveCategories,
  onSelectActivity,
  onSelectMultipleActivities,
  onAddActivity,
  initialTab = 0,
  selectedCategory = null,
  prefilledActivity = null,
  stackMapLibrary,
  myLibrary,
  onSaveToMyLibrary,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [selectedFromLibrary, setSelectedFromLibrary] = useState(null);

  console.log('ActivityManagementModal render - initialTab:', initialTab, 'activeTab:', activeTab, 'visible:', visible);

  // Reset state when modal opens
  useEffect(() => {
    console.log('ActivityManagementModal useEffect - visible:', visible, 'initialTab:', initialTab);
    if (visible) {
      console.log('Setting activeTab to:', initialTab);
      setActiveTab(initialTab);
      setSelectedFromLibrary(null);
    }
  }, [visible, initialTab]);

  const tabs = [
    { id: 'add', label: 'Add', icon: 'add-circle' },
    { id: 'library', label: 'Library', icon: 'folder' },
  ];

  const handleSelectFromLibrary = (activity, category) => {
    setSelectedFromLibrary({ activity, category });
    setActiveTab(0); // Switch to Add tab
    showToast({ message: 'Activity selected - customize and add' });
  };

  const handleAddActivity = async (activityData) => {
    setLoading(true);
    try {
      await onAddActivity(activityData);
      showToast({ message: 'Activity added successfully!' });
      
      // Reset form and optionally close or stay open
      setSelectedFromLibrary(null);
      
      // If user wants to add another, stay on Add tab
      // Otherwise, could close modal or switch to Library tab
    } catch (error) {
      showToast({ message: 'Failed to add activity', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLibrary = async (activityData, categoryId) => {
    setLoading(true);
    try {
      // For now, we're only supporting 'my-templates' category
      if (categoryId === 'my-templates' && onSaveToMyLibrary) {
        // Call the parent function to save to myLibrary
        await onSaveToMyLibrary(activityData);
        showToast({ message: 'Activity saved to My Templates!' });
      } else {
        // Fallback to old categories method
        const myTemplatesCategory = {
          id: 'my-templates',
          name: 'My Templates',
          activities: categories?.find(cat => cat.id === 'my-templates')?.activities || []
        };
        
        const newActivity = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: activityData.text,
          emoji: activityData.icon,
        };
        
        myTemplatesCategory.activities.push(newActivity);
        
        // Update categories - if no categories exist, create array with just My Templates
        const updatedCategories = categories?.length > 0 
          ? categories.map(cat => cat.id === 'my-templates' ? myTemplatesCategory : cat)
          : [myTemplatesCategory];
        
        await onSaveCategories(updatedCategories);
        
        showToast({ message: 'Activity saved to My Templates!' });
      }
    } catch (error) {
      console.error('Error saving to library:', error);
      showToast({ message: 'Failed to save to library', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabbedModal
      visible={visible}
      onClose={onClose}
      theme={theme}
      title="Activities"
      icon="dashboard"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <TabContent isActive={activeTab === 0} modalVisible={visible}>
        <AddTabContent
          theme={theme}
          categories={categories}
          onAddActivity={handleAddActivity}
          onSaveToLibrary={handleSaveToLibrary}
          showToast={showToast}
          loading={loading}
          prefilledActivity={selectedFromLibrary?.activity || prefilledActivity}
          prefilledCategory={selectedFromLibrary?.category || selectedCategory}
          onClose={onClose}
        />
      </TabContent>
      
      <TabContent isActive={activeTab === 1} modalVisible={visible}>
        <LibraryTabContent
          theme={theme}
          categories={categories}
          onSaveCategories={onSaveCategories}
          onSelectActivity={onSelectActivity}
          onSelectMultipleActivities={onSelectMultipleActivities}
          showToast={showToast}
          loading={loading}
          stackMapLibrary={stackMapLibrary}
          myLibrary={myLibrary}
        />
      </TabContent>
    </TabbedModal>
  );
};

export default ActivityManagementModal;