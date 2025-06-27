/**
 * Someday Manager for StackMap
 * Manages someday-specific features like quick actions, age indicators, and empty states
 * Story #111 - Round 7 Dev2
 */

(function() {
    'use strict';
    
    const SomedayManager = {
        isInitialized: false,
        
        /**
         * Initialize the someday manager
         */
        init: function() {
            if (this.isInitialized) return;
            
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('SomedayManager: Initialized');
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Listen for card rendering to add quick actions
            document.addEventListener('activity-card-rendered', function(e) {
                if (e.detail && e.detail.activity) {
                    self.enhanceActivityCard(e.detail.card, e.detail.activity);
                }
            });
            
            // Listen for day changes to update empty states
            if (window.DayManager) {
                window.DayManager.on('dayChanged', function(data) {
                    if (data.currentDay === 'someday') {
                        self.showSomedayEmptyStateIfNeeded();
                    }
                });
            }
            
            // Handle quick action clicks
            document.addEventListener('click', function(e) {
                if (e.target.matches('.quick-action-btn[data-action]')) {
                    self.handleQuickAction(e);
                }
            });
        },
        
        /**
         * Enhance activity card with someday-specific features
         */
        enhanceActivityCard: function(card, activity) {
            if (!card || !activity) return;
            
            const currentTimeframe = window.DayManager ? window.DayManager.getCurrentDay() : 'today';
            const activityTimeframe = activity.day || activity.timeframe || 'today';
            
            // Add someday class if in someday timeframe
            if (activityTimeframe === 'someday') {
                card.classList.add('someday-card');
                this.addAgeIndicator(card, activity);
                this.addQuickActions(card, activity);
            }
            
            // Add timeframe indicator for all cards
            this.addTimeframeIndicator(card, activity);
        },
        
        /**
         * Add age indicator to someday cards
         */
        addAgeIndicator: function(card, activity) {
            // Calculate age
            const createdDate = new Date(activity.created_at || activity.createdAt || Date.now());
            const now = new Date();
            const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
            
            let ageCategory = 'new';
            let ageText = 'New';
            
            if (ageInDays >= 365) {
                ageCategory = 'year';
                ageText = '1+ year';
            } else if (ageInDays >= 30) {
                ageCategory = 'month';
                ageText = `${Math.floor(ageInDays / 30)}+ month${Math.floor(ageInDays / 30) > 1 ? 's' : ''}`;
            } else if (ageInDays >= 7) {
                ageCategory = 'week';
                ageText = `${Math.floor(ageInDays / 7)}+ week${Math.floor(ageInDays / 7) > 1 ? 's' : ''}`;
            } else if (ageInDays > 0) {
                ageCategory = 'new';
                ageText = `${ageInDays} day${ageInDays > 1 ? 's' : ''}`;
            }
            
            // Add age class
            card.classList.add(`age-${ageCategory}`);
            
            // Add age indicator element
            let ageIndicator = card.querySelector('.age-indicator');
            if (!ageIndicator) {
                ageIndicator = document.createElement('div');
                ageIndicator.className = 'age-indicator';
                card.appendChild(ageIndicator);
            }
            
            ageIndicator.textContent = ageText;
            ageIndicator.setAttribute('aria-label', `Added ${ageText} ago`);
        },
        
        /**
         * Add timeframe indicator to cards
         */
        addTimeframeIndicator: function(card, activity) {
            const timeframe = activity.day || activity.timeframe || 'today';
            
            // Don't add indicator if we're viewing that timeframe (it's obvious)
            const currentTimeframe = window.DayManager ? window.DayManager.getCurrentDay() : 'today';
            if (timeframe === currentTimeframe) return;
            
            // Remove existing indicators
            const existing = card.querySelector('.card-timeframe');
            if (existing) existing.remove();
            
            // Create timeframe indicator
            const indicator = document.createElement('div');
            indicator.className = `card-timeframe timeframe-indicator ${timeframe}`;
            
            const icons = {
                'today': '☀️',
                'tomorrow': '🌙',
                'someday': '💭'
            };
            
            const labels = {
                'today': 'Today',
                'tomorrow': 'Tomorrow',
                'someday': 'Someday'
            };
            
            indicator.innerHTML = `
                <span class="timeframe-icon">${icons[timeframe] || '📅'}</span>
                <span class="timeframe-label">${labels[timeframe] || timeframe}</span>
            `;
            
            // Add to card header or top
            const cardHeader = card.querySelector('.card-header') || card;
            cardHeader.appendChild(indicator);
        },
        
        /**
         * Add quick actions to someday cards
         */
        addQuickActions: function(card, activity) {
            // Only add to someday cards
            if ((activity.day || activity.timeframe) !== 'someday') return;
            
            // Don't add if already exists
            if (card.querySelector('.quick-actions')) return;
            
            const quickActions = document.createElement('div');
            quickActions.className = 'quick-actions';
            quickActions.innerHTML = `
                <button class="quick-action-btn move-to-today" 
                        data-action="move-to-today" 
                        data-activity-id="${activity.id}"
                        aria-label="Move to Today">
                    ☀️ → Today
                </button>
                <button class="quick-action-btn move-to-tomorrow" 
                        data-action="move-to-tomorrow" 
                        data-activity-id="${activity.id}"
                        aria-label="Move to Tomorrow">
                    🌙 → Tomorrow
                </button>
            `;
            
            // Add to card
            card.appendChild(quickActions);
        },
        
        /**
         * Handle quick action clicks
         */
        handleQuickAction: function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target;
            const action = button.getAttribute('data-action');
            const activityId = button.getAttribute('data-activity-id');
            
            if (!activityId) return;
            
            // Get activity
            const activity = this.getActivityById(activityId);
            if (!activity) return;
            
            switch (action) {
                case 'move-to-today':
                    this.moveActivityToTimeframe(activity, 'today');
                    break;
                case 'move-to-tomorrow':
                    this.moveActivityToTimeframe(activity, 'tomorrow');
                    break;
            }
        },
        
        /**
         * Move activity to different timeframe
         */
        moveActivityToTimeframe: function(activity, targetTimeframe) {
            const previousTimeframe = activity.day || activity.timeframe || 'today';
            
            if (window.DayManager) {
                // Update activity data
                window.DayManager.setActivityDay(activity, targetTimeframe);
                
                // Save activity
                if (window.ActivityDisplay && window.ActivityDisplay.saveActivity) {
                    window.ActivityDisplay.saveActivity(activity);
                } else if (window.TaskDisplay && window.TaskDisplay.saveTask) {
                    window.TaskDisplay.saveTask(activity);
                }
                
                // Refresh display
                this.refreshDisplay();
                
                // Show notification
                const timeframeNames = {
                    'today': 'Today',
                    'tomorrow': 'Tomorrow',
                    'someday': 'Someday'
                };
                
                this.showMoveNotification(
                    activity.text || activity.title || 'Activity',
                    timeframeNames[targetTimeframe]
                );
                
                // Announce to screen readers
                if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                    window.StackMapKeyboardNav.announce(
                        `Moved ${activity.text || activity.title} from ${timeframeNames[previousTimeframe]} to ${timeframeNames[targetTimeframe]}`
                    );
                }
            }
        },
        
        /**
         * Get activity by ID
         */
        getActivityById: function(activityId) {
            if (window.ActivityDisplay && window.ActivityDisplay.getActivityById) {
                return window.ActivityDisplay.getActivityById(activityId);
            }
            
            // Fallback: search through activities array
            if (window.ActivityDisplay && window.ActivityDisplay.activities) {
                const activities = window.ActivityDisplay.activities;
                for (let i = 0; i < activities.length; i++) {
                    if (activities[i].id === activityId) {
                        return activities[i];
                    }
                }
            }
            
            // TaskDisplay fallback
            if (window.TaskDisplay && window.TaskDisplay.tasks) {
                const tasks = window.TaskDisplay.tasks;
                for (let i = 0; i < tasks.length; i++) {
                    if (tasks[i].id === activityId) {
                        return tasks[i];
                    }
                }
            }
            
            return null;
        },
        
        /**
         * Refresh activity display
         */
        refreshDisplay: function() {
            if (window.ActivityDisplay && window.ActivityDisplay.render) {
                window.ActivityDisplay.render();
            } else if (window.TaskDisplay && window.TaskDisplay.render) {
                window.TaskDisplay.render();
            }
            
            // Update day selector counts
            if (window.DaySelectorUI && window.DaySelectorUI.updateActivityCounts) {
                window.DaySelectorUI.updateActivityCounts();
            }
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
         * Show someday empty state if needed
         */
        showSomedayEmptyStateIfNeeded: function() {
            const self = this;
            
            // Wait a bit for activities to load
            setTimeout(function() {
                const container = document.getElementById('activity-container') || document.getElementById('activities');
                if (!container) return;
                
                // Check if there are someday activities
                const somedayCards = container.querySelectorAll('.someday-card:not(.add-activity-card)');
                
                if (somedayCards.length === 0) {
                    self.showSomedayEmptyState(container);
                } else {
                    self.hideSomedayEmptyState();
                }
            }, 100);
        },
        
        /**
         * Show someday empty state
         */
        showSomedayEmptyState: function(container) {
            // Remove existing empty state
            this.hideSomedayEmptyState();
            
            const emptyState = document.createElement('div');
            emptyState.className = 'someday-empty-state';
            emptyState.id = 'someday-empty-state';
            emptyState.innerHTML = `
                <div class="empty-icon">🅿️💭</div>
                <h3 class="empty-title">Your idea parking lot</h3>
                <p class="empty-message">Save ideas here without pressure</p>
                <div class="empty-examples">
                    <ul>
                        <li>Learning topics</li>
                        <li>Future projects</li>
                        <li>Someday goals</li>
                        <li>Fun activities</li>
                    </ul>
                </div>
                <button class="add-someday-btn" onclick="if(window.ActivityDisplay && window.ActivityDisplay.showAddForm) window.ActivityDisplay.showAddForm()">
                    💭 Add Someday Idea
                </button>
            `;
            
            container.appendChild(emptyState);
        },
        
        /**
         * Hide someday empty state
         */
        hideSomedayEmptyState: function() {
            const existing = document.getElementById('someday-empty-state');
            if (existing) {
                existing.remove();
            }
        },
        
        /**
         * Get age category for activity
         */
        getAgeCategory: function(activity) {
            const createdDate = new Date(activity.created_at || activity.createdAt || Date.now());
            const now = new Date();
            const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
            
            if (ageInDays >= 365) return 'year';
            if (ageInDays >= 30) return 'month';
            if (ageInDays >= 7) return 'week';
            return 'new';
        },
        
        /**
         * Search someday activities
         */
        searchSomeday: function(query) {
            if (!window.DayManager) return [];
            
            const allActivities = window.ActivityDisplay ? window.ActivityDisplay.activities : 
                                 window.TaskDisplay ? window.TaskDisplay.tasks : [];
            
            const somedayActivities = window.DayManager.getSomedayActivities(allActivities);
            
            if (!query) return somedayActivities;
            
            const searchTerm = query.toLowerCase();
            return somedayActivities.filter(function(activity) {
                const title = (activity.text || activity.title || '').toLowerCase();
                const description = (activity.description || '').toLowerCase();
                return title.includes(searchTerm) || description.includes(searchTerm);
            });
        },
        
        /**
         * Get someday activities count
         */
        getSomedayCount: function() {
            if (!window.DayManager) return 0;
            
            const allActivities = window.ActivityDisplay ? window.ActivityDisplay.activities : 
                                 window.TaskDisplay ? window.TaskDisplay.tasks : [];
            
            return window.DayManager.getSomedayActivities(allActivities).length;
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            SomedayManager.init();
        });
    } else {
        SomedayManager.init();
    }
    
    // Export to global scope
    window.SomedayManager = SomedayManager;
})();