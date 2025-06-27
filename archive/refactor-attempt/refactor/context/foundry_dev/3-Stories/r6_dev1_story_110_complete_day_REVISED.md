# Round 6 Dev 1 - Story #110: Complete Day Workflow (REVISED PRIORITY)
## MOVED TO ROUND 6 - CRITICAL DAILY PLANNING FEATURE

### Story Overview
**Priority**: CRITICAL - Core daily planning ritual  
**Developer**: Dev 1 (after Story #101 completion)  
**Estimated Effort**: 2 days  
**Dependencies**: Story #108 (Day Management) should be started  

### Problem Statement
The "Complete Day" button exists but doesn't implement the workflow that makes StackMap unique. This workflow is the daily planning ritual that helps ADHD users maintain momentum: move tomorrow's plans to today, keep pinned items for tomorrow, clear the rest. Without this, users must manually recreate their daily planning, defeating StackMap's purpose.

### Legacy Context
In original StackMap, "Complete Day" was THE transition ritual:
1. User reviews today (usually in evening)
2. Clicks "Complete Day" 
3. Tomorrow's activities slide to today
4. Pinned activities stay in tomorrow for next day
5. Unpinned activities in tomorrow are cleared
6. User now sees tomorrow's plan as today, empty tomorrow ready for planning

This created a natural daily rhythm and prevented activity buildup.

### Acceptance Criteria

#### ✅ **Core Workflow**
- [ ] Get all activities from tomorrow
- [ ] Move all tomorrow activities to today (change timeframe)
- [ ] Create new copies of pinned activities for tomorrow
- [ ] Delete unpinned activities from original tomorrow list
- [ ] Maintain activity order during transfer
- [ ] Generate new IDs for copied pinned activities
- [ ] Update UI to show changes immediately

#### ✅ **Confirmation Dialog**
- [ ] Modal appears on "Complete Day" click
- [ ] Shows preview of what will happen:
  ```
  Complete Today?
  
  This will:
  • Move 7 activities from tomorrow to today
  • Keep 3 pinned activities for tomorrow  
  • Remove 4 unpinned activities from tomorrow
  
  [Cancel] [Complete Day]
  ```
- [ ] Cancel closes modal, no changes
- [ ] Confirm triggers the workflow
- [ ] Loading state during processing

#### ✅ **Visual Feedback**
- [ ] Activities animate sliding from tomorrow to today
- [ ] Smooth transition, not jarring refresh
- [ ] Success toast: "Day completed! Tomorrow's activities are now today's."
- [ ] If on tomorrow view, auto-switch to today view
- [ ] Visual indication of changes (brief highlight)

#### ✅ **Undo System**
- [ ] 10-second undo window after completion
- [ ] Toast notification with countdown
- [ ] "Day completed [Undo]" message
- [ ] Full state restoration on undo
- [ ] After timeout, undo no longer available

#### ✅ **Edge Cases**
- [ ] Empty tomorrow: "No activities to move from tomorrow"
- [ ] Today at capacity (50): "Cannot complete day - today is full"
- [ ] Only pinned in tomorrow: "All tomorrow activities are pinned"
- [ ] During day transition: Disable at 11:50 PM - 12:10 AM
- [ ] No activities at all: Hide complete day button

#### ✅ **Data Integrity**
- [ ] Transaction-based to prevent partial completion
- [ ] Rollback on any error
- [ ] Preserve all activity metadata
- [ ] Update timestamps appropriately
- [ ] Maintain user associations

### Technical Implementation

#### **Modified Files**
- `js/complete-day.js` - Enhance existing file
- `js/activity-display.js` - Refresh after completion
- `js/activity-pin.js` - Check pin status for copying
- `js/undo-manager.js` - Register complete day command

#### **New Functions**
```javascript
CompleteDay = {
  // Check if completion is possible
  canCompleteDay() => boolean,
  
  // Show confirmation modal
  showConfirmation() => Promise<boolean>,
  
  // Execute the workflow
  executeCompletion() => Promise<CompletionResult>,
  
  // Preview what will happen
  getCompletionPreview() => {
    movingToToday: Activity[],
    stayingPinned: Activity[],
    beingRemoved: Activity[]
  },
  
  // Undo support
  createUndoCommand(beforeState, afterState) => Command
}
```

#### **Database Operations**
```javascript
// Atomic transaction for safety
BEGIN TRANSACTION;
  -- Move all tomorrow to today
  UPDATE activities SET timeframe = 'today' WHERE timeframe = 'tomorrow';
  
  -- Insert copies of pinned for tomorrow
  INSERT INTO activities (copies of pinned with new IDs, timeframe = 'tomorrow');
  
  -- Delete unpinned from tomorrow (already moved)
  -- (No action needed - they were moved in first UPDATE)
COMMIT;
```

### User Experience Flow

#### **Happy Path**
1. User has completed most of today's activities
2. User clicks "Complete Day" button
3. Confirmation modal shows clear preview
4. User confirms
5. Smooth animation shows activities moving
6. Success toast with undo option
7. User sees tomorrow's plan now as today

#### **Undo Flow**
1. After completion, toast appears with countdown
2. User realizes mistake, clicks "Undo"
3. All changes reverse instantly
4. Toast confirms "Day completion undone"

### Visual Design

#### **Confirmation Modal**
```
┌─────────────────────────────────┐
│        Complete Today?          │
├─────────────────────────────────┤
│ This will prepare tomorrow's    │
│ activities for today:           │
│                                 │
│ ➡️ Move 7 activities to today   │
│ 📌 Keep 3 pinned for tomorrow   │
│ 🗑️ Remove 4 unpinned activities │
│                                 │
│ [Cancel]     [Complete Day →]   │
└─────────────────────────────────┘
```

#### **Success Toast**
```
✅ Day completed! Tomorrow is now today. [Undo (9s)]
```

### Accessibility

- [ ] Modal trapped focus
- [ ] Escape key cancels modal
- [ ] Enter key confirms when focused on button
- [ ] Screen reader announces all changes
- [ ] Countdown announced every 3 seconds
- [ ] High contrast mode compatible

### Performance

- [ ] Completion executes in <500ms
- [ ] Animation doesn't block interaction
- [ ] Large lists (50+ items) handled smoothly
- [ ] No UI freezing during operation
- [ ] Optimistic UI updates with rollback

### Testing Scenarios

1. **Standard Day**: Mix of pinned/unpinned activities
2. **All Pinned**: Every tomorrow activity is pinned
3. **No Pins**: No activities are pinned
4. **Empty Tomorrow**: No activities in tomorrow
5. **Full Today**: Today already has 50 activities
6. **Rapid Undo**: User undoes immediately
7. **Timeout**: User waits past undo window

### Success Metrics

1. Users understand what will happen before confirming
2. Workflow completes without data loss
3. Undo successfully restores exact previous state
4. No activities are duplicated or lost
5. Performance meets targets on mobile

### Definition of Done

- [ ] Complete day moves tomorrow to today correctly
- [ ] Pinned activities copied back to tomorrow
- [ ] Unpinned activities removed from tomorrow
- [ ] Confirmation modal clearly explains changes
- [ ] Undo system fully functional with countdown
- [ ] All edge cases handled gracefully
- [ ] Animations smooth on mobile devices
- [ ] Accessibility requirements met
- [ ] Database operations are atomic
- [ ] Tests cover all scenarios

---

**This story restores the daily planning ritual that makes StackMap indispensable for ADHD users managing their daily activities.**