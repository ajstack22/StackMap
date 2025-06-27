# GitHub-Centric Workflow for Mobile-First Refactor

## 🎯 Everything Lives in GitHub

All development, documentation, and decisions flow through GitHub:

### Issue Templates

Create these issue templates in `.github/ISSUE_TEMPLATE/`:

1. **bug-report.yml** - Structured bug reporting
2. **feature-request.yml** - New feature proposals
3. **research-question.yml** - Research needs
4. **code-review.yml** - Adversarial review requests
5. **migration-task.yml** - ES5 conversion tasks

### Labels System

```yaml
# Priority
- P0-critical: App breaking, fix immediately
- P1-high: Major functionality affected
- P2-medium: Important but not urgent
- P3-low: Nice to have

# Type
- bug: Something broken
- feature: New functionality
- research: Needs investigation
- refactor: Code improvement
- docs: Documentation

# Platform
- platform-web: Web browser specific
- platform-pwa: PWA specific
- platform-ios: iOS/Capacitor
- platform-android: Android/Capacitor
- platform-tv: TV interfaces

# Special Needs
- adhd: ADHD-specific consideration
- autism: Autism-specific consideration
- motor: Motor accessibility
- cognitive: Cognitive accessibility
```

### Milestones

1. **v0.1 - ES5 Compatibility** (Critical)
   - Fix all const/let/arrow functions
   - Ensure Android 5 compatibility

2. **v0.2 - Core Navigation**
   - 2-3 level depth limit
   - Focus management
   - TV spatial navigation

3. **v0.3 - Offline Storage**
   - IndexedDB implementation
   - SQLite for Capacitor
   - Sync queue management

4. **v0.4 - Accessibility**
   - Screen reader support
   - Voice commands
   - Alternative inputs

### Project Board

**Mobile-First Refactor Board**
- Backlog
- Research Needed
- In Progress
- In Review
- Done

## 📝 GitHub Issues for Current Work

### Critical Issues to Create

```markdown
# Issue #1: [P0-critical] Replace ES6 with ES5 for Android 5 compatibility
**Labels**: `P0-critical`, `bug`, `platform-android`, `refactor`
**Milestone**: v0.1 - ES5 Compatibility

## Problem
Research revealed const/let/arrow functions crash on Android 5 WebViews used in schools.

## Tasks
- [ ] Replace all `const`/`let` with `var`
- [ ] Convert arrow functions to traditional functions
- [ ] Remove classes, use constructor functions
- [ ] Replace for...of loops with traditional for loops
- [ ] Test on Android 5 emulator

## Files Affected
- `/refactor/js/app.js`
- All future JS files

## Acceptance Criteria
- App loads on Android 5.0 WebView
- No parse errors in console
- All functionality preserved
```

```markdown
# Issue #2: [P1-high] Implement navigation depth limiting
**Labels**: `P1-high`, `feature`, `adhd`, `cognitive`
**Milestone**: v0.2 - Core Navigation

## Context
Research shows 2-3 navigation levels maximum for ADHD users.

## Implementation
- Track navigation stack
- Prevent deeper navigation
- Show appropriate messaging
- Add breadcrumb navigation

## Acceptance Criteria
- Cannot navigate deeper than 3 levels
- Clear indication of current location
- Easy return to main view
```

### Research Issues

```markdown
# Issue #3: [Research] Conflict Resolution UX for Neurodivergent Users
**Labels**: `research`, `adhd`, `autism`, `P2-medium`

## Background
CRDT handles 95% of conflicts automatically, but 5% need user input.

## Research Questions
- How to communicate conflicts without anxiety?
- What visual metaphors work for "versions"?
- Should we auto-resolve with undo instead?

## Deliverables
- UI mockups for conflict resolution
- Copy guidelines for conflict messaging
- Decision flow diagram
```

## 🔄 Development Flow

### 1. Start Work
```bash
# Create issue first
# Then create branch from issue
git checkout -b 23-implement-navigation-depth
```

### 2. Commit with Issue References
```bash
git commit -m "feat: add navigation depth tracking #23

- Implements NavigationStack manager
- Limits depth to 3 levels maximum
- Adds breadcrumb component

Addresses #23"
```

### 3. Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (fixes #__)
- [ ] New feature (fixes #__)
- [ ] Refactor
- [ ] Documentation

## Platform Testing
- [ ] Web browser
- [ ] PWA
- [ ] iOS Capacitor
- [ ] Android Capacitor
- [ ] TV navigation

## Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader
- [ ] Touch targets 44px+
- [ ] Color contrast

## Adversarial Review
- [ ] Security review complete
- [ ] Performance review complete
- [ ] Accessibility review complete
- [ ] Chaos testing complete

Closes #23
```

### 4. Code Review via GitHub

Use review comments for adversarial review findings:

```markdown
# Review Comment Example
🔴 **[CRITICAL]** Memory leak detected

The event listener on line 145 is never removed, causing memory accumulation.

**Suggested fix**:
```javascript
// Store reference
this.clickHandler = this.handleClick.bind(this);
element.addEventListener('click', this.clickHandler);

// In cleanup
element.removeEventListener('click', this.clickHandler);
```
```

## 📋 GitHub Actions

### Automated Workflows

```yaml
# .github/workflows/compatibility-check.yml
name: ES5 Compatibility Check

on: [push, pull_request]

jobs:
  check-es5:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check for ES6 features
        run: |
          # Detect const/let/arrows
          ! grep -r "const\|let\|=>" refactor/js/
```

## 🏷️ Issue Organization

### By Platform
- https://github.com/ajstack22/StackMap/labels/platform-android
- https://github.com/ajstack22/StackMap/labels/platform-ios
- https://github.com/ajstack22/StackMap/labels/platform-tv

### By User Need
- https://github.com/ajstack22/StackMap/labels/adhd
- https://github.com/ajstack22/StackMap/labels/autism
- https://github.com/ajstack22/StackMap/labels/motor

### By Priority
- https://github.com/ajstack22/StackMap/labels/P0-critical
- https://github.com/ajstack22/StackMap/labels/P1-high

## 📊 Progress Tracking

### GitHub Projects
Use GitHub Projects (v2) for visual tracking:
- Kanban board for development
- Roadmap view for milestones
- Table view for prioritization

### Discussions
Use GitHub Discussions for:
- Architecture decisions
- Research findings
- User feedback
- Team updates

## 🚀 Getting Started

1. Go to: https://github.com/ajstack22/StackMap/issues
2. Create issues using templates
3. Assign labels and milestones
4. Link issues to project board
5. Start development with issue branches

Everything flows through GitHub - no external tools needed!