# 🚀 Activity Library Enhancement Plan

## Executive Summary
This plan details the enhancement of the Activity Library to support:
1. **Activity Groups** - Flexible collections that can be used as categories or routines
2. **StackMap Library** - System-provided activity groups with curated activities
3. **My Library** - User's custom activity groups they create
4. **"Add All" functionality** - Add entire activity group with one tap
5. Enhanced group management with proper permissions

## Current State Analysis

### Problems to Solve
1. **No Starter Templates**: Users start with completely empty library after our recent fix
2. **Limited Category Control**: Users can create categories but UI is inconsistent
3. **Mixed Data**: No separation between system templates and user templates
4. **Duplicate Code**: Two different implementations (ActivityLibrary.js vs LibraryTabContent.js)
5. **Poor Category Management**: No validation, no metadata, limited organization

### Current Data Structure
```javascript
{
  // Current structure (post-refactor)
  library: {
    categories: [
      {
        id: 'my-templates',
        name: 'My Templates',
        activities: []
      }
    ],
    userAddedActivityIds: []
  },
  activityCategories: [...], // Legacy, mirrors library.categories
  libraryTemplates: []        // Renamed from activities
}
```

## Proposed New Structure

### Enhanced Data Model
```javascript
{
  // My Library - User's custom activity groups
  myLibrary: {
    activityGroups: [
      {
        id: 'my-custom-group-1',
        name: 'School Morning',
        activities: [...],
        isProtected: false,
        isUserCreated: true,
        createdAt: timestamp,
        lastModified: timestamp,
        order: 0,
        metadata: {
          description: 'My morning routine for school days',
          color: '#4A90E2'     // Optional group color
        }
      }
    ],
    groupOrder: ['school-morning', ...] // Explicit ordering
  },
  
  // StackMap Library - System-provided activity groups (read-only)
  stackMapLibrary: {
    version: '1.0.0',
    activityGroups: [
      {
        id: 'morning-activities',
        name: 'Morning Activities',
        activities: [
          { id: 'wake-up', name: 'Wake Up', emoji: '🌅', description: 'Time to start the day!' },
          { id: 'turn-off-alarm', name: 'Turn Off Alarm', emoji: '⏰', description: 'Press the button and get up' },
          { id: 'brush-teeth-am', name: 'Brush Teeth', emoji: '🪥', description: '2 minutes, top and bottom' },
          { id: 'take-shower', name: 'Take Shower', emoji: '🚿', description: 'Wash hair and body' },
          { id: 'wash-face', name: 'Wash Face', emoji: '🧼', description: 'Splash with cool water' },
          { id: 'get-dressed', name: 'Get Dressed', emoji: '👕', description: 'Pick today\'s outfit' },
          { id: 'make-bed', name: 'Make Bed', emoji: '🛏️', description: 'Pull up covers and arrange pillows' },
          { id: 'pack-backpack', name: 'Pack Backpack', emoji: '🎒', description: 'Books, homework, and supplies' },
          { id: 'take-medicine-am', name: 'Take Medicine', emoji: '💊', description: 'Morning vitamins or medications' },
          { id: 'drink-water-am', name: 'Drink Water', emoji: '🥛', description: 'Start the day hydrated' }
        ],
        order: 0
      },
      {
        id: 'food-activities',
        name: 'Food Activities',
        activities: [
          { id: 'eat-breakfast', name: 'Eat Breakfast', emoji: '🥣', description: 'Fuel up for the morning' },
          { id: 'make-lunch', name: 'Make Lunch', emoji: '🥪', description: 'Prepare or pack lunch' },
          { id: 'morning-snack', name: 'Morning Snack', emoji: '🍎', description: 'Healthy mid-morning boost' },
          { id: 'eat-lunch', name: 'Eat Lunch', emoji: '🍽️', description: 'Midday meal time' },
          { id: 'afternoon-snack', name: 'Afternoon Snack', emoji: '🥤', description: 'Recharge after school' },
          { id: 'eat-dinner', name: 'Eat Dinner', emoji: '🍝', description: 'Family meal time' },
          { id: 'evening-snack', name: 'Evening Snack', emoji: '🍪', description: 'Small bedtime treat' },
          { id: 'help-cook', name: 'Help Cook', emoji: '🥗', description: 'Assist with meal preparation' },
          { id: 'clear-table', name: 'Clear Table', emoji: '🧹', description: 'Take dishes to sink' },
          { id: 'set-table', name: 'Set Table', emoji: '🍴', description: 'Plates, utensils, and cups' }
        ],
        order: 1
      },
      {
        id: 'play-activities',
        name: 'Play Activities',
        activities: [
          { id: 'screen-time', name: 'Screen Time', emoji: '🎮', description: 'Games, videos, or apps' },
          { id: 'reading-time', name: 'Reading Time', emoji: '📚', description: 'Independent or together' },
          { id: 'art-crafts', name: 'Art & Crafts', emoji: '🎨', description: 'Draw, paint, or create' },
          { id: 'outdoor-play', name: 'Outdoor Play', emoji: '🏃', description: 'Run, jump, and explore' },
          { id: 'puzzles', name: 'Puzzles', emoji: '🧩', description: 'Problem-solving fun' },
          { id: 'board-games', name: 'Board Games', emoji: '🎲', description: 'Family game time' },
          { id: 'free-play', name: 'Free Play', emoji: '🧸', description: 'Imagination time' },
          { id: 'music-time', name: 'Music Time', emoji: '🎵', description: 'Listen, sing, or dance' },
          { id: 'building-blocks', name: 'Building Blocks', emoji: '🏗️', description: 'Construct and create' },
          { id: 'sports-practice', name: 'Sports Practice', emoji: '⚽', description: 'Physical activity time' }
        ],
        order: 2
      },
      {
        id: 'afternoon-activities',
        name: 'Afternoon Activities',
        activities: [
          { id: 'homework', name: 'Homework', emoji: '📝', description: 'Complete school assignments' },
          { id: 'practice-instrument', name: 'Practice Instrument', emoji: '🎹', description: 'Daily music practice' },
          { id: 'study-time', name: 'Study Time', emoji: '📖', description: 'Review and learn' },
          { id: 'wash-hands-pm', name: 'Wash Hands', emoji: '🧼', description: 'Clean up after school' },
          { id: 'change-clothes', name: 'Change Clothes', emoji: '👕', description: 'Into play clothes' },
          { id: 'walk-pet', name: 'Walk Pet', emoji: '🐕', description: 'Exercise time for pets' },
          { id: 'chores', name: 'Chores', emoji: '🧹', description: 'Help around the house' },
          { id: 'call-family', name: 'Call Family', emoji: '📞', description: 'Connect with relatives' },
          { id: 'activity-class', name: 'Activity Class', emoji: '🎯', description: 'Sports, dance, or lessons' },
          { id: 'quiet-time', name: 'Quiet Time', emoji: '💭', description: 'Rest and recharge' }
        ],
        order: 3
      },
      {
        id: 'evening-activities',
        name: 'Evening Activities',
        activities: [
          { id: 'take-bath', name: 'Take Bath', emoji: '🛁', description: 'Warm water and bubbles' },
          { id: 'shower-evening', name: 'Shower', emoji: '🧴', description: 'Quick evening rinse' },
          { id: 'put-on-pajamas', name: 'Put on Pajamas', emoji: '👔', description: 'Comfy sleep clothes' },
          { id: 'brush-teeth-pm', name: 'Brush Teeth', emoji: '🦷', description: 'Before bed cleaning' },
          { id: 'bedtime-story', name: 'Bedtime Story', emoji: '📚', description: 'Wind down with books' },
          { id: 'family-time', name: 'Family Time', emoji: '🤗', description: 'Connect and share' },
          { id: 'no-screens', name: 'No Screens', emoji: '📱', description: 'Power down devices' },
          { id: 'tidy-room', name: 'Tidy Room', emoji: '🧸', description: 'Quick toy cleanup' },
          { id: 'lights-out', name: 'Lights Out', emoji: '💡', description: 'Time to sleep' },
          { id: 'bedtime', name: 'Bedtime', emoji: '🌙', description: 'Sweet dreams' }
        ],
        order: 4
      },
      {
        id: 'therapy-wellness',
        name: 'Therapy/Wellness Activities',
        activities: [
          { id: 'deep-breathing', name: 'Deep Breathing', emoji: '🧘', description: 'Calm and center' },
          { id: 'feelings-check', name: 'Feelings Check', emoji: '💭', description: 'How am I feeling?' },
          { id: 'journal-time', name: 'Journal Time', emoji: '📓', description: 'Write or draw thoughts' },
          { id: 'stretching', name: 'Stretching', emoji: '🤲', description: 'Move your body gently' },
          { id: 'speech-practice', name: 'Speech Practice', emoji: '🗣️', description: 'Work on sounds and words' },
          { id: 'sensory-break', name: 'Sensory Break', emoji: '✋', description: 'Calming sensory activities' },
          { id: 'focus-exercise', name: 'Focus Exercise', emoji: '🎯', description: 'Attention building activity' },
          { id: 'calm-down-time', name: 'Calm Down Time', emoji: '😌', description: 'Reset and regulate' },
          { id: 'pt-exercises', name: 'PT Exercises', emoji: '💪', description: 'Physical therapy routine' },
          { id: 'brain-break', name: 'Brain Break', emoji: '🧠', description: 'Mental reset activity' }
        ],
        order: 5
      }
    ]
  }
}
```

