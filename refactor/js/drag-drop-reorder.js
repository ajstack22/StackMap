/**
 * Drag & Drop Reordering Module for StackMap
 * Implements touch-friendly drag & drop with virtual scrolling support
 * 
 * @module DragDropReorder
 */

(function() {
    'use strict';
    
    const DragDropReorder = {
        // State
        isDragging: false,
        draggedElement: null,
        draggedTask: null,
        placeholder: null,
        touchStartY: 0,
        touchStartX: 0,
        touchTimer: null,
        currentTouchX: 0,
        currentTouchY: 0,
        scrollTimer: null,
        hasMoved: false,
        potentialDragCard: null,
        isMobile: false,
        
        // Configuration
        LONG_PRESS_DURATION: 400, // ms - increased for better mobile UX
        DRAG_THRESHOLD: 10, // px
        AUTO_SCROLL_ZONE: 50, // px from edge
        AUTO_SCROLL_SPEED: 12, // px per frame (increased for better UX)
        HAPTIC_DURATION: 50, // ms for haptic feedback
        
        /**
         * Initialize drag & drop
         */
        init: function() {
            // Don't initialize in safe mode
            if (window.StackMapSafeMode) {
                console.log('DragDropReorder: Disabled in safe mode');
                return;
            }
            
            this.container = document.getElementById('task-container');
            if (!this.container) {
                console.warn('DragDropReorder: task-container not found');
                return;
            }
            
            // Detect mobile
            this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           ('ontouchstart' in window) ||
                           (navigator.maxTouchPoints > 0);
            
            this.setupEventListeners();
            console.log('DragDropReorder: Initialized (Mobile:', this.isMobile, ')');
        },
        
        /**
         * Setup event listeners using delegation
         */
        setupEventListeners: function() {
            const self = this;
            
            // Store bound functions for removal later
            this.boundHandlers = {
                touchStart: function(e) { self.handleTouchStart(e); },
                touchMove: function(e) { self.handleTouchMove(e); },
                touchEnd: function(e) { self.handleTouchEnd(e); },
                mouseDown: function(e) { self.handleMouseDown(e); },
                mouseMove: function(e) { self.handleMouseMove(e); },
                mouseUp: function(e) { self.handleMouseUp(e); },
                keyDown: function(e) {
                    if (e.key === 'Escape' && self.isDragging) {
                        self.cancelDrag();
                    }
                }
            };
            
            // Touch events
            this.container.addEventListener('touchstart', this.boundHandlers.touchStart, {passive: false});
            document.addEventListener('touchmove', this.boundHandlers.touchMove, {passive: false});
            document.addEventListener('touchend', this.boundHandlers.touchEnd);
            
            // Mouse events for desktop
            this.container.addEventListener('mousedown', this.boundHandlers.mouseDown);
            document.addEventListener('mousemove', this.boundHandlers.mouseMove);
            document.addEventListener('mouseup', this.boundHandlers.mouseUp);
            
            // Cancel on escape
            document.addEventListener('keydown', this.boundHandlers.keyDown);
        },
        
        /**
         * Handle touch start
         */
        handleTouchStart: function(e) {
            // Only work in edit mode
            if (!window.EditMode || !window.EditMode.isActive()) return;
            
            // Don't start drag on interactive elements
            const target = e.target;
            const tagName = target.tagName.toLowerCase();
            if (tagName === 'button' || tagName === 'input' || tagName === 'a' || tagName === 'select') {
                return;
            }
            
            const card = e.target.closest('.task-card');
            if (!card || card.classList.contains('add-task-card')) return;
            
            // Multiple touches - cancel any drag
            if (e.touches.length > 1) {
                this.cancelDragStart();
                return;
            }
            
            // Store initial touch position
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.currentTouchX = this.touchStartX;
            this.currentTouchY = this.touchStartY;
            this.hasMoved = false;
            this.potentialDragCard = card;
            
            // Add preparing class for visual feedback
            card.classList.add('task-card--preparing-drag');
            
            const self = this;
            
            // Long press timer
            this.touchTimer = setTimeout(function() {
                if (!self.hasMoved && self.potentialDragCard) {
                    // Haptic feedback
                    if (navigator.vibrate) {
                        navigator.vibrate(self.HAPTIC_DURATION);
                    }
                    
                    // Update visual state
                    self.potentialDragCard.classList.remove('task-card--preparing-drag');
                    self.potentialDragCard.classList.add('task-card--ready-to-drag');
                    
                    // Start drag
                    self.startDrag(self.potentialDragCard, {
                        clientX: self.currentTouchX,
                        clientY: self.currentTouchY
                    });
                }
            }, this.LONG_PRESS_DURATION);
        },
        
        /**
         * Handle touch move
         */
        handleTouchMove: function(e) {
            // If not preparing to drag and not dragging, allow normal scroll
            if (!this.touchTimer && !this.isDragging) return;
            
            // Multiple touches - cancel
            if (e.touches.length > 1) {
                this.cancelDragStart();
                return;
            }
            
            const touch = e.touches[0];
            this.currentTouchX = touch.clientX;
            this.currentTouchY = touch.clientY;
            
            const deltaX = Math.abs(touch.clientX - this.touchStartX);
            const deltaY = Math.abs(touch.clientY - this.touchStartY);
            
            // Check if user has moved beyond threshold
            if (!this.hasMoved && (deltaX > this.DRAG_THRESHOLD || deltaY > this.DRAG_THRESHOLD)) {
                this.hasMoved = true;
                
                // If we have a timer running, cancel it - user is scrolling
                if (this.touchTimer) {
                    this.cancelDragStart();
                    // Allow native scroll by not preventing default
                    return;
                }
            }
            
            // Only prevent default if actually dragging
            if (this.isDragging) {
                e.preventDefault();
                this.updateDragPosition(touch.clientX, touch.clientY);
                this.checkAutoScroll(touch.clientY);
                this.updateDropTarget(touch.clientX, touch.clientY);
            }
        },
        
        /**
         * Handle touch end
         */
        handleTouchEnd: function(e) {
            this.cancelDragStart();
            
            if (this.isDragging) {
                this.completeDrag();
            }
        },
        
        /**
         * Handle mouse down (desktop)
         */
        handleMouseDown: function(e) {
            // Only work in edit mode
            if (!window.EditMode || !window.EditMode.isActive()) return;
            
            // Only left click
            if (e.button !== 0) return;
            
            // Skip on mobile devices - they use touch events
            if (this.isMobile) return;
            
            const card = e.target.closest('.task-card');
            if (!card || card.classList.contains('add-task-card')) return;
            
            // Don't start drag on buttons
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
            
            e.preventDefault();
            this.startDrag(card, e);
        },
        
        /**
         * Handle mouse move
         */
        handleMouseMove: function(e) {
            if (!this.isDragging) return;
            
            e.preventDefault();
            this.updateDragPosition(e.clientX, e.clientY);
            this.checkAutoScroll(e.clientY);
            this.updateDropTarget(e.clientX, e.clientY);
        },
        
        /**
         * Handle mouse up
         */
        handleMouseUp: function(e) {
            if (!this.isDragging) return;
            
            e.preventDefault();
            this.completeDrag();
        },
        
        /**
         * Start dragging
         */
        startDrag: function(card, position) {
            this.isDragging = true;
            this.draggedElement = card;
            
            // Get task data
            const taskId = card.getAttribute('data-task-id');
            this.draggedTask = this.getTaskById(taskId);
            
            if (!this.draggedTask) {
                this.cancelDrag();
                return;
            }
            
            // Clean up any visual states
            card.classList.remove('task-card--preparing-drag', 'task-card--ready-to-drag');
            
            // Add dragging class
            card.classList.add('task-card--dragging');
            
            // Create placeholder
            this.createPlaceholder();
            
            // Insert placeholder before dragged element
            card.parentNode.insertBefore(this.placeholder, card);
            
            // Position card at cursor
            this.updateDragPosition(position.clientX, position.clientY);
            
            // Announce to screen readers
            if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                window.StackMapKeyboardNav.announce(`Started dragging ${this.draggedTask.title}`);
            }
            
            // Change cursor for desktop
            if (!this.isMobile) {
                document.body.style.cursor = 'grabbing';
            }
        },
        
        /**
         * Create placeholder element
         */
        createPlaceholder: function() {
            this.placeholder = document.createElement('div');
            this.placeholder.className = 'drag-placeholder';
            this.placeholder.style.height = `${this.draggedElement.offsetHeight}px`;
        },
        
        /**
         * Update drag position
         */
        updateDragPosition: function(x, y) {
            if (!this.draggedElement) return;
            
            // Make element follow cursor
            this.draggedElement.style.position = 'fixed';
            this.draggedElement.style.left = `${x - this.draggedElement.offsetWidth / 2}px`;
            this.draggedElement.style.top = `${y - 20}px`; // Offset so finger doesn't cover it
            this.draggedElement.style.zIndex = '9999';
            this.draggedElement.style.pointerEvents = 'none'; // Prevent interference
        },
        
        /**
         * Update drop target
         */
        updateDropTarget: function(x, y) {
            const self = this;
            
            // Get all task cards
            const cards = [...this.container.querySelectorAll('.task-card:not(.task-card--dragging):not(.add-task-card)')];
            
            // Remove old drop indicators
            cards.forEach(function(card) {
                card.classList.remove('task-card--drop-above', 'task-card--drop-below');
            });
            
            // Find closest card
            let closestCard = null;
            let closestDistance = Infinity;
            let insertBefore = true;
            
            cards.forEach(function(card) {
                const rect = card.getBoundingClientRect();
                const cardMidY = rect.top + rect.height / 2;
                const distance = Math.abs(y - cardMidY);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestCard = card;
                    insertBefore = y < cardMidY;
                }
            });
            
            // Update placeholder position
            if (closestCard && this.placeholder) {
                if (insertBefore) {
                    closestCard.classList.add('task-card--drop-above');
                    closestCard.parentNode.insertBefore(this.placeholder, closestCard);
                } else {
                    closestCard.classList.add('task-card--drop-below');
                    const nextSibling = closestCard.nextSibling;
                    if (nextSibling) {
                        closestCard.parentNode.insertBefore(this.placeholder, nextSibling);
                    } else {
                        closestCard.parentNode.appendChild(this.placeholder);
                    }
                }
            }
        },
        
        /**
         * Check and perform auto-scroll
         */
        checkAutoScroll: function(y) {
            const self = this;
            const scrollContainer = this.getScrollContainer();
            if (!scrollContainer) return;
            
            const rect = scrollContainer.getBoundingClientRect();
            let shouldScroll = false;
            let scrollDirection = 0;
            
            // Near top
            if (y < rect.top + this.AUTO_SCROLL_ZONE) {
                shouldScroll = true;
                scrollDirection = -1;
            }
            // Near bottom
            else if (y > rect.bottom - this.AUTO_SCROLL_ZONE) {
                shouldScroll = true;
                scrollDirection = 1;
            }
            
            if (shouldScroll) {
                if (!this.scrollTimer) {
                    this.scrollTimer = setInterval(function() {
                        scrollContainer.scrollTop += self.AUTO_SCROLL_SPEED * scrollDirection;
                        
                        // Update drop target while scrolling
                        self.updateDropTarget(self.currentTouchX || 0, self.currentTouchY || y);
                    }, 16); // ~60fps
                }
            } else {
                this.stopAutoScroll();
            }
        },
        
        /**
         * Stop auto-scrolling
         */
        stopAutoScroll: function() {
            if (this.scrollTimer) {
                clearInterval(this.scrollTimer);
                this.scrollTimer = null;
            }
        },
        
        /**
         * Complete the drag operation
         */
        completeDrag: function() {
            if (!this.isDragging || !this.draggedElement || !this.placeholder) {
                this.cancelDrag();
                return;
            }
            
            // Reset element styles
            this.draggedElement.style.position = '';
            this.draggedElement.style.left = '';
            this.draggedElement.style.top = '';
            this.draggedElement.style.zIndex = '';
            this.draggedElement.style.pointerEvents = '';
            
            // Replace placeholder with dragged element
            this.placeholder.parentNode.replaceChild(this.draggedElement, this.placeholder);
            
            // Remove dragging class
            this.draggedElement.classList.remove('task-card--dragging');
            
            // Update task order
            this.saveNewOrder();
            
            // Announce completion
            if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                window.StackMapKeyboardNav.announce(`Moved ${this.draggedTask.title}`);
            }
            
            // Cleanup
            this.cleanup();
        },
        
        /**
         * Cancel drag operation
         */
        cancelDrag: function() {
            if (this.draggedElement) {
                // Reset element styles
                this.draggedElement.style.position = '';
                this.draggedElement.style.left = '';
                this.draggedElement.style.top = '';
                this.draggedElement.style.zIndex = '';
                this.draggedElement.style.pointerEvents = '';
                
                this.draggedElement.classList.remove('task-card--dragging', 'task-card--preparing-drag', 'task-card--ready-to-drag');
            }
            
            if (this.placeholder && this.placeholder.parentNode) {
                this.placeholder.parentNode.removeChild(this.placeholder);
            }
            
            this.cleanup();
        },
        
        /**
         * Cancel drag start (before drag begins)
         */
        cancelDragStart: function() {
            if (this.touchTimer) {
                clearTimeout(this.touchTimer);
                this.touchTimer = null;
            }
            
            // Clean up visual states
            if (this.potentialDragCard) {
                this.potentialDragCard.classList.remove('task-card--preparing-drag', 'task-card--ready-to-drag');
                this.potentialDragCard = null;
            }
            
            this.hasMoved = false;
        },
        
        /**
         * Cleanup after drag
         */
        cleanup: function() {
            this.isDragging = false;
            this.draggedElement = null;
            this.draggedTask = null;
            this.placeholder = null;
            this.touchTimer = null;
            this.hasMoved = false;
            this.potentialDragCard = null;
            
            this.stopAutoScroll();
            
            // Reset cursor for desktop
            if (!this.isMobile) {
                document.body.style.cursor = '';
            }
            
            // Remove all drag-related classes
            const cards = this.container.querySelectorAll('.task-card--drop-above, .task-card--drop-below, .task-card--preparing-drag, .task-card--ready-to-drag');
            [...cards].forEach(function(card) {
                card.classList.remove('task-card--drop-above', 'task-card--drop-below', 'task-card--preparing-drag', 'task-card--ready-to-drag');
            });
        },
        
        /**
         * Save the new task order
         */
        saveNewOrder: function() {
            const self = this;
            const cards = this.container.querySelectorAll('.task-card:not(.add-task-card)');
            const tasks = [];
            
            // Build new order
            [...cards].forEach(function(card, index) {
                const taskId = card.getAttribute('data-task-id');
                const task = self.getTaskById(taskId);
                if (task) {
                    // Higher order values appear first, multiply by 10 to avoid duplicates
                    task.order = (cards.length - index) * 10;
                    tasks.push(task);
                }
            });
            
            // Save via TaskDisplay
            if (window.TaskDisplay && window.TaskDisplay.saveTasks) {
                console.log('DragDropReorder: Saving new order');
                window.TaskDisplay.saveTasks();
            }
        },
        
        /**
         * Get task by ID
         */
        getTaskById: function(taskId) {
            if (!window.TaskDisplay || !window.TaskDisplay.tasks) return null;
            
            const tasks = window.TaskDisplay.tasks;
            for (let i = 0; i < tasks.length; i++) {
                if (tasks[i].id === taskId) {
                    return tasks[i];
                }
            }
            return null;
        },
        
        /**
         * Get scroll container
         */
        getScrollContainer: function() {
            // Check for virtual scroll container first
            const virtualContainer = this.container.querySelector('.task-scroll-area');
            if (virtualContainer) return virtualContainer;
            
            // Check for clusterize scroll area
            const clusterizeScroll = this.container.querySelector('.clusterize-scroll');
            if (clusterizeScroll) return clusterizeScroll;
            
            // Fallback to main container
            return this.container;
        },
        
        /**
         * Destroy and cleanup
         */
        destroy: function() {
            this.cancelDrag();
            
            // Remove all event listeners
            if (this.boundHandlers) {
                if (this.container) {
                    this.container.removeEventListener('touchstart', this.boundHandlers.touchStart);
                    this.container.removeEventListener('mousedown', this.boundHandlers.mouseDown);
                }
                
                document.removeEventListener('touchmove', this.boundHandlers.touchMove);
                document.removeEventListener('touchend', this.boundHandlers.touchEnd);
                document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
                document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
                document.removeEventListener('keydown', this.boundHandlers.keyDown);
                
                this.boundHandlers = null;
            }
            
            this.container = null;
        }
    };
    
    // Export to global namespace
    window.DragDropReorder = DragDropReorder;
    
})();