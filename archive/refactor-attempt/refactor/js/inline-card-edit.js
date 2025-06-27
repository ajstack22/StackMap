/**
 * Inline Card Edit System
 * Provides direct editing capabilities on activity cards
 * Story #96 - Round 5 Dev2
 */

(function() {
    'use strict';
    
    const InlineCardEdit = {
        currentlyEditing: null,
        originalValues: {},
        editTimeouts: {},
        
        /**
         * Start inline editing for an activity
         */
        startEdit: function(activity) {
            const self = this;
            
            // Find the card element
            const card = document.querySelector(`[data-activity-id="${activity.id}"], [data-task-id="${activity.id}"]`);
            if (!card) {
                console.error('Card not found for activity:', activity.id);
                return;
            }
            
            // End any existing editing
            if (self.currentlyEditing && self.currentlyEditing !== activity.id) {
                self.endEdit(false);
            }
            
            // Store original values for escape/cancel
            self.originalValues[activity.id] = {
                title: activity.title,
                description: activity.description || activity.notes || '',
                time_estimate: activity.time_estimate || ''
            };
            
            self.currentlyEditing = activity.id;
            
            // Make title editable
            self.makeElementEditable(card, '.activity-title, .task-card__title', activity.title || '', 'title');
            
            // Make description editable if it exists
            const descEl = card.querySelector('.activity-description, .task-card__description');
            if (descEl) {
                self.makeElementEditable(card, '.activity-description, .task-card__description', activity.description || activity.notes || '', 'description');
            }
            
            // Make time estimate editable if it exists
            const timeEl = card.querySelector('.activity-time, .task-card__time');
            if (timeEl) {
                self.makeTimeEditable(card, timeEl, activity);
            }
            
            // Add quick adjustment controls
            self.addQuickControls(card, activity);
            
            // Add visual editing indicator
            card.classList.add('inline-editing');
            
            // Auto-save on blur or timeout
            self.setupAutoSave(activity.id);
            
            console.log('Started inline editing for:', activity.title);
        },
        
        /**
         * Add quick adjustment controls to card
         */
        addQuickControls: function(card, activity) {
            const self = this;
            
            // Remove any existing quick controls
            const existingControls = card.querySelector('.quick-edit-controls');
            if (existingControls) {
                existingControls.remove();
            }
            
            // Create container for quick controls
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'quick-edit-controls';
            
            // Add priority selector
            const prioritySelector = self.createPrioritySelector(card, activity);
            controlsContainer.appendChild(prioritySelector);
            
            // Add time adjustment
            const timeAdjustment = self.createTimeAdjustment(card, activity);
            controlsContainer.appendChild(timeAdjustment);
            
            // Add day toggle
            const dayToggle = self.createDayToggle(card, activity);
            controlsContainer.appendChild(dayToggle);
            
            // Add controls to card footer
            const footer = card.querySelector('.task-card__footer') || card.querySelector('.activity-footer');
            if (footer) {
                footer.appendChild(controlsContainer);
            } else {
                // If no footer, add at end of card
                card.appendChild(controlsContainer);
            }
        },
        
        /**
         * Create priority quick selector
         */
        createPrioritySelector: function(card, activity) {
            const self = this;
            
            const container = document.createElement('div');
            container.className = 'priority-quick-selector';
            container.innerHTML = `
                <label class="quick-selector-label">Priority:</label>
                <div class="quick-selector-buttons">
                    <button class="priority-btn ${activity.priority === 'low' ? 'active' : ''}" data-priority="low">Low</button>
                    <button class="priority-btn ${activity.priority === 'medium' ? 'active' : ''}" data-priority="medium">Medium</button>
                    <button class="priority-btn ${activity.priority === 'high' ? 'active' : ''}" data-priority="high">High</button>
                </div>
            `;
            
            // Add event listeners
            container.addEventListener('click', function(e) {
                if (e.target.classList.contains('priority-btn')) {
                    const newPriority = e.target.getAttribute('data-priority');
                    
                    // Update UI immediately
                    container.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // Save change
                    self.savePriorityChange(activity.id, newPriority);
                }
            });
            
            return container;
        },
        
        /**
         * Create time estimate quick adjustment
         */
        createTimeAdjustment: function(card, activity) {
            const self = this;
            const currentTime = parseInt(activity.time_estimate) || 0;
            
            const container = document.createElement('div');
            container.className = 'time-quick-adjustment';
            container.innerHTML = `
                <label class="quick-selector-label">Time Estimate:</label>
                <div class="time-display-container">
                    <span class="current-time">${currentTime} min</span>
                    <div class="time-adjustment-buttons">
                        <button class="time-btn time-btn-subtract" data-adjust="-15" title="Subtract 15 minutes">-15m</button>
                        <button class="time-btn time-btn-add" data-adjust="15" title="Add 15 minutes">+15m</button>
                        <button class="time-btn time-btn-add" data-adjust="30" title="Add 30 minutes">+30m</button>
                        <button class="time-btn time-btn-add" data-adjust="60" title="Add 1 hour">+1h</button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            container.addEventListener('click', function(e) {
                if (e.target.classList.contains('time-btn')) {
                    const adjustment = parseInt(e.target.getAttribute('data-adjust'));
                    const newTime = Math.max(0, currentTime + adjustment);
                    
                    // Update display immediately
                    container.querySelector('.current-time').textContent = `${newTime} min`;
                    
                    // Save change
                    self.saveTimeChange(activity.id, newTime);
                    
                    // Update the adjustment base for next click
                    activity.time_estimate = newTime;
                }
            });
            
            return container;
        },
        
        /**
         * Create day/timeframe quick toggle
         */
        createDayToggle: function(card, activity) {
            const self = this;
            const currentDay = activity.timeframe || activity.day || 'today';
            
            const container = document.createElement('div');
            container.className = 'day-quick-toggle';
            container.innerHTML = `
                <label class="quick-selector-label">Day:</label>
                <div class="day-toggle-container">
                    <button class="day-toggle-btn ${currentDay === 'today' ? 'active' : ''}" data-day="today">
                        <span class="day-icon">☀️</span>Today
                    </button>
                    <button class="day-toggle-btn ${currentDay === 'tomorrow' ? 'active' : ''}" data-day="tomorrow">
                        <span class="day-icon">🌙</span>Tomorrow
                    </button>
                </div>
            `;
            
            // Add event listeners
            container.addEventListener('click', function(e) {
                const btn = e.target.closest('.day-toggle-btn');
                if (btn) {
                    const newDay = btn.getAttribute('data-day');
                    
                    // Update UI immediately
                    container.querySelectorAll('.day-toggle-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Save change
                    self.saveDayChange(activity.id, newDay);
                }
            });
            
            return container;
        },
        
        /**
         * Make an element editable
         */
        makeElementEditable: function(card, selector, currentValue, field) {
            const self = this;
            const element = card.querySelector(selector);
            if (!element) return;
            
            // Store original element for restoration
            const originalElement = element.cloneNode(true);
            element._originalElement = originalElement;
            
            // Create input field
            const input = document.createElement(field === 'description' ? 'textarea' : 'input');
            input.className = element.className + ' inline-edit-input';
            input.value = currentValue;
            input.setAttribute('data-field', field);
            
            if (field === 'description') {
                input.rows = 2;
                input.style.resize = 'none';
            }
            
            // Style the input to match the original element
            const computedStyle = window.getComputedStyle(element);
            input.style.fontSize = computedStyle.fontSize;
            input.style.fontWeight = computedStyle.fontWeight;
            input.style.fontFamily = computedStyle.fontFamily;
            input.style.color = computedStyle.color;
            input.style.background = 'rgba(255, 255, 255, 0.9)';
            input.style.border = '2px solid #3b82f6';
            input.style.borderRadius = '4px';
            input.style.padding = '4px 8px';
            input.style.margin = '0';
            input.style.width = '100%';
            input.style.boxSizing = 'border-box';
            
            // Replace element with input
            element.parentNode.replaceChild(input, element);
            
            // Focus and select
            input.focus();
            if (field !== 'description') {
                input.select();
            }
            
            // Handle keyboard events
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    self.endEdit(true);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    self.endEdit(false);
                } else if (e.key === 'Tab') {
                    // Allow tab to move to next editable field
                    self.handleTabNavigation(e, card);
                }
            });
            
            // Handle blur event (auto-save)
            input.addEventListener('blur', function() {
                // Small delay to allow for tab navigation
                setTimeout(function() {
                    if (document.activeElement && 
                        document.activeElement.classList.contains('inline-edit-input') &&
                        document.activeElement.closest('[data-activity-id], [data-task-id]') === card) {
                        // Still editing in same card, don't end edit
                        return;
                    }
                    self.endEdit(true);
                }, 100);
            });
        },
        
        /**
         * Make time estimate editable with validation
         */
        makeTimeEditable: function(card, timeElement, activity) {
            const self = this;
            
            // Extract current minutes from text like "⏱ 30 min"
            const currentText = timeElement.textContent || '';
            const match = currentText.match(/(\d+)/);
            const currentMinutes = match ? match[1] : '';
            
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.max = '480'; // 8 hours max
            input.className = timeElement.className + ' inline-edit-input time-input';
            input.value = currentMinutes;
            input.setAttribute('data-field', 'time_estimate');
            input.placeholder = 'Minutes';
            
            // Style the input
            input.style.width = '80px';
            input.style.textAlign = 'center';
            input.style.background = 'rgba(255, 255, 255, 0.9)';
            input.style.border = '2px solid #3b82f6';
            input.style.borderRadius = '4px';
            input.style.padding = '4px';
            input.style.fontSize = '14px';
            
            // Create container with label
            const container = document.createElement('div');
            container.className = 'time-edit-container';
            container.innerHTML = '⏱ ';
            container.appendChild(input);
            container.innerHTML += ' min';
            
            // Store original for restoration
            timeElement._originalElement = timeElement.cloneNode(true);
            
            // Replace element
            timeElement.parentNode.replaceChild(container, timeElement);
            
            // Focus input
            input.focus();
            input.select();
            
            // Handle events same as other inputs
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    self.endEdit(true);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    self.endEdit(false);
                }
            });
            
            input.addEventListener('blur', function() {
                setTimeout(function() {
                    if (!document.activeElement || 
                        !document.activeElement.classList.contains('inline-edit-input') ||
                        document.activeElement.closest('[data-activity-id], [data-task-id]') !== card) {
                        self.endEdit(true);
                    }
                }, 100);
            });
        },
        
        /**
         * Handle tab navigation between fields
         */
        handleTabNavigation: function(e, card) {
            const inputs = card.querySelectorAll('.inline-edit-input');
            const currentIndex = Array.from(inputs).indexOf(e.target);
            
            if (e.shiftKey) {
                // Shift+Tab - previous field
                if (currentIndex > 0) {
                    e.preventDefault();
                    inputs[currentIndex - 1].focus();
                }
            } else {
                // Tab - next field
                if (currentIndex < inputs.length - 1) {
                    e.preventDefault();
                    inputs[currentIndex + 1].focus();
                }
            }
        },
        
        /**
         * Setup auto-save functionality
         */
        setupAutoSave: function(activityId) {
            const self = this;
            
            // Clear existing timeout
            if (self.editTimeouts[activityId]) {
                clearTimeout(self.editTimeouts[activityId]);
            }
            
            // Set up auto-save after 10 seconds of inactivity
            self.editTimeouts[activityId] = setTimeout(function() {
                if (self.currentlyEditing === activityId) {
                    self.endEdit(true);
                }
            }, 10000);
        },
        
        /**
         * End inline editing
         */
        endEdit: function(save) {
            const self = this;
            
            if (!self.currentlyEditing) return;
            
            const activityId = self.currentlyEditing;
            const card = document.querySelector(`[data-activity-id="${activityId}"], [data-task-id="${activityId}"]`);
            
            if (!card) {
                self.currentlyEditing = null;
                return;
            }
            
            // Clear timeout
            if (self.editTimeouts[activityId]) {
                clearTimeout(self.editTimeouts[activityId]);
                delete self.editTimeouts[activityId];
            }
            
            if (save) {
                self.saveChanges(activityId, card);
            } else {
                self.restoreOriginalValues(activityId, card);
            }
            
            // Remove editing state
            card.classList.remove('inline-editing');
            self.currentlyEditing = null;
            delete self.originalValues[activityId];
        },
        
        /**
         * Save changes to activity
         */
        saveChanges: function(activityId, card) {
            const self = this;
            const inputs = card.querySelectorAll('.inline-edit-input');
            
            // Get the activity object
            const activity = self.getActivity(activityId);
            if (!activity) {
                console.error('Activity not found:', activityId);
                self.restoreOriginalValues(activityId, card);
                return;
            }
            
            // Collect changes
            const changes = {};
            let hasChanges = false;
            
            inputs.forEach(function(input) {
                const field = input.getAttribute('data-field');
                let value = input.value.trim();
                
                if (field === 'time_estimate') {
                    value = parseInt(value) || null;
                }
                
                if (value !== activity[field]) {
                    changes[field] = value;
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                // Apply changes
                Object.assign(activity, changes);
                activity.updated_at = new Date().toISOString();
                
                // Save to storage
                const display = window.ActivityDisplay || window.TaskDisplay;
                if (display.updateActivity) {
                    display.updateActivity(activity);
                } else if (display.updateTask) {
                    display.updateTask(activity);
                }
                
                console.log('Saved inline changes:', changes);
                
                // Show success feedback
                self.showSaveNotification('Changes saved');
            }
            
            // Restore elements
            self.restoreElements(card);
        },
        
        /**
         * Restore original values
         */
        restoreOriginalValues: function(activityId, card) {
            const self = this;
            
            console.log('Cancelled inline editing for:', activityId);
            
            // Restore elements without saving
            self.restoreElements(card);
        },
        
        /**
         * Restore original elements from inputs
         */
        restoreElements: function(card) {
            const inputs = card.querySelectorAll('.inline-edit-input');
            
            inputs.forEach(function(input) {
                const container = input.closest('.time-edit-container');
                if (container) {
                    // Handle time input container
                    const originalTimeEl = container._originalElement || 
                        card.querySelector('.activity-time, .task-card__time')._originalElement;
                    if (originalTimeEl) {
                        container.parentNode.replaceChild(originalTimeEl.cloneNode(true), container);
                    }
                } else {
                    // Handle regular inputs
                    const originalElement = input._originalElement || 
                        input.parentNode._originalElement;
                    if (originalElement) {
                        input.parentNode.replaceChild(originalElement.cloneNode(true), input);
                    }
                }
            });
            
            // Re-render the card to ensure consistency
            const activityId = card.getAttribute('data-activity-id') || card.getAttribute('data-task-id');
            if (activityId) {
                const display = window.ActivityDisplay || window.TaskDisplay;
                if (display.render) {
                    setTimeout(function() {
                        display.render();
                    }, 50);
                }
            }
        },
        
        /**
         * Get activity by ID
         */
        getActivity: function(activityId) {
            const display = window.ActivityDisplay || window.TaskDisplay;
            
            if (display.getActivityById) {
                return display.getActivityById(activityId);
            } else if (display.getTaskById) {
                return display.getTaskById(activityId);
            } else if (display.activities) {
                return display.activities.find(a => a.id === activityId);
            } else if (display.tasks) {
                return display.tasks.find(t => t.id === activityId);
            }
            
            return null;
        },
        
        /**
         * Show save notification
         */
        showSaveNotification: function(message) {
            // Use existing notification system if available
            if (window.EditModeMenu && window.EditModeMenu.showNotification) {
                window.EditModeMenu.showNotification(message);
                return;
            }
            
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = 'inline-edit-notification';
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 12px 16px;
                border-radius: 6px;
                font-size: 14px;
                z-index: 1000;
                animation: slideInRight 0.3s ease-out;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOutRight 0.3s ease-out';
                    setTimeout(function() {
                        notification.remove();
                    }, 300);
                }
            }, 2000);
        },
        
        /**
         * Save priority change
         */
        savePriorityChange: function(activityId, newPriority) {
            const self = this;
            
            try {
                // Get the activity
                let activity = null;
                if (window.ActivityDisplay && window.ActivityDisplay.getActivityById) {
                    activity = window.ActivityDisplay.getActivityById(activityId);
                } else if (window.TaskDisplay && window.TaskDisplay.getTaskById) {
                    activity = window.TaskDisplay.getTaskById(activityId);
                }
                
                if (activity) {
                    activity.priority = newPriority;
                    activity.updated_at = new Date().toISOString();
                    
                    // Save to storage
                    self.saveActivity(activity);
                    
                    // Visual feedback
                    self.showSaveConfirmation('Priority updated');
                    
                    console.log(`Priority changed to ${newPriority} for:`, activity.title);
                }
            } catch (error) {
                console.error('Error saving priority change:', error);
                self.showError('Failed to save priority change');
            }
        },
        
        /**
         * Save time estimate change
         */
        saveTimeChange: function(activityId, newTime) {
            const self = this;
            
            try {
                // Get the activity
                let activity = null;
                if (window.ActivityDisplay && window.ActivityDisplay.getActivityById) {
                    activity = window.ActivityDisplay.getActivityById(activityId);
                } else if (window.TaskDisplay && window.TaskDisplay.getTaskById) {
                    activity = window.TaskDisplay.getTaskById(activityId);
                }
                
                if (activity) {
                    activity.time_estimate = newTime;
                    activity.estimatedMinutes = newTime; // Backward compatibility
                    activity.updated_at = new Date().toISOString();
                    
                    // Save to storage
                    self.saveActivity(activity);
                    
                    // Visual feedback
                    self.showSaveConfirmation(`Time updated to ${newTime} min`);
                    
                    console.log(`Time estimate changed to ${newTime} minutes for:`, activity.title);
                }
            } catch (error) {
                console.error('Error saving time change:', error);
                self.showError('Failed to save time change');
            }
        },
        
        /**
         * Save day/timeframe change
         */
        saveDayChange: function(activityId, newDay) {
            const self = this;
            
            try {
                // Get the activity
                let activity = null;
                if (window.ActivityDisplay && window.ActivityDisplay.getActivityById) {
                    activity = window.ActivityDisplay.getActivityById(activityId);
                } else if (window.TaskDisplay && window.TaskDisplay.getTaskById) {
                    activity = window.TaskDisplay.getTaskById(activityId);
                }
                
                if (activity) {
                    activity.timeframe = newDay;
                    activity.day = newDay; // Backward compatibility
                    activity.updated_at = new Date().toISOString();
                    
                    // Save to storage
                    self.saveActivity(activity);
                    
                    // Re-render to move card to correct day view
                    const display = window.ActivityDisplay || window.TaskDisplay;
                    if (display && display.render) {
                        display.render();
                    }
                    
                    // Visual feedback
                    self.showSaveConfirmation(`Moved to ${newDay}`);
                    
                    console.log(`Day changed to ${newDay} for:`, activity.title);
                }
            } catch (error) {
                console.error('Error saving day change:', error);
                self.showError('Failed to save day change');
            }
        },
        
        /**
         * Show save confirmation
         */
        showSaveConfirmation: function(message) {
            // Use existing notification system if available
            if (window.EditModeMenu && window.EditModeMenu.showNotification) {
                window.EditModeMenu.showNotification(message);
            } else {
                // Simple toast notification
                const toast = document.createElement('div');
                toast.className = 'save-confirmation-toast';
                toast.textContent = message;
                toast.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 10000;
                    animation: fadeInUp 0.3s ease;
                `;
                
                document.body.appendChild(toast);
                
                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.style.animation = 'fadeOutDown 0.3s ease';
                        setTimeout(function() {
                            if (toast.parentNode) {
                                toast.parentNode.removeChild(toast);
                            }
                        }, 300);
                    }
                }, 2000);
            }
        },
        
        /**
         * Show error message
         */
        showError: function(message) {
            // Use existing notification system if available
            if (window.EditModeMenu && window.EditModeMenu.showNotification) {
                window.EditModeMenu.showNotification(message);
            } else {
                console.error(message);
            }
        },
        
        /**
         * Cancel any active editing
         */
        cancelEdit: function() {
            if (this.currentlyEditing) {
                this.endEdit(false);
            }
        }
    };
    
    // Export to global scope
    window.InlineCardEdit = InlineCardEdit;
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key cancels editing
        if (e.key === 'Escape' && InlineCardEdit.currentlyEditing) {
            InlineCardEdit.cancelEdit();
        }
    });
    
})();