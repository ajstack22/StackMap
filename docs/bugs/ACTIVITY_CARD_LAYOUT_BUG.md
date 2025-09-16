# Activity Card Layout Bug Report
**Date:** 2025-09-16
**Severity:** High
**Status:** Active Investigation

## Bug Description
Activity cards in the ActivityLibrary component are displaying incorrectly on localhost compared to the production deployment on qual. Cards are appearing in a 2-column grid layout instead of single full-width rows.

## Current Symptoms

### Localhost (Port 5503) - INCORRECT
- First row: 2 cards with DIFFERENT widths
- Subsequent rows: 2 cards per row, all 450px width
- Cards appear to be in a grid/flexWrap layout
- Max-width constraint of 375px is NOT being respected

### Qual Environment (Version 2025.09.06.34) - CORRECT
- Single cards per row
- Consistent width of ~374.66px
- Full-width rows within container
- No grid/column layout

## Version Information
- **Local Version:** 2025.09.16.1
- **Qual Version:** 2025.09.06.34 (significantly behind)
- **Last Known Good:** Commit 05c72415

## File Structure Changes
Since the qual version, the ActivityLibrary has been modularized:
- Original: Single `ActivityLibrary.js` file (2,576 lines)
- Current: Split into 25+ modules including:
  - `LibraryActivityGrid.js` - Handles activity display logic
  - `LibraryActivityCard.js` - Individual card component
  - `CategorySectionComponent.js` - Category wrapper

## Attempted Fixes (Chronological)

### Attempt 1: Add Grid Layout with FlexWrap
**Files Modified:** LibraryActivityCard.js, LibraryActivityGrid.js
**Changes:**
- Added `flexWrap: 'wrap'` to container
- Added percentage widths (48% mobile, 31% tablet)
- Added `alignContent: 'flex-start'` for Android
**Result:** No change reported by user

### Attempt 2: Remove Grid Layout
**Files Modified:** LibraryActivityCard.js, LibraryActivityGrid.js
**Changes:**
- Removed all width constraints from ActivityCard
- Removed flexWrap container
- Reverted to full-width rows
**Result:** No change

### Attempt 3: Add Max-Width Constraints
**Files Modified:** ActivityGrid.js, CategorySectionComponent.js
**Changes:**
- Added `maxWidth: 375px` to activitiesContainer
- Added `width: '100%'` to ensure full width within container
- Added `alignSelf: 'center'` for centering
**Result:** No change

### Attempt 4: Fix Container Hierarchy
**Files Modified:** CategorySectionComponent.js
**Changes:**
- Added maxWidth to `activitiesList` style
- Ensured proper constraint at animated container level
**Result:** No change

### Attempt 5: Remove Duplicate Containers
**Files Modified:** ActivityGrid.js
**Changes:**
- Removed duplicate maxWidth container
- Removed unused grid styles
- Simplified to single View wrapper
**Result:** No change

### Attempt 6: Force Vertical Layout
**Files Modified:** ActivityGrid.js
**Changes:**
- Wrapped cards in View with `flexDirection: 'column'`
- Added explicit `activityListContainer` style
- Ensured `width: '100%'` on container
**Result:** No change (current state)

## CSS/Style Analysis

### Expected Styles (from Qual)
```javascript
activityRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: COLORS.gray[50],
  padding: SPACING.md,
  marginBottom: SPACING.xs,
  borderRadius: RADIUS.lg,
  ...SHADOWS.level1,
  // NO width constraints
  // NO flexWrap in parent
}
```

### Current Styles Applied
```javascript
// CategorySectionComponent.js
activitiesList: {
  overflow: 'hidden',
  maxWidth: 375,
  width: '100%',
  alignSelf: 'center',
}

// ActivityGrid.js
activityListContainer: {
  flexDirection: 'column',
  width: '100%',
}

// ActivityCard.js
activityRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: COLORS.gray[50],
  padding: SPACING.md,
  marginBottom: SPACING.xs,
  borderRadius: RADIUS.lg,
  width: '100%',
  ...SHADOWS.level1,
}
```

## Component Hierarchy
```
ActivityLibrary
└── View (contentWrapper)
    └── CategorySectionComponent
        └── Animated.View (activitiesList - maxWidth: 375)
            └── ActivityGrid
                └── View (activityListContainer - flexDirection: column)
                    └── ActivityCard[] (activityRow - width: 100%)
```

## Browser DevTools Observations
- Local: `div.css-view-g5y9jx.r-transitionProperty-1i6wzkk` showing 438.2×320
- Qual: `div.css-g5y9jx.r-1i6wzk k.r-lrvibr` showing 374.66×320
- Cards on localhost are 450px wide (exceeding max-width constraint)

## Webpack/Build Information
- Webpack successfully compiling changes
- Server running on port 5503
- No build errors reported
- Browser cache cleared multiple times

## Hypothesis
1. **CSS cascade issue**: Styles may be overridden by react-native-web generated classes
2. **Parent container issue**: A parent element may have display:flex with row direction
3. **Build/compilation issue**: Webpack may not be applying styles correctly
4. **Module loading order**: Modularization may have changed style application order

## Next Investigation Steps
1. Inspect computed styles in DevTools for each card
2. Check if react-native-web is generating conflicting CSS classes
3. Verify style inheritance chain from parent containers
4. Test with inline styles to bypass StyleSheet
5. Compare bundled CSS between local and qual builds

## Related Files
- `/src/components/ActivityLibrary/ActivityGrid.js`
- `/src/components/ActivityLibrary/ActivityCard.js`
- `/src/components/ActivityLibrary/CategorySectionComponent.js`
- `/src/components/ActivityLibrary/ActivityLibrary.js`

## Test Failures
- 155 test failures after modularization (may be related)
- Primarily mock-related issues with Animated.parallel
- Tests not blocking functionality but may indicate deeper issues