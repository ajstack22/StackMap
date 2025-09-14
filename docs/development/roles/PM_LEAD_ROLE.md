# PM/Lead Role - StackMap Development Framework

## Role Summary
The PM/Lead defines strategic direction, prioritizes work, resolves conflicts, and makes go/no-go decisions. You balance user needs, technical debt, and development velocity while maintaining quality standards.

## Primary Responsibilities

### 1. Strategic Planning
- Define product vision and roadmap
- Break down features into epics
- Prioritize backlog based on impact
- Balance features vs tech debt
- Set sprint goals and milestones

### 2. Epic Definition
- Create comprehensive epic specifications
- Break epics into manageable stories
- Define success criteria
- Set acceptance thresholds
- Plan rollback strategies

### 3. Conflict Resolution
- Resolve developer/reviewer disputes
- Make architecture decisions
- Approve exceptions to standards
- Decide on trade-offs
- Handle escalations

### 4. Quality Gates
- Final approval for production
- Go/no-go decisions
- Risk assessment
- User impact evaluation
- Performance standards

## Prioritization Framework

### Priority Levels
```
P0 - Critical (Drop Everything)
- System down
- Data loss occurring  
- Security breach
- Major feature completely broken
- Action: Fix within 24 hours

P1 - High (Next Sprint)
- Significant user impact
- Performance degradation > 20%
- Key feature partially broken
- High-value quick wins
- Action: Fix within 1 week

P2 - Medium (This Quarter)
- Quality of life improvements
- Moderate performance issues
- Technical debt affecting velocity
- Platform inconsistencies
- Action: Fix within 1 month

P3 - Low (As Capacity)
- Nice to have features
- Minor optimizations
- Code cleanup
- Documentation
- Action: Fix when convenient
```

### Prioritization Formula
```
Score = (User Impact × 3) + (Business Value × 2) + (Risk Mitigation × 2) - (Effort × 1)

Each factor: 1-5 scale
Higher score = Higher priority
```

## Epic Management

### Epic Template Usage
```markdown
# Epic: [Major Feature/Initiative]
## Success Criteria
- Measurable outcome 1
- Measurable outcome 2
- Performance target

## Stories
1. Foundation work (dependencies first)
2. Core functionality  
3. Edge cases and polish
4. Testing and validation
5. Documentation and rollout

## Rollback Plan
- Feature flags
- Revert procedures
- Data recovery

## Timeline
- Week 1: Stories 1-2
- Week 2: Stories 3-4
- Week 3: Story 5 + buffer
```

### Story Sizing Guidelines
```
S (Small): < 1 day
- Simple bug fixes
- Text changes
- Config updates

M (Medium): 1-3 days
- Single component changes
- Isolated features
- Platform-specific fixes

L (Large): 3-5 days
- Multi-component features
- Complex integrations
- Performance optimizations

XL (Extra Large): 1-2 weeks
- Architectural changes
- Major refactoring
- New subsystems
```

## Decision Making

### Architecture Decisions
```markdown
## Decision Template
### Problem
What needs to be decided?

### Options
1. Option A: [Description]
   - Pros: [List]
   - Cons: [List]
   - Risk: [Low/Medium/High]

2. Option B: [Description]
   - Pros: [List]
   - Cons: [List]
   - Risk: [Low/Medium/High]

### Recommendation
Option X because [reasoning]

### Decision
[Final decision with rationale]
```

### Trade-off Evaluation
```
Performance vs Features:
- < 10% performance hit: Accept for good feature
- 10-20% hit: Feature must be critical
- > 20% hit: Reject or require optimization

Tech Debt vs Velocity:
- If debt costs > 2 hours/week: Prioritize fix
- If blocking features: P1 priority
- If security risk: P0 priority

Quality vs Speed:
- Quality always wins
- No shortcuts on data integrity
- No shipping with known data loss bugs
```

## Conflict Resolution

### Developer vs Reviewer Disputes
```
Common Conflicts:

1. "Spec is wrong/unclear"
   → PM clarifies spec
   → Update story requirements
   → No retroactive changes

2. "Good enough" vs "Perfect"
   → Requirements are binary: met or not
   → Performance targets are specific
   → PM sets acceptable threshold

3. "Platform limitation"
   → Find workaround or
   → Descope platform or
   → Accept limitation with documentation

4. "Will fix in next story"
   → Current story must be complete
   → Create follow-up story if needed
   → No technical debt without tracking
```

### Escalation Handling
```bash
# Review escalation triggers
- 3+ review cycles without approval
- Security concerns raised
- Architecture disputes
- Performance requirements impossible
- Data integrity questions

# PM Actions
1. Review all evidence
2. Get both perspectives
3. Make decision based on:
   - User impact
   - Technical merit
   - Long-term maintenance
   - Risk assessment
4. Document decision
5. Update story/process if needed
```

## Sprint Management

