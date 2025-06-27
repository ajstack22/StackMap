/**
 * Demo Mode for StackMap
 * Provides a guided demo experience for new users
 */

(function() {
    'use strict';
    
    var DemoMode = {
        isDemoMode: false,
        demoUserId: 'demo_user',
        onboardingInstance: null,
        eventListeners: [], // Track all event listeners for cleanup
        initialized: false,
        
        init: function() {
            if (this.initialized) return;
            this.initialized = true;
            
            try {
                this.checkFirstTime();
            } catch (error) {
                console.error('DemoMode: Initialization failed', error);
            }
        },
        
        checkFirstTime: function() {
            try {
                var hasSeenApp = localStorage.getItem('stackmap_seen');
                
                // Safe check for UserManager
                var hasUsers = false;
                if (window.UserManager && typeof window.UserManager.getUsers === 'function') {
                    var users = window.UserManager.getUsers();
                    hasUsers = users && users.length > 0;
                }
                
                if (!hasSeenApp && !hasUsers) {
                    // First time user
                    this.showWelcome();
                }
            } catch (error) {
                console.error('DemoMode: Error checking first time status', error);
            }
        },
        
        showWelcome: function() {
            try {
                if (!window.Modal || typeof window.Modal.show !== 'function') {
                    console.warn('DemoMode: Modal system not available');
                    return;
                }
                
                var modal = window.Modal.show({
                    title: 'Welcome to StackMap! 🌟',
                    content: this.createWelcomeContent(),
                    className: 'welcome-modal',
                    closeable: false
                });
            } catch (error) {
                console.error('DemoMode: Error showing welcome modal', error);
            }
        },
        
        createWelcomeContent: function() {
            var html = '<div class="welcome-content">';
            html += '<p>StackMap helps you manage daily tasks with ease.</p>';
            html += '<p>Perfect for building routines and staying organized!</p>';
            html += '<div class="welcome-actions">';
            html += '<button class="btn-primary" onclick="window.DemoMode.startDemo()">Try Demo</button>';
            html += '<button class="btn-secondary" onclick="window.DemoMode.startFreshFromWelcome()">Start Fresh</button>';
            html += '</div>';
            html += '</div>';
            
            return html;
        },
        
        startDemo: function() {
            var self = this;
            
            // Close welcome modal
            if (window.Modal && typeof window.Modal.close === 'function') {
                window.Modal.close();
            }
            
            // Set demo mode flag
            this.isDemoMode = true;
            
            // Create demo data
            var demoData = this.createDemoData();
            
            // Save demo user
            if (window.UserManager) {
                window.UserManager.saveUser(demoData.user);
                window.UserManager.setCurrentUser(demoData.user.id);
            }
            
            // Save demo tasks
            var saveSuccess = true;
            demoData.tasks.forEach(function(task) {
                if (!self.saveDemoTask(task)) {
                    saveSuccess = false;
                }
            });
            
            if (!saveSuccess) {
                console.error('DemoMode: Some demo tasks failed to save');
            }
            
            // Show demo banner
            this.showDemoBanner();
            
            // Mark as seen
            try {
                localStorage.setItem('stackmap_seen', 'true');
            } catch (e) {
                console.error('DemoMode: Failed to save seen status', e);
            }
            
            // Reload app to show demo data
            if (window.App && typeof window.App.init === 'function') {
                setTimeout(function() {
                    window.App.init();
                }, 100); // Small delay to ensure state is saved
            }
            
            // Start onboarding after a short delay
            setTimeout(function() {
                if (window.Onboarding) {
                    self.onboardingInstance = window.Onboarding;
                    self.onboardingInstance.start();
                }
            }, 500);
            
            // Listen for task completion events in demo mode
            self.setupDemoEventListeners();
        },
        
        startFreshFromWelcome: function() {
            // Close welcome modal
            window.Modal.close();
            
            // Mark as seen
            localStorage.setItem('stackmap_seen', 'true');
            
            // Redirect to user creation
            if (window.App && window.App.showUserSetup) {
                window.App.showUserSetup();
            }
        },
        
        createDemoData: function() {
            var self = this;
            
            // Create demo user
            var demoUser = {
                id: self.demoUserId,
                name: 'Demo User',
                emoji: '🌟',
                isDemo: true,
                preferences: {
                    celebrationsEnabled: true,
                    grownupMode: false
                }
            };
            
            // Sample tasks for different times of day
            var demoTasks = [
                // Morning routine
                {
                    id: 'demo_1',
                    title: 'Wake up and stretch',
                    icon: '🌅',
                    category: 'morning',
                    completed: true,
                    order: 8
                },
                {
                    id: 'demo_2',
                    title: 'Brush teeth',
                    icon: '🪥',
                    category: 'morning',
                    completed: true,
                    order: 7
                },
                {
                    id: 'demo_3',
                    title: 'Take morning medication',
                    icon: '💊',
                    category: 'morning',
                    priority: 'high',
                    completed: false,
                    order: 6
                },
                {
                    id: 'demo_4',
                    title: 'Eat breakfast',
                    icon: '🍳',
                    category: 'morning',
                    completed: false,
                    order: 5
                },
                // Work/School tasks
                {
                    id: 'demo_5',
                    title: 'Check calendar for meetings',
                    icon: '📅',
                    category: 'work',
                    completed: false,
                    order: 4
                },
                {
                    id: 'demo_6',
                    title: 'Work on important project',
                    icon: '💻',
                    category: 'work',
                    priority: 'high',
                    completed: false,
                    order: 3
                },
                // Evening routine
                {
                    id: 'demo_7',
                    title: 'Prepare dinner',
                    icon: '🍽️',
                    category: 'evening',
                    completed: false,
                    order: 2
                },
                {
                    id: 'demo_8',
                    title: 'Evening wind-down routine',
                    icon: '🧘',
                    category: 'evening',
                    completed: false,
                    order: 1
                }
            ];
            
            // Add common fields
            demoTasks = demoTasks.map(function(task) {
                return Object.assign({}, task, {
                    user_id: self.demoUserId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    description: '',
                    due_date: null,
                    reminder: null,
                    tags: [],
                    attachments: []
                });
            });
            
            return {
                user: demoUser,
                tasks: demoTasks
            };
        },
        
        saveDemoTask: function(task) {
            try {
                // Load existing tasks array
                var tasksJson = localStorage.getItem('stackmap_tasks');
                var tasks = tasksJson ? JSON.parse(tasksJson) : [];
                
                // Add the demo task
                tasks.push(task);
                
                // Save back to storage
                localStorage.setItem('stackmap_tasks', JSON.stringify(tasks));
                
                return true;
            } catch (error) {
                console.error('DemoMode: Failed to save demo task', error);
                return false;
            }
        },
        
        showDemoBanner: function() {
            // Remove existing banner if any
            var existingBanner = document.querySelector('.demo-mode-banner');
            if (existingBanner) {
                existingBanner.remove();
            }
            
            var banner = document.createElement('div');
            banner.className = 'demo-mode-banner';
            
            var bannerContent = document.createElement('div');
            bannerContent.className = 'banner-content';
            bannerContent.innerHTML = '👋 <strong>Demo Mode</strong> - Exploring StackMap? ';
            
            var exitBtn = document.createElement('button');
            exitBtn.className = 'demo-exit-btn';
            exitBtn.textContent = 'Start Fresh';
            exitBtn.onclick = function() {
                window.DemoMode.exitDemo();
            };
            
            bannerContent.appendChild(exitBtn);
            banner.appendChild(bannerContent);
            
            document.body.insertBefore(banner, document.body.firstChild);
        },
        
        exitDemo: function() {
            var self = this;
            
            try {
                if (!window.Modal || typeof window.Modal.show !== 'function') {
                    console.warn('DemoMode: Modal system not available');
                    return;
                }
                
                var modal = window.Modal.show({
                title: 'Ready to Start?',
                content: self.createExitContent(),
                className: 'demo-exit-modal'
            });
        },
        
        createExitContent: function() {
            var html = '<div class="demo-exit-content">';
            html += '<p>Would you like to:</p>';
            html += '<div class="demo-exit-options">';
            
            html += '<button class="option-card" onclick="window.DemoMode.startFresh()">';
            html += '<span class="option-icon">🆕</span>';
            html += '<span class="option-title">Start Fresh</span>';
            html += '<span class="option-desc">Begin with no tasks</span>';
            html += '</button>';
            
            html += '<button class="option-card" onclick="window.DemoMode.keepDemoTasks()">';
            html += '<span class="option-icon">💾</span>';
            html += '<span class="option-title">Keep Demo Tasks</span>';
            html += '<span class="option-desc">Convert to your real tasks</span>';
            html += '</button>';
            
            html += '</div>';
            html += '</div>';
            
            return html;
        },
        
        startFresh: function() {
            var self = this;
            
            // Close modal
            window.Modal.close();
            
            // Clear demo data
            this.clearDemoData();
            
            // Remove demo banner
            var banner = document.querySelector('.demo-mode-banner');
            if (banner) {
                banner.remove();
            }
            
            // Reset demo mode flag
            this.isDemoMode = false;
            
            // Redirect to user creation
            if (window.App && window.App.showUserSetup) {
                window.App.showUserSetup();
            }
        },
        
        keepDemoTasks: function() {
            var self = this;
            
            // Close modal
            if (window.Modal && typeof window.Modal.close === 'function') {
                window.Modal.close();
            }
            
            // Convert demo user to real user
            var demoUser = window.UserManager.getUser(this.demoUserId);
            if (demoUser) {
                // Remove demo flag
                delete demoUser.isDemo;
                
                // Show user edit modal to let them customize
                window.Modal.show({
                    title: 'Customize Your Profile',
                    content: this.createProfileCustomizationContent(demoUser),
                    className: 'profile-customization-modal'
                });
            }
        },
        
        createProfileCustomizationContent: function(user) {
            var html = '<div class="profile-customization">';
            html += '<p>Let\'s make this profile yours!</p>';
            html += '<div class="form-group">';
            html += '<label for="user-name">Your Name:</label>';
            html += '<input type="text" id="user-name" value="' + (user.name || '') + '" placeholder="Enter your name">';
            html += '</div>';
            html += '<div class="form-group">';
            html += '<label for="user-emoji">Choose Your Emoji:</label>';
            html += '<div class="emoji-picker">';
            
            var emojis = ['😊', '🌟', '🚀', '🎨', '🌈', '💪', '🧠', '❤️', '🎯', '🌱'];
            emojis.forEach(function(emoji) {
                html += '<button class="emoji-option' + (emoji === user.emoji ? ' selected' : '') + '" data-emoji="' + emoji + '">' + emoji + '</button>';
            });
            
            html += '</div>';
            html += '</div>';
            html += '<div class="form-actions">';
            html += '<button class="btn-primary" onclick="window.DemoMode.saveProfileCustomization()">Save & Continue</button>';
            html += '</div>';
            html += '</div>';
            
            return html;
        },
        
        saveProfileCustomization: function() {
            var name = document.getElementById('user-name').value.trim();
            var selectedEmoji = document.querySelector('.emoji-option.selected');
            var emoji = selectedEmoji ? selectedEmoji.getAttribute('data-emoji') : '🌟';
            
            if (!name) {
                alert('Please enter your name');
                return;
            }
            
            // Update user
            var user = window.UserManager.getUser(this.demoUserId);
            if (user) {
                // Create new user with new ID
                var newUser = {
                    id: 'user_' + Date.now(),
                    name: name,
                    emoji: emoji,
                    preferences: user.preferences
                };
                
                // Save new user
                window.UserManager.saveUser(newUser);
                window.UserManager.setCurrentUser(newUser.id);
                
                // Update all demo tasks to new user ID
                this.migrateDemoTasks(this.demoUserId, newUser.id);
                
                // Remove demo user
                window.UserManager.deleteUser(this.demoUserId);
            }
            
            // Close modal
            if (window.Modal && typeof window.Modal.close === 'function') {
                window.Modal.close();
            }
            
            // Remove demo banner
            var banner = document.querySelector('.demo-mode-banner');
            if (banner) {
                banner.remove();
            }
            
            // Reset demo mode flag
            this.isDemoMode = false;
            
            // Reload app
            if (window.App && window.App.init) {
                window.App.init();
            }
        },
        
        migrateDemoTasks: function(oldUserId, newUserId) {
            var keys = Object.keys(localStorage);
            var taskPrefix = 'task_' + oldUserId + '_';
            
            keys.forEach(function(key) {
                if (key.startsWith(taskPrefix)) {
                    var taskData = localStorage.getItem(key);
                    if (taskData) {
                        try {
                            var task = JSON.parse(taskData);
                            task.user_id = newUserId;
                            
                            // Save with new key
                            var newKey = 'task_' + newUserId + '_' + task.id;
                            localStorage.setItem(newKey, JSON.stringify(task));
                            
                            // Remove old key
                            localStorage.removeItem(key);
                        } catch (e) {
                            console.error('Error migrating task:', e);
                        }
                    }
                }
            });
        },
        
        clearDemoData: function() {
            // Remove demo user
            if (window.UserManager) {
                window.UserManager.deleteUser(this.demoUserId);
            }
            
            // Remove demo tasks
            var keys = Object.keys(localStorage);
            var taskPrefix = 'task_' + this.demoUserId + '_';
            
            keys.forEach(function(key) {
                if (key.startsWith(taskPrefix)) {
                    localStorage.removeItem(key);
                }
            });
        },
        
        isInDemoMode: function() {
            return this.isDemoMode;
        },
        
        setupDemoEventListeners: function() {
            var self = this;
            
            // Listen for task completion in demo mode
            document.addEventListener('change', function(e) {
                if (self.isDemoMode && e.target && e.target.classList.contains('task-checkbox')) {
                    // Dispatch custom event for onboarding
                    var event = new CustomEvent('taskCompleted', {
                        detail: {
                            taskId: e.target.closest('.task-card').getAttribute('data-task-id'),
                            isDemo: true
                        }
                    });
                    document.dispatchEvent(event);
                }
            });
        }
    };
    
    // Utility function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Add cleanup method
    DemoMode.cleanup = function() {
        // Remove all event listeners
        this.eventListeners.forEach(function(listener) {
            listener.element.removeEventListener(listener.type, listener.handler);
        });
        this.eventListeners = [];
        
        // Remove demo banner
        var banner = document.querySelector('.demo-mode-banner');
        if (banner) {
            banner.remove();
        }
        
        // Reset state
        this.isDemoMode = false;
        this.initialized = false;
    };
    
    // Handle emoji picker events
    var emojiClickHandler = function(e) {
        if (e.target.classList.contains('emoji-option')) {
            // Remove selected class from all emojis
            var allEmojis = document.querySelectorAll('.emoji-option');
            allEmojis.forEach(function(emoji) {
                emoji.classList.remove('selected');
            });
            
            // Add selected class to clicked emoji
            e.target.classList.add('selected');
        }
    };
    
    document.addEventListener('click', emojiClickHandler);
    DemoMode.eventListeners.push({
        element: document,
        type: 'click',
        handler: emojiClickHandler
    });
    
    // Export to window
    window.DemoMode = DemoMode;
})();