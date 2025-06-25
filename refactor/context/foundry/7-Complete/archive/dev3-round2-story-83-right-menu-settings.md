# Story: Right Menu - Settings & Preferences

## User Story
As a parent, I want a clear settings menu so that I can manage app preferences, user profiles, and app-wide settings in one organized place.

## Acceptance Criteria
- [ ] Menu slides in from right when button tapped
- [ ] Shows settings organized by category
- [ ] Grownup mode protection for sensitive items
- [ ] Visual indicators for current settings
- [ ] Backdrop to dismiss menu
- [ ] Smooth slide animation

## Technical Requirements

### Implementation
```javascript
// Menu structure
{
  sections: [
    {
      title: 'Display',
      requiresAuth: false,
      items: [
        { icon: '🎨', label: 'Theme', value: 'Ocean', action: 'theme' },
        { icon: '123', label: 'Number Mode', toggle: true, action: 'display-mode' },
        { icon: '🎉', label: 'Celebrations', toggle: true, action: 'celebrations' }
      ]
    },
    {
      title: 'Users',
      requiresAuth: true,
      items: [
        { icon: '👤', label: 'Manage Profiles', action: 'profiles' },
        { icon: '➕', label: 'Add Child', action: 'add-profile' }
      ]
    },
    {
      title: 'Data',
      requiresAuth: true,
      items: [
        { icon: '💾', label: 'Backup', action: 'export' },
        { icon: '📥', label: 'Restore', action: 'import' },
        { icon: '🔄', label: 'Sync', badge: 'Off', action: 'sync' }
      ]
    },
    {
      title: 'Help',
      requiresAuth: false,
      items: [
        { icon: '👋', label: 'Tutorial', action: 'tutorial' },
        { icon: '❓', label: 'Help', action: 'help' },
        { icon: 'ℹ️', label: 'About', action: 'about' }
      ]
    }
  ]
}
```

### Mobile Considerations
- 85% screen width (wider than left menu)
- Toggle switches inline
- Current values shown
- Section headers sticky

## ADHD Accommodations
- Visual current state indicators
- Toggle switches for binary options
- No deep nesting
- Clear section separation
- Most-used items first

## Definition of Done
- [ ] Menu opens/closes smoothly
- [ ] Settings changes apply immediately
- [ ] Grownup mode gates sensitive items
- [ ] Keyboard navigable
- [ ] State indicators accurate

## References
- Part of unified header system
- Replaces separate settings view