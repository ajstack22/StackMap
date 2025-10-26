# Peer Review: Automatic Rejection Criteria

This document lists all violations that result in immediate **REJECTED** verdict without further review.

## Build & Tests (Automatic Rejection)

### Build Failures
- ❌ Web build fails (`npm run build`)
- ❌ iOS build fails (`cd ios && pod install && xcodebuild`)
- ❌ Android build fails (`cd android && ./gradlew clean build`)
- ❌ TypeScript compilation errors
- ❌ Babel/Metro bundler errors

**Verification:**
```bash
npm run build
npm run typecheck
cd ios && pod install
cd android && ./gradlean build
```

### Test Failures
- ❌ Any unit test fails (`npm test`)
- ❌ Integration tests fail
- ❌ Type checking fails (`npm run typecheck`)
- ❌ Linting errors (not warnings) (`npm run lint`)
- ❌ Tests skipped without documented reason

**Verification:**
```bash
npm test
npm run typecheck
npm run lint
```

### Test Quality Issues
- ❌ Tests pass but don't actually test the feature
- ❌ Tests hardcoded to pass (fake tests)
- ❌ Flaky tests (pass sometimes, fail sometimes)
- ❌ Tests that don't run (incorrect file paths, imports)

## StackMap Architectural Violations

### Store Usage (Critical)
- ❌ **Direct `useAppStore.setState()` in new code**
  - Must use store-specific methods
  - Exception: Old code being gradually migrated (document in PR)

**Verification:**
```bash
grep -rn "useAppStore.setState" src/
# Should return NOTHING in new code
```

**Wrong:**
```javascript
useAppStore.setState({ users: newUsers })
useAppStore.setState({ settings: newSettings })
```

**Correct:**
```javascript
useUserStore.getState().setUsers(newUsers)
useSettingsStore.getState().updateSettings(newSettings)
useLibraryStore.getState().setLibrary(newLibrary)
useActivityStore.getState().setActivities(newActivities)
```

### Field Naming (Critical)
- ❌ **Legacy field names in new code**
  - `activity.name` → Must use `activity.text`
  - `activity.emoji` → Must use `activity.icon`
  - `user.emoji` → Must use `user.icon`

**Verification:**
```bash
# Check for legacy writes
grep -rn "activity\.name\s*=" src/
grep -rn "activity\.emoji\s*=" src/
grep -rn "user\.emoji\s*=" src/
# Should return NOTHING in new code
```

**Wrong:**
```javascript
activity.name = "Running"
activity.emoji = "🏃"
user.emoji = "👤"
```

**Correct:**
```javascript
activity.text = "Running"
activity.icon = "🏃"
user.icon = "👤"

// Reading with fallbacks (OK)
const text = activity.text || activity.name || activity.title
const icon = activity.icon || activity.emoji
```

### Platform Compatibility (Critical)
- ❌ **Platform-specific APIs in shared code**
  - `Alert.alert()` (web not supported) → Use `ConfirmModal`
  - `NetInfo.fetch()` (causes freezes) → Disabled, assume online
  - `AsyncStorage` in hot paths (iOS freeze) → Must debounce
  - Direct `fontWeight` on Android → Use `Typography` component

**Verification:**
```bash
# Check for Alert usage
grep -rn "Alert\.alert" src/components/ src/services/

# Check for NetInfo usage
grep -rn "NetInfo\." src/

# Check for direct fontWeight
grep -rn "fontWeight" src/ | grep -v "Typography"

# Check for AsyncStorage in hot paths
grep -rn "AsyncStorage" src/ | grep -v "debounce" | grep -v "useEffect"
```

**Wrong:**
```javascript
// Web not supported
Alert.alert('Title', 'Message')

// Causes freezes
const state = await NetInfo.fetch()

// Android incompatible
<Text style={{ fontWeight: 'bold' }}>Hello</Text>

// iOS freezes (not debounced)
await AsyncStorage.setItem('key', value)  // in hot path
```

**Correct:**
```javascript
// Cross-platform modal
<ConfirmModal title="Title" message="Message" />

// Assume online (NetInfo disabled)
const isOnline = true

// Typography handles Android variants
<Typography fontWeight="bold">Hello</Typography>

// Debounced storage (see useAppStore.js)
const debouncedSave = useDebounce(async () => {
  await AsyncStorage.setItem('key', value)
}, 1000)
```

