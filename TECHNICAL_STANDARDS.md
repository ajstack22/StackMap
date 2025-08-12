# StackMap Technical Standards & Implementation Guidelines

## Core Principles

### 1. User-First Development
- **Accessibility is non-negotiable**: All text must be high contrast (#000 on light backgrounds)
- **Performance over features**: Better to have fewer features that work instantly
- **Offline-first**: Every feature should work without network when possible
- **Privacy by design**: Zero-knowledge encryption, no tracking, no analytics

### 2. Code Philosophy
- **Explicit over implicit**: Clear, readable code over clever shortcuts
- **Defensive programming**: Always handle edge cases and errors gracefully
- **Platform-specific when necessary**: Don't force unified behavior if platforms differ
- **Comments only when needed**: Code should be self-documenting

## Implementation Standards

### State Management
```javascript
// ✅ GOOD: Single source of truth
const [activities, setActivities] = useState([]);
setActivities([...activities, newActivity]);

// ❌ BAD: Multiple state updates
activities.forEach(a => setActivities([...activities, a]));
```

### Component Structure
```javascript
// All components follow this structure:
// 1. Imports
// 2. Constants
// 3. Component definition
// 4. Styles (if inline)
// 5. Export

// Always use functional components with hooks
// Always memoize expensive computations
// Always handle loading and error states
```

### Platform-Specific Code
```javascript
// Always check platform explicitly
if (Platform.OS === 'ios') {
  // iOS-specific implementation
} else if (Platform.OS === 'android') {
  // Android-specific implementation
} else {
  // Web implementation
}

// Never assume platform behavior
```

### Error Handling
```javascript
// Every async operation must have try/catch
try {
  setSyncLoading(true);
  await syncService.sync();
  showToast({ message: 'Success' });
} catch (error) {
  showToast({ 
    message: error.message || 'Operation failed',
    type: 'error'
  });
} finally {
  setSyncLoading(false);
}
```

## Data Handling

### Storage
- **LocalStorage/AsyncStorage**: User preferences, sync keys
- **State**: Active session data
- **Never store**: Passwords, raw encryption keys, sensitive data unencrypted

### Sync Principles
- **Conflict Resolution**: Always automatic, last-write-wins
- **Encryption**: PBKDF2 with 100,000 iterations (NEVER CHANGE)
- **Recovery phrases**: 32 character hex strings
- **API calls**: Always include proper error handling and loading states

## UI/UX Standards

### Modals
```javascript
// iOS: Use native alerts for confirmations
if (Platform.OS === 'ios') {
  Alert.alert('Title', 'Message', [...]);
}

// Android/Web: Use ConfirmModal component
else {
  setShowConfirm(true);
}
```

### Swipe-to-Dismiss Gesture Handling
```javascript
// Track exact scroll position, not just binary state
const scrollOffsetsRef = useRef({});
const isAtTopRef = useRef(true);

// CRITICAL: Never capture upward swipes
if (gestureState.dy < 0) {
  return false;
}

// Only allow dismiss when ScrollView is at top (offset = 0)
const canDismiss = isAtTopRef.current && !isScrolling;
```

### Colors & Themes
- User themes are preferences, not accessibility features
- Text must always be readable regardless of theme
- Use theme.primary, theme.light, theme.dark consistently
- Never hardcode colors except black (#000) for text

### Responsive Design
```javascript
// Tablet detection must be consistent
const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && aspectRatio > 1.2;
};

// Grid layouts only on tablets with sufficient width
const numColumns = isTablet() && width >= 768 ? 2 : 1;
```

### Typography
- Comic Relief font is loaded and required
- Fallback to system fonts gracefully
- Font sizes must be readable (minimum 14px)
- Line height must accommodate neurodivergent readers

## Performance Standards

### Bundle Size
- Web initial JS: < 200KB target
- Use dynamic imports for non-critical features
- Images: Optimize and use appropriate formats

### Rendering
```javascript
// Always use React.memo for list items
const ActivityCard = React.memo(({ activity }) => {
  // Component implementation
});

// Always provide keyExtractor for lists
<FlatList
  data={activities}
  keyExtractor={item => item.id}
  renderItem={renderActivity}
/>
```

### Network Requests
- Always show loading states
- Always handle errors
- Implement retry logic for critical operations
- Cache responses when appropriate

## Security Standards

### Never Do
- Store raw passwords
- Log sensitive information
- Commit API keys or secrets
- Trust client-side validation alone
- Use Math.random() for security-critical operations

### Always Do
- Validate and sanitize inputs
- Use HTTPS for all API calls
- Implement rate limiting concepts
- Handle authentication errors gracefully
- Clear sensitive data on logout/reset

## Testing Requirements

### Before Committing
- [ ] Lint passes: `npm run lint`
- [ ] Works on iOS simulator
- [ ] Works on Android emulator  
- [ ] Works in Chrome/Safari
- [ ] Sync functions correctly
- [ ] No console errors in production build

### Platform-Specific Testing
- **iOS**: Test on iPhone and iPad
- **Android**: Test on phone and tablet
- **Web**: Test on desktop and mobile browsers
- **All**: Test offline functionality

## Build & Deployment

### Version Control
```bash
# Commit messages should be clear and specific
git commit -m "Fix iOS modal z-index issue in DataModal"

# Not
git commit -m "Fix bug"
```

### Production Builds
- Always use NODE_ENV=production
- Always test production builds before deployment
- Never deploy with console.log statements in production
- Always increment version numbers

## File Organization

### Structure
```
src/
  components/     # Reusable UI components
    Component/
      Component.js
      styles.js
      index.js
  services/       # Business logic, API calls
  hooks/          # Custom React hooks
  constants/      # Shared constants
  utils/          # Helper functions
```

### Naming Conventions
- Components: PascalCase (`DataModal.js`)
- Utilities: camelCase (`formatDate.js`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- Files: Match export name

## Documentation Standards

### When to Document
- Complex business logic
- Non-obvious solutions
- Platform-specific workarounds
- API contracts
- Security considerations

### How to Document
```javascript
/**
 * Encrypts data using zero-knowledge encryption
 * @param {string} data - Raw data to encrypt
 * @param {string} key - Encryption key (32 bytes)
 * @returns {string} Base64 encoded encrypted data
 * @throws {Error} If encryption fails
 */
```

## Decision Making

### When to Create New Components
- Reused 3+ times
- Complex logic that clutters parent
- Distinct, testable functionality
- Platform-specific implementations

### When to Refactor
- Performance issues identified
- Code duplicated 3+ times
- Readability severely impacted
- New platform requirements

### When NOT to Refactor
- Working code before deployment
- To add unnecessary abstraction
- Without understanding current implementation
- Without proper testing ability

## Breaking Changes

### Never Break
- Sync data format (version 3)
- Encryption iterations (100,000)
- API contract without versioning
- Storage keys without migration

### How to Handle Breaking Changes
1. Add version detection
2. Implement migration logic
3. Test with old and new data
4. Document in CHANGELOG
5. Notify in deployment notes

## AI Assistant Guidelines

When working with Claude or other AI assistants:

### Always Provide
- Current file being edited
- Specific error messages
- Platform being tested on
- Recent changes made

### Never Assume
- AI has previous conversation context
- AI knows recent changes
- AI understands custom abstractions
- AI knows deployment state

### Best Practices
- Start with prompt packs for context
- Be specific about requirements
- Verify generated code
- Test before committing
- Update documentation after changes

## Maintenance

This document should be updated when:
- New patterns are established
- Problems recur frequently
- Standards change
- New platforms are added
- Team agreements are made

Last Updated: 2025-01-08
Version: 1.0.0