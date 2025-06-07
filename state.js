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
            showCompletionIndicators: CONFIG.SHOW_COMPLETION_DEFAULT
        };
        this.ui = {
            editMode: false,
            editingCardIndex: -1,
            showingNewCardForm: false,
            selectedEmoji: CONFIG.DEFAULT_EMOJI,
            draggedElement: null,
            cardFilter: '', // Story 2: Filter state
            currentDay: 'today' // Story 4: Current day context
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
                    }
                }
            }
        };
        
        // External save handler
        this.onStateChange = null;
    }

    // === ACTIVITY MANAGEMENT ===
    addActivity(activity, position = 'bottom') {
        // Story 4: Get the current user and determine which activities to modify
        const user = this.getCurrentUser();
        const isToday = this.ui.currentDay === 'today';
        const targetActivities = isToday ? user.activities : user.tomorrowActivities;
        
        if (targetActivities.length >= CONFIG.MAX_ACTIVITIES) {
            throw new Error(`Maximum of ${CONFIG.MAX_ACTIVITIES} activities allowed.`);
        }

        const newActivity = {
            title: activity.title || 'New Activity',
            description: activity.description || '',
            icon: activity.icon || CONFIG.DEFAULT_EMOJI,
            visible: activity.visible !== undefined ? activity.visible : true,
            completed: activity.completed || false,
            cardType: this._validateCardType(activity.cardType || 'recurring'), // Story 1
            createdDate: activity.createdDate || new Date().toISOString().split('T')[0], // Story 1
            time: activity.time || ''
        };

        if (position === 'top') {
            targetActivities.unshift(newActivity);
        } else {
            targetActivities.push(newActivity);
        }
        
        // CRITICAL FIX: Sync the legacy activities array with current context
        if (isToday) {
            this.activities = [...user.activities];
        } else {
            this.activities = [...user.tomorrowActivities];
        }
        
        // Debug logging for tomorrow activities
        if (!isToday) {
            console.log('TOMORROW: Activity added successfully to tomorrow activities');
            console.log('TOMORROW: New activity:', newActivity.title);
            console.log('TOMORROW: Total tomorrow activities:', user.tomorrowActivities.length);
            console.log('TOMORROW: Legacy activities array synced:', this.activities.length);
        }
        
        this._triggerSave();
    }

    updateActivity(index, updates) {
        // Story 4: Get the current user and determine which activities to modify
        const user = this.getCurrentUser();
        const isToday = this.ui.currentDay === 'today';
        const targetActivities = isToday ? user.activities : user.tomorrowActivities;
        
        if (index >= 0 && index < targetActivities.length) {
            // Story 1: Validate card type if being updated
            if (updates.cardType) {
                updates.cardType = this._validateCardType(updates.cardType);
            }
            
            Object.assign(targetActivities[index], updates);
            
            // CRITICAL FIX: Sync the legacy activities array with current context
            if (isToday) {
                this.activities = [...user.activities];
            } else {
                this.activities = [...user.tomorrowActivities];
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
            
            // CRITICAL FIX: Sync the legacy activities array with current context
            if (isToday) {
                this.activities = [...user.activities];
            } else {
                this.activities = [...user.tomorrowActivities];
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
            
            // CRITICAL FIX: Sync the legacy activities array with current context
            if (isToday) {
                this.activities = [...user.activities];
            } else {
                this.activities = [...user.tomorrowActivities];
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
            
            // CRITICAL FIX: Sync the legacy activities array with current context
            if (isToday) {
                this.activities = [...user.activities];
            } else {
                this.activities = [...user.tomorrowActivities];
            }
            
            this._triggerSave();
        }
    }

    toggleActivityCompletion(index) {
        // Story 4: Get the current user and determine which activities to modify
        const user = this.getCurrentUser();
        const isToday = this.ui.currentDay === 'today';
        const targetActivities = isToday ? user.activities : user.tomorrowActivities;
        
        if (index >= 0 && index < targetActivities.length) {
            targetActivities[index].completed = !targetActivities[index].completed;
            
            // CRITICAL FIX: Sync the legacy activities array with current context
            if (isToday) {
                this.activities = [...user.activities];
            } else {
                this.activities = [...user.tomorrowActivities];
            }
            
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
        
        // Create user profile with icon
        this.users.profiles[userId] = {
            id: userId,
            name: trimmedName,
            icon: icon, // NEW: Store user's chosen emoji icon
            activities: [],
            tomorrowActivities: [], // Story 4: Tomorrow's activities
            settings: {
                title: trimmedName + "'s StackMap",
                subtitle: 'Routine Ready',
                isDefaultTitle: false,
                backgroundColor: CONFIG.DEFAULT_COLOR,
                showNumbers: CONFIG.SHOW_NUMBERS_DEFAULT,
                showCompletionIndicators: CONFIG.SHOW_COMPLETION_DEFAULT
            }
        };
        
        this._triggerSave();
        return userId;
    }

    getCurrentUser() {
        return this.users.profiles[this.users.currentUserId];
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
            
            // Sync the legacy activities array with the current day's activities
            const user = this.getCurrentUser();
            this.activities = day === 'today' ? [...user.activities] : [...user.tomorrowActivities];
            
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
            
            // Load activities based on current day
            this.activities = this.ui.currentDay === 'today' 
                ? [...(user.activities || [])]
                : [...(user.tomorrowActivities || [])];
            
            // Load settings with fallback defaults
            this.settings = {
                title: user.settings?.title || user.name + "'s StackMap",
                subtitle: user.settings?.subtitle || 'Routine Ready',
                isDefaultTitle: user.settings?.isDefaultTitle ?? false,
                backgroundColor: user.settings?.backgroundColor || CONFIG.DEFAULT_COLOR,
                showNumbers: user.settings?.showNumbers ?? CONFIG.SHOW_NUMBERS_DEFAULT,
                showCompletionIndicators: user.settings?.showCompletionIndicators ?? CONFIG.SHOW_COMPLETION_DEFAULT
            };
            
            // Apply theme
            this.applyTheme();
            
            return true;
        } catch (error) {
            console.error('Error loading user data:', error);
            return false;
        }
    }

    saveCurrentUserData() {
        const user = this.getCurrentUser();
        if (user) {
            // Save activities to the correct day
            if (this.ui.currentDay === 'today') {
                user.activities = [...this.activities];
            } else {
                user.tomorrowActivities = [...this.activities];
            }
            user.settings = {...this.settings};
        }
    }

    deleteUser(userId) {
        // Can't delete the default user or the current user
        if (userId === CONFIG.DEFAULT_USER_ID || userId === this.users.currentUserId) {
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
            user.icon = updates.icon || '👤';
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

    // === DATA EXPORT/IMPORT ===
    exportData() {
        this.saveCurrentUserData(); // Save current state to user profile
        return {
            version: CONFIG.DATA_VERSION,
            users: this.users,
            ui: {
                currentDay: this.ui.currentDay // Persist day selection
            }
        };
    }

    // Enhanced importData to handle user icons
    importData(data) {
        // Restore UI state if present
        if (data.ui) {
            if (data.ui.currentDay) {
                this.ui.currentDay = data.ui.currentDay;
            }
        }
        
        if (data.users) {
            // New multi-user format
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
            });
            
            // Ensure current user exists
            if (!this.users.profiles[this.users.currentUserId]) {
                this.users.currentUserId = CONFIG.DEFAULT_USER_ID;
            }
            
            this.loadUserData();
        } else if (data.activities) {
            // Legacy single-user format - migrate to default user
            const activities = data.activities.slice(0, CONFIG.MAX_ACTIVITIES).map(activity => ({
                ...activity,
                cardType: this._validateCardType(activity.cardType || 'recurring'),
                createdDate: activity.createdDate || new Date().toISOString().split('T')[0],
                time: activity.time || ''
            }));
            
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
                settings: settings
            };
            
            this.users.currentUserId = CONFIG.DEFAULT_USER_ID;
            this.loadUserData();
        }
        
        this._triggerSave();
    }

    // === PRIVATE METHODS ===
    _triggerSave() {
        if (this.onStateChange) {
            this.onStateChange();
        }
    }
}

// Make available globally
window.AppState = AppState;