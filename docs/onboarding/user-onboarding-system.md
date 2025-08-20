# StackMap Onboarding System Documentation

## Overview
The StackMap onboarding system provides a flexible, multi-path wizard that guides new users through initial setup while supporting various entry points including fresh starts, data restoration, and sync connections.

## Component Location
**Main Component:** `src/components/Onboarding/OnboardingNew.js`

## Entry Points & Flows

### 1. Fresh Start (New Users)
**Path:** Welcome → Create User → Features → Setup PIN → Complete

**Process:**
1. User selects "Start Fresh" from welcome screen
2. Creates first user with name and emoji
3. Views feature carousel explaining app capabilities
4. Optional PIN setup for edit mode protection
5. Completion with user data saved to local state

### 2. Restore StackMap (Import)
**Path:** Welcome → Import → Features → Complete

**Process:**
1. User selects "Restore StackMap" from welcome screen
2. Triggers file picker for JSON data import
3. Data validated and imported to local state
4. Shows success banner with import summary
5. Continues to features then completion

### 3. Sync StackMap (Join/Create)
**Path:** Welcome → Sync → Features → Complete

**Modes:**
- **Join Existing Sync:** Enter recovery phrase to connect to existing sync group
- **Create New Sync (Web Only):** Generate new recovery phrase and QR code for mobile devices

### 4. Abbreviated Flow (Direct Sync URL)
**Path:** Welcome → Sync Preview → Features → Complete

**Triggered by:** URL parameter `?sync=recovery_phrase`
**Process:**
1. Auto-fetches sync data preview
2. Shows users and data summary
3. User confirms to join sync group
4. Data restored and sync enabled
5. Continues to completion

## Sync Implementation Details

### Create New Sync (Web Only)
```javascript
// Generate new recovery phrase
const recoveryPhrase = encryptionService.generateRecoveryPhrase();

// Generate sync ID (first 16 bytes of derived key)
const syncId = await syncService.generateSyncId(recoveryPhrase);

// Create QR code data
const qrData = `stackmap://sync/${recoveryPhrase}`;
```

**Display Elements:**
- QR code for mobile scanning
- Recovery phrase in monospace font
- Copy button for manual entry
- Step-by-step instructions
- Support StackMap donation link

### Join Existing Sync
```javascript
// User enters recovery phrase
const syncId = await syncService.generateSyncId(recoveryPhrase);

// Try to pull existing data
const existingData = await syncService.pullData();

