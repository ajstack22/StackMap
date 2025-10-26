---
name: atlas-full
description: Full 9-phase workflow for complex features, epics, and security-critical changes (2-4 hours)
---

# Atlas Full Workflow

## When to Use This Skill

**Perfect for (complex tasks, ~5% of work):**
- Major features (6+ files affected)
- New modules or services
- Security-critical changes
- Cross-platform features requiring coordination
- Epic-level work requiring formal requirements
- Architectural changes affecting multiple systems
- Features requiring comprehensive testing strategy

**Time estimate**: 2-4 hours

**Success criteria**:
- 100% of acceptance criteria met
- Zero defects in production first week
- Complete documentation and evidence
- Full test coverage for critical paths
- Security audit passed (if applicable)
- Cross-platform validation complete (if applicable)

## The 9 Phases

```
Phase 1: Research              → Deep exploration, feasibility analysis
Phase 2: Story Creation        → Formal requirements, acceptance criteria
Phase 3: Planning              → Technical design, architecture
Phase 4: Adversarial Review    → Security audit, edge case analysis
Phase 5: Implementation        → Parallel coding, incremental builds
Phase 6: Testing               → Comprehensive validation, all platforms
Phase 7: Validation            → Acceptance criteria verification
Phase 8: Clean-up              → Documentation, artifacts, debt log
Phase 9: Deployment            → Full quality gates, staged rollout
```

---

## Phase 1: Research

**Goal**: Deep understanding of requirements, feasibility, and technical landscape.

**Time allocation**: 20-30 minutes

### Steps:

1. **Define the problem space**
   - What problem are we solving?
   - Who are the users?
   - What are the business requirements?
   - What are the technical constraints?

2. **Explore current implementation**
   ```bash
   # Find all related code
   grep -r "related_feature" src/

   # Find similar patterns
   find src/ -name "*similar*"

   # Check git history for similar features
   git log --grep="similar feature" --oneline
   ```

3. **Research dependencies and integrations**
   - What external services/APIs are involved?
   - What internal modules will be affected?
   - What platform-specific considerations exist?
   - What are the data flow implications?

4. **Identify risks and constraints**
   - Technical risks (performance, compatibility, security)
   - Timeline constraints
   - Resource constraints
   - Platform limitations

5. **Evaluate alternatives**
   - What are different approaches to solve this?
   - What are the trade-offs?
   - What's the recommended approach?

### Research Checklist:

**Problem Understanding:**
- [ ] Clear problem statement
- [ ] User stories identified
- [ ] Success metrics defined
- [ ] Constraints documented

**Technical Research:**
- [ ] Current implementation mapped
- [ ] Similar patterns found
- [ ] Dependencies identified
- [ ] Platform considerations noted

**Risk Analysis:**
- [ ] Technical risks listed
- [ ] Security implications assessed
- [ ] Performance implications considered
- [ ] Migration/rollback strategy outlined

**Feasibility:**
- [ ] Technically feasible
- [ ] Timeline realistic
- [ ] Resources available
- [ ] No blockers identified

### Research Output Template:

```markdown
## Research Findings: [Feature Name]

### Problem Statement:
[Clear description of what we're solving]

### Users Affected:
- [User type 1]: [how they benefit]
- [User type 2]: [how they benefit]

### Technical Approach:
[High-level approach, alternatives considered]

### Files to Create/Modify:
- /path/to/new/file.js - [purpose]
- /path/to/existing/file.js - [what changes]
- /path/to/test/file.test.js - [test coverage]

### Dependencies:
- External: [external packages, APIs]
- Internal: [internal modules, services]

### Platform Considerations:
- **Platform A**: [specific notes]
- **Platform B**: [specific notes]
- **Platform C**: [specific notes]

### Risks:
1. [Risk 1] - Mitigation: [strategy]
2. [Risk 2] - Mitigation: [strategy]

### Success Metrics:
- [Metric 1]: [target]
- [Metric 2]: [target]

### Timeline Estimate:
- Research: [time]
- Implementation: [time]
- Testing: [time]
- Total: [time]
```

