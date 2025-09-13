# TD-002: Fix NetInfo iOS Freeze Issue

## Story Type
Technical Debt - Performance/Functionality

## Priority
HIGH - Breaks offline detection on iOS

## Problem Statement
NetInfo.fetch() causes iOS app to freeze, so it's currently disabled. This means iOS cannot detect network status and assumes always online, breaking offline sync capabilities.

## Current Workaround
```javascript
// NetInfo completely disabled on iOS
// Assumes always online
// No offline queue management
```

## Acceptance Criteria
- [ ] Implement alternative network detection for iOS
- [ ] No UI freezes when checking network
- [ ] Accurate online/offline detection
- [ ] Sync queue works offline
- [ ] Network changes trigger sync appropriately
- [ ] Works on all iOS versions 14+

## Technical Requirements
- Research alternative network monitoring approaches
- Implement iOS-specific solution if needed
- Maintain cross-platform API
- Update sync service network monitoring

## Implementation Options
1. **Native Module**
   - Write custom iOS network monitoring
   - Use Reachability framework
   - Bridge to React Native

2. **Alternative Library**
   - Try @react-native-community/netinfo newer version
   - Test react-native-network-info

3. **Polling Approach**
   - Periodic fetch to known endpoint
   - Less real-time but avoids freeze

4. **Hybrid Solution**
   - Use fetch for initial check
   - WebSocket for real-time monitoring

## Files to Update
- `/src/services/sync/networkMonitor.js`
- `/src/services/sync/minimalSyncService.js`
- Possibly create new iOS-specific module

## Testing Requirements
- [ ] Test on real iOS devices
- [ ] Test airplane mode transitions
- [ ] Test WiFi to cellular transitions
- [ ] Test in poor network conditions
- [ ] Verify no UI freezes
- [ ] Test offline queue functionality

## Estimated Effort
Medium (2-3 days)

## Business Impact
- Restores offline capability for iOS users
- Prevents data loss in poor connectivity
- Improves sync reliability
- Reduces failed sync attempts

## Risk Assessment
- **Medium Risk**: New solution might also freeze
- **Mitigation**: Thorough testing on real devices
- **Low Risk**: Breaking existing sync
- **Mitigation**: Feature flag for rollback

## Success Metrics
- Zero freezes during network checks
- Accurate network status detection
- Offline queue processes when online
- Reduced sync failures by 50%

## Dependencies
- May require native iOS development setup

## Notes
Critical for iOS users in areas with poor connectivity. Currently they may lose data if sync fails.