# Story: Fix iOS AsyncStorage 20+ Second Freeze Issue
## ID: S-DEBT-005
## Priority: P1
## Category: Technical Debt / Performance / Platform Bug
## Estimated Effort: M (3 days)

## Problem Statement
iOS users experience 20+ second complete UI freezes when AsyncStorage performs write operations. This is currently "fixed" with a debounce hack in useAppStore.js, but the root cause remains. Users report the app becoming completely unresponsive, leading to force-quits and data loss. This is the #1 user complaint on iOS.

## Requirements
### Functional Requirements
- [ ] Eliminate UI freezing on AsyncStorage writes
- [ ] Maintain data persistence reliability
- [ ] Preserve offline functionality
- [ ] Implement proper async queue management
- [ ] Remove debounce hack (or document why it must stay)
- [ ] Add performance monitoring

### Non-Functional Requirements
- [ ] Zero UI freezes > 100ms
- [ ] Storage writes < 50ms
- [ ] No data loss during writes
- [ ] Works with 1000+ activities
- [ ] Background writes don't block UI

## Current Workaround Analysis
```javascript
// Current hack in useAppStore.js
const debouncedSave = debounce(async (state) => {
  await AsyncStorage.setItem('appState', JSON.stringify(state));
}, 5000); // 5 second debounce!

// This reduces freezes but causes:
// - 5 second delay in persistence
// - Potential data loss if app closes
// - Confusion when data doesn't save immediately
```

## Success Criteria
### Verification Commands
```bash
# Performance test on iOS
npx react-native run-ios

# Monitor performance in Xcode
# Instruments > Time Profiler
# Should show no main thread blocks > 100ms

# Test with large dataset
# Load 1000+ activities
# Perform rapid state changes
# No freezes should occur

# Verify data persistence
# Make changes
# Force quit app immediately
# Reopen and verify data saved
```

### Acceptance Criteria
- [ ] No UI freezes during storage operations
- [ ] Data saves within 500ms of change
- [ ] Works with 1000+ items
- [ ] No data loss on app termination
- [ ] Performance metrics logged
- [ ] Fallback strategy if issue persists

## Implementation Notes
### Root Cause Investigation
```javascript
// Potential causes to investigate:
1. Main thread blocking on large JSON.stringify
2. AsyncStorage using synchronous file I/O
3. iOS file system encryption overhead
4. React Native bridge congestion
5. Lack of proper batch writing

// Diagnostic code to add:
performance.mark('storage-write-start');
await AsyncStorage.setItem(key, value);
performance.mark('storage-write-end');
performance.measure('storage-write', 'storage-write-start', 'storage-write-end');
```

### Solution Approaches
```javascript
// Option 1: Background thread processing
import { runOnJS, runOnUI } from 'react-native-reanimated';

const saveInBackground = (data) => {
  runOnUI(() => {
    // Serialize on UI thread
    const serialized = JSON.stringify(data);
    runOnJS(async () => {
      // Save on JS thread
      await AsyncStorage.setItem('key', serialized);
    })();
  })();
};

// Option 2: Chunked storage for large data
const saveChunked = async (data) => {
  const chunks = chunkData(data, 100); // 100 items per chunk
  for (let i = 0; i < chunks.length; i++) {
    await AsyncStorage.setItem(`chunk_${i}`, JSON.stringify(chunks[i]));
    await new Promise(resolve => setTimeout(resolve, 10)); // Yield to UI
  }
};

// Option 3: Use MMKV instead of AsyncStorage
import MMKVStorage from 'react-native-mmkv-storage';
const storage = new MMKVStorage.Loader().initialize();
// 30x faster than AsyncStorage

// Option 4: Web Workers for serialization
const worker = new Worker('serializer.worker.js');
worker.postMessage({ command: 'serialize', data });
worker.onmessage = async (e) => {
  await AsyncStorage.setItem('key', e.data);
};
```

### Platform-Specific Implementation
```javascript
// src/services/storage.ios.js
import MMKV from 'react-native-mmkv';

const storage = new MMKV();

export default {
  setItem: (key, value) => {
    storage.set(key, value);
  },
  getItem: (key) => {
    return storage.getString(key);
  }
};

// src/services/storage.android.js
// src/services/storage.web.js
// Keep AsyncStorage for other platforms
```

## Testing Plan
### Performance Tests
- [ ] Baseline: Measure current freeze duration
- [ ] After fix: Verify < 100ms blocks
- [ ] Stress test: 1000+ items, rapid changes
- [ ] Memory test: No leaks during operations
- [ ] Battery test: No excessive CPU usage

### Data Integrity Tests
- [ ] Save and restore accuracy
- [ ] Concurrent write handling
- [ ] App termination scenarios
- [ ] Migration from old storage

### Device Tests
- [ ] iPhone 8 (older device)
- [ ] iPhone 15 (latest)
- [ ] iPad (different storage)
- [ ] iOS Simulator

## Rollback Plan
### Risk Level: High (core functionality)
### Rollback Steps:
1. Keep debounce code commented but available
2. Feature flag for new storage method
3. Fallback to debounced AsyncStorage if issues
4. Monitor error rates closely
5. Have hotfix ready

## Documentation Updates
- [ ] Document why AsyncStorage freezes on iOS
- [ ] Add storage performance guidelines
- [ ] Update platform gotchas in CLAUDE.md
- [ ] Create storage migration guide

## Review Checklist
### For Developer
- [ ] Freezing eliminated or < 100ms
- [ ] No data loss scenarios
- [ ] Performance metrics added
- [ ] Fallback mechanism in place
- [ ] All iOS devices tested

### For Peer Reviewer
- [ ] Verify performance improvements
- [ ] Test data integrity thoroughly
- [ ] Check memory usage
- [ ] Validate error handling
- [ ] Confirm backwards compatibility

## Investigation Notes
Known issues with React Native AsyncStorage on iOS:
1. Uses plist files which serialize synchronously
2. File system encryption adds overhead
3. No batching of writes
4. Bridge congestion with large payloads
5. Main thread blocking during serialization

Community solutions:
- react-native-mmkv: 30x faster
- react-native-fast-storage: Background threads
- Custom native module: Direct SQLite access

## Metrics to Track
```javascript
// Add analytics to track improvement
Analytics.track('storage_operation', {
  operation: 'write',
  duration: measureTime(),
  dataSize: JSON.stringify(data).length,
  platform: 'ios',
  deviceModel: DeviceInfo.getModel(),
  freezeDetected: duration > 100
});
```

## Notes
This is the #1 iOS user complaint and causes:
1. App Store reviews mentioning "freezing"
2. Users losing work when force-quitting
3. Perception of app being "slow" or "buggy"
4. Support tickets about "app not responding"

The current debounce is a band-aid that needs proper solution. MMKV is the most promising approach used by Discord, Facebook, and other major apps.

---
*Story created: 2025-01-13*
*Based on tech debt analysis*