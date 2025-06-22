# StackMap Error Handling Patterns

## Overview

This document details the error handling strategies used throughout StackMap. Given the application's focus on reliability for special needs families, robust error handling is critical to prevent disruptions to daily routines.

## Core Principles

1. **Graceful Degradation**: Features should fail gracefully without breaking core functionality
2. **User-Friendly Messages**: Error messages must be clear and non-technical
3. **Silent Recovery**: Attempt automatic recovery before alerting users
4. **Data Preservation**: Never lose user data due to errors
5. **Accessibility**: Error states must be accessible to screen readers

## Error Categories

### 1. Critical Errors
Errors that prevent the application from functioning:
- LocalStorage unavailable
- Browser incompatibility
- Corrupted core data

### 2. Major Errors
Errors that affect features but not core functionality:
- Google Drive sync failures
- Network connectivity issues
- Import/export problems

### 3. Minor Errors
Errors that can be handled silently:
- Animation failures
- Non-critical asset loading
- Telemetry issues

## Error Handling Patterns

### 1. Global Error Handler

```javascript
// Global error boundary for unexpected errors
window.addEventListener('error', (event) => {
    const error = {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
    
    // Log for debugging
    console.error('[Global Error]', error);
    
    // Attempt recovery based on error type
    handleGlobalError(error);
    
    // Prevent default browser error handling
    event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason);
    
    // Handle async errors
    handleAsyncError(event.reason);
    
    // Prevent default browser handling
    event.preventDefault();
});
```

### 2. Try-Catch Patterns

```javascript
// Pattern 1: Operation with fallback
function saveToLocalStorage(data) {
    try {
        const serialized = JSON.stringify(data);
        localStorage.setItem('stackmap-data', serialized);
        return { success: true };
    } catch (error) {
        // Handle quota exceeded
        if (error.name === 'QuotaExceededError') {
            try {
                // Clear old data and retry
                clearOldData();
                localStorage.setItem('stackmap-data', serialized);
                return { success: true, warning: 'Storage cleaned' };
            } catch (retryError) {
                return { 
                    success: false, 
                    error: 'Storage full. Please export your data.' 
                };
            }
        }
        
        // Handle other errors
        console.error('[Storage Error]', error);
        return { 
            success: false, 
            error: 'Could not save data. Please try again.' 
        };
    }
}

// Pattern 2: Async operation with timeout
async function syncWithDrive(data, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(data),
            signal: controller.signal
        });
        
        if (!response.ok) {
            throw new Error(`Sync failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Sync timeout. Please check your connection.');
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Pattern 3: Validation with detailed errors
function validateActivity(activity) {
    const errors = [];
    
    if (!activity.title || activity.title.trim() === '') {
        errors.push('Title is required');
    }
    
    if (activity.title && activity.title.length > CONFIG.MAX_TITLE_LENGTH) {
        errors.push(`Title must be ${CONFIG.MAX_TITLE_LENGTH} characters or less`);
    }
    
    if (activity.time && !isValidTimeFormat(activity.time)) {
        errors.push('Time must be in format HH:MM AM/PM');
    }
    
    if (errors.length > 0) {
        throw new ValidationError(errors);
    }
    
    return true;
}
```

### 3. Component-Level Error Boundaries

```javascript
// Base component with error handling
class ComponentWithErrorBoundary {
    constructor(name) {
        this.name = name;
        this.errorState = null;
    }
    
    safeRender() {
        try {
            this.errorState = null;
            return this.render();
        } catch (error) {
            console.error(`[${this.name}] Render error:`, error);
            this.errorState = error;
            return this.renderError();
        }
    }
    
    renderError() {
        return `
            <div class="component-error" role="alert">
                <p>Sorry, this section couldn't load properly.</p>
                <button onclick="location.reload()">Refresh Page</button>
            </div>
        `;
    }
}

// Example usage in HybridPanelManager
class HybridPanelManager extends ComponentWithErrorBoundary {
    constructor(app) {
        super('HybridPanelManager');
        this.app = app;
    }
    
