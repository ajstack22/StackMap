# StackMap Simple - Test Plan

## Quick Testing Guide

### 1. Basic Functionality Test
1. Open `stackmap-simple.html` in browser
2. ✅ Should see 3 default activities (Morning Stretch, Brush Teeth, Get Dressed)
3. ✅ Check off an activity - should get line-through styling
4. ✅ Refresh page - completed state should persist

### 2. Hybrid Menu System Test

#### Left FAB (Preferences) 🎨
1. Click left FAB (palette emoji)
2. ✅ Panel should slide in from left
3. ✅ Should see "Preferences" title
4. ✅ FABs should fade out when panel opens
5. ✅ Click backdrop or × to close
6. ✅ FABs should fade back in

#### Right FAB (Edit Mode) ✏️
1. Click right FAB (pencil emoji)
2. ✅ Panel should slide in from right  
3. ✅ Should see validation question: "What color is the sky?"
4. ✅ Type "blue" and press Enter or Submit
5. ✅ Should switch to edit controls
6. ✅ Should see "Return to User Mode" and "Add Activity" buttons

### 3. Edit Mode Functionality
1. Enter edit mode (answer "blue")
2. Click "Add Activity"
3. ✅ Should get prompt for title
4. ✅ Should get prompt for emoji
5. ✅ Should get prompt for description
6. ✅ New activity should appear in list
7. Click "Return to User Mode"
8. ✅ Should close panel and exit edit mode

### 4. Mobile/Touch Testing
1. Test on mobile device or resize browser to mobile width
2. ✅ FABs should be properly positioned
3. ✅ Panels should be full width on mobile
4. ✅ Touch targets should be easy to hit
5. ✅ Animations should be smooth

### 5. Keyboard Navigation
1. Open any panel
2. Press ESC key
3. ✅ Panel should close
4. ✅ Focus should return to page

### 6. Error Handling
1. Try entering wrong answer to validation
2. ✅ Should show error message
3. ✅ Input should clear for retry

## Expected Results

### Visual Design
- Clean, modern interface with dark theme
- Smooth animations and transitions
- Proper spacing and typography
- Accessible color contrast

### Interaction Model
- Clear separation between user/admin functions
- Intuitive FAB placement and behavior
- Responsive panel system
- Reliable data persistence

### Performance
- Instant loading (single file)
- Smooth 60fps animations
- No layout shift or jank
- Works offline after first load

## Known Limitations (Next Phase)
- No emoji picker UI (uses prompt)
- No theme color changing
- No Today/Tomorrow switching
- No drag-and-drop reordering
- No Google Drive sync

## Success Criteria
✅ All core hybrid menu functionality works  
✅ Edit mode protection prevents child access  
✅ Activity management is functional  
✅ Mobile experience is smooth  
✅ Data persists between sessions  
✅ Code is clean and maintainable  

## Browser Compatibility
- ✅ Chrome/Edge (latest)
- ✅ Safari (iOS/macOS)
- ✅ Firefox (latest)
- ✅ Mobile browsers