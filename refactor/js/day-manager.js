/**
 * Day Manager for StackMap
 * Core day state management for Today/Tomorrow switching
 * Story #108 - Critical Core Functionality
 */

(function() {
    'use strict';
    
    const DayManager = {
        // Constants
        TIMEFRAMES: ['today', 'tomorrow', 'someday'],
        
        // State
        currentDay: 'today', // 'today' | 'tomorrow' | 'someday'
        listeners: {},
        isInitialized: false,
        
        /**
         * Initialize the day manager
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Load from URL first, then localStorage, then default
            self.loadFromURL() || self.loadFromStorage() || self.setDay('today');
            
            // Set up browser navigation
            self.setupBrowserNavigation();
            
            // Set up keyboard shortcuts
            self.setupKeyboardShortcuts();
            
            self.isInitialized = true;
            console.log('DayManager: Initialized with day', self.currentDay);
        },
        
        /**
         * Get current day
         */
        getCurrentDay: function() {
            return this.currentDay;
        },
        
        /**
         * Set current day
         */
        setDay: function(day, silent) {
            const self = this;
            
            if (!self.TIMEFRAMES.includes(day)) {
                console.warn('DayManager: Invalid day', day);
                return false;
            }
            
            if (self.currentDay === day) {
                return true; // No change needed
            }
            
            const previousDay = self.currentDay;
            self.currentDay = day;
            
            // Update URL and storage
            self.updateURL();
            self.saveToStorage();
            
            // Notify listeners unless silent
            if (!silent) {
                self.emit('dayChanged', {
                    currentDay: day,
                    previousDay: previousDay
                });
            }
            
            console.log('DayManager: Switched to', day);
            return true;
        },
        
        /**
         * Check if current day is today
         */
        isToday: function() {
            return this.currentDay === 'today';
        },
        
        /**
         * Check if current day is tomorrow
         */
        isTomorrow: function() {
            return this.currentDay === 'tomorrow';
        },
        
        /**
         * Check if current day is someday
         */
        isSomeday: function() {
            return this.currentDay === 'someday';
        },
        
        /**
         * Switch to today
         */
        switchToToday: function() {
            return this.setDay('today');
        },
        
        /**
         * Switch to tomorrow
         */
        switchToTomorrow: function() {
            return this.setDay('tomorrow');
        },
        
        /**
         * Switch to someday
         */
        switchToSomeday: function() {
            return this.setDay('someday');
        },
        
        /**
         * Toggle between today and tomorrow
         */
        toggle: function() {
            return this.setDay(this.isToday() ? 'tomorrow' : 'today');
        },
        
        /**
         * Move activity between timeframes
         */
        moveTo: function(activityId, timeframe) {
            const self = this;
            
            if (!self.TIMEFRAMES.includes(timeframe)) {
                console.warn('DayManager: Invalid timeframe for move', timeframe);
                return false;
            }
            
            // Emit move event for other systems to handle
            self.emit('activityMoved', {
                activityId: activityId,
                fromTimeframe: self.currentDay,
                toTimeframe: timeframe
            });
            
            return true;
        },
        
        /**
         * Add event listener
         */
        on: function(event, callback) {
            const self = this;
            
            if (!self.listeners[event]) {
                self.listeners[event] = [];
            }
            
            self.listeners[event].push(callback);
        },
        
        /**
         * Remove event listener
         */
        off: function(event, callback) {
            const self = this;
            
            if (!self.listeners[event]) return;
            
            const index = self.listeners[event].indexOf(callback);
            if (index > -1) {
                self.listeners[event].splice(index, 1);
            }
        },
        
        /**
         * Emit event to listeners
         */
        emit: function(event, data) {
            const self = this;
            
            if (!self.listeners[event]) return;
            
            self.listeners[event].forEach(function(callback) {
                try {
                    callback(data);
                } catch (error) {
                    console.error('DayManager: Error in event listener', error);
                }
            });
        },
        
        /**
         * Update URL to reflect current day
         */
        updateURL: function() {
            const self = this;
            
            try {
                const url = new URL(window.location);
                
                if (self.currentDay === 'today') {
                    url.searchParams.delete('day');
                } else {
                    url.searchParams.set('day', self.currentDay);
                }
                
                // Update URL without page reload
                window.history.replaceState({ day: self.currentDay }, '', url);
            } catch (error) {
                console.warn('DayManager: Failed to update URL', error);
            }
        },
        
        /**
         * Load day from URL
         */
        loadFromURL: function() {
            const self = this;
            
            try {
                const url = new URL(window.location);
                const dayParam = url.searchParams.get('day');
                
                if (self.TIMEFRAMES.includes(dayParam)) {
                    self.currentDay = dayParam;
                    return true;
                }
            } catch (error) {
                console.warn('DayManager: Failed to load from URL', error);
            }
            
            return false;
        },
        
        /**
         * Save current day to localStorage
         */
        saveToStorage: function() {
            const self = this;
            
            try {
                localStorage.setItem('stackmap_current_day', self.currentDay);
            } catch (error) {
                console.warn('DayManager: Failed to save to storage', error);
            }
        },
        
        /**
         * Load day from localStorage
         */
        loadFromStorage: function() {
            const self = this;
            
            try {
                const storedDay = localStorage.getItem('stackmap_current_day');
                if (self.TIMEFRAMES.includes(storedDay)) {
                    self.currentDay = storedDay;
                    return true;
                }
            } catch (error) {
                console.warn('DayManager: Failed to load from storage', error);
            }
            
            return false;
        },
        
        /**
         * Set up browser navigation handling
         */
        setupBrowserNavigation: function() {
            const self = this;
            
            window.addEventListener('popstate', function(event) {
                if (event.state && event.state.day) {
                    self.setDay(event.state.day, true);
                    
                    // Notify listeners about URL change
                    self.emit('dayChanged', {
                        currentDay: self.currentDay,
                        previousDay: self.currentDay === 'today' ? 'tomorrow' : 'today',
                        fromNavigation: true
                    });
                } else {
                    // Load from current URL
                    self.loadFromURL();
                }
            });
        },
        
        /**
         * Set up keyboard shortcuts
         */
        setupKeyboardShortcuts: function() {
            const self = this;
            
            document.addEventListener('keydown', function(event) {
                // Only handle shortcuts when not typing in input fields
                if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                    return;
                }
                
                // Only handle if no modifiers are pressed
                if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
                    return;
                }
                
                switch (event.key.toLowerCase()) {
                    case 't':
                        if (self.currentDay !== 'today') {
                            event.preventDefault();
                            self.switchToToday();
                        }
                        break;
                        
                    case 'm':
                        if (self.currentDay !== 'tomorrow') {
                            event.preventDefault();
                            self.switchToTomorrow();
                        }
                        break;
                        
                    case 's':
                        if (self.currentDay !== 'someday') {
                            event.preventDefault();
                            self.switchToSomeday();
                        }
                        break;
                }
            });
        },
        
        /**
         * Get display name for current day
         */
        getCurrentDayDisplayName: function() {
            const displayNames = {
                'today': 'Today',
                'tomorrow': 'Tomorrow',
                'someday': 'Someday'
            };
            return displayNames[this.currentDay] || this.currentDay;
        },
        
        /**
         * Get activity filter for current day
         */
        getActivityFilter: function() {
            return {
                day: this.currentDay
            };
        },
        
        /**
         * Check if an activity belongs to current day
         */
        isActivityForCurrentDay: function(activity) {
            const self = this;
            
            if (!activity) return false;
            
            // Check if activity has day property
            if (activity.day) {
                return activity.day === self.currentDay;
            }
            
            // Default to today if no day specified
            return self.currentDay === 'today';
        },
        
        /**
         * Get activities for current day
         */
        filterActivitiesForCurrentDay: function(activities) {
            const self = this;
            
            if (!activities || !Array.isArray(activities)) {
                return [];
            }
            
            return activities.filter(function(activity) {
                return self.isActivityForCurrentDay(activity);
            });
        },
        
        /**
         * Get count of activities for specified day
         */
        getActivityCountForDay: function(activities, day) {
            if (!activities || !Array.isArray(activities)) {
                return 0;
            }
            
            return activities.filter(function(activity) {
                if (activity.day) {
                    return activity.day === day;
                }
                // Default to today if no day specified
                return day === 'today';
            }).length;
        },
        
        /**
         * Set activity day
         */
        setActivityDay: function(activity, day) {
            if (!activity) return false;
            
            if (!this.TIMEFRAMES.includes(day)) {
                console.warn('DayManager: Invalid day for activity', day);
                return false;
            }
            
            activity.day = day;
            activity.timeframe = day; // Support both day and timeframe properties
            activity.updated_at = new Date().toISOString();
            
            return true;
        },
        
        /**
         * Get all activities for a specific timeframe
         */
        getActivitiesForTimeframe: function(activities, timeframe) {
            if (!activities || !Array.isArray(activities)) {
                return [];
            }
            
            return activities.filter(function(activity) {
                return activity.day === timeframe || activity.timeframe === timeframe;
            });
        },
        
        /**
         * Get someday activities
         */
        getSomedayActivities: function(activities) {
            return this.getActivitiesForTimeframe(activities, 'someday');
        }
    };
    
    // Export to global scope
    window.DayManager = DayManager;
    
})();