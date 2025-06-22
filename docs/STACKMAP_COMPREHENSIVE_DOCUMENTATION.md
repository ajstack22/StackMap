# StackMap Comprehensive Application Documentation

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture](#architecture)
4. [Data Models](#data-models)
5. [API and Services](#api-and-services)
6. [User Interface Components](#user-interface-components)
7. [State Management](#state-management)
8. [Authentication and Security](#authentication-and-security)
9. [Deployment and Configuration](#deployment-and-configuration)
10. [Testing Strategy](#testing-strategy)
11. [Development Guidelines](#development-guidelines)
12. [Mobile Applications](#mobile-applications)
13. [Progressive Web App](#progressive-web-app)
14. [Performance Considerations](#performance-considerations)
15. [Troubleshooting Guide](#troubleshooting-guide)

---

## 1. Executive Summary

StackMap is a visual routine management application designed specifically for families with special needs children. It provides an accessible, intuitive interface for creating and managing daily routines through visual activity cards with emoji representations.

### Key Features
- **Visual Activity Cards**: Colorful, emoji-based cards for each activity
- **Multi-User Support**: Up to 6 family members with individual routines
- **Day-Specific Schedules**: Different activities for different days
- **Completion Tracking**: Interactive cards with celebration animations
- **Offline-First Design**: Full functionality without internet
- **Google Drive Sync**: Optional cloud backup and cross-device sync
- **Progressive Web App**: Installable on all platforms
- **Special Needs Focused**: Large touch targets, high contrast, simple interactions

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+) with no frameworks
- **Styling**: Modular CSS with CSS Variables
- **Storage**: LocalStorage with optional Google Drive sync
- **PWA**: Service Worker for offline functionality
- **Mobile**: Capacitor for iOS/Android native apps
- **Architecture**: 100% client-side, no backend server

---

## 2. System Overview

### Application Flow

```
User Entry → Splash Screen → Main Interface → Activity Cards → Completion Tracking
                ↓                   ↓              ↓               ↓
           Local Storage    User Selection   Drag & Drop    Celebrations
                ↓                   ↓              ↓               ↓
          Google Drive Sync   Day Selection   Card Library   Progress View
```

### Core Components

1. **StackMapApp** (`app/StackMapApp.js`): Main application controller
2. **AppState** (`state.js`): Centralized state management
3. **AppRenderer** (`renderer.js`): UI rendering engine
4. **GoogleDriveSync** (`drive-sync.js`): Cloud synchronization
5. **HybridPanelManager** (`js/HybridPanelManager.js`): Settings and management panels
6. **CelebrationManager** (`js/CelebrationManager.js`): Animation system
7. **Service Worker** (`sw.js`): Offline functionality

### File Organization

```
StackMap/
├── index.html                 # Entry point
├── app/                       # Core application logic
│   └── StackMapApp.js        # Main controller
├── config/                    # Configuration files
│   ├── constants.js          # App constants and settings
│   └── themes.js             # Color themes
├── data/                      # Static data
│   ├── default-activities.js # Template activities
│   ├── emoji-list.js         # Complete emoji set
│   └── emoji-names.js        # Searchable keywords
├── js/                        # JavaScript modules
│   ├── HybridPanelManager.js # Panel system
│   ├── CelebrationManager.js # Animations
│   ├── DynamicMenuSystem.js  # Context menus
│   └── MenuConfigurations.js # Menu definitions
├── styles/                    # Modular CSS
│   ├── index.css             # Main stylesheet
│   ├── base.css              # Typography
│   ├── layout.css            # Positioning
│   ├── cards.css             # Activity cards
│   └── [other modules]       # Component styles
├── components/                # UI components
│   ├── DraggableDrawer.js    # Mobile drawer
│   └── [selectors]           # User/day selectors
└── [platform folders]         # iOS, Android, PWA files
```

---

## 3. Architecture

### Design Principles

1. **Vanilla JavaScript Only**: No frameworks or build process for maximum reliability
2. **Special Needs First**: Every decision prioritizes accessibility
3. **Offline Resilience**: Full functionality without internet
4. **Progressive Enhancement**: Core features work everywhere, enhanced features when available

### Application Layers

```
┌─────────────────────────────────────────┐
│          User Interface Layer           │
│  (HTML, CSS, Vanilla JavaScript)        │
├─────────────────────────────────────────┤
│         Component Layer                 │
│  (ActivityCard, EmojiPicker, Modal)     │
├─────────────────────────────────────────┤
│         State Management Layer          │
│  (AppState, Operation Log, Sync Queue)  │
├─────────────────────────────────────────┤
│         Storage Layer                   │
│  (LocalStorage, IndexedDB, Google Drive)│
├─────────────────────────────────────────┤
│         Service Layer                   │
│  (Service Worker, PWA, Offline Cache)   │
└─────────────────────────────────────────┘
```

### Module Loading Strategy

```javascript
// No ES6 imports - uses script tags for compatibility
<script src="config/constants.js"></script>
<script src="data/emoji-list.js"></script>
<script src="state.js"></script>
<script src="components.js"></script>
<script src="app/StackMapApp.js"></script>
```

All modules use global `window` object for cross-file communication.

### Event Flow

1. **User Interaction** → DOM Event
2. **Event Handler** → StackMapApp method
3. **State Update** → AppState mutation
4. **Persistence** → LocalStorage + Sync Queue
5. **UI Update** → AppRenderer refresh
6. **Animation** → CelebrationManager (if needed)

---

## 4. Data Models

### Core Data Structures

#### Activity Model
```javascript
{
    id: "act-1234567890-abc",          // Unique identifier
    emoji: "🎨",                       // Visual representation
    title: "Art Time",                 // Activity name (max 13 chars)
    description: "Draw and paint",     // Details (max 50 chars)
    backgroundColor: "#667eea",        // Custom color
    completed: false,                  // Completion status
    cardNumber: 1,                     // Display order
    userId: "default",                 // Owner reference
    dayContext: "today",               // today/tomorrow
    time: "09:00",                     // Optional time
    recurring: true,                   // Card type flag
    libraryCard: false,                // Is template
    createdAt: "2025-06-21T10:00:00Z",
    updatedAt: "2025-06-21T10:00:00Z"
}
```

#### User Profile Model
```javascript
{
    id: "user-1234567890-xyz",         // Unique identifier
    name: "Sarah",                     // Display name (max 20 chars)
    icon: "👧",                        // User emoji
    activities: [],                    // Today's activities
    tomorrowActivities: [],            // Tomorrow's activities
    settings: {
        title: "Sarah",                // Header title
        subtitle: "Ready to Learn",    // Header subtitle
        backgroundColor: "#667eea",    // Theme color
        showNumbers: true,             // Display card numbers
        showCompletionIndicators: true // Show checkmarks
    },
    library: [],                       // Personal card templates
    createdAt: "2025-06-21T10:00:00Z"
}
```

#### Application State Model
```javascript
{
    version: "1.0",                    // Data version
    users: {
        currentUserId: "default",      // Active user
        profiles: {                    // User dictionary
            "default": {...},
            "user-123": {...}
        },
        groupLibrary: []               // Shared templates
    },
    settings: {                        // Global settings
        autoSync: true,
        backupReminder: true
    },
    ui: {                              // UI state
        editMode: false,
        currentDay: "today",
        cardFilter: "",
        selectedEmoji: "⭐"
    },
    syncMetadata: {                    // Sync tracking
        version: 0,
        lastModified: "2025-06-21T10:00:00Z",
        deviceId: "device-abc123",
        deviceName: "Sarah's iPad"
    }
}
```

### Storage Schema

#### LocalStorage Keys
```javascript
// Main application data
"stackmap-data"           // Complete app state
"stackmap-data-demo"      // Demo mode data

// Sync and metadata
"stackmap-sync-queue"     // Pending sync operations
"stackmap-device-id"      // Unique device identifier
"stackmap-google-token"   // OAuth token (encrypted)
"stackmap-last-sync"      // Last sync timestamp

// User preferences
"stackmap-theme"          // Selected color theme
"stackmap-tutorial-seen"  // Tutorial completion flag
"ios-nav-shown"           // iOS navigation hint
```

#### Operation Log Entry
```javascript
{
    id: "op-1234567890-xyz",
    type: "update-activity",           // Operation type
    timestamp: 1719012345678,
    userId: "default",
    data: {
        activityId: "act-123",
        updates: { completed: true }
    },
    syncStatus: "pending"              // pending/synced/failed
}
```

---

## 5. API and Services

### Google Drive Sync Service

#### Configuration
```javascript
// config/constants.js
GOOGLE_CLIENT_ID: '801001508845-...',
GOOGLE_API_KEY: 'AIzaSyD8D106...',
AUTO_SYNC_ENABLED: true,
AUTO_SYNC_INTERVAL: 300000  // 5 minutes
```

#### Sync Operations

1. **Authentication Flow**
   ```javascript
   GoogleDriveSync.signIn()
   → Google OAuth2 consent
   → Token storage
   → Auto-sync activation
   ```

2. **Data Sync Process**
   ```javascript
   Local Change → Operation Log → Sync Queue → Google Drive
                      ↓              ↓             ↓
                  Track Change   Retry Logic   File Update
   ```

3. **Conflict Resolution**
   - Last-write-wins for simple conflicts
   - Operation transformation for complex merges
   - User notification for unresolvable conflicts

#### API Methods

```javascript
class GoogleDriveSync {
    // Authentication
    async signIn()
    async signOut()
    get isSignedIn()
    
    // File operations
    async uploadData(data)
    async downloadData()
    async checkForUpdates()
    
    // Sync management
    async performSync()
    async resolveConflicts(local, remote)
    
    // Utilities
    async createAppFolder()
    async findDataFile()
}
```

### Service Worker API

#### Cache Strategy
```javascript
// sw.js cache configuration
const CACHE_NAME = 'stackmap-v1.4.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/app/StackMapApp.js',
    '/state.js',
    '/renderer.js',
    // ... all critical assets
];
```

#### Offline Handling
1. **Cache First**: Static assets (JS, CSS, images)
2. **Network First**: API calls with fallback
3. **Background Sync**: Queue operations when offline

### Platform Integration APIs

#### Capacitor (Mobile)
```javascript
// Native feature access
Capacitor.Plugins.App         // App lifecycle
Capacitor.Plugins.Storage     // Secure storage
Capacitor.Plugins.Share       // Native sharing
Capacitor.Plugins.SplashScreen // Launch screen
```

#### Web APIs Used
- **LocalStorage**: Primary data persistence
- **Service Worker**: Offline functionality
- **Web Share API**: Native sharing (when available)
- **Vibration API**: Haptic feedback
- **Fullscreen API**: Immersive mode

---

## 6. User Interface Components

### Component Architecture

All UI components follow a consistent pattern:
```javascript
window.ComponentName = {
    create(options) {},      // Factory method
    render(container) {},    // DOM creation
    update(data) {},         // State updates
    destroy() {}             // Cleanup
}
```

### Core Components

#### 1. ActivityCard
**Purpose**: Visual representation of activities
**Location**: `components.js`
```javascript
window.ActivityCard = {
    render(activity, index, isEditMode, appInstance) {
        // Creates card DOM with:
        // - Emoji display
        // - Title and description
        // - Completion checkbox
        // - Drag handles (edit mode)
        // - Time badge (if set)
    }
}
```

**Features**:
- Touch-friendly interaction (min 44px targets)
- Drag-and-drop reordering
- Completion animations
- Accessibility labels

#### 2. EmojiPicker
**Purpose**: Emoji selection with search
**Location**: `components.js`
```javascript
window.EmojiPicker = {
    create(options) {
        // Returns picker instance with:
        // - Search functionality
        // - Category navigation
        // - Recent emojis
        // - Paste detection
    }
}
```

**Features**:
- 1800+ emojis organized by category
- Real-time search filtering
- Keyboard navigation
- Touch-optimized grid

#### 3. HybridPanelManager
**Purpose**: Side panel system for settings/management
**Location**: `js/HybridPanelManager.js`
```javascript
class HybridPanelManager {
    // Manages:
    // - Left panel (preferences)
    // - Right panel (management)
    // - Dynamic menu system
    // - Form validation
    // - Navigation history
}
```

**Panel Types**:
- **Preferences**: Theme, display options, user settings
- **Management**: Add/edit activities, user management, sync settings
- **Library**: Card templates and sharing

#### 4. CelebrationManager
**Purpose**: Positive reinforcement animations
**Location**: `js/CelebrationManager.js`
```javascript
class CelebrationManager {
    playCelebration(type, options) {
        // Types:
        // - 'confetti': Single card completion
        // - 'fireworks': Full routine completion
        // - 'pulse': Quick feedback
    }
}
```

**Animation Types**:
- Confetti particles (75 count)
- Firework bursts
- Card pulse effects
- Rainbow themes

#### 5. DynamicMenuSystem
**Purpose**: Context-aware menu navigation
**Location**: `js/DynamicMenuSystem.js`
```javascript
class DynamicMenuSystem {
    registerMenu(id, config) {}
    renderMenu(menuId, container) {}
    handleNavigation(fromMenu, toMenu) {}
}
```

**Menu Features**:
- Declarative menu configuration
- Automatic back button handling
- Breadcrumb navigation
- Form state preservation

### Modal System

#### Modal Types
1. **Activity Modal**: Add/edit activities
2. **User Modal**: User profile management
3. **Import Modal**: Data import interface
4. **Export Modal**: Data export options
5. **Sync Modal**: Google Drive status

#### Modal Structure
```html
<div class="modal-overlay">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Modal Title</h2>
            <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
            <!-- Dynamic content -->
        </div>
        <div class="modal-footer">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-primary">Save</button>
        </div>
    </div>
</div>
```

### Form Components

#### Input Types
1. **Text Input**: With character limits and validation
2. **Emoji Picker**: Integrated picker component
3. **Color Picker**: Theme selection grid
4. **Time Picker**: 12-hour format with AM/PM
5. **Toggle Switch**: Boolean options

#### Validation Rules
- Title: Max 13 characters, required
- Description: Max 50 characters, optional
- Time: Valid 12-hour format
- User Name: Max 20 characters, required
- No special characters in grown-up mode answers

---

## 7. State Management

### State Architecture

```
┌─────────────────────────────────────┐
│         User Interaction            │
└────────────┬───────────────────────┘
             ↓
┌─────────────────────────────────────┐
│      StackMapApp (Controller)       │
└────────────┬───────────────────────┘
             ↓
┌─────────────────────────────────────┐
│        AppState (Model)             │
│  - Activities                       │
│  - Users                            │
│  - Settings                         │
│  - UI State                         │
└────────────┬───────────────────────┘
             ↓
┌─────────────────────────────────────┐
│    State Change Handler             │
│  - Save to LocalStorage             │
│  - Queue sync operation             │
│  - Trigger UI update                │
└────────────┬───────────────────────┘
             ↓
┌─────────────────────────────────────┐
│      AppRenderer (View)             │
│  - Update DOM                       │
│  - Play animations                  │
│  - Update accessibility             │
└─────────────────────────────────────┘
```

### State Management Patterns

#### 1. Centralized State
All application state lives in `AppState` class:
```javascript
class AppState {
    constructor() {
        this.activities = [];
        this.users = {};
        this.settings = {};
        this.ui = {};
        this.syncMetadata = {};
    }
}
```

#### 2. State Mutations
All state changes go through dedicated methods:
```javascript
// Good - tracked mutation
appState.addActivity(newActivity);

// Bad - direct manipulation
appState.activities.push(newActivity);
```

#### 3. Change Tracking
Operation log tracks all mutations:
```javascript
_trackOperation(type, data) {
    const operation = {
        id: generateId(),
        type: type,
        timestamp: Date.now(),
        data: data,
        syncStatus: 'pending'
    };
    this._operationLog.push(operation);
}
```

#### 4. Persistence Strategy
```javascript
// Automatic save on state change
this.appState.onStateChange = () => {
    this.saveToLocalStorage();      // Immediate local save
    this.processGranularSync();      // Queue sync operation
    this.debouncedAutoSync();        // Throttled cloud sync
};
```

### Data Flow Examples

#### Adding an Activity
```
1. User fills form → 
2. StackMapApp.addActivity() →
3. AppState.addActivity() →
4. Track operation →
5. Save to LocalStorage →
6. Queue sync →
7. AppRenderer.render() →
8. Update DOM
```

#### Switching Users
```
1. User selects from dropdown →
2. StackMapApp.switchUser() →
3. Save current user data →
4. AppState.switchUser() →
5. Load new user data →
6. Update UI theme →
7. Re-render activities →
8. Update subtitle
```

### Sync Queue System

#### Queue Operations
```javascript
class SyncQueue {
    enqueue(operation)        // Add to queue
    deduplicateAndAdd(item)   // Remove superseded ops
    transformOperations(op)   // Resolve conflicts
    processQueue()            // Execute sync
}
```

#### Operation Types
- `upload`: Full data upload
- `update-activity`: Single activity change
- `delete-activity`: Remove activity
- `move-activity`: Reorder activities
- `switch-user`: User context change
- `batch-update`: Multiple changes

#### Conflict Resolution
1. **Deduplication**: Remove older operations superseded by newer ones
2. **Transformation**: Adjust operations based on queue state
3. **Retry Logic**: Exponential backoff for failed operations
4. **User Notification**: Alert for unresolvable conflicts

---

## 8. Authentication and Security

### Security Model

StackMap uses a **client-side security model** appropriate for its architecture:

1. **No Server Backend**: All code runs in the user's browser
2. **API Key Restrictions**: Google APIs restricted to stackmap.app domain
3. **OAuth2 Flow**: Secure authentication through Google
4. **Local Data Encryption**: Sensitive data encrypted in LocalStorage

### Google OAuth2 Integration

#### Authentication Flow
```
1. User clicks "Sign In" →
2. Google OAuth2 consent screen →
3. User grants permissions →
4. Receive access token →
5. Store encrypted token →
6. Enable auto-sync
```

#### Permissions Required
- `https://www.googleapis.com/auth/drive.file` - Access app-created files only
- No access to user's other Drive files
- Minimal scope for privacy

#### Token Management
```javascript
// Token storage (encrypted)
const encryptedToken = encrypt(token, deviceId);
localStorage.setItem('stackmap-google-token', encryptedToken);

// Token refresh
if (tokenExpired) {
    const newToken = await refreshToken();
    updateStoredToken(newToken);
}
```

### Data Privacy

#### Local Storage
- All user data stored locally by default
- No automatic cloud upload without consent
- Data remains on device unless explicitly synced

#### Google Drive Storage
- Data stored in app-specific folder
- Not visible in user's main Drive
- Encrypted at rest by Google
- Only accessible with user's credentials

#### Child Safety (COPPA Compliance)
- No personal data collection from children
- No third-party analytics or tracking
- No social features or communication
- Parent/guardian controls all data

### Security Best Practices

#### Code Security
```javascript
// Input sanitization
function sanitizeInput(input) {
    return input
        .replace(/[<>]/g, '')  // Remove HTML tags
        .slice(0, maxLength);   // Enforce length limits
}

// XSS prevention
element.textContent = userInput;  // Safe
// element.innerHTML = userInput; // Unsafe - not used
```

#### API Security
- Domain-restricted API keys
- Rate limiting on Google's side
- No sensitive operations in client code
- Minimal permission scopes

#### User Data Protection
1. **Grown-up Mode**: Password-protected administrative functions
2. **Data Export**: Users can export all data anytime
3. **Data Deletion**: Clear all data with one button
4. **No Telemetry**: No usage tracking or analytics

---

## 9. Deployment and Configuration

### Deployment Architecture

```
GitHub Repository
      ↓
GitHub Actions CI/CD
      ↓
Build & Validation
      ↓
cPanel Deployment → stackmap.app (Production)
      ↓               ↓
CloudFlare CDN    Google Domains
```

### Environment Configuration

#### Production Settings
```javascript
// config/constants.js
const CONFIG = {
    APP_VERSION: '1.4.0',
    GOOGLE_CLIENT_ID: 'production-client-id',
    GOOGLE_API_KEY: 'production-api-key',
    AUTO_SYNC_ENABLED: true
};
```

#### Development Settings
```javascript
// Local development
const DEV_CONFIG = {
    ...CONFIG,
    AUTO_SYNC_ENABLED: false,
    DEBUG_MODE: true
};
```

### Deployment Process

#### 1. Pre-deployment Checks
```bash
npm run tollgate
# Runs:
# - Syntax validation
# - File structure check
# - Version consistency
# - No console.log statements
# - README presence
```

#### 2. Deployment Script
```bash
npm run deploy
# Executes:
# 1. Run tollgate checks
# 2. Update version numbers
# 3. Generate changelog
# 4. Push to production
# 5. Verify deployment
```

#### 3. Rollback Process
```bash
./ROLLBACK.sh
# Features:
# - List recent deployments
# - Select version to restore
# - Automatic backup creation
# - Deployment verification
```

### Configuration Files

#### manifest.json (PWA)
```json
{
    "name": "StackMap",
    "short_name": "StackMap",
    "description": "Visual routine builder for families",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#667eea",
    "background_color": "#f3f4f6",
    "icons": [...]
}
```

#### capacitor.config.json (Mobile)
```json
{
    "appId": "app.stackmap.www",
    "appName": "StackMap",
    "webDir": "www",
    "bundledWebRuntime": false,
    "plugins": {
        "SplashScreen": {
            "launchShowDuration": 3000
        }
    }
}
```

#### .htaccess (Server)
```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

# Cache control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 week"
</IfModule>
```

### Performance Optimization

#### 1. Asset Optimization
- Minified CSS (index.css imports all modules)
- Optimized images (PNG with compression)
- Lazy loading for non-critical resources

#### 2. Caching Strategy
- Service Worker caches all static assets
- LocalStorage for application data
- 5-minute cache for Drive sync checks

#### 3. Loading Performance
```html
<!-- Critical CSS inline -->
<style>
    /* Base styles for initial render */
</style>

<!-- Async script loading -->
<script src="app.js" defer></script>
```

---

## 10. Testing Strategy

### Testing Framework

#### Story-Based Testing
Located in `tests/stories/`:
```javascript
// Test structure
{
    id: 'story-001',
    title: 'Add Activity Card',
    category: 'activities',
    priority: 'critical',
    steps: [
        {
            action: 'click',
            target: '#addActivityBtn',
            description: 'Open add activity modal'
        }
    ],
    assertions: [
        {
            type: 'element-visible',
            target: '.modal-overlay',
            expected: true
        }
    ]
}
```

#### Test Categories
1. **Critical Path**: Core functionality
2. **User Workflows**: Common tasks
3. **Edge Cases**: Error handling
4. **Accessibility**: ARIA compliance
5. **Performance**: Load times

### Test Execution

#### Running Tests
```bash
# All tests
npm test

# Critical only
npm run test:critical

# Specific story
npm test -- --story=story-001

# Browser tests
npm run test:browser
```

#### Test Reports
Generated in `tests/reports/`:
```json
{
    "summary": {
        "total": 25,
        "passed": 24,
        "failed": 1,
        "duration": "45.3s"
    },
    "stories": [...],
    "timestamp": "2025-06-21T10:00:00Z"
}
```

### Testing Best Practices

#### 1. User-Centric Tests
```javascript
// Good - tests user outcome
"User can complete morning routine"

// Bad - tests implementation
"setState updates activities array"
```

#### 2. Accessibility Testing
- All interactive elements have ARIA labels
- Keyboard navigation works throughout
- Screen reader announcements for state changes
- Color contrast meets WCAG AA standards

#### 3. Mobile Testing
- Touch targets minimum 44px
- Swipe gestures work correctly
- Viewport handling for keyboards
- Performance on low-end devices

### Continuous Integration

#### GitHub Actions Workflow
```yaml
name: Test and Deploy
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm test
      - run: npm run tollgate
```

---

## 11. Development Guidelines

### Code Style

#### JavaScript Conventions
```javascript
// Function naming
function verbNoun() {}         // handleClick, saveData
function isCondition() {}      // isEditMode, hasChanges

// Variable naming
const CONSTANT_VALUE = 42;     // All caps for constants
let camelCaseVariable;         // Camel case for variables
const user_id = 'bad';         // Don't use snake_case

// Comments
// Single line for brief notes
/**
 * Multi-line for function documentation
 * @param {Object} activity - The activity to save
 * @returns {boolean} Success status
 */

// Error handling
try {
    riskyOperation();
} catch (error) {
    console.error('[Component] Error message:', error);
    // Graceful fallback
}
```

#### CSS Conventions
```css
/* Component naming */
.card {}                      /* Block */
.card__title {}               /* Element */
.card--completed {}           /* Modifier */

/* Variable naming */
--primary-color: #667eea;     /* Kebab-case */
--card-min-height: 120px;     /* Descriptive names */

/* Responsive design */
/* Mobile-first approach */
.card { width: 100%; }
@media (min-width: 768px) {
    .card { width: 50%; }
}
```

### Architecture Rules

#### 1. No Framework Dependencies
```javascript
// ❌ Don't use
import React from 'react';
import $ from 'jquery';

// ✅ Do use
const element = document.createElement('div');
element.classList.add('card');
```

#### 2. Global Scope Management
```javascript
// ❌ Don't pollute global scope
var myVariable = 42;

// ✅ Use window explicitly
window.StackMapApp = class { };
```

#### 3. Special Needs Priority
Every feature must consider:
- Motor skill challenges (large touch targets)
- Cognitive load (simple interactions)
- Visual clarity (high contrast)
- Predictable behavior (no surprises)

### Development Workflow

#### 1. Before Starting
Check these documents:
- `context/constraints.md` - Development rules
- `context/component-inventory.md` - Existing components
- `context/css-module-map.md` - Style organization
- `docs/CLAUDE.md` - AI assistant guidelines

#### 2. Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/description

# 2. Make changes following guidelines

# 3. Test thoroughly
npm test
npm run tollgate

# 4. Commit with descriptive message
git commit -m "feat: add timer to activity cards"

# 5. Push and create PR
git push origin feature/description
```

#### 3. Code Review Checklist
- [ ] Follows vanilla JavaScript only rule
- [ ] Maintains special needs accessibility
- [ ] Updates relevant documentation
- [ ] Includes test coverage
- [ ] No console.log statements
- [ ] Passes tollgate checks

### Common Patterns

#### 1. Component Creation
```javascript
window.NewComponent = {
    create(options) {
        const container = document.createElement('div');
        container.className = 'new-component';
        
        // Build component
        this.render(container, options);
        
        return {
            element: container,
            update: (data) => this.update(container, data),
            destroy: () => this.destroy(container)
        };
    }
};
```

#### 2. Event Handling
```javascript
// Delegated events for dynamic content
container.addEventListener('click', (e) => {
    const card = e.target.closest('.activity-card');
    if (card) {
        this.handleCardClick(card);
    }
});
```

#### 3. State Updates
```javascript
// Always use state methods
this.appState.updateActivity(id, changes);

// Trigger save
this.appState.triggerSave();

// Update UI
this.renderer.renderActivities();
```

---

## 12. Mobile Applications

### Platform Strategy

#### Progressive Web App (Primary)
- Works on all devices with modern browsers
- Installable without app stores
- Automatic updates
- Full offline functionality

#### Native Wrappers (Secondary)
- iOS: Capacitor-based wrapper
- Android: Capacitor + TWA (Trusted Web Activity)
- Minimal native code for store compliance

### iOS Application

#### Architecture
```
ios/
├── App/                      # Xcode project
│   ├── App/                  # Swift code
│   │   ├── AppDelegate.swift
│   │   └── Info.plist
│   └── App.xcodeproj
└── App.xcworkspace          # Workspace with pods
```

#### Key Features
- WKWebView for web content
- Native splash screen
- Push notification support (future)
- App Store compliance

#### Build Process
```bash
# Install dependencies
cd ios/App
pod install

# Build debug
npm run ios:build

# Open in Xcode
npm run ios:open
```

### Android Application

#### Architecture
```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/         # Native code
│   │       └── res/          # Resources
│   └── build.gradle
└── capacitor.config.json
```

#### Key Features
- Chrome Custom Tabs
- Trusted Web Activity support
- Native share functionality
- Google Play compliance

#### Build Process
```bash
# Sync capacitor
npm run android:sync

# Build debug APK
npm run android:build:debug

# Build release APK
npm run android:build:release
```

### Mobile-Specific Features

#### 1. Touch Optimization
```css
/* Larger touch targets on mobile */
.btn {
    min-height: 44px;
    min-width: 44px;
}

/* Prevent double-tap zoom */
.activity-card {
    touch-action: manipulation;
}
```

#### 2. Viewport Handling
```javascript
// Adjust for keyboard
window.visualViewport.addEventListener('resize', () => {
    document.body.style.height = `${window.visualViewport.height}px`;
});
```

#### 3. Platform Detection
```javascript
const platform = {
    isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isPWA: window.matchMedia('(display-mode: standalone)').matches
};
```

### App Store Deployment

#### iOS App Store
1. **Requirements**
   - Apple Developer Account
   - App icons (all sizes)
   - Screenshots (all devices)
   - Privacy policy
   - App description

2. **Build Process**
   ```bash
   # Production build
   cd ios
   xcodebuild -workspace App.xcworkspace \
              -scheme App \
              -configuration Release
   ```

#### Google Play Store
1. **Requirements**
   - Google Play Developer Account
   - Signed APK/AAB
   - Feature graphic
   - Screenshots
   - Content rating

2. **Build Process**
   ```bash
   # Generate signed APK
   cd android
   ./gradlew assembleRelease
   ```

---

## 13. Progressive Web App

### PWA Architecture

#### Service Worker Strategy
```javascript
// sw.js - Offline-first approach
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
```

#### Manifest Configuration
```json
{
    "name": "StackMap - Visual Routine Builder",
    "short_name": "StackMap",
    "description": "Help your family build consistent routines",
    "categories": ["education", "kids", "lifestyle"],
    "start_url": "/?source=pwa",
    "scope": "/",
    "display": "standalone",
    "orientation": "any",
    "theme_color": "#667eea",
    "background_color": "#f3f4f6"
}
```

### Installation Flow

#### 1. Browser Install Prompt
```javascript
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});
```

#### 2. Custom Install UI
```javascript
installButton.addEventListener('click', async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        trackInstallation();
    }
});
```

#### 3. Post-Installation
```javascript
window.addEventListener('appinstalled', () => {
    hideInstallPrompt();
    showPWAFeatures();
});
```

### Offline Functionality

#### Cached Resources
1. **Application Shell**
   - HTML, CSS, JavaScript
   - Fonts and icons
   - Core images

2. **Dynamic Data**
   - User activities (LocalStorage)
   - Sync queue (IndexedDB)
   - User preferences

#### Offline Detection
```javascript
// Network status monitoring
window.addEventListener('online', () => {
    showSyncStatus('online');
    processQueuedOperations();
});

window.addEventListener('offline', () => {
    showSyncStatus('offline');
    enableOfflineMode();
});
```

### PWA Features

#### 1. Add to Home Screen
- Custom icon
- Splash screen
- Standalone display
- No browser chrome

#### 2. Background Sync
```javascript
// Register background sync
navigator.serviceWorker.ready.then((registration) => {
    return registration.sync.register('sync-data');
});
```

#### 3. Update Notifications
```javascript
// Check for updates
navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'update-available') {
        showUpdatePrompt();
    }
});
```

---

## 14. Performance Considerations

### Loading Performance

#### Initial Load Optimization
1. **Critical Path**
   ```html
   <!-- Inline critical CSS -->
   <style>/* Critical styles */</style>
   
   <!-- Async load non-critical -->
   <link rel="preload" href="styles/index.css" as="style">
   ```

2. **Script Loading**
   ```html
   <!-- Defer non-critical scripts -->
   <script src="app.js" defer></script>
   
   <!-- Lazy load features -->
   <script>
   if ('IntersectionObserver' in window) {
       // Load advanced features
   }
   </script>
   ```

3. **Resource Hints**
   ```html
   <!-- Preconnect to external domains -->
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="dns-prefetch" href="https://apis.google.com">
   ```

### Runtime Performance

#### DOM Optimization
```javascript
// Batch DOM updates
const fragment = document.createDocumentFragment();
activities.forEach(activity => {
    fragment.appendChild(createCard(activity));
});
container.appendChild(fragment);

// Use requestAnimationFrame
requestAnimationFrame(() => {
    updateUI();
});
```

#### Memory Management
```javascript
// Clean up event listeners
element.removeEventListener('click', handler);

// Clear references
this.largeData = null;

// Debounce expensive operations
const debouncedSave = debounce(saveData, 500);
```

#### Animation Performance
```css
/* Use transform for animations */
.card {
    transition: transform 0.3s ease;
}
.card:hover {
    transform: translateY(-2px);
}

/* Avoid animating expensive properties */
/* Bad: transition: width 0.3s; */
/* Good: transition: transform 0.3s; */
```

### Mobile Performance

#### Touch Responsiveness
```javascript
// Passive event listeners
element.addEventListener('touchstart', handler, { passive: true });

// Eliminate tap delay
button.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleClick();
});
```

#### Memory Constraints
```javascript
// Limit stored activities
const MAX_ACTIVITIES = 75;

// Compress data before storage
const compressed = LZString.compress(JSON.stringify(data));

// Clean old data
if (activities.length > MAX_ACTIVITIES) {
    activities = activities.slice(-MAX_ACTIVITIES);
}
```

### Monitoring Performance

#### Performance Metrics
```javascript
// Measure critical timings
performance.mark('app-start');
// ... initialization code ...
performance.mark('app-ready');
performance.measure('app-init', 'app-start', 'app-ready');

// Log to console in dev mode
if (DEV_MODE) {
    console.log('Init time:', performance.getEntriesByName('app-init')[0].duration);
}
```

#### Error Tracking
```javascript
window.addEventListener('error', (event) => {
    console.error('Global error:', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error
    });
});
```

---

## 15. Troubleshooting Guide

### Common Issues

#### 1. Data Not Syncing
**Symptoms**: Changes not appearing on other devices
**Solutions**:
```javascript
// Check sync status
console.log('Sync enabled:', app.driveSync?.isSignedIn);
console.log('Sync queue:', localStorage.getItem('stackmap-sync-queue'));

// Force sync
app.driveSync?.performSync();

// Clear sync queue
localStorage.removeItem('stackmap-sync-queue');
```

#### 2. Activities Not Saving
**Symptoms**: Activities disappear on reload
**Solutions**:
```javascript
// Check LocalStorage
console.log('Stored data:', localStorage.getItem('stackmap-data'));

// Verify save function
app.saveToLocalStorage();

// Check storage quota
navigator.storage.estimate().then(estimate => {
    console.log('Storage used:', estimate.usage);
    console.log('Storage quota:', estimate.quota);
});
```

#### 3. PWA Not Installing
**Symptoms**: Install button not appearing
**Solutions**:
1. Verify HTTPS is enabled
2. Check manifest.json is valid
3. Ensure service worker registers
4. Test in incognito mode

#### 4. Performance Issues
**Symptoms**: Slow interactions, janky animations
**Solutions**:
```javascript
// Profile rendering
console.time('render');
app.render();
console.timeEnd('render');

// Check activity count
console.log('Total activities:', app.appState.activities.length);

// Disable animations
document.body.classList.add('reduce-motion');
```

### Debugging Tools

#### Browser DevTools
```javascript
// Enable debug mode
window.DEBUG_MODE = true;

// Inspect state
console.log('App state:', app.appState);

// Monitor renders
const originalRender = app.render;
app.render = function() {
    console.count('render');
    return originalRender.apply(this, arguments);
};
```

#### Service Worker Debugging
```javascript
// Unregister service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
});

