# StackMap JavaScript Dependency Analysis

## Overview
StackMap uses a traditional script-based architecture without ES6 modules. All JavaScript files are loaded via `<script>` tags in a specific order and communicate through global objects on the `window`.

## Loading Order (from index.html)
1. **Utilities** → 2. **Configuration** → 3. **Data** → 4. **Core** → 5. **Managers** → 6. **Components** → 7. **Main App**

## Detailed File Analysis

### 1. Root Level JavaScript Files

#### `/dev-tools.js`
- **Type**: Development Utility (not loaded in production)
- **Dependencies**: None
- **Dependents**: None
- **External APIs**: Navigator (Service Worker), IndexedDB
- **Purpose**: Development tools for cache management and debugging
- **Status**: Active (development only)

#### `/env-loader.js`
- **Type**: Configuration Loader
- **Dependencies**: None
- **Dependents**: `drive-sync.js` (reads window.STACKMAP_GOOGLE_CLIENT_ID/API_KEY)
- **External APIs**: None
- **Purpose**: Sets Google API credentials as window variables
- **Status**: Active

#### `/sw.js`
- **Type**: Service Worker
- **Dependencies**: None (runs in separate context)
- **Dependents**: None
- **External APIs**: Service Worker API, Cache API
- **Purpose**: PWA offline functionality and caching
- **Status**: Active

#### `/state.js`
- **Type**: Core Module
- **Dependencies**: 
  - `config/constants.js` (CONFIG object)
- **Dependents**: 
  - `app/StackMapApp.js`
  - `renderer.js`
  - `components.js`
- **External APIs**: None
- **Purpose**: Application state management
- **Exports**: `AppState` class
- **Status**: Active

#### `/components.js`
- **Type**: Core Module
- **Dependencies**:
  - `data/emoji-list.js` (EMOJIS)
  - `data/emoji-names.js` (EMOJI_NAMES)
  - `config/constants.js` (CONFIG)
- **Dependents**:
  - `renderer.js`
  - `app/StackMapApp.js`
  - `js/HybridPanelManager.js`
  - `components/ModernUserSelector.js`
  - `components/ModernDaySelector.js`
- **External APIs**: None
- **Purpose**: UI component builders and utilities
- **Exports**: `ComponentBuilder`, `ActivityCard`, `EditModeFAB`, `DataManagementPanel`, card type constants
- **Status**: Active

#### `/renderer.js`
- **Type**: Core Module
- **Dependencies**:
  - `state.js` (AppState)
  - `components.js` (ComponentBuilder, ActivityCard)
  - `config/constants.js` (CONFIG)
- **Dependents**:
  - `app/StackMapApp.js`
- **External APIs**: DOM API
- **Purpose**: Renders UI based on app state
- **Exports**: `AppRenderer` class
- **Status**: Active

#### `/drive-sync.js`
- **Type**: Core Module/Manager
- **Dependencies**:
  - `env-loader.js` (for Google credentials)
  - `config/constants.js` (CONFIG)
- **Dependents**:
  - `app/StackMapApp.js`
- **External APIs**: 
  - Google Drive API
  - Google Identity Services
  - gapi client library
- **Purpose**: Google Drive synchronization
- **Exports**: `GoogleDriveSync` class
- **Status**: Active

### 2. /app Directory

#### `/app/StackMapApp.js`
- **Type**: Main Application Controller
- **Dependencies**:
  - `state.js` (AppState)
  - `renderer.js` (AppRenderer)
  - `drive-sync.js` (GoogleDriveSync)
  - `app/PreferencesManager.js` (PreferencesManager)
  - `config/constants.js` (CONFIG)
  - `data/default-activities.js` (DEFAULT_ACTIVITIES)
  - `components.js` (ComponentBuilder, EditModeFAB, DataManagementPanel)
- **Dependents**: None (main entry point)
- **External APIs**: LocalStorage, DOM API
- **Purpose**: Main application controller and coordinator
- **Exports**: `StackMapApp` class
- **Status**: Active

#### `/app/PreferencesManager.js`
- **Type**: Manager (Deprecated)
- **Dependencies**: None
- **Dependents**: 
  - `app/StackMapApp.js` (creates instance but functionality disabled)
- **External APIs**: DOM API
- **Purpose**: Legacy preferences panel management
- **Exports**: `PreferencesManager` class
- **Status**: Deprecated (replaced by HybridPanelManager)

### 3. /js Directory

#### `/js/HybridPanelManager.js`
- **Type**: Manager
- **Dependencies**:
  - `config/constants.js` (CONFIG)
  - `config/themes.js` (THEMES)
  - `components.js` (ComponentBuilder)
  - `utils/security.js` (SecurityUtils)
- **Dependents**:
  - Initialized in index.html after StackMapApp
- **External APIs**: DOM API, LocalStorage
- **Purpose**: Modern panel system for preferences and management
- **Exports**: `HybridPanelManager` class
- **Status**: Active

#### `/js/CelebrationManager.js`
- **Type**: Manager
- **Dependencies**: None
- **Dependents**:
  - `app/StackMapApp.js` (creates instance)
