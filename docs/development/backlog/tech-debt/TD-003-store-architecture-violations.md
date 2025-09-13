# TD-003: Fix Store Architecture Violations

## Story Type
Technical Debt - Architecture

## Priority
HIGH - Violates new architecture patterns

## Problem Statement
Despite completing store refactoring, there are still direct setState calls instead of using store-specific methods. This violates the new architecture and can cause sync issues.

## Current Issues
```javascript
// BAD - Current violations
useAppStore.setState({ users: newUsers });

// GOOD - Should be
useUserStore.getState().setUsers(newUsers);
```

## Acceptance Criteria
- [ ] Remove ALL direct setState calls
- [ ] Use proper store-specific methods
- [ ] Update migration logic in stores
- [ ] Verify sync works correctly
- [ ] No state corruption issues
- [ ] Document proper patterns

## Technical Requirements
- Audit all setState usage
- Replace with store-specific methods
- Update store method signatures if needed
- Test state persistence
- Test sync behavior

## Files to Update
- `/src/stores/useAppStore.js` (lines 172-216)
- `/src/services/sync/minimalSyncService.js`
- Any components using direct setState
- Store migration logic

## Implementation Steps
1. Search for all `setState` calls
2. Identify which store they belong to
3. Replace with proper method calls
4. Test each change
5. Verify sync still works

## Testing Requirements
- [ ] All store updates work correctly
- [ ] State persists properly
- [ ] Sync pushes correct data
- [ ] Sync pulls update correct stores
- [ ] No data loss during migration
- [ ] Performance not degraded

## Estimated Effort
Medium (1-2 days)

## Business Impact
- Prevents data corruption
- Improves sync reliability
- Maintains architectural integrity
- Reduces future bugs

## Risk Assessment
- **High Risk**: Breaking state management
- **Mitigation**: Comprehensive testing
- **Medium Risk**: Breaking sync
- **Mitigation**: Test sync thoroughly

## Success Metrics
- Zero direct setState calls
- All tests pass
- Sync reliability maintained
- No state corruption reports

## Dependencies
- Must understand new store architecture

## Notes
This is architectural debt that will compound if not addressed. Should be fixed before adding new features.