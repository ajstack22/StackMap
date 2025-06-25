# Story: Hybrid Panel Foundation (Like Legacy)

## Story ID
#82

## Developer Assignment
Round 2, Developer 2

## User Story
As a developer, I need a foundation for sliding panels that can show different content, similar to the legacy HybridPanelManager.

## Legacy App Pattern
The legacy app uses HybridPanelManager with:
- Left panel for preferences/user selection
- Right panel for management/edit options
- Dynamic content loading
- Mobile-friendly sliding behavior
- Backdrop for dismissal

## Acceptance Criteria
- [ ] Create basic panel infrastructure
- [ ] Left panel slides from left
- [ ] Right panel slides from right
- [ ] Backdrop closes panels
- [ ] Smooth animations
- [ ] Mobile gesture support

## Technical Requirements

### Foundation Structure
```javascript
// hybrid-panel.js - Simplified version
class HybridPanel {
  constructor() {
    this.panels = {
      left: null,
      right: null
    };
    this.backdrop = null;
    this.activePanel = null;
  }
  
  init() {
    this.createPanels();
    this.createBackdrop();
    this.setupEventListeners();
  }
  
  createPanels() {
    // Left panel
    const leftPanel = document.createElement('div');
    leftPanel.className = 'hybrid-panel hybrid-panel--left';
    leftPanel.innerHTML = `
      <div class="panel-header">
        <button class="panel-close" aria-label="Close">×</button>
        <h2 class="panel-title"></h2>
      </div>
      <div class="panel-content"></div>
    `;
    
    // Right panel (similar structure)
    const rightPanel = document.createElement('div');
    rightPanel.className = 'hybrid-panel hybrid-panel--right';
    // ... similar structure
    
    document.body.appendChild(leftPanel);
    document.body.appendChild(rightPanel);
    
    this.panels.left = leftPanel;
    this.panels.right = rightPanel;
  }
  
  open(side, content) {
    const panel = this.panels[side];
    if (!panel) return;
    
    // Set content
    const contentEl = panel.querySelector('.panel-content');
    contentEl.innerHTML = content;
    
    // Show backdrop
    this.backdrop.classList.add('visible');
    
    // Show panel
    panel.classList.add('open');
    this.activePanel = side;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    if (!this.activePanel) return;
    
    const panel = this.panels[this.activePanel];
    panel.classList.remove('open');
    this.backdrop.classList.remove('visible');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    this.activePanel = null;
  }
}
```

### CSS Structure
```css
.hybrid-panel {
  position: fixed;
  top: 0;
  height: 100%;
  width: 80%;
  max-width: 320px;
  background: white;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.hybrid-panel--right {
  right: 0;
  left: auto;
  transform: translateX(100%);
}

.hybrid-panel.open {
  transform: translateX(0);
}

.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s;
  z-index: 999;
}

.panel-backdrop.visible {
  opacity: 1;
  visibility: visible;
}
```

## Mobile Gestures
- Swipe to close (optional for this story)
- Touch outside to close
- Proper touch event handling

## Definition of Done
- [ ] Panels slide in/out smoothly
- [ ] Backdrop shows/hides
- [ ] Click backdrop closes panel
- [ ] Body scroll prevented when open
- [ ] Works on mobile devices
- [ ] No conflicts with existing UI

## API Design
```javascript
// Usage example
HybridPanel.open('left', '<div>Content here</div>');
HybridPanel.close();
```

## Notes
- This is just the foundation
- Content will be added in other stories
- Keep it simple and reusable
- Test on actual mobile devices
- Consider accessibility (focus trap later)