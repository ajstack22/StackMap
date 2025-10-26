# User Story Template

Use this template when creating new user stories for your project. Customize sections based on your project's needs.

---

# User Story: [Brief Title]

**Priority:** [P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)]
**Workflow Tier:** [Quick / Iterative / Standard / Full]
**Platform Scope:** [All / Backend / Frontend / Mobile / Specific platforms]

## Story
As a [user type],
I want [goal],
So that [benefit].

## Acceptance Criteria
1. [Testable criterion 1 - specific, measurable, verifiable]
2. [Testable criterion 2]
3. [Testable criterion 3]
...

## Technical Considerations

**Database Changes:**
- [ ] Schema migrations needed?
- [ ] Data migration strategy defined?
- [ ] Backwards compatibility maintained?
- [ ] Indexing requirements evaluated?

**API Changes:**
- [ ] New endpoints added?
- [ ] Existing endpoints modified?
- [ ] API versioning handled?
- [ ] API documentation updated?
- [ ] Rate limiting considerations?

**UI/UX Updates:**
- [ ] Responsive design requirements?
- [ ] Accessibility requirements met (WCAG compliance)?
- [ ] Browser/platform compatibility verified?
- [ ] Loading states and error handling?
- [ ] Internationalization (i18n) needed?

**Third-Party Integrations:**
- [ ] External API dependencies?
- [ ] Authentication/authorization for external services?
- [ ] Error handling for external failures?
- [ ] Fallback strategies defined?

**Security Implications:**
- [ ] Authentication/authorization required?
- [ ] Input validation implemented?
- [ ] Output sanitization implemented?
- [ ] Sensitive data handling secure?
- [ ] Security audit needed?
- [ ] OWASP vulnerabilities addressed?

**Performance Impact:**
- [ ] Database query optimization needed?
- [ ] Caching strategy defined?
- [ ] Load testing required?
- [ ] Performance metrics defined?
- [ ] Bundle size impact evaluated?

**Testing Requirements:**
- [ ] Unit tests for business logic?
- [ ] Integration tests for multi-component features?
- [ ] E2E tests for critical user flows?
- [ ] Manual testing checklist defined?

**Documentation:**
- [ ] API documentation updated?
- [ ] User-facing documentation updated?
- [ ] Architecture diagrams updated?
- [ ] Inline code comments for complex logic?

## Implementation Notes

**Files to Modify:**
- [/path/to/file1] - [Brief description of changes]
- [/path/to/file2] - [Brief description of changes]
- [/path/to/tests/file.test.js] - [Tests to add]

**Dependencies:**
- [List any dependencies on other work]
- [e.g., "Blocked by: Story #123 (Add authentication service)"]

**Notes:**
- [Any additional implementation notes or context]
- [Technical constraints or limitations]
- [Helpful resources or documentation links]

## Quality Gates

**Standard Gates:**
- [ ] All acceptance criteria met
- [ ] Tests pass (unit, integration, e2e)
- [ ] Linting passes
- [ ] Type checking passes (if applicable)
- [ ] Build succeeds
- [ ] Code review approved
- [ ] Changelog updated

**Story-Specific Gates:**
- [ ] [Custom quality gate 1, e.g., "Manual test: Profile image upload on mobile"]
- [ ] [Custom quality gate 2, e.g., "Performance: Page load < 2 seconds"]
- [ ] [Custom quality gate 3, e.g., "Accessibility: Screen reader compatible"]

## Deployment Strategy

**Environments:**
1. **Dev/Local:** [What to test in development environment]
2. **Staging:** [What to validate in staging environment]
3. **Beta/UAT:** [What to monitor in user acceptance testing]
4. **Production:** [When to deploy to production]

**Deployment Phases:**
- [ ] Deploy to dev and verify basic functionality
- [ ] Deploy to staging and perform integration testing
- [ ] Deploy to beta/UAT and gather user feedback
- [ ] Deploy to production after all validations pass

**Rollback Plan:**
- [Describe rollback strategy if deployment fails]
- [Identify rollback triggers and procedures]

