/**
 * Selection Manager - Handles multi-select state for bulk operations
 * Part of Story #120: Bulk Operations
 */
class SelectionManager {
    constructor() {
        this.selectedItems = new Set();
        this.selectionMode = false;
        this.lastSelectedIndex = -1;
        this.lastSelectedElement = null;
        this.listeners = new Map();
        
        // Bind methods for event handling
        this.handleActivityClick = this.handleActivityClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    
    /**
     * Toggle selection mode on/off
     */
    toggleSelectionMode() {
        this.selectionMode = !this.selectionMode;
        
        if (!this.selectionMode) {
            this.clearSelection();
        }
        
        // Dispatch event for UI updates
        document.dispatchEvent(new CustomEvent('selectionModeChanged', {
            detail: { enabled: this.selectionMode }
        }));
        
        // Update body class for styling
        document.body.classList.toggle('selection-mode', this.selectionMode);
        
        return this.selectionMode;
    }
    
    /**
     * Select/deselect a single item
     */
    selectItem(id, element = null, shiftKey = false) {
        if (!this.selectionMode) return false;
        
        // Handle shift+click for range selection
        if (shiftKey && this.lastSelectedElement && element) {
            this.selectRange(this.lastSelectedElement, element);
            return true;
        }
        
        if (this.selectedItems.has(id)) {
            this.selectedItems.delete(id);
        } else {
            this.selectedItems.add(id);
        }
        
        // Track last selected for range selection
        this.lastSelectedElement = element;
        
        // Dispatch event for UI updates
        document.dispatchEvent(new CustomEvent('selectionChanged', {
            detail: { 
                id: id,
                selected: this.selectedItems.has(id),
                count: this.selectedItems.size
            }
        }));
        
        return this.selectedItems.has(id);
    }
    
    /**
     * Select range of items between two elements
     */
    selectRange(startElement, endElement) {
        if (!this.selectionMode) return;
        
        const container = startElement.closest('.activity-list');
        if (!container) return;
        
        const cards = Array.from(container.querySelectorAll('.activity-card'));
        const startIndex = cards.indexOf(startElement.closest('.activity-card'));
        const endIndex = cards.indexOf(endElement.closest('.activity-card'));
        
        if (startIndex === -1 || endIndex === -1) return;
        
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);
        
        // Select all items in range
        for (let i = start; i <= end; i++) {
            const card = cards[i];
            const id = card.dataset.activityId;
            if (id && !this.selectedItems.has(id)) {
                this.selectedItems.add(id);
            }
        }
        
        // Dispatch bulk selection event
        document.dispatchEvent(new CustomEvent('selectionChanged', {
            detail: { 
                count: this.selectedItems.size,
                rangeSelected: true
            }
        }));
    }
    
    /**
     * Select all visible items
     */
    selectAll() {
        if (!this.selectionMode) return;
        
        const cards = document.querySelectorAll('.activity-card[data-activity-id]');
        cards.forEach(card => {
            const id = card.dataset.activityId;
            if (id) {
                this.selectedItems.add(id);
            }
        });
        
        document.dispatchEvent(new CustomEvent('selectionChanged', {
            detail: { 
                count: this.selectedItems.size,
                allSelected: true
            }
        }));
    }
    
    /**
     * Clear all selections
     */
    clearSelection() {
        const hadSelections = this.selectedItems.size > 0;
        this.selectedItems.clear();
        this.lastSelectedElement = null;
        this.lastSelectedIndex = -1;
        
        if (hadSelections) {
            document.dispatchEvent(new CustomEvent('selectionChanged', {
                detail: { 
                    count: 0,
                    cleared: true
                }
            }));
        }
    }
    
    /**
     * Get count of selected items
     */
    getSelectedCount() {
        return this.selectedItems.size;
    }
    
    /**
     * Check if item is selected
     */
    isSelected(id) {
        return this.selectedItems.has(id);
    }
    
    /**
     * Get all selected IDs
     */
    getSelectedIds() {
        return Array.from(this.selectedItems);
    }
    
    /**
     * Toggle select all/none
     */
    toggleSelectAll() {
        if (!this.selectionMode) return;
        
        const visibleCount = document.querySelectorAll('.activity-card[data-activity-id]').length;
        
        if (this.selectedItems.size === visibleCount) {
            this.clearSelection();
        } else {
            this.selectAll();
        }
    }
    
    /**
     * Select items by criteria
     */
    selectByCriteria(criteria) {
        if (!this.selectionMode) return;
        
        const cards = document.querySelectorAll('.activity-card[data-activity-id]');
        
        cards.forEach(card => {
            const id = card.dataset.activityId;
            if (!id) return;
            
            let shouldSelect = false;
            
            // Select by type
            if (criteria.type && card.dataset.activityType === criteria.type) {
                shouldSelect = true;
            }
            
            // Select by status
            if (criteria.completed !== undefined) {
                const isCompleted = card.classList.contains('completed');
                if (criteria.completed === isCompleted) {
                    shouldSelect = true;
                }
            }
            
            // Select by pinned
            if (criteria.pinned !== undefined) {
                const isPinned = card.classList.contains('pinned');
                if (criteria.pinned === isPinned) {
                    shouldSelect = true;
                }
            }
            
            // Select by time
            if (criteria.time) {
                const timeElement = card.querySelector('.activity-time');
                if (timeElement && timeElement.textContent.includes(criteria.time)) {
                    shouldSelect = true;
                }
            }
            
            if (shouldSelect) {
                this.selectedItems.add(id);
            }
        });
        
        document.dispatchEvent(new CustomEvent('selectionChanged', {
            detail: { 
                count: this.selectedItems.size,
                criteriaUsed: criteria
            }
        }));
    }
    
