# Issue #61: Card Creation & Editing UI

## Summary
Implement the user interface for creating and editing visual activity cards, optimized for users with ADHD and motor control challenges.

## Requirements

### Card Creation Flow
1. **Entry Points**
   - "Add Card" button in card view
   - "Create Card from Task" option
   - "Use Template" from library
   - Voice command: "new card"

2. **Creation Wizard**
   - Step 1: Choose emoji (recent + categories)
   - Step 2: Add title (optional, 13 chars)
   - Step 3: Pick color (6 preset options)
   - Step 4: Set type (recurring/frequent/single)

3. **Emoji Picker**
   - Recent emojis section (last 12 used)
   - Category tabs (activities, food, people, etc.)
   - Search by keyword
   - Large touch targets (60px squares)

4. **Quick Create Mode**
   - One-tap template selection
   - Auto-fill common activities
   - Duplicate existing card
   - Bulk create from suggestions

### Card Editing Interface

1. **Edit Triggers**
   - Long press on card (edit mode)
   - Edit button in card menu
   - Keyboard: Enter when focused

2. **Edit Panel**
   - Inline editing (no modal)
   - Large input fields
   - Real-time preview
   - Cancel/Save buttons

3. **Bulk Operations**
   - Select multiple cards
   - Change color for all
   - Delete selected
   - Move to library

### Accessibility Features

1. **Motor Challenges**
   - No precision required
   - Confirmation for destructive actions
   - Undo all operations
   - No time pressure

2. **Cognitive Support**
   - Visual preview of changes
   - Simple language
   - Clear action buttons
   - Minimal steps

3. **Sensory Considerations**
   - No sudden animations
   - Muted colors option
   - Quiet mode (no sounds)
   - Reduce visual clutter

## Technical Implementation

### UI Components
```javascript
// Card creator component
class CardCreator {
  constructor() {
    this.currentStep = 1;
    this.cardData = {
      emoji: '',
      title: '',
      color: '#FFE4B5',
      type: 'single'
    };
  }
  
  showEmojiPicker() {
    // Recent + categorized emojis
    // Virtual scroll for performance
  }
  
  validateTitle(text) {
    return text.length <= 13;
  }
}

// Emoji picker with categories
const emojiCategories = {
  activities: ['⚽', '🎨', '🎮', '📚', '🎸'],
  daily: ['🛁', '🪥', '🍳', '🛏️', '👕'],
  food: ['🍎', '🥪', '🍕', '🥛', '🍪'],
  school: ['✏️', '📚', '🎒', '🚌', '📝']
};
```

### Edit Mode Integration
```javascript
// Extend existing edit mode
EditMode.registerHandler('card', {
  onLongPress: (card) => showCardEditor(card),
  onDragStart: (card) => startCardReorder(card),
  allowedActions: ['edit', 'delete', 'reorder']
});
```

### Data Validation
- Emoji: Required, must be valid Unicode emoji
- Title: Optional, max 13 characters, XSS safe
- Color: Must be from preset palette
- Type: Must be valid enum value

## UI Design Guidelines

### Mobile-First Layout
- Full-screen emoji picker
- Bottom sheet for options
- Swipe between steps
- Large touch targets

### Visual Feedback
- Instant preview of card
- Highlight selected options
- Progress indicator for steps
- Success animation on save

### Error Prevention
- Disable save without emoji
- Auto-trim long titles
- Prevent duplicate cards
- Confirm before delete

## Success Criteria
1. Create a card in < 30 seconds
2. Edit without losing focus
3. No accidental deletions
4. Works with one hand
5. Screen reader navigable

## Dependencies
- Issue #60: Visual Activity Cards base
- Edit mode system
- SQLite storage
- Theme manager

## Testing Requirements
- Test with assistive technologies
- Verify with motor impairments
- Check cognitive load
- Validate with color blindness

## Notes
- Consider templates for common activities
- Allow customization depth for power users
- Keep simple path for basic users
- Test with actual users

Priority: High (blocks card system usage)