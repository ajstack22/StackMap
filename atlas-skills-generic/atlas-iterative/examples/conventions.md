# Project Conventions - Example Template

Copy this template to `.atlas/conventions.md` in your project root and customize for your needs.

---

## Code Quality Standards

### General Rules
- All public functions must have documentation comments
- Maximum function length: 50 lines (or specify your limit)
- Cyclomatic complexity: < 10 (or specify your limit)
- No commented-out code in production
- No TODO comments without issue tracker references

### Code Formatting
- Use project formatter (Prettier, Black, rustfmt, etc.)
- 2-space indentation (or specify your standard)
- 80-character line limit (or specify your limit)
- Consistent naming throughout the codebase

---

## Naming Conventions

### JavaScript/TypeScript
- Components: PascalCase (`UserProfile.jsx`)
- Functions/variables: camelCase (`getUserById`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINT`)
- Private methods: prefix with underscore (`_internalMethod`)
- Types/Interfaces: PascalCase (`UserData`, `IUserService`)

### Python
- Modules: snake_case (`user_service.py`)
- Classes: PascalCase (`UserService`)
- Functions/variables: snake_case (`get_user_by_id`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINT`)
- Private methods: prefix with underscore (`_internal_method`)

### Rust
- Modules: snake_case (`user_service`)
- Structs/Enums: PascalCase (`UserService`)
- Functions/variables: snake_case (`get_user_by_id`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINT`)
- Traits: PascalCase (`Serialize`)

### Go
- Packages: lowercase (`userservice`)
- Types: PascalCase (`UserService`)
- Functions/variables: camelCase (`getUserByID`)
- Constants: PascalCase (`APIEndpoint`)
- Exported: Start with uppercase (`GetUser`)
- Unexported: Start with lowercase (`getUser`)

---

## State Management

### Global State
- Use [Redux/Zustand/Context/etc] for global state
- Never mutate state directly - use update functions
- Keep state normalized (avoid nested objects)
- Use selectors for derived state

### Component State
- Use local state for UI-only concerns
- Lift state up when shared between components
- Use refs for values that don't trigger re-renders

### Anti-Patterns
- ❌ Prop drilling beyond 2 levels
- ❌ Storing derived data in state
- ❌ Direct state mutations
- ❌ Mixing UI state with domain state

---

## API & Data Handling

### API Calls
- All API calls must have error handling
- Use project's HTTP client (axios/fetch/etc)
- Implement retry logic for network failures
- Validate response data before using

### Error Handling
- Use try/catch for async operations
- Log errors with context (user ID, request ID, etc.)
- Show user-friendly error messages
- Never expose internal errors to users

### Data Validation
- Validate all user inputs
- Sanitize data before database operations
- Use schema validation (Zod, Joi, etc.)
- Validate API responses match expected shape

---

## Testing Requirements

### Coverage Requirements
- Minimum 80% code coverage (or specify your target)
- 100% coverage for critical paths (auth, payments, etc.)
- All public APIs must have unit tests
- Integration tests for key user flows

### Test Organization
- One test file per source file
- Test file naming: `[source].test.js` or `[source]_test.py`
- Use descriptive test names: `should_return_user_when_id_exists`
- Group related tests in describe/context blocks

### Test Patterns
- Use AAA pattern: Arrange, Act, Assert
- Mock external dependencies
- Test edge cases (null, empty, boundary values)
- Test error conditions

---

## Platform-Specific Rules

### Mobile (React Native / Flutter / etc)

**iOS:**
- Test on both iPhone and iPad simulators
- Verify safe area insets respected
- Check for memory leaks in long-running operations
- Test offline behavior

**Android:**
- Test on multiple screen densities
- Verify back button behavior
- Check for ANR (Application Not Responding) issues
- Test on different Android versions

**Cross-platform:**
- Avoid platform-specific code in shared components
- Use percentage widths for responsive layouts
- Test touch targets are ≥ 44x44 points
- Verify keyboard handling on both platforms

### Web

**Accessibility:**
- Ensure keyboard navigation support
- Add ARIA labels for screen readers
- Maintain minimum 4.5:1 contrast ratio
- Provide text alternatives for images

**Responsive Design:**
- Test on mobile, tablet, desktop breakpoints
- Mobile-first approach (start with smallest screen)
- Use relative units (rem, em, %) not pixels
- Avoid horizontal scrolling on small screens

**Performance:**
- Lazy load images and heavy components
- Code splitting for route-based chunks
- Optimize bundle size (< 200KB initial load)
- Aim for < 3s Time to Interactive

---

## Security

### Authentication & Authorization
- Never store passwords in plain text
- Use secure session management
- Implement proper CORS policies
- Validate user permissions on backend

### Data Protection
- Never log sensitive data (passwords, tokens, PII)
- Encrypt sensitive data at rest
- Use HTTPS for all API calls
- Sanitize user inputs to prevent XSS/SQL injection

### Secrets Management
- Never commit secrets to version control
- Use environment variables for configuration
- Rotate API keys regularly
- Use secret management tools (Vault, AWS Secrets Manager)

---

## Documentation

### Code Comments
- Explain WHY, not WHAT
- Document complex algorithms
- Add examples for non-obvious APIs
- Keep comments up to date with code

### API Documentation
- Document all public endpoints
- Include request/response examples
- Specify error codes and meanings
- Document rate limits and authentication

### README Requirements
- Setup instructions
- Development workflow
- Testing instructions
- Deployment process

---

## Git Conventions

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add user authentication
fix: resolve login button spacing
refactor: extract validation logic
docs: update API documentation
test: add tests for user service
chore: update dependencies
```

### Branch Naming
```
feature/user-authentication
fix/login-spacing-issue
refactor/extract-validation
docs/api-documentation
```

### Pull Requests
- Title should be descriptive (not "fix bug")
- Description should explain WHY, not WHAT
- Link to issue tracker ticket
- Request specific reviewers
- Ensure CI passes before requesting review

---

## Deployment

### Pre-Deployment Checklist
- [ ] All tests pass
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Migration scripts tested (if applicable)
- [ ] Environment variables configured
- [ ] Rollback plan documented

### Deployment Process
```bash
# Your project's deployment commands
./scripts/deploy.sh staging
./scripts/deploy.sh production
```

### Post-Deployment
- Verify deployment in target environment
- Monitor error rates and performance
- Check logs for unexpected errors
- Update changelog/release notes

---

## Review Process

### Self-Review Checklist
Before submitting for peer review:
- [ ] Run all validation commands
- [ ] Test on all supported platforms
- [ ] Check for edge cases
- [ ] Verify conventions followed
- [ ] Remove debug statements

### Peer Review Focus Areas
Reviewers should check for:
- Edge cases and error handling
- Convention adherence
- Security vulnerabilities
- Performance implications
- Test coverage
- Documentation completeness

---

## Escalation Guidelines

### When to Escalate to Standard Workflow
- Change affects > 2 files
- Tests need significant updates
- Complex edge cases emerge
- Architectural decisions required

### When to Escalate to Full Workflow
- Security implications
- Cross-platform coordination needed
- Formal requirements required
- Major architectural changes

---

## Tools & Commands

### Validation
```bash
# Type checking
npm run typecheck      # JavaScript/TypeScript
mypy .                 # Python
cargo check            # Rust

# Linting
npm run lint           # JavaScript
pylint src/            # Python
cargo clippy           # Rust

# Testing
npm test               # JavaScript
pytest                 # Python
cargo test             # Rust
go test ./...          # Go

# Formatting
npm run format         # Prettier
black .                # Python
cargo fmt              # Rust
go fmt ./...           # Go
```

### Security Scanning
```bash
npm audit              # JavaScript dependencies
safety check           # Python dependencies
cargo audit            # Rust dependencies
```

### Performance
```bash
npm run bundle-size    # Check bundle size
lighthouse [url]       # Web performance audit
```

---

## Customization Notes

This template covers common conventions across many projects. Customize it by:

1. **Removing irrelevant sections** (e.g., platform-specific rules if web-only)
2. **Adding project-specific rules** (e.g., GraphQL schema conventions)
3. **Updating examples** to match your tech stack
4. **Adjusting thresholds** (coverage %, complexity limits) to your standards

Atlas will reference this file during Phase 2 peer reviews to ensure project conventions are followed.
