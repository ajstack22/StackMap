/**
 * Profile UI Handler for StackMap
 * Manages the profile view interface
 */

(function() {
    'use strict';
    
    const ProfileUI = {
        profileListContainer: null,
        
        /**
         * Initialize profile UI
         */
        init: function() {
            const self = this;
            
            // Setup containers
            self.profileListContainer = document.getElementById('profile-list');
            
            // Setup buttons
            self.setupButtons();
            
            // Initial render
            self.render();
        },
        
        /**
         * Setup button handlers
         */
        setupButtons: function() {
            const self = this;
            
            // Add profile button
            const addBtn = document.getElementById('add-profile-btn');
            if (addBtn) {
                addBtn.onclick = function() {
                    self.showAddProfileDialog();
                };
                
                // Apply safe mode styling
                if (window.StackMapSafeMode) {
                    addBtn.style.minHeight = '60px';
                }
            }
            
            // Guest mode button
            const guestBtn = document.getElementById('guest-mode-btn');
            if (guestBtn) {
                guestBtn.onclick = function() {
                    self.switchToGuestMode();
                };
                
                // Apply safe mode styling
                if (window.StackMapSafeMode) {
                    guestBtn.style.minHeight = '60px';
                }
            }
        },
        
        /**
         * Render profile list
         */
        render: function() {
            const self = this;
            
            if (!self.profileListContainer || !window.UserManager) return;
            
            // Clear container
            self.profileListContainer.innerHTML = '';
            
            // Get users
            const users = window.UserManager.users;
            const currentUser = window.UserManager.getCurrentUser();
            
            // Render each user
            users.forEach(function(user) {
                const profileCard = self.createProfileCard(user, user.id === (currentUser ? currentUser.id : null));
                self.profileListContainer.appendChild(profileCard);
            });
        },
        
        /**
         * Create profile card element
         */
        createProfileCard: function(user, isCurrent) {
            const self = this;
            
            const card = document.createElement('div');
            card.className = `profile-card${isCurrent ? ' current' : ''}`;
            card.style.cssText = 
                `display: flex;align-items: center;gap: 16px;padding: 16px;background: ${isCurrent ? '#5a6c40' : '#333'};border-radius: 8px;margin-bottom: 12px;cursor: pointer;transition: ${window.StackMapSafeMode ? 'none' : 'all 0.2s ease'};min-height: ${window.StackMapSafeMode ? '60px' : '44px'};`;
            
            // Emoji
            const emoji = document.createElement('span');
            emoji.className = 'profile-emoji';
            emoji.textContent = user.emoji;
            emoji.style.cssText = 'font-size: 32px;';
            
            // Info container
            const info = document.createElement('div');
            info.style.cssText = 'flex: 1;';
            
            // Name
            const name = document.createElement('div');
            name.className = 'profile-name';
            name.textContent = user.name;
            name.style.cssText = 
                'font-size: 18px;' +
                'font-weight: bold;' +
                'color: #fff;';
            
            // Status
            const status = document.createElement('div');
            status.className = 'profile-status';
            status.style.cssText = 
                'font-size: 14px;' +
                'color: #ccc;' +
                'margin-top: 4px;';
            
            if (isCurrent) {
                status.textContent = 'Current User';
            } else if (user.safeMode) {
                status.textContent = 'Safe Mode Enabled';
            } else if (user.isGuest) {
                status.textContent = 'Guest';
            }
            
            info.appendChild(name);
            if (status.textContent) {
                info.appendChild(status);
            }
            
            // Actions
            const actions = document.createElement('div');
            actions.style.cssText = 'display: flex; gap: 8px;';
            
            if (!isCurrent) {
                // Switch button
                const switchBtn = document.createElement('button');
                switchBtn.textContent = 'Switch';
                switchBtn.className = 'profile-switch-btn';
                switchBtn.style.cssText = 
                    'padding: 8px 16px;' +
                    'background: #5a6c40;' +
                    'color: white;' +
                    'border: none;' +
                    'border-radius: 6px;' +
                    'cursor: pointer;';
                
                switchBtn.onclick = function(e) {
                    e.stopPropagation();
                    self.switchToUser(user);
                };
                
                actions.appendChild(switchBtn);
            }
            
            // Edit button (not for guests)
            if (!user.isGuest) {
                const editBtn = document.createElement('button');
                editBtn.textContent = '✏️';
                editBtn.className = 'profile-edit-btn';
                editBtn.setAttribute('aria-label', 'Edit profile');
                editBtn.style.cssText = 
                    'width: 40px;' +
                    'height: 40px;' +
                    'background: #444;' +
                    'color: white;' +
                    'border: none;' +
                    'border-radius: 50%;' +
                    'cursor: pointer;';
                
                editBtn.onclick = function(e) {
                    e.stopPropagation();
                    self.showEditProfileDialog(user);
                };
                
                actions.appendChild(editBtn);
            }
            
            // Delete button (not for default user or current user)
            if (!user.isDefault && !isCurrent && !user.isGuest) {
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '🗑️';
                deleteBtn.className = 'profile-delete-btn';
                deleteBtn.setAttribute('aria-label', 'Delete profile');
                deleteBtn.style.cssText = 
                    'width: 40px;' +
                    'height: 40px;' +
                    'background: #d32f2f;' +
                    'color: white;' +
                    'border: none;' +
                    'border-radius: 50%;' +
                    'cursor: pointer;';
                
                deleteBtn.onclick = function(e) {
                    e.stopPropagation();
                    self.confirmDeleteProfile(user);
                };
                
                actions.appendChild(deleteBtn);
            }
            
            // Assemble card
            card.appendChild(emoji);
            card.appendChild(info);
            card.appendChild(actions);
            
            // Click to switch (if not current)
            if (!isCurrent) {
                card.onclick = function() {
                    self.switchToUser(user);
                };
            }
            
            return card;
        },
        
        /**
         * Switch to user
         */
        switchToUser: function(user) {
            const self = this;
            
            window.UserManager.switchUser(user.id, function(success) {
                if (success) {
                    // Re-render profile list
                    self.render();
                    
                    // Go back to main view
                    if (window.StackMapApp && window.StackMapApp.ViewController) {
                        window.StackMapApp.ViewController.show('main-view', { animate: true, isBack: true });
                    }
                }
            });
        },
        
        /**
         * Switch to guest mode
         */
        switchToGuestMode: function() {
            const self = this;
            
            window.UserManager.createGuestUser(function(guestUser) {
                if (guestUser) {
                    self.switchToUser(guestUser);
                }
            });
        },
        
        /**
         * Show add profile dialog
         */
        showAddProfileDialog: function() {
            const self = this;
            
            // Create simple prompt for name
            const name = prompt('Enter profile name:');
            if (!name || name.trim() === '') return;
            
            // Get suggested emoji
            const emoji = window.UserManager.getNextAvailableEmoji();
            let selectedEmoji = prompt('Choose an emoji for the profile:', emoji);
            if (!selectedEmoji) selectedEmoji = emoji;
            
            // Ask about safe mode
            const enableSafeMode = confirm('Enable Safe Mode for this profile?\n\nSafe Mode provides:\n• Larger buttons (60px)\n• No animations\n• Extended timeouts\n• Simplified interface');
            
            // Create user
            window.UserManager.createUser({
                name: name.trim(),
                emoji: selectedEmoji,
                safeMode: enableSafeMode
            }, function(newUser) {
                if (newUser) {
                    self.render();
                    
                    // Ask to switch
                    if (confirm(`Switch to ${newUser.name} now?`)) {
                        self.switchToUser(newUser);
                    }
                }
            });
        },
        
        /**
         * Show edit profile dialog
         */
        showEditProfileDialog: function(user) {
            const self = this;
            
            // Edit name
            const newName = prompt('Edit profile name:', user.name);
            if (newName === null) return; // Cancelled
            
            // Edit emoji
            const newEmoji = prompt('Edit profile emoji:', user.emoji);
            if (newEmoji === null) return; // Cancelled
            
            // Edit safe mode
            const newSafeMode = confirm(`Safe Mode ${user.safeMode ? 'is currently ON' : 'is currently OFF'}.\n\nEnable Safe Mode for this profile?`);
            
            // Edit grown-up mode
            const currentGrownupMode = user.preferences && user.preferences.grownupMode !== false;
            const newGrownupMode = confirm(`Grown-up Mode ${currentGrownupMode ? 'is currently ON' : 'is currently OFF'}.\n\nGrownup Mode requires a math problem to enter edit mode.\n\nEnable Grown-up Mode for this profile?`);
            
            // Update user
            window.UserManager.updateUser(user.id, {
                name: newName.trim() || user.name,
                emoji: newEmoji || user.emoji,
                safeMode: newSafeMode,
                preferences: {
                    grownupMode: newGrownupMode
                }
            }, function(success) {
                if (success) {
                    self.render();
                }
            });
        },
        
        /**
         * Confirm delete profile
         */
        confirmDeleteProfile: function(user) {
            const self = this;
            
            if (confirm(`Delete profile "${user.name}"?\n\nThis will permanently delete all tasks for this user.`)) {
                window.UserManager.deleteUser(user.id, function(success) {
                    if (success) {
                        self.render();
                    }
                });
            }
        }
    };
    
    // Export to global scope
    window.ProfileUI = ProfileUI;
    
    // Initialize when profiles view is shown
    document.addEventListener('DOMContentLoaded', function() {
        // Listen for view changes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.id === 'profiles-view' && 
                    mutation.target.classList.contains('hidden') === false) {
                    ProfileUI.init();
                }
            });
        });
        
        const profilesView = document.getElementById('profiles-view');
        if (profilesView) {
            observer.observe(profilesView, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });
        }
    });
})();