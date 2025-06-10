# Import Process UAT Validation Guide

## Overview

This document provides a step-by-step UAT (User Acceptance Testing) process for validating the import functionality in StackMap. The import process has been unified to always use the preview modal system.

## Test Scenarios

### 1. Basic Import Flow (Happy Path)

**Objective**: Verify standard import process works correctly

**Prerequisites**:
- Have a valid StackMap export file ready (e.g., `stackmap-2025-06-09.json`)

**Steps**:
1. Open StackMap application
2. Click the FAB button (➕) in bottom-right corner
3. Select "Data & Sync" from the FAB menu
4. In the Data Management Panel, click "Import from File" button
5. Select your JSON file from the file picker

**Expected Results**:
- ✅ Import Preview Modal appears
- ✅ Modal shows:
  - Filename at the top
  - File type (e.g., "Single User (Legacy v1.0)" or "Single User")
  - Number of users to import
  - List of users with checkboxes and activity counts
  - Import Selected button
  - Cancel button

**Validation Points**:
- File information is accurate
- User list displays correctly
- All UI elements are functional

### 2. Legacy Format Import (v1.0)

**Objective**: Verify legacy files import correctly

**Test File Structure**:
```json
{
  "version": "1.0",
  "activities": [
    {
      "title": "Morning Routine",
      "description": "Start the day",
      "icon": "🌅",
      "visible": true,
      "completed": false
    }
  ],
  "settings": {
    "title": "My Daily Tasks",
    "backgroundColor": "#667eea"
  }
}
```

**Expected Results**:
- ✅ File type shows as "Single User (Legacy v1.0)"
- ✅ User name taken from settings.title
- ✅ Shows correct activity count
- ✅ After import:
  - User has default icon (👤)
  - Activities preserved with all fields
  - Settings applied correctly

### 3. Modern Format Import

**Objective**: Verify modern export files import correctly

**Test File Structure**:
```json
{
  "version": "1.0",
  "exportType": "single-user",
  "exportDate": "2025-01-10T12:00:00Z",
  "user": {
    "id": "user123",
    "name": "Test User",
    "activities": [...],
    "settings": {...},
    "metadata": {
      "activityCount": 5,
      "lastModified": "2025-01-10T12:00:00Z"
    }
  }
}
```

**Expected Results**:
- ✅ File type shows as "Single User"
- ✅ All user data preserved correctly
- ✅ Metadata ignored (not imported)

### 4. Multi-User Import

**Objective**: Verify family/multi-user imports work correctly

**Test File Structure**:
```json
{
  "version": "1.0",
  "exportType": "multi-user",
  "manifest": {
    "userCount": 3,
    "totalActivities": 10
  },
  "users": {
    "profiles": {
      "user1": {...},
      "user2": {...},
      "user3": {...}
    }
  }
}
```

**Expected Results**:
- ✅ File type shows as "Multi-User Family"
- ✅ User count shows "3"
- ✅ All users listed with checkboxes
- ✅ Can select/deselect users
- ✅ Only selected users import

### 5. Name Conflict Resolution

**Objective**: Verify duplicate names are handled correctly

**Steps**:
1. Note existing user names in your app
2. Import a file with a user that has the same name
3. Check the conflict warning in preview modal

**Expected Results**:
- ✅ Yellow warning box appears
- ✅ Shows "⚠️ Name Conflicts" header
- ✅ Lists conflicting names
- ✅ States users will be renamed with "-imported" suffix
- ✅ After import, conflicting user renamed correctly

### 6. Import Constraints

**Objective**: Verify system limits are respected

**Test Cases**:

**A. User Limit (6 users max)**
- Try importing when you already have 5+ users
- Expected: Import succeeds but only up to 6 total users

**B. Name Length (20 characters max)**
- Import user with exactly 20 character name
- Import user with name that becomes >20 chars after conflict suffix
- Expected: Names truncated or import fails with clear error

**C. Activity Limit (75 activities max per user)**
- Import user with 75+ activities
- Expected: Only first 75 activities imported

### 7. Error Handling

**Objective**: Verify error cases handled gracefully

**Test Cases**:

**A. Invalid JSON**
```
{invalid json content
```
Expected: Alert "Error importing file. Please ensure it's a valid StackMap JSON file."

**B. Wrong File Type**
```json
{
  "someOtherApp": "data"
}
```
Expected: Error message about unrecognized format

**C. Empty File Selection**
- Click Import, then cancel file picker
- Expected: Returns to data panel, no error

### 8. Import Cancellation

**Objective**: Verify import can be cancelled

**Steps**:
1. Start import process
2. When preview modal appears, click Cancel

**Expected Results**:
- ✅ Modal closes
- ✅ No data imported
- ✅ App state unchanged

### 9. Post-Import Validation

**Objective**: Verify imported data is correct

**Steps after any import**:
1. Check user dropdown updated (if new users)
2. Switch to imported user
3. Verify all activities present
4. Check settings applied (background color, etc.)
5. Try exporting the user again

**Expected Results**:
- ✅ All data accessible
- ✅ Activities functional (can complete/uncomplete)
- ✅ Settings applied correctly
- ✅ Re-export contains same data

## Console Monitoring

During testing, open Developer Console (F12) and monitor for:

**Good Signs**:
- `[StackMapApp] Starting import process for file: filename.json`
- `[StackMapApp] Successfully parsed JSON file`
- `[StackMapApp] Detected legacy v1.0 format` (for old files)
- `[State] Import completed successfully`

**Error Signs**:
- Any red error messages
- `[StackMapApp] Error parsing import file`
- `[StackMapApp] Unrecognized file format`

## Regression Testing

After any code changes, verify:

1. **All import paths work**:
   - FAB → Data & Sync → Import
   - All lead to preview modal

2. **All formats supported**:
   - Legacy v1.0
   - Modern single-user
   - Multi-user family

3. **No data loss**:
   - Activities preserve all fields
   - Settings applied correctly
   - Icons handled properly

## Success Criteria

The import feature passes UAT when:

✅ All file formats import successfully
✅ Preview modal always appears before import
✅ User can select what to import (multi-user)
✅ Conflicts detected and resolved
✅ System limits respected
✅ Error messages are user-friendly
✅ No console errors during normal use
✅ Imported data is fully functional

## Known Limitations

1. **Icons not in exports** - Imported users get default icon (👤)
2. **6 user maximum** - Cannot import more than 6 users total
3. **20 character names** - Longer names may cause issues with conflict suffix
4. **No undo** - Once imported, cannot automatically undo

## Tips for QA

- Always test with copies of data files
- Test both small and large files
- Try edge cases (empty activities, missing fields)
- Verify across different browsers
- Check mobile responsiveness of import modal