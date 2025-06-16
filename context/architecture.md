# StackMap Codebase Documentation

## 🎯 Project Overview
StackMap is a visual routine management application designed specifically for special needs and autistic children and their families. It provides an accessible, colorful interface for creating and managing daily routines with visual cards, completion tracking, and celebration animations.

## 🏗️ Architecture Philosophy

### **Core Principles:**
- **Vanilla JavaScript Only** - No frameworks, no build process, maximum reliability
- **Special Needs First** - Every decision prioritizes accessibility and simplicity
- **Offline Resilience** - Routines work without internet for consistency
- **Family-Friendly** - Parents can understand and maintain the system

### **File Loading Strategy:**
```html
<!-- Simple script tag architecture -->
<script src="constants.js"></script>
<script src="components.js"></script>
<script src="StackMapApp.js"></script>
```
**NO ES6 imports** - Uses window globals for maximum browser compatibility

## 📁 Complete File Structure

### **Current File Structure (As of June 2025):**

#### **Core Application (7 files):**
- **index.html** - Entry point with accessibility-first markup
- **app/StackMapApp.js** - Main application controller
- **state.js** - Data management and persistence  
- **renderer.js** - UI rendering and visual updates
- **components.js** - Legacy UI components (DataManagementPanel obsolete)
- **drive-sync.js** - Google Drive cloud synchronization
- **sw.js** - Service worker for PWA offline support

#### **Configuration (2 files):**
- **config/constants.js** - App-wide settings and API keys
- **config/themes.js** - Color palette definitions

#### **Data (3 files):**
- **data/emoji-list.js** - Complete emoji collection
- **data/emoji-names.js** - Searchable emoji keywords
- **data/default-activities.js** - Initial routine templates

#### **Modern Managers (4 files):**
- **js/HybridPanelManager.js** - Unified settings/management panels
- **js/CelebrationManager.js** - Animation system
- **js/DynamicMenuSystem.js** - Context menus
- **js/MenuConfigurations.js** - Menu definitions

#### **Styles (Active CSS Files):**
- **styles/index.css** - Main stylesheet (imports all others)
- **styles/layout.css** - Positioning and header management
- **styles/responsive.css** - Mobile-first breakpoints
- **styles/buttons.css** - All button component styles
- **styles/forms.css** - Input fields (preferences styles removed)
- **styles/modals.css** - General modal overlays
- **styles/cards.css** - Activity card components
- **styles/base.css** - Typography and foundation
- **styles/variables.css** - CSS custom properties
- **styles/utilities.css** - Helper classes
- **styles/animations.css** - Celebrations and transitions
- **styles/sync-modal.css** - Cloud sync interface
- **styles/hybrid-panels.css** - Modern side panel system
- **styles/fab.css** - Floating action buttons
- **styles/draggable-drawer.css** - Mobile drawer
- **styles/celebrations.css** - Animation effects
- **styles/selectors.css** - Dropdown components
- **styles/splash-screen.css** - Welcome screens

#### **PWA Infrastructure (2 files):**
- **manifest.json** - Progressive Web App configuration
- **offline.html** - Offline fallback page

#### **Files REMOVED (As of June 2025):**
- ~~app/PreferencesManager.js~~ (replaced by HybridPanelManager)
- ~~modal-card.css~~ (replaced by hybrid panels)
- ~~data-panel.css~~ (functionality in HybridPanelManager)
- ~~data-panel-animations.css~~ (functionality in HybridPanelManager)
- ~~ValidationManager.js~~ (validation in HybridPanelManager)
- ~~tests/uat-edit-mode.js~~ (replaced by uat-edit-mode-updated.js)
- ~~debug-menu-test.html~~ (debug file removed)
- ~~drive-sync-debug.html~~ (debug file removed)

## 🎨 Component Architecture

### **Unified Components System (components.js):**

#### **ComponentBuilder (DOM Factory)**
```javascript
window.ComponentBuilder = {
    createElement(), createButton(), createInput()
    // Consistent DOM element creation
}
```

#### **ActivityCard (Card System)**
```javascript
window.ActivityCard = {
    render(), setupCardEvents(), setupDragAndDrop()
    // Complete card lifecycle with special needs focus
}
```

#### **EmojiPicker (Enhanced Selection)**
```javascript
window.EmojiPicker = {
    create(), show(), hide(), updateFilter()
    // Search, paste detection, accessibility features
}
```

#### **Modal System (Editing Interface)**
```javascript
window.ModalSystem = {
    openModal(), closeModal(), updateModalContent()
    // Time fields, form validation, touch-friendly
}
```

