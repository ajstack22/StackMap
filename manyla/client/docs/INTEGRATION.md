# Client Integration Guide

## Overview

This guide explains how to integrate the StackMap sync functionality into your React Native application.

## Prerequisites

- React Native 0.64 or higher
- AsyncStorage for persistence
- React Native Keychain (for secure storage on mobile)

## Step 1: Install Dependencies

```bash
npm install tweetnacl tweetnacl-util pbkdf2 pako
npm install @react-native-async-storage/async-storage
npm install react-native-keychain
npm install react-native-vector-icons

# For iOS
cd ios && pod install
```

## Step 2: Copy Sync Services

1. Copy all files from `services/sync/` to your project's services directory
2. Ensure the following files are included:
   - `syncService.js` - Main sync orchestration
   - `encryptionService.js` - Encryption/decryption
   - `changeTracker.js` - Track local changes
   - `conflictResolver.js` - Handle merge conflicts
   - `syncQueue.js` - Offline queue management
   - `networkMonitor.js` - Network state monitoring
   - `syncThrottle.js` - Rate limiting
   - `syncHistory.js` - Audit trail

## Step 3: Configure API Endpoint

Update the API base URL in `syncService.js`:

```javascript
const API_BASE_URL = 'https://your-domain.com/api/sync';
```

## Step 4: Initialize State Management

### Using Zustand (Recommended)

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Your app state
      activities: [],
      users: {},
      currentUser: 'user_1',
      completedActivities: [],
      hasCompletedOnboarding: false,
      
      // State update functions
      setActivities: (activities) => set({ activities }),
      addActivity: (activity) => set((state) => ({
        activities: [...state.activities, activity]
      })),
      // ... other functions
    }),
    {
      name: 'app-storage',
      storage: AsyncStorage,
    }
  )
);
```

## Step 5: Add Sync Hook

Use the provided sync hook to automatically sync on state changes:

```javascript
import { useSyncOnChange } from './hooks/useSyncOnChange';

function App() {
  // Initialize sync on state changes
  useSyncOnChange();
  
  // Your app components
  return <YourAppComponents />;
}
```

## Step 6: Integrate UI Components

### Add Sync Settings to Edit Mode

```javascript
import syncService from './services/sync/syncService';

function EditModeSettingsModal({ visible, onClose }) {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [isCreatingSync, setIsCreatingSync] = useState(false);
  
  // Check sync status on mount
  useEffect(() => {
    checkSyncStatus();
  }, []);
  
  const checkSyncStatus = async () => {
    const enabled = await syncService.isEnabled();
    setSyncEnabled(enabled);
  };
  
  const handleEnableSync = async () => {
    try {
      setIsCreatingSync(true);
      const result = await syncService.initialize();
      setRecoveryPhrase(result.recoveryPhrase);
      setShowRecoveryPhrase(true);
      setSyncEnabled(true);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsCreatingSync(false);
    }
  };
  
  return (
    <Modal visible={visible} animationType="slide">
      {/* Your settings UI */}
      
      <View style={styles.syncSection}>
        <Text style={styles.sectionTitle}>Cross-Device Sync</Text>
        
        {!syncEnabled ? (
          <TouchableOpacity 
            style={styles.enableButton}
            onPress={handleEnableSync}
            disabled={isCreatingSync}
          >
            {isCreatingSync ? (
              <ActivityIndicator />
            ) : (
              <Text>Enable Sync</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View>
            <Text style={styles.syncStatus}>✓ Sync Enabled</Text>
            {/* Add sync management options */}
          </View>
        )}
        
        {showRecoveryPhrase && (
          <RecoveryPhraseDisplay 
            phrase={recoveryPhrase}
            onClose={() => setShowRecoveryPhrase(false)}
          />
        )}
      </View>
    </Modal>
  );
}
```

### Add Sync Status Indicator

```javascript
import SyncStatusIndicator from './components/SyncStatusIndicator';

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>StackMap</Text>
      <SyncStatusIndicator />
    </View>
  );
}
```

### Add Conflict Resolution Modal

```javascript
import ConflictResolutionModal from './components/ConflictResolutionModal';

