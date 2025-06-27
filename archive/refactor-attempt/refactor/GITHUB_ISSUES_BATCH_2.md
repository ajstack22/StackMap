# GitHub Issues Batch 2: Research-Based Features

## Based on New Research Reports

### From Error Recovery Research

#### 18. [P1-high] Implement comprehensive undo/redo system
**Labels**: `P1-high`, `feature`, `adhd`, `cognitive`  
**Milestone**: v0.4 - Accessibility

Research shows ADHD users need 10-15 visible recent actions with up to 100 in history.
- Command pattern architecture
- Clear action descriptions
- Non-destructive branch history
- Both gesture and button access

#### 19. [P1-high] Create hybrid auto-save system
**Labels**: `P1-high`, `feature`, `adhd`, `offline`  
**Milestone**: v0.3 - Offline Storage

Balance safety with user agency:
- Auto-save drafts every 30-60 seconds
- Visual indicators "Draft saved 2 minutes ago"
- Explicit save/publish buttons
- Multi-channel feedback

#### 20. [P2-medium] Design ADHD paralysis recovery patterns
**Labels**: `P2-medium`, `feature`, `adhd`, `ux`  
**Milestone**: v0.4 - Accessibility

Help users get "unstuck":
- Progressive disclosure (3-5 initial options)
- Visual progress indicators
- "Task Jar" random selection
- Environment change triggers

#### 21. [P1-high] Implement prevention-first error strategy
**Labels**: `P1-high`, `feature`, `accessibility`  
**Milestone**: v0.2 - Core Navigation

70% prevention, 30% recovery approach:
- Smart defaults
- Real-time validation
- Format forgiveness
- Input constraints

### From Multi-Device Sync Research

#### 22. [P1-high] Design family account architecture
**Labels**: `P1-high`, `feature`, `sync`, `privacy`  
**Milestone**: v0.5 - Family Features

Three-tier system:
- Primary account holders (parents)
- User accounts (ADHD/autism individuals)
- Secondary caregivers (therapists)
- Progressive permissions

#### 23. [P0-critical] Implement COPPA compliance
**Labels**: `P0-critical`, `legal`, `privacy`  
**Milestone**: v0.5 - Family Features

For users under 13:
- Verifiable parental consent
- Data minimization
- No behavioral advertising
- Parent access rights

#### 24. [P1-high] Create graduated independence system
**Labels**: `P1-high`, `feature`, `adhd`, `autism`  
**Milestone**: v0.5 - Family Features

Progressive autonomy:
- Task-based permissions
- Competency tracking
- Automatic graduation
- Age 18 transition planning

#### 25. [P2-medium] Build CRDT conflict resolution
**Labels**: `P2-medium`, `feature`, `sync`, `offline`  
**Milestone**: v0.3 - Offline Storage

Multi-layer approach:
- CRDT for basic properties
- OT for critical scheduling
- Visual conflict presentation
- Single-click resolution

### Cross-Cutting Issues

#### 26. [P1-high] Create sensory-aware notification system
**Labels**: `P1-high`, `feature`, `autism`, `accessibility`  
**Milestone**: v0.4 - Accessibility

From both research reports:
- Multi-modal options
- Granular control
- Soft colors/sounds
- Optional animations

#### 27. [P2-medium] Implement state preservation
**Labels**: `P2-medium`, `feature`, `adhd`, `offline`  
**Milestone**: v0.3 - Offline Storage

Critical for working memory:
- Persist all context on errors
- Breadcrumb navigation
- Re-display entered data
- Visual state indicators

## Updated Milestones

### v0.1 - ES5 Compatibility ✅
- Emergency fixes for Android 5

### v0.2 - Core Navigation
- Navigation depth limits
- Focus management
- Prevention-first errors

### v0.3 - Offline Storage
- IndexedDB/SQLite
- CRDT foundation
- State preservation
- Hybrid auto-save

### v0.4 - Accessibility
- Undo/redo system
- Paralysis recovery
- Sensory notifications
- Voice commands

### v0.5 - Family Features
- Account architecture
- COPPA compliance
- Graduated independence
- Multi-device sync

## Key Research Insights Applied

### From Error Recovery Research
- **Working memory**: ADHD users hold only 3-5 items
- **Rejection Sensitive Dysphoria**: Intense emotional response to failure
- **100 undo steps**: No UX reason to limit
- **70/30 rule**: 70% prevention, 30% recovery effort

### From Multi-Device Sync Research
- **Progressive autonomy**: Build independence gradually
- **Scaffolding over surveillance**: Support without dependence
- **COPPA requirements**: Strict for under-13 users
- **Family trust**: Technical failures multiply impact

## Priority Order for Implementation

1. **COPPA Compliance** (legal requirement)
2. **Comprehensive undo/redo** (critical for ADHD)
3. **Family account architecture** (enables sync)
4. **Hybrid auto-save** (prevents data loss)
5. **Prevention-first errors** (reduces cognitive load)
6. **Graduated independence** (therapeutic goal)

## GitHub CLI Commands

```bash
# Create high-priority undo/redo issue
gh issue create --title "[P1-high] Implement comprehensive undo/redo system" \
  --label "P1-high,feature,adhd,cognitive" \
  --milestone "v0.4 - Accessibility" \
  --body "See research findings in Error Recovery report"

# Create COPPA compliance issue
gh issue create --title "[P0-critical] Implement COPPA compliance" \
  --label "P0-critical,legal,privacy" \
  --milestone "v0.5 - Family Features" \
  --body "Legal requirement for users under 13"
```