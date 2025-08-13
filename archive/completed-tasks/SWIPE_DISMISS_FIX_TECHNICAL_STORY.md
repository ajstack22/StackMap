# Technical Story: Fix Swipe-to-Dismiss Conflict with Scrollable Content

## Story Title
**Implement Scroll Position Tracking to Prevent Swipe-to-Dismiss Conflicts in Modals**

## Story Points: 5

## Priority: High

## Implementation Approach
**Single Session, Three Commits**: Implement all phases in one focused session but commit separately for granular rollback capability.

## Value Distribution
| Phase | Value % | Description | Commit Message |
|-------|---------|-------------|----------------|
| Phase 1: Scroll Position Tracking | **45%** | Add infrastructure to track scroll positions | "Add scroll position tracking to TabbedModal" |
| Phase 2: Update Vertical PanResponder | **40%** | Fix gesture detection logic using scroll data | "Update vertical PanResponder with scroll awareness" |
| Phase 3: Update Child Components | **15%** | Apply tracking to all modal children | "Apply scroll tracking to all modal children" |

### Why This Approach:
- **Single session**: Maintains context and consistency
- **Separate commits**: Enables granular rollback if needed
- **Logical separation**: Clear progression of changes
- **85% of value in first two commits**: Core fix is isolated

## Problem Statement
Users experience unintended modal dismissal when scrolling up in modal content. The modal's swipe-to-dismiss gesture incorrectly triggers during upward scroll gestures, particularly when users are trying to scroll back to the top of content. This creates a frustrating user experience where modals close unexpectedly.

## Technical Context
- **Affected Component**: `TabbedModal.js` and all child components with ScrollViews
- **Root Cause**: The modal only tracks binary scroll state (scrolling/not scrolling) rather than actual scroll position
- **Current Behavior**: Vertical PanResponder captures upward swipes regardless of scroll position
- **Desired Behavior**: Swipe-to-dismiss should only activate when ScrollView is at top (offset = 0) and user swipes down

## Acceptance Criteria
1. ✅ Modal should NOT dismiss when scrolling up from any position except top
2. ✅ Modal should ONLY dismiss when:
   - ScrollView is at top position (offset = 0)
   - User performs downward swipe gesture
   - Swipe exceeds threshold (20% of screen height)
3. ✅ Tab switching via horizontal swipe should remain functional
4. ✅ Solution works consistently across iOS, Android, and Web
5. ✅ Performance remains smooth (60fps scrolling)
6. ✅ Accessibility is maintained (explicit close button remains functional)

## Technical Implementation Plan

### Phase 1: Create Scroll Position Tracking System

#### 1.1 Update TabbedModal State Management
```javascript
// In TabbedModal.js
const [scrollPositions, setScrollPositions] = useState({});
const scrollOffsetsRef = useRef({});
const isAtTopRef = useRef(true);

// Track scroll position per tab
const updateScrollPosition = (tabKey, offset) => {
  scrollOffsetsRef.current[tabKey] = offset;
  const currentTabKey = tabs[activeTab]?.key;
  if (tabKey === currentTabKey) {
    isAtTopRef.current = offset <= 0;
  }
};
```

#### 1.2 Enhance TabContent Component
```javascript
// Update TabContent to accept scroll tracking props
export const TabContent = ({ 
  children, 
  isActive, 
  modalVisible, 
  onScrollStateChange,
  onScrollPositionChange, // NEW
  tabKey // NEW
}) => {
  const scrollOffset = useRef(0);
  
  // Clone children with enhanced scroll tracking
  const enhancedChildren = React.Children.map(children, child => {
    if (child?.type === ScrollView || child?.props?.scrollable) {
      return React.cloneElement(child, {
        onScroll: (event) => {
          const offset = event.nativeEvent.contentOffset.y;
          scrollOffset.current = offset;
          onScrollPositionChange?.(tabKey, offset);
          onScrollStateChange?.(offset > 0);
          child.props.onScroll?.(event);
        },
        onScrollBeginDrag: (event) => {
          onScrollStateChange?.(true);
          child.props.onScrollBeginDrag?.(event);
        },
        onScrollEndDrag: (event) => {
          const offset = event.nativeEvent.contentOffset.y;
          setTimeout(() => {
            onScrollStateChange?.(offset > 0);
          }, 100);
          child.props.onScrollEndDrag?.(event);
        },
        onMomentumScrollEnd: (event) => {
          const offset = event.nativeEvent.contentOffset.y;
          onScrollStateChange?.(offset > 0);
          child.props.onMomentumScrollEnd?.(event);
        },
        scrollEventThrottle: 16
      });
    }
    return child;
  });
  
  return (
    <View style={[styles.tabContent, { display: isActive ? 'flex' : 'none' }]}>
      {enhancedChildren}
    </View>
  );
};
```

