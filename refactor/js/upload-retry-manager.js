/**
 * Upload Retry Manager
 * Handles intelligent retry logic for failed photo uploads
 * Uses exponential backoff with jitter to prevent thundering herd
 */

class UploadRetryManager {
    constructor(options = {}) {
        // Configuration
        this.config = {
            maxRetries: options.maxRetries || 3,
            baseDelay: options.baseDelay || 1000, // 1 second
            maxDelay: options.maxDelay || 30000, // 30 seconds
            jitterFactor: options.jitterFactor || 0.3,
            retryableErrors: options.retryableErrors || [
                'NetworkError',
                'TimeoutError',
                'AbortError',
                'QuotaExceededError'
            ]
        };
        
        // State tracking
        this.retryQueue = new Map();
        this.retryTimers = new Map();
        
        // Statistics
        this.stats = {
            totalRetries: 0,
            successfulRetries: 0,
            failedRetries: 0,
            averageRetryTime: 0
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Listen for retry events
        window.addEventListener('photo-upload-retry-requested', (e) => {
            this.handleRetryRequest(e.detail);
        });
        
        // Listen for network status changes
        window.addEventListener('online', () => {
            this.handleNetworkReconnect();
        });
        
        window.addEventListener('offline', () => {
            this.handleNetworkDisconnect();
        });
        
        console.log('UploadRetryManager initialized');
    }
    
    async retryUpload(tempId, imageData, metadata, error, attemptNumber) {
        console.log(`Scheduling retry for ${tempId}, attempt ${attemptNumber}`);
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
            console.log('Error is not retryable:', error.name);
            return this.handlePermanentFailure(tempId, error);
        }
        
        // Check retry limit
        if (attemptNumber > this.config.maxRetries) {
            console.log('Max retries exceeded for:', tempId);
            return this.handleMaxRetriesExceeded(tempId, error);
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateRetryDelay(attemptNumber);
        
        // Store retry information
        this.retryQueue.set(tempId, {
            imageData,
            metadata,
            error,
            attemptNumber,
            scheduledAt: Date.now(),
            retryAt: Date.now() + delay
        });
        
        // Update stats
        this.stats.totalRetries++;
        
        // Emit retry scheduled event
        this.emitRetryEvent('retry-scheduled', {
            tempId,
            attemptNumber,
            delay,
            error: error.name
        });
        
        // Schedule the retry
        const timer = setTimeout(() => {
            this.executeRetry(tempId);
        }, delay);
        
        this.retryTimers.set(tempId, timer);
        
        return {
            scheduled: true,
            tempId,
            retryAt: Date.now() + delay,
            attemptNumber
        };
    }
    
    calculateRetryDelay(attemptNumber) {
        // Exponential backoff: delay = base * 2^(attempt-1)
        let delay = this.config.baseDelay * Math.pow(2, attemptNumber - 1);
        
        // Cap at maximum delay
        delay = Math.min(delay, this.config.maxDelay);
        
        // Add jitter to prevent thundering herd
        const jitter = delay * this.config.jitterFactor * (Math.random() - 0.5);
        delay = Math.max(0, delay + jitter);
        
        console.log(`Retry delay for attempt ${attemptNumber}: ${Math.round(delay)}ms`);
        
        return Math.round(delay);
    }
    
    async executeRetry(tempId) {
        const retryInfo = this.retryQueue.get(tempId);
        if (!retryInfo) {
            console.warn('Retry info not found for:', tempId);
            return;
        }
        
        const startTime = Date.now();
        
        try {
            // Clear the timer
            this.retryTimers.delete(tempId);
            
            // Emit retry started event
            this.emitRetryEvent('retry-started', {
                tempId,
                attemptNumber: retryInfo.attemptNumber
            });
            
            // Get upload manager
            const uploadManager = window.photoUploadManager;
            if (!uploadManager) {
                throw new Error('Upload manager not available');
            }
            
            // Retry the upload
            const result = await uploadManager.processPhotoUpload({
                tempId,
                imageData: retryInfo.imageData,
                metadata: {
                    ...retryInfo.metadata,
                    isRetry: true,
                    retryAttempt: retryInfo.attemptNumber
                },
                attempts: retryInfo.attemptNumber
            });
            
            // Success!
            this.handleRetrySuccess(tempId, startTime);
            
            return result;
            
        } catch (error) {
            console.error(`Retry failed for ${tempId}:`, error);
            
            // Determine next action
            if (retryInfo.attemptNumber < this.config.maxRetries) {
                // Schedule another retry
                return this.retryUpload(
                    tempId,
                    retryInfo.imageData,
                    retryInfo.metadata,
                    error,
                    retryInfo.attemptNumber + 1
                );
            } else {
                // Max retries reached
                return this.handleMaxRetriesExceeded(tempId, error);
            }
        }
    }
    
    handleRetrySuccess(tempId, startTime) {
        const duration = Date.now() - startTime;
        
        // Update stats
        this.stats.successfulRetries++;
        this.updateAverageRetryTime(duration);
        
        // Clean up
        this.retryQueue.delete(tempId);
        this.retryTimers.delete(tempId);
        
        // Emit success event
        this.emitRetryEvent('retry-success', {
            tempId,
            duration
        });
        
        console.log(`Retry successful for ${tempId} after ${duration}ms`);
    }
    
    handlePermanentFailure(tempId, error) {
        // Update stats
        this.stats.failedRetries++;
        
        // Clean up
        this.retryQueue.delete(tempId);
        const timer = this.retryTimers.get(tempId);
        if (timer) {
            clearTimeout(timer);
            this.retryTimers.delete(tempId);
        }
        
        // Emit permanent failure event
        this.emitRetryEvent('retry-permanent-failure', {
            tempId,
            error: error.name,
            message: this.getADHDFriendlyErrorMessage(error)
        });
        
        return {
            success: false,
            tempId,
            error: error.name,
            permanent: true
        };
    }
    
    handleMaxRetriesExceeded(tempId, error) {
        console.log(`Max retries exceeded for ${tempId}`);
        
        // Store for manual retry later
        const retryInfo = this.retryQueue.get(tempId);
        if (retryInfo) {
            // Move to manual retry queue
            this.storeForManualRetry(tempId, retryInfo);
        }
        
        return this.handlePermanentFailure(tempId, error);
    }
    
    storeForManualRetry(tempId, retryInfo) {
        // Store in IndexedDB for later manual retry
        if (window.HybridStorageManager) {
            const storageManager = new window.HybridStorageManager();
            storageManager.savePhotoForRecovery({
                tempId,
                imageData: retryInfo.imageData,
                metadata: retryInfo.metadata,
                error: retryInfo.error.message,
                timestamp: Date.now(),
                maxRetriesReached: true
            });
        }
    }
    
    isRetryableError(error) {
        // Check if error is in retryable list
        if (this.config.retryableErrors.includes(error.name)) {
            return true;
        }
        
        // Check for specific error conditions
        if (error.message) {
            const message = error.message.toLowerCase();
            
            // Network-related errors
            if (message.includes('network') || 
                message.includes('fetch') ||
                message.includes('connection')) {
                return true;
            }
            
            // Timeout errors
            if (message.includes('timeout')) {
                return true;
            }
            
            // Temporary server errors
            if (error.status >= 500 && error.status < 600) {
                return true;
            }
            
            // Rate limiting (retry with backoff)
            if (error.status === 429) {
                return true;
            }
        }
        
        return false;
    }
    
    getADHDFriendlyErrorMessage(error) {
        const errorMessages = {
            'NetworkError': "Internet hiccup! We'll try again when connection is stable 🔄",
            'TimeoutError': "Taking longer than expected - we're still on it! ⏳",
            'QuotaExceededError': "Storage is getting full - let's make some space 📦",
            'AbortError': "Upload was interrupted - no worries, we saved your progress 💾",
            'NotAllowedError': "Need permission to save photos - tap to grant access 🔐",
            'InvalidStateError': "Something got confused - let's refresh and try again 🔧"
        };
        
        return errorMessages[error.name] || 
            "Something unexpected happened - your photo is safe and we'll try again 🛡️";
    }
    
    handleRetryRequest(detail) {
        const { id: tempId } = detail;
        
        // Check if already in retry queue
        if (this.retryQueue.has(tempId)) {
            console.log('Already in retry queue:', tempId);
            return;
        }
        
        // Manual retry request - need to get photo data
        // This would typically come from recovery storage
        console.log('Manual retry requested for:', tempId);
        
        this.emitRetryEvent('manual-retry-requested', { tempId });
    }
    
    handleNetworkReconnect() {
        console.log('Network reconnected - checking retry queue');
        
        // Get all pending retries
        const pendingRetries = Array.from(this.retryQueue.entries())
            .filter(([_, info]) => info.error && info.error.name === 'NetworkError');
        
        if (pendingRetries.length > 0) {
            console.log(`Found ${pendingRetries.length} network-related retries`);
            
            // Execute them with slight delays to prevent overload
            pendingRetries.forEach(([tempId, info], index) => {
                setTimeout(() => {
                    this.executeRetry(tempId);
                }, index * 1000); // 1 second between each
            });
        }
    }
    
    handleNetworkDisconnect() {
        console.log('Network disconnected - pausing retries');
        
        // Could implement: pause all network-related retries
        this.emitRetryEvent('retries-paused', {
            reason: 'offline'
        });
    }
    
    updateAverageRetryTime(duration) {
        const totalRetries = this.stats.successfulRetries;
        const currentAverage = this.stats.averageRetryTime;
        
        // Calculate new average
        this.stats.averageRetryTime = 
            (currentAverage * (totalRetries - 1) + duration) / totalRetries;
    }
    
    emitRetryEvent(eventType, detail) {
        window.dispatchEvent(new CustomEvent(`photo-upload-${eventType}`, {
            detail
        }));
    }
    
    // Public API
    
    getRetryStatus(tempId) {
        const retryInfo = this.retryQueue.get(tempId);
        if (!retryInfo) {
            return null;
        }
        
        return {
            attemptNumber: retryInfo.attemptNumber,
            scheduledAt: retryInfo.scheduledAt,
            retryAt: retryInfo.retryAt,
            timeRemaining: Math.max(0, retryInfo.retryAt - Date.now()),
            error: retryInfo.error.name
        };
    }
    
    cancelRetry(tempId) {
        const timer = this.retryTimers.get(tempId);
        if (timer) {
            clearTimeout(timer);
            this.retryTimers.delete(tempId);
        }
        
        this.retryQueue.delete(tempId);
        
        this.emitRetryEvent('retry-cancelled', { tempId });
        
        return true;
    }
    
    getStatistics() {
        return {
            ...this.stats,
            pendingRetries: this.retryQueue.size,
            activeTimers: this.retryTimers.size
        };
    }
    
    clearAllRetries() {
        // Cancel all timers
        this.retryTimers.forEach((timer) => {
            clearTimeout(timer);
        });
        
        // Clear queues
        this.retryQueue.clear();
        this.retryTimers.clear();
        
        console.log('All retries cleared');
    }
    
    destroy() {
        // Clean up event listeners
        window.removeEventListener('photo-upload-retry-requested', this.handleRetryRequest);
        window.removeEventListener('online', this.handleNetworkReconnect);
        window.removeEventListener('offline', this.handleNetworkDisconnect);
        
        // Clear all retries
        this.clearAllRetries();
        
        console.log('UploadRetryManager destroyed');
    }
}

// Export
window.UploadRetryManager = UploadRetryManager;