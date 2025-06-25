# Implementation Plan: Visual Activity Cards System (Story #60)

## Executive Summary
This plan details the implementation of a visual-first activity card system for StackMap, designed to help users with ADHD/autism who struggle with text-heavy interfaces. The system will display tasks as visual cards with large emojis as primary identifiers, enabling 65% better task completion rates based on research.

## Current State Analysis

### Existing Infrastructure
1. **Card System**: `task-cards.js` already provides basic card rendering
2. **Storage**: SQLite implementation ready for card data
3. **Task Management**: Comprehensive task system in `task-display.js`
4. **Themes**: Full theme system with sensory preferences
5. **Performance**: Virtual scrolling already implemented
6. **Edit Mode**: Drag-drop reordering functional

### Gap Analysis
- Cards currently text-focused, need emoji-first approach
- No visual card creation UI
- Missing card type system (recurring, frequent, single-use)
- No card-specific data model
- Limited touch interaction optimization

## Detailed Implementation Plan

### Phase 1: Core Visual Card Implementation (Week 1)

#### 1.1 Enhance Task Data Model
**File: `js/db-schema.js`**
```javascript
// Add to existing schema
cards: {
    id: 'TEXT PRIMARY KEY',
    taskId: 'TEXT',
    emoji: 'TEXT NOT NULL',
    title: 'TEXT',
    color: 'TEXT DEFAULT "#FFE4B5"',
    type: 'TEXT DEFAULT "single"', // single, recurring, frequent
    position: 'INTEGER',
    created: 'INTEGER',
    modified: 'INTEGER'
}
```

**File: `js/task-sqlite.js`**
- Add methods: `saveCard()`, `getCardsForTask()`, `updateCardPosition()`
- Modify `getTasks()` to include card data
- Add migration for existing tasks to have default cards

#### 1.2 Create Visual Card Manager
**New File: `js/visual-card-manager.js`**
```javascript
class VisualCardManager {
    constructor() {
        this.cards = new Map();
        this.cardTypes = {
            single: { behavior: 'complete-once' },
            recurring: { behavior: 'reset-daily' },
            frequent: { behavior: 'always-available' }
        };
    }
    
    createCard(data) {
        // Validate emoji, title length (13 chars max)
        // Generate unique ID
        // Set default color based on theme
    }
    
    syncWithTask(cardId, taskId) {
        // Bi-directional sync logic
    }
}
```

#### 1.3 Update Card Rendering
**File: `js/task-cards.js`**
- Modify `renderCard()` to prioritize emoji display
- Add visual card HTML template
- Implement card state classes
- Add touch interaction handlers

### Phase 2: Card Creation UI (Week 2)

#### 2.1 Create Card Builder Interface
**New File: `js/card-creation-ui.js`**
```javascript
class CardCreationUI {
    showCardBuilder(existingCard = null) {
        // Modal with:
        // - Emoji picker (native or custom)
        // - Title input (13 char limit with counter)
        // - Color picker (6 presets)
        // - Card type selector
        // - Live preview
    }
}
```

#### 2.2 Enhance Edit Mode
**File: `js/edit-mode.js`**
- Add "Create Visual Card" button
- Integrate card builder modal
- Add card-specific edit actions

### Phase 3: Performance & Polish (Week 3)

#### 3.1 Optimize Rendering
**File: `js/task-cards.js`**
- Implement card pooling for virtual scroll
- Add intersection observer for lazy loading
- Optimize emoji rendering (system fonts only)
- Monitor 60fps target

#### 3.2 Enhance Interactions
**File: `js/gesture-manager.js`**
- Add card-specific gestures
- Implement haptic feedback for card completion
- Add visual feedback animations

### Phase 4: Integration & Migration (Week 4)

#### 4.1 Create Migration System
**New File: `js/card-migration.js`**
- Analyze existing tasks for emoji suggestions
- Create default cards for text tasks
- Provide bulk conversion UI

