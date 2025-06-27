# Story: Panel Content Menus (Like Legacy)

## Story ID
#83

## Developer Assignment
Round 2, Developer 3

## User Story
As a developer, I need menu configurations for the hybrid panels so users can navigate between different features like the legacy app.

## Legacy App Pattern
The legacy app uses MenuConfigurations.js to define:
- Menu items with icons and labels
- Navigation between different panel views
- Dynamic content based on app state
- Grouped sections (Edit, Preferences, etc.)

## Acceptance Criteria
- [ ] Create menu configuration system
- [ ] Define left panel menus (preferences, user/day)
- [ ] Define right panel menus (edit options)
- [ ] Support navigation between menus
- [ ] Show appropriate icons
- [ ] Handle menu item clicks

## Technical Requirements

### Menu Configuration Structure
```javascript
// menu-configurations.js
const MenuConfigurations = {
  // Left Panel Menus
  userDaySelector: {
    title: 'Switch View',
    items: [
      {
        type: 'day-selector',
        // Special component for day selection
      },
      {
        type: 'user-grid',
        // Special component for user selection
      }
    ]
  },
  
  preferences: {
    title: 'Preferences',
    items: [
      {
        icon: '🎨',
        label: 'Theme',
        action: 'showThemeSelector'
      },
      {
        icon: '🔢',
        label: 'Number Mode',
        action: 'toggleNumberMode',
        toggle: true
      },
      {
        icon: '🎉',
        label: 'Celebrations',
        action: 'toggleCelebrations',
        toggle: true
      }
    ]
  },
  
  // Right Panel Menus
  editMenu: {
    title: 'Edit Activities',
    requiresAuth: true,
    items: [
      {
        icon: '➕',
        label: 'Add Activity',
        action: 'showAddActivity'
      },
      {
        icon: '📚',
        label: 'Activity Library',
        action: 'showLibrary'
      },
      {
        icon: '🔄',
        label: 'Reorder',
        action: 'enableReorder'
      },
      {
        type: 'divider'
      },
      {
        icon: '✅',
        label: 'Complete Day',
        action: 'completeDay'
      }
    ]
  }
};
```

### Menu Renderer
```javascript
class MenuRenderer {
  static render(menuId, container) {
    const config = MenuConfigurations[menuId];
    if (!config) return;
    
    container.innerHTML = `
      <div class="menu-header">
        <h3>${config.title}</h3>
      </div>
      <div class="menu-items">
        ${this.renderItems(config.items)}
      </div>
    `;
    
    // Attach event listeners
    this.attachListeners(container, config.items);
  }
  
  static renderItems(items) {
    return items.map(item => {
      if (item.type === 'divider') {
        return '<hr class="menu-divider">';
      }
      
      if (item.type === 'day-selector') {
        return this.renderDaySelector();
      }
      
      if (item.type === 'user-grid') {
        return this.renderUserGrid();
      }
      
      return `
        <button class="menu-item" data-action="${item.action}">
          <span class="menu-icon">${item.icon}</span>
          <span class="menu-label">${item.label}</span>
          ${item.toggle ? '<span class="toggle-switch"></span>' : ''}
        </button>
      `;
    }).join('');
  }
}
```

### Integration with Panels
```javascript
// Usage with hybrid panels
HybridPanel.showMenu = function(side, menuId) {
  const panel = this.panels[side];
  const content = panel.querySelector('.panel-content');
  
  MenuRenderer.render(menuId, content);
  this.open(side);
};
```

## Menu Styling
```css
.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
}

.menu-item:hover {
  background: rgba(0,0,0,0.05);
}

.menu-icon {
  font-size: 1.5em;
  margin-right: 12px;
  width: 32px;
  text-align: center;
}

.menu-divider {
  margin: 8px 0;
  border: none;
  border-top: 1px solid #eee;
}
```

## Definition of Done
- [ ] Menu configurations defined
- [ ] Menu renderer implemented
- [ ] Integrates with panel system
- [ ] Menu items clickable
- [ ] Special components work (day/user)
- [ ] Proper styling applied

## Notes
- Focus on structure, not all actions
- Actions can be stubs for now
- Make it extensible for future menus
- Consider mobile touch targets
- Keep menus simple and clear