**Why Unified:** All components share accessibility requirements, touch targets, and special needs considerations. Splitting would add complexity without benefit.

## 🎯 Data Flow Architecture

### **State Management:**
```
User Interaction → StackMapApp → AppState → Renderer → DOM
                               ↓
                       Local Storage + Cloud Sync
```

### **Key Systems:**
- **AppState (state.js)** - Single source of truth for all data
- **AppRenderer (renderer.js)** - Handles all UI updates and celebrations
- **GoogleDriveSync (drive-sync.js)** - Background cloud synchronization
- **PreferencesManager** - Settings with dual-mode (child/grown-up)

## 🌈 Theming System

### **CSS Variable Architecture:**
```css
:root {
    --primary-color: #667eea;
    --card-border-radius: 20px;
    --card-shadow: 0 4px 12px rgba(0,0,0,0.08);
    /* Dynamic theme switching */
}
```

### **Theme Updates:**
1. User selects color in preferences
2. CSS variables update instantly
3. Logo SVG colors synchronize
4. All components adapt automatically

## ♿ Special Needs Features

### **Built Into Every Component:**
- **Touch Targets** - Minimum 44px for motor skill challenges
- **High Contrast** - Clear visual distinctions for visual impairments
- **ARIA Labels** - Complete screen reader support
- **Predictable Behavior** - Consistent interactions for routine-dependent children
- **Celebration Feedback** - Positive reinforcement for achievements

### **Dual Mode System:**
- **Child Mode** - Simple, protected interface with celebrations
- **Grown-up Mode** - Administrative functions behind validation

## 📱 Progressive Web App

### **Offline-First Strategy:**
- **Service Worker (sw.js)** - Caches essential files
- **Local Storage** - Persistent routine data
- **Manifest (manifest.json)** - Native app-like experience
- **Background Sync** - Automatic cloud updates when online

### **Mobile Optimization:**
- **Touch-friendly** - Large buttons, gesture support
- **Responsive Design** - Mobile-first CSS approach
- **Performance** - Minimal dependencies for fast loading

## 🔄 Development Workflow

### **Before Making Changes:**
1. **Check Missing File Protocol** - Verify file exists
2. **Review Component Inventory** - Don't recreate existing components
3. **Check CSS Module Map** - Add to existing modules
4. **Follow Development Constraints** - Vanilla JS only, special needs first

### **Key Constraints:**
- ❌ **NO ES6 imports** - Use script tags only
- ❌ **NO frameworks** - Vanilla JavaScript for reliability
- ❌ **NO new CSS files** - Use existing modular system
- ❌ **NO new components** - Extend existing ones in components.js
- ✅ **Special needs accessibility** - Always the top priority

## 🎉 Celebration System

### **Animation Types:**
- **Individual Completion** - Confetti particles for single activities
- **Routine Completion** - Firework burst for full routine
- **Visual Feedback** - Card color changes and scaling effects
- **Audio-Free** - Visual-only to avoid sensory overload

### **Implementation:**
```javascript
// Handled by CelebrationManager.js
window.celebrationManager = new CelebrationManager();
celebrationManager.playCelebration('confetti', {
    theme: 'rainbow',
    duration: 3000
});
```

## 🔗 File Dependencies

### **Critical Loading Order:**
```
1. index.html (foundation)
2. CSS files (styling)
3. Config files (constants, themes)
4. Data files (emojis, activities)
5. Core modules (state, components, renderer)
6. Managers (preferences)
7. StackMapApp.js (initialization)
8. Service worker (PWA features)
```

### **Dependency Map:**
```
StackMapApp.js requires:
├── AppState (state.js)
├── AppRenderer (renderer.js)
├── GoogleDriveSync (drive-sync.js)
├── PreferencesManager (app/PreferencesManager.js)
└── CONFIG constants (config/constants.js)

components.js requires:
├── EMOJIS (data/emoji-list.js)
├── EMOJI_NAMES (data/emoji-names.js)
└── CSS modules for styling
```

## 🎯 Mission Alignment

Every architectural decision serves the core mission: **helping special needs children build independence through reliable, accessible routine management.**

### **Technical decisions prioritize:**
1. **Reliability** - Works offline, minimal dependencies
2. **Accessibility** - Screen readers, motor skills, cognitive load
3. **Simplicity** - Parents can understand and maintain
4. **Consistency** - Predictable behavior for routine-dependent children

**This architecture successfully balances technical excellence with real-world family needs.**