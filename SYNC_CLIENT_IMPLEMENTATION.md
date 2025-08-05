# StackMap Sync Client Implementation Guide

## Overview

This document details how the StackMap client implements sync functionality, including initialization flow, URL handling, and API integration.

## Application Initialization Flow

### 1. Entry Point (index.web.js / App.js)

```
User visits URL → index.web.js → App component
                                  ↓
                              App.js mounts
                                  ↓
                          Multiple useEffects run
```

### 2. URL Parameter Detection (App.js)

```javascript
// First useEffect - runs once on mount
useEffect(() => {
  if (Platform.OS === 'web') {
    const search = window.location.search;
    const urlParams = new URLSearchParams(search);
    const syncPhrase = urlParams.get('sync');
    
    if (syncPhrase) {
      setSyncSetupPhrase(syncPhrase); // Store for later
    }
  }
}, []); // Empty deps - runs once
```

### 3. State Initialization Order

1. **Component State** - useState hooks initialize (showSyncPreviewModal = false)
2. **Zustand Store** - Loads persisted data from AsyncStorage
3. **Theme Calculation** - `const theme = THEMES[currentTheme] || THEMES.stackBlue`
4. **URL Processing** - useEffect reads URL params
5. **Hydration Check** - Waits for Zustand to hydrate
6. **Modal Trigger** - Opens SyncPreviewModal if conditions met

### 4. Sync URL Processing Flow

```javascript
// Second useEffect - handles sync setup after hydration
useEffect(() => {
  if (syncSetupPhrase && isHydrated && hasCompletedOnboarding && !showOnboarding) {
    setTimeout(() => {
      setSyncPreviewPhrase(syncSetupPhrase);
      setShowSyncPreviewModal(true);
    }, 100);
  }
}, [syncSetupPhrase, isHydrated, hasCompletedOnboarding, showOnboarding, currentTheme]);
```

## Critical Timing Issues

### Problem: Race Condition
The theme might not be available when the modal tries to render because:

1. **Render Order**: 
   - State updates trigger re-renders
   - Theme is calculated in component body
   - Modal might render before theme calculation

2. **Multiple Renders**:
   - Initial render (theme might be undefined)
   - After state hydration (theme updates)
   - After URL param processing
   - After modal state change

### Current Flow with Sync URL:

```
1. User visits: https://stackmap.app/qual/?sync=abc123
2. App.js mounts
3. First render: theme = undefined (currentTheme not loaded yet)
4. URL params detected, setSyncSetupPhrase('abc123')
5. Zustand hydrates, currentTheme loads
6. Second render: theme = THEMES[currentTheme]
7. Sync setup effect runs, setShowSyncPreviewModal(true)
8. Modal renders with theme prop
```

## Component Hierarchy

```
App.js
├─ State Management (Zustand)
├─ Theme Definition (line ~1085)
├─ ... other components ...
└─ SyncPreviewModal (line ~3556)
    ├─ visible={showSyncPreviewModal}
    ├─ theme={theme}
    └─ syncPhrase={syncPreviewPhrase}
```

## Sync Service Integration

### 1. Recovery Phrase Generation
```javascript
// encryptionService.js
generateRecoveryPhrase() {
  const seedBytes = nacl.randomBytes(16);
  // Now returns hex string (32 chars, no padding)
  return Array.from(seedBytes, byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
}
```

### 2. Sync ID Generation
```javascript
// syncService.js
async generateSyncId(recoveryPhrase) {
  const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ==';
  const { key } = await encryptionService.deriveKeyFromPhrase(recoveryPhrase, fixedSalt);
  const syncIdBytes = key.slice(0, 16);
  return Array.from(syncIdBytes, byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
}
```

### 3. API Communication Flow

#### Creating Sync:
```
Client                          API
  |                              |
  |-- Generate phrase        -->|
  |-- Derive sync ID         -->|
  |-- Encrypt state          -->|
  |-- POST /create.php       -->|
  |   {sync_id, encrypted_blob}  |
  |<-- {success: true}       ---|
```

