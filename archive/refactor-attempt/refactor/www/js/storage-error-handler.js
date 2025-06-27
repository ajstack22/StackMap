/**
 * RSD-Aware Error Handler for Storage Operations
 * Provides user-friendly error messages for users with ADHD/autism
 */

(function() {
    'use strict';
    
    var StorageErrorHandler = {
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
        messages: {
            MIGRATION_FAILED: "Your data is safe! Let's try saving again. 🛡️",
            DB_LOCKED: "Just a moment... saving your tasks! ⏳",
            QUOTA_EXCEEDED: "Storage is getting full. Let's make some space! 📦",
            CORRUPT_DATA: "Found a small issue. Using your backup! 🔄",
            CONNECTION_FAILED: "Can't connect right now. Working offline! 📴",
            PERMISSION_DENIED: "Need permission to save. Check settings? 🔐",
            INVALID_DATA: "Something looks different. Let's fix it! 🔧",
            NETWORK_ERROR: "Internet is taking a break. Your tasks are safe! 🌐",
            UNKNOWN_ERROR: "Small hiccup! Let's try again? 🤔"
        },
        
        /**
         * Handle storage error with RSD-aware response
         */
        handle: function(error, context) {
            var self = this;
            var errorType = self.identifyErrorType(error);
            var userMessage = self.messages[errorType];
            
            console.error('[Storage Error]', context + ':', error);
            
            // Create error response
            var errorResponse = {
                type: errorType,
                userMessage: userMessage,
                context: context,
                timestamp: Date.now(),
                recoverable: self.isRecoverable(errorType),
                retryable: self.isRetryable(errorType)
            };
            
            // Show user notification if available
            self.showNotification(userMessage, errorType);
            
            // Log for debugging
            self.logError(errorResponse);
            
            return errorResponse;
        },
        
        /**
         * Identify error type from error object
         */
        identifyErrorType: function(error) {
            if (!error) return this.ErrorTypes.UNKNOWN_ERROR;
            
            var message = (error.message || '').toLowerCase();
            var code = (error.code || '').toLowerCase();
            
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
            var recoverableErrors = [
                this.ErrorTypes.DB_LOCKED,
                this.ErrorTypes.NETWORK_ERROR,
                this.ErrorTypes.CONNECTION_FAILED
            ];
            
            return recoverableErrors.indexOf(errorType) !== -1;
        },
        
        /**
         * Check if operation can be retried
         */
        isRetryable: function(errorType) {
            var retryableErrors = [
                this.ErrorTypes.DB_LOCKED,
                this.ErrorTypes.NETWORK_ERROR,
                this.ErrorTypes.CONNECTION_FAILED,
                this.ErrorTypes.MIGRATION_FAILED
            ];
            
            return retryableErrors.indexOf(errorType) !== -1;
        },
        
        /**
         * Show user-friendly notification
         */
        showNotification: function(message, errorType) {
            // Only show critical errors to user
            var criticalErrors = [
                this.ErrorTypes.QUOTA_EXCEEDED,
                this.ErrorTypes.PERMISSION_DENIED
            ];
            
            if (criticalErrors.indexOf(errorType) !== -1) {
                // If notification system exists, use it
                if (window.showUserNotification) {
                    window.showUserNotification(message, 'error');
                } else {
                    // Simple fallback
                    console.log('[User Notification]', message);
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
            var self = this;
            maxRetries = maxRetries || 3;
            
            return function retryOperation(attempt) {
                attempt = attempt || 1;
                
                return operation().catch(function(error) {
                    var errorResponse = self.handle(error, 'Retry attempt ' + attempt);
                    
                    if (errorResponse.retryable && attempt < maxRetries) {
                        // Exponential backoff: 100ms, 200ms, 400ms
                        var delay = Math.min(100 * Math.pow(2, attempt - 1), 2000);
                        
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
         * Get friendly suggestions for error resolution
         */
        getSuggestions: function(errorType) {
            var suggestions = {
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