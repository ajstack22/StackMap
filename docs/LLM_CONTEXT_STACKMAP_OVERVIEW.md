# StackMap Application Overview for LLM Context

This document provides comprehensive context about the StackMap application for AI assistants working on the codebase.

---

## Application Summary

**StackMap** is a visual schedule application designed to help individuals with autism, ADHD, and executive function challenges manage daily routines. It uses intuitive activity cards and visual elements to help users understand "what comes next" and reduce anxiety about daily transitions.

### Target Users
- Families managing morning routines, homework, and bedtime
- Individuals with autism who thrive with visual structure
- People with ADHD needing external organization support
- Teachers and therapists creating consistent classroom routines
- Caregivers supporting elderly family members

### Technology Stack
- **Framework:** React Native (cross-platform: iOS, Android, Web)
- **State Management:** Zustand (4 specialized stores)
- **Encryption:** TweetNaCl with zero-knowledge sync
- **Backend:** MySQL + PHP API
- **Storage:** AsyncStorage/MMKV with debounced writes

### Key Files
- `App.js` - Main application component (~6000 lines)
- `src/stores/` - 5 Zustand store files
- `src/services/sync/` - Sync service modules
- `src/components/` - All UI components

---

## Core Data Structures

### CRITICAL: Field Naming Conventions

**Always use these field names:**
- **Activity:** `text` (NOT `name` or `title`), `icon` (NOT `emoji`)
- **User:** `name` (string), `icon` (NOT `emoji`)

```javascript
// Activity Structure
{
  id: "uuid",
  text: "Brush teeth",        // Display name - USE THIS
  icon: "🪥",                 // Emoji - USE THIS
  completed: false,
  completedAt: 1704067200,    // Unix timestamp (optional)
  completedBy: "device-id",   // For sync conflict resolution
  pinned: false,              // Keep after day completion
  deleted: false,             // Soft delete marker
  order: 0,                   // Position in list
  modifiedAt: 1704067200      // For sync conflict resolution
}

// User Structure
{
  id: "uuid",
  name: "Alex",               // String only
  icon: "😀",                 // Emoji
  createdAt: "2024-01-01T00:00:00.000Z",
  days: {
    today: { activities: [] },
    tomorrow: { activities: [] }
  }
}
```

### Store Update Pattern

```javascript
// WRONG - Will not properly update
useAppStore.setState({ users: data });

// CORRECT - Use store-specific methods
useUserStore.getState().setUsers(data);
useSettingsStore.getState().updateSettings(data);
useLibraryStore.getState().setLibrary(data);
useSyncStore.getState().setSyncEnabled(true);
```

---

## Workflow 1: Onboarding

### Overview
Multi-path wizard that guides new users through initial setup with 4 distinct entry paths.

### Component
`src/components/Onboarding/OnboardingUserCentered.js`

### Flow Paths

**Path 1: Fresh Start (New Users)**
```
Welcome → Create User → Features Carousel → Setup PIN (Optional) → Complete
```
- User creates first profile with name and emoji
- Views feature carousel (4-second auto-rotation)
- Optional 4-digit PIN protection for edit mode

**Path 2: Restore StackMap (Import JSON)**
```
Welcome → Import JSON → Features → Complete
```
- File picker triggers JSON import
- Data validated and imported
- Success banner with import summary

**Path 3: Sync StackMap (Create/Join)**
```
Welcome → Sync → Features → Complete
```
- Create New (Web Only): Generate recovery phrase + QR code
- Join Existing: Enter 32-character recovery phrase
- Auto-fetches sync data preview before joining

**Path 4: Direct Sync URL**
```
Welcome → Sync Preview → Features → Complete
```
- Triggered by URL parameter `?sync=recovery_phrase`
- Auto-fetches and displays sync data preview

### Key Data
- Recovery phrase: 32-character hexadecimal string
- PIN: Optional 4-digit code for edit mode protection
- User profile: name + icon (emoji)

---

## Workflow 2: Add Activity

### Overview
Users add activities from the library or create custom ones to build their daily schedule.

### Components
- `src/components/Modals/ActivityManagementModal/` - Tabbed modal with Add and Library tabs
- `src/components/Modals/AddActivityModal/` - Form for creating new activities
- `src/components/Modals/ActivityLibraryModal/` - Browse and select from library

### Process
1. User opens Activity Management Modal (tap + button)
2. **Add Tab:** Create new activity with text + emoji + optional description
3. **Library Tab:** Browse StackMap Library or My Templates
4. Activity added to current user's current day (today/tomorrow)
5. Optionally save to "My Templates" for reuse