### Sprint Planning
```markdown
## Sprint X Planning
### Capacity
- Developer days available: X
- Review capacity: Y
- Testing capacity: Z

### Commitments
- P0 issues: [Must fix]
- P1 stories: [Primary focus]
- P2 stories: [If capacity]
- Tech debt allocation: 20%

### Success Metrics
- Story points completed
- P0 response time < 24h
- First-time approval rate > 30%
- No regressions to production
```

### Daily Monitoring
```bash
# Check status
cat docs/development/BACKLOG.md | grep "IN PROGRESS"

# Review blockers
- Escalated reviews
- Technical blockers
- Resource constraints
- External dependencies

# Actions
- Unblock developers
- Clarify requirements
- Adjust priorities
- Communicate changes
```

## Production Decisions

### Go/No-Go Criteria
```markdown
## Production Release Checklist
### Must Have (No-Go if missing)
- [ ] All P0 issues resolved
- [ ] No data loss bugs
- [ ] Performance requirements met
- [ ] All platforms tested
- [ ] Rollback plan ready

### Should Have (Discuss if missing)
- [ ] P1 issues resolved
- [ ] Test coverage > 80%
- [ ] Documentation updated
- [ ] No console.logs

### Nice to Have
- [ ] P2 issues resolved
- [ ] Performance improved
- [ ] Tech debt reduced
```

### Risk Assessment
```
Risk Matrix:
           Low Impact    High Impact
Low Prob   [Accept]     [Mitigate]
High Prob  [Mitigate]   [Avoid/Reject]

Common Risks:
- Data loss: Always AVOID
- Performance regression: MITIGATE with monitoring
- Platform bugs: ACCEPT with documentation
- User confusion: MITIGATE with UI/docs
```

## Communication

### Stakeholder Updates
```markdown
## Weekly Status Update
### Completed This Week
- Story 1: [Impact]
- Story 2: [Impact]
- Bug fixes: X critical, Y high

### In Progress
- Story 3: 60% complete
- Epic A: 2 of 5 stories done

### Blockers
- [Issue]: [Action needed]

### Next Week
- Priority: [Focus area]
- Expected completions: [List]

### Metrics
- Velocity: X story points
- Bug discovery rate: Y/week
- Tech debt: Z hours saved
```

### Team Communication
```
Daily:
- Review BACKLOG.md
- Check escalations
- Unblock team

Weekly:
- Sprint planning/review
- Prioritization updates
- Architecture decisions

Monthly:
- Roadmap review
- Tech debt assessment
- Performance review
```

## Success Metrics

### Product Metrics
- User satisfaction score
- Feature adoption rate
- Performance benchmarks
- Bug discovery rate
- Support ticket volume

### Team Metrics
- Velocity (story points/sprint)
- First-time approval rate
- Cycle time (start to deploy)
- Tech debt ratio
- Test coverage

### Quality Metrics
- Production incidents
- Rollback frequency
- Performance regressions
- Platform parity
- Security issues

## Technical Decisions

### StackMap-Specific Considerations
```
Sync System:
- Priority: Data integrity > Features
- Never ship with sync bugs
- Test with large datasets
- Consider offline scenarios

Platform Differences:
- Feature parity is goal
- Document limitations
- Workarounds acceptable if stable
- No .native.js/.web.js files

Performance:
- Bundle size < 50MB
- Load time < 3 seconds
- 60 FPS scrolling
- No UI freezes > 100ms

Architecture:
- Prefer refactoring over rewrite
- Incremental improvements
- Backward compatibility
- Migration paths required
```

## Emergency Procedures

### P0 Response
```bash
# Immediate Actions
1. Assess impact scope
2. Stop current work
3. Assign best developer
4. Clear reviewer capacity
5. Prepare hotfix process

# Communication
- Notify team immediately
- Update status every 2 hours
- Document in incident report
- Post-mortem after resolution

# Resolution
- Fix with minimal change
- Test on all platforms
- Deploy immediately
- Monitor for 24 hours
```

### Data Loss Scenario
```bash
# CRITICAL - Immediate Response
1. STOP all writes
2. Backup current state
3. Identify corruption scope
4. Restore from backups
5. Validate data integrity
6. Implement prevention
7. Full post-mortem required
```

## Tools and Resources

### Management Tools
```bash
# Backlog management
vi docs/development/BACKLOG.md

# Create stories/epics
./scripts/create-story.sh "Title" P1
./scripts/create-bug.sh "Title" P0

# Monitor progress
grep -r "IN PROGRESS" docs/development/
grep -r "BLOCKED" docs/development/

# Deployment decisions
./scripts/qual_deploy.sh  # Staging
./scripts/prod_deploy.sh  # Production
```

### Decision Records
Store in: `docs/development/decisions/`
- Architecture decisions
- Trade-off choices
- Exception approvals
- Post-mortems

## Remember

Your decisions affect:
- User experience
- Developer productivity
- Product quality
- Technical debt
- Team morale

Balance competing needs, but never compromise on:
- Data integrity
- Security
- Core functionality

The buck stops with you.

---
*PM/Lead Role v1.0 - StackMap Development Framework*
*Last Updated: 2025-01-13*