# Modal Data Flows and Dependencies

## Overview
This document maps the current data flows, props, and dependencies for all modals in StackMap that will be refactored in the menu reorganization project.

## 1. ImportExportModal

### Props
- `visible`: boolean - Controls modal visibility
- `onClose`: function - Callback when modal is closed
- `theme`: object - Current theme object
- `users`: object - All user data
- `currentDay`: string - Current day (today/tomorrow)
- `templates`: object - Activity library templates
- `currentTheme`: string - Theme name
- `bannerPosition`: string - Banner position setting
- `hasSecurePin`: function - Check if PIN is enabled
- `showToast`: function - Show toast notifications
- `onImportComplete`: function - Callback after successful import

### Data Flow
- **Exports**: Reads from users, templates, and global settings
- **Imports**: Calls onImportComplete with imported data
- **State**: Manages internal tab state (import/export)

### Dependencies
- Platform-specific file handling (RNFS, DocumentPicker)
- ConfirmModal for import confirmations
- Toast system for notifications

## 2. ShareModal

### Props
- `visible`: boolean - Controls modal visibility
- `onClose`: function - Callback when modal is closed
- `theme`: object - Current theme object
- `currentUser`: string - Current user ID
- `users`: object - All user data
- `showToast`: function - Show toast notifications

### Data Flow
- **Input**: Reads user activities from users object
- **Output**: Generates share links via sync service
- **State**: Manages share type, auto-update settings

### Dependencies
- SyncService for share functionality
- QRCode generation
- Clipboard API

## 3. CompleteDayModal

### Props
- `visible`: boolean - Controls modal visibility
- `onClose`: function - Callback when modal is closed
- `theme`: object - Current theme object
- `activities`: array - Current day's activities
- `completedCount`: number - Number of completed activities
- `totalCount`: number - Total number of activities
- `onArchive`: function - Archive day callback
- `showCelebration`: function - Trigger celebration animation

### Data Flow
- **Input**: Reads activity completion stats
- **Output**: Triggers archive action and celebrations
- **State**: Minimal, mostly presentational

### Dependencies
- Celebration system
- Activity statistics calculations

## 4. PlanningModal (UserDayModal)

### Props
- `visible`: boolean - Controls modal visibility
- `onClose`: function - Callback when modal is closed
- `theme`: object - Current theme object
- `activities`: array - Tomorrow's activities
- `templates`: object - Activity library templates
- `onUpdateActivities`: function - Update tomorrow's activities
- `showToast`: function - Show toast notifications

### Data Flow
- **Input**: Tomorrow's activities, template library
- **Output**: Updated activity list for tomorrow
- **State**: Manages activity selection and ordering

### Dependencies
- DraggableFlatList for reordering
- Template system
- Activity state management

## 5. ActivityModal

### Props
- `visible`: boolean - Controls modal visibility
- `onClose`: function - Callback when modal is closed
- `theme`: object - Current theme object
- `insets`: object - Safe area insets
- `editingActivity`: object - Activity being edited (optional)
- `onSave`: function - Save activity callback
- `activityTitle`: string - Activity title
- `setActivityTitle`: function - Update title
- `activityDescription`: string - Activity description
- `setActivityDescription`: function - Update description
- `activityEmoji`: string - Selected emoji
- `setActivityEmoji`: function - Update emoji
- `activityTime`: string - Activity time
- `setActivityTime`: function - Update time
- `showEmojiPicker`: boolean - Emoji picker visibility
- `setShowEmojiPicker`: function - Toggle emoji picker

### Data Flow
- **Input**: Form field values and setters from parent
- **Output**: Calls onSave with activity data
- **State**: Form validation, emoji picker

### Dependencies
- EmojiPicker component
- Form validation logic
- Keyboard handling

## 6. ActivityLibrary

### Props
- `visible`: boolean - Controls modal visibility
- `onClose`: function - Callback when modal is closed
- `showToast`: function - Show toast notifications
- `categories`: object - Activity categories and templates
- `onSaveCategories`: function - Save updated categories
- `onSelectActivity`: function - Callback when activity selected
- `onSelectMultipleActivities`: function - Bulk selection callback

### Data Flow
- **Input**: Categories/templates from Zustand store
- **Output**: Selected activities or updated categories
- **State**: Edit mode, search, category management

### Dependencies
- DraggableFlatList for reordering
- Search functionality
- Category CRUD operations
- ConfirmModal for deletions

## Common Patterns

### Modal Structure
1. All modals use similar header with close button
2. SafeAreaView wrapper for mobile
3. Theme-based styling
4. Toast notifications for feedback

### State Management
1. Visibility controlled by parent component
2. Internal state for form data and UI state
3. Callbacks for data changes

### Platform Considerations
1. Keyboard handling on mobile
2. Safe area insets
3. Platform-specific file operations
4. Modal animations

## Integration Points

### EditModeToolbar → Modals
- Toolbar buttons trigger modal visibility
- No direct data passing, modals read from global state

### Modals → App State
- All data changes go through App.js callbacks
- Zustand store updates for persistent data
- Toast notifications for user feedback

### Inter-Modal Communication
- Currently none - modals are independent
- Proposed: Shared state for Library ↔ Add flow
- Proposed: Tab state for grouped modals