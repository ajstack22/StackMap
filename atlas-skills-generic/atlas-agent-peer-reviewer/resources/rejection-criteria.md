# Peer Review: Automatic Rejection Criteria

This document lists all violations that result in immediate **REJECTED** verdict without further review.

## Build & Tests (Automatic Rejection)

### Build Failures
- ❌ Build fails (`npm run build` or equivalent)
- ❌ TypeScript/Flow compilation errors (if applicable)
- ❌ Bundler errors (Webpack, Rollup, etc.)
- ❌ Platform-specific build failures (if multi-platform)

**Verification:**
```bash
npm run build
npm run typecheck  # If TypeScript/Flow
```

### Test Failures
- ❌ Any unit test fails (`npm test`)
- ❌ Integration tests fail
- ❌ End-to-end tests fail
- ❌ Type checking fails (if applicable)
- ❌ Linting errors (not warnings)
- ❌ Tests skipped without documented reason

**Verification:**
```bash
npm test
npm run typecheck  # If applicable
npm run lint
```

### Test Quality Issues
- ❌ Tests pass but don't actually test the feature
- ❌ Tests hardcoded to pass (fake tests)
- ❌ Flaky tests (pass sometimes, fail sometimes)
- ❌ Tests that don't run (incorrect file paths, imports)

## Generic Architectural Violations

### Code Organization (Critical)
- ❌ **Business logic in presentation layer**
  - Logic should be in services/utilities, not UI components

- ❌ **Circular dependencies between modules**
  - Module A imports B, B imports A

- ❌ **Violation of separation of concerns**
  - Mixed responsibilities in single module

**Verification:**
```bash
# Check for circular dependencies
npm run lint  # Many linters detect this

# Or use madge
npx madge --circular src/
```

### State Management (Critical)
**Load patterns from `.atlas/conventions.md`**

Common violations:
- ❌ Direct state mutation (if using immutable patterns)
- ❌ Improper use of state management library
- ❌ State management pattern not followed

**Example (Redux):**
```javascript
// ❌ Wrong: Direct state mutation
state.users.push(newUser)

// ✅ Correct: Immutable update
return { ...state, users: [...state.users, newUser] }
```

**Example (React Context):**
```javascript
// ❌ Wrong: No memoization causing re-renders
<Provider value={{ state, setState }}>

// ✅ Correct: Memoized value
const value = useMemo(() => ({ state, setState }), [state])
<Provider value={value}>
```

### Naming Conventions (Critical)
**Load conventions from `.atlas/conventions.md`**

