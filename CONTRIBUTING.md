# Contributing to StackMap

Thank you for your interest in contributing to StackMap! We welcome contributions from everyone, especially those with experience in accessibility and special needs.

## Code of Conduct

This project is dedicated to providing a welcoming and supportive environment for all. We expect all contributors to:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/stackmap/issues)
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the problem
   - Expected vs actual behavior
   - Screenshots if applicable
   - Device/browser information

### Suggesting Features

1. Check existing [Issues](https://github.com/yourusername/stackmap/issues) for similar suggestions
2. Create a new issue labeled "enhancement" with:
   - Clear description of the feature
   - Use cases and benefits
   - Any mockups or examples

### Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly on both mobile and desktop
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

1. Clone your fork:
```bash
git clone https://github.com/yourusername/stackmap.git
cd stackmap
```

2. Start a local server:
```bash
python -m http.server 8000
```

3. Open `http://localhost:8000` in your browser

## Coding Guidelines

### JavaScript
- Use ES6+ features
- Follow existing code style
- Add comments for complex logic
- Keep functions small and focused

### CSS
- Use existing CSS modules (don't create new files)
- Follow the CSS variable system
- Maintain responsive design
- Ensure accessibility (contrast, sizing)

### Accessibility Requirements
- Touch targets minimum 44x44px
- High contrast ratios (WCAG AA)
- Screen reader friendly
- Keyboard navigable
- Simple, predictable interactions

## Testing

Before submitting:

1. Test on multiple browsers (Chrome, Firefox, Safari)
2. Test on mobile devices
3. Test with keyboard navigation
4. Verify offline functionality
5. Check for console errors

## Documentation

- Update README.md if adding features
- Document complex functions
- Update CLAUDE.md for AI pair programming context

## Questions?

Feel free to:
- Open an issue for questions
- Reach out on our support page
- Join community discussions

Thank you for helping make StackMap better for families everywhere! 🌟