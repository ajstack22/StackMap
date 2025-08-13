# Swipe-to-Close Modal Research Report
## Conflict with Scrollable Content Best Practices

### Executive Summary
This report documents best practices for implementing swipe-to-close gestures in modals containing scrollable content across iOS, Android, and web platforms. The primary challenge is preventing conflicts between vertical scroll gestures and swipe-to-dismiss gestures, particularly when users scroll back to the top of content.

---

## Current Implementation Analysis

### StackMap's Current Approach
The app uses a dual PanResponder system in `TabbedModal.js`:
1. **Horizontal PanResponder**: Handles tab switching via horizontal swipes
2. **Vertical PanResponder**: Handles modal dismissal via downward swipes

**Key Issue Identified**: The `isScrolling` state tracking is incomplete - ScrollViews don't properly communicate their scroll state to the parent modal, causing swipe-to-close to trigger during scroll-up gestures.

---

## Platform-Specific Best Practices

### iOS (Native & React Native)

#### Key Findings:
1. **iOS 13+ Modal Behavior**: System modals use automatic swipe-to-dismiss with built-in scroll conflict resolution
2. **Scroll Position Detection**: Native iOS only allows dismiss when ScrollView is at top (contentOffset.y === 0)
3. **React Native Limitation**: ScrollView captures gestures at native level before JavaScript PanResponder

#### Best Practices:
- **Use Native Components**: For iOS, use native modal presentation styles when possible
- **Detect Scroll Position**: Only enable swipe-to-dismiss when scrollOffset === 0
- **Provide Alternative Dismiss**: Always include explicit close button (X) for accessibility
- **Consider Full-Screen**: Use `.fullScreen` presentation style to disable swipe-to-dismiss entirely if conflicts persist

#### Implementation Strategy:
```javascript
// Only allow dismiss when at top of scroll
onMoveShouldSetPanResponder: (evt, gestureState) => {
  const isDownwardSwipe = gestureState.dy > 10;
  const isAtTop = scrollOffset.current === 0;
  return isDownwardSwipe && isAtTop && !isScrolling;
}
```

---

### Android (Material Design)

#### Key Findings:
1. **Bottom Sheet States**: Android uses distinct states (COLLAPSED, EXPANDED, DRAGGING, SETTLING)
2. **Gesture Priority**: ViewPager2 and native scrolling take precedence over PanResponder
3. **Ambiguity Issues**: Vertical swipes conflict with notification drawer and control panel

#### Best Practices:
- **Use Native Bottom Sheet**: Leverage `BottomSheetBehavior` for automatic conflict resolution
- **Lower Thresholds**: Android users expect more sensitive swipe detection (10% vs 20% of screen)
- **Predictive Back**: Support system back button as primary dismiss method
- **Clear Visual Cues**: Include grab handle AND close button

#### Implementation Strategy:
```javascript
// Android-specific thresholds
const swipeThreshold = Platform.OS === 'android' ? screenWidth * 0.1 : screenWidth * 0.2;
const velocityThreshold = Platform.OS === 'android' ? 0.3 : 0.5;
```

---

### Web (Progressive Web App)

#### Key Findings:
1. **No Native Modal Support**: Must implement custom gesture handling
2. **Touch Events**: Need careful management of preventDefault/stopPropagation
3. **CSS touch-action**: Declarative control over touch behaviors

#### Best Practices:
- **Early Gesture Detection**: Determine intent within first 10px of movement
- **CSS touch-action**: Use `touch-action: pan-y` on scrollable areas
- **Conditional preventDefault**: Only prevent default on horizontal swipes
- **Mouse Event Fallback**: Don't preventDefault on touchstart to preserve mouse events

#### Implementation Strategy:
```javascript
// Web-specific gesture detection
onTouchMove: (e) => {
  const deltaX = Math.abs(touchStartX - e.touches[0].clientX);
  const deltaY = Math.abs(touchStartY - e.touches[0].clientY);
  
  if (deltaX > 7 && deltaX > deltaY) {
    // Horizontal swipe - handle tab switching
    e.preventDefault();
  } else if (deltaY > 10) {
    // Vertical scroll - let browser handle
    // Only allow dismiss if at top
    if (scrollTop === 0 && deltaY > 0) {
      e.preventDefault();
      handleDismiss();
    }
  }
}
```

---

## Universal Best Practices

### 1. Scroll State Tracking
- Track scroll position continuously, not just scroll start/end
- Use refs to avoid state update delays
- Debounce scroll position updates for performance

