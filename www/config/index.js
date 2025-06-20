// config/index.js - Main Configuration Export
// THIS FILE IS FOR DOCUMENTATION ONLY
// Actual configuration is loaded via script tags in index.html

// Configuration files loaded:
// - config/constants.js - Main app constants (CONFIG object)
// - config/themes.js - Color themes (THEMES object)
// - data/emoji-list.js - Emoji options (EMOJI_OPTIONS)
// - data/emoji-names.js - Emoji names (EMOJI_NAMES)

// === APPLICATION ARCHITECTURE DOCUMENTATION ===
//
// /app Directory - Application Logic Managers
// ==========================================
//
// Active Components:
// -----------------
// 1. StackMapApp.js - Main application controller
//    - Initializes all components and managers
//    - Coordinates state management
//    - Handles mode switching (edit/user)
//    - Manages local storage persistence
//    - Controls welcome splash screen
//    - Google Drive sync initialization
//
// /js Directory - Modern Manager Classes
// =====================================
//
// 2. HybridPanelManager.js - Unified panel system
//    - Side panels for settings and management
//    - Color theme selection and live preview
//    - Toggle card numbers and completion indicators
//    - Edit mode validation with simple questions
//    - User management (add, edit, delete users)
//    - Data import/export functionality
//    - Title/subtitle editing
//    - Celebration animation settings
//
// 3. CelebrationManager.js - Animation system
//    - Confetti animations for task completion
//    - Fireworks for routine completion
//    - Multiple color themes for celebrations
//    - Performance-optimized animations
//
// 4. DynamicMenuSystem.js - Context menu handler
//    - Card edit menus in edit mode
//    - User management menus
//
// /components Directory - UI Components
// ====================================
//
// 5. ModernUserSelector.js - User switching interface
// 6. ModernDaySelector.js - Day selection interface
// 7. DraggableDrawer.js - Mobile drawer navigation
// 8. EditModeFAB.js - Floating action button for edit mode
//
// Previously Removed:
// ------------------
// - PreferencesManager.js: Removed - replaced by HybridPanelManager
// - ValidationManager.js: Removed - validation now in HybridPanelManager
// - DataManagementPanel: Removed - functionality in HybridPanelManager
// - FocusManager.js: Removed - unused accessibility features
// - WelcomeManager.js: Removed - functionality in StackMapApp
//
// === KEY ARCHITECTURAL DECISIONS ===
// - NO ES6 modules - use script tags and window globals
// - Designed for special needs children and families
// - Simple, visual, celebration-focused interface
// - Minimal dependencies for reliability