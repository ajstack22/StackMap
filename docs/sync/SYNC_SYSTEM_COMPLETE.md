# StackMap Sync System Documentation v2025.08

## 1. Architecture

### Core Components
```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React Native)              │
├─────────────────────────────────────────────────────────┤
│  syncStoreIntegration.js  - Zustand store bridge        │
│  minimalSyncService.js    - Core sync engine            │
│  encryptionService.ts     - TweetNaCl encryption        │
│  conflictResolver.js      - Field-level merge logic     │
└─────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────┐
│                    Backend (PHP/MySQL)                   │
├─────────────────────────────────────────────────────────┤
│  create_timestamp.php  - New sync group creation        │
│  join_timestamp.php    - Join existing sync             │
│  push_timestamp.php    - Store encrypted data           │
│  pull_timestamp.php    - Retrieve data since timestamp  │
└─────────────────────────────────────────────────────────┘
```

### Key Principles
- **Zero-knowledge**: Server never sees unencrypted data
- **Last-write-wins**: With field-level timestamp resolution
- **Immediate push**: Changes sync instantly (no 5s delay)
- **Smart pull**: 1-second debounced pull after changes

## 2. Design

### Sync Strategy
- **Initial sync**: Full data replacement (`forceFullPull=true`)
- **Incremental sync**: Field-level timestamp comparison
- **Conflict resolution**: 3-second window for field changes
- **Deletion handling**: Newer field timestamp wins entirely

### Data Flow
```
User Action → Store Update → fieldTimestamp update → Push to server
                                                    ↓
Other devices ← Pull from server ← 1s debounced pull trigger
```

## 3. UX

### User Touchpoints
1. **Onboarding**: "Join existing sync" option
2. **Data Modal**: Create/Join/Manage sync
3. **URL Parameter**: `?sync=<recovery-phrase>`
4. **Auto-sync**: On app load if previously configured

### Recovery Phrase
- 32 character hexadecimal string
- Generated client-side only
- Used to derive encryption key and sync ID
- Must be shared manually between devices

### Visual States & User Flows

#### DataModal Sync Tab Flow
```
No Sync:
┌─────────────────────────┐
│  [Create new sync]      │ → Shows recovery phrase → Copy & close
│  [Join existing sync]   │ → Input dialog → Enter phrase → Import
└─────────────────────────┘

Active Sync:
┌─────────────────────────┐
│  Recovery phrase:       │
│  [abc123...] [Copy]     │
│                         │
│  [Manual sync] [Disable]│
└─────────────────────────┘
```

#### Onboarding Import Flow
```
Step 3: How to start?
┌─────────────────────────┐
│  ○ Start fresh          │
│  ○ Import from file     │
│  ○ Join existing sync   │ → Recovery phrase input
│                         │   ↓
│  [Continue]             │   Validate & pull data
└─────────────────────────┘   ↓
                              Preview imported data
                              ↓
                              Complete onboarding
```

### Error Handling
- **Invalid phrase**: "Invalid recovery phrase format (must be 32 hex characters)"
- **Network error**: "Failed to connect to sync server"
- **Empty sync**: "No data available in sync group"
- **Decryption failure**: "Failed to decrypt sync data - check recovery phrase"

## 4. Methodologies

### Encryption
```javascript
// TweetNaCl with 100,000 iterations
const salt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ='; // Fixed base64
const key = pbkdf2(recoveryPhrase, salt, 100000);
const encrypted = nacl.secretbox(data, nonce, key);
```

### Sync ID Generation
```javascript
// First 16 bytes of hash
const syncId = pbkdf2(recoveryPhrase, salt, 100000).slice(0, 32);
```

## 5. Touchpoints

### App Entry Points
- `App.js` → `syncStoreIntegration.initialize()` on mount
- `OnboardingUserCentered.js` → `handleImportFromSync()`
- `DataModal.js` → Create/Join sync buttons
- URL params → `?sync=phrase` auto-import

### URL Parameter Handling
Located in `App.js`:

