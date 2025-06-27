/**
 * Day Selector Component
 * Handles Today/Tomorrow view switching
 * ADHD-friendly with clear states and persistence
 */

(function() {
    'use strict';
    
    const DaySelector = {
        currentDay: 'today',
        buttons: null,
        container: null,
        isInitialized: false,
        activityCounts: {
            today: 0,
            tomorrow: 0
        },
        // Distress detection
        switchHistory: [],
        distressThreshold: 3, // switches
        distressTimeWindow: 5000, // 5 seconds
        // Loading state
        isUpdatingCounts: false,
        
        /**
         * Initialize the day selector
         */
        init: function() {
            const self = this;
            
            // Find container
            self.container = document.querySelector('.day-selector');
            if (!self.container) {
                console.warn('DaySelector: Container not found');
                return;
            }
            
            // Get buttons
            self.buttons = self.container.querySelectorAll('.day-selector-btn');
            if (self.buttons.length === 0) {
                console.warn('DaySelector: No buttons found');
                return;
            }
            
            // Load saved preference
            self.loadPreference();
            
            // Setup event listeners
            self.setupEventListeners();
            
            // Apply initial state
            self.updateUI();
            
            // Load initial counts
            self.updateActivityCounts();
            
            // Listen for task changes
            self.setupTaskListeners();
            
            self.isInitialized = true;
            console.log('DaySelector: Initialized with day:', self.currentDay);
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Button clicks
            self.buttons.forEach(function(button) {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    const day = this.getAttribute('data-day');
                    if (day && day !== self.currentDay) {
                        self.switchDay(day);
                    }
                });
                
                // Keyboard navigation
                button.addEventListener('keydown', function(e) {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        const currentIndex = Array.from(self.buttons).indexOf(this);
                        let targetIndex;
                        
                        if (e.key === 'ArrowLeft') {
                            targetIndex = currentIndex > 0 ? currentIndex - 1 : self.buttons.length - 1;
                        } else {
                            targetIndex = currentIndex < self.buttons.length - 1 ? currentIndex + 1 : 0;
                        }
                        
                        self.buttons[targetIndex].click();
                        self.buttons[targetIndex].focus();
                    }
                });
            });
            
            // Listen for external day change events
            document.addEventListener('changeDayView', function(e) {
                if (e.detail && e.detail.day) {
                    self.switchDay(e.detail.day);
                }
            });
        },
        
        /**
         * Switch to a different day
         */
        switchDay: function(day) {
            const self = this;
            
            if (day !== 'today' && day !== 'tomorrow') {
                console.warn('DaySelector: Invalid day:', day);
                return;
            }
            
            // Check for distress pattern
            if (self.checkDistressPattern()) {
                self.showDistressPrompt();
                return; // Prevent the switch
            }
            
            // Record switch for distress detection
            self.recordSwitch();
            
            // Update state
            self.currentDay = day;
            
            // Save preference
            self.savePreference();
            
            // Update UI
            self.updateUI();
            
            // Haptic feedback for mobile
            self.provideHapticFeedback('success');
            
            // Dispatch event for other components
            const event = new CustomEvent('dayViewChanged', {
                detail: { 
                    day: day,
                    previousDay: self.currentDay === 'today' ? 'tomorrow' : 'today'
                }
            });
            document.dispatchEvent(event);
            
            // Announce change for screen readers
            self.announceChange(day);
            
            console.log('DaySelector: Switched to', day);
        },
        
        /**
         * Update UI to reflect current state
         */
        updateUI: function() {
            const self = this;
            
            self.buttons.forEach(function(button) {
                const buttonDay = button.getAttribute('data-day');
                const isActive = buttonDay === self.currentDay;
                
                // Update classes
                button.classList.toggle('active', isActive);
                
                // Update ARIA attributes
                button.setAttribute('aria-selected', isActive.toString());
                
                // Update tab index for keyboard navigation
                button.setAttribute('tabindex', isActive ? '0' : '-1');
            });
        },
        
        /**
         * Load saved preference
         */
        loadPreference: function() {
            const self = this;
            
            try {
                // Check localStorage
                const saved = localStorage.getItem('stackmap_selected_day');
                if (saved === 'today' || saved === 'tomorrow') {
                    self.currentDay = saved;
                } else {
                    // Default to today
                    self.currentDay = 'today';
                }
                
                // Check if we need to reset to today (new day)
                const lastVisit = localStorage.getItem('stackmap_last_visit_date');
                const today = new Date().toDateString();
                
                if (lastVisit !== today) {
                    // New day, reset to today view
                    self.currentDay = 'today';
                    localStorage.setItem('stackmap_last_visit_date', today);
                }
            } catch (e) {
                console.warn('DaySelector: Could not load preference', e);
                self.currentDay = 'today';
            }
        },
        
        /**
         * Save preference
         */
        savePreference: function() {
            const self = this;
            
            try {
                localStorage.setItem('stackmap_selected_day', self.currentDay);
            } catch (e) {
                console.warn('DaySelector: Could not save preference', e);
            }
        },
        
        /**
         * Announce change for screen readers
         */
        announceChange: function(day) {
            const self = this;
            
            // Get count for the selected day
            const count = self.activityCounts[day] || 0;
            const activityText = count === 1 ? 'activity' : 'activities';
            
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'sr-only';
            announcement.textContent = `Switched to ${day} view with ${count} ${activityText}`;
            
            document.body.appendChild(announcement);
            
            setTimeout(function() {
                if (announcement.parentNode) {
                    announcement.parentNode.removeChild(announcement);
                }
            }, 2000);
        },
        
        /**
         * Get current selected day
         */
        getCurrentDay: function() {
            return this.currentDay;
        },
        
        /**
         * Check if selector is initialized
         */
        isReady: function() {
            return this.isInitialized;
        },
        
        /**
         * Setup task-related event listeners
         */
        setupTaskListeners: function() {
            const self = this;
            
            // Listen for task changes
            document.addEventListener('tasksChanged', function() {
                self.updateActivityCounts();
            });
            
            // Listen for task added
            document.addEventListener('taskAdded', function() {
                self.updateActivityCounts();
            });
            
            // Listen for task completed
            document.addEventListener('taskCompleted', function() {
                self.updateActivityCounts();
            });
            
            // Listen for task deleted
            document.addEventListener('taskDeleted', function() {
                self.updateActivityCounts();
            });
        },
        
        /**
         * Update activity counts from current tasks
         */
        updateActivityCounts: function() {
            const self = this;
            
            // Show loading state
            self.showLoadingState();
            
            // Use setTimeout to ensure UI updates
            setTimeout(function() {
                try {
                    // Reset counts
                    self.activityCounts.today = 0;
                    self.activityCounts.tomorrow = 0;
                    
                    // Get tasks from appropriate source
                    let tasks = [];
                    
                    // Try different sources for tasks
                    if (window.TaskDisplay && window.TaskDisplay.tasks) {
                        tasks = window.TaskDisplay.tasks;
                    } else if (window.TodayTomorrowView && window.TodayTomorrowView.tasks) {
                        tasks = window.TodayTomorrowView.tasks;
                    } else {
                        // Try to load from storage
                        try {
                            const stored = localStorage.getItem('stackmap_tasks');
                            if (stored) {
                                tasks = JSON.parse(stored);
                            }
                        } catch (e) {
                            console.warn('DaySelector: Could not load tasks for counts', e);
                            self.showCountError();
                            self.hideLoadingState();
                            self.provideHapticFeedback('error');
                            return;
                        }
                    }
                    
                    // Count tasks by day
                    const counts = { today: 0, tomorrow: 0 };
                    tasks.forEach(function(task) {
                        if (task.completed) return; // Skip completed tasks
                        
                        // Handle both 'day' and 'timeframe' fields for compatibility
                        const day = task.day || task.timeframe || 'someday';
                        
                        if (day === 'today') {
                            counts.today++;
                        } else if (day === 'tomorrow') {
                            counts.tomorrow++;
                        }
                    });
                    
                    // Verify counts if possible
                    const verified = self.verifyCounts(counts);
                    
                    // Update stored counts
                    self.activityCounts.today = verified.today;
                    self.activityCounts.tomorrow = verified.tomorrow;
                    
                    // Update UI with counts
                    self.updateCountsDisplay();
                    
                } catch (error) {
                    console.error('Failed to update counts:', error);
                    self.showCountError();
                } finally {
                    // Hide loading state
                    self.hideLoadingState();
                }
            }, 50); // Small delay to ensure loading state is visible
        },
        
        /**
         * Update the counts display in the UI
         */
        updateCountsDisplay: function() {
            const self = this;
            
            self.buttons.forEach(function(button) {
                const day = button.getAttribute('data-day');
                const count = self.activityCounts[day] || 0;
                
                // Find or create count element
                let countElement = button.querySelector('.day-count');
                if (!countElement) {
                    countElement = document.createElement('span');
                    countElement.className = 'day-count';
                    button.appendChild(countElement);
                }
                
                // Update count text
                countElement.textContent = `(${count})`;
                
                // Update aria-label for accessibility
                const label = button.querySelector('.day-label');
                if (label) {
                    const dayText = label.textContent;
                    button.setAttribute('aria-label', `${dayText} - ${count} ${count === 1 ? 'activity' : 'activities'}`);
                }
            });
            
            // Announce count updates
            const todayCount = self.activityCounts.today || 0;
            const tomorrowCount = self.activityCounts.tomorrow || 0;
            self.announceState(`Activity counts updated: ${todayCount} for today, ${tomorrowCount} for tomorrow`);
        },
        
        /**
         * Record a switch for distress detection
         */
        recordSwitch: function() {
            const self = this;
            const now = Date.now();
            
            // Add timestamp to history
            self.switchHistory.push(now);
            
            // Clean old entries outside the time window
            self.switchHistory = self.switchHistory.filter(function(timestamp) {
                return now - timestamp < self.distressTimeWindow;
            });
            
            // Log to analytics if available
            if (window.Analytics && window.Analytics.log) {
                window.Analytics.log('day_switch', {
                    count: self.switchHistory.length,
                    timeWindow: self.distressTimeWindow
                });
            }
        },
        
        /**
         * Check if user is showing distress pattern
         */
        checkDistressPattern: function() {
            const self = this;
            
            // Clean history first
            const now = Date.now();
            self.switchHistory = self.switchHistory.filter(function(timestamp) {
                return now - timestamp < self.distressTimeWindow;
            });
            
            // Check if threshold exceeded
            return self.switchHistory.length >= self.distressThreshold;
        },
        
        /**
         * Show distress prompt
         */
        showDistressPrompt: function() {
            const self = this;
            
            // Create or find prompt element
            let prompt = document.getElementById('distress-prompt');
            if (!prompt) {
                prompt = document.createElement('div');
                prompt.id = 'distress-prompt';
                prompt.className = 'distress-prompt';
                prompt.setAttribute('role', 'alert');
                prompt.setAttribute('aria-live', 'assertive');
                
                const message = document.createElement('p');
                message.textContent = 'Feeling overwhelmed? Take a deep breath. ';
                
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = 'Take a 5-minute break';
                link.onclick = function(e) {
                    e.preventDefault();
                    self.handleBreakRequest();
                };
                
                const dismiss = document.createElement('button');
                dismiss.className = 'distress-dismiss';
                dismiss.textContent = '×';
                dismiss.setAttribute('aria-label', 'Dismiss');
                dismiss.onclick = function() {
                    self.dismissDistressPrompt();
                };
                
                prompt.appendChild(message);
                message.appendChild(link);
                prompt.appendChild(dismiss);
                
                // Insert after day selector
                self.container.parentNode.insertBefore(prompt, self.container.nextSibling);
            }
            
            // Show prompt
            prompt.style.display = 'block';
            prompt.classList.add('visible');
            
            // Auto-hide after 10 seconds
            setTimeout(function() {
                self.dismissDistressPrompt();
            }, 10000);
            
            // Clear switch history to reset detection
            self.switchHistory = [];
            
            // Log to analytics
            if (window.Analytics && window.Analytics.log) {
                window.Analytics.log('distress_detected', {
                    trigger: 'rapid_day_switching'
                });
            }
        },
        
        /**
         * Dismiss distress prompt
         */
        dismissDistressPrompt: function() {
            const prompt = document.getElementById('distress-prompt');
            if (prompt) {
                prompt.classList.remove('visible');
                setTimeout(function() {
                    prompt.style.display = 'none';
                }, 300);
            }
        },
        
        /**
         * Handle break request
         */
        handleBreakRequest: function() {
            const self = this;
            
            // Dismiss prompt
            self.dismissDistressPrompt();
            
            // Show break timer if available
            if (window.BreakTimer && window.BreakTimer.start) {
                window.BreakTimer.start(5 * 60); // 5 minutes
            } else {
                // Simple alert fallback
                alert('Great choice! Step away from the screen for 5 minutes. Stretch, breathe, or grab some water. You\'ve got this! 💙');
            }
            
            // Log to analytics
            if (window.Analytics && window.Analytics.log) {
                window.Analytics.log('break_started', {
                    trigger: 'distress_prompt'
                });
            }
        },
        
        /**
         * Show loading state
         */
        showLoadingState: function() {
            const self = this;
            
            self.isUpdatingCounts = true;
            self.container.classList.add('loading');
            
            // Announce loading state
            self.announceState('Loading activity counts...');
            
            // Disable buttons during update
            self.buttons.forEach(function(button) {
                button.disabled = true;
                
                // Show loading indicator in count
                let countElement = button.querySelector('.day-count');
                if (countElement) {
                    countElement.setAttribute('data-original', countElement.textContent);
                    countElement.textContent = '(...)';
                    countElement.classList.add('loading');
                }
            });
        },
        
        /**
         * Hide loading state
         */
        hideLoadingState: function() {
            const self = this;
            
            self.isUpdatingCounts = false;
            self.container.classList.remove('loading');
            
            // Re-enable buttons
            self.buttons.forEach(function(button) {
                button.disabled = false;
                
                // Remove loading indicator
                let countElement = button.querySelector('.day-count');
                if (countElement) {
                    countElement.classList.remove('loading');
                }
            });
        },
        
        /**
         * Show count error state
         */
        showCountError: function() {
            const self = this;
            
            self.buttons.forEach(function(button) {
                let countElement = button.querySelector('.day-count');
                if (countElement) {
                    // Show cached count with warning
                    const cached = countElement.getAttribute('data-original') || '(?)';
                    countElement.textContent = cached;
                    countElement.classList.add('error');
                    countElement.setAttribute('title', 'Count may be outdated');
                }
            });
            
            // Show error notification
            const notification = document.createElement('div');
            notification.className = 'count-error-notification';
            notification.textContent = 'Could not update activity counts';
            notification.setAttribute('role', 'alert');
            
            self.container.appendChild(notification);
            
            // Announce error to screen readers
            self.announceState('Error: Could not update activity counts. Showing cached values.');
            
            // Remove after 3 seconds
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        },
        
        /**
         * Verify counts against multiple sources
         */
        verifyCounts: function(counts) {
            const self = this;
            const verified = { today: counts.today, tomorrow: counts.tomorrow };
            
            // Try to cross-check with TodayTomorrowView if available
            if (window.TodayTomorrowView && window.TodayTomorrowView.cachedFilters) {
                const cached = window.TodayTomorrowView.cachedFilters;
                
                // Check for discrepancies
                let hasDiscrepancy = false;
                
                if (cached.today && cached.today.length !== counts.today) {
                    console.warn('DaySelector: Count mismatch for today:', {
                        calculated: counts.today,
                        cached: cached.today.length
                    });
                    hasDiscrepancy = true;
                }
                
                if (cached.tomorrow && cached.tomorrow.length !== counts.tomorrow) {
                    console.warn('DaySelector: Count mismatch for tomorrow:', {
                        calculated: counts.tomorrow,
                        cached: cached.tomorrow.length
                    });
                    hasDiscrepancy = true;
                }
                
                // If discrepancy found, show confidence indicator
                if (hasDiscrepancy) {
                    self.showConfidenceWarning();
                    
                    // Log for debugging
                    if (window.Analytics && window.Analytics.log) {
                        window.Analytics.log('count_discrepancy', {
                            today: { calculated: counts.today, cached: cached.today ? cached.today.length : null },
                            tomorrow: { calculated: counts.tomorrow, cached: cached.tomorrow ? cached.tomorrow.length : null }
                        });
                    }
                }
            }
            
            return verified;
        },
        
        /**
         * Show confidence warning for count mismatches
         */
        showConfidenceWarning: function() {
            const self = this;
            
            // Add visual indicator to counts
            self.buttons.forEach(function(button) {
                const countElement = button.querySelector('.day-count');
                if (countElement) {
                    countElement.classList.add('unverified');
                    countElement.setAttribute('title', 'Count verification failed - may be inaccurate');
                }
            });
            
            // Log warning
            console.warn('DaySelector: Activity counts could not be verified and may be inaccurate');
        },
        
        /**
         * Provide haptic feedback on mobile devices
         */
        provideHapticFeedback: function(type) {
            const self = this;
            
            // Check if device supports haptics
            if (!navigator.vibrate) return;
            
            // Check user preferences (if available)
            if (window.Settings && window.Settings.get) {
                const hapticEnabled = window.Settings.get('hapticFeedback');
                if (hapticEnabled === false) return;
            }
            
            // Different patterns for different feedback types
            let pattern;
            switch (type) {
                case 'success':
                    pattern = [20]; // Light tap
                    break;
                case 'error':
                    pattern = [50, 50, 50]; // Three quick pulses
                    break;
                case 'warning':
                    pattern = [30, 30]; // Two medium pulses
                    break;
                default:
                    pattern = [15]; // Very light tap
            }
            
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // Silently fail if vibration not supported
                console.debug('Haptic feedback failed:', e);
            }
        },
        
        /**
         * Announce state changes for screen readers
         */
        announceState: function(message) {
            const self = this;
            
            // Create or reuse live region
            let liveRegion = document.getElementById('day-selector-live-region');
            if (!liveRegion) {
                liveRegion = document.createElement('div');
                liveRegion.id = 'day-selector-live-region';
                liveRegion.className = 'sr-only';
                liveRegion.setAttribute('role', 'status');
                liveRegion.setAttribute('aria-live', 'polite');
                liveRegion.setAttribute('aria-atomic', 'true');
                document.body.appendChild(liveRegion);
            }
            
            // Update content
            liveRegion.textContent = message;
            
            // Clear after delay to allow for next announcement
            setTimeout(function() {
                liveRegion.textContent = '';
            }, 3000);
        }
    };
    
    // Expose to global scope
    window.DaySelector = DaySelector;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            DaySelector.init();
        });
    } else {
        // DOM already loaded
        setTimeout(function() {
            DaySelector.init();
        }, 100);
    }
})();