# GitHub Issues to Create for Mobile-First Refactor

## 🚨 Critical Issues (P0) - Create Immediately

### 1. [P0-critical] Replace ES6 with ES5 for Android 5 compatibility
**Labels**: `P0-critical`, `bug`, `platform-android`, `refactor`  
**Milestone**: v0.1 - ES5 Compatibility

Research revealed const/let/arrow functions crash on Android 5 WebViews. 
- Replace all const/let with var
- Convert arrow functions to traditional
- Test on Android 5 emulator

### 2. [P0-critical] Create ES5 migration tracking meta-issue
**Labels**: `P0-critical`, `refactor`, `meta`  
**Milestone**: v0.1 - ES5 Compatibility

Track all ES5 conversion tasks:
- [ ] /refactor/js/app.js
- [ ] Future JS files
- [ ] Build process to catch ES6

## 🔴 High Priority Issues (P1)

### 3. [P1-high] Implement navigation depth limiting (2-3 levels max)
**Labels**: `P1-high`, `feature`, `adhd`, `cognitive`  
**Milestone**: v0.2 - Core Navigation

Research shows 2-3 levels maximum for ADHD users.
- Track navigation stack
- Add breadcrumbs
- Prevent deeper navigation

### 4. [P1-high] Add focus management for screen readers
**Labels**: `P1-high`, `bug`, `accessibility`  
**Milestone**: v0.2 - Core Navigation

Screen reader users lose context after view changes.
- Set focus after navigation
- Announce view changes
- Maintain focus during transitions

### 5. [P1-high] Implement offline storage foundation
**Labels**: `P1-high`, `feature`, `offline`  
**Milestone**: v0.3 - Offline Storage

Start with localStorage, upgrade to IndexedDB.
- Implement StorageManager
- Add quota handling
- Create sync queue

## 🔶 Research Issues

### 6. [Research] Conflict Resolution UX for Neurodivergent Users
**Labels**: `research`, `adhd`, `autism`, `P2-medium`

How to handle the 5% of conflicts CRDT can't auto-resolve?
- Visual metaphors for versions
- Anxiety-free messaging
- Auto-resolve with undo option?

### 7. [Research] Error Recovery Patterns for Executive Function
**Labels**: `research`, `adhd`, `cognitive`, `P1-high`

How do users recover from mistakes?
- Undo/redo patterns
- Auto-save vs explicit save
- Getting "unstuck" flows

### 8. [Research] Multi-Device Family Synchronization
**Labels**: `research`, `sync`, `P1-high`

Parent/caregiver device coordination:
- Account relationships
- Privacy boundaries
- Conflict handling

### 9. [Research] Zero-Disruption Migration Strategy
**Labels**: `research`, `migration`, `P1-high`

Moving users without breaking routines:
- Data migration approach
- UI transition strategy
- Fallback handling

### 10. [Research] Voice Command Grammar for Special Needs
**Labels**: `research`, `accessibility`, `platform-tv`, `P2-medium`

TV voice control patterns:
- Command structures
- Error tolerance
- Speech variations

## 🟡 Medium Priority Issues (P2)

### 11. [P2-medium] Implement TV spatial navigation (LRUD)
**Labels**: `P2-medium`, `feature`, `platform-tv`, `accessibility`  
**Milestone**: v0.2 - Core Navigation

Current TV nav is too basic.
- Implement spatial algorithm
- 48x48dp minimum targets
- Circular navigation

### 12. [P2-medium] Add animation speed controls
**Labels**: `P2-medium`, `feature`, `adhd`, `autism`  
**Milestone**: v0.4 - Accessibility

200-300ms for ADHD, reduced motion for autism.
- User preference settings
- Platform detection
- Respect prefers-reduced-motion

### 13. [P2-medium] Create offline indicator system
**Labels**: `P2-medium`, `feature`, `offline`, `ux`  
**Milestone**: v0.3 - Offline Storage

Static indicators, no spinning.
- Subtle visual feedback
- Persistent banner option
- Clear messaging

## 🟢 Documentation & Process Issues

### 14. [Docs] Create developer onboarding guide
**Labels**: `documentation`, `good-first-issue`

How to contribute to mobile-first refactor:
- Setup instructions
- Architecture overview
- Common patterns

### 15. [Process] Set up GitHub Actions for ES5 checking
**Labels**: `automation`, `ci/cd`

Automated checks for ES6 features:
- Lint for const/let/arrows
- Android 5 compatibility test
- Performance budgets

## 📊 Meta Issues

### 16. [Meta] Mobile-First Refactor Roadmap
**Labels**: `meta`, `roadmap`

Track overall progress:
- [ ] ES5 Compatibility (Critical)
- [ ] Core Navigation
- [ ] Offline Storage
- [ ] Accessibility
- [ ] Platform Testing

### 17. [Meta] Research Findings Integration
**Labels**: `meta`, `research`

Track research implementation:
- [ ] Navigation patterns applied
- [ ] Offline architecture implemented
- [ ] TV accessibility complete
- [ ] Cross-platform verified

## 🏷️ Label Structure

### Priority Labels
- `P0-critical` - Blocks everything
- `P1-high` - Blocks major features
- `P2-medium` - Important but not blocking
- `P3-low` - Nice to have

### Type Labels
- `bug` - Something broken
- `feature` - New functionality
- `research` - Needs investigation
- `refactor` - Code improvement
- `documentation` - Docs only
- `meta` - Tracking issue

### Platform Labels
- `platform-web`
- `platform-pwa`
- `platform-ios`
- `platform-android`
- `platform-tv`

### User Need Labels
- `adhd`
- `autism`
- `motor`
- `cognitive`
- `accessibility`

## 🚀 Quick Issue Creation

```bash
# Use GitHub CLI to create issues quickly
gh issue create --title "[P0-critical] Replace ES6 with ES5" \
  --label "P0-critical,bug,platform-android" \
  --milestone "v0.1 - ES5 Compatibility" \
  --body "See issue template"
```

## 📋 Next Steps

1. Create milestones in GitHub
2. Add all labels to repository
3. Create P0-critical issues first
4. Link issues to project board
5. Start with ES5 conversion!