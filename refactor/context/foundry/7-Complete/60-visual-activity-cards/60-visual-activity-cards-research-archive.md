# Research Request: Visual Activity Cards System

## Context
The original StackMap's core differentiator is its visual activity card system, designed for children and adults with special needs. The refactor currently uses a text-based task list, missing this crucial visual component that makes StackMap accessible for non-readers and visual learners.

## Research Questions

### 1. Visual Design for Neurodivergent Users
- What makes visual cards more effective than text lists for ADHD/autism users?
- How do emoji-based interfaces reduce cognitive load?
- What's the optimal card size and layout for mobile devices?
- How should cards adapt between phone (320px) and tablet (768px+) screens?

### 2. Card Information Architecture
- How to balance visual simplicity with necessary information?
- What's the minimum viable card (emoji only vs emoji + text)?
- How to indicate card state (completed, in-progress, locked)?
- Best practices for card numbering/sequencing for routine building?

### 3. Touch Interaction Patterns
- Optimal touch target size for motor control challenges?
- Single-tap vs double-tap vs long-press for different actions?
- How to prevent accidental activation during scrolling?
- Drag-and-drop vs tap-to-select-then-move patterns?

### 4. Card Types & Templates
- How to visually differentiate recurring vs one-time tasks?
- Library organization patterns (personal vs shared vs suggested)?
- Template discovery without overwhelming users?
- Progressive disclosure of advanced features?

### 5. Performance Considerations
- Canvas vs DOM for rendering many cards?
- Virtual scrolling for large card collections?
- Image/emoji loading strategies?
- Memory usage with 100+ visual cards?

### 6. Accessibility Balance
- How to support both visual-first and screen reader users?
- Alternative text strategies for emoji-based cards?
- High contrast mode without losing visual appeal?
- Supporting both touch and keyboard card manipulation?

## Technical Research Areas

### 1. Rendering Strategy
```javascript
// Option A: DOM-based cards
<div class="activity-card">
  <div class="card-emoji">🍳</div>
  <div class="card-title">Make Breakfast</div>
</div>

// Option B: Canvas rendering
const cardCanvas = new CardRenderer({
  emoji: '🍳',
  title: 'Make Breakfast',
  color: '#FFE4B5'
});

// Option C: Hybrid approach
// DOM for interaction, Canvas for decoration
```

### 2. State Management
- How to sync card state with task state?
- Optimistic UI updates for card interactions?
- Undo support for card operations?
- Card-to-task mapping strategies?

### 3. Animation Framework
- CSS vs JavaScript animations for card transitions?
- GPU acceleration strategies?
- Respecting prefers-reduced-motion?
- Performance budgets for animations?

### 4. Data Structure
```javascript
// Minimal card
{
  id: 'card_123',
  emoji: '🍳',
  title: 'Breakfast'
}

// Full card
{
  id: 'card_123',
  emoji: '🍳',
  title: 'Make Breakfast',
  description: 'Cook eggs and toast',
  color: '#FFE4B5',
  type: 'recurring',
  category: 'morning',
  duration: 15,
  customization: {
    fontSize: 'large',
    showNumber: true,
    animation: 'bounce'
  }
}
```

## Success Metrics
1. Time to recognize and tap correct card < 3 seconds
2. Error rate < 5% for card selection
3. 90% of users can complete a routine without text
4. Memory usage < 50MB with 100 cards
5. 60fps scrolling performance
6. Works offline after first load

## Constraints
1. Must work on Android 5+ (no CSS Grid)
2. Touch targets minimum 48px (60px in safe mode)
3. Maximum 6 cards visible without scrolling (mobile portrait)
4. Emoji must be native (no custom images initially)
5. Cards must load in < 100ms

## Competitive Analysis
Research similar visual task systems:
- Proloquo2Go (AAC communication)
- Choiceworks (visual schedules)
- First Then Visual Schedule
- Tiimo (ADHD planner)

## Output Requirements
1. Technical recommendation for rendering approach
2. Card data structure specification
3. Interaction pattern guidelines
4. Performance optimization strategies
5. Phased implementation plan
6. Accessibility compliance checklist

## Priority Research
Start with:
1. Minimum viable card design
2. Touch interaction patterns  
3. Card-to-task state synchronization
4. Performance testing methodology

This research should enable building a visual card system that maintains StackMap's special needs focus while modernizing the implementation.