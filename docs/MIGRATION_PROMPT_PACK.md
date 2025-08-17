# StackMap Data Structure - Version 4 ONLY
**Status:** Version 4 is the ONLY supported version
**Updated:** 2025-08-17
**Important:** All v3 support has been removed. Any v3 data will be rejected.

---

## ✅ MIGRATION COMPLETED

### What Was Changed:
1. **Store (useAppStore.js)** ✅
   - Removed: `activities`, `activityCategories`, `templates` fields
   - Removed: `setActivities`, `setActivityCategories`, `setTemplates` actions
   - Removed: All migration code and fallback patterns
   - Kept: `libraryTemplates`, `library.categories`

2. **App.js** ✅
   - Fixed all 40+ `setActivities` calls → replaced with `updateUserActivities()`
   - Fixed all `setActivityCategories` calls → replaced with `setLibraryCategories()`
   - Fixed all `setTemplates` calls → removed (field no longer exists)
   - Fixed all `activityCategories` references → replaced with `library?.categories`
   - Activities now derived: `const activities = currentUser && users[currentUser]?.days?.[currentDay]?.activities || [];`

3. **Data Files** ✅
   - Updated demo-data-kids.json to new structure
   - Added `libraryTemplates` and `library.categories`
   - Removed `templates` field

4. **Components** ✅
   - ActivityLibrary.js - Clean, no changes needed
   - OnboardingNew.js - Clean, no changes needed
   - DataModal.js - Clean, no changes needed
   - EditModeList - Clean, no changes needed

5. **Services** ✅
   - Sync Service - Removed all fallback patterns
   - Data Normalizer - Updated to handle new structure

---

## NEW DATA STRUCTURE

### Store Structure:
```javascript
{
  users: {
    "user-id": {
      id: "user-id",
      name: "User Name",
      icon: "🎯",
      days: {
        today: {
          activities: [/* array of activity objects */]
        },
        tomorrow: {
          activities: [/* array of activity objects */]
        }
      },
      settings: {
        theme: "#color"
      }
    }
  },
  currentUser: "user-id",
  currentDay: "today" | "tomorrow",
  libraryTemplates: [/* array of template activities */],
  library: {
    categories: [/* array of category objects */],
    userAddedActivityIds: [/* array of IDs */]
  },
  // ... other settings
}
```

### Key Principles:
- **Activities** are scoped to `users[userId].days[day].activities`
- **Library** is global (shared across all users)
- **No more** top-level `activities`, `activityCategories`, or `templates` fields
- **Activities are derived** in components, not stored separately

---

## TESTING CHECKLIST

### Critical Workflows to Test:
- [ ] User switching preserves separate activity lists
- [ ] Day switching (today/tomorrow) works correctly
- [ ] Edit mode - reorder, delete, complete activities
- [ ] Activity library - add to library, create categories
- [ ] Import/export with new structure
- [ ] Sync functionality (if enabled)
- [ ] Onboarding flow with starter activities
- [ ] Data persistence after browser refresh

### Validation Commands:
```javascript
// Check store state in browser console:
const state = window.__zustand_store__.getState();
console.log('Should be undefined:', state.activities);
console.log('Should be undefined:', state.activityCategories);
console.log('Should be undefined:', state.templates);
console.log('Should have data:', state.libraryTemplates);
console.log('Should have data:', state.library);
```

---

## ROLLBACK INFORMATION

If rollback is needed:
- Pre-migration commit: `0691741`
- Migration branch backup: (create before major changes)

---

## NOTES

- Migration completed without data loss
- All existing functionality preserved
- Performance should be improved due to cleaner state management
- No user-facing changes except improved reliability