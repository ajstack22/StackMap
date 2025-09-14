# Epic Review Process - StackMap

## Purpose
Manage multi-story implementations with both story-level and integration-level validation.

## When to Use
- Large features requiring multiple coordinated stories
- System-wide refactoring (e.g., platform consolidation)
- Major version upgrades
- Architecture changes
- Features touching multiple subsystems

## Process Overview

### Phase 1: Epic Planning
1. PM/Lead defines epic with clear goals
2. Break down into 3-7 discrete stories
3. Define dependencies and sequencing
4. Set epic-level success criteria
5. Identify integration points

### Phase 2: Story Implementation
1. Each story follows ADVERSARIAL_REVIEW_PROCESS
2. Stories can be worked in parallel where possible
3. Mark dependencies clearly
4. Maintain backward compatibility during transition

### Phase 3: Integration Review
After all stories approved individually:
1. Deploy all stories to test environment
2. Run integration test suite
3. Verify epic-level success criteria
4. Check for emergent issues
5. Performance regression testing
6. Full platform testing

### Phase 4: Epic Approval
**Approval Criteria:**
- ✅ All individual stories approved
- ✅ Integration tests pass
- ✅ Epic goals achieved
- ✅ No performance degradation
- ✅ Documentation updated
- ✅ Rollback plan tested

## Epic Structure Template

```markdown
# Epic: [Epic Title]
## Goal: [What we're achieving]
## Priority: P[0-3]
## Estimated Duration: [X days/weeks]

### Success Criteria
- [ ] Criterion 1: [Measurable outcome]
- [ ] Criterion 2: [Measurable outcome]
- [ ] Performance maintained: [Specific metrics]

### Stories
1. **[Story ID]: [Title]** (P[0-3])
   - Dependencies: None
   - Estimated: [X days]
   - Assigned: [Role]

2. **[Story ID]: [Title]** (P[0-3])
   - Dependencies: Story 1
   - Estimated: [X days]
   - Assigned: [Role]

### Integration Points
- Where stories interact
- Shared data structures
- API contracts
- Platform differences

### Rollback Plan
- How to revert if needed
- Feature flags
- Database migrations
- Backward compatibility
```

## Current Epic Examples

### Epic: Test Infrastructure (High Priority)
```markdown
Stories:
1. S-TEST-001: Unit test framework setup
2. S-TEST-002: Integration test harness
3. S-TEST-003: E2E test automation
4. S-TEST-004: CI/CD integration
5. S-TEST-005: Coverage reporting

Integration Points:
- Shared test utilities
- Mock data generators
- Platform-specific test runners
```

### Epic: Performance Optimization (Medium Priority)
```markdown
Stories:
1. S-PERF-001: Component memoization
2. S-PERF-002: Bundle splitting
3. S-PERF-003: Lazy loading
4. S-PERF-004: Image optimization
5. S-PERF-005: Sync performance

Integration Points:
- Webpack configuration
- React rendering pipeline
- Platform loaders
```

## Integration Test Suite

### Required Tests
```bash
# Full build verification
npm run lint
npm run typecheck
npm run build:web
npm run build:android
npm run build:ios

# Cross-platform functionality
# Test on all platforms with same data set
# Verify consistent behavior

# Data integrity
# Create complex data scenarios
# Sync between platforms
# Verify no data loss

# Performance benchmarks
# Load time < 3 seconds
# Sync time < 5 seconds for 100 items
# Bundle size < 50MB
```

### Epic-Specific Tests
```bash
# For sync system changes
./scripts/test-sync-integrity.sh

# For platform changes
./scripts/test-platform-consistency.sh

# For UI changes
./scripts/test-accessibility.sh
```

## Review Checkpoints

### Story-Level Checkpoint
- Each story individually approved
- No blocking issues
- Platform testing complete
- Documentation updated

### Integration Checkpoint
- All stories deployed together
- Cross-story functionality verified
- Performance metrics maintained
- No emergent behaviors

### Epic-Level Checkpoint
- Original goals achieved
- Success criteria met
- Stakeholder acceptance
- Production ready

## Rollback Procedures

### Immediate Rollback Triggers
- Data corruption detected
- Performance degradation > 20%
- Critical platform failure
- Security vulnerability

### Rollback Steps
```bash
# 1. Stop deployment
./scripts/stop-deployment.sh

# 2. Revert to last known good
git checkout [last-good-commit]

# 3. Emergency deploy
./scripts/qual_deploy.sh --emergency

# 4. Verify stability
./scripts/verify-rollback.sh

# 5. Notify stakeholders
```

## Epic Roles and Responsibilities

### PM/Epic Lead
- Define epic goals and success criteria
- Break down into stories
- Prioritize and sequence
- Final approval

### Developers
- Implement individual stories
- Coordinate on integration points
- Maintain backward compatibility
- Document changes

### Peer Reviewers
- Review individual stories adversarially
- Check integration impacts
- Verify epic coherence
- Test edge cases

### QA/Integration Tester
- End-to-end testing
- Cross-platform verification
- Performance testing
- User acceptance testing

## Common Epic Pitfalls

### Planning Pitfalls
- ❌ Stories too tightly coupled
- ❌ No clear success criteria
- ❌ Missing rollback plan
- ❌ Underestimating integration complexity

### Implementation Pitfalls
- ❌ Breaking changes mid-epic
- ❌ Not maintaining compatibility
- ❌ Ignoring performance impact
- ❌ Platform-specific assumptions

### Integration Pitfalls
- ❌ Not testing stories together
- ❌ Missing emergent behaviors
- ❌ Data migration issues
- ❌ Configuration conflicts

## Success Metrics
- Epic completion rate > 80%
- No rollbacks required
- Integration issues < 10% of stories
- Performance maintained or improved

---
*Process Version: 1.0 - StackMap Specific*
*Based on Manylla Framework*
*Last Updated: 2025-01-13*