---

## Phase 2: Story Creation

**Goal**: Create formal user stories with acceptance criteria and success metrics.

**Time allocation**: 15-20 minutes

### Steps:

1. **Write user stories**
   - Use standard format: "As a [user], I want [goal], so that [benefit]"
   - Break down complex features into multiple stories
   - Prioritize stories (must-have, should-have, nice-to-have)

2. **Define acceptance criteria**
   - Specific, measurable, testable criteria
   - Cover happy path and edge cases
   - Include performance requirements
   - Include platform-specific criteria (if applicable)

3. **Set success metrics**
   - How will we measure success?
   - What are the targets?
   - How will we collect data?

4. **Create testing scenarios**
   - Manual testing checklist
   - Automated test requirements
   - Cross-platform testing plan (if applicable)

### Story Template:

Use the template in `resources/story-template.md` for consistent formatting.

### Story Validation Checklist:

- [ ] User story follows "As a...I want...So that" format
- [ ] Acceptance criteria are specific and testable
- [ ] Edge cases covered
- [ ] Platform-specific requirements included (if applicable)
- [ ] Success metrics defined with targets
- [ ] Testing scenarios documented
- [ ] Dependencies identified
- [ ] Risks documented with mitigation

---

## Phase 3: Planning

**Goal**: Create detailed technical design and implementation plan.

**Time allocation**: 20-30 minutes

### Steps:

1. **Architecture design**
   - How will components interact?
   - What's the data flow?
   - Where does state live?
   - How does it integrate with existing systems?

2. **File-by-file implementation plan**
   - What files to create?
   - What files to modify?
   - What changes in each file?
   - What order to implement?

3. **Data schema design**
   - What new fields/structures?
   - How to migrate existing data?
   - How does synchronization handle it (if applicable)?
   - What validations needed?

4. **Testing strategy**
   - Unit tests for each module
   - Integration tests for workflows
   - Platform-specific tests (if applicable)
   - Performance tests

5. **Rollout strategy**
   - Phased rollout plan
   - Feature flags needed?
   - Rollback plan
   - Monitoring strategy

### Planning Template:

```markdown
## Implementation Plan: [Feature Name]

### Architecture

#### Component Structure:
```
[Describe component hierarchy or architecture]
```

#### Data Flow:
```
User Action → Component → Service → State → UI Update
[Detailed flow description]
```

#### State Management:
- **State location**: [where state lives]
- **State shape**: [schema]
- **Update methods**: [new methods needed]

### File-by-File Plan

#### New Files:
1. **/src/services/newService.js**
   - Purpose: [what it does]
   - Functions:
     - `function1()`: [description]
     - `function2()`: [description]
   - Dependencies: [what it imports]

2. **/src/components/NewComponent.js**
   - Purpose: [what it does]
   - Props: [prop schema]
   - State: [local state]

#### Modified Files:
1. **/src/existing/file.js**
   - Add: [new functionality]
   - Modify: [existing behavior]

#### Test Files:
1. **/tests/services/newService.test.js**
   - Test coverage:
     - [ ] Unit tests for all functions
     - [ ] Edge cases
     - [ ] Error handling

### Data Schema

#### New Fields:
```javascript
entity: {
  // ... existing fields
  newField: {
    type: [type],
    required: [boolean],
    default: [default value],
    validation: [validation rules]
  }
}
```

#### Migration Strategy:
```javascript
// How to handle existing data
const migrateOldData = (item) => {
  return {
    ...item,
    newField: item.legacyField || defaultValue
  }
}
```

### Testing Strategy

#### Unit Tests:
- [ ] `newService.function1()` - happy path
- [ ] `newService.function1()` - error cases
- [ ] `newService.function2()` - edge cases

#### Integration Tests:
- [ ] Full workflow: [user action → result]
- [ ] Error recovery
- [ ] Network failure handling

#### Performance Tests:
- [ ] Load time < [threshold]
- [ ] Memory usage < [threshold]
- [ ] No memory leaks

### Implementation Order

**Iteration 1: Core functionality**
1. Create newService.js with basic functions
2. Add tests for newService
3. Add state management
4. Test integration

**Iteration 2: UI integration**
1. Create new components
2. Integrate with existing UI
3. Test user interactions

**Iteration 3: Edge cases**
1. Add error handling
2. Add loading states
3. Test all edge cases

**Iteration 4: Polish**
1. Performance optimization
2. Accessibility improvements
3. Documentation
4. Final testing

### Rollout Strategy

**Development Testing**:
- Deploy to development environment
- Test all functionality
- Validate performance
- Fix any issues

**Staging/Internal Testing**:
- Deploy to staging environment
- Internal team testing
- Gather feedback
- Refine based on feedback

**Beta/Canary Testing** (if applicable):
- Deploy to subset of users (feature flag)
- Monitor usage metrics
- Monitor error rates
- Collect user feedback

**Production Release**:
- Gradual rollout (if possible)
- Monitor success metrics
- Monitor error rates
- Rollback plan ready

### Rollback Plan

If critical issues arise:
1. Disable feature flag (immediate)
2. Or: Revert to previous deployment
3. Notify users if data affected
4. Fix issues in development
5. Re-test before re-enabling

### Monitoring

**Metrics to track**:
- Success rate
- Error rate
- Performance (load time, memory)
- User adoption
- User engagement

**Alerts**:
- Error rate > [threshold]%
- Performance degradation > [threshold]%
- Crash rate increase
```