    renderPanel(panelId) {
        try {
            const content = this.getPanelContent(panelId);
            return this.safeRender(content);
        } catch (error) {
            // Log specific error
            console.error(`[Panel ${panelId}] Error:`, error);
            
            // Show user-friendly message
            return `
                <div class="panel-error">
                    <p>This panel is temporarily unavailable.</p>
                    <button onclick="hybridPanelManager.retryPanel('${panelId}')">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}
```

### 4. Async Error Handling

```javascript
// Promise-based error handling
class GoogleDriveSync {
    async performSync() {
        try {
            // Check authentication
            if (!this.isSignedIn) {
                throw new AuthError('Not signed in');
            }
            
            // Attempt sync with retry
            return await this.retryOperation(
                () => this.syncData(),
                { maxRetries: 3, delay: 1000 }
            );
            
        } catch (error) {
            // Handle specific error types
            if (error instanceof AuthError) {
                this.showSignInPrompt();
            } else if (error instanceof NetworkError) {
                this.queueForLaterSync();
            } else {
                this.handleSyncError(error);
            }
            
            // Don't throw - handle gracefully
            return { success: false, error: error.message };
        }
    }
    
    async retryOperation(operation, options = {}) {
        const { maxRetries = 3, delay = 1000 } = options;
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                // Don't retry on permanent errors
                if (this.isPermanentError(error)) {
                    throw error;
                }
                
                // Wait before retrying
                if (i < maxRetries - 1) {
                    await this.delay(delay * Math.pow(2, i)); // Exponential backoff
                }
            }
        }
        
        throw lastError;
    }
}
```

### 5. Data Validation and Sanitization

```javascript
// Input sanitization to prevent errors
class DataValidator {
    static sanitizeText(input, maxLength) {
        if (typeof input !== 'string') {
            return '';
        }
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML
            .slice(0, maxLength);
    }
    
    static sanitizeActivity(activity) {
        try {
            return {
                id: activity.id || this.generateId(),
                title: this.sanitizeText(activity.title, CONFIG.MAX_TITLE_LENGTH),
                description: this.sanitizeText(activity.description, CONFIG.MAX_DESCRIPTION_LENGTH),
                emoji: this.validateEmoji(activity.emoji),
                completed: Boolean(activity.completed),
                time: this.sanitizeTime(activity.time),
                backgroundColor: this.sanitizeColor(activity.backgroundColor)
            };
        } catch (error) {
            console.error('[Validation] Activity sanitization failed:', error);
            // Return safe defaults
            return this.getDefaultActivity();
        }
    }
    
    static validateEmoji(emoji) {
        // Check if valid emoji
        if (!emoji || !this.isValidEmoji(emoji)) {
            return CONFIG.DEFAULT_EMOJI;
        }
        return emoji;
    }
}
```

### 6. Storage Error Recovery

```javascript
// LocalStorage error handling
class StorageManager {
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return { success: true };
        } catch (error) {
            return this.handleStorageError(error, key, data);
        }
    }
    
    static handleStorageError(error, key, data) {
        console.error('[Storage] Save failed:', error);
        
        // Try to clear space
        if (error.name === 'QuotaExceededError') {
            try {
                this.clearOldData();
                localStorage.setItem(key, JSON.stringify(data));
                
                this.showNotification(
                    'Storage was full. Old data has been cleared.',
                    'warning'
                );
                
                return { success: true, cleaned: true };
            } catch (retryError) {
                // Last resort - offer export
                this.showExportPrompt(data);
                return { success: false, requiresExport: true };
            }
        }
        
        // Try alternative storage
        try {
            this.saveToIndexedDB(key, data);
            return { success: true, method: 'indexeddb' };
        } catch (fallbackError) {
            // Complete failure
            this.showCriticalError();
            return { success: false, critical: true };
        }
    }
    
    static clearOldData() {
        // Remove non-essential data
        const keysToPreserve = ['stackmap-data', 'stackmap-users'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (key.startsWith('stackmap-') && !keysToPreserve.includes(key)) {
                localStorage.removeItem(key);
            }
        });
    }
}
```

### 7. Network Error Handling

```javascript
// Network-aware error handling
class NetworkManager {
    static async fetchWithFallback(url, options = {}) {
        // Check online status first
        if (!navigator.onLine) {
            throw new NetworkError('No internet connection');
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                timeout: options.timeout || 30000
            });
            
            if (!response.ok) {
                throw new HTTPError(response.status, response.statusText);
            }
            
            return response;
        } catch (error) {
            // Handle different error types
            if (error instanceof TypeError) {
                // Network failure
                throw new NetworkError('Network request failed');
            } else if (error instanceof HTTPError) {
                // Server error
                throw error;
            } else {
                // Unknown error
                throw new Error('Request failed: ' + error.message);
            }
        }
    }
    
    static handleNetworkError(error) {
        if (error instanceof NetworkError) {
            // Queue for later
            this.queueRequest();
            this.showOfflineMessage();
        } else if (error instanceof HTTPError) {
            if (error.status === 401) {
                // Re-authenticate
                this.refreshAuth();
            } else if (error.status >= 500) {
                // Server error - retry later
                this.scheduleRetry();
            }
        }
    }
}
```

### 8. UI Error States

```javascript
// Consistent error UI patterns
class UIErrorHandler {
    static showError(container, error, options = {}) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.setAttribute('role', 'alert');
        errorEl.setAttribute('aria-live', 'polite');
        
        errorEl.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <p class="error-text">${this.getUserMessage(error)}</p>
                ${options.retry ? `
                    <button class="btn-retry" onclick="${options.retry}">
                        Try Again
                    </button>
                ` : ''}
            </div>
        `;
        
        container.appendChild(errorEl);
        
        // Auto-dismiss after delay
        if (options.autoDismiss) {
            setTimeout(() => {
                errorEl.remove();
            }, options.dismissDelay || 5000);
        }
    }
    
    static getUserMessage(error) {
        // Map technical errors to user-friendly messages
        const errorMessages = {
            'NetworkError': 'Please check your internet connection.',
            'QuotaExceededError': 'Storage is full. Please delete some old data.',
            'InvalidStateError': 'Something went wrong. Please refresh the page.',
            'NotFoundError': 'The requested item could not be found.',
            'PermissionDenied': 'You don\'t have permission to do that.'
        };
        
        return errorMessages[error.name] || 'An unexpected error occurred.';
    }
}
```

### 9. Error Recovery Strategies

```javascript
// Automatic recovery mechanisms
class ErrorRecovery {
    static async attemptRecovery(error, context) {
        console.log(`[Recovery] Attempting recovery for ${error.name}`);
        
        switch (error.name) {
            case 'DataCorruption':
                return await this.recoverFromCorruption();
                
            case 'SyncConflict':
                return await this.resolveSyncConflict();
                
            case 'AuthExpired':
                return await this.refreshAuthentication();
                
            case 'StorageError':
                return await this.recoverStorage();
                
            default:
                return false;
        }
    }
    
