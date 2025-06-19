# StackMap

A visual routine builder designed to help families create and follow daily schedules, with special focus on accessibility for children with special needs.

![StackMap Logo](icon-192.png)

## Features

- **Visual Activity Cards**: Create colorful cards with emojis and descriptions for daily activities
- **Multiple User Support**: Each family member can have their own customized routine
- **Day-Specific Schedules**: Different activities for different days of the week
- **Completion Tracking**: Kids can tap cards to mark activities as complete
- **Customizable Themes**: Choose from various colors to personalize the experience
- **Grown-up Mode**: Protected editing mode for parents/caregivers
- **Offline Support**: Works without internet connection (Progressive Web App)
- **Data Sync**: Optional Google Drive sync for backup and sharing across devices

## Getting Started

### For Users

Visit [StackMap](https://stackmap.app) to start using the app immediately. No installation required!

### For Developers

1. Clone the repository:
```bash
git clone https://github.com/yourusername/stackmap.git
cd stackmap
```

2. Serve the files locally:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Or use any static file server
```

3. Open `http://localhost:8000` in your browser

## Technology Stack

- **Frontend**: Vanilla JavaScript with modern ES6+ features
- **Styling**: CSS with CSS Variables for theming
- **Storage**: LocalStorage for offline data persistence
- **PWA**: Service Worker for offline functionality
- **Architecture**: 100% client-side (no backend server)

## Architecture Note

StackMap is a **pure client-side application** with no backend server. This means:
- All code runs in the user's browser
- API keys in the code are intentional and necessary
- Security is enforced through Google API Console restrictions (domain-locking)
- This is standard practice for client-side applications

See [SECURITY.md](SECURITY.md) for detailed security information.
- **Sync**: Google Drive API for optional cloud backup

## Project Structure

```
StackMap/
├── app/                    # Core application files
│   ├── StackMapApp.js     # Main application logic
│   ├── PreferencesManager.js # Settings management
│   └── state.js           # State management
├── components/            # Reusable UI components
├── styles/               # Modular CSS files
├── js/                   # Additional JavaScript modules
├── data/                 # Default data and constants
├── docs/                 # Documentation
├── index.html           # Main application entry
├── manifest.json        # PWA manifest
└── sw.js               # Service Worker
```

## Design Philosophy

StackMap follows these key principles:

1. **Accessibility First**: Large touch targets, high contrast, simple interactions
2. **Visual Learning**: Emoji-based interface for non-readers
3. **Flexibility**: Adaptable to different family needs and routines
4. **Privacy**: All data stored locally by default, optional cloud sync
5. **Simplicity**: Clean, uncluttered interface focused on core functionality

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Guidelines

- Maintain the existing code style (Comic Relief font, rounded corners, etc.)
- Ensure all touch targets are at least 44px
- Test on both mobile and desktop viewports
- Preserve special needs accessibility features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Designed with input from families with special needs children
- Icons from Material Design Icons
- Built with love for the special needs community

## Support

- For bugs and feature requests, please [open an issue](https://github.com/yourusername/stackmap/issues)
- For questions, visit our [Support Page](https://stackmap.app/support.html)
- For direct support, email contact@stackmap.app

---

Made with ❤️ for families everywhere