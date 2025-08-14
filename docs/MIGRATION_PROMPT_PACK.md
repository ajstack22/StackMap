# StackMap Data Structure Migration - Complete Prompt Pack
**Purpose:** Migrate from transitional dual-structure to clean final implementation
**Pre-launch window:** Execute NOW before any users exist
**Estimated time:** 2-3 days total

---

## PHASE 1: Data Migration & Backup (30 minutes)
**Run this FIRST in a new chat**

### Prompt 1.1: Backup and Migrate Data Files
```
I need to migrate all data files from the old structure to the new structure. This is a pre-launch app with no production users.

OLD structure uses:
- activities (array)
- activityCategories (object)
- templates (object)
- emoji (field on activities)

NEW structure uses:
- libraryTemplates (array, replaces activities)
- library.categories (object, replaces activityCategories)
- icon (field, replaces emoji)
- NO templates field

Tasks:
1. Create backup of /data/demo-data-kids.json as demo-data-kids-backup-[timestamp].json
2. Update demo-data-kids.json to use ONLY new field names:
   - Rename "activities" to "libraryTemplates" 
   - Rename "activityCategories" to library: { categories: ... }
   - Remove any "templates" field
   - Ensure all activities use "icon" not "emoji"
3. Search for any other .json data files and update them similarly
4. Create a migration report showing what was changed

IMPORTANT: This is a breaking change. We are NOT maintaining backward compatibility.
```

---

## PHASE 2: Core Store Migration (2-3 hours)
**Run in same or new chat after Phase 1**

### Prompt 2.1: Clean up Zustand Store
```
I need to clean up /src/stores/useAppStore.js to remove ALL migration and compatibility code.

Current state has both old and new fields for compatibility. We're removing all old fields.

REMOVE these fields completely:
- activities (array) - replaced by libraryTemplates
- activityCategories (object) - replaced by library.categories  
- templates (object) - deprecated
- Any "DEPRECATED" comments

KEEP only:
- libraryTemplates (array)
- library: { categories, userAddedActivityIds }

Also:
1. Remove ALL migration functions (migrateDataStructure, etc.)
2. Remove ALL fallback logic (field1 || field2 patterns)
3. Remove setActivities - only keep setLibraryTemplates
4. Remove setActivityCategories - only keep setLibraryCategories
5. Update persist logic to only save new fields
6. Remove any code that syncs old and new fields

The store should be CLEAN with no references to old field names.
```

### Prompt 2.2: Update Store Actions
```
Continue cleaning useAppStore.js:

Update all store actions to use ONLY new field names:
1. addActivity should work with libraryTemplates
2. updateActivity should work with libraryTemplates
3. deleteActivity should work with libraryTemplates
4. Any category functions should use library.categories

Remove any actions that exist only for compatibility.
Ensure no action references activities, activityCategories, or templates.
```

---

## PHASE 3: Service Layer Updates (3-4 hours)
**Run after Phase 2**

### Prompt 3.1: Update Sync Service
```
Update /src/services/sync/syncService.js to use ONLY the new data structure.

Changes needed:
1. Remove ALL fallback patterns like: state.libraryTemplates || state.activities || []
2. Use ONLY:
   - state.libraryTemplates (not state.activities)
   - state.library.categories (not state.activityCategories)
3. Update prepareSyncData() to only include new fields
4. Update restoreData() to only set new fields
5. Remove any migration logic in sync
6. Update all console.logs to reference new field names

Search for these patterns and fix them:
- "|| state.activities"
- "|| state.activityCategories"
- ".activities" (except in user.days.today.activities which is correct)
- ".activityCategories"
- ".templates"
```

### Prompt 3.2: Update Import/Export Services
```
Update all import/export logic to use ONLY new structure:

Files to update:
1. /src/components/Modals/DataModal/DataModal.js
2. /src/components/Onboarding/OnboardingNew.js
3. /src/utils/dataNormalizer.js (if exists)

Changes:
1. Exports should ONLY include:
   - libraryTemplates (not activities)
   - library.categories (not activityCategories)
2. Imports should ONLY look for new field names
3. Remove any code that handles old field names
4. Remove backward compatibility logic
5. Update import preview to show new structure

This is a breaking change - old exports will NOT work after this update.
```

---

## PHASE 4: Component Updates (2-3 hours)
**Run after Phase 3**

### Prompt 4.1: Update ActivityLibrary Component
```
Update /src/components/ActivityLibrary/ActivityLibrary.js:

1. Remove ALL references to customCategories prop fallback
2. Use ONLY library.categories structure
3. Remove migration comments
4. Clean up any dual-structure handling
5. Ensure it reads from library.categories in store
6. Remove any backward compatibility code

The component should assume library.categories always exists.
```

