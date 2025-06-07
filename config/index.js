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
// Active Managers:
// ---------------
// 1. StackMapApp.js - Main application controller
//    - Initializes all components and managers
//    - Coordinates state management
//    - Handles mode switching (edit/user)
//    - Manages local storage persistence
//    - Controls welcome splash screen
//    - Handles inline editing of title/subtitle
//
// 2. HybridPanelManager.js - Modern panel system with JavaScript state management
//    - Replaces old modal system with side panels
//    - Color theme selection and application
//    - Toggle card numbers and completion indicators
//    - Edit mode validation with simple questions
//    - Admin tools (add cards, import/export, user management)
//    - Platform-specific behavior (mobile/desktop)
//
// Deprecated/Disabled:
// -------------------
// - PreferencesManager.js: Disabled - replaced by HybridPanelManager
// - ValidationManager.js: Removed - validation now in HybridPanelManager
//
// Removed/Unused:
// --------------
// - FocusManager.js: Deleted - unused accessibility features
// - WelcomeManager.js: Deleted - functionality in StackMapApp
//
// === KEY ARCHITECTURAL DECISIONS ===
// - NO ES6 modules - use script tags and window globals
// - Designed for special needs children and families
// - Simple, visual, celebration-focused interface
// - Minimal dependencies for reliability