## Success Metrics

**Quantitative:**
- [Metric 1, e.g., "Feature adoption by 50% of users within 2 weeks"]
- [Metric 2, e.g., "Zero critical bugs reported in first week"]
- [Metric 3, e.g., "API response time < 200ms"]

**Qualitative:**
- [Metric 1, e.g., "Users find feature intuitive and easy to use"]
- [Metric 2, e.g., "Positive feedback in user surveys"]

**Adoption:**
- [Metric, e.g., "80% of beta users utilize feature within first week"]

---

## Notes for Story Creator

### Customizing This Template

This is a **generic template**. To make it project-specific:

1. **Create `.atlas/story-template.md` in your project** with customized sections
2. **Remove sections that don't apply** to your project
3. **Add project-specific sections** (e.g., compliance, infrastructure, microservices)
4. **Define project-specific quality gates** beyond standard checks
5. **Document project-specific conventions** in `.atlas/conventions.md`

### Required vs. Optional Sections

**Always Required:**
- Story (As a... I want... So that...)
- Acceptance Criteria (testable, measurable)
- Priority (P0-P3)
- Workflow Tier (Quick/Iterative/Standard/Full)
- Quality Gates

**Conditionally Required:**
- Technical Considerations - If story involves technical changes
- Platform Scope - If multi-platform project
- Deployment Strategy - For Standard/Full workflows
- Success Metrics - For feature stories (not bugs)

**Optional:**
- Implementation Notes - Helpful hints, not prescriptive
- Dependencies - Only if blockers exist
- Rollback Plan - Critical for high-risk deployments

### Priority Definitions

- **P0 (Critical):** Production blockers, security vulnerabilities, data loss bugs
- **P1 (High):** Major features, high-impact bugs, user-facing issues
- **P2 (Medium):** Enhancements, minor bugs, technical debt
- **P3 (Low):** Nice-to-haves, future considerations, wishlist items

### Workflow Tier Selection

- **Quick (5-15 min):** Trivial changes (color, text, single-line fixes)
- **Iterative (15-30 min):** Changes needing validation (style improvements, simple tweaks)
- **Standard (30-60 min):** Bug fixes, small features (1-5 files), refactoring
- **Full (2-4 hours):** New modules, complex features, security changes, major refactors

### Platform Scope Guidelines

Adapt to your project's architecture:
- **All:** Change affects all platforms/environments
- **Backend:** Server-side only
- **Frontend:** Client-side only (web)
- **Mobile:** iOS and/or Android
- **Specific:** List specific platforms if applicable

### Writing Good Acceptance Criteria

**Good criteria are:**
- **Specific:** "Profile image is 150x150px" (not "image looks good")
- **Measurable:** "API response < 200ms" (not "API is fast")
- **Testable:** "User can upload PNG, JPG" (not "upload works")
- **Complete:** Cover happy path, edge cases, errors

**See `acceptance-criteria-guide.md` for detailed guidance.**

### Technical Considerations Checklist

Use this as a starting point - customize for your project:

**For data changes:**
- Database schema impact?
- Data migration needed?
- Backwards compatibility?

**For API changes:**
- New/modified endpoints?
- Breaking changes?
- API versioning?

**For UI changes:**
- Responsive design?
- Accessibility?
- Browser compatibility?

**For integrations:**
- External dependencies?
- Error handling?
- Rate limiting?

**For security:**
- Authentication/authorization?
- Input validation?
- Sensitive data?

**For performance:**
- Query optimization?
- Caching strategy?
- Load testing?

### Success Metrics Guidelines

Define measurable success criteria:

**Quantitative:**
- Usage statistics (adoption rate, feature usage)
- Performance metrics (load time, response time)
- Quality metrics (bug count, uptime)

**Qualitative:**
- User feedback (surveys, support tickets)
- Usability observations (user testing)
- Team satisfaction (developer experience)

**Adoption:**
- Feature adoption rate
- Time to first use
- Engagement metrics

---

## Project-Specific Customization Guide

To adapt this template to your project, create `.atlas/story-template.md` with your own sections:

