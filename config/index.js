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
// 1. PreferencesManager.js - Handles all preferences panel functionality
//    - Color theme selection and application
//    - Toggle card numbers on/off
//    - Toggle completion indicators on/off
//    - Google Drive sync controls
//    - Import/Export data management
//
// 2. StackMapApp.js - Main application controller
//    - Initializes all components and managers
//    - Coordinates state management
//    - Handles mode switching (edit/user)
//    - Manages local storage persistence
//    - Controls welcome splash screen
//    - Handles inline editing of title/subtitle
//
// 3. ValidationManager.js - Edit mode protection
//    - Simple questions for adult verification
//    - Prevents children from accessing edit mode
//    - Modal-based validation interface
//    - Developer shortcut for testing
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