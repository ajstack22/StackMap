/**
 * Celebration System for StackMap
 * Provides positive reinforcement when tasks are completed
 * CSS-only animations for performance on low-end devices
 */

(function() {
    'use strict';
    
    var CelebrationSystem = {
        // Configuration
        isEnabled: true,
        showMessages: true,
        showDailyCounter: true,
        
        // Messages array
        messages: [
            'Great job!',
            'You did it!',
            'Keep going!',
            'Awesome work!',
            'Well done!',
            'Task complete!',
            'Nice progress!',
            'You rock!',
            'Fantastic!',
            'Amazing!',
            'Excellent!',
            'Keep it up!',
            'Way to go!',
            'Outstanding!'
        ],
        
        // Milestone messages
        milestoneMessages: {
            5: "You're on a roll!",
            10: 'Double digits! Amazing!',
            20: 'Productivity champion!',
            50: 'Incredible progress!',
            100: 'Century club! 🎉'
        },
        
        /**
         * Initialize the celebration system
         */
        init: function() {
            var self = this;
            
            // Check if safe mode is active
            if (window.StackMapSafeMode) {
                self.isEnabled = false;
                return;
            }
            
            // Load user preferences
            self.loadSettings();
            
            // Setup daily counter
            self.setupDailyCounter();
            
            // Cleanup old counters
            self.cleanupOldCounters();
            
            // Create screen reader announcement container
            self.createAnnouncementContainer();
        },
        
        /**
         * Load settings from user preferences
         */
        loadSettings: function() {
            var self = this;
            
            if (window.UserManager) {
                var user = window.UserManager.getCurrentUser();
                if (user && user.preferences) {
                    self.isEnabled = user.preferences.celebrationsEnabled !== false;
                    self.showMessages = user.preferences.showCelebrationMessages !== false;
                    self.showDailyCounter = user.preferences.showDailyCounter !== false;
                }
            }
        },
        
        /**
         * Main celebration method - called when task is completed
         */
        celebrate: function(taskElement, isFirstCompletion) {
            var self = this;
            
            // Only celebrate first completion
            if (!isFirstCompletion || !self.isEnabled) {
                return;
            }
            
            // Check for reduced motion preference
            if (self.prefersReducedMotion()) {
                // Show message only, no animation
                if (self.showMessages) {
                    self.showMessage(taskElement);
                }
            } else {
                // Full celebration with animation
                self.animateCard(taskElement);
                if (self.showMessages) {
                    self.showMessage(taskElement);
                }
            }
            
            // Update daily counter
            var count = self.incrementDailyCounter();
            
            // Check for milestones
            if (self.milestoneMessages[count]) {
                setTimeout(function() {
                    self.showMilestoneMessage(self.milestoneMessages[count]);
                }, 800);
            }
            
            // Screen reader announcement
            self.announceCompletion();
        },
        
        /**
         * Animate the task card
         */
        animateCard: function(taskElement) {
            var self = this;
            
            // Add celebration class
            taskElement.classList.add('task-card--celebrating');
            
            // Remove class after animation completes
            setTimeout(function() {
                taskElement.classList.remove('task-card--celebrating');
            }, 600);
        },
        
        /**
         * Show celebration message
         */
        showMessage: function(taskElement) {
            var self = this;
            
            // Get personalized message
            var message = self.getPersonalizedMessage();
            
            // Create toast element
            var toast = self.createToast(message);
            
            // Position relative to task card
            var rect = taskElement.getBoundingClientRect();
            toast.style.position = 'fixed';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.top = (rect.top - 10) + 'px';
            
            // Add to DOM
            document.body.appendChild(toast);
            
            // Trigger animation
            setTimeout(function() {
                toast.classList.add('celebration-toast--visible');
            }, 10);
            
            // Remove after delay
            setTimeout(function() {
                toast.classList.remove('celebration-toast--visible');
                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 2000);
        },
        
        /**
         * Get personalized message with user name if available
         */
        getPersonalizedMessage: function() {
            var self = this;
            
            var message = self.messages[Math.floor(Math.random() * self.messages.length)];
            
            // Add user name if available
            if (window.UserManager) {
                var user = window.UserManager.getCurrentUser();
                if (user && user.name && user.name !== 'Me') {
                    message = user.name + ', ' + message.toLowerCase();
                }
            }
            
            return message;
        },
        
        /**
         * Create toast element
         */
        createToast: function(message) {
            var toast = document.createElement('div');
            toast.className = 'celebration-toast';
            toast.textContent = message;
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            
            return toast;
        },
        
        /**
         * Show milestone message
         */
        showMilestoneMessage: function(message) {
            var self = this;
            
            var milestone = self.createToast(message);
            milestone.classList.add('celebration-toast--milestone');
            
            // Center on screen
            milestone.style.position = 'fixed';
            milestone.style.left = '50%';
            milestone.style.top = '50%';
            milestone.style.transform = 'translate(-50%, -50%)';
            
            document.body.appendChild(milestone);
            
            setTimeout(function() {
                milestone.classList.add('celebration-toast--visible');
            }, 10);
            
            setTimeout(function() {
                milestone.classList.remove('celebration-toast--visible');
                setTimeout(function() {
                    if (milestone.parentNode) {
                        milestone.parentNode.removeChild(milestone);
                    }
                }, 300);
            }, 3000);
        },
        
        /**
         * Setup daily counter display
         */
        setupDailyCounter: function() {
            var self = this;
            
            if (!self.showDailyCounter) {
                return;
            }
            
            // Create counter element if it doesn't exist
            var counter = document.getElementById('daily-progress');
            if (!counter) {
                counter = document.createElement('div');
                counter.id = 'daily-progress';
                counter.className = 'daily-progress';
                counter.innerHTML = 
                    '<span class="daily-progress__icon">🌟</span>' +
                    '<span class="daily-progress__count">0</span>' +
                    '<span class="daily-progress__label">tasks today!</span>';
                
                // Add to header or appropriate location
                var header = document.querySelector('.header-content');
                if (header) {
                    header.appendChild(counter);
                }
            }
            
            // Update count
            self.updateDailyCounterDisplay();
        },
        
        /**
         * Increment daily counter
         */
        incrementDailyCounter: function() {
            var self = this;
            
            var today = new Date().toDateString();
            var key = 'stackmap_daily_count_' + today;
            
            try {
                var count = parseInt(localStorage.getItem(key) || '0', 10);
                count++;
                localStorage.setItem(key, count.toString());
                
                // Update display
                self.updateDailyCounterDisplay();
                
                return count;
            } catch (error) {
                console.warn('Failed to update daily counter:', error);
                return 0;
            }
        },
        
        /**
         * Update daily counter display
         */
        updateDailyCounterDisplay: function() {
            var self = this;
            
            var counter = document.getElementById('daily-progress');
            if (!counter) return;
            
            var today = new Date().toDateString();
            var key = 'stackmap_daily_count_' + today;
            
            try {
                var count = parseInt(localStorage.getItem(key) || '0', 10);
                var countElement = counter.querySelector('.daily-progress__count');
                if (countElement) {
                    countElement.textContent = count;
                }
            } catch (error) {
                console.warn('Failed to read daily counter:', error);
            }
        },
        
        /**
         * Cleanup old daily counters (>7 days)
         */
        cleanupOldCounters: function() {
            var self = this;
            
            try {
                var cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - 7);
                
                // Get all localStorage keys
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.startsWith('stackmap_daily_count_')) {
                        var dateStr = key.replace('stackmap_daily_count_', '');
                        var keyDate = new Date(dateStr);
                        
                        if (keyDate < cutoffDate) {
                            localStorage.removeItem(key);
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to cleanup old counters:', error);
            }
        },
        
        /**
         * Check if user prefers reduced motion
         */
        prefersReducedMotion: function() {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        },
        
        /**
         * Create screen reader announcement container
         */
        createAnnouncementContainer: function() {
            var self = this;
            
            if (!document.getElementById('celebration-announcements')) {
                var container = document.createElement('div');
                container.id = 'celebration-announcements';
                container.className = 'sr-only';
                container.setAttribute('role', 'status');
                container.setAttribute('aria-live', 'polite');
                container.setAttribute('aria-atomic', 'true');
                document.body.appendChild(container);
            }
        },
        
        /**
         * Announce completion for screen readers
         */
        announceCompletion: function() {
            var self = this;
            
            var container = document.getElementById('celebration-announcements');
            if (container) {
                container.textContent = 'Task completed! ' + self.getPersonalizedMessage();
                
                // Clear after delay
                setTimeout(function() {
                    container.textContent = '';
                }, 3000);
            }
        },
        
        /**
         * Check if celebrations are disabled
         */
        isDisabled: function() {
            var self = this;
            return !self.isEnabled || window.StackMapSafeMode;
        }
    };
    
    // Export to global scope
    window.CelebrationSystem = CelebrationSystem;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            CelebrationSystem.init();
        });
    } else {
        CelebrationSystem.init();
    }
})();