/**
 * StackMap RSD-Safe Messaging System
 * Transforms error messages to avoid RSD triggers for ADHD/autism users
 * Based on research: 99% of ADHD users have Rejection Sensitive Dysphoria
 * Works with rsd-safe-init.js for comprehensive coverage
 */

(function() {
    'use strict';
    
    // Message modes
    var MESSAGE_MODES = {
        PROFESSIONAL: 'professional', // Default, minimal emotional content
        SUPPORTIVE: 'supportive',     // High RSD sensitivity, extra encouragement
        CONCISE: 'concise'            // Ultra-minimal, just facts
    };
    
    // Current mode (can be changed via settings)
    var currentMode = MESSAGE_MODES.PROFESSIONAL;
    
    // Performance cache
    var transformCache = {};
    var cacheSize = 0;
    var MAX_CACHE_SIZE = 100;
    
    // Core message transformations
    // Format: original -> { professional, supportive, concise }
    var messageTransforms = {
        // Array/Type errors
        'Array.from requires an array-like object - not null or undefined': {
            professional: 'The system needs different data format here',
            supportive: 'No worries! The system just needs the data in a different format',
            concise: 'Data format needed'
        },
        
        // Runtime errors
        'Runtime error:': {
            professional: 'Something unexpected happened:',
            supportive: 'The system hit a small bump:',
            concise: 'System issue:'
        },
        
        // Promise/async errors
        'Promise rejection:': {
            professional: 'Processing didn\'t complete:',
            supportive: 'The system is working on it:',
            concise: 'Processing incomplete:'
        },
        
        'Unhandled promise rejection': {
            professional: 'Background task needs attention',
            supportive: 'A background task needs a little help',
            concise: 'Task needs attention'
        },
        
        'Unhandled rejection:': {
            professional: 'Background process update:',
            supportive: 'Just keeping you informed:',
            concise: 'Process update:'
        },
        
        // Loading/timeout
        'App loading timeout': {
            professional: 'Taking longer than usual to start',
            supportive: 'The app is taking its time starting up - hang in there!',
            concise: 'Slow start'
        },
        
        // Network
        'Network request failed': {
            professional: 'Connection interrupted - your data is safe',
            supportive: 'The internet connection hiccuped - but don\'t worry, your data is safe!',
            concise: 'Offline - data safe'
        },
        
        'Connection failed': {
            professional: 'Working offline - your data is safe',
            supportive: 'No internet right now, but that\'s okay - everything is saved!',
            concise: 'Offline mode'
        },
        
        // Storage/save
        'Data preservation failed:': {
            professional: 'Backup save needs attention:',
            supportive: 'The backup save needs a bit of help:',
            concise: 'Backup issue:'
        },
        
        'Save failed': {
            professional: 'Keeping your work safe. Trying again...',
            supportive: 'Working on saving your data - we\'ll get it saved!',
            concise: 'Saving...'
        },
        
        'Storage error:': {
            professional: 'Storage needs adjustment:',
            supportive: 'The storage system needs a small adjustment:',
            concise: 'Storage issue:'
        },
        
        'Data recovery failed:': {
            professional: 'Data recovery in progress:',
            supportive: 'Working on recovering your data:',
            concise: 'Recovery attempt:'
        },
        
        // Navigation/UI
        'Transition in progress, ignoring request': {
            professional: 'Please wait for current action to complete',
            supportive: 'One moment - finishing the current action first',
            concise: 'Please wait'
        },
        
        'View not found:': {
            professional: 'Looking for that screen:',
            supportive: 'Let me find that screen for you:',
            concise: 'Locating screen:'
        },
        
        'Maximum navigation depth reached': {
            professional: 'Please use the back button to return',
            supportive: 'You\'ve explored quite far! Use the back button when ready',
            concise: 'Use back button'
        },
        
        // Focus/interaction
        'Could not focus fallback element:': {
            professional: 'Screen reader focus adjustment:',
            supportive: 'Making a small screen reader adjustment:',
            concise: 'Focus adjustment:'
        },
        
        'Could not focus element:': {
            professional: 'Interface adjustment needed:',
            supportive: 'Making a quick interface adjustment:',
            concise: 'UI adjustment:'
        },
        
        // Settings/tasks
        'Could not load settings:': {
            professional: 'Settings will use defaults:',
            supportive: 'Using default settings for now:',
            concise: 'Using defaults:'
        },
        
        'Could not load tasks:': {
            professional: 'Tasks are being retrieved:',
            supportive: 'Getting your tasks ready:',
            concise: 'Loading tasks:'
        },
        
        // Safe mode
        'Safe mode: Could not create banner': {
            professional: 'Simple mode is active',
            supportive: 'Simple mode is keeping things calm and easy',
            concise: 'Simple mode on'
        },
        
        // Generic errors
        'Error': {
            professional: 'Let\'s try a different approach',
            supportive: 'No problem - let\'s try something else',
            concise: 'Try again'
        },
        
        'Failed': {
            professional: 'Needs another attempt',
            supportive: 'That didn\'t work out, but that\'s okay - trying again',
            concise: 'Retrying'
        },
        
        'Invalid': {
            professional: 'This needs a different format',
            supportive: 'The system needs this in a different format',
            concise: 'Format needed'
        },
        
        'Wrong': {
            professional: 'Let\'s adjust this',
            supportive: 'This needs a small adjustment',
            concise: 'Needs adjustment'
        }
    };
    
    // Helper to get current mode from storage
    function getCurrentMode() {
        try {
            var saved = localStorage.getItem('stackmap_message_mode');
            if (saved && MESSAGE_MODES[saved.toUpperCase()]) {
                return saved;
            }
        } catch (e) {
            // Storage might be disabled
        }
        return currentMode;
    }
    
    // Transform a message based on current mode
    function transform(message) {
        if (!message) return message;
        
        // Check cache first
        var cacheKey = message + ':' + getCurrentMode();
        if (transformCache[cacheKey]) {
            return transformCache[cacheKey];
        }
        
        var mode = getCurrentMode();
        
        // Try exact match first
        if (messageTransforms[message]) {
            return messageTransforms[message][mode] || messageTransforms[message].professional;
        }
        
        // Try partial matches for common patterns
        var searchTerms = ['Error', 'Failed', 'Invalid', 'Wrong', 'error', 'failed', 'invalid', 'wrong'];
        for (var i = 0; i < searchTerms.length; i++) {
            var term = searchTerms[i];
            if (message.indexOf(term) !== -1) {
                var replacement = messageTransforms[term] || messageTransforms[term.charAt(0).toUpperCase() + term.slice(1)];
                if (replacement) {
                    return replacement[mode] || replacement.professional;
                }
            }
        }
        
        // If no transform found, at least remove trigger words
        var result = sanitize(message);
        
        // Cache the result
        if (cacheSize < MAX_CACHE_SIZE) {
            transformCache[cacheKey] = result;
            cacheSize++;
        } else {
            // Clear cache and start over
            transformCache = {};
            cacheSize = 0;
            transformCache[cacheKey] = result;
            cacheSize++;
        }
        
        return result;
    }
    
    // Remove trigger words from any message
    function sanitize(message) {
        if (!message) return message;
        
        var triggerWords = {
            'Error': 'Issue',
            'error': 'issue',
            'Failed': 'Incomplete',
            'failed': 'incomplete',
            'Wrong': 'Different',
            'wrong': 'different',
            'Invalid': 'Needs adjustment',
            'invalid': 'needs adjustment',
            'Bad': 'Needs improvement',
            'bad': 'needs improvement',
            'Incorrect': 'Needs correction',
            'incorrect': 'needs correction'
        };
        
        var sanitized = message;
        for (var trigger in triggerWords) {
            sanitized = sanitized.split(trigger).join(triggerWords[trigger]);
        }
        
        return sanitized;
    }
    
    // Set message mode
    function setMode(mode) {
        if (MESSAGE_MODES[mode.toUpperCase()]) {
            currentMode = mode;
            try {
                localStorage.setItem('stackmap_message_mode', mode);
            } catch (e) {
                // Storage might be disabled
            }
        }
    }
    
    // Get all available modes
    function getModes() {
        return {
            current: getCurrentMode(),
            available: MESSAGE_MODES,
            descriptions: {
                professional: 'Clear, neutral language (default)',
                supportive: 'Encouraging messages for high RSD sensitivity',
                concise: 'Minimal text, just essential information'
            }
        };
    }
    
    // Create a message using the three-part structure
    function createMessage(acknowledgment, guidance, encouragement) {
        var mode = getCurrentMode();
        
        if (mode === MESSAGE_MODES.CONCISE) {
            // Concise mode: only guidance
            return guidance;
        } else if (mode === MESSAGE_MODES.SUPPORTIVE) {
            // Supportive mode: all three parts
            return acknowledgment + ' ' + guidance + ' ' + encouragement;
        } else {
            // Professional mode: acknowledgment + guidance
            return acknowledgment + ' ' + guidance;
        }
    }
    
    // Integration with rsd-safe-init.js if available
    if (window.RSDSafeInit) {
        // Sync preferences
        var initPrefs = window.RSDSafeInit.getPreferences();
        if (initPrefs.mode === 'direct') {
            currentMode = MESSAGE_MODES.CONCISE;
        } else if (initPrefs.mode === 'supportive') {
            currentMode = MESSAGE_MODES.SUPPORTIVE;
        }
    }
    
    // Public API
    window.StackMapMessaging = {
        transform: transform,
        sanitize: sanitize,
        setMode: function(mode) {
            setMode(mode);
            // Also update rsd-safe-init if available
            if (window.RSDSafeInit) {
                var rsdMode = mode;
                if (mode === MESSAGE_MODES.CONCISE) {
                    rsdMode = 'direct';
                }
                window.RSDSafeInit.setPreferences({ mode: rsdMode });
            }
        },
        getModes: getModes,
        createMessage: createMessage,
        
        // Convenience methods for common scenarios
        networkError: function() {
            return transform('Network request failed');
        },
        
        saveError: function() {
            return transform('Save failed');
        },
        
        loadError: function(what) {
            var mode = getCurrentMode();
            if (mode === MESSAGE_MODES.CONCISE) {
                return 'Loading ' + what + '...';
            } else if (mode === MESSAGE_MODES.SUPPORTIVE) {
                return 'Working on loading your ' + what + ' - almost there!';
            } else {
                return 'Loading ' + what + ' in progress';
            }
        },
        
        validationError: function(field) {
            return createMessage(
                'Thanks for that input.',
                field + ' needs a different format.',
                'You\'ve got this!'
            );
        },
        
        // Developer mode helpers
        enableDeveloperMode: function() {
            if (window.RSDSafeInit) {
                window.RSDSafeInit.setPreferences({ logOriginal: true });
            }
        },
        
        disableDeveloperMode: function() {
            if (window.RSDSafeInit) {
                window.RSDSafeInit.setPreferences({ logOriginal: false });
            }
        },
        
        // Clear cache
        clearCache: function() {
            transformCache = {};
            cacheSize = 0;
        }
    };
})();