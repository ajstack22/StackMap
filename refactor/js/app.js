/**
 * StackMap Mobile-First Application
 * Main entry point
 */

// Import modules (using script tags in HTML for now)
// Later can use ES6 modules if needed

(function() {
    'use strict';
    
    // Safe Mode Constants
    const SAFE_MODE_CONSTANTS = {
        BANNER_HEIGHT: 44,
        MAX_ANALYTICS_COUNT: 1000000,
        TIMEOUT_MULTIPLIER: 3.3,
        CACHE_MAX_SIZE: 5,
        TRANSACTION_ID_MAX: 2147483647
    };
    
    // Modern ES6+ - No polyfills needed for Android 6+
    
    // Safe mode detection - must be early in initialization
    (function() {
        'use strict';
        
        // Parse URL parameters properly
        const urlParams = window.location.search;
        let isSafeMode = false;
        let persistSafeMode = false;
        
        // Use proper parameter parsing to avoid false matches (case-insensitive)
        if (urlParams) {
            // Match safe=true as a complete parameter (case-insensitive)
            isSafeMode = /[?&]safe=true(&|$)/i.test(urlParams);
            persistSafeMode = /[?&]persist=true(&|$)/i.test(urlParams);
        }
        
        // Check persistence first (wrapped in try-catch)
        let enableSafeMode = false;
        try {
            const safeUntil = localStorage.getItem('stackmap_safe_mode_until');
            if (safeUntil && parseInt(safeUntil, 10) > Date.now()) {
                enableSafeMode = true;
            }
        } catch (e) {
            // Storage might be disabled - continue without persistence
            const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Safe mode: Storage check failed') : 'Simple mode: Storage check in progress';
            console.warn(msg, e);
        }
        
        // Enable safe mode if URL param or persistence says so
        if (isSafeMode || enableSafeMode) {
            // Set global flag
            window.StackMapSafeMode = true;
            
            // Add visual indicator (check if not already added)
            if (!document.documentElement.classList.contains('safe-mode')) {
                document.documentElement.classList.add('safe-mode');
            }
            
            // Configure safe mode settings
            window.SAFE_MODE_CONFIG = {
                disableAnimations: true,
                disableSync: true,
                simplifiedUI: true,
                largerTouchTargets: true,
                extendedTimeouts: true,
                minimalFeatures: true,
                timeoutMultiplier: 3.3 // Consistent multiplier for all timeouts
            };
            
            // Store preference if persist=true and URL param is present
            if (isSafeMode && persistSafeMode) {
                try {
                    const tomorrow = new Date();
                    // Validate date is valid
                    if (!isNaN(tomorrow.getTime())) {
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        localStorage.setItem('stackmap_safe_mode_until', tomorrow.getTime().toString());
                    }
                } catch (e) {
                    // Storage might be disabled or quota exceeded
                    if (e.name === 'QuotaExceededError') {
                        const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Safe mode: Storage quota exceeded') : 'Simple mode: Storage is full';
                        console.warn(msg);
                    } else {
                        const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Safe mode: Could not persist preference') : 'Simple mode: Preference will apply to this session';
                        console.warn(msg, e);
                    }
                }
            }
            
            // Analytics counter with overflow protection
            try {
                let count = parseInt(localStorage.getItem('stackmap_safe_mode_count') || '0', 10);
                // Reset at MAX_ANALYTICS_COUNT to continue tracking
                if (count >= SAFE_MODE_CONSTANTS.MAX_ANALYTICS_COUNT) {
                    count = 0;
                }
                localStorage.setItem('stackmap_safe_mode_count', (count + 1).toString());
            } catch (e) {
                // Handle QuotaExceededError
                if (e.name === 'QuotaExceededError') {
                    // Try to clear old data and retry
                    try {
                        localStorage.removeItem('stackmap_safe_mode_count');
                    } catch (e2) {
                        // Storage completely full - continue without analytics
                    }
                }
                // Storage might be disabled - continue without analytics
            }
        }
    })();
    
    // Phase 4: Error Detection System
    (function() {
        'use strict';
        
        // Error state tracking
        const errorState = {
            hasError: false,
            errorCount: 0,
            lastError: null,
            errorTimes: [], // Track error timestamps for circuit breaker
            seenErrors: {} // Deduplication tracking
        };
        
        // Recursion guard
        let errorHandlerActive = false;
        
        // Helper to activate fallback UI
        function activateFallback() {
            // Prevent recursion and multiple activations
            if (errorHandlerActive || errorState.hasError) return;
            
            errorHandlerActive = true;
            errorState.hasError = true;
            
            try {
                // CRITICAL: Save data immediately before showing error UI
                if (window.StackMapDataPreservation) {
                    window.StackMapDataPreservation.saveNow('error-state', {
                        timestamp: Date.now(),
                        errorCount: errorState.errorCount,
                        lastError: errorState.lastError
                    });
                }
                
                // Find main view and activate fallback
                const mainView = document.getElementById('main-view');
                if (mainView && !mainView.classList.contains('component-error-active')) {
                    mainView.classList.add('component-error-active');
                    // Note: Removed automatic focus - let users control focus
                }
            } catch (e) {
                // Even fallback activation failed - last resort
                try {
                    window.location.href = 'emergency-static.html';
                } catch (redirectErr) {
                    // Complete failure - nothing we can do
                }
            } finally {
                errorHandlerActive = false;
            }
        }
        
        // Circuit breaker check: configurable based on safe mode
        function checkCircuitBreaker() {
            const now = Date.now();
            const timeWindow = 10000; // 10 seconds
            const errorThreshold = window.StackMapSafeMode ? 10 : 5; // More tolerant in safe mode
            const windowStart = now - timeWindow;
            
            // Remove old timestamps
            errorState.errorTimes = errorState.errorTimes.filter(function(time) {
                return time > windowStart;
            });
            
            // Add current timestamp
            errorState.errorTimes.push(now);
            
            // Check if circuit breaker should trip
            if (errorState.errorTimes.length >= errorThreshold) {
                // Redirect to safe mode
                try {
                    window.location.href = 'index.html?safe=true&persist=true';
                } catch (e) {
                    // Fall back to emergency page
                    try {
                        window.location.href = 'emergency-static.html';
                    } catch (e2) {}
                }
                return true;
            }
            return false;
        }
        
        // Error deduplication helper
        function isDuplicateError(message) {
            const key = (message || 'unknown').substring(0, 100); // Limit key size
            
            // Memory cleanup: reset after 100 entries
            const errorCount = Object.keys(errorState.seenErrors).length;
            if (errorCount > 100) {
                errorState.seenErrors = {};
            }
            
            if (errorState.seenErrors[key]) {
                return true;
            }
            errorState.seenErrors[key] = true;
            return false;
        }
        
        // Global error handler
        const originalOnError = window.onerror;
        window.onerror = function(message, source, lineno, colno, error) {
            try {
                // Error limit check
                if (errorState.errorCount > 10) {
                    return true; // Stop processing new errors
                }
                
                // Deduplication check
                if (isDuplicateError(message)) {
                    return true; // Skip duplicate errors
                }
                
                errorState.errorCount++;
                errorState.lastError = message || 'Unknown error';
                
                // Circuit breaker check
                if (checkCircuitBreaker()) {
                    return true; // Circuit breaker tripped
                }
                
                // Log for debugging (fail silently if console is broken)
                try {
                    const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Runtime error:') : 'Something unexpected happened:';
                    console.error(msg, message, source, lineno);
                } catch (e) {}
                
                // Activate fallback UI
                activateFallback();
                
            } catch (e) {
                // Error handler itself failed - try emergency redirect
                if (!errorHandlerActive) {
                    try {
                        window.location.href = 'emergency-static.html';
                    } catch (e2) {}
                }
            }
            
            // Call original handler if it exists
            if (originalOnError) {
                try {
                    return originalOnError.apply(window, arguments);
                } catch (e) {}
            }
            
            // Prevent default error handling
            return true;
        };
        
        // Promise rejection handler
        window.addEventListener('unhandledrejection', function(event) {
            try {
                // Error limit check
                if (errorState.errorCount > 10) {
                    return;
                }
                
                // Deduplication check
                const prefix = window.StackMapMessaging ? window.StackMapMessaging.transform('Promise rejection:') : 'Processing didn\'t complete:';
                const errorMsg = `${prefix} ${event.reason || 'unknown'}`;
                if (isDuplicateError(errorMsg)) {
                    return;
                }
                
                errorState.errorCount++;
                errorState.lastError = window.StackMapMessaging ? window.StackMapMessaging.transform('Unhandled promise rejection') : 'Background task needs attention';
                
                // Circuit breaker check
                if (checkCircuitBreaker()) {
                    return;
                }
                
                // Log for debugging
                try {
                    const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Unhandled rejection:') : 'Background process update:';
                    console.error(msg, event.reason);
                } catch (e) {}
                
                // Activate fallback UI
                activateFallback();
                
            } catch (e) {
                // Handler failed - try emergency redirect
                if (!errorHandlerActive) {
                    try {
                        window.location.href = 'emergency-static.html';
                    } catch (e2) {}
                }
            }
        });
        
        // App loading timeout (configurable based on safe mode)
        const timeoutDuration = window.StackMapSafeMode ? 
            Math.round(10000 * SAFE_MODE_CONSTANTS.TIMEOUT_MULTIPLIER) : 10000;
            
        let loadingTimeout = setTimeout(function() {
            try {
                // Check if app is still in loading state
                const loadingView = document.getElementById('loading-view');
                
                if (loadingView && !loadingView.classList.contains('hidden')) {
                    // Still loading after timeout - activate fallback
                    errorState.lastError = window.StackMapMessaging ? window.StackMapMessaging.transform('App loading timeout') : 'Taking longer than usual to start';
                    
                    // Don't count timeout as error for circuit breaker
                    activateFallback();
                }
            } catch (e) {
                // Timeout check failed
                try {
                    window.location.href = 'emergency-static.html';
                } catch (e2) {}
            }
        }, timeoutDuration);
        
        // Network failure detection (for future API calls)
        window.StackMapErrorDetection = {
            reportNetworkError: function() {
                try {
                    if (errorState.errorCount > 10) return;
                    
                    if (isDuplicateError('Network request failed')) return;
                    
                    errorState.errorCount++;
                    errorState.lastError = window.StackMapMessaging ? window.StackMapMessaging.networkError() : 'Connection interrupted - your data is safe';
                    
                    if (checkCircuitBreaker()) return;
                    
                    activateFallback();
                } catch (e) {}
            },
            
            clearLoadingTimeout: function() {
                // Called when app successfully loads
                if (loadingTimeout) {
                    clearTimeout(loadingTimeout);
                    loadingTimeout = null;
                }
            },
            
            getErrorState: function() {
                return {
                    hasError: errorState.hasError,
                    errorCount: errorState.errorCount,
                    lastError: errorState.lastError
                };
            }
        };
    })();
    
    // Phase 4: Data Preservation System
    (function() {
        'use strict';
        
        // Preservation state
        const preservationState = {
            lastSave: 0,
            saveInterval: 1000, // Save every second
            maxFormFields: 5 // Limit hidden fields to prevent DOM bloat
        };
        
        // Get or create hidden form for data preservation
        function getPreservationForm() {
            let form = document.getElementById('data-preservation-form');
            if (!form) {
                form = document.createElement('form');
                form.id = 'data-preservation-form';
                form.style.display = 'none';
                form.setAttribute('aria-hidden', 'true');
                document.body.appendChild(form);
            }
            return form;
        }
        
        // Save data to multiple locations
        function preserveData(key, value) {
            if (!key || value === undefined) return;
            
            try {
                // 1. Save to hidden form field
                const form = getPreservationForm();
                let field = form.querySelector(`[name="${key}"]`);
                
                if (!field) {
                    // Limit form fields to prevent memory issues
                    if (form.children.length >= preservationState.maxFormFields) {
                        form.removeChild(form.firstChild);
                    }
                    
                    field = document.createElement('input');
                    field.type = 'hidden';
                    field.name = key;
                    form.appendChild(field);
                }
                
                field.value = typeof value === 'string' ? value : JSON.stringify(value);
                
                // 2. Try localStorage (may fail)
                try {
                    localStorage.setItem(`stackmap_preserve_${key}`, field.value);
                } catch (e) {
                    // Storage might be full or disabled - continue without it
                }
                
                preservationState.lastSave = Date.now();
                
                // Show subtle save indicator
                showSaveIndicator(true);
                
            } catch (e) {
                // Preservation failed - show error indicator
                showSaveIndicator(false);
                try {
                    const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Data preservation failed:') : 'Backup save needs attention:';
                    console.warn(msg, e);
                } catch (e2) {}
            }
        }
        
        // Visual save status indicator
        function showSaveIndicator(success) {
            try {
                let indicator = document.getElementById('save-indicator');
                if (!indicator) {
                    indicator = document.createElement('div');
                    indicator.id = 'save-indicator';
                    indicator.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:8px 12px;' +
                        'border-radius:4px;font-size:14px;opacity:0;transition:opacity 0.3s;z-index:9999;';
                    document.body.appendChild(indicator);
                }
                
                indicator.style.background = success ? '#4ade80' : '#f87171';
                indicator.style.color = success ? '#000' : '#fff';
                indicator.textContent = success ? 'Saved' : (window.StackMapMessaging ? window.StackMapMessaging.saveError() : 'Keeping your work safe. Trying again...');
                indicator.style.opacity = '1';
                
                // Fade out after 2 seconds
                setTimeout(function() {
                    if (indicator) indicator.style.opacity = '0';
                }, 2000);
            } catch (e) {
                // Indicator failed - continue without visual feedback
            }
        }
        
        // Recover data from all sources
        function recoverData(key) {
            if (!key) return null;
            
            try {
                // 1. Check form fields first (most reliable)
                const form = document.getElementById('data-preservation-form');
                if (form) {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field && field.value) {
                        try {
                            return JSON.parse(field.value);
                        } catch (e) {
                            return field.value; // Return as string if not JSON
                        }
                    }
                }
                
                // 2. Check localStorage
                try {
                    const stored = localStorage.getItem(`stackmap_preserve_${key}`);
                    if (stored) {
                        try {
                            return JSON.parse(stored);
                        } catch (e) {
                            return stored;
                        }
                    }
                } catch (e) {}
                
                // 3. Check URL parameters (for last-task)
                if (key === 'last-task') {
                    const urlParams = new URLSearchParams(window.location.search);
                    const lastTask = urlParams.get('last-task');
                    if (lastTask) return lastTask;
                }
                
            } catch (e) {
                // Recovery failed
                try {
                    const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Data recovery failed:') : 'Data recovery in progress:';
                    console.warn(msg, e);
                } catch (e2) {}
            }
            
            return null;
        }
        
        // Continuous save mechanism - debounced
        let saveTimeout = null;
        function scheduleSave(key, value) {
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }
            
            saveTimeout = setTimeout(function() {
                preserveData(key, value);
                saveTimeout = null;
            }, 100); // Debounce for 100ms
        }
        
        // Public API
        window.StackMapDataPreservation = {
            save: scheduleSave,
            saveNow: preserveData,
            recover: recoverData,
            
            // Save task data (call from task editing)
            saveTaskData: function(taskData) {
                if (!taskData) return;
                scheduleSave('current-task', taskData);
                scheduleSave('last-modified', Date.now());
            },
            
            // Save location context
            saveLocation: function(location) {
                if (!location) return;
                scheduleSave('last-location', location);
                
                // Also update the hidden field in fallback UI
                try {
                    const field = document.getElementById('last-task');
                    if (field) field.value = location;
                } catch (e) {}
            },
            
            // Recovery helper for app initialization
            recoverSession: function() {
                return {
                    currentTask: recoverData('current-task'),
                    lastLocation: recoverData('last-location'),
                    lastModified: recoverData('last-modified')
                };
            }
        };
    })();
    
    // Phase 4: Performance Monitor System
    (function() {
        'use strict';
        
        // ADHD-optimized performance thresholds
        const ADHD_THRESHOLDS = {
            immediate: 100,      // Feels instant
            noticeable: 500,     // Timing perception issues begin
            critical: 1000,      // High abandonment risk
            abandon: 2000        // 70-85% will leave
        };
        
        // Performance state
        const performanceState = {
            interactions: [],
            reducedMode: false,
            sessionStart: Date.now()
        };
        
        // Track interaction performance
        function trackInteraction(name, startTime) {
            if (performanceState.reducedMode) return;
            
            const duration = performance.now() - startTime;
            performanceState.interactions.push({
                name: name,
                duration: duration,
                timestamp: Date.now()
            });
            
            // Warn if exceeding ADHD thresholds
            if (duration > ADHD_THRESHOLDS.noticeable) {
                console.warn(`[PERF] ${name} took ${duration}ms - exceeds ADHD threshold`);
                
                // Send to analytics if enabled
                if (window.StackMapAnalytics && window.StackMapFeatureFlags && 
                    window.StackMapFeatureFlags.isEnabled('performance-tracking')) {
                    window.StackMapAnalytics.track('slow-interaction', {
                        name: name,
                        duration: duration,
                        threshold: ADHD_THRESHOLDS.noticeable
                    });
                }
                
                // Auto-trigger safe mode for extremely slow interactions
                if (duration > ADHD_THRESHOLDS.abandon * 1.5) {
                    console.error('[PERF] Critical performance issue - triggering safe mode');
                    window.location.href = `${window.location.pathname}?safe=true&reason=performance`;
                }
            }
        }
        
        // Monitor overall performance
        function checkPerformanceBudget() {
            if (!window.performance || !window.performance.timing) return;
            
            const timing = window.performance.timing;
            const interactiveTime = timing.domInteractive - timing.navigationStart;
            
            if (interactiveTime > ADHD_THRESHOLDS.critical) {
                console.error(`[PERF] Interactive time budget exceeded: ${interactiveTime}ms`);
                
                // Consider triggering safe mode
                if (interactiveTime > ADHD_THRESHOLDS.abandon) {
                    const shouldTriggerSafeMode = confirm(
                        'The app is running slowly. Would you like to switch to simple mode for better performance?'
                    );
                    if (shouldTriggerSafeMode) {
                        window.location.href = `${window.location.pathname}?safe=true&reason=performance`;
                    }
                }
            }
        }
        
        // Public API
        window.StackMapPerformanceMonitor = {
            ADHD_THRESHOLDS: ADHD_THRESHOLDS,
            trackInteraction: trackInteraction,
            checkBudget: checkPerformanceBudget,
            setReducedMode: function(enabled) {
                performanceState.reducedMode = enabled;
            },
            getSessionMetrics: function() {
                const totalInteractions = performanceState.interactions.length;
                const slowInteractions = performanceState.interactions.filter(function(i) {
                    return i.duration > ADHD_THRESHOLDS.noticeable;
                }).length;
                
                return {
                    sessionDuration: Date.now() - performanceState.sessionStart,
                    totalInteractions: totalInteractions,
                    slowInteractions: slowInteractions,
                    slowPercentage: totalInteractions > 0 ? (slowInteractions / totalInteractions * 100) : 0
                };
            }
        };
    })();
    
    // Phase 4: Feature Flags System
    (function() {
        'use strict';
        
        // Feature flag configuration
        const flags = {
            'performance-tracking': { enabled: true, rolloutPercentage: 100 },
            'haptic-feedback': { enabled: true, rolloutPercentage: 50 },
            'skeleton-screens': { enabled: true, rolloutPercentage: 100 },
            'auto-recovery': { enabled: true, rolloutPercentage: 100 },
            'memory-monitoring': { enabled: false, rolloutPercentage: 10 }, // Start cautiously
            'progressive-loading': { enabled: true, rolloutPercentage: 100 }
        };
        
        // Check localStorage for overrides
        function loadOverrides() {
            try {
                for (const flagName in flags) {
                    const override = localStorage.getItem(`stackmap-ff-override-${flagName}`);
                    if (override === 'disabled') {
                        flags[flagName].enabled = false;
                    } else if (override === 'enabled') {
                        flags[flagName].enabled = true;
                    }
                }
            } catch (e) {
                console.log('Could not load feature flag overrides:', e);
            }
        }
        
        // Get consistent user hash for A/B testing
        function getUserHash() {
            const userId = localStorage.getItem('stackmap-user-id') || 'anonymous';
            let hash = 0;
            for (let i = 0; i < userId.length; i++) {
                hash = ((hash << 5) - hash) + userId.charCodeAt(i);
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash);
        }
        
        // Check if feature is enabled for user
        function isEnabled(flagName) {
            const flag = flags[flagName];
            if (!flag || !flag.enabled) return false;
            
            // Check rollout percentage
            const userHash = getUserHash();
            return (userHash % 100) < flag.rolloutPercentage;
        }
        
        // Emergency kill switch
        function disableFeature(flagName) {
            if (flags[flagName]) {
                flags[flagName].enabled = false;
                // Persist to localStorage for immediate effect
                try {
                    localStorage.setItem(`stackmap-ff-override-${flagName}`, 'disabled');
                } catch (e) {
                    console.error('Could not persist feature flag override:', e);
                }
            }
        }
        
        // Enable feature (for testing)
        function enableFeature(flagName) {
            if (flags[flagName]) {
                flags[flagName].enabled = true;
                try {
                    localStorage.setItem(`stackmap-ff-override-${flagName}`, 'enabled');
                } catch (e) {
                    console.error('Could not persist feature flag override:', e);
                }
            }
        }
        
        // Public API
        window.StackMapFeatureFlags = {
            isEnabled: isEnabled,
            isDisabled: function(flagName) { return !isEnabled(flagName); },
            disableFeature: disableFeature,
            enableFeature: enableFeature,
            getAllFlags: function() { return JSON.parse(JSON.stringify(flags)); },
            init: function() {
                loadOverrides();
            }
        };
    })();
    
    // Phase 4: Haptic Feedback System
    (function() {
        'use strict';
        
        // Haptic patterns for ADHD users (20-30% stronger)
        const patterns = {
            buttonPress: [30],      // 30% stronger than standard
            success: [20, 50, 20],  // Success pattern
            error: [10, 10, 10],    // Gentle error (no blame)
            progress: [15],         // Progress tick
            focus: [25]             // Focus change
        };
        
        // Haptic state
        const hapticState = {
            hasUserInteracted: false,
            supported: false
        };
        
        // Check support on init
        function checkSupport() {
            hapticState.supported = window.navigator && 
                                  typeof window.navigator.vibrate === 'function';
        }
        
        // Trigger haptic feedback
        function trigger(patternName) {
            // Check if disabled by feature flag or user settings
            if (window.StackMapFeatureFlags && 
                window.StackMapFeatureFlags.isDisabled('haptic-feedback')) {
                return;
            }
            
            // Check user settings
            if (window.StackMapApp && 
                window.StackMapApp.settings && 
                window.StackMapApp.settings.disableHaptics) {
                return;
            }
            
            // Check browser support
            if (!hapticState.supported) {
                return;
            }
            
            // iOS requires user interaction first
            if (!hapticState.hasUserInteracted) {
                return;
            }
            
            try {
                const pattern = patterns[patternName] || patterns.buttonPress;
                window.navigator.vibrate(pattern);
            } catch (err) {
                console.log('[Haptic] Feedback error:', err);
                hapticState.supported = false; // Disable if it fails
            }
        }
        
        // Enable after user interaction (required for iOS)
        function enableAfterInteraction() {
            hapticState.hasUserInteracted = true;
        }
        
        // Initialize listener for first interaction
        function initInteractionListener() {
            const onFirstInteraction = function() {
                enableAfterInteraction();
                document.removeEventListener('click', onFirstInteraction);
                document.removeEventListener('touchstart', onFirstInteraction);
            };
            
            document.addEventListener('click', onFirstInteraction);
            document.addEventListener('touchstart', onFirstInteraction);
        }
        
        // Public API
        window.StackMapHapticFeedback = {
            trigger: trigger,
            patterns: patterns,
            enableAfterInteraction: enableAfterInteraction,
            init: function() {
                checkSupport();
                initInteractionListener();
            }
        };
    })();
    
    // Application state
    const App = {
        currentView: 'loading-view',
        platform: null,
        views: {},
        navigationStack: ['main-view'], // Track navigation depth
        maxDepth: 3, // Maximum navigation depth for ADHD users
        isTransitioning: false, // Prevent concurrent transitions
        transactionId: 0, // Transaction ID to prevent async races
        focusableCache: {}, // Cache focusable elements per view
        focusableCacheSize: 0, // Track cache size
        animationTimeoutId: null, // Track current animation timeout
        focusTimeoutId: null, // Track current focus timeout
        
        // Demo mode support
        showUserSetup: function() {
            // Show user creation view or modal
            if (window.ProfileUI && window.ProfileUI.showUserCreation) {
                window.ProfileUI.showUserCreation();
            } else {
                ViewController.show('settings-view');
            }
        },
        
        showNotification: function(message, type) {
            // Show a notification message
            console.log('[Notification]', `${type}:`, message);
            // TODO: Implement visual notification system
        },
        
        getCurrentUserPreferences: function() {
            if (window.UserManager) {
                const currentUser = window.UserManager.getCurrentUser();
                return currentUser ? currentUser.preferences : null;
            }
            return null;
        },
        
        init: function() {
            // Re-initialize the app (used by demo mode)
            init();
        }
    };
    
    // View Controller
    const ViewController = {
        init: function() {
            // Cache all view elements
            const viewElements = document.querySelectorAll('.view');
            viewElements.forEach(function(view) {
                App.views[view.id] = view;
            });
        },
        
        show: function(viewId, options = {}) {
            // CRITICAL: Prevent concurrent transitions
            if (App.isTransitioning) {
                const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Transition in progress, ignoring request') : 'Please wait for current action to complete';
                console.warn(msg);
                return false;
            }

            // Set flag FIRST to prevent race conditions
            App.isTransitioning = true;

            // Atomic transaction ID handling to prevent race condition
            let transactionId;
            if (App.transactionId >= SAFE_MODE_CONSTANTS.TRANSACTION_ID_MAX) {
                transactionId = App.transactionId = 1;
            } else {
                transactionId = ++App.transactionId;
            }

            try {
                const fromView = App.views[App.currentView];
                const toView = App.views[viewId];
                
                if (!toView) {
                    const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('View not found:') : 'Looking for that screen:';
                    console.warn(msg, viewId);
                    App.isTransitioning = false; // CRITICAL: Always reset flag!
                    return false;
                }
                
                if (fromView === toView) {
                    App.isTransitioning = false; // CRITICAL: Always reset flag!
                    return false;
                }
                
                // Check navigation depth for ADHD users
                if (!options.isBack && viewId !== 'main-view') {
                    if (App.navigationStack.length >= App.maxDepth) {
                        const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Maximum navigation depth reached') : 'Please use the back button to return';
                        console.warn(msg);
                        this.showDepthWarning();
                        App.isTransitioning = false; // CRITICAL: Always reset flag!
                        return false;
                    }
                }
                
                // Handle transition (skip animations in safe mode)
                if (options.animate && fromView && !window.StackMapSafeMode) {
                    const self = this;
                    
                    // Cancel any previous animation
                    if (App.animationTimeoutId) {
                        clearTimeout(App.animationTimeoutId);
                        App.animationTimeoutId = null;
                    }
                    
                    // Clean up view-specific modules before transitioning
                    self.cleanupView(fromView);
                    
                    fromView.classList.add('sliding-out');
                    toView.classList.remove('hidden');
                    toView.classList.add('sliding-in');
                    
                    App.animationTimeoutId = setTimeout(function() {
                        // Verify this is still the current transaction
                        if (transactionId !== App.transactionId) return;
                        
                        App.animationTimeoutId = null;
                        
                        fromView.classList.add('hidden');
                        fromView.classList.remove('sliding-out');
                        toView.classList.remove('sliding-in');
                        
                        // Verify transaction still valid before updating stack
                        if (transactionId === App.transactionId) {
                            // Update navigation stack after successful transition
                            if (!options.isBack && viewId !== 'main-view') {
                                App.navigationStack.push(viewId);
                            } else if (options.isBack && App.navigationStack.length > 1) {
                                App.navigationStack.pop();
                            }
                        }
                        
                        // Update current view after successful transition
                        App.currentView = viewId;
                        
                        // Focus management for accessibility
                        self.manageFocus(toView);
                        
                        // Announce view change for screen readers
                        self.announceViewChange(toView);
                        
                        App.isTransitioning = false;
                    }, window.StackMapSafeMode ? Math.round(300 * SAFE_MODE_CONSTANTS.TIMEOUT_MULTIPLIER) : 300);
                } else {
                    // Instant transition
                    if (fromView) {
                        this.cleanupView(fromView);
                        fromView.classList.add('hidden');
                    }
                    toView.classList.remove('hidden');
                    
                    // Update navigation stack after successful transition
                    if (!options.isBack && viewId !== 'main-view') {
                        App.navigationStack.push(viewId);
                    } else if (options.isBack && App.navigationStack.length > 1) {
                        App.navigationStack.pop();
                    }
                    
                    // Update current view after successful transition
                    App.currentView = viewId;
                    
                    this.manageFocus(toView);
                    
                    // Announce view change for screen readers
                    this.announceViewChange(toView);
                    
                    App.isTransitioning = false;
                }
                
                // Update history for web
                if (Platform.isWeb() && options.updateHistory !== false && !options.isBack) {
                    const path = viewId === 'main-view' ? '/' : `#${viewId.replace('-view', '')}`;
                    history.pushState({ view: viewId, depth: App.navigationStack.length }, '', path);
                }
                
                // Dispatch view change event
                document.dispatchEvent(new CustomEvent('viewchange', {
                    detail: { view: viewId, previousView: App.currentView }
                }));
                
                return true;
            } finally {
                // Reset flag if still set for this transaction
                if (transactionId === App.transactionId && App.isTransitioning) {
                    App.isTransitioning = false;
                }
            }
        },
        
        manageFocus: function(view) {
            // Use cached focusables for Android 5 performance
            const viewId = view.id;
            const focusables = this.getCachedFocusables(viewId);
            
            // If no focusables, try to focus heading or main element
            if (focusables.length === 0) {
                const fallback = view.querySelector('h1, h2, main, [role="main"]');
                if (fallback) {
                    fallback.tabIndex = -1;
                    try {
                        fallback.focus();
                    } catch (e) {
                        const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Could not focus fallback element:') : 'Screen reader focus adjustment:';
                        console.warn(msg, e);
                    }
                }
                return;
            }
            
            if (focusables.length > 0) {
                // Clear any pending focus operation
                if (App.focusTimeoutId) {
                    clearTimeout(App.focusTimeoutId);
                    App.focusTimeoutId = null;
                }
                
                App.focusTimeoutId = setTimeout(function() {
                    // Re-check that element is still visible and focusable
                    if (focusables[0] && !focusables[0].disabled && focusables[0].offsetParent !== null) {
                        try {
                            focusables[0].focus();
                            App.focusTimeoutId = null; // Clear AFTER successful focus
                        } catch (e) {
                            App.focusTimeoutId = null; // Clear on failure too
                            const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Could not focus element:') : 'Interface adjustment needed:';
                            console.warn(msg, e);
                        }
                    } else {
                        App.focusTimeoutId = null; // Clear if element not focusable
                    }
                }, window.StackMapSafeMode ? Math.round(100 * SAFE_MODE_CONSTANTS.TIMEOUT_MULTIPLIER) : 100); // Delay to ensure view is rendered
            }
        },
        
        getCachedFocusables: function(viewId) {
            // Cache focusables per view for Android 5 performance
            if (!App.focusableCache[viewId] || Date.now() - App.focusableCache[viewId].timestamp > 1000) {
                const view = App.views[viewId];
                if (!view) return [];
                
                // Limit cache size
                if (App.focusableCacheSize >= SAFE_MODE_CONSTANTS.CACHE_MAX_SIZE) {
                    // Remove oldest cache entry
                    let oldestId = null;
                    let oldestTime = Date.now();
                    for (const id in App.focusableCache) {
                        if (App.focusableCache[id].timestamp < oldestTime) {
                            oldestTime = App.focusableCache[id].timestamp;
                            oldestId = id;
                        }
                    }
                    if (oldestId) {
                        delete App.focusableCache[oldestId];
                        App.focusableCacheSize--;
                    }
                }
                
                const elements = view.querySelectorAll(
                    'button:not([disabled]), ' +
                    'a[href]:not([disabled]), ' +
                    'input:not([disabled]), ' +
                    'select:not([disabled]), ' +
                    'textarea:not([disabled]), ' +
                    '[tabindex="0"]:not([disabled])'
                );
                
                App.focusableCache[viewId] = {
                    elements: [...elements],
                    timestamp: Date.now()
                };
                App.focusableCacheSize++;
            }
            
            return App.focusableCache[viewId].elements;
        },
        
        /**
         * Clean up view-specific modules to prevent memory leaks
         */
        cleanupView: function(view) {
            // Clean up modules based on view ID
            if (view.id === 'main-view') {
                // Clean up TaskDisplay
                if (window.TaskDisplay && window.TaskDisplay.destroy) {
                    window.TaskDisplay.destroy();
                }
                // Clean up EditMode
                if (window.EditMode && window.EditMode.destroy) {
                    window.EditMode.destroy();
                }
            }
            // Add other view cleanups as needed for other modules
        },
        
        announceViewChange: function(view) {
            // Create or update ARIA live region
            let announcer = document.getElementById('view-announcer');
            if (!announcer) {
                announcer = document.createElement('div');
                announcer.id = 'view-announcer';
                announcer.setAttribute('aria-live', 'polite');
                announcer.setAttribute('aria-atomic', 'true');
                announcer.style.position = 'absolute';
                announcer.style.left = '-10000px';
                document.body.appendChild(announcer);
            }
            
            // Announce the view change
            const viewTitle = view.querySelector('h1, h2');
            const announcement = viewTitle ? viewTitle.textContent : 'New view loaded';
            announcer.textContent = announcement;
        },
        
        showDepthWarning: function() {
            // Show a gentle warning about navigation depth
            const warning = document.createElement('div');
            warning.className = 'depth-warning';
            warning.textContent = window.StackMapMessaging ? window.StackMapMessaging.transform('Please use the back button to return') : 'Please use the back button to return';
            warning.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 10px 20px; border-radius: 4px; z-index: 9999;';
            document.body.appendChild(warning);
            
            setTimeout(function() {
                if (warning.parentNode) {
                    warning.parentNode.removeChild(warning);
                }
            }, window.StackMapSafeMode ? Math.round(3000 * SAFE_MODE_CONSTANTS.TIMEOUT_MULTIPLIER) : 3000);
        }
    };
    
    // Platform Detection and Adaptation
    const Platform = {
        detect: function() {
            const ua = navigator.userAgent;
            App.platform = {
                isCapacitor: typeof window.Capacitor !== 'undefined',
                isAndroid: false,
                isIOS: false,
                isPWA: window.matchMedia('(display-mode: standalone)').matches,
                isTV: ua.includes('TV') || window.innerWidth > 1920,
                isWeb: false
            };
            
            if (App.platform.isCapacitor) {
                const platform = window.Capacitor.getPlatform();
                App.platform.isAndroid = platform === 'android';
                App.platform.isIOS = platform === 'ios';
            } else if (!App.platform.isPWA) {
                App.platform.isWeb = true;
            }
            
            return App.platform;
        },
        
        isWeb: function() {
            return App.platform && App.platform.isWeb;
        },
        
        isTV: function() {
            return App.platform && App.platform.isTV;
        },
        
        isMobile: function() {
            return App.platform && (App.platform.isCapacitor || App.platform.isPWA);
        }
    };
    
    // Navigation Handler
    const Navigation = {
        boundHandlers: {},
        
        init: function() {
            // Store bound handlers for cleanup
            this.boundHandlers.handleClick = this.handleClick.bind(this);
            this.boundHandlers.handlePopState = this.handlePopState.bind(this);
            
            // Handle all link clicks
            document.addEventListener('click', this.boundHandlers.handleClick);
            
            // Handle back button
            window.addEventListener('popstate', this.boundHandlers.handlePopState);
            
            // Set up view navigation buttons
            this.setupViewButtons();
            
            // TV remote navigation
            if (Platform.isTV()) {
                TVNavigation.init();
            }
        },
        
        cleanup: function() {
            // Remove event listeners
            if (this.boundHandlers.handleClick) {
                document.removeEventListener('click', this.boundHandlers.handleClick);
            }
            if (this.boundHandlers.handlePopState) {
                window.removeEventListener('popstate', this.boundHandlers.handlePopState);
            }
        },
        
        handleClick: function(e) {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href || href === '#') return;
            
            e.preventDefault();
            
            // Internal navigation
            if (href.startsWith('#')) {
                const viewId = `${href.substring(1)}-view`;
                ViewController.show(viewId, { animate: true });
            }
            // External links - explicitly check for http:// or https://
            else if (href.indexOf('http://') === 0 || href.indexOf('https://') === 0) {
                this.openExternal(href);
            }
        },
        
        handlePopState: function(e) {
            if (e.state && e.state.view) {
                // Determine if this is a back navigation
                const isBack = e.state.depth < App.navigationStack.length;
                ViewController.show(e.state.view, { animate: true, updateHistory: false, isBack: isBack });
            } else {
                // No state, go to main view
                ViewController.show('main-view', { animate: true, updateHistory: false });
            }
        },
        
        setupViewButtons: function() {
            // Menu button
            const menuBtn = document.getElementById('menu-button');
            if (menuBtn) {
                menuBtn.addEventListener('click', function() {
                    ViewController.show('settings-view', { animate: true });
                });
            }
            
            // Back buttons
            const backButtons = document.querySelectorAll('[id$="-back"]');
            backButtons.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (Platform.isWeb()) {
                        history.back();
                    } else {
                        // Navigate back in the stack
                        if (App.navigationStack.length > 1) {
                            const previousView = App.navigationStack[App.navigationStack.length - 2];
                            ViewController.show(previousView, { animate: true, isBack: true });
                        } else {
                            ViewController.show('main-view', { animate: true, isBack: true });
                        }
                    }
                });
            });
        },
        
        openExternal: function(url) {
            // Validate URL
            if (!url || typeof url !== 'string') {
                console.error('Invalid URL provided to openExternal');
                return;
            }
            
            // Ensure URL is absolute
            if (!url.match(/^https?:\/\//i)) {
                console.error('URL must be absolute (http:// or https://):', url);
                return;
            }
            
            // Handle native platforms (iOS/Android via Capacitor)
            if (App.platform.isCapacitor) {
                try {
                    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
                        // iOS-specific options
                        const options = { url: url };
                        if (App.platform.isIOS) {
                            options.presentationStyle = 'popover';
                            options.toolbarColor = '#1a1a1a';
                        }
                        
                        window.Capacitor.Plugins.Browser.open(options).catch(function(error) {
                            console.error('Failed to open URL with Capacitor Browser:', error);
                            // Fallback to window.open
                            try {
                                window.open(url, '_system');
                            } catch (e) {
                                console.error('Fallback window.open failed:', e);
                                alert('Unable to open link. Please try again.');
                            }
                        });
                    } else {
                        console.warn('Capacitor Browser plugin not available, trying window.open');
                        window.open(url, '_system');
                    }
                } catch (error) {
                    console.error('Error opening external link:', error);
                    alert('Unable to open link. Please check your connection.');
                }
            } 
            // Handle web/PWA platforms
            else {
                try {
                    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
                    if (!newWindow) {
                        // Popup blocked
                        console.warn('Popup blocked, showing message to user');
                        alert('Please allow popups to open external links.');
                    }
                } catch (error) {
                    console.error('Error opening link in browser:', error);
                    alert('Unable to open link. Please try again.');
                }
            }
            
            // Log for debugging
            console.log('Opening external URL:', url, 'Platform:', App.platform);
        }
    };
    
    // TV Navigation Support
    const TVNavigation = {
        boundHandlers: {},
        
        init: function() {
            this.boundHandlers.handleKeyPress = this.handleKeyPress.bind(this);
            document.addEventListener('keydown', this.boundHandlers.handleKeyPress);
            this.ensureFocusable();
        },
        
        cleanup: function() {
            if (this.boundHandlers.handleKeyPress) {
                document.removeEventListener('keydown', this.boundHandlers.handleKeyPress);
            }
        },
        
        handleKeyPress: function(e) {
            switch(e.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    e.preventDefault();
                    this.moveFocus(e.key);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (document.activeElement) {
                        document.activeElement.click();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Go back
                    const backBtn = document.querySelector('[id$="-back"]:not(.hidden [id$="-back"])');
                    if (backBtn) backBtn.click();
                    break;
            }
        },
        
        ensureFocusable: function() {
            // Make all interactive elements focusable
            const elements = document.querySelectorAll('button, a, input, select, textarea');
            elements.forEach(function(el) {
                if (!el.hasAttribute('tabindex')) {
                    el.setAttribute('tabindex', '0');
                }
            });
        },
        
        moveFocus: function(direction) {
            // Simple spatial navigation
            // TODO: Implement proper spatial navigation algorithm
            const focusable = Array.from(document.querySelectorAll(
                ':not(.hidden) button:not([disabled]), ' +
                ':not(.hidden) a[href], ' +
                ':not(.hidden) input:not([disabled]), ' +
                ':not(.hidden) select:not([disabled]), ' +
                ':not(.hidden) textarea:not([disabled]), ' +
                ':not(.hidden) [tabindex="0"]'
            ));
            
            const current = document.activeElement;
            const currentIndex = focusable.indexOf(current);
            
            let nextIndex;
            if (direction === 'ArrowDown' || direction === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % focusable.length;
            } else {
                nextIndex = currentIndex - 1;
                if (nextIndex < 0) nextIndex = focusable.length - 1;
            }
            
            if (focusable[nextIndex]) {
                focusable[nextIndex].focus();
            }
        }
    };
    
    // Storage Manager (SQLite + localStorage hybrid)
    const Storage = {
        sqliteReady: false,
        
        init: function() {
            const self = this;
            
            // Initialize SQLite if available
            if (window.TaskSQLite && window.Capacitor && window.Capacitor.isNativePlatform()) {
                window.TaskSQLite.init(function(success, error) {
                    if (success) {
                        self.sqliteReady = true;
                        console.log('SQLite initialized successfully');
                        
                        // Initialize default activities on first run
                        if (window.StackMapDefaultActivities) {
                            window.StackMapDefaultActivities.initialize(function(success, error) {
                                if (success) {
                                    console.log('Default activities initialized');
                                } else if (error !== 'Already initialized') {
                                    console.error('Failed to initialize default activities:', error);
                                }
                            });
                        }
                        
                        // Migrate existing localStorage tasks if any
                        self.migrateTasksIfNeeded();
                    } else {
                        console.warn('SQLite initialization failed, using localStorage:', error);
                    }
                    
                    // Load initial data
                    self.loadSettings();
                    self.loadTasks();
                });
            } else {
                // Not in native environment, use localStorage
                console.log('Using localStorage (not in native environment)');
                
                // Initialize default activities for localStorage
                if (window.StackMapDefaultActivities) {
                    window.StackMapDefaultActivities.initialize(function(success, error) {
                        if (success) {
                            console.log('Default activities initialized');
                        } else if (error !== 'Already initialized') {
                            console.error('Failed to initialize default activities:', error);
                        }
                    });
                }
                
                this.loadSettings();
                this.loadTasks();
            }
        },
        
        loadSettings: function() {
            try {
                const settings = localStorage.getItem('stackmap-settings');
                if (settings) {
                    // Apply settings
                    console.log('Settings loaded');
                }
            } catch (e) {
                const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Could not load settings:') : 'Settings will use defaults:';
                console.warn(msg, e);
            }
        },
        
        loadTasks: function(callback) {
            const self = this;
            
            // IMPORTANT: Always check for backup data first
            const hasBackup = this.hasBackupData();
            
            if (this.sqliteReady) {
                // Load from SQLite
                window.TaskSQLite.getTasks({ limit: 100 }, function(tasks, error) {
                    if (error) {
                        console.error('Failed to load tasks from SQLite:', error);
                        
                        // Don't return empty array on error!
                        // Try localStorage/backup instead
                        self.loadTasksFromLocalStorage(function(localTasks, localError) {
                            if (localError && !hasBackup) {
                                // Only return empty if we truly have no data anywhere
                                if (callback) callback([], localError);
                            } else {
                                // Return whatever we found
                                if (callback) callback(localTasks || [], null);
                            }
                        });
                    } else {
                        console.log('Tasks loaded from SQLite:', tasks.length);
                        
                        // Even if SQLite returns empty, check if we have backup
                        if (tasks.length === 0 && hasBackup) {
                            // User might be seeing empty due to failed migration
                            // Show them backup data with a warning
                            self.loadTasksFromBackup(function(backupTasks) {
                                if (backupTasks && backupTasks.length > 0) {
                                    console.warn('SQLite empty but backup found. Showing backup data.');
                                    
                                    // Add warning flag to each task
                                    backupTasks.forEach(function(task) {
                                        task._isFromBackup = true;
                                    });
                                    
                                    if (callback) callback(backupTasks, { warning: 'Showing backup data' });
                                } else {
                                    if (callback) callback(tasks, null);
                                }
                            });
                        } else {
                            if (callback) callback(tasks, null);
                        }
                    }
                });
            } else {
                // Load from localStorage
                this.loadTasksFromLocalStorage(callback);
            }
        },
        
        loadTasksFromLocalStorage: function(callback) {
            try {
                const tasks = localStorage.getItem('stackmap-tasks');
                if (tasks) {
                    const parsed = JSON.parse(tasks);
                    console.log('Tasks loaded from localStorage:', parsed.length);
                    if (callback) callback(parsed, null);
                } else {
                    // Check for backup before returning empty
                    this.loadTasksFromBackup(function(backupTasks) {
                        if (backupTasks && backupTasks.length > 0) {
                            console.log('Primary storage empty, using backup');
                            if (callback) callback(backupTasks, null);
                        } else {
                            // Only return empty if no data anywhere
                            if (callback) callback([], null);
                        }
                    });
                }
            } catch (e) {
                const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Could not load activities:') : 'Activities are being retrieved:';
                console.warn(msg, e);
                
                // Try backup before giving up
                this.loadTasksFromBackup(function(backupTasks) {
                    if (callback) callback(backupTasks || [], e);
                });
            }
        },
        
        loadTasksFromBackup: function(callback) {
            try {
                const backupKey = localStorage.getItem('stackmap-last-backup-key');
                if (backupKey) {
                    const backupData = localStorage.getItem(backupKey);
                    if (backupData) {
                        const tasks = JSON.parse(backupData);
                        console.log(`Loaded ${tasks.length} tasks from backup`);
                        if (callback) callback(tasks);
                        return;
                    }
                }
                
                // Check for any other backups
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.indexOf('stackmap-tasks-backup-') === 0) {
                        const data = localStorage.getItem(key);
                        if (data) {
                            const tasks = JSON.parse(data);
                            console.log(`Found alternative backup with ${tasks.length} tasks`);
                            if (callback) callback(tasks);
                            return;
                        }
                    }
                }
                
                if (callback) callback(null);
            } catch (e) {
                console.error('Failed to load backup:', e);
                if (callback) callback(null);
            }
        },
        
        hasBackupData: function() {
            try {
                // Check for any backup keys
                const backupKey = localStorage.getItem('stackmap-last-backup-key');
                if (backupKey && localStorage.getItem(backupKey)) {
                    return true;
                }
                
                // Check for any backup files
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.indexOf('stackmap-tasks-backup-') === 0) {
                        return true;
                    }
                }
                
                return false;
            } catch (e) {
                return false;
            }
        },
        
        saveTask: function(task, callback) {
            if (this.sqliteReady) {
                // Save to SQLite
                window.TaskSQLite.createTask(task, function(result, error) {
                    if (error) {
                        console.error('Failed to save task to SQLite:', error);
                        if (callback) callback(false);
                    } else {
                        console.log('Task saved to SQLite:', result.id);
                        if (callback) callback(true, result.id);
                    }
                });
            } else {
                // Save to localStorage
                this.saveTaskToLocalStorage(task, callback);
            }
        },
        
        saveTaskToLocalStorage: function(task, callback) {
            try {
                const tasks = localStorage.getItem('stackmap-tasks');
                const taskList = tasks ? JSON.parse(tasks) : [];
                
                // Add ID if not present
                if (!task.id) {
                    task.id = Date.now();
                }
                
                taskList.push(task);
                localStorage.setItem('stackmap-tasks', JSON.stringify(taskList));
                
                if (callback) callback(true, task.id);
            } catch (e) {
                console.error('Failed to save task to localStorage:', e);
                if (callback) callback(false);
            }
        },
        
        updateTask: function(taskId, updates, callback) {
            if (this.sqliteReady) {
                // Update in SQLite
                window.TaskSQLite.updateTask(taskId, updates, callback);
            } else {
                // Update in localStorage
                this.updateTaskInLocalStorage(taskId, updates, callback);
            }
        },
        
        updateTaskInLocalStorage: function(taskId, updates, callback) {
            try {
                const tasks = localStorage.getItem('stackmap-tasks');
                const taskList = tasks ? JSON.parse(tasks) : [];
                
                let found = false;
                for (let i = 0; i < taskList.length; i++) {
                    if (taskList[i].id === taskId) {
                        // Apply updates
                        for (const key in updates) {
                            if (updates.hasOwnProperty(key)) {
                                taskList[i][key] = updates[key];
                            }
                        }
                        found = true;
                        break;
                    }
                }
                
                if (found) {
                    localStorage.setItem('stackmap-tasks', JSON.stringify(taskList));
                }
                
                if (callback) callback(found);
            } catch (e) {
                console.error('Failed to update task in localStorage:', e);
                if (callback) callback(false);
            }
        },
        
        deleteTask: function(taskId, callback) {
            if (this.sqliteReady) {
                // Delete from SQLite
                window.TaskSQLite.deleteTask(taskId, callback);
            } else {
                // Delete from localStorage
                this.deleteTaskFromLocalStorage(taskId, callback);
            }
        },
        
        deleteTaskFromLocalStorage: function(taskId, callback) {
            try {
                const tasks = localStorage.getItem('stackmap-tasks');
                const taskList = tasks ? JSON.parse(tasks) : [];
                
                const filtered = taskList.filter(function(task) {
                    return task.id !== taskId;
                });
                
                localStorage.setItem('stackmap-tasks', JSON.stringify(filtered));
                
                if (callback) callback(true);
            } catch (e) {
                console.error('Failed to delete task from localStorage:', e);
                if (callback) callback(false);
            }
        },
        
        migrateTasksIfNeeded: function() {
            const self = this;
            
            try {
                // Check migration status
                const migrationStatus = localStorage.getItem('stackmap-sqlite-migration-status');
                const lastVerification = localStorage.getItem('stackmap-sqlite-last-verification');
                
                // Skip if already fully migrated and verified
                if (migrationStatus === 'verified' && lastVerification) {
                    const daysSinceVerification = (Date.now() - parseInt(lastVerification)) / (1000 * 60 * 60 * 24);
                    if (daysSinceVerification < 30) {
                        return; // Still in verification period
                    }
                }
                
                // Get tasks from localStorage
                const tasks = localStorage.getItem('stackmap-tasks');
                if (!tasks) {
                    // No tasks to migrate
                    return;
                }
                
                const taskList = JSON.parse(tasks);
                if (taskList.length === 0) {
                    return;
                }
                
                // Show migration progress to user
                if (self.onMigrationProgress) {
                    self.onMigrationProgress(`Starting migration of ${taskList.length} tasks...`);
                }
                
                console.log(`Starting safe migration of ${taskList.length} tasks to SQLite...`);
                
                // IMPORTANT: Create backup first
                const backupKey = `stackmap-tasks-backup-${Date.now()}`;
                localStorage.setItem(backupKey, JSON.stringify(taskList));
                localStorage.setItem('stackmap-last-backup-key', backupKey);
                
                // Track migration progress
                let migrated = 0;
                let errors = 0;
                const migratedIds = [];
                
                function migrateNext(index) {
                    if (index >= taskList.length) {
                        // Migration attempt complete
                        console.log(`Migration attempt complete: ${migrated} succeeded, ${errors} failed`);
                        
                        if (errors === 0 && migrated === taskList.length) {
                            // All tasks migrated successfully
                            localStorage.setItem('stackmap-sqlite-migration-status', 'pending-verification');
                            localStorage.setItem('stackmap-sqlite-migrated-count', String(migrated));
                            localStorage.setItem('stackmap-sqlite-migration-date', String(Date.now()));
                            
                            // DO NOT DELETE localStorage YET!
                            // We need to verify SQLite is stable first
                            
                            if (self.onMigrationProgress) {
                                self.onMigrationProgress('Migration complete! Keeping backup for 30 days.');
                            }
                            
                            // Schedule verification check
                            self.scheduleVerification();
                        } else {
                            // Migration had errors - rollback
                            console.error(`Migration failed with ${errors} errors. Rolling back...`);
                            
                            if (self.onMigrationProgress) {
                                self.onMigrationProgress('Migration failed. Your data is safe in backup.');
                            }
                            
                            // Delete any partially migrated tasks
                            self.rollbackMigration(migratedIds);
                        }
                        return;
                    }
                    
                    const task = taskList[index];
                    
                    // Update progress
                    if (self.onMigrationProgress && index % 10 === 0) {
                        const percent = Math.round((index / taskList.length) * 100);
                        self.onMigrationProgress(`Migrating... ${percent}%`);
                    }
                    
                    window.TaskSQLite.createTask(task, function(result, error) {
                        if (error) {
                            errors++;
                            console.error('Failed to migrate task:', error);
                        } else {
                            migrated++;
                            migratedIds.push(result.id);
                        }
                        
                        // Continue with next task
                        setTimeout(function() {
                            migrateNext(index + 1);
                        }, 10); // Small delay to prevent UI blocking
                    });
                }
                
                migrateNext(0);
                
            } catch (e) {
                console.error('Migration failed:', e);
                if (self.onMigrationProgress) {
                    self.onMigrationProgress('Migration error. Your data is safe.');
                }
            }
        },
        
        scheduleVerification: function() {
            const self = this;
            
            // Check SQLite is working after 24 hours
            setTimeout(function() {
                self.verifyMigration();
            }, 24 * 60 * 60 * 1000);
        },
        
        verifyMigration: function() {
            const self = this;
            
            console.log('Verifying SQLite migration...');
            
            // Get task count from SQLite
            if (window.TaskSQLite && window.TaskSQLite.isReady) {
                window.TaskSQLite.getStats(function(stats, error) {
                    if (error) {
                        console.error('Verification failed:', error);
                        return;
                    }
                    
                    const expectedCount = parseInt(localStorage.getItem('stackmap-sqlite-migrated-count') || '0');
                    
                    if (stats.totalTasks >= expectedCount) {
                        // Verification successful
                        console.log('SQLite verification successful');
                        localStorage.setItem('stackmap-sqlite-migration-status', 'verified');
                        localStorage.setItem('stackmap-sqlite-last-verification', String(Date.now()));
                        
                        // Now safe to remove old localStorage data
                        localStorage.removeItem('stackmap-tasks');
                        
                        // Keep backup for another 30 days just in case
                        self.scheduleBackupCleanup();
                    } else {
                        console.error('Verification failed: task count mismatch');
                    }
                });
            }
        },
        
        scheduleBackupCleanup: function() {
            // Clean up backup after 30 days
            setTimeout(function() {
                const backupKey = localStorage.getItem('stackmap-last-backup-key');
                if (backupKey) {
                    localStorage.removeItem(backupKey);
                    localStorage.removeItem('stackmap-last-backup-key');
                    console.log('Cleaned up old backup');
                }
            }, 30 * 24 * 60 * 60 * 1000);
        },
        
        rollbackMigration: function(migratedIds) {
            // Delete any partially migrated tasks
            migratedIds.forEach(function(id) {
                window.TaskSQLite.deleteTask(id, function() {
                    console.log('Rolled back task:', id);
                });
            });
        },
        
        save: function(key, data) {
            // Generic save for non-task data (settings, etc)
            try {
                localStorage.setItem(`stackmap-${key}`, JSON.stringify(data));
                return true;
            } catch (e) {
                const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Storage error:') : 'Storage needs adjustment:';
                console.error(msg, e);
                return false;
            }
        },
        
        // Image attachment methods (memory-efficient)
        addImageToTask: function(taskId, imageData, callback) {
            const self = this;
            
            // Check memory before adding image
            if (!this.checkMemoryForImage(imageData)) {
                const msg = 'Not enough memory to add image. Try closing other apps.';
                console.error(msg);
                if (callback) callback(null, new Error(msg));
                return;
            }
            
            if (this.sqliteReady) {
                window.TaskSQLite.addImageAttachment(taskId, imageData, function(result, error) {
                    // Clear the image data from memory after saving
                    imageData = null;
                    if (callback) callback(result, error);
                });
            } else {
                // In localStorage mode, be extra careful with memory
                try {
                    const attachmentId = `img_${Date.now()}`;
                    
                    // Compress/resize if needed for localStorage
                    let processedData = this.processImageForStorage(imageData);
                    
                    localStorage.setItem(`stackmap-attachment-${attachmentId}`, processedData);
                    
                    // Clear from memory
                    imageData = null;
                    processedData = null;
                    
                    // Update task with attachment reference
                    this.updateTaskInLocalStorage(taskId, {
                        attachmentIds: [attachmentId]
                    }, function(success) {
                        if (callback) callback(success ? { id: attachmentId } : null);
                    });
                } catch (e) {
                    console.error('Failed to save image attachment:', e);
                    if (callback) callback(null, e);
                }
            }
        },
        
        getImageUrlForDisplay: function(attachmentId, callback) {
            if (this.sqliteReady) {
                // Get URL only, not data
                window.TaskSQLite.getImageAttachmentUrl(attachmentId, callback);
            } else {
                // For localStorage, create object URL
                try {
                    const imageData = localStorage.getItem(`stackmap-attachment-${attachmentId}`);
                    if (imageData) {
                        // Convert to blob URL to save memory
                        const blob = this.base64ToBlob(imageData);
                        const url = URL.createObjectURL(blob);
                        
                        // Track URL for cleanup
                        this.trackObjectUrl(url);
                        
                        if (callback) callback({ url: url, id: attachmentId }, null);
                    } else {
                        if (callback) callback(null, new Error('Image not found'));
                    }
                } catch (e) {
                    console.error('Failed to get image URL:', e);
                    if (callback) callback(null, e);
                }
            }
        },
        
        getImageThumbnail: function(attachmentId, maxSize, callback) {
            if (this.sqliteReady) {
                window.TaskSQLite.getImageThumbnail(attachmentId, maxSize, callback);
            } else {
                // For localStorage, use the URL method (browser will handle sizing)
                this.getImageUrlForDisplay(attachmentId, callback);
            }
        },
        
        getImageData: function(attachmentId, callback) {
            // WARNING: Only use when absolutely necessary (e.g., export)
            console.warn('Loading full image data - use getImageUrlForDisplay instead when possible');
            
            if (this.sqliteReady) {
                window.TaskSQLite.getImageAttachmentData(attachmentId, function(attachment, error) {
                    if (callback) {
                        callback(attachment, error);
                        // Remind to clean up
                        if (attachment && attachment.data) {
                            console.warn('Remember to clear image data after use');
                        }
                    }
                });
            } else {
                // Get from localStorage
                try {
                    const imageData = localStorage.getItem(`stackmap-attachment-${attachmentId}`);
                    if (callback) {
                        callback(imageData ? { data: imageData, id: attachmentId } : null);
                        if (imageData) {
                            console.warn('Remember to clear image data after use');
                        }
                    }
                } catch (e) {
                    console.error('Failed to get image data:', e);
                    if (callback) callback(null, e);
                }
            }
        },
        
        deleteImageFromTask: function(attachmentId, callback) {
            const self = this;
            
            if (this.sqliteReady) {
                window.TaskSQLite.deleteImageAttachment(attachmentId, callback);
            } else {
                // Delete from localStorage
                try {
                    localStorage.removeItem(`stackmap-attachment-${attachmentId}`);
                    
                    // Clean up any object URLs
                    this.cleanupObjectUrls();
                    
                    if (callback) callback(true);
                } catch (e) {
                    console.error('Failed to delete image attachment:', e);
                    if (callback) callback(false);
                }
            }
        },
        
        // Memory management helpers
        checkMemoryForImage: function(imageData) {
            try {
                // Rough estimate: base64 is ~1.33x the binary size
                const estimatedSize = (imageData.length * 0.75) / 1024 / 1024; // MB
                
                // Conservative limit for low-memory devices
                const maxImageSize = 5; // 5MB max per image
                
                if (estimatedSize > maxImageSize) {
                    console.error('Image too large:', `${estimatedSize.toFixed(2)}MB`);
                    return false;
                }
                
                // Check localStorage quota if using localStorage
                if (!this.sqliteReady) {
                    const used = new Blob(Object.values(localStorage)).size;
                    const estimatedTotal = used + imageData.length;
                    
                    // localStorage typically has 5-10MB limit
                    if (estimatedTotal > 4 * 1024 * 1024) { // 4MB safety limit
                        console.error('Not enough localStorage space');
                        return false;
                    }
                }
                
                return true;
            } catch (e) {
                console.error('Memory check failed:', e);
                return false;
            }
        },
        
        processImageForStorage: function(imageData) {
            // TODO: Implement image resizing/compression if needed
            // For now, return as-is but log size
            console.log('Storing image of size:', `${(imageData.length / 1024).toFixed(2)}KB`);
            return imageData;
        },
        
        base64ToBlob: function(base64) {
            const binary = atob(base64.split(',')[1] || base64);
            const array = [];
            for (let i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i));
            }
            return new Blob([new Uint8Array(array)], { type: 'image/jpeg' });
        },
        
        // Track object URLs for cleanup
        objectUrls: [],
        trackObjectUrl: function(url) {
            this.objectUrls.push(url);
            
            // Clean up old URLs if too many
            if (this.objectUrls.length > 20) {
                this.cleanupObjectUrls();
            }
        },
        
        cleanupObjectUrls: function() {
            // Revoke old object URLs to free memory
            const urlsToKeep = [];
            
            this.objectUrls.forEach(function(url) {
                // Check if URL is still in use in DOM
                const inUse = document.querySelector(`img[src="${url}"]`);
                if (inUse) {
                    urlsToKeep.push(url);
                } else {
                    URL.revokeObjectURL(url);
                }
            });
            
            this.objectUrls = urlsToKeep;
            console.log('Cleaned up object URLs, keeping:', urlsToKeep.length);
        }
    };
    
    // Content Manager
    const Content = {
        load: function() {
            // Load content for views that need it
            this.loadPrivacy();
            this.loadTerms();
            this.loadSupport();
        },
        
        loadPrivacy: function() {
            const container = document.querySelector('#privacy-view .content');
            if (container) {
                container.innerHTML = 
                    '<h2>Privacy Policy</h2>' +
                    '<p>Last updated: December 2024</p>' +
                    '<h3>Data Collection</h3>' +
                    '<p>StackMap stores all data locally on your device. We do not collect, transmit, or store any personal information on our servers.</p>' +
                    '<h3>Local Storage</h3>' +
                    '<p>Your tasks and preferences are saved in your browser\'s local storage and remain on your device.</p>' +
                    '<h3>Analytics</h3>' +
                    '<p>We use privacy-focused analytics to improve the app. No personal data is collected.</p>';
            }
        },
        
        loadTerms: function() {
            const container = document.querySelector('#terms-view .content');
            if (container) {
                container.innerHTML = 
                    '<h2>Terms of Service</h2>' +
                    '<p>Last updated: December 2024</p>' +
                    '<h3>Usage</h3>' +
                    '<p>StackMap is provided as-is for personal task management.</p>' +
                    '<h3>Liability</h3>' +
                    '<p>We are not responsible for data loss. Please maintain backups of important information.</p>';
            }
        },
        
        loadSupport: function() {
            const container = document.querySelector('#support-view .content');
            if (container) {
                container.innerHTML = 
                    '<h2>Support StackMap</h2>' +
                    '<p>StackMap is free and open source. Your support helps maintain and improve the app.</p>' +
                    '<div class="support-options">' +
                        '<a href="https://paypal.me/stackadamj" class="support-link">PayPal</a>' +
                        '<a href="https://venmo.com/u/stackadamj" class="support-link">Venmo</a>' +
                        '<a href="https://patreon.com/StackMap" class="support-link">Patreon</a>' +
                    '</div>' +
                    '<h3>Resources</h3>' +
                    '<div class="resource-links">' +
                        '<a href="https://stackmap.app/help" class="resource-link">Help Documentation</a>' +
                        '<a href="https://github.com/ajstack22/StackMap" class="resource-link">GitHub Repository</a>' +
                    '</div>';
            }
        }
    };
    
    // Initialize Application
    function init() {
        // Detect platform
        Platform.detect();
        
        // Register Service Worker for offline support (only on supported protocols)
        if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.protocol === 'http:')) {
            try {
                navigator.serviceWorker.register('./js/service-worker.js')
                    .then(function(registration) {
                        console.log('[App] Service Worker registered:', registration.scope);
                        
                        // Listen for online/offline events and notify service worker
                        window.addEventListener('online', function() {
                            if (registration.active) {
                                registration.active.postMessage({
                                    type: 'online-status',
                                online: true
                            });
                        }
                    });
                    
                    window.addEventListener('offline', function() {
                        if (registration.active) {
                            registration.active.postMessage({
                                type: 'online-status',
                                online: false
                            });
                        }
                    });
                })
                .catch(function(err) {
                    console.error('[App] Service Worker registration failed:', err);
                });
            } catch (error) {
                console.error('[App] Service Worker registration needs attention:', error);
            }
        } else if ('serviceWorker' in navigator) {
            console.log('[App] Service Worker not supported on this protocol (file://). Use http:// or https:// for full functionality.');
        }
        
        // Initialize modules
        ViewController.init();
        Navigation.init();
        Storage.init();
        Content.load();
        
        // Run migration from tasks to activities if needed
        if (window.TaskToActivityMigration && !localStorage.getItem('stackmap_migration_tasks_to_activities')) {
            console.log('[App] Running tasks to activities migration');
            window.TaskToActivityMigration.migrate(function(success, error) {
                if (!success) {
                    console.error('[App] Migration failed:', error);
                } else {
                    console.log('[App] Migration completed successfully');
                }
            });
        }
        
        // Initialize performance monitoring
        if (window.StackMapFeatureFlags) {
            window.StackMapFeatureFlags.init();
        }
        
        if (window.StackMapPerformanceMonitor) {
            // Check initial load performance
            window.StackMapPerformanceMonitor.checkBudget();
        }
        
        // Initialize haptic feedback
        if (window.StackMapHapticFeedback) {
            window.StackMapHapticFeedback.init();
        }
        
        // Initialize user manager with error boundary
        if (window.UserManager && window.StackMapComponentErrorHandler) {
            window.StackMapComponentErrorHandler.wrapInit(
                'UserManager',
                'user-switcher-wrapper',
                function() {
                    window.UserManager.init(function() {
                        // Migrate existing tasks to default user
                        window.UserManager.migrateExistingTasks();
                        
                        // Render user switcher
                        const switcherContainer = document.getElementById('user-switcher-container');
                        if (switcherContainer) {
                            window.UserManager.renderUserSwitcher(switcherContainer);
                        }
                        
                        // Check for demo mode after UserManager is ready
                        if (window.DemoMode) {
                            window.DemoMode.init();
                        }
                    });
                }
            );
        } else if (window.UserManager) {
            // Fallback without error handler
            window.UserManager.init(function() {
                window.UserManager.migrateExistingTasks();
                const switcherContainer = document.getElementById('user-switcher-container');
                if (switcherContainer) {
                    window.UserManager.renderUserSwitcher(switcherContainer);
                }
                if (window.DemoMode) {
                    window.DemoMode.init();
                }
            });
        }
        
        // Initialize edit mode with error boundary
        if (window.EditMode && window.StackMapComponentErrorHandler) {
            window.StackMapComponentErrorHandler.wrapInit(
                'EditMode',
                'edit-mode-wrapper',
                window.EditMode.init,
                window.EditMode
            );
        } else if (window.EditMode) {
            // Fallback without error handler
            window.EditMode.init();
        }
        
        // Initialize EditModeMenu after EditMode
        if (window.EditModeMenu) {
            console.log('[App] Initializing EditModeMenu');
            window.EditModeMenu.init();
        }
        
        // Initialize QuickAddUI after EditMode
        if (window.QuickAddUI) {
            console.log('[App] Initializing QuickAddUI');
            window.QuickAddUI.init();
        }
        
        // Initialize keyboard navigation
        if (window.StackMapKeyboardNav) {
            window.StackMapKeyboardNav.init();
        }
        
        // DragDropReorder is now initialized in initComponentsWithErrorBoundaries()
        
        // Initialize welcome manager for first-time users
        if (window.StackMapWelcomeManager) {
            window.StackMapWelcomeManager.init();
        }
        
        // Initialize undo system with error boundary
        if (window.UndoManager && window.StackMapComponentErrorHandler) {
            window.StackMapComponentErrorHandler.wrapInit(
                'UndoSystem',
                'main-view', // Use main view as wrapper since undo is global
                function() {
                    window.UndoManager.init();
                    console.log('[App] Undo system initialized');
                    
                    // Initialize undo UI after manager
                    if (window.UndoUI) {
                        window.UndoUI.init();
                        console.log('[App] Undo UI initialized');
                    }
                },
                window.UndoManager
            );
        } else if (window.UndoManager) {
            // Fallback without error handler
            window.UndoManager.init();
            console.log('[App] Undo system initialized');
            
            if (window.UndoUI) {
                window.UndoUI.init();
                console.log('[App] Undo UI initialized');
            }
        }
        
        // Initialize memory monitor
        initMemoryMonitor();
        
        // Initialize components with error boundaries
        initComponentsWithErrorBoundaries();
        
        // Initialize activities progressively (non-blocking)
        if (window.StackMapDefaultActivities && window.StackMapDefaultActivities.loadProgressive) {
            window.StackMapDefaultActivities.loadProgressive(function(activities) {
                console.log(`Activities loaded progressively: ${activities.length}`);
            });
        }
        
        // Recover preserved data
        if (window.StackMapDataPreservation) {
            try {
                const recovered = window.StackMapDataPreservation.recoverSession();
                if (recovered.currentTask) {
                    console.log('Recovered task data:', recovered.currentTask);
                    // TODO: Restore task to UI when task system is implemented
                }
                if (recovered.lastLocation) {
                    console.log('Recovered location:', recovered.lastLocation);
                    // TODO: Navigate to last location when navigation is ready
                }
            } catch (e) {
                console.warn('Data recovery failed:', e);
            }
        }
        
        // Show safe mode banner if in safe mode
        if (window.StackMapSafeMode) {
            try {
                const banner = document.createElement('div');
                banner.className = 'safe-mode-banner';
                
                // Create text and link safely without innerHTML
                const textNode = document.createTextNode('Simple Mode Active - ');
                banner.appendChild(textNode);
                
                const exitLink = document.createElement('a');
                exitLink.href = window.location.pathname; // Use current path, not hardcoded root
                exitLink.style.color = 'white';
                exitLink.style.textDecoration = 'underline';
                exitLink.style.fontWeight = 'bold';
                exitLink.textContent = 'Exit Simple Mode';
                
                // Store event handler globally for cleanup
                window.StackMapSafeModeExitHandler = function(e) {
                    e.preventDefault();
                    try {
                        // Clear safe mode persistence
                        localStorage.removeItem('stackmap_safe_mode_until');
                    } catch (err) {
                        // Storage might be disabled
                    }
                    // Navigate to current path without safe mode
                    window.location.href = window.location.pathname;
                };
                
                exitLink.addEventListener('click', window.StackMapSafeModeExitHandler);
                
                banner.appendChild(exitLink);
                
                // Only adjust padding after successful banner insertion
                document.body.insertBefore(banner, document.body.firstChild);
                document.body.style.paddingTop = `${SAFE_MODE_CONSTANTS.BANNER_HEIGHT}px`;
                
                // Add ARIA announcement for screen readers
                banner.setAttribute('role', 'status');
                banner.setAttribute('aria-live', 'polite');
            } catch (e) {
                // Banner creation failed - continue without banner
                const msg = window.StackMapMessaging ? window.StackMapMessaging.transform('Safe mode: Could not create banner') : 'Simple mode is active';
                console.warn(msg, e);
            }
        }
        
        // Show main view
        setTimeout(function() {
            // Clear loading timeout - app loaded successfully
            if (window.StackMapErrorDetection && window.StackMapErrorDetection.clearLoadingTimeout) {
                window.StackMapErrorDetection.clearLoadingTimeout();
            }
            ViewController.show('main-view', { animate: !window.StackMapSafeMode });
        }, window.StackMapSafeMode ? Math.round(500 * SAFE_MODE_CONSTANTS.TIMEOUT_MULTIPLIER) : 500);
    }
    
    // Cleanup function for memory leak prevention
    function cleanup() {
        // Clear specific timeouts (safer than clearing all)
        if (App.animationTimeoutId) {
            clearTimeout(App.animationTimeoutId);
            App.animationTimeoutId = null;
        }
        if (App.focusTimeoutId) {
            clearTimeout(App.focusTimeoutId);
            App.focusTimeoutId = null;
        }
        
        // Remove event listeners
        Navigation.cleanup();
        if (window.TVNavigation) {
            TVNavigation.cleanup();
        }
        
        // Stop memory monitor
        if (window.StackMapMemoryMonitor) {
            window.StackMapMemoryMonitor.stop();
        }
        
        // Clean up safe mode banner if present
        if (window.StackMapSafeModeExitHandler) {
            const exitLink = document.querySelector('.safe-mode-banner a');
            if (exitLink) {
                exitLink.removeEventListener('click', window.StackMapSafeModeExitHandler);
            }
            window.StackMapSafeModeExitHandler = null;
        }
        const banner = document.querySelector('.safe-mode-banner');
        if (banner && banner.parentNode) {
            banner.parentNode.removeChild(banner);
            document.body.style.paddingTop = ''; // Reset padding
        }
        
        // Clear focusable cache (but don't hold DOM references)
        for (const viewId in App.focusableCache) {
            if (App.focusableCache[viewId]) {
                // Clear array references properly
                if (App.focusableCache[viewId].elements) {
                    // Proper array cleanup
                    while (App.focusableCache[viewId].elements.length > 0) {
                        App.focusableCache[viewId].elements.pop();
                    }
                    App.focusableCache[viewId].elements = null;
                }
                // Delete the entire cache entry
                delete App.focusableCache[viewId];
            }
        }
        App.focusableCache = {};
        App.focusableCacheSize = 0;
        
        // Reset state
        App.isTransitioning = false;
        App.transactionId = 0;
        
        // Remove view announcer
        const announcer = document.getElementById('view-announcer');
        if (announcer && announcer.parentNode) {
            announcer.parentNode.removeChild(announcer);
        }
    }
    
    /**
     * Memory Monitor System
     * Tracks memory usage and warns when approaching limits
     */
    const MemoryMonitor = {
        intervalId: null,
        warningThreshold: 45, // MB
        criticalThreshold: 60, // MB
        lastWarningTime: 0,
        warningCooldown: 30000, // 30 seconds between warnings
        
        check: function() {
            // Only works in Chrome/Edge with performance.memory API
            if (!performance.memory) return;
            
            const usedMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
            const limitMB = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
            
            // Log memory usage periodically
            if (Date.now() % 10 === 0) { // Log every 10th check
                console.log(`Memory: ${usedMB}MB / ${limitMB}MB`);
            }
            
            // Check if we should warn
            const now = Date.now();
            if (usedMB > this.criticalThreshold && now - this.lastWarningTime > this.warningCooldown) {
                this.lastWarningTime = now;
                console.error(`CRITICAL: Memory usage at ${usedMB}MB - app may crash soon!`);
                this.showWarning(`Critical memory usage: ${usedMB}MB`, 'critical');
                
                // Trigger emergency cleanup
                this.emergencyCleanup();
            } else if (usedMB > this.warningThreshold && now - this.lastWarningTime > this.warningCooldown) {
                this.lastWarningTime = now;
                console.warn(`Memory warning: ${usedMB}MB used`);
                this.showWarning(`High memory usage: ${usedMB}MB`, 'warning');
            }
            
            return usedMB;
        },
        
        showWarning: function(message, level) {
            // Create or update memory warning banner
            let banner = document.getElementById('memory-warning-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'memory-warning-banner';
                banner.style.cssText = 
                    'position: fixed;' +
                    'top: 0;' +
                    'left: 0;' +
                    'right: 0;' +
                    'padding: 8px;' +
                    'text-align: center;' +
                    'z-index: 10000;' +
                    'font-size: 14px;' +
                    'transition: opacity 0.3s;';
                document.body.appendChild(banner);
            }
            
            // Set color based on level
            banner.style.backgroundColor = level === 'critical' ? '#d32f2f' : '#ff9800';
            banner.style.color = 'white';
            banner.textContent = message;
            banner.style.opacity = '1';
            
            // Auto-hide after 5 seconds
            setTimeout(function() {
                if (banner) {
                    banner.style.opacity = '0';
                }
            }, 5000);
        },
        
        emergencyCleanup: function() {
            console.log('Performing emergency memory cleanup...');
            
            // Clear caches
            if (App.focusableCache) {
                App.focusableCache = {};
                App.focusableCacheSize = 0;
            }
            
            // Clear any stored drafts older than 1 hour
            try {
                for (const key in localStorage) {
                    if (key.indexOf('stackmap_task_draft_') === 0) {
                        localStorage.removeItem(key);
                    }
                }
            } catch (e) {
                console.warn('Could not clear drafts:', e);
            }
            
            // Force garbage collection if available (usually only in dev tools)
            if (window.gc) {
                window.gc();
            }
            
            // Dispatch event for other modules to clean up
            document.dispatchEvent(new CustomEvent('memoryPressure', {
                detail: { level: 'critical' }
            }));
        },
        
        start: function() {
            const self = this;
            
            // Check immediately
            this.check();
            
            // Check every 30 seconds
            this.intervalId = setInterval(function() {
                self.check();
            }, 30000);
        },
        
        stop: function() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }
    };
    
    /**
     * Initialize components with error boundaries
     */
    function initComponentsWithErrorBoundaries() {
        // Wait for component error handler to be ready
        const checkInterval = setInterval(function() {
            if (window.StackMapComponentErrorHandler) {
                clearInterval(checkInterval);
                
                // Initialize ActivityDisplay/TaskDisplay with error boundary
                if (window.ActivityDisplay) {
                    window.StackMapComponentErrorHandler.wrapInit(
                        'ActivityDisplay',
                        'activity-display-wrapper',
                        window.ActivityDisplay.init,
                        window.ActivityDisplay
                    );
                } else if (window.TaskDisplay) {
                    window.StackMapComponentErrorHandler.wrapInit(
                        'TaskDisplay',
                        'task-display-wrapper',
                        window.TaskDisplay.init,
                        window.TaskDisplay
                    );
                }
                
                // Initialize DragDropReorder with error boundary
                if (window.DragDropReorder) {
                    window.StackMapComponentErrorHandler.wrapInit(
                        'DragDropReorder',
                        'task-display-wrapper', // Uses same wrapper as TaskDisplay
                        window.DragDropReorder.init,
                        window.DragDropReorder
                    );
                }
                
                // Initialize ThemeManager settings UI with error boundary
                if (window.ThemeSettingsUI) {
                    window.StackMapComponentErrorHandler.wrapInit(
                        'ThemeManager',
                        'theme-settings-wrapper',
                        window.ThemeSettingsUI.init,
                        window.ThemeSettingsUI
                    );
                }
                
                // Initialize DataExport with error boundary
                if (window.DataExport) {
                    window.StackMapComponentErrorHandler.wrapInit(
                        'DataExport',
                        'data-management-wrapper',
                        window.DataExport.init,
                        window.DataExport
                    );
                }
                
                // Initialize DataImport with error boundary
                if (window.DataImport) {
                    window.StackMapComponentErrorHandler.wrapInit(
                        'DataImport',
                        'data-management-wrapper',
                        window.DataImport.init,
                        window.DataImport
                    );
                }
            }
        }, 100); // Check every 100ms
    }
    
    /**
     * Initialize memory monitor
     */
    function initMemoryMonitor() {
        // Only start monitor if performance.memory is available
        if (performance.memory) {
            MemoryMonitor.start();
            
            // Export for debugging
            window.StackMapMemoryMonitor = MemoryMonitor;
        }
    }
    
    // Expose API before init to avoid race conditions
    window.StackMapApp = {
        App: App,
        ViewController: ViewController,
        Platform: Platform,
        Navigation: Navigation,
        Storage: Storage,
        cleanup: cleanup,
        openExternalLink: function(url) {
            return Navigation.openExternal(url);
        }
    };
    
    // Also expose App directly for demo mode
    window.App = App;
    
    // Test helper for external links
    window.testLinks = {
        testHelp: function() {
            Navigation.openExternal('https://stackmap.app/help');
        },
        testPrivacy: function() {
            Navigation.openExternal('https://stackmap.app/privacy');
        },
        testSupport: function() {
            Navigation.openExternal('https://paypal.me/stackadamj');
        },
        testPlatform: function() {
            console.log('Current platform:', Platform.detect());
        }
    };
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();