# Offline Detection Implementation - Working Document

## Overview
Implementation of offline detection for StackMap using existing Phase 4 error handling patterns. This replaces complex Service Worker offline handling with a simpler, more reliable approach.

## Context
- Phase 4 already has error UI infrastructure in place
- Need clear messaging when offline without panicking users
- Must detect actual connectivity, not just network adapter status
- Integrate seamlessly with existing patterns

## Implementation Status

### Todo List
1. ✅ Extend StackMapOfflineDetection in app.js with real connectivity check (pending)
2. ⏳ Create offline indicator UI using Phase 4 fallback pattern (pending)
3. ⏳ Integrate with IndexedDB and Service Worker (pending)
4. ⏳ Test offline detection with safe mode (pending)

## Technical Design

### 1. JavaScript Implementation (app.js)

Location: After Data Preservation System (line ~594)

```javascript
// Phase 4 Extension: Offline Detection System
(function() {
    'use strict';
    
    // Offline state tracking
    var offlineState = {
        isOffline: false,
        lastCheck: 0,
        checkInterval: 30000, // 30 seconds
        checkTimeout: 5000, // 5 second timeout for ping
        indicatorVisible: false
    };
    
    // Real connectivity check (not just network adapter)
    function checkConnectivity() {
        return new Promise(function(resolve) {
            // First check navigator.onLine as quick check
            if (!navigator.onLine) {
                resolve(false);
                return;
            }
            
            // Then do real connectivity check with timeout
            var resolved = false;
            var timeout = setTimeout(function() {
                if (!resolved) {
                    resolved = true;
                    resolve(false);
                }
            }, offlineState.checkTimeout);
            
            // Try to fetch a small endpoint
            fetch('/ping', {
                method: 'HEAD',
                cache: 'no-cache',
                mode: 'no-cors'
            }).then(function() {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    resolve(true);
                }
            }).catch(function() {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    resolve(false);
                }
            });
        });
    }
    
    // Update offline state and UI
    function updateOfflineState(isOnline) {
        var wasOffline = offlineState.isOffline;
        offlineState.isOffline = !isOnline;
        offlineState.lastCheck = Date.now();
        
        // Only update UI if state changed
        if (wasOffline !== offlineState.isOffline) {
            if (offlineState.isOffline) {
                showOfflineIndicator();
            } else {
                hideOfflineIndicator();
            }
            
            // Save offline state for data preservation
            if (window.StackMapDataPreservation) {
                window.StackMapDataPreservation.saveNow('offline-state', {
                    isOffline: offlineState.isOffline,
                    timestamp: Date.now()
                });
            }
        }
    }
    
    // Show offline indicator using Phase 4 pattern
    function showOfflineIndicator() {
        if (offlineState.indicatorVisible) return;
        
        try {
            // Create or update offline indicator
            var indicator = document.getElementById('offline-indicator');
            if (!indicator) {
                // Create indicator element
                indicator = document.createElement('div');
                indicator.id = 'offline-indicator';
                indicator.className = 'offline-indicator';
                indicator.setAttribute('role', 'status');
                indicator.setAttribute('aria-live', 'polite');
                
                // Use calming messaging
                indicator.innerHTML = 
                    '<div class="offline-message">' +
                        '<span class="offline-icon">📡</span> ' +
                        'You\'re offline - tasks are saved locally' +
                    '</div>';
                
                // Add to body
                document.body.appendChild(indicator);
            }
            
            // Show with animation
            setTimeout(function() {
                indicator.classList.add('offline-indicator-visible');
            }, 10);
            
            offlineState.indicatorVisible = true;
        } catch (e) {
            console.error('Failed to show offline indicator:', e);
        }
    }
    
    // Hide offline indicator
    function hideOfflineIndicator() {
        if (!offlineState.indicatorVisible) return;
        
        try {
            var indicator = document.getElementById('offline-indicator');
            if (indicator) {
                indicator.classList.remove('offline-indicator-visible');
                // Remove after animation
                setTimeout(function() {
                    if (indicator && indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 300);
            }
            
            offlineState.indicatorVisible = false;
        } catch (e) {
            console.error('Failed to hide offline indicator:', e);
        }
    }
    
    // Periodic connectivity check
    function scheduleCheck() {
        // Don't check if in safe mode and animations are disabled
        if (window.StackMapSafeMode && window.StackMapSafeMode.active) {
            return;
        }
        
        setTimeout(function() {
            checkConnectivity().then(function(isOnline) {
                updateOfflineState(isOnline);
                scheduleCheck(); // Schedule next check
            });
        }, offlineState.checkInterval);
    }
    
    // Initialize offline detection
    function init() {
        // Initial check
        checkConnectivity().then(function(isOnline) {
            updateOfflineState(isOnline);
        });
        
        // Start periodic checks
        scheduleCheck();
        
        // Listen for online/offline events as hints
        window.addEventListener('online', function() {
            // Verify with real check
            checkConnectivity().then(function(isOnline) {
                updateOfflineState(isOnline);
            });
        });
        
        window.addEventListener('offline', function() {
            // Immediately mark as offline
            updateOfflineState(false);
        });
    }
    
    // Expose API
    window.StackMapOfflineDetection = {
        init: init,
        checkNow: function() {
            return checkConnectivity().then(function(isOnline) {
                updateOfflineState(isOnline);
                return isOnline;
            });
        },
        isOffline: function() {
            return offlineState.isOffline;
        }
    };
    
    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
```

