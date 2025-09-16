import React, { useState, useRef, useEffect } from 'react';
import { Text, TextInput } from '../Typography';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  ScrollView,
  SafeAreaView,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfirmModal from '../Modals/ConfirmModal';

// Use standard FlatList for all platforms (draggable functionality removed)
let DraggableFlatList = FlatList;
let ScaleDecorator = ({ children }) => children;

// Simplified loader function for compatibility
const loadDragComponents = () => {
  return {
    DraggableFlatList: FlatList,
    ScaleDecorator: ({ children }) => children,
  };
};
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
  DEFAULT_ACTIVITY_EMOJI,
  CUSTOM_IMAGE_SOURCES,
  getCustomImageSource,
} from '../../constants';
import EmojiPicker from '../EmojiPicker';
import LibraryHeader from './LibraryHeader';
import TabSelector from './TabSelector';
import LibraryActions from './LibraryActions';
import ActivityGrid from './ActivityGrid';
import ActivityCard from './ActivityCard';
import EmptyState from './EmptyState';
import { getFilteredActivities, getFilteredCategories, useFilterControls } from './FilterControls';
import { useSortControls, getDragActivationDistance, isScrollEnabled } from './SortControls';
import CategorySection from './CategoryList';
import { CategoryNameEditor, useEditState } from './CategoryEditor';
import { renderEditModal } from './CategoryEditModal';
import { useCategoryActions } from './CategoryActions';
import { useCategorySaveHandler } from './CategorySaveHandler';

// Empty template for new users - no pre-loaded activities
// Users can create their own activity groups in My Library
// StackMap Library provides curated activity groups separately

// ActivityRow component is now extracted to ActivityCard.js

// Activities list rendering is now handled by ActivityGrid component
// Category display logic moved to CategoryList.js

// Category editing logic moved to CategoryEditor.js
// Category CRUD operations moved to CategoryActions.js

