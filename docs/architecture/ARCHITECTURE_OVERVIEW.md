# StackMap Architecture Overview
*Claude-readable technical specification - Last updated: 2025-08-14*

## Application Type
React Native cross-platform application supporting iOS, Android, and Web platforms with unified codebase

## Core Technology Stack

### Frontend
- **Framework**: React Native 0.72.x with React 18.2.x
- **State Management**: Zustand 4.x with AsyncStorage persistence
- **Navigation**: Modal-based single-screen architecture (no React Navigation)
- **Styling**: StyleSheet with platform-specific adaptations
- **Typography**: Custom Comic Relief font with fallback system

### Platform Support
- **iOS**: Native builds via Xcode, supports iPhone/iPad
- **Android**: Gradle builds, supports phones/tablets
- **Web**: Webpack bundle, PWA-ready with responsive design

### Storage & Persistence
- **Primary Storage**: AsyncStorage (all platforms)
- **Debounced Writes**: 1-second debounce to prevent iOS freezes
- **Storage Key**: `stackmap-storage` for main state
- **PIN Storage**: Secure storage using platform-specific methods

## Application Architecture

### Component Structure
```
App.js                          # Main application entry, 5000+ lines
├── src/components/            # UI components
│   ├── EditModeList/         # New unified edit interface (Jan 2025)
│   ├── Modals/              # All modal components
│   ├── ActivityLibrary/     # Template system
│   ├── Typography/          # Text components with forced font
│   └── [40+ other components]
├── src/services/            # Business logic
│   └── sync/               # Sync service modules
├── src/stores/             # Zustand state management
├── src/hooks/              # React hooks
├── src/constants/          # Shared constants
└── src/utils/              # Helper functions
```

### State Architecture
- **Single Store**: `useAppStore` manages all application state
- **Store Sections**:
  - `users`: User profiles and activities
  - `currentUser`: Active user ID
  - `library`: Activity templates and categories
  - `settings`: Global preferences
  - `sync`: Sync configuration and state
  - `ui`: Transient UI state

### Data Flow Pattern
1. **User Action** → Component event handler
2. **State Update** → Zustand store action
3. **Persistence** → Debounced AsyncStorage write
4. **Re-render** → React component update
5. **Sync** → Optional background sync if enabled

## Key Architectural Decisions

### Single-Screen Modal Architecture
- **No navigation library** - All screens are modals
- **Root App.js** manages all modal visibility states
- **Modal stack** handled through boolean state flags
- **Platform-specific presentation** (pageSheet on iOS)

### Edit Mode Refactor (January 2025)
- **Unified list-based interface** replaces drag-and-drop
- **Button-based reordering** for accessibility
- **Cross-platform consistency** with EditModeList component
- **Progressive disclosure** with expand/collapse states

### Platform-Specific Adaptations
```javascript
// Critical platform differences
iOS: {
  dragAndDrop: disabled,  // Causes crashes
  asyncStorage: debounced, // 20+ second freezes without
  modals: pageSheet,       // Native presentation
  fonts: boldWeight700     // System font weights
}

Android: {
  flexWrap: percentageWidths, // 48% for cards
  elevation: material,        // Shadow system
  backButton: handled,        // Hardware back
  fonts: normalWeightBold    // Font family bold
}

Web: {
  vectorIcons: spanElements,  // Not Text components
  alerts: customModal,        // No Alert.alert
  builds: rootDirectory,      // Not web/build/
  fonts: slightlySmaller     // Desktop optimization
}
```

### Performance Optimizations
- **Debounced Storage**: 1-second delay prevents iOS blocking
- **React.memo**: All list items memoized
- **Lazy Loading**: Modals loaded on-demand
- **Virtual Lists**: FlatList for large datasets
- **Image Optimization**: Platform-specific sizing

## Data Models

### User Model
```javascript
{
  id: `user_${timestamp}_${index}`,
  name: string,
  icon: string,  // Unicode emoji
  days: {
    today: { activities: Activity[] },
    tomorrow: { activities: Activity[] }
  },
  settings: UserSettings,
  createdAt: ISO8601,
  lastActive: ISO8601
}
```

