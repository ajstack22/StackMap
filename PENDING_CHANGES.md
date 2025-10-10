## Title: Fix web UI issues - red text in edit mode and FAB positioning

### Changes Made:
- Fixed day text not showing red in edit mode on web
  - Modified Typography component to flatten style arrays before applying font family
  - Prevents nested arrays from causing style resolution issues on web platform
  - Ensures color overrides from subtitleDayEdit style are properly applied
  - Added StyleSheet.flatten() call in both Text and TextInput components
- Fixed FAB buttons overlapping header bottom edge on web
  - Adjusted FAB top position from 25px to 20px for better visual centering
  - FABs now sit properly on the 110px header without overlapping bottom edge
  - Maintains proper visual balance and alignment

### Files Modified:
- /Users/adamstack/StackMap/StackMap/src/components/Typography/index.js
- /Users/adamstack/StackMap/StackMap/App.js

### Testing:
- Verify day text appears in red (COLORS.semantic.error = #f44336) when in edit mode on web
- Verify FAB buttons are visually centered on header bar without overlapping bottom edge
- Test on iOS and Android to ensure no regressions from Typography changes