    static async recoverFromCorruption() {
        try {
            // Try to load backup
            const backup = await this.loadBackup();
            if (backup) {
                await this.restoreFromBackup(backup);
                return true;
            }
            
            // Try to repair data
            const repaired = await this.repairData();
            if (repaired) {
                return true;
            }
            
            // Last resort - reset to defaults
            return await this.resetToDefaults();
        } catch (error) {
            console.error('[Recovery] Corruption recovery failed:', error);
            return false;
        }
    }
}
```

### 10. Error Logging and Monitoring

```javascript
// Structured error logging
class ErrorLogger {
    static log(error, context = {}) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context: {
                ...context,
                userAgent: navigator.userAgent,
                url: window.location.href,
                appVersion: CONFIG.APP_VERSION
            }
        };
        
        // Log to console in development
        if (this.isDevelopment()) {
            console.error('[Error Log]', errorLog);
        }
        
        // Store for debugging (limited size)
        this.storeErrorLog(errorLog);
        
        // Send to monitoring service (if configured)
        if (CONFIG.ERROR_REPORTING_ENABLED) {
            this.sendToMonitoring(errorLog);
        }
    }
    
    static storeErrorLog(errorLog) {
        try {
            let logs = JSON.parse(localStorage.getItem('stackmap-error-logs') || '[]');
            logs.push(errorLog);
            
            // Keep only last 50 errors
            if (logs.length > 50) {
                logs = logs.slice(-50);
            }
            
            localStorage.setItem('stackmap-error-logs', JSON.stringify(logs));
        } catch (error) {
            // Don't let logging errors break the app
            console.error('[ErrorLogger] Could not store log:', error);
        }
    }
}
```

## Error Prevention Strategies

### 1. Input Validation
```javascript
// Prevent errors through validation
function validateBeforeSave(data) {
    const errors = [];
    
    // Required fields
    if (!data.title) errors.push('Title is required');
    
    // Length limits
    if (data.title?.length > CONFIG.MAX_TITLE_LENGTH) {
        errors.push(`Title too long (max ${CONFIG.MAX_TITLE_LENGTH} characters)`);
    }
    
    // Format validation
    if (data.time && !isValidTimeFormat(data.time)) {
        errors.push('Invalid time format');
    }
    
    if (errors.length > 0) {
        throw new ValidationError(errors);
    }
}
```

### 2. Defensive Programming
```javascript
// Guard against null/undefined
function safeGetProperty(obj, path, defaultValue = null) {
    try {
        return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? defaultValue;
    } catch (error) {
        return defaultValue;
    }
}

