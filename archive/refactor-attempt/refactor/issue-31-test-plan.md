# Issue #31: Drag & Drop Testing Plan

## Prerequisites
1. Open `/refactor/index.html` in a web browser
2. Create at least 3 test tasks for reordering
3. Have browser dev tools open to monitor console

## Test Scenarios

### 1. Edit Mode Integration Test
**Steps:**
1. Try to drag a task card (should not work)
2. Click the edit mode toggle (✏️ icon)
3. Wait for "Edit Mode Active" banner
4. Try to drag again (should now work with 400ms press)

**Expected:**
- No drag in view mode ✅
- Drag works only in edit mode ✅
- Edit mode banner shows timer countdown

### 2. Long-Press Visual Feedback Test
**Steps:**
1. Enable edit mode
2. Press and hold a task card
3. Observe visual changes:
   - 0-400ms: Card scales down slightly (preparing-drag)
   - 400ms: Card scales up, shadow increases (ready-to-drag)
   - Release to cancel or move to start dragging

**Expected:**
- Smooth scale animation during press ✅
- Clear visual state change at 400ms ✅
- Haptic feedback on mobile at 400ms

### 3. Scroll vs Drag Conflict Test
**Steps:**
1. Enable edit mode
2. Start pressing a card
3. Before 400ms, move finger/mouse > 10px
4. Verify natural scroll happens (no drag)

**Expected:**
- Movement cancels drag preparation ✅
- Natural scrolling preserved ✅
- No accidental drags during scroll

### 4. Drag and Drop Flow Test
**Steps:**
1. Enable edit mode
2. Long-press (400ms) on middle task
3. Drag up/down to reorder
4. Observe:
   - Dragged card follows cursor
   - Drop zones appear between cards
   - Placeholder shows drop position
5. Release to drop

**Expected:**
- Smooth drag movement ✅
- Clear drop indicators ✅
- Cards animate to new positions

### 5. Order Persistence Test
**Steps:**
1. Enable edit mode
2. Reorder tasks (e.g., move #3 to #1)
3. Refresh the page
4. Verify new order is maintained

**Expected:**
- Order saves immediately ✅
- Persists across sessions ✅
- No data loss on refresh

### 6. Auto-Scroll Test
**Steps:**
1. Add 10+ tasks to create scrollable list
2. Enable edit mode
3. Drag a task near top/bottom edge
4. Hold position to trigger auto-scroll

**Expected:**
- Auto-scroll activates near edges ✅
- Smooth scrolling at ~12px/frame ✅
- Drop zones update during scroll

### 7. Cancel Operations Test
**Steps:**
1. Start dragging a task
2. Test cancel methods:
   - Press ESC key
   - Multi-touch (mobile)
   - Drag outside container

**Expected:**
- All cancel methods work ✅
- Card returns to original position ✅
- No order changes saved

### 8. Edge Cases Test
**Steps:**
1. Test with single task (no reorder possible)
2. Test drag to very top/bottom
3. Test rapid successive drags
4. Test with 50+ tasks (performance)

**Expected:**
- Graceful handling of edge cases ✅
- No console errors ✅
- Performance remains smooth

### 9. Platform-Specific Tests

#### Mobile (Touch)
- Long-press works reliably
- Haptic feedback triggers
- Multi-touch cancels drag
- Scroll remains smooth

#### Desktop (Mouse)
- Click and hold initiates drag
- Cursor changes to grab/grabbing
- ESC key cancels
- Mouse wheel scrolls normally

### 10. Accessibility Test
**Steps:**
1. Enable screen reader
2. Enable edit mode
3. Perform drag operation
4. Listen for announcements

**Expected:**
- "Started dragging [task title]" ✅
- "Moved [task title]" on drop ✅
- Focus management correct

### 11. Safe Mode Test
**Steps:**
1. Add `?safe=true` to URL
2. Try all drag operations

**Expected:**
- No drag functionality in safe mode ✅
- No visual drag states shown ✅
- Edit mode still toggles but drag disabled

## Performance Metrics
- Drag start latency: < 50ms after 400ms press
- Frame rate during drag: 60fps target
- Auto-scroll smoothness: No jank
- Memory usage: Stable during extended use

## Browser Compatibility
Test on:
- [ ] Chrome/Edge (latest)
- [ ] Safari (iOS & macOS)
- [ ] Firefox
- [ ] Android Chrome
- [ ] Android WebView (older devices)

## Bug Report Template
If issues found:
```
**Issue**: [Brief description]
**Steps**: [Numbered steps to reproduce]
**Expected**: [What should happen]
**Actual**: [What actually happens]
**Device**: [Browser, OS, device type]
**Console errors**: [Any errors]
```

## Success Criteria
- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Performance meets targets
- [ ] Works on all target platforms
- [ ] Accessibility features functional