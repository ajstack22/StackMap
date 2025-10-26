# React Native Configuration Example

This directory contains an example Atlas configuration for a React Native mobile application based on the StackMap project.

## What's Included

- **conventions.md** - Complete coding standards for React Native
- **validation.sh** - Anti-pattern checks specific to React Native
- **README.md** - This file

## How to Use

### Option 1: Copy to Your Project

```bash
cd /path/to/your/react-native-project
mkdir -p .atlas
cp path/to/atlas-skills-generic/templates/examples/react-native-config/conventions.md .atlas/
cp path/to/atlas-skills-generic/templates/examples/react-native-config/validation.sh .atlas/
chmod +x .atlas/validation.sh
```

### Option 2: Use as Reference

Review the files and adapt to your project's specific needs:

1. Read `conventions.md` to see what areas to document
2. Adapt naming conventions, state management patterns, etc.
3. Customize `validation.sh` checks for your anti-patterns

## Customization Guide

### conventions.md Sections to Customize

1. **Project Overview** - Update with your app name and stack
2. **State Management** - Replace Zustand with your state solution (Redux, MobX, Context, etc.)
3. **Field Naming Standards** - Remove if not applicable to your domain
4. **Platform-Specific Rules** - Add/remove based on your target platforms
5. **Typography** - Update with your design system

### validation.sh Checks to Customize

1. **State mutation check** - Adapt to your state management library
2. **Field naming check** - Remove if not using specific field conventions
3. **Platform anti-patterns** - Add checks specific to your architecture
4. **TypeScript check** - Update command if you use different type checking

## Key Conventions Explained

### Why Split Stores?
This example shows Zustand with split stores (useUserStore, useSettingsStore, etc.) instead of one monolithic store. Benefits:
- Better performance (only subscribe to needed slices)
- Clearer ownership and responsibility
- Easier testing and debugging

### Why No AsyncStorage on iOS?
This example disables AsyncStorage debouncing on iOS due to performance issues. Your app may not have this issue - test and adjust.

### Why Percentage Widths on Android?
FlexWrap behavior differs between platforms. Percentage widths ensure consistent multi-column layouts on Android.

### Why Field Fallbacks?
Data can come from multiple sources (API, local storage, sync). Fallbacks ensure the app doesn't break when field names vary.

## Integration with CI/CD

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
if [ -f .atlas/validation.sh ]; then
  ./.atlas/validation.sh || exit 1
fi
```

### GitHub Actions

```yaml
# .github/workflows/atlas-validation.yml
name: Atlas Validation

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install
        run: npm ci
      - name: Atlas Validation
        run: ./.atlas/validation.sh
      - name: Tests
        run: npm test
```

## Testing the Configuration

```bash
# Run validation manually
cd /path/to/your/project
./.atlas/validation.sh

# Test with Atlas
# "Add a new screen following our conventions. Use Atlas workflow."
```

## Common Adaptations

### Using Redux Instead of Zustand

Update `conventions.md`:

```markdown
## State Management
- Library: Redux Toolkit
- Update pattern: `dispatch(updateUser(userData))`
- Selectors: Use reselect for memoization
- Anti-pattern: Mutating state outside reducers
```

Update `validation.sh`:

```bash
check_direct_state_mutation() {
  echo "Checking for direct state mutation..."

  if grep -r "state\.[a-zA-Z]*\s*=" src/ --include="*.ts" 2>/dev/null; then
    echo -e "${RED}❌ Direct state mutation found${NC}"
    return 1
  fi

  echo -e "${GREEN}✅ No direct state mutation${NC}"
  return 0
}
```

### Different Design System

Update `conventions.md`:

```markdown
## Typography (Design System)
- Use design system components from @your-org/design-system
- Typography: <Typography variant="h1|h2|body|caption">
- Colors: Use theme.colors.* (no hardcoded values)
- Spacing: Use theme.spacing.* (multiples of 8)
```

### Web-Only or Mobile-Only

Remove irrelevant platform sections:

```markdown
## Platform-Specific Rules

### iOS
[Keep only if targeting iOS]

### Android
[Keep only if targeting Android]

### Web
[Keep only if targeting web]
```

## When to Update

Update your `.atlas/` configuration when:

1. **New patterns emerge** - Team establishes new best practice
2. **New anti-patterns found** - Bug caused by specific code pattern
3. **Architecture changes** - Migration to new state management, etc.
4. **Platform gotchas discovered** - Platform-specific bugs or quirks
5. **Design system updates** - New components or patterns added

## Benefits of This Configuration

1. **Onboarding** - New developers learn conventions quickly
2. **Consistency** - Code follows same patterns across features
3. **Quality** - Anti-patterns caught automatically
4. **Documentation** - Conventions documented and maintained
5. **AI-Friendly** - Atlas understands and applies your rules

## Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [TypeScript with React Native](https://reactnative.dev/docs/typescript)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

## License

This example configuration is provided as a starting point for your project. Customize freely for your needs.
