// state.js - Application state management with card type support and filter state
// === STATE MANAGEMENT ===
class AppState {
    constructor() {
        this.activities = [];
        this.settings = {
            title: 'My StackMap',
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
                    name: 'My StackMap',
                    activities: [],
                    tomorrowActivities: [], // Story 4: Tomorrow's activities
                    settings: {
                        title: 'My StackMap',
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
        // Story 4: Get the current context activities
        const targetActivities = this.getCurrentActivities();
        
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
        
        this._triggerSave();
    }

    updateActivity(index, updates) {
        // Story 4: Get the current context activities
        const targetActivities = this.getCurrentActivities();
        
        if (index >= 0 && index < targetActivities.length) {
            // Story 1: Validate card type if being updated
            if (updates.cardType) {
                updates.cardType = this._validateCardType(updates.cardType);
            }
            
            Object.assign(targetActivities[index], updates);
            this._triggerSave();
        }
    }

    removeActivity(index) {
        // Story 4: Get the current context activities
        const targetActivities = this.getCurrentActivities();
        
        if (index >= 0 && index < targetActivities.length) {
            targetActivities.splice(index, 1);
            this._triggerSave();
        }
    }

    moveActivity(fromIndex, toIndex) {
        // Story 4: Get the current context activities
        const targetActivities = this.getCurrentActivities();
        
        if (fromIndex >= 0 && fromIndex < targetActivities.length &&
            toIndex >= 0 && toIndex < targetActivities.length) {
            const [removed] = targetActivities.splice(fromIndex, 1);
            targetActivities.splice(toIndex, 0, removed);
            this._triggerSave();
        }
    }

    toggleActivityVisibility(index) {
        // Story 4: Get the current context activities
        const targetActivities = this.getCurrentActivities();
        
        if (index >= 0 && index < targetActivities.length) {
            targetActivities[index].visible = !targetActivities[index].visible;
            this._triggerSave();
        }
    }

    toggleActivityCompletion(index) {
        // Story 4: Get the current context activities
        const targetActivities = this.getCurrentActivities();
        
        if (index >= 0 && index < targetActivities.length) {
            targetActivities[index].completed = !targetActivities[index].completed;
            this._triggerSave();
        }
    }

    // === STORY 1: CARD TYPE MANAGEMENT ===
    _validateCardType(cardType) {
        const validTypes = ['recurring', 'frequent', 'single-use'];
        return validTypes.includes(cardType) ? cardType : 'recurring';
    }

    // === USER MANAGEMENT ===
    addUser(name) {
        if (Object.keys(this.users.profiles).length >= CONFIG.MAX_USERS) {
            throw new Error(`Maximum of ${CONFIG.MAX_USERS} users allowed.`);
        }
        
        const userId = 'user_' + Date.now();
        this.users.profiles[userId] = {
            id: userId,
            name: name.substring(0, CONFIG.USER_NAME_MAX_LENGTH),
            activities: [],
            tomorrowActivities: [], // Story 4: Tomorrow's activities
            settings: {
                title: name + "'s StackMap",
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

    loadUserData() {
        const user = this.getCurrentUser();
        if (user) {
            this.activities = [...user.activities];
            this.settings = {...user.settings};
            this.applyTheme();
        }
    }

    saveCurrentUserData() {
        const user = this.getCurrentUser();
        if (user) {
            user.activities = [...this.activities];
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

    cycleCardType(index) {
        if (index >= 0 && index < this.activities.length) {
            const currentType = this.activities[index].cardType || 'recurring';
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
        
        this.activities.forEach(activity => {
            const type = activity.cardType || 'recurring';
            stats[type]++;
        });
        
        return stats;
    }

    // === SETTINGS MANAGEMENT ===
    updateTitle(title) {
        this.settings.title = title;
        this.settings.isDefaultTitle = (title === 'My StackMap');
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
        
        // Update body background
        document.body.style.background = color;
        
        // Update card number backgrounds
        document.querySelectorAll('.card__number').forEach(el => {
            el.style.background = color;
        });
        
        // Update logo colors if PreferencesManager exists
        if (window.appInstance && window.appInstance.preferencesManager) {
            window.appInstance.preferencesManager.updateLogoColors(color);
        }
    }

    // === DATA EXPORT/IMPORT ===
    exportData() {
        this.saveCurrentUserData(); // Save current state to user profile
        return {
            version: CONFIG.DATA_VERSION,
            users: this.users
        };
    }

    importData(data) {
        if (data.users) {
            // New multi-user format
            this.users = data.users;
            
            // Story 4: Ensure all users have tomorrow activities array
            Object.values(this.users.profiles).forEach(user => {
                if (!user.tomorrowActivities) {
                    user.tomorrowActivities = [];
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
                title: 'My StackMap',
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
            
            // Migrate to default user
            this.users.profiles[CONFIG.DEFAULT_USER_ID] = {
                id: CONFIG.DEFAULT_USER_ID,
                name: settings.title || 'My StackMap',
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