```javascript
// URL parameter detection on mount
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const syncPhrase = urlParams.get('sync');
  
  if (syncPhrase && syncPhrase.length === 32 && /^[a-f0-9]+$/.test(syncPhrase)) {
    handleSyncFromURL(syncPhrase);
  }
}, []);

// Auto-join sync flow
const handleSyncFromURL = async (recoveryPhrase) => {
  try {
    // 1. Join the sync
    const result = await syncService.joinSync(recoveryPhrase);
    
    // 2. If successful, clear URL parameter
    if (result.success) {
      window.history.replaceState({}, '', window.location.pathname);
      
      // 3. Show success message
      Alert.alert('Sync Joined', 'Your data has been synced successfully');
    }
  } catch (error) {
    Alert.alert('Sync Failed', error.message);
  }
};
```

**URL Format:**
- `https://stackmap.app/?sync=abc123def456...` (32 hex chars)
- Auto-validates format before attempting join
- Clears parameter after successful join
- Shows error if join fails

### Store Subscriptions
```javascript
useUserStore.subscribe(() => {
  fieldTimestamps.users = Date.now();
  handleStoreChange('users');
});
```

## 6. Components

### Frontend Services
- `/src/services/sync/syncStoreIntegration.js` - Main integration
- `/src/services/sync/minimalSyncService.js` - Core sync logic
- `/src/services/sync/encryptionService.ts` - Crypto operations
- `/src/services/sync/conflictResolver.js` - Merge logic

### UI Components

#### DataModal (`/src/components/Modals/DataModal/DataModal.js`)
Primary sync management interface with three tabs:

**Sync Tab States:**
1. **No Sync State**: Shows "Create new sync" and "Join existing sync" buttons
2. **Active Sync State**: Shows recovery phrase, manual sync button, disable option
3. **Loading State**: During sync operations

**Key Methods:**
```javascript
handleCreateSync() // Creates new sync group
handleJoinSync() // Opens join dialog
handleConfirmJoinSync(phrase) // Joins with recovery phrase
handleManualSync() // Forces immediate sync
handleDisableSync() // Disables and clears sync
```

**Import/Export Tab:**
- File import (JSON)
- File export with field selection
- Merge vs Replace options for import

**Reset Tab:**
- Clear all data option
- Reset app confirmation

#### Onboarding (`/src/components/Onboarding/OnboardingUserCentered.js`)
New user flow with sync integration:

**Sync-Related Screens:**
1. **Import Options Screen** (Step 3):
   - "Start fresh" - No sync
   - "Import from file" - JSON import
   - "Join existing sync" - Recovery phrase entry

2. **Join Sync Flow:**
```javascript
handleImportFromSync(recoveryPhrase) {
  // 1. Validates 32-char hex phrase
  // 2. Derives sync ID from phrase
  // 3. Initializes encryption
  // 4. Calls pullData(true) for full import
  // 5. Shows preview of imported data
  // 6. User confirms to complete onboarding
}
```

**Key States:**
```javascript
importMethod: 'fresh' | 'file' | 'sync'
importData: null | { users, library, settings }
syncRecoveryPhrase: string
isImporting: boolean
importError: string | null
```

#### SyncDiagnostic (`/src/components/SyncDiagnostic.js`)
Hidden diagnostic tool for testing sync:

**Access:** Onboarding screen → "Sync Testing" button (dev only)

**Features:**
- Browser A/B testing workflow
- Demo data loader
- Direct sync function testing
- Detailed console logging

### Backend Files
- `/api/sync/create_timestamp.php` - Create sync group
- `/api/sync/join_timestamp.php` - Join existing sync
- `/api/sync/push_timestamp.php` - Store data
- `/api/sync/pull_timestamp.php` - Retrieve data

## 7. Methods

### Key Functions
```javascript
// syncStoreIntegration.js
async create() // Create new sync with current data
async joinSync(recoveryPhrase) // Join existing sync
async pullData(forceFullPull) // Pull data (force=true for initial)
handleStoreChange(field) // Triggered on store updates

// minimalSyncService.js
async createSync(testData) // Create with initial data
async joinSync(recoveryPhrase) // Join and pull initial data
async pushData(newData) // Push encrypted to server
async pullData(forceFullPull) // Pull and decrypt
```

## 8. Data Flows

### Create Sync Flow
```
1. User clicks "Create Sync" in DataModal
2. syncStoreIntegration.create() called
3. Generates recovery phrase
4. Derives sync ID from phrase
5. Encrypts current state
6. POST to create_timestamp.php
7. Returns recovery phrase to user
```

