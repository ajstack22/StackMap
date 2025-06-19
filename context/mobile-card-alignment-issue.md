# Mobile Card Alignment Issue

## Problem Statement
Activity cards appear misaligned on mobile devices - they are "scooched to the right" instead of being properly centered. This creates an unbalanced visual appearance and poor user experience on mobile viewports.

## Visual Description
- Cards appear shifted to the right side of the screen
- Left margin appears smaller than right margin
- Not properly centered within the mobile viewport
- Issue is specifically noticeable on mobile devices (not desktop)

## Expected Behavior
- Cards should be horizontally centered on mobile screens
- Equal margins on left and right sides
- Balanced visual appearance
- Consistent with desktop centering behavior

## Potential Causes to Investigate
1. **Container padding/margin asymmetry** - Check main-container padding
2. **Card grid alignment** - Verify CSS grid or flexbox centering
3. **Transform effects** - Any translateX causing offset
4. **Overflow issues** - Hidden overflow cutting off left side
5. **FAB interference** - Floating buttons affecting layout
6. **Viewport/scaling** - Mobile viewport meta tag issues

## Files to Check
- `/styles/cards.css` - Card styling and layout
- `/styles/layout.css` - Main container and grid system  
- `/styles/responsive.css` - Mobile-specific overrides
- `/index.html` - Viewport meta tag configuration

## Testing Requirements
- Test on actual mobile devices (not just browser DevTools)
- Check multiple screen sizes (phone vs tablet)
- Verify in both portrait and landscape orientations
- Test with different numbers of cards (1, 2, many)
- Check both "Today" and "Tomorrow" views

## Priority
**HIGH** - This affects the primary content display on mobile, which is a critical user experience issue for a PWA targeting mobile app stores.

## Success Criteria
- Cards perfectly centered on all mobile viewports
- Equal left and right margins
- No horizontal scrolling
- Consistent alignment across all mobile devices
- Maintains proper spacing with FAB and other UI elements