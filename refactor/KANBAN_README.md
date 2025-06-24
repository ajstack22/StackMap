# StackMap Kanban Workflow

## Overview

We're using a hybrid approach:
- **kanban.yaml**: Internal task management with rich workflow tracking
- **GitHub Issues**: External bug reports, feature requests, and developer communication

## Quick Start

```bash
# Make the script executable
chmod +x kanban.py

# View the board
./kanban.py board

# Create a new task (optionally link to GitHub issue)
./kanban.py new "Implement voice UI patterns" --gh 67

# Check planning status
./kanban.py ready task-1735074000

# Move through workflow
./kanban.py move task-1735074000 Ready
./kanban.py move task-1735074000 Developing
```

## Workflow States

### 1. Planning
New cards start here. Complete these before moving to Ready:
- **Research**: Findings from research, user studies, technical investigation
- **Story**: User story in standard format
- **Dev Prompt**: Detailed implementation instructions

```bash
# Add research findings
./kanban.py research task-123 "ADHD users need 2-3x larger touch targets on mobile"

# Add user story
./kanban.py story task-123 "As a user with motor control issues, I want larger buttons"

# Add development prompt
./kanban.py prompt task-123 "Implement 60px minimum touch targets in safe mode"
```

### 2. Ready
Cards with completed planning. These are ready for development.

### 3. Developing
Active development with three phases:
- **Plan Review**: PM and Dev discuss approach
- **Implementation**: Actual coding with commit tracking
- **Code Review**: Adversarial review process

### 4. Closed
Completed work. Can track if also closed on GitHub.

## Board View

```bash
./kanban.py board
```

Shows:
- WIP limits with warnings when exceeded
- GitHub issue links where applicable
- Clean columnar view

Example output:
```
╔══════════════════════════════════════════════════════════════╗
║                    StackMap Kanban Board                     ║
╚══════════════════════════════════════════════════════════════╝

Planning [2/5]
────────────────────────────────────────
  • task-1735074100: Photo Optimization for Mobile (#53)

Ready [0/10]
────────────────────────────────────────
  (empty)

Developing [⚠️  1/3]
────────────────────────────────────────
  • task-1735074000: SQLite Phase 2 - Migration System (#56)

Closed [3]
────────────────────────────────────────
  • task-1735073400: Today/Tomorrow View Implementation (#41)
  • task-1735073500: Service Worker Offline Support (#27)
  • task-1735073600: Mobile Attachment System (#24)
```

## Integration with Git

When committing, reference the task ID:
```bash
git commit -m "feat: implement photo optimization [task-1735074100]"
```

## Syncing with GitHub

Check if any linked GitHub issues have been closed:
```bash
./kanban.py sync
```

## Why This Approach?

1. **Rich Workflow Tracking**: Our YAML structure captures the entire planning → development → review cycle
2. **Offline First**: Works without internet, aligns with StackMap philosophy
3. **Conversation History**: Preserves plan review and code review discussions
4. **Flexible**: Easy to extend with new fields as needed
5. **Version Controlled**: Changes tracked in git alongside code

## Future Enhancements

Potential additions:
- TUI interface using `rich` or `textual`
- Automated git hooks for commit tracking
- Time tracking per phase
- Velocity metrics
- Bulk operations