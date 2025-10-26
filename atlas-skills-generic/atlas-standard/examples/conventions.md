# Project Conventions - Example Template

Copy this to `.atlas/conventions.md` and customize for your project.

## State Management

### Pattern: [Redux/Zustand/Context/etc.]

**Reading state:**
```javascript
// Example with Redux
const user = useSelector(state => state.user)

// Example with Zustand
const user = useStore(state => state.user)

// Example with Context
const { user } = useAppContext()
```

**Updating state:**
```javascript
// Example with Redux
dispatch(updateUser({ name: 'New Name' }))

// Example with Zustand
useStore.getState().updateUser({ name: 'New Name' })

// Example with Context
setUser(prev => ({ ...prev, name: 'New Name' }))
```

**Rules:**
- Always use immutable updates
- Use selectors for derived state
- Keep state normalized
- Avoid deep nesting

## Naming Conventions

### Files
- Components: `PascalCase.jsx` (e.g., `UserProfile.jsx`)
- Utilities: `camelCase.js` (e.g., `apiHelpers.js`)
- Constants: `UPPER_SNAKE_CASE.js` (e.g., `API_CONSTANTS.js`)
- Tests: `ComponentName.test.js` or `utilityName.test.js`

### Variables
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- Functions: `camelCase` (e.g., `fetchUserData`)
- Classes: `PascalCase` (e.g., `UserService`)
- Private: `_prefixed` (e.g., `_internalHelper`)

### Components
- React components: `PascalCase` (e.g., `UserProfile`)
- Props: `camelCase` (e.g., `userName`, `onSubmit`)
- Event handlers: `handle*` (e.g., `handleClick`, `handleSubmit`)

## Code Quality Standards

### Required
- No `console.log` in production code
- All functions must have JSDoc comments
- Minimum 80% test coverage
- All exports must be documented

### Encouraged
- Pure functions where possible
- Small, focused functions (< 50 lines)
- Composition over inheritance
- Defensive programming (validate inputs)

### Forbidden
- `eval()` or similar dynamic code execution
- Direct DOM manipulation in React
- Hardcoded URLs or secrets
- `any` type in TypeScript (use `unknown` instead)

## Testing Standards

### File Organization
```
src/
  components/
    UserProfile.jsx
    UserProfile.test.js
  utils/
    apiHelpers.js
    apiHelpers.test.js
```

### Test Naming
```javascript
describe('ComponentName', () => {
  it('should render correctly', () => {})
  it('should handle click events', () => {})
  it('should display error states', () => {})
})

describe('functionName', () => {
  it('should return expected value for valid input', () => {})
  it('should throw error for invalid input', () => {})
  it('should handle edge cases', () => {})
})
```

### Coverage Requirements
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Error Handling

### Pattern
```javascript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  // Log for debugging (dev only)
  if (process.env.NODE_ENV === 'development') {
    console.error('Operation failed:', error)
  }

  // Use logger in production
  logger.error('Operation failed', { error, context })

  // Throw user-friendly error
  throw new AppError('User-friendly message', error)
}
```

### Custom Error Classes
```javascript
class AppError extends Error {
  constructor(message, originalError, statusCode) {
    super(message)
    this.name = 'AppError'
    this.originalError = originalError
    this.statusCode = statusCode
  }
}
```

## API Conventions

### Request Format
```javascript
// Use consistent structure
const response = await apiClient.get('/users', {
  params: { page: 1, limit: 10 },
  headers: { Authorization: `Bearer ${token}` }
})
```

### Response Format
```javascript
// Standardized response structure
{
  data: {},      // Response payload
  error: null,   // Error details if failed
  meta: {        // Metadata
    page: 1,
    total: 100
  }
}
```

### Error Handling
```javascript
// Consistent error handling
const handleApiError = (error) => {
  const message = error.response?.data?.message || 'Unknown error'
  const status = error.response?.status || 500

  return {
    type: 'API_ERROR',
    message,
    status,
    originalError: error
  }
}
```

## Platform Rules (if multi-platform)

### Web
- Support: Chrome, Firefox, Safari (latest 2 versions)
- IE11: Not supported
- Mobile browsers: iOS Safari, Chrome Mobile
- Use feature detection, not browser detection

### Mobile
- iOS: 14+
- Android: 10+ (API level 29+)
- React Native: Latest stable version
- Test on both physical devices and simulators

### Desktop
- Electron: Latest stable
- Node.js: LTS versions only
- OS: Windows 10+, macOS 11+, Ubuntu 20.04+

## Security Standards

### Authentication
- Use JWT tokens with refresh mechanism
- Store tokens in httpOnly cookies (web)
- Never store tokens in localStorage
- Implement CSRF protection

### Data Validation
- Validate all user input
- Sanitize before display
- Use schema validation (Zod, Yup, etc.)
- Never trust client data

### Secrets Management
- Use environment variables
- Never commit secrets to git
- Use secret management service (production)
- Rotate secrets regularly

## Documentation

### Required Documentation
- README.md - Project overview and setup
- CHANGELOG.md - Version history
- API.md - API documentation (if applicable)
- ARCHITECTURE.md - System architecture

### Code Comments
```javascript
/**
 * Fetches user data from the API
 * @param {string} userId - The user ID to fetch
 * @returns {Promise<User>} The user object
 * @throws {AppError} If user not found or network error
 */
async function fetchUser(userId) {
  // Implementation
}
```

### Component Documentation
```javascript
/**
 * UserProfile component displays user information
 *
 * @component
 * @param {Object} props - Component props
 * @param {User} props.user - User object to display
 * @param {Function} props.onEdit - Callback when edit button clicked
 * @example
 * <UserProfile user={user} onEdit={handleEdit} />
 */
```

## Git Conventions

### Branch Naming
- Feature: `feature/description`
- Bug fix: `bugfix/description`
- Hotfix: `hotfix/description`
- Release: `release/v1.2.3`

### Commit Messages
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example:**
```
feat(auth): add password reset functionality

- Add password reset form
- Implement email sending
- Add reset token validation

Closes #123
```

## Performance

### Guidelines
- Lazy load routes and large components
- Memoize expensive calculations
- Optimize images (WebP, compression)
- Code split by route
- Use CDN for static assets

### Budgets
- Initial load: < 3s on 3G
- Time to interactive: < 5s
- Bundle size: < 500KB (gzipped)
- API response: < 200ms (p95)

### Monitoring
- Use performance monitoring (e.g., Lighthouse)
- Track Core Web Vitals
- Monitor bundle size on each build
- Profile React renders (development)

---

## Customization Notes

**Adapt this template to your project:**
1. Replace examples with your actual patterns
2. Add project-specific sections
3. Remove irrelevant sections
4. Keep it up to date as conventions evolve
5. Link to examples in your codebase

**Keep it practical:**
- Show real code examples from your project
- Link to specific files as references
- Explain the "why" behind conventions
- Make it searchable (use clear headings)
