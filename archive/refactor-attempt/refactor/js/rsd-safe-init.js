/**
 * RSD-Safe Init - Emergency Error Interception
 * MUST load before ANY other scripts to catch all errors
 * Prevents trigger words from reaching users with ADHD/RSD
 */

// CRITICAL: Override console.error BEFORE anything else can use it
(function() {
    'use strict';
    
    // Check if already initialized (prevent double-loading)
    if (window.__RSD_SAFE_INIT__) return;
    
    // Store original methods IMMEDIATELY (before any other code runs)
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    const originalPrompt = window.prompt;
    const originalOnerror = window.onerror;
    const originalOnunhandledrejection = window.onunhandledrejection;
    
    // Override Error constructor to catch throw statements
    const OriginalError = window.Error;
    const OriginalTypeError = window.TypeError;
    const OriginalReferenceError = window.ReferenceError;
    const OriginalSyntaxError = window.SyntaxError;
    const OriginalRangeError = window.RangeError;
    
    // CRITICAL: Set up error handlers IMMEDIATELY before any errors can occur
    window.onerror = function(message, source, lineno, colno, error) {
        // Emergency transformation before preferences load
        if (message && typeof message === 'string') {
            message = message.replace(/error/gi, 'issue')
                           .replace(/failed/gi, 'needs attention')
                           .replace(/invalid/gi, 'needs adjustment');
        }
        
        // Call original if it exists
        if (originalOnerror) {
            return originalOnerror.call(window, message, source, lineno, colno, error);
        }
        return true; // Suppress default browser error handling
    };
    
    // Also add capture phase listener immediately
    window.addEventListener('error', function(event) {
        if (event.message && typeof event.message === 'string') {
            const transformed = event.message.replace(/error/gi, 'issue')
                                         .replace(/failed/gi, 'needs attention')
                                         .replace(/invalid/gi, 'needs adjustment');
            try {
                Object.defineProperty(event, 'message', {
                    value: transformed,
                    configurable: true
                });
            } catch (e) {}
        }
    }, true); // Capture phase
    
    // User preferences (can be overridden later)
    const preferences = {
        mode: 'supportive', // direct, supportive, concise
        showTechnical: false,
        logOriginal: false // For debugging
    };
    
    // Try to load saved preferences (fail silently)
    try {
        const saved = localStorage.getItem('stackmap_rsd_preferences');
        if (saved) {
            const parsed = JSON.parse(saved);
            preferences.mode = parsed.mode || preferences.mode;
            preferences.showTechnical = parsed.showTechnical || false;
            preferences.logOriginal = parsed.logOriginal || false;
        }
    } catch (e) {
        // localStorage might be disabled - continue with defaults
    }
    
    // Core trigger word replacements (minimal for performance)
    const quickReplacements = {
        'error': 'issue',
        'Error': 'Issue',
        'ERROR': 'ISSUE',
        'failed': 'needs attention',
        'Failed': 'Needs attention',
        'FAILED': 'NEEDS ATTENTION',
        'invalid': 'needs adjustment',
        'Invalid': 'Needs adjustment',
        'INVALID': 'NEEDS ADJUSTMENT',
        'wrong': 'different',
        'Wrong': 'Different',
        'WRONG': 'DIFFERENT',
        'failure': 'incomplete',
        'Failure': 'Incomplete',
        'bad': 'needs improvement',
        'Bad': 'Needs improvement'
    };
    
    // Fast transformation function
    function transform(input) {
        // Handle non-strings
        if (typeof input !== 'string') {
            if (input && input.message) {
                // Don't try to modify error objects - they're often read-only
                // Instead, create a new object with transformed message
                if (input instanceof Error) {
                    return input; // Return error as-is, transformation happens at display time
                }
                // For other objects, try to transform
                try {
                    input.message = transform(input.message);
                } catch (e) {
                    // If read-only, just return as-is
                }
            }
            return input;
        }
        
        // Skip if user wants direct mode
        if (preferences.mode === 'direct') {
            return input;
        }
        
        // Apply quick replacements
        let result = input;
        for (const trigger in quickReplacements) {
            if (quickReplacements.hasOwnProperty(trigger)) {
                // Use split/join for better performance than regex
                result = result.split(trigger).join(quickReplacements[trigger]);
            }
        }
        
        return result;
    }
    
    // Transform array of arguments
    function transformArgs(args) {
        const transformed = [];
        for (let i = 0; i < args.length; i++) {
            transformed.push(transform(args[i]));
        }
        return transformed;
    }
    
    // Override console.error
    console.error = function() {
        const args = Array.prototype.slice.call(arguments);
        
        // Log original if debugging
        if (preferences.logOriginal && originalConsoleError) {
            originalConsoleError.apply(console, ['[ORIGINAL]'].concat(args));
        }
        
        // Transform and log
        const transformed = transformArgs(args);
        originalConsoleError.apply(console, transformed);
    };
    
    // Override console.warn
    console.warn = function() {
        const args = Array.prototype.slice.call(arguments);
        
        if (preferences.logOriginal && originalConsoleWarn) {
            originalConsoleWarn.apply(console, ['[ORIGINAL]'].concat(args));
        }
        
        const transformed = transformArgs(args);
        originalConsoleWarn.apply(console, transformed);
    };
    
    // Override console.log (only transform if it contains trigger words)
    console.log = function() {
        let args = Array.prototype.slice.call(arguments);
        let needsTransform = false;
        
        // Check if any argument contains trigger words
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === 'string') {
                for (const trigger in quickReplacements) {
                    if (args[i].includes(trigger)) {
                        needsTransform = true;
                        break;
                    }
                }
            }
        }
        
        if (needsTransform) {
            args = transformArgs(args);
        }
        
        originalConsoleLog.apply(console, args);
    };
    
    // Override window.alert
    window.alert = function(message) {
        if (preferences.mode !== 'direct') {
            message = transform(message);
        }
        originalAlert.call(window, message);
    };
    
    // Override window.confirm
    window.confirm = function(message) {
        if (preferences.mode !== 'direct') {
            message = transform(message);
        }
        return originalConfirm.call(window, message);
    };
    
    // Override window.prompt
    window.prompt = function(message, defaultValue) {
        if (preferences.mode !== 'direct') {
            message = transform(message);
        }
        return originalPrompt.call(window, message, defaultValue);
    };
    
    // Update the early error handler with full transform function
    // Remove early handler and add new one with full capabilities
    window.removeEventListener('error', arguments.callee, true);
    window.addEventListener('error', function(event) {
        // Transform the error message
        if (event.message) {
            const transformed = transform(event.message);
            
            // Try to modify the event (may be read-only)
            try {
                Object.defineProperty(event, 'message', {
                    value: transformed,
                    configurable: true
                });
            } catch (e) {
                // Some browsers don't allow modification
            }
        }
        
        // Don't prevent default - let app error handlers run
    }, true); // Capture phase to run first
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
        // Transform the reason
        if (event.reason) {
            if (typeof event.reason === 'string') {
                // For strings, we can safely transform
                try {
                    Object.defineProperty(event, 'reason', {
                        value: transform(event.reason),
                        configurable: true
                    });
                } catch (e) {
                    // If read-only, leave as-is
                }
            } else if (event.reason && event.reason.message) {
                // For error objects, don't try to modify - they're often read-only
                // The transform function will handle this appropriately
            }
        }
    }, true);
    
    // Update window.onerror to use full transform function
    window.onerror = function(message, source, lineno, colno, error) {
        // Transform message
        if (message) {
            message = transform(message);
        }
        
        // Call original if it exists
        if (originalOnerror) {
            return originalOnerror.call(window, message, source, lineno, colno, error);
        }
        
        // Prevent default error handling
        return true;
    };
    
    // Public API for preference updates
    window.RSDSafeInit = {
        setPreferences: function(newPrefs) {
            if (newPrefs.mode) {
                preferences.mode = newPrefs.mode;
            }
            if (typeof newPrefs.showTechnical === 'boolean') {
                preferences.showTechnical = newPrefs.showTechnical;
            }
            if (typeof newPrefs.logOriginal === 'boolean') {
                preferences.logOriginal = newPrefs.logOriginal;
            }
            
            // Try to save preferences
            try {
                localStorage.setItem('stackmap_rsd_preferences', JSON.stringify(preferences));
            } catch (e) {
                // Storage might be disabled
            }
        },
        
        getPreferences: function() {
            return {
                mode: preferences.mode,
                showTechnical: preferences.showTechnical,
                logOriginal: preferences.logOriginal
            };
        },
        
        // Manual transform function for dynamic content
        transform: transform
    };
    
    // Override Error constructors to transform messages at creation time
    window.Error = function(message) {
        if (message && preferences.mode !== 'direct') {
            message = transform(message);
        }
        const error = new OriginalError(message);
        // Preserve stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(error, window.Error);
        }
        return error;
    };
    window.Error.prototype = OriginalError.prototype;
    
    window.TypeError = function(message) {
        if (message && preferences.mode !== 'direct') {
            message = transform(message);
        }
        const error = new OriginalTypeError(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(error, window.TypeError);
        }
        return error;
    };
    window.TypeError.prototype = OriginalTypeError.prototype;
    
    window.ReferenceError = function(message) {
        if (message && preferences.mode !== 'direct') {
            message = transform(message);
        }
        const error = new OriginalReferenceError(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(error, window.ReferenceError);
        }
        return error;
    };
    window.ReferenceError.prototype = OriginalReferenceError.prototype;
    
    // Override HTMLElement validation methods
    if (typeof HTMLElement !== 'undefined' && HTMLElement.prototype.setCustomValidity) {
        const originalSetCustomValidity = HTMLElement.prototype.setCustomValidity;
        HTMLElement.prototype.setCustomValidity = function(message) {
            if (message && preferences.mode !== 'direct') {
                message = transform(message);
            }
            return originalSetCustomValidity.call(this, message);
        };
    }
    
    // Override form validation message property
    if (typeof HTMLInputElement !== 'undefined') {
        try {
            const validationMessageDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'validationMessage');
            if (validationMessageDescriptor && validationMessageDescriptor.get) {
                const originalGetter = validationMessageDescriptor.get;
                Object.defineProperty(HTMLInputElement.prototype, 'validationMessage', {
                    get: function() {
                        const message = originalGetter.call(this);
                        if (message && preferences.mode !== 'direct') {
                            return transform(message);
                        }
                        return message;
                    },
                    configurable: true
                });
            }
        } catch (e) {
            // Some browsers don't allow overriding validationMessage
        }
    }
    
    // Mark as initialized
    window.__RSD_SAFE_INIT__ = true;
})();