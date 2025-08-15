# TypeScript Migration Strategy for StackMap

## Related Documentation Context
Review these files for essential context before implementing TypeScript migration:

### Technical/Architecture
- `/docs/architecture/TECHNICAL_STANDARDS.md` - Current coding standards to update
- `/docs/architecture/SYSTEM_ARCHITECTURE.md` - Understand system structure for migration priorities
- `/docs/DATA_STRUCTURE.md` - Data types for TypeScript interfaces

### Development Workflow
- `/CLAUDE.md` - Main development guide to update with TypeScript practices
- `/prompts/deployment.md` - Deployment process that needs type checking integration
- `/docs/development/BUILD_TROUBLESHOOTING.md` - Add TypeScript error solutions

### Testing/Quality
- `/docs/SIMPLE_TESTING_GUIDE.md` - Testing approach with TypeScript
- `/docs/development/TESTING_CHECKLIST.md` - Add type checking to checklist

### Field/Data Conventions
- `/prompts/field-conventions.md` - Critical for typing data structures correctly
- `/docs/data/data-overview.md` - Data flow understanding

### Component Architecture
- `/prompts/editmoderefactor/` - Current refactor work that should use TypeScript
- `/docs/MODAL_DATA_FLOWS.md` - Component communication patterns

## Overview
This prompt pack provides a comprehensive strategy for migrating StackMap to TypeScript to improve code quality, catch errors at compile time, and enhance developer experience.

## Current State (Jan 2025)
- Project is primarily JavaScript with React Native
- Basic TypeScript config exists (`tsconfig.json`)
- Type definitions created for critical services (`types/services.d.ts`)
- Validation scripts available for method checking

## Migration Strategy

### Phase 1: Add @ts-check to JavaScript Files
Add `// @ts-check` comment at the top of JavaScript files to enable TypeScript checking without conversion.

**Priority files for @ts-check:**
```javascript
// Critical services (prevent runtime errors)
src/services/sync/syncService.js
src/services/sync/encryptionService.js
src/services/sync/conflictResolver.js
src/services/sync/dataValidator.js
src/stores/useAppStore.js

// Core components (high usage)
src/components/Onboarding/OnboardingNew.js
src/components/Modals/DataModal/DataModal.js
src/components/EditModeList/EditModeList.js
App.js

// Utilities
src/utils/dataNormalizer.js
src/utils/cleanupGhostUsers.js
```

### Phase 2: Convert Critical Files to TypeScript

**Advantages of .ts/.tsx conversion:**
1. **Full Type Safety** - Catches ALL type errors at compile time, not just some
2. **Better IDE Support** - Autocomplete, intelligent refactoring, jump-to-definition
3. **Self-Documenting Code** - Types serve as inline documentation
4. **Refactoring Safety** - Rename methods/variables across entire codebase safely
5. **Prevents Runtime Crashes** - Eliminates bugs like `syncService.pull()` that cause app crashes
6. **Team Scalability** - New developers understand APIs instantly
7. **Catch Breaking Changes** - API changes are caught immediately

**Priority conversion order:**
```
1. Services (highest crash risk)
   - syncService.js → syncService.ts
   - encryptionService.js → encryptionService.ts
   - dataValidator.js → dataValidator.ts

2. Stores (state management)
   - useAppStore.js → useAppStore.ts

3. Utilities (shared logic)
   - dataNormalizer.js → dataNormalizer.ts
   - constants/index.js → constants/index.ts

4. Components (gradual migration)
   - Start with new components
   - Convert during major refactors
```

### Phase 3: Integration with Build Process

**Add to deploy-all.sh:**
```bash
# Add after lint check
echo "🔍 Running type checks..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Fix before deploying."
  exit 1
fi

echo "🔍 Checking for undefined method calls..."
npm run check:methods
if [ $? -ne 0 ]; then
  echo "❌ Undefined method calls found. Fix before deploying."
  exit 1
fi
```

