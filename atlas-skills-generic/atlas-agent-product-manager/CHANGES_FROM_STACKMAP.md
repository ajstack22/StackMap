# Changes from StackMap-Specific to Generic PM Agent

This document outlines what was removed, modified, or generalized when converting the StackMap-specific PM agent to a generic, portable version.

---

## Summary of Changes

### Removed (StackMap-Specific)

**From SKILL.md:**
- ✅ Store Impact sections (useAppStore, useUserStore, useSettingsStore, useLibraryStore)
- ✅ Field Naming conventions (activities use `text`/`icon`, users use `icon`/`name`)
- ✅ Platform Gotchas (Android flexwrap, iOS AsyncStorage, Web 3-column layout)
- ✅ Sync Considerations (encryption, conflict resolution, migration)
- ✅ Deployment tier details (QUAL/STAGE/BETA/PROD with stackmap.app URLs)
- ✅ StackMap-specific story examples (activities, categories, icons)
- ✅ StackMap-specific validation checklists

**From story-template.md:**
- ✅ Store Impact section
- ✅ Field Naming section
- ✅ Sync Considerations section
- ✅ Platform-specific gotchas (Android/iOS/Web specifics)
- ✅ StackMap-specific implementation notes

**From acceptance-criteria-guide.md:**
- ✅ StackMap field naming examples
- ✅ StackMap store update examples
- ✅ StackMap platform gotcha examples
- ✅ StackMap sync requirement examples

### Generalized (Made Domain-Agnostic)

**User Story Format:**
```markdown
# Before (StackMap-specific)
## Store Impact
- useLibraryStore: Add category field
- Update method: useLibraryStore.getState().setLibrary()

## Field Naming
Activities:
  - WRITE: Use activity.text and activity.icon
  - READ: Use activity.text || activity.name || activity.title

## Sync Considerations
- Impact: High - Modifies activity object structure
- Conflict resolution: Last-write-wins

# After (Generic)
## Technical Considerations
**Database Changes:**
- [ ] Schema migrations needed?
- [ ] Data migration strategy defined?

**API Changes:**
- [ ] New endpoints added?
- [ ] API documentation updated?

**Security Implications:**
- [ ] Authentication/authorization required?
- [ ] Input validation implemented?
```

**Platform Scope:**
```markdown
# Before (StackMap-specific)
**Platform Scope:** All (iOS, Android, Web)
**Platform Gotchas:**
- Android: FlexWrap requires percentage widths (48%)
- iOS: Avoid AsyncStorage in render (20s freeze)
- Web: 3-column layout uses percentage widths (31%/48%/100%)

# After (Generic)
**Platform Scope:** [All / Backend / Frontend / Mobile / Specific platforms]

Create `.atlas/conventions.md` for platform-specific requirements:
- [Your platform 1]: [Your requirements]
- [Your platform 2]: [Your requirements]
```

**Story Examples:**
```markdown
# Before (StackMap-specific)
Example: Add Activity Categories
- Activities have "category" field
- useLibraryStore impact
- Sync encryption/decryption
- activity.text and activity.icon usage

# After (Generic)
Example: Add User Profile Image Upload
- User has "profileImageUrl" field
- Database schema change
- File upload validation
- Security and performance considerations
```

### Added (Customization Features)

**Customization Guide:**
- ✅ `.atlas/story-template.md` - Project-specific story sections
- ✅ `.atlas/conventions.md` - Non-negotiable standards
- ✅ `.atlas/story-examples.md` - Domain-specific examples
- ✅ `.atlas/quality-gates.md` - Project-specific gates

**Domain Examples:**
- ✅ E-Commerce project customization example
- ✅ Healthcare project customization example
- ✅ SaaS multi-tenant customization example
- ✅ Mobile app customization example

**Generic Story Format:**
- ✅ Database changes checklist
- ✅ API changes checklist
- ✅ Security implications checklist
- ✅ Performance impact checklist
- ✅ Third-party integrations checklist