### Example 1: E-Commerce Project

```markdown
## Inventory Impact
- [ ] Product catalog changes?
- [ ] Stock management affected?
- [ ] Pricing rules modified?

## Payment Processing
- [ ] Payment gateway changes?
- [ ] Transaction handling secure?
- [ ] Refund logic affected?

## Compliance
- [ ] PCI-DSS requirements met?
- [ ] GDPR compliance verified?
- [ ] Tax calculation correct?
```

### Example 2: Healthcare Project

```markdown
## HIPAA Compliance
- [ ] PHI (Protected Health Information) secured?
- [ ] Audit logging implemented?
- [ ] Access controls verified?

## Clinical Workflows
- [ ] Provider workflows affected?
- [ ] Patient workflows affected?
- [ ] Clinical decision support impact?

## Interoperability
- [ ] HL7/FHIR standards followed?
- [ ] EHR integration tested?
- [ ] Data exchange validated?
```

### Example 3: SaaS Multi-Tenant Project

```markdown
## Multi-Tenancy
- [ ] Tenant isolation maintained?
- [ ] Cross-tenant data leakage prevented?
- [ ] Per-tenant configuration supported?

## Billing Impact
- [ ] Usage metering affected?
- [ ] Subscription tiers impacted?
- [ ] Billing calculations correct?

## Infrastructure
- [ ] Scaling considerations?
- [ ] Resource limits defined?
- [ ] Monitoring/alerting configured?
```

---

## Example: Simple Story

See below for a basic example using this template:

```markdown
# User Story: Add User Profile Image Upload

**Priority:** P1 (High)
**Workflow Tier:** Standard (30-60 min)
**Platform Scope:** Frontend + Backend

## Story
As a registered user,
I want to upload a profile image,
So that I can personalize my account and be recognized by other users.

## Acceptance Criteria
1. User can click "Upload Photo" button on profile page
2. File picker opens allowing selection of PNG, JPG, or GIF files
3. Image size limited to 5MB maximum
4. Selected image previews before upload confirmation
5. User can crop/resize image to 200x200px before upload
6. Upload button shows progress indicator during upload
7. Success message displays after successful upload
8. Profile image appears on profile page at 150x150px
9. Profile image appears in user menu at 40x40px
10. Error message displays for: wrong format, too large, upload failure

## Technical Considerations

**Database Changes:**
- [x] Add `profileImageUrl` field to users table (string, nullable)

**API Changes:**
- [x] New endpoint: POST /api/users/:id/profile-image
- [x] Returns: { imageUrl: string }
- [x] Validates: file type, file size

**Security Implications:**
- [x] Input validation: file type whitelist (PNG, JPG, GIF only)
- [x] File size limit enforced server-side: 5MB max
- [x] Image stored in secure S3 bucket with pre-signed URLs
- [x] User can only upload to their own profile (authorization check)

**Performance Impact:**
- [x] Image resizing on server (ImageMagick) to optimize storage
- [x] CDN serving for profile images (CloudFront)

## Implementation Notes

**Files to Modify:**
- /src/components/ProfilePage.jsx - Add upload button and preview
- /src/api/userController.js - Add image upload endpoint
- /src/database/migrations/add-profile-image.js - Database migration
- /tests/api/userController.test.js - Test image upload endpoint

## Quality Gates
- [ ] All acceptance criteria met
- [ ] Unit tests for API endpoint pass
- [ ] Integration test for full upload flow passes
- [ ] Manual test: Upload on Chrome, Firefox, Safari
- [ ] Security: File type validation works
- [ ] Performance: Upload < 3 seconds for 5MB file

## Deployment Strategy
1. **Dev:** Deploy and test basic upload functionality
2. **Staging:** Validate with larger file sizes, multiple formats
3. **Production:** Deploy after staging validation passes

## Success Metrics
- 60% of users upload profile image within first week
- Zero reports of upload failures or security issues
- Average upload time < 3 seconds
```

---

For more guidance on writing acceptance criteria, see **`acceptance-criteria-guide.md`** in this directory.
