## Research Notes

- Exploring sensory preference patterns for users with ADHD and autism in digital interfaces
  - Key research questions:
    * Implement user-controlled sensory settings or automatic adaptive interfaces?
    * Prioritize sensory elements: visual (colors/contrast/animations), auditory (sounds/alerts), or tactile (haptics/vibration)
    * Mobile-first architecture considerations for sensory design

## Recent Changes (December 28, 2024)
- Fixed drag and drop by:
  - Removing automatic sorting that put pinned items first (respects manual order now)
  - Fixed getActivityIdFromCard to use data-activity-id attribute
  - Added null checks to prevent errors
- Added direct delete button to activity cards in edit mode:
  - Red delete icon positioned center-bottom
  - Fixed hover issue by combining transforms properly
  - No confirmation dialog for faster workflow
- Implemented toast notification system:
  - 3-second auto-dismiss timer
  - Undo functionality for deleted activities
  - Toast appears at bottom center of screen