### Prompt 4.2: Update All Components Using Activities
```
Search for and update ALL components that reference old field names:

1. Search entire /src directory for:
   - ".activities" (except user.days.today.activities)
   - ".activityCategories"
   - ".templates"
   - "state.activities"
   - "emoji" field references

2. Update each file to use:
   - libraryTemplates instead of activities
   - library.categories instead of activityCategories
   - icon instead of emoji

3. Remove any || fallback patterns

List all files changed and what was updated in each.
```

---

## PHASE 5: Test & Validate (1-2 hours)
**Run after Phase 4**

### Prompt 5.1: Validation & Testing
```
Validate the migration is complete:

1. Search for ANY remaining references to old fields:
   - grep -r "\.activities\[" --exclude-dir=node_modules
   - grep -r "activityCategories" --exclude-dir=node_modules  
   - grep -r "\.templates\[" --exclude-dir=node_modules
   - grep -r "emoji.*:" --exclude-dir=node_modules

2. Test critical flows:
   - Create a new user
   - Add activities to library
   - Import demo-data-kids.json
   - Export data and verify structure
   - Test sync functionality

3. Verify the store structure by logging:
   - useAppStore.getState() 
   - Ensure NO old fields exist

4. Create a test checklist of what was verified

Report any remaining issues found.
```

---

## PHASE 6: Documentation Updates (30 minutes)
**Run after Phase 5**

### Prompt 6.1: Update Documentation
```
Update all documentation to reflect the clean implementation:

1. Update /docs/architecture/STATE_MANAGEMENT.md:
   - Remove migration status section
   - Document ONLY the final structure
   - Remove any mentions of deprecated fields

2. Update /docs/CARD_LIBRARY_SYSTEM.md:
   - Document actual implementation
   - Remove incorrect structure examples

3. Update /docs/data/data-dictionary.md:
   - Mark old fields as "REMOVED as of [date]"
   - Document only current structure

4. Delete these outdated docs:
   - /docs/IMPLEMENTATION_ANALYSIS.md
   - /docs/BREAKING_CHANGES_ANALYSIS.md
   - /docs/CODEBASE_DOCUMENTATION_AUDIT_REPORT.md

5. Create /docs/MIGRATION_COMPLETED.md documenting:
   - What was changed
   - New structure
   - Date completed
```

---

## PHASE 7: Final Cleanup (30 minutes)
**Run as final step**

### Prompt 7.1: Final Cleanup
```
Final cleanup tasks:

1. Search for and remove ANY comments containing:
   - "DEPRECATED"
   - "TODO: migrate"
   - "backwards compatibility"
   - "fallback"
   - "migration"

2. Search for any remaining console.logs referencing old structures

3. Run build commands to ensure no errors:
   - npm run web
   - npm run android (if applicable)
   - npm run ios (if applicable)

4. Create a final summary:
   - List all files modified
   - Confirm old structure completely removed
   - Confirm new structure working
   - Note any issues found

This completes the migration to the clean structure.
```

---

## Alternative: Single Session Approach

If you prefer to run everything in ONE chat session, use this combined prompt:

### Complete Migration Prompt
```
I need to complete a data structure migration for a pre-launch app. We're removing ALL backward compatibility and migration code since we have no users yet.

Please execute these tasks IN ORDER:

1. BACKUP: Create backup of /data/demo-data-kids.json

2. MIGRATE DATA FILES:
   - Update demo-data-kids.json to use libraryTemplates instead of activities
   - Change activityCategories to library: { categories: ... }
   - Ensure all use "icon" not "emoji"

3. CLEAN STORE (/src/stores/useAppStore.js):
   - Remove fields: activities, activityCategories, templates
   - Keep only: libraryTemplates, library.categories
   - Remove ALL migration functions
   - Remove ALL fallback patterns (field1 || field2)

4. UPDATE SERVICES:
   - syncService.js: Use only new field names
   - Remove all fallbacks like "state.libraryTemplates || state.activities"
   
5. UPDATE COMPONENTS:
   - DataModal.js: Export/import only new structure
   - OnboardingNew.js: Import only new structure
   - ActivityLibrary.js: Use only library.categories

6. VALIDATE:
   - Search for any remaining old field references
   - Test import of updated demo-data-kids.json
   - Verify store has no old fields

7. UPDATE DOCS:
   - Update STATE_MANAGEMENT.md to show only final structure
   - Update CARD_LIBRARY_SYSTEM.md to match implementation

Report what was changed in each file and confirm the migration is complete.
```

---

## Notes for Implementation

1. **Commit after each phase** for easy rollback if needed
2. **Test between phases** to catch issues early  
3. **This is a breaking change** - make sure to note in commit messages
4. **No backward compatibility** - this is intentional for pre-launch
5. **Documentation should reflect final state** only, no migration notes

## Expected Outcome

After completion:
- Zero references to old field names
- Clean, single structure throughout codebase
- Documentation matches implementation exactly
- No migration or compatibility code
- Ready for launch with clean architecture