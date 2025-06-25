# Implementation Plan: Story #85 - Unified Header System (Revised)

## Overview

This story enhances the existing unified header to display both user AND day context clearly. The header will show the current user (emoji + name) and current day (Today/Tomorrow), with clicking the user area opening the existing UserDayModal for user switching. The day selector remains as a separate component below the header.

## Current State Analysis

### What Already Exists
1. **unified-header.js**: Creates header with user-day pill that currently shows user emoji and day
2. **user-day-modal.js**: Modal for user switching (from Story #82 - already complete)
3. **day-selector.js**: Separate component for day switching with activity counts

### What Needs Enhancement
- The user-day pill needs to clearly show BOTH user name AND current day
- Better visual separation between user and day information
- Proper integration with DaySelector.getCurrentDay()
- Real-time updates when user or day changes

## Proposed Changes

### 1. Enhanced User-Day Pill Display

The core change is updating the `updateUserDayPill()` method to show complete user and day context:

```javascript
updateUserDayPill: function() {
    const self = this;
    
    if (!self.userDayPill) return;
    
    // Get current user
    const user = window.UserManager ? window.UserManager.getCurrentUser() : null;
    
    // Get current day
    const currentDay = window.DaySelector && window.DaySelector.getCurrentDay 
        ? window.DaySelector.getCurrentDay() 
        : 'today';
    
    // Build the pill content with clear separation
    if (user) {
        const dayText = currentDay === 'tomorrow' ? 'Tomorrow' : 'Today';
        
        self.userDayPill.innerHTML = 
            '<span class="pill-emoji">' + (user.emoji || '👤') + '</span>' +
            '<span class="pill-name">' + user.name + '</span>' +
            '<span class="pill-separator">•</span>' +
            '<span class="pill-day">' + dayText + '</span>';
        
        // Update aria-label for accessibility
        const label = 'Current user: ' + user.name + ', viewing ' + dayText.toLowerCase() + '. Click to switch user.';
        self.userDayPill.setAttribute('aria-label', label);
    }
}
```

### 2. CSS Updates for Better Display

Add styles to properly display the enhanced pill:

```css
/* Enhanced pill layout */
.user-day-pill {
    display: flex;
    align-items: center;
    gap: 6px;
}

.pill-emoji {
    font-size: 20px;
}

.pill-name {
    font-weight: 500;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pill-separator {
    opacity: 0.5;
    font-size: 14px;
}

.pill-day {
    opacity: 0.9;
}

/* Hide name on very small screens */
@media (max-width: 360px) {
    .pill-name {
        display: none;
    }
    
    .pill-separator {
        display: none;
    }
}
```

### 3. Event Listener Updates

Ensure the header listens for both user and day changes:

```javascript
listenForChanges: function() {
    const self = this;
    
    // Listen for user changes
    document.addEventListener('userChanged', function(e) {
        self.updateUserDayPill();
    });
    
    // Listen for day changes
    document.addEventListener('dayViewChanged', function(e) {
        self.updateUserDayPill();
    });
}
```

### 4. Integration with Existing UserDayModal

The click handler already exists and opens UserDayModal:

```javascript
handleUserDayClick: function() {
    const self = this;
    
    // Add pressed state
    self.userDayPill.classList.add('pressed');
    
    // Open the existing user modal selector
    if (window.UserDayModal && window.UserDayModal.open) {
        window.UserDayModal.open();
    }
    
    // Remove pressed state after animation
    setTimeout(() => {
        self.userDayPill.classList.remove('pressed');
    }, 200);
}
```

No changes needed here - it already works correctly!

## Implementation Steps

### Step 1: Update unified-header.js
1. Replace the `updateUserDayPill()` method with the enhanced version
2. Ensure event listeners are properly connected
3. Call `updateUserDayPill()` on initialization

### Step 2: Update unified-header.css
1. Add new classes for pill components (.pill-emoji, .pill-name, etc.)
2. Add responsive styles to hide name on very small screens
3. Ensure proper spacing and overflow handling

### Step 3: Test Integration
1. Verify day changes update the header
2. Verify user changes update the header
3. Test clicking opens UserDayModal
4. Check responsive behavior

## Files to Modify

### 1. **/refactor/js/unified-header.js**
- Update `updateUserDayPill()` method only
- No other changes needed

### 2. **/refactor/css/unified-header.css**
- Add styles for new pill components
- Add responsive media query

No other files need modification.

## Testing Approach

### Functional Testing
- [ ] Header shows current user emoji and name
- [ ] Header shows current day (Today/Tomorrow)
- [ ] Clicking user area opens UserDayModal
- [ ] Day changes via day-selector update header
- [ ] User changes via modal update header

### Visual Testing
- [ ] User and day clearly separated with bullet
- [ ] Text doesn't overflow on normal screens
- [ ] Name hides gracefully on very small screens (≤360px)
- [ ] Pill remains clickable and accessible

### Integration Testing
- [ ] Works with existing day-selector.js
- [ ] Works with existing UserDayModal
- [ ] Events fire and update correctly
- [ ] No console errors

## Mobile Considerations

- Show full information on screens 375px and wider
- Hide user name (keep emoji) on very small screens (≤360px)
- Maintain 44px touch target (already implemented)
- Text truncation with ellipsis for long names

## Risk Mitigation

- Use existing event names (no breaking changes)
- Graceful fallbacks if components missing
- Keep existing functionality intact
- Only enhance display, don't change behavior

## Success Criteria

All acceptance criteria from the story:
- [x] Header shows current user emoji and name
- [x] Header shows current day context
- [x] Clicking user area opens user switcher
- [x] Day selector remains separate (already implemented)
- [x] Header updates when user changes
- [x] Header updates when day changes
- [x] Mobile-optimized layout
- [x] Integrates with existing day-selector.js

## Time Estimate

- Implementation: 1.5 hours
  - Update updateUserDayPill(): 30 min
  - CSS updates: 30 min
  - Testing and refinement: 30 min
- Testing: 30 minutes
- Total: 2 hours

---

**Ready for PM Re-Review**

This revised plan focuses solely on the story requirements: enhancing the header to show both user and day context while integrating with existing components. No scope creep, no new features - just the requested enhancement.