# Acceptance Criteria Guide

This guide helps Product Managers write clear, testable acceptance criteria for StackMap user stories.

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

✅ **Good:** "Activity card displays icon (24px) on left side"
❌ **Bad:** "Activity card displays icon (after icon library is implemented)"

### Negotiable
Implementation details are negotiable, but outcomes are fixed.

✅ **Good:** "User can assign category via UI" (how = negotiable)
❌ **Bad:** "User clicks dropdown at top of screen to select category" (too prescriptive)

### Valuable
Each criterion should add clear value.

✅ **Good:** "Category persists after app restart" (clear user value)
❌ **Bad:** "Category stored in Zustand store" (implementation detail, not user value)

### Estimable
Criteria should be clear enough to estimate effort.

✅ **Good:** "Icon size is 28px on all platforms"
❌ **Bad:** "Icon looks good" (too vague to estimate)

### Small
Each criterion should be a small, focused requirement.

✅ **Good:** "Activity text uses black (#000) color"
❌ **Bad:** "Activity card is fully styled and responsive" (too broad)

### Testable
Every criterion must be objectively verifiable.

✅ **Good:** "Sync completes in < 5 seconds with 100 activities"
❌ **Bad:** "Sync feels fast" (subjective, not testable)

---

## Writing Testable Criteria

### Use Measurable Language

**Numbers and Measurements:**
✅ "Icon size is 24px"
✅ "Card width is 48% on Android"
✅ "Sync completes in < 5 seconds"

❌ "Icon is big enough"
❌ "Card takes up about half the screen"
❌ "Sync is fast"

**Boolean Checks:**
✅ "Activity card displays icon"
✅ "Category dropdown is visible"
✅ "Sync status indicator turns green on success"

❌ "Activity card looks complete"
❌ "Category UI is there"
❌ "User knows sync succeeded"

**State Verification:**
✅ "After sync, remote changes appear in local list"
✅ "Deleted activity does not reappear after app restart"
✅ "Icon persists after sync conflict"

❌ "Sync works correctly"
❌ "Deleted activity stays deleted"
❌ "Icon doesn't get lost"

### Specify Platform Requirements

For cross-platform stories, specify platform-specific criteria:

✅ **Good:**
```
1. Activity card width:
   - Android: 48% with alignContent: 'flex-start'
   - iOS: 48% (same as Android)
   - Web: 31% at ≥1200px, 48% at 768-1199px, 100% at <768px
2. Typography component used on all platforms
3. No gray text colors - all text is black (#000)
```

❌ **Bad:**
```
1. Activity card looks good on all platforms
2. Text is readable
```

### Include Edge Cases

Don't just test the happy path - specify edge cases:

✅ **Good:**
```
1. Activity card displays icon when icon exists
2. Activity card shows placeholder when icon is null
3. Activity card falls back to emoji if icon missing (legacy data)
4. Activity card handles empty string icon gracefully
```

❌ **Bad:**
```
1. Activity card displays icon
```

### Specify Error Handling

Include criteria for failure scenarios:

✅ **Good:**
```
1. Sync succeeds when network available
2. Sync shows "Offline" message when network unavailable
3. Sync queues changes when offline, applies when back online
4. Sync shows error message if server returns 500
5. Sync retries up to 3 times before showing error
```

❌ **Bad:**
```
1. Sync works when online
2. Sync handles offline gracefully
```

---

## StackMap-Specific Criteria

### Store Updates

Always specify which store is affected and how:

✅ **Good:**
```
1. Activity updates use useLibraryStore.getState().setLibrary()
2. User profile updates use useUserStore.getState().setUsers()
3. Settings updates use useSettingsStore.getState().updateSettings()
```

❌ **Bad:**
```
1. Store is updated with new data
```

### Field Naming

Specify canonical field names and fallbacks:

✅ **Good:**
```
1. Activity writes use activity.text and activity.icon
2. Activity reads use (activity.text || activity.name || activity.title)
3. Icon reads use (activity.icon || activity.emoji)
4. Legacy emoji field is migrated to icon during save
```

❌ **Bad:**
```
1. Activity uses correct field names
2. Legacy data is handled
```

### Platform Gotchas

Reference platform-specific requirements from CLAUDE.md:

✅ **Good:**
```
Android:
1. FlexWrap cards use percentage widths (48%)
2. Typography component used (not direct fontWeight property)
3. Font variants load correctly (ComicRelief-Bold)

iOS:
1. No AsyncStorage calls in render (avoids 20s freeze)
2. Modal uses specific flex rules from styles.js
3. Tested on physical device

Web:
1. 3-column layout uses percentage widths (31%/48%/100%)
2. No Alert.alert - uses ConfirmModal component
3. Tested at all breakpoints (<768px, 768-1199px, ≥1200px)
```