## Implementation Phases

### Phase 1: Data Structure & Migration
**Goal**: Update store structure and migrate existing users

#### Files to Modify:
1. **`/src/stores/useAppStore.js`**
   - Add new `stackMapLibrary` field with default activity groups
   - Rename `library` to `myLibrary` with activity groups
   - Add actions: `createActivityGroup`, `deleteActivityGroup`, `updateActivityGroup`
   - Add migration logic for existing data

2. **`/src/constants/stackMapLibrary.js`** (NEW)
   - Contains the 6 default activity groups (Morning, Food, Play, Afternoon, Evening, Therapy/Wellness)
   - Export as constant STACKMAP_LIBRARY
   - Total of 60 curated activities

3. **Remove Old Code**:
   - Delete DEFAULT_CATEGORIES from ActivityLibrary.js
   - Delete DEFAULT_CATEGORIES from LibraryTabContent.js
   - Remove all commented-out default activity code

#### Migration Logic:
```javascript
const migrateToActivityGroups = (state) => {
  // Migrate existing library to myLibrary with activity groups
  if (state.library?.categories || state.activityCategories) {
    const existingCategories = state.library?.categories || state.activityCategories || [];
    
    // Convert categories to activity groups (excluding old defaults)
    const userGroups = existingCategories
      .filter(cat => cat.id === 'my-templates' || cat.activities?.length > 0)
      .map(cat => ({
        ...cat,
        isUserCreated: true,
        createdAt: Date.now(),
        lastModified: Date.now(),
        order: cat.order || 999
      }));
    
    state.myLibrary = {
      activityGroups: userGroups.length > 0 ? userGroups : [],
      groupOrder: userGroups.map(g => g.id)
    };
  }
  
  // Initialize StackMap Library
  if (!state.stackMapLibrary) {
    state.stackMapLibrary = STACKMAP_LIBRARY;
  }
  
  return state;
};
```

