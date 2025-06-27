# Issue #29: Welcome/Tutorial Screens

## Context
New StackMap users with ADHD/autism need gentle onboarding that doesn't overwhelm. Create a optional, skippable tutorial.

## Requirements

### 1. First Launch Detection
```javascript
var WelcomeManager = {
    init: function() {
        var hasSeenWelcome = localStorage.getItem('stackmap_welcome_seen');
        if (!hasSeenWelcome) {
            this.showWelcome();
        }
    }
};
```

### 2. Welcome Flow Structure
Create 3-4 simple screens:

**Screen 1: Welcome**
- "Welcome to StackMap! 👋"
- "Your ADHD-friendly task manager"
- [Skip] [Next]

**Screen 2: Key Features**
- "✓ Quick task entry"
- "✓ Safe from accidents" 
- "✓ Works offline"
- [Skip] [Next]

**Screen 3: Personalize**
- "Choose your theme"
- Show 3 popular themes
- [Skip] [Next]

**Screen 4: Ready**
- "You're all set!"
- "Tap anywhere to start"
- [Start Using StackMap]

### 3. Implementation
```javascript
// Use existing modal system or create inline
var welcomeSteps = [
    {
        title: 'Welcome to StackMap! 👋',
        content: 'Your ADHD-friendly task manager',
        image: 'welcome-1.svg',
        buttons: ['Skip', 'Next']
    },
    // ... more steps
];
```

### 4. Visual Design
- Large, friendly illustrations
- Minimal text (2-3 lines max)
- High contrast buttons
- Progress dots at bottom
- Smooth transitions (respect reduced motion)

### 5. Skip Behavior
- "Skip" always available
- Goes directly to app
- Saves that user has seen welcome
- No guilt or negative messaging

### 6. Theme Preview
On Screen 3, actually change the theme as they tap:
```javascript
handleThemePreview: function(themeName) {
    // Temporarily apply theme
    ThemeManager.previewTheme(themeName);
    // Save on "Next" or revert on "Skip"
}
```

### 7. Accessibility
- Announce screen changes
- Keyboard navigation (Tab/Enter)
- Touch and click both work
- High contrast mode support

### 8. Re-accessing Tutorial
Add to Settings:
```html
<button onclick="WelcomeManager.restart()">
    View Tutorial Again
</button>
```

## Success Criteria
- [ ] Shows on first launch only
- [ ] Can skip at any time
- [ ] Theme selection works
- [ ] Smooth, not overwhelming
- [ ] Accessible via keyboard
- [ ] Can replay from settings

## Time Estimate: 6-8 hours

## Notes
- Keep it SHORT (under 1 minute)
- Focus on making user feel capable
- No feature overload
- Happy, encouraging tone