❌ **Bad:**
```
1. Works on Android
2. Works on iOS
3. Works on web
```

### Sync Requirements

For stories affecting sync, specify sync-specific criteria:

✅ **Good:**
```
1. New field included in encryption/decryption
2. Conflict resolution preserves new field using last-write-wins
3. Backwards compatibility: Legacy data without field defaults to null
4. Sync test passes: Local change → Upload → Download → Verify
5. Conflict test passes: Modify locally + remotely → Sync → Verify merge
6. Migration logged in sync debug console: "[Sync] Migrated field X"
```

❌ **Bad:**
```
1. Sync works with new field
2. Old data is handled
```

---

## Examples: Good vs Bad

### Example 1: UI Change

**Story:** Update activity card icon size

❌ **Bad Criteria:**
```
1. Icon looks bigger
2. Layout still works
3. No bugs
```

**Why bad:**
- "Looks bigger" is subjective (not measurable)
- "Layout still works" is vague (what does "works" mean?)
- "No bugs" is not a criterion (all code should have no bugs)

✅ **Good Criteria:**
```
1. Activity card icon size is 28px (increased from 20px)
2. Icon maintains 1:1 aspect ratio on all platforms
3. Icon aligns vertically with text (center alignment)
4. No layout shifts when icon loads
5. Icon does not overlap text on any platform
6. Typography component used for text (not direct Text component)
7. Tested on iOS simulator, Android emulator, web browser at 1920x1080
```

**Why good:**
- Measurable (28px, 1:1 aspect ratio)
- Platform-specific (all platforms)
- Edge cases (layout shifts, overlaps)
- Clear validation (tested on specific platforms/resolutions)

### Example 2: Data Structure Change

**Story:** Add activity categories

❌ **Bad Criteria:**
```
1. Activities have categories
2. User can set categories
3. Categories work with sync
```

**Why bad:**
- "Have categories" - what type? Required or optional?
- "User can set" - how? Via what UI?
- "Work with sync" - what does "work" mean exactly?

✅ **Good Criteria:**
```
1. Activity has optional "category" field (string | null)
2. Activity Library groups activities by category (alphabetically)
3. Activities without category appear in "Uncategorized" section
4. User can assign category when creating activity via dropdown
5. User can change category when editing activity via same dropdown
6. Dropdown shows existing categories + "Uncategorized" option
7. Category persists in useLibraryStore
8. Category included in sync encryption/decryption
9. Conflict resolution: Last-write-wins for category (based on updatedAt)
10. Legacy activities without category default to null (not undefined)
11. Category field uses canonical name "category" (not "cat" or "group")
12. Test: Create category → Sync → Verify appears on second device
13. Test: Modify category on both devices → Sync → Verify last-write-wins
```

**Why good:**
- Specific type (string | null)
- Clear UI behavior (dropdown, grouping, uncategorized)
- Store identified (useLibraryStore)
- Sync strategy specified (last-write-wins)
- Migration strategy (default to null)
- Field naming (canonical "category")
- Test cases specified

### Example 3: Bug Fix

**Story:** Fix activity icons lost during sync conflicts

❌ **Bad Criteria:**
```
1. Icons don't get lost anymore
2. Sync preserves icons
```

**Why bad:**
- "Don't get lost" - not specific about how preservation works
- "Preserves icons" - what if both local and remote have different icons?

✅ **Good Criteria:**
```
1. Conflict resolution preserves icon using this strategy:
   - If remote.icon exists: Use remote.icon (last-write-wins)
   - Else if local.icon exists: Use local.icon
   - Else if local.emoji exists: Migrate local.emoji → icon
   - Else: icon = null
2. Deep merge used instead of shallow Object.assign
3. Test "preserves icon during conflict" passes
4. Test "migrates emoji to icon" passes
5. Manual test: Create activity with icon → Modify remotely → Sync → Verify icon preserved
6. Manual test: Create activity with emoji (legacy) → Sync conflict → Verify migrated to icon
7. Sync debug logs show: "[Sync] Preserved icon during conflict: {icon}"
8. Zero reports of lost icons after deployment to QUAL
```

**Why good:**
- Precise conflict resolution strategy
- Implementation hint (deep merge)
- Automated tests specified
- Manual test steps defined
- Debug logging included
- Success metric (zero reports)

---

## Common Mistakes to Avoid

### 1. Too Vague

❌ "Feature works correctly"
❌ "User can use the feature"
❌ "UI looks good"

✅ "Category dropdown displays all existing categories alphabetically"
✅ "User can select category within 2 taps"
✅ "Typography component used with black (#000) text color"