**Documentation:**
- ✅ README.md - How to use and customize
- ✅ Customization patterns for different domains
- ✅ Integration with Atlas workflows
- ✅ Benefits of generic approach

---

## Detailed Comparison

### SKILL.md

#### Removed Sections

**1. StackMap-Specific Story Elements** (lines 286-375 in original)
- Store Impact Analysis
- Field Naming Specification
- Platform Scope & Gotchas
- Sync Considerations
- Quality Gates Specific to Story

**Replaced with:**
- Generic Technical Considerations
- Customization guide for project-specific sections

**2. Story Creation Examples** (lines 393-640 in original)
- Example 1: Update Activity Card Icon Size
- Example 2: Add Activity Categories
- Example 3: Activity Icons Lost During Sync Conflicts

**Replaced with:**
- Generic story format template
- Instructions for creating project-specific examples

#### Generalized Sections

**1. Work Initiation (User Stories)** (lines 54-71 in original)

**Before:**
```markdown
**StackMap-Specific Elements:**
- **Store Impact** - Which stores affected
- **Field Naming** - Activities use text/icon
- **Platform Gotchas** - Android flexwrap, iOS AsyncStorage, Web 3-column
- **Sync Considerations** - Conflict resolution needed?
```

**After:**
```markdown
**Project-Specific Elements:**

Create `.atlas/story-template.md` in your project to customize with:
- **Technical Impact** - Which modules/systems affected?
- **Data Considerations** - Database schema changes? API changes?
- **Platform Gotchas** - Platform-specific constraints or requirements
- **Integration Points** - Third-party services? External APIs?
```

**2. Quality Gatekeeping** (lines 73-97 in original)

**Before:**
```markdown
**Pre-Implementation Checks:**
- [ ] Store impact identified and documented
- [ ] Field naming conventions specified (text/icon)
- [ ] Platform gotchas addressed (Android, iOS, Web)
```

**After:**
```markdown
**Pre-Implementation Checks:**
- [ ] Technical impact identified and documented
- [ ] Platform scope defined (if applicable)
- [ ] Security and performance implications evaluated
```

**3. Release Management** (lines 119-139 in original)

**Before:**
```markdown
**Deployment Tiers:**
- **QUAL** - Multiple/day, stackmap.app/qual/api
- **STAGE** - Internal validation, stackmap.app/stage/api
- **BETA** - 1-2/week, stackmap.app/beta/api
- **PROD** - Weekly/bi-weekly, stackmap.app/api
```

**After:**
```markdown
**Deployment Environments** (customize for your project):
- **Dev/Local** - Development testing, frequent deployments
- **Staging** - Internal validation, pre-production testing
- **Beta/UAT** - User acceptance testing, closed beta
- **Production** - Public release, production environment
```

#### Modified Sections

**1. Enforce the Contract** (lines 208-251 in original)

**Before:**
```markdown
**StackMap Field Naming:**
- Activities MUST use `text` and `icon` (not name/title/emoji)

**StackMap Store Updates:**
- MUST use store-specific methods (NOT `useAppStore.setState`)

**Platform-Specific Contracts:**
- Android flexwrap: MUST use percentage widths
```

**After:**
```markdown
**Code Quality:**
- MUST pass linting and type checking
- MUST include tests for new functionality

**Documentation:**
- MUST update API documentation for API changes
- MUST update README for setup/configuration changes

**Testing:**
- MUST include unit tests for business logic
```

### story-template.md

#### Removed Sections

**1. Store Impact** (lines 24-36 in original)
```markdown
## Store Impact
**Affected Stores:**
- [ ] useAppStore
- [ ] useUserStore
...
```

**2. Field Naming** (lines 38-49 in original)
```markdown
## Field Naming
**Reading (with fallbacks):**
- activity.text || activity.name || activity.title
```

