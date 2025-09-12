# Story: Add Comprehensive Test Coverage for Sync System
## ID: S-DEBT-001
## Priority: P0
## Category: Technical Debt / Security
## Estimated Effort: L (1 week)

## Problem Statement
The sync system (syncService.js and related modules) has zero test coverage despite being the most critical data integrity component. This creates extreme risk for data loss, corruption, and security vulnerabilities. With 570+ lines of complex encryption, conflict resolution, and network handling code completely untested, any change risks breaking user data synchronization.

## Requirements
### Functional Requirements
- [ ] Unit tests for all encryption/decryption functions
- [ ] Integration tests for sync flow (push/pull/merge)
- [ ] Edge case tests for conflict resolution
- [ ] Network failure simulation tests
- [ ] Data corruption recovery tests
- [ ] Performance tests for large datasets (1000+ items)
- [ ] Security tests for encryption key handling

### Non-Functional Requirements
- [ ] Test coverage > 90% for sync modules
- [ ] Tests run in < 30 seconds
- [ ] Tests work in CI/CD pipeline
- [ ] Mock external dependencies properly
- [ ] Tests document expected behavior

## Success Criteria
### Verification Commands
```bash
# Test coverage must show > 90% for sync files
npm test -- --coverage src/services/syncService.js
npm test -- --coverage src/services/encryptionService.js
npm test -- --coverage src/services/sync/

# All tests must pass
npm test

# No performance regression
time npm test # Should complete in < 30s

# Validate encryption security
npm audit # No vulnerabilities
```

### Acceptance Criteria
- [ ] 50+ test cases covering all sync scenarios
- [ ] Mocked server responses for offline testing
- [ ] Data integrity validation in all tests
- [ ] Platform differences tested (AsyncStorage vs localStorage)
- [ ] Recovery phrase generation/validation tested
- [ ] Conflict resolution thoroughly tested

## Implementation Notes
### Approach
1. Set up Jest configuration for React Native
2. Create test utilities for sync mocking
3. Write unit tests for each sync module
4. Create integration test suite
5. Add performance benchmarks
6. Document test scenarios

### Key Files to Test
- `src/services/syncService.js` - Main sync orchestration
- `src/services/encryptionService.js` - Encryption/decryption
- `src/services/sync/conflictResolver.js` - Conflict resolution
- `src/services/sync/queueManager.js` - Offline queue
- `src/services/sync/networkMonitor.js` - Network state
- `src/services/sync/retryManager.js` - Retry logic
- `src/utils/dataNormalizer.js` - Field normalization

### Test Scenarios
```javascript
// Critical scenarios that must be tested:
describe('Sync System', () => {
  test('generates secure recovery phrase', () => {});
  test('encrypts data with proper salt/iterations', () => {});
  test('handles offline queue correctly', () => {});
  test('resolves conflicts with last-write-wins', () => {});
  test('recovers from partial sync failure', () => {});
  test('handles large datasets efficiently', () => {});
  test('prevents data loss during sync', () => {});
  test('validates data structure before sync', () => {});
  test('handles network interruptions gracefully', () => {});
  test('maintains field normalization (text/icon)', () => {});
});
```

## Testing Plan
### Unit Tests
- [ ] Encryption service: 15+ tests
- [ ] Sync service: 20+ tests
- [ ] Conflict resolver: 10+ tests
- [ ] Queue manager: 8+ tests
- [ ] Network monitor: 5+ tests
- [ ] Data normalizer: 10+ tests

### Integration Tests
- [ ] Full sync flow: Create → Sync → Import
- [ ] Conflict resolution: Simultaneous edits
- [ ] Offline sync: Queue and retry
- [ ] Large dataset: 1000+ activities
- [ ] Platform compatibility: Web vs Mobile

### Security Tests
- [ ] Encryption strength validation
- [ ] Key derivation verification
- [ ] Salt uniqueness
- [ ] Recovery phrase entropy
- [ ] No plaintext leakage

## Rollback Plan
### Risk Level: Low (tests only)
### Rollback Steps:
1. Tests are additive, no rollback needed
2. If tests break build, fix or skip temporarily
3. Document any skipped tests for follow-up

## Documentation Updates
- [ ] Add testing guide to docs/testing/
- [ ] Document test data generators
- [ ] Update CONTRIBUTING.md with test requirements
- [ ] Add sync testing checklist

## Review Checklist
### For Developer
- [ ] All sync code paths tested
- [ ] Mock data realistic
- [ ] Tests independent and repeatable
- [ ] Performance benchmarks included
- [ ] Security scenarios covered

### For Peer Reviewer
- [ ] Verify coverage > 90%
- [ ] Run tests on all platforms
- [ ] Check for flaky tests
- [ ] Validate test assertions
- [ ] Confirm mocks are appropriate

## Notes
This is CRITICAL priority due to:
1. Sync is the most complex and critical feature
2. Zero current test coverage creates extreme risk
3. Any sync bug could cause data loss for all users
4. Manual testing of sync is time-consuming and error-prone

The sync system handles user data encryption, conflict resolution, and cross-device synchronization. Without tests, we're essentially flying blind with user data integrity.

---
*Story created: 2025-01-13*
*Based on tech debt analysis*