# Pending Changes

## Title: Fix emoji field handling and remove backward compatibility

### Changes Made:

#### Bug Fix
- Fixed edit button in App.js to correctly read from `item.icon` instead of `item.emoji`
- This was causing "Minified React error #130" when trying to change emoji on existing cards

#### Backward Compatibility Removal
Per user request - removing all fallbacks to force errors and find remaining issues:

**Activities (item.emoji → item.icon)**
- Removed all `item.emoji` fallbacks in display logic
- Removed all `item.emoji` fallbacks in comparison logic  
- Activities now strictly require `item.icon` field

**Users (user.emoji → user.icon)**
- Removed all `user.emoji` fallbacks in display components
- Removed user.emoji migration code from App.js
- Users now strictly require `user.icon` field

#### Files Modified
- `App.js` - Fixed edit button, removed all emoji fallbacks
- `src/components/Modals/ContextModal/ContextModal.js` - Removed user.emoji fallback
- `src/components/Modals/AccessModal/UsersTabContent.js` - Removed user.emoji fallback  
- `src/components/Onboarding/OnboardingNew.js` - Removed user.emoji fallback
- `src/components/Modals/ActivityManagementModal/LibraryTabContent.js` - Removed activity.emoji from search

#### Testing Notes
- Test editing existing activity cards - emoji changes should work
- Test creating new activities - emoji selection should work
- Test user switching - user icons should display correctly
- Any missing icon fields will now cause visible errors (intentional)