Common violations:
- ❌ Inconsistent naming (camelCase vs snake_case)
- ❌ Non-descriptive names (a, tmp, data)
- ❌ Misleading names (function doesn't do what name suggests)

**Verification:**
```bash
# Check for inconsistent naming (example)
grep -rn "function [A-Z]" src/  # If functions should be camelCase
grep -rn "const [a-z].*=" src/ | grep "[A-Z]" # If constants should be UPPER_CASE
```

## Production Safety Violations

### Debug Code (Critical)
- ❌ **Unwrapped debug statements**
  - `console.log`, `console.debug`, etc. without dev checks
  - Debugger statements
  - Development-only code in production paths

**Verification:**
```bash
# Check for unwrapped console statements
grep -rn "console\.\(log\|debug\|info\)" src/ | grep -v "if.*dev\|if.*debug"

# Check for debugger statements
grep -rn "debugger" src/
```

**Wrong:**
```javascript
console.log('User data:', userData)
console.debug('Processing:', data)
debugger
```

**Correct:**
```javascript
// Wrapped in environment check
if (process.env.NODE_ENV === 'development') {
  console.log('User data:', userData)
}

// Or use proper logging library
logger.debug('Processing:', data)  // Automatically disabled in prod

// Removed entirely (preferred for console statements)
// (no debugging code)
```

### Error Handling (Critical)
- ❌ **Uncaught exceptions in critical paths**
- ❌ **Silent error swallowing** (empty catch blocks)
- ❌ **Missing error boundaries** (if React/similar)
- ❌ **No fallback for error states**

**Wrong:**
```javascript
// Uncaught exception
const data = JSON.parse(response)  // Can throw

// Silent swallowing
try {
  await criticalOperation()
} catch (error) {
  // Ignore
}

// No error boundary
<NewComponent />  // Can crash entire app
```

**Correct:**
```javascript
// Proper error handling
try {
  const data = JSON.parse(response)
} catch (error) {
  logger.error('Parse error:', error)
  return defaultData
}

// Logged and handled
try {
  await criticalOperation()
} catch (error) {
  logger.error('Operation failed:', error)
  showErrorMessage('Operation failed. Please try again.')
}

// Error boundary
<ErrorBoundary fallback={<ErrorDisplay />}>
  <NewComponent />
</ErrorBoundary>
```

### Resource Leaks (Critical)
- ❌ **Event listeners not removed**
- ❌ **Timers not cleared** (setTimeout, setInterval)
- ❌ **Subscriptions not unsubscribed**
- ❌ **File handles not closed**
- ❌ **Database connections not released**

**Wrong:**
```javascript
// Event listener leak
window.addEventListener('resize', handleResize)
// Missing cleanup!

// Timer leak
const interval = setInterval(doSomething, 1000)
// Missing cleanup!

// Subscription leak
observable.subscribe(handleData)
// Missing cleanup!
```

**Correct:**
```javascript
// React useEffect cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])

// Timer cleanup
const interval = setInterval(doSomething, 1000)
return () => clearInterval(interval)

// Subscription cleanup
const subscription = observable.subscribe(handleData)
return () => subscription.unsubscribe()
```

### Infinite Loops (Critical)
- ❌ **Recursive calls without termination condition**
- ❌ **Effect hooks with missing dependencies** causing re-render loop
- ❌ **State updates inside render** causing loop

**Wrong:**
```javascript
// Missing termination
function recursive(data) {
  return recursive(data.child)  // No base case!
}

// Re-render loop (if React)
useEffect(() => {
  setState(state + 1)  // Loop!
})

// State update in render
function Component() {
  setState(value)  // Loop!
  return <div>...</div>
}
```

**Correct:**
```javascript
// Proper termination
function recursive(data) {
  if (!data.child) return data  // Base case
  return recursive(data.child)
}

// Proper dependencies
useEffect(() => {
  setState(prevState => prevState + 1)
}, [])  // Empty deps = run once

// State update in effect
useEffect(() => {
  setState(value)
}, [dependency])
```

## Security Violations

### Credential Exposure (Critical)
- ❌ **Hardcoded API keys**
- ❌ **Hardcoded passwords**
- ❌ **Hardcoded tokens**
- ❌ **Credentials in git history**
- ❌ **Credentials in error messages or logs**

**Verification:**
```bash
# Check for hardcoded secrets
grep -rni "api[_-]key.*=.*['\"]" src/
grep -rni "password.*=.*['\"]" src/
grep -rni "secret.*=.*['\"]" src/
grep -rni "token.*=.*['\"]" src/

# Check git history
git log -p | grep -i "password\|secret\|api[_-]key"
```

**Wrong:**
```javascript
const API_KEY = "sk_live_abc123xyz"
const password = "mypassword123"
const token = "bearer_token_12345"
```

**Correct:**
```javascript
const API_KEY = process.env.API_KEY
const password = await getSecureValue('password')
const token = await authService.getToken()
```

### Data Exposure (Critical)
- ❌ **Unencrypted sensitive data in storage**
- ❌ **PII (Personally Identifiable Information) in logs**
- ❌ **Sensitive data in URLs**
- ❌ **Sensitive data in error messages**
- ❌ **Sensitive data in analytics**

**Wrong:**
```javascript
// Unencrypted sensitive data
localStorage.setItem('ssn', user.ssn)

// PII in logs
console.log('User SSN:', user.ssn)
logger.info('Processing payment for', user.email)

// Sensitive data in URL
fetch(`/api/users?ssn=${user.ssn}&creditCard=${card}`)

// Sensitive data in error
throw new Error(`Invalid password: ${password}`)
```

**Correct:**
```javascript
// Encrypted storage (or secure storage API)
await secureStorage.setItem('ssn', encrypt(user.ssn))

// No PII in logs
logger.info('Processing payment for user:', user.id)

// Sensitive data in request body
fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ ssn: user.ssn })
})

// Generic error without data
throw new Error('Invalid password format')
```

### Injection Vulnerabilities (Critical)
- ❌ **SQL injection** (unsanitized input in queries)
- ❌ **XSS vulnerabilities** (unsanitized HTML rendering)
- ❌ **Command injection** (unsanitized input in shell commands)
- ❌ **NoSQL injection** (unsanitized input in NoSQL queries)

**Wrong:**
```javascript
// SQL injection
const query = `SELECT * FROM users WHERE name = '${userName}'`
db.query(query)

// XSS vulnerability
element.innerHTML = userInput
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// Command injection
exec(`rm -rf ${userPath}`)

// NoSQL injection
db.collection('users').find({ username: req.body.username })
```

**Correct:**
```javascript
// Parameterized query
const query = 'SELECT * FROM users WHERE name = ?'
db.query(query, [userName])

// Sanitized HTML
import DOMPurify from 'dompurify'
element.innerHTML = DOMPurify.sanitize(userInput)

// Input validation
const safePath = path.normalize(userPath)
if (!safePath.startsWith(SAFE_DIR)) {
  throw new Error('Invalid path')
}

// Sanitized NoSQL query
db.collection('users').find({
  username: sanitize(req.body.username)
})
```

### Authentication & Authorization (Critical)
- ❌ **Missing authentication checks**
- ❌ **Missing authorization checks**
- ❌ **Client-side only auth** (must verify server-side)
- ❌ **Tokens stored insecurely**
- ❌ **Weak authentication mechanisms**

**Wrong:**
```javascript
// No auth check
function deleteUser(userId) {
  return api.delete(`/users/${userId}`)  // Anyone can delete!
}

// Client-side only (bypassable)
if (user.role === 'admin') {
  showAdminPanel()
}

// Insecure token storage
localStorage.setItem('token', authToken)  // XSS vulnerable

// Weak auth
if (password === 'admin') {  // Weak check
  login()
}
```

**Correct:**
```javascript
// Proper auth check
async function deleteUser(userId) {
  if (!isAuthenticated()) {
    throw new UnauthorizedError()
  }
  if (!canDelete(userId)) {
    throw new ForbiddenError()
  }
  return api.delete(`/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
}