### Planning Validation Checklist:

- [ ] Architecture clearly defined
- [ ] File-by-file plan complete
- [ ] Implementation order logical
- [ ] Testing strategy comprehensive
- [ ] Rollout strategy defined
- [ ] Rollback plan ready
- [ ] Monitoring plan in place

---

## Phase 4: Adversarial Review

**Goal**: Security audit, edge case analysis, and critical evaluation.

**Time allocation**: 15-20 minutes

### Steps:

1. **Security audit**
   - Use checklist in `resources/adversarial-checklist.md`
   - Identify vulnerabilities
   - Assess attack vectors
   - Validate data security
   - Check authentication/authorization

2. **Edge case analysis**
   - What can go wrong?
   - What assumptions might break?
   - What happens under load?
   - What if external dependencies fail?

3. **Performance analysis**
   - Memory usage implications
   - Network bandwidth usage
   - Resource utilization
   - Startup time impact

4. **Cross-platform compatibility** (if applicable)
   - Platform-specific issues?
   - Version compatibility?
   - Consistent UX across platforms?

5. **Maintainability review**
   - Code complexity reasonable?
   - Test coverage sufficient?
   - Documentation clear?
   - Technical debt acceptable?

### Adversarial Review Checklist:

Use the comprehensive checklist in `resources/adversarial-checklist.md`.

### Adversarial Questions:

Ask yourself tough questions:

1. **"What's the worst that could happen?"**
   - User loses data?
   - App crashes?
   - Security breach?
   - How do we prevent it?

2. **"What if this becomes popular?"**
   - Can it scale?
   - Cost implications?
   - Performance under load?

3. **"What if external service fails?"**
   - Service down?
   - Network offline?
   - API timeout?
   - Graceful degradation?

4. **"What if user does unexpected thing?"**
   - Spams button?
   - Enters invalid data?
   - Uses old app version?

5. **"What will break in 6 months?"**
   - Technical debt?
   - Deprecated APIs?
   - Maintenance burden?
   - Future compatibility?

### Red Flags:

**Stop and reconsider if:**
- 🚩 Security concerns unaddressed
- 🚩 Performance implications unclear
- 🚩 Rollback plan not feasible
- 🚩 Testing strategy inadequate
- 🚩 Technical debt too high
- 🚩 Edge cases not handled

### Adversarial Review Output:

```markdown
## Adversarial Review: [Feature Name]

### Security Assessment: ✅ PASS / ⚠️ CONCERNS / ❌ FAIL
[Details of security review]

**Concerns found**:
1. [Concern 1] - Mitigation: [plan]
2. [Concern 2] - Mitigation: [plan]

### Edge Case Analysis: ✅ COVERED / ⚠️ PARTIAL / ❌ GAPS
[Details of edge case analysis]

**Edge cases to address**:
1. [Case 1] - Plan: [how to handle]
2. [Case 2] - Plan: [how to handle]

### Performance Assessment: ✅ GOOD / ⚠️ ACCEPTABLE / ❌ CONCERNING
[Details of performance analysis]

**Optimizations needed**:
1. [Optimization 1]
2. [Optimization 2]

### Maintainability: ✅ GOOD / ⚠️ ACCEPTABLE / ❌ HIGH DEBT
[Details of maintainability review]

**Debt to address**:
1. [Debt item 1]
2. [Debt item 2]

### Overall Verdict: ✅ PROCEED / ⚠️ PROCEED WITH CAUTION / ❌ REVISE PLAN

**Blocking issues** (must fix before proceeding):
1. [Issue 1]
2. [Issue 2]

**Non-blocking issues** (address during implementation):
1. [Issue 1]
2. [Issue 2]
```

---

## Phase 5: Implementation

**Goal**: Build the feature incrementally with parallel work where possible.

**Time allocation**: 60-90 minutes

### Steps:

1. **Set up implementation tracking**
   - Break plan into tasks
   - Identify parallel vs sequential tasks
   - Track progress

2. **Implement in iterations**
   - **Iteration 1**: Core functionality (basic feature works)
   - **Iteration 2**: UI integration (feature accessible to users)
   - **Iteration 3**: Edge cases (all scenarios handled)
   - **Iteration 4**: Polish (performance, UX refinements)

3. **Follow coding standards**
   - Project conventions and style guide
   - Code comments for complex logic
   - No debugging logs in production code
   - Consistent formatting

4. **Incremental validation**
   - Test after each iteration
   - Fix issues before moving to next iteration
   - Run linters and type checkers periodically

### Implementation Strategy:

**Parallel Work** (can be done simultaneously):
- Service layer implementation
- Component development
- Test writing
- Documentation updates

**Sequential Work** (must be done in order):
1. Core service functions
2. State management integration
3. Component integration
4. Platform-specific implementations (if applicable)
5. Final polish

### Implementation Checklist:

**Before starting:**
- [ ] Plan reviewed and approved
- [ ] Adversarial review passed
- [ ] Development environment ready
- [ ] All dependencies installed

**During implementation:**
- [ ] Follow file-by-file plan from Phase 3
- [ ] Write tests alongside code
- [ ] Follow project conventions
- [ ] Add comments for non-obvious logic
- [ ] Remove debug logs
- [ ] Run linters/type checkers periodically

**After each iteration:**
- [ ] Iteration functionality works
- [ ] Tests pass for iteration
- [ ] Quality checks pass
- [ ] Code reviewed by self
- [ ] Ready for next iteration

### Iteration Breakdown:

**Iteration 1: Core Functionality (20-30 min)**
Goal: Basic feature works in isolation

- Implement service layer
- Add state management
- Write unit tests
- Verify core logic works

**Iteration 2: UI Integration (20-30 min)**
Goal: Feature accessible to users

- Create/modify UI components
- Integrate with state
- Add loading/error states
- Test user interactions

**Iteration 3: Edge Cases (15-20 min)**
Goal: All scenarios handled gracefully

- Implement error handling
- Add retry logic where appropriate
- Handle empty/null states
- Test all edge cases

**Iteration 4: Polish (10-15 min)**
Goal: Performance, UX, accessibility

- Performance optimizations
- Accessibility improvements
- Animation refinements
- Final testing
- Code cleanup

### Code Quality Standards:

**Function length**: < 50 lines (split if longer)
**File length**: < 500 lines (split into modules if longer)
**Cyclomatic complexity**: < 10 (refactor if higher)
**Comments**: For non-obvious logic, not obvious code
**Variable names**: Descriptive, not abbreviated (unless common: `id`, `url`)
**No magic numbers**: Use named constants

