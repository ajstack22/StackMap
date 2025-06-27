# StackMap Migration Strategy

## Overview
This document outlines how we handle the transition from the old StackMap app to the new version, ensuring existing users don't lose their data.

## Automatic Migration Features

### 1. **Automatic Detection & Migration**
When a user visits the new site, the app automatically:
- Scans localStorage for old format data (version 1.0)
- Creates a backup of the original data
- Converts the data to the new format
- Shows a friendly notification
- Sets a flag to prevent re-migration

### 2. **Data Preservation**
The migration preserves:
- All user profiles and settings
- Activities with proper field mapping:
  - `title` → `text`
  - `icon` → `emoji`
  - `description` → `description`
  - `keep` → `pinned`
- Custom titles and subtitles
- Theme colors and display preferences
- Templates from group library
- Metadata (card numbers, colors, etc.)

### 3. **Avoiding Cache/Data Loss Issues**

#### A. **Service Worker Strategy**
```javascript
// In sw.js
const SW_VERSION = '2.0.0'; // Bump version
const CACHE_NAME = 'stackmap-v2.0.0';

// Clear old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cache => cache.startsWith('stackmap') && cache !== CACHE_NAME)
          .map(cache => caches.delete(cache))
      );
    })
  );
});
```

#### B. **localStorage Safety**
The migration:
- Never deletes data without backing it up first
- Uses unique keys for new format (`stackmap_data_v3`)
- Keeps a permanent backup (`stackmap_backup_pre_migration`)
- Only removes old data after successful migration

#### C. **User Communication**
```javascript
// Automatic notification on migration
showMigrationNotification() {
  // Shows a modal explaining:
  // - Data has been updated
  // - Everything is preserved
  // - No action needed
}
```

## Deployment Checklist

### Pre-Deployment
1. **Test Migration Locally**
   - Create test data in old format
   - Verify migration works correctly
   - Check all fields map properly

2. **Prepare Rollback Plan**
   - Keep old site accessible at legacy URL
   - Document rollback procedure
   - Test rollback process

### During Deployment
1. **Gradual Rollout**
   - Deploy to staging first
   - Test with real user data copies
   - Monitor for issues

2. **Communication**
   - Email users about update (optional)
   - In-app notification for migrated users
   - Support documentation ready

### Post-Deployment
1. **Monitor Migration**
   - Track migration success rate
   - Watch for error reports
   - Be ready to assist users

2. **Support Old App Users**
   - Android app users can export/import
   - Provide clear instructions
   - Keep import functionality indefinitely

## Technical Implementation

### Migration Code Location
- **File**: `/src/stackmap.js`
- **Method**: `loadData()` - Runs on every app load
- **Conversion**: `convertAndImportOldFormat()` - Handles field mapping

### Storage Keys
```javascript
// Old format
'stackMapData' // or similar variations

// New format
'stackmap_data_v3' // Main data
'stackmap_migration_completed' // Migration flag
'stackmap_backup_pre_migration' // Backup
```

### Error Handling
- Invalid data is skipped silently
- Backups ensure data recovery
- Console logs for debugging

## User Experience

### For Web Users
1. Visit new site
2. Data migrates automatically (< 1 second)
3. See friendly notification
4. Continue using app normally

### For App Users
1. Export data from old app
2. Import to new app/site
3. All data preserved

## FAQ

**Q: What if migration fails?**
A: The backup at `stackmap_backup_pre_migration` can be manually imported.

**Q: Can users go back to the old version?**
A: Yes, their original data is preserved in the backup.

**Q: What about users who clear their cache?**
A: Migration only affects localStorage, not cache. Data is safe.

**Q: Will this affect performance?**
A: Migration only runs once and is very fast (milliseconds).

## Emergency Procedures

### If Migration Causes Issues
1. Remove migration code
2. Deploy hotfix
3. Users' original data remains in localStorage
4. Manual migration via import/export

### Data Recovery
```javascript
// In browser console
const backup = localStorage.getItem('stackmap_backup_pre_migration');
if (backup) {
  // Save to file
  const blob = new Blob([backup], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'stackmap-backup.json';
  a.click();
}
```

## Success Metrics
- Migration success rate > 99%
- User complaints < 1%
- No data loss reports
- Smooth transition for 90%+ of users