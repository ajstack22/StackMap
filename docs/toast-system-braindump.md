# StackMap Toast System - Complete Technical Braindump

## Overview

StackMap implements a lightweight, centralized toast notification system that provides non-intrusive feedback for user actions across all platforms. It's deliberately simple and consistent.

---

## Architecture

### Core Components

```
useToast Hook (State Management)
    ↓
Toast Component (Visual Presentation)
    ↓
App.js Integration (Global Placement)
```

### File Structure
```
src/
├── hooks/useToast.js         # State management and logic
├── components/Toast/Toast.js  # Visual component
└── constants/index.js         # TOAST_DURATION constant (3000ms)
```

---

## The useToast Hook

### Complete Implementation
```javascript
// src/hooks/useToast.js
import { useState, useCallback, useRef } from 'react';
import { TOAST_DURATION } from '../constants';

export const useToast = () => {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const showToast = useCallback(config => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show new toast with visible flag
    setToast({ ...config, visible: true });

    // Set auto-hide timeout
    if (config.duration !== 0) {
      timeoutRef.current = setTimeout(() => {
        setToast({ visible: false });
      }, config.duration || TOAST_DURATION);
    }
  }, []);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setToast({ visible: false });
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};
```

### Key Features
1. **Automatic dismissal** - Default 3 seconds
2. **Queue prevention** - New toast cancels previous
3. **Manual dismissal** - Via hideToast or tap
4. **Configurable duration** - Pass 0 to disable auto-hide

---

## Toast Component

### Visual Implementation
```javascript
// Core structure
<Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
  <TouchableOpacity style={[styles.toast, { backgroundColor }]}>
    <Text style={styles.message}>{message}</Text>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text>{action.label}</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>
</Animated.View>
```

### Styling Details
```javascript
container: {
  position: 'absolute',
  bottom: 100,           // Above bottom navigation
  left: 0,
  right: 0,
  alignItems: 'center',
  zIndex: 99999,        // Above all other content
  elevation: 99999,     // Android elevation
}

toast: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
  // Uses SHADOWS.level3 for elevation
}
```

### Animation
- **Entry**: Slides up from bottom (300ms)
- **Exit**: Slides down (300ms)
- Uses `translateY` with `useNativeDriver: true` for performance

---

## Configuration Options

### showToast() Parameters

```javascript
showToast({
  message: string,              // Required: Text to display
  duration?: number,            // Optional: Ms before auto-hide (default: 3000)
  backgroundColor?: string,     // Optional: Custom background (default: theme.primary)
  action?: {                   // Optional: Action button
    label: string,
    onPress: () => void
  }
})
```

### Common Usage Patterns

#### Simple Success Message
```javascript
showToast({
  message: 'Activity added!'
});
```

#### With Custom Duration
```javascript
showToast({
  message: 'Syncing...',
  duration: 10000  // 10 seconds for long operations
});
```

#### With Undo Action
```javascript
showToast({
  message: `${activity.text} deleted`,
  action: {
    label: 'UNDO',
    onPress: () => undoDelete(activity.id)
  }
});
```

#### Persistent Toast (Manual Dismiss Only)
```javascript
showToast({
  message: 'Processing...',
  duration: 0  // Won't auto-hide
});
// Later: hideToast() when done
```

#### Custom Color
```javascript
showToast({
  message: 'Error occurred',
  backgroundColor: '#f56565'  // Red for errors
});
```

---

## Usage Throughout Codebase

### Common Toast Messages

#### Sync Related
- "Sync enabled!"
- "Sync disabled"
- "Syncing..."
- "Sync complete"
- "Recovery phrase copied"
- "Invite code created"

#### Data Operations
- "Data imported successfully"
- "Export complete"
- "PIN set successfully"
- "Context saved!"

#### Activity Management
- `${activity.text} deleted` (with UNDO)
- "Activity added to library"
- `${count} activities completed`
- "All activities reset"

#### User Management
- `Switched to ${user.name}`
- "User created"
- "User deleted"

---

## Integration Points

### In App.js
```javascript
// 1. Import and initialize
const { toast, showToast, hideToast } = useToast();

// 2. Pass showToast to modals and components
<DataModal showToast={showToast} />
<SettingsModal showToast={showToast} />

// 3. Render Toast component at root level
<Toast toast={toast} onDismiss={hideToast} theme={theme} />
```

### In Modals/Components
```javascript
// Receive via props
const Component = ({ showToast }) => {

  const handleAction = () => {
    // Do something
    showToast({ message: 'Action completed!' });
  };

  return ...;
};
```

---

## Platform-Specific Behavior