### Validation During Implementation:

Run these commands periodically:

```bash
# Linting (fast)
npm run lint

# Type checking (if applicable)
npm run typecheck

# Tests (run after each iteration)
npm test

# Build (before committing)
npm run build
```

---

## Phase 6: Testing

**Goal**: Comprehensive validation across all scenarios.

**Time allocation**: 30-45 minutes

### Steps:

1. **Automated testing**
   ```bash
   # Unit tests
   npm test

   # Type checking (if applicable)
   npm run typecheck

   # Linting
   npm run lint

   # Build validation
   npm run build
   ```

2. **Manual testing - Happy path**
   - Test primary user flow
   - Verify all acceptance criteria met
   - Check performance (load times, animations)

3. **Manual testing - Edge cases**
   - Test all edge cases from Phase 2
   - Test error scenarios
   - Test with poor network (if applicable)
   - Test with large data sets

4. **Cross-platform testing** (if applicable)
   - Test on each platform
   - Test platform-specific features
   - Verify consistent UX

5. **Regression testing**
   - Verify existing features still work
   - Check for unintended side effects
   - Test related features

### Testing Checklist:

**Automated Tests**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Type checking passes (if applicable)
- [ ] Linting passes (or only warnings)
- [ ] Build succeeds
- [ ] Test coverage > [target]% for new code

**Manual Testing - Happy Path**:
- [ ] Primary user flow works
- [ ] All acceptance criteria met
- [ ] Performance acceptable
- [ ] No errors in console

**Manual Testing - Edge Cases**:
- [ ] Empty states display correctly
- [ ] Error messages clear and helpful
- [ ] Loading states show appropriately
- [ ] Large data sets handled
- [ ] Rapid user actions handled (no crashes)

**Regression Testing**:
- [ ] Existing features unaffected
- [ ] No performance degradation
- [ ] No new errors
- [ ] Data integrity maintained

### Performance Testing:

**Metrics to measure**:
- Load time (initial + subsequent)
- Memory usage (baseline + after feature use)
- Network usage (bandwidth, request count)
- Resource utilization

**Acceptable thresholds** (customize for your project):
- Page load: < 3 seconds
- API response: < 1 second
- Memory: Within reasonable bounds
- No memory leaks

### Testing Output:

```markdown
## Testing Report: [Feature Name]

### Automated Tests: ✅ PASS / ❌ FAIL
- Unit tests: [X/Y] passed
- Integration tests: [X/Y] passed
- Type checking: [Status]
- Linting: [Status]
- Build: [Status]
- Coverage: [%] (target: [%])

### Manual Testing - Happy Path: ✅ PASS / ❌ FAIL
All acceptance criteria met.

### Manual Testing - Edge Cases: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

**Passed**:
- [List of edge cases tested]

**Failed**:
- [List of failures and fixes applied]

### Performance Testing: ✅ PASS / ⚠️ ACCEPTABLE / ❌ CONCERNING
- Load time: [time] (target: < 3s)
- Memory usage: [amount]
- No memory leaks: [Yes/No]

### Issues Found & Fixed:
1. [Issue 1] → Fixed: [Description]
2. [Issue 2] → Fixed: [Description]

### Overall: ✅ READY FOR VALIDATION / ❌ NEEDS WORK

[Summary of readiness]
```

---

## Phase 7: Validation

**Goal**: Verify all acceptance criteria met and feature ready for deployment.

**Time allocation**: 15-20 minutes

### Steps:

1. **Acceptance criteria review**
   - Go through story from Phase 2
   - Check each criterion systematically
   - Provide evidence for each

2. **Success metrics validation**
   - Can we measure the metrics?
   - Are targets realistic?
   - Is tracking implemented?

3. **Documentation review**
   - User-facing documentation complete?
   - Developer documentation complete?
   - API documentation (if applicable)?

4. **Stakeholder review** (if applicable)
   - Demo the feature
   - Gather feedback
   - Address concerns

