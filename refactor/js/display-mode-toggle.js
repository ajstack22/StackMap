/**
 * Display Mode Toggle
 * Switches between numbers and time display for activities
 */

(function() {
    'use strict';
    
    const DisplayModeToggle = {
        button: null,
        icon: null,
        isInitialized: false,
        
        /**
         * Initialize the toggle button
         */
        init: function() {
            const self = this;
            
            // Find button
            self.button = document.getElementById('display-mode-toggle');
            if (!self.button) {
                console.warn('DisplayModeToggle: Button not found');
                return;
            }
            
            // Find icon span
            self.icon = self.button.querySelector('.toggle-icon');
            
            // Set initial state
            self.updateButtonState();
            
            // Add click handler
            self.button.addEventListener('click', function(e) {
                e.preventDefault();
                self.toggleMode();
            });
            
            // Listen for external mode changes
            document.addEventListener('displayModeChanged', function(e) {
                self.updateButtonState();
            });
            
            // Hide in edit mode
            if (window.EditMode) {
                window.EditMode.on('change', function() {
                    self.updateVisibility();
                });
            }
            
            self.isInitialized = true;
            console.log('DisplayModeToggle: Initialized');
        },
        
        /**
         * Toggle between modes
         */
        toggleMode: function() {
            const self = this;
            
            // Use ActivityDisplay instead of TaskDisplay (migration compatibility)
            const displayManager = window.ActivityDisplay || window.TaskDisplay;
            if (!displayManager) {
                console.error('DisplayModeToggle: Display manager not available');
                return;
            }
            
            // Performance monitoring start
            if (window.PerformanceMonitor) {
                document.dispatchEvent(new CustomEvent('modeToggleStart'));
            }
            
            // Get current mode for cache invalidation
            const currentMode = displayManager.getDisplayMode();
            
            // Animate button
            self.button.classList.add('animating');
            
            // Invalidate badge cache for current mode
            if (window.BadgeCache) {
                const invalidated = window.BadgeCache.invalidateDisplayMode(currentMode);
                console.log(`DisplayModeToggle: Invalidated ${invalidated} cached badges for mode: ${currentMode}`);
            }
            
            // Toggle mode
            displayManager.toggleDisplayMode();
            
            // Update button after shorter animation for better perceived performance
            setTimeout(function() {
                self.updateButtonState();
                self.button.classList.remove('animating');
                
                // Performance monitoring end
                if (window.PerformanceMonitor) {
                    document.dispatchEvent(new CustomEvent('modeToggleEnd'));
                }
            }, 150); // Reduced from 300ms for better performance
        },
        
        /**
         * Update button state based on current mode
         */
        updateButtonState: function() {
            const self = this;
            
            // Use ActivityDisplay instead of TaskDisplay (migration compatibility)
            const displayManager = window.ActivityDisplay || window.TaskDisplay;
            if (!self.icon || !displayManager) return;
            
            const currentMode = displayManager.getDisplayMode();
            
            if (currentMode === 'time') {
                self.icon.textContent = '🕐';
                self.button.setAttribute('aria-label', 'Switch to number display');
                self.button.title = 'Show activity numbers';
            } else {
                self.icon.textContent = '123';
                self.button.setAttribute('aria-label', 'Switch to time display');
                self.button.title = 'Show activity times';
            }
        },
        
        /**
         * Update visibility based on edit mode
         */
        updateVisibility: function() {
            const self = this;
            
            if (!self.button) return;
            
            if (window.EditMode && window.EditMode.isActive()) {
                self.button.style.display = 'none';
            } else {
                self.button.style.display = '';
            }
        }
    };
    
    // Expose to global scope
    window.DisplayModeToggle = DisplayModeToggle;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            DisplayModeToggle.init();
        });
    } else {
        // DOM already loaded
        setTimeout(function() {
            DisplayModeToggle.init();
        }, 100);
    }
})();