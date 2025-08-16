# StackMap Documentation

Welcome to the StackMap documentation! StackMap is a cross-platform activity tracking application built with React Native that runs on iOS, Android, and Web.

## Quick Start

1. **Prerequisites**
   - Node.js 18+
   - npm or yarn
   - For iOS: Xcode and CocoaPods
   - For Android: Android Studio and Android SDK

2. **Installation**
   ```bash
   npm install
   cd ios && pod install  # For iOS
   ```

3. **Running the app**
   ```bash
   npm start               # Start Metro bundler
   npm run ios            # Run on iOS
   npm run android        # Run on Android
   npm run web            # Run on Web
   ```

## Documentation Structure

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design, data flow, and technical architecture
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development setup, workflows, and coding guidelines
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - How to deploy to all platforms
- **[API.md](./API.md)** - Sync API documentation and endpoints
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

## Key Features

- **Multi-user support** - Track activities for multiple users
- **Cross-platform sync** - Zero-knowledge encrypted sync across devices
- **Offline-first** - Works without internet, syncs when connected
- **Activity templates** - Pre-built activity library with categories
- **Themes** - Multiple color themes for personalization
- **Import/Export** - Backup and restore data

## Tech Stack

- **React Native** - Cross-platform framework
- **Zustand** - State management
- **AsyncStorage** - Local data persistence
- **TweetNaCl** - Encryption for sync
- **React Navigation** - Navigation (mobile)
- **React Native Web** - Web platform support

## Project Structure

```
StackMap/
├── src/               # Source code
│   ├── components/    # React components
│   ├── services/      # Business logic (sync, encryption)
│   ├── stores/        # Zustand stores
│   ├── utils/         # Utilities
│   └── types/         # TypeScript definitions
├── ios/               # iOS native code
├── android/           # Android native code
├── web/               # Web-specific files
├── scripts/           # Build and deployment scripts
├── prompts/           # Development documentation
└── docs/              # User documentation
```

## Contributing

Please read [DEVELOPMENT.md](./DEVELOPMENT.md) for details on our development process and coding standards.

## Support

For issues and questions, please check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) first, then create an issue on GitHub.