### Accessibility (Critical)
- ❌ **Gray text colors** (must use black #000)
  - No #666, #999, #777, etc.
  - Exception: Truly disabled elements (not just labels)

**Verification:**
```bash
# Check for gray text
grep -rn "color.*['\"]#[6-9a-fA-F]" src/
# Should return NOTHING (or only disabled states)
```

**Wrong:**
```javascript
<Text style={{ color: '#666666' }}>Label</Text>
<Text style={{ color: '#999' }}>Description</Text>
```

**Correct:**
```javascript
<Text style={{ color: '#000000' }}>Label</Text>
<Text style={{ color: '#000' }}>Description</Text>

// Exception: Truly disabled (not just styling)
<Text style={{ color: '#666', opacity: 0.5 }} disabled>Disabled</Text>
```

## Production Safety Violations

### Debug Code (Critical)
- ❌ **Unwrapped `console.log` statements**
  - Must wrap in `__DEV__` check
  - Or remove entirely (preferred)

**Verification:**
```bash
# Check for unwrapped console statements
grep -rn "console\.\(log\|debug\|info\)" src/ | grep -v "__DEV__"
# Should return NOTHING
```

**Wrong:**
```javascript
console.log('User data:', userData)
console.debug('Sync state:', syncState)
```

**Correct:**
```javascript
// Wrapped in dev check
if (__DEV__) {
  console.log('User data:', userData)
}

// Or removed entirely (preferred)
// (no logging)
```

### Error Handling (Critical)
- ❌ **Uncaught exceptions in critical paths**
- ❌ **Silent error swallowing** (empty catch blocks)
- ❌ **Missing error boundaries** for React components
- ❌ **No fallback UI** for error states

**Wrong:**
```javascript
// Uncaught exception
const data = JSON.parse(response)  // Can throw

// Silent swallowing
try {
  await syncData()
} catch (error) {
  // Ignore
}

// No error boundary
<NewFeatureComponent />  // Can crash entire app
```

**Correct:**
```javascript
// Proper error handling
try {
  const data = JSON.parse(response)
} catch (error) {
  console.error('Parse error:', error)
  return defaultData
}

// Logged and handled
try {
  await syncData()
} catch (error) {
  console.error('Sync failed:', error)
  showErrorToUser('Sync failed. Please try again.')
}

// Error boundary
<ErrorBoundary>
  <NewFeatureComponent />
</ErrorBoundary>
```

### Resource Leaks (Critical)
- ❌ **Event listeners not removed**
- ❌ **Timers not cleared** (setTimeout, setInterval)
- ❌ **Subscriptions not unsubscribed**
- ❌ **File handles not closed**

**Wrong:**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    doSomething()
  }, 1000)
  // Missing cleanup!
}, [])

useEffect(() => {
  window.addEventListener('resize', handleResize)
  // Missing cleanup!
}, [])
```

**Correct:**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    doSomething()
  }, 1000)

  return () => clearInterval(interval)  // Cleanup
}, [])

useEffect(() => {
  window.addEventListener('resize', handleResize)

  return () => window.removeEventListener('resize', handleResize)  // Cleanup
}, [])
```

### Infinite Loops (Critical)
- ❌ **Recursive calls without termination condition**
- ❌ **useEffect with missing dependencies** causing re-render loop
- ❌ **State updates inside render** causing loop

**Wrong:**
```javascript
// Missing termination
function recursive(data) {
  return recursive(data.child)  // No base case!
}

// Re-render loop (missing dep)
useEffect(() => {
  setCount(count + 1)  // Loop!
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
  setCount(c => c + 1)
}, [])  // Empty deps = run once

// State update in effect
function Component() {
  useEffect(() => {
    setState(value)
  }, [])
  return <div>...</div>
}
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
grep -rn "api[_-]key" src/ --include="*.js" --include="*.ts"
grep -rn "password\s*=" src/ --include="*.js" --include="*.ts"
grep -rn "token\s*=" src/ --include="*.js" --include="*.ts"
```

**Wrong:**
```javascript
const API_KEY = "sk_live_abc123xyz"
const password = "mypassword123"
fetch(url, { headers: { 'Authorization': 'Bearer hardcoded_token' } })
```

**Correct:**
```javascript
const API_KEY = process.env.REACT_APP_API_KEY
const password = await SecureStore.getItemAsync('password')
fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
```

### Data Exposure (Critical)
- ❌ **Unencrypted sensitive data in storage**
- ❌ **PII in logs or analytics**
- ❌ **User data exposed in URLs**
- ❌ **Sensitive data in error messages**

**Wrong:**
```javascript
// Unencrypted sensitive data
await AsyncStorage.setItem('password', userPassword)

// PII in logs
console.log('User SSN:', user.ssn)

// Sensitive data in URL
fetch(`/api/users?ssn=${user.ssn}`)
```

