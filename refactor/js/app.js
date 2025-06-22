/**
 * StackMap Mobile-First Application
 * Main entry point
 */

// Import modules (using script tags in HTML for now)
// Later can use ES6 modules if needed

(function() {
    'use strict';
    
    // Safe Mode Constants
    var SAFE_MODE_CONSTANTS = {
        BANNER_HEIGHT: 44,
        MAX_ANALYTICS_COUNT: 1000000,
        TIMEOUT_MULTIPLIER: 3.3,
        CACHE_MAX_SIZE: 5,
        TRANSACTION_ID_MAX: 2147483647
    };
    
    // Polyfills for Android 5 compatibility
    
    // Array.from polyfill
    if (!Array.from) {
        Array.from = function(arrayLike, mapFn, thisArg) {
            if (arrayLike == null) {
                throw new TypeError('Array.from requires an array-like object - not null or undefined');
            }
            
            var items = Object(arrayLike);
            var len = parseInt(items.length) || 0;
            var result = [];
            
            for (var i = 0; i < len; i++) {
                if (i in items) {
                    result.push(items[i]);
                }
            }
            
            if (mapFn) {
                result = result.map(mapFn, thisArg);
            }
            
            return result;
        };
    }
    
    // NodeList.forEach polyfill
    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = function(callback, thisArg) {
            thisArg = thisArg || window;
            for (var i = 0; i < this.length; i++) {
                callback.call(thisArg, this[i], i, this);
            }
        };
    }
    
    // Safe mode detection - must be early in initialization
    (function() {
        'use strict';
        
        // Parse URL parameters properly
        var urlParams = window.location.search;
        var isSafeMode = false;
        var persistSafeMode = false;
        
        // Use proper parameter parsing to avoid false matches (case-insensitive)
        if (urlParams) {
            // Match safe=true as a complete parameter (case-insensitive)
            isSafeMode = /[?&]safe=true(&|$)/i.test(urlParams);
            persistSafeMode = /[?&]persist=true(&|$)/i.test(urlParams);
        }
        
        // Check persistence first (wrapped in try-catch)
        var enableSafeMode = false;
        try {
            var safeUntil = localStorage.getItem('stackmap_safe_mode_until');
            if (safeUntil && parseInt(safeUntil, 10) > Date.now()) {
                enableSafeMode = true;
            }
        } catch (e) {
            // Storage might be disabled - continue without persistence
            console.warn('Safe mode: Storage check failed', e);
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
                    var tomorrow = new Date();
                    // Validate date is valid
                    if (!isNaN(tomorrow.getTime())) {
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        localStorage.setItem('stackmap_safe_mode_until', tomorrow.getTime().toString());
                    }
                } catch (e) {
                    // Storage might be disabled or quota exceeded
                    if (e.name === 'QuotaExceededError') {
                        console.warn('Safe mode: Storage quota exceeded');
                    } else {
                        console.warn('Safe mode: Could not persist preference', e);
                    }
                }
            }
            
            // Analytics counter with overflow protection
            try {
                var count = parseInt(localStorage.getItem('stackmap_safe_mode_count') || '0', 10);
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
    
    // Application state
    var App = {
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
        focusTimeoutId: null // Track current focus timeout
    };
    
    // View Controller
    var ViewController = {
        init: function() {
            // Cache all view elements
            var viewElements = document.querySelectorAll('.view');
            viewElements.forEach(function(view) {
                App.views[view.id] = view;
            });
        },
        
        show: function(viewId, options) {
            options = options || {};
            
            // CRITICAL: Prevent concurrent transitions
            if (App.isTransitioning) {
                console.warn('Transition in progress, ignoring request');
                return false;
            }
            
            // Set flag FIRST to prevent race conditions
            App.isTransitioning = true;
            
            // Atomic transaction ID handling to prevent race condition
            var transactionId;
            if (App.transactionId >= SAFE_MODE_CONSTANTS.TRANSACTION_ID_MAX) {
                transactionId = App.transactionId = 1;
            } else {
                transactionId = ++App.transactionId;
            }
            
            try {
                var fromView = App.views[App.currentView];
                var toView = App.views[viewId];
                
                if (!toView) {
                    console.warn('View not found:', viewId);
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
                        console.warn('Maximum navigation depth reached');
                        this.showDepthWarning();
                        App.isTransitioning = false; // CRITICAL: Always reset flag!
                        return false;
                    }
                }
                
                // Handle transition (skip animations in safe mode)
                if (options.animate && fromView && !window.StackMapSafeMode) {
                    var self = this;
                    
                    // Cancel any previous animation
                    if (App.animationTimeoutId) {
                        clearTimeout(App.animationTimeoutId);
                        App.animationTimeoutId = null;
                    }
                    
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
                    if (fromView) fromView.classList.add('hidden');
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
                    var path = viewId === 'main-view' ? '/' : '#' + viewId.replace('-view', '');
                    history.pushState({ view: viewId, depth: App.navigationStack.length }, '', path);
                }
                
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
            var viewId = view.id;
            var focusables = this.getCachedFocusables(viewId);
            
            // If no focusables, try to focus heading or main element
            if (focusables.length === 0) {
                var fallback = view.querySelector('h1, h2, main, [role="main"]');
                if (fallback) {
                    fallback.tabIndex = -1;
                    try {
                        fallback.focus();
                    } catch (e) {
                        console.warn('Could not focus fallback element:', e);
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
                            console.warn('Could not focus element:', e);
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
                var view = App.views[viewId];
                if (!view) return [];
                
                // Limit cache size
                if (App.focusableCacheSize >= SAFE_MODE_CONSTANTS.CACHE_MAX_SIZE) {
                    // Remove oldest cache entry
                    var oldestId = null;
                    var oldestTime = Date.now();
                    for (var id in App.focusableCache) {
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
                
                var elements = view.querySelectorAll(
                    'button:not([disabled]), ' +
                    'a[href]:not([disabled]), ' +
                    'input:not([disabled]), ' +
                    'select:not([disabled]), ' +
                    'textarea:not([disabled]), ' +
                    '[tabindex="0"]:not([disabled])'
                );
                
                App.focusableCache[viewId] = {
                    elements: Array.prototype.slice.call(elements),
                    timestamp: Date.now()
                };
                App.focusableCacheSize++;
            }
            
            return App.focusableCache[viewId].elements;
        },
        
        announceViewChange: function(view) {
            // Create or update ARIA live region
            var announcer = document.getElementById('view-announcer');
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
            var viewTitle = view.querySelector('h1, h2');
            var announcement = viewTitle ? viewTitle.textContent : 'New view loaded';
            announcer.textContent = announcement;
        },
        
        showDepthWarning: function() {
            // Show a gentle warning about navigation depth
            var warning = document.createElement('div');
            warning.className = 'depth-warning';
            warning.textContent = 'Please use the back button to return';
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
    var Platform = {
        detect: function() {
            var ua = navigator.userAgent;
            App.platform = {
                isCapacitor: typeof window.Capacitor !== 'undefined',
                isAndroid: false,
                isIOS: false,
                isPWA: window.matchMedia('(display-mode: standalone)').matches,
                isTV: ua.includes('TV') || window.innerWidth > 1920,
                isWeb: false
            };
            
            if (App.platform.isCapacitor) {
                var platform = window.Capacitor.getPlatform();
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
    var Navigation = {
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
            var link = e.target.closest('a');
            if (!link) return;
            
            var href = link.getAttribute('href');
            if (!href || href === '#') return;
            
            e.preventDefault();
            
            // Internal navigation
            if (href.startsWith('#')) {
                var viewId = href.substring(1) + '-view';
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
                var isBack = e.state.depth < App.navigationStack.length;
                ViewController.show(e.state.view, { animate: true, updateHistory: false, isBack: isBack });
            } else {
                // No state, go to main view
                ViewController.show('main-view', { animate: true, updateHistory: false });
            }
        },
        
        setupViewButtons: function() {
            // Menu button
            var menuBtn = document.getElementById('menu-button');
            if (menuBtn) {
                menuBtn.addEventListener('click', function() {
                    ViewController.show('settings-view', { animate: true });
                });
            }
            
            // Back buttons
            var backButtons = document.querySelectorAll('[id$="-back"]');
            backButtons.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (Platform.isWeb()) {
                        history.back();
                    } else {
                        // Navigate back in the stack
                        if (App.navigationStack.length > 1) {
                            var previousView = App.navigationStack[App.navigationStack.length - 2];
                            ViewController.show(previousView, { animate: true, isBack: true });
                        } else {
                            ViewController.show('main-view', { animate: true, isBack: true });
                        }
                    }
                });
            });
        },
        
        openExternal: function(url) {
            if (App.platform.isCapacitor && window.Capacitor.Plugins.Browser) {
                window.Capacitor.Plugins.Browser.open({ url: url });
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }
    };
    
    // TV Navigation Support
    var TVNavigation = {
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
                    var backBtn = document.querySelector('[id$="-back"]:not(.hidden [id$="-back"])');
                    if (backBtn) backBtn.click();
                    break;
            }
        },
        
        ensureFocusable: function() {
            // Make all interactive elements focusable
            var elements = document.querySelectorAll('button, a, input, select, textarea');
            elements.forEach(function(el) {
                if (!el.hasAttribute('tabindex')) {
                    el.setAttribute('tabindex', '0');
                }
            });
        },
        
        moveFocus: function(direction) {
            // Simple spatial navigation
            // TODO: Implement proper spatial navigation algorithm
            var focusable = Array.from(document.querySelectorAll(
                ':not(.hidden) button:not([disabled]), ' +
                ':not(.hidden) a[href], ' +
                ':not(.hidden) input:not([disabled]), ' +
                ':not(.hidden) select:not([disabled]), ' +
                ':not(.hidden) textarea:not([disabled]), ' +
                ':not(.hidden) [tabindex="0"]'
            ));
            
            var current = document.activeElement;
            var currentIndex = focusable.indexOf(current);
            
            var nextIndex;
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
    
    // Storage Manager (for offline support)
    var Storage = {
        init: function() {
            // Initialize storage
            this.loadSettings();
            this.loadTasks();
        },
        
        loadSettings: function() {
            try {
                var settings = localStorage.getItem('stackmap-settings');
                if (settings) {
                    // Apply settings
                    console.log('Settings loaded');
                }
            } catch (e) {
                console.warn('Could not load settings:', e);
            }
        },
        
        loadTasks: function() {
            try {
                var tasks = localStorage.getItem('stackmap-tasks');
                if (tasks) {
                    // Load tasks into UI
                    console.log('Tasks loaded');
                }
            } catch (e) {
                console.warn('Could not load tasks:', e);
            }
        },
        
        save: function(key, data) {
            try {
                localStorage.setItem('stackmap-' + key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        }
    };
    
    // Content Manager
    var Content = {
        load: function() {
            // Load content for views that need it
            this.loadPrivacy();
            this.loadTerms();
            this.loadSupport();
        },
        
        loadPrivacy: function() {
            var container = document.querySelector('#privacy-view .content');
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
            var container = document.querySelector('#terms-view .content');
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
            var container = document.querySelector('#support-view .content');
            if (container) {
                container.innerHTML = 
                    '<h2>Support StackMap</h2>' +
                    '<p>StackMap is free and open source. Your support helps maintain and improve the app.</p>' +
                    '<div class="support-options">' +
                        '<a href="https://paypal.me/stackadamj" class="support-link">PayPal</a>' +
                        '<a href="https://venmo.com/u/stackadamj" class="support-link">Venmo</a>' +
                        '<a href="https://patreon.com/StackMap" class="support-link">Patreon</a>' +
                    '</div>';
            }
        }
    };
    
    // Initialize Application
    function init() {
        // Detect platform
        Platform.detect();
        
        // Initialize modules
        ViewController.init();
        Navigation.init();
        Storage.init();
        Content.load();
        
        // Show safe mode banner if in safe mode
        if (window.StackMapSafeMode) {
            try {
                var banner = document.createElement('div');
                banner.className = 'safe-mode-banner';
                
                // Create text and link safely without innerHTML
                var textNode = document.createTextNode('Simple Mode Active - ');
                banner.appendChild(textNode);
                
                var exitLink = document.createElement('a');
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
                document.body.style.paddingTop = SAFE_MODE_CONSTANTS.BANNER_HEIGHT + 'px';
                
                // Add ARIA announcement for screen readers
                banner.setAttribute('role', 'status');
                banner.setAttribute('aria-live', 'polite');
            } catch (e) {
                // Banner creation failed - continue without banner
                console.warn('Safe mode: Could not create banner', e);
            }
        }
        
        // Show main view
        setTimeout(function() {
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
        
        // Clean up safe mode banner if present
        if (window.StackMapSafeModeExitHandler) {
            var exitLink = document.querySelector('.safe-mode-banner a');
            if (exitLink) {
                exitLink.removeEventListener('click', window.StackMapSafeModeExitHandler);
            }
            window.StackMapSafeModeExitHandler = null;
        }
        var banner = document.querySelector('.safe-mode-banner');
        if (banner && banner.parentNode) {
            banner.parentNode.removeChild(banner);
            document.body.style.paddingTop = ''; // Reset padding
        }
        
        // Clear focusable cache (but don't hold DOM references)
        for (var viewId in App.focusableCache) {
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
        var announcer = document.getElementById('view-announcer');
        if (announcer && announcer.parentNode) {
            announcer.parentNode.removeChild(announcer);
        }
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose API for debugging
    window.StackMapApp = {
        App: App,
        ViewController: ViewController,
        Platform: Platform,
        Navigation: Navigation,
        Storage: Storage,
        cleanup: cleanup
    };
})();