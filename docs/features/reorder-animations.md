# Activity Reordering Animations

## Overview
Smooth animations have been added to the activity reordering functionality to provide better visual feedback and reduce disorientation when moving cards.

## Implementation Approach

### Platform-Specific Strategy
Following the guidance from `/docs/platform/CROSS_PLATFORM_GUIDE.md` and `/docs/features/edit-mode-refactor.md`, we implement animations that respect each platform's capabilities:

- **iOS**: Uses `LayoutAnimation.Presets.easeInEaseOut` for optimal performance (200-250ms duration)
- **Android**: Uses custom spring animation with `LayoutAnimation` when available
- **Web**: Uses CSS transitions for smooth movement

### Animation Configuration

#### Core Animation Module (`/src/components/EditModeList/utils.js`)
```javascript
export const configureReorderAnimation = () => {
  // Custom spring animation for natural movement
  const customAnimation = {
    duration: 250,
    update: {
      type: LayoutAnimation.Types.spring,
      springDamping: 0.8,
      duration: 250,
    },
  };
  
  // Platform-appropriate implementation
  if (Platform.OS === 'ios') {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  } else if (Platform.OS === 'android') {
    LayoutAnimation.configureNext(customAnimation);
  }
  // Web uses CSS transitions defined in styles
};
```

#### Web CSS Transitions (`/src/components/EditModeList/styles.js`)
```javascript
web: {
  transition: 'all 0.25s ease-in-out',
  willChange: 'transform',
}
```

### Integration Points

The animation is triggered in `/src/hooks/useEditMode.js` whenever activities are reordered:

1. **Move Up/Down**: Smooth transition when using arrow buttons
2. **Delete**: Graceful collapse of deleted items
3. **Batch Operations**: Coordinated animations for multiple changes

### User Experience Benefits

1. **Visual Continuity**: Users can track where items move to
2. **Reduced Cognitive Load**: Smooth transitions help maintain spatial awareness
3. **Professional Feel**: Polished animations enhance perceived app quality
4. **Platform Consistency**: Each platform gets optimal animation performance

### Performance Considerations

- **iOS**: Limited to 200-250ms duration per `/docs/platform/ios/README.md` performance guidelines
- **Android**: LayoutAnimation experimental feature enabled only when available
- **Web**: CSS transitions are GPU-accelerated for smooth 60fps animation

### Testing Checklist

- [ ] Move single card up - smooth transition
- [ ] Move single card down - smooth transition  
- [ ] Move multiple cards in sequence - no jumping
- [ ] Delete card - graceful collapse
- [ ] Batch delete - coordinated animation
- [ ] Test on iOS device - native feel
- [ ] Test on Android device - spring animation works
- [ ] Test on Web - CSS transitions smooth

## Related Documentation

- `/docs/features/edit-mode-refactor.md` - Edit mode design principles
- `/docs/platform/CROSS_PLATFORM_GUIDE.md` - Platform-specific animation strategy
- `/docs/platform/ios/README.md` - iOS performance guidelines
- `/docs/platform/android/README.md` - Android animation considerations

## Future Enhancements

1. **Gesture-based reordering**: Add drag-and-drop on platforms that support it reliably
2. **Stagger animations**: Cascade effect for batch operations
3. **Accessibility options**: Reduce motion setting for users who prefer less animation