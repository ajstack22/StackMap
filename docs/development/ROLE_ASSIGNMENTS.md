# Role Assignment Matrix - StackMap Development Framework

## Quick Assignment Guide

### By Story Priority
| Priority | Developer | Reviewer | Additional Roles |
|----------|-----------|----------|------------------|
| P0 - Critical | Senior/Expert | Lead + Expert | PM oversight, Platform Experts |
| P1 - High | Experienced | Senior | Platform Expert if needed |
| P2 - Medium | Any | Experienced | Specialist as needed |
| P3 - Low | Junior/New | Any | Learning opportunity |

### By Story Category
| Category | Primary Developer | Primary Reviewer | Support Roles |
|----------|------------------|------------------|---------------|
| Sync System | Expert only | Lead/Expert | Security review |
| Platform Bug | Platform Expert | Platform Expert | Cross-platform check |
| Performance | Experienced | Senior | Metrics specialist |
| UI/UX | Any | Designer/UX | User testing |
| Tech Debt | Experienced | Senior | Architecture review |
| Security | Senior | Lead + Security | External audit |

---

## Current Story Assignments

### P0 - Critical Priority

#### [S-DEBT-001: Test Coverage for Sync System](backlog/S-DEBT-001-test-coverage-sync-system.md)
**Developer**: Senior/Expert with testing experience  
**Reviewer**: Lead Developer + Security Expert  
**Platform Experts**: All (must test each platform)  
**Why**: Critical system with zero tests, requires deep understanding of encryption and sync logic

---

### P1 - High Priority

#### [S-DEBT-002: Refactor God Objects](backlog/S-DEBT-002-refactor-god-objects.md)
**Developer**: Senior with refactoring experience  
**Reviewer**: Lead/Architect  
**Support**: UI/UX for component structure  
**Why**: Requires careful decomposition without breaking functionality

#### [S-DEBT-003: React Performance Optimizations](backlog/S-DEBT-003-react-performance-optimization.md)
**Developer**: React Expert  
**Reviewer**: Performance Specialist  
**Platform Experts**: All platforms for testing  
**Why**: Deep React knowledge and performance profiling skills needed

#### [S-DEBT-005: iOS AsyncStorage Freeze Fix](backlog/S-DEBT-005-ios-asyncstorage-freeze-fix.md)
**Developer**: iOS Platform Expert  
**Reviewer**: iOS Expert + Performance Specialist  
**Support**: Consider external iOS developer  
**Why**: Platform-specific issue requiring native knowledge

---

### P2 - Medium Priority

#### [S-DEBT-004: Remove Console.logs from Production](backlog/S-DEBT-004-remove-debug-console-logs.md)
**Developer**: Any (good first task)  
**Reviewer**: Any experienced  
**Why**: Straightforward but thorough work, good learning opportunity

---

## Role Capability Matrix

### Developer Levels

#### Junior/New Developer
**Can Handle**:
- P3 bug fixes
- Console.log cleanup
- Documentation updates
- Simple UI changes
- Test writing with guidance

**Should Avoid**:
- Sync system changes
- Architecture decisions
- Performance optimization
- Security features
- Platform-specific fixes

#### Experienced Developer
**Can Handle**:
- P2 features
- Refactoring
- Performance improvements
- Cross-platform features
- Complex UI components

**Should Avoid**:
- Core sync changes without review
- Security implementations alone
- Major architecture changes

#### Senior/Expert Developer
**Can Handle**:
- P0/P1 critical fixes
- Architecture refactoring
- Sync system modifications
- Security implementations
- Performance optimization
- Platform-specific expertise

**Required For**:
- Data structure changes
- Encryption modifications
- Major refactoring
- Critical bug fixes

---

## Reviewer Capabilities

### Any Reviewer
**Can Review**:
- Documentation
- Simple bug fixes
- UI changes
- Code cleanup

**Cannot Review**:
- Sync changes
- Security features
- Architecture changes
- Performance optimizations

### Experienced Reviewer
**Can Review**:
- Feature implementations
- Refactoring
- Most bug fixes
- Performance improvements

**Should Escalate**:
- Sync system changes
- Security concerns
- Data structure changes

