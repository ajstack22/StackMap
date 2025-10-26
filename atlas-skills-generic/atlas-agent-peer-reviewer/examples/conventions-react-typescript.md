# Project Coding Conventions - React + TypeScript

This is an example conventions file for a React + TypeScript project.

## Naming Conventions

### Files
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Hooks: camelCase with "use" prefix (e.g., `useAuth.ts`)
- Types: PascalCase (e.g., `UserTypes.ts`)
- Tests: Same as source file with `.test` suffix (e.g., `UserProfile.test.tsx`)

### Code
- Functions: camelCase (e.g., `getUserData`)
- Components: PascalCase (e.g., `UserProfile`)
- Classes: PascalCase (e.g., `UserService`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- Interfaces: PascalCase with "I" prefix optional (e.g., `User` or `IUser`)
- Types: PascalCase (e.g., `UserRole`)
- Enums: PascalCase for enum, UPPER_SNAKE_CASE for values

## TypeScript

### Type Safety
- No `any` types (use `unknown` if type is truly unknown)
- Use strict mode (`strict: true` in tsconfig.json)
- Prefer interfaces for object shapes
- Prefer types for unions and intersections
- Use generics for reusable components

### Type Definitions
```typescript
// ✅ Good: Explicit types
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<User> {
  return api.get(`/users/${id}`)
}

// ❌ Bad: Any types
function getUser(id: any): any {
  return api.get(`/users/${id}`)
}
```

## React Patterns

### Components
- Use functional components (not class components)
- Use hooks (not HOCs or render props)
- Max component length: 200 lines (split if larger)
- Extract complex logic into custom hooks

### Component Structure
```typescript
// Order:
// 1. Imports
// 2. Types/Interfaces
// 3. Component
// 4. Styled components (if using styled-components)

import { useState, useEffect } from 'react'
import { UserService } from '@/services/userService'

interface UserProfileProps {
  userId: string
}

export function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Effect logic
  }, [userId])

  return (
    // JSX
  )
}
```

### Hooks
- Custom hooks start with "use"
- Return arrays for simple values (like useState)
- Return objects for multiple values
- Document hook purpose with JSDoc

```typescript
// ✅ Good: Custom hook
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Fetch logic
  }, [userId])

  return { user, loading, error }
}

// ❌ Bad: Logic in component
function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // ... complex logic here ...
}
```

### Props
- Use destructuring
- Use default values where appropriate
- Document complex props with JSDoc
- Use TypeScript interfaces (not PropTypes)

```typescript
// ✅ Good: Typed props with defaults
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

function Button({
  label,
  onClick,
  variant = 'primary',
  disabled = false
}: ButtonProps) {
  // Component logic
}
```

## State Management (Redux)

### Actions
- Use action creators (not plain objects)
- Use Redux Toolkit's `createSlice`
- Action types as constants
- Use TypeScript for action typing

```typescript
// ✅ Good: Redux Toolkit slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const userSlice = createSlice({
  name: 'user',
  initialState: { user: null as User | null },
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
  },
})

// ❌ Bad: Manual action types
const SET_USER = 'SET_USER'
function setUser(user: any) {
  return { type: SET_USER, payload: user }
}
```

### Selectors
- Use reselect for memoization
- Keep selectors simple (single responsibility)
- Co-locate selectors with slice

```typescript
// ✅ Good: Memoized selector
import { createSelector } from '@reduxjs/toolkit'

const selectUser = (state: RootState) => state.user.user
const selectUserName = createSelector(
  [selectUser],
  (user) => user?.name ?? 'Unknown'
)
```

## Error Handling

### Async Functions
- Always use try/catch
- Log errors with context
- Show user-friendly messages
- Use typed errors

```typescript
// ✅ Good: Proper error handling
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`)
    return response.data
  } catch (error) {
    logger.error('Failed to fetch user', { id, error })
    throw new UserFetchError(`Failed to fetch user ${id}`, error)
  }
}

// ❌ Bad: No error handling
async function fetchUser(id: string): Promise<User> {
  const response = await api.get(`/users/${id}`)
  return response.data
}
```

### Error Boundaries
- Wrap features in error boundaries
- Provide fallback UI
- Log errors to monitoring service

```typescript
// ✅ Good: Error boundary with fallback
<ErrorBoundary fallback={<ErrorDisplay />}>
  <UserProfile userId={userId} />
