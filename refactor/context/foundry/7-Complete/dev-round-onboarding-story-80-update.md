# Story: Onboarding Flow Update

## Story ID
#80

## Developer Assignment
Round 6, Developer 1

## User Story
As a new parent setting up StackMap, I want a simple, clear onboarding experience that helps me understand the app's purpose and set up my child's profile quickly.

## Acceptance Criteria
- [ ] Welcome screen explains app purpose clearly
- [ ] Parent/child profile creation simplified
- [ ] Visual preview of activity cards
- [ ] Skip option for experienced users
- [ ] Grownup mode setup integrated
- [ ] Default activities preview

## Technical Requirements

### Implementation
```javascript
// Updated onboarding flow
class OnboardingManager {
  steps = [
    {
      id: 'welcome',
      title: 'Welcome to StackMap!',
      content: 'Help your child map their day with visual activity cards',
      visual: 'app-preview.png',
      actions: ['start', 'skip']
    },
    {
      id: 'parent-setup',
      title: 'Set up Grownup Mode',
      content: 'Protect settings with a simple pattern',
      component: 'grownup-pattern-setup',
      required: true
    },
    {
      id: 'child-profile',
      title: 'Add Your Child',
      content: 'Choose an emoji and name',
      component: 'profile-creator',
      allowMultiple: true
    },
    {
      id: 'activity-preview',
      title: 'Visual Activities',
      content: 'Your child will see activities like these',
      component: 'activity-card-carousel',
      data: defaultActivities.slice(0, 5)
    },
    {
      id: 'ready',
      title: 'All Set!',
      content: 'Start mapping your child\'s day',
      actions: ['begin']
    }
  ];
}
```

### Mobile Considerations
- Full screen steps
- Swipe between screens
- Progress indicator
- Back button support

## ADHD Accommodations
- Visual-first communication
- One concept per screen
- Clear progress indication
- Quick completion path
- Can return to edit later

## Definition of Done
- [ ] Onboarding completes in <2 minutes
- [ ] All steps keyboard accessible
- [ ] Profile data saved correctly
- [ ] Skip option works
- [ ] Smooth transitions

## Dependencies
- Requires updated user-manager.js
- Integrates with grownup-mode.js
- Uses activity card preview components

## File Changes
- onboarding.js - major update
- welcome-manager.js - simplified
- css/onboarding.css - new styles
- No conflicts with other round 6 work