# User Story Template

Use this template when creating new user stories for StackMap development.

---

# User Story: [Brief Title]

**Priority:** [P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)]
**Workflow Tier:** [Quick / Iterative / Standard / Full]
**Platform Scope:** [All / iOS / Android / Web / iOS+Android]

## Story
As a [role],
I want [goal],
So that [benefit].

## Acceptance Criteria
1. [Testable criterion 1]
2. [Testable criterion 2]
3. [Testable criterion 3]
...

## Store Impact
**Affected Stores:**
- [ ] useAppStore - [Describe changes, if any]
- [ ] useUserStore - [Describe changes, if any]
- [ ] useSettingsStore - [Describe changes, if any]
- [ ] useLibraryStore - [Describe changes, if any]

**Update Methods:**
- [Store]: [Method to use, e.g., useUserStore.getState().setUsers()]

**Migration Strategy:**
- [Describe how existing data will be migrated, if applicable]

## Field Naming
**Reading (with fallbacks):**
- [field]: [e.g., activity.text || activity.name || activity.title]
- [field]: [e.g., activity.icon || activity.emoji]

**Writing (canonical fields):**
- [field]: [e.g., activity.text]
- [field]: [e.g., activity.icon]

**New Fields:**
- [fieldName]: [Type, e.g., string | null]
- [fieldName]: [Type, e.g., number (Unix timestamp)]

## Platform Scope
**Platforms:** [All / iOS / Android / Web / Specific combination]

**Platform-Specific Gotchas:**

**Android:**
- [List Android-specific considerations, e.g., "FlexWrap requires percentage widths"]
- [e.g., "Typography component for fonts (handles font variants)"]

**iOS:**
- [List iOS-specific considerations, e.g., "Avoid AsyncStorage in render"]
- [e.g., "Test on physical device if using modals"]

**Web:**
- [List Web-specific considerations, e.g., "3-column layout uses percentage widths"]
- [e.g., "Cannot use Alert.alert - use ConfirmModal"]

**Shared:**
- [List considerations affecting all platforms]

## Sync Considerations
**Impact:** [None / Low / Medium / High]

**Changes Required:**
- [ ] Add new fields to encryption/decryption
- [ ] Update conflict resolution to preserve new fields
- [ ] Ensure backwards compatibility with legacy data
- [ ] Test sync cycle: Local → Upload → Download → Verify

**Conflict Resolution Strategy:**
- [field]: [Strategy, e.g., "Last-write-wins based on updatedAt timestamp"]
- [field]: [Strategy, e.g., "Use max(local, remote) for numeric values"]

**Migration Strategy:**
- [Describe how legacy sync data will be handled]
- [e.g., "If field missing, set default value"]

## Implementation Notes
**Files to Modify:**
- [/path/to/file1.js] - [Brief description of changes]
- [/path/to/file2.js] - [Brief description of changes]
- [/path/to/tests/file.test.js] - [Tests to add]

**Dependencies:**
- [List any dependencies on other work]
- [e.g., "Blocked by: Story #123 (Add user preferences store)"]

**Notes:**
- [Any additional implementation notes or context]

## Quality Gates
**Standard Gates:**
- [ ] All acceptance criteria met
- [ ] Tests pass (npm test)
- [ ] Type checking passes (npm run typecheck)
- [ ] Build succeeds
- [ ] PENDING_CHANGES.md updated

**Story-Specific Gates:**
- [ ] [Custom quality gate 1, e.g., "Manual test: Verify category dropdown on Android"]
- [ ] [Custom quality gate 2, e.g., "Integration test: Full sync cycle with categories"]
- [ ] [Custom quality gate 3]

## Deployment Strategy
**Tiers:**
1. **QUAL:** [What to test in QUAL environment]
2. **STAGE:** [What to validate in STAGE environment]
3. **BETA:** [What to monitor in BETA environment]
4. **PROD:** [When to deploy to PROD]

**Rollback Plan:**
- [Describe rollback strategy if deployment fails]

## Success Metrics
**Quantitative:**
- [Metric 1, e.g., "Category creation completes in < 5 seconds"]
- [Metric 2, e.g., "Zero reports of lost data after sync"]

**Qualitative:**
- [Metric 1, e.g., "Users find category organization intuitive"]
- [Metric 2, e.g., "No confusion about category assignment"]

**Adoption:**
- [Metric, e.g., "80% of beta users create at least one category within first week"]

---

## Notes for Story Creator

### Required Sections
All sections above are required. If a section doesn't apply, write "N/A" with brief justification.

**Example:**
```
## Sync Considerations
**Impact:** None

This is a UI-only change with no data structure modifications. Sync logic is unaffected.
```

### Priority Definitions
- **P0 (Critical):** Production blockers, security vulnerabilities, data loss bugs
- **P1 (High):** Major features, high-impact bugs, user-facing issues
- **P2 (Medium):** Enhancements, minor bugs, technical debt
- **P3 (Low):** Nice-to-haves, future considerations, wishlist items

### Workflow Tier Selection
- **Quick (5-15 min):** Color changes, text updates, single-line changes
- **Iterative (15-30 min):** Style improvements, simple UI tweaks needing peer review
- **Standard (30-60 min):** Bug fixes, small features (1-5 files), refactoring
- **Full (2-4 hours):** New modules, cross-platform features, security changes, major refactors

### Platform Scope Guidelines
- **All:** Change affects shared code used on iOS, Android, and Web
- **iOS:** iOS-specific file (.ios.js) or iOS-only feature
- **Android:** Android-specific file (.android.js) or Android-only feature
- **Web:** Web-specific file (.web.js) or web-only feature
- **iOS+Android:** Mobile-only change (shared .native.js files)

### Store Impact Guidelines
Always identify which stores are affected and how:
- **useAppStore:** Legacy monolithic store (being phased out for specific stores)
- **useUserStore:** User data and profiles
- **useSettingsStore:** App settings and preferences
- **useLibraryStore:** Activity library and categories

**CRITICAL:** Always use store-specific update methods, NOT `useAppStore.setState()`.

### Field Naming Guidelines
Follow StackMap conventions:
- **Activities:** Use `text` and `icon` (not name/title/emoji)
- **Users:** Use `icon` and `name` (not emoji)
- **Always include fallbacks** when reading legacy data

### Sync Impact Guidelines
Evaluate sync impact honestly:
- **None:** UI-only, no data changes
- **Low:** New field that doesn't require conflict resolution
- **Medium:** Field updates requiring conflict resolution
- **High:** Changes to sync logic, encryption, or data structure

### Quality Gates Guidelines
Include story-specific gates beyond standard checks:
- Manual tests for UI changes
- Integration tests for cross-component features
- Performance tests for sync or data-heavy operations
- Platform-specific tests for platform-scoped changes

### Success Metrics Guidelines
Define measurable success criteria:
- **Quantitative:** Numbers, percentages, time measurements
- **Qualitative:** User feedback, usability observations
- **Adoption:** Usage statistics, engagement metrics

---

## Example: Completed Story

See `/atlas-skills/atlas-agent-product-manager/SKILL.md` for complete examples:
- Example 1: Simple UI Change (Standard Workflow)
- Example 2: Data Structure Change (Full Workflow)
- Example 3: Bug Fix (Standard Workflow)
