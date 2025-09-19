# StackMap Architecture

## Overview

StackMap is a cross-platform activity tracking application built with React Native. It follows an offline-first architecture with optional encrypted sync capabilities.

## Core Architecture Principles

1. **Offline-First**: All functionality works without internet connection
2. **Cross-Platform**: Single codebase for iOS, Android, and Web
3. **Zero-Knowledge Sync**: Server never sees unencrypted user data
4. **Local-First Storage**: Data persisted locally with AsyncStorage
5. **Reactive State Management**: Zustand for centralized state

## System Components

### Frontend (React Native)

- **Components**: Reusable UI components with platform-specific adaptations
- **Stores**: Zustand-based state management
- **Services**: Business logic for sync, encryption, and data management
- **Utils**: Helper functions and data normalizers

### Backend (PHP API)

- **Sync API**: Handles encrypted blob storage and retrieval
- **Share API**: Manages temporary share links for providers
- **Health Endpoint**: Service availability checking

## Data Flow

### Local Data Flow
```
User Action → Component → Store Action → State Update → AsyncStorage → UI Update
```

### Sync Data Flow
```
Local Change → Change Tracker → Sync Queue → Encryption → API → Server
Server → API → Decryption → Conflict Resolution → Store Update → UI
```

## State Management

Using Zustand with the following stores:

- **useAppStore**: Compatibility wrapper combining all stores
- **useUserStore**: User management and activities
- **useSettingsStore**: Theme and UI preferences
- **useLibraryStore**: Activity templates and categories
- **useSyncStore**: Sync configuration and status

See [architecture/STATE_MANAGEMENT.md](./architecture/STATE_MANAGEMENT.md) for details.

## Data Structure

### User Object
```javascript
{
  id: string,
  name: string,
  icon: string,
  days: {
    today: { activities: Activity[] },
    tomorrow: { activities: Activity[] }
  },
  settings: UserSettings
}
```

### Activity Object
```javascript
{
  id: string,
  text: string,
  icon: string,
  completed: boolean,
  pinned: boolean,
  completedAt?: number,
  completedBy?: string
}
```

See [DATA_STRUCTURE.md](./DATA_STRUCTURE.md) for complete schema.

## Sync Architecture

### Zero-Knowledge Encryption

1. **Client-side encryption**: All data encrypted before leaving device
2. **Recovery phrase**: 32-character hex string for key derivation
3. **PBKDF2 key derivation**: 10,000 iterations for security
4. **NaCl secretbox**: Symmetric encryption for data blobs

### Sync Process

1. **Change detection**: Track local modifications
2. **Conflict resolution**: Last-write-wins or merge strategies
3. **Incremental updates**: Send only changes when possible
4. **Queue management**: Retry failed syncs with exponential backoff

See [ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md](./ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md) for details.

## Platform Differences

### iOS
- Native AsyncStorage with debouncing (performance)
- NetInfo disabled (causes freezes)
- Modal constraints for proper rendering

### Android
- FlexWrap requires percentage widths
- Special card layout handling
- External storage for exports

### Web
- LocalStorage via AsyncStorage polyfill
- No Alert.alert (uses ConfirmModal)
- Service Worker for offline support

## Security

- **Encryption at rest**: Optional PIN protection
- **Encryption in transit**: HTTPS only
- **Zero-knowledge sync**: Server never sees plaintext
- **No telemetry**: No tracking or analytics

## Performance Optimizations

- **Debounced persistence**: Prevent rapid AsyncStorage writes
- **Selective re-renders**: Component-level Zustand subscriptions
- **Lazy loading**: Components loaded on demand
- **Image optimization**: Icons stored as text (emoji)

## Deployment Architecture

### Branches
- `main`: Source code only
- `deploy-qual`: QA build artifacts
- `deploy-prod`: Production build artifacts

### Environments
- **Development**: Local development
- **Qual**: Testing environment (stackmap.app/qual)
- **Production**: Live environment (stackmap.app)

### CI/CD
- GitHub Actions for automated builds
- Script-based deployment via `qual_deploy.sh or prod_deploy.sh`
- Version auto-increment on deploy