### Activity Model
```javascript
{
  id: `activity_${timestamp}_${random}`,
  text: string,
  emoji: string,
  type: 'task' | 'routine',
  completed: boolean,
  order: number,
  userId: string,
  parentId?: string,  // For subtasks
  metadata?: {
    createdAt: ISO8601,
    completedAt?: ISO8601,
    source?: string
  }
}
```

### Export Format (v3)
```javascript
{
  version: 3,
  exportDate: ISO8601,
  users: UserMap,
  currentUser: string,  // CRITICAL field
  activityCards: Activity[],
  templates: TemplateMap,
  globalSettings: Settings
}
```

## Critical System Behaviors

### Initialization Sequence
1. Load AsyncStorage state
2. Run data migrations if needed
3. Check onboarding status
4. Initialize sync if configured
5. Render UI with hydrated state

### User Management Rules
- **Dynamic IDs only** - No hardcoded user IDs
- **No .trim() on emojis** - Breaks Unicode
- **Multiple same-name users** allowed
- **Default name context-dependent**

### Storage Management
- **Clear ALL keys on reset** using getAllKeys()
- **Validate before persistence**
- **Handle corrupted data** gracefully
- **Debounce rapid updates**

### Sync System Integration
- **Zero-knowledge encryption** standard
- **32-char hex recovery phrases**
- **Automatic conflict resolution**
- **Background sync with throttling**

## Platform Gotchas

### iOS Critical Issues
- **AsyncStorage freeze**: 20+ seconds without debounce
- **NetInfo.fetch()**: Disabled, causes freezes
- **Modal flex rules**: Must constrain to prevent expansion
- **Drag gestures**: Conflict with ScrollView

### Android Requirements
- **FlexWrap cards**: Must use 48% width
- **No calculateCardWidth()**: For multi-column
- **Hardware back**: Must handle in modals
- **Permissions**: Storage access for exports

### Web Limitations
- **No Alert.alert**: Use ConfirmModal
- **Vector icons**: Must use span elements
- **Build location**: Root directory for deployment
- **Font loading**: Async with fallbacks

## Deployment Architecture

### Branch Strategy
- `main`: Source code only
- `deploy-qual`: Qual artifacts
- `deploy-prod`: Production artifacts

### Version Format
`YYYY.MM.DD.BUILD` across all platforms

### Deployment Scripts
All in `/scripts/` directory:
- `deploy-all.sh`: Master deployment
- Platform-specific scripts
- Auto version increment

## Security & Privacy

### Data Protection
- **Local-first**: All data on device
- **Zero-knowledge sync**: Server can't read data
- **No analytics**: Privacy by design
- **PIN protection**: Platform secure storage

### Encryption
- **PBKDF2**: 100,000 iterations (NEVER CHANGE)
- **AES-256-GCM**: For sync data
- **Recovery phrases**: 32 hex characters

## Performance Targets

### Load Times
- **Cold start**: < 2 seconds
- **Modal open**: < 100ms
- **Sync operation**: < 3 seconds
- **Export/Import**: < 5 seconds

### Bundle Sizes
- **Web JS**: < 200KB initial
- **iOS**: < 50MB installed
- **Android**: < 30MB APK

## Known Architectural Debt

### Technical Debt
- **App.js size**: 5000+ lines needs splitting
- **Modal state management**: Boolean flags scattered
- **Platform conditionals**: Throughout codebase
- **Style duplication**: Needs consolidation

### Future Refactors
- **Data structure refactor**: Planned (see docs)
- **Component extraction**: From App.js
- **TypeScript migration**: Under consideration
- **State normalization**: For better performance

## Development Constraints

### Must Never Change
- **Sync encryption iterations**: 100,000
- **Export format version**: Backward compatible
- **Storage keys**: Without migration
- **Recovery phrase format**: 32 hex chars

### Always Required
- **Platform testing**: All three before deploy
- **Accessibility**: Black text, high contrast
- **Offline support**: Core features work offline
- **Data validation**: Before storage/sync