### Validation Checklist:

**Acceptance Criteria**:
- [ ] All "Must Have" criteria met (100%)
- [ ] Evidence provided for each criterion
- [ ] All "Should Have" criteria met (or deferred)

**Success Metrics**:
- [ ] Metrics measurable
- [ ] Tracking implemented
- [ ] Targets realistic
- [ ] Baseline established (if applicable)

**Documentation**:
- [ ] User guide updated (if user-facing)
- [ ] Developer docs updated (if API changes)
- [ ] README updated (if workflow changes)

**Quality Gates**:
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Build succeeds
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security review passed (if applicable)

**Stakeholder Approval** (if applicable):
- [ ] Feature demoed
- [ ] Feedback gathered
- [ ] Concerns addressed
- [ ] Sign-off received

### Validation Output:

```markdown
## Validation Report: [Feature Name]

### Acceptance Criteria Validation

#### Must Have ([X/Y]) ✅ [%]

1. ✅ [Criterion 1]
   - Evidence: [Description]

2. ✅ [Criterion 2]
   - Evidence: [Description]

#### Should Have ([X/Y]) ✅ [%]

[List of should-have criteria]

**Deferred items**: [List any deferred items]

### Success Metrics Validation ✅

**Metrics implemented**:
- ✅ [Metric 1] tracking
- ✅ [Metric 2] tracking

**Targets**:
- [Metric 1]: [target] (trackable ✅)
- [Metric 2]: [target] (trackable ✅)

### Documentation Review ✅

**Updated**:
- ✅ User guide
- ✅ Developer docs
- ✅ README (if needed)

### Quality Gates ✅

- ✅ All tests pass
- ✅ Type checking passes
- ✅ Build succeeds
- ✅ No critical bugs
- ✅ Performance meets targets
- ✅ Security review passed (if applicable)

### Stakeholder Review ✅ (if applicable)

**Demo given to**: [Stakeholders]

**Feedback**:
- [Feedback item 1]
- [Feedback item 2]

**Sign-off**: ✅ Approved for deployment

### Overall: ✅ READY FOR DEPLOYMENT

[Summary of readiness]
```

---

## Phase 8: Clean-up

**Goal**: Documentation, artifacts, technical debt log, code cleanup.

**Time allocation**: 15-20 minutes

### Steps:

1. **Code cleanup**
   - Remove all debug logs
   - Remove commented-out code
   - Remove unused imports
   - Fix linting warnings
   - Format code consistently

2. **Documentation updates**
   - Update code comments
   - Update README (if applicable)
   - Update API docs (if APIs added)
   - Update developer guides

3. **Technical debt log**
   - Document any shortcuts taken
   - Document future improvements
   - Document known limitations
   - Document maintenance tasks

4. **Create artifacts**
   - Screenshots for documentation
   - Architecture diagrams (if complex)
   - Performance benchmarks
   - Migration guides (if needed)

5. **Knowledge transfer**
   - Team documentation
   - Handoff notes (if needed)
   - Troubleshooting guide

### Clean-up Checklist:

**Code Cleanup**:
- [ ] All debug logs removed
- [ ] All commented code removed
- [ ] All unused imports removed
- [ ] All TODOs addressed or logged
- [ ] Linting warnings fixed (or justified)
- [ ] Code formatted consistently

**Documentation**:
- [ ] Code comments updated
- [ ] README updated (if applicable)
- [ ] API docs updated (if APIs changed)
- [ ] User guide updated (if user-facing)
- [ ] Developer guide updated (if architecture changed)

**Technical Debt Log**:
- [ ] Shortcuts documented
- [ ] Future improvements listed
- [ ] Known limitations documented
- [ ] Maintenance tasks identified
- [ ] Refactoring opportunities noted

**Artifacts**:
- [ ] Screenshots captured
- [ ] Diagrams created (if needed)
- [ ] Performance benchmarks documented
- [ ] Migration guides written (if needed)

**Knowledge Transfer**:
- [ ] Team documentation complete
- [ ] Handoff notes written (if needed)
- [ ] Troubleshooting guide created
- [ ] Common issues documented

