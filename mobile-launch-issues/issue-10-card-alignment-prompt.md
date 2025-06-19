# Launch Prompt: Fix GitHub Issue #10 - Mobile Card Alignment

## Quick Launch for uxC

Copy and paste this into a new Claude conversation:

```
I need you to implement GitHub issue #10 for the StackMap project:
https://github.com/ajstack22/StackMap/issues/10

This is a high-priority bug where activity cards are not properly centered on mobile devices - they appear "scooched to the right" with uneven margins.

Current codebase: [drag in StackMap folder]

Your task:
1. Investigate the root cause of the right-shifted cards on mobile
2. Fix the CSS to properly center cards with equal left/right margins
3. Ensure the fix works across all mobile screen sizes and orientations
4. Maintain all existing functionality (FAB positioning, touch targets, etc.)
5. Do NOT create new CSS files - work within the existing module system

Critical constraints:
- Must maintain 44px+ touch targets for accessibility
- Cannot break desktop layout
- Must work in both Today and Tomorrow views
- Should handle 1, 2, or many cards gracefully

Please provide:
- Root cause analysis with specific CSS rules causing the issue
- Minimal CSS changes to fix the alignment
- Testing confirmation on multiple viewport sizes
- Before/after comparison if possible

Reference context/css-module-map.md for the existing CSS architecture.
```

## Additional Notes for pmC

This issue is blocking the Android TWA app launch. The app is functionally ready but looks unprofessional with the misaligned cards. 

Priority: HIGH - Fix ASAP for mobile app store submission.