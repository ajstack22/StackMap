/**
 * Component Error Handler for StackMap
 * Provides error boundaries for individual components
 * Phase 4 Emergency Fallback implementation
 */

(function() {
    'use strict';
    
    var ComponentErrorHandler = {
        /**
         * Wrap component initialization with error boundary
         * @param {string} componentName - Name of the component
         * @param {string} wrapperId - ID of the wrapper element
         * @param {Function} initFunction - Initialization function to wrap
         * @param {Object} context - Context to bind to init function
         */
        wrapInit: function(componentName, wrapperId, initFunction, context) {
            try {
                // Call the initialization function
                if (context) {
                    initFunction.call(context);
                } else {
                    initFunction();
                }
                
                console.log(componentName + ' initialized successfully');
                
            } catch (error) {
                console.error(componentName + ' failed:', error);
                
                // Activate fallback UI for this component
                this.activateFallback(wrapperId, componentName);
                
                // Store error for recovery attempts
                this.storeError(componentName, error);
                
                // Attempt recovery after delay
                this.scheduleRecovery(componentName, wrapperId, initFunction, context);
            }
        },
        
        /**
         * Activate fallback UI for a component
         */
        activateFallback: function(wrapperId, componentName) {
            var wrapper = document.getElementById(wrapperId);
            if (wrapper) {
                wrapper.classList.add('component-error-active');
                
                // Focus on fallback for screen readers
                var fallback = wrapper.querySelector('.component-fallback');
                if (fallback) {
                    fallback.setAttribute('tabindex', '-1');
                    
                    // Delay focus to ensure visibility
                    setTimeout(function() {
                        try {
                            fallback.focus();
                        } catch (e) {
                            // Focus might fail on some elements
                        }
                    }, 100);
                }
                
                // Log for analytics
                this.logError(componentName);
            }
        },
        
        /**
         * Deactivate fallback UI (on recovery)
         */
        deactivateFallback: function(wrapperId) {
            var wrapper = document.getElementById(wrapperId);
            if (wrapper) {
                wrapper.classList.remove('component-error-active');
            }
        },
        
        /**
         * Store error information for recovery
         */
        storeError: function(componentName, error) {
            try {
                var errorData = {
                    component: componentName,
                    message: error.message || 'Unknown error',
                    stack: error.stack || '',
                    timestamp: Date.now()
                };
                
                sessionStorage.setItem('stackmap_error_' + componentName, JSON.stringify(errorData));
            } catch (e) {
                // Storage might fail
            }
        },
        
        /**
         * Schedule recovery attempt
         */
        scheduleRecovery: function(componentName, wrapperId, initFunction, context) {
            var self = this;
            var delay = window.StackMapSafeMode ? 10000 : 5000; // Longer delay in safe mode
            
            setTimeout(function() {
                console.log('Attempting recovery for ' + componentName);
                
                // Try to recover
                try {
                    if (context) {
                        initFunction.call(context);
                    } else {
                        initFunction();
                    }
                    
                    // Success - remove fallback
                    self.deactivateFallback(wrapperId);
                    console.log(componentName + ' recovered successfully');
                    
                } catch (error) {
                    console.error(componentName + ' recovery failed:', error);
                    // Leave fallback active
                }
            }, delay);
        },
        
        /**
         * Log error for analytics
         */
        logError: function(componentName) {
            try {
                var count = parseInt(localStorage.getItem('stackmap_component_errors') || '0', 10);
                localStorage.setItem('stackmap_component_errors', (count + 1).toString());
                
                // Component-specific error count
                var componentCount = parseInt(localStorage.getItem('stackmap_error_' + componentName) || '0', 10);
                localStorage.setItem('stackmap_error_' + componentName, (componentCount + 1).toString());
            } catch (e) {
                // Storage might fail
            }
        },
        
        /**
         * Manual recovery trigger (for retry buttons)
         */
        retryComponent: function(componentName, wrapperId, initFunction, context) {
            console.log('Manual retry for ' + componentName);
            
            // Remove error state first
            this.deactivateFallback(wrapperId);
            
            // Try initialization again
            this.wrapInit(componentName, wrapperId, initFunction, context);
        }
    };
    
    // Expose globally
    window.StackMapComponentErrorHandler = ComponentErrorHandler;
    
})();