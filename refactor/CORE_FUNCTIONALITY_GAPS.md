# Core Functionality Gap Analysis: Main App vs Refactor

## Core Functionality in Main StackMap App

### 1. Activity/Task Structure and Storage
**Main App:**
- Activities have: `id`, `title`, `description`, `icon`, `completed`, `keep` (pin status), `cardType` (recurring/frequent/single-use), `createdDate`, `time`, `cardNumber`
- Activities stored per user with separate `activities` (today) and `tomorrowActivities` arrays
- Deep cloning to avoid shared references between today/tomorrow
- Card numbers assigned dynamically (1-based indexing)
- Maximum 50 activities limit

**Refactor Status:**
- ✅ Has basic task structure with `id`, `title`, `description`, `icon`, `completed`
- ❌ Missing: `keep` (pin functionality), `cardType`, `createdDate`, `time`, `cardNumber`
- ❌ Missing: Tomorrow activities concept
- ❌ Missing: Deep cloning mechanism
- ❌ Missing: Activity limits

### 2. Day Mapping/Planning Features
**Main App:**
- Today/Tomorrow day selector in header
- Separate activity lists for each day
- "Complete Day" functionality that:
  - Moves tomorrow's cards to today
  - Keeps pinned cards for tomorrow
  - Discards unpinned cards
  - Shows sorting wave animation
- Day context stored in `ui.currentDay`
- Visual indicators for active day

**Refactor Status:**
- ✅ Has basic today/tomorrow concept in constants
- ❌ Missing: Day selector UI component
- ❌ Missing: Complete day functionality
- ❌ Missing: Separate storage for tomorrow activities
- ❌ Missing: Day transition logic
- ❌ Missing: Pin/keep functionality

### 3. Card Display Modes
**Main App:**
- Numbers mode: Shows cards with numbers (1, 2, 3...)
- Times mode: Shows cards sorted by time with time display
- Display mode stored per user in settings
- Card sorting based on active mode
- Time parsing for various formats (12/24 hour)

**Refactor Status:**
- ❌ Missing: Display mode switching
- ❌ Missing: Numbers vs times modes
- ❌ Missing: Time-based sorting
- ❌ Missing: Time display formatting

### 4. Activity Completion and Daily Reset
**Main App:**
- Toggle completion with celebration animations (confetti/fireworks)
- Completion state persists per activity
- Edit mode completion without celebration
- Daily reset through "Complete Day" function
- Pin/keep cards survive daily reset

**Refactor Status:**
- ✅ Has basic completion toggle
- ✅ Has celebration module
- ❌ Missing: Edit mode completion behavior
- ❌ Missing: Daily reset functionality
- ❌ Missing: Pin/keep system

### 5. Edit Mode Functionality
**Main App:**
- Grownup mode toggle with password protection
- In edit mode:
  - Add/edit/delete cards
  - Reorder cards by dragging
  - Edit card numbers directly
  - Filter cards by search
  - Access to card menu (duplicate, add to library, delete)
  - Title editing (13-character limit)
  - Card type selection

**Refactor Status:**
- ✅ Has edit mode module
- ✅ Has grownup mode with password
- ✅ Has drag-drop reordering
- ❌ Missing: Card filtering
- ❌ Missing: Card menu options
- ❌ Missing: Title character limits
- ❌ Missing: Card type selection UI

### 6. User/Profile Switching
**Main App:**
- Multiple user profiles with unique IDs
- Each user has:
  - Name, icon, custom title
  - Individual settings (colors, display mode)
  - Separate activity lists (today/tomorrow)
  - Personal library
- User selector in header subtitle
- Hybrid panel for user management
- Group library shared across users

**Refactor Status:**
- ✅ Has user manager module
- ✅ Has basic profile UI
- ❌ Missing: User-specific activities separation
- ❌ Missing: User-specific tomorrow activities
- ❌ Missing: Custom titles per user
- ❌ Missing: User selector integration
- ❌ Missing: Group vs personal libraries

### 7. Additional Core Features

**Activity Library System:**
- Main App: Personal and group libraries, ability to save cards to library
- Refactor: ✅ Has activity library module (basic implementation)

**Visual Activity Cards:**
- Main App: Uses emoji icons, no visual cards
- Refactor: ✅ Has visual card manager module (new feature)

**Settings Management:**
- Main App: Per-user settings for theme, display mode, auto-sync
- Refactor: ✅ Has settings manager, ❌ Missing display mode settings

**Data Sync:**
- Main App: Google Drive sync with operation log, dirty tracking
- Refactor: ❌ Missing sync functionality

**PWA Features:**
- Main App: Service worker, offline support, update prompts
- Refactor: ✅ Has service worker and offline support

**Onboarding:**
- Main App: Welcome splash, first-time user detection
- Refactor: ✅ Has onboarding and welcome modules

## Critical Missing Pieces for Core Functionality

1. **Day Management System** - The entire today/tomorrow concept with day switching and transitions
2. **Pin/Keep Functionality** - Ability to pin cards that survive daily resets
3. **Card Types** - Recurring/frequent/single-use categorization
4. **Display Modes** - Numbers vs times display options
5. **Time Management** - Time field for activities and time-based sorting
6. **Complete Day Workflow** - The core daily planning reset mechanism
7. **User-Specific Data Separation** - Proper multi-user support with separate activity lists
8. **Card Filtering** - Search/filter functionality in edit mode
9. **Data Sync** - Google Drive or other sync mechanism
10. **Activity Limits and Validation** - Max activities, character limits, etc.

## Implementation Priority

1. **High Priority** (Core to StackMap's purpose):
   - Day management (today/tomorrow)
   - Complete day functionality
   - Pin/keep system
   - User-specific activity separation

2. **Medium Priority** (Important features):
   - Display modes (numbers/times)
   - Card types
   - Time management
   - Card filtering

3. **Lower Priority** (Can be added later):
   - Data sync
   - Advanced library features
   - Visual activity cards (already implemented as enhancement)