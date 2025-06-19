# Launch Prompt: Mobile Card Alignment Fix

## Quick Launch for uxC

Copy and paste this into a new Claude conversation:

```
I need you to fix a mobile UI alignment issue in the StackMap PWA. The activity cards are not properly centered on mobile devices - they appear "scooched to the right" with uneven left/right margins.

Context file with issue details: [drag in context/mobile-card-alignment-issue.md]
Current codebase: [drag in StackMap folder]

Your task:
1. Investigate why cards are shifted right on mobile viewports
2. Fix the CSS to properly center cards with equal margins
3. Test on multiple mobile screen sizes
4. Ensure the fix doesn't break desktop layout
5. Maintain all accessibility requirements (44px touch targets)

Key files to check:
- /styles/cards.css
- /styles/layout.css  
- /styles/responsive.css
- /styles/variables.css

Please provide:
- Root cause analysis
- Specific CSS changes needed
- Before/after screenshots if possible
- Testing instructions

Remember: Do NOT create new CSS files. Work within the existing CSS module system documented in context/css-module-map.md
```

## Additional Context for pmC

This is a high-priority visual bug affecting the primary mobile experience. The Android TWA app is ready to launch but this alignment issue makes the app look unprofessional on mobile devices.

Success criteria:
- Cards perfectly centered on ALL mobile devices
- No horizontal scrolling
- Equal left/right margins
- Works in both portrait and landscape
- Doesn't interfere with FAB positioning