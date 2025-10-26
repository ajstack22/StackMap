# Project Atlas Conventions

Copy this file to `.atlas/conventions.md` in your project root and customize it for your team.

## Code Standards

### Field Naming
Define your field naming conventions here. Examples:

- Users: Use `email` and `displayName` (not username)
- Tasks: Use `title` and `description` (not name/text)
- Always include fallbacks: `user.displayName || user.email`

### State Management
Define how state should be managed. Examples:

- NEVER use direct setState on root store
- User updates: `useUserStore.getState().updateUser()`
- Task updates: `useTaskStore.getState().updateTask()`

### Code Style
Define your code style rules. Examples:

- Use ESLint configuration
- 2 spaces for indentation
- No semicolons (or always semicolons)
- Single quotes (or double quotes)

## Platform-Specific Rules

### Web
Define web-specific rules. Examples:

- Use styled-components (not inline styles)
- Window confirms (not Alert.alert)
- 3-column grid: use CSS Grid (not flexbox)

### Mobile (iOS & Android)
Define mobile-specific rules. Examples:

- Use React Navigation v6 patterns
- Platform-specific file extensions (.ios.js, .android.js)
- Android: Use font variants, not fontWeight

### Backend
Define backend-specific rules. Examples:

- Use async/await (not callbacks)
- Use repository pattern for data access
- All routes must have authentication middleware

## Deployment Process

### Pre-deployment Checklist
- [ ] Update CHANGELOG.md (or your changelog file)
- [ ] Run linting: `npm run lint`
- [ ] Run type checking: `npm run typecheck`
- [ ] Run tests: `npm test`
- [ ] Check coverage meets minimum (e.g., 80%)

### Deployment Commands
```bash
# Development environment
npm run deploy:dev
# OR
./scripts/deploy.sh dev

# Staging environment
npm run deploy:staging
# OR
./scripts/deploy.sh staging

# Production environment
npm run deploy:prod
# OR
./scripts/deploy.sh prod
```

### Post-deployment Checklist
- [ ] Check error monitoring (Sentry, Rollbar, etc.)
- [ ] Verify in deployed environment
- [ ] Update team in communication channel (Slack, Teams, etc.)
- [ ] Monitor metrics for 15 minutes

## Quality Gates

### Linting
- Command: `npm run lint`
- Auto-fix: `npm run lint:fix`
- Config file: `.eslintrc.js` (or your config file)
- Must pass: Yes

### Type Checking
- Command: `npm run typecheck` (or `tsc --noEmit`)
- Config file: `tsconfig.json` (if using TypeScript)
- Must pass: Yes

### Testing
- Command: `npm test`
- Coverage command: `npm test -- --coverage`
- Coverage minimum: 80% (adjust for your project)
- Config file: `jest.config.js` (or your test config)
- Must pass: Yes

### Build
- Command: `npm run build`
- Must succeed: Yes before deployment

## Design Standards

### Accessibility
Define your accessibility requirements. Examples:

- All text must have 4.5:1 contrast ratio (WCAG AA)
- All interactive elements must be 44x44pt minimum (touch targets)
- Support screen readers (aria labels required)
- Keyboard navigation required for all interactive elements

### Color Palette
Define your color system. Examples:

- Use `theme.colors.*` only (no hard-coded hex values)
- Primary: #007AFF
- Secondary: #5856D6
- Error: #FF3B30
- Warning: #FF9500
- Success: #34C759
- Text: #000000
- Background: #FFFFFF

### Typography
Define your typography system. Examples:

- Headings: Use `<Heading>` component (or `<Typography variant="h1">`)
- Body: Use `<Text>` component (or `<Typography variant="body">`)
- Code: Use `<Code>` component (or `<Typography variant="code">`)
- Fonts: System font stack (or specific fonts)

### Spacing
Define your spacing system. Examples:

- Use spacing scale: 4, 8, 12, 16, 24, 32, 48, 64 (multiples of 4)
- Use theme spacing: `theme.spacing(2)` for 16px
- Minimum touch target padding: 12px

## Critical Patterns

### Authentication
Define your authentication approach. Examples:

