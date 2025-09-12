# Story: Add React Performance Optimizations (memo, useCallback, useMemo)
## ID: S-DEBT-003  
## Priority: P1
## Category: Technical Debt / Performance
## Estimated Effort: L (1 week)

## Problem Statement
Only 30 instances of React.memo/useCallback/useMemo across 163 components, causing massive unnecessary re-renders. Users experience UI lag, especially on mobile devices with limited resources. The app re-renders entire component trees on every state change, wasting CPU cycles and battery life. This is particularly severe in list views with 100+ items.

## Requirements
### Functional Requirements
- [ ] Add React.memo to all pure components
- [ ] Implement useCallback for all event handlers
- [ ] Use useMemo for expensive computations
- [ ] Optimize list rendering with virtualization
- [ ] Prevent cascade re-renders in component trees
- [ ] Maintain current functionality exactly

### Non-Functional Requirements
- [ ] Reduce re-renders by 70%+
- [ ] Improve scroll performance to 60 FPS
- [ ] Reduce CPU usage by 40%+
- [ ] No visual changes to UI
- [ ] No behavior changes

## Success Criteria
### Verification Commands
```bash
# React DevTools Profiler Analysis
# Before: Record baseline render times
# After: Show 70%+ reduction in render time

# Performance metrics
# Run Lighthouse performance audit
# Score should improve by 20+ points

# Bundle size check (should not increase significantly)
ls -lh web/build/static/js/*.js

# Functional tests still pass
npm test
npm run build:web
```

### Acceptance Criteria
- [ ] All list items use React.memo
- [ ] Event handlers wrapped in useCallback
- [ ] Expensive filters/sorts use useMemo
- [ ] No prop drilling causing re-renders
- [ ] React Profiler shows optimized tree

## Implementation Notes
### Priority Components to Optimize
```javascript
// High-impact optimizations (most re-renders):
1. ActivityCard.js - Renders 100+ times in lists
2. UserCard.js - Multiple instances
3. StackView.js - Parent of many children
4. DataModal.js - Complex state changes
5. ActivityLibrary.js - Large lists
6. CategorySection.js - Nested components

// Example optimization pattern:
// BEFORE:
function ActivityCard({ activity, onPress }) {
  return <TouchableOpacity onPress={() => onPress(activity)}>...

// AFTER:
const ActivityCard = React.memo(({ activity, onPress }) => {
  const handlePress = useCallback(() => onPress(activity), [activity, onPress]);
  return <TouchableOpacity onPress={handlePress}>...
}, (prevProps, nextProps) => {
  return prevProps.activity.id === nextProps.activity.id &&
         prevProps.activity.modifiedAt === nextProps.activity.modifiedAt;
});
```

### Optimization Patterns
```javascript
// 1. Memoize expensive computations
const sortedActivities = useMemo(() => 
  activities.sort((a, b) => a.order - b.order),
  [activities]
);

// 2. Memoize inline objects/arrays
const style = useMemo(() => ({
  width: cardWidth,
  backgroundColor: theme.primary
}), [cardWidth, theme.primary]);

// 3. Prevent function recreation
const handleSave = useCallback((data) => {
  saveData(data);
}, [saveData]);

// 4. Custom comparison for complex props
const areEqual = (prev, next) => {
  return prev.id === next.id && 
         prev.updatedAt === next.updatedAt;
};
export default React.memo(Component, areEqual);
```

### Components Requiring Optimization
```
src/components/
├── ActivityCard.js - Add memo with custom comparison
├── UserCard.js - Memoize, optimize handlers
├── CategorySection.js - Prevent child re-renders
├── StackView.js - Optimize state updates
├── NavigationBar.js - Memoize static parts
├── ColorPicker.js - Heavy computation, needs useMemo
├── IconPicker.js - Large list, needs virtualization
├── DataModal/*.js - All sections need optimization
└── Lists/*.js - All list components need memo
```

## Testing Plan
### Performance Tests
- [ ] Measure initial render time
- [ ] Measure re-render frequency
- [ ] Check memory usage
- [ ] Validate 60 FPS scrolling
- [ ] Test with 1000+ items

### Regression Tests
- [ ] All interactions work correctly
- [ ] State updates properly
- [ ] No stale closures
- [ ] Platform differences handled

### Profiling Steps
```bash
# 1. Enable React DevTools Profiler
# 2. Record baseline performance
# 3. Apply optimizations
# 4. Record optimized performance
# 5. Compare flame graphs
# 6. Document improvements
```

## Rollback Plan
### Risk Level: Low
### Rollback Steps:
1. Remove optimization wrappers
2. Git revert if systematic issues
3. No data or API changes to revert

## Documentation Updates
- [ ] Add performance guidelines to CLAUDE.md
- [ ] Create optimization patterns guide
- [ ] Document profiling process
- [ ] Update component best practices

## Review Checklist
### For Developer
- [ ] Profiler shows improvements
- [ ] No stale closure bugs
- [ ] Dependencies arrays correct
- [ ] Custom comparisons justified
- [ ] No over-optimization

### For Peer Reviewer
- [ ] Verify performance gains
- [ ] Check for memory leaks
- [ ] Validate dependency arrays
- [ ] Test edge cases
- [ ] Confirm no behavior changes

## Common Pitfalls to Avoid
- ❌ Missing dependencies in useCallback/useMemo
- ❌ Stale closures from incorrect dependencies
- ❌ Over-optimizing (memoizing primitives)
- ❌ Breaking hot reload in development
- ❌ Memoizing components that always re-render anyway

## Platform Considerations
- **iOS**: Most critical due to AsyncStorage delays
- **Android**: Benefits from reduced re-renders
- **Web**: Improves Lighthouse scores significantly

## Notes
Current performance issues:
1. Lists with 50+ items drop to 20 FPS while scrolling
2. State changes cause entire app re-render
3. CPU usage spikes to 100% during navigation
4. Mobile devices heat up during extended use
5. Battery drain complaints from users

These optimizations are essential for a smooth user experience and will have immediate, measurable impact.

---
*Story created: 2025-01-13*
*Based on tech debt analysis*