# Import/Export System Documentation

## Overview

The StackMap import/export system provides comprehensive data backup, sharing, and migration capabilities. It supports both legacy v1.0 format and modern multi-user formats with preview functionality.

## Export Functionality

### Export Types

1. **Single User Export**
   - Exports current user's data only
   - Filename format: `stackmap-[username]-YYYY-MM-DD.json`
   - Includes activities, settings, and library

2. **Multi-User Export** 
   - Exports all users and shared data
   - Filename format: `stackmap-export-YYYY-MM-DD-HH-MM-SS.json`
   - Includes global settings and shared libraries

### Export Data Structure

```javascript
// Modern export format
{
  "version": "2.0",
  "exportType": "single-user" | "multi-user",
  "exportDate": "2025-01-10T12:00:00Z",
  "manifest": {
    "userCount": 1,
    "totalActivities": 15
  },
  "user": { /* single user data */ },        // single-user only
  "users": { /* multi-user data */ },        // multi-user only
  "globalSettings": { /* app settings */ },
  "activityLibrary": { /* shared library */ }
}
```

## Import Functionality

### Import Preview System

All imports now show a preview modal before applying changes:

**Preview Information:**
- File name and type detection
- User count and activity statistics
- List of users being imported
- Name conflict warnings
- Selective import options

### Supported Formats

1. **Legacy v1.0 Format**
   ```javascript
   {
     "version": "1.0",
     "activities": [ /* activities array */ ],
     "settings": {
       "title": "User Name",
       "backgroundColor": "#color"
     }
   }
   ```

2. **Modern Single-User Format**
   ```javascript
   {
     "version": "2.0",
     "exportType": "single-user",
     "user": { /* user data */ }
   }
   ```

3. **Modern Multi-User Format**
   ```javascript
   {
     "version": "2.0", 
     "exportType": "multi-user",
     "users": { /* multiple users */ }
   }
   ```

## Implementation Details

### Access Points

**From Edit Mode:**
1. Enter edit mode via "Grown-ups click here"
2. Tap FAB (➕) button
3. Select "Data & Sync"
4. Choose import or export option

### Import Process

1. **File Selection**: Native file picker
2. **Format Detection**: Automatic format recognition
3. **Preview Display**: Modal with import details
4. **Conflict Resolution**: Name conflicts handled automatically
5. **Selective Import**: Choose which users to import
6. **Data Validation**: Ensures data integrity
7. **Import Execution**: Updates app state

### Export Process

1. **Data Collection**: Gather current app state
2. **Format Conversion**: Convert to export format
3. **File Generation**: Create JSON file
4. **Download Trigger**: Platform-specific download

## Conflict Resolution

### Name Conflicts
When importing users with existing names:
- Conflicting names get "-imported" suffix
- Warning displayed in preview
- Original users remain unchanged

### Data Merging
- Activities: Merged with new IDs
- Settings: Imported user settings preserved
- Libraries: Combined with existing libraries

## Error Handling

### File Validation
- **Invalid JSON**: "Error importing file. Please ensure it's a valid StackMap JSON file."
- **Unrecognized Format**: "Unrecognized file format" in preview
- **Corrupted Data**: Graceful fallback with partial import

### Network Issues
- Import/export works offline
- No server dependencies
- All processing client-side

## Platform Differences

### Web
- Uses browser download API
- Supports drag-and-drop import
- Advanced export options
- Full file management

### iOS
- Uses document picker
- Saves to Files app
- Share sheet integration
- Native file handling

### Android
- Uses storage access framework
- Saves to Downloads folder
- Share intent support
- Permission handling

## Quality Assurance

### Test Scenarios

1. **Legacy Import**
   - v1.0 format files
   - Missing fields handling
   - Settings migration

2. **Modern Import**
   - Single and multi-user formats
   - Selective import
   - Conflict resolution

3. **Export Verification**
   - Round-trip testing
   - Data integrity checks
   - Format validation

4. **Error Conditions**
   - Invalid files
   - Network failures
   - Permission denials

### Automated Testing
- Format validation tests
- Round-trip data integrity
- Error condition handling
- Cross-platform compatibility

## Security Considerations

### Data Privacy
- All processing client-side
- No server uploads
- Encryption for sensitive data
- User control over data sharing

### File Security
- No executable code in exports
- JSON format only
- Input validation
- Sanitization of user data

## Future Enhancements

1. **Partial Exports**
   - Export specific date ranges
   - Export individual users
   - Export selected activities

2. **Import Scheduling**
   - Scheduled imports
   - Automatic backups
   - Cloud storage integration

3. **Format Extensions**
   - CSV export for analysis
   - Image exports for sharing
   - Calendar integration

4. **Enhanced Preview**
   - Activity thumbnails
   - Completion statistics
   - Conflict preview

## Related Documentation

- [Import/Export QA Guide](../testing/import-export-qa-guide.md)
- [Data Structure Documentation](../DATA_STRUCTURE.md)
- [Field Conventions](./field-conventions.md)