**Correct:**
```javascript
// Encrypted storage
await SecureStore.setItemAsync('password', userPassword)

// No PII in logs
console.log('User authenticated:', user.id)

// Sensitive data in request body
fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ ssn: user.ssn })
})
```

### Injection Vulnerabilities (Critical)
- ❌ **SQL injection** (unsanitized input in queries)
- ❌ **XSS vulnerabilities** (dangerouslySetInnerHTML with user input)
- ❌ **Command injection** (unsanitized input in shell commands)

**Wrong:**
```javascript
// SQL injection
const query = `SELECT * FROM users WHERE name = '${userName}'`

// XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// Command injection
exec(`rm -rf ${userPath}`)
```

**Correct:**
```javascript
// Parameterized query
const query = 'SELECT * FROM users WHERE name = ?'
db.query(query, [userName])

// Sanitized HTML
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />

// Input validation
const safePath = path.normalize(userPath)
if (!safePath.startsWith('/safe/directory/')) {
  throw new Error('Invalid path')
}
```

### Authentication & Authorization (Critical)
- ❌ **Missing authentication checks**
- ❌ **Missing authorization checks**
- ❌ **Client-side only auth** (must verify server-side)
- ❌ **Tokens stored insecurely**

**Wrong:**
```javascript
// No auth check
function deleteUser(userId) {
  api.delete(`/users/${userId}`)  // Anyone can delete!
}

// Client-side only
if (user.role === 'admin') {
  showAdminPanel()  // Bypassable!
}

// Insecure token storage
localStorage.setItem('token', authToken)  // XSS vulnerable
```

**Correct:**
```javascript
// Auth check required
async function deleteUser(userId) {
  if (!currentUser || currentUser.id !== userId) {
    throw new Error('Unauthorized')
  }
  await api.delete(`/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
}

// Server-side auth
async function showAdminPanel() {
  const canAccess = await api.checkAdminAccess()  // Server verifies
  if (canAccess) showPanel()
}

// Secure token storage
await SecureStore.setItemAsync('token', authToken)
```

## Data Integrity Violations

### Null Safety (Critical)
- ❌ **Missing null/undefined checks** in critical paths
- ❌ **No fallbacks** for missing data
- ❌ **Accessing nested properties** without safety checks

**Wrong:**
```javascript
// Can crash if user is null
const name = user.profile.name

// Can crash if activities is null
const firstActivity = activities[0]

// Can crash if icon is null
<Image source={{ uri: activity.icon }} />
```

**Correct:**
```javascript
// Safe access
const name = user?.profile?.name || 'Unknown'

// Safe array access
const firstActivity = activities?.[0]
if (!firstActivity) return null

// Safe icon with fallback
const icon = activity?.icon || activity?.emoji || '📋'
<Image source={{ uri: icon }} />
```

### Data Migration (Critical)
- ❌ **Breaking changes without migration path**
- ❌ **No fallbacks for legacy data**
- ❌ **Data loss during migration**

**Wrong:**
```javascript
// Breaking change: Old data has "emoji", new code expects "icon"
const icon = activity.icon  // Breaks for old data!
```

**Correct:**
```javascript
// Migration path with fallback
const icon = activity.icon || activity.emoji || '📋'

// Explicit migration
if (activity.emoji && !activity.icon) {
  activity.icon = activity.emoji
  delete activity.emoji
}
```

### State Consistency (Critical)
- ❌ **Partial state updates** (non-atomic updates)
- ❌ **Race conditions** in state updates
- ❌ **Stale closures** in async code

**Wrong:**
```javascript
// Partial update (not atomic)
setUser({ ...user, name: newName })
// ... other code ...
setUser({ ...user, email: newEmail })  // Lost name change!

// Race condition
async function updateUser() {
  const user = getUser()
  await api.update(user)
  setUser(user)  // Stale if another update happened!
}
```

**Correct:**
```javascript
// Atomic update
setUser(prevUser => ({
  ...prevUser,
  name: newName,
  email: newEmail
}))