    /**
     * Invert current selection
     */
    invertSelection() {
        if (!this.selectionMode) return;
        
        const cards = document.querySelectorAll('.activity-card[data-activity-id]');
        const newSelection = new Set();
        
        cards.forEach(card => {
            const id = card.dataset.activityId;
            if (id && !this.selectedItems.has(id)) {
                newSelection.add(id);
            }
        });
        
        this.selectedItems = newSelection;
        
        document.dispatchEvent(new CustomEvent('selectionChanged', {
            detail: { 
                count: this.selectedItems.size,
                inverted: true
            }
        }));
    }
    
    /**
     * Handle activity card clicks for selection
     */
    handleActivityClick(e) {
        if (!this.selectionMode) return;
        
        const card = e.target.closest('.activity-card');
        if (!card) return;
        
        const id = card.dataset.activityId;
        if (!id) return;
        
        // Prevent default card actions in selection mode
        e.preventDefault();
        e.stopPropagation();
        
        this.selectItem(id, card, e.shiftKey);
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyDown(e) {
        if (!this.selectionMode) return;
        
        // Ctrl/Cmd + A: Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            this.selectAll();
        }
        
        // Escape: Clear selection or exit mode
        if (e.key === 'Escape') {
            if (this.selectedItems.size > 0) {
                this.clearSelection();
            } else {
                this.toggleSelectionMode();
            }
        }
    }
    
    /**
     * Initialize event listeners
     */
    init() {
        // Listen for clicks on activity cards
        document.addEventListener('click', this.handleActivityClick);
        
        // Listen for keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Long press support for mobile
        this.initLongPressSupport();
        
        // Swipe selection support
        this.initSwipeSelection();
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => this.destroy());
    }
    
    /**
     * Initialize long press support
     */
    initLongPressSupport() {
        let pressTimer = null;
        let pressTarget = null;
        
        const handleTouchStart = (e) => {
            const card = e.target.closest('.activity-card');
            if (!card) return;
            
            pressTarget = card;
            pressTimer = setTimeout(() => {
                // Enter selection mode on long press
                if (!this.selectionMode) {
                    this.toggleSelectionMode();
                    // Vibrate if available
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }
                
                // Select the item
                const id = card.dataset.activityId;
                if (id) {
                    this.selectItem(id, card);
                    // Vibrate for feedback
                    if (navigator.vibrate) {
                        navigator.vibrate(20);
                    }
                }
            }, 500); // 500ms for long press
        };
        
        const handleTouchEnd = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            pressTarget = null;
        };
        
        const handleTouchMove = (e) => {
            if (!pressTarget) return;
            
            // Check if moved too far from original target
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (!pressTarget.contains(element)) {
                handleTouchEnd();
            }
        };
        
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        document.addEventListener('touchcancel', handleTouchEnd, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        
        // Store handlers for cleanup
        this.longPressHandlers = {
            touchstart: handleTouchStart,
            touchend: handleTouchEnd,
            touchcancel: handleTouchEnd,
            touchmove: handleTouchMove
        };
    }
    
    /**
     * Initialize swipe selection
     */
    initSwipeSelection() {
        let isSelecting = false;
        let startCard = null;
        let lastCard = null;
        let selectedDuringSwipe = new Set();
        
        const handleSwipeStart = (e) => {
            if (!this.selectionMode) return;
            
            const card = e.target.closest('.activity-card');
            if (!card) return;
            
            // Check if starting from a selection checkbox
            if (e.target.closest('.selection-checkbox')) {
                isSelecting = true;
                startCard = card;
                lastCard = card;
                selectedDuringSwipe.clear();
                
                // Prevent default to avoid scrolling
                e.preventDefault();
            }
        };
        
        const handleSwipeMove = (e) => {
            if (!isSelecting || !this.selectionMode) return;
            
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const card = element?.closest('.activity-card');
            
            if (card && card !== lastCard) {
                // Select range between start and current
                this.selectRange(startCard, card);
                lastCard = card;
                
                // Haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            }
        };
        
        const handleSwipeEnd = () => {
            isSelecting = false;
            startCard = null;
            lastCard = null;
            selectedDuringSwipe.clear();
        };
        
        document.addEventListener('touchstart', handleSwipeStart, { passive: false });
        document.addEventListener('touchmove', handleSwipeMove, { passive: true });
        document.addEventListener('touchend', handleSwipeEnd, { passive: true });
        document.addEventListener('touchcancel', handleSwipeEnd, { passive: true });
        
        // Store handlers for cleanup
        this.swipeHandlers = {
            touchstart: handleSwipeStart,
            touchmove: handleSwipeMove,
            touchend: handleSwipeEnd,
            touchcancel: handleSwipeEnd
        };
    }
    
    /**
     * Clean up event listeners
     */
    destroy() {
        document.removeEventListener('click', this.handleActivityClick);
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Clean up long press handlers
        if (this.longPressHandlers) {
            document.removeEventListener('touchstart', this.longPressHandlers.touchstart);
            document.removeEventListener('touchend', this.longPressHandlers.touchend);
            document.removeEventListener('touchcancel', this.longPressHandlers.touchcancel);
            document.removeEventListener('touchmove', this.longPressHandlers.touchmove);
        }
        
        // Clean up swipe handlers
        if (this.swipeHandlers) {
            document.removeEventListener('touchstart', this.swipeHandlers.touchstart);
            document.removeEventListener('touchmove', this.swipeHandlers.touchmove);
            document.removeEventListener('touchend', this.swipeHandlers.touchend);
            document.removeEventListener('touchcancel', this.swipeHandlers.touchcancel);
        }
        
        this.clearSelection();
        this.listeners.clear();
    }
}

// Export for use in other modules
window.SelectionManager = SelectionManager;