### Phase 2: Activity Group Management System
**Goal**: Implement full CRUD operations for activity groups

#### Files to Modify:
1. **`/src/components/ActivityLibrary/ActivityLibrary.js`**
   - Remove DEFAULT_CATEGORIES code completely
   - Show two sections: "StackMap Library" and "My Library"
   - Add "Create Activity Group" button
   - Implement "Add All" button for each group
   - Show activity counts for each group

2. **`/src/components/Modals/ActivityManagementModal/LibraryTabContent.js`**
   - Consolidate with ActivityLibrary.js (remove duplicate code)
   - Or deprecate in favor of single implementation

3. **`App.js`**
   - Add `createCustomCategory` function
   - Add `importFromStarterTemplates` function
   - Update `addActivityToLibrary` to respect category types

#### New Functions:
```javascript
// In App.js
const createActivityGroup = (name, metadata = {}) => {
  const newGroup = {
    id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    activities: [],
    isUserCreated: true,
    createdAt: Date.now(),
    lastModified: Date.now(),
    order: myLibrary.activityGroups.length,
    metadata
  };
  
  const updatedLibrary = {
    ...myLibrary,
    activityGroups: [...myLibrary.activityGroups, newGroup],
    groupOrder: [...myLibrary.groupOrder, newGroup.id]
  };
  
  setMyLibrary(updatedLibrary);
  return newGroup.id;
};

const addAllFromGroup = (groupId, isStackMapLibrary = false) => {
  // Add all activities from a group to current day
  const groups = isStackMapLibrary ? 
    stackMapLibrary.activityGroups : 
    myLibrary.activityGroups;
    
  const group = groups.find(g => g.id === groupId);
  if (group) {
    const newActivities = group.activities.map(activity => ({
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completed: false
    }));
    // Add to user's current day
    addMultipleActivities(newActivities);
  }
};
```