### 2. Implementation-Focused

❌ "Function getCategoryById implemented"
❌ "Redux action dispatched on category select"
❌ "CSS class .category-dropdown applied"

✅ "Category is retrieved and displayed when activity card renders"
✅ "Category persists in useLibraryStore after selection"
✅ "Category dropdown styled with 16px padding and border-radius"

**Exception:** Implementation details ARE appropriate for:
- Technical debt stories
- Refactoring stories
- Infrastructure stories

### 3. Missing Edge Cases

❌ "Activity displays category"

✅ "Activity displays category when category is set"
✅ "Activity shows 'Uncategorized' label when category is null"
✅ "Activity handles undefined category gracefully (treats as null)"
✅ "Activity displays long category names with ellipsis after 20 characters"

### 4. Not Platform-Specific

❌ "Icon is 24px"

✅ "Icon is 24px on iOS"
✅ "Icon is 24px on Android (verified with Typography component)"
✅ "Icon is 24px on web at all breakpoints"

### 5. Forgetting Sync

For data changes, always consider sync:

❌ "Activity category is saved"

✅ "Activity category persists in useLibraryStore"
✅ "Activity category included in sync encryption"
✅ "Activity category preserved during conflict resolution (last-write-wins)"
✅ "Activity category syncs to remote device within 5 seconds"
✅ "Legacy activities without category default to null during sync"

---

## Checklist: Before Finalizing Criteria

Use this checklist before submitting acceptance criteria:

### Completeness
- [ ] All functional requirements covered
- [ ] All platforms addressed (iOS/Android/Web)
- [ ] All edge cases identified
- [ ] Error handling specified
- [ ] Success and failure states defined

### Testability
- [ ] Every criterion is measurable or observable
- [ ] Manual test steps provided for UI changes
- [ ] Automated test expectations defined
- [ ] Platform-specific validation included

### StackMap Conventions
- [ ] Store impact specified (which store, which methods)
- [ ] Field naming conventions defined (text/icon, fallbacks)
- [ ] Platform gotchas referenced (Android flexwrap, iOS AsyncStorage, Web layout)
- [ ] Sync considerations evaluated (encryption, conflict resolution, migration)

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

---

## Templates by Story Type

### UI Change Template
```
1. [Element] displays [content] at [position]
2. [Element] uses [specific styling] (e.g., Typography component, #000 color)
3. [Element] maintains [constraint] on all platforms (e.g., 24px size, 1:1 aspect)
4. [Element] handles [edge case] gracefully (e.g., long text, null value)
5. Platform-specific:
   - Android: [Android-specific requirement]
   - iOS: [iOS-specific requirement]
   - Web: [Web-specific requirement]
6. Tested on [specific platforms/resolutions]
```

### Data Structure Change Template
```
1. [Entity] has [new field] of type [type] (e.g., category: string | null)
2. [Field] defaults to [value] for new entries (e.g., null)
3. [Field] is stored in [store] via [method] (e.g., useLibraryStore.getState().setLibrary())
4. [Field] is included in sync encryption/decryption
5. Conflict resolution: [strategy] (e.g., last-write-wins based on updatedAt)
6. Legacy data: [migration strategy] (e.g., undefined → null)
7. Field naming: [canonical name] (not [alternative names])
8. Test: Create → Sync → Verify on remote device
9. Test: Modify locally + remotely → Sync → Verify conflict resolution
10. Test: Load legacy data → Verify migration
```

### Bug Fix Template
```
1. [Bug] no longer occurs under [conditions]
2. Root cause addressed: [specific fix] (e.g., deep merge instead of shallow)
3. Edge cases tested:
   - [Edge case 1]
   - [Edge case 2]
4. Test "[test name]" added and passes
5. Manual test: [step-by-step reproduction] → Verify fixed
6. Regression test: [related functionality] still works
7. Zero reports of [bug] after deployment to QUAL
```

---

## Summary

**Good acceptance criteria are:**
- ✅ Specific and measurable (28px, not "big enough")
- ✅ Testable and verifiable (can be objectively validated)
- ✅ Complete (cover happy path, edge cases, errors)
- ✅ Platform-aware (address iOS/Android/Web differences)
- ✅ StackMap-compliant (stores, field naming, platform gotchas, sync)

**Avoid:**
- ❌ Subjective language ("looks good", "feels fast")
- ❌ Vague terms ("works correctly", "handles properly")
- ❌ Implementation details (unless technical debt/refactoring story)
- ❌ Missing edge cases (null, undefined, empty, long strings)
- ❌ Platform-agnostic criteria (must address platform differences)

**Remember:** Clarity is kindness. Clear acceptance criteria prevent wasted work and ensure successful delivery.
