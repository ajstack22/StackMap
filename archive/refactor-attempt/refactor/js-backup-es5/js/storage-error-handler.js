/**
 * RSD-Aware Error Handler for Storage Operations
 * Provides user-friendly error messages for users with ADHD/autism
 */

(function() {
    'use strict';
    
    const StorageErrorHandler = {
        // Error type mapping
        ErrorTypes: {
            MIGRATION_FAILED: 'MIGRATION_FAILED',
            DB_LOCKED: 'DB_LOCKED', 
            QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
            CORRUPT_DATA: 'CORRUPT_DATA',
            CONNECTION_FAILED: 'CONNECTION_FAILED',
            PERMISSION_DENIED: 'PERMISSION_DENIED',
            INVALID_DATA: 'INVALID_DATA',
            NETWORK_ERROR: 'NETWORK_ERROR',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        },
        
        // RSD-aware messages - simple, clear, non-alarming
        // Following Phase 4 guidelines: No blame, encouraging tone, collaborative language
        messages: {
            MIGRATION_FAILED: {
                title: "No worries!",
                message: "I'll update your data format automatically.",
                icon: "🛡️"
            },
            DB_LOCKED: {
                title: "Just a moment",
                message: "I'm finishing up another save...",
                icon: "⏳"
            },
            QUOTA_EXCEEDED: {
                title: "Let's make some space",
                message: "I'll help you manage storage...",
                icon: "📦"
            },
            CORRUPT_DATA: {
                title: "Found a small issue",
                message: "I'll use your backup data...",
                icon: "🔄"
            },
            CONNECTION_FAILED: {
                title: "Working offline",
                message: "I'll sync when internet returns!",
                icon: "📴"
            },
            PERMISSION_DENIED: {
                title: "Need your help",
                message: "Could you check app permissions?",
                icon: "🔐"
            },
            INVALID_DATA: {
                title: "Let me fix this",
                message: "I'll clean up the data format...",
                icon: "🔧"
            },
            NETWORK_ERROR: {
                title: "No internet right now",
                message: "Your tasks are safe locally!",
                icon: "🌐"
            },
            UNKNOWN_ERROR: {
                title: "Oops!",
                message: "Let me try another way...",
                icon: "🤔"
            }
        },
        
        // Get legacy message format for backward compatibility
        getLegacyMessage: function(errorType) {
            const messageObj = this.messages[errorType] || this.messages.UNKNOWN_ERROR;
            return `${messageObj.title} ${messageObj.message} ${messageObj.icon}`;
        },
        
        /**
         * Handle storage error with RSD-aware response
         */
        handle: function(error, context) {
            const self = this;
            const errorType = self.identifyErrorType(error);
            const messageObj = self.messages[errorType] || self.messages.UNKNOWN_ERROR;
            
            console.error('[Storage Error]', `${context}:`, error);
            
            // Create error response
            const errorResponse = {
                type: errorType,
                title: messageObj.title,
                message: messageObj.message,
                icon: messageObj.icon,
                userMessage: self.getLegacyMessage(errorType), // For backward compatibility
                context: context,
                timestamp: Date.now(),
                recoverable: self.isRecoverable(errorType),
                retryable: self.isRetryable(errorType)
            };
            
            // Show user notification if available
            self.showNotification(messageObj, errorType);
            
            // Trigger haptic feedback for errors (gentle pattern)
            if (window.StackMapHapticFeedback) {
                window.StackMapHapticFeedback.trigger('error');
            }
            
            // Log for debugging
            self.logError(errorResponse);
            
            return errorResponse;
        },
        
        /**
         * Identify error type from error object
         */
        identifyErrorType: function(error) {
            if (!error) return this.ErrorTypes.UNKNOWN_ERROR;
            
            const message = (error.message || '').toLowerCase();
            const code = (error.code || '').toLowerCase();
            
            // SQLite specific errors
            if (message.includes('database is locked') || code === 'sqlite_busy') {
                return this.ErrorTypes.DB_LOCKED;
            }
            
            if (message.includes('no such table') || message.includes('syntax error')) {
                return this.ErrorTypes.CORRUPT_DATA;
            }
            
            // Storage quota errors
            if (message.includes('quota') || error.name === 'QuotaExceededError') {
                return this.ErrorTypes.QUOTA_EXCEEDED;
            }
            
            // Permission errors
            if (message.includes('permission') || code.includes('permission')) {
                return this.ErrorTypes.PERMISSION_DENIED;
            }
            
            // Network errors
            if (message.includes('network') || message.includes('fetch')) {
                return this.ErrorTypes.NETWORK_ERROR;
            }
            
            // Migration errors
            if (message.includes('migration')) {
                return this.ErrorTypes.MIGRATION_FAILED;
            }
            
            // Data validation errors
            if (message.includes('validation') || message.includes('invalid')) {
                return this.ErrorTypes.INVALID_DATA;
            }
            
            // Connection errors
            if (message.includes('connection') || message.includes('connect')) {
                return this.ErrorTypes.CONNECTION_FAILED;
            }
            
            return this.ErrorTypes.UNKNOWN_ERROR;
        },
        
        /**
         * Check if error is recoverable
         */
        isRecoverable: function(errorType) {
            const recoverableErrors = [
                this.ErrorTypes.DB_LOCKED,
                this.ErrorTypes.NETWORK_ERROR,
                this.ErrorTypes.CONNECTION_FAILED
            ];
            
            return recoverableErrors.includes(errorType);
        },
        
        /**
         * Check if operation can be retried
         */
        isRetryable: function(errorType) {
            const retryableErrors = [
                this.ErrorTypes.DB_LOCKED,
                this.ErrorTypes.NETWORK_ERROR,
                this.ErrorTypes.CONNECTION_FAILED,
                this.ErrorTypes.MIGRATION_FAILED
            ];
            
            return retryableErrors.includes(errorType);
        },
        
        /**
         * Show user-friendly notification
         */
        showNotification: function(messageObj, errorType) {
            // Only show critical errors to user
            const criticalErrors = [
                this.ErrorTypes.QUOTA_EXCEEDED,
                this.ErrorTypes.PERMISSION_DENIED
            ];
            
            if (criticalErrors.includes(errorType)) {
                // If notification system exists, use it
                if (window.showUserNotification) {
                    // Use 'info' type instead of 'error' to avoid red/negative colors
                    window.showUserNotification(`${messageObj.title}: ${messageObj.message}`, 'info');
                } else if (window.StackMapMessaging && window.StackMapMessaging.showToast) {
                    // Use the messaging system with RSD-safe styling
                    window.StackMapMessaging.showToast({
                        type: 'info', // Never 'error' - following RSD guidelines
                        title: messageObj.title,
                        message: messageObj.message,
                        icon: messageObj.icon,
                        duration: 3000
                    });
                } else {
                    // Simple fallback
                    console.log('[User Notification]', `${messageObj.title}: ${messageObj.message}`);
                }
            }
        },
        
        /**
         * Log error for debugging
         */
        logError: function(errorResponse) {
            // Store recent errors
            if (!window._storageErrors) {
                window._storageErrors = [];
            }
            
            window._storageErrors.push(errorResponse);
            
            // Keep only last 20 errors
            if (window._storageErrors.length > 20) {
                window._storageErrors.shift();
            }
        },
        
        /**
         * Create retry handler with exponential backoff
         */
        createRetryHandler: function(operation, maxRetries) {
            const self = this;
            maxRetries = maxRetries || 3;
            
            return function retryOperation(attempt = 1) {
                return operation().catch(function(error) {
                    const errorResponse = self.handle(error, `Retry attempt ${attempt}`);
                    
                    if (errorResponse.retryable && attempt < maxRetries) {
                        // Exponential backoff: 100ms, 200ms, 400ms
                        const delay = Math.min(100 * Math.pow(2, attempt - 1), 2000);
                        
                        return new Promise(function(resolve) {
                            setTimeout(resolve, delay);
                        }).then(function() {
                            return retryOperation(attempt + 1);
                        });
                    }
                    
                    throw error;
                });
            };
        },
        
        /**
         * Automatic recovery system for ADHD users
         * Implements Phase 4 auto-recovery without user intervention
         */
        autoRecover: function(operation, error, context) {
            const self = this;
            const errorType = self.identifyErrorType(error);
            
            // Track recovery attempts
            if (!self.recoveryAttempts) {
                self.recoveryAttempts = {};
            }
            
            const operationKey = context || 'unknown';
            self.recoveryAttempts[operationKey] = (self.recoveryAttempts[operationKey] || 0) + 1;
            
            // Show encouraging message immediately
            const messageObj = self.messages[errorType] || self.messages.UNKNOWN_ERROR;
            if (window.StackMapMessaging && window.StackMapMessaging.showToast) {
                window.StackMapMessaging.showToast({
                    type: 'info',
                    title: messageObj.title,
                    message: messageObj.message,
                    icon: messageObj.icon,
                    duration: 3000
                });
            }
            
            // Implement recovery strategies based on error type
            switch (errorType) {
                case self.ErrorTypes.DB_LOCKED:
                    // Wait and retry automatically
                    return self.retryWithBackoff(operation, 500, 3);
                    
                case self.ErrorTypes.QUOTA_EXCEEDED:
                    // Try to free up space automatically
                    if (window.StorageCleanup && window.StorageCleanup.autoClean) {
                        return window.StorageCleanup.autoClean().then(operation);
                    }
                    return self.offerAlternativeStorage(operation);
                    
                case self.ErrorTypes.NETWORK_ERROR:
                case self.ErrorTypes.CONNECTION_FAILED:
                    // Switch to offline mode automatically
                    if (window.OfflineQueue) {
                        return window.OfflineQueue.queue(operation);
                    }
                    return Promise.resolve(); // Continue offline
                    
                case self.ErrorTypes.CORRUPT_DATA:
                    // Try to repair or use backup
                    if (window.DataRepair && window.DataRepair.attempt) {
                        return window.DataRepair.attempt().then(operation);
                    }
                    return self.useBackupData(operation);
                    
                default:
                    // Generic retry with backoff
                    return self.retryWithBackoff(operation, 1000, 2);
            }
        },
        
        /**
         * Retry operation with exponential backoff
         */
        retryWithBackoff: function(operation, initialDelay, maxAttempts) {
            let attempt = 0;
            
            function tryOperation() {
                return operation().catch(function(error) {
                    attempt++;
                    if (attempt >= maxAttempts) {
                        throw error;
                    }
                    
                    const delay = initialDelay * Math.pow(2, attempt - 1);
                    return new Promise(function(resolve) {
                        setTimeout(resolve, delay);
                    }).then(tryOperation);
                });
            }
            
            return tryOperation();
        },
        
        /**
         * Offer alternative storage when quota exceeded
         */
        offerAlternativeStorage: function(operation) {
            // Never blame the user - frame as app's limitation
            if (window.StackMapMessaging && window.StackMapMessaging.showToast) {
                window.StackMapMessaging.showToast({
                    type: 'info',
                    title: 'Let\'s try something else',
                    message: 'I\'ll save this differently...',
                    icon: '💡',
                    actions: [{
                        text: 'Use simple storage',
                        handler: function() {
                            // Switch to localStorage fallback
                            if (window.StorageFallback) {
                                window.StorageFallback.enable();
                                operation();
                            }
                        }
                    }]
                });
            }
            
            return Promise.resolve();
        },
        
        /**
         * Use backup data when corruption detected
         */
        useBackupData: function(operation) {
            if (window.BackupManager && window.BackupManager.restore) {
                return window.BackupManager.restore().then(function() {
                    // Show success message
                    if (window.StackMapMessaging) {
                        window.StackMapMessaging.showToast({
                            type: 'success',
                            title: 'All fixed!',
                            message: 'Using your backup data',
                            icon: '✅'
                        });
                    }
                    return operation();
                });
            }
            
            return Promise.resolve();
        },
        
        /**
         * Get friendly suggestions for error resolution
         */
        getSuggestions: function(errorType) {
            const suggestions = {
                MIGRATION_FAILED: [
                    'Your tasks are safe in a backup',
                    'Try closing other apps',
                    'Restart the app if needed'
                ],
                DB_LOCKED: [
                    'This usually fixes itself quickly',
                    'Avoid tapping multiple times'
                ],
                QUOTA_EXCEEDED: [
                    'Delete old completed tasks',
                    'Clear app cache in settings'
                ],
                CORRUPT_DATA: [
                    'We\'re using your backup automatically',
                    'No action needed from you'
                ],
                CONNECTION_FAILED: [
                    'Check your internet connection',
                    'The app works offline too!'
                ],
                PERMISSION_DENIED: [
                    'Go to Settings > Apps > StackMap',
                    'Enable Storage permission'
                ],
                INVALID_DATA: [
                    'Check what you entered',
                    'Try again with different text'
                ],
                NETWORK_ERROR: [
                    'Your tasks are saved locally',
                    'They\'ll sync when online'
                ],
                UNKNOWN_ERROR: [
                    'Try again in a moment',
                    'Restart the app if it continues'
                ]
            };
            
            return suggestions[errorType] || suggestions.UNKNOWN_ERROR;
        }
    };
    
    // Expose globally
    window.StorageErrorHandler = StorageErrorHandler;
})();