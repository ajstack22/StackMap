# Issue #64: Card-to-Task Bridge System

## Summary
Create a seamless bridge between the visual card interface and the underlying task system, allowing both representations to coexist and stay synchronized.

## Background
The refactor has a robust task system, but users need visual cards. This bridge ensures cards are a visual layer over tasks, not a separate system, enabling gradual migration and backwards compatibility.

## Requirements

### Core Bridge Functions

1. **Card-Task Mapping**
   - One card can create multiple tasks (routine)
   - One task can have one card (visual mode)
   - Tasks can exist without cards (text mode)
   - Cards require at least one task

2. **Synchronization**
   - Card completion → Task completion
   - Task completion → Card visual update
   - Card edit → Task text update
   - Task edit → Card refresh

3. **Mode Switching**
   - Toggle between card/text view
   - Remember user preference
   - Smooth transition animation
   - No data loss on switch

### Data Model

```javascript
// Task extension for cards
{
  id: 'task_123',
  text: 'Brush Teeth',
  completed: false,
  // Card-specific fields
  cardId: 'card_456',
  displayMode: 'card', // 'card' | 'text' | 'both'
  cardData: {
    emoji: '🪥',
    color: '#E0F2F1',
    size: 'normal'
  }
}

// Card-to-task mapping
{
  cardId: 'card_456',
  taskIds: ['task_123'], // Can map to multiple tasks
  isPrimary: true, // Primary card for task
  syncMode: 'bidirectional' // How updates flow
}
```

### Bridge API

```javascript
class CardTaskBridge {
  constructor(taskManager, cardManager) {
    this.taskManager = taskManager;
    this.cardManager = cardManager;
    this.mappings = new Map();
  }
  
  // Create task from card
  async createTaskFromCard(card) {
    const task = {
      text: card.title || card.emoji,
      cardId: card.id,
      displayMode: 'card',
      cardData: {
        emoji: card.emoji,
        color: card.color
      }
    };
    
    const taskId = await this.taskManager.create(task);
    this.mapCardToTask(card.id, taskId);
    return taskId;
  }
  
  // Create card from task
  async createCardFromTask(task) {
    const card = {
      emoji: this.extractEmoji(task.text) || '📝',
      title: this.cleanTitle(task.text),
      color: this.generateColor(task.text)
    };
    
    const cardId = await this.cardManager.create(card);
    await this.taskManager.update(task.id, {
      cardId: cardId,
      displayMode: 'card'
    });
    
    this.mapCardToTask(cardId, task.id);
    return cardId;
  }
  
  // Sync completion state
  async syncCompletion(sourceType, sourceId, completed) {
    if (sourceType === 'card') {
      const taskIds = this.getTasksForCard(sourceId);
      for (const taskId of taskIds) {
        await this.taskManager.setCompleted(taskId, completed);
      }
    } else {
      const cardId = await this.getCardForTask(sourceId);
      if (cardId) {
        await this.cardManager.setCompleted(cardId, completed);
      }
    }
  }
}
```

### View Mode Manager

```javascript
class ViewModeManager {
  constructor() {
    this.currentMode = 'hybrid'; // 'cards' | 'text' | 'hybrid'
    this.loadPreference();
  }
  
  async switchMode(newMode) {
    const oldMode = this.currentMode;
    this.currentMode = newMode;
    
    // Animate transition
    await this.animateTransition(oldMode, newMode);
    
    // Update display
    this.updateTaskDisplay();
    
    // Save preference
    this.savePreference(newMode);
  }
  
  renderTask(task) {
    switch (this.currentMode) {
      case 'cards':
        return task.cardId ? this.renderCard(task) : null;
      case 'text':
        return this.renderTextTask(task);
      case 'hybrid':
        return task.cardId 
          ? this.renderCard(task) 
          : this.renderTextTask(task);
    }
  }
}
```

### Migration Support

1. **Gradual Migration**
   - Start with text tasks
   - Add cards selectively
   - Convert popular tasks first
   - Preserve all existing data

2. **Bulk Operations**
   - "Convert all to cards" wizard
   - Smart emoji assignment
   - Review before committing
   - Undo support

3. **Import Compatibility**
   - Import creates appropriate type
   - Card data preserved in exports
   - Version compatibility checks
   - Fallback to text mode

## Technical Considerations

### Performance
- Lazy load card data
- Cache card-task mappings
- Batch sync operations
- Debounce rapid updates

### Storage
```sql
-- Card-task mapping table
CREATE TABLE card_task_map (
  cardId TEXT NOT NULL,
  taskId TEXT NOT NULL,
  isPrimary INTEGER DEFAULT 1,
  created INTEGER,
  PRIMARY KEY (cardId, taskId),
  FOREIGN KEY (cardId) REFERENCES cards(id),
  FOREIGN KEY (taskId) REFERENCES tasks(id)
);

-- Index for fast lookups
CREATE INDEX idx_task_card ON card_task_map(taskId);
```

### Conflict Resolution
- Card edit wins over task edit
- Completion state always syncs
- Deletion cascades appropriately
- Orphaned cards/tasks handled

## Success Criteria
1. Zero data loss during mode switch
2. < 50ms sync latency
3. Seamless visual transitions
4. Works with existing task features
5. Backwards compatible exports

## UI Integration

### Mode Toggle
```javascript
// Settings UI
<div class="view-mode-selector">
  <button data-mode="cards">Cards Only</button>
  <button data-mode="text">Text Only</button>
  <button data-mode="hybrid">Mixed Mode</button>
</div>

// Inline converter
<button class="convert-to-card" data-task-id="123">
  Add Visual Card
</button>
```

### Visual Indicators
- Show link icon for connected items
- Different style for card-backed tasks
- Clear mode indicator in header
- Transition animations

## Dependencies
- Issue #60: Visual Activity Cards
- Existing task system
- SQLite storage
- View controller

## Testing Requirements
- Mode switching reliability
- Data integrity checks
- Performance with 200+ items
- Export/import compatibility
- Undo system integration

## Notes
- Bridge must be invisible to users
- Prioritize data safety
- Allow flexible workflows
- Consider future extensions

Priority: Critical (enables card system without breaking tasks)