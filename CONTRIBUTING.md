# Contributing to StackMap

Thank you for your interest in contributing to StackMap! We're building a tool that makes a real difference in people's daily lives, and we welcome contributions from developers, designers, educators, and users.

## 🌟 How You Can Help

### For Everyone
- **Report bugs** - If something isn't working, let us know
- **Suggest features** - Share ideas that would make StackMap better
- **Improve documentation** - Help make our docs clearer
- **Share feedback** - Tell us about your experience using StackMap
- **Spread the word** - Help others discover StackMap

### For Developers
- **Fix bugs** - Pick an issue and dive in
- **Add features** - Implement new functionality
- **Improve tests** - Increase our test coverage
- **Optimize performance** - Make StackMap faster
- **Enhance accessibility** - Make StackMap work for everyone

## 🚀 Getting Started

### 1. Fork and Clone
```bash
# Fork the repository on GitHub, then:
git clone https://github.com/yourusername/StackMap.git
cd StackMap
npm install
```

### 2. Set Up Development Environment
```bash
# Run the setup script
./scripts/native-dev-setup.sh

# iOS setup
cd ios && pod install && cd ..

# Start developing
npm run web  # For web development
npm run ios  # For iOS
./scripts/react-native/run-android.sh  # For Android
```

### 3. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

## 📝 Development Guidelines

### Code Style
- We use ESLint and Prettier for consistent code formatting
- Run `npm run lint` before committing
- Run `npm run typecheck` for TypeScript validation
- Follow existing patterns in the codebase

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Type checking
npm run typecheck
```

**Important:** All tests must pass before submitting a PR.

### Platform Considerations
StackMap runs on iOS, Android, and Web. When making changes:
1. Test on all platforms when modifying shared code
2. Check platform-specific documentation in `/docs/platform/`
3. Be aware of platform differences (see `/docs/CROSS_PLATFORM_DEVELOPMENT.md`)

### Key Principles
- **Accessibility First** - No gray text, high contrast, large touch targets
- **User Privacy** - Zero-knowledge encryption, no tracking
- **Visual Clarity** - Clear icons and visual hierarchy
- **Performance** - Smooth animations, fast load times

## 🔄 Pull Request Process

### 1. Before You Submit
- [ ] Tests pass (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation is updated (if needed)
- [ ] Tested on relevant platforms
- [ ] Updated `PENDING_CHANGES.md` with your changes

### 2. PR Guidelines
- **Title**: Clear, descriptive title (e.g., "Fix: Timer not resetting after completion")
- **Description**: Explain what, why, and how
- **Screenshots**: Include before/after for UI changes
- **Testing**: Describe how you tested the changes
- **Related Issues**: Link to any related issues

### 3. PR Template
```markdown
## Summary
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Tested on Web
- [ ] Added/updated tests

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements left
- [ ] All tests passing
```

## 🐛 Reporting Issues

### Before Reporting
1. Check [existing issues](https://github.com/yourusername/StackMap/issues)
2. Try the latest version
3. Check the [troubleshooting guide](./TROUBLESHOOTING.md)

### Issue Template
```markdown
## Description
Clear description of the issue

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Platform: [iOS/Android/Web]
- Version: [app version]
- Device: [device model]
- OS Version: [OS version]

## Screenshots
(if applicable)
```

## 📚 Resources

### Documentation
- [Architecture Overview](./docs/architecture/README.md)
- [Development Guide](./docs/onboarding/new-developer-guide.md)
- [Field Conventions](./docs/features/field-conventions.md)
- [Testing Guide](./docs/testing/README.md)

### Important Files
- `CLAUDE.md` - AI assistant instructions and project context
- `docs/` - All documentation
- `scripts/` - Build and deployment scripts

### Key Technologies
- React Native 0.80.1
- TypeScript (gradual migration)
- Zustand for state management
- TweetNaCl for encryption

## 🏗️ Project Structure

```
StackMap/
├── src/               # React Native source code
│   ├── components/    # UI components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # Business logic
│   └── utils/         # Utility functions
├── ios/               # iOS native code
├── android/           # Android native code
├── web/               # Web-specific files
└── docs/              # Documentation
```

## 🤝 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

### Unacceptable Behavior
- Harassment or discriminatory language
- Personal attacks or trolling
- Publishing others' private information
- Other conduct that could be considered inappropriate

## 🙏 Recognition

Contributors are recognized in our:
- Contributors list on GitHub
- Release notes
- Special thanks in the app (with permission)

## 💬 Getting Help

- 💡 [Discussions](https://github.com/yourusername/StackMap/discussions) - General questions
- 🐛 [Issues](https://github.com/yourusername/StackMap/issues) - Bug reports
- 📧 [Email](mailto:support@stackmap.app) - Private concerns

## 📝 License

By contributing to StackMap, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make StackMap better for everyone! 💜**

Every contribution, no matter how small, helps us create better days through shared understanding.