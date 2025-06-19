// state.js - Application state management with card type support and filter state
// === STATE MANAGEMENT ===
class AppState {
    constructor() {
        this.activities = [];
        this.settings = {
            title: 'StackMap User',
            subtitle: 'Routine Ready',
            isDefaultTitle: true,
            backgroundColor: CONFIG.DEFAULT_COLOR,
            showNumbers: CONFIG.SHOW_NUMBERS_DEFAULT,
            showCompletionIndicators: CONFIG.SHOW_COMPLETION_DEFAULT,
            autoSync: true,           // NEW: Auto-sync with Google Drive
            backupReminder: true      // NEW: Show weekly backup reminders
        };
        this.ui = {
            editMode: false,
            fabExpanded: false,      // NEW: Track FAB expansion state
            fabAnimating: false,     // NEW: Prevent rapid toggle during animations
            editingCardIndex: -1,
            showingNewCardForm: false,
            selectedEmoji: CONFIG.DEFAULT_EMOJI,
            draggedElement: null,
            cardFilter: '', // Story 2: Filter state
            currentDay: 'today' // Story 4: Current day context
        };
        
        // Sync metadata for Google Drive
        this.syncMetadata = {
            version: 0,
            lastModified: new Date().toISOString(),
            deviceId: this.generateDeviceId(),
            deviceName: this.getDeviceName()
        };
        
        // Multi-user support
        this.users = {
            currentUserId: CONFIG.DEFAULT_USER_ID,
            profiles: {
                [CONFIG.DEFAULT_USER_ID]: {
                    id: CONFIG.DEFAULT_USER_ID,
                    name: 'StackMap User',
                    activities: [],
                    tomorrowActivities: [], // Story 4: Tomorrow's activities
                    settings: {
                        title: 'StackMap User',
                        subtitle: 'Routine Ready',
                        isDefaultTitle: true,
                        backgroundColor: CONFIG.DEFAULT_COLOR,
                        showNumbers: CONFIG.SHOW_NUMBERS_DEFAULT,
                        showCompletionIndicators: CONFIG.SHOW_COMPLETION_DEFAULT
                    },
                    library: [] // User-specific library cards
                }
            },
            groupLibrary: [] // Shared library for all users
        };
        
        // Initialize default user with default activities
        this._initializeDefaultUser();
        
        // External save handler
        this.onStateChange = null;
        
        // === OPERATION LOG SYSTEM ===
        // Track all mutations for sync and dirty tracking
        this._operationLog = [];
        this._dirtyUsers = new Set();
        this._dirtyActivities = new Map(); // Map<userId, Set<activityId>>
        this._maxOperationLogSize = 1000;
    }

    // Initialize default user with default activities
    _initializeDefaultUser() {
        const defaultUser = this.users.profiles[CONFIG.DEFAULT_USER_ID];
        if (defaultUser && defaultUser.activities.length === 0) {
            const defaultActivities = this.getDefaultActivitiesForNewUser();
            defaultUser.activities = defaultActivities;
            
            // Deep clone activities for tomorrow with new IDs to avoid shared references
            // This is the same approach used in addUser method
            defaultUser.tomorrowActivities = this.deepCloneActivities(defaultActivities, true); // true = generate new IDs
            
            // Ensure card numbers are assigned
            defaultUser.activities.forEach((activity, index) => {
                activity.cardNumber = index + 1;
            });
            defaultUser.tomorrowActivities.forEach((activity, index) => {
                activity.cardNumber = index + 1;
            });
            
            // Sync with legacy activities array - deep clone
            this.activities = this.deepCloneActivities(defaultUser.activities);
        }
    }

    // === OPERATION LOG HELPER METHODS ===
    
    /**
     * Track a mutation operation
     * @param {string} type - Operation type
     * @param {Object} data - Operation data
     */
    _trackOperation(type, data) {
        const operation = {
            id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            timestamp: Date.now(),
            userId: this.users.currentUserId,
            data: data,
            syncStatus: 'pending'
        };
        
        this._operationLog.push(operation);
        
        // Track dirty state based on operation type
        switch (type) {
            case 'add-activity':
            case 'update-activity':
            case 'remove-activity':
            case 'move-activity':
                const userId = data.userId || this.users.currentUserId;
                this._dirtyUsers.add(userId);
                
                // Track dirty activities
                if (!this._dirtyActivities.has(userId)) {
                    this._dirtyActivities.set(userId, new Set());
                }
                if (data.activityId) {
                    this._dirtyActivities.get(userId).add(data.activityId);
                }
                break;
                
            case 'update-user':
            case 'switch-user':
                this._dirtyUsers.add(data.userId || this.users.currentUserId);
                break;
        }
        
        // Prune log if it gets too large
        this._pruneOperationLog();
    }
    
    /**
     * Get all unsynced operations
     * @returns {Array} Array of unsynced operations
     */
    _getUnsyncedOperations() {
        return this._operationLog.filter(op => op.syncStatus === 'pending');
    }
    
    /**
     * Mark operations as synced
     * @param {Array<string>} operationIds - Array of operation IDs to mark as synced
     */
    _markOperationsSynced(operationIds) {
        const idSet = new Set(operationIds);
        this._operationLog.forEach(op => {
            if (idSet.has(op.id)) {
                op.syncStatus = 'synced';
            }
        });
    }
    
    /**
     * Mark operations as failed
     * @param {Array<string>} operationIds - Array of operation IDs to mark as failed
     */
    _markOperationsFailed(operationIds) {
        const idSet = new Set(operationIds);
        this._operationLog.forEach(op => {
            if (idSet.has(op.id)) {
                op.syncStatus = 'failed';
            }
        });
    }
    
    /**
     * Keep only the last N operations
     */
    _pruneOperationLog() {
        if (this._operationLog.length > this._maxOperationLogSize) {
            // Keep the last 1000 operations
            this._operationLog = this._operationLog.slice(-this._maxOperationLogSize);
        }
    }
    
    /**
     * Check if there are any dirty (unsynced) changes
     * @returns {boolean} True if there are dirty changes
     */
    isDirty() {
        return this._dirtyUsers.size > 0 || this._dirtyActivities.size > 0;
    }
    
    /**
     * Clear all dirty flags (usually after successful sync)
     */
    clearDirtyFlags() {
        this._dirtyUsers.clear();
        this._dirtyActivities.clear();
    }
    
    /**
     * Get only the data that has changed since last sync
     * @returns {Object} Object containing only changed data
     */
    getChangedData() {
        const changedData = {
            users: {},
            hasChanges: false
        };
        
        // Include dirty users
        this._dirtyUsers.forEach(userId => {
            if (this.users.profiles[userId]) {
                const user = this.users.profiles[userId];
                changedData.users[userId] = {
                    ...user
                };
                
                // If we have specific dirty activities, only include those
                if (this._dirtyActivities.has(userId)) {
                    const dirtyActivityIds = this._dirtyActivities.get(userId);
                    
                    // Filter today's activities
                    if (user.activities) {
                        changedData.users[userId].activities = user.activities.filter(activity => 
                            dirtyActivityIds.has(activity.id) || !activity.id
                        );
                    }
                    
                    // Filter tomorrow's activities
                    if (user.tomorrowActivities) {
                        changedData.users[userId].tomorrowActivities = user.tomorrowActivities.filter(activity => 
                            dirtyActivityIds.has(activity.id) || !activity.id
                        );
                    }
                }
                
                changedData.hasChanges = true;
            }
        });
        
        // Include metadata
        if (changedData.hasChanges) {
            changedData.syncMetadata = this.syncMetadata;
            changedData.version = CONFIG.DATA_VERSION;
            changedData.operations = this._getUnsyncedOperations();
        }
        
        return changedData;
    }
    
