# Prioritized Work Groups for StackMap Mobile Refactor

## 🚨 Critical Process Reminder
Every developer MUST:
1. Post implementation plan to GitHub issue for PM adversarial review BEFORE coding
2. Get plan approved by PM
3. Implement
4. Post completion status to GitHub for final adversarial review
5. Wait for PM approval before merging

**THINK HARD - This is SUPER IMPORTANT for our ADHD/autism users!**

## Group A: Critical Fixes (Week 1)
**Must be done first - blocking issues**

### A-critical-55-photo-storage-fix.md
- **Issue #55**: Fix photo attachment storage race condition
- **Priority**: CRITICAL 🚨
- **Why**: Users can't add activity cards without crashes

### A-quick-21-help-privacy-links.md  
- **Issue #21**: Fix help & privacy links in mobile
- **Priority**: HIGH (Quick Win)
- **Why**: Broken links erode trust, required for app stores

## Group B: Core Functionality (Week 2) 
**Can work on all three simultaneously after Group A**

### B-core-30-edit-mode-system.md
- **Issue #30**: Implement edit mode system
- **Priority**: HIGH
- **Why**: Prevents accidental task modifications

### B-core-31-drag-drop-reorder.md
- **Issue #31**: Implement drag and drop reordering
- **Priority**: HIGH  
- **Depends on**: Issue #30 (Edit Mode)
- **Why**: Task prioritization critical for ADHD

### B-core-23-sqlite-storage.md
- **Issue #23**: Implement SQLite storage
- **Priority**: HIGH
- **Why**: Foundation for offline-first architecture

## Group C: Features (Week 3)
**After core functionality is stable**

### C-feature-41-today-tomorrow.md
- **Issue #41**: Today/Tomorrow day support
- **Priority**: MEDIUM
- **Why**: Time blindness support for ADHD

### C-feature-24-mobile-attachments.md
- **Issue #24**: Mobile attachment handling  
- **Priority**: MEDIUM
- **Depends on**: Issue #55 fix
- **Why**: Multi-modal memory aids

## Group D: Polish & Testing (Week 4)
**Final polish and comprehensive testing**

### D-polish-19-visual-performance.md
- **Issue #19**: Visual polish & performance
- **Priority**: MEDIUM
- **Why**: 60fps critical for ADHD focus

### D-polish-20-alternative-interactions.md
- **Issue #20**: Alternative interactions
- **Priority**: MEDIUM
- **Why**: Accessibility for motor differences

### D-testing-25-mobile-storage.md
- **Issue #25**: Comprehensive storage testing
- **Priority**: MEDIUM
- **Why**: Prevent data loss scenarios

## Group E: Infrastructure (Parallel)
**Can be worked on anytime by DevOps team**

### E-infra-14-npm-install-fix.md
- **Issue #14**: Fix npm install hanging
- **Priority**: HIGH
- **Why**: Blocks all CI/CD

### E-infra-13-atomic-deployment.md
- **Issue #13**: Atomic deployment
- **Priority**: HIGH
- **Why**: Prevent broken deployments

### E-infra-15-staging-environment.md  
- **Issue #15**: Staging environment
- **Priority**: MEDIUM
- **Why**: Test before production

### E-infra-16-rollback-system.md
- **Issue #16**: One-click rollback
- **Priority**: MEDIUM  
- **Why**: Fast recovery when things break

## Work Distribution Strategy

### Week 1 Focus
- **Developer 1**: Issue #55 (Photo storage fix)
- **Developer 2**: Issue #21 (Links fix) + Start Issue #14 (npm)
- **DevOps**: Issues #14, #13

### Week 2 Focus  
- **Developer 1**: Issue #30 (Edit mode)
- **Developer 2**: Issue #23 (SQLite)
- **Developer 3**: Issue #31 (Drag/drop) after #30
- **DevOps**: Issues #15, #16

### Week 3 Focus
- **Developer 1**: Issue #41 (Today/Tomorrow)
- **Developer 2**: Issue #24 (Attachments)
- **Developer 3**: Issue #19 (Visual polish)

### Week 4 Focus
- **Developer 1**: Issue #20 (Alternative interactions)
- **Developer 2**: Issue #25 (Testing)
- **All**: Bug fixes and final polish

## Dependencies Graph
```
#55 (Photo Fix) ──→ #24 (Attachments)
                └──→ Activity Cards Work

#30 (Edit Mode) ──→ #31 (Drag/Drop)

#23 (SQLite) ──→ Many future features

#14 (npm fix) ──→ All CI/CD work
```

## Success Metrics
- Week 1: Critical bugs fixed, CI/CD working
- Week 2: Core functionality complete
- Week 3: Key features implemented  
- Week 4: Polished and thoroughly tested

Remember: Every issue represents real user pain. Our ADHD/autism users depend on us to build reliable, thoughtful solutions!