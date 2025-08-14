# Data Reset Service

## Overview
The reset service handles clearing data at various levels - from single activities to complete app reset.

## Reset Levels

### 1. Activity Reset
- Clear single activity
- Clear day's activities
- Clear completed activities only

### 2. User Reset
- Delete single user
- Clear user's all days
- Reset user to default state

### 3. Sync Reset
- Disconnect from sync
- Clear sync data from server
- Remove sync phrase

### 4. App Reset
- Complete factory reset
- Clear all data and settings
- Reset to onboarding state

## Reset Operations

### Activity Level Resets

#### Clear Single Activity
```javascript
function deleteActivity(activityId) {
  const { activities, setActivities } = useAppStore.getState();
  
  // Soft delete (for sync)
  const updated = activities.map(activity => 
    activity.id === activityId 
      ? { ...activity, deleted: true, deletedAt: Date.now() }
      : activity
  );
  
  setActivities(updated);
  
  // Also update in user's day data
  updateUserDayActivities(updated);
}
```

#### Clear Day's Activities
```javascript
function clearDayActivities(userId, dayKey) {
  const { users, setUsers } = useAppStore.getState();
  
  const updatedUsers = {
    ...users,
    [userId]: {
      ...users[userId],
      days: {
        ...users[userId].days,
        [dayKey]: {
          activities: [],
          lastModified: Date.now()
        }
      }
    }
  };
  
  setUsers(updatedUsers);
  
  // Update current view if applicable
  if (isCurrentUserDay(userId, dayKey)) {
    setActivities([]);
  }
}
```

#### Reset Completed Status
```javascript
function resetCompletedActivities(userId, dayKey) {
  const { users, setUsers } = useAppStore.getState();
  const dayData = users[userId]?.days[dayKey];
  
  if (dayData?.activities) {
    const reset = dayData.activities.map(activity => ({
      ...activity,
      completed: false,
      lastModified: Date.now()
    }));
    
    updateUserDayActivities(userId, dayKey, reset);
  }
}
```

### User Level Resets

#### Delete User
```javascript
function deleteUser(userId) {
  const { users, setUsers, currentUser, setCurrentUser } = useAppStore.getState();
  
  // Soft delete for sync
  const updatedUsers = {
    ...users,
    [userId]: {
      ...users[userId],
      deleted: true,
      deletedAt: Date.now()
    }
  };
  
  setUsers(updatedUsers);
  
  // Switch to another user if deleting current
  if (currentUser === userId) {
    const availableUsers = Object.keys(updatedUsers)
      .filter(id => !updatedUsers[id].deleted);
    
    if (availableUsers.length > 0) {
      setCurrentUser(availableUsers[0]);
    } else {
      // No users left - trigger onboarding
      resetToOnboarding();
    }
  }
}
```

#### Reset User to Default
```javascript
function resetUserToDefault(userId) {
  const { users, setUsers } = useAppStore.getState();
  
  const defaultUser = {
    id: userId,
    name: users[userId].name,
    icon: users[userId].icon,
    days: {
      today: { activities: [] },
      tomorrow: { activities: [] }
    },
    settings: {
      theme: 'stackBlue',
      taskCelebration: 'rainbow',
      routineCelebration: 'rainbow',
      soundEnabled: true
    },
    lastModified: Date.now()
  };
  
  setUsers({
    ...users,
    [userId]: defaultUser
  });
  
  // Update view if current user
  if (isCurrentUser(userId)) {
    setActivities([]);
  }
}
```

### Sync Level Resets

#### Disconnect from Sync
```javascript
async function disconnectSync() {
  const { syncPhrase, setSyncPhrase, setLastSyncTime } = useAppStore.getState();
  
  if (!syncPhrase) return;
  
  try {
    // Optional: Notify server of disconnect
    await notifyDisconnect(syncPhrase);
  } catch (error) {
    console.log('Could not notify server of disconnect');
  }
  
  // Clear local sync data
  setSyncPhrase(null);
  setLastSyncTime(null);
  
  // Clear cached sync data
  clearSyncCache();
  
  // Stop sync polling
  stopSyncPolling();
}
```

#### Delete Sync from Server
```javascript
async function deleteSyncFromServer(syncPhrase) {
  const confirmed = await confirmAction(
    'Delete Sync Data',
    'This will permanently delete all synced data from the server. Local data will not be affected.'
  );
  
  if (!confirmed) return;
  
  try {
    // Send delete request to server
    const response = await fetch(`${API_URL}/sync/${syncPhrase}`, {
      method: 'DELETE',
      headers: {
        'X-Delete-Confirmation': 'confirmed'
      }
    });
    
    if (response.ok) {
      // Clear local sync reference
      disconnectSync();
      showToast('Sync data deleted from server');
    } else {
      throw new Error('Failed to delete sync data');
    }
  } catch (error) {
    console.error('Delete sync error:', error);
    showToast('Failed to delete sync data', 'error');
  }
}
```

