# StackMap

A visual schedule app for managing daily activities, built with React Native for iOS, Android, and Web.

## 🚀 Quick Start

### Web Development
```bash
npm install
npm run web        # Start dev server on http://localhost:3001
npm run build:web  # Build for production
```

### Mobile Development
```bash
# iOS
npm run ios

# Android (requires Java 17 - see docs)
./scripts/react-native/run-android.sh
```

## 📁 Project Structure

```
StackMap/
├── src/               # React Native source code
│   ├── components/    # Reusable components
│   ├── constants/     # Theme, layout constants
│   ├── hooks/         # Custom React hooks
│   └── utils/         # Utility functions
├── ios/               # iOS native project
├── android/           # Android native project
├── web/               # Web-specific files
├── assets/            # Images, fonts, icons
├── scripts/           # Build and deployment scripts
├── docs/              # Documentation
│   ├── android/       # Android-specific docs
│   ├── ios/           # iOS-specific docs
│   ├── deployment/    # Deployment guides
│   └── development/   # Development guides
├── tools/             # Development tools
└── tests/             # Test suites
```

## 🛠️ Development

### Prerequisites
- Node.js 16+
- For iOS: Xcode 14+, CocoaPods

### ⚠️ Important: Cross-Platform Development

When updating shared components, **you must test on all platforms** (iOS, Android, Web) before committing. Changes that work on one platform may break on others.

See [Cross-Platform Development Guidelines](./docs/CROSS_PLATFORM_DEVELOPMENT.md) for detailed instructions.
- For Android: Java 17, Android Studio
- See [Environment Setup](https://reactnative.dev/docs/set-up-your-environment)

### First Time Setup
```bash
# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Run native development setup
./scripts/native-dev-setup.sh
```

### Key Scripts
- `npm run web` - Start web dev server
- `npm run build:web` - Build web for production
- `npm run ios` - Run iOS app
- `npm run android` - Run Android app
- `npm test` - Run tests

## 📱 Features

- Visual activity cards with timers
- Multi-user support with personalized themes
- Check-in system with mood and weather tracking
- Activity library with categories
- Drag-and-drop reordering
- Import/Export functionality
- Offline support (PWA)

## 📚 Documentation

- [Android Build Setup](./docs/android/ANDROID_BUILD_SETUP.md) - **Critical for Android builds**
- [iOS Development](./docs/ios/)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [All Documentation](./docs/)

## 🚀 Deployment

We use a branch-based deployment system. Build artifacts are kept separate from source code.

### Quick Deploy
```bash
# Deploy to staging (qual)
./scripts/deploy-with-tracking.sh qual

# Deploy to production
./scripts/deploy-with-tracking.sh prod
```

### Documentation
- [Deployment System](./docs/deployment/) - Full deployment documentation
- [Build Setup](./docs/deployment/DEPLOYMENT_BRANCH_SYSTEM.md) - Technical details

### Mobile Deployment
- iOS: See [App Store Distribution](./docs/deployment/DISTRIBUTION_GUIDE.md)
- Android: See [Google Play Setup](./docs/android/GOOGLE_PLAY_SETUP_GUIDE.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

Built with React Native and love for visual learners everywhere.