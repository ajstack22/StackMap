# Epic: [Title]
## ID: E-[CATEGORY]-[NUMBER]
## Priority: P[0-3]
## Estimated Duration: [X weeks]
## Category: [Architecture/Feature/Performance/Platform]

## Epic Goal
[Clear statement of what this epic will achieve and why it matters]

## Business Value
- User benefit: [How users will benefit]
- Technical benefit: [How the system improves]
- Developer benefit: [How development improves]

## Success Criteria
### Epic-Level Metrics
- [ ] Metric 1: [Measurable outcome]
- [ ] Metric 2: [Measurable outcome]
- [ ] Performance: [Specific targets]
- [ ] Quality: [Coverage, debt reduction]

### User Acceptance
- [ ] Feature works on all platforms
- [ ] No performance degradation
- [ ] No data loss or corruption
- [ ] Documentation complete

## Stories Breakdown

### Story 1: [Title] (S-[CAT]-[NUM])
**Priority**: P[0-3]  
**Effort**: [S/M/L/XL]  
**Dependencies**: None  
**Assigned**: [Developer Role]

**Requirements**:
- Requirement 1
- Requirement 2

**Success Criteria**:
- Criterion 1
- Criterion 2

---

### Story 2: [Title] (S-[CAT]-[NUM])
**Priority**: P[0-3]  
**Effort**: [S/M/L/XL]  
**Dependencies**: Story 1  
**Assigned**: [Developer Role]

**Requirements**:
- Requirement 1
- Requirement 2

**Success Criteria**:
- Criterion 1
- Criterion 2

---

### Story 3: [Title] (S-[CAT]-[NUM])
**Priority**: P[0-3]  
**Effort**: [S/M/L/XL]  
**Dependencies**: Story 1, 2  
**Assigned**: [Developer Role]

**Requirements**:
- Requirement 1
- Requirement 2

**Success Criteria**:
- Criterion 1
- Criterion 2

## Integration Points
### Data Flow
- How data moves between stories
- Shared data structures
- API contracts

### Platform Differences
- Web: [Considerations]
- iOS: [Considerations]
- Android: [Considerations]

### Backward Compatibility
- What must remain working during transition
- Feature flags needed
- Migration strategy

## Technical Architecture
### Current State
[Diagram or description of current architecture]

### Target State
[Diagram or description of target architecture]

### Migration Path
1. Phase 1: [What changes]
2. Phase 2: [What changes]
3. Phase 3: [What changes]

## Risk Assessment
### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| [Risk 1] | [L/M/H] | [L/M/H] | [Strategy] |
| [Risk 2] | [L/M/H] | [L/M/H] | [Strategy] |

### Schedule Risks
- Dependencies on external teams
- Platform release cycles
- Testing resource availability

## Testing Strategy
### Story-Level Testing
- Each story follows ADVERSARIAL_REVIEW_PROCESS
- Individual story validation

### Integration Testing
```bash
# Commands to verify integration
npm run test:integration
./scripts/test-epic-integration.sh

# Performance benchmarks
./scripts/performance-benchmark.sh
```

### End-to-End Testing
- User journey 1: [Description]
- User journey 2: [Description]
- Cross-platform scenario: [Description]

## Rollback Plan
### Rollback Triggers
- [ ] Data corruption detected
- [ ] Performance degradation > 20%
- [ ] Critical functionality broken
- [ ] Security vulnerability discovered

### Rollback Procedure
```bash
# 1. Stop current deployment
./scripts/stop-deployment.sh

# 2. Revert to checkpoint
git checkout [epic-start-tag]

# 3. Deploy stable version
./scripts/qual_deploy.sh --emergency

# 4. Verify stability
./scripts/verify-rollback.sh
```

### Data Recovery
- Backup location: [Where]
- Recovery procedure: [Steps]
- Data validation: [Commands]

## Documentation Plan
### Developer Documentation
- [ ] Architecture diagrams updated
- [ ] API documentation
- [ ] Migration guide
- [ ] Troubleshooting guide

### User Documentation
- [ ] Feature announcement
- [ ] User guide updates
- [ ] FAQ updates

## Timeline
### Week 1
- Story 1: Development
- Story 2: Design

### Week 2
- Story 1: Review and iteration
- Story 2: Development
- Story 3: Development

### Week 3
- Story 2: Review
- Story 3: Review
- Integration testing

### Week 4
- Bug fixes
- Documentation
- Deployment preparation

## Review Checkpoints
### Checkpoint 1: Design Review
- Date: [Date]
- Reviewers: [Roles]
- Criteria: Architecture approved

### Checkpoint 2: Story Completion
- Date: [Date]
- Reviewers: [Roles]
- Criteria: All stories approved

### Checkpoint 3: Integration Review
- Date: [Date]
- Reviewers: [Roles]
- Criteria: Integration tests pass

### Checkpoint 4: Go/No-Go
- Date: [Date]
- Reviewers: [PM, Tech Lead]
- Criteria: Production ready

## Stakeholders
- **Epic Owner**: [Role/Name]
- **Technical Lead**: [Role/Name]
- **Developers**: [Roles]
- **Reviewers**: [Roles]
- **QA**: [Role]

## Notes
[Any additional context, assumptions, or considerations]

---
*Epic Template v1.0 - StackMap*
*Based on Manylla Framework*