</ErrorBoundary>
```

## Testing

### Test Organization
- Test file next to source file (e.g., `UserProfile.test.tsx`)
- Use describe/test blocks
- Use descriptive test names
- Follow Arrange-Act-Assert pattern

### Test Coverage
- Minimum: 80% coverage
- 100% for critical paths (auth, payments, etc.)
- Test happy path + error cases + edge cases

### Test Patterns
```typescript
// ✅ Good: Descriptive test
describe('UserProfile', () => {
  describe('when user exists', () => {
    test('should display user name', () => {
      // Arrange
      const user = { id: '1', name: 'John' }
      render(<UserProfile user={user} />)

      // Act & Assert
      expect(screen.getByText('John')).toBeInTheDocument()
    })
  })

  describe('when user is null', () => {
    test('should display loading state', () => {
      render(<UserProfile user={null} />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })
})

// ❌ Bad: Unclear test
test('user profile', () => {
  render(<UserProfile user={{ id: '1', name: 'John' }} />)
  expect(screen.getByText('John')).toBeInTheDocument()
})
```

### Mocking
- Mock external dependencies (API, localStorage)
- Use jest.mock() for module mocks
- Use jest.fn() for function mocks
- Reset mocks between tests

## Code Organization

### Project Structure
```
src/
├── components/     # React components
├── features/       # Feature-based modules
├── hooks/          # Custom hooks
├── services/       # API and business logic
├── store/          # Redux store and slices
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── __tests__/      # Integration tests
```

### Module Size
- Max function length: 50 lines
- Max file length: 300 lines
- Max component length: 200 lines
- Extract complex logic to utilities

### Imports
- Sort order: React, external libs, internal libs, local files
- Use absolute imports with @ alias
- No unused imports
- Group imports by type

```typescript
// ✅ Good: Organized imports
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
import { fetchUser } from '@/services/userService'

import { selectUser } from './selectors'
import styles from './UserProfile.module.css'
```

## Performance

### React Performance
- Use `React.memo` for expensive components
- Use `useMemo` for expensive calculations
- Use `useCallback` for functions passed to children
- Use virtualization for long lists (react-window)

```typescript
// ✅ Good: Memoized component
const UserCard = React.memo(({ user }: { user: User }) => {
  return <div>{user.name}</div>
})

// ✅ Good: Memoized calculation
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0)
}, [items])

// ✅ Good: Memoized callback
const handleClick = useCallback(() => {
  doSomething(userId)
}, [userId])
```

### Bundle Size
- Lazy load routes and heavy components
- Use code splitting
- Analyze bundle with webpack-bundle-analyzer
- Maximum bundle size: 500KB (without code splitting)

```typescript
// ✅ Good: Lazy loading
const AdminPanel = lazy(() => import('./AdminPanel'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminPanel />
    </Suspense>
  )
}
```

## Accessibility

### Required Attributes
- All images must have `alt` text
- All form inputs must have labels
- All interactive elements must be keyboard accessible
- Use semantic HTML

```typescript
// ✅ Good: Accessible form
<form>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" required />

  <button type="submit">Submit</button>
</form>

// ❌ Bad: No labels, not keyboard accessible
<form>
  <input type="email" placeholder="Email" />
  <div onClick={handleSubmit}>Submit</div>
</form>
```

### ARIA
- Use ARIA labels when text is not visible
- Use ARIA roles for custom components
- Test with screen reader

## Documentation

### Code Comments
- JSDoc for public APIs
- Comments for complex logic (not obvious code)
- Explain WHY, not WHAT

```typescript
// ✅ Good: Explains why
/**
 * Debounces the save operation to prevent excessive API calls.
 * Without debounce, rapid typing causes 50+ API requests per second.
 */
const debouncedSave = useDebouncedCallback(save, 500)

// ❌ Bad: Explains what (obvious from code)
// This function gets the user
function getUser(id: string) { ... }
```

### Project Documentation
- README.md: Setup, architecture, key decisions
- CHANGELOG.md: All user-facing changes
- API.md: API documentation if backend included
- CONTRIBUTING.md: How to contribute

### Commit Messages
- Format: `type(scope): message`
- Types: feat, fix, docs, style, refactor, test, chore
- Scope: Component or feature name
- Message: Imperative mood, lowercase

```bash
# ✅ Good
feat(auth): add password reset functionality
fix(user-profile): handle null user gracefully
docs(readme): update setup instructions

# ❌ Bad
Added feature
fixed bug
Updated stuff
```

## Security

### Authentication
- Store tokens in httpOnly cookies (not localStorage)
- Implement CSRF protection
- Use secure, SameSite cookies
- Validate all auth tokens server-side

### Input Validation
- Sanitize all user input
- Use TypeScript for type safety
- Validate on both client and server
- Use established libraries (DOMPurify, validator.js)

### Dependencies
- Audit dependencies regularly (`npm audit`)
- Keep dependencies up to date
- Review security advisories
- Use Snyk or Dependabot

## Git Workflow

### Branching
- Main branch: `main`
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`
- No direct commits to `main`

### Pull Requests
- One feature per PR
- Link to issue/ticket
- Include screenshots for UI changes
- Request review from at least one person
- Squash commits before merge

### Code Review
- Review within 24 hours
- Check for conventions adherence
- Test locally if possible
- Be constructive and specific

## Tools

### Required
- ESLint for linting
- Prettier for formatting
- TypeScript for type checking
- Jest for testing
- React Testing Library for component tests

### Recommended
- Husky for git hooks
- lint-staged for pre-commit linting
- commitlint for commit message linting
- Storybook for component development

## Enforcement

These conventions are enforced by:
1. ESLint + TypeScript (automated)
2. Prettier (automated)
3. Peer review (manual)
4. Atlas peer-reviewer agent (automated)

Violations of critical conventions will result in PR rejection.