### Phase 2: Update Vertical PanResponder Logic

#### 2.1 Enhance Gesture Detection
```javascript
// In TabbedModal.js - Update verticalPanResponder
const verticalPanResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // CRITICAL: Never capture upward swipes
      if (gestureState.dy < 0) {
        return false;
      }
      
      // Only capture downward swipes when at top
      const isDownwardSwipe = gestureState.dy > 10;
      const isVerticalGesture = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      const canDismiss = isAtTopRef.current && !isScrolling;
      
      return isDownwardSwipe && isVerticalGesture && canDismiss;
    },
    
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
      // More conservative capture for modal dismissal
      if (gestureState.dy < 0) return false;
      
      const isStrongDownwardSwipe = gestureState.dy > 20;
      const isVertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5;
      const canDismiss = isAtTopRef.current && !isScrolling;
      
      return isStrongDownwardSwipe && isVertical && canDismiss;
    },
    
    onPanResponderGrant: () => {
      // Visual feedback that dismiss gesture is recognized
      // Could add haptic feedback here on mobile
    },
    
    onPanResponderMove: (evt, gestureState) => {
      // Only allow downward movement
      if (gestureState.dy > 0 && isAtTopRef.current) {
        modalSlideAnimation.setValue(gestureState.dy);
      }
    },
    
    onPanResponderRelease: (evt, gestureState) => {
      const dismissThreshold = screenHeight * 0.2;
      const velocityThreshold = 0.5;
      
      if (gestureState.dy > dismissThreshold || gestureState.vy > velocityThreshold) {
        // Animate out and close
        RNAnimated.timing(modalSlideAnimation, {
          toValue: screenHeight,
          duration: 250,
          easing: Easing.bezier(0.2, 0, 0, 1),
          useNativeDriver: true,
        }).start(() => {
          modalSlideAnimation.setValue(0);
          onClose();
        });
      } else {
        // Snap back
        RNAnimated.timing(modalSlideAnimation, {
          toValue: 0,
          duration: 250,
          easing: Easing.bezier(0.2, 0, 0, 1),
          useNativeDriver: true,
        }).start();
      }
    }
  })
).current;
```

### Phase 3: Update All Modal Tab Contents

#### 3.1 Update LibraryTabContent.js
```javascript
// Add scroll tracking to main ScrollView
const scrollRef = useRef(null);
const scrollOffset = useRef(0);

return (
  <>
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[styles.listContainer, styles.scrollContainer]}
      showsVerticalScrollIndicator={false}
      directionalLockEnabled={true}
      scrollEventThrottle={16}
      onScroll={(event) => {
        scrollOffset.current = event.nativeEvent.contentOffset.y;
        props.onScrollPositionChange?.(props.tabKey, scrollOffset.current);
        props.onScrollStateChange?.(scrollOffset.current > 0);
      }}
      onScrollBeginDrag={() => {
        props.onScrollStateChange?.(true);
      }}
      onScrollEndDrag={(event) => {
        const offset = event.nativeEvent.contentOffset.y;
        setTimeout(() => {
          props.onScrollStateChange?.(offset > 0);
        }, 100);
      }}
      onMomentumScrollEnd={(event) => {
        const offset = event.nativeEvent.contentOffset.y;
        props.onScrollStateChange?.(offset > 0);
      }}
    >
      {/* Content */}
    </ScrollView>
  </>
);
```

