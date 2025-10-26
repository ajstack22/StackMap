# Atlas Generic Skills

This directory contains **portable, project-agnostic versions** of Atlas skills that can be used with any codebase.

## What's Included

### 1. **atlas-meta/** - Workflow Orchestrator
The decision-making skill that selects the appropriate workflow tier (Quick/Iterative/Standard/Full) based on task complexity.

**Contents:**
- `SKILL.md` - Main orchestrator skill
- `resources/tier-selector.md` - Detailed tier selection guide

### 2. **atlas-quick/** - Quick Workflow (5-15 min)
The 2-phase workflow for trivial changes like typos, color updates, and simple config changes.

**Contents:**
- `SKILL.md` - Quick workflow skill

## Key Differences from Project-Specific Skills

These generic skills remove all project-specific conventions:

**Removed:**
- Project-specific field naming rules
- Project-specific state management patterns
- Project-specific deployment scripts
- Project-specific design rules
- Project-specific platform gotchas

**Added:**
- Generic examples (typo fixes, color changes)
- Project customization guidance
- `.atlas/conventions.md` integration
- Placeholder deployment commands

## How to Use in Your Project

### Option 1: Use As-Is with `.atlas/conventions.md`

1. **Copy these skills to your project:**
   ```bash
   cp -r atlas-skills-generic/ your-project/.atlas/skills/
   ```

2. **Create `.atlas/conventions.md` in your project root:**
   ```markdown
   # Project Atlas Conventions

   ## Code Standards
   - Field naming: [Your conventions]
   - State management: [Your patterns]

   ## Deployment
   - Pre-deployment: [Your checklist]
   - Command: [Your command]

   ## Quality Gates
   - Linting: npm run lint
   - Type checking: npm run typecheck
   - Testing: npm test
   ```

3. **Atlas will automatically reference your conventions**

### Option 2: Customize the Skills

1. **Copy skills to your project**
2. **Edit `SKILL.md` files** to add project-specific examples
3. **Replace generic commands** with your actual commands:
   - `[your deployment command]` → `./deploy.sh dev`
   - `[your changelog file]` → `CHANGELOG.md`
4. **Add project-specific anti-patterns and gotchas**

### Option 3: Keep Generic and Reference Docs

1. **Use skills as-is**
2. **Reference existing project documentation:**
   - Link to coding standards
   - Link to deployment guides
   - Link to architecture docs
3. **No `.atlas/conventions.md` needed** if docs are comprehensive

## Customization Checklist

When adapting for your project, update:

- [ ] Deployment commands (replace `[your deployment command]`)
- [ ] Changelog file location (replace `[your changelog file]`)
- [ ] Validation commands (linting, type checking, tests)
- [ ] Field naming conventions (if any)
- [ ] State management patterns (if any)
- [ ] Platform-specific rules (if multi-platform)
- [ ] Design system rules (colors, typography, accessibility)
- [ ] Code quality standards (coverage, complexity)

## Example `.atlas/conventions.md`

```markdown
# Project Atlas Conventions

## Code Standards

### Field Naming
- Users: Use `email` and `displayName` (not username)
- Tasks: Use `title` and `description` (not name/text)
- Always include fallbacks: `user.displayName || user.email`

### State Management
- NEVER use direct setState on root store
- User updates: `useUserStore.getState().updateUser()`
- Task updates: `useTaskStore.getState().updateTask()`

## Platform-Specific Rules

### Web
- Use styled-components (not inline styles)
- Window confirms (not Alert.alert)
- 3-column grid: use CSS Grid (not flexbox)

### Mobile (iOS & Android)
- Use React Navigation v6 patterns
- Platform-specific file extensions (.ios.js, .android.js)
- Android: Use font variants, not fontWeight

## Deployment Process

### Pre-deployment
- [ ] Update CHANGELOG.md
- [ ] Run `npm run lint`
- [ ] Run `npm run typecheck`
- [ ] Run `npm test -- --coverage`

### Deployment
```bash
# Development
npm run deploy:dev

# Staging
npm run deploy:staging

# Production
npm run deploy:prod
```

### Post-deployment
- [ ] Check monitoring for errors
- [ ] Verify in deployed environment
- [ ] Update team communication channel

## Quality Gates

### Linting
- Command: `npm run lint`
- Auto-fix: `npm run lint:fix`
- Config: `.eslintrc.js`

### Type Checking
- Command: `npm run typecheck`
- Must pass before deployment

### Testing
- Command: `npm test`
- Coverage minimum: 80%
- Config: `jest.config.js`

## Design Standards

### Accessibility
- All text must have 4.5:1 contrast ratio
- All interactive elements must be 44x44pt minimum
- Support screen readers (aria labels required)

### Colors
- Use theme.colors.* only (no hard-coded hex)
- Primary: #007AFF
- Error: #FF3B30
- Warning: #FF9500

### Typography
- Headings: Use `<Heading>` component
- Body: Use `<Text>` component
- Code: Use `<Code>` component

## Critical Patterns

### Authentication
- JWT tokens stored in secure storage
- Refresh tokens handled automatically
- Logout clears all user data

### API Integration
- Use `apiClient` wrapper (src/api/client.js)
- All endpoints in `src/api/endpoints.js`
- Error handling via interceptors

### Error Handling
- User-facing errors: Use toast notifications
- Developer errors: Log to error monitoring
- Network errors: Retry with exponential backoff
```

## Benefits of Generic Skills

1. **Portability**: Use across multiple projects
2. **Flexibility**: Customize via `.atlas/conventions.md`
3. **Maintainability**: Update conventions without changing skills
4. **Onboarding**: New developers reference conventions file
5. **Consistency**: Same workflow structure across projects

## Quick Start

### For Users:
```
"Fix the login bug. Use Atlas workflow."
"Add user authentication. Use Atlas Full workflow."
"Fix typo in error message. Use Atlas Quick workflow."
```

### As Atlas Orchestrator:
1. Check for `.atlas/conventions.md` in project root
2. Apply decision tree to select tier
3. Invoke appropriate skill
4. Execute workflow phases
5. Apply project-specific rules throughout

## Contributing

If you create improvements to these generic skills:

1. Remove any project-specific details
2. Use placeholders: `[your command]`, `[your file]`
3. Add customization guidance
4. Document in comments why something is generic

## Files Created

This conversion created the following structure:

```
atlas-skills-generic/
├── README.md (this file)
├── atlas-meta/
│   ├── SKILL.md (generic orchestrator)
│   └── resources/
│       └── tier-selector.md (generic tier selection guide)
└── atlas-quick/
    └── SKILL.md (generic quick workflow)
```

## Next Steps

To use these skills in a new project:

1. Copy `atlas-skills-generic/` directory to your project
2. (Optional) Create `.atlas/conventions.md` with your project rules
3. Start using: "Use Atlas workflow" in your requests
4. Iterate on conventions as patterns emerge

## License

These skills are derived from the Atlas Framework and are intended for use with Claude AI workflows. Use freely, customize for your needs, share with your team.