### Phase 3: UI/UX Enhancements
**Goal**: Create intuitive category management interface

#### New UI Components:
1. **`/src/components/ActivityGroupModal/ActivityGroupModal.js`** (NEW)
   - Form for creating new activity groups
   - Name and description fields
   - Optional color selection
   - Validation for duplicate names

2. **`/src/components/StackMapLibraryPanel/StackMapLibraryPanel.js`** (NEW)
   - Display the 6 StackMap Library groups
   - "Add All" button for each group
   - "Copy to My Library" action
   - Activity preview on tap
   - Read-only display (no editing)

#### UI Updates:
1. **Activity Library Modal**:
   - Two sections: "StackMap Library" (top) | "My Library" (bottom)
   - "Add All" button prominently displayed for each group
   - Activity count badge for each group
   - Drag to reorder groups in My Library
   - Visual separator between StackMap and My libraries

2. **Category Context Menu**:
   - Rename (if not protected)
   - Delete (if not protected)
   - Duplicate
   - Export Category
   - Convert to Routine

### Phase 4: Sync & Export Updates
**Goal**: Ensure new structure syncs properly

#### Files to Modify:
1. **`/src/services/sync/syncService.js`**
   - Include `starterTemplates` in sync data
   - Handle category metadata in sync
   - Version checking for starter template updates

2. **`/src/components/Modals/DataModal/DataModal.js`**
   - Update export to include enhanced category structure
   - Add option to export individual categories
   - Import validation for new structure

### Phase 5: Testing & Polish
**Goal**: Ensure robust functionality

#### Test Scenarios:
1. Create multiple routine categories
2. Switch between routines
3. Export/import categories
4. Sync between devices
5. Migrate existing users
6. Handle edge cases (duplicate names, special characters)

## Files Affected (Complete List)

### Core Store & State:
- `/src/stores/useAppStore.js` - MAJOR CHANGES
- `/src/constants/starterTemplates.js` - NEW FILE

### UI Components:
- `/src/components/ActivityLibrary/ActivityLibrary.js` - MAJOR CHANGES
- `/src/components/Modals/ActivityManagementModal/LibraryTabContent.js` - CONSOLIDATE/REMOVE
- `/src/components/Modals/ActivityManagementModal/ActivityManagementModal.js` - MINOR UPDATES
- `/src/components/CategoryCreationModal/CategoryCreationModal.js` - NEW FILE
- `/src/components/StarterTemplatesPanel/StarterTemplatesPanel.js` - NEW FILE
- `App.js` - MODERATE CHANGES