### Technical Debt Template:

```markdown
## Technical Debt: [Feature Name]

### Shortcuts Taken:
1. **[Shortcut 1]**
   - Why: [reason]
   - Impact: [low/medium/high]
   - Recommended fix: [description]
   - Estimated effort: [time]

### Future Improvements:
1. **[Improvement 1]**
   - Benefit: [description]
   - Effort: [time]
   - Priority: [low/medium/high]

### Known Limitations:
1. **[Limitation 1]**
   - Description: [details]
   - Workaround: [if any]
   - Fix planned: [yes/no]

### Maintenance Tasks:
1. **[Task 1]**
   - Frequency: [daily/weekly/monthly]
   - Procedure: [description]

### Refactoring Opportunities:
1. **[Opportunity 1]**
   - Current: [current state]
   - Proposed: [better approach]
   - Benefit: [why refactor]
   - Effort: [time]
```

---

## Phase 9: Deployment

**Goal**: Deploy via quality gates with staged rollout.

**Time allocation**: 15-20 minutes per stage

### Steps:

1. **Pre-deployment validation**
   ```bash
   # Run quality gates
   ./scripts/quality-gates.sh
   # Or adapt the script from resources/quality-gates.sh
   ```

2. **Update change log**
   Document changes in your project's change tracking system.

3. **Deploy to development/staging**
   - Test thoroughly in development environment
   - Verify all functionality works
   - Check logs for errors
   - Monitor performance

4. **Deploy to production** (with appropriate testing)
   - Use feature flags if available
   - Monitor closely
   - Track success metrics
   - Fix critical issues if any
   - Rollback plan ready

### Deployment Checklist:

**Pre-Deployment**:
- [ ] Quality gates pass
- [ ] Change log updated
- [ ] All tests pass (100%)
- [ ] Type checking passes
- [ ] Build succeeds
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] Rollback plan ready

**Development/Staging Deployment**:
- [ ] Deployed successfully
- [ ] Tested thoroughly
- [ ] All functionality works
- [ ] No errors in logs
- [ ] Performance acceptable

**Production Deployment**:
- [ ] Deployed successfully
- [ ] Monitoring active
- [ ] Success metrics tracked
- [ ] Error rates normal
- [ ] No rollback needed

### Monitoring During Rollout:

**Metrics to watch**:
- Error rate
- Success metrics
- Performance metrics
- User feedback

**Alert thresholds** (customize for your project):
- 🔴 Error rate > [threshold]% → Consider rollback
- 🟡 Error rate [threshold]-[threshold]% → Investigate
- 🟢 Error rate < [threshold]% → Continue

**Rollback triggers**:
- Critical bug discovered
- Error rate exceeds threshold
- Data integrity issues
- Security vulnerability

---

## Success Indicators

### You've succeeded when:
- ✅ 100% of acceptance criteria met
- ✅ Zero critical defects in first week
- ✅ All success metrics targets met or exceeded
- ✅ Complete documentation and evidence
- ✅ Full test coverage for critical paths
- ✅ Security audit passed (if applicable)
- ✅ Smooth deployment (no rollbacks)
- ✅ Positive user feedback
- ✅ Technical debt documented

### You should have downgraded to Standard if:
- ⚠️ Scope reduced to < 6 files
- ⚠️ Formal requirements not needed
- ⚠️ Simpler than initially estimated

---

## Escalation Rules

### When to escalate from Standard to Full:
- Scope expanded to 6+ files
- Security concerns emerged
- Formal requirements needed
- Cross-platform complexity high
- Stakeholder sign-off required

### When to consider breaking into multiple Full workflows:
- Epic too large (> 4 hours estimated)
- Multiple independent features
- Phased rollout over weeks/months

---

## Common Pitfalls

### ❌ Don't Do This:

1. **Skip research phase** ("I know what to build")
   - Problem: Misunderstand requirements, miss edge cases
   - Solution: Always complete Phase 1 research

