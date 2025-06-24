# GitHub Issues to Create for StackMap Kanban Migration

## Instructions
1. Go to: https://github.com/yourusername/StackMap/issues
2. Create each issue below with the provided title and body
3. Add appropriate labels: `enhancement`, `research`, `mobile-first-refactor`
4. Create a GitHub Project board with columns: Planning, Ready, Developing, Closed
5. Add all issues (existing and new) to the project board

## New Issues to Create

### Issue 1: Notification Strategies Research
**Title:** Research: Notification Strategies for ADHD/Executive Dysfunction Users

**Labels:** `research`, `ux`, `accessibility`

**Body:**
Research optimal notification patterns for users with ADHD and executive dysfunction, focusing on:

- **Optimal timing**: When to send task reminders without overwhelming
- **RSD-safe language**: Non-judgmental, encouraging notification text
- **Frequency thresholds**: Avoiding notification fatigue
- **Recovery patterns**: Re-engaging users who've been away

**Key Questions:**
- How to handle task reminders for time-blind users?
- What notification styles reduce anxiety vs increase it?
- How to balance helpfulness with avoiding nagging?
- Platform-specific notification capabilities and limits?

**Deliverables:**
1. Notification timing framework
2. Language templates for different notification types
3. Settings recommendations (user control vs smart defaults)
4. Implementation guidelines per platform

**Related:** This research will inform the notification system implementation.

---

### Issue 2: Time Perception & Task Aging Research  
**Title:** Research: Time Perception & Visual Task Aging for ADHD Users

**Labels:** `research`, `ux`, `accessibility`

**Body:**
Research how ADHD users perceive task age and design visual indicators that inform without shaming.

**Focus Areas:**
- Time blindness patterns in ADHD
- Visual aging systems (color gradients, opacity, indicators)
- Emotional impact of seeing "old" tasks
- Behavioral patterns around task abandonment

**Key Questions:**
- How do users with time blindness understand "3 days ago"?
- What visual changes are helpful vs anxiety-inducing?
- When should old tasks roll over automatically?
- How to show age without implying failure?

**Deliverables:**
1. Aging indicator design framework
2. Non-shameful language for time descriptions
3. Interaction patterns for old tasks
4. Technical specs for implementing aging

**Related:** Connects to Today/Tomorrow view (#41) and task display systems.

---

### Issue 3: Capacitor iOS/Android Build Setup
**Title:** Set up Capacitor for iOS/Android native app distribution

**Labels:** `enhancement`, `mobile`, `infrastructure`

**Body:**
Configure Capacitor to build and distribute native iOS and Android apps from our PWA.

**Requirements:**
- [ ] Configure Capacitor for iOS build
- [ ] Configure Capacitor for Android build  
- [ ] Set up app signing and certificates
- [ ] Create build scripts for CI/CD
- [ ] Test on real devices (iOS and Android)
- [ ] Document build and release process

**Success Criteria:**
- Can build and install on iOS devices
- Can build and install on Android devices
- Maintains all PWA functionality
- Proper app icons and splash screens
- Works offline like PWA

**Note:** Capacitor is already initialized but needs platform-specific setup.

---

### Issue 4: Task Filtering & Search
**Title:** Implement task filtering and search functionality

**Labels:** `enhancement`, `ux`

**Body:**
Users need to quickly find specific tasks as their list grows.

**Requirements:**
- [ ] Search by task text (fuzzy matching)
- [ ] Filter by completion status
- [ ] Filter by date ranges
- [ ] Filter by attachments (has photo/voice)
- [ ] Save/quick access to common filters
- [ ] Maintain performance with large task lists

**UI/UX Considerations:**
- Simple, obvious search box
- One-tap filter presets
- Clear indicator when filters active
- Easy way to clear all filters

**Technical Notes:**
- Must work with SQLite storage
- Consider search indexing for performance
- Filters should persist across sessions

---

### Issue 5: Bulk Task Operations
**Title:** Implement bulk task management features

**Labels:** `enhancement`, `ux`

**Body:**
Users with ADHD often get overwhelmed by many tasks and need bulk management options.

**Requirements:**
- [ ] Select multiple tasks (with visual feedback)
- [ ] Bulk complete tasks
- [ ] Bulk delete tasks  
- [ ] Bulk move to tomorrow
- [ ] Bulk clear old tasks (with confirmation)
- [ ] Select all/none shortcuts

**ADHD Considerations:**
- Prevent accidental bulk deletes (undo option)
- Clear visual feedback for selected items
- Simple selection mechanism (checkbox mode?)
- Confirmation for destructive actions
- Quick way to exit bulk mode

**Related:** Works with Today/Tomorrow view (#41)

---

## Existing Issues to Add to Project Board

These issues already exist and should be added to the GitHub Project:

- #24 - Mobile Attachment System (Closed)
- #27 - Service Worker Offline Support (Closed)  
- #41 - Today/Tomorrow View Implementation (Closed)
- #53 - Photo Optimization for Mobile (Planning)
- #56 - SQLite Phase 2 - Migration System (Developing)
- #57 - SQLite Phase 3 - Performance Optimization (Developing)
- #58 - SQLite Phase 4 - Testing & Integration (Ready)
- #59 - Emergency Fallback Phase 4 (Closed)
- #60 - Welcome Tutorial Screens (Closed)
- #61 - Settings Page Implementation (Closed)

## Completed Research Without Issue

- Voice UI Patterns Research (Completed) - Full research available at: `./research/Voice UI design for ADHD users in task management apps.md`

This research should be referenced when implementing voice features in the attachment system.