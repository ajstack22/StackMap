/**
 * Rollover Manager for Today/Tomorrow Tasks
 * Handles daily task rollover with RSD-aware messaging
 * Implements gentle, forgiving task management for ADHD users
 */

(function() {
    'use strict';
    
    // Constants
    var ROLLOVER_HOUR = 4; // 4 AM as per PM review
    var STORAGE_KEY = 'stackmap_rollover_state';
    
    // RSD-aware messages
    var MESSAGES = {
        single: "Brought 1 task forward - fresh start! 🌅",
        multiple: "{count} tasks came along for today's journey",
        allDone: "Yesterday complete! Today is yours ✨",
        multiDay: "Welcome back! I've organized your tasks",
        firstTime: "Good morning! Let's see what today brings",
        welcome: "Ready when you are!",
        error: "Had a small hiccup organizing tasks, but they're all safe"
    };
    
    var RolloverManager = {
        isInitialized: false,
        lastCheck: null,
        
        /**
         * Initialize the rollover manager
         */
        init: function() {
            var self = this;
            
            if (self.isInitialized) return;
            
            self.isInitialized = true;
            
            // Check rollover on init
            self.checkAndPerformRollover();
            
            // Set up periodic checks (every 5 minutes)
            setInterval(function() {
                self.checkAndPerformRollover();
            }, 5 * 60 * 1000);
            
            // Listen for visibility changes to check when app comes back
            document.addEventListener('visibilitychange', function() {
                if (!document.hidden) {
                    self.checkAndPerformRollover();
                }
            });
        },
        
        /**
         * Check if rollover is needed and perform it
         */
        checkAndPerformRollover: function(callback) {
            var self = this;
            
            // Get rollover state
            self.getRolloverState(function(state) {
                var now = new Date();
                var today = new Date(now);
                today.setHours(ROLLOVER_HOUR, 0, 0, 0);
                
                // Check if we've already done today's rollover
                if (state.lastRollover) {
                    var lastRollover = new Date(state.lastRollover);
                    var lastRolloverDay = new Date(lastRollover);
                    lastRolloverDay.setHours(ROLLOVER_HOUR, 0, 0, 0);
                    
                    // If we've already rolled over after today's rollover time, skip
                    if (lastRollover >= today) {
                        console.log('Rollover: Already completed for today');
                        if (callback) callback(false);
                        return;
                    }
                }
                
                // Check if it's after rollover hour
                if (now.getHours() >= ROLLOVER_HOUR) {
                    console.log('Rollover: Time to perform daily rollover');
                    self.performRollover(callback);
                } else {
                    console.log('Rollover: Too early (before ' + ROLLOVER_HOUR + ' AM)');
                    if (callback) callback(false);
                }
            });
        },
        
        /**
         * Perform the actual rollover
         */
        performRollover: function(callback) {
            var self = this;
            
            console.log('Rollover: Starting daily rollover process');
            
            // Get tasks
            self.getTasks(function(tasks) {
                if (!tasks || tasks.length === 0) {
                    // No tasks to rollover
                    self.saveRolloverState({ 
                        lastRollover: new Date().toISOString(),
                        rolloverCount: 0
                    });
                    if (callback) callback(true, 0);
                    return;
                }
                
                var updates = [];
                var rolloverCount = 0;
                var completedCount = 0;
                var now = new Date();
                
                // Process each task
                tasks.forEach(function(task) {
                    // Skip if no timeframe (legacy tasks)
                    if (!task.timeframe) {
                        return;
                    }
                    
                    // Count completed tasks for celebration
                    if (task.completed && task.timeframe === 'today') {
                        completedCount++;
                    }
                    
                    // Process incomplete tasks
                    if (!task.completed) {
                        if (task.timeframe === 'today') {
                            // Incomplete today tasks stay in today but increment rollover count
                            rolloverCount++;
                            updates.push({
                                task: task,
                                changes: {
                                    rolloverCount: (task.rolloverCount || 0) + 1,
                                    lastRolloverDate: now.toISOString()
                                }
                            });
                        } else if (task.timeframe === 'tomorrow') {
                            // Tomorrow tasks become today
                            updates.push({
                                task: task,
                                changes: {
                                    timeframe: 'today',
                                    lastRolloverDate: now.toISOString()
                                }
                            });
                        }
                    }
                });
                
                // Apply updates
                if (updates.length > 0) {
                    self.applyUpdates(updates, function(success) {
                        if (success) {
                            // Save rollover state
                            self.saveRolloverState({
                                lastRollover: now.toISOString(),
                                rolloverCount: rolloverCount,
                                completedCount: completedCount
                            });
                            
                            // Show appropriate message
                            self.showRolloverMessage(rolloverCount, completedCount);
                            
                            // Notify other components
                            self.notifyRollover(rolloverCount);
                            
                            if (callback) callback(true, rolloverCount);
                        } else {
                            self.showMessage(MESSAGES.error, 'error');
                            if (callback) callback(false, 0);
                        }
                    });
                } else {
                    // No updates needed but save state
                    self.saveRolloverState({
                        lastRollover: now.toISOString(),
                        rolloverCount: 0,
                        completedCount: completedCount
                    });
                    
                    if (completedCount > 0) {
                        self.showMessage(MESSAGES.allDone, 'success');
                    }
                    
                    if (callback) callback(true, 0);
                }
            });
        },
        
        /**
         * Get tasks for rollover
         */
        getTasks: function(callback) {
            // Try to get from TodayTomorrowView first
            if (window.TodayTomorrowView && window.TodayTomorrowView.tasks) {
                callback(window.TodayTomorrowView.tasks);
                return;
            }
            
            // Try TaskDisplay
            if (window.TaskDisplay && window.TaskDisplay.tasks) {
                callback(window.TaskDisplay.tasks);
                return;
            }
            
            // Try storage
            if (window.StorageAdapter) {
                window.StorageAdapter.get('tasks', function(err, data) {
                    if (!err && data && data.data) {
                        callback(data.data);
                    } else {
                        callback([]);
                    }
                });
            } else {
                // Fallback to localStorage
                try {
                    var stored = localStorage.getItem('stackmap_tasks');
                    callback(stored ? JSON.parse(stored) : []);
                } catch (e) {
                    callback([]);
                }
            }
        },
        
        /**
         * Apply task updates
         */
        applyUpdates: function(updates, callback) {
            var self = this;
            
            // Get current tasks
            self.getTasks(function(tasks) {
                // Apply updates
                updates.forEach(function(update) {
                    var task = tasks.find(function(t) {
                        return t.id === update.task.id;
                    });
                    
                    if (task) {
                        Object.assign(task, update.changes);
                        task.updated_at = new Date().toISOString();
                    }
                });
                
                // Save tasks
                self.saveTasks(tasks, callback);
            });
        },
        
        /**
         * Save tasks
         */
        saveTasks: function(tasks, callback) {
            // Update in TodayTomorrowView if available
            if (window.TodayTomorrowView) {
                window.TodayTomorrowView.tasks = tasks;
                if (window.TodayTomorrowView.saveTasks) {
                    window.TodayTomorrowView.saveTasks(callback);
                    return;
                }
            }
            
            // Update in TaskDisplay if available
            if (window.TaskDisplay) {
                window.TaskDisplay.tasks = tasks;
                if (window.TaskDisplay.saveTasks) {
                    window.TaskDisplay.saveTasks(callback);
                    return;
                }
            }
            
            // Save directly
            if (window.StorageAdapter) {
                window.StorageAdapter.save('tasks', tasks, function(err) {
                    if (callback) callback(!err);
                });
            } else {
                // Fallback to localStorage
                try {
                    localStorage.setItem('stackmap_tasks', JSON.stringify(tasks));
                    if (callback) callback(true);
                } catch (e) {
                    if (callback) callback(false);
                }
            }
        },
        
        /**
         * Get rollover state
         */
        getRolloverState: function(callback) {
            if (window.StorageAdapter) {
                window.StorageAdapter.get(STORAGE_KEY, function(err, data) {
                    if (!err && data && data.data) {
                        callback(data.data);
                    } else {
                        callback({});
                    }
                });
            } else {
                try {
                    var stored = localStorage.getItem(STORAGE_KEY);
                    callback(stored ? JSON.parse(stored) : {});
                } catch (e) {
                    callback({});
                }
            }
        },
        
        /**
         * Save rollover state
         */
        saveRolloverState: function(state, callback) {
            if (window.StorageAdapter) {
                window.StorageAdapter.save(STORAGE_KEY, state, callback);
            } else {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                    if (callback) callback(true);
                } catch (e) {
                    if (callback) callback(false);
                }
            }
        },
        
        /**
         * Show rollover message
         */
        showRolloverMessage: function(rolloverCount, completedCount) {
            var message;
            
            if (rolloverCount === 0 && completedCount > 0) {
                message = MESSAGES.allDone;
            } else if (rolloverCount === 1) {
                message = MESSAGES.single;
            } else if (rolloverCount > 1) {
                message = MESSAGES.multiple.replace('{count}', rolloverCount);
            } else {
                message = MESSAGES.welcome;
            }
            
            this.showMessage(message, 'rollover');
        },
        
        /**
         * Show a message to the user
         */
        showMessage: function(message, type) {
            // Try TodayTomorrowView notification system first
            if (window.TodayTomorrowView && window.TodayTomorrowView.showNotification) {
                window.TodayTomorrowView.showNotification(message, type);
                return;
            }
            
            // Fallback to custom notification
            try {
                var notification = document.createElement('div');
                notification.className = 'rollover-notification ' + (type || '');
                notification.textContent = message;
                notification.setAttribute('role', 'status');
                notification.setAttribute('aria-live', 'polite');
                
                // Style it
                notification.style.cssText = 
                    'position: fixed;' +
                    'top: 80px;' +
                    'left: 50%;' +
                    'transform: translateX(-50%);' +
                    'background: ' + (type === 'error' ? '#f44336' : '#4CAF50') + ';' +
                    'color: white;' +
                    'padding: 1rem 1.5rem;' +
                    'border-radius: 2rem;' +
                    'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);' +
                    'font-size: 1rem;' +
                    'opacity: 0;' +
                    'transition: opacity 0.3s ease;' +
                    'z-index: 1000;' +
                    'max-width: 90%;' +
                    'text-align: center;';
                
                document.body.appendChild(notification);
                
                // Fade in
                setTimeout(function() {
                    notification.style.opacity = '1';
                }, 10);
                
                // Remove after delay
                setTimeout(function() {
                    notification.style.opacity = '0';
                    setTimeout(function() {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }, 3000);
            } catch (e) {
                console.warn('Could not show rollover notification:', e);
            }
        },
        
        /**
         * Notify other components about rollover
         */
        notifyRollover: function(rolloverCount) {
            // Dispatch custom event
            try {
                var event = new CustomEvent('tasksRolledOver', {
                    detail: {
                        rolloverCount: rolloverCount,
                        timestamp: new Date().toISOString()
                    }
                });
                document.dispatchEvent(event);
            } catch (e) {
                // Fallback for older browsers
                var event = document.createEvent('CustomEvent');
                event.initCustomEvent('tasksRolledOver', true, true, {
                    rolloverCount: rolloverCount,
                    timestamp: new Date().toISOString()
                });
                document.dispatchEvent(event);
            }
            
            // Trigger view refresh if available
            if (window.TodayTomorrowView && window.TodayTomorrowView.render) {
                window.TodayTomorrowView.loadTasks(function() {
                    window.TodayTomorrowView.render();
                });
            }
        },
        
        /**
         * Force a rollover (for testing)
         */
        forceRollover: function(callback) {
            console.log('Rollover: Forcing manual rollover');
            this.performRollover(callback);
        },
        
        /**
         * Get rollover statistics
         */
        getStats: function(callback) {
            var self = this;
            
            self.getRolloverState(function(state) {
                self.getTasks(function(tasks) {
                    var stats = {
                        lastRollover: state.lastRollover,
                        tasksRolledToday: state.rolloverCount || 0,
                        completedYesterday: state.completedCount || 0,
                        currentTasks: {
                            today: tasks.filter(function(t) { 
                                return t.timeframe === 'today' && !t.completed; 
                            }).length,
                            tomorrow: tasks.filter(function(t) { 
                                return t.timeframe === 'tomorrow' && !t.completed; 
                            }).length,
                            someday: tasks.filter(function(t) { 
                                return t.timeframe === 'someday' && !t.completed; 
                            }).length
                        },
                        highRolloverTasks: tasks.filter(function(t) { 
                            return t.rolloverCount >= 7; 
                        }).map(function(t) { 
                            return {
                                id: t.id,
                                title: t.title,
                                rolloverCount: t.rolloverCount
                            };
                        })
                    };
                    
                    if (callback) callback(stats);
                });
            });
        }
    };
    
    // Expose to global scope
    window.RolloverManager = RolloverManager;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            RolloverManager.init();
        });
    } else {
        // DOM already loaded
        setTimeout(function() {
            RolloverManager.init();
        }, 100);
    }
})();