### Join Sync Flow
```
1. User enters recovery phrase
2. syncStoreIntegration.joinSync(phrase)
3. Derives sync ID from phrase
4. Initializes encryption
5. pullData(forceFullPull=true)
6. GET from pull_timestamp.php?since=0
7. Decrypts and replaces all local data
```

### Incremental Sync Flow
```
1. Store change detected
2. fieldTimestamp updated
3. Immediate push to server
4. 1-second debounced pull
5. Compare field timestamps
6. If >3s difference, take newer
7. Otherwise merge additively
```

## 9. Data Structure

### Sync Payload
```javascript
{
  users: { [userId]: User },
  library: { categories: [], activities: [] },
  settings: { theme, banner, etc },
  metadata: {
    lastModified: timestamp,
    deviceId: "32-char-hex",
    fieldTimestamps: {
      users: timestamp,
      settings: timestamp,
      library: timestamp
    }
  }
}
```

### Server Record
```sql
sync_records (
  id, sync_id, device_id, 
  client_timestamp, server_timestamp,
  encrypted_blob
)
```

## 10. API Definitions

### POST /api/sync/create_timestamp.php
```javascript
Request: {
  sync_id: "32-char-hex",
  device_id: "32-char-hex",
  encrypted_blob: "base64-encrypted-data",
  timestamp: milliseconds
}
Response: {
  success: true,
  sync_id: "...",
  record_id: 123
}
```

### GET /api/sync/pull_timestamp.php
```javascript
Request: ?sync_id=xxx&device_id=xxx&since=0
Response: {
  success: true,
  records: [{
    id: 123,
    device_id: "xxx",
    timestamp: ms,
    encrypted_blob: "base64"
  }]
}
```

## 11. Troubleshooting

### Common Issues

**"No data available in sync group"**
- Check if recovery phrase stored: `AsyncStorage.getItem('@sync_phrase')`
- Verify encryption initialized: `minimalSync.encryptionReady`
- Force pull from 0: `pullData(true)`

**Card deletions not syncing**
- Verify field timestamp difference >3 seconds
- Check if push happened immediately after deletion
- Ensure other device pulled within 3-second window

**Sync lost on refresh**
- Check `@minimal_sync_id` in AsyncStorage
- Verify recovery phrase persisted
- Ensure `loadExistingSyncId()` called on init

**Simultaneous edits conflict**
- Normal if within 3-second window
- Last device to push wins for that field
- Increase field timestamp window if needed

### Debug Commands (Dev only)
```javascript
window.syncStatus() // Check current sync state
window.testTimestamp() // Test timestamp sync
localStorage.getItem('@minimal_sync_id') // Check stored ID
```

## 12. FAQ

**Q: Why do deleted cards reappear?**
A: The merge is additive within 3-second window. Device that deletes must have >3s newer timestamp.

**Q: How often does sync happen?**
A: Push immediately on change, pull 1s after, periodic pull every 30s.

**Q: What if devices have different times?**
A: Uses client timestamps, so clock differences matter. Consider NTP sync for production.

**Q: Can I sync selectively?**
A: No, it's all-or-nothing. Full state syncs each time.

**Q: Is the server secure?**
A: Zero-knowledge design. Server only sees encrypted blobs and sync IDs.

**Q: What's the max sync group size?**
A: No hard limit, but performance degrades with many simultaneous editors.

**Q: Can I change the recovery phrase?**
A: No, it derives the encryption key. New phrase = new sync group.

**Q: How do I disable sync?**
A: DataModal → "Disable Sync" or clear AsyncStorage keys.

---

### Quick Start for New Developers

1. **Test locally**: Use SyncDiagnostic component (hidden in onboarding)
2. **Deploy**: `./scripts/qual_deploy.sh --web` for staging
3. **Monitor**: Watch browser console for `[Sync]` and `[SyncStore]` logs
4. **Debug**: Check AsyncStorage for `@minimal_sync_id` and `@sync_phrase`

### Critical Files to Understand
1. `syncStoreIntegration.js` - Start here, bridges stores to sync
2. `minimalSyncService.js` - Core sync engine
3. `conflictResolver.js` - Merge logic
4. `pull_timestamp.php` - Server retrieval logic

### Implementation Timeline
- **August 2025**: Phase 5 - Production sync with conflict resolution
- **Key fixes applied**:
  - Initial sync uses `forceFullPull=true` to bypass timestamps
  - Field-level timestamps with 3-second resolution window
  - Immediate push on change (removed 5-second delay)
  - Sync persistence across app refreshes
  - Encryption re-initialization on app load

