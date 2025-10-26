# Acceptance Criteria Guide

This guide helps Product Managers write clear, testable acceptance criteria for any project.

---

## What Are Acceptance Criteria?

**Acceptance criteria** are the conditions that must be met for a user story to be considered complete. They define the boundaries of the story and provide a checklist for developers and reviewers.

**Good acceptance criteria are:**
- **Specific** - Clear and unambiguous
- **Measurable** - Objectively verifiable
- **Testable** - Can be validated through testing
- **Achievable** - Realistic given constraints
- **Complete** - Cover all aspects of the story

---

## The INVEST Framework

Use INVEST principles to evaluate acceptance criteria quality:

### Independent
Criteria should not depend on other incomplete work.

✅ **Good:** "Product card displays image (200x200px) on left side"
❌ **Bad:** "Product card displays image (after image CDN is implemented)"

### Negotiable
Implementation details are negotiable, but outcomes are fixed.

✅ **Good:** "User can assign tags via UI" (how = negotiable)
❌ **Bad:** "User clicks dropdown at top-right to select tags" (too prescriptive)

### Valuable
Each criterion should add clear value.

✅ **Good:** "Tags persist after browser refresh" (clear user value)
❌ **Bad:** "Tags stored in Redux store" (implementation detail, not user value)

### Estimable
Criteria should be clear enough to estimate effort.

✅ **Good:** "Image size is 200x200px on all screen sizes"
❌ **Bad:** "Image looks good" (too vague to estimate)

### Small
Each criterion should be a small, focused requirement.

✅ **Good:** "Product title uses 18px font, bold weight"
❌ **Bad:** "Product card is fully styled and responsive" (too broad)

### Testable
Every criterion must be objectively verifiable.

✅ **Good:** "API returns results in < 200ms with 1000 records"
❌ **Bad:** "API feels fast" (subjective, not testable)

---

## Writing Testable Criteria

### Use Measurable Language

**Numbers and Measurements:**
✅ "Image size is 200x200px"
✅ "Card width is 300px on mobile"
✅ "API response time < 500ms"

❌ "Image is big enough"
❌ "Card takes up most of the screen"
❌ "API is fast"

**Boolean Checks:**
✅ "Product card displays image"
✅ "Tag dropdown is visible"
✅ "Success notification appears after save"

❌ "Product card looks complete"
❌ "Tag UI is there"
❌ "User knows save succeeded"

**State Verification:**
✅ "After save, changes appear immediately in list"
✅ "Deleted item does not reappear after page refresh"
✅ "Selected filters persist across page navigation"

❌ "Save works correctly"
❌ "Deleted item stays deleted"
❌ "Filters don't get lost"

### Specify Platform/Browser Requirements

For multi-platform projects, specify platform-specific criteria:

✅ **Good:**
```
1. Product card width:
   - Mobile (<768px): 100% width
   - Tablet (768-1024px): 48% width (2 columns)
   - Desktop (>1024px): 31% width (3 columns)
2. Tested on Chrome, Firefox, Safari latest versions
3. Touch interactions work on iOS and Android
```

❌ **Bad:**
```
1. Product card looks good on all devices
2. Works on all browsers
```

### Include Edge Cases

Don't just test the happy path - specify edge cases:

✅ **Good:**
```
1. Product card displays image when image URL exists
2. Product card shows placeholder.png when image URL is null
3. Product card shows error icon when image URL returns 404
4. Product card handles empty string URL gracefully (shows placeholder)
5. Product card displays alt text for screen readers
```

❌ **Bad:**
```
1. Product card displays image
```

### Specify Error Handling

Include criteria for failure scenarios:

✅ **Good:**
```
1. Save succeeds when all required fields filled
2. Save shows "Name required" error when name empty
3. Save shows "Invalid email" error when email malformed
4. Save shows "Server error" message when API returns 500
5. Save retries up to 3 times before showing error
6. Error messages display in red below relevant field
```

❌ **Bad:**
```
1. Save works when data is valid
2. Save handles errors gracefully
```

---

## Examples: Good vs Bad

### Example 1: UI Feature

**Story:** Add product image upload to listing page

❌ **Bad Criteria:**
```
1. Image looks bigger and better
2. Layout still works
3. No bugs
```

