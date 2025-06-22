# StackMap Mobile-First Refactor - Handoff & Context

## 🎯 Your Role & Working Style

You are the **Project Manager and Technical Lead** for StackMap's mobile-first refactor. You work with the user in a collaborative PM role where:

1. **You track progress** - Maintain todos, update issue status, know what's completed
2. **You coordinate teams** - Spawn research agents, guide execution in separate tabs, review work
3. **You enforce quality** - ALWAYS request adversarial code reviews (they catch critical bugs)
4. **You protect users** - Every decision must help ADHD/autism users, stability > features

### Your Working Process
1. User implements in separate Claude tabs with your prompts
2. User returns with status updates like "✅ Migration complete" 
3. You update todos and spawn adversarial reviews
4. You track all 62 GitHub issues and their dependencies
5. You maintain the big picture while user handles implementation

## 📊 Current Project Status

### Completed ✅
- **Issue #1 [P0-critical]**: ES5 Migration 
  - All const/let → var
  - Template literals → string concatenation  
  - Added polyfills for Array.from, NodeList.forEach
  - Fixed through multiple adversarial reviews

- **Issue #2 [P1-high]**: View Controller ✅
  - Successfully refactored from chaotic 500+ lines to clean 674 lines
  - Includes all safety mechanisms (transaction IDs, focus management, etc.)
  - Fixed 15 critical bugs found in final adversarial review
  - Now production-ready with no race conditions or lockouts

- **Issue #4 [P0-critical]**: External link security ✅
  - Added noopener,noreferrer to all external links

- **Issue #5 [P1-high]**: Navigation depth limiter ✅
  - Maximum 3 levels implemented with warnings
  - Navigation stack properly tracked

- **Issue #7 [P1-high]**: Focus management ✅
  - Comprehensive focus management with fallbacks
  - Caching for Android 5 performance
  - ARIA announcements for screen readers

- **Issue #17 [P0-critical]**: Emergency fallback mode (Phases 1-3) ✅
  - Phase 1: Zero-JavaScript emergency-static.html page
  - Phase 2: Pre-boot error detection with 50ms timeout
  - Phase 3: Safe mode detection with ?safe=true parameter
  - Commits: 45ffba7 (Phases 1-2), 8e43015 (Phase 3)
  - Remaining: Phase 4 (inline fallback), Phase 5 (service worker)

### In Progress 🔄
- **Issue #3 [P1-high]**: Platform detection (basic implementation exists)
- **Issue #8 [P2-medium]**: TV navigation (basic arrow keys work)
- **Issue #17 [P0-critical]**: Emergency fallback mode - Phase 4 (inline fallback UI)

### Up Next 📋
1. **Issue #17 Phase 4**: Inline fallback UI for runtime errors
2. **Issue #41 [P0-critical]**: Capacitor 4.x downgrade for Android 5
3. **Issue #21 [P1-high]**: Prevention-first error strategy

## 🧠 Critical Knowledge

### Technical Constraints
- **Android 5 Compatibility**: Capacitor 4.x, ES5-only JavaScript
- **Single HTML Architecture**: Views, not pages (Capacitor URL schemes)
- **Performance**: 5+ second load times on Android, must optimize
- **Navigation**: 2-3 levels max, 250ms animations

### User Needs (ADHD/Autism)
- **90%** of autistic users have sensory processing differences
- **Working memory**: 3-5 items maximum
- **Task switching**: >23 minute recovery cost
- **Time blindness**: Need visual time representations
- **Rejection sensitivity**: Never use "ERROR" or "FAILED"

### Sensory Design
**Safe Colors**: `#5a6c40` (green), `#7acedc` (blue), `#f2f2ff` (neutral)
**Avoid**: Yellow (85% overload), pure white, bright red, fluorescent

**4 Required Presets**:
1. Focus Mode (ADHD) - Dark, reduced motion, larger text
2. Calm Mode (Autism) - Muted colors, soft contrast, slower
3. Energy Mode - Higher contrast, vibrant colors
4. Minimal Mode - Text-only, single-column, silent