### iOS
- Respects safe areas automatically
- Smooth native animations
- Haptic feedback on action buttons (if enabled)

### Android
- Uses elevation for shadow (elevation: 99999)
- Material Design-inspired styling
- Handles back button (dismisses toast)

### Web
- Positioned above fold
- Click outside doesn't dismiss (intentional)
- Keyboard accessible (action buttons)

---

## Design Decisions

### Why No Toast Queue?
- **Simplicity** - One toast at a time prevents confusion
- **Clarity** - Users see the most recent/relevant message
- **Performance** - No complex queue management

### Why Bottom Position?
- **Thumb reach** - Easy to tap actions on mobile
- **Non-intrusive** - Doesn't block main content
- **Consistent** - Same position across all screens

### Why 3 Second Default?
- **Reading time** - Enough for ~10 word message
- **Not annoying** - Doesn't linger too long
- **Industry standard** - Matches user expectations

---

## Common Issues & Solutions

### Toast Not Showing
```javascript
// WRONG - showToast not defined
showToast({ message: 'Test' });

// RIGHT - Destructure from hook
const { showToast } = useToast();
showToast({ message: 'Test' });
```

### Toast Behind Modal
```javascript
// Ensure Toast component is rendered AFTER modals in App.js
<Modal />
<Toast /> // Must be last
```

### Toast Dismissed Too Quickly
```javascript
// Increase duration for longer messages
showToast({
  message: 'This is a longer message that needs more reading time',
  duration: 5000  // 5 seconds
});
```

### Memory Leak Warning
```javascript
// Always clear timeout in cleanup
useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);  // Critical!
    }
  };
}, []);
```

---

## Testing Toast Notifications

### Manual Testing
```javascript
// In browser console or React Native Debugger
showToast({ message: 'Test toast' });
showToast({ message: 'With action', action: { label: 'UNDO', onPress: () => console.log('Clicked') }});
showToast({ message: 'Custom color', backgroundColor: '#ff0000' });
showToast({ message: 'Long duration', duration: 10000 });
showToast({ message: 'No auto-hide', duration: 0 });
```

### Unit Testing
```javascript
// Mock the hook
jest.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    toast: { visible: true, message: 'Test' },
    showToast: jest.fn(),
    hideToast: jest.fn()
  })
}));
```

---

## Android TV Adaptations

For the Android TV implementation, consider these modifications:

### Position Adjustment
```javascript
// Move toast higher to avoid D-pad navigation area
container: {
  bottom: 200,  // Higher than mobile (was 100)
}
```

### Larger Text
```javascript
message: {
  fontSize: 24,  // Larger for 10-foot UI (was 16)
}
```

### Auto-Dismiss on Navigation
```javascript
// Hide toast when user navigates with D-pad
onFocusChange={() => {
  if (toast?.visible) {
    hideToast();
  }
}}
```

### Sound Feedback
```javascript
// Play sound when toast appears (TV has speakers)
showToast({
  message: 'Activity completed',
  playSound: true  // New option for TV
});
```

---

## Future Enhancements (Not Implemented)

### Toast Queue System
```javascript
// Could maintain array of toasts
const [toastQueue, setToastQueue] = useState([]);
// Show one at a time with transitions
```

### Toast Types
```javascript
showToast({
  type: 'success',  // success, error, warning, info
  message: 'Operation successful'
});
// Auto-set colors based on type
```

### Swipe to Dismiss
```javascript
// Add pan gesture recognizer
// Swipe up to dismiss immediately
```

### Progress Toasts
```javascript
showToast({
  message: 'Uploading...',
  progress: 0.5,  // Show progress bar
});
```

---

## Summary

The StackMap toast system is intentionally simple:

1. **Single toast** - No queue, latest wins
2. **Bottom position** - Consistent, reachable
3. **3 second default** - Balanced timing
4. **Optional actions** - Undo, retry, etc.
5. **Theme integrated** - Uses app's current theme color
6. **Animated** - Smooth slide in/out
7. **Accessible** - Tappable, readable

This simplicity makes it reliable, predictable, and easy to maintain across all platforms.

---

## Quick Reference

```javascript
// Basic usage
const { showToast, hideToast } = useToast();

// Show simple toast
showToast({ message: 'Hello!' });

// With all options
showToast({
  message: 'File deleted',
  duration: 5000,
  backgroundColor: '#DC143C',
  action: {
    label: 'UNDO',
    onPress: () => restoreFile()
  }
});

// Hide programmatically
hideToast();
```

That's everything about our toast system. Simple, effective, and just enough functionality without overengineering.