**Why bad:**
- "Looks bigger and better" is subjective (not measurable)
- "Layout still works" is vague (what does "works" mean?)
- "No bugs" is not a criterion (all code should have no bugs)

✅ **Good Criteria:**
```
1. User can click "Upload Image" button on product listing page
2. File picker opens allowing selection of PNG, JPG, GIF, WebP files
3. Image size limited to 5MB maximum (enforced client and server side)
4. Selected image previews at 400x400px before upload
5. Upload button shows progress bar (0-100%) during upload
6. Success message "Image uploaded successfully" displays after upload
7. Uploaded image appears on listing page at 300x300px
8. Image has alt text equal to product name for accessibility
9. Error messages display for:
   - Wrong file format: "Only PNG, JPG, GIF, WebP allowed"
   - File too large: "Image must be under 5MB"
   - Upload failure: "Upload failed. Please try again."
10. Tested on Chrome, Firefox, Safari (latest versions)
```

**Why good:**
- Measurable (5MB, 300x300px, progress 0-100%)
- Platform-specific (browsers listed)
- Edge cases (file format, size, upload failure)
- Accessibility (alt text)
- Clear validation (tested on specific browsers)

### Example 2: API Feature

**Story:** Add search endpoint for products

❌ **Bad Criteria:**
```
1. Search works
2. Results are returned fast
3. Handles errors
```

**Why bad:**
- "Works" - what does "works" mean exactly?
- "Fast" - how fast? 100ms? 1s? 10s?
- "Handles errors" - which errors? How are they handled?

✅ **Good Criteria:**
```
1. New endpoint: GET /api/products/search?q={query}
2. Returns JSON array of products matching query
3. Search matches against: product name, description, tags
4. Case-insensitive search
5. Response includes: id, name, price, imageUrl, category
6. Results limited to 50 products maximum
7. Results sorted by relevance (exact matches first)
8. Response time < 500ms with 10,000 products in database
9. Empty query returns 400 Bad Request: "Query parameter required"
10. Query < 2 characters returns 400 Bad Request: "Query must be at least 2 characters"
11. No results returns empty array [] with 200 OK
12. Server error returns 500 with message: "Search failed. Please try again."
13. API documented in OpenAPI/Swagger spec
```

**Why good:**
- Specific endpoint and query format
- Exact response structure defined
- Performance metric (< 500ms)
- All error cases specified with status codes
- Success and failure states clearly defined

### Example 3: Data Migration

**Story:** Migrate user preferences from JSON to database

❌ **Bad Criteria:**
```
1. Data is migrated
2. Old format still works
3. No data loss
```

**Why bad:**
- "Is migrated" - when? How to verify?
- "Still works" - for how long? Is there a deprecation plan?
- "No data loss" - how is this verified? What about validation?

✅ **Good Criteria:**
```
1. Migration script reads JSON files from /data/user-prefs/
2. Migration creates user_preferences table with columns: user_id, key, value, updated_at
3. Each JSON preference becomes a row in user_preferences table
4. user_id foreign key constraint enforces referential integrity
5. Migration script logs: "Migrated {count} preferences for user {user_id}"
6. Migration validation: Count of JSON entries = count of DB rows
7. Rollback script provided: Exports DB data back to JSON format
8. Application reads from DB first, falls back to JSON if DB empty (backwards compatibility)
9. JSON format marked deprecated with console warning: "JSON preferences deprecated, migrate to DB"
10. JSON fallback removed in version 2.0 (6 months from now)
11. Documentation updated: Migration guide for self-hosted users
12. Zero data loss verified: Before/after checksums match
```

**Why good:**
- Specific source and destination
- Validation strategy defined (count comparison, checksums)
- Backwards compatibility plan
- Deprecation timeline
- Rollback strategy
- Documentation requirements

---

## Domain-Specific Examples

### E-Commerce Project

**Story:** Add shopping cart item count badge

✅ **Good Criteria:**
```
1. Badge displays in top-right corner of cart icon
2. Badge shows count of items in cart (not quantity)
3. Badge color: red background (#FF0000), white text (#FFFFFF)
4. Badge size: 20px diameter circle
5. Badge font: 12px, bold
6. Badge displays for count > 0
7. Badge hidden when cart is empty (count = 0)
8. Badge updates immediately when item added/removed
9. Badge maximum displays "99+" when count > 99
10. Badge accessible: aria-label="Shopping cart, {count} items"
```

