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
            
            // Performance monitoring start
            if (window.PerformanceMonitor) {
                document.dispatchEvent(new CustomEvent('modeToggleStart'));
            }
            
            // Animate button
            self.button.classList.add('animating');
            
            // Try new DisplayModeManager first (Story #117)
            if (window.DisplayModeManager) {
                const currentMode = window.DisplayModeManager.getCurrentMode();
                
                // Invalidate badge cache for current mode
                if (window.BadgeCache) {
                    const invalidated = window.BadgeCache.invalidateDisplayMode(currentMode === 'times' ? 'time' : 'numbers');
                    console.log(`DisplayModeToggle: Invalidated ${invalidated} cached badges for mode: ${currentMode}`);
                }
                
                // Toggle mode using DisplayModeManager
                window.DisplayModeManager.toggleMode();
            } else {
                // Fallback to legacy method
                const displayManager = window.ActivityDisplay || window.TaskDisplay;
                if (!displayManager) {
                    console.error('DisplayModeToggle: Display manager not available');
                    self.button.classList.remove('animating');
                    return;
                }
                
                const currentMode = displayManager.getDisplayMode();
                
                // Invalidate badge cache for current mode
                if (window.BadgeCache) {
                    const invalidated = window.BadgeCache.invalidateDisplayMode(currentMode);
                    console.log(`DisplayModeToggle: Invalidated ${invalidated} cached badges for mode: ${currentMode}`);
                }
                
                // Toggle mode
                displayManager.toggleDisplayMode();
            }
            
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
            
            let currentMode;
            
            // Try new DisplayModeManager first (Story #117)
            if (window.DisplayModeManager) {
                currentMode = window.DisplayModeManager.getCurrentMode();
                
                if (currentMode === 'times') {
                    self.icon.textContent = '⏰';
                    self.button.setAttribute('aria-label', 'Switch to Numbers Mode');
                    self.button.title = 'Switch to duration-based planning';
                    self.button.setAttribute('data-mode-icon', '⏰');
                } else {
                    self.icon.textContent = '🔢';
                    self.button.setAttribute('aria-label', 'Switch to Times Mode');
                    self.button.title = 'Switch to schedule-based planning';
                    self.button.setAttribute('data-mode-icon', '🔢');
                }
            } else {
                // Fallback to legacy ActivityDisplay (backward compatibility)
                const displayManager = window.ActivityDisplay || window.TaskDisplay;
                if (!displayManager) return;
                
                currentMode = displayManager.getDisplayMode();
                
                if (currentMode === 'time') {
                    self.icon.textContent = '🕐';
                    self.button.setAttribute('aria-label', 'Switch to number display');
                    self.button.title = 'Show activity numbers';
                } else {
                    self.icon.textContent = '123';
                    self.button.setAttribute('aria-label', 'Switch to time display');
                    self.button.title = 'Show activity times';
                }
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