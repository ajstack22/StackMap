# User Story: Detailed Sync Status Indicators

## Overview
Replace the generic spinning loader with detailed, informative sync status messages that help users understand what's happening during sync operations.

## User Story
**As a** StackMap user  
**I want** to see detailed status messages during sync operations  
**So that** I understand what's happening and know the sync is progressing, not stuck

## Current Behavior
- Single spinning loader icon
- Console error messages appear in UI (confusing)
- No indication of progress through sync stages
- 404 errors show briefly before sync creates new group (appears broken)

## Desired Behavior

### Status Messages to Display
1. **Connecting** - "Connecting to sync server..."
2. **Checking** - "Checking for existing sync..."  
3. **Creating** - "Creating new sync group..."
4. **Joining** - "Joining sync group..."
5. **Encrypting** - "Encrypting your data..."
6. **Uploading** - "Uploading encrypted data..."
7. **Downloading** - "Downloading sync data..."
8. **Decrypting** - "Decrypting your data..."
9. **Merging** - "Merging changes..."
10. **Complete** - "Sync complete!" (brief success message)
11. **Error** - Clear, user-friendly error messages

### Implementation Details

#### 1. Add sync status state to DataModal and OnboardingUserCentered
```javascript
const [syncStatus, setSyncStatus] = useState({
  stage: 'idle', // idle | connecting | checking | creating | joining | encrypting | uploading | downloading | decrypting | merging | complete | error
  message: '',
  progress: null // optional percentage for operations that support it
});
```

#### 2. Pass status callback to sync operations
```javascript
// In syncStoreIntegration.js
async joinSync(recoveryPhrase, onStatusUpdate) {
  onStatusUpdate?.({ stage: 'connecting', message: 'Connecting to sync server...' });
  
  onStatusUpdate?.({ stage: 'checking', message: 'Checking for existing sync...' });
  const result = await minimalSync.joinSync(recoveryPhrase);
  
  if (!result.success && is404) {
    onStatusUpdate?.({ stage: 'creating', message: 'Creating new sync group...' });
    // Create new sync...
  } else if (result.success) {
    onStatusUpdate?.({ stage: 'downloading', message: 'Downloading sync data...' });
    // Process data...
    
    onStatusUpdate?.({ stage: 'decrypting', message: 'Decrypting your data...' });
    // Decrypt...
    
    onStatusUpdate?.({ stage: 'merging', message: 'Merging changes...' });
    // Merge...
  }
  
  onStatusUpdate?.({ stage: 'complete', message: 'Sync complete!' });
}
```

#### 3. Update UI components
```javascript
// In DataModal sync section
{syncLoading && syncStatus.stage !== 'idle' && (
  <View style={styles.syncStatusContainer}>
    <ActivityIndicator size="small" color={theme.colors.primary} />
    <Text style={styles.syncStatusText}>{syncStatus.message}</Text>
    {syncStatus.progress && (
      <ProgressBar progress={syncStatus.progress} />
    )}
  </View>
)}
```

#### 4. Handle error states gracefully
- Don't show 404 as error when creating new sync
- Convert technical errors to user-friendly messages
- Provide actionable next steps when possible

### Success Criteria
1. Users see clear status messages during each sync stage
2. No console errors appear in the UI
3. 404 when creating new sync is handled transparently
4. Status messages are brief and understandable
5. Errors provide helpful guidance

### Technical Considerations
- Status updates should be throttled to avoid UI flicker
- Consider adding subtle animations between status changes
- Ensure status messages work across all platforms (iOS, Android, Web)
- Status should reset properly between sync attempts

### Future Enhancements
- Add progress bars for large data uploads/downloads
- Show data size being synced
- Add time estimates for longer operations
- Option to view detailed sync log for debugging