### App Level Reset

#### Factory Reset
```javascript
async function factoryReset() {
  const confirmed = await confirmAction(
    'Factory Reset',
    'This will delete ALL data and settings. This cannot be undone.',
    'RESET'
  );
  
  if (!confirmed) return;
  
  // Clear all state
  const { reset } = useAppStore.getState();
  reset(); // Zustand reset to initial state
  
  // Clear AsyncStorage
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys);
  
  // Clear secure storage
  await clearSecureStorage();
  
  // Reset to onboarding
  resetToOnboarding();
}
```

#### Reset to Onboarding
```javascript
function resetToOnboarding() {
  const { 
    setHasCompletedOnboarding,
    setShowOnboarding,
    reset
  } = useAppStore.getState();
  
  // Reset state
  reset();
  
  // Show onboarding
  setHasCompletedOnboarding(false);
  setShowOnboarding(true);
  
  // Clear any temporary data
  clearTempData();
  
  // Reload app (web)
  if (Platform.OS === 'web') {
    window.location.reload();
  }
}
```

## Confirmation Dialogs

### Confirmation Requirements
```javascript
const RESET_CONFIRMATIONS = {
  deleteActivity: {
    title: 'Delete Activity',
    message: 'Remove this activity?',
    requiresText: false
  },
  deleteUser: {
    title: 'Delete User',
    message: 'This will delete all data for this user.',
    requiresText: false
  },
  disconnectSync: {
    title: 'Disconnect Sync',
    message: 'Stop syncing data across devices?',
    requiresText: false
  },
  deleteSyncData: {
    title: 'Delete Sync Data',
    message: 'Permanently delete all synced data from server?',
    requiresText: true,
    confirmText: 'DELETE'
  },
  factoryReset: {
    title: 'Factory Reset',
    message: 'Delete ALL data and settings? This cannot be undone.',
    requiresText: true,
    confirmText: 'RESET'
  }
};
```

### Confirmation Dialog
```javascript
async function confirmAction(title, message, requiredText = null) {
  return new Promise((resolve) => {
    if (requiredText) {
      // Show modal with text input
      showConfirmModal({
        title,
        message,
        placeholder: `Type "${requiredText}" to confirm`,
        onConfirm: (inputText) => {
          resolve(inputText === requiredText);
        },
        onCancel: () => resolve(false)
      });
    } else {
      // Simple confirmation
      if (Platform.OS === 'web') {
        resolve(window.confirm(`${title}\n\n${message}`));
      } else {
        Alert.alert(
          title,
          message,
          [
            { text: 'Cancel', onPress: () => resolve(false) },
            { text: 'Confirm', onPress: () => resolve(true), style: 'destructive' }
          ]
        );
      }
    }
  });
}
```

## Data Cleanup

### Cleanup Operations
```javascript
function cleanupAfterReset(resetType) {
  switch (resetType) {
    case 'activity':
      // Compact activities array
      compactActivities();
      break;
      
    case 'user':
      // Remove user from recent lists
      removeFromRecents();
      // Clean up orphaned references
      cleanOrphanedReferences();
      break;
      
    case 'sync':
      // Clear sync cache
      clearSyncCache();
      // Remove sync metadata
      clearSyncMetadata();
      break;
      
    case 'factory':
      // Complete cleanup handled by reset
      break;
  }
  
  // Trigger garbage collection (if available)
  if (global.gc) {
    global.gc();
  }
}
```

### Orphaned Data Cleanup
```javascript
function cleanOrphanedReferences() {
  const { users, activityCategories, setActivityCategories } = useAppStore.getState();
  
  // Remove references to deleted users in categories
  if (activityCategories) {
    const cleaned = activityCategories.map(category => ({
      ...category,
      activities: category.activities.filter(activity => {
        // Remove activities that reference deleted users
        return !activity.userId || !users[activity.userId]?.deleted;
      })
    }));
    
    setActivityCategories(cleaned);
  }
}
```

## Recovery Options

### Before Reset Backup
```javascript
async function createBackupBeforeReset() {
  try {
    const backup = await exportFullBackup();
    const filename = `stackmap-pre-reset-${Date.now()}.json`;
    
    // Store locally
    await storeBackup(backup, filename);
    
    // Notify user
    showToast('Backup created before reset');
    
    return filename;
  } catch (error) {
    console.error('Backup failed:', error);
    return null;
  }
}
```

## Security Considerations

1. **Confirmation Required** - Destructive operations need confirmation
2. **Typed Confirmation** - Critical operations require typing specific text
3. **Soft Delete** - Keep deleted data for sync reconciliation
4. **Backup Prompts** - Suggest backup before major resets
5. **Secure Wipe** - Overwrite sensitive data on factory reset