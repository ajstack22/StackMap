# Issue #62: Card Library & Template System

## Summary
Implement a card library system with pre-built templates and personal collections, designed to reduce the cognitive load of creating new activities.

## Background
Users with ADHD often struggle with blank slate problems. A library of common activities and the ability to save personal templates dramatically improves usability.

## Requirements

### Library Categories

1. **Default Templates**
   - Morning Routine (15 cards)
   - Evening Routine (10 cards)
   - School Activities (20 cards)
   - Chores & Helping (15 cards)
   - Self-Care (10 cards)
   - Fun Activities (20 cards)

2. **Personal Library**
   - Save any card as template
   - Organize by custom categories
   - Quick access to favorites
   - Recently used section

3. **Shared Library** (Future)
   - Family-shared templates
   - Caregiver-approved cards
   - Sync across devices

### Template Data

```javascript
// Default template structure
const defaultTemplates = {
  morning: [
    { emoji: '🛏️', title: 'Wake Up', category: 'morning' },
    { emoji: '🚿', title: 'Shower', category: 'morning' },
    { emoji: '🪥', title: 'Brush Teeth', category: 'morning' },
    { emoji: '👕', title: 'Get Dressed', category: 'morning' },
    { emoji: '🍳', title: 'Eat Breakfast', category: 'morning' }
  ],
  school: [
    { emoji: '🎒', title: 'Pack Backpack', category: 'school' },
    { emoji: '📚', title: 'Homework', category: 'school' },
    { emoji: '✏️', title: 'Study', category: 'school' },
    { emoji: '🚌', title: 'Catch Bus', category: 'school' }
  ],
  chores: [
    { emoji: '🧹', title: 'Clean Room', category: 'chores' },
    { emoji: '🍽️', title: 'Set Table', category: 'chores' },
    { emoji: '🗑️', title: 'Take Out Trash', category: 'chores' },
    { emoji: '🐕', title: 'Feed Pet', category: 'chores' }
  ]
};
```

### Library UI

1. **Browse Interface**
   - Grid view of template cards
   - Category filters
   - Search by emoji or title
   - Preview before adding

2. **Quick Add Flow**
   - Tap template to preview
   - "Use This" button
   - Customize before saving
   - Add to Today/Tomorrow

3. **Management Features**
   - Create new category
   - Reorder templates
   - Delete unused templates
   - Export/import templates

### Smart Suggestions

1. **Time-Based**
   - Morning templates in AM
   - Evening templates in PM
   - Weekend vs weekday

2. **Usage-Based**
   - Frequently used cards
   - Patterns detection
   - Routine suggestions

3. **Context-Aware**
   - Based on completed tasks
   - Complement existing cards
   - Fill routine gaps

## Technical Implementation

### Storage Schema
```sql
-- Template storage
CREATE TABLE card_templates (
  id TEXT PRIMARY KEY,
  emoji TEXT NOT NULL,
  title TEXT,
  description TEXT,
  color TEXT,
  category TEXT,
  isDefault INTEGER DEFAULT 0,
  isPersonal INTEGER DEFAULT 0,
  usageCount INTEGER DEFAULT 0,
  lastUsed INTEGER,
  created INTEGER
);

-- Template categories
CREATE TABLE template_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  position INTEGER,
  isDefault INTEGER DEFAULT 0
);
```

### Library Manager
```javascript
class CardLibraryManager {
  constructor() {
    this.templates = new Map();
    this.categories = new Map();
    this.recentlyUsed = [];
  }
  
  async loadDefaults() {
    // Load built-in templates
    // Only on first run or reset
  }
  
  async saveAsTemplate(card) {
    // Convert card to template
    // Add to personal library
  }
  
  async getSuggestions(context) {
    // Time of day
    // Existing cards
    // Usage patterns
    return suggestions;
  }
}
```

### UI Components
```javascript
// Template browser
class TemplateBrowser {
  constructor() {
    this.currentCategory = 'all';
    this.searchTerm = '';
  }
  
  renderGrid() {
    // Virtual scroll for performance
    // 2 columns on mobile
    // 3-4 on tablet
  }
  
  previewTemplate(template) {
    // Show card preview
    // Customization options
    // Add button
  }
}
```

## Success Criteria
1. Find and add template < 10 seconds
2. 90% of common activities covered
3. Personal library usage > defaults
4. Reduces card creation time by 50%
5. Suggestions accepted > 30%

## UI/UX Guidelines

### Visual Design
- Templates look like cards
- Subtle difference from active cards
- Category icons for scanning
- Preview matches final card

### Interaction
- Single tap to preview
- Double tap to quick add
- Long press for options
- Swipe between categories

### Accessibility
- Descriptive labels
- Keyboard navigation
- Screen reader categories
- High contrast mode

## Dependencies
- Issue #60: Visual Activity Cards
- Issue #61: Card Creation UI
- SQLite storage
- Theme system

## Phased Rollout

### Phase 1: Default Templates
- Load built-in templates
- Basic category browser
- Simple add to today

### Phase 2: Personal Library
- Save as template
- Custom categories
- Usage tracking

### Phase 3: Smart Features
- Time-based suggestions
- Pattern detection
- Routine builder

## Testing Notes
- Verify all emojis render
- Test with 100+ templates
- Check memory usage
- Validate suggestions

Priority: High (core usability feature)