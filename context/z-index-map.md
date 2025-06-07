# Z-Index Stacking Context Map

## Visual Stack (Top to Bottom)

```
┌─────────────────────────────────────┐
│ StackMap Logo (1011)                │ ← Logo must be above all buttons
├─────────────────────────────────────┤
│ Floating Buttons (1010)             │ ← Edit/Preferences buttons
├─────────────────────────────────────┤
│ Drawer Handle (1005)                │ ← Always visible handle
├─────────────────────────────────────┤
│ Preferences Panel (1004)            │ ← Settings overlay
├─────────────────────────────────────┤
│ Header Content (1003)               │ ← Header content layer
├─────────────────────────────────────┤
│ Drawer Extension (1002)             │ ← Drawer content when open
├─────────────────────────────────────┤
│ Header Wrapper (1001)               │ ← Fixed header container
├─────────────────────────────────────┤
│ Drawer Backdrop (999)               │ ← Dark overlay when drawer open
├─────────────────────────────────────┤
│ Main Content/Cards (1)              │ ← Activity cards
└─────────────────────────────────────┘
```

## Detailed Z-Index Values

### 1011 - StackMap Logo
- **Element**: `.stackmap-logo`
- **Location**: `styles/draggable-drawer.css`
- **Why**: Must be visible above floating buttons to prevent overlap
- **Critical**: Logo needs highest z-index to ensure brand visibility

### 1010 - Floating Action Buttons
- **Elements**: `#preferencesBtn`, `#grownupBtn`
- **Location**: `styles/layout.css`
- **Why**: Must always be accessible, even when drawer/panels are open
- **Classes**: `.btn--preferences`, `.btn--grownup-mode`

### 1005 - Drawer Handle
- **Element**: `#drawerHandle`
- **Location**: `styles/draggable-drawer.css`
- **Why**: Must be visible even when drawer has `overflow: hidden`
- **Critical**: Child of drawer but needs to appear outside parent bounds

### 1004 - Preferences Panel
- **Element**: `#preferencesPanel`
- **Location**: `styles/layout.css`
- **Why**: Modal-like overlay that appears above content but below buttons

### 1003 - Native Dropdowns & Floating Buttons
- **Elements**: `.native-dropdown`, Generic `.btn--floating`
- **Location**: `styles/selectors.css`, `styles/layout.css`
- **Why**: Above drawer content but below buttons/handle
- **Critical**: Native dropdowns use this level for both mobile and desktop

### 1002 - Drawer Extension Content
- **Element**: `#drawerExtension`
- **Location**: `styles/draggable-drawer.css`
- **Why**: Above header but below handle and buttons

### 1001 - Header Wrapper
- **Element**: `#headerWrapper`
- **Location**: `styles/layout.css`
- **Why**: Fixed header needs to be above scrolling content

### 999 - Drawer Backdrop
- **Element**: `.drawer-backdrop`
- **Location**: `styles/draggable-drawer.css`
- **Why**: Dark overlay behind drawer, above content

### 998 - Modal Backdrops
- **Elements**: Various modal overlays
- **Location**: `styles/modals.css`
- **Why**: Below drawer system but above content

### 1 - Main Content
- **Elements**: `.card`, `.main-container`
- **Location**: `styles/cards.css`
- **Why**: Base content layer

## Stacking Context Gotchas

### Parent-Child Relationships
```
header-wrapper (1001)
  └── app-header (relative)
      └── drawer-extension (1002)
          └── drawer-handle (1005) ← High z-index needed due to parent
```

### Transform Creates New Context
- Elements with `transform` create new stacking contexts
- Child z-index values are relative to transformed parent
- This affects: cards on hover, floating buttons

### Fixed vs Absolute
- Fixed elements (header-wrapper) create new stacking context
- Absolute children (drawer) are positioned within that context
- Z-index competition happens within each context

## Common Issues & Solutions

### Issue: Element Not Appearing on Top
1. Check parent z-index values
2. Look for `transform` on parents
3. Verify position property (static won't accept z-index)
4. Check for `overflow: hidden` on parents

### Issue: Click Events Not Working
1. Higher z-index element may be blocking
2. Check for invisible overlays (backdrop)
3. Verify pointer-events property

### Issue: Mobile Z-Index Different
1. Check responsive.css for overrides
2. Touch events may behave differently
3. Fixed positioning can change on mobile

## Best Practices

1. **Use CSS Variables**: Define z-index values as variables
2. **Comment Z-Index Values**: Always explain why that specific value
3. **Group Related Values**: Keep similar components in same range
4. **Leave Gaps**: Use 1000, 1001, 1002 not 1, 2, 3 for flexibility
5. **Test Stacking**: Use browser DevTools 3D view to visualize

## Debugging Commands

```javascript
// Show all z-index values
Array.from(document.querySelectorAll('*')).filter(el => {
  const z = getComputedStyle(el).zIndex;
  return z !== 'auto' && z !== '0';
}).map(el => ({
  element: el,
  id: el.id,
  class: el.className,
  zIndex: getComputedStyle(el).zIndex
})).sort((a, b) => b.zIndex - a.zIndex);
```