**3. Sync Considerations** (lines 70-86 in original)
```markdown
## Sync Considerations
**Impact:** [None / Low / Medium / High]
**Conflict Resolution Strategy:**
```

**4. Platform-Specific Gotchas** (lines 54-69 in original)
```markdown
**Android:**
- FlexWrap requires percentage widths
**iOS:**
- Avoid AsyncStorage in render
**Web:**
- 3-column layout uses percentage widths
```

#### Added Sections

**1. Technical Considerations** (comprehensive checklist)
```markdown
**Database Changes:**
- [ ] Schema migrations needed?
- [ ] Data migration strategy defined?

**API Changes:**
- [ ] New endpoints added?
- [ ] API versioning handled?

**Security Implications:**
- [ ] Authentication/authorization required?
- [ ] Input validation implemented?

**Performance Impact:**
- [ ] Database query optimization needed?
- [ ] Caching strategy defined?
```

**2. Customization Guide** (new section)
```markdown
## Project-Specific Customization Guide

To adapt this template to your project, create `.atlas/story-template.md`:

### Example 1: E-Commerce Project
[E-commerce-specific sections]

### Example 2: Healthcare Project
[Healthcare-specific sections]

### Example 3: SaaS Multi-Tenant Project
[SaaS-specific sections]
```

### acceptance-criteria-guide.md

#### Generalized Examples

**Example 1: UI Change**

**Before (StackMap):**
```markdown
Story: Update activity card icon size

Acceptance Criteria:
1. Activity card icon size is 28px (increased from 20px)
2. Icon uses activity.icon || activity.emoji (fallback)
3. Typography component used (not direct Text component)
4. Platform-specific:
   - Android: 48% width with alignContent: 'flex-start'
   - iOS: Same as Android
   - Web: 31% width for 3-column layout at ≥1200px
```

**After (Generic):**
```markdown
Story: Add product image upload to listing page

Acceptance Criteria:
1. User can click "Upload Image" button on product listing page
2. File picker opens allowing PNG, JPG, GIF, WebP files
3. Image size limited to 5MB maximum
4. Selected image previews at 400x400px before upload
5. Upload button shows progress bar (0-100%)
6. Success message displays after upload
7. Uploaded image appears at 300x300px
8. Error messages for: wrong format, file too large, upload failure
9. Tested on Chrome, Firefox, Safari (latest versions)
```

**Example 2: Data Structure Change**

**Before (StackMap):**
```markdown
Story: Add activity categories

- useLibraryStore impact
- activity.category field
- Sync encryption/decryption
- Conflict resolution: last-write-wins
- Field naming: activity.category (not cat/group)
```

**After (Generic):**
```markdown
Story: Migrate user preferences from JSON to database

- Migration script reads JSON files
- Creates user_preferences table
- Foreign key constraints
- Rollback script provided
- Backwards compatibility (JSON fallback)
- Documentation for self-hosted users
```

#### Removed StackMap-Specific Content

**1. Store Update Examples** (removed)
```markdown
## StackMap-Specific Criteria

### Store Updates
✅ Activity updates use useLibraryStore.getState().setLibrary()
✅ User updates use useUserStore.getState().setUsers()
```

**2. Field Naming Examples** (removed)
```markdown
### Field Naming
✅ Activity writes use activity.text and activity.icon
✅ Activity reads use (activity.text || activity.name || activity.title)
```

**3. Platform Gotcha Examples** (removed)
```markdown
### Platform Gotchas
Android:
1. FlexWrap cards use percentage widths (48%)
2. Typography component used (not direct fontWeight)
```

**4. Sync Requirements Examples** (removed)
```markdown
### Sync Requirements
✅ New field included in encryption/decryption
✅ Conflict resolution preserves new field using last-write-wins
```

#### Added Generic Domain Examples

