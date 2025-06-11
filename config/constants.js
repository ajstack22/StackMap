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
    // Direct credentials for production use
    GOOGLE_CLIENT_ID: '801001508845-59jevf4piac2cg3g9q6srjb297sd4hbr.apps.googleusercontent.com',
    GOOGLE_API_KEY: 'AIzaSyD8D106PcgbDC2ZLAST5j1o73k2OrE2V0M',
    
    // Auto-sync settings
    AUTO_SYNC_ENABLED: true,
    AUTO_SYNC_INTERVAL: 300000 // 5 minutes in milliseconds
};