### Activity Data Created
```javascript
{
  id: "generated-uuid",
  text: "User entered text",
  icon: "selected-emoji",
  description: "optional description",
  completed: false,
  pinned: false,
  order: nextOrderNumber,
  modifiedAt: Date.now()
}
```

---

## Workflow 3: Library

### Overview
Activity templates organized into system-provided and user-created collections.

### Structure

**StackMap System Library** (Read-only, ~40 activities in 5 categories):
- **Morning:** Wake Up, Brush Teeth, Take Shower, Get Dressed, Pack Backpack
- **Food:** Eat Breakfast, Make Lunch, Eat Dinner, Clear Table
- **Play:** Screen Time, Reading, Art & Crafts, Outdoor Play
- **Afternoon:** Homework, Practice Instrument, Study Time, Chores
- **Evening:** Take Bath, Put on Pajamas, Read Stories, Get in Bed

**My Templates** (User-created):
- Activities saved by users for reuse
- Stored in `my-templates` category
- Can be added to any user's schedule

### Library Data Structure
```javascript
{
  categories: [
    {
      id: "morning",
      name: "Morning Activities",
      activities: [
        { id: "uuid", text: "Wake Up", icon: "☀️" },
        // ...
      ]
    }
  ],
  userAddedActivityIds: ["uuid1", "uuid2"]  // Tracks My Templates
}
```

### Key Files
- `src/constants/stackMapLibrary.js` - System library definitions
- `src/stores/useLibraryStore.js` - Library state management

---

## Workflow 4: Sync

### Overview
Zero-knowledge encrypted sync across devices. Server never sees plaintext data.

### Key Concepts

**Recovery Phrase:**
- 32-character hexadecimal string
- Generated client-side, never sent to server
- Used to derive encryption keys
- Must be shared securely between devices

**Sync ID:**
- First 16 bytes of NaCl hash (100k iterations)
- Derived from recovery phrase + fixed salt
- Server identifies sync groups by this ID

### Encryption Details
- **Method:** TweetNaCl secretbox (XSalsa20-Poly1305)
- **Key Derivation:** nacl.hash with 100,000 iterations
- **Nonce:** Random 24-byte nonce per message

### Data Flow

**Push (Device → Server):**
1. User action triggers store update
2. Data gathered from 4 Zustand stores
3. Fields normalized to `{text, icon}` format
4. Encryption key derived from recovery phrase
5. Data encrypted with nacl.secretbox
6. POST to server: `{sync_id, encrypted_blob, timestamp}`
7. Server stores blob (never decrypts)

**Pull (Server → Device):**
1. Triggered by: 30-second interval, manual, app visibility, data change
2. Server returns encrypted blob
3. Decrypted client-side with derived key
4. Conflicts resolved (field-level last-write-wins, 3-second merge window)
5. Zustand stores updated via specific methods

### Sync Setup

**Create New Sync (Web Only):**
```javascript
const recoveryPhrase = encryptionService.generateRecoveryPhrase();
const syncId = await syncService.generateSyncId(recoveryPhrase);
// Display QR: stackmap://sync/RECOVERY_PHRASE
```

**Join Existing Sync:**
```javascript
const recoveryPhrase = "user-enters-32-hex-chars";
const syncId = await syncService.generateSyncId(recoveryPhrase);
const data = await syncService.pullData();
await syncService.restoreData(encryptionService.decryptData(data));
```

### API Endpoints
- `push_timestamp.php` - Store encrypted blob
- `pull_timestamp.php` - Retrieve encrypted blob
- `create_timestamp.php` - Initialize sync group
- `join_timestamp.php` - Join existing group

### Key Files
- `src/services/sync/syncService.js` - Main sync orchestration
- `src/services/sync/encryptionServiceFixed.ts` - TweetNaCl encryption
- `docs/sync/README.md` - Complete technical documentation

---

## Workflow 5: Complete Day

### Overview
End-of-day workflow to organize activities for tomorrow and reset the current day.

### Component
`src/components/Modals/CompleteDayModal/CompleteDayModal.js`

### Process
1. User opens "Complete Day" modal
2. Activities automatically categorized into 4 buckets:
   - **Delete:** Unpinned activities (removed by default)
   - **Keep Today:** Pinned activities (reset to incomplete)
   - **From Tomorrow:** Tomorrow's activities move to today
   - **New Tomorrow:** Pinned activities copied for tomorrow
3. User taps activities to move between buckets
4. Confirmation modal shows summary
5. On confirm:
   - Delete bucket items removed
   - Keep bucket items reset to incomplete
   - Tomorrow activities moved to today
   - New tomorrow items created (fresh IDs, uncompleted)

