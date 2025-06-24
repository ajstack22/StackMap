/**
 * Service Worker Update Manager
 * Handles version updates, user notifications, and graceful transitions
 * Designed for ADHD/autism users - non-disruptive updates
 */

(function() {
    'use strict';
    
    var SWUpdateManager = {
        // Configuration
        config: {
            checkInterval: 3600000, // Check every hour
            notificationDelay: 5000, // Wait 5s before showing update prompt
            autoUpdateDelay: 86400000, // Auto-update after 24 hours
            quietHours: { start: 22, end: 8 } // Don't prompt during these hours
        },
        
        // State
        registration: null,
        updateAvailable: false,
        updateTimer: null,
        lastCheck: 0,
        userPostponed: false,
        
        /**
         * Initialize update manager
         */
        init: function() {
            var self = this;
            
            if (!('serviceWorker' in navigator)) {
                console.warn('Service Worker not supported');
                return;
            }
            
            // Register service worker
            navigator.serviceWorker.register('/js/service-worker.js').then(function(reg) {
                self.registration = reg;
                
                // Check for updates on load
                self.checkForUpdate();
                
                // Setup update detection
                self.setupUpdateDetection(reg);
                
                // Setup periodic checks
                self.setupPeriodicChecks();
                
                // Handle controller change
                self.handleControllerChange();
                
            }).catch(function(error) {
                console.error('Service Worker registration failed:', error);
            });
        },
        
        /**
         * Setup update detection
         */
        setupUpdateDetection: function(registration) {
            var self = this;
            
            // Listen for update found
            registration.addEventListener('updatefound', function() {
                var newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', function() {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        self.onUpdateAvailable(newWorker);
                    }
                });
            });
        },
        
        /**
         * Handle update available
         */
        onUpdateAvailable: function(newWorker) {
            var self = this;
            
            self.updateAvailable = true;
            self.newWorker = newWorker;
            
            // Store update time
            localStorage.setItem('sw-update-available', Date.now());
            
            // Check if in quiet hours
            if (self.isQuietHours()) {
                console.log('Update available but in quiet hours, postponing notification');
                return;
            }
            
            // Check if user recently postponed
            if (self.userPostponed) {
                console.log('User postponed update, will prompt later');
                return;
            }
            
            // Wait before showing notification (non-disruptive)
            setTimeout(function() {
                self.showUpdateNotification();
            }, self.config.notificationDelay);
        },
        
        /**
         * Show update notification
         */
        showUpdateNotification: function() {
            var self = this;
            
            // Create notification element
            var notification = document.createElement('div');
            notification.className = 'sw-update-notification';
            notification.innerHTML = 
                '<div class="sw-update-content">' +
                    '<div class="sw-update-message">' +
                        '<strong>Update Available</strong><br>' +
                        'A new version of StackMap is ready.' +
                    '</div>' +
                    '<div class="sw-update-actions">' +
                        '<button class="sw-update-now">Update Now</button>' +
                        '<button class="sw-update-later">Later</button>' +
                    '</div>' +
                '</div>';
            
            // Add styles if not already added
            self.addNotificationStyles();
            
            // Add to page
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(function() {
                notification.classList.add('sw-update-show');
            }, 100);
            
            // Handle actions
            notification.querySelector('.sw-update-now').addEventListener('click', function() {
                self.applyUpdate();
                self.hideNotification(notification);
            });
            
            notification.querySelector('.sw-update-later').addEventListener('click', function() {
                self.postponeUpdate();
                self.hideNotification(notification);
            });
            
            // Auto-hide after 30 seconds
            setTimeout(function() {
                if (notification.parentNode) {
                    self.hideNotification(notification);
                }
            }, 30000);
        },
        
        /**
         * Apply update
         */
        applyUpdate: function() {
            var self = this;
            
            if (!self.newWorker) {
                console.error('No new worker to activate');
                return;
            }
            
            // Tell SW to skip waiting
            self.newWorker.postMessage({ type: 'skipWaiting' });
            
            // Show updating message
            self.showUpdatingMessage();
        },
        
        /**
         * Postpone update
         */
        postponeUpdate: function() {
            var self = this;
            
            self.userPostponed = true;
            localStorage.setItem('sw-update-postponed', Date.now());
            
            // Check again in 4 hours
            setTimeout(function() {
                self.userPostponed = false;
                if (self.updateAvailable) {
                    self.showUpdateNotification();
                }
            }, 14400000); // 4 hours
        },
        
        /**
         * Hide notification
         */
        hideNotification: function(notification) {
            notification.classList.remove('sw-update-show');
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        },
        
        /**
         * Show updating message
         */
        showUpdatingMessage: function() {
            var message = document.createElement('div');
            message.className = 'sw-updating-message';
            message.innerHTML = 
                '<div class="sw-updating-content">' +
                    '<div class="sw-updating-spinner"></div>' +
                    '<div>Updating StackMap...</div>' +
                '</div>';
            
            document.body.appendChild(message);
            
            // Auto-remove after reload
            setTimeout(function() {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 5000);
        },
        
        /**
         * Handle controller change (update applied)
         */
        handleControllerChange: function() {
            var self = this;
            
            navigator.serviceWorker.addEventListener('controllerchange', function() {
                // Only reload if user initiated update
                if (self.updateAvailable) {
                    // Save current state
                    self.saveCurrentState();
                    
                    // Reload page
                    setTimeout(function() {
                        window.location.reload();
                    }, 1000);
                }
            });
        },
        
        /**
         * Save current state before reload
         */
        saveCurrentState: function() {
            // Save any unsaved data
            if (window.StackMapApp && window.StackMapApp.saveState) {
                window.StackMapApp.saveState();
            }
            
            // Save scroll position
            sessionStorage.setItem('sw-update-scroll', window.scrollY);
            
            // Save active view
            var activeView = document.querySelector('.view.active');
            if (activeView) {
                sessionStorage.setItem('sw-update-view', activeView.id);
            }
        },
        
        /**
         * Restore state after reload
         */
        restoreState: function() {
            // Restore scroll position
            var scrollPos = sessionStorage.getItem('sw-update-scroll');
            if (scrollPos) {
                window.scrollTo(0, parseInt(scrollPos));
                sessionStorage.removeItem('sw-update-scroll');
            }
            
            // Show success message
            var updated = sessionStorage.getItem('sw-just-updated');
            if (updated) {
                self.showUpdateSuccess();
                sessionStorage.removeItem('sw-just-updated');
            }
        },
        
        /**
         * Show update success message
         */
        showUpdateSuccess: function() {
            var success = document.createElement('div');
            success.className = 'sw-update-success';
            success.textContent = 'StackMap has been updated successfully';
            
            document.body.appendChild(success);
            
            setTimeout(function() {
                success.classList.add('sw-update-show');
            }, 100);
            
            setTimeout(function() {
                success.classList.remove('sw-update-show');
                setTimeout(function() {
                    if (success.parentNode) {
                        success.parentNode.removeChild(success);
                    }
                }, 300);
            }, 3000);
        },
        
        /**
         * Check for update manually
         */
        checkForUpdate: function() {
            var self = this;
            
            if (!self.registration) return;
            
            self.lastCheck = Date.now();
            self.registration.update().catch(function(error) {
                console.error('Update check failed:', error);
            });
        },
        
        /**
         * Setup periodic update checks
         */
        setupPeriodicChecks: function() {
            var self = this;
            
            // Check periodically
            setInterval(function() {
                self.checkForUpdate();
            }, self.config.checkInterval);
            
            // Check on visibility change
            document.addEventListener('visibilitychange', function() {
                if (!document.hidden && Date.now() - self.lastCheck > 300000) { // 5 min
                    self.checkForUpdate();
                }
            });
        },
        
        /**
         * Check if in quiet hours
         */
        isQuietHours: function() {
            var self = this;
            var now = new Date();
            var hour = now.getHours();
            
            if (self.config.quietHours.start > self.config.quietHours.end) {
                // Crosses midnight
                return hour >= self.config.quietHours.start || hour < self.config.quietHours.end;
            } else {
                return hour >= self.config.quietHours.start && hour < self.config.quietHours.end;
            }
        },
        
        /**
         * Add notification styles
         */
        addNotificationStyles: function() {
            if (document.getElementById('sw-update-styles')) return;
            
            var styles = document.createElement('style');
            styles.id = 'sw-update-styles';
            styles.innerHTML = 
                '.sw-update-notification {' +
                '    position: fixed;' +
                '    bottom: 20px;' +
                '    right: 20px;' +
                '    background: white;' +
                '    border-radius: 8px;' +
                '    box-shadow: 0 4px 12px rgba(0,0,0,0.15);' +
                '    padding: 20px;' +
                '    max-width: 320px;' +
                '    transform: translateY(120%);' +
                '    transition: transform 0.3s ease;' +
                '    z-index: 10000;' +
                '}' +
                '.sw-update-notification.sw-update-show {' +
                '    transform: translateY(0);' +
                '}' +
                '.sw-update-message {' +
                '    margin-bottom: 15px;' +
                '    color: #374151;' +
                '}' +
                '.sw-update-actions {' +
                '    display: flex;' +
                '    gap: 10px;' +
                '}' +
                '.sw-update-actions button {' +
                '    flex: 1;' +
                '    padding: 10px;' +
                '    border: none;' +
                '    border-radius: 6px;' +
                '    font-size: 14px;' +
                '    cursor: pointer;' +
                '    transition: background 0.2s;' +
                '}' +
                '.sw-update-now {' +
                '    background: #667eea;' +
                '    color: white;' +
                '}' +
                '.sw-update-now:hover {' +
                '    background: #5563d1;' +
                '}' +
                '.sw-update-later {' +
                '    background: #e5e7eb;' +
                '    color: #6b7280;' +
                '}' +
                '.sw-update-later:hover {' +
                '    background: #d1d5db;' +
                '}' +
                '.sw-updating-message {' +
                '    position: fixed;' +
                '    top: 50%;' +
                '    left: 50%;' +
                '    transform: translate(-50%, -50%);' +
                '    background: white;' +
                '    padding: 30px;' +
                '    border-radius: 8px;' +
                '    box-shadow: 0 4px 12px rgba(0,0,0,0.15);' +
                '    text-align: center;' +
                '    z-index: 10001;' +
                '}' +
                '.sw-updating-spinner {' +
                '    width: 40px;' +
                '    height: 40px;' +
                '    border: 3px solid #e5e7eb;' +
                '    border-top-color: #667eea;' +
                '    border-radius: 50%;' +
                '    animation: spin 1s linear infinite;' +
                '    margin: 0 auto 15px;' +
                '}' +
                '.sw-update-success {' +
                '    position: fixed;' +
                '    top: 20px;' +
                '    left: 50%;' +
                '    transform: translateX(-50%) translateY(-120%);' +
                '    background: #10b981;' +
                '    color: white;' +
                '    padding: 15px 25px;' +
                '    border-radius: 6px;' +
                '    transition: transform 0.3s ease;' +
                '    z-index: 10000;' +
                '}' +
                '.sw-update-success.sw-update-show {' +
                '    transform: translateX(-50%) translateY(0);' +
                '}' +
                '@keyframes spin {' +
                '    to { transform: rotate(360deg); }' +
                '}' +
                '@media (max-width: 480px) {' +
                '    .sw-update-notification {' +
                '        left: 10px;' +
                '        right: 10px;' +
                '        bottom: 10px;' +
                '        max-width: none;' +
                '    }' +
                '}';
            
            document.head.appendChild(styles);
        },
        
        /**
         * Get update status
         */
        getStatus: function() {
            var self = this;
            
            return {
                updateAvailable: self.updateAvailable,
                lastCheck: self.lastCheck,
                registration: self.registration,
                userPostponed: self.userPostponed
            };
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            SWUpdateManager.init();
        });
    } else {
        SWUpdateManager.init();
    }
    
    // Restore state after update
    window.addEventListener('load', function() {
        SWUpdateManager.restoreState();
    });
    
    // Expose API
    window.SWUpdateManager = SWUpdateManager;
})();