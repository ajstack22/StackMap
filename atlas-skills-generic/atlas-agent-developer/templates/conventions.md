# Project Conventions Template

Copy this file to `.atlas/conventions.md` in your project and customize for your needs.

---

# Project Conventions

## State Management

**Primary approach:**
- [Describe your state management solution: Redux, MobX, Context API, Zustand, etc.]

**Rules:**
- [Rule 1: e.g., "Use Redux for global application state"]
- [Rule 2: e.g., "Use Context API for theme and authentication"]
- [Rule 3: e.g., "Use local state (useState) for UI-only state"]

**Examples:**
```javascript
// Global state (Redux)
const users = useSelector(state => state.users)
dispatch(fetchUsers())

// Theme/auth (Context)
const { theme, setTheme } = useTheme()

// UI-only (local)
const [isOpen, setIsOpen] = useState(false)
```

## Naming Standards

**Components:**
- Format: PascalCase
- Example: `UserProfile`, `NavigationBar`, `LoginForm`

**Hooks:**
- Format: camelCase with `use` prefix
- Example: `useAuth`, `useDebounce`, `useLocalStorage`

**Utilities/Functions:**
- Format: camelCase
- Example: `formatDate`, `validateEmail`, `parseJSON`

**Constants:**
- Format: UPPER_SNAKE_CASE
- Example: `API_BASE_URL`, `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT`

**Files:**
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Types: PascalCase (e.g., `User.types.ts`)

## File Organization

**Directory structure:**
```
src/
  components/      # Reusable UI components
  features/        # Feature-specific code (grouped by feature)
  hooks/           # Custom React hooks
  utils/           # Utility functions
  types/           # TypeScript type definitions
  config/          # Configuration files
  services/        # API and external services
```

**Rules:**
- Group by feature, not by type (e.g., `features/auth/` not `containers/auth/`)
- Colocate tests with source files (e.g., `Button.test.tsx` next to `Button.tsx`)
- Use index files for public API only
- Keep components under 200 lines
- Keep functions under 50 lines

## Code Style

**General:**
- Use TypeScript for all new files
- Prefer functional components over class components
- Use arrow functions for inline callbacks
- Avoid default exports (use named exports)

**Formatting:**
- Max line length: 100 characters
- Indentation: 2 spaces (not tabs)
- Semicolons: [always | never]
- Quotes: [single | double]

**Comments:**
- Use JSDoc for public functions and components
- Explain WHY, not WHAT (code should be self-documenting)
- No commented-out code (delete it)
- TODOs must include date and issue number: `// TODO(2025-10-20, #123): Description`

## TypeScript

**Rules:**
- Use explicit types for function parameters and return values
- Avoid `any` type (use `unknown` if needed)
- Use interfaces for object shapes
- Use type aliases for unions and primitives
- Export types from `*.types.ts` files

**Examples:**
```typescript
// Function with explicit types
function formatUser(user: User): FormattedUser {
  return { name: user.name, email: user.email }
}

// Interface for object shape
interface User {
  id: string
  name: string
  email: string
}

// Type alias for union
type Status = 'pending' | 'success' | 'error'
```

## Testing

**Coverage requirements:**
- Minimum overall coverage: 80%
- New files must have 90% coverage
- Utilities must have 100% coverage

**Test structure:**
```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should expected behavior', () => {
      // Test implementation
    })
  })
})
```

**What to test:**
- Happy path (normal usage)
- Edge cases (null, undefined, empty, large data)
- Error cases (invalid input, network errors)
- User interactions (clicks, typing, navigation)

**Mocking:**
- Mock external dependencies (API calls, timers, etc.)
- Don't mock internal functions (test real behavior)
- Use factories for test data

## Imports

**Order:**
```javascript
// 1. External dependencies
import React from 'react'
import { useQuery } from 'react-query'

// 2. Internal absolute imports
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'

// 3. Relative imports (same directory)
import { Helper } from './Helper'
import styles from './Component.module.css'

// 4. Types
import type { User } from '@/types/User'
```

**Rules:**
- Prefer absolute imports over relative (use `@/` alias)
- Relative imports only for same directory
- No deep relative imports (max 2 levels: `../../`)
- Group by type (external, internal, relative, types)

## Error Handling

**User-facing errors:**
```typescript
try {
  await fetchData()
} catch (error) {
  // Show user-friendly message
  showErrorToast('Failed to load data. Please try again.')

  // Log for debugging (dev only)
  if (__DEV__) {
    console.error('Fetch failed:', error)
  }
}
```

**Internal errors:**
```typescript
function processData(data: Data): Result {
  if (!data) {
    throw new Error('Data is required')
  }
  // Process data
}
```

**Production logging:**
```typescript
// ❌ WRONG: Unwrapped console.log
console.log('User data:', userData)

// ✅ CORRECT: Wrapped in dev check
if (__DEV__) {
  console.log('User data:', userData)
}

// ✅ CORRECT: Removed entirely (preferred)
// (no logging)
```

## Performance

**Optimization rules:**
- Use `useMemo` for expensive computations
- Use `useCallback` for callbacks passed to children
- Use `React.memo` for expensive components
- Virtualize long lists (use `react-window` or similar)
- Lazy load routes and heavy components

**Avoid:**
- Inline object/array literals in render (causes re-renders)
- Anonymous functions in render (use `useCallback`)
- Large bundles (code split by route)

## Accessibility

**Requirements:**
- All interactive elements must be keyboard accessible
- Use semantic HTML (button, nav, main, etc.)
- Images must have alt text
- Forms must have labels
- Maintain color contrast ratio (WCAG AA minimum)

**Examples:**
```jsx
// ✅ CORRECT: Semantic HTML + accessibility
<button onClick={handleClick}>
  Click me
</button>

// ❌ WRONG: div as button
<div onClick={handleClick}>
  Click me
</div>
```

## Security

**Rules:**
- Never commit secrets (use environment variables)
- Sanitize user input before rendering
- Use HTTPS for all API calls
- Validate data from external sources
- Use CSP headers (web)

**Sensitive data:**
- Never log passwords, tokens, or PII
- Don't store tokens in localStorage (use httpOnly cookies)
- Mask sensitive data in UI

## Git Workflow

**Branch naming:**
- Feature: `feature/short-description`
- Bug fix: `fix/short-description`
- Refactor: `refactor/short-description`

**Commit messages:**
- Format: `type: description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Examples:
  - `feat: add user profile page`
  - `fix: resolve null pointer in login form`
  - `refactor: extract API calls to service`

**Pull requests:**
- Include description of what changed
- Include verification steps
- Include screenshots (if UI change)
- Link to related issues
- Must pass CI/CD checks

## Documentation

**When to document:**
- All public functions and components (JSDoc)
- Complex algorithms (inline comments)
- Non-obvious decisions (inline comments)
- Setup and configuration (README)
- Breaking changes (CHANGELOG)

**When NOT to document:**
- Obvious code (let code speak for itself)
- Temporary code (just mark with TODO)
- Internal implementation details

---

## Custom Grep Tests

Document verification commands in `.atlas/verification.md` (see template).