// Server-side verification
async function showAdminPanel() {
  const hasAccess = await api.verifyAdminAccess()
  if (hasAccess) showPanel()
}

// Secure token storage
await secureStorage.setItem('token', authToken)

// Proper auth
await authService.login(email, password)  // Server verifies
```

## Data Integrity Violations

### Null Safety (Critical)
- ❌ **Missing null/undefined checks** in critical paths
- ❌ **No fallbacks** for missing data
- ❌ **Accessing nested properties** without safety checks
- ❌ **Array access without bounds checking**

**Wrong:**
```javascript
// Can crash if user is null
const name = user.profile.name

// Can crash if array is empty
const first = items[0].value

// Can crash if data is undefined
<Image src={data.imageUrl} />
```

**Correct:**
```javascript
// Safe access with optional chaining
const name = user?.profile?.name || 'Unknown'

// Safe array access
const first = items?.[0]?.value
if (!first) return null

// Safe rendering with fallback
const imageUrl = data?.imageUrl || DEFAULT_IMAGE
<Image src={imageUrl} />
```

### Data Migration (Critical)
- ❌ **Breaking changes without migration path**
- ❌ **No fallbacks for legacy data**
- ❌ **Data loss during migration**
- ❌ **No rollback strategy**

**Wrong:**
```javascript
// Breaking change: Old data has "user_name", new code expects "userName"
const name = data.userName  // Breaks for old data!
```

**Correct:**
```javascript
// Migration with fallback
const name = data.userName || data.user_name || 'Unknown'

// Explicit migration
function migrateData(data) {
  if (data.user_name && !data.userName) {
    data.userName = data.user_name
    delete data.user_name
  }
  return data
}
```

### State Consistency (Critical)
- ❌ **Partial state updates** (non-atomic updates)
- ❌ **Race conditions** in state updates
- ❌ **Stale closures** in async code
- ❌ **Inconsistent state across stores**

**Wrong:**
```javascript
// Partial update (not atomic)
setState({ ...state, name: newName })
// ... other code ...
setState({ ...state, email: newEmail })  // Lost name change!

// Race condition
async function updateData() {
  const data = getData()
  await api.update(data)
  setData(data)  // Stale if another update happened!
}

