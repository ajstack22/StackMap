# TD-006: Complete TypeScript Migration

## Story Type
Technical Debt - Code Quality

## Priority
MEDIUM - Type safety and maintainability

## Problem Statement
TypeScript migration is partially complete with mixed .js and .ts files. This creates type safety gaps and makes the codebase harder to maintain.

## Current State
- Mixed .js and .ts files
- @ts-check in some files
- Incomplete type definitions
- No strict mode enabled
- Type errors suppressed with any

## Acceptance Criteria
- [ ] Convert remaining .js files to .ts
- [ ] Add proper type definitions
- [ ] Enable strict mode
- [ ] Remove all 'any' types where possible
- [ ] Document type patterns
- [ ] Pass npm run typecheck with no errors

## Technical Requirements
- Systematic file conversion
- Create missing type definitions
- Update build configuration
- Maintain functionality during migration

## Migration Priority
1. **Core Services** (High)
   - Sync service
   - Store implementations
   - Data normalizer

2. **Components** (Medium)
   - Shared components
   - Feature components
   - Utility components

3. **Scripts** (Low)
   - Build scripts
   - Deployment scripts

## Files to Migrate
- `/src/services/sync/*.js`
- `/src/stores/*.js`
- `/src/components/**/*.js`
- `/src/utils/*.js`
- `/scripts/*.js`

## Type Definition Needs
```typescript
// Activity type
interface Activity {
  id: string;
  text: string; // not name or title
  icon: string; // not emoji
  color?: string;
  // ... other fields
}

// User type
interface User {
  id: string;
  name: string;
  icon: string; // not emoji
  // ... other fields
}
```

## Testing Requirements
- [ ] All tests pass
- [ ] No runtime errors
- [ ] Type checking passes
- [ ] Build succeeds
- [ ] No functionality regression

## Estimated Effort
Large (5-7 days)

## Business Impact
- Fewer runtime errors
- Easier maintenance
- Better IDE support
- Faster development
- Improved code quality

## Risk Assessment
- **Medium Risk**: Introduction of type errors
- **Mitigation**: Gradual migration
- **Low Risk**: Build issues
- **Mitigation**: Test each migration

## Success Metrics
- 100% TypeScript coverage
- Zero 'any' types (or documented reasons)
- Strict mode enabled
- Type checking in CI/CD

## Dependencies
- TypeScript knowledge
- Understanding of existing patterns

## Notes
Should be done gradually to avoid disruption. Consider migrating one module at a time.