### 2. CSS Implementation (base.css)

```css
/* Offline indicator - bottom banner pattern */
.offline-indicator {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #4A90E2; /* Calming blue from research */
    color: #ffffff;
    padding: 12px 16px;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 1000;
    text-align: center;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    /* Ensure 44px touch target */
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    /* Account for safe area on mobile devices */
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.offline-indicator-visible {
    transform: translateY(0);
}

.offline-message {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.offline-icon {
    font-size: 18px;
}

/* Safe mode adjustments */
.safe-mode .offline-indicator {
    transition: none;
    animation: none;
}

/* Platform-specific adjustments */
.platform-ios .offline-indicator {
    backdrop-filter: blur(10px);
    background: rgba(74, 144, 226, 0.95);
}

.platform-tv .offline-indicator {
    font-size: 18px;
    min-height: 60px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
    .offline-indicator {
        border-top: 2px solid #ffffff;
    }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
    .offline-indicator {
        transition: none;
    }
}
```

## Key Design Decisions

### 1. Real Connectivity Check
- Not relying solely on `navigator.onLine` which only checks network adapter
- Actual fetch to `/ping` endpoint to verify real connectivity
- 5-second timeout to prevent hanging
- Fallback to no-cors mode for cross-origin issues

### 2. Non-Intrusive UI
- Bottom banner instead of modal or inline error
- Calming blue (#4A90E2) instead of error red
- Clear, reassuring message: "You're offline - tasks are saved locally"
- Emoji icon (📡) for visual recognition

### 3. Performance Considerations
- 30-second check interval to balance battery/performance
- Skips checks in safe mode when animations are disabled
- Lightweight Promise-based implementation
- Cleanup of DOM elements when online

### 4. Integration Points

#### Phase 4 Error System
- Reuses existing UI patterns
- Non-blocking approach
- CSS-controlled visibility
- Graceful failure handling

#### Data Preservation System
- Saves offline state via `StackMapDataPreservation.saveNow()`
- Ensures state persists across reloads
- Works with existing data recovery mechanisms

#### Safe Mode
- Respects animation preferences
- Skips periodic checks if needed
- No transitions in safe mode

#### Platform Detection
- iOS: Adds backdrop blur for native feel
- TV: Larger font size and touch targets
- PWA: Works seamlessly offline

## Testing Checklist

### Manual Testing
- [ ] Toggle airplane mode - banner appears/disappears
- [ ] Disable network adapter - detects offline
- [ ] Block `/ping` endpoint - falls back gracefully
- [ ] Test with safe mode active - no animations
- [ ] Test on mobile devices - proper bottom spacing
- [ ] Test on TV - larger UI elements

### Integration Testing
- [ ] IndexedDB continues saving while offline
- [ ] Service Worker isn't disrupted
- [ ] Data preservation works offline
- [ ] Error handlers don't conflict
- [ ] Multiple offline/online transitions

### Edge Cases
- [ ] Rapid online/offline toggling
- [ ] Extended offline periods (hours/days)
- [ ] Page reload while offline
- [ ] JavaScript errors during detection
- [ ] DOM manipulation failures

## Implementation Notes

### Order of Implementation
1. Add JavaScript to app.js after Data Preservation System
2. Add CSS to base.css in the Phase 4 section
3. Test basic online/offline detection
4. Verify safe mode integration
5. Test across platforms
6. Document any issues found

### Potential Issues
- `/ping` endpoint may not exist - consider fallback URL
- Cross-origin restrictions with no-cors mode
- Battery impact from periodic checking
- Memory leaks from DOM manipulation

### Future Enhancements
- Configurable check interval
- Different messages for different offline scenarios
- Integration with sync indicators
- Offline duration tracking

## References
- Phase 4 Working Document: `/refactor/docs/PHASE4_WORKING_DOCUMENT.md`
- Error Detection System: `app.js` lines 152-402
- Data Preservation System: `app.js` lines 404-594
- Fallback UI Pattern: `index.html` lines 252-264