if (existingData) {
  // Decrypt and restore data
  const decryptedData = encryptionService.decryptData(existingData.encrypted_blob);
  await syncService.restoreData(decryptedData);
} else {
  // Create new sync group with current device data
  await syncService.createSyncGroup(syncId, salt);
}
```

### Sync Preview (URL-based)
When accessing StackMap with `?sync=recovery_phrase`:

1. **Auto-fetch Preview:**
   - Attempts to decrypt sync data
   - Extracts user count and activity statistics
   - Shows preview panel with data summary

2. **User Confirmation:**
   - Warning about replacing local data
   - "Join Sync Group" or "Skip" options
   - Auto-enables sync on confirmation

## Data Structure & Validation

### User Creation
```javascript
{
  name: "User Name",
  emoji: "😊", // or custom emoji/icon
  id: generated_uuid
}
```

### Sync Data Structure
```javascript
{
  version: 3,
  users: {
    "user_id": {
      name: "User Name",
      icon: "😊", // Required: auto-repaired if missing
      days: { /* activity data */ }
    }
  },
  currentDay: "today",
  globalSettings: { /* theme, preferences */ },
  activityLibrary: { /* templates */ },
  activityCategories: { /* categories */ },
  hasCompletedOnboarding: true,
  lastModified: timestamp
}
```

### Data Validation & Repair
- Users without icon/emoji are auto-repaired with default "😀"
- Missing users object creates default user
- Validation runs before sync push and after pull

## UI Components & States

### Screen States
- `welcome` - Initial landing screen
- `createUser` - User creation form
- `features` - Feature carousel
- `sync` - Sync setup (join/create)
- `syncSetup` - Abbreviated sync setup
- `syncPreview` - Sync data preview
- `setupPin` - PIN configuration
- `complete` - Success screen

### Feature Carousel
Auto-rotating display (4 seconds per feature):
1. **Preferences** - Theme and display settings
2. **User Check-In** - User switching and daily tracking
3. **Edit Mode** - Activity management and planning

### Loading States
- Sync operations show ActivityIndicator
- Error messages display with retry options
- Toast notifications for copy actions

## Platform-Specific Behavior

### iOS
- Uses native Alert.alert for confirmations
- Larger touch targets for tablets
- Safe area insets applied

### Android
- Material Design shadows (elevation)
- Lower border radius values
- StatusBar explicitly managed

### Web
- "Create New Sync" option available
- Responsive layout for desktop
- Clipboard API for copy functionality

## Error Handling

### Sync Errors
- **404 Not Found:** "No sync group found with this sync key"
- **Network Error:** "Network error. Please check your connection"
- **Invalid Key:** "Invalid recovery phrase. Please check and try again"
- **Decryption Failed:** Wrong recovery phrase for existing sync

### Import Errors
- Invalid JSON format
- Missing required fields
- Version incompatibility

## Security Features

### PIN Protection
- 4-digit numeric PIN
- Stored securely using device keychain/keystore
- Protects edit mode access
- Optional during onboarding

### Zero-Knowledge Sync
- PBKDF2 key derivation (100,000 iterations)
- TweetNaCl encryption
- Fixed salt for consistency: `U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=`
- Recovery phrase never sent to server

## Storage & Persistence

### AsyncStorage Keys
- `@sync_enabled` - Boolean sync state
- `@sync_id` - Current sync identifier
- `@sync_last_version` - Last sync version
- `@recovery_phrase_[syncId]` - Encrypted recovery phrase

### State Management
- Zustand store for app state
- Debounced persistence (1 second delay)
- Change tracking for incremental sync

## Testing Considerations

### Test Scenarios
1. **Fresh Start:** Create multiple users, set PIN
2. **Import:** Valid/invalid JSON files
3. **Sync Join:** Valid/invalid recovery phrases
4. **Sync Create:** Generate and verify QR code
5. **URL Sync:** Test with `?sync=` parameter
6. **Network Failures:** Offline/timeout handling
7. **Platform Differences:** iOS/Android/Web specific features

### Edge Cases
- Empty sync groups
- Corrupted sync data
- Missing user icons
- Duplicate user names
- Very long user names/emojis
- Network interruptions during sync
- Multiple rapid navigation attempts

## Best Practices

### Performance
- Debounced storage writes prevent UI freezes
- Lazy loading of encryption service
- Minimal re-renders during transitions
- Efficient animation using native driver

### Accessibility
- High contrast text (#000 on light backgrounds)
- Large touch targets (minimum 44px)
- Clear error messages
- Screen reader compatible

### User Experience
- Progressive disclosure of features
- Optional PIN setup
- Auto-recovery from errors
- Clear sync status indicators
- Preview before destructive operations

## Common Issues & Solutions

### Issue: UI Freeze on Sync Join
**Solution:** Implemented 1-second debounce on AsyncStorage writes

### Issue: Missing User Icons
**Solution:** Auto-repair with default emoji during sync

### Issue: Sync Preview Not Loading
**Solution:** Check network, verify recovery phrase format (32 hex chars)

### Issue: PIN Not Saving
**Solution:** Verify secure storage permissions on device

## Future Enhancements
- Biometric authentication option
- Multiple sync group support
- Selective data sync
- Sync conflict preview
- Onboarding progress persistence
- Skip onboarding for returning users