// Race condition prevention
async function updateUser() {
  const user = getUser()
  const updated = await api.update(user)
  setUser(updated)  // Use server response
}
```

## Documentation & Evidence Violations

### Missing Evidence (Critical)
- ❌ **Can't verify completion** with grep/command
- ❌ **No before/after screenshots** for UI changes
- ❌ **No command output** for bug fixes
- ❌ **Claims without proof**

**Examples of unverifiable claims:**
- "Fixed the bug" (which bug? how?)
- "Improved performance" (how much? measurements?)
- "Follows conventions" (which ones? verified how?)

**Required evidence:**
```bash
# Bug fix: Show before/after behavior
# Feature: Show command output or screenshots
# Refactor: Show tests pass, metrics improved
```

### Missing Documentation (Critical for breaking changes)
- ❌ **Breaking changes without documentation update**
- ❌ **New public APIs without usage examples**
- ❌ **Configuration changes without docs update**
- ❌ **`PENDING_CHANGES.md` not updated before deployment**

**Wrong:**
```
PR: "Changed API endpoint from /v1 to /v2"
Documentation: (no updates)
```

**Correct:**
```
PR: "Changed API endpoint from /v1 to /v2"
Documentation:
- Updated /docs/api/README.md with new endpoints
- Updated PENDING_CHANGES.md with migration instructions
- Added deprecation warning to old endpoint
```

### Incomplete Implementation (Critical)
- ❌ **TODO comments without timeline**
- ❌ **Disabled tests without explanation**
- ❌ **Feature flags without completion plan**
- ❌ **Commented out code without explanation**

**Wrong:**
```javascript
// TODO: Handle error case
// TODO: Add tests
// TODO: Optimize performance

test.skip('should handle errors', () => {
  // Test disabled
})
```

**Correct:**
```javascript
// TODO(2025-10-20): Handle error case when error codes defined
// See issue #123 for error code specification

test('should handle errors', () => {
  // Full implementation with error handling
})
```

## Performance Violations

### Performance Regressions (Critical)
- ❌ **Slower than before** (without justification)
- ❌ **Memory leaks** detected
- ❌ **Excessive re-renders**
- ❌ **Blocking UI thread** for long operations

**Verification:**
```bash
# Profile before/after
# Measure render counts
# Check memory usage
# Monitor network requests
```

**Wrong:**
```javascript
// Re-renders entire list on every change
function ListView() {
  const items = useStore(state => state)  // All state!
  return items.map(item => <Item {...item} />)
}

// Blocking operation
function Component() {
  const result = expensiveCalculation(data)  // On every render!
  return <div>{result}</div>
}
```

**Correct:**
```javascript
// Only re-renders when items change
function ListView() {
  const items = useStore(state => state.items)  // Specific selector
  return items.map(item => <Item key={item.id} {...item} />)
}

// Memoized calculation
function Component() {
  const result = useMemo(() => expensiveCalculation(data), [data])
  return <div>{result}</div>
}
```

### Known Platform Issues (Critical)
- ❌ **AsyncStorage in hot paths** (iOS 20+ second freeze)
- ❌ **NetInfo.fetch()** usage (causes freezes)
- ❌ **Large lists without virtualization** (performance degradation)
- ❌ **Heavy animations** (causes jank on older devices)

## Summary: Instant Rejection Checklist

Use this checklist during review. ANY ❌ = REJECTED.

### Automatic Failures
- [ ] ❌ Build fails on any platform
- [ ] ❌ Tests fail
- [ ] ❌ Type checking fails
- [ ] ❌ Linting errors (not warnings)

### StackMap Architecture
- [ ] ❌ Direct `useAppStore.setState()` in new code
- [ ] ❌ Legacy field names (`name`/`emoji` instead of `text`/`icon`)
- [ ] ❌ Platform-specific APIs in shared code
- [ ] ❌ Gray text colors (use #000)
- [ ] ❌ Direct fontWeight on Android (use Typography)

### Production Safety
- [ ] ❌ Unwrapped console.log statements
- [ ] ❌ Uncaught exceptions in critical paths
- [ ] ❌ Event listeners/timers not cleaned up
- [ ] ❌ Infinite loops or recursion without termination

### Security
- [ ] ❌ Hardcoded credentials
- [ ] ❌ Unencrypted sensitive data
- [ ] ❌ Missing authentication/authorization
- [ ] ❌ Injection vulnerabilities (SQL, XSS, command)

### Data Integrity
- [ ] ❌ Missing null/undefined checks
- [ ] ❌ Breaking changes without migration
- [ ] ❌ No fallbacks for legacy data
- [ ] ❌ Partial state updates (not atomic)

### Documentation & Evidence
- [ ] ❌ Can't verify completion
- [ ] ❌ Breaking changes without docs update
- [ ] ❌ PENDING_CHANGES.md not updated
- [ ] ❌ Incomplete implementation (TODOs without plan)

If ALL boxes are clear (no ❌), proceed with full review.
If ANY ❌ is checked, issue REJECTED verdict immediately.
