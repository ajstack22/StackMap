# StackMap Mobile-First Story Backlog

## Story Categories

### 🔄 Migration Stories (Reuse Existing Work)

#### STORY-M1: Migrate Default Activities Data
- **What**: Copy and adapt default-activities.js to ES5
- **Value**: 50+ pre-made activities ready to use
- **Complexity**: Low (mostly copy-paste)
- **Dependencies**: None

#### STORY-M2: Migrate Color Palette & Base Styles  
- **What**: Extract colors, typography, spacing from main app
- **Value**: Proven accessible design system
- **Complexity**: Low
- **Dependencies**: None

#### STORY-M3: Adapt Card UI Structure
- **What**: Convert React card components to vanilla JS templates
- **Value**: Proven card layout and styling
- **Complexity**: Medium (React → ES5 conversion)
- **Dependencies**: M2

#### STORY-M4: Port Business Logic Patterns
- **What**: Extract completion logic, edit modes, user context
- **Value**: Proven UX patterns
- **Complexity**: Medium
- **Dependencies**: Storage layer working

#### STORY-M5: Migrate UI Copy & Messages
- **What**: Extract all microcopy, labels, celebration messages
- **Value**: ADHD-friendly copy already written
- **Complexity**: Low
- **Dependencies**: None

### 🆕 New Development Stories

#### STORY-N1: Task Display Component
- **What**: Build core task card display functionality
- **Value**: Users can see their tasks
- **Complexity**: High (core feature)
- **Dependencies**: M3, Storage

#### STORY-N2: Task CRUD UI
- **What**: Add, edit, delete task interfaces
- **Value**: Users can manage tasks
- **Complexity**: High
- **Dependencies**: N1

#### STORY-N3: User System Implementation
- **What**: Multi-user support with day context
- **Value**: Family/shared device usage
- **Complexity**: Medium
- **Dependencies**: Storage

#### STORY-N4: Edit Mode System
- **What**: FAB button and edit mode toggle
- **Value**: Familiar StackMap interaction pattern
- **Complexity**: Medium
- **Dependencies**: N1, N2

#### STORY-N5: Drag & Drop (ES5 Compatible)
- **What**: Reorder tasks with touch/mouse
- **Value**: Essential for ADHD task prioritization
- **Complexity**: High (ES5 constraints)
- **Dependencies**: N1, N4

#### STORY-N6: Card Library Browser
- **What**: UI to browse and add library cards
- **Value**: Quick task creation from templates
- **Complexity**: Medium
- **Dependencies**: M1, N2

#### STORY-N7: Visual Customization UI
- **What**: Emoji picker, colors, display modes
- **Value**: Personalization for engagement
- **Complexity**: Medium
- **Dependencies**: N2, Settings

#### STORY-N8: Celebration System (Simplified)
- **What**: CSS-based completion animations
- **Value**: Positive reinforcement
- **Complexity**: Low
- **Dependencies**: N2

#### STORY-N9: Settings Implementation
- **What**: Populate settings view with preferences
- **Value**: User control over experience
- **Complexity**: Medium
- **Dependencies**: Storage, N3

#### STORY-N10: Data Export/Import
- **What**: Manual backup and restore
- **Value**: Data safety and portability
- **Complexity**: Medium
- **Dependencies**: Storage working

## 🔥 Priority Order (MVP Path)

### Round 1: Foundation Migration
1. STORY-M1: Default Activities ✓ Quick win
2. STORY-M2: Colors & Styles ✓ Quick win
3. STORY-M3: Card Structure ✓ Enables UI work

### Round 2: Core Task UI
4. STORY-N1: Task Display ⚡ Critical path
5. STORY-N2: Task CRUD ⚡ Critical path

### Round 3: Multi-User & Context
6. STORY-N3: User System ⚡ Critical for StackMap
7. STORY-M4: Business Logic ✓ Reuse patterns

### Round 4: Edit Mode
8. STORY-N4: Edit Mode ⚡ Signature feature
9. STORY-N5: Drag & Drop 🎯 High value

### Round 5: Enhancement
10. STORY-N6: Card Library
11. STORY-M5: UI Copy
12. STORY-N7: Customization

### Round 6: Polish
13. STORY-N8: Celebrations
14. STORY-N9: Settings
15. STORY-N10: Export/Import

## Story Template for Issues

```markdown
## Story: [TITLE]

### Context
[Why this matters for ADHD/autism users]

### Acceptance Criteria
- [ ] Specific measurable outcome 1
- [ ] Specific measurable outcome 2
- [ ] Specific measurable outcome 3

### Technical Notes
- Key constraints (ES5, mobile-first)
- Dependencies
- Reusable assets from main app

### Success Metrics
- Performance target
- Accessibility requirement
- User experience goal
```