## Component Interfaces

### DataModal Props & State
```javascript
// Props
{
  isVisible: boolean,
  onClose: () => void,
  currentTheme: string
}

// Internal State
{
  activeTab: 'sync' | 'import' | 'reset',
  loading: boolean,
  syncEnabled: boolean,
  syncRecoveryPhrase: string | null,
  showJoinDialog: boolean,
  joinPhrase: string,
  showRecoveryPhrase: boolean,
  copiedPhrase: boolean,
  // Import/Export states
  importData: object | null,
  importMode: 'merge' | 'replace',
  exportSelections: { users: boolean, activityCards: boolean, activityLibrary: boolean }
}
```

### Onboarding Sync Integration
```javascript
// Key Props for sync steps
{
  importMethod: 'fresh' | 'file' | 'sync',
  importData: null | object,
  syncRecoveryPhrase: string,
  isImporting: boolean,
  importError: string | null
}

// Methods
handleImportFromSync(recoveryPhrase: string): Promise<void>
validateRecoveryPhrase(phrase: string): boolean
previewImportedData(data: object): void
confirmImport(): void
```

### Store Integration Hooks
```javascript
// In any component needing sync status
import syncService from 'services/sync';

// Check sync status
const checkSync = async () => {
  const enabled = await syncService.isEnabled();
  const status = await syncService.getStatus();
};

// Manual sync trigger
const triggerSync = async () => {
  await syncService.performManualSync();
};
```

## Sharing Mechanisms

### 1. Sync Sharing (Primary Method)
Share entire app state via recovery phrase URL:

```javascript
// Generate shareable sync URL
const generateSyncShareURL = (recoveryPhrase) => {
  const baseURL = 'https://stackmap.app/';
  return `${baseURL}?sync=${recoveryPhrase}`;
};

// Share flow in DataModal
1. User creates sync → Gets recovery phrase
2. Copy recovery phrase or share URL
3. Recipient opens URL → Auto-joins sync
4. All devices stay in sync continuously
```

**URL Format:** `https://stackmap.app/?sync=abc123...` (32 hex chars)

### 2. Activity Sharing (Legacy/Limited)
Share specific user activities (read-only snapshot):

```javascript
// DataModal Share Tab
handleCreateShare() {
  // Creates temporary share link for activities
  // Includes: selected user, date range, options
  // Returns: shareable URL + QR code
}
```

**Features:**
- User selection dropdown
- Include completed/tomorrow toggles
- Auto-update option
- Expiration time (default 1 week)
- QR code generation
- Active shares management

**Note:** This is a different system from sync - creates read-only snapshots, not live sync.

### Sharing Component States (DataModal)

```javascript
// Share-related state
{
  shareLoading: boolean,
  shareToken: string,
  shareUrl: string,
  recipientName: string,
  shareNote: string,
  expiresHours: string,
  includeCompleted: boolean,
  includeTomorrow: boolean,
  autoUpdate: boolean,
  activeShares: array,
  selectedShareUser: string,
  showShareQR: boolean
}
```

### Copy to Clipboard Helper
```javascript
const copyToClipboard = async (text, successMessage) => {
  if (Platform.OS === 'web') {
    await navigator.clipboard.writeText(text);
  } else {
    Clipboard.setString(text);
  }
  showToast({ message: successMessage });
};
```

## Testing Checklist

### Initial Setup
- [ ] Create sync in Browser A with demo data
- [ ] Copy recovery phrase
- [ ] Join sync in Browser B with phrase
- [ ] Verify data appears in Browser B

### Incremental Sync
- [ ] Add card in Browser A
- [ ] Verify appears in Browser B within 2 seconds
- [ ] Complete card in Browser B
- [ ] Verify completion syncs to Browser A

### Edge Cases
- [ ] Delete card in Browser A
- [ ] Verify deletion syncs (wait 3+ seconds)
- [ ] Edit simultaneously on both browsers
- [ ] Verify last edit wins
- [ ] Refresh both browsers
- [ ] Verify sync persists and auto-starts

### Error Recovery
- [ ] Enter invalid recovery phrase
- [ ] Verify appropriate error message
- [ ] Disconnect network
- [ ] Make changes offline
- [ ] Reconnect and verify sync resumes