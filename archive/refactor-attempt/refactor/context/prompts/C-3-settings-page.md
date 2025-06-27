# Issue #28: Settings Page with Theme & Preferences

## Context
StackMap users with ADHD/autism need easy control over their sensory experience. The settings page provides theme selection and preference management.

## Requirements

### 1. Settings View Structure
The settings view already exists in index.html. Implement the functionality:
```javascript
// In app.js or new settings.js
var SettingsManager = {
    init: function() {
        this.loadSettings();
        this.bindEvents();
        this.populateThemes();
    }
};
```

### 2. Theme Selection UI
Create a visual theme picker:
```html
<div class="theme-grid">
    <button class="theme-option" data-theme="royal-purple">
        <div class="theme-preview" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            <span class="theme-icon">👑</span>
        </div>
        <span class="theme-name">Royal Purple</span>
    </button>
    <!-- More themes... -->
</div>
```

### 3. Settings to Implement
- **Visual**
  - [ ] Theme selection (8 themes)
  - [ ] Reduced motion toggle
  - [ ] High contrast mode
  - [ ] Font size (Normal/Large/Extra Large)

- **Behavior**
  - [ ] Safe mode persistence
  - [ ] Auto-save frequency
  - [ ] Confirmation prompts
  - [ ] Default view (tasks/calendar)

- **Accessibility**
  - [ ] Screen reader verbosity
  - [ ] Keyboard navigation hints
  - [ ] Touch target size

### 4. Storage Pattern
```javascript
var UserSettings = {
    theme: 'royal-purple',
    reducedMotion: false,
    highContrast: false,
    fontSize: 'normal',
    autoSaveInterval: 30,
    confirmDelete: true,
    defaultView: 'tasks'
};

// Save to localStorage
localStorage.setItem('stackmap_settings', JSON.stringify(UserSettings));
```

### 5. Apply Settings Immediately
```javascript
applyTheme: function(themeName) {
    // Get theme from THEMES object
    var theme = window.THEMES[themeName];
    if (theme) {
        // Apply CSS variables
        Object.keys(theme.properties).forEach(function(prop) {
            document.documentElement.style.setProperty(prop, theme.properties[prop]);
        });
        // Save preference
        this.saveSettings();
    }
}
```

### 6. Visual Requirements
- Large touch targets (60x60px minimum)
- Clear visual feedback
- Smooth transitions (unless reduced motion)
- Preview changes before saving
- Undo last change option

### 7. ES5 Compatibility
- No arrow functions
- No const/let
- No destructuring
- Use var and function declarations

## Success Criteria
- [ ] All 8 themes selectable with preview
- [ ] Settings persist across sessions
- [ ] Changes apply immediately
- [ ] Accessible with keyboard/screen reader
- [ ] No jarring transitions
- [ ] Works on all platforms

## Time Estimate: 6-8 hours