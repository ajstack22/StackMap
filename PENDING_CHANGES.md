## Title: Fix critical iOS/Android crash - correct broken import path in AddTabContent.js

### Root Cause:
`AddTabContent.js` lines 65 & 107 were importing from a non-existent module:
```javascript
'../../../services/sync/encryptionService'
```

But the actual filename is `encryptionServiceFixed.ts`. This broken import caused the entire module to fail loading on iOS/Android, making the `styles` export undefined and crashing when trying to access `styles.scrollContainer`.

### The Fix:
**src/components/Modals/ActivityManagementModal/AddTabContent.js** (lines 65 & 107):
```javascript
// Changed from:
await import('../../../services/sync/encryptionService')

// To:
await import('../../../services/sync/encryptionServiceFixed')
```

### Why This Was Hard to Find:
1. **Misleading error location**: Error pointed to `styles.scrollContainer` being undefined, not the import failure
2. **Multiple failed fix attempts**: Previous commits (9a7f001c, 0e287cd3, 27ab5d37, 44531ad0) incorrectly removed working `Dimensions.get()` code
3. **Platform differences**: Web was more forgiving and only showed a warning; iOS/Android crashed immediately
4. **Hidden import**: The broken import was inside an async function, not at the top-level imports
5. **Web build warning revealed it**: Port 5501 showed "Module not found: Can't resolve '../../../services/sync/encryptionService'"

### Git History Cleanup:
- Removed 4 commits with failed fix attempts (44531ad0 through 0e287cd3)
- Reset to clean baseline (commit eee216fa)
- Applied only the correct fix (import path correction)

### Testing:
- ✅ iOS simulator (iPhone 16 Pro Max): Activities menu opens successfully
- ✅ Android emulator: App deployed and running
- ✅ Web (port 5501): No more module resolution warnings

### Deployment Date: [To be filled by deployment script]
