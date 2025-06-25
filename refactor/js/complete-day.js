/**
 * Complete Day Workflow
 * Provides closure at end of day and transitions tomorrow's activities to today
 * Story #91 - Round 4 Dev2
 */

(function() {
    'use strict';
    
    const CompleteDayWorkflow = {
        isInitialized: false,
        dialog: null,
        isProcessing: false,
        
        // Configuration
        confirmationKey: 'stackmap_complete_day_confirmed_today',
        
        /**
         * Initialize the complete day workflow
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Create dialog elements
            self.createDialog();
            
            // Setup event listeners
            self.setupEventListeners();
            
            self.isInitialized = true;
            console.log('CompleteDayWorkflow: Initialized');
        },
        
        /**
         * Main entry point - start complete day workflow
         */
        completeDay: function() {
            const self = this;
            
            // Prevent multiple executions
            if (self.isProcessing) {
                console.log('Complete day already in progress');
                return;
            }
            
            // Check if user has confirmed today already
            const today = new Date().toDateString();
            const confirmedToday = localStorage.getItem(self.confirmationKey);
            
            if (confirmedToday === today) {
                // Skip confirmation, go straight to workflow
                self.executeWorkflow();
            } else {
                // Show confirmation dialog
                self.showConfirmationDialog();
            }
        },
        
        /**
         * Create confirmation dialog
         */
        createDialog: function() {
            const self = this;
            
            // Create dialog container
            self.dialog = document.createElement('div');
            self.dialog.className = 'complete-day-dialog';
            self.dialog.setAttribute('role', 'dialog');
            self.dialog.setAttribute('aria-labelledby', 'complete-day-title');
            self.dialog.setAttribute('aria-describedby', 'complete-day-description');
            self.dialog.style.display = 'none';
            
            // Dialog content
            self.dialog.innerHTML = `
                <div class="complete-day-overlay"></div>
                <div class="complete-day-content">
                    <div class="complete-day-header">
                        <h2 id="complete-day-title" class="complete-day-title">Complete Today?</h2>
                    </div>
                    
                    <div class="complete-day-body">
                        <div id="complete-day-description" class="complete-day-description">
                            <p>This will help you finish today and prepare for tomorrow:</p>
                            <ul class="complete-day-steps">
                                <li>✅ Move tomorrow's activities to today</li>
                                <li>📌 Keep pinned activities for tomorrow</li>
                                <li>🗑️ Remove completed activities from today</li>
                                <li>🎉 Celebrate your progress!</li>
                            </ul>
                        </div>
                        
                        <div class="complete-day-options">
                            <label class="complete-day-checkbox">
                                <input type="checkbox" id="complete-day-dont-ask">
                                <span class="checkbox-label">Don't ask again today</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="complete-day-actions">
                        <button type="button" class="complete-day-cancel" id="complete-day-cancel">
                            Cancel
                        </button>
                        <button type="button" class="complete-day-confirm" id="complete-day-confirm">
                            Complete Day
                        </button>
                    </div>
                </div>
            `;
            
            // Add to body
            document.body.appendChild(self.dialog);
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Cancel button
            const cancelBtn = self.dialog.querySelector('#complete-day-cancel');
            cancelBtn.addEventListener('click', function() {
                self.hideDialog();
            });
            
            // Confirm button
            const confirmBtn = self.dialog.querySelector('#complete-day-confirm');
            confirmBtn.addEventListener('click', function() {
                self.handleConfirmation();
            });
            
            // Overlay click to close
            const overlay = self.dialog.querySelector('.complete-day-overlay');
            overlay.addEventListener('click', function() {
                self.hideDialog();
            });
            
            // Escape key to close
            self.dialog.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    self.hideDialog();
                }
            });
        },
        
        /**
         * Show confirmation dialog
         */
        showConfirmationDialog: function() {
            const self = this;
            
            // Show dialog
            self.dialog.style.display = 'block';
            
            // Add open class for animation (skip in safe mode)
            if (!window.StackMapSafeMode) {
                requestAnimationFrame(function() {
                    self.dialog.classList.add('open');
                });
            } else {
                self.dialog.classList.add('open');
            }
            
            // Focus the confirm button
            const confirmBtn = self.dialog.querySelector('#complete-day-confirm');
            setTimeout(function() {
                confirmBtn.focus();
            }, 100);
            
            // Reset checkbox
            const checkbox = self.dialog.querySelector('#complete-day-dont-ask');
            checkbox.checked = false;
        },
        
        /**
         * Hide dialog
         */
        hideDialog: function() {
            const self = this;
            
            self.dialog.classList.remove('open');
            
            // Hide after animation
            setTimeout(function() {
                self.dialog.style.display = 'none';
            }, 200);
        },
        
        /**
         * Handle confirmation button click
         */
        handleConfirmation: function() {
            const self = this;
            
            // Check if user selected "don't ask again"
            const checkbox = self.dialog.querySelector('#complete-day-dont-ask');
            if (checkbox.checked) {
                const today = new Date().toDateString();
                localStorage.setItem(self.confirmationKey, today);
            }
            
            // Hide dialog
            self.hideDialog();
            
            // Execute workflow
            setTimeout(function() {
                self.executeWorkflow();
            }, 300);
        },
        
        /**
         * Execute the complete day workflow
         */
        executeWorkflow: function() {
            const self = this;
            
            console.log('CompleteDayWorkflow: Starting workflow execution');
            self.isProcessing = true;
            
            try {
                // Show loading state
                self.showLoadingState();
                
                // Phase 1: Get activity data
                const activities = self.getActivities();
                
                // Phase 2: Process activities (stubbed for now - will integrate with pin logic)
                self.processActivities(activities);
                
                // Phase 3: Update UI
                self.updateUI();
                
                // Phase 4: Celebrate
                self.triggerCelebration();
                
                console.log('CompleteDayWorkflow: Workflow completed successfully');
                
            } catch (error) {
                console.error('CompleteDayWorkflow: Error during execution:', error);
                self.showError('Something went wrong completing the day. Please try again.');
            } finally {
                self.isProcessing = false;
                self.hideLoadingState();
            }
        },
        
        /**
         * Get activities from data source
         */
        getActivities: function() {
            // Try multiple data sources for compatibility
            let activities = [];
            
            if (window.ActivityDisplay && window.ActivityDisplay.getActivities) {
                activities = window.ActivityDisplay.getActivities();
            } else if (window.TaskDisplay && window.TaskDisplay.getTasks) {
                activities = window.TaskDisplay.getTasks();
            }
            
            console.log('CompleteDayWorkflow: Found', activities.length, 'activities');
            return activities;
        },
        
        /**
         * Process activities according to complete day logic
         */
        processActivities: function(activities) {
            const self = this;
            
            console.log('CompleteDayWorkflow: Processing activities...');
            
            // Separate activities by day
            const todayActivities = activities.filter(a => a.timeframe === 'today' || a.day === 'today');
            const tomorrowActivities = activities.filter(a => a.timeframe === 'tomorrow' || a.day === 'tomorrow');
            
            console.log('Today activities:', todayActivities.length);
            console.log('Tomorrow activities:', tomorrowActivities.length);
            
            // Get pinned activities from today
            const pinnedActivities = todayActivities.filter(a => a.pinned === true);
            
            console.log('CompleteDayWorkflow: Moving', tomorrowActivities.length, 'activities from tomorrow to today');
            console.log('CompleteDayWorkflow: Copying', pinnedActivities.length, 'pinned activities to new tomorrow');
            console.log('CompleteDayWorkflow: Cleaning up unpinned completed activities');
            
            // Step 1: Move tomorrow's activities to today
            tomorrowActivities.forEach(function(activity) {
                activity.timeframe = 'today';
                activity.day = 'today';
                activity.updated_at = new Date().toISOString();
            });
            
            // Step 2: Copy pinned activities to create new tomorrow activities
            const newTomorrowActivities = pinnedActivities.map(function(activity) {
                const newActivity = Object.assign({}, activity);
                newActivity.id = 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                newActivity.timeframe = 'tomorrow';
                newActivity.day = 'tomorrow';
                newActivity.created_at = new Date().toISOString();
                newActivity.updated_at = new Date().toISOString();
                newActivity.status = 'pending'; // Reset status for tomorrow
                newActivity.completed = false;
                return newActivity;
            });
            
            // Step 3: Remove completed unpinned activities from today
            const activitiesToKeep = activities.filter(function(activity) {
                const isToday = activity.timeframe === 'today' || activity.day === 'today';
                const isUnpinned = !activity.pinned;
                const isCompleted = activity.completed || activity.status === 'completed';
                
                // Keep if: not today, or pinned, or not completed
                return !isToday || !isUnpinned || !isCompleted;
            });
            
            // Step 4: Add new tomorrow activities
            const updatedActivities = activitiesToKeep.concat(newTomorrowActivities);
            
            // Step 5: Save the changes
            self.saveActivities(updatedActivities);
            
            console.log('CompleteDayWorkflow: Created', newTomorrowActivities.length, 'new tomorrow activities');
            console.log('CompleteDayWorkflow: Final activity count:', updatedActivities.length);
        },
        
        /**
         * Save activities to data storage
         */
        saveActivities: function(activities) {
            try {
                // Try ActivityDisplay first (newer)
                if (window.ActivityDisplay && window.ActivityDisplay.setActivities) {
                    window.ActivityDisplay.setActivities(activities);
                    window.ActivityDisplay.saveActivities();
                } else if (window.ActivityDisplay && window.ActivityDisplay.activities) {
                    window.ActivityDisplay.activities = activities;
                    if (window.ActivityDisplay.saveActivities) {
                        window.ActivityDisplay.saveActivities();
                    }
                } else if (window.TaskDisplay && window.TaskDisplay.setTasks) {
                    // Backward compatibility
                    window.TaskDisplay.setTasks(activities);
                    window.TaskDisplay.saveTasks();
                } else {
                    console.warn('CompleteDayWorkflow: No save method available');
                }
                
                // Dispatch event for other systems to update
                document.dispatchEvent(new CustomEvent('activitiesChanged', {
                    detail: { source: 'complete-day-workflow' }
                }));
                
            } catch (error) {
                console.error('CompleteDayWorkflow: Error saving activities:', error);
                throw error;
            }
        },
        
        /**
         * Update UI after workflow completion
         */
        updateUI: function() {
            console.log('CompleteDayWorkflow: Updating UI...');
            
            // Refresh activity display if available
            if (window.ActivityDisplay && window.ActivityDisplay.refresh) {
                window.ActivityDisplay.refresh();
            } else if (window.TaskDisplay && window.TaskDisplay.refresh) {
                window.TaskDisplay.refresh();
            }
            
            // Update edit menu counts
            if (window.EditModeMenu && window.EditModeMenu.updateMenuState) {
                window.EditModeMenu.updateMenuState();
            }
            
            // Switch to today view if needed
            if (window.DaySelector && window.DaySelector.setCurrentDay) {
                window.DaySelector.setCurrentDay('today');
            } else if (window.TodayTomorrowView && window.TodayTomorrowView.showToday) {
                window.TodayTomorrowView.showToday();
            }
        },
        
        /**
         * Trigger celebration
         */
        triggerCelebration: function() {
            console.log('CompleteDayWorkflow: Triggering celebration...');
            
            // Use existing celebration system
            if (window.CelebrationSystem && window.CelebrationSystem.showMessage) {
                // Create a temporary element for the celebration
                const tempElement = document.createElement('div');
                tempElement.style.position = 'fixed';
                tempElement.style.top = '50%';
                tempElement.style.left = '50%';
                tempElement.style.transform = 'translate(-50%, -50%)';
                document.body.appendChild(tempElement);
                
                // Show custom message
                window.CelebrationSystem.showMessage(tempElement);
                
                // Also show milestone message
                setTimeout(function() {
                    if (window.CelebrationSystem.showMilestoneMessage) {
                        window.CelebrationSystem.showMilestoneMessage('Great job completing today! 🎉');
                    }
                    
                    // Clean up temp element
                    if (tempElement.parentNode) {
                        tempElement.parentNode.removeChild(tempElement);
                    }
                }, 100);
            } else {
                // Fallback celebration
                self.showNotification('🎉 Great job completing today!');
            }
        },
        
        /**
         * Show loading state
         */
        showLoadingState: function() {
            // TODO: Implement loading indicator
            console.log('CompleteDayWorkflow: Loading...');
        },
        
        /**
         * Hide loading state
         */
        hideLoadingState: function() {
            // TODO: Hide loading indicator
            console.log('CompleteDayWorkflow: Loading complete');
        },
        
        /**
         * Show error message
         */
        showError: function(message) {
            console.error('CompleteDayWorkflow:', message);
            
            // Use edit menu notification system if available
            if (window.EditModeMenu && window.EditModeMenu.showNotification) {
                window.EditModeMenu.showNotification(message);
            } else {
                // Fallback notification
                alert(message);
            }
        },
        
        /**
         * Show notification
         */
        showNotification: function(message) {
            console.log('CompleteDayWorkflow:', message);
            
            // Use edit menu notification system if available
            if (window.EditModeMenu && window.EditModeMenu.showNotification) {
                window.EditModeMenu.showNotification(message);
            }
        },
        
        /**
         * Clean up event listeners and state
         */
        destroy: function() {
            const self = this;
            
            // Remove dialog from DOM
            if (self.dialog && self.dialog.parentNode) {
                self.dialog.parentNode.removeChild(self.dialog);
            }
            
            // Reset state
            self.isInitialized = false;
            self.isProcessing = false;
        }
    };
    
    // Export to global scope
    window.CompleteDayWorkflow = CompleteDayWorkflow;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            CompleteDayWorkflow.init();
        });
    } else {
        CompleteDayWorkflow.init();
    }
})();