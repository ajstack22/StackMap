/**
 * Edit Mode System for StackMap
 * Protects ADHD users from accidental changes
 * ES5 compatible - no const/let, arrow functions
 */

(function() {
    'use strict';
    
    // Configuration
    const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
    const STORAGE_KEY = 'stackmap-edit-mode';
    const STORAGE_TIMESTAMP_KEY = 'stackmap-edit-mode-timestamp';
    
    // State
    const state = {
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
        toggleButtonHandler: null,
        // Bulk operations support
        selectionManager: null,
        bulkOperationsManager: null
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
            const savedState = localStorage.getItem(STORAGE_KEY);
            const savedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
            
            if (savedState === 'true' && savedTimestamp) {
                const elapsed = Date.now() - parseInt(savedTimestamp, 10);
                
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
        const trackActivity = function() {
            if (state.isActive) {
                state.lastActivity = Date.now();
                resetTimeout();
            }
        };
        
        // Keyboard shortcut handler (Cmd/Ctrl + E)
        const keyboardHandler = function(e) {
            // Check for Cmd/Ctrl + E
            if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                toggle();
                
                // Announce to screen readers
                if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                    window.StackMapKeyboardNav.announce(`Edit mode ${state.isActive ? 'enabled' : 'disabled'}`);
                }
            } else if (state.isActive) {
                // Track as activity only if edit mode is active
                trackActivity();
            }
        };
        
        // Store handlers for cleanup
        state.activityHandlers.click = trackActivity;
        state.activityHandlers.touchstart = trackActivity;
        state.activityHandlers.keydown = keyboardHandler;
        
        // Add listeners
        document.addEventListener('click', trackActivity, true);
        document.addEventListener('touchstart', trackActivity, true);
        document.addEventListener('keydown', keyboardHandler, true);
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
        const header = document.querySelector('#main-view .header');
        if (!header) return;
        
        // Find menu button to insert before it
        const menuButton = document.getElementById('menu-button');
        if (!menuButton) return;
        
        // Create toggle button
        const toggleButton = document.createElement('button');
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
        const mainView = document.getElementById('main-view');
        if (!mainView) return;
        
        const banner = document.createElement('div');
        banner.id = 'edit-mode-banner';
        banner.className = 'edit-mode-banner';
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');
        
        const text = document.createElement('span');
        text.textContent = 'Edit Mode Active';
        text.className = 'edit-mode-banner-text';
        banner.appendChild(text);
        
        const timer = document.createElement('span');
        timer.id = 'edit-mode-timer';
        timer.className = 'edit-mode-timer';
        banner.appendChild(timer);
        
        // Add Exit button
        const exitButton = document.createElement('button');
        exitButton.className = 'edit-mode-exit-button';
        exitButton.textContent = 'Exit Edit Mode';
        exitButton.setAttribute('aria-label', 'Exit edit mode');
        exitButton.onclick = function() {
            disable();
        };
        banner.appendChild(exitButton);
        
        // Insert after header
        const header = mainView.querySelector('.header');
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
        const timer = document.getElementById('edit-mode-timer');
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
        
        const timer = document.getElementById('edit-mode-timer');
        if (!timer) return;
        
        // Clear any existing timer interval
        if (state.timerIntervalId) {
            clearInterval(state.timerIntervalId);
            state.timerIntervalId = null;
        }
        
        const updateDisplay = function() {
            if (!state.isActive) {
                if (state.timerIntervalId) {
                    clearInterval(state.timerIntervalId);
                    state.timerIntervalId = null;
                }
                return;
            }
            
            const elapsed = Date.now() - state.lastActivity;
            const remaining = TIMEOUT_DURATION - elapsed;
            
            if (remaining > 0) {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                timer.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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
        const isEditMode = state.isActive;
        
        // Update toggle button
        const toggleButton = document.getElementById('edit-mode-toggle');
        if (toggleButton) {
            toggleButton.setAttribute('aria-pressed', isEditMode ? 'true' : 'false');
            toggleButton.classList.toggle('active', isEditMode);
        }
        
        // Update document class
        document.documentElement.classList.toggle('edit-mode', isEditMode);
        
        // Update banner visibility
        const banner = document.getElementById('edit-mode-banner');
        if (banner) {
            banner.style.display = isEditMode ? 'block' : 'none';
        }
        
        // Update timer if active
        if (isEditMode) {
            updateTimer();
        }
        
        // Update card edit controls
        updateCardEditControls(isEditMode);
    }
    
    /**
     * Update card edit controls visibility and state
     */
    function updateCardEditControls(isEditMode) {
        // Find all activity cards
        const cards = document.querySelectorAll('.activity-card, .task-card, .visual-card');
        
        cards.forEach(function(card) {
            if (isEditMode) {
                enableCardEditMode(card);
            } else {
                disableCardEditMode(card);
            }
        });
        
        // Notify card systems of edit mode change
        if (window.ActivityCards && window.ActivityCards.onEditModeChange) {
            window.ActivityCards.onEditModeChange(isEditMode);
        }
        
        // Re-render cards to show/hide edit controls
        if (isEditMode && window.ActivityDisplay && window.ActivityDisplay.render) {
            // Small delay to ensure UI updates are complete
            setTimeout(function() {
                window.ActivityDisplay.render();
            }, 50);
        }
    }
    
    /**
     * Enable edit mode for a specific card
     */
    function enableCardEditMode(card) {
        card.classList.add('card-edit-mode');
        card.setAttribute('aria-selected', 'false');
        
        // Add drag handle if drag-drop is available
        if (window.DragDropReorder && !card.querySelector('.card-drag-handle')) {
            const dragHandle = createDragHandle();
            card.appendChild(dragHandle);
        }
        
        // Show edit controls if they exist
        const editControls = card.querySelector('.card-edit-controls');
        if (editControls) {
            editControls.style.display = 'flex';
        }
        
        // Add visual edit indicators
        if (!card.querySelector('.card-edit-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'card-edit-indicator';
            indicator.setAttribute('aria-hidden', 'true');
            card.appendChild(indicator);
        }
    }
    
    /**
     * Disable edit mode for a specific card
     */
    function disableCardEditMode(card) {
        card.classList.remove('card-edit-mode');
        card.removeAttribute('aria-selected');
        
        // Remove drag handle
        const dragHandle = card.querySelector('.card-drag-handle');
        if (dragHandle) {
            dragHandle.remove();
        }
        
        // Hide edit controls
        const editControls = card.querySelector('.card-edit-controls');
        if (editControls) {
            editControls.style.display = 'none';
        }
        
        // Remove edit indicator
        const indicator = card.querySelector('.card-edit-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    /**
     * Create drag handle for card reordering
     */
    function createDragHandle() {
        const handle = document.createElement('div');
        handle.className = 'card-drag-handle';
        handle.setAttribute('aria-label', 'Drag to reorder');
        handle.setAttribute('role', 'button');
        handle.setAttribute('tabindex', '0');
        
        // Touch target sizing
        const targetSize = window.StackMapSafeMode ? 60 : 44;
        handle.style.minWidth = targetSize + 'px';
        handle.style.minHeight = targetSize + 'px';
        
        // Drag icon
        const icon = document.createElement('span');
        icon.className = 'drag-icon';
        icon.textContent = '⋮⋮';
        icon.setAttribute('aria-hidden', 'true');
        handle.appendChild(icon);
        
        // Keyboard support for drag handle
        handle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Start keyboard-based reordering
                if (window.DragDropReorder && window.DragDropReorder.startKeyboardReorder) {
                    window.DragDropReorder.startKeyboardReorder(handle.closest('.activity-card, .task-card'));
                }
            }
        });
        
        return handle;
    }
    
    /**
     * Show timeout notification
     */
    function showTimeoutNotification() {
        const notification = document.createElement('div');
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
            const index = state.listeners[event].indexOf(callback);
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
     * Enable bulk operations
     */
    function enableBulkOperations() {
        if (!state.selectionManager && window.SelectionManager) {
            state.selectionManager = new window.SelectionManager();
            state.selectionManager.init();
        }
        
        if (!state.bulkOperationsManager && window.BulkOperationsManager && state.selectionManager) {
            state.bulkOperationsManager = new window.BulkOperationsManager(state.selectionManager);
        }
        
        // Initialize bulk action bar
        if (window.BulkActionBar && state.selectionManager && state.bulkOperationsManager) {
            window.BulkActionBar.init(state.selectionManager, state.bulkOperationsManager);
        }
        
        return {
            selectionManager: state.selectionManager,
            bulkOperationsManager: state.bulkOperationsManager
        };
    }
    
    /**
     * Toggle selection mode
     */
    function toggleSelectionMode() {
        if (!state.isActive) {
            console.warn('Edit mode must be active to use selection mode');
            return false;
        }
        
        if (!state.selectionManager) {
            enableBulkOperations();
        }
        
        if (state.selectionManager) {
            return state.selectionManager.toggleSelectionMode();
        }
        
        return false;
    }
    
    /**
     * Get selection manager
     */
    function getSelectionManager() {
        return state.selectionManager;
    }
    
    /**
     * Get bulk operations manager
     */
    function getBulkOperationsManager() {
        return state.bulkOperationsManager;
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
        const toggleButton = document.getElementById('edit-mode-toggle');
        if (toggleButton && state.toggleButtonHandler) {
            toggleButton.removeEventListener('click', state.toggleButtonHandler);
            state.toggleButtonHandler = null;
        }
        
        // Clean up bulk operations
        if (state.selectionManager) {
            state.selectionManager.destroy();
            state.selectionManager = null;
        }
        
        if (state.bulkOperationsManager) {
            state.bulkOperationsManager.destroy();
            state.bulkOperationsManager = null;
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
        destroy: destroy,
        // Bulk operations
        enableBulkOperations: enableBulkOperations,
        toggleSelectionMode: toggleSelectionMode,
        getSelectionManager: getSelectionManager,
        getBulkOperationsManager: getBulkOperationsManager
    };
    
})();