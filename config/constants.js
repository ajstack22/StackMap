// config/constants.js - Core Configuration Constants
const CONFIG = {
    MAX_TITLE_LENGTH: 30,
    MAX_DESCRIPTION_LENGTH: 50,
    MAX_ACTIVITIES: 75,
    ANIMATION_DURATION: 300,
    CONFETTI_COUNT: 75,
    DEFAULT_EMOJI: '⭐',
    DEFAULT_COLOR: '#667eea',
    DATA_VERSION: '1.0',
    
    // Display mode options for card badges
    DISPLAY_MODES: {
        NONE: 'none',           // No badge shown
        NUMBERS: 'numbers',     // Sequential numbers (1, 2, 3...)
        TIMES: 'times'          // Time badges (8:00 AM, etc.)
    },
    
    // Default settings
    SHOW_COMPLETION_DEFAULT: true,
    
    // User management constants
    MAX_USERS: 6,
    DEFAULT_USER_ID: 'default',
    USER_NAME_MAX_LENGTH: 20,
    
    // Google Drive API Configuration
    // These should be set as environment variables or loaded from a secure configuration
    // For local development, create a .env.local file (do not commit to version control)
    // For production, set these in your hosting environment
    GOOGLE_CLIENT_ID: window.STACKMAP_GOOGLE_CLIENT_ID || '',
    GOOGLE_API_KEY: window.STACKMAP_GOOGLE_API_KEY || '',
    
    // Auto-sync settings
    AUTO_SYNC_ENABLED: true,
    AUTO_SYNC_INTERVAL: 300000 // 5 minutes in milliseconds
};