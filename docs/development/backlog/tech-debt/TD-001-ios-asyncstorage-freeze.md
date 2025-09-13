# TD-001: Replace iOS AsyncStorage to Fix Performance Freezes

## Story Type
Technical Debt - Performance

## Priority
HIGH - Critical user experience issue

## Problem Statement
iOS AsyncStorage causes 20+ second freezes on app startup and during saves. Current workaround uses a 5-second debounce which delays data persistence and doesn't fully solve the problem.

## Current Workaround
```javascript
// In useAppStore.js and other stores
const debouncedSave = debounce(async (state) => {
  await AsyncStorage.setItem('appState', JSON.stringify(state));
}, 5000);
```

## Acceptance Criteria
- [ ] Research and select AsyncStorage replacement (MMKV recommended)
- [ ] Implement new storage solution with same API surface
- [ ] Remove all debounce workarounds
- [ ] Maintain backward compatibility with existing data
- [ ] Test iOS startup time < 2 seconds
- [ ] Test save operations < 100ms
- [ ] No UI freezes during storage operations

## Technical Requirements
- Migrate all AsyncStorage calls to new solution
- Implement data migration for existing users
- Update all store implementations
- Test on real iOS devices (not just simulator)

## Implementation Options
1. **MMKV** (Recommended)
   - 30x faster than AsyncStorage
   - Synchronous API available
   - Direct NSUserDefaults bridge

2. **react-native-fast-storage**
   - SQLite based
   - Good for large datasets

3. **Lazy Loading**
   - Load only essential data on startup
   - Background load remaining data

## Files to Update
- `/src/stores/useAppStore.js`
- `/src/stores/useUserStore.js`
- `/src/stores/useSettingsStore.js`
- `/src/stores/useLibraryStore.js`
- `/App.js` (startup loading)
- All sync service files

## Testing Requirements
- [ ] Test on iPhone 12 or newer
- [ ] Test on iPhone 8 (older device)
- [ ] Test with large datasets (100+ activities)
- [ ] Test rapid save operations
- [ ] Test app backgrounding/foregrounding
- [ ] Verify sync still works

## Estimated Effort
Large (3-5 days)

## Business Impact
- Eliminates primary iOS performance complaint
- Improves app store ratings
- Reduces support tickets
- Enables real-time saves

## Risk Assessment
- **High Risk**: Data migration failure
- **Mitigation**: Implement rollback mechanism
- **Medium Risk**: Breaking sync system
- **Mitigation**: Comprehensive sync testing

## Success Metrics
- iOS app startup < 2 seconds
- Save operations < 100ms
- Zero freeze complaints in next release
- Performance score > 90 in Lighthouse

## Dependencies
- None - Can be done independently

## Notes
This is the #1 iOS performance issue and should be prioritized for next sprint.