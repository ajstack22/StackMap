# Edit Mode Menu Strategy Documentation

## Overview
The EditModeToolbar implements a sophisticated dynamic overflow menu system that adapts to screen size and user preferences. This document explains the strategy in detail.

## Core Architecture

### 1. Action Map Structure
```javascript
const actionMap = {
  users: { label: 'Users', icon: 'group', onPress: onUsers },
  data: { label: 'Data', icon: 'cloud-sync', onPress: onData },
  complete: { label: 'Complete', icon: 'event-available', onPress: onCompleteDay },
  share: { label: 'Share', icon: 'share', onPress: onShare },
  plan: { label: 'Plan', icon: 'event', onPress: onPlan },
  library: { label: 'Library', icon: 'collections-bookmark', onPress: onLibrary },
  add: { label: 'Add', icon: 'add-circle', onPress: onAdd },
  sort: { label: 'Sort', icon: 'sort', onPress: onCustomize, alwaysOverflow: true },
};
```

### 2. Dynamic Width Calculation

The toolbar calculates available space with these considerations:

```javascript
const calculateVisibleButtons = () => {
  // Container padding (varies by device)
  const containerPadding = getContainerPadding() * 2; // Usually 32px * 2
  const buttonPadding = SPACING.xs * 2; // 8px for gaps
  const availableWidth = screenWidth - containerPadding - buttonPadding;
  
  // Fixed element widths
  const minButtonWidth = isTablet() ? 70 : 60;
  const editModeTextWidth = isTablet() ? 100 : 80; // "Edit Mode" label
  const moreButtonWidth = minButtonWidth; // "More" button
  
  // Calculate usable space
  const usableWidth = availableWidth - editModeTextWidth - moreButtonWidth;
  const maxButtons = Math.floor(usableWidth / minButtonWidth);
  
  // Ensure minimum of 3 buttons visible
  return Math.max(3, Math.min(maxButtons, actions.length));
};
```

### 3. Overflow Menu Positioning

The "More" button position affects which actions are visible:

```javascript
const visibleActions = moreButtonPosition === 'left' 
  ? actions.slice(-visibleButtonCount)  // Takes from end when More is left
  : actions.slice(0, visibleButtonCount); // Takes from beginning when More is right
```

**Example with 7 actions and space for 4:**
- More on right: Shows [users, data, complete, share] + More → [plan, library, add]
- More on left: Shows More → [users, data, complete] + [plan, library, add, sort]

### 4. Layout Structure

```
┌────────────────────────────────────────────┐
│             [Theme Color Bar]               │
│                                             │
│              "Edit Mode"                    │
│                                             │
│  [Action] [Action] [Action] [Action] [More] │
└────────────────────────────────────────────┘
```

### 5. Overflow Menu Implementation

The overflow menu is a modal that appears when "More" is tapped:

```javascript
<Modal
  animationType="fade"
  transparent={true}
  visible={showMoreMenu}
  onRequestClose={() => setShowMoreMenu(false)}
>
  <TouchableOpacity
    style={styles.moreMenuOverlay}
    activeOpacity={1}
    onPress={() => setShowMoreMenu(false)}
  >
    <View style={[styles.moreMenuContainer, { backgroundColor: 'white' }]}>
      <FlatList
        data={overflowActions}
        renderItem={renderMoreMenuItem}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.moreMenuSeparator} />}
      />
    </View>
  </TouchableOpacity>
</Modal>
```

## Responsive Behavior

### Phone (< 768px width)
- Container padding: 16px * 2 = 32px
- Button width: 60px minimum
- Edit Mode text: 80px
- Typical visible buttons: 3-5

### Tablet (>= 768px width)
- Container padding: 32px * 2 = 64px  
- Button width: 70px minimum
- Edit Mode text: 100px
- Typical visible buttons: 5-7

### Dynamic Updates
- Listens to Dimensions.change events
- Recalculates on orientation change
- Smooth animations during transitions

## User Customization

### 1. Toolbar Order
Users can customize the order through ToolbarCustomizeModal:
- Drag and drop to reorder
- Saved to device storage
- Respects new order in overflow calculation

### 2. More Button Position
- Can be positioned left or right
- Affects which actions are prioritized
- User preference saved to storage

## Animation Strategy

### Toolbar Entry/Exit
```javascript
Animated.parallel([
  Animated.timing(translateY, {
    toValue: visible ? 0 : (position === 'top' ? -100 : 100),
    duration: 300,
    useNativeDriver: true,
  }),
  Animated.timing(opacity, {
    toValue: visible ? 1 : 0,
    duration: 300,
    useNativeDriver: true,
  })
])
```

### Visual Feedback
- Buttons have activeOpacity of 0.8
- Disabled buttons have opacity 0.6
- More menu has fade animation

## Platform-Specific Adjustments

### iOS
- Bold font weights (fontWeight: '700')
- Larger shadows
- PageSheet modal presentation

### Android
- Normal font weights with bold font family
- Material elevation
- Slightly more padding

### Web
- Smaller font sizes (11px vs 12px)
- Tighter spacing
- Hover states supported

## Edge Cases Handled

1. **No custom order**: Falls back to default order
2. **Very small screens**: Guarantees minimum 3 buttons
3. **All actions fit**: More button hidden
4. **Single action overflow**: Still shows More button
5. **Orientation changes**: Smooth recalculation

## Best Practices for New Actions

When adding new toolbar actions:

1. Add to actionMap with unique ID
2. Provide label (short, 1 word preferred)
3. Use MaterialIcons icon
4. Include onPress handler
5. Consider if it should be alwaysOverflow
6. Add to default order array
7. Test on smallest supported screen

## Common Issues & Solutions

### Issue: Buttons getting cut off
**Solution**: Check containerPadding calculation and ensure minButtonWidth accounts for label

### Issue: More menu not showing all items
**Solution**: Verify overflowActions calculation includes items not in visibleActions

### Issue: Layout jump on orientation change
**Solution**: Ensure Dimensions listener is properly set up and cleanup on unmount

### Issue: Custom order not persisting
**Solution**: Check AsyncStorage key and ensure setToolbarOrder is called correctly

This strategy ensures a flexible, responsive toolbar that works across all devices while maintaining a clean, accessible interface for neurodivergent users.