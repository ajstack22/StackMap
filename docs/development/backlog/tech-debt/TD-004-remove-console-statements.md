# TD-004: Remove Console Statements and Implement Proper Logging

## Story Type
Technical Debt - Code Quality

## Priority
MEDIUM - Security and performance concern

## Problem Statement
50+ console.log/warn/error statements exist in production code, especially in sync service. This impacts performance, exposes sensitive information, and makes debugging harder.

## Current Issues
- `/src/services/sync/minimalSyncService.js` has 50+ console statements
- Sensitive data potentially logged
- Performance impact from string concatenation
- No log level control
- Logs not useful in production

## Acceptance Criteria
- [ ] Remove ALL console.* statements from production code
- [ ] Implement proper logging system
- [ ] Support log levels (DEBUG, INFO, WARN, ERROR)
- [ ] Disable debug logs in production
- [ ] Keep useful diagnostic information
- [ ] No sensitive data in logs

## Technical Requirements
- Create centralized logging utility
- Support environment-based log levels
- Maintain useful debugging capability
- Consider remote logging for production issues

## Implementation Options
1. **Custom Logger**
   ```javascript
   const logger = {
     debug: __DEV__ ? console.log : () => {},
     info: console.info,
     warn: console.warn,
     error: console.error
   };
   ```

2. **Logging Library**
   - winston-react-native
   - react-native-logs

3. **Remote Logging**
   - Sentry for errors
   - LogRocket for sessions

## Files to Update
- `/src/services/sync/minimalSyncService.js` (50+ statements)
- `/App.js` (debug statements)
- All service files
- All store files
- Component files with console usage

## Testing Requirements
- [ ] No console output in production build
- [ ] Debug logs work in development
- [ ] Error tracking works
- [ ] No performance degradation
- [ ] Sensitive data not logged

## Estimated Effort
Medium (2 days)

## Business Impact
- Improves app performance
- Protects user privacy
- Enables better debugging
- Reduces bundle size slightly

## Risk Assessment
- **Low Risk**: Removing useful debug info
- **Mitigation**: Keep debug capability in dev
- **Medium Risk**: Missing error tracking
- **Mitigation**: Implement error service

## Success Metrics
- Zero console statements in production
- Performance improvement measurable
- No sensitive data exposure
- Debugging still effective

## Dependencies
- Decision on logging approach

## Notes
Quick win for performance and security. Should be done before next production release.