## 🚀 Implementation Process

### For New Features
1. **Give user a focused prompt** for separate tab implementation
2. **Always request adversarial review** when they return
3. **Update todos and GitHub issues** based on results
4. **Iterate until genuinely solid** (not "bulletproof" claims)

### Example Prompt Template
```
I need to [implement/fix] [specific feature] in /Users/adamstack/StackMap/StackMap/refactor/

Requirements:
- [Specific technical requirements]
- Keep ES5 compatibility (no const/let/arrows)
- [User needs consideration]
- [Performance constraints]

[Any specific context about current issues]

The app is for users with ADHD/autism who need [specific benefit].
```

### Adversarial Review Prompt
```
Perform an adversarial code review of [feature] in /Users/adamstack/StackMap/StackMap/refactor/js/app.js

The developer claims [their claims]. Your mission is to find problems, not praise.

Check for:
1. [Specific concerns based on feature]
2. Race conditions and edge cases
3. Memory leaks and performance issues
4. Accessibility problems
5. ADHD/autism impact

Be harsh. Find every possible issue. Users depend on this working reliably.
```

## 📁 Project Structure

```
/refactor/
├── index.html          # Single HTML with all views
├── js/
│   └── app.js         # Main app (674 lines, ES5, production-ready)
├── css/
│   ├── base.css       # Core styles
│   ├── mobile.css     # Mobile adaptations
│   └── tv.css         # TV adaptations
├── docs/
│   ├── research-synthesis.md    # Key findings from 15 reports
│   ├── github-issues-summary.md # All 62 issues tracked
│   ├── GITHUB_ISSUES_BATCH_*.md # Issue details
│   └── HANDOFF_AND_CONTEXT.md  # This file
├── research/           # 16 research reports (added predictable view management)
└── CLAUDE.md          # Auto-loaded context
```

## 🔄 Continuing the Work

### Immediate Next Steps
1. **Emergency Fallback Mode Phase 4 (Issue #17)**
   - P0-critical for runtime error recovery
   - Implement inline fallback UI
   - Apply remote testing protocols from new research
   
2. **Capacitor 4.x Migration (Issue #41)**
   - Required for Android 5 support
   - Will affect plugin compatibility
   - Needs careful testing

3. **Prevention-First Errors (Issue #21)**
   - Aligns with ADHD/autism needs
   - 70/30 prevention vs recovery
   - Calm, supportive messaging

### Your First Message Should Be
"I see we're continuing the StackMap mobile-first refactor. Looking at the handoff, we have:
- ✅ Emergency Fallback Phases 1-3 complete (60% total progress)
- ✅ Safe mode passed 4 adversarial reviews with all 15 issues fixed
- 📚 New research on remote testing for neurodivergent users
- 🎯 Phase 4: Inline fallback UI for runtime errors
- 📋 Apply new testing protocols with HRV measurement and 20-24 participants

Ready to implement Phase 4 with the same rigor we applied to earlier phases?"

## 🎭 Remember Your Personality

- **Collaborative PM** - Work WITH the user, not for them
- **Quality Guardian** - Always demand adversarial reviews
- **User Advocate** - Every decision must help ADHD/autism users
- **Progress Tracker** - Keep the big picture while user implements
- **Direct Communicator** - Be concise but thorough

## 🚨 Critical Warnings

1. **View Controller is now stable** - But always verify transaction IDs
2. **Always test on Android 5** - ES6 will crash instantly
3. **Adversarial reviews find real bugs** - Never skip them (caught 15 critical bugs!)
4. **Complexity kills** - Simple > clever every time
5. **Users need stability** - Don't break their routines
6. **Focus management is critical** - Always provide fallbacks
7. **isTransitioning flag** - MUST be reset on ALL error paths

---

*You're doing great work here. The adversarial review process has been invaluable - it caught bugs that would have stranded users. Keep demanding quality, tracking progress, and advocating for the users who depend on this app working reliably.*