# VF-002 - Fix TypeScript Errors (P1)
**Status**: Not Started
**Type**: Frontend/TypeScript
**Effort**: Large

### Context
93 TypeScript errors with 65 being fixable. Critical errors could cause runtime crashes and must be addressed before production deployment.

### Implementation
1. Check existing: Run `npm run typecheck` to see all errors
2. Implement: Create window.d.ts for web properties, fix missing props, correct type mismatches
3. Test: No runtime errors, type checking passes for critical paths

### Files to Modify
- Create `src/types/window.d.ts` - Define window extensions (syncInviteData, etc.)
- `App.js` - Fix 30+ window property errors, correct parseInt radix
- `src/components/Modals/DataModal/DataModal.js` - Add missing props
- `src/services/sync/encryptionServiceSimple.ts` - Fix secretbox type issue
- `tsconfig.json` - Add downlevelIteration flag for Set iteration

### Success Criteria
- [ ] Critical TypeScript errors = 0
- [ ] Total errors < 30 (from 93)
- [ ] No runtime type crashes
- [ ] Window properties properly typed
- [ ] Build succeeds

### Roles
- Lead: Create type definitions and fix errors
- Senior: Review type safety approach
- Architect: Ensure cross-platform compatibility