# Changelog - Atlas Agent: Peer Reviewer (Generic)

## Version 1.0.0 (2025-10-17)

### Initial Release

Created generic, portable version of the Atlas peer-reviewer agent skill.

**What's Included:**

1. **SKILL.md** - Main skill definition
   - Adversarial Protocol (5 steps)
   - Three verdict types (REJECTED, CONDITIONAL PASS, PASS)
   - Generic review checklists
   - Customization instructions
   - Common review scenarios
   - Anti-patterns to reject

2. **resources/rejection-criteria.md** - Comprehensive blocking issues
   - Build & test failures
   - Generic architectural violations
   - Security vulnerabilities
   - Production safety issues
   - Data integrity violations
   - Documentation & evidence requirements
   - Performance violations
   - Platform-specific issues (generic templates)

3. **README.md** - Installation and usage guide
   - Installation instructions
   - Customization guide
   - Example usage
   - Verdict explanations
   - Integration with CI/CD
   - Tips for best results
   - Maintenance instructions

4. **examples/** - Example convention files
   - `conventions-react-typescript.md` - React + TypeScript project example
   - `conventions-node-express.md` - Node.js + Express project example

**Key Features:**

- **Generic**: Removed all StackMap-specific references
- **Customizable**: Load project rules from `.atlas/conventions.md` and `.atlas/rejection-criteria.md`
- **Portable**: Works with any codebase
- **Evidence-based**: All verdicts require proof
- **Opus-powered**: Uses Claude Opus for deep analysis

**Differences from StackMap Version:**

Removed:
- StackMap store usage checks (useAppStore.setState violations)
- StackMap field naming checks (text/icon vs name/emoji)
- StackMap platform specifics (Typography component, FlexWrap, AsyncStorage)
- StackMap gray text accessibility rules (project-specific color choices)

Added:
- Generic state management patterns
- Generic naming convention checks
- Generic platform compatibility templates
- Customization system (.atlas/conventions.md and .atlas/rejection-criteria.md)
- Example convention files for common tech stacks

**Model:**
- Uses **Claude Opus** for adversarial review and deep analysis
- Recommended for blocking quality gates where thoroughness matters

**License:**
- Part of Atlas Framework
- Same license as Atlas Framework

---

## Migration Guide

### From StackMap-Specific to Generic

If you're using the StackMap-specific version and want to migrate:

1. Copy the generic skill to your project
2. Create `.atlas/conventions.md` with your project's coding standards
3. Create `.atlas/rejection-criteria.md` with your project's blocking issues
4. Update workflow invocations (no changes needed - same skill name)

### Adding Project-Specific Rules

To add rules from the StackMap version (or your own):

**conventions.md example:**
```markdown
## State Management
- Use store-specific methods (not setState)
- No direct state mutation

## Field Naming
- Use canonical field names (icon, not emoji)
- Include fallbacks for legacy fields
```

**rejection-criteria.md example:**
```markdown
## Store Usage (Critical)
- ❌ Direct `useAppStore.setState()` in new code
  ```bash
  grep -rn "useAppStore.setState" src/
  ```
```

---

## Future Enhancements

Potential additions for future versions:

1. **More examples** - Python, Go, Ruby, etc.
2. **CI/CD templates** - GitHub Actions, GitLab CI, Jenkins
3. **Metrics tracking** - Review quality, rejection rates, common issues
4. **Learning mode** - Suggest conventions based on codebase patterns
5. **Multi-language support** - Internationalized error messages
6. **Team dashboards** - Visualize review metrics and trends

---

## Contributing

To contribute improvements:

1. Fork the Atlas Framework repository
2. Make changes to the generic peer-reviewer skill
3. Test with multiple project types
4. Submit pull request with examples

---

## Support

For issues or questions:
- Check the main SKILL.md for protocol details
- Review resources/rejection-criteria.md for comprehensive blocking issues
- Consult Atlas documentation for workflow integration
- Open an issue in the Atlas Framework repository