// Stale closure
const handleClick = () => {
  setTimeout(() => {
    console.log(count)  // Stale value
  }, 1000)
}
```

**Correct:**
```javascript
// Atomic update
setState(prevState => ({
  ...prevState,
  name: newName,
  email: newEmail
}))

// Race condition prevention
async function updateData() {
  const data = getData()
  const updated = await api.update(data)
  setData(updated)  // Use server response
}

// Fresh value
const handleClick = () => {
  setTimeout(() => {
    console.log(count)  // Still stale
  }, 1000)
}
// Better: Use ref or latest state
```

## Documentation & Evidence Violations

### Missing Evidence (Critical)
- ❌ **Can't verify completion** with command/test
- ❌ **No before/after screenshots** for UI changes
- ❌ **No command output** for bug fixes
- ❌ **Claims without proof**
- ❌ **No performance measurements** for optimization claims

**Examples of unverifiable claims:**
- "Fixed the bug" (which bug? how verified?)
- "Improved performance" (how much? measurements?)
- "Follows conventions" (which ones? how verified?)
- "Tested on all browsers" (which browsers? screenshots?)

**Required evidence:**
```bash
# Bug fix: Show before/after behavior
npm test  # Show test passing
grep "bugfix" src/  # Show fix location

# Performance: Show measurements
npm run benchmark  # Before: 450ms, After: 85ms

# UI change: Provide screenshots
# Before: [screenshot]
# After: [screenshot]
```

### Missing Documentation (Critical for breaking changes)
- ❌ **Breaking changes without documentation update**
- ❌ **New public APIs without usage examples**
- ❌ **Configuration changes without docs update**
- ❌ **Changelog not updated** (if required)
- ❌ **Migration guide missing** (for breaking changes)

**Wrong:**
```
PR: "Changed API endpoint from /v1 to /v2"
Documentation: (no updates)
CHANGELOG.md: (no updates)
```

**Correct:**
```
PR: "Changed API endpoint from /v1 to /v2"

Documentation:
- Updated /docs/api/README.md with new endpoints
- Added CHANGELOG.md entry with migration instructions
- Added deprecation warning to old endpoint
- Updated code examples in docs

Migration Guide:
1. Update endpoint URLs from /v1 to /v2
2. Update response handler (new format)
3. Test with new endpoint
4. Old endpoint deprecated, will be removed in v3.0
```

### Incomplete Implementation (Critical)
- ❌ **TODO comments without timeline**
- ❌ **Disabled tests without explanation**
- ❌ **Feature flags without completion plan**
- ❌ **Commented out code without explanation**
- ❌ **Placeholder implementations**

**Wrong:**
```javascript
// TODO: Handle error case
// TODO: Add tests
// TODO: Optimize performance

test.skip('should handle errors', () => {
  // Test disabled
})

// const oldImplementation = () => { ... }
// Leaving this here for reference
```

**Correct:**
```javascript
// TODO(2025-12-01): Handle rate limit errors when API supports it
// See issue #123 for API error code specification

test('should handle errors', () => {
  // Full implementation
  expect(handleError(new Error('test'))).toBe('Error handled')
})

// Removed commented code (use git history if needed)
```

## Performance Violations

### Performance Regressions (Critical)
- ❌ **Slower than before** (without justification)
- ❌ **Memory leaks** detected
- ❌ **Excessive re-renders** (if React/similar)
- ❌ **Blocking main thread** for long operations
- ❌ **Unnecessary network requests**

**Verification:**
```bash
# Profile before/after
npm run benchmark

# Memory profiling
# Use browser dev tools or Node.js profiler

# Check for memory leaks
# Monitor memory usage over time
```

**Wrong:**
```javascript
// Re-renders entire list on every change
function ListView() {
  const store = useStore()  // All state!
  return store.items.map(item => <Item {...item} />)
}

// Blocking operation in render
function Component() {
  const result = expensiveCalculation(data)  // Every render!
  return <div>{result}</div>
}

// Unnecessary requests
function Component() {
  useEffect(() => {
    fetch('/api/data')  // On every render!
  })
}
```

**Correct:**
```javascript
// Only re-renders when items change
function ListView() {
  const items = useStore(state => state.items)
  return items.map(item => <Item key={item.id} {...item} />)
}

// Memoized calculation
function Component() {
  const result = useMemo(() => expensiveCalculation(data), [data])
  return <div>{result}</div>
}

