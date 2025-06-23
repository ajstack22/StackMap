# StackMap Issue Backlog - Prioritized Breakdown

*Last Updated: December 2024*

## 🚨 Critical Issues (Week 1)

### 1. Issue #34: Fix SQLite Migration Data Safety
- **Priority**: CRITICAL ⚡
- **Type**: Bug (Data Loss)
- **Impact**: Users could lose all tasks during migration
- **Effort**: 1-2 days
- **Why Now**: Blocks all database work, breaks user trust

### 2. Issue #18: Fix Touch/Scroll Conflict
- **Priority**: CRITICAL 🔥
- **Type**: Bug (Mobile UX)
- **Impact**: Can't scroll without accidentally grabbing cards
- **Effort**: 1 day
- **Why Now**: Core functionality broken on mobile

### 3. Issue #26: Migrate Default Activities
- **Priority**: HIGH ✅
- **Type**: Enhancement (Good First Issue)
- **Impact**: 50+ pre-made activities for users
- **Effort**: 2-3 hours
- **Why Now**: Quick win, high value

### 4. Issue #12: Fix FTP Deployments
- **Priority**: HIGH
- **Type**: Infrastructure
- **Impact**: Prevents production outages
- **Effort**: 3 hours
- **Why Now**: Deployment reliability

## 📱 High Priority - Core Mobile (Week 2)

### 5. Issue #23: Implement SQLite Storage
- **Priority**: HIGH
- **Type**: Infrastructure
- **Impact**: Foundation for offline-first
- **Effort**: 25-30 hours
- **Depends On**: #34 completion

### 6. Issue #19: Visual Polish & Performance
- **Priority**: HIGH
- **Type**: Enhancement
- **Impact**: 60fps, better accessibility
- **Effort**: 2-3 days
- **Depends On**: #18 completion

## 🔧 Medium Priority - Core Features (Weeks 3-4)

### 7. Issue #28: Task CRUD UI
- **Priority**: MEDIUM
- **Type**: Feature
- **Impact**: Core task management
- **Effort**: 2 days
- **Depends On**: #23 (SQLite)

### 8. Issue #30: Edit Mode System
- **Priority**: MEDIUM
- **Type**: Feature
- **Impact**: Prevents accidental changes
- **Effort**: 1 day
- **Depends On**: #28

### 9. Issue #29: User System
- **Priority**: MEDIUM
- **Type**: Feature
- **Impact**: Multi-user support
- **Effort**: 2 days
- **Depends On**: #28

### 10. Issue #41: Today/Tomorrow Support
- **Priority**: MEDIUM
- **Type**: Feature
- **Impact**: ADHD planning support
- **Effort**: 2 days
- **Depends On**: #29

### 11. Issue #31: Drag & Drop Reordering
- **Priority**: MEDIUM
- **Type**: Feature
- **Impact**: Task prioritization
- **Effort**: 2-3 days
- **Depends On**: #30, #18

## 🏗️ Infrastructure (Week 5)

### 12. Issue #14: Fix npm Install Hanging
- **Priority**: MEDIUM
- **Type**: Bug
- **Impact**: 30+ min → 3 min builds
- **Effort**: 1 day

### 13. Issue #13: Atomic Deployments
- **Priority**: MEDIUM
- **Type**: Infrastructure
- **Impact**: Zero downtime
- **Effort**: 2 days
- **Depends On**: #12

## 📋 Lower Priority - Polish (Week 6+)

### 14. Issue #21: Fix Help/Privacy Links
- **Priority**: LOW
- **Type**: Bug
- **Impact**: Broken links in mobile
- **Effort**: 2 hours

### 15. Issue #9: Service Worker CSS
- **Priority**: LOW
- **Type**: Bug
- **Impact**: CSS not updating
- **Effort**: 1 day

### 16. Issue #20: Alternative Interactions
- **Priority**: LOW
- **Type**: Enhancement
- **Impact**: Final polish
- **Effort**: 1 week
- **Depends On**: #19

### 17. Issue #24: Mobile Attachments
- **Priority**: LOW
- **Type**: Feature
- **Impact**: Photo backend
- **Effort**: 3-4 days
- **Depends On**: #23

### 18. Issue #25: Testing Suite
- **Priority**: LOW
- **Type**: Testing
- **Impact**: Prevent regressions
- **Effort**: 1 week

### 19. Issue #46: Keyboard Navigation
- **Priority**: LOW
- **Type**: Accessibility
- **Impact**: Power users
- **Effort**: 3 weeks

## 📱 Future - CI/CD & Store

### Issue #11: CI/CD Meta Issue
- Tracks #12-16 implementation

### Issue #15: Staging Environment
- After core features stable

### Issue #16: Rollback System
- After staging exists

### Issue #6: App Store Metadata
- When app is feature-complete

## Dependency Graph

```
Data Safety (#34) ─→ SQLite (#23) ─→ CRUD (#28) ─→ Users (#29) ─→ Today/Tomorrow (#41)
                                   └→ Edit Mode (#30) ─┘

Touch/Scroll (#18) ─→ Visual Polish (#19) ─→ Drag & Drop (#31)
                                          └→ Alt Interactions (#20)

FTP Fix (#12) ─→ Atomic Deploy (#13) ─→ Staging (#15) ─→ Rollback (#16)
              └→ npm Fix (#14) ─┘
```

## Implementation Strategy

### Week 1: Stop the Bleeding
- Fix data loss risk
- Fix mobile scrolling
- Quick wins for morale

### Week 2: Foundation
- SQLite implementation
- Performance optimization

### Weeks 3-4: Core Features
- Complete user flows
- Essential functionality

### Week 5: Infrastructure
- Deployment reliability
- Developer experience

### Week 6+: Polish
- Nice-to-haves
- Advanced features
- Test coverage

## Success Metrics
- ✅ Zero data loss incidents
- ✅ Natural mobile scrolling
- ✅ <100ms touch response
- ✅ 60fps scroll performance
- ✅ <3 minute deployments
- ✅ Multi-user support working
- ✅ Offline-first reliability