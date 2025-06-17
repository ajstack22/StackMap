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
        
        // Debug logging for tomorrow activities
        if (!isToday) {
            // console.log('TOMORROW: Activity added successfully to tomorrow activities');
            // console.log('TOMORROW: New activity:', newActivity.title);
            // console.log('TOMORROW: Total tomorrow activities:', user.tomorrowActivities.length);
            // console.log('TOMORROW: Legacy activities array synced:', this.activities.length);
        }
        
        this._triggerSave();
    }

    updateActivity(index, updates) {
        console.log('updateActivity called with:', { index, updates });
        
        // Story 4: Get the current user and determine which activities to modify
        const user = this.getCurrentUser();
        const isToday = this.ui.currentDay === 'today';
        const targetActivities = isToday ? user.activities : user.tomorrowActivities;
        
        if (index >= 0 && index < targetActivities.length) {
            console.log('Before update:', targetActivities[index]);
            
            // Story 1: Validate card type if being updated
            if (updates.cardType) {
                updates.cardType = this._validateCardType(updates.cardType);
            }
            
            Object.assign(targetActivities[index], updates);
            console.log('After update:', targetActivities[index]);
            
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
        this.users.profiles[userId] = {
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
                // Prefer the default user if it exists, otherwise use the first user
                if (this.users.profiles[CONFIG.DEFAULT_USER_ID]) {
                    this.users.currentUserId = CONFIG.DEFAULT_USER_ID;
                } else {
                    this.users.currentUserId = userIds[0];
                }
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
            // Save current user data before switching
            this.saveCurrentUserData();
            
            // Switch to new user
            this.users.currentUserId = userId;
            this.loadUserData();
            this._triggerSave();
        }
    }

    // Enhanced loadUserData to handle missing icons
    loadUserData() {
        const user = this.getCurrentUser();
        if (!user) {
            console.error('No current user found, falling back to default');
            this.users.currentUserId = CONFIG.DEFAULT_USER_ID;
            return this.loadUserData(); // Recursive call with default user
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
        console.log('[STATE] updateUser called with:', { userId, updates });
        console.trace('[STATE] updateUser call stack');
        
        if (!this.users.profiles[userId]) {
            throw new Error('User not found');
        }
        
        const user = this.users.profiles[userId];
        
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
            
            user.name = trimmedName;
            
            // Update title if it matches the old name
            if (user.settings && user.settings.title === user.name + "'s StackMap") {
                user.settings.title = trimmedName + "'s StackMap";
            }
        }
        
        // Validate and update icon if provided
        if (updates.icon !== undefined) {
            console.log('[STATE] Updating user icon from:', user.icon, 'to:', updates.icon);
            user.icon = updates.icon || '👤';
            console.log('[STATE] User icon after update:', user.icon);
        }
        
        // Update any other properties
        Object.keys(updates).forEach(key => {
            if (key !== 'name' && key !== 'icon' && updates[key] !== undefined) {
                user[key] = updates[key];
            }
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
            activities: this.getCurrentActivities() // For backward compatibility
        };
    }

    // Enhanced importData to handle user icons
    importData(data, updateVersion = true) {
        console.log('[State] Starting importData with data structure:', {
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
                console.log('[State] Importing multi-user format');
                this.users = data.users;
                
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
                            console.log(`[State] Fixed ${fixedCount} duplicate IDs for user ${user.name} during import`);
                        }
                    }
                });
                
                // Check if any activity is hidden and mark all as visible
                Object.values(this.users.profiles).forEach(user => {
                    if (user.activities && user.activities.some(a => a.visible === false)) {
                        console.log('[State] Found hidden activities, marking all as visible');
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
                    this.users.currentUserId = CONFIG.DEFAULT_USER_ID;
                }
                
                this.loadUserData();
            } else if (data.activities) {
                // Legacy single-user format - migrate to default user
                console.log('[State] Importing legacy single-user format (v' + (data.version || '1.0') + ')');
                
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
                    console.log('[State] Found hidden activities in legacy format, marking all as visible');
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
                console.log('[State] Legacy import successful, created user:', this.users.profiles[CONFIG.DEFAULT_USER_ID].name);
            } else {
                throw new Error('No valid data to import: missing both users and activities');
            }
            
            this._triggerSave();
            console.log('[State] Import completed successfully');
            
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
        console.log('[State] Merging with remote data');
        
        // For multi-user sync, we need to merge each user's data
        if (remoteData.users && remoteData.users.profiles) {
            // Merge each user's data
            Object.keys(remoteData.users.profiles).forEach(userId => {
                const remoteUser = remoteData.users.profiles[userId];
                const localUser = this.users.profiles[userId];
                
                if (localUser) {
                    // User exists locally - merge their activities
                    console.log(`[State] Merging data for user: ${localUser.name}`);
                    
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
                    console.log(`[State] Adding new user from remote: ${remoteUser.name}`);
                    this.users.profiles[userId] = remoteUser;
                }
            });
            
            // Check if any local users need to be kept that aren't in remote
            // (This preserves locally created users)
            Object.keys(this.users.profiles).forEach(userId => {
                if (!remoteData.users.profiles[userId]) {
                    console.log(`[State] Keeping local-only user: ${this.users.profiles[userId].name}`);
                }
            });
            
        } else {
            // Legacy format - merge current user only
            console.log('[State] Merging legacy format - current user only');
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
}

// Make available globally
window.AppState = AppState;