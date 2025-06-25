/**
 * User Manager for StackMap
 * Handles user profiles and switching for families sharing devices
 * No passwords - designed for quick switching
 */

(function() {
    'use strict';
    
    const UserManager = {
        currentUserId: null,
        users: [],
        defaultEmojis: ['👤', '😊', '🦁', '🐻', '🦊', '🐯', '🐸', '🦋', '🌟', '🎨', '🎮', '⚽'],
        
        /**
         * Initialize user manager
         */
        init: function(callback) {
            const self = this;
            
            // Load users from storage
            self.loadUsers(function() {
                // Set current user or create default
                self.initializeCurrentUser();
                
                if (callback) callback();
            });
        },
        
        /**
         * Load users from storage
         */
        loadUsers: function(callback) {
            const self = this;
            
            try {
                const stored = localStorage.getItem('stackmap_users');
                if (stored) {
                    self.users = JSON.parse(stored);
                } else {
                    // First time - create default user
                    self.createDefaultUser();
                }
            } catch (error) {
                console.error('UserManager: Failed to load users', error);
                self.createDefaultUser();
            }
            
            if (callback) callback();
        },
        
        /**
         * Save users to storage
         */
        saveUsers: function(callback) {
            const self = this;
            
            try {
                localStorage.setItem('stackmap_users', JSON.stringify(self.users));
                if (callback) callback(true);
            } catch (error) {
                console.error('UserManager: Failed to save users', error);
                if (callback) callback(false);
            }
        },
        
        /**
         * Create default user for first time
         */
        createDefaultUser: function() {
            const self = this;
            
            const defaultUser = {
                id: `user_${Date.now()}`,
                name: 'Me',
                emoji: '👤',
                isDefault: true,
                safeMode: false,
                created: new Date().toISOString(),
                preferences: {
                    celebrationsEnabled: true,
                    showCelebrationMessages: true,
                    showDailyCounter: true,
                    celebrationStyle: 'pulse', // pulse, burst, minimal
                    grownupMode: true // Require math challenge for edit mode
                }
            };
            
            self.users = [defaultUser];
            self.currentUserId = defaultUser.id;
            self.saveUsers();
        },
        
        /**
         * Initialize current user
         */
        initializeCurrentUser: function() {
            const self = this;
            
            // Check for saved current user
            try {
                const savedUserId = localStorage.getItem('stackmap_current_user');
                if (savedUserId && self.getUserById(savedUserId)) {
                    self.currentUserId = savedUserId;
                } else {
                    // Use first user or guest
                    self.currentUserId = self.users.length > 0 ? self.users[0].id : null;
                }
            } catch (error) {
                self.currentUserId = self.users.length > 0 ? self.users[0].id : null;
            }
            
            // Apply user's safe mode setting
            self.applyUserSettings();
        },
        
        /**
         * Get user by ID
         */
        getUserById: function(userId) {
            const self = this;
            
            for (let i = 0; i < self.users.length; i++) {
                if (self.users[i].id === userId) {
                    return self.users[i];
                }
            }
            return null;
        },
        
        /**
         * Get current user
         */
        getCurrentUser: function() {
            const self = this;
            return self.getUserById(self.currentUserId);
        },
        
        /**
         * Switch to different user
         */
        switchUser: function(userId, callback) {
            const self = this;
            
            const user = self.getUserById(userId);
            if (!user) {
                console.error('UserManager: User not found', userId);
                if (callback) callback(false);
                return;
            }
            
            // Save current user
            self.currentUserId = userId;
            
            try {
                localStorage.setItem('stackmap_current_user', userId);
            } catch (error) {
                console.warn('UserManager: Could not save current user', error);
            }
            
            // Apply user settings
            self.applyUserSettings();
            
            // Trigger UI refresh
            if (window.TaskDisplay && window.TaskDisplay.isInitialized) {
                window.TaskDisplay.render();
            }
            
            // Announce change for screen readers
            self.announceUserSwitch(user);
            
            if (callback) callback(true);
        },
        
        /**
         * Apply current user's settings
         */
        applyUserSettings: function() {
            const self = this;
            const user = self.getCurrentUser();
            
            if (user && user.safeMode) {
                // Enable safe mode for this user
                window.StackMapSafeMode = true;
                document.documentElement.classList.add('safe-mode');
                
                // Update safe mode config
                window.SAFE_MODE_CONFIG = {
                    disableAnimations: true,
                    disableSync: true,
                    simplifiedUI: true,
                    largerTouchTargets: true,
                    extendedTimeouts: true,
                    minimalFeatures: true,
                    timeoutMultiplier: 3.3
                };
            } else if (!self.isUrlSafeMode()) {
                // Disable safe mode if not set by URL
                window.StackMapSafeMode = false;
                document.documentElement.classList.remove('safe-mode');
            }
        },
        
        /**
         * Check if safe mode is set by URL
         */
        isUrlSafeMode: function() {
            return /[?&]safe=true(&|$)/i.test(window.location.search);
        },
        
        /**
         * Create new user profile
         */
        createUser: function(userData, callback) {
            const self = this;
            
            // Validate input
            if (!userData.name || userData.name.trim() === '') {
                if (callback) callback(null, 'Name is required');
                return;
            }
            
            // Create user object
            const newUser = {
                id: `user_${Date.now()}`,
                name: userData.name.trim(),
                emoji: userData.emoji || self.getRandomEmoji(),
                safeMode: userData.safeMode || false,
                isGuest: userData.isGuest || false,
                created: new Date().toISOString(),
                preferences: {
                    celebrationsEnabled: true,
                    showCelebrationMessages: true,
                    showDailyCounter: true,
                    celebrationStyle: 'pulse', // pulse, burst, minimal
                    grownupMode: true // Require math challenge for edit mode
                }
            };
            
            // Add to users array
            self.users.push(newUser);
            
            // Save to storage
            self.saveUsers(function(success) {
                if (success) {
                    if (callback) callback(newUser);
                } else {
                    // Rollback
                    const index = self.users.indexOf(newUser);
                    if (index > -1) {
                        self.users.splice(index, 1);
                    }
                    if (callback) callback(null, 'Failed to save user');
                }
            });
        },
        
        /**
         * Update user profile
         */
        updateUser: function(userId, updates, callback) {
            const self = this;
            
            const user = self.getUserById(userId);
            if (!user) {
                if (callback) callback(false, 'User not found');
                return;
            }
            
            // Apply updates
            if (updates.name !== undefined) user.name = updates.name;
            if (updates.emoji !== undefined) user.emoji = updates.emoji;
            if (updates.safeMode !== undefined) user.safeMode = updates.safeMode;
            
            // Apply preference updates
            if (updates.preferences) {
                user.preferences = user.preferences || {};
                for (const key in updates.preferences) {
                    if (updates.preferences.hasOwnProperty(key)) {
                        user.preferences[key] = updates.preferences[key];
                    }
                }
            }
            
            user.updated = new Date().toISOString();
            
            // Save changes
            self.saveUsers(function(success) {
                if (success && userId === self.currentUserId) {
                    // Apply settings if current user
                    self.applyUserSettings();
                }
                if (callback) callback(success);
            });
        },
        
        /**
         * Delete user profile
         */
        deleteUser: function(userId, callback) {
            const self = this;
            
            // Can't delete default user or current user
            const user = self.getUserById(userId);
            if (!user || user.isDefault || userId === self.currentUserId) {
                if (callback) callback(false, 'Cannot delete this user');
                return;
            }
            
            // Remove user
            let index = -1;
            for (let i = 0; i < self.users.length; i++) {
                if (self.users[i].id === userId) {
                    index = i;
                    break;
                }
            }
            
            if (index > -1) {
                self.users.splice(index, 1);
                
                // Save changes
                self.saveUsers(callback);
            } else {
                if (callback) callback(false);
            }
        },
        
        /**
         * Create guest user
         */
        createGuestUser: function(callback) {
            const self = this;
            
            const guestData = {
                name: 'Guest',
                emoji: '👋',
                isGuest: true,
                safeMode: false
            };
            
            self.createUser(guestData, callback);
        },
        
        /**
         * Get random emoji for new users
         */
        getRandomEmoji: function() {
            const self = this;
            const index = Math.floor(Math.random() * self.defaultEmojis.length);
            return self.defaultEmojis[index];
        },
        
        /**
         * Get next suggested emoji (not used by existing users)
         */
        getNextAvailableEmoji: function() {
            const self = this;
            
            // Get used emojis
            const usedEmojis = {};
            for (let i = 0; i < self.users.length; i++) {
                usedEmojis[self.users[i].emoji] = true;
            }
            
            // Find first available
            for (let j = 0; j < self.defaultEmojis.length; j++) {
                if (!usedEmojis[self.defaultEmojis[j]]) {
                    return self.defaultEmojis[j];
                }
            }
            
            // All used, return random
            return self.getRandomEmoji();
        },
        
        /**
         * Announce user switch for accessibility
         */
        announceUserSwitch: function(user) {
            let announcer = document.getElementById('user-switch-announcer');
            if (!announcer) {
                announcer = document.createElement('div');
                announcer.id = 'user-switch-announcer';
                announcer.setAttribute('aria-live', 'polite');
                announcer.setAttribute('aria-atomic', 'true');
                announcer.style.position = 'absolute';
                announcer.style.left = '-10000px';
                document.body.appendChild(announcer);
            }
            
            announcer.textContent = `Switched to ${user.name}`;
        },
        
        /**
         * Render user switcher UI
         */
        renderUserSwitcher: function(container) {
            const self = this;
            
            if (!container) return;
            
            // Clear container
            container.innerHTML = '';
            
            // Create user switcher
            const switcher = document.createElement('div');
            switcher.className = 'user-switcher';
            switcher.style.cssText = 
                'display: flex;' +
                'gap: 12px;' +
                'align-items: center;' +
                'padding: 12px;' +
                'background: #333;' +
                'border-radius: 8px;' +
                'margin-bottom: 16px;';
            
            // Current user display
            const currentUser = self.getCurrentUser();
            if (currentUser) {
                const userDisplay = document.createElement('div');
                userDisplay.className = 'current-user';
                userDisplay.style.cssText = 
                    'display: flex;' +
                    'align-items: center;' +
                    'gap: 8px;' +
                    'font-size: 18px;' +
                    'flex: 1;';
                
                const emoji = document.createElement('span');
                emoji.textContent = currentUser.emoji;
                emoji.style.fontSize = '24px';
                
                const name = document.createElement('span');
                name.textContent = currentUser.name;
                
                userDisplay.appendChild(emoji);
                userDisplay.appendChild(name);
                switcher.appendChild(userDisplay);
            }
            
            // Switch user button
            const switchBtn = document.createElement('button');
            switchBtn.textContent = 'Switch User';
            switchBtn.className = 'switch-user-btn';
            switchBtn.style.cssText = 
                `padding: 8px 16px;background: #5a6c40;color: white;border: none;border-radius: 6px;font-size: 16px;cursor: pointer;min-height: ${window.StackMapSafeMode ? '60px' : '44px'};`;
            
            switchBtn.onclick = function() {
                if (window.StackMapApp && window.StackMapApp.ViewController) {
                    window.StackMapApp.ViewController.show('profiles-view', { animate: true });
                }
            };
            
            switcher.appendChild(switchBtn);
            container.appendChild(switcher);
        },
        
        /**
         * Migrate existing tasks to default user
         */
        migrateExistingTasks: function(callback) {
            const self = this;
            
            // Only migrate if we have a default user
            const defaultUser = self.users.find(function(u) { return u.isDefault; });
            if (!defaultUser) {
                if (callback) callback(false);
                return;
            }
            
            // Check if migration already done
            try {
                const migrated = localStorage.getItem('stackmap_user_migration_done');
                if (migrated) {
                    if (callback) callback(true);
                    return;
                }
            } catch (error) {
                // Continue with migration
            }
            
            // Add user_id to existing tasks
            try {
                const tasks = localStorage.getItem('stackmap_tasks');
                if (tasks) {
                    const taskList = JSON.parse(tasks);
                    let updated = false;
                    
                    for (let i = 0; i < taskList.length; i++) {
                        if (!taskList[i].user_id) {
                            taskList[i].user_id = defaultUser.id;
                            updated = true;
                        }
                    }
                    
                    if (updated) {
                        localStorage.setItem('stackmap_tasks', JSON.stringify(taskList));
                    }
                }
                
                // Mark migration as done
                localStorage.setItem('stackmap_user_migration_done', 'true');
                
                if (callback) callback(true);
            } catch (error) {
                console.error('UserManager: Failed to migrate tasks', error);
                if (callback) callback(false);
            }
        }
    };
    
    // Export to global scope
    window.UserManager = UserManager;
})();