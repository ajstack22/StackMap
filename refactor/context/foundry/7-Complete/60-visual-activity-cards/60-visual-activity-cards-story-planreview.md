# Story #60: Visual Activity Cards System

## Summary
Implement the visual activity card system that makes StackMap accessible for non-readers and visual learners. This is the core differentiator from standard task apps and critical for special needs users.

## Context
Research shows visual card-based interfaces demonstrate **65% better task completion rates** compared to text lists for ADHD/autism users. Users with executive function challenges need visual representations to bypass working memory limitations.

## User Story
As a user with ADHD/autism who struggles with text-heavy interfaces, I want to see my tasks as visual cards with emojis and colors, so that I can quickly understand and complete my daily activities without reading stress.

## Acceptance Criteria

### Visual Display
- [ ] Cards display with large emoji (48px minimum) as primary identifier
- [ ] Optional short title (13 characters max) below emoji
- [ ] Customizable background colors (6 preset options)
- [ ] 2 cards per row on mobile portrait (280px min width)
- [ ] 3-4 cards per row on tablet/landscape
- [ ] Card states clearly visible (active, completed, disabled)

### Performance
- [ ] Initial render < 100ms for up to 50 cards
- [ ] Virtual scrolling activates beyond 50 cards
- [ ] 60fps scrolling with 100+ cards
- [ ] Memory usage < 50MB with full card set
- [ ] Emoji render using system fonts (no downloads)

### Interactions
- [ ] Single tap to toggle completion
- [ ] Long press (500ms) for edit menu in edit mode
- [ ] Visual feedback on all interactions
- [ ] Touch targets minimum 48px (60px in safe mode)
- [ ] No accidental activations while scrolling

### Data Management
- [ ] Cards sync with existing task system
- [ ] Offline-first with IndexedDB storage
- [ ] Backwards compatible with text tasks
- [ ] Import/export preserves card data

### Accessibility
- [ ] Screen reader announces card emoji and title
- [ ] Keyboard navigation with visible focus
- [ ] High contrast mode support
- [ ] Respects prefers-reduced-motion

## Technical Approach

### Phase 1: Core Implementation
```javascript
// Card component structure
class ActivityCard {
  constructor(data) {
    this.id = data.id;
    this.emoji = data.emoji; // Required
    this.title = data.title || '';
    this.color = data.color || '#FFE4B5';
    this.completed = data.completed || false;
  }
  
  render() {
    return `
      <div class="activity-card ${this.completed ? 'completed' : ''}" 
           data-card-id="${this.id}"
           style="background-color: ${this.color}">
        <div class="card-emoji">${this.emoji}</div>
        ${this.title ? `<div class="card-title">${this.title}</div>` : ''}
        <div class="card-state" aria-hidden="true"></div>
      </div>
    `;
  }
}
```

### Phase 2: Grid Layout
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

/* Virtual scroll container */
.card-viewport {
  height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

### Phase 3: State Synchronization
```javascript
// Bridge between cards and tasks
class CardTaskBridge {
  syncCardToTask(card) {
    const task = this.taskManager.getTask(card.taskId);
    if (task) {
      task.completed = card.completed;
      task.title = card.title || card.emoji;
      this.taskManager.save();
    }
  }
}
```

## Developer Mode Prompts

### ADHD Optimization Mode
When implementing, remember:
- Immediate visual feedback (< 100ms) prevents doubt spirals
- Clear completion states reduce "did I do that?" anxiety
- Large touch targets accommodate motor differences
- No time pressure or auto-advancing elements

### Autism Accommodation Mode
Consider:
- Consistent card positions (don't auto-rearrange)
- Predictable interactions (no surprise animations)
- Option to disable all transitions
- Clear visual hierarchy without overwhelming detail

### Performance Mode
Optimize for:
- Low-end Android devices (2GB RAM)
- Older iOS devices (iPhone 6S baseline)
- Poor network conditions (offline-first)
- Battery efficiency (minimize repaints)

## Testing Requirements

### Device Testing
- Android 6+ with 2GB RAM
- iOS 10+ on iPhone 6S
- iPad mini 4 or newer
- Chrome 51+ on desktop
- Screen readers (TalkBack, VoiceOver)

### Stress Testing
- 200+ cards performance
- Rapid tap interactions
- Memory pressure scenarios
- Offline/online transitions
- Theme switching impact

### User Testing
- Motor impairment simulation (weighted gloves)
- Cognitive load testing (dual tasks)
- Color blindness verification
- Screen reader full journey
- Child-safe interaction patterns

## Success Metrics
- Task completion rate increase > 20%
- Time to find task decrease > 40%
- User reported satisfaction > 4.5/5
- Zero data loss during card operations
- Performance metrics within targets

## Implementation Notes

### CSS Architecture
Use CSS custom properties for theming:
```css
:root {
  --card-size: 280px;
  --card-gap: 1rem;
  --emoji-size: 3rem;
  --touch-target: 48px;
}

.safe-mode {
  --touch-target: 60px;
  --card-gap: 1.5rem;
}
```

### Memory Management
- Implement card pooling for virtual scroll
- Lazy load card images/data
- Clean up off-screen cards
- Use Intersection Observer API

### Migration Strategy
1. Add card properties to existing tasks
2. Default emoji based on task text analysis
3. Gradual opt-in to card view
4. Preserve all existing functionality

## Dependencies
- Task system (existing)
- Storage adapter (existing)
- Theme manager (existing)
- Virtual scroll (existing)
- Edit mode (existing)

## Rollout Plan
1. Feature flag: `enableVisualCards`
2. Beta test with 10% users
3. Gather performance metrics
4. Full rollout after optimization
5. Make default for new users

## References
- Research report: `/context/foundry/2-ResearchReports/60.md`
- Competitive analysis: Proloquo2Go, Choiceworks, Tiimo
- WCAG 2.1 guidelines for cognitive accessibility
- Material Design touch target guidelines

This implementation will transform StackMap from a text-based task app into a visual-first experience that truly serves neurodivergent users' needs.