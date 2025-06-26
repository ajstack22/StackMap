/**
 * Left Menu System for Activity Management
 * Handles the sliding left menu for edit mode operations
 */

(function() {
    'use strict';
    
    // State
    const state = {
        isOpen: false,
        activeAction: null,
        touchStartX: null,
        touchStartY: null,
        swipeThreshold: 50
    };
    
    // DOM elements (cached after init)
    let elements = {};
    
    /**
     * Initialize the left menu system
     */
    function init() {
        // Cache DOM elements
        elements = {
            overlay: document.getElementById('left-menu-overlay'),
            menu: document.getElementById('left-menu'),
            openButton: document.getElementById('left-menu-button'),
            closeButton: document.getElementById('left-menu-close'),
            menuItems: document.querySelectorAll('.menu-item[data-action]')
        };
        
        // Verify elements exist
        if (!elements.overlay || !elements.menu || !elements.openButton) {
            console.warn('Left menu elements not found');
            return;
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Ensure menu is hidden on init
        close();
    }
    
    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Open button
        if (elements.openButton) {
            elements.openButton.addEventListener('click', open);
        }
        
        // Close button
        if (elements.closeButton) {
            elements.closeButton.addEventListener('click', close);
        }
        
        // Overlay click to close
        if (elements.overlay) {
            elements.overlay.addEventListener('click', function(e) {
                if (e.target === elements.overlay) {
                    close();
                }
            });
        }
        
        // Menu item clicks
        elements.menuItems.forEach(function(item) {
            item.addEventListener('click', handleMenuItemClick);
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', handleKeydown);
        
        // Touch gestures for mobile
        if ('ontouchstart' in window) {
            setupTouchGestures();
        }
    }
    
    /**
     * Set up touch gestures for swipe to close
     */
    function setupTouchGestures() {
        elements.menu.addEventListener('touchstart', handleTouchStart, { passive: true });
        elements.menu.addEventListener('touchmove', handleTouchMove, { passive: true });
        elements.menu.addEventListener('touchend', handleTouchEnd);
    }
    
    /**
     * Handle touch start
     */
    function handleTouchStart(e) {
        state.touchStartX = e.touches[0].clientX;
        state.touchStartY = e.touches[0].clientY;
    }
    
    /**
     * Handle touch move
     */
    function handleTouchMove(e) {
        if (!state.touchStartX || !state.touchStartY) {
            return;
        }
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        const deltaX = state.touchStartX - touchX;
        const deltaY = Math.abs(state.touchStartY - touchY);
        
        // Only handle horizontal swipes
        if (Math.abs(deltaX) > deltaY && deltaX < -state.swipeThreshold) {
            // Swiping left (close menu)
            close();
            state.touchStartX = null;
            state.touchStartY = null;
        }
    }
    
    /**
     * Handle touch end
     */
    function handleTouchEnd() {
        state.touchStartX = null;
        state.touchStartY = null;
    }
    
    /**
     * Handle keyboard navigation
     */
    function handleKeydown(e) {
        if (!state.isOpen) return;
        
        // Escape key closes menu
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    }
    
    /**
     * Open the menu
     */
    function open() {
        if (state.isOpen) return;
        
        state.isOpen = true;
        elements.overlay.classList.add('active');
        elements.overlay.setAttribute('aria-hidden', 'false');
        
        // Focus management
        elements.closeButton.focus();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Dispatch event
        const event = new CustomEvent('leftmenu:open');
        document.dispatchEvent(event);
    }
    
    /**
     * Close the menu
     */
    function close() {
        if (!state.isOpen && elements.overlay.classList.contains('active')) {
            // Force close even if state is out of sync
            elements.overlay.classList.remove('active');
        }
        
        state.isOpen = false;
        elements.overlay.classList.remove('active');
        elements.overlay.setAttribute('aria-hidden', 'true');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to open button
        if (elements.openButton) {
            elements.openButton.focus();
        }
        
        // Dispatch event
        const event = new CustomEvent('leftmenu:close');
        document.dispatchEvent(event);
    }
    
    /**
     * Handle menu item clicks
     */
    function handleMenuItemClick(e) {
        const action = e.currentTarget.getAttribute('data-action');
        if (!action) return;
        
        state.activeAction = action;
        
        // Dispatch action event
        const event = new CustomEvent('leftmenu:action', {
            detail: { action: action }
        });
        document.dispatchEvent(event);
        
        // Handle specific actions
        switch (action) {
            case 'add-activity':
                handleAddActivity();
                break;
            case 'quick-templates':
                handleQuickTemplates();
                break;
            case 'activity-library':
                handleActivityLibrary();
                break;
            case 'reorder':
                handleReorderMode();
                break;
            case 'pin-mode':
                handlePinMode();
                break;
            case 'bulk-select':
                handleBulkSelect();
                break;
            case 'bulk-delete':
                handleBulkDelete();
                break;
            case 'complete-day':
                handleCompleteDay();
                break;
            case 'copy-tomorrow':
                handleCopyToTomorrow();
                break;
            default:
                console.warn('Unknown menu action:', action);
        }
        
        // Close menu after action (can be prevented by action handler)
        if (!e.defaultPrevented) {
            close();
        }
    }
    
    /**
     * Action handlers
     */
    function handleAddActivity() {
        // Trigger add activity modal/view
        if (window.TaskDisplay && window.TaskDisplay.addTask) {
            window.TaskDisplay.addTask();
        } else if (window.TaskUI && window.TaskUI.showAddActivityModal) {
            window.TaskUI.showAddActivityModal();
        }
    }
    
    function handleQuickTemplates() {
        // Show quick templates
        if (window.ActivityTemplates && window.ActivityTemplates.show) {
            window.ActivityTemplates.show();
        }
    }
    
    function handleActivityLibrary() {
        // Show activity library
        if (window.ActivityLibrary && window.ActivityLibrary.show) {
            window.ActivityLibrary.show();
        }
    }
    
    function handleReorderMode() {
        // Enable reorder mode
        if (window.DragDropReorder && window.DragDropReorder.init) {
            window.DragDropReorder.init();
            // Show visual feedback that reorder mode is active
            const container = document.getElementById('activity-container') || document.getElementById('task-container');
            if (container) {
                container.classList.add('reorder-mode');
            }
        }
    }
    
    function handlePinMode() {
        // Enable pin mode
        // TODO: Implement pin mode functionality
        console.log('Pin mode not yet implemented');
        const event = new CustomEvent('notification:show', {
            detail: { message: 'Pin mode coming soon!' }
        });
        document.dispatchEvent(event);
    }
    
    function handleBulkSelect() {
        // Enable bulk selection mode
        if (window.EditMode && window.EditMode.toggleSelectionMode) {
            window.EditMode.toggleSelectionMode();
        } else {
            console.warn('Bulk selection not available - EditMode not found');
        }
    }
    
    function handleBulkDelete() {
        // Enable bulk delete mode
        if (window.BulkOperations && window.BulkOperations.start) {
            window.BulkOperations.start('delete');
            // Close the menu when starting bulk mode
            if (window.LeftMenu && window.LeftMenu.close) {
                window.LeftMenu.close();
            }
        } else {
            console.log('Bulk delete not available');
            const event = new CustomEvent('notification:show', {
                detail: { message: 'Bulk delete not available' }
            });
            document.dispatchEvent(event);
        }
    }
    
    function handleCompleteDay() {
        // Complete day workflow
        if (window.CompleteDayWorkflow && window.CompleteDayWorkflow.completeDay) {
            window.CompleteDayWorkflow.completeDay();
        } else {
            console.log('Complete day workflow not available');
            const event = new CustomEvent('notification:show', {
                detail: { message: 'Complete day workflow not available' }
            });
            document.dispatchEvent(event);
        }
    }
    
    function handleCopyToTomorrow() {
        // Copy to tomorrow
        if (window.BulkOperations && window.BulkOperations.start) {
            window.BulkOperations.start('copy');
            // Close the menu when starting bulk mode
            if (window.LeftMenu && window.LeftMenu.close) {
                window.LeftMenu.close();
            }
        } else {
            console.log('Copy to tomorrow not available');
            const event = new CustomEvent('notification:show', {
                detail: { message: 'Copy to tomorrow not available' }
            });
            document.dispatchEvent(event);
        }
    }
    
    /**
     * Public API
     */
    const LeftMenu = {
        init: init,
        open: open,
        close: close,
        isOpen: function() { return state.isOpen; }
    };
    
    // Export to global namespace
    window.LeftMenu = LeftMenu;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();