# TD-008: Abstract Platform Workarounds

## Story Type
Technical Debt - Architecture

## Priority
LOW - Code maintainability

## Problem Statement
Platform-specific workarounds are scattered throughout the codebase without proper abstraction. This makes the code harder to maintain and understand.

## Current Issues
- Android FlexWrap 48% hardcoded everywhere
- iOS modal constraints repeated
- Platform checks scattered
- No central platform configuration
- Workarounds not well documented in code

## Acceptance Criteria
- [ ] Create platform abstraction layer
- [ ] Centralize platform workarounds
- [ ] Remove scattered platform checks
- [ ] Document all workarounds
- [ ] Maintain current functionality
- [ ] Simplify platform-specific code

## Technical Requirements
- Create platform utility module
- Abstract common patterns
- Provide consistent API
- Keep workarounds isolated

## Implementation Approach
```javascript
// platformUtils.js
export const PlatformStyles = {
  cardWidth: () => {
    return Platform.OS === 'android' ? '48%' : calculateCardWidth();
  },
  
  modalConstraints: () => {
    return Platform.select({
      ios: {
        flex: 1,
        maxHeight: '90%',
        alignSelf: 'stretch'
      },
      android: {
        flex: 1
      },
      default: {}
    });
  },
  
  fontFamily: (bold) => {
    if (Platform.OS === 'android') {
      return bold ? 'ComicRelief-Bold' : 'ComicRelief';
    }
    return 'Comic Relief';
  }
};
```

## Files to Update
- Create `/src/utils/platformUtils.js`
- Update all components using platform checks
- Update style definitions
- Remove inline Platform.select calls

## Benefits
- Single source of truth
- Easier to modify workarounds
- Better documentation
- Cleaner component code
- Easier testing

## Testing Requirements
- [ ] All platforms render correctly
- [ ] No visual regressions
- [ ] Performance maintained
- [ ] Workarounds still effective

## Estimated Effort
Small (1-2 days)

## Business Impact
- Faster feature development
- Fewer platform bugs
- Easier maintenance
- Better code quality

## Risk Assessment
- **Low Risk**: Well understood workarounds
- **Medium Risk**: Missing edge cases
- **Mitigation**: Thorough testing

## Success Metrics
- All platform checks centralized
- No inline workarounds
- Code complexity reduced
- Platform bugs reduced

## Dependencies
- None

## Notes
Good cleanup task for between features. Will make future development easier.