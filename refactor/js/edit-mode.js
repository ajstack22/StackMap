/**
 * Edit Mode System for StackMap
 * Protects ADHD users from accidental changes
 * ES5 compatible - no const/let, arrow functions
 */

(function() {
    'use strict';
    
    // Configuration
    var TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
    var STORAGE_KEY = 'stackmap-edit-mode';
    var STORAGE_TIMESTAMP_KEY = 'stackmap-edit-mode-timestamp';
    
    // State
    var state = {
        isActive: false,
        timeoutId: null,
        timerIntervalId: null,
        lastActivity: Date.now(),
        listeners: {
            'change': [],
            'timeout': []
        },
        // Store references for cleanup
        activityHandlers: {
            click: null,
            touchstart: null,
            keydown: null
        },
        toggleButtonHandler: null
    };
    
    /**
     * Initialize edit mode system
     */
    function init() {
        // Check if safe mode is active - disable edit mode completely
        if (window.StackMapSafeMode) {
            console.log('Edit mode disabled in safe mode');
            return;
        }
        
        // Restore state from localStorage
        restoreState();
        
        // Set up activity tracking
        setupActivityTracking();
        
        // Set up UI
        setupUI();
        
        // Start timeout if edit mode was active
        if (state.isActive) {
            startTimeout();
        }
    }
    
    /**
     * Restore state from localStorage
     */
    function restoreState() {
        try {
            var savedState = localStorage.getItem(STORAGE_KEY);
            var savedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
            
            if (savedState === 'true' && savedTimestamp) {
                var elapsed = Date.now() - parseInt(savedTimestamp, 10);
                
                // If less than timeout duration has passed, restore active state
                if (elapsed < TIMEOUT_DURATION) {
                    state.isActive = true;
                    state.lastActivity = parseInt(savedTimestamp, 10);
                } else {
                    // Timeout has passed, clear state
                    clearStoredState();
                }
            }
        } catch (e) {
            console.warn('Could not restore edit mode state:', e);
        }
    }
    
    /**
     * Clear stored state
     */
    function clearStoredState() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        } catch (e) {
            console.warn('Could not clear edit mode state:', e);
        }
    }
    
    /**
     * Save state to localStorage
     */
    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, state.isActive ? 'true' : 'false');
            if (state.isActive) {
                localStorage.setItem(STORAGE_TIMESTAMP_KEY, state.lastActivity.toString());
            } else {
                localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
            }
        } catch (e) {
            console.warn('Could not save edit mode state:', e);
        }
    }
    
    /**
     * Set up activity tracking to reset timeout
     */
    function setupActivityTracking() {
        // Track clicks and touches as activity
        var trackActivity = function() {
            if (state.isActive) {
                state.lastActivity = Date.now();
                resetTimeout();
            }
        };
        
        // Store handlers for cleanup
        state.activityHandlers.click = trackActivity;
        state.activityHandlers.touchstart = trackActivity;
        state.activityHandlers.keydown = trackActivity;
        
        // Add listeners
        document.addEventListener('click', trackActivity, true);
        document.addEventListener('touchstart', trackActivity, true);
        document.addEventListener('keydown', trackActivity, true);
    }
    
    /**
     * Remove activity tracking listeners
     */
    function removeActivityTracking() {
        if (state.activityHandlers.click) {
            document.removeEventListener('click', state.activityHandlers.click, true);
            state.activityHandlers.click = null;
        }
        if (state.activityHandlers.touchstart) {
            document.removeEventListener('touchstart', state.activityHandlers.touchstart, true);
            state.activityHandlers.touchstart = null;
        }
        if (state.activityHandlers.keydown) {
            document.removeEventListener('keydown', state.activityHandlers.keydown, true);
            state.activityHandlers.keydown = null;
        }
    }
    
    /**
     * Set up UI elements
     */
    function setupUI() {
        // Add toggle button to header
        var header = document.querySelector('#main-view .header');
        if (!header) return;
        
        // Find menu button to insert before it
        var menuButton = document.getElementById('menu-button');
        if (!menuButton) return;
        
        // Create toggle button
        var toggleButton = document.createElement('button');
        toggleButton.id = 'edit-mode-toggle';
        toggleButton.className = 'edit-mode-toggle';
        toggleButton.setAttribute('aria-label', 'Toggle edit mode');
        toggleButton.setAttribute('aria-pressed', state.isActive ? 'true' : 'false');
        toggleButton.textContent = '✏️';
        
        // Insert before menu button
        menuButton.parentNode.insertBefore(toggleButton, menuButton);
        
        // Create and store click handler
        state.toggleButtonHandler = function(e) {
            e.stopPropagation();
            toggle();
        };
        
        // Add click handler
        toggleButton.addEventListener('click', state.toggleButtonHandler);
        
        // Create edit mode banner
        createEditModeBanner();
        
        // Apply initial state
        updateUI();
    }
    
    /**
     * Create edit mode banner
     */
    function createEditModeBanner() {
        var mainView = document.getElementById('main-view');
        if (!mainView) return;
        
        var banner = document.createElement('div');
        banner.id = 'edit-mode-banner';
        banner.className = 'edit-mode-banner';
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');
        
        var text = document.createElement('span');
        text.textContent = 'Edit Mode Active';
        banner.appendChild(text);
        
        var timer = document.createElement('span');
        timer.id = 'edit-mode-timer';
        timer.className = 'edit-mode-timer';
        banner.appendChild(timer);
        
        // Insert after header
        var header = mainView.querySelector('.header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(banner, header.nextSibling);
        }
    }
    
    /**
     * Toggle edit mode
     */
    function toggle() {
        if (window.StackMapSafeMode) {
            console.log('Edit mode disabled in safe mode');
            return;
        }
        
        if (!state.isActive) {
            // Enabling edit mode - check if Grown-up Mode is required
            if (window.GrownupMode && window.GrownupMode.isEnabled()) {
                window.GrownupMode.showChallenge(function() {
                    // Success - proceed with enabling edit mode
                    actuallyEnableEditMode();
                });
                return;
            }
        }
        
        // Toggle normally (disabling or Grown-up Mode not required)
        state.isActive = !state.isActive;
        state.lastActivity = Date.now();
        
        if (state.isActive) {
            startTimeout();
        } else {
            stopTimeout();
        }
        
        saveState();
        updateUI();
        emit('change', state.isActive);
    }
    
    /**
     * Actually enable edit mode (internal use)
     */
    function actuallyEnableEditMode() {
        state.isActive = true;
        state.lastActivity = Date.now();
        startTimeout();
        saveState();
        updateUI();
        emit('change', state.isActive);
    }
    
    /**
     * Enable edit mode
     */
    function enable() {
        if (!state.isActive) {
            toggle();
        }
    }
    
    /**
     * Disable edit mode
     */
    function disable() {
        if (state.isActive) {
            toggle();
        }
    }
    
    /**
     * Check if edit mode is active
     */
    function isActive() {
        return state.isActive && !window.StackMapSafeMode;
    }
    
    /**
     * Start timeout timer
     */
    function startTimeout() {
        stopTimeout(); // Clear any existing timeout
        
        // Use TimerManager if available for better memory management
        if (window.TimerManager) {
            state.timeoutId = window.TimerManager.setTimeout(function() {
                handleTimeout();
            }, TIMEOUT_DURATION);
        } else {
            state.timeoutId = setTimeout(function() {
                handleTimeout();
            }, TIMEOUT_DURATION);
        }
        
        // Update timer display
        updateTimer();
    }
    
    /**
     * Stop timeout timer
     */
    function stopTimeout() {
        if (state.timeoutId) {
            if (window.TimerManager) {
                window.TimerManager.clear(state.timeoutId);
            } else {
                clearTimeout(state.timeoutId);
            }
            state.timeoutId = null;
        }
        
        // Clear timer interval
        if (state.timerIntervalId) {
            if (window.TimerManager) {
                window.TimerManager.clear(state.timerIntervalId);
            } else {
                clearInterval(state.timerIntervalId);
            }
            state.timerIntervalId = null;
        }
        
        // Clear timer display
        var timer = document.getElementById('edit-mode-timer');
        if (timer) {
            timer.textContent = '';
        }
    }
    
    /**
     * Reset timeout timer
     */
    function resetTimeout() {
        if (state.isActive) {
            startTimeout();
        }
    }
    
    /**
     * Handle timeout
     */
    function handleTimeout() {
        console.log('Edit mode timeout - auto-disabling');
        disable();
        emit('timeout');
        
        // Show notification
        showTimeoutNotification();
    }
    
    /**
     * Update timer display
     */
    function updateTimer() {
        if (!state.isActive) return;
        
        var timer = document.getElementById('edit-mode-timer');
        if (!timer) return;
        
        // Clear any existing timer interval
        if (state.timerIntervalId) {
            clearInterval(state.timerIntervalId);
            state.timerIntervalId = null;
        }
        
        var updateDisplay = function() {
            if (!state.isActive) {
                if (state.timerIntervalId) {
                    clearInterval(state.timerIntervalId);
                    state.timerIntervalId = null;
                }
                return;
            }
            
            var elapsed = Date.now() - state.lastActivity;
            var remaining = TIMEOUT_DURATION - elapsed;
            
            if (remaining > 0) {
                var minutes = Math.floor(remaining / 60000);
                var seconds = Math.floor((remaining % 60000) / 1000);
                timer.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
            } else {
                // Clear interval if time is up
                if (state.timerIntervalId) {
                    clearInterval(state.timerIntervalId);
                    state.timerIntervalId = null;
                }
            }
        };
        
        // Start immediate update
        updateDisplay();
        
        // Set up interval for updates
        if (window.TimerManager) {
            state.timerIntervalId = window.TimerManager.setInterval(updateDisplay, 1000);
        } else {
            state.timerIntervalId = setInterval(updateDisplay, 1000);
        }
    }
    
    /**
     * Update UI based on current state
     */
    function updateUI() {
        var isEditMode = state.isActive;
        
        // Update toggle button
        var toggleButton = document.getElementById('edit-mode-toggle');
        if (toggleButton) {
            toggleButton.setAttribute('aria-pressed', isEditMode ? 'true' : 'false');
            toggleButton.classList.toggle('active', isEditMode);
        }
        
        // Update document class
        document.documentElement.classList.toggle('edit-mode', isEditMode);
        
        // Update banner visibility
        var banner = document.getElementById('edit-mode-banner');
        if (banner) {
            banner.style.display = isEditMode ? 'block' : 'none';
        }
        
        // Update timer if active
        if (isEditMode) {
            updateTimer();
        }
    }
    
    /**
     * Show timeout notification
     */
    function showTimeoutNotification() {
        var notification = document.createElement('div');
        notification.className = 'edit-mode-notification';
        notification.setAttribute('role', 'alert');
        notification.textContent = 'Edit mode disabled due to inactivity';
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    /**
     * Add event listener
     */
    function on(event, callback) {
        if (state.listeners[event]) {
            state.listeners[event].push(callback);
        }
    }
    
    /**
     * Remove event listener
     */
    function off(event, callback) {
        if (state.listeners[event]) {
            var index = state.listeners[event].indexOf(callback);
            if (index > -1) {
                state.listeners[event].splice(index, 1);
            }
        }
    }
    
    /**
     * Emit event
     */
    function emit(event, data) {
        if (state.listeners[event]) {
            state.listeners[event].forEach(function(callback) {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Error in edit mode listener:', e);
                }
            });
        }
    }
    
    /**
     * Destroy and clean up the module
     */
    function destroy() {
        // Stop all timers
        stopTimeout();
        
        // Remove activity tracking
        removeActivityTracking();
        
        // Remove toggle button handler
        var toggleButton = document.getElementById('edit-mode-toggle');
        if (toggleButton && state.toggleButtonHandler) {
            toggleButton.removeEventListener('click', state.toggleButtonHandler);
            state.toggleButtonHandler = null;
        }
        
        // Clear all listeners
        state.listeners.change = [];
        state.listeners.timeout = [];
        
        // Reset state
        state.isActive = false;
        clearStoredState();
    }
    
    // Public API
    window.EditMode = {
        init: init,
        toggle: toggle,
        enable: enable,
        disable: disable,
        isActive: isActive,
        on: on,
        off: off,
        destroy: destroy
    };
    
})();