const ActivityLibrary = ({
  visible,
  onClose,
  onSelectActivity,
  onSelectMultipleActivities,
  theme,
  categories: customCategories,
  onSaveCategories,
  stackMapLibrary,
  myLibrary,
  onCopyGroupToMyLibrary,
  showToast,
}) => {
  // Load drag components
  const { DraggableFlatList: DraggableList, ScaleDecorator: Decorator } =
    loadDragComponents();
  if (!DraggableFlatList) DraggableFlatList = DraggableList;
  if (!ScaleDecorator) ScaleDecorator = Decorator;

  const insets = useSafeAreaInsets();
  // Use myLibrary if provided, otherwise fall back to legacy categories
  const [categories, setCategories] = useState(
    myLibrary?.activityGroups ||
      customCategories || [
        { id: 'my-templates', name: 'My Templates', activities: [] },
      ],
  );
  const [activeTab, setActiveTab] = useState('stackmap'); // 'stackmap' or 'mylibrary'
  const [categoryExpandedStates, setCategoryExpandedStates] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Use category editing state management
  const {
    editingItem,
    editMode,
    editName,
    editEmoji,
    editDescription,
    selectedCategoryId,
    editingCategoryId,
    showEmojiPicker,
    setEditName,
    setEditEmoji,
    setEditDescription,
    setEditMode,
    setShowEmojiPicker,
    resetEditState,
    handleEditCategory,
    handleEditActivity,
    handleAddCategory: handleAddCategoryEdit,
    handleAddActivity: handleAddActivityEdit,
    handleStartEditCategory,
    handleEndEditCategory,
  } = useEditState();

  // Use category CRUD operations
  const {
    handleDeleteCategory,
    handleDeleteActivity,
    handleAddCategory,
    handleAddActivity,
    handleUpdateCategory,
    handleAddAllFromCategory,
    handleQuickAdd,
  } = useCategoryActions(categories, setCategories, onSaveCategories);

  // Use save handler
  const { handleSaveEdit: handleSaveEditCore } = useCategorySaveHandler();

  // Ensure My Templates folder always exists
  useEffect(() => {
    const hasMyTemplates = categories.some(cat => cat.id === 'my-templates');
    if (!hasMyTemplates) {
      const myTemplatesCategory = {
        id: 'my-templates',
        name: 'My Templates',
        activities: [],
      };
      const newCategories = [...categories, myTemplatesCategory];
      setCategories(newCategories);
      if (onSaveCategories) onSaveCategories(newCategories);
    }
  }, []);

  // Category actions are now handled by useCategoryActions hook
  // Edit handlers are now handled by useEditState hook

  const handleSaveEdit = () => {
    handleSaveEditCore({
      editMode,
      editName,
      editEmoji,
      editDescription,
      editingItem,
      selectedCategoryId,
      categories,
      setCategories,
      onSaveCategories,
      onComplete: resetEditState,
    });
  };

  // Wrap handlers to work with existing interface
  const handleAddCategoryWrapper = () => {
    handleAddCategoryEdit();
  };

  const handleAddActivityWrapper = (category) => {
    handleAddActivityEdit(category);
  };

  const handleAddAllWrapper = (category) => {
    handleAddAllFromCategory(category, onSelectMultipleActivities, onSelectActivity);
  };

  const handleQuickAddWrapper = (activity) => {
    handleQuickAdd(activity, onSelectActivity);
  };



  const handleExpandedChange = (categoryId, isExpanded) => {
    setCategoryExpandedStates(prev => ({
      ...prev,
      [categoryId]: isExpanded,
    }));
  };

  // Use sort controls hook
  const {
    isSortMode,
    isDraggingAnyCategory,
    toggleSortMode,
    getDragEventHandlers,
    handleCategoryDragEnd,
  } = useSortControls(categories, categoryExpandedStates, setCategoryExpandedStates);

  const filteredCategories = getFilteredCategories(
    categories,
    stackMapLibrary,
    activeTab,
    searchQuery
  );

  const dragHandlers = getDragEventHandlers(activeTab);

  // Handle drag end with category saving
  const handleDragEndWithSave = (dragResult) => {
    const newCategories = handleCategoryDragEnd(dragResult, onSaveCategories);
    if (newCategories) {
      setCategories(newCategories);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.light }]}>
        {Platform.OS === 'android' && (
          <StatusBar
            backgroundColor={theme.primary}
            barStyle="light-content"
            translucent={false}
          />
        )}
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: theme.primary,
              height: StatusBar.currentHeight || 24,
            }}
          />
        )}
        <LibraryHeader theme={theme} onClose={onClose} />

        <View style={[styles.contentWrapper, { backgroundColor: theme.light }]}>
          <TabSelector
            activeTab={activeTab}
            onTabChange={setActiveTab}
            theme={theme}
          />
          <LibraryActions
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchClear={() => setSearchQuery('')}
            isSortMode={isSortMode}
            onSortToggle={toggleSortMode}
            theme={theme}
          />
          <DraggableFlatList
            data={filteredCategories}
            onDragBegin={dragHandlers.onDragBegin}
            onPlaceholderIndexChange={dragHandlers.onPlaceholderIndexChange}
            onDragEnd={dragHandlers.onDragEnd ? handleDragEndWithSave : undefined}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0 }}
            scrollEnabled={isScrollEnabled(isDraggingAnyCategory, isSortMode)}
            activationDistance={getDragActivationDistance(activeTab, isSortMode)}
            renderItem={({ item, drag, isActive }) => (
              <ScaleDecorator activeScale={0.98}>
                <CategorySection
                  category={item}
                  onEditCategory={
                    activeTab === 'mylibrary' ? handleEditCategory : undefined
                  }
                  onDeleteCategory={
                    activeTab === 'mylibrary' ? handleDeleteCategory : undefined
                  }
                  onEditActivity={
                    activeTab === 'mylibrary' ? handleEditActivity : undefined
                  }
                  onDeleteActivity={
                    activeTab === 'mylibrary' ? handleDeleteActivity : undefined
                  }
                  onQuickAdd={handleQuickAddWrapper}
                  onAddActivity={
                    activeTab === 'mylibrary' ? handleAddActivityWrapper : undefined
                  }
                  onAddAllFromCategory={handleAddAllWrapper}
                  onUpdateCategory={
                    activeTab === 'mylibrary' ? handleUpdateCategory : undefined
                  }
                  onCopyToMyLibrary={
                    activeTab === 'stackmap'
                      ? onCopyGroupToMyLibrary
                      : undefined
                  }
                  isReadOnly={activeTab === 'stackmap'}
                  theme={theme}
                  editingCategoryId={editingCategoryId}
                  onStartEditCategory={handleStartEditCategory}
                  onEndEditCategory={handleEndEditCategory}
                  drag={drag}
                  isActive={isActive}
                  isDraggingAnyCategory={isDraggingAnyCategory}
                  expandedState={
                    isDraggingAnyCategory || isSortMode
                      ? false
                      : categoryExpandedStates[item.id]
                  }
                  onExpandedChange={handleExpandedChange}
                  searchQuery={searchQuery}
                  isSortMode={isSortMode}
                />
              </ScaleDecorator>
            )}
            ListFooterComponent={() =>
              activeTab === 'mylibrary' ? (
                <TouchableOpacity
                  style={[styles.addCategoryButton, { borderColor: 'white' }]}
                  onPress={handleAddCategoryWrapper}
                >
                  <Icon name="add" size={20} color="white" />
                  <Text style={[styles.addCategoryText, { color: 'white' }]}>
                    Add New Activity Group
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>

        {/* Edit Modal */}
        {renderEditModal(
          editMode,
          editName,
          setEditName,
          editDescription,
          setEditDescription,
          editEmoji,
          setShowEmojiPicker,
          getCustomImageSource,
          theme,
          setEditMode,
          handleSaveEdit
        )}

        {/* Emoji Picker Modal */}
        <EmojiPicker
          mode="modal"
          visible={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelect={icon => {
            setEditEmoji(icon);
            setShowEmojiPicker(false);
          }}
          theme={theme}
          selectedEmoji={editEmoji}
          showCustomImages={true}
        />

        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: theme.light,
              height: insets.bottom || 0,
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  categorySection: {
    marginBottom: SPACING.md,
    backgroundColor: 'transparent',
    minHeight: 60,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.level1,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTitle: {
    fontSize: isTablet() ? 20 : 18,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
  },
  activityCount: {
    fontSize: isTablet() ? 14 : 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  activitiesList: {
    overflow: 'hidden',
  },
  // Activity styles moved to ActivityCard.js
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  addIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  disabledButton: {
    opacity: 0.5,
  },
  categoryEditContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  categoryEditInput: {
    fontSize: isTablet() ? 20 : 18,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: SPACING.xs,
  },
  // Drag styles moved to ActivityGrid.js
  categoryDragHandle: {
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.md,
    justifyContent: 'center',
  },
  draggingCategory: {
    opacity: 0.9,
    elevation: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  // Empty message styles moved to EmptyState.js
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
  },
  addCategoryText: {
    marginLeft: SPACING.sm,
    fontSize: isTablet() ? 16 : 14,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  editModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContent: {
    backgroundColor: 'white',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.level3,
  },
  editModalTitle: {
    fontSize: isTablet() ? 20 : 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  editInput: {
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: isTablet() ? 16 : 14,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000000', // Explicit black text color for Android devices
    backgroundColor: 'white', // Ensure white background
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emojiLabel: {
    fontSize: isTablet() ? 16 : 14,
    marginBottom: SPACING.sm,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  emojiSelector: {
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  selectedEmoji: {
    fontSize: 48,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginBottom: SPACING.xs,
  },
  selectedEmojiImage: {
    width: 48,
    height: 48,
    marginBottom: SPACING.xs,
  },
  emojiSelectorLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  editButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray[200],
  },
  cancelButtonText: {
    color: COLORS.gray[700],
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor:
      Platform.OS === 'web' ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDropdown: {
    position: 'absolute',
    borderRadius: RADIUS.lg,
    backgroundColor: 'white',
    ...SHADOWS.level3,
    minWidth: 220,
    maxHeight: 300,
    paddingVertical: SPACING.sm,
    ...(Platform.OS === 'web' && {
      overflowY: 'auto',
    }),
  },
  centerMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  centerMenuCard: {
    backgroundColor: 'white',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    ...SHADOWS.level3,
  },
  mobileMenuContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mobileMenuCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.lg,
    ...SHADOWS.level3,
  },
  mobileMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  menuItemText: {
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
  },
});

// Export empty template for initialization with My Templates category
export const EMPTY_CATEGORIES = [
  {
    id: 'my-templates',
    name: 'My Templates',
    icon: '⭐',
    activities: [],
  },
];

export default ActivityLibrary;
