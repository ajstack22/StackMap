## 🎯 Project Overview

**StackMap** is a visual routine management application for special needs and autistic children. Built with **vanilla JavaScript only** (no frameworks), it provides touch-friendly interfaces for creating daily routines with visual cards, completion tracking, and celebrations.

### Core Principles
- **Vanilla JS Only** - No frameworks, no build process
- **Special Needs First** - 44px touch targets, high contrast, predictable behavior
- **Offline-First** - Works without internet
- **Zero Dependencies** - Maximum reliability for families

## 📁 File Inventory Guide

### When to Request Files

**Request these files when working on:**

#### Core Application Files (7 files)
1. **`index.html`** - Request when:
   - Modifying page structure
   - Changing script loading order
   - Updating meta tags or PWA settings
   - Working with validation modal structure

2. **`StackMapApp.js`** - Request when:
   - Implementing new features
   - Modifying app lifecycle
   - Working with mode switching (child/grown-up)
   - Handling data import/export
   - Managing preferences or validation

3. **`state.js`** - Request when:
   - Managing activity data
   - Working with settings/preferences
   - Implementing data persistence
   - Adding new state properties

4. **`renderer.js`** - Request when:
   - Modifying how cards are displayed
   - Working with animations (confetti/fireworks)
   - Changing header behavior
   - Implementing visual updates

5. **`components.js`** - Request when:
   - Working with ANY UI components
   - Modifying cards, modals, or pickers
   - Adding new component functionality
   - Fixing event handling

6. **`drive-sync.js`** - Request when:
   - Working with Google Drive integration
   - Implementing cloud backup features
   - Handling sync conflicts

7. **`sw.js`** - Request when:
   - Modifying offline functionality
   - Working with PWA features
   - Updating cache strategies

#### Configuration Files (2 files)
- **`config/constants.js`** - App settings, limits, API keys
- **`config/themes.js`** - Color palette definitions

#### Data Files (3 files)
- **`data/emoji-list.js`** - Emoji collection
- **`data/emoji-names.js`** - Searchable emoji keywords
- **`data/default-activities.js`** - Initial routine templates

#### Modern Manager Files (4 files)
- **`js/HybridPanelManager.js`** - Unified settings/management panels
- **`js/CelebrationManager.js`** - Animation system
- **`js/DynamicMenuSystem.js`** - Context menus
- **`js/MenuConfigurations.js`** - Menu definitions

#### CSS Files (Active stylesheets)
Request specific CSS files based on what you're styling:
- **`styles/index.css`** - Main stylesheet (imports all others)
- **`styles/layout.css`** - Headers, positioning, floating buttons
- **`styles/responsive.css`** - Mobile breakpoints
- **`styles/buttons.css`** - All button styles
- **`styles/cards.css`** - Card components and states
- **`styles/forms.css`** - Inputs and form elements (preferences removed)
- **`styles/modals.css`** - General modal styles
- **`styles/base.css`** - Typography and foundations
- **`styles/variables.css`** - CSS custom properties
- **`styles/utilities.css`** - Helper classes
- **`styles/animations.css`** - Confetti, fireworks, transitions
- **`styles/sync-modal.css`** - Sync conflict UI
- **`styles/hybrid-panels.css`** - Modern side panel system
- **`styles/fab.css`** - Floating action buttons
- **`styles/draggable-drawer.css`** - Mobile drawer
- **`styles/celebrations.css`** - Animation effects
- **`styles/selectors.css`** - Dropdown components
- **`styles/splash-screen.css`** - Welcome screens

#### PWA Files (2 files)
- **`manifest.json`** - PWA configuration
- **`offline.html`** - Offline fallback page

### ⚠️ REMOVED FILES - DO NOT REQUEST
- ~~app/PreferencesManager.js~~ (replaced by HybridPanelManager)
- ~~styles/modal-card.css~~ (replaced by hybrid panels)
- ~~styles/data-panel.css~~ (functionality in HybridPanelManager)
- ~~styles/data-panel-animations.css~~ (functionality in HybridPanelManager)
- ~~ValidationManager.js~~ (validation in HybridPanelManager)
- ~~DataManagementPanel~~ (functionality in HybridPanelManager)
- ~~tests/uat-edit-mode.js~~ (use uat-edit-mode-updated.js)
- ~~debug-menu-test.html~~ (debug file removed)
- ~~drive-sync-debug.html~~ (debug file removed)

## 🧩 Component Inventory

### Available Components (all in components.js)

#### ComponentBuilder
**Purpose:** DOM element factory and StackMap management
**Methods:**
- `createElement()` - Create DOM elements
- `createButton()` - Create buttons with icons
- `createInput()` - Create form inputs
- `showStackMapModal()` - Multi-routine management
- `createModalCard()` - Activity editing modal

**Request when:** Creating any UI elements or modals

#### ActivityCard
**Purpose:** Individual activity card rendering
**Features:**
- Card rendering with completion states
- Drag and drop functionality
- Edit mode with action buttons
- Touch-friendly click handling
- Card type indicators

**Request when:** Working with card display or interactions

#### EmojiPicker
**Purpose:** Emoji selection with search
**Features:**
- Search by keywords
- Paste emoji detection
- Keyboard navigation
- Basic emoji grid

**Request when:** Working with emoji selection

#### ModalSystem
**Purpose:** Activity editing interface
**Features:**
- Time field support
- Card type selection
- Form validation
- Accessibility features

**Request when:** Working with activity editing

## 🎨 CSS Module Guide

### CSS Architecture
- **13 modular CSS files** - Each handles specific functionality
- **NO new CSS files** - Add to existing modules only
- **CSS Variables** - Theme system in variables.css