#### 3.2 Apply Similar Updates to:
- `PlanTabContent.js`
- `CompleteTabContent.js`
- `AddTabContent.js`
- `UsersTabContent.js`
- `PINTabContent.js`
- Any other components with ScrollViews in modals

### Testing Implementation

#### Unit Tests
```javascript
describe('TabbedModal Swipe Behavior', () => {
  it('should not dismiss when scrolling up from middle position', () => {
    // Test implementation
  });
  
  it('should dismiss when swiping down from top position', () => {
    // Test implementation
  });
  
  it('should not interfere with horizontal tab switching', () => {
    // Test implementation
  });
});
```

#### Manual Testing Checklist
- [ ] Scroll to bottom of long content
- [ ] Scroll back up quickly - modal should NOT dismiss
- [ ] Scroll to very top (offset = 0)
- [ ] Swipe down from top - modal SHOULD dismiss
- [ ] Test momentum scrolling doesn't trigger dismiss
- [ ] Test horizontal swipe still switches tabs
- [ ] Test on iOS device (not just simulator)
- [ ] Test on Android device (not just emulator)
- [ ] Test on Chrome, Safari, Firefox (web)
- [ ] Test with keyboard navigation (web)
- [ ] Test with screen reader enabled

## Implementation Steps (Single Session)

### Step 1: Phase 1 - Scroll Position Tracking (45 minutes)
1. Modify `TabbedModal.js` with new scroll tracking state
2. Add scroll position refs and tracking functions
3. Test tracking is working with console logs
4. **Commit**: "Add scroll position tracking to TabbedModal"

### Step 2: Phase 2 - Update Gesture Detection (45 minutes)
1. Update vertical PanResponder logic
2. Integrate scroll position into gesture decisions
3. Test core fix is working
4. **Commit**: "Update vertical PanResponder with scroll awareness"

### Step 3: Phase 3 - Update All Child Components (90 minutes)
1. Update each tab content component with scroll handlers
2. Add proper refs and callbacks
3. Ensure consistent implementation across all modals
4. **Commit**: "Apply scroll tracking to all modal children"

### Step 4: Testing & Documentation (30 minutes)
1. Test on all platforms (iOS, Android, Web)
2. Run through full testing checklist
3. Update CLAUDE.md with solution
4. **Final Commit**: "Document swipe-to-dismiss fix"

## Rollback Plan
If issues arise:
1. Keep vertical PanResponder disabled temporarily
2. Rely on explicit close button only
3. Revert to previous gesture handling
4. Document issues for future iteration

## Success Metrics
- Zero unintended modal dismissals during scrolling
- Swipe-to-dismiss works 100% when at scroll top
- No performance degradation (maintain 60fps)
- Works consistently across all platforms
- User feedback indicates improved experience

## Dependencies
- No external library additions required
- Uses existing React Native gesture system
- Compatible with current React Native version

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Performance impact from scroll tracking | Use refs instead of state, throttle events to 16ms |
| Platform inconsistencies | Test thoroughly on actual devices, not just simulators |
| Breaking existing tab switching | Keep horizontal and vertical handlers separate |
| Accessibility regression | Maintain explicit close button, test with screen readers |

## Notes for Developer
- The key insight is tracking actual scroll position, not just scroll state
- Never capture upward swipes - let ScrollView handle them completely
- Test with real devices as simulators don't perfectly replicate touch behavior
- Consider adding user preference to disable swipe-to-dismiss entirely

## Definition of Done
- [ ] Three phases implemented in separate commits
- [ ] All acceptance criteria met
- [ ] Tested on iOS, Android, and Web
- [ ] No performance regressions
- [ ] CLAUDE.md updated with fix
- [ ] No unintended modal dismissals during scrolling
- [ ] Swipe-to-dismiss works when at scroll top

---

*Technical Story Created: January 2025*
*Estimated Time: 3.5 hours (single focused session)*
*Dependencies: None*
*Blocking: User Experience Quality*