#### Joining Sync:
```
Client                          API
  |                              |
  |-- Parse URL ?sync=...    -->|
  |-- Open SyncPreviewModal  -->|
  |-- Derive sync ID         -->|
  |-- GET /pull.php          -->|
  |<-- {encrypted_blob, ...} ---|
  |-- Decrypt & preview      -->|
  |-- User confirms          -->|
  |-- Initialize sync        -->|
```

## URL Handling Details

### 1. URL Format
```
https://stackmap.app/qual/?sync=a1b2c3d4e5f6789012345678901234567
                          ↑     ↑
                    trailing /  32-char hex phrase
```

### 2. URL Generation (DataModal)
```javascript
const basePath = window.location.pathname.endsWith('/') 
  ? window.location.pathname 
  : window.location.pathname + '/';
const syncUrl = `${window.location.origin}${basePath}?sync=${encodeURIComponent(syncRecoveryPhrase)}`;
```

### 3. URL Parsing (App.js)
```javascript
const urlParams = new URLSearchParams(window.location.search);
const syncPhrase = urlParams.get('sync');
```

## Error Scenarios

### 1. Theme Undefined Error
**Cause**: Modal renders before theme is calculated
**Solution**: Add theme check in modal, delay modal opening

### 2. Sync Not Found
**Cause**: Invalid sync phrase or sync doesn't exist
**Solution**: Show error in SyncPreviewModal

### 3. Decryption Failed
**Cause**: Wrong recovery phrase for existing sync
**Solution**: Validate sync ID matches before decrypt

## State Management

### Zustand Store Structure
```javascript
{
  // User data
  users: { [userId]: userData },
  currentUser: 'userId',
  
  // Theme
  currentTheme: 'stackBlue',
  
  // Activities
  activities: [...],
  currentDay: 'YYYY-MM-DD',
  
  // Sync state (in syncService, not Zustand)
  syncId: null,
  masterKey: null,
  isEnabled: false
}
```

### Sync State (localStorage)
```javascript
{
  'stackmap_sync_enabled': 'true/false',
  'stackmap_sync_id': 'hex_sync_id',
  'stackmap_device_id': 'unique_device_id',
  'stackmap_recovery_phrase_encrypted': 'encrypted_phrase'
}
```

## Testing Sync URL Flow

1. **Generate sync URL**: Create sync in Data Modal
2. **Copy URL**: Includes hex recovery phrase
3. **Open in new browser**: Should trigger:
   - URL param detection
   - SyncPreviewModal opening
   - Sync data preview
   - Confirmation flow

## Common Issues

### Issue: Modal Opens Too Early
The SyncPreviewModal might open before:
- Theme is initialized
- Zustand store is hydrated
- App is ready

### Solution: Ensure Proper Initialization
```javascript
// Check all conditions before opening modal
if (syncSetupPhrase && isHydrated && hasCompletedOnboarding && !showOnboarding && theme) {
  setShowSyncPreviewModal(true);
}
```

## Debug Checklist

When sync URL fails:
1. Check browser console for:
   - `[App] URL params:` log
   - `[App] Opening sync preview modal` log
   - `[SyncPreviewModal] Theme not provided` error
   - Network requests to API

2. Verify:
   - URL has trailing slash
   - Sync phrase is 32 hex characters
   - No encoding issues in URL
   - Theme is defined before modal renders

3. Check timing:
   - Is Zustand hydrated?
   - Is theme calculated?
   - Are all conditions met?

## Recommendations

1. **Move theme to Zustand**: Store theme in Zustand to ensure it's available immediately
2. **Add loading state**: Show loading spinner until app is fully initialized
3. **Validate earlier**: Check sync phrase format before opening modal
4. **Better error handling**: Catch and display specific error types