---
description: Full 9-phase workflow for complex features, epics, and security-critical changes (2-4 hours)
---

# Full Workflow

**Perfect for (complex tasks):**

- Major features (6+ files affected)
- New modules or services
- Security-critical changes
- Cross-platform features requiring coordination
- Epic-level work requiring formal requirements

## Phase 1: Research

1. **Define problem space**

   - What problem are we solving?
   - Who are the users?
   - What are the constraints?

2. **Explore implementation**

   - Use `grep_search` to find related code and patterns.
   - Research dependencies and integrations.

3. **Identify risks**
   - Technical risks (performance, compatibility).
   - Security implications.

## Phase 2: Story Creation

1. **Write User Story**

   - Create a new file in `docs/features/` (e.g., `FEAT-my-feature.md`).
   - Format: "As a [user], I want [goal], so that [benefit]".

2. **Define Acceptance Criteria**

   - Must Have / Should Have.
   - Platform-specific requirements.

3. **Set Success Metrics**
   - How will we measure success?

## Phase 3: Planning

1. **Architecture Design**

   - Component structure.
   - Data flow.
   - State management.

2. **File-by-File Plan**

   - List new and modified files.
   - Define data schema changes.

3. **StackMap Planning Rules**
   - **Stores**: Use store-specific methods.
   - **Fields**: Canonical naming (`text`, `icon`).
   - **Platform**: Android FlexWrap, iOS AsyncStorage, Web layouts.

## Phase 4: Adversarial Review

**Security Checklist:**

- [ ] User data encrypted at rest/transit?
- [ ] Authentication/Authorization checked?
- [ ] Input validation/sanitization?
- [ ] No secrets in code?

**Edge Case Checklist:**

- [ ] Empty states handled?
- [ ] Offline mode supported?
- [ ] Network failures handled?
- [ ] Performance impact analyzed?

## Phase 5: Implementation

1. **Implement**

   - Follow the plan.
   - Use store-specific update methods.
   - Add comments for complex logic.

2. **StackMap Conventions**
   - NO gray text (`#000` only).
   - Use `Typography` component.
   - Use canonical field names.

## Phase 6: Testing

1. **Unit Tests**

   - Test happy paths and error cases.

2. **Integration Tests**

   - Test full workflows.

3. **Platform Tests**
   - Verify on iOS, Android, and Web.

## Phase 7: Validation

1. **Verify Acceptance Criteria**
   - Go through the checklist from Phase 2.
   - Ensure all "Must Have" items are met.

## Phase 8: Clean-up

1. **Documentation**
   - Update `README.md` or feature docs.
   - Remove debug logs.

## Phase 9: Deployment

1. **Update PENDING_CHANGES.md**

   - Detailed entry with title and changes.

2. **Deploy**

   - Run the deployment script.

   // turbo

   ```bash
   ./scripts/deploy.sh qual --all
   ```

3. **Verify**
   - Check deployment output.
   - Verify changes in the deployed environment.