### Module Responsibilities

| Need to Style | Use This Module | Key Classes |
|--------------|-----------------|-------------|
| Activity cards | `cards.css` | `.card`, `.card--completed`, `.card__icon` |
| Buttons | `buttons.css` | `.btn`, `.btn--primary`, `.btn--floating` |
| Forms/inputs | `forms.css` | `.form-field`, `.emoji-picker` |
| Modals | `modals.css` | `.validation-modal`, `.welcome-splash` |
| Edit modal | `modal-card.css` | `.modal-card`, `.modal-card__actions` |
| Layout | `layout.css` | `.fixed-header`, `.main-container` |
| Mobile | `responsive.css` | Media queries, touch adjustments |
| Animations | `animations.css` | `.confetti`, `.firework-particle` |

### Known CSS Solutions

**Rectangle Artifacts Fix:**
```css
border-radius: 50% !important;
border: none !important;
```

**Uniform Card Sizing:**
```css
min-height: 320px !important;
max-height: 320px !important;
```

## 🏗️ Architecture Overview

### Data Flow
```
User Input → StackMapApp → AppState → Renderer → DOM Update
                              ↓
                        Local Storage + Cloud Sync
```

### Key Systems

#### State Management (state.js)
- Single source of truth
- Handles all data operations
- Triggers auto-save
- Theme management

#### Rendering (renderer.js)
- Updates UI based on state
- Handles animations
- Manages header behavior
- Card layout rendering

#### Component System (components.js)
- All UI components in one file
- Uses window globals (no imports)
- Consistent accessibility patterns

## 📋 Development Protocols

### Before Starting Any Work

1. **Check what exists** - Don't recreate existing functionality
2. **Request only needed files** - Start with the specific files for your task
3. **Follow constraints** - Vanilla JS only, no new files
4. **Test accessibility** - 44px touch targets, screen reader support

### When You Need To...

#### Add a New Feature
1. Request `StackMapApp.js` to see main app structure
2. Request `state.js` if it involves data
3. Request `components.js` if it needs UI elements
4. Request relevant CSS module for styling

#### Fix a Bug
1. Identify which system is affected
2. Request only those specific files
3. Check for known solutions in guides
4. Test on mobile (primary use case)

#### Modify Styling
1. Identify which CSS module handles that element
2. Request that specific CSS file
3. Never create new CSS files
4. Use existing CSS variables

#### Work with Cards
1. Request `components.js` for ActivityCard class
2. Request `cards.css` for styling
3. Request `renderer.js` if changing layout

### Common Tasks Reference

| Task | Request These Files |
|------|-------------------|
| Fix card completion | `components.js`, `renderer.js` |
| Change card appearance | `cards.css`, `components.js` |
| Add settings option | `HybridPanelManager.js`, `state.js` |
| Modify header | `layout.css`, `renderer.js` |
| Fix mobile layout | `responsive.css`, specific component CSS |
| Add animation | `animations.css`, `renderer.js` |
| Change theme colors | `variables.css`, `state.js` |

## ⚠️ Critical Constraints

### NEVER DO
- ❌ Create new files
- ❌ Use ES6 imports
- ❌ Add frameworks/libraries
- ❌ Use build processes
- ❌ Ignore accessibility

### ALWAYS DO
- ✅ Use window globals
- ✅ Extend existing components
- ✅ Add to existing CSS modules
- ✅ Test on mobile first
- ✅ Maintain 44px touch targets

## 🎯 Feature Areas Guide

### Card System
**Files needed:** `components.js`, `cards.css`, `renderer.js`, `state.js`
**Features:**
- Visual activity cards with emoji icons
- Completion tracking with celebrations
- Drag and drop reordering
- Edit mode with action buttons
- All cards are pinned (recurring)
- Time badges and numbering

### Modal System
**Files needed:** `components.js`, `modal-card.css`, `modals.css`
**Features:**
- Activity editing modal
- Emoji picker integration
- Time field handling
- Card type selection
- Form validation

### Theme System
**Files needed:** `state.js`, `variables.css`, `HybridPanelManager.js`
**Features:**
- Dynamic color themes
- CSS variable updates
- Logo color synchronization
- Persistent preferences

### Data Management
**Files needed:** `state.js`, `StackMapApp.js`, `drive-sync.js`
**Features:**
- Local storage persistence
- Import/export JSON
- Google Drive sync
- Multi-StackMap support

### Accessibility Features
**Present in all components:**
- 44px minimum touch targets
- High contrast colors
- ARIA labels
- Keyboard navigation
- Screen reader support

## 🔍 Quick Reference

### File Request Decision Tree

1. **UI Component Issue?** → Request `components.js`
2. **Styling Issue?** → Request specific CSS module from list
3. **Data/State Issue?** → Request `state.js`
4. **Feature Addition?** → Request `StackMapApp.js` + related files
5. **Layout Issue?** → Request `layout.css` + `responsive.css`
6. **Animation Issue?** → Request `animations.css` + `renderer.js`

### Known Issues & Solutions

| Issue | Solution | Files Needed |
|-------|----------|--------------|
| Rectangle buttons | Apply border-radius fix | Relevant CSS file |
| Card sizing | Apply height constraints | `cards.css` |
| Modal rendering | Force white background | `modals.css` |
| Click events | Check event delegation | `components.js` |

## 📱 Mobile-First Considerations

- **Primary breakpoints:** 768px, 480px
- **Touch targets:** Minimum 44px
- **Gestures:** Click only (no hover dependencies)
- **Performance:** No heavy animations
- **Offline:** Core features work without internet

---

**Remember:** This is a special needs accessibility project. Every decision should prioritize the children and families who depend on StackMap's reliability and simplicity.