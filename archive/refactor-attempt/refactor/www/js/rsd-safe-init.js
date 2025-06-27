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
    var originalConsoleError = console.error;
    var originalConsoleWarn = console.warn;
    var originalConsoleLog = console.log;
    var originalAlert = window.alert;
    var originalConfirm = window.confirm;
    var originalPrompt = window.prompt;
    var originalOnerror = window.onerror;
    var originalOnunhandledrejection = window.onunhandledrejection;
    
    // Override Error constructor to catch throw statements
    var OriginalError = window.Error;
    var OriginalTypeError = window.TypeError;
    var OriginalReferenceError = window.ReferenceError;
    var OriginalSyntaxError = window.SyntaxError;
    var OriginalRangeError = window.RangeError;
    
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
            var transformed = event.message.replace(/error/gi, 'issue')
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
    var preferences = {
        mode: 'supportive', // direct, supportive, concise
        showTechnical: false,
        logOriginal: false // For debugging
    };
    
    // Try to load saved preferences (fail silently)
    try {
        var saved = localStorage.getItem('stackmap_rsd_preferences');
        if (saved) {
            var parsed = JSON.parse(saved);
            preferences.mode = parsed.mode || preferences.mode;
            preferences.showTechnical = parsed.showTechnical || false;
            preferences.logOriginal = parsed.logOriginal || false;
        }
    } catch (e) {
        // localStorage might be disabled - continue with defaults
    }
    
    // Core trigger word replacements (minimal for performance)
    var quickReplacements = {
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
                input.message = transform(input.message);
            }
            return input;
        }
        
        // Skip if user wants direct mode
        if (preferences.mode === 'direct') {
            return input;
        }
        
        // Apply quick replacements
        var result = input;
        for (var trigger in quickReplacements) {
            if (quickReplacements.hasOwnProperty(trigger)) {
                // Use split/join for better performance than regex
                result = result.split(trigger).join(quickReplacements[trigger]);
            }
        }
        
        return result;
    }
    
    // Transform array of arguments
    function transformArgs(args) {
        var transformed = [];
        for (var i = 0; i < args.length; i++) {
            transformed.push(transform(args[i]));
        }
        return transformed;
    }
    
    // Override console.error
    console.error = function() {
        var args = Array.prototype.slice.call(arguments);
        
        // Log original if debugging
        if (preferences.logOriginal && originalConsoleError) {
            originalConsoleError.apply(console, ['[ORIGINAL]'].concat(args));
        }
        
        // Transform and log
        var transformed = transformArgs(args);
        originalConsoleError.apply(console, transformed);
    };
    
    // Override console.warn
    console.warn = function() {
        var args = Array.prototype.slice.call(arguments);
        
        if (preferences.logOriginal && originalConsoleWarn) {
            originalConsoleWarn.apply(console, ['[ORIGINAL]'].concat(args));
        }
        
        var transformed = transformArgs(args);
        originalConsoleWarn.apply(console, transformed);
    };
    
    // Override console.log (only transform if it contains trigger words)
    console.log = function() {
        var args = Array.prototype.slice.call(arguments);
        var needsTransform = false;
        
        // Check if any argument contains trigger words
        for (var i = 0; i < args.length; i++) {
            if (typeof args[i] === 'string') {
                for (var trigger in quickReplacements) {
                    if (args[i].indexOf(trigger) !== -1) {
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
            var transformed = transform(event.message);
            
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
                event.reason = transform(event.reason);
            } else if (event.reason && event.reason.message) {
                event.reason.message = transform(event.reason.message);
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
        var error = new OriginalError(message);
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
        var error = new OriginalTypeError(message);
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
        var error = new OriginalReferenceError(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(error, window.ReferenceError);
        }
        return error;
    };
    window.ReferenceError.prototype = OriginalReferenceError.prototype;
    
    // Override HTMLElement validation methods
    if (typeof HTMLElement !== 'undefined' && HTMLElement.prototype.setCustomValidity) {
        var originalSetCustomValidity = HTMLElement.prototype.setCustomValidity;
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
            var validationMessageDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'validationMessage');
            if (validationMessageDescriptor && validationMessageDescriptor.get) {
                var originalGetter = validationMessageDescriptor.get;
                Object.defineProperty(HTMLInputElement.prototype, 'validationMessage', {
                    get: function() {
                        var message = originalGetter.call(this);
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