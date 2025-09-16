# Web Platform 3-Column Layout Documentation

## Critical Issue: Card Grid Layout on Web

### The Problem
The main screen activity cards were displaying in 2 columns instead of 3 on desktop (1280px width), despite `calculateColumns()` correctly returning 3.

### Root Cause
The issue was in `App.js` lines 4825-4837 where the web platform card wrapper styles were incorrectly configured:

```javascript
// WRONG - This causes cards to expand to maxWidth instead of fitting 3 columns
Platform.OS === 'web' ? {
  flexBasis: numColumns > 1 ? 'auto' : '100%',
  width: numColumns === 1 ? '100%' : undefined,  // ← BUG: undefined width!
  maxWidth: numColumns === 1 ? CARD_LAYOUT.singleColumnMaxWidth : CARD_LAYOUT.maxWidth,
}
```

With `width: undefined` and `maxWidth: 450px`, cards expanded to 450px each. At 1280px viewport, only 2 cards at 450px fit, resulting in 2 columns.

### The Solution
Use explicit percentage widths for multi-column layouts:

```javascript
// CORRECT - Cards are properly sized for their column count
Platform.OS === 'web' ? {
  flexBasis: numColumns === 3 ? '31%' : numColumns === 2 ? '48%' : '100%',
  width: numColumns === 3 ? '31%' : numColumns === 2 ? '48%' : '100%',
  maxWidth: numColumns === 1 ? CARD_LAYOUT.singleColumnMaxWidth : undefined,
}
```

### Why This Was Hard to Find

Multiple components render cards in different contexts:
1. **Main Screen Cards** (App.js) - The actual issue location
2. **Activity Library Cards** (ActivityGrid.js) - A different component entirely
3. **Edit Mode Cards** (EditModeList/) - Separate edit interface
4. **Category Cards** (ActivityLibrary/) - Library management interface

Previous attempts incorrectly modified ActivityGrid.js because:
- It also renders cards in a grid
- It's named "ActivityGrid" suggesting it controls the main grid
- It has similar layout logic
- BUT it only affects the Activity Library modal, NOT the main screen

**Note:** ActivityGrid.js has since been renamed to LibraryActivityGrid.js to prevent this confusion in the future. See [component naming conventions](./component-naming-conventions.md) for details.

### Key Files and Their Purposes

| File | Purpose | Affects Main Screen? |
|------|---------|---------------------|
| App.js lines 4790-4870 | Main screen card grid layout | ✅ YES |
| src/constants/layout.js | Column calculation logic | ✅ YES |
| src/components/ActivityLibrary/LibraryActivityGrid.js | Library modal grid | ❌ NO |
| src/components/EditModeList/ | Edit mode interface | ❌ NO |

### Platform-Specific Considerations

#### Web Platform
- Must use percentage widths for flexbox grid
- 3 columns: 31% width (allows for margins)
- 2 columns: 48% width
- 1 column: 100% width

#### Android Platform
- Already uses 48% width for 2 columns (lines 4846-4853)
- Has extensive comments about flexWrap requirements

#### iOS Platform
- Uses calculateCardWidth() for most layouts
- Special handling for iPad portrait mode

### Testing the Fix

1. Open http://localhost:5503 in a 1280px wide browser
2. Main screen should show 3 columns of activity cards
3. Resize to test responsive breakpoints:
   - ≥1200px: 3 columns
   - 768-1199px: 2 columns
   - <768px: 1 column

### Lessons Learned

1. **Always trace the actual rendering path** - Don't assume component names indicate their usage
2. **Check where styles are actually applied** - The issue was in inline styles, not StyleSheet
3. **Understand flexbox behavior** - `width: undefined` with `maxWidth` doesn't constrain to columns
4. **Read existing comments** - The Android section had detailed notes about percentage widths being critical

### DO NOT MODIFY
- LibraryActivityGrid.js (unless specifically working on Activity Library modal)
- The Android percentage width logic (extensively tested and documented)
- The calculateColumns() function (it was working correctly all along)