- JWT tokens stored in secure storage (Keychain/Keystore)
- Refresh tokens handled automatically via interceptor
- Logout clears all user data and tokens
- Protected routes require authentication HOC/hook

### API Integration
Define your API patterns. Examples:

- Use `apiClient` wrapper (src/api/client.js)
- All endpoints defined in `src/api/endpoints.js`
- Error handling via interceptors (map 401 → logout, 500 → error toast)
- Request timeout: 30 seconds
- Retry logic: 3 attempts with exponential backoff

### Error Handling
Define your error handling strategy. Examples:

- User-facing errors: Use toast notifications (bottom of screen, 3s duration)
- Developer errors: Log to error monitoring service (Sentry)
- Network errors: Retry with exponential backoff (3 attempts)
- Validation errors: Show inline below form field

### Data Persistence
Define your data persistence approach. Examples:

- Use Redux Persist for client state
- Use AsyncStorage/localStorage for simple key-value
- Use SQLite/IndexedDB for complex queries
- Encrypt sensitive data before persisting

## Anti-Patterns (Never Do This)

List common mistakes to avoid:

- ❌ Don't use direct state mutation (use immutable updates)
- ❌ Don't hard-code API URLs (use environment variables)
- ❌ Don't store passwords in plain text (hash + salt)
- ❌ Don't skip error handling (wrap async calls in try/catch)
- ❌ Don't use `any` type in TypeScript (use specific types)
- ❌ Don't commit secrets (.env files, API keys)
- ❌ Don't use `console.log` in production (use proper logging)

## Testing Standards

### Unit Tests
- Location: Co-located with source files (`component.test.js`)
- Framework: Jest (or your test framework)
- Coverage target: 80% minimum
- Run command: `npm test`

### Integration Tests
- Location: `tests/integration/`
- Framework: Jest + Testing Library (or your framework)
- Coverage target: Critical user flows
- Run command: `npm run test:integration`

### E2E Tests
- Location: `tests/e2e/`
- Framework: Cypress / Playwright (or your framework)
- Coverage target: Core user journeys
- Run command: `npm run test:e2e`

## Documentation Requirements

### Code Documentation
- All functions must have JSDoc comments (or equivalent)
- Complex logic must have inline comments explaining "why"
- Public APIs must have usage examples

### Commit Messages
- Format: `type(scope): subject` (Conventional Commits)
- Types: feat, fix, docs, style, refactor, test, chore
- Example: `feat(auth): add two-factor authentication`

### Pull Requests
- Must reference issue/ticket number
- Must include description of changes
- Must include testing steps
- Must pass all CI checks

## Environment Variables

List required environment variables:

```bash
# API Configuration
API_BASE_URL=https://api.example.com
API_TIMEOUT=30000

# Authentication
JWT_SECRET=your-secret-key
TOKEN_EXPIRY=3600

# Feature Flags
ENABLE_NEW_UI=false
ENABLE_ANALYTICS=true

# Third-party Services
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

## Security Requirements

Define security standards:

- All API calls must use HTTPS
- All user input must be sanitized
- All passwords must be hashed (bcrypt, rounds=10)
- All secrets must use environment variables
- All dependencies must be regularly updated (npm audit)
- All sensitive data must be encrypted at rest

## Performance Standards

Define performance targets:

- Page load time: < 3 seconds
- Time to interactive: < 5 seconds
- Bundle size: < 500KB (gzipped)
- Lighthouse score: > 90
- API response time: < 500ms (p95)

## Browser/Platform Support

Define supported platforms:

### Web
- Chrome: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Edge: Last 2 versions
- Mobile browsers: iOS Safari, Chrome Android

### Mobile
- iOS: 14+
- Android: API 28+ (Android 9+)

## Useful Links

Add links to important resources:

- Project documentation: [link]
- API documentation: [link]
- Design system: [link]
- Issue tracker: [link]
- CI/CD dashboard: [link]
- Monitoring dashboard: [link]

---

**Note:** This template is comprehensive. Customize it for your project by removing sections that don't apply and adding project-specific details where needed. Start simple and iterate as patterns emerge.
