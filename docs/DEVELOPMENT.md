# StackMap Development Guide

## Prerequisites

### Required Software
- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Git**: For version control

### Platform-Specific Requirements

#### iOS Development
- **macOS**: Required for iOS development
- **Xcode**: Version 14+ from App Store
- **CocoaPods**: Install via `sudo gem install cocoapods`
- **iOS Simulator**: Installed with Xcode

#### Android Development
- **Android Studio**: Latest stable version
- **Android SDK**: API Level 31+
- **Java JDK**: Version 17
- **Android Emulator**: Or physical device with USB debugging

#### Web Development
- **Modern browser**: Chrome, Firefox, Safari, or Edge
- **React DevTools**: Browser extension recommended

## Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/stackmap.git
cd stackmap
```

### 2. Install Dependencies
```bash
npm install
```

### 3. iOS Setup (macOS only)
```bash
cd ios
pod install
cd ..
```

### 4. Android Setup
1. Open Android Studio
2. Open AVD Manager
3. Create/start an emulator
4. Or connect physical device with USB debugging enabled

## Running the Application

### Start Metro Bundler
```bash
npm start
```

### Platform-Specific Commands
```bash
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator/device
npm run web        # Run in browser
```

### Development Mode Commands
```bash
npm run ios -- --device "iPhone 14"  # Specific simulator
npm run android -- --variant=debug   # Debug build
npm run web -- --port 3001          # Custom port
```

## Development Workflow

### Code Structure
```
src/
├── components/     # UI components
├── services/       # Business logic
│   └── sync/      # Sync service (TypeScript)
├── stores/        # Zustand state management
├── utils/         # Helper functions (TypeScript)
├── types/         # TypeScript definitions
└── constants/     # App constants
```

### TypeScript Migration
- Services and utilities are in TypeScript
- Components remain in JavaScript (gradual migration)
- Run `npm run typecheck` before committing

### Coding Standards

#### General Rules
1. **No console.log in production code** - Remove before committing
2. **Use meaningful variable names** - Be descriptive
3. **Comment complex logic** - Explain the "why"
4. **Follow existing patterns** - Consistency is key

#### Component Guidelines
- Use functional components with hooks
- Keep components focused and small
- Extract reusable logic to custom hooks
- Use proper prop validation

#### State Management
- Use Zustand stores for global state
- Component state for local UI state
- Avoid prop drilling - use stores

### Testing

#### Manual Testing Checklist
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test on web browser
- [ ] Test offline functionality
- [ ] Test sync with multiple devices
- [ ] Test theme switching
- [ ] Test import/export

#### Running Tests
```bash
npm test           # Run unit tests
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
```

### Debugging

#### React Native Debugger
1. Install React Native Debugger app
2. Run app in debug mode
3. Press Cmd+D (iOS) or Cmd+M (Android)
4. Select "Debug with Chrome"

#### Platform-Specific Debugging

**iOS**:
```bash
npx react-native log-ios
```

**Android**:
```bash
npx react-native log-android
adb logcat *:S ReactNative:V ReactNativeJS:V
```

**Web**:
- Use browser DevTools
- React DevTools extension

### Common Development Tasks

#### Adding a New Component
1. Create component file in `src/components/`
2. Follow naming convention (PascalCase)
3. Export from index.js if needed
4. Add TypeScript types if applicable

#### Modifying Store State
1. Update store in `src/stores/`
2. Add action method
3. Update TypeScript types in `src/types/stores.d.ts`
4. Test state persistence

#### Adding a New Feature
1. Create feature branch from `main`
2. Implement feature following patterns
3. Test on all platforms
4. Update documentation if needed
5. Create pull request

### Build Commands

#### Development Builds
```bash
npm run ios -- --configuration Debug
npm run android -- --variant=debug
npm run build:web
```

#### Production Builds
```bash
npm run ios -- --configuration Release
cd android && ./gradlew assembleRelease
NODE_ENV=production npm run build:web
```

## Troubleshooting

### Common Issues

#### iOS Build Fails
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios -- --reset-cache
```

#### Android Build Fails
```bash
cd android
./gradlew clean
cd ..
npm run android -- --reset-cache
```

#### Metro Bundler Issues
```bash
npx react-native start --reset-cache
watchman watch-del-all
```

#### Node Modules Issues
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commit Messages
```
feat: Add new feature
fix: Fix bug description
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### Pull Request Process
1. Create feature branch
2. Make changes and commit
3. Push to origin
4. Create PR with description
5. Address review comments
6. Merge after approval

## Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)