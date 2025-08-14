# Import/Export QA Testing Guide

## Overview

This guide provides step-by-step instructions for testing the import/export functionality in StackMap, including support for legacy v1.0 files and modern multi-user formats.

## Prerequisites

- Access to StackMap application
- Sample import files (provided below)
- Chrome or Firefox browser with Developer Console

## Test Scenarios

### 1. Export Single User

**Objective**: Verify single user data can be exported

**Steps**:
1. **Enter Edit Mode**
   - Click on any activity card
   - Click "Grown-ups click here" link at bottom
   - Enter validation answer (or use backdoor code 'A')

2. **Open Data Management**
   - Click the floating action button (➕) in bottom-right
   - Wait for FAB menu to expand (~300ms)
   - Click "Data & Sync" option
   - Wait for panel to slide up (~500ms)

3. **Export Current User**
   - Click "Export Current User" button
   - Verify file downloads with format: `stackmap-[username]-YYYY-MM-DD.json`
   - Note the filename for later import testing

4. **Close and Exit**
   - Click X button on data panel
   - Click "Exit Edit Mode" button

**Expected Results**:
- File downloads successfully
- Filename contains current user name and date
- File is valid JSON when opened

### 2. Import Legacy v1.0 Format

**Objective**: Verify legacy files import correctly through new preview system

**Test File** (save as `legacy-test-v1.json`):
```json
{
  "version": "1.0",
  "activities": [
    {
      "title": "Morning Routine",
      "description": "Start the day right",
      "icon": "🌅",
      "visible": true,
      "completed": false,
      "cardType": "recurring",
      "createdDate": "2025-01-01",
      "time": ""
    }
  ],
  "settings": {
    "title": "Legacy User Test",
    "subtitle": "Testing Import",
    "backgroundColor": "#ff6b6b",
    "showCompletionIndicators": true
  }
}
```

**Steps**:
1. **Enter Edit Mode** (same as above)

2. **Open Import Dialog**
   - Click FAB button (➕)
   - Click "Data & Sync"
   - Click "Import from File" button

3. **Select File**
   - Choose the `legacy-test-v1.json` file
   - File picker closes automatically

4. **Review Import Preview**
   - **Verify Modal Shows**:
     - Filename: "legacy-test-v1.json"
     - File Type: "Single User (Legacy v1.0)"
     - User Count: "1"
     - User List shows: "Legacy User Test (1 activities)"
   - Screenshot this screen for documentation

5. **Confirm Import**
   - Click "Import Selected" button
   - Wait for success alert
   - Click OK on alert

6. **Verify Import Success**
   - User dropdown should now include "Legacy User Test"
   - Switch to the imported user
   - Verify "Morning Routine" activity is visible
   - Verify background color changed to red (#ff6b6b)

**Console Checks** (F12 > Console):
- Look for: `[StackMapApp] Detected legacy v1.0 format`
- Look for: `[State] Legacy import successful, created user: Legacy User Test`
- No error messages should appear

### 3. Import with Name Conflicts

**Objective**: Verify conflict resolution when importing duplicate names

**Steps**:
1. **Create Existing User**
   - In edit mode, add new user named "Test User"
   
2. **Create Conflict File** (`conflict-test.json`):
```json
{
  "version": "2.0",
  "exportType": "single-user",
  "user": {
    "name": "Test User",
    "activities": [],
    "settings": {}
  }
}
```

3. **Import File**
   - Follow import steps above
   - **Verify Conflict Warning**:
     - Yellow warning box appears
     - Shows: "⚠️ Name Conflicts"
     - Lists: '"Test User" already exists'
     - Message: "Existing users with same names will be renamed with "-imported" suffix"

4. **Confirm Import**
   - Click "Import Selected"
   - Verify success

5. **Check Resolution**
   - User dropdown should show:
     - "Test User" (original)
     - "Test User-imported" (new)

### 4. Import Cancellation

**Objective**: Verify import can be cancelled without changes

**Steps**:
1. Count existing users
2. Start import process with any test file
3. When preview modal appears, click "Cancel" button
4. Verify:
   - Modal closes
   - No new users added
   - No data changed

### 5. Multi-User Import

**Test File** (`family-export.json`):
```json
{
  "version": "2.0",
  "exportType": "multi-user",
  "exportDate": "2025-01-10T12:00:00Z",
  "manifest": {
    "userCount": 2,
    "totalActivities": 5
  },
  "users": {
    "profiles": {
      "user1": {
        "id": "user1",
        "name": "Child 1",
        "icon": "👦",
        "activities": [
          {"title": "Brush Teeth", "icon": "🦷", "visible": true}
        ],
        "tomorrowActivities": [],
        "settings": {}
      },
      "user2": {
        "id": "user2", 
        "name": "Child 2",
        "icon": "👧",
        "activities": [
          {"title": "Get Dressed", "icon": "👕", "visible": true}
        ],
        "tomorrowActivities": [],
        "settings": {}
      }
    }
  }
}
```

**Steps**:
1. Import the family file
2. **Verify Preview**:
   - Type: "Multi-User Family"
   - User Count: "2"
   - Both users listed with checkboxes
3. **Selective Import**:
   - Uncheck one user
   - Click "Import Selected"
   - Verify only checked user imported

## Error Scenarios

### 1. Invalid JSON File

Create `invalid.json`:
```
{invalid json content
```

**Expected**: Alert "Error importing file. Please ensure it's a valid StackMap JSON file."

### 2. Wrong File Format

Create `wrong-format.json`:
```json
{
  "someOtherData": "not a stackmap file"
}
```

**Expected**: Error in preview: "Unrecognized file format"

### 3. Empty File Selection

1. Click "Import from File"
2. Cancel file picker without selecting

**Expected**: No error, returns to data panel

## Automated Testing

Run automated tests:
```bash
# Browser-based
open tests/test-runner.html
# Select "Import/Export Tests" from dropdown
# Click "Run Tests"

# Command line
npm test -- --suite=import-export
```

## Success Criteria

✅ All legacy v1.0 files import successfully  
✅ Import preview modal appears for all imports  
✅ Name conflicts are detected and resolved  
✅ Selective import works for multi-user files  
✅ Cancel button prevents any changes  
✅ Console shows no errors during normal operation  
✅ Appropriate error messages for invalid files  

## Troubleshooting

### Modal Doesn't Appear
- Check console for errors
- Verify `importPreviewModal` exists in DOM
- Try hard refresh (Ctrl+Shift+R)

### Import Seems to Do Nothing
- Open Developer Console (F12)
- Look for error messages
- Check if import went through without preview (fallback mode)

### Legacy Import Creates Wrong User Name
- Check if `currentUser` field exists in the export
- For legacy files, verify the `globalSettings` fields
- Default should be "My Activities" if missing

## Regression Testing

After any code changes, verify:
1. Legacy imports still work
2. Modern imports still work
3. Export format hasn't changed
4. No console errors during import/export
5. Preview modal displays correctly

## Contact

For issues or questions:
- File bug report with console logs
- Include test file that failed
- Screenshot of any error states