#### 4.2 Update Activity Library
**File: `js/activity-library.js`**
- Add visual card templates
- Create emoji-first browser
- Add card pack system

## Files to Modify/Create

### New Files (5)
1. `js/visual-card-manager.js` - Core card management
2. `js/card-creation-ui.js` - Card builder interface
3. `js/card-migration.js` - Migration utilities
4. `css/visual-cards.css` - Card-specific styles
5. `js/card-task-bridge.js` - Sync between cards and tasks

### Modified Files (12)
1. `js/db-schema.js` - Add card tables
2. `js/task-sqlite.js` - Card storage methods
3. `js/task-cards.js` - Visual rendering
4. `js/task-display.js` - Integration points
5. `js/edit-mode.js` - Card editing
6. `js/activity-library.js` - Card templates
7. `js/gesture-manager.js` - Card gestures
8. `css/cards.css` - Enhanced styles
9. `js/app.js` - Initialize card system
10. `index.html` - Card creation modal
11. `js/data-export.js` - Include card data
12. `js/data-import.js` - Import card data

## Technical Specifications

### Card Data Structure
```javascript
{
    id: 'card_uuid',
    taskId: 'task_uuid',
    emoji: '🎯',
    title: 'Focus Time', // 13 chars max
    color: '#FFE4B5',
    type: 'recurring',
    position: 0,
    state: 'active', // active, completed, disabled
    completedAt: null,
    created: timestamp,
    modified: timestamp
}
```

### CSS Architecture
```css
/* Visual card specific variables */
:root {
    --card-emoji-size: 3rem;
    --card-min-width: 280px;
    --card-aspect-ratio: 4/3;
    --card-touch-target: 48px;
}

.safe-mode {
    --card-touch-target: 60px;
    --card-emoji-size: 3.5rem;
}
```

### Performance Targets
- Initial render: < 100ms for 50 cards
- Scroll performance: 60fps with 100+ cards
- Memory usage: < 50MB with full card set
- Touch response: < 100ms visual feedback

## Risk Mitigation

### Technical Risks
1. **Performance degradation**
   - Mitigation: Implement virtual scrolling early
   - Monitor with Performance API
   
2. **Storage migration failures**
   - Mitigation: Backup before migration
   - Provide rollback mechanism

3. **Touch interaction conflicts**
   - Mitigation: Extensive device testing
   - Clear gesture zones

### User Experience Risks
1. **Overwhelming visual change**
   - Mitigation: Gradual rollout
   - Toggle for classic view

2. **Accessibility regression**
   - Mitigation: Screen reader testing throughout
   - Maintain keyboard navigation

## Testing Strategy

### Unit Tests
- Card CRUD operations
- Data model validation
- Sync logic verification

### Integration Tests
- Card-task synchronization
- Storage migration scenarios
- Theme compatibility

### Device Testing Matrix
- Android 6+ (2GB RAM minimum)
- iOS 10+ (iPhone 6S baseline)
- Chrome/Safari/Firefox latest
- Screen readers (TalkBack, VoiceOver)

### Performance Testing
- 200+ cards stress test
- Memory pressure scenarios
- Battery usage monitoring

## Success Criteria
1. Task completion rate increase > 20%
2. Time to find task decrease > 40%
3. Zero data loss during operations
4. Performance within specified targets
5. Accessibility standards maintained

## Implementation Timeline
- **Week 1**: Core visual card system
- **Week 2**: Card creation UI
- **Week 3**: Performance optimization
- **Week 4**: Integration and migration
- **Week 5**: Testing and polish
- **Week 6**: Staged rollout

## Dependencies
- Existing task system must remain stable
- SQLite migration system functional
- Theme manager integration ready
- Virtual scroll adapter compatible

## Rollback Plan
1. Feature flag: `enableVisualCards`
2. Data export before enabling
3. One-click disable in settings
4. Automatic disable on repeated crashes

This plan ensures a systematic implementation of the visual activity cards system while maintaining stability and performance for existing users.