### 2. Gesture Conflict Resolution
- **Priority Order**: 
  1. Content scrolling (when not at bounds)
  2. Tab switching (horizontal swipe)
  3. Modal dismissal (vertical swipe at top)

### 3. Visual Feedback
- Show dismiss progress indicator during swipe
- Use spring animations for snap-back behavior
- Provide haptic feedback on gesture recognition (mobile)

### 4. Accessibility
- **Always provide explicit close button** - never rely solely on gestures
- Support keyboard navigation (Escape key on web)
- Ensure screen readers can dismiss modal
- Support system back button (Android)

### 5. Performance
- Use `scrollEventThrottle={16}` for 60fps scroll tracking
- Implement gesture handlers with `useNativeDriver: true`
- Avoid complex calculations in gesture handlers

---

## Recommended Implementation for StackMap

### Short-term Fix (Immediate)
1. Add scroll position tracking to all ScrollView components in modals
2. Only allow vertical dismiss when `scrollOffset === 0`
3. Add explicit close button if not present

### Medium-term Solution
1. Implement proper `onScrollBeginDrag`/`onScrollEndDrag` callbacks
2. Create a `ScrollAwareModal` wrapper component
3. Add visual indicator when swipe-to-dismiss is available

### Long-term Strategy
1. Consider using native modal components per platform
2. Implement platform-specific gesture handlers
3. Add user preference for disabling swipe-to-dismiss

---

## Code Implementation Recommendations

### 1. Enhanced Scroll State Tracking
```javascript
// In tab content components
const scrollOffset = useRef(0);

<ScrollView
  onScroll={(event) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
    onScrollStateChange?.(scrollOffset.current > 0);
  }}
  onScrollBeginDrag={() => onScrollStateChange?.(true)}
  onScrollEndDrag={() => {
    // Delay to handle momentum scrolling
    setTimeout(() => {
      onScrollStateChange?.(scrollOffset.current > 0);
    }, 100);
  }}
  onMomentumScrollEnd={() => {
    onScrollStateChange?.(scrollOffset.current > 0);
  }}
  scrollEventThrottle={16}
>
```

### 2. Improved Vertical PanResponder
```javascript
const verticalPanResponder = useRef(
  PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // More sophisticated detection
      const isDownwardSwipe = gestureState.dy > 10;
      const isUpwardSwipe = gestureState.dy < -10;
      const isVertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      
      // Only capture downward swipes when at top
      // Never capture upward swipes (let ScrollView handle)
      if (isUpwardSwipe) return false;
      
      return isDownwardSwipe && isVertical && !isScrolling && scrollAtTop;
    },
    // ... rest of implementation
  })
).current;
```

### 3. Platform-Specific Adjustments
```javascript
const getSwipeConfig = () => {
  if (Platform.OS === 'ios') {
    return {
      threshold: screenHeight * 0.2,
      velocity: 0.5,
      resistance: 0.5
    };
  } else if (Platform.OS === 'android') {
    return {
      threshold: screenHeight * 0.1,
      velocity: 0.3,
      resistance: 0.3
    };
  } else {
    // Web
    return {
      threshold: screenHeight * 0.15,
      velocity: 0.4,
      resistance: 0.4
    };
  }
};
```

---

## Testing Checklist

- [ ] Test scrolling to bottom and back to top without triggering dismiss
- [ ] Test quick flick gestures at various scroll positions
- [ ] Test with momentum scrolling enabled/disabled
- [ ] Test with different content heights (shorter than viewport, longer than viewport)
- [ ] Test tab switching doesn't interfere with scrolling
- [ ] Test on actual devices, not just simulators
- [ ] Test with accessibility features enabled
- [ ] Test keyboard/mouse on web platform
- [ ] Test landscape and portrait orientations
- [ ] Test with different scroll speeds

---

## Conclusion

The swipe-to-close conflict with scrollable content is a common UX challenge across all platforms. The key to resolving it is:

1. **Precise scroll position tracking** - Know exactly when content is at top
2. **Platform-specific thresholds** - Respect platform conventions
3. **Multiple dismiss methods** - Never rely solely on gestures
4. **Clear visual feedback** - Users should understand what will happen

The current implementation in StackMap can be improved by adding proper scroll state communication between child ScrollViews and the parent modal, particularly focusing on detecting when the scroll position is at the top before allowing swipe-to-dismiss gestures.

---

*Report compiled: January 2025*
*Based on: iOS 18.5+, Android 14+, Material Design 3, Modern Web Standards*