// Request only when needed
function Component() {
  useEffect(() => {
    fetch('/api/data')
  }, [])  // Only once
}
```

### Algorithmic Inefficiency (Critical)
- ❌ **O(n²) when O(n) possible**
- ❌ **Unnecessary array/object copies**
- ❌ **Redundant calculations**
- ❌ **No caching for expensive operations**

**Wrong:**
```javascript
// O(n²) nested loops
for (const user of users) {
  for (const post of posts) {
    if (post.userId === user.id) {
      // ...
    }
  }
}

// Unnecessary copies
const result = [...items].filter(...).map(...).sort(...)

// Redundant calculation
function Component() {
  const total = items.reduce((sum, item) => sum + item.price, 0)
  const average = items.reduce((sum, item) => sum + item.price, 0) / items.length
}
```

**Correct:**
```javascript
// O(n) with Map
const userMap = new Map(users.map(u => [u.id, u]))
for (const post of posts) {
  const user = userMap.get(post.userId)
  // ...
}

// Single iteration
const result = items
  .filter(...)
  .map(...)
  .sort(...)  // No unnecessary spread

// Single calculation
function Component() {
  const total = useMemo(() =>
    items.reduce((sum, item) => sum + item.price, 0),
    [items]
  )
  const average = total / items.length
}
```

## Platform-Specific Violations

**Load from `.atlas/rejection-criteria.md` if your project has platform-specific rules**

### Multi-Platform Projects
- ❌ **Platform-specific APIs in shared code**
- ❌ **No platform-specific fallbacks**
- ❌ **Untested on all target platforms**

### Web Projects
- ❌ **Missing accessibility attributes**
- ❌ **No keyboard navigation**
- ❌ **Poor mobile responsiveness**

### Mobile Projects
- ❌ **Large bundle size** (affects startup time)
- ❌ **Battery-draining operations** (constant GPS, etc.)
- ❌ **No offline support** (where appropriate)

## Project-Specific Violations

**Load from `.atlas/rejection-criteria.md`**

This section should contain violations specific to your project:
- Custom architectural patterns
- Domain-specific rules
- Technology-specific issues
- Team conventions

Example:
```markdown
## Your Project Violations

### API Design
- ❌ REST endpoints not RESTful
- ❌ Missing API versioning
- ❌ No rate limiting on public endpoints

### Database
- ❌ Queries without indexes
- ❌ N+1 query problems
- ❌ Missing database migrations
```

## Summary: Instant Rejection Checklist

Use this checklist during review. ANY ❌ = REJECTED.

### Automatic Failures
- [ ] ❌ Build fails
- [ ] ❌ Tests fail
- [ ] ❌ Type checking fails (if applicable)
- [ ] ❌ Linting errors (not warnings)

### Generic Architecture
- [ ] ❌ Circular dependencies
- [ ] ❌ Business logic in wrong layer
- [ ] ❌ State management pattern violated
- [ ] ❌ Naming conventions violated

### Production Safety
- [ ] ❌ Unwrapped debug statements
- [ ] ❌ Uncaught exceptions
- [ ] ❌ Resource leaks (listeners, timers)
- [ ] ❌ Infinite loops or recursion

### Security
- [ ] ❌ Hardcoded credentials
- [ ] ❌ Unencrypted sensitive data
- [ ] ❌ Missing authentication/authorization
- [ ] ❌ Injection vulnerabilities

### Data Integrity
- [ ] ❌ Missing null checks
- [ ] ❌ Breaking changes without migration
- [ ] ❌ No fallbacks for missing data
- [ ] ❌ Partial state updates (not atomic)

### Documentation & Evidence
- [ ] ❌ Can't verify completion
- [ ] ❌ Breaking changes without docs
- [ ] ❌ Changelog not updated
- [ ] ❌ Incomplete implementation (TODOs)

### Performance
- [ ] ❌ Performance regression
- [ ] ❌ Memory leaks
- [ ] ❌ Algorithmic inefficiency
- [ ] ❌ Unnecessary operations

### Project-Specific (load from `.atlas/rejection-criteria.md`)
- [ ] ❌ [Your custom rejection criteria]

If ALL boxes are clear (no ❌), proceed with full review.
If ANY ❌ is checked, issue REJECTED verdict immediately.
