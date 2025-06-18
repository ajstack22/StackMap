# Contributing to StackMap

Thank you for your interest in contributing to StackMap! We're building a tool to help families create visual routines, especially for children with special needs.

## How to Contribute

### Reporting Bugs
1. Check if the issue already exists
2. Use the bug report template
3. Include steps to reproduce
4. Add screenshots if applicable
5. Mention your browser and device

### Suggesting Features
1. Use the feature request template
2. Explain the problem it solves
3. Describe your ideal solution
4. Include mockups if possible

### Code Contributions

#### Setup
```bash
git clone https://github.com/ajstack22/StackMap.git
cd StackMap
npm install
```

#### Development Workflow
1. Create an issue first to discuss the change
2. Fork the repository
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Make your changes
5. Test thoroughly (see Testing section)
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

#### Coding Standards
- Use clear, descriptive variable names
- Comment complex logic
- Follow existing code style
- No `console.log` in production code
- Keep functions small and focused
- Use semantic HTML
- Ensure accessibility (ARIA labels, keyboard navigation)

#### CSS Guidelines
- Styles go in appropriate files (layout.css, cards.css, etc.)
- Use CSS variables for colors and spacing
- Mobile-first responsive design
- Avoid `!important` unless necessary
- No duplicate selectors across files

#### Testing
Before submitting:
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test on mobile devices
- Test offline functionality
- Test with multiple users
- Verify sync works correctly
- Check for console errors

#### Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Be descriptive but concise
- Reference issue numbers (#123)
- Use conventional commits if possible:
  - `feat:` New feature
  - `fix:` Bug fix
  - `docs:` Documentation only
  - `style:` Formatting, no code change
  - `refactor:` Code change that doesn't fix or add
  - `test:` Adding tests
  - `chore:` Maintenance

### Pull Request Process
1. Update documentation if needed
2. Ensure all tests pass
3. Request review from @ajstack22
4. Address review feedback
5. Squash commits if requested

## Development Tips

### Running Locally
```bash
# Install a local server
npm install -g http-server

# Run from project root
http-server -p 5500

# Visit http://localhost:5500
```

### Debugging Sync
- Check Application > Local Storage in DevTools
- Look for `stackmap-sync-queue`
- Monitor Network tab for Google Drive API calls

### Testing Demo Mode
Visit `/demo` to see the Mushroom Kingdom demo data

## Questions?
- Open an issue for questions
- Email support@stackmap.app for sensitive matters

Thank you for helping make StackMap better! 🎉