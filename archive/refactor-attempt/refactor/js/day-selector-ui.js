/**
 * Day Selector UI for StackMap
 * UI component for Today/Tomorrow day selection
 * Story #108 - Critical Core Functionality
 */

(function() {
    'use strict';
    
    const DaySelectorUI = {
        // State
        isInitialized: false,
        container: null,
        todayButton: null,
        tomorrowButton: null,
        somedayButton: null,
        isTransitioning: false,
        
        /**
         * Initialize the day selector UI
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Find container
            self.container = document.querySelector('.day-selector');
            if (!self.container) {
                console.error('DaySelectorUI: Day selector container not found');
                return false;
            }
            
            // Find buttons
            self.todayButton = self.container.querySelector('[data-day="today"]');
            self.tomorrowButton = self.container.querySelector('[data-day="tomorrow"]');
            self.somedayButton = self.container.querySelector('[data-day="someday"]');
            
            if (!self.todayButton || !self.tomorrowButton || !self.somedayButton) {
                console.error('DaySelectorUI: Day selector buttons not found');
                return false;
            }
            
            // Set up event listeners
            self.bindEvents();
            
            // Listen to day manager changes
            if (window.DayManager) {
                window.DayManager.on('dayChanged', function(data) {
                    self.updateActiveDay(data.currentDay, data.fromNavigation);
                });
            }
            
            // Update initial state
            if (window.DayManager) {
                self.updateActiveDay(window.DayManager.getCurrentDay());
            }
            
            self.isInitialized = true;
            console.log('DaySelectorUI: Initialized');
            return true;
        },
        
        /**
         * Bind event listeners
         */
        bindEvents: function() {
            const self = this;
            
            // Today button
            self.todayButton.addEventListener('click', function(event) {
                event.preventDefault();
                self.handleDayClick('today');
            });
            
            // Tomorrow button
            self.tomorrowButton.addEventListener('click', function(event) {
                event.preventDefault();
                self.handleDayClick('tomorrow');
            });
            
            // Someday button
            self.somedayButton.addEventListener('click', function(event) {
                event.preventDefault();
                self.handleDayClick('someday');
            });
            
            // Keyboard navigation
            self.container.addEventListener('keydown', function(event) {
                self.handleKeydown(event);
            });
            
            // Touch/swipe support (optional)
            if (self.isTouchDevice()) {
                self.setupSwipeGestures();
            }
        },
        
        /**
         * Handle day button click
         */
        handleDayClick: function(day) {
            const self = this;
            
            // Prevent clicks during transition
            if (self.isTransitioning) {
                return;
            }
            
            // Switch day via DayManager
            if (window.DayManager) {
                window.DayManager.setDay(day);
            } else {
                console.error('DaySelectorUI: DayManager not available');
            }
        },
        
        /**
         * Handle keyboard navigation
         */
        handleKeydown: function(event) {
            const self = this;
            
            const currentDay = window.DayManager ? window.DayManager.getCurrentDay() : 'today';
            
            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    if (currentDay === 'tomorrow') {
                        self.handleDayClick('today');
                    } else if (currentDay === 'someday') {
                        self.handleDayClick('tomorrow');
                    }
                    break;
                    
                case 'ArrowRight':
                    event.preventDefault();
                    if (currentDay === 'today') {
                        self.handleDayClick('tomorrow');
                    } else if (currentDay === 'tomorrow') {
                        self.handleDayClick('someday');
                    }
                    break;
                    
                case 'Home':
                    event.preventDefault();
                    self.handleDayClick('today');
                    break;
                    
                case 'End':
                    event.preventDefault();
                    self.handleDayClick('someday');
                    break;
                    
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    const focused = document.activeElement;
                    if (focused === self.todayButton) {
                        self.handleDayClick('today');
                    } else if (focused === self.tomorrowButton) {
                        self.handleDayClick('tomorrow');
                    } else if (focused === self.somedayButton) {
                        self.handleDayClick('someday');
                    }
                    break;
            }
        },
        
        /**
         * Update active day visual state
         */
        updateActiveDay: function(day, skipTransition) {
            const self = this;
            
            // Update ARIA states and active classes
            const buttons = [
                { button: self.todayButton, day: 'today' },
                { button: self.tomorrowButton, day: 'tomorrow' },
                { button: self.somedayButton, day: 'someday' }
            ];
            
            buttons.forEach(function(item) {
                if (item.button) {
                    const isActive = item.day === day;
                    item.button.setAttribute('aria-selected', isActive ? 'true' : 'false');
                    if (isActive) {
                        item.button.classList.add('active');
                    } else {
                        item.button.classList.remove('active');
                    }
                }
            });
            
            // Update container state
            self.container.setAttribute('data-current-day', day);
            
            // Announce to screen readers
            self.announceToScreenReader(day);
            
            // Trigger activity display update with transition
            if (!skipTransition) {
                self.triggerActivityTransition(day);
            }
            
            // Update activity counts
            self.updateActivityCounts();
        },
        
        /**
         * Announce day change to screen readers
         */
        announceToScreenReader: function(day) {
            const messages = {
                'today': 'Viewing today\'s activities',
                'tomorrow': 'Viewing tomorrow\'s activities',
                'someday': 'Viewing someday activities'
            };
            const message = messages[day] || `Viewing ${day} activities`;
            
            // Create or update live region
            let liveRegion = document.getElementById('day-change-announcement');
            if (!liveRegion) {
                liveRegion = document.createElement('div');
                liveRegion.id = 'day-change-announcement';
                liveRegion.setAttribute('aria-live', 'polite');
                liveRegion.setAttribute('aria-atomic', 'true');
                liveRegion.style.position = 'absolute';
                liveRegion.style.left = '-10000px';
                liveRegion.style.width = '1px';
                liveRegion.style.height = '1px';
                liveRegion.style.overflow = 'hidden';
                document.body.appendChild(liveRegion);
            }
            
            liveRegion.textContent = message;
        },
        
        /**
         * Trigger activity display transition
         */
        triggerActivityTransition: function(day) {
            const self = this;
            
            if (self.isTransitioning) return;
            
            self.isTransitioning = true;
            
            // Get activity container
            const activityContainer = document.getElementById('activity-container') || 
                                    document.getElementById('activities');
            
            if (!activityContainer) {
                self.isTransitioning = false;
                return;
            }
            
            // Check for reduced motion preference
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            if (prefersReducedMotion) {
                // Skip transition, just update immediately
                self.updateActivityDisplay();
                self.isTransitioning = false;
            } else {
                // Fade out current activities
                activityContainer.style.opacity = '0';
                activityContainer.style.transition = 'opacity 150ms ease-out';
                
                // Wait for fade out, then update and fade in
                setTimeout(function() {
                    self.updateActivityDisplay();
                    
                    // Scroll to top
                    if (activityContainer.scrollTop > 0) {
                        activityContainer.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    
                    // Fade in new activities
                    setTimeout(function() {
                        activityContainer.style.opacity = '1';
                        activityContainer.style.transition = 'opacity 150ms ease-in';
                        
                        // Clear transition after completion
                        setTimeout(function() {
                            activityContainer.style.transition = '';
                            self.isTransitioning = false;
                        }, 150);
                    }, 50);
                }, 150);
            }
        },
        
        /**
         * Update activity display for current day
         */
        updateActivityDisplay: function() {
            // Trigger activity display refresh
            if (window.ActivityDisplay && window.ActivityDisplay.render) {
                window.ActivityDisplay.render();
            } else if (window.TaskDisplay && window.TaskDisplay.render) {
                window.TaskDisplay.render();
            }
        },
        
        /**
         * Update activity count badges
         */
        updateActivityCounts: function() {
            const self = this;
            
            // Get activities
            let activities = [];
            if (window.ActivityDisplay && window.ActivityDisplay.activities) {
                activities = window.ActivityDisplay.activities;
            } else if (window.TaskDisplay && window.TaskDisplay.tasks) {
                activities = window.TaskDisplay.tasks;
            }
            
            if (!window.DayManager || activities.length === 0) return;
            
            // Count activities for each day
            const todayCount = window.DayManager.getActivityCountForDay(activities, 'today');
            const tomorrowCount = window.DayManager.getActivityCountForDay(activities, 'tomorrow');
            const somedayCount = window.DayManager.getActivityCountForDay(activities, 'someday');
            
            // Update count badges
            self.updateCountBadge(self.todayButton, todayCount);
            self.updateCountBadge(self.tomorrowButton, tomorrowCount);
            self.updateCountBadge(self.somedayButton, somedayCount);
        },
        
        /**
         * Update count badge for button
         */
        updateCountBadge: function(button, count) {
            if (!button) return;
            
            let badge = button.querySelector('.day-count-badge');
            
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'day-count-badge';
                    badge.setAttribute('aria-hidden', 'true');
                    button.appendChild(badge);
                }
                badge.textContent = count.toString();
            } else if (badge) {
                badge.remove();
            }
        },
        
        /**
         * Check if device supports touch
         */
        isTouchDevice: function() {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },
        
        /**
         * Setup swipe gestures for mobile
         */
        setupSwipeGestures: function() {
            const self = this;
            
            let startX = 0;
            let startY = 0;
            let threshold = 50; // Minimum swipe distance
            
            self.container.addEventListener('touchstart', function(event) {
                const touch = event.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
            }, { passive: true });
            
            self.container.addEventListener('touchend', function(event) {
                if (self.isTransitioning) return;
                
                const touch = event.changedTouches[0];
                const diffX = touch.clientX - startX;
                const diffY = touch.clientY - startY;
                
                // Only handle horizontal swipes
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
                    event.preventDefault();
                    
                    const currentDay = window.DayManager ? window.DayManager.getCurrentDay() : 'today';
                    
                    if (diffX > 0) {
                        // Swipe right - go to previous timeframe
                        if (currentDay === 'tomorrow') {
                            self.handleDayClick('today');
                        } else if (currentDay === 'someday') {
                            self.handleDayClick('tomorrow');
                        }
                    } else {
                        // Swipe left - go to next timeframe
                        if (currentDay === 'today') {
                            self.handleDayClick('tomorrow');
                        } else if (currentDay === 'tomorrow') {
                            self.handleDayClick('someday');
                        }
                    }
                }
            }, { passive: false });
        },
        
        /**
         * Get current day from UI state
         */
        getCurrentDay: function() {
            if (this.todayButton && this.todayButton.classList.contains('active')) {
                return 'today';
            }
            if (this.tomorrowButton && this.tomorrowButton.classList.contains('active')) {
                return 'tomorrow';
            }
            if (this.somedayButton && this.somedayButton.classList.contains('active')) {
                return 'someday';
            }
            return 'today'; // Default fallback
        },
        
        /**
         * Show loading state
         */
        showLoading: function() {
            const self = this;
            
            if (self.todayButton) self.todayButton.disabled = true;
            if (self.tomorrowButton) self.tomorrowButton.disabled = true;
            if (self.somedayButton) self.somedayButton.disabled = true;
            
            if (self.container) {
                self.container.classList.add('loading');
            }
        },
        
        /**
         * Hide loading state
         */
        hideLoading: function() {
            const self = this;
            
            if (self.todayButton) self.todayButton.disabled = false;
            if (self.tomorrowButton) self.tomorrowButton.disabled = false;
            if (self.somedayButton) self.somedayButton.disabled = false;
            
            if (self.container) {
                self.container.classList.remove('loading');
            }
        }
    };
    
    // Export to global scope
    window.DaySelectorUI = DaySelectorUI;
    
})();