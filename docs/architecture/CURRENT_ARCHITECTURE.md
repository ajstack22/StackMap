# StackMap Current Architecture
**Last Updated:** August 2025

## Overview
StackMap is a React Native application that runs on iOS, Android, and Web platforms. The app helps users manage daily activities and routines with a focus on simplicity and accessibility.

## Technology Stack

### Core
- **React Native** 0.72.x - Cross-platform mobile framework
- **React** 18.x - UI library
- **Expo** (for web build) - Platform extensions
- **TypeScript** - Gradual migration in progress with @ts-check

### State Management
- **Zustand** 4.x - State management (4 focused stores)
- **AsyncStorage** - Persistent storage with debounced writes
- **Store Architecture** - Modular design with compatibility wrapper

### Platform-Specific
- **iOS**: Native modules, Xcode build system
- **Android**: Gradle build system, Java/Kotlin interop
- **Web**: Webpack bundler, web-specific polyfills

## Application Architecture

### Component Hierarchy
```
App.js (Root Component)
├── Navigation/Routing
├── Onboarding Flow
├── Main App Container
│   ├── Header/Banner
│   ├── User Selector
│   ├── Activity Lists (Today/Tomorrow)
│   ├── Activity Cards
│   └── Modals
└── Background Services (Sync)
```

### Store Architecture (Modular Zustand)

The app uses 4 focused stores with a compatibility wrapper:

1. **useUserStore** (`/src/stores/useUserStore.js`)
   - User management and activities
   - Current user/day selection
   - User context data

2. **useSettingsStore** (`/src/stores/useSettingsStore.js`)
   - Theme and display settings
   - Celebration configurations
   - Onboarding state

3. **useLibraryStore** (`/src/stores/useLibraryStore.js`)
   - Activity templates
   - Library categories
   - User-added activities

4. **useSyncStore** (`/src/stores/useSyncStore.js`)
   - Sync configuration
   - Sync status tracking
   - Error handling

5. **useAppStore** (`/src/stores/useAppStore.js`)
   - Compatibility wrapper (delegates to sub-stores)
   - ⚠️ **Never use setState() on this store**

### Data Flow

#### User Actions
1. User interacts with UI component
2. Component calls store action directly
3. Store updates state and triggers re-render
4. AsyncStorage persists changes (debounced)
5. Sync service queues changes (if enabled)

#### Data Persistence
```
User Action → Store Update → AsyncStorage (debounced) → Sync Queue
                    ↓
              Component Re-render
```

### Key Services

#### Sync Service (`/src/services/sync/`)
- Zero-knowledge encryption with NaCl
- 32-character hex recovery phrases
- Last-write-wins conflict resolution
- Automatic 30-second periodic sync
- Offline queue support

#### Data Normalizer (`/src/utils/dataNormalizer.js`)
- Handles field name variations
- Activities: `text` (not name/title), `icon` (not emoji)
- Users: `icon` (not emoji), `name` as string only
- Provides migration support

#### Typography System (`/src/components/Typography.js`)
- Forces Comic Relief font everywhere
- Platform-specific font handling:
  - iOS/Web: Uses fontWeight with base font
  - Android: Uses font variants without fontWeight

## Platform-Specific Considerations

### iOS
- AsyncStorage freezing issues (20+ seconds) - debounced
- Modal presentation styles (pageSheet)
- Specific ScrollView behavior in modals
- Native font rendering

### Android
- FlexWrap requires percentage widths (48%)
- No calculateCardWidth() for multi-column layouts
- Font weights use variants (ComicRelief-Bold)
- alignContent: 'flex-start' for card layouts

### Web
- VectorIcons must use `<span>` not `<Text>`
- Alert.alert not supported (use ConfirmModal)
- Build output goes to root for qual deployment
- Webpack configuration for bundling

## Component Patterns

### Activity Cards
- Unified EditModeList component (Jan 2025)
- Button-based reordering (no drag & drop)
- Max width constraints for readability
- 200ms fade animations

### Modals
- Standard header with theme.primary background
- Panel-based designs for sync modals
- No footer buttons for certain modal types
- SafeAreaView wrapper for mobile

### Forms
- Controlled components with local state
- Validation on submit
- Error states with red highlighting
- Accessibility labels required

## Deployment Architecture

### Build Process
- `./scripts/deploy-all.sh` - Main deployment script
- Automatic version incrementing
- Platform-specific builds
- Test suite integration

### Branch Strategy
- `main` - Source code only
- `deploy-qual` - Qual build artifacts
- `deploy-prod` - Production build artifacts

### Environment Configuration
- Development: Local Metro bundler
- Qual: stackmap.app/qual
- Production: stackmap.app

## Security & Privacy

### Data Protection
- Zero-knowledge sync encryption
- No analytics or tracking
- Local-first data storage
- Optional cloud sync only

### Sync Security
- PBKDF2 with 100,000 iterations
- NaCl secretbox encryption
- Server never sees unencrypted data
- Recovery phrase never transmitted

## Performance Optimizations

### React Native
- Component memoization (React.memo)
- Lazy loading for heavy components
- Image optimization and caching
- Debounced storage writes

### Platform-Specific
- iOS: Reduced animation complexity
- Android: Percentage-based layouts
- Web: Code splitting and lazy loading

## Testing Strategy

### Current Approach
- Manual testing checklist
- Platform-specific test scenarios
- Deployment test suite
- User acceptance testing

### Test Coverage Areas
- User management flows
- Activity CRUD operations
- Import/Export functionality
- Sync operations
- Platform-specific features

## Known Limitations

### Technical Debt
- Migration code for old data structures
- Mixed TypeScript adoption
- Some inconsistent patterns

### Platform Constraints
- iOS AsyncStorage performance
- Android font rendering quirks
- Web Alert.alert compatibility

## Future Architecture Goals

### Short-term
- Complete TypeScript migration
- Improve test coverage
- Optimize bundle sizes

### Long-term
- Native module optimization
- Enhanced offline capabilities
- Performance monitoring

## References

- [Store Architecture Details](/docs/STORE_ARCHITECTURE.md)
- [Deployment Guide](/docs/deployment/README.md)
- [Sync Documentation](/docs/sync/README.md)
- [Testing Guide](/docs/testing/simple-testing-guide.md)
- [CLAUDE.md](/CLAUDE.md) - Essential development guide