### Data Transformation
```javascript
// Input
{
  toDelete: Activity[];           // Remove entirely
  toKeepForToday: Activity[];     // Keep, reset completion
  fromTomorrowToToday: Activity[]; // Move to today
  forNewTomorrow: Activity[];     // Copy with new IDs
}

// Result
// - toDelete items: removed from state
// - toKeepForToday: completed=false, completedAt=null
// - fromTomorrowToToday: moved to today's activities
// - forNewTomorrow: new activities created for tomorrow
```

---

## Workflow 6: User/Edit Mode Split

### Overview
Two distinct modes for interacting with the schedule:
- **Regular Mode:** View schedule, check off completed activities
- **Edit Mode:** Add, delete, reorder, and manage activities

### Regular Mode (Schedule View)

**Purpose:** Day-to-day use - viewing schedule and marking activities complete

**Layout (Responsive):**
- **Mobile (<768px):** Single column, full-width cards
- **Tablet (768-1199px):** Two columns, 48% width cards
- **Desktop (≥1200px):** Three columns, 31% width cards

**Interactions:**
- Tap activity to view details
- Tap checkbox to mark complete/incomplete
- Celebration animations on completion
- Progress tracking in header

### Edit Mode

**Purpose:** Schedule management - adding, removing, reordering activities

**Component:** `src/components/EditModeList/`

**Features:**
- Unified list view (all platforms)
- Button-based reordering (up/down arrows) - no drag & drop
- Delete button per activity
- Pin/unpin toggle
- Save to library option
- Batch selection and deletion

**useEditMode Hook** (`src/hooks/useEditMode.js`):
```javascript
const {
  handleMoveUp,      // Move item up with haptic
  handleMoveDown,    // Move item down with haptic
  handleDelete,      // Soft delete activity
  handleBatchDelete, // Delete selected items
  handleUndo,        // Undo last operation
  toggleSelection,   // Select/deselect item
  selectAll,         // Select all items
  clearSelection     // Deselect all
} = useEditMode(activities, onActivitiesChange);
```

### Mode Switching
- Edit button in header/toolbar toggles mode
- PIN protection optional (set in onboarding or settings)
- Mode persists until explicitly exited
- Unsaved changes prompt on exit

### Key Files
- `App.js` lines 4635-4870 - Mode rendering logic
- `src/components/EditModeList/` - Edit mode components
- `src/hooks/useEditMode.js` - Edit mode state management

---

## Platform-Specific Considerations

### iOS
- AsyncStorage calls debounced (causes 20+ second freezes otherwise)
- NetInfo.fetch() disabled (causes freezes)
- Uses native Alert.alert for confirmations
- Safe area insets required

### Android
- FlexWrap layouts MUST use percentage widths (48%) not calculated widths
- Font weights MUST use font variants (ComicRelief-Bold) not fontWeight property
- Material Design elevation for shadows

### Web
- Alert.alert NOT supported - use ConfirmModal component
- Sync creation only available on web
- 3-column layout uses 31% width
- VectorIcons.web.js must use `<span>` not `<Text>`

---

## Common Gotchas

1. **Field Names:** Always use `text` and `icon`, never `name`/`title`/`emoji`
2. **Store Updates:** Use store-specific methods, not `useAppStore.setState()`
3. **Platform Layouts:** Android multi-column requires percentage widths
4. **Sync Timing:** 5-second debounce on data changes before sync
5. **PIN Protection:** Stored locally, not synced between devices
6. **Activity IDs:** UUIDs generated client-side, must be unique

---

## Quick Reference: Key Files

| Purpose | File Path |
|---------|-----------|
| Main App | `App.js` |
| User Store | `src/stores/useUserStore.js` |
| Settings Store | `src/stores/useSettingsStore.js` |
| Library Store | `src/stores/useLibraryStore.js` |
| Sync Store | `src/stores/useSyncStore.js` |
| Sync Service | `src/services/sync/syncService.js` |
| Encryption | `src/services/sync/encryptionServiceFixed.ts` |
| Onboarding | `src/components/Onboarding/OnboardingUserCentered.js` |
| Edit Mode | `src/components/EditModeList/` |
| Activity Modal | `src/components/Modals/ActivityManagementModal/` |
| Complete Day | `src/components/Modals/CompleteDayModal/` |
| System Library | `src/constants/stackMapLibrary.js` |
| Data Normalizer | `src/utils/dataNormalizer.js` |

---

## Documentation Links

- Full sync documentation: `docs/sync/README.md`
- Store architecture: `docs/STORE_ARCHITECTURE.md`
- Data structure: `docs/DATA_STRUCTURE.md`
- Field conventions: `docs/features/field-conventions.md`
- Edit mode specs: `docs/features/edit-mode-refactor.md`
- Deployment guide: `docs/deployment/README.md`