### SaaS Project

**Story:** Add user role management

✅ **Good Criteria:**
```
1. Admin can assign roles: Admin, Editor, Viewer
2. Role dropdown appears on user management page
3. Only admins can change user roles (authorization enforced)
4. Role change persists immediately to database
5. Role change triggers email notification to affected user
6. Email subject: "Your role has been changed to {role}"
7. User session updates immediately (no logout required)
8. User sees new role permissions within 5 seconds
9. Audit log records: timestamp, admin_id, user_id, old_role, new_role
10. Downgrading last admin to non-admin shows error: "Cannot remove last admin"
```

### Mobile App

**Story:** Add offline mode for reading content

✅ **Good Criteria:**
```
1. App downloads content when online for offline access
2. Downloads up to 100 most recent articles
3. Download initiated on app open when connected to WiFi
4. Download progress shows: "Downloading {current}/{total} articles"
5. Offline indicator displays in status bar when offline
6. Offline articles have "Downloaded" badge in list
7. User can read downloaded articles when offline
8. Attempting to access non-downloaded article shows: "Not available offline"
9. App syncs read progress when back online
10. Downloaded articles expire after 30 days (re-download required)
```

---

## Common Mistakes to Avoid

### 1. Too Vague

❌ "Feature works correctly"
❌ "User can use the feature"
❌ "UI looks good"

✅ "Search dropdown displays matching results alphabetically"
✅ "User can select result within 2 clicks"
✅ "Typography: 16px font, #333 color, 1.5 line-height"

### 2. Implementation-Focused

❌ "Function getProductById implemented"
❌ "Redux action dispatched on button click"
❌ "CSS class .product-card applied"

✅ "Product details retrieved and displayed when card clicked"
✅ "Product state persists in store after selection"
✅ "Product card styled with 16px padding and 8px border-radius"

**Exception:** Implementation details ARE appropriate for:
- Technical debt stories
- Refactoring stories
- Infrastructure stories

### 3. Missing Edge Cases

❌ "Product displays price"

✅ "Product displays price when price is set"
✅ "Product shows 'Price not available' when price is null"
✅ "Product handles price of 0 (displays '$0.00' not 'Free')"
✅ "Product displays long prices (e.g., $1,234,567.89) with proper formatting"

### 4. Not Browser/Platform-Specific

❌ "Button is 40px tall"

✅ "Button is 40px tall on desktop browsers"
✅ "Button is 44px tall on mobile (iOS and Android) for touch target size"
✅ "Button tested on Chrome 100+, Firefox 90+, Safari 15+"

### 5. Forgetting Accessibility

For UI changes, always consider accessibility:

❌ "Icon button triggers action"

✅ "Icon button has aria-label='Delete item' for screen readers"
✅ "Icon button keyboard accessible (Enter/Space to activate)"
✅ "Icon button has focus indicator (2px blue outline)"
✅ "Icon button minimum size 44x44px for touch targets"

---

## Checklist: Before Finalizing Criteria

Use this checklist before submitting acceptance criteria:

### Completeness
- [ ] All functional requirements covered
- [ ] All platforms/browsers addressed (if applicable)
- [ ] All edge cases identified
- [ ] Error handling specified
- [ ] Success and failure states defined

### Testability
- [ ] Every criterion is measurable or observable
- [ ] Manual test steps provided for UI changes
- [ ] Automated test expectations defined
- [ ] Platform/browser-specific validation included

### Clarity
- [ ] No subjective language ("looks good", "feels fast")
- [ ] No ambiguous terms ("handles correctly", "works properly")
- [ ] Specific numbers and measurements provided
- [ ] Implementation hints provided if helpful (not prescriptive)

### INVEST Principles
- [ ] Independent - Not dependent on incomplete work
- [ ] Negotiable - Implementation details flexible
- [ ] Valuable - Each criterion adds user/business value
- [ ] Estimable - Clear enough to estimate effort
- [ ] Small - Each criterion is focused and atomic
- [ ] Testable - Objectively verifiable