- **External APIs**: DOM API, CSS animations
- **Purpose**: Handles task completion celebrations
- **Exports**: `CelebrationManager` class
- **Status**: Active

### 4. /components Directory

#### `/components/DraggableDrawer.js`
- **Type**: UI Component
- **Dependencies**:
  - `components.js` (ComponentBuilder)
- **Dependents**:
  - `app/StackMapApp.js` (creates instances)
- **External APIs**: DOM API, Touch/Mouse events
- **Purpose**: Draggable drawer UI component
- **Exports**: `DraggableDrawer` class
- **Status**: Active

#### `/components/ModernDaySelector.js`
- **Type**: UI Component
- **Dependencies**:
  - `components.js` (ComponentBuilder)
- **Dependents**:
  - `app/StackMapApp.js` (creates instance)
- **External APIs**: DOM API, CSS.supports
- **Purpose**: Day selection UI (Today/Tomorrow)
- **Exports**: `ModernDaySelector` class
- **Status**: Active

#### `/components/ModernUserSelector.js`
- **Type**: UI Component
- **Dependencies**:
  - `components.js` (ComponentBuilder)
- **Dependents**:
  - `app/StackMapApp.js` (creates instance)
- **External APIs**: DOM API, CSS.supports
- **Purpose**: User profile selection UI
- **Exports**: `ModernUserSelector` class
- **Status**: Active

### 5. /utils Directory

#### `/utils/security.js`
- **Type**: Utility
- **Dependencies**: None
- **Dependents**:
  - `js/HybridPanelManager.js`
- **External APIs**: None
- **Purpose**: Security utilities for HTML escaping
- **Exports**: `SecurityUtils` object (escapeHtml, safeHtml, sanitizeUserInput)
- **Status**: Active

### 6. /config Directory

#### `/config/index.js`
- **Type**: Documentation Only
- **Dependencies**: N/A
- **Dependents**: N/A
- **Purpose**: Architecture documentation
- **Status**: Documentation file

#### `/config/constants.js`
- **Type**: Configuration
- **Dependencies**: None
- **Dependents**: Almost all files use CONFIG object
- **External APIs**: None
- **Purpose**: Core application constants
- **Exports**: `CONFIG` object
- **Status**: Active

#### `/config/themes.js`
- **Type**: Configuration
- **Dependencies**: None
- **Dependents**:
  - `js/HybridPanelManager.js`
- **External APIs**: None
- **Purpose**: Theme color definitions
- **Exports**: `THEMES` object
- **Status**: Active

### 7. /data Directory

#### `/data/default-activities.js`
- **Type**: Data
- **Dependencies**: None
- **Dependents**:
  - `app/StackMapApp.js`
- **External APIs**: None
- **Purpose**: Default activity templates
- **Exports**: `DEFAULT_ACTIVITIES`, `ACTIVITY_CATEGORIES`, `ACTIVITY_LIBRARY`
- **Status**: Active

#### `/data/emoji-list.js`
- **Type**: Data
- **Dependencies**: None
- **Dependents**:
  - `components.js`
- **External APIs**: None
- **Purpose**: Comprehensive emoji list
- **Exports**: `EMOJIS` array
- **Status**: Active

#### `/data/emoji-names.js`
- **Type**: Data
- **Dependencies**: None
- **Dependents**:
  - `components.js`
- **External APIs**: None
- **Purpose**: Emoji search keywords
- **Exports**: `EMOJI_NAMES` object
- **Status**: Active

## Global Objects Created

1. **Window Properties**:
   - `window.appInstance` - Main StackMapApp instance
   - `window.hybridPanelManager` - HybridPanelManager instance
   - `window.CONFIG` - Configuration constants
   - `window.THEMES` - Theme colors
   - `window.EMOJIS` - Emoji list
   - `window.EMOJI_NAMES` - Emoji keywords
   - `window.DEFAULT_ACTIVITIES` - Default activities
   - `window.SecurityUtils` - Security utilities
   - `window.ComponentBuilder` - Component builder class
   - `window.GoogleDriveSync` - Drive sync class
   - `window.StackMapDev` - Development tools

## Key Observations

1. **No ES6 Modules**: All files use global scope and script tags
2. **Clear Hierarchy**: Configuration → Data → Core → Components → App
3. **Minimal External Dependencies**: Only Google APIs for Drive sync
4. **Component Communication**: Through shared state object and global instances
5. **No Circular Dependencies**: Clean dependency tree
6. **No Orphaned Files**: All JavaScript files are actively used except dev-tools.js (development only)

## Deprecated/Replaced Components

1. **PreferencesManager.js**: Still loaded but functionality disabled, replaced by HybridPanelManager
2. **Management cards in components.js**: Replaced by FAB system but code remains for reference

## External Service Dependencies

1. **Google Drive API**: For data synchronization (optional feature)
2. **Google Identity Services**: For OAuth authentication
3. **Service Worker API**: For PWA functionality
4. **LocalStorage**: For local data persistence
5. **IndexedDB**: Referenced in dev-tools but not used in production