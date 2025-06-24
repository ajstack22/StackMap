# PM Round Checklist - Foundry Workflow

## 🎯 Ideal PM Round Flow

In a perfect world, each PM round moves all files down one stage:
1. **New Research Prompts** → 1-ResearchPrompt
2. **Research Reports** → Stories → Archive reports
3. **Stories** → Developer picks up → PlanReview
4. **PlanReview** → PM review → ReadyToDevelop
5. **ReadyToDevelop** → Developer implements → CodeReview
6. **CodeReview** → PM review → Completed

## 📋 Current Backlog for Next Research Round

### 🚨 Critical Bugs (Week 1 Priority)
1. **Issue #55 - Photo Storage Race Condition**
   - Status: CRITICAL - Causing crashes
   - Research needed: Async storage patterns preventing race conditions in ADHD apps
   - Focus: Fail-safe attachment handling, recovery mechanisms

2. **Issue #34 - SQLite Migration Data Safety**
   - Status: HIGH - Risk of data loss
   - Research needed: Neurodivergent-safe data migration patterns
   - Focus: Zero data loss, clear progress, rollback capability

### 🏗️ Core Features (Week 2-3)
3. **Issue #28 - Task CRUD UI**
   - Research needed: ADHD-friendly create/read/update/delete patterns
   - Focus: Progressive disclosure, confirmation patterns, undo safety

4. **Issue #29 - User System**
   - Research needed: Multi-user support for neurodivergent households
   - Focus: Context switching, privacy, profile management

5. **Issue #26 - Default Activities Migration**
   - Research needed: Organizing 50+ pre-made activities for ADHD discovery
   - Focus: Categorization, search, personalization

### 🆕 Unfiled Issues Needing Research
6. **Notification Strategies**
   - Research needed: Non-anxiety-inducing notifications for ADHD
   - Focus: Gentle reminders, customizable urgency

7. **Time Perception & Task Aging**
   - Research needed: Visual indicators for task age (ADHD time blindness)
   - Focus: Progressive visual changes, urgency without panic

8. **Task Filtering & Search**
   - Research needed: ADHD-friendly search and filter patterns
   - Focus: Fuzzy matching, visual filtering, saved searches

9. **Bulk Task Operations**
   - Research needed: Managing multiple tasks without overwhelm
   - Focus: Progressive selection, clear preview, easy undo

### 📊 Other Known Gaps
- Issue #6: Recurring Tasks
- Issue #9: Task Templates
- Issue #11: Task Dependencies
- Issue #12: Task Notes/Subtasks
- Issue #21: Offline Sync

## 🔄 Current Pipeline Status

### Ready for Research (1-ResearchPrompt)
- Currently EMPTY ✅
- Next: Add critical bugs #55, #34

### Awaiting Developer Stories (3-Stories)
- 6 stories waiting:
  - #19 Performance (→ has plan in ReadyToDevelop)
  - #20 Alternative Input
  - #24 Voice (→ has plan in ReadyToDevelop)
  - #46 Keyboard Navigation
  - #47 Undo System
  - #53 Photo (→ has plan in ReadyToDevelop)

### Ready for Development (5-ReadyToDevelop)
- 3 plans ready:
  - #19 Performance Thresholds
  - #24 Voice Attachments
  - #53 Photo Attachments

## 📝 Next PM Actions

1. **Create research prompts for critical bugs** (#55, #34)
2. **Follow up on 3 stories awaiting developer plans** (#20, #46, #47)
3. **Monitor 3 plans in ReadyToDevelop** for implementation
4. **Prepare next batch of research prompts** (core features)

## 🎯 Success Metrics
- All stages have active items moving through
- No stage sits empty for more than 1 round
- Critical bugs addressed within 1 week
- Research → Implementation cycle < 2 weeks