    /**
     * Get the current operation log
     * @returns {Array} Array of operations
     */
    getOperationLog() {
        return [...this._operationLog];
    }
    
    /**
     * Get operation log statistics
     * @returns {Object} Statistics about the operation log
     */
    getOperationLogStats() {
        return {
            totalOperations: this._operationLog.length,
            pendingOperations: this._getUnsyncedOperations().length,
            syncedOperations: this._operationLog.filter(op => op.syncStatus === 'synced').length,
            failedOperations: this._operationLog.filter(op => op.syncStatus === 'failed').length,
            dirtyUsers: this._dirtyUsers.size,
            dirtyActivities: Array.from(this._dirtyActivities.values()).reduce((sum, set) => sum + set.size, 0)
        };
    }
    
    /**
     * Reset the operation log (use with caution)
     */
    resetOperationLog() {
        this._operationLog = [];
        this._dirtyUsers.clear();
        this._dirtyActivities.clear();
    }
    
    /**
     * Rebuild dirty tracking from operation log
     * Used after importing data
     */
    _rebuildDirtyTracking() {
        this._dirtyUsers.clear();
        this._dirtyActivities.clear();
        
        // Go through pending operations and rebuild dirty state
        this._operationLog.forEach(op => {
            if (op.syncStatus === 'pending') {
                switch (op.type) {
                    case 'add-activity':
                    case 'update-activity':
                    case 'remove-activity':
                    case 'move-activity':
                        const userId = op.data.userId || op.userId;
                        this._dirtyUsers.add(userId);
                        
                        if (!this._dirtyActivities.has(userId)) {
                            this._dirtyActivities.set(userId, new Set());
                        }
                        if (op.data.activityId) {
                            this._dirtyActivities.get(userId).add(op.data.activityId);
                        }
                        break;
                        
                    case 'update-user':
                    case 'switch-user':
                        this._dirtyUsers.add(op.data.userId || op.userId);
                        break;
                }
            }
        });
    }

    // === ACTIVITY MANAGEMENT ===
    