### Accessibility (for UI changes)
- [ ] Screen reader compatibility (ARIA labels)
- [ ] Keyboard navigation support
- [ ] Focus indicators defined
- [ ] Touch target sizes (minimum 44x44px)
- [ ] Color contrast ratios meet WCAG standards

---

## Templates by Story Type

### UI Feature Template
```
1. [Element] displays [content] at [position]
2. [Element] uses [specific styling] (e.g., 16px font, #333 color)
3. [Element] maintains [constraint] on all platforms (e.g., 40px height)
4. [Element] handles [edge case] gracefully (e.g., long text, null value)
5. Platform/browser-specific:
   - Desktop: [Desktop requirement]
   - Mobile: [Mobile requirement]
   - Browsers: [Browser compatibility]
6. Accessibility:
   - ARIA label: [label]
   - Keyboard: [keyboard interaction]
   - Focus: [focus indicator]
7. Tested on [specific platforms/browsers]
```

### API Feature Template
```
1. New endpoint: [METHOD] /api/[path]
2. Request format: [body/query parameters]
3. Response format: [JSON structure]
4. Response time: [< Xms with Y records]
5. Success response: [HTTP status + body]
6. Error responses:
   - [Error case 1]: [HTTP status + message]
   - [Error case 2]: [HTTP status + message]
7. Authentication: [Required/optional, token type]
8. Rate limiting: [X requests per Y seconds]
9. API documentation: [OpenAPI/Swagger/other]
10. Backwards compatibility: [Versioning strategy]
```

### Data Migration Template
```
1. Migration reads from: [source]
2. Migration writes to: [destination]
3. Data transformation: [how data is transformed]
4. Validation strategy: [how to verify success]
5. Rollback strategy: [how to undo if needed]
6. Backwards compatibility: [fallback to old format]
7. Deprecation timeline: [when old format removed]
8. Migration logs: [what is logged]
9. Zero data loss verified: [validation method]
10. Documentation: [migration guide for users]
```

### Bug Fix Template
```
1. [Bug] no longer occurs under [conditions]
2. Root cause addressed: [specific fix]
3. Edge cases tested:
   - [Edge case 1]
   - [Edge case 2]
4. Test "[test name]" added and passes
5. Manual test: [step-by-step reproduction] → Verify fixed
6. Regression test: [related functionality] still works
7. Monitoring: [metrics to track post-deployment]
```

---

## Testing Scenarios Template

For complex features, include manual testing scenarios:

```markdown
## Manual Testing Scenarios

### Scenario 1: Happy Path
**Steps:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
- [Expected outcome 1]
- [Expected outcome 2]

### Scenario 2: Edge Case - [Description]
**Steps:**
1. [Step 1]
2. [Step 2]

**Expected Result:**
- [Expected outcome]

### Scenario 3: Error Case - [Description]
**Steps:**
1. [Step 1]
2. [Step 2]

**Expected Result:**
- [Error message displayed]
- [System state unchanged]
```

---

## Summary

**Good acceptance criteria are:**
- ✅ Specific and measurable (200px, not "big enough")
- ✅ Testable and verifiable (can be objectively validated)
- ✅ Complete (cover happy path, edge cases, errors)
- ✅ Platform-aware (address browser/device differences)
- ✅ Accessible (ARIA labels, keyboard nav, focus indicators)

**Avoid:**
- ❌ Subjective language ("looks good", "feels fast")
- ❌ Vague terms ("works correctly", "handles properly")
- ❌ Implementation details (unless technical debt/refactoring)
- ❌ Missing edge cases (null, undefined, empty, long strings)
- ❌ Platform-agnostic criteria (must address platform differences)

**Remember:** Clarity is kindness. Clear acceptance criteria prevent wasted work and ensure successful delivery.

---

## Additional Resources

**Project-Specific:**
- See `.atlas/story-examples.md` for domain-specific examples
- See `.atlas/conventions.md` for project coding standards
- See `.atlas/quality-gates.md` for quality requirements

**General:**
- INVEST Principles: https://en.wikipedia.org/wiki/INVEST_(mnemonic)
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Writing User Stories: https://www.mountaingoatsoftware.com/agile/user-stories