function App() {
  return (
    <>
      <YourAppComponents />
      <ConflictResolutionModal />
    </>
  );
}
```

## Step 7: Handle Onboarding Sync

Add sync option to onboarding:

```javascript
function OnboardingScreen({ onComplete }) {
  const [showSyncSetup, setShowSyncSetup] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  
  const handleSyncSetup = async () => {
    setSyncLoading(true);
    try {
      await syncService.initialize(recoveryInput);
      
      // Check if sync restored users
      const syncedUsers = useAppStore.getState().users;
      if (Object.keys(syncedUsers).length > 0) {
        // Skip user creation, go directly to app
        onComplete({ users: Object.values(syncedUsers) });
      } else {
        // Continue with user creation
        setShowSyncSetup(false);
      }
    } catch (error) {
      Alert.alert('Sync Error', error.message);
    } finally {
      setSyncLoading(false);
    }
  };
  
  return (
    <View>
      {!showSyncSetup ? (
        <>
          <TouchableOpacity onPress={() => setShowSyncSetup(true)}>
            <Text>Sync StackMap</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCreateNewUser}>
            <Text>Create New StackMap</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View>
          <Text>Enter Recovery Phrase</Text>
          <TextInput
            value={recoveryInput}
            onChangeText={setRecoveryInput}
            placeholder="Enter your 12-word recovery phrase"
            multiline
          />
          <TouchableOpacity 
            onPress={handleSyncSetup}
            disabled={syncLoading}
          >
            {syncLoading ? <ActivityIndicator /> : <Text>Join Sync</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
```

## Step 8: Test Sync Functionality

### Manual Testing

1. **Enable sync on Device A**:
   - Go to Edit Mode → Settings
   - Enable sync
   - Save recovery phrase

2. **Join sync on Device B**:
   - During onboarding, choose "Sync StackMap"
   - Enter recovery phrase
   - Verify data syncs

3. **Test conflict resolution**:
   - Make changes on both devices while offline
   - Go online and verify conflict UI appears
   - Choose resolution and verify merge

### Automated Testing

Run the provided test suite:

```bash
node tests/client/test-sync.js
```

## Step 9: Platform-Specific Configuration

### iOS

Add to `Info.plist` for network access:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>your-domain.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
        </dict>
    </dict>
</dict>
```

### Android

Add to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Web

Configure CORS in your web server (see server deployment guide).

## Best Practices

### 1. Error Handling

```javascript
try {
  await syncService.sync();
} catch (error) {
  if (error.message.includes('network')) {
    // Handle network errors
  } else if (error.message.includes('conflict')) {
    // Handle conflicts
  } else {
    // Handle other errors
  }
}
```

### 2. Performance

- Use the sync hook to automatically sync on changes
- Sync throttling prevents excessive requests
- Incremental sync reduces data transfer
- Compression minimizes bandwidth usage

### 3. Security

- Recovery phrases are stored in device keychain
- Never log or display recovery phrases
- All data encrypted before transmission
- Use HTTPS in production

### 4. User Experience

- Show sync status indicator
- Provide clear error messages
- Handle offline gracefully
- Make conflict resolution intuitive

## Troubleshooting

### Sync Not Working

1. Check API endpoint is correct
2. Verify HTTPS certificate
3. Check network connectivity
4. Review error logs

### State Not Syncing

1. Ensure all state changes go through store
2. Verify changeTracker is initialized
3. Check sync history for errors

### Conflicts Not Detected

1. Verify timestamps are correct
2. Check conflict resolution logic
3. Test with longer offline periods

### Performance Issues

1. Enable incremental sync
2. Check data size limits
3. Monitor sync frequency
4. Review compression settings

## API Reference

### syncService

```javascript
// Initialize sync (create new or join existing)
await syncService.initialize(recoveryPhrase);

// Manual sync
await syncService.sync();

// Check if enabled
const enabled = await syncService.isEnabled();

// Disable sync
await syncService.disable();

// Delete all sync data
await syncService.deleteFromServer();
```

### encryptionService

```javascript
// Generate recovery phrase
const phrase = encryptionService.generateRecoveryPhrase();

// Get device ID
const deviceId = await encryptionService.getDeviceId();
```

## Migration Guide

If migrating from another sync solution:

1. Export existing data
2. Disable old sync
3. Import data into StackMap format
4. Enable new sync
5. Verify data integrity

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Test with the provided test suite
4. Check network connectivity