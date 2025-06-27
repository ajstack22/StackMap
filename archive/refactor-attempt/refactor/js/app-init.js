/**
 * App Initialization for StackMap
 * Starts the application after all components are loaded
 */

(function() {
    'use strict';
    
    const AppInit = {
        isInitialized: false,
        components: [],
        
        /**
         * Initialize the application
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            console.log('AppInit: Starting StackMap application...');
            
            // Wait for ALL scripts to load, not just DOM
            if (document.readyState !== 'complete') {
                window.addEventListener('load', function() {
                    setTimeout(() => self.startApp(), 500); // Give scripts time to initialize
                });
            } else {
                setTimeout(() => self.startApp(), 500);
            }
        },
        
        /**
         * Start the application components
         */
        startApp: function() {
            const self = this;
            
            console.log('AppInit: DOM ready, initializing components...');
            
            // Show main view immediately - don't wait for components
            const loadingView = document.getElementById('loading-view');
            const mainView = document.getElementById('main-view');
            
            if (loadingView) {
                loadingView.classList.add('hidden');
            }
            
            if (mainView) {
                mainView.classList.remove('hidden');
            }
            
            console.log('AppInit: Views switched, main app visible');
            
            // Try to initialize components if available (don't fail if missing)
            setTimeout(function() {
                self.initializeComponent('ActivityDisplay', function() {
                    if (window.ActivityDisplay && window.ActivityDisplay.init) {
                        // ActivityDisplay auto-initializes, just check if it's available
                        return window.ActivityDisplay.isInitialized || true;
                    }
                    return false;
                });
                
                self.initializeComponent('EditMode', function() {
                    if (window.EditMode && window.EditMode.init) {
                        window.EditMode.init();
                        return true;
                    }
                    return false;
                });
                
                self.initializeComponent('Modal', function() {
                    if (window.Modal) {
                        window.Modal.init && window.Modal.init();
                        return true;
                    }
                    return false;
                });
            }, 100);
            
            // Mark as initialized
            self.isInitialized = true;
            
            console.log('AppInit: Application started successfully');
            
            // Dispatch app ready event
            document.dispatchEvent(new CustomEvent('appReady'));
        },
        
        /**
         * Initialize a component with error handling
         */
        initializeComponent: function(name, initFunction) {
            const self = this;
            
            try {
                console.log(`AppInit: Initializing ${name}...`);
                
                const success = initFunction();
                if (success) {
                    console.log(`AppInit: ${name} initialized successfully`);
                    self.components.push(name);
                } else {
                    console.warn(`AppInit: ${name} not available, skipping`);
                }
            } catch (error) {
                console.error(`AppInit: Failed to initialize ${name}:`, error);
                
                // Try to activate fallback if component error handler is available
                if (window.StackMapComponentErrorHandler) {
                    window.StackMapComponentErrorHandler.activateFallback(`${name.toLowerCase()}-container`, name);
                }
            }
        }
    };
    
    // Export to global scope
    window.AppInit = AppInit;
    
    // Auto-initialize when script loads
    AppInit.init();
    
})();