## Implementation Commands

### Step 1: Add @ts-check to all critical files
```bash
# Add @ts-check to critical service files
for file in src/services/sync/*.js src/stores/*.js src/utils/dataNormalizer.js App.js; do
  if [ -f "$file" ] && ! grep -q "^// @ts-check" "$file"; then
    echo "Adding @ts-check to $file"
    echo -e "// @ts-check\n$(cat $file)" > "$file"
  fi
done
```

### Step 2: Fix type errors incrementally
```bash
# Check specific file
npx tsc --noEmit --allowJs --checkJs src/services/sync/syncService.js

# Check all files with @ts-check
npm run typecheck
```

### Step 3: Convert file to TypeScript
```bash
# Rename file
mv src/services/sync/syncService.js src/services/sync/syncService.ts

# Fix imports in other files
grep -r "syncService.js" src/ --include="*.js" --include="*.ts" | \
  while IFS=: read -r file rest; do
    sed -i '' 's/syncService\.js/syncService/g' "$file"
  done
```

## Type Definitions to Add

### Common Types (create in types/common.d.ts)
```typescript
// User type
interface User {
  id: string;
  name: string;
  icon: string;
  days: Record<string, Day>;
  deleted?: boolean;
  lastModified?: number;
}

// Activity type
interface Activity {
  id: string;
  text: string;
  icon: string;
  completed: boolean;
  completedAt?: number;
  completedBy?: string;
  deleted?: boolean;
}

// Day type
interface Day {
  date: string;
  activities: Activity[];
}

// App State
interface AppState {
  users: Record<string, User>;
  currentUser: string;
  currentDay: string;
  activities: Activity[];
  theme: string;
  syncEnabled: boolean;
}
```

## Documentation Updates Required

### 1. TECHNICAL_STANDARDS.md
Add new section:
```markdown
## TypeScript Standards

### Migration Strategy
- All new files MUST be TypeScript (.ts/.tsx)
- Existing files should add `// @ts-check` during any modification
- Critical services must be converted to TypeScript

### Type Safety Requirements
- No `any` types without explicit justification
- All function parameters must be typed
- Return types should be explicit for public APIs
- Use interface over type for object shapes

### File Organization
- Type definitions in `/types` directory
- Component types co-located with components
- Shared types in `types/common.d.ts`
```

### 2. CLAUDE.md
Add to development section:
```markdown
## 🔧 TypeScript Usage
- Run `npm run typecheck` before committing
- Add `// @ts-check` to modified JS files
- New files MUST be TypeScript
- Type errors block deployment via deploy-all.sh
```

### 3. Build Scripts
Update `scripts/deploy-all.sh`:
- Add type checking step
- Add method validation step
- Fail deployment on type errors

## Validation and Testing

### Pre-commit checks
```json
// package.json scripts
{
  "precommit": "npm run typecheck && npm run check:methods",
  "prepush": "npm run check:all"
}
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Type Check
  run: npm run typecheck
  
- name: Method Validation
  run: npm run check:methods
```

## Common Issues and Solutions

### Issue: JSX in .ts files
**Solution:** Rename to .tsx for files with JSX

### Issue: Module resolution errors
**Solution:** Update tsconfig.json paths or use correct imports

### Issue: Third-party library types
**Solution:** Install @types packages or create declarations

### Issue: Gradual migration conflicts
**Solution:** Use `allowJs: true` and migrate incrementally

## Success Metrics
- Zero undefined method runtime errors
- 50% reduction in production bugs
- Improved developer onboarding time
- Faster refactoring with confidence

## Timeline
- Week 1: Add @ts-check to all critical files
- Week 2: Convert services to TypeScript
- Week 3: Convert stores and utilities
- Week 4+: Gradual component migration

## Notes for Future Development
- Consider strict mode after 50% migration
- Add ESLint TypeScript rules
- Consider using Zod for runtime validation
- Document type patterns in team wiki