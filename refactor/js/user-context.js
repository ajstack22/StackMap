/**
 * User Context Management - Story #107 User Data Separation
 * Manages user context and provides user-aware data operations
 * Ensures proper data isolation between users
 */

(function() {
    'use strict';
    
    const UserContext = {
        isInitialized: false,
        currentUserId: null,
        eventListeners: [],
        
        // Cache for performance
        userCache: new Map(),
        cacheTimeout: 30000, // 30 seconds
        
        /**
         * Initialize user context system
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            try {
                // Get current user from UserManager
                self.initializeCurrentUser();
                
                // Setup event listeners
                self.setupEventListeners();
                
                // Initialize user-specific storage
                self.initializeUserStorage();
                
                self.isInitialized = true;
                console.log('UserContext: Initialized with user:', self.currentUserId);
                
                // Dispatch initialization event
                document.dispatchEvent(new CustomEvent('userContextInitialized', {
                    detail: { userId: self.currentUserId }
                }));
                
            } catch (error) {
                console.error('UserContext: Failed to initialize:', error);
                // Fall back to guest mode
                self.currentUserId = 'guest';
                self.isInitialized = true;
            }
        },
        
        /**
         * Initialize current user from UserManager
         */
        initializeCurrentUser: function() {
            const self = this;
            
            if (window.UserManager && window.UserManager.getCurrentUser) {
                const currentUser = window.UserManager.getCurrentUser();
                if (currentUser && currentUser.id) {
                    self.currentUserId = currentUser.id;
                } else {
                    // Create default user if none exists
                    self.createDefaultUser();
                }
            } else {
                // Fallback to default user ID
                self.currentUserId = 'default-user';
                console.warn('UserContext: UserManager not available, using default user');
            }
        },
        
        /**
         * Create default user if none exists
         */
        createDefaultUser: function() {
            const self = this;
            
            // Check if we have any existing global activities to migrate
            const hasGlobalActivities = self.hasExistingGlobalActivities();
            
            if (hasGlobalActivities) {
                // Use migration user ID
                self.currentUserId = 'migrated-user-' + Date.now();
                console.log('UserContext: Created migration user:', self.currentUserId);
            } else {
                // Create first-time user
                self.currentUserId = 'user-' + Date.now();
                console.log('UserContext: Created default user:', self.currentUserId);
            }
        },
        
        /**
         * Check if there are existing global activities that need migration
         */
        hasExistingGlobalActivities: function() {
            try {
                // Check localStorage for existing activities
                const globalActivities = localStorage.getItem('stackmap_activities');
                const globalTasks = localStorage.getItem('stackmap_tasks');
                
                if (globalActivities) {
                    const activities = JSON.parse(globalActivities);
                    return Array.isArray(activities) && activities.length > 0;
                }
                
                if (globalTasks) {
                    const tasks = JSON.parse(globalTasks);
                    return Array.isArray(tasks) && tasks.length > 0;
                }
                
                return false;
            } catch (error) {
                console.warn('UserContext: Error checking for global activities:', error);
                return false;
            }
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Listen for user changes from UserManager
            document.addEventListener('userChanged', function(e) {
                if (e.detail && e.detail.userId) {
                    self.switchUser(e.detail.userId);
                }
            });
            
            // Listen for user creation
            document.addEventListener('userCreated', function(e) {
                if (e.detail && e.detail.userId) {
                    self.initializeUserData(e.detail.userId);
                }
            });
            
            // Listen for user deletion
            document.addEventListener('userDeleted', function(e) {
                if (e.detail && e.detail.userId) {
                    self.cleanupUserData(e.detail.userId);
                }
            });
            
            // Performance monitoring integration
            if (window.MemoryManager) {
                window.MemoryManager.registerCleanup(function() {
                    self.clearUserCache();
                });
            }
        },
        
        /**
         * Initialize user-specific storage structure
         */
        initializeUserStorage: function() {
            const self = this;
            const userId = self.currentUserId;
            
            if (!userId) return;
            
            // Check if user data already exists
            const userData = self.getUserData(userId);
            if (!userData) {
                // Create initial user data structure
                const initialData = {
                    userId: userId,
                    activities: {
                        today: [],
                        tomorrow: []
                    },
                    customTitle: 'StackMap', // Default title
                    activityCount: {
                        today: 0,
                        tomorrow: 0,
                        total: 0
                    },
                    lastActive: Date.now(),
                    created: Date.now()
                };
                
                self.setUserData(userId, initialData);
                console.log('UserContext: Initialized storage for user:', userId);
            }
        },
        
        /**
         * Get current user ID
         */
        getCurrentUserId: function() {
            if (!this.isInitialized) {
                console.warn('UserContext: Not initialized, returning null user ID');
                return null;
            }
            return this.currentUserId;
        },
        
        /**
         * Switch to different user
         */
        switchUser: function(userId) {
            const self = this;
            
            if (!userId || userId === self.currentUserId) {
                return; // No change needed
            }
            
            const previousUserId = self.currentUserId;
            
            // Performance monitoring
            if (window.PerformanceMonitor) {
                window.PerformanceMonitor.mark('user-switch-start');
            }
            
            try {
                // Update last active time for previous user
                if (previousUserId) {
                    self.updateLastActive(previousUserId);
                }
                
                // Switch to new user
                self.currentUserId = userId;
                
                // Initialize storage for new user if needed
                self.initializeUserStorage();
                
                // Clear relevant caches
                self.invalidateUserCaches(userId);
                
                // Update last active for new user
                self.updateLastActive(userId);
                
                console.log('UserContext: Switched from', previousUserId, 'to', userId);
                
                // Dispatch user switch event
                document.dispatchEvent(new CustomEvent('userSwitched', {
                    detail: { 
                        previousUserId: previousUserId,
                        currentUserId: userId 
                    }
                }));
                
                // Performance monitoring
                if (window.PerformanceMonitor) {
                    window.PerformanceMonitor.mark('user-switch-end');
                    window.PerformanceMonitor.measure('user-switch', 'user-switch-start', 'user-switch-end');
                }
                
            } catch (error) {
                console.error('UserContext: Failed to switch user:', error);
                // Revert to previous user
                self.currentUserId = previousUserId;
            }
        },
        
        /**
         * Validate user access to activity
         */
        validateUserAccess: function(userId, activityId) {
            if (!userId || !activityId) {
                return false;
            }
            
            // Get user activities
            const userData = this.getUserData(userId);
            if (!userData || !userData.activities) {
                return false;
            }
            
            // Check both today and tomorrow activities
            const allActivities = [
                ...(userData.activities.today || []),
                ...(userData.activities.tomorrow || [])
            ];
            
            return allActivities.some(activity => activity.id === activityId);
        },
        
        /**
         * Get storage key for user-specific data
         */
        getUserStorageKey: function(userId, dataType) {
            if (!userId || !dataType) {
                throw new Error('UserContext: userId and dataType required for storage key');
            }
            
            return `stackmap_user_${userId}_${dataType}`;
        },
        
        /**
         * Get user data from storage
         */
        getUserData: function(userId) {
            if (!userId) return null;
            
            // Check cache first
            const cached = this.userCache.get(userId);
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                return cached.data;
            }
            
            try {
                const storageKey = this.getUserStorageKey(userId, 'data');
                const stored = localStorage.getItem(storageKey);
                
                if (stored) {
                    const userData = JSON.parse(stored);
                    
                    // Cache the data
                    this.userCache.set(userId, {
                        data: userData,
                        timestamp: Date.now()
                    });
                    
                    return userData;
                }
                
                return null;
            } catch (error) {
                console.error('UserContext: Failed to get user data:', error);
                return null;
            }
        },
        
        /**
         * Set user data to storage
         */
        setUserData: function(userId, userData) {
            if (!userId || !userData) {
                throw new Error('UserContext: userId and userData required');
            }
            
            try {
                const storageKey = this.getUserStorageKey(userId, 'data');
                userData.lastActive = Date.now();
                
                localStorage.setItem(storageKey, JSON.stringify(userData));
                
                // Update cache
                this.userCache.set(userId, {
                    data: userData,
                    timestamp: Date.now()
                });
                
                return true;
            } catch (error) {
                console.error('UserContext: Failed to set user data:', error);
                return false;
            }
        },
        
        /**
         * Initialize data for new user
         */
        initializeUserData: function(userId) {
            const initialData = {
                userId: userId,
                activities: {
                    today: [],
                    tomorrow: []
                },
                customTitle: 'StackMap',
                activityCount: {
                    today: 0,
                    tomorrow: 0,
                    total: 0
                },
                lastActive: Date.now(),
                created: Date.now()
            };
            
            return this.setUserData(userId, initialData);
        },
        
        /**
         * Update last active timestamp
         */
        updateLastActive: function(userId) {
            if (!userId) return;
            
            const userData = this.getUserData(userId);
            if (userData) {
                userData.lastActive = Date.now();
                this.setUserData(userId, userData);
            }
        },
        
        /**
         * Clean up user data on deletion
         */
        cleanupUserData: function(userId) {
            if (!userId) return;
            
            try {
                // Remove from localStorage
                const storageKey = this.getUserStorageKey(userId, 'data');
                localStorage.removeItem(storageKey);
                
                // Remove from cache
                this.userCache.delete(userId);
                
                // Invalidate badge cache for this user
                if (window.BadgeCache) {
                    // Clear badges that might be associated with this user
                    const cleared = window.BadgeCache.clear();
                    console.log(`UserContext: Cleared ${cleared} badges after user deletion`);
                }
                
                console.log('UserContext: Cleaned up data for user:', userId);
                
                // Dispatch cleanup event
                document.dispatchEvent(new CustomEvent('userDataCleaned', {
                    detail: { userId: userId }
                }));
                
            } catch (error) {
                console.error('UserContext: Failed to cleanup user data:', error);
            }
        },
        
        /**
         * Invalidate caches for user
         */
        invalidateUserCaches: function(userId) {
            // Clear user cache
            this.userCache.delete(userId);
            
            // Invalidate badge cache entries for this user
            if (window.BadgeCache) {
                // Badge cache doesn't directly store by user, but we can clear it
                // when switching users to ensure fresh rendering
                console.log('UserContext: Clearing badge cache for user switch');
            }
            
            // Clear virtual scroll optimizer cache
            if (window.VirtualScrollOptimizer) {
                window.VirtualScrollOptimizer.optimizeMemoryUsage();
            }
        },
        
        /**
         * Clear all user cache
         */
        clearUserCache: function() {
            this.userCache.clear();
            console.log('UserContext: Cleared user cache');
        },
        
        /**
         * Get user statistics
         */
        getUserStats: function(userId) {
            const userData = this.getUserData(userId);
            if (!userData) return null;
            
            return {
                userId: userId,
                activityCount: userData.activityCount || { today: 0, tomorrow: 0, total: 0 },
                lastActive: userData.lastActive,
                created: userData.created,
                customTitle: userData.customTitle || 'StackMap'
            };
        },
        
        /**
         * Get all user IDs (for admin/migration purposes)
         */
        getAllUserIds: function() {
            const userIds = [];
            
            try {
                // Scan localStorage for user data keys
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('stackmap_user_') && key.endsWith('_data')) {
                        // Extract user ID from key: stackmap_user_{userId}_data
                        const match = key.match(/^stackmap_user_(.+)_data$/);
                        if (match && match[1]) {
                            userIds.push(match[1]);
                        }
                    }
                }
                
                return userIds;
            } catch (error) {
                console.error('UserContext: Failed to get user IDs:', error);
                return [];
            }
        },
        
        /**
         * Get context info for debugging
         */
        getDebugInfo: function() {
            return {
                isInitialized: this.isInitialized,
                currentUserId: this.currentUserId,
                cacheSize: this.userCache.size,
                allUserIds: this.getAllUserIds(),
                hasGlobalActivities: this.hasExistingGlobalActivities()
            };
        },
        
        /**
         * Cleanup resources
         */
        destroy: function() {
            // Clear cache
            this.clearUserCache();
            
            // Remove event listeners
            this.eventListeners.forEach(listener => {
                listener.element.removeEventListener(listener.event, listener.handler);
            });
            this.eventListeners = [];
            
            // Reset state
            this.isInitialized = false;
            this.currentUserId = null;
        }
    };
    
    // Export to global scope
    window.UserContext = UserContext;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            UserContext.init();
        });
    } else {
        // DOM already loaded
        setTimeout(() => UserContext.init(), 100);
    }
    
})();