/**
 * Card Edit Controls Integration
 * Connects direct card manipulation features to edit mode state
 * Shows/hides edit controls based on EditMode.isActive()
 * Story #96 - Round 5 Dev2 Integration Layer
 */

(function() {
    'use strict';
    
    const CardEditControls = {
        isInitialized: false,
        editModeActive: false,
        
        /**
         * Initialize the card edit controls integration
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Listen for edit mode changes
            self.setupEditModeListener();
            
            // Setup card event integration
            self.setupCardEventIntegration();
            
            // Check initial edit mode state
            self.checkInitialEditModeState();
            
            self.isInitialized = true;
            console.log('CardEditControls: Integration layer initialized');
        },
        
        /**
         * Setup edit mode state listener
         */
        setupEditModeListener: function() {
            const self = this;
            
            // Listen for edit mode changes
            if (window.EditMode) {
                window.EditMode.on('change', function(isActive) {
                    self.onEditModeChange(isActive);
                });
            }
            
            // Also listen for custom events (fallback)
            document.addEventListener('editModeChanged', function(e) {
                const isActive = e.detail && e.detail.isActive;
                self.onEditModeChange(isActive);
            });
        },
        
        /**
         * Check initial edit mode state
         */
        checkInitialEditModeState: function() {
            const self = this;
            
            // Check if edit mode is already active
            if (window.EditMode && window.EditMode.isActive) {
                const isActive = window.EditMode.isActive();
                self.onEditModeChange(isActive);
            }
        },
        
        /**
         * Handle edit mode state changes
         */
        onEditModeChange: function(isActive) {
            const self = this;
            
            console.log('CardEditControls: Edit mode changed to', isActive);
            self.editModeActive = isActive;
            
            // Update card edit controls visibility
            self.updateCardEditControlsVisibility(isActive);
            
            // Update drag handles visibility
            self.updateDragHandlesVisibility(isActive);
            
            // Update context menu availability
            self.updateContextMenuAvailability(isActive);
            
            // Update inline edit availability
            self.updateInlineEditAvailability(isActive);
            
            // Notify ActivityCards about edit mode change
            if (window.ActivityCards && window.ActivityCards.onEditModeChange) {
                window.ActivityCards.onEditModeChange(isActive);
            }
        },
        
        /**
         * Update card edit controls visibility
         */
        updateCardEditControlsVisibility: function(isActive) {
            const editControls = document.querySelectorAll('.card-edit-controls');
            
            editControls.forEach(function(controls) {
                if (isActive) {
                    controls.style.display = 'flex';
                    controls.setAttribute('aria-hidden', 'false');
                } else {
                    controls.style.display = 'none';
                    controls.setAttribute('aria-hidden', 'true');
                }
            });
            
            console.log('CardEditControls: Updated', editControls.length, 'card edit controls');
        },
        
        /**
         * Update drag handles visibility
         */
        updateDragHandlesVisibility: function(isActive) {
            const dragHandles = document.querySelectorAll('.card-drag-handle, .drag-handle');
            
            dragHandles.forEach(function(handle) {
                if (isActive) {
                    handle.style.display = 'block';
                    handle.setAttribute('aria-hidden', 'false');
                    handle.setAttribute('tabindex', '0');
                } else {
                    handle.style.display = 'none';
                    handle.setAttribute('aria-hidden', 'true');
                    handle.setAttribute('tabindex', '-1');
                }
            });
            
            // Enable/disable drag and drop functionality
            if (window.DragDropReorder) {
                if (isActive) {
                    window.DragDropReorder.enable();
                } else {
                    window.DragDropReorder.disable();
                }
            }
            
            console.log('CardEditControls: Updated', dragHandles.length, 'drag handles');
        },
        
        /**
         * Update context menu availability
         */
        updateContextMenuAvailability: function(isActive) {
            const self = this;
            
            if (window.ContextMenu) {
                if (isActive) {
                    // Enable context menus on activity cards
                    self.enableContextMenus();
                } else {
                    // Disable context menus
                    self.disableContextMenus();
                }
            }
        },
        
        /**
         * Enable context menus on activity cards
         */
        enableContextMenus: function() {
            const activityCards = document.querySelectorAll('.activity-card, .task-card');
            
            activityCards.forEach(function(card) {
                // Remove any existing listeners to prevent duplicates
                card.removeEventListener('contextmenu', card._contextMenuHandler);
                card.removeEventListener('touchstart', card._longPressHandler);
                
                // Add context menu listener
                card._contextMenuHandler = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (window.ContextMenu && window.ContextMenu.show) {
                        const activityId = card.getAttribute('data-activity-id');
                        if (activityId) {
                            window.ContextMenu.show(e, activityId);
                        }
                    }
                };
                
                card.addEventListener('contextmenu', card._contextMenuHandler);
                
                // Add long press for mobile
                let longPressTimer = null;
                card._longPressHandler = function(e) {
                    longPressTimer = setTimeout(function() {
                        // Create synthetic contextmenu event
                        const contextEvent = new MouseEvent('contextmenu', {
                            bubbles: true,
                            cancelable: true,
                            clientX: e.touches[0].clientX,
                            clientY: e.touches[0].clientY
                        });
                        card.dispatchEvent(contextEvent);
                    }, 500);
                };
                
                card._touchEndHandler = function() {
                    if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                    }
                };
                
                card.addEventListener('touchstart', card._longPressHandler);
                card.addEventListener('touchend', card._touchEndHandler);
                card.addEventListener('touchmove', card._touchEndHandler);
            });
            
            console.log('CardEditControls: Enabled context menus on', activityCards.length, 'cards');
        },
        
        /**
         * Disable context menus
         */
        disableContextMenus: function() {
            const activityCards = document.querySelectorAll('.activity-card, .task-card');
            
            activityCards.forEach(function(card) {
                // Remove context menu listeners
                if (card._contextMenuHandler) {
                    card.removeEventListener('contextmenu', card._contextMenuHandler);
                    delete card._contextMenuHandler;
                }
                
                if (card._longPressHandler) {
                    card.removeEventListener('touchstart', card._longPressHandler);
                    delete card._longPressHandler;
                }
                
                if (card._touchEndHandler) {
                    card.removeEventListener('touchend', card._touchEndHandler);
                    card.removeEventListener('touchmove', card._touchEndHandler);
                    delete card._touchEndHandler;
                }
            });
            
            // Close any open context menu
            if (window.ContextMenu && window.ContextMenu.hide) {
                window.ContextMenu.hide();
            }
            
            console.log('CardEditControls: Disabled context menus');
        },
        
        /**
         * Update inline edit availability
         */
        updateInlineEditAvailability: function(isActive) {
            if (window.InlineCardEdit) {
                if (isActive) {
                    // Enable inline editing on card clicks
                    this.enableInlineEditing();
                } else {
                    // Disable inline editing
                    this.disableInlineEditing();
                }
            }
        },
        
        /**
         * Enable inline editing on cards
         */
        enableInlineEditing: function() {
            const activityCards = document.querySelectorAll('.activity-card, .task-card');
            
            activityCards.forEach(function(card) {
                // Add edit-mode class for styling
                card.classList.add('edit-mode-active');
                
                // Remove existing click handler to prevent conflicts
                if (card._inlineEditHandler) {
                    card.removeEventListener('click', card._inlineEditHandler);
                }
                
                // Add inline edit click handler
                card._inlineEditHandler = function(e) {
                    // Don't trigger on button clicks or other interactive elements
                    if (e.target.tagName === 'BUTTON' || 
                        e.target.tagName === 'INPUT' || 
                        e.target.closest('button') ||
                        e.target.closest('.card-edit-controls')) {
                        return;
                    }
                    
                    const activityId = card.getAttribute('data-activity-id');
                    if (activityId && window.InlineCardEdit && window.InlineCardEdit.startEdit) {
                        // Get activity data
                        let activity = null;
                        if (window.ActivityDisplay && window.ActivityDisplay.getActivityById) {
                            activity = window.ActivityDisplay.getActivityById(activityId);
                        } else if (window.TaskDisplay && window.TaskDisplay.getTaskById) {
                            activity = window.TaskDisplay.getTaskById(activityId);
                        }
                        
                        if (activity) {
                            window.InlineCardEdit.startEdit(activity);
                        }
                    }
                };
                
                card.addEventListener('click', card._inlineEditHandler);
            });
            
            console.log('CardEditControls: Enabled inline editing on', activityCards.length, 'cards');
        },
        
        /**
         * Disable inline editing
         */
        disableInlineEditing: function() {
            const activityCards = document.querySelectorAll('.activity-card, .task-card');
            
            activityCards.forEach(function(card) {
                // Remove edit-mode class
                card.classList.remove('edit-mode-active');
                
                // Remove inline edit handler
                if (card._inlineEditHandler) {
                    card.removeEventListener('click', card._inlineEditHandler);
                    delete card._inlineEditHandler;
                }
            });
            
            // Cancel any active inline editing
            if (window.InlineCardEdit && window.InlineCardEdit.cancelEdit) {
                window.InlineCardEdit.cancelEdit();
            }
            
            console.log('CardEditControls: Disabled inline editing');
        },
        
        /**
         * Setup card event integration
         */
        setupCardEventIntegration: function() {
            const self = this;
            
            // Listen for new cards being created
            document.addEventListener('card-created', function() {
                // Apply current edit mode state to new cards
                if (self.editModeActive) {
                    setTimeout(function() {
                        self.onEditModeChange(true);
                    }, 100);
                }
            });
            
            // Listen for activity display updates
            document.addEventListener('activitiesChanged', function() {
                // Reapply edit mode state after activities change
                if (self.editModeActive) {
                    setTimeout(function() {
                        self.onEditModeChange(true);
                    }, 100);
                }
            });
            
            // Setup keyboard reordering (Ctrl+Up/Down)
            self.setupKeyboardReordering();
        },
        
        /**
         * Setup keyboard reordering alternative
         */
        setupKeyboardReordering: function() {
            const self = this;
            
            document.addEventListener('keydown', function(e) {
                // Only in edit mode
                if (!self.editModeActive) return;
                
                // Ctrl+Up or Ctrl+Down on focused card
                if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                    const focusedCard = document.activeElement.closest('.activity-card, .task-card');
                    if (focusedCard && !focusedCard.classList.contains('add-activity-card')) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const direction = e.key === 'ArrowUp' ? -1 : 1;
                        self.keyboardReorderCard(focusedCard, direction);
                    }
                }
                
                // Tab navigation for cards in edit mode
                if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
                    const cards = document.querySelectorAll('.activity-card, .task-card');
                    const focusedCard = document.activeElement.closest('.activity-card, .task-card');
                    
                    if (focusedCard && cards.length > 1) {
                        const currentIndex = Array.from(cards).indexOf(focusedCard);
                        if (currentIndex !== -1) {
                            const nextIndex = e.shiftKey ? 
                                (currentIndex - 1 + cards.length) % cards.length :
                                (currentIndex + 1) % cards.length;
                            
                            const nextCard = cards[nextIndex];
                            if (nextCard) {
                                e.preventDefault();
                                nextCard.focus();
                                nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }
                    }
                }
            });
        },
        
        /**
         * Keyboard reorder a card
         */
        keyboardReorderCard: function(card, direction) {
            const self = this;
            
            // Get activity ID
            const activityId = card.getAttribute('data-activity-id') || card.getAttribute('data-task-id');
            if (!activityId) return;
            
            // Get all cards
            const allCards = Array.from(document.querySelectorAll('.activity-card, .task-card'))
                .filter(c => !c.classList.contains('add-activity-card') && !c.classList.contains('add-task-card'));
            
            const currentIndex = allCards.indexOf(card);
            const newIndex = currentIndex + direction;
            
            // Check bounds
            if (newIndex < 0 || newIndex >= allCards.length) {
                // Announce boundary
                if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                    const boundary = direction < 0 ? 'top' : 'bottom';
                    window.StackMapKeyboardNav.announce(`Already at ${boundary} of list`);
                }
                return;
            }
            
            // Get activity data
            let activity = null;
            if (window.ActivityDisplay && window.ActivityDisplay.getActivityById) {
                activity = window.ActivityDisplay.getActivityById(activityId);
            } else if (window.TaskDisplay && window.TaskDisplay.getTaskById) {
                activity = window.TaskDisplay.getTaskById(activityId);
            }
            
            if (!activity) return;
            
            // Perform reorder through drag-drop system if available
            if (window.DragDropReorder && window.DragDropReorder.performReorder) {
                window.DragDropReorder.performReorder(currentIndex, newIndex);
            } else {
                // Fallback: manual reorder
                self.manualReorder(activity, currentIndex, newIndex);
            }
            
            // Visual feedback
            card.style.transform = 'scale(1.05)';
            card.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            
            setTimeout(function() {
                card.style.transform = '';
                card.style.boxShadow = '';
                
                // Refocus the card after reorder
                setTimeout(function() {
                    const newCard = document.querySelector(`[data-activity-id="${activityId}"], [data-task-id="${activityId}"]`);
                    if (newCard) {
                        newCard.focus();
                        newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }, 200);
            
            // Announce action
            if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                const directionText = direction < 0 ? 'up' : 'down';
                window.StackMapKeyboardNav.announce(`Moved ${activity.title} ${directionText}`);
            }
            
            console.log(`Keyboard reordered: ${activity.title} from ${currentIndex} to ${newIndex}`);
        },
        
        /**
         * Manual reorder fallback
         */
        manualReorder: function(activity, fromIndex, toIndex) {
            // Get all activities
            const display = window.ActivityDisplay || window.TaskDisplay;
            const activities = display.getActivities ? display.getActivities() : display.getTasks();
            
            // Filter to current day/timeframe
            const currentActivities = activities.filter(a => 
                (a.timeframe || a.day) === (activity.timeframe || activity.day));
            
            // Remove and reinsert
            const activityToMove = currentActivities.splice(fromIndex, 1)[0];
            currentActivities.splice(toIndex, 0, activityToMove);
            
            // Update order field
            currentActivities.forEach((act, index) => {
                act.order = index;
                act.updated_at = new Date().toISOString();
            });
            
            // Save and re-render
            if (display.setActivities) {
                display.setActivities(activities);
            } else if (display.setTasks) {
                display.setTasks(activities);
            }
            
            if (display.render) {
                display.render();
            }
            
            // Dispatch change event
            document.dispatchEvent(new CustomEvent('activitiesChanged', {
                detail: { source: 'keyboard-reorder' }
            }));
        },
        
        /**
         * Check if edit mode is currently active
         */
        isEditModeActive: function() {
            return this.editModeActive;
        },
        
        /**
         * Force update all edit controls (useful for manual refresh)
         */
        refresh: function() {
            const self = this;
            
            // Check current edit mode state
            const isActive = window.EditMode && window.EditMode.isActive ? 
                window.EditMode.isActive() : false;
            
            // Apply the state
            self.onEditModeChange(isActive);
        },
        
        /**
         * Clean up event listeners
         */
        destroy: function() {
            const self = this;
            
            // Clean up all event listeners
            self.disableContextMenus();
            self.disableInlineEditing();
            
            // Reset state
            self.isInitialized = false;
            self.editModeActive = false;
        }
    };
    
    // Export to global scope
    window.CardEditControls = CardEditControls;
    
    // Auto-initialize when EditMode is available
    function initializeCardEditControls() {
        if (window.EditMode) {
            CardEditControls.init();
        } else {
            // Try again in 100ms
            setTimeout(initializeCardEditControls, 100);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initializeCardEditControls, 200);
        });
    } else {
        setTimeout(initializeCardEditControls, 200);
    }
})();