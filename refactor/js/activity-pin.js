/**
 * Activity Pin Management System
 * Handles individual pin toggles and bulk pin mode for daily routine activities
 * Mobile-first design with ADHD/autism accommodations
 */

(function() {
    'use strict';
    
    const ActivityPin = {
        isInitialized: false,
        bulkModeActive: false,
        bulkModeOverlay: null,
        eventListeners: [],
        
        // Configuration
        touchTargetSize: window.StackMapSafeMode ? 60 : 44,
        
        /**
         * Initialize the pin system
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Listen for activity rendering events
            self.setupEventListeners();
            
            self.isInitialized = true;
            console.log('ActivityPin: Initialized');
        },
        
        /**
         * Setup global event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Listen for activities being rendered
            document.addEventListener('activitiesUpdated', function() {
                self.updatePinButtons();
            });
            
            // Listen for activities changes
            document.addEventListener('activitiesChanged', function() {
                self.updatePinButtons();
            });
            
            // Handle pin button clicks with event delegation
            document.addEventListener('click', function(e) {
                if (e.target.closest('.activity-pin-button')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const button = e.target.closest('.activity-pin-button');
                    const activityId = button.getAttribute('data-activity-id');
                    if (activityId) {
                        self.togglePin(activityId);
                    }
                }
            });
            
            // Cleanup on page unload
            window.addEventListener('beforeunload', function() {
                self.cleanup();
            });
        },
        
        /**
         * Toggle pin state for an activity with pin type selection
         */
        togglePin: function(activityId, specificPinType = null) {
            const self = this;
            
            if (!activityId) {
                console.error('ActivityPin: No activity ID provided');
                return;
            }
            
            // Get the activity
            const activity = self.getActivity(activityId);
            if (!activity) {
                console.error('ActivityPin: Activity not found', activityId);
                return;
            }
            
            // Check current pin state
            const currentlyPinned = activity.pinned || false;
            
            if (!currentlyPinned) {
                // Pinning activity - show pin type selection
                self.showPinTypeSelector(activity, specificPinType);
            } else {
                // Unpinning activity
                self.unpinActivity(activity);
            }
        },
        
        /**
         * Show pin type selector for new pins
         */
        showPinTypeSelector: function(activity, specificPinType = null) {
            const self = this;
            
            // If specific type provided, use it directly
            if (specificPinType) {
                self.pinActivity(activity, specificPinType);
                return;
            }
            
            // Check if single-use activities should be pinned
            if (window.ActivityTypes && activity.type && activity.type.category === 'single-use') {
                const shouldPin = confirm('Single-use activities are typically not pinned since they archive after completion. Pin anyway?');
                if (!shouldPin) {
                    return;
                }
            }
            
            // Create pin type selection modal
            self.createPinTypeModal(activity);
        },
        
        /**
         * Create pin type selection modal
         */
        createPinTypeModal: function(activity) {
            const self = this;
            
            // Create modal container
            const modal = document.createElement('div');
            modal.className = 'pin-type-modal-overlay';
            modal.innerHTML = `
                <div class="pin-type-modal" role="dialog" aria-labelledby="pin-type-title" aria-modal="true">
                    <div class="pin-type-header">
                        <h3 id="pin-type-title">Choose Pin Type</h3>
                        <button class="pin-type-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="pin-type-content">
                        <p class="pin-type-description">How should "${activity.title}" behave when pinned?</p>
                        <div class="pin-type-options">
                            <button class="pin-type-option" data-type="daily">
                                <span class="pin-type-icon">📌</span>
                                <div class="pin-type-info">
                                    <strong>Daily Pin</strong>
                                    <p>Stays in same timeframe after completion</p>
                                </div>
                            </button>
                            <button class="pin-type-option" data-type="carry-forward">
                                <span class="pin-type-icon">➡️</span>
                                <div class="pin-type-info">
                                    <strong>Carry Forward</strong>
                                    <p>Moves to tomorrow when today completes</p>
                                </div>
                            </button>
                            <button class="pin-type-option" data-type="permanent">
                                <span class="pin-type-icon">📍</span>
                                <div class="pin-type-info">
                                    <strong>Permanent Pin</strong>
                                    <p>Never completes, always visible</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to DOM
            document.body.appendChild(modal);
            
            // Setup event listeners
            const closeButton = modal.querySelector('.pin-type-close');
            const typeButtons = modal.querySelectorAll('.pin-type-option');
            
            const closeModal = function() {
                document.body.removeChild(modal);
            };
            
            closeButton.addEventListener('click', closeModal);
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal();
                }
            });
            
            typeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const pinType = this.getAttribute('data-type');
                    self.pinActivity(activity, pinType);
                    closeModal();
                });
            });
            
            // Focus first option for accessibility
            typeButtons[0].focus();
        },
        
        /**
         * Pin activity with specific type
         */
        pinActivity: function(activity, pinType) {
            const self = this;
            
            // Set pin properties
            activity.pinned = true;
            activity.pinType = pinType || 'daily'; // Default to daily pin
            activity.updated_at = new Date().toISOString();
            
            console.log(`ActivityPin: Pinned activity "${activity.title}" as ${pinType} pin`);
            
            // Save the change
            self.saveActivity(activity);
            
            // Update UI immediately
            self.updatePinButtonState(activityId, newPinState);
            self.updateActivityVisualState(activityId, newPinState);
            
            // Announce to screen readers
            if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                const message = `${activity.title} ${newPinState ? 'pinned' : 'unpinned'}`;
                window.StackMapKeyboardNav.announce(message);
            }
            
            // Dispatch pin changed event
            document.dispatchEvent(new CustomEvent('activityPinChanged', {
                detail: { 
                    activityId: activityId, 
                    pinned: newPinState,
                    activity: activity
                }
            }));
        },
        
        /**
         * Get activity by ID
         */
        getActivity: function(activityId) {
            if (window.ActivityDisplay && window.ActivityDisplay.getActivityById) {
                return window.ActivityDisplay.getActivityById(activityId);
            } else if (window.ActivityDisplay && window.ActivityDisplay.getTaskById) {
                // Backward compatibility
                return window.ActivityDisplay.getTaskById(activityId);
            }
            return null;
        },
        
        /**
         * Save activity changes
         */
        saveActivity: function(activity) {
            if (window.ActivityDisplay && window.ActivityDisplay.saveActivities) {
                window.ActivityDisplay.saveActivities();
            }
        },
        
        /**
         * Create pin button element
         */
        createPinButton: function(activity) {
            const self = this;
            
            const button = document.createElement('button');
            button.className = 'activity-pin-button';
            button.setAttribute('data-activity-id', activity.id);
            button.setAttribute('aria-label', `Toggle pin for ${activity.title || 'activity'}`);
            button.setAttribute('title', activity.pinned ? 'Unpin activity' : 'Pin activity');
            
            // Set touch target size
            button.style.minWidth = self.touchTargetSize + 'px';
            button.style.minHeight = self.touchTargetSize + 'px';
            
            // Create pin icon
            const icon = document.createElement('span');
            icon.className = 'pin-icon';
            icon.textContent = '📌';
            icon.setAttribute('aria-hidden', 'true');
            
            button.appendChild(icon);
            
            // Set initial state
            if (activity.pinned) {
                button.classList.add('pinned');
            }
            
            return button;
        },
        
        /**
         * Update pin button state
         */
        updatePinButtonState: function(activityId, pinned) {
            const buttons = document.querySelectorAll(`[data-activity-id="${activityId}"] .activity-pin-button`);
            buttons.forEach(function(button) {
                if (pinned) {
                    button.classList.add('pinned');
                    button.setAttribute('title', 'Unpin activity');
                    button.setAttribute('aria-label', button.getAttribute('aria-label').replace('Pin', 'Unpin'));
                } else {
                    button.classList.remove('pinned');
                    button.setAttribute('title', 'Pin activity');
                    button.setAttribute('aria-label', button.getAttribute('aria-label').replace('Unpin', 'Pin'));
                }
            });
        },
        
        /**
         * Update activity visual state
         */
        updateActivityVisualState: function(activityId, pinned) {
            const activityElements = document.querySelectorAll(`[data-activity-id="${activityId}"], [data-task-id="${activityId}"]`);
            activityElements.forEach(function(element) {
                if (pinned) {
                    element.classList.add('pinned');
                } else {
                    element.classList.remove('pinned');
                }
            });
        },
        
        /**
         * Update all pin buttons (called after rendering)
         */
        updatePinButtons: function() {
            const self = this;
            
            // Only add pin buttons in edit mode
            if (!window.EditMode || !window.EditMode.isActive()) {
                return;
            }
            
            // Find activity elements that need pin buttons
            const activityElements = document.querySelectorAll('.activity-item:not(.has-pin-button), .task-item:not(.has-pin-button)');
            
            activityElements.forEach(function(element) {
                const activityId = element.getAttribute('data-activity-id') || element.getAttribute('data-task-id');
                if (!activityId) return;
                
                const activity = self.getActivity(activityId);
                if (!activity) return;
                
                // Create and add pin button
                const pinButton = self.createPinButton(activity);
                
                // Find the best place to insert the pin button
                const actionsContainer = element.querySelector('.activity-actions, .task-actions');
                if (actionsContainer) {
                    actionsContainer.appendChild(pinButton);
                } else {
                    // Create actions container if it doesn't exist
                    const actions = document.createElement('div');
                    actions.className = 'activity-actions';
                    actions.appendChild(pinButton);
                    element.appendChild(actions);
                }
                
                // Mark as having pin button
                element.classList.add('has-pin-button');
                
                // Update visual state
                self.updateActivityVisualState(activityId, activity.pinned);
            });
        },
        
        /**
         * Enter bulk pin mode
         */
        enterBulkMode: function() {
            const self = this;
            
            if (self.bulkModeActive) return;
            
            console.log('ActivityPin: Entering bulk pin mode');
            self.bulkModeActive = true;
            
            // Create overlay
            self.createBulkModeOverlay();
            
            // Show overlay
            document.body.appendChild(self.bulkModeOverlay);
            
            // Focus management
            setTimeout(function() {
                const firstActivity = self.bulkModeOverlay.querySelector('.bulk-pin-activity');
                if (firstActivity) {
                    firstActivity.focus();
                }
            }, 100);
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('bulkPinModeEntered'));
        },
        
        /**
         * Exit bulk pin mode
         */
        exitBulkMode: function() {
            const self = this;
            
            if (!self.bulkModeActive) return;
            
            console.log('ActivityPin: Exiting bulk pin mode');
            self.bulkModeActive = false;
            
            // Remove overlay
            if (self.bulkModeOverlay && self.bulkModeOverlay.parentNode) {
                self.bulkModeOverlay.parentNode.removeChild(self.bulkModeOverlay);
            }
            self.bulkModeOverlay = null;
            
            // Refresh main view
            if (window.ActivityDisplay && window.ActivityDisplay.render) {
                window.ActivityDisplay.render();
            }
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('bulkPinModeExited'));
        },
        
        /**
         * Create bulk pin mode overlay
         */
        createBulkModeOverlay: function() {
            const self = this;
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'bulk-pin-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'bulk-pin-title');
            
            // Create header
            const header = document.createElement('div');
            header.className = 'bulk-pin-header';
            
            const title = document.createElement('h2');
            title.id = 'bulk-pin-title';
            title.textContent = 'Pin Activities';
            title.className = 'bulk-pin-title';
            
            const doneButton = document.createElement('button');
            doneButton.className = 'bulk-pin-done';
            doneButton.textContent = 'Done';
            doneButton.setAttribute('aria-label', 'Exit bulk pin mode');
            doneButton.style.minWidth = self.touchTargetSize + 'px';
            doneButton.style.minHeight = self.touchTargetSize + 'px';
            
            header.appendChild(title);
            header.appendChild(doneButton);
            
            // Create activity list
            const activityList = self.createBulkActivityList();
            
            // Assemble overlay
            overlay.appendChild(header);
            overlay.appendChild(activityList);
            
            // Event listeners
            doneButton.addEventListener('click', function() {
                self.exitBulkMode();
            });
            
            // Close on backdrop click
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    self.exitBulkMode();
                }
            });
            
            // Keyboard handling
            overlay.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    self.exitBulkMode();
                }
            });
            
            self.bulkModeOverlay = overlay;
        },
        
        /**
         * Create bulk mode activity list
         */
        createBulkActivityList: function() {
            const self = this;
            
            const container = document.createElement('div');
            container.className = 'bulk-pin-activities';
            
            // Get all activities
            const activities = self.getAllActivities();
            let pinnedCount = 0;
            
            activities.forEach(function(activity, index) {
                const item = document.createElement('button');
                item.className = 'bulk-pin-activity';
                item.setAttribute('data-activity-id', activity.id);
                item.setAttribute('role', 'button');
                item.setAttribute('aria-pressed', activity.pinned ? 'true' : 'false');
                item.style.minHeight = self.touchTargetSize + 'px';
                
                // Pin indicator
                const pinIcon = document.createElement('span');
                pinIcon.className = 'bulk-pin-icon';
                pinIcon.textContent = '📌';
                pinIcon.setAttribute('aria-hidden', 'true');
                
                // Activity title
                const title = document.createElement('span');
                title.className = 'bulk-pin-title';
                title.textContent = activity.title || 'Untitled Activity';
                
                item.appendChild(pinIcon);
                item.appendChild(title);
                
                // Set initial state
                if (activity.pinned) {
                    item.classList.add('pinned');
                    pinnedCount++;
                }
                
                // Click handler
                item.addEventListener('click', function() {
                    self.togglePinInBulkMode(activity.id);
                });
                
                container.appendChild(item);
            });
            
            // Add count display
            const countDisplay = document.createElement('div');
            countDisplay.className = 'bulk-pin-count';
            countDisplay.textContent = `${pinnedCount} activities pinned`;
            countDisplay.id = 'bulk-pin-count';
            
            container.insertBefore(countDisplay, container.firstChild);
            
            return container;
        },
        
        /**
         * Toggle pin in bulk mode
         */
        togglePinInBulkMode: function(activityId) {
            const self = this;
            
            // Toggle the activity
            self.togglePin(activityId);
            
            // Update bulk mode UI
            const item = self.bulkModeOverlay.querySelector(`[data-activity-id="${activityId}"]`);
            if (item) {
                const activity = self.getActivity(activityId);
                if (activity && activity.pinned) {
                    item.classList.add('pinned');
                    item.setAttribute('aria-pressed', 'true');
                } else {
                    item.classList.remove('pinned');
                    item.setAttribute('aria-pressed', 'false');
                }
            }
            
            // Update count
            self.updateBulkPinCount();
        },
        
        /**
         * Update bulk pin count display
         */
        updateBulkPinCount: function() {
            const self = this;
            
            if (!self.bulkModeOverlay) return;
            
            const countDisplay = self.bulkModeOverlay.querySelector('#bulk-pin-count');
            if (!countDisplay) return;
            
            const pinnedItems = self.bulkModeOverlay.querySelectorAll('.bulk-pin-activity.pinned');
            const count = pinnedItems.length;
            
            countDisplay.textContent = `${count} ${count === 1 ? 'activity' : 'activities'} pinned`;
        },
        
        /**
         * Get all activities
         */
        getAllActivities: function() {
            if (window.ActivityDisplay && window.ActivityDisplay.activities) {
                return window.ActivityDisplay.activities || [];
            }
            return [];
        },
        
        /**
         * Get count of pinned activities
         */
        getPinnedCount: function() {
            const activities = this.getAllActivities();
            return activities.filter(function(activity) {
                return activity.pinned === true;
            }).length;
        },
        
        /**
         * Cleanup resources
         */
        cleanup: function() {
            const self = this;
            
            if (self.bulkModeActive) {
                self.exitBulkMode();
            }
            
            // Clear event listeners
            self.eventListeners.forEach(function(listener) {
                listener.element.removeEventListener(listener.event, listener.handler);
            });
            self.eventListeners = [];
        }
    };
    
    // Export to global scope
    window.ActivityPin = ActivityPin;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            ActivityPin.init();
        });
    } else {
        // DOM already loaded
        setTimeout(() => ActivityPin.init(), 100);
    }
    
})();