    // Ensure all activities have proper card numbers
    ensureCardNumbers() {
        // Fix card numbers for all users
        Object.values(this.users.profiles).forEach(user => {
            // Fix today's activities
            if (user.activities) {
                user.activities.forEach((activity, index) => {
                    activity.cardNumber = index + 1;
                });
            }
            
            // Fix tomorrow's activities
            if (user.tomorrowActivities) {
                user.tomorrowActivities.forEach((activity, index) => {
                    activity.cardNumber = index + 1;
                });
            }
        });
        
        // Also fix the legacy activities array
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            const isToday = this.ui.currentDay === 'today';
            this.activities = isToday ? this.deepCloneActivities(currentUser.activities || []) : this.deepCloneActivities(currentUser.tomorrowActivities || []);
        }
    }
    
    addActivity(activity, position = 'bottom') {
        // Story 4: Get the current user and determine which activities to modify
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('No current user found');
        }
        
        const isToday = this.ui.currentDay === 'today';
        const targetActivities = isToday ? user.activities : user.tomorrowActivities;
        
        if (targetActivities.length >= CONFIG.MAX_ACTIVITIES) {
            throw new Error(`Maximum of ${CONFIG.MAX_ACTIVITIES} activities allowed.`);
        }

        const newActivity = {
            id: activity.id || `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: activity.title || 'New Activity',
            description: activity.description || '',
            icon: activity.icon || CONFIG.DEFAULT_EMOJI,
            visible: true, // Always visible since we removed the visibility toggle
            completed: activity.completed || false,
            keep: activity.keep || false, // Pin/keep status
            cardType: this._validateCardType(activity.cardType || 'recurring'), // Story 1
            createdDate: activity.createdDate || new Date().toISOString().split('T')[0], // Story 1
            time: activity.time || ''
        };

        if (position === 'top') {
            targetActivities.unshift(newActivity);
        } else {
            targetActivities.push(newActivity);
        }
        
        // Assign card numbers to all activities
        targetActivities.forEach((activity, index) => {
            activity.cardNumber = index + 1;
        });
        
        // CRITICAL FIX: Sync the legacy activities array with current context - deep clone
        if (isToday) {
            this.activities = this.deepCloneActivities(user.activities);
        } else {
            this.activities = this.deepCloneActivities(user.tomorrowActivities);
        }
        
        // Track the operation
        this._trackOperation('add-activity', {
            userId: this.users.currentUserId,
            activityId: newActivity.id,
            activity: newActivity,
            position: position,
            dayContext: this.ui.currentDay
        });
        
        // Debug logging for tomorrow activities
        if (!isToday) {
            // 
            // 
            // 
            // 
        }
        
        this._triggerSave();
    }

    updateActivity(index, updates) {
        
        // Story 4: Get the current user and determine which activities to modify
        const user = this.getCurrentUser();
        const isToday = this.ui.currentDay === 'today';
        const targetActivities = isToday ? user.activities : user.tomorrowActivities;
        
        if (index >= 0 && index < targetActivities.length) {
            const activity = targetActivities[index];
            const oldValues = {};

            // Track what's changing for the operation log
            Object.keys(updates).forEach(key => {
                if (activity[key] !== updates[key]) {
                    oldValues[key] = activity[key];
                }
            });
            
            // Story 1: Validate card type if being updated
            if (updates.cardType) {
                updates.cardType = this._validateCardType(updates.cardType);
            }
            
            Object.assign(activity, updates);
            
            // Track the operation
            this._trackOperation('update-activity', {
                userId: this.users.currentUserId,
                activityId: activity.id,
                activityIndex: index,
                updates: updates,
                oldValues: oldValues,
                dayContext: this.ui.currentDay
            });
            
            // CRITICAL FIX: Sync the legacy activities array with current context - deep clone
            if (isToday) {
                this.activities = this.deepCloneActivities(user.activities);
            } else {
                this.activities = this.deepCloneActivities(user.tomorrowActivities);
            }
            
            this._triggerSave();
        }
    }

    removeActivity(index) {
        // Story 4: Get the current user and determine which activities to modify
        const user = this.getCurrentUser();
        const isToday = this.ui.currentDay === 'today';
        const targetActivities = isToday ? user.activities : user.tomorrowActivities;
        
        if (index >= 0 && index < targetActivities.length) {
            // Track the removed activity before deletion
            const removedActivity = targetActivities[index];
            
            this._trackOperation('remove-activity', {
                userId: this.users.currentUserId,
                activityId: removedActivity.id,
                activityIndex: index,
                removedActivity: removedActivity,
                dayContext: this.ui.currentDay
            });
            
            targetActivities.splice(index, 1);
            
            // Reassign card numbers after removal
            targetActivities.forEach((activity, idx) => {
                activity.cardNumber = idx + 1;
            });
            
            // CRITICAL FIX: Sync the legacy activities array with current context - deep clone
            if (isToday) {
                this.activities = this.deepCloneActivities(user.activities);
            } else {
                this.activities = this.deepCloneActivities(user.tomorrowActivities);
            }
            
            this._triggerSave();
        }
    }

    moveActivity(fromIndex, toIndex) {
        // Story 4: Get the current user and determine which activities to modify
        const user = this.getCurrentUser();
        const isToday = this.ui.currentDay === 'today';
        const targetActivities = isToday ? user.activities : user.tomorrowActivities;
        
        if (fromIndex >= 0 && fromIndex < targetActivities.length &&
            toIndex >= 0 && toIndex < targetActivities.length) {
            const movedActivity = targetActivities[fromIndex];
            
            // Track the operation before making changes
            this._trackOperation('move-activity', {
                userId: this.users.currentUserId,
                activityId: movedActivity.id,
                fromIndex: fromIndex,
                toIndex: toIndex,
                dayContext: this.ui.currentDay
            });
            
            const [removed] = targetActivities.splice(fromIndex, 1);
            targetActivities.splice(toIndex, 0, removed);
            
            // Update card numbers to match new positions
            targetActivities.forEach((activity, index) => {
                activity.cardNumber = index + 1;
            });
            
            // CRITICAL FIX: Sync the legacy activities array with current context - deep clone
            if (isToday) {
                this.activities = this.deepCloneActivities(user.activities);
            } else {
                this.activities = this.deepCloneActivities(user.tomorrowActivities);
            }
            
            this._triggerSave();
        }
    }

    updateCardPosition(currentIndex, newIndex) {
        // Get the current user and determine which activities to modify
        const user = this.getCurrentUser();
        const isToday = this.ui.currentDay === 'today';
        const targetActivities = isToday ? user.activities : user.tomorrowActivities;
        
        if (currentIndex >= 0 && currentIndex < targetActivities.length &&
            newIndex >= 0 && newIndex < targetActivities.length) {
            // Move the card
            const [removed] = targetActivities.splice(currentIndex, 1);
            targetActivities.splice(newIndex, 0, removed);
            
            // Update card numbers for all activities
            targetActivities.forEach((activity, index) => {
                activity.cardNumber = index + 1;
            });
            
            // Sync the legacy activities array with current context - deep clone
            if (isToday) {
                this.activities = this.deepCloneActivities(user.activities);
            } else {
                this.activities = this.deepCloneActivities(user.tomorrowActivities);
            }
            
            this._triggerSave();
        }
    }

    toggleActivityVisibility(index) {
        // Story 4: Get the current user and determine which activities to modify
        const user = this.getCurrentUser();
        const isToday = this.ui.currentDay === 'today';
        const targetActivities = isToday ? user.activities : user.tomorrowActivities;
        
        if (index >= 0 && index < targetActivities.length) {
            targetActivities[index].visible = !targetActivities[index].visible;
            
            // CRITICAL FIX: Sync the legacy activities array with current context - deep clone
            if (isToday) {
                this.activities = this.deepCloneActivities(user.activities);
            } else {
                this.activities = this.deepCloneActivities(user.tomorrowActivities);
            }
            
            this._triggerSave();
        }
    }

    toggleActivityCompletion(index) {
        if (index >= 0 && index < this.activities.length) {
            // Work with the activity in the legacy array (which is already a clone)
            const activity = this.activities[index];
            
            // Simply toggle the completed state - each card only exists in one day
            activity.completed = !activity.completed;
            
            // Save the modified activities back to the user profile
            this.saveCurrentUserData();
            
            this._triggerSave();
        }
    }

    // === STORY 1: CARD TYPE MANAGEMENT ===
    _validateCardType(cardType) {
        const validTypes = ['recurring', 'frequent', 'single-use'];
        return validTypes.includes(cardType) ? cardType : 'recurring';
    }

    // === USER MANAGEMENT ===
    // Enhanced addUser method with emoji support
    getDefaultActivitiesForNewUser() {
        // Check if DEFAULT_ACTIVITIES is available
        if (typeof DEFAULT_ACTIVITIES !== 'undefined') {
            // Filter only visible activities and add cardType to each
            return DEFAULT_ACTIVITIES
                .filter(activity => activity.visible === true)
                .map((activity, index) => ({
                    ...activity,
                    cardType: activity.cardType || 'recurring',
                    completed: false,
                    id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + index
                }));
        } else {
            // Fallback to basic activities if DEFAULT_ACTIVITIES not loaded
            return [
                {
                    title: 'Morning Stretch',
                    description: 'Wake up your body!',
                    icon: '🌞',
                    visible: true,
                    cardType: 'recurring',
                    completed: false,
                    id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                },
                {
                    title: 'Brush Teeth',
                    description: 'Keep them clean and shiny!',
                    icon: '🦷',
                    visible: true,
                    cardType: 'recurring',
                    completed: false,
                    id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_2'
                },
                {
                    title: 'Get Dressed',
                    description: 'Pick your favorite outfit!',
                    icon: '👕',
                    visible: true,
                    cardType: 'recurring',
                    completed: false,
                    id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_3'
                }
            ];
        }
    }

    addUser(name, icon = '👤') {
        // Validate input
        if (!name || typeof name !== 'string') {
            throw new Error('Name is required');
        }
        
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            throw new Error('Name cannot be empty');
        }
        
        if (trimmedName.length > CONFIG.USER_NAME_MAX_LENGTH) {
            throw new Error(`Name cannot exceed ${CONFIG.USER_NAME_MAX_LENGTH} characters`);
        }
        
        // Validate icon (should be a single emoji character)
        if (!icon || typeof icon !== 'string') {
            icon = '👤'; // Default fallback
        }
        
        // Check for duplicate names
        const existingNames = Object.values(this.users.profiles).map(user => user.name.toLowerCase());
        if (existingNames.includes(trimmedName.toLowerCase())) {
            throw new Error('A user with this name already exists');
        }
        
        // Check user limit
        if (Object.keys(this.users.profiles).length >= CONFIG.MAX_USERS) {
            throw new Error(`Maximum of ${CONFIG.MAX_USERS} users allowed`);
        }
        
        // Create new user ID
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Create user profile with icon and default activities
        const defaultActivities = this.getDefaultActivitiesForNewUser();
        const newUser = {
            id: userId,
            name: trimmedName,
            icon: icon, // NEW: Store user's chosen emoji icon
            // Deep clone activities for both today and tomorrow to avoid shared references
            activities: this.deepCloneActivities(defaultActivities),
            tomorrowActivities: this.deepCloneActivities(defaultActivities, true), // Story 4: Tomorrow's activities get same defaults with new IDs
            settings: {
                title: trimmedName + "'s StackMap",
                subtitle: 'Routine Ready',
                isDefaultTitle: false,
                backgroundColor: CONFIG.DEFAULT_COLOR,
                showNumbers: CONFIG.SHOW_NUMBERS_DEFAULT,
                showCompletionIndicators: CONFIG.SHOW_COMPLETION_DEFAULT
            },
            library: [] // Initialize empty library for new user
        };
        
        this.users.profiles[userId] = newUser;
        
        // Track the operation
        this._trackOperation('add-user', {
            userId: userId,
            user: newUser
        });
        
        this._triggerSave();
        return userId;
    }

    getCurrentUser() {
        const user = this.users.profiles[this.users.currentUserId];
        if (!user) {
            console.error('[State] No current user found, finding fallback');
            
            // Try to find any available user
            const userIds = Object.keys(this.users.profiles);
            if (userIds.length > 0) {
                // Just use the first available user
                this.users.currentUserId = userIds[0];
                return this.users.profiles[this.users.currentUserId];
            }
            
            // No users exist at all - this should never happen, but handle it
            console.error('[State] No users exist at all!');
            return null;
        }
        return user;
    }
    
    // Story 4: Get activities for current day context
    getCurrentActivities() {
        const user = this.getCurrentUser();
        return this.ui.currentDay === 'today' ? user.activities : user.tomorrowActivities;
    }
    
    // Story 4: Get the current day ('today' or 'tomorrow')
    getCurrentDay() {
        return this.ui.currentDay;
    }
    
    // Story 4: Switch between today and tomorrow
    setCurrentDay(day) {
        if (day === 'today' || day === 'tomorrow') {
            this.ui.currentDay = day;
            
            // Sync the legacy activities array with the current day's activities - deep clone to prevent shared references
            const user = this.getCurrentUser();
            this.activities = day === 'today' 
                ? this.deepCloneActivities(user.activities) 
                : this.deepCloneActivities(user.tomorrowActivities);
            
            this._triggerSave();
        }
    }

    switchUser(userId) {
        if (this.users.profiles[userId]) {
            const previousUserId = this.users.currentUserId;
            
            // Save current user data before switching
            this.saveCurrentUserData();
            
            // Switch to new user
            this.users.currentUserId = userId;
            this.loadUserData();
            
            // Track the operation
            this._trackOperation('switch-user', {
                previousUserId: previousUserId,
                newUserId: userId
            });
            
            this._triggerSave();
        }
    }

    // Enhanced loadUserData to handle missing icons
    loadUserData() {
        const user = this.getCurrentUser();
        if (!user) {
            console.error('No user data could be loaded');
            return false;
        }
        
        try {
            // Ensure user has an icon (migration for existing users)
            if (!user.icon) {
                user.icon = '👤'; // Default icon for existing users without icons
            }
            
            // Initialize missing fields for backward compatibility
            if (!user.activities) user.activities = [];
            if (!user.tomorrowActivities) user.tomorrowActivities = [];
            if (!user.library) user.library = [];
            
            // Load activities based on current day - deep clone to prevent shared references
            this.activities = this.ui.currentDay === 'today' 
                ? this.deepCloneActivities(user.activities || [])
                : this.deepCloneActivities(user.tomorrowActivities || []);
            
            // Load settings with fallback defaults
            this.settings = {
                title: user.settings?.title || user.name + "'s StackMap",
                subtitle: user.settings?.subtitle || 'Routine Ready',
                isDefaultTitle: user.settings?.isDefaultTitle ?? false,
                backgroundColor: user.settings?.backgroundColor || CONFIG.DEFAULT_COLOR,
                showNumbers: user.settings?.showNumbers ?? CONFIG.SHOW_NUMBERS_DEFAULT,
                showCompletionIndicators: user.settings?.showCompletionIndicators ?? CONFIG.SHOW_COMPLETION_DEFAULT,
                autoSync: user.settings?.autoSync ?? true,
                backupReminder: user.settings?.backupReminder ?? true,
                taskCelebration: user.settings?.taskCelebration || 'rainbow',
                routineCelebration: user.settings?.routineCelebration || 'rainbow'
            };
            
            // Apply theme
            this.applyTheme();
            
            // Apply user settings to body classes
            this.applyUserSettings();
            
            return true;
        } catch (error) {
            console.error('Error loading user data:', error);
            return false;
        }
    }

    saveCurrentUserData() {
        const user = this.getCurrentUser();
        if (user) {
            // Save activities to the correct day - deep clone to prevent shared references
            if (this.ui.currentDay === 'today') {
                user.activities = this.deepCloneActivities(this.activities);
            } else {
                user.tomorrowActivities = this.deepCloneActivities(this.activities);
            }
            
            user.settings = {...this.settings};
        }
    }

    deleteUser(userId) {
        // Can't delete the current user
        if (userId === this.users.currentUserId) {
            return false;
        }
        
        // Need at least one user
        if (Object.keys(this.users.profiles).length <= 1) {
            return false;
        }
        
        if (this.users.profiles[userId]) {
            delete this.users.profiles[userId];
            this._triggerSave();
            return true;
        }
        return false;
    }

    getAllUsers() {
        return Object.values(this.users.profiles);
    }
    
    // Enhanced getUserDropdownData to include icons
    getUserDropdownData() {
        const users = this.getAllUsers();
        return {
            users: users.map(user => ({
                id: user.id,
                name: user.name,
                icon: user.icon || '👤', // NEW: Include user icon with fallback
                isDefault: user.id === CONFIG.DEFAULT_USER_ID,
                isCurrent: user.id === this.users.currentUserId
            })),
            currentUserId: this.users.currentUserId,
            canAddMore: Object.keys(this.users.profiles).length < CONFIG.MAX_USERS
        };
    }
    
    // NEW: Update user icon method
    updateUserIcon(userId, icon) {
        if (this.users.profiles[userId]) {
            this.users.profiles[userId].icon = icon || '👤';
            
            // If updating current user, reload data
            if (userId === this.users.currentUserId) {
                this.loadUserData();
            }
            
            this._triggerSave();
            return true;
        }
        return false;
    }

    // NEW: General update user method
    updateUser(userId, updates) {
        console.trace('[STATE] updateUser call stack');
        
        if (!this.users.profiles[userId]) {
            throw new Error('User not found');
        }
        
        const user = this.users.profiles[userId];
        const oldValues = {};
        
        // Validate name if being updated
        if (updates.name !== undefined) {
            if (!updates.name || typeof updates.name !== 'string') {
                throw new Error('Name is required');
            }
            
            const trimmedName = updates.name.trim();
            if (trimmedName.length === 0) {
                throw new Error('Name cannot be empty');
            }
            
            if (trimmedName.length > CONFIG.USER_NAME_MAX_LENGTH) {
                throw new Error(`Name cannot exceed ${CONFIG.USER_NAME_MAX_LENGTH} characters`);
            }
            
            // Check for duplicate names (excluding current user)
            const existingNames = Object.values(this.users.profiles)
                .filter(u => u.id !== userId)
                .map(u => u.name.toLowerCase());
            if (existingNames.includes(trimmedName.toLowerCase())) {
                throw new Error('A user with this name already exists');
            }
            
            oldValues.name = user.name;
            user.name = trimmedName;
            
            // Update title if it matches the old name
            if (user.settings && user.settings.title === oldValues.name + "'s StackMap") {
                user.settings.title = trimmedName + "'s StackMap";
            }
        }
        
        // Validate and update icon if provided
        if (updates.icon !== undefined) {
            oldValues.icon = user.icon;
            user.icon = updates.icon || '👤';
        }
        
        // Update any other properties
        Object.keys(updates).forEach(key => {
            if (key !== 'name' && key !== 'icon' && updates[key] !== undefined) {
                if (user[key] !== updates[key]) {
                    oldValues[key] = user[key];
                }
                user[key] = updates[key];
            }
        });
        
        // Track the operation
        this._trackOperation('update-user', {
            userId: userId,
            updates: updates,
            oldValues: oldValues
        });
        
        // If updating current user, reload data to sync with UI
        if (userId === this.users.currentUserId) {
            this.loadUserData();
        }
        
        this._triggerSave();
        return true;
    }
    
    // Validate user limit before operations
    canAddUser() {
        return Object.keys(this.users.profiles).length < CONFIG.MAX_USERS;
    }

    cycleCardType(index) {
        // Get the current activities based on context
        const targetActivities = this.getCurrentActivities();
        
        if (index >= 0 && index < targetActivities.length) {
            const currentType = targetActivities[index].cardType || 'recurring';
            const typeOrder = ['recurring', 'frequent', 'single-use'];
            const currentIndex = typeOrder.indexOf(currentType);
            const nextIndex = (currentIndex + 1) % typeOrder.length;
            
            this.updateActivity(index, { cardType: typeOrder[nextIndex] });
        }
    }

    getCardTypeStats() {
        const stats = {
            recurring: 0,
            frequent: 0,
            'single-use': 0
        };
        
        // Use current context activities
        const targetActivities = this.getCurrentActivities();
        targetActivities.forEach(activity => {
            const type = activity.cardType || 'recurring';
            stats[type]++;
        });
        
        return stats;
    }

    // === LIBRARY MANAGEMENT ===
    addToLibrary(card, libraryType) {
        try {
            // Deep clone the card to avoid shared references
            const libraryCard = this.deepCloneActivity(card);
            
            // Add library-specific properties
            libraryCard.id = `lib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            libraryCard.addedDate = new Date().toISOString();
            libraryCard.addedBy = this.users.currentUserId;
            
            if (libraryType === 'user') {
                const user = this.getCurrentUser();
                if (!user.library) {
                    user.library = [];
                }
                
                // Check for duplicates
                const isDuplicate = user.library.some(item => 
                    item.title === card.title && item.icon === card.icon
                );
                
                if (!isDuplicate) {
                    user.library.push(libraryCard);
                    this._triggerSave();
                    return true;
                }
            } else if (libraryType === 'group') {
                if (!this.users.groupLibrary) {
                    this.users.groupLibrary = [];
                }
                
                // Check for duplicates
                const isDuplicate = this.users.groupLibrary.some(item => 
                    item.title === card.title && item.icon === card.icon
                );
                
                if (!isDuplicate) {
                    this.users.groupLibrary.push(libraryCard);
                    this._triggerSave();
                    return true;
                }
            }
            
            return false; // Duplicate or invalid type
        } catch (error) {
            console.error('Error adding to library:', error);
            return false;
        }
    }
    
    getLibrary(libraryType) {
        if (libraryType === 'user') {
            const user = this.getCurrentUser();
            return user.library || [];
        } else if (libraryType === 'group') {
            return this.users.groupLibrary || [];
        } else if (libraryType === 'base') {
            // Base library loaded from default-activities.js
            // Combine DEFAULT_ACTIVITIES and ACTIVITY_LIBRARY
            const baseCards = [];
            
            // Add default activities
            if (window.DEFAULT_ACTIVITIES) {
                window.DEFAULT_ACTIVITIES.forEach((activity, index) => {
                    baseCards.push({
                        ...activity,
                        id: `base_default_${index}`,
                        source: 'default'
                    });
                });
            }
            
            // Add extended library activities
            if (window.ACTIVITY_LIBRARY) {
                Object.entries(window.ACTIVITY_LIBRARY).forEach(([key, activity]) => {
                    baseCards.push({
                        ...activity,
                        id: `base_library_${key}`,
                        source: 'library'
                    });
                });
            }
            
            return baseCards;
        }
        return [];
    }
    
    removeFromLibrary(cardId, libraryType) {
        if (libraryType === 'user') {
            const user = this.getCurrentUser();
            if (user.library) {
                user.library = user.library.filter(card => card.id !== cardId);
                this._triggerSave();
                return true;
            }
        } else if (libraryType === 'group') {
            if (this.users.groupLibrary) {
                this.users.groupLibrary = this.users.groupLibrary.filter(card => card.id !== cardId);
                this._triggerSave();
                return true;
            }
        }
        return false;
    }
    
    updateLibraryCard(libraryType, index, updates) {
        if (libraryType === 'user') {
            const user = this.getCurrentUser();
            if (user.library && user.library[index]) {
                // Preserve existing properties like id and addedBy
                user.library[index] = {
                    ...user.library[index],
                    ...updates
                };
                this._triggerSave();
                return true;
            }
        } else if (libraryType === 'group') {
            if (this.users.groupLibrary && this.users.groupLibrary[index]) {
                // Preserve existing properties like id and addedBy
                this.users.groupLibrary[index] = {
                    ...this.users.groupLibrary[index],
                    ...updates
                };
                this._triggerSave();
                return true;
            }
        }
        // Base library cannot be edited
        return false;
    }

    // === SETTINGS MANAGEMENT ===
    updateTitle(title) {
        this.settings.title = title;
        this.settings.isDefaultTitle = (title === 'StackMap User');
        this._triggerSave();
    }

    updateTheme(color) {
        this.settings.backgroundColor = color;
        this.applyTheme();
        this._triggerSave();
    }

    applyTheme() {
        const color = this.settings.backgroundColor || CONFIG.DEFAULT_COLOR;
        
        // Ensure color is defined and is a string
        if (!color || typeof color !== 'string') {
            console.warn('Invalid color value:', color);
            return;
        }
        
        // Extract RGB values
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Create darker variant
        const darkerR = Math.max(0, r - 30);
        const darkerG = Math.max(0, g - 30);
        const darkerB = Math.max(0, b - 30);
        const darkerColor = `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
        
        // Update CSS variables
        document.documentElement.style.setProperty('--primary-color', color);
        document.documentElement.style.setProperty('--primary-dark', darkerColor);
        document.documentElement.style.setProperty('--background-gradient-start', color);
        document.documentElement.style.setProperty('--background-gradient-end', darkerColor);
        
        // Update fixed header background immediately
        const fixedHeader = document.querySelector('.fixed-header');
        if (fixedHeader) {
            fixedHeader.style.background = `${color} !important`;
        }
        
        // CRITICAL FIX: Update header wrapper with gentle gradient using new color
        const headerWrapper = document.querySelector('.header-wrapper');
        if (headerWrapper) {
            // Extract RGB for gentle gradient (inspired by completed cards)
            const rgbaStart = `rgba(${r}, ${g}, ${b}, 0.85)`;
            const rgbaMiddle = `rgba(${r}, ${g}, ${b}, 0.92)`;
            const rgbaEnd = `rgba(${r}, ${g}, ${b}, 0.95)`;
            
            headerWrapper.style.background = color;
            headerWrapper.style.backgroundImage = `linear-gradient(to bottom, ${rgbaStart} 0%, ${rgbaMiddle} 50%, ${rgbaEnd} 100%)`;
        }
        
        // Update body background
        document.body.style.background = color;
        
        // Update card number backgrounds
        document.querySelectorAll('.card__number').forEach(el => {
            el.style.background = color;
        });
        
        // Update logo colors if HybridPanelManager exists
        if (window.hybridPanelManager) {
            window.hybridPanelManager.updateLogoColors(color);
        }
    }
    
    // Apply user settings to body classes
    applyUserSettings() {
        // Get current user settings
        const currentUser = this.getCurrentUser();
        const userSettings = currentUser?.settings || {};
        const showCompletionIndicators = userSettings.showCompletionIndicators !== undefined ? 
            userSettings.showCompletionIndicators : this.settings.showCompletionIndicators;
        
        // Apply completion indicators setting
        if (showCompletionIndicators === false) {
            document.body.classList.add('hide-completion-indicators');
        } else {
            document.body.classList.remove('hide-completion-indicators');
        }
        
        // Apply display mode setting
        const displayMode = userSettings.displayMode || this.settings.displayMode || CONFIG.DISPLAY_MODES.NUMBERS;
        document.body.classList.remove('display-mode-none', 'display-mode-numbers', 'display-mode-times');
        document.body.classList.add(`display-mode-${displayMode}`);
    }

    // === DATA EXPORT/IMPORT ===
    exportData() {
        this.saveCurrentUserData(); // Save current state to user profile
        return {
            version: CONFIG.DATA_VERSION,
            users: this.users,
            ui: {
                currentDay: this.ui.currentDay // Persist day selection
            },
            syncMetadata: this.syncMetadata,
            activities: this.getCurrentActivities(), // For backward compatibility
            operationLog: this._operationLog // Include operation log for sync
        };
    }

    // Enhanced importData to handle user icons
    importData(data, updateVersion = true) {
        // console.log('Importing data:', {
            hasUsers: !!data.users,
            hasActivities: !!data.activities,
            hasSettings: !!data.settings,
            version: data.version,
            exportType: data.exportType
        });
        
        try {
            // Validate input data
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid import data: expected object');
            }
            
            // Restore UI state if present
            if (data.ui) {
                if (data.ui.currentDay) {
                    this.ui.currentDay = data.ui.currentDay;
                }
            }
            
            // Import operation log if present
            if (data.operationLog && Array.isArray(data.operationLog)) {
                this._operationLog = data.operationLog.slice(-this._maxOperationLogSize); // Keep only last N operations
                // Rebuild dirty tracking from operation log
                this._rebuildDirtyTracking();
            }
            
            // Import sync metadata
            if (data.syncMetadata) {
                this.syncMetadata = {
                    ...data.syncMetadata,
                    deviceId: this.generateDeviceId(), // Keep local device ID
                    deviceName: this.getDeviceName() // Update device name
                };
                if (updateVersion) {
                    this.syncMetadata.version++; // Increment version after import
                }
            }
            
            if (data.users) {
                // New multi-user format
                // Completely replace the users structure
                this.users = {
                    currentUserId: data.users.currentUserId || CONFIG.DEFAULT_USER_ID,
                    profiles: data.users.profiles || {},
                    groupLibrary: data.users.groupLibrary || []
                };
                
                // If the currentUserId doesn't exist in profiles, use the first available user
                if (!this.users.profiles[this.users.currentUserId] && Object.keys(this.users.profiles).length > 0) {
                    this.users.currentUserId = Object.keys(this.users.profiles)[0];
                }
                
                // console.log('User import state:', {
                    currentUserId: this.users.currentUserId,
                    profileIds: Object.keys(this.users.profiles),
                    profileNames: Object.values(this.users.profiles).map(u => u.name)
                });
                
                // Story 4: Ensure all users have tomorrow activities array and icons
                Object.values(this.users.profiles).forEach(user => {
                    if (!user.tomorrowActivities) {
                        user.tomorrowActivities = [];
                    }
                    // NEW: Ensure all users have icons (migration)
                    if (!user.icon) {
                        user.icon = '👤'; // Default icon for imported users without icons
                    }
                    // Ensure all users have library array
                    if (!user.library) {
                        user.library = [];
                    }
                    
                    // Ensure activities have completed and keep properties
                    if (user.activities) {
                        user.activities.forEach(activity => {
                            if (activity.completed === undefined) {
                                activity.completed = false;
                            }
                            if (activity.keep === undefined) {
                                activity.keep = false;
                            }
                        });
                    }
                    if (user.tomorrowActivities) {
                        user.tomorrowActivities.forEach(activity => {
                            if (activity.completed === undefined) {
                                activity.completed = false;
                            }
                            if (activity.keep === undefined) {
                                activity.keep = false;
                            }
                        });
                    }
                    
                    // ALWAYS check for duplicate IDs between Today and Tomorrow
                    if (user.activities && user.tomorrowActivities) {
                        const todayIds = new Set(user.activities.map(a => a.id));
                        let fixedCount = 0;
                        user.tomorrowActivities.forEach((activity, index) => {
                            if (todayIds.has(activity.id)) {
                                // Generate new ID for tomorrow activity if it duplicates today
                                activity.id = 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_fix_' + index;
                                fixedCount++;
                            }
                        });
                        if (fixedCount > 0) {
                        }
                    }
                });
                
                // Check if any activity is hidden and mark all as visible
                Object.values(this.users.profiles).forEach(user => {
                    if (user.activities && user.activities.some(a => a.visible === false)) {
                        user.activities.forEach(a => {
                            a.visible = true;
                        });
                    }
                });
                
                // Ensure group library exists
                if (!this.users.groupLibrary) {
                    this.users.groupLibrary = [];
                }
                
                // Ensure current user exists
                if (!this.users.profiles[this.users.currentUserId]) {
                    // If current user doesn't exist, try default user
                    if (this.users.profiles[CONFIG.DEFAULT_USER_ID]) {
                        this.users.currentUserId = CONFIG.DEFAULT_USER_ID;
                    } else {
                        // If default user also doesn't exist, use first available user
                        const userIds = Object.keys(this.users.profiles);
                        if (userIds.length > 0) {
                            this.users.currentUserId = userIds[0];
                        } else {
                            // No users at all - this shouldn't happen
                            console.error('[State] No users found in imported data!');
                            this.users.currentUserId = CONFIG.DEFAULT_USER_ID;
                        }
                    }
                }
                
                this.loadUserData();
            } else if (data.activities) {
                // Legacy single-user format - migrate to default user
                
                // Validate activities array
                if (!Array.isArray(data.activities)) {
                    throw new Error('Invalid activities format: expected array');
                }
                
                const activities = data.activities.slice(0, CONFIG.MAX_ACTIVITIES).map(activity => ({
                    ...activity,
                    cardType: this._validateCardType(activity.cardType || 'recurring'),
                    createdDate: activity.createdDate || new Date().toISOString().split('T')[0],
                    time: activity.time || '',
                    visible: activity.visible !== undefined ? activity.visible : true,
                    completed: activity.completed || false,
                    keep: activity.keep || false
                }));
                
                // Check if any activity is hidden and mark all as visible
                if (activities.some(a => a.visible === false)) {
                    activities.forEach(a => {
                        a.visible = true;
                    });
                }
                
                let settings = {
                    title: 'StackMap User',
                    subtitle: 'Routine Ready',
                    isDefaultTitle: true,
                    backgroundColor: CONFIG.DEFAULT_COLOR,
                    showNumbers: CONFIG.SHOW_NUMBERS_DEFAULT,
                    showCompletionIndicators: CONFIG.SHOW_COMPLETION_DEFAULT
                };
                
                if (data.settings) {
                    // Ensure backgroundColor exists before assigning
                    if (!data.settings.backgroundColor) {
                        data.settings.backgroundColor = CONFIG.DEFAULT_COLOR;
                    }
                    settings = {...settings, ...data.settings};
                    // Ensure we have the new subtitle field
                    if (!settings.subtitle) {
                        settings.subtitle = 'Routine Ready';
                    }
                }
                
                // Migrate to default user with icon
                this.users.profiles[CONFIG.DEFAULT_USER_ID] = {
                    id: CONFIG.DEFAULT_USER_ID,
                    name: settings.title || 'StackMap User',
                    icon: '👤', // NEW: Default icon for legacy imports
                    activities: activities,
                    tomorrowActivities: [], // Story 4: Initialize empty tomorrow
                    settings: settings,
                    library: [] // Initialize empty library
                };
                
                // Initialize group library for legacy imports
                this.users.groupLibrary = [];
                
                this.users.currentUserId = CONFIG.DEFAULT_USER_ID;
                this.loadUserData();
            } else {
                throw new Error('No valid data to import: missing both users and activities');
            }
            
            // Reset operation log and dirty tracking after import
            this._operationLog = [];
            this._dirtyUsers.clear();
            this._dirtyActivities.clear();
            
            this._triggerSave();
            
        } catch (error) {
            console.error('[State] Import failed:', error);
            throw error; // Re-throw to be handled by caller
        }
    }

    // === PRIVATE METHODS ===
    _triggerSave() {
        // Update sync metadata
        this.syncMetadata.version++;
        this.syncMetadata.lastModified = new Date().toISOString();
        
        if (this.onStateChange) {
            this.onStateChange();
        }
    }
    
    // Device ID generation for sync conflict resolution
    generateDeviceId() {
        let deviceId = localStorage.getItem('stackmap-device-id');
        if (!deviceId) {
            deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('stackmap-device-id', deviceId);
        }
        return deviceId;
    }
    
    // Get a user-friendly device name
    getDeviceName() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        
        if (/iPhone|iPad|iPod/.test(userAgent)) {
            if (/iPad/.test(userAgent)) return 'iPad';
            return 'iPhone';
        }
        if (/Android/.test(userAgent)) {
            if (/Mobile/.test(userAgent)) return 'Android Phone';
            return 'Android Tablet';
        }
        if (/Mac/.test(platform)) return 'Mac';
        if (/Win/.test(platform)) return 'Windows PC';
        if (/Linux/.test(platform)) return 'Linux PC';
        
        return 'Web Browser';
    }
    
    // Merge with remote data for conflict resolution
    mergeWithRemote(remoteData) {
        
        // For multi-user sync, we need to merge each user's data
        if (remoteData.users && remoteData.users.profiles) {
            // Merge each user's data
            Object.keys(remoteData.users.profiles).forEach(userId => {
                const remoteUser = remoteData.users.profiles[userId];
                const localUser = this.users.profiles[userId];
                
                if (localUser) {
                    // User exists locally - merge their activities
                    
                    // Merge today activities
                    const mergedToday = this.mergeActivities(
                        localUser.activities || [], 
                        remoteUser.activities || []
                    );
                    localUser.activities = mergedToday;
                    
                    // Merge tomorrow activities
                    const mergedTomorrow = this.mergeActivities(
                        localUser.tomorrowActivities || [],
                        remoteUser.tomorrowActivities || []
                    );
                    localUser.tomorrowActivities = mergedTomorrow;
                    
                    // Update user settings if remote is newer
                    if (remoteUser.settings) {
                        localUser.settings = { ...localUser.settings, ...remoteUser.settings };
                    }
                } else {
                    // User doesn't exist locally - add them
                    this.users.profiles[userId] = remoteUser;
                }
            });
            
            // Check if any local users need to be kept that aren't in remote
            // (This preserves locally created users)
            Object.keys(this.users.profiles).forEach(userId => {
                if (!remoteData.users.profiles[userId]) {
                }
            });
            
        } else {
            // Legacy format - merge current user only
            const localActivities = this.getCurrentActivities();
            const remoteActivities = remoteData.activities || [];
            const mergedActivities = this.mergeActivities(localActivities, remoteActivities);
            
            const user = this.getCurrentUser();
            if (this.ui.currentDay === 'today') {
                user.activities = mergedActivities;
                this.activities = mergedActivities;
            } else {
                user.tomorrowActivities = mergedActivities;
                this.activities = mergedActivities;
            }
        }
        
        // Update version to be higher than both
        this.syncMetadata.version = Math.max(
            this.syncMetadata.version, 
            remoteData.syncMetadata?.version || 0
        ) + 1;
        
        // Reload current user data to ensure consistency
        this.loadUserData();
        
        // Ensure all activities have proper card numbers
        this.ensureCardNumbers();
        
        this._triggerSave();
    }
    
    // Helper method to merge two arrays of activities
    mergeActivities(localActivities, remoteActivities) {
        const activityMap = new Map();
        
        // Add local activities
        localActivities.forEach(activity => {
            const key = `${activity.title}|${activity.icon}`;
            activityMap.set(key, activity);
        });
        
        // Add remote activities (will override locals with same key)
        remoteActivities.forEach(activity => {
            const key = `${activity.title}|${activity.icon}`;
            if (!activityMap.has(key)) {
                activityMap.set(key, activity);
            } else {
                // Merge properties, preferring completed status from either
                const localActivity = activityMap.get(key);
                activityMap.set(key, {
                    ...localActivity,
                    ...activity,
                    completed: localActivity.completed || activity.completed
                });
            }
        });
        
        return Array.from(activityMap.values());
    }
    
    // Helper method to deep clone an activity
    deepCloneActivity(activity, generateNewId = false) {
        const cloned = {
            ...activity
        };
        
        // Generate new ID if requested
        if (generateNewId) {
            cloned.id = 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        // Reset completion when cloning for a different day
        if (generateNewId) {
            cloned.completed = false;
        }
        
        return cloned;
    }
    
    // Helper method to deep clone an array of activities
    deepCloneActivities(activities, generateNewIds = false) {
        const cloned = activities.map(activity => this.deepCloneActivity(activity, generateNewIds));
        
        // Additional safety check to ensure no duplicate IDs within the array
        if (generateNewIds) {
            const seenIds = new Set();
            cloned.forEach((activity, index) => {
                if (seenIds.has(activity.id)) {
                    // Regenerate ID if duplicate found
                    activity.id = 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_dedup_' + index;
                }
                seenIds.add(activity.id);
            });
        }
        
        return cloned;
    }
    
    // === DELTA SYNC METHODS ===
    
    // Generate a delta (patch) from the operation log
    generateSyncDelta(fromVersion = 0) {
        const currentVersion = this.syncMetadata.version;
        
        // Get operations since the specified version
        const relevantOps = this._operationLog.filter(op => {
            // Only include unsynced operations
            return op.syncStatus === 'pending';
        });
        
        if (relevantOps.length === 0) {
            return null;
        }
        
        // Create delta object
        const delta = {
            fromVersion: fromVersion,
            toVersion: currentVersion,
            deviceId: this.syncMetadata.deviceId,
            timestamp: Date.now(),
            operations: relevantOps.map(op => ({
                id: op.id,
                type: op.type,
                timestamp: op.timestamp,
                data: this._minimizeOperationData(op)
            })),
            checksum: null // Will be calculated
        };
        
        // Calculate checksum
        delta.checksum = this._calculateChecksum(delta);
        
        return delta;
    }
    
    // Apply a delta to the current state
    applyDelta(delta) {
        // Verify checksum
        const calculatedChecksum = this._calculateChecksum({
            ...delta,
            checksum: null
        });
        
        if (calculatedChecksum !== delta.checksum) {
            throw new Error('Delta checksum mismatch - data may be corrupted');
        }
        
        // Apply each operation in order
        delta.operations.forEach(op => {
            try {
                this._applyDeltaOperation(op);
            } catch (error) {
                console.error('[State] Failed to apply delta operation:', op, error);
                // Continue with other operations
            }
        });
        
        // Update sync metadata
        this.syncMetadata.version = Math.max(this.syncMetadata.version, delta.toVersion);
        this.syncMetadata.lastModified = new Date().toISOString();
        
        this._triggerSave();
    }
    
    // Minimize operation data for network transfer
    _minimizeOperationData(operation) {
        const minimal = { ...operation.data };
        
        switch (operation.type) {
            case 'update-activity':
                // Only send the changes, not the full activity
                return {
                    userId: minimal.userId,
                    activityId: minimal.activityId,
                    updates: minimal.updates,
                    dayContext: minimal.dayContext
                };
                
            case 'add-activity':
                // Send only essential activity data
                return {
                    userId: minimal.userId,
                    activityId: minimal.activityId,
                    activity: {
                        id: minimal.activity.id,
                        title: minimal.activity.title,
                        icon: minimal.activity.icon,
                        description: minimal.activity.description,
                        cardType: minimal.activity.cardType,
                        completed: minimal.activity.completed,
                        keep: minimal.activity.keep
                    },
                    position: minimal.position,
                    dayContext: minimal.dayContext
                };
                
            case 'remove-activity':
                // Only need IDs for deletion
                return {
                    userId: minimal.userId,
                    activityId: minimal.activityId,
                    dayContext: minimal.dayContext
                };
                
            case 'move-activity':
                // Only positions needed
                return {
                    userId: minimal.userId,
                    activityId: minimal.activityId,
                    fromIndex: minimal.fromIndex,
                    toIndex: minimal.toIndex,
                    dayContext: minimal.dayContext
                };
                
            default:
                return minimal;
        }
    }
    
    // Apply a single delta operation
    _applyDeltaOperation(operation) {
        const user = this.users.profiles[operation.data.userId];
        if (!user) {
            console.warn('[State] User not found for delta operation:', operation.data.userId);
            return;
        }
        
        const isToday = operation.data.dayContext === 'today';
        const targetActivities = isToday ? user.activities : user.tomorrowActivities;
        
        switch (operation.type) {
            case 'add-activity':
                // Check if activity already exists (idempotency)
                if (!targetActivities.find(a => a.id === operation.data.activityId)) {
                    targetActivities.push(operation.data.activity);
                }
                break;
                
            case 'update-activity':
                const activityToUpdate = targetActivities.find(a => a.id === operation.data.activityId);
                if (activityToUpdate) {
                    Object.assign(activityToUpdate, operation.data.updates);
                }
                break;
                
            case 'remove-activity':
                const indexToRemove = targetActivities.findIndex(a => a.id === operation.data.activityId);
                if (indexToRemove !== -1) {
                    targetActivities.splice(indexToRemove, 1);
                }
                break;
                
            case 'move-activity':
                const activity = targetActivities[operation.data.fromIndex];
                if (activity && activity.id === operation.data.activityId) {
                    targetActivities.splice(operation.data.fromIndex, 1);
                    targetActivities.splice(operation.data.toIndex, 0, activity);
                }
                break;
        }
        
        // Update card numbers
        targetActivities.forEach((activity, index) => {
            activity.cardNumber = index + 1;
        });
    }
    
    // Calculate checksum for delta integrity
    _calculateChecksum(delta) {
        const dataString = JSON.stringify({
            fromVersion: delta.fromVersion,
            toVersion: delta.toVersion,
            operations: delta.operations
        });
        
        // Simple hash function for checksum
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36);
    }
    
    // Compress data for network transfer
    compressData(data) {
        const jsonString = JSON.stringify(data);
        
        // For browser environment, we'll use a simple compression technique
        // In production, you might want to use pako or another compression library
        
        // Convert to base64 for now (not actual compression, but reduces size for text data)
        // This is a placeholder - real compression would use gzip/deflate
        try {
            // Check if CompressionStream is available (modern browsers)
            if (typeof CompressionStream !== 'undefined') {
                // This would be the ideal implementation with CompressionStream
                // But for now, we'll use a simpler approach
            }
            
            // Simple RLE-like compression for repeated patterns
            const compressed = this._simpleCompress(jsonString);
            return {
                compressed: true,
                algorithm: 'simple-rle',
                data: compressed,
                originalSize: jsonString.length,
                compressedSize: compressed.length
            };
        } catch (error) {
            // Fallback to no compression
            return {
                compressed: false,
                data: jsonString,
                originalSize: jsonString.length,
                compressedSize: jsonString.length
            };
        }
    }
    
    // Decompress data
    decompressData(compressedData) {
        if (!compressedData.compressed) {
            return JSON.parse(compressedData.data);
        }
        
        switch (compressedData.algorithm) {
            case 'simple-rle':
                const decompressed = this._simpleDecompress(compressedData.data);
                return JSON.parse(decompressed);
            default:
                throw new Error('Unknown compression algorithm: ' + compressedData.algorithm);
        }
    }
    
    // Simple compression implementation
    _simpleCompress(str) {
        // Basic run-length encoding for repeated characters
        let compressed = '';
        let count = 1;
        
        for (let i = 0; i < str.length; i++) {
            if (str[i] === str[i + 1] && count < 9) {
                count++;
            } else {
                if (count > 2) {
                    compressed += count + str[i];
                } else {
                    compressed += str[i].repeat(count);
                }
                count = 1;
            }
        }
        
        return compressed;
    }
    
    // Simple decompression implementation
    _simpleDecompress(compressed) {
        let decompressed = '';
        
        for (let i = 0; i < compressed.length; i++) {
            if (/\d/.test(compressed[i])) {
                const count = parseInt(compressed[i]);
                const char = compressed[i + 1];
                decompressed += char.repeat(count);
                i++; // Skip the character we just processed
            } else {
                decompressed += compressed[i];
            }
        }
        
        return decompressed;
    }
    
    // Get data size in bytes
    getDataSize(data = null) {
        const dataToMeasure = data || this.exportData();
        const jsonString = JSON.stringify(dataToMeasure);
        
        // Calculate size in bytes (rough estimate for UTF-8)
        const bytes = new TextEncoder().encode(jsonString).length;
        
        return {
            bytes: bytes,
            kilobytes: (bytes / 1024).toFixed(2),
            megabytes: (bytes / 1024 / 1024).toFixed(2)
        };
    }
}

// Make available globally
window.AppState = AppState;