### Sync & Data:
- `/src/services/sync/syncService.js` - MINOR UPDATES
- `/src/components/Modals/DataModal/DataModal.js` - MINOR UPDATES

### Utilities:
- `/src/utils/categoryHelpers.js` - NEW FILE (validation, sorting, etc.)

## Migration Strategy

### For Existing Users:
1. Preserve all existing categories and activities
2. Add metadata to existing categories
3. Mark user-created categories appropriately
4. Initialize with empty starter templates
5. No data loss, only enhancements

### Version Compatibility:
- Export format version bumps to v4
- Backward compatible import (v3 files still work)
- Sync protocol remains compatible
- Graceful degradation for older app versions

## Success Criteria

- [ ] StackMap Library loads with 6 groups and 60 activities
- [ ] Users can create custom activity groups in My Library
- [ ] "Add All" button works for both libraries
- [ ] Clear visual separation between StackMap and My libraries
- [ ] Users can copy groups from StackMap to My Library
- [ ] Activity groups can be used as categories or routines (user choice)
- [ ] Old DEFAULT_CATEGORIES code completely removed
- [ ] Data properly migrates for existing users
- [ ] Sync continues to work seamlessly
- [ ] Export/import handles new structure

## Rollback Plan

If issues arise:
1. Git commit checkpoint before implementation
2. Revert store structure changes
3. Fall back to current implementation
4. User data remains intact due to migration design

## Implementation Order

1. **Start with**: `/src/stores/useAppStore.js` - Add new fields and migration
2. **Then**: Create `/src/constants/starterTemplates.js` with empty structure
3. **Next**: Update ActivityLibrary.js to show category types
4. **Then**: Add category creation UI
5. **Finally**: Update sync and export functionality

## Notes for Implementation

- Keep "My Templates" as protected default category
- Validate category names (no duplicates, reasonable length)
- Consider category limits (max 20 categories?)
- Use consistent icons for category types
- Maintain smooth animations during category operations
- Test thoroughly on all platforms (iOS, Android, Web)

## StackMap Library Content

The following 6 activity groups with 60 total activities will be included by default:

### Morning Activities (10 activities)
- Wake Up, Turn Off Alarm, Brush Teeth, Take Shower, Wash Face
- Get Dressed, Make Bed, Pack Backpack, Take Medicine, Drink Water

### Food Activities (10 activities)
- Eat Breakfast, Make Lunch, Morning Snack, Eat Lunch, Afternoon Snack
- Eat Dinner, Evening Snack, Help Cook, Clear Table, Set Table

### Play Activities (10 activities)
- Screen Time, Reading Time, Art & Crafts, Outdoor Play, Puzzles
- Board Games, Free Play, Music Time, Building Blocks, Sports Practice

### Afternoon Activities (10 activities)
- Homework, Practice Instrument, Study Time, Wash Hands, Change Clothes
- Walk Pet, Chores, Call Family, Activity Class, Quiet Time

### Evening Activities (10 activities)
- Take Bath, Shower, Put on Pajamas, Brush Teeth, Bedtime Story
- Family Time, No Screens, Tidy Room, Lights Out, Bedtime

### Therapy/Wellness Activities (10 activities)
- Deep Breathing, Feelings Check, Journal Time, Stretching, Speech Practice
- Sensory Break, Focus Exercise, Calm Down Time, PT Exercises, Brain Break

## Implementation Notes

- Activity Groups are flexible - users decide if they're categories or routines
- "Add All" button available for every group (user chooses whether to use it)
- StackMap Library is read-only, My Library is fully editable
- No enforced distinction between "categories" and "routines" - just groups