// Safe array operations
function safeArrayOperation(array, operation, fallback = []) {
    try {
        if (!Array.isArray(array)) return fallback;
        return operation(array);
    } catch (error) {
        console.error('[Array Operation] Failed:', error);
        return fallback;
    }
}
```

### 3. Feature Detection
```javascript
// Check capabilities before using
class FeatureDetector {
    static canUseLocalStorage() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    static canUseServiceWorker() {
        return 'serviceWorker' in navigator;
    }
    
    static canUseWebShare() {
        return navigator.share !== undefined;
    }
}
```

## Testing Error Scenarios

### 1. Unit Tests for Error Handling
```javascript
// Test error scenarios
describe('Error Handling', () => {
    it('should handle storage quota exceeded', async () => {
        // Mock localStorage to throw quota error
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('QuotaExceededError');
        });
        
        const result = await saveData(testData);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('storage full');
    });
    
    it('should recover from network errors', async () => {
        // Mock fetch to fail
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Network error'));
        
        const result = await syncData();
        
        expect(result.queued).toBe(true);
        expect(result.error).toContain('offline');
    });
});
```

### 2. Error Simulation for Testing
```javascript
// Development tool for testing error handling
class ErrorSimulator {
    static simulateStorageError() {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
            throw new DOMException('QuotaExceededError');
        };
        
        // Restore after 5 seconds
        setTimeout(() => {
            localStorage.setItem = originalSetItem;
        }, 5000);
    }
    
    static simulateNetworkError() {
        window.dispatchEvent(new Event('offline'));
    }
    
    static simulateDataCorruption() {
        localStorage.setItem('stackmap-data', 'corrupted{data}');
    }
}
```

## Best Practices Summary

1. **Always use try-catch** for operations that might fail
2. **Provide fallbacks** for non-critical features
3. **Log errors with context** for debugging
4. **Show user-friendly messages** instead of technical errors
5. **Test error scenarios** explicitly
6. **Implement recovery strategies** where possible
7. **Prevent errors** through validation and defensive coding
8. **Monitor errors** in production (privacy-conscious)
9. **Document error handling** in code comments
10. **Keep error handling consistent** across the application

## Error Message Guidelines

### Do's:
- Be clear and concise
- Suggest next steps
- Use positive language
- Include recovery options
- Make errors accessible

### Don'ts:
- Show stack traces to users
- Use technical jargon
- Blame the user
- Leave users stuck
- Ignore accessibility

## Conclusion

Robust error handling is essential for StackMap's reliability. By following these patterns, the application can gracefully handle failures while maintaining a positive user experience for families who depend on it for their daily routines.