### Lead/Expert Reviewer
**Must Review**:
- All P0 issues
- Sync system changes
- Security implementations
- Architecture changes
- Data migrations
- Platform workarounds

---

## Specialist Roles

### When to Involve Specialists

#### Security Specialist
- Any encryption changes
- Authentication features
- Data privacy concerns
- Sync system modifications
- Third-party integrations

#### Performance Specialist
- Bundle size optimizations
- Render performance
- Memory leak investigations
- Network optimization
- Large dataset handling

#### UI/UX Specialist
- New user flows
- Component redesigns
- Accessibility features
- Mobile gestures
- Animation performance

#### Platform Experts
- Platform-specific bugs
- Native module integration
- Platform optimization
- Store requirements
- Device-specific issues

---

## Assignment Decision Tree

```
Is it P0 (Critical)?
├─ Yes → Senior Dev + Lead Review + PM
└─ No → Continue

Does it touch sync/encryption?
├─ Yes → Expert Dev + Security Review
└─ No → Continue

Is it platform-specific?
├─ Yes → Platform Expert Dev + Platform Review
└─ No → Continue

Is it performance related?
├─ Yes → Experienced Dev + Performance Review
└─ No → Continue

Is it a refactoring?
├─ Yes → Senior Dev + Architecture Review
└─ No → Continue

Is it UI/UX?
├─ Yes → Any Dev + UX Review
└─ No → Standard Dev + Peer Review
```

---

## Workload Balancing

### Maximum Concurrent Assignments
| Role | Stories | Reviews |
|------|---------|---------|
| Junior | 1 | 2 |
| Experienced | 2 | 3 |
| Senior | 2 | 4 |
| Lead | 1 | 5 |

### Time Allocation Guidelines
- Development: 60-70% of time
- Review: 20-30% of time
- Planning/Meetings: 10-20% of time

---

## Escalation Matrix

### When to Escalate to Higher Role

| Situation | Escalate To | Action |
|-----------|-------------|--------|
| 3+ review rejections | Lead | Architecture review |
| Security concern | Security Expert | Immediate review |
| Data loss risk | PM + Lead | Stop work |
| Platform deadlock | Platform Experts | Cross-platform solution |
| Performance regression > 20% | Performance Expert | Optimization required |
| Scope creep | PM | Redefine requirements |

---

## Training Progression

### Junior → Experienced Path
1. Start with P3 cleanup tasks
2. Review simple changes
3. Implement P2 features with guidance
4. Lead P2 features independently
5. Review P2 changes
6. Ready for experienced role

### Experienced → Senior Path
1. Lead P1 features
2. Review complex changes
3. Mentor juniors
4. Handle platform-specific issues
5. Architecture participation
6. Security awareness
7. Ready for senior role

---

## Special Assignments

### High-Risk Stories Requiring Multiple Roles
1. **Sync Protocol Changes**: Lead Dev + Security + All Platform Experts
2. **Data Migration**: Senior Dev + Lead Review + QA
3. **Payment Integration**: Senior Dev + Security + Legal
4. **Major Refactoring**: Senior Dev + Architecture + Performance
5. **New Platform**: Platform Expert + Senior Dev + QA

---

## Review Pairing

### Effective Review Combinations
- **Junior Dev + Senior Review**: Maximum learning
- **Senior Dev + Peer Review**: Fastest iteration
- **Expert Dev + Lead Review**: Critical features
- **Platform Dev + Cross-Platform Review**: Compatibility
- **Any Dev + Specialist Review**: Domain expertise

### Avoid These Combinations
- Junior Dev + Junior Review (lack experience)
- Same person dev and review (no objectivity)
- Expert Dev + Junior Review (mismatch)
- Platform Dev + Same Platform Review (bias)

---

## Metrics by Role

### Developer Metrics
- Story completion rate
- First-time approval rate
- Bug introduction rate
- Code quality score

### Reviewer Metrics
- Issues caught rate
- Review turnaround time
- False positive rate
- Developer improvement

### Lead Metrics
- Sprint velocity
- Team efficiency
- Quality trends
- Architecture health

---

*Role Assignment Matrix v1.0 - StackMap Development Framework*
*Last Updated: 2025-01-13*