// Clear all caches
caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
});
```

#### LocalStorage Inspection
```javascript
// View all stored data
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('stackmap')) {
        console.log(key, localStorage.getItem(key));
    }
});

// Export data for analysis
const exportData = {
    data: localStorage.getItem('stackmap-data'),
    queue: localStorage.getItem('stackmap-sync-queue'),
    device: localStorage.getItem('stackmap-device-id')
};
console.log(JSON.stringify(exportData, null, 2));
```

### Recovery Procedures

#### 1. Data Recovery
```javascript
// Backup current data
const backup = localStorage.getItem('stackmap-data');
copy(backup); // Copies to clipboard

// Restore from backup
localStorage.setItem('stackmap-data', backup);
location.reload();
```

#### 2. Reset Application
```javascript
// Clear all data
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('stackmap')) {
        localStorage.removeItem(key);
    }
});
location.reload();
```

#### 3. Force Update
```bash
# Clear CDN cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
     -H "Authorization: Bearer {api_token}" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
```

### Support Resources

#### Documentation
- This comprehensive guide
- README.md for quick start
- CONTRIBUTING.md for developers
- Context files for specific features

#### Community Support
- GitHub Issues: Bug reports and features
- Email: contact@stackmap.app
- Support page: stackmap.app/support.html

#### Error Reporting
When reporting issues, include:
1. Browser and version
2. Device type (desktop/mobile)
3. Steps to reproduce
4. Console errors (F12 → Console)
5. LocalStorage export (if applicable)

---

## Conclusion

StackMap represents a carefully crafted solution for families with special needs children, built with a focus on reliability, accessibility, and simplicity. This documentation provides comprehensive coverage of every aspect of the application to ensure any developer can understand, maintain, and enhance the system while preserving its core mission of helping children build independence through visual routine management.

The architecture's emphasis on vanilla JavaScript, offline-first design, and special needs accessibility ensures the application remains maintainable and accessible to both users and developers for years to come.