**1. E-Commerce**
```markdown
**Story:** Add shopping cart item count badge
1. Badge displays in top-right corner of cart icon
2. Badge shows count of items in cart (not quantity)
3. Badge color: red background, white text
4. Badge maximum displays "99+" when count > 99
```

**2. SaaS**
```markdown
**Story:** Add user role management
1. Admin can assign roles: Admin, Editor, Viewer
2. Only admins can change roles (authorization enforced)
3. Audit log records role changes
4. Cannot remove last admin (validation)
```

**3. Mobile App**
```markdown
**Story:** Add offline mode for reading content
1. App downloads content when online for offline access
2. Downloads up to 100 most recent articles
3. Offline indicator displays when offline
4. Downloaded articles expire after 30 days
```

---

## Migration Path for Projects Using StackMap Version

If you're currently using the StackMap-specific PM agent and want to migrate to the generic version:

### Step 1: Copy Current Customizations

Extract your StackMap-specific sections to `.atlas/` files:

**Create `.atlas/story-template.md`:**
```markdown
## Store Impact
**Affected Stores:**
- [ ] useAppStore
- [ ] useUserStore
- [ ] useSettingsStore
- [ ] useLibraryStore

**Update Methods:**
[Store-specific update methods]

## Field Naming
**Activities:**
- WRITE: activity.text, activity.icon
- READ: activity.text || activity.name || activity.title

**Users:**
- WRITE: user.icon, user.name
- READ: user.icon || user.emoji

## Sync Considerations
**Impact:** [None / Low / Medium / High]
**Conflict Resolution:** [Strategy]
**Migration:** [Strategy]
```

**Create `.atlas/conventions.md`:**
```markdown
## StackMap Platform Gotchas

**Android:**
- FlexWrap MUST use percentage widths (48%) + alignContent: 'flex-start'
- NO calculateCardWidth() for multi-column layouts
- Font weights: MUST use font variants (ComicRelief-Bold)

**iOS:**
- AsyncStorage: Causes 20+ second freeze - debounced
- NetInfo.fetch(): DISABLED - causes freezes
- Modal constraints: MUST use specific flex rules

**Web:**
- 3-Column Layout: MUST use percentage widths (31%/48%/100%)
- NO flexBasis: 'auto' for multi-column layouts
- Alert.alert: Not supported - use ConfirmModal
```

**Create `.atlas/story-examples.md`:**
```markdown
# StackMap Story Examples

[Copy examples from original SKILL.md lines 393-640]
```

### Step 2: Replace PM Agent

```bash
# Backup current version
mv atlas-skills/atlas-agent-product-manager atlas-skills/atlas-agent-product-manager.backup

# Copy generic version
cp -r atlas-skills-generic/atlas-agent-product-manager atlas-skills/
```

### Step 3: Verify Customizations

The PM agent will now:
1. Use generic story format as baseline
2. Include your StackMap sections from `.atlas/story-template.md`
3. Enforce your conventions from `.atlas/conventions.md`
4. Reference your examples from `.atlas/story-examples.md`

---

## Benefits of Generic Version

### For StackMap
- ✅ Maintains all StackMap-specific functionality via `.atlas/` customizations
- ✅ Easier to update PM agent without losing customizations
- ✅ Clear separation between framework and project specifics

### For Other Projects
- ✅ Works out-of-the-box with any project
- ✅ No StackMap concepts to remove/understand
- ✅ Clear customization path
- ✅ Domain-agnostic examples

### For Maintenance
- ✅ Single generic version to maintain
- ✅ Project customizations stay in project repos
- ✅ Core principles and format stay consistent
- ✅ Easy to evolve both independently

---

## Summary

**Removed:** StackMap-specific implementation details (stores, field naming, sync, platform gotchas)

**Generalized:** Story format, acceptance criteria, quality gates, deployment process

**Added:** Customization guide, domain examples, project-specific configuration pattern

**Result:** Portable, domain-agnostic PM agent that works for ANY project via customization files.
