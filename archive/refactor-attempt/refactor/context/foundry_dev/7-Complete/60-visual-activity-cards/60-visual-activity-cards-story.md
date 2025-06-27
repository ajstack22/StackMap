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
// Card component structure with complete data model
class ActivityCard {
  constructor(data) {
    this.id = data.id;
    this.taskId = data.taskId; // Links to task system
    this.emoji = this.sanitizeEmoji(data.emoji || '📌'); // Default fallback
    this.title = this.sanitizeText(data.title || '');
    this.color = this.sanitizeColor(data.color || '#FFE4B5');
    this.completed = data.completed || false;
    this.order = data.order || 0;
    this.category = data.category || 'default';
    this.created_at = data.created_at || Date.now();
    this.updated_at = data.updated_at || Date.now();
  }
  
  sanitizeEmoji(emoji) {
    // Prevent emoji injection, validate single emoji
    const emojiRegex = /^(\p{Emoji}|\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?)+$/u;
    return emojiRegex.test(emoji) ? emoji : '📌';
  }
  
  sanitizeText(text) {
    // Prevent XSS
    const div = document.createElement('div');
    div.textContent = text.slice(0, 13); // Enforce char limit
    return div.innerHTML;
  }
  
  sanitizeColor(color) {
    // Validate hex color
    return /^#[0-9A-F]{6}$/i.test(color) ? color : '#FFE4B5';
  }
  
  render() {
    return `
      <div class="activity-card ${this.completed ? 'completed' : ''}" 
           data-card-id="${this.id}"
           data-task-id="${this.taskId}"
           style="background-color: ${this.color}"
           role="button"
           tabindex="0"
           aria-label="${this.title || 'Task'} ${this.emoji} ${this.completed ? 'completed' : 'not completed'}">
        <div class="card-emoji" aria-hidden="true">${this.emoji}</div>
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

## Error Handling

### Emoji Rendering Failures
```javascript
// Fallback for emoji rendering issues
function renderCardEmoji(emoji, fallbackText) {
  const testEl = document.createElement('span');
  testEl.textContent = emoji;
  testEl.style.position = 'absolute';
  testEl.style.visibility = 'hidden';
  document.body.appendChild(testEl);
  
  // Check if emoji rendered properly
  const width = testEl.offsetWidth;
  document.body.removeChild(testEl);
  
  if (width < 10) { // Emoji likely failed to render
    return `<span class="emoji-fallback" aria-label="${fallbackText}">${fallbackText.slice(0, 2).toUpperCase()}</span>`;
  }
  
  return emoji;
}
```

### Storage Quota Handling
- Monitor IndexedDB usage before saves
- Implement LRU cache for card data
- Prompt user to clean up old completed cards
- Fallback to localStorage for critical data

### Sync Conflict Resolution
- Last-write-wins for simple properties
- Merge strategy for completion status (completed wins)
- User prompt for emoji/color conflicts
- Maintain conflict log for debugging

### Performance Degradation
```javascript
// Adaptive quality based on device performance
class PerformanceAdapter {
  constructor() {
    this.fps = 60;
    this.degradeThreshold = 30;
  }
  
  measurePerformance() {
    // Use requestAnimationFrame to measure actual FPS
    // Reduce animations if FPS < 30
    // Disable virtual scroll if memory pressure detected
    // Switch to simple list view if critically slow
  }
}
```

## Edge Cases

### Large Data Sets (1000+ cards)
- Implement pagination with "Load More" button
- Search/filter to reduce visible cards
- Category grouping to organize cards
- Archive completed cards after 30 days

### Internationalization
- RTL support with `dir="rtl"` on card container
- Emoji rendering varies by locale - test key markets
- Title character limits adjust for CJK languages (8 chars)
- Number formatting for card counts

### Complex Emoji Handling
- Multi-codepoint emoji (flags, skin tones) need special handling
- Zero-width joiners can break layout - filter them
- Emoji variations (text vs color) - force color presentation
- New emoji may not render on older devices - maintain compatibility list

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
1. **Automatic Emoji Assignment**:
   ```javascript
   function assignDefaultEmoji(taskText) {
     const emojiMap = {
       // Common task keywords to emoji
       'email': '📧', 'call': '📞', 'meeting': '👥',
       'buy': '🛒', 'shopping': '🛒', 'grocery': '🛒',
       'exercise': '🏃', 'workout': '💪', 'gym': '🏋️',
       'doctor': '👨‍⚕️', 'appointment': '📅', 'deadline': '⏰',
       'write': '✍️', 'read': '📖', 'study': '📚',
       'clean': '🧹', 'laundry': '👕', 'dishes': '🍽️',
       'pay': '💳', 'bill': '📄', 'bank': '🏦'
     };
     
     const text = taskText.toLowerCase();
     for (const [keyword, emoji] of Object.entries(emojiMap)) {
       if (text.includes(keyword)) return emoji;
     }
     
     // Category-based defaults
     if (text.includes('work')) return '💼';
     if (text.includes('home')) return '🏠';
     if (text.includes('personal')) return '👤';
     
     return '📌'; // Universal default
   }
   ```

2. **Bulk Migration Process**:
   - Show migration preview screen
   - Allow users to customize assigned emojis
   - Batch process in chunks of 50 to prevent UI freeze
   - Save progress to handle interruptions

3. **Gradual Rollout**:
   - Add "Try Card View" button to existing task list
   - Track usage metrics for A/B testing
   - Preserve user's view preference
   - Allow instant switching between views

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