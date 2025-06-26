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
        disabled: true, // Start disabled, enabled by CardEditControls when edit mode activates
        
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
            
            this.container = document.getElementById('activity-container') || document.getElementById('task-container');
            if (!this.container) {
                console.warn('DragDropReorder: activity-container not found');
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
            // Only work in edit mode and when enabled
            if (!window.EditMode || !window.EditMode.isActive() || this.disabled) return;
            
            // Don't start drag on interactive elements
            const target = e.target;
            const tagName = target.tagName.toLowerCase();
            if (tagName === 'button' || tagName === 'input' || tagName === 'a' || tagName === 'select') {
                return;
            }
            
            const card = e.target.closest('.task-card, .activity-card');
            if (!card || card.classList.contains('add-task-card') || card.classList.contains('add-activity-card')) return;
            
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
            // Only work in edit mode and when enabled
            if (!window.EditMode || !window.EditMode.isActive() || this.disabled) return;
            
            // Only left click
            if (e.button !== 0) return;
            
            // Skip on mobile devices - they use touch events
            if (this.isMobile) return;
            
            const card = e.target.closest('.task-card, .activity-card');
            if (!card || card.classList.contains('add-task-card') || card.classList.contains('add-activity-card')) return;
            
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
            
            // Get task or activity data
            const taskId = card.getAttribute('data-task-id') || card.getAttribute('data-activity-id');
            this.draggedTask = this.getTaskById(taskId) || this.getActivityById(taskId);
            
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
            
            // Store current position for cross-timeframe detection
            this.currentTouchX = x;
            this.currentTouchY = y;
            
            // Clear previous drop target highlights (day buttons and sections)
            const prevDropTargets = document.querySelectorAll('.drop-target');
            prevDropTargets.forEach(function(target) {
                target.classList.remove('drop-target');
            });
            
            // Check if we're over a day selector button (cross-timeframe drop)
            const dayButtons = document.querySelectorAll('.day-selector-btn');
            let overTimeframeButton = false;
            
            for (let i = 0; i < dayButtons.length; i++) {
                const button = dayButtons[i];
                const rect = button.getBoundingClientRect();
                
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    const targetTimeframe = button.getAttribute('data-day');
                    const currentTimeframe = window.DayManager ? window.DayManager.getCurrentDay() : 'today';
                    
                    // Only highlight if it's a different timeframe
                    if (targetTimeframe !== currentTimeframe) {
                        button.classList.add('drop-target');
                        overTimeframeButton = true;
                    }
                    break;
                }
            }
            
            // If over a timeframe button, don't show in-list drop indicators
            if (overTimeframeButton) {
                // Remove in-list drop indicators
                const cards = this.container.querySelectorAll('.task-card, .activity-card');
                cards.forEach(function(card) {
                    card.classList.remove('task-card--drop-above', 'task-card--drop-below');
                });
                return;
            }
            
            // Normal in-list drop handling
            const cards = [...this.container.querySelectorAll('.task-card:not(.task-card--dragging):not(.add-task-card), .activity-card:not(.task-card--dragging):not(.add-activity-card)')];
            
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
            
            // Check if we're dropping over a different timeframe
            const dropTimeframe = this.getDropTimeframe();
            const currentTimeframe = window.DayManager ? window.DayManager.getCurrentDay() : 'today';
            
            if (dropTimeframe && dropTimeframe !== currentTimeframe) {
                // Cross-timeframe move
                this.handleCrossTimeframeDrop(dropTimeframe);
            } else {
                // Same timeframe reorder
                this.handleSameTimeframeReorder();
            }
            
            // Cleanup
            this.cleanup();
        },
        
        /**
         * Handle same timeframe reordering
         */
        handleSameTimeframeReorder: function() {
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
                window.StackMapKeyboardNav.announce(`Reordered ${this.draggedTask.title}`);
            }
        },
        
        /**
         * Handle cross-timeframe drop
         */
        handleCrossTimeframeDrop: function(targetTimeframe) {
            // Reset element styles first
            this.draggedElement.style.position = '';
            this.draggedElement.style.left = '';
            this.draggedElement.style.top = '';
            this.draggedElement.style.zIndex = '';
            this.draggedElement.style.pointerEvents = '';
            this.draggedElement.classList.remove('task-card--dragging');
            
            // Move activity to target timeframe
            if (window.DayManager && this.draggedTask) {
                // Update the activity data
                window.DayManager.setActivityDay(this.draggedTask, targetTimeframe);
                
                // Save the activity
                if (window.ActivityDisplay && window.ActivityDisplay.saveActivity) {
                    window.ActivityDisplay.saveActivity(this.draggedTask);
                } else if (window.TaskDisplay && window.TaskDisplay.saveTask) {
                    window.TaskDisplay.saveTask(this.draggedTask);
                }
                
                // Remove the card from current view
                if (this.draggedElement.parentNode) {
                    this.draggedElement.parentNode.removeChild(this.draggedElement);
                }
                
                // Refresh the display
                if (window.ActivityDisplay && window.ActivityDisplay.render) {
                    window.ActivityDisplay.render();
                } else if (window.TaskDisplay && window.TaskDisplay.render) {
                    window.TaskDisplay.render();
                }
                
                // Update day selector counts
                if (window.DaySelectorUI && window.DaySelectorUI.updateActivityCounts) {
                    window.DaySelectorUI.updateActivityCounts();
                }
                
                // Announce completion
                const timeframeNames = {
                    'today': 'Today',
                    'tomorrow': 'Tomorrow', 
                    'someday': 'Someday'
                };
                const targetName = timeframeNames[targetTimeframe] || targetTimeframe;
                
                if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                    window.StackMapKeyboardNav.announce(`Moved ${this.draggedTask.title} to ${targetName}`);
                }
                
                // Show success notification
                this.showMoveNotification(this.draggedTask.title, targetName);
            }
            
            // Remove placeholder
            if (this.placeholder && this.placeholder.parentNode) {
                this.placeholder.parentNode.removeChild(this.placeholder);
            }
        },
        
        /**
         * Get the timeframe being dropped over
         */
        getDropTimeframe: function() {
            // Check if we're over a day selector button
            const dayButtons = document.querySelectorAll('.day-selector-btn');
            for (let i = 0; i < dayButtons.length; i++) {
                const button = dayButtons[i];
                const rect = button.getBoundingClientRect();
                
                if (this.currentTouchX >= rect.left && this.currentTouchX <= rect.right &&
                    this.currentTouchY >= rect.top && this.currentTouchY <= rect.bottom) {
                    return button.getAttribute('data-day');
                }
            }
            
            // Check if we're over a timeframe section
            const timeframeSections = document.querySelectorAll('[data-timeframe]');
            for (let i = 0; i < timeframeSections.length; i++) {
                const section = timeframeSections[i];
                const rect = section.getBoundingClientRect();
                
                if (this.currentTouchX >= rect.left && this.currentTouchX <= rect.right &&
                    this.currentTouchY >= rect.top && this.currentTouchY <= rect.bottom) {
                    return section.getAttribute('data-timeframe');
                }
            }
            
            return null;
        },
        
        /**
         * Show move notification
         */
        showMoveNotification: function(activityTitle, targetTimeframe) {
            const notification = document.createElement('div');
            notification.className = 'move-notification';
            notification.innerHTML = `
                <span class="move-icon">✓</span>
                <span class="move-message">Moved "${activityTitle}" to ${targetTimeframe}</span>
            `;
            
            document.body.appendChild(notification);
            
            // Show with animation
            setTimeout(function() {
                notification.classList.add('visible');
            }, 10);
            
            // Auto-dismiss after 3 seconds
            setTimeout(function() {
                notification.classList.remove('visible');
                setTimeout(function() {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
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
                // Re-render to update numbers
                window.TaskDisplay.render();
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
         * Get activity by ID
         */
        getActivityById: function(activityId) {
            if (window.ActivityDisplay && window.ActivityDisplay.getActivityById) {
                return window.ActivityDisplay.getActivityById(activityId);
            } else if (window.ActivityDisplay && window.ActivityDisplay.activities) {
                const activities = window.ActivityDisplay.activities;
                for (let i = 0; i < activities.length; i++) {
                    if (activities[i].id === activityId) {
                        return activities[i];
                    }
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
         * Enable drag and drop functionality
         */
        enable: function() {
            this.disabled = false;
            console.log('DragDropReorder: Enabled');
        },
        
        /**
         * Disable drag and drop functionality
         */
        disable: function() {
            this.disabled = true;
            this.cancelDrag();
            console.log('DragDropReorder: Disabled');
        },
        
        /**
         * Check if drag and drop is enabled
         */
        isEnabled: function() {
            return !this.disabled;
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