# VF-003 - Auto-Format Code with Prettier (P3)
**Status**: Not Started
**Type**: Frontend/Formatting
**Effort**: Small

### Context
31 files need Prettier formatting. Consistent formatting improves readability and reduces merge conflicts.

### Implementation
1. Check existing: Run `npx prettier --check "src/**/*.{js,ts,tsx}" "App.js"`
2. Implement: Run `npx prettier --write "src/**/*.{js,ts,tsx}" "App.js"`
3. Test: Verify no code logic changed, only formatting

### Files to Modify
- `src/components/ActivityLibrary/ActivityLibrary.js` - Format
- `src/components/EditModeList/*.js` - Format
- `src/components/Modals/**/*.js` - Format multiple modal files
- `src/components/Onboarding/*.js` - Format
- 19 other component files - Apply formatting

### Success Criteria
- [ ] All files pass prettier check
- [ ] No code logic changes
- [ ] Git diff shows only whitespace/formatting
- [ ] CI/CD prettier check passes
- [ ] Team agrees on prettier config

### Roles
- Lead: Run prettier and verify changes
- Senior: Review diff for any logic changes
- Architect: Confirm prettier config standards