2. **Skip story creation** ("Requirements are clear")
   - Problem: No measurable acceptance criteria, scope creep
   - Solution: Write formal stories with testable criteria

3. **Skip adversarial review** ("Nothing can go wrong")
   - Problem: Security issues, edge cases missed, performance problems
   - Solution: Be paranoid, think like an attacker

4. **Implement everything at once** ("I'll test after it's all done")
   - Problem: Hard to debug, hard to test, integration issues
   - Solution: Implement iteratively, test after each iteration

5. **Skip documentation** ("Code is self-documenting")
   - Problem: Future developers struggle, knowledge lost
   - Solution: Document while fresh in mind

6. **Deploy to production immediately** ("It works on my machine")
   - Problem: Production issues, user impact
   - Solution: Use staged rollout (dev → staging → production)

7. **Ignore technical debt** ("We'll fix it later")
   - Problem: Debt accumulates, maintenance burden increases
   - Solution: Document debt, plan to address

### ✅ Do This Instead:

1. **Complete all 9 phases** (don't skip, they're fast for their value)
2. **Write specific, testable acceptance criteria**
3. **Think adversarially** (security, edge cases, performance)
4. **Implement iteratively** (test often, fail fast)
5. **Document thoroughly** (while context fresh)
6. **Use staged rollout** (dev → staging → production)
7. **Log technical debt** (make it visible, plan to address)
8. **Celebrate success** (you built something complex!) 🎉

---

## Resources

- **Story template**: See `resources/story-template.md`
- **Adversarial checklist**: See `resources/adversarial-checklist.md`
- **Quality gates script**: See `scripts/quality-gates.sh`

---

## Quick Reference

### Full Workflow Commands:

```bash
# Phase 1: Research
grep -r "feature" src/
git log --grep="similar" --oneline

# Phase 5: Implementation
npm run lint         # Run linter
npm test            # After each iteration

# Phase 6: Testing
npm test
npm run lint
npm run build

# Phase 9: Deployment
./scripts/quality-gates.sh  # Or your quality gates script
# Then deploy according to your project's process
```

### Time Allocation:

| Phase | Time | Cumulative |
|-------|------|------------|
| 1. Research | 20-30 min | 0:30 |
| 2. Story Creation | 15-20 min | 0:50 |
| 3. Planning | 20-30 min | 1:20 |
| 4. Adversarial Review | 15-20 min | 1:40 |
| 5. Implementation | 60-90 min | 3:10 |
| 6. Testing | 30-45 min | 3:55 |
| 7. Validation | 15-20 min | 4:15 |
| 8. Clean-up | 15-20 min | 4:35 |
| 9. Deployment | 15-20 min per stage | varies |
| **Total** | **2-4 hours** + rollout |

### Decision Matrix:

| Characteristic | Use Full ✅ | Use Standard ❌ |
|----------------|------------|-----------------|
| Files affected | 6+ files | 2-5 files |
| Formal requirements | Yes | No |
| Security critical | Yes | No |
| Cross-platform coordination | Yes | Simple |
| Stakeholder sign-off | Required | Not required |
| Epic-level work | Yes | Task-level |
| Comprehensive testing | Required | Standard tests OK |
| Documentation | Extensive | Standard |

---

## Summary

The Full workflow is for **complex, critical features** that require:
- Formal requirements and acceptance criteria
- Security audits and adversarial thinking
- Comprehensive testing across all scenarios
- Complete documentation and knowledge transfer
- Staged rollout with monitoring

**Use Full workflow when**:
- Building new modules/services
- Security is critical
- Cross-platform coordination needed
- Stakeholder sign-off required
- Epic-level features (6+ files)

**Don't use Full workflow when**:
- Simple bug fixes (use Standard)
- Style tweaks (use Iterative)
- Trivial changes (use Quick)

When in doubt, **start with Standard** and escalate to Full if complexity emerges.

---

**Remember**: The Full workflow ensures **100% acceptance, zero defects, and complete evidence**. It's rigorous because the stakes are high. Take the time to do it right. 🚀
