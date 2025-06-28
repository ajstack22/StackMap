        // ===== MODERN STACKMAP CONSOLIDATED VERSION =====
        
        class StackMapApp {
            constructor() {
                // Initialize data structure
                this.data = {
                    version: 3, // Incremented for new features
                    currentUserId: null,
                    currentDay: 'today', // today, tomorrow, or date string
                    users: {},
                    globalSettings: {
                        themeColor: '#667eea',
                        displayMode: 'numbers',
                        enableDayManagement: true
                    },
                    templates: [] // User's saved activity templates
                };
                
                this.isEditMode = false;
                this.activePanel = null;
                
                // Drag state
                this.draggedActivity = null;
                this.draggedElement = null;
                
                // Initialize celebration manager
                this.celebrationManager = null;
                
                // Click rate limiting
                this.lastClickTimes = new Map(); // Track last click time per activity
                this.clickCooldown = 300; // 300ms cooldown between clicks
                
                // PWA install prompt
                this.deferredPrompt = null;
                
                // Undo functionality
                this.lastDeletedActivity = null;
                this.lastDeletedActivityDay = null;
                this.toastTimeout = null;
                
                // Activity library selection
                this.selectedActivities = new Map();
                this.currentLibraryTab = 'default';
                this.librarySearchTerm = '';
                
                // Category preferences
                this.categoryOrder = this.loadCategoryOrder();
                this.collapsedCategories = this.loadCollapsedCategories();
                
                // Load data and initialize
                this.loadData();
                
                // Check if this is first time use
                if (!this.hasCompletedSetup()) {
                    this.showSetupWizard();
                } else {
                    this.initializeElements();
                    this.setupEventListeners();
                    this.setupDragAndDrop();
                    this.loadCustomTitle();
                    this.initializeCelebrations();
                    this.initializeCapacitor();
                    this.render();
                }
            }
            
            // ===== SETUP WIZARD =====
            hasCompletedSetup() {
                // Check if we have at least one user with a non-default name
                const users = Object.values(this.data.users || {});
                return users.length > 0 && users.some(u => u.name !== 'Default User' && u.name !== 'My Tasks');
            }
            
            showSetupWizard() {
                const wizard = document.createElement('div');
                wizard.className = 'setup-wizard';
                wizard.innerHTML = `
                    <div class="setup-content">
                        <h1 class="setup-title">
                            <span class="setup-title-welcome">Welcome to</span>
                            <span class="logo-text-wrapper">
                                <svg class="setup-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                                    <circle cx="16" cy="16" r="15" fill="var(--primary-color)" stroke="var(--primary-dark)" stroke-width="1"/>
                                    <rect x="7" y="10" width="18" height="2.5" fill="white" rx="1.25"/>
                                    <rect x="7" y="14.5" width="18" height="2.5" fill="white" rx="1.25"/>
                                    <rect x="7" y="19" width="18" height="5" fill="rgba(255,255,255,0.9)" rx="2.5"/>
                                </svg>StackMap!
                            </span>
                        </h1>
                        
                        <div class="setup-progress">
                            <div class="progress-dot active"></div>
                            <div class="progress-dot"></div>
                            <div class="progress-dot"></div>
                        </div>
                        
                        <!-- Step 1: Welcome -->
                        <div class="setup-step active" data-step="1">
                            <p>Let's set up your daily routine tracker in just a minute!</p>
                            <div class="setup-buttons">
                                <button class="setup-btn setup-btn-primary" onclick="app.nextSetupStep()">
                                    Get Started
                                </button>
                            </div>
                        </div>
                        
                        <!-- Step 2: Name -->
                        <div class="setup-step" data-step="2">
                            <p>What's the user's name?</p>
                            <div class="setup-form">
                                <input type="text" id="setupUserName" placeholder="Enter user's name" 
                                       onkeypress="if(event.key === 'Enter') app.nextSetupStep()">
                            </div>
                            <p class="setup-hint">You can add more users later in Edit Mode</p>
                            <div class="setup-buttons">
                                <button class="setup-btn setup-btn-secondary" onclick="app.prevSetupStep()">
                                    Back
                                </button>
                                <button class="setup-btn setup-btn-primary" onclick="app.nextSetupStep()">
                                    Next
                                </button>
                            </div>
                        </div>
                        
                        <!-- Step 3: Emoji -->
                        <div class="setup-step" data-step="3">
                            <p>Choose an emoji for <span id="setupUserNameDisplay"></span></p>
                            <div class="emoji-grid emoji-grid-compact" id="emojiGrid">
                                ${['😊', '😎', '🤓', '😇', '🥰', '🤗',
                                   '👦', '👧', '👨', '👩', '🧑', '👶',
                                   '🐶', '🐱', '🐻', '🦊', '🐼', '🦄'].map(emoji => 
                                    `<button class="emoji-option" onclick="app.selectEmoji('${emoji}')">${emoji}</button>`
                                ).join('')}
                            </div>
                            <div class="setup-buttons">
                                <button class="setup-btn setup-btn-secondary" onclick="app.prevSetupStep()">
                                    Back
                                </button>
                                <button class="setup-btn setup-btn-primary" onclick="app.completeSetup()">
                                    Finish Setup
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(wizard);
                
                // Focus on name input when reaching step 2
                wizard.addEventListener('transitionend', () => {
                    const nameInput = document.getElementById('setupUserName');
                    if (nameInput && nameInput.closest('.setup-step.active')) {
                        nameInput.focus();
                    }
                });
                
                this.currentSetupStep = 1;
                this.setupUserName = '';
                this.setupUserEmoji = '😊';
            }
            
            selectEmoji(emoji) {
                this.setupUserEmoji = emoji;
                
                // Update emoji grid to show selection
                const buttons = document.querySelectorAll('.emoji-option');
                buttons.forEach(btn => {
                    btn.classList.toggle('selected', btn.textContent === emoji);
                });
            }
            
            nextSetupStep() {
                if (this.currentSetupStep === 2) {
                    // Store the name
                    const nameInput = document.getElementById('setupUserName');
                    const name = nameInput.value.trim();
                    if (!name) {
                        nameInput.style.borderColor = '#ff5252';
                        return;
                    }
                    this.setupUserName = name;
                }
                
                if (this.currentSetupStep < 3) {
                    this.currentSetupStep++;
                    this.updateSetupStep();
                }
            }
            
            prevSetupStep() {
                if (this.currentSetupStep > 1) {
                    this.currentSetupStep--;
                    this.updateSetupStep();
                }
            }
            
            updateSetupStep() {
                const steps = document.querySelectorAll('.setup-step');
                const dots = document.querySelectorAll('.progress-dot');
                
                steps.forEach((step, index) => {
                    step.classList.toggle('active', index + 1 === this.currentSetupStep);
                });
                
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index < this.currentSetupStep);
                });
                
                // Update name display when on emoji step
                if (this.currentSetupStep === 3 && this.setupUserName) {
                    const nameDisplay = document.getElementById('setupUserNameDisplay');
                    if (nameDisplay) {
                        nameDisplay.textContent = this.setupUserName;
                    }
                }
            }
            
            completeSetup() {
                // Create the user
                this.createUser(this.setupUserName, this.setupUserEmoji);
                
                // Set as current user
                this.data.currentUserId = Object.keys(this.data.users)[0];
                
                // Add starter activities
                const user = this.getCurrentUser();
                user.days.today.activities = [
                    {
                        id: 'activity_' + Date.now() + '_1',
                        text: 'Welcome to StackMap!',
                        emoji: '👋',
                        description: 'Tap the checkmark when done',
                        time: null,
                        completed: false,
                        pinned: false,
                        activityType: 'normal',
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'activity_' + Date.now() + '_2',
                        text: 'Try Edit Mode',
                        emoji: '✏️',
                        description: 'Use the edit button to add activities',
                        time: null,
                        completed: false,
                        pinned: false,
                        activityType: 'normal',
                        createdAt: new Date().toISOString()
                    }
                ];
                
                this.saveData();
                
                // Remove wizard
                document.querySelector('.setup-wizard').remove();
                
                // Initialize app
                this.initializeElements();
                this.setupEventListeners();
                this.setupDragAndDrop();
                this.loadCustomTitle();
                this.initializeCelebrations();
                this.initializeCapacitor();
                this.render();
                
                // Show a quick welcome message
                setTimeout(() => {
                    alert(`Welcome to StackMap! 🎉\n\nTap activities to mark them complete.\nUse the Edit button to customize your routine.`);
                }, 500);
            }
            
            // ===== USER MANAGEMENT =====
            createUser(name, icon = '👤') {
                const userId = 'user_' + Date.now();
                const newUser = {
                    id: userId,
                    name: name,
                    icon: icon,
                    days: {
                        today: { activities: [] },
                        tomorrow: { activities: [] }
                    },
                    settings: {
                        taskCelebration: 'rainbow',
                        routineCelebration: 'rainbow',
                        soundEnabled: true
                    },
                    createdAt: new Date().toISOString(),
                    lastActive: new Date().toISOString()
                };
                
                this.data.users[userId] = newUser;
                
                // If first user, make them current
                if (!this.data.currentUserId || Object.keys(this.data.users).length === 1) {
                    this.data.currentUserId = userId;
                }
                
                this.saveData();
                return userId;
            }
            
            getCurrentUser() {
                if (!this.data.currentUserId || !this.data.users[this.data.currentUserId]) {
                    // Create default user if none exists
                    const userId = this.createUser('Default User', '😊');
                    this.data.currentUserId = userId;
                }
                const user = this.data.users[this.data.currentUserId];
                
                // Ensure user has celebration settings
                if (user && !user.settings) {
                    user.settings = {
                        taskCelebration: 'rainbow',
                        routineCelebration: 'rainbow',
                        soundEnabled: true
                    };
                    this.saveData();
                }
                
                return user;
            }
            
            switchUser(userId) {
                if (this.data.users[userId]) {
                    this.data.currentUserId = userId;
                    this.data.users[userId].lastActive = new Date().toISOString();
                    this.saveData();
                    this.render();
                    return true;
                }
                return false;
            }
            
            deleteUser(userId) {
                const users = Object.values(this.data.users);
                if (users.length <= 1) {
                    this.showToast('Cannot delete the last user!');
                    return;
                }
                
                const user = this.data.users[userId];
                if (!user) return;
                
                // Store for undo
                const deletedUserName = user.name;
                
                if (userId === this.data.currentUserId) {
                    // Find another user to switch to
                    const userIds = Object.keys(this.data.users).filter(id => id !== userId);
                    this.data.currentUserId = userIds[0] || null;
                }
                
                delete this.data.users[userId];
                this.saveData();
                this.renderEditContent();
                this.render();
                
                this.showToast(`User "${deletedUserName}" deleted`);
            }
            
            // ===== DAY MANAGEMENT =====
            getCurrentDay() {
                return this.data.currentDay || 'today';
            }
            
            setCurrentDay(day) {
                this.data.currentDay = day;
                this.saveData();
                this.render();
            }
            
            navigateDay(direction) {
                const currentDay = this.getCurrentDay();
                
                if (direction === 'prev') {
                    if (currentDay === 'tomorrow') {
                        this.setCurrentDay('today');
                    }
                    // Could extend to support more days
                } else if (direction === 'next') {
                    if (currentDay === 'today') {
                        this.setCurrentDay('tomorrow');
                    }
                    // Could extend to support more days
                }
            }
            
            // ===== ACTIVITY MANAGEMENT =====
            getCurrentActivities() {
                const user = this.getCurrentUser();
                if (!user) return [];
                
                // Migration from old format
                if (user.activities && !user.days) {
                    user.days = {
                        today: { activities: user.activities },
                        tomorrow: { activities: [] }
                    };
                    delete user.activities;
                    this.saveData();
                }
                
                const day = this.getCurrentDay();
                return user.days?.[day]?.activities || [];
            }
            
            addActivity(text, emoji = '📝', time = null, activityType = 'normal', description = '') {
                const user = this.getCurrentUser();
                if (!user) return;
                
                const day = this.getCurrentDay();
                if (!user.days[day]) {
                    user.days[day] = { activities: [] };
                }
                
                const activity = {
                    id: 'activity_' + Date.now(),
                    text: text,
                    emoji: emoji,
                    time: time,
                    description: description,
                    completed: false,
                    pinned: false,
                    activityType: activityType,
                    createdAt: new Date().toISOString()
                };
                
                user.days[day].activities.push(activity);
                this.saveData();
                this.render();
                return activity.id;
            }
            
            updateActivity(activityId, updates) {
                const user = this.getCurrentUser();
                if (!user) return;
                
                const activities = this.getCurrentActivities();
                const activity = activities.find(a => a.id === activityId);
                if (activity) {
                    Object.assign(activity, updates);
                    this.saveData();
                    this.render();
                    return true;
                }
                return false;
            }
            
            deleteActivity(activityId) {
                const user = this.getCurrentUser();
                if (!user) return;
                
                const day = this.getCurrentDay();
                const activities = user.days[day]?.activities || [];
                const index = activities.findIndex(a => a.id === activityId);
                if (index > -1) {
                    // Store the deleted activity for undo
                    this.lastDeletedActivity = activities[index];
                    this.lastDeletedActivityDay = day;
                    
                    // Delete the activity
                    activities.splice(index, 1);
                    this.saveData();
                    this.render();
                    
                    // Show toast with undo option
                    this.showToast(`Activity deleted`, 'UNDO', () => {
                        this.undoDelete();
                    });
                    
                    return true;
                }
                return false;
            }
            
            toggleActivityComplete(activityId) {
                const user = this.getCurrentUser();
                if (!user) return;
                
                // Rate limiting - prevent rapid clicks
                const now = Date.now();
                const lastClick = this.lastClickTimes.get(activityId) || 0;
                if (now - lastClick < this.clickCooldown) {
                    // console.log('Click rate limited for activity:', activityId);
                    return; // Too soon, ignore this click
                }
                this.lastClickTimes.set(activityId, now);
                
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                if (activity) {
                    const wasCompleted = activity.completed;
                    activity.completed = !activity.completed;
                    this.saveData();
                    
                    // Play sound if enabled and just completed
                    if (!wasCompleted && activity.completed && user.settings.soundEnabled) {
                        this.playCompletionSound();
                    }
                    
                    // Trigger haptic feedback
                    if (!wasCompleted && activity.completed) {
                        this.triggerHaptic('medium');
                    } else {
                        this.triggerHaptic('light');
                    }
                    
                    // Trigger celebration if just completed
                    if (!wasCompleted && activity.completed) {
                        // Check if ALL activities are now completed (after this one)
                        const activities = this.getCurrentActivities();
                        const allCompleted = activities.every(a => a.completed);
                        
                        if (allCompleted) {
                            // This is the last activity - render first, then show fireworks only
                            this.render();
                            setTimeout(() => {
                                this.checkAllActivitiesCompleted();
                            }, 100);
                        } else {
                            // Not the last activity - render first, then show confetti
                            this.render();
                            setTimeout(() => {
                                const cardElement = document.querySelector(`[data-activity-id="${activityId}"]`);
                                // console.log('Looking for card with id:', activityId, 'Found:', cardElement);
                                if (cardElement && this.celebrationManager) {
                                    // console.log('Triggering task celebration for:', activity.text);
                                    this.celebrationManager.celebrateTask(cardElement, user.id);
                                } else if (!cardElement) {
                                    // console.log('Could not find card element for activity:', activityId);
                                    // Fallback: use body element
                                    if (this.celebrationManager) {
                                        this.celebrationManager.celebrateTask(document.body, user.id);
                                    }
                                }
                            }, 50);
                        }
                    } else {
                        // Just render if uncompleting
                        this.render();
                    }
                    
                    return true;
                }
                return false;
            }
            
            toggleActivityPin(activityId) {
                const user = this.getCurrentUser();
                if (!user) return;
                
                // Rate limiting - prevent rapid clicks
                const now = Date.now();
                const lastClick = this.lastClickTimes.get(`pin-${activityId}`) || 0;
                if (now - lastClick < this.clickCooldown) {
                    // console.log('Click rate limited for pin:', activityId);
                    return; // Too soon, ignore this click
                }
                this.lastClickTimes.set(`pin-${activityId}`, now);
                
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                if (activity) {
                    activity.pinned = !activity.pinned;
                    this.saveData();
                    
                    // Just update the button visual state without full re-render
                    const button = document.querySelector(`[data-activity-id="${activityId}"] .btn--keep`);
                    if (button) {
                        button.classList.toggle('pinned', activity.pinned);
                    }
                }
            }
            
            // ===== CELEBRATION & FEEDBACK =====
            triggerCelebration() {
                const user = this.getCurrentUser();
                if (!user || this.celebrationTriggered) return;
                
                const activities = this.getCurrentActivities();
                const allComplete = activities.length > 0 && activities.every(a => a.completed);
                
                if (allComplete) {
                    this.celebrationTriggered = true;
                    
                    // Reset flag after delay
                    setTimeout(() => {
                        this.celebrationTriggered = false;
                    }, 5000);
                    
                    // Trigger celebration based on user preference
                    if (user.settings.celebration === 'confetti') {
                        this.showConfetti();
                    }
                    
                    if (user.settings.soundEnabled) {
                        this.playCelebrationSound();
                    }
                }
            }
            
            showConfetti() {
                // Simple confetti effect using CSS animation
                const confettiCount = 50;
                const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F9CA24', '#F0932B', '#EB4D4B', '#6C5CE7', '#A29BFE'];
                
                for (let i = 0; i < confettiCount; i++) {
                    const confetti = document.createElement('div');
                    confetti.style.cssText = `
                        position: fixed;
                        width: 10px;
                        height: 10px;
                        background: ${colors[Math.floor(Math.random() * colors.length)]};
                        left: ${Math.random() * 100}%;
                        top: -10px;
                        border-radius: 50%;
                        z-index: 9999;
                        animation: confettiFall ${2 + Math.random() * 2}s ease-out forwards;
                    `;
                    document.body.appendChild(confetti);
                    
                    setTimeout(() => confetti.remove(), 4000);
                }
            }
            
            playCompletionSound() {
                // Simple completion sound using Web Audio API
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = 523.25; // C5
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                } catch (e) {
                    // console.log('Audio not available');
                }
            }
            
            playCelebrationSound() {
                // Celebration sound - ascending notes
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
                    
                    notes.forEach((freq, index) => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.value = freq;
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + index * 0.1);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.3);
                        
                        oscillator.start(audioContext.currentTime + index * 0.1);
                        oscillator.stop(audioContext.currentTime + index * 0.1 + 0.3);
                    });
                } catch (e) {
                    // console.log('Audio not available');
                }
            }
            
            // ===== INITIALIZATION =====
            initializeElements() {
                this.elements = {
                    // FABs
                    preferencesBtn: document.getElementById('preferencesBtn'),
                    editBtn: document.getElementById('editBtn'),
                    
                    // Panels
                    userDayPanel: document.getElementById('userDayPanel'),
                    preferencesPanel: document.getElementById('preferencesPanel'),
                    editPanel: document.getElementById('editPanel'),
                    activityLibraryPanel: document.getElementById('activityLibraryPanel'),
                    userDayClose: document.getElementById('userDayClose'),
                    preferencesClose: document.getElementById('preferencesClose'),
                    editClose: document.getElementById('editClose'),
                    activityLibraryClose: document.getElementById('activityLibraryClose'),
                    backdrop: document.getElementById('backdrop'),
                    
                    // Content areas
                    activityList: document.getElementById('activityList'),
                    userDayContent: document.getElementById('userDayContent'),
                    preferencesContent: document.getElementById('preferencesContent'),
                    editContent: document.getElementById('editContent'),
                    
                    // Subtitle
                    subtitle: document.getElementById('subtitle')
                };
            }
            
            initializeCapacitor() {
                // Only initialize if Capacitor is available
                if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
                    // Import Capacitor plugins
                    const { StatusBar } = Capacitor.Plugins;
                    const { App } = Capacitor.Plugins;
                    const { Haptics, ImpactStyle } = Capacitor.Plugins;
                    
                    // Store Haptics reference for later use
                    this.Haptics = Haptics;
                    this.ImpactStyle = ImpactStyle;
                    
                    // Set initial status bar style
                    if (StatusBar) {
                        this.StatusBar = StatusBar;
                        this.updateStatusBar();
                    }
                    
                    // Handle hardware back button
                    if (App) {
                        App.addListener('backButton', () => {
                            // If a panel is open, close it
                            if (this.activePanel) {
                                this.closePanel();
                            } else {
                                // Otherwise, let the default behavior happen
                                // (which might be to exit the app)
                            }
                        });
                    }
                }
            }
            
            updateStatusBar() {
                if (this.StatusBar && typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
                    const themeColor = this.data.globalSettings.themeColor;
                    
                    // Set background color
                    this.StatusBar.setBackgroundColor({ color: themeColor });
                    
                    // Determine if we should use light or dark content based on theme brightness
                    const rgb = this.hexToRgb(themeColor);
                    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
                    
                    if (brightness > 128) {
                        // Light background, use dark content
                        this.StatusBar.setStyle({ style: 'DARK' });
                    } else {
                        // Dark background, use light content
                        this.StatusBar.setStyle({ style: 'LIGHT' });
                    }
                }
            }
            
            hexToRgb(hex) {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : { r: 0, g: 0, b: 0 };
            }
            
            showMigrationNotification() {
                // Create a friendly notification
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 255, 255, 0.95);
                    color: #333;
                    padding: 24px 32px;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    text-align: center;
                    max-width: 90%;
                    width: 400px;
                `;
                
                notification.innerHTML = `
                    <h3 style="margin: 0 0 12px 0; color: #667eea;">Welcome to the New StackMap!</h3>
                    <p style="margin: 0 0 16px 0; line-height: 1.5;">Your data has been automatically updated to work with the new version.</p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">All your activities and settings have been preserved.</p>
                    <button onclick="this.parentElement.remove()" style="
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 10px 24px;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                    ">Got it!</button>
                `;
                
                document.body.appendChild(notification);
                
                // Auto-remove after 10 seconds
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 10000);
            }
            
            triggerHaptic(style = 'light') {
                // Try Capacitor haptics first (for native mobile apps)
                if (this.Haptics && this.ImpactStyle && typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
                    let impactStyle;
                    switch(style) {
                        case 'medium':
                            impactStyle = this.ImpactStyle.Medium;
                            break;
                        case 'heavy':
                            impactStyle = this.ImpactStyle.Heavy;
                            break;
                        default:
                            impactStyle = this.ImpactStyle.Light;
                    }
                    
                    this.Haptics.impact({ style: impactStyle }).catch(() => {
                        // Haptics not available
                    });
                } 
                // Fallback to Web Vibration API for mobile browsers
                else if ('vibrate' in navigator) {
                    const duration = style === 'heavy' ? 50 : style === 'medium' ? 30 : 10;
                    navigator.vibrate(duration);
                }
            }
            
            setupEventListeners() {
                // FAB buttons
                this.elements.preferencesBtn.addEventListener('click', () => this.openPanel('preferences'));
                this.elements.editBtn.addEventListener('click', () => this.openPanel('edit'));
                
                // Close buttons
                this.elements.userDayClose.addEventListener('click', () => this.closePanel());
                this.elements.preferencesClose.addEventListener('click', () => this.closePanel());
                this.elements.editClose.addEventListener('click', () => this.closePanel());
                this.elements.activityLibraryClose.addEventListener('click', () => this.closePanel());
                
                // Backdrop
                this.elements.backdrop.addEventListener('click', () => this.closePanel());
                
                // Subtitle click for user/day panel
                this.elements.subtitle?.addEventListener('click', () => this.openPanel('userDay'));
                
                // Keyboard support
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.activePanel) {
                        this.closePanel();
                    }
                });
                
                // PWA install prompt
                window.addEventListener('beforeinstallprompt', (e) => {
                    // Prevent Chrome 67 and earlier from automatically showing the prompt
                    e.preventDefault();
                    // Stash the event so it can be triggered later
                    this.deferredPrompt = e;
                    // Show install button if not already installed
                    this.checkAndShowInstallOption();
                });
                
                // Listen for successful install
                window.addEventListener('appinstalled', () => {
                    // Hide install prompt
                    this.deferredPrompt = null;
                });
            }
            
            // ===== DRAG & DROP FUNCTIONALITY =====
            setupDragAndDrop() {
                // We'll set up drag and drop on the activity list container
                // Event delegation will handle dynamically created cards
            }
            
            enableDragAndDrop() {
                if (!this.isEditMode) return;
                
                const cards = document.querySelectorAll('.activity-card');
                cards.forEach(card => {
                    card.draggable = true;
                    
                    card.addEventListener('dragstart', (e) => this.handleDragStart(e));
                    card.addEventListener('dragover', (e) => this.handleDragOver(e));
                    card.addEventListener('drop', (e) => this.handleDrop(e));
                    card.addEventListener('dragend', (e) => this.handleDragEnd(e));
                    card.addEventListener('dragenter', (e) => this.handleDragEnter(e));
                    card.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                });
            }
            
            handleDragStart(e) {
                const card = e.target.closest('.activity-card');
                if (!card) return;
                
                // Find the activity ID from the card
                const activityId = this.getActivityIdFromCard(card);
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                
                if (activity) {
                    this.draggedActivity = activity;
                    this.draggedElement = card;
                    card.classList.add('dragging');
                    
                    // Store drag data
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', card.innerHTML);
                }
            }
            
            handleDragOver(e) {
                if (e.preventDefault) {
                    e.preventDefault(); // Allows us to drop
                }
                e.dataTransfer.dropEffect = 'move';
                return false;
            }
            
            handleDragEnter(e) {
                const card = e.target.closest('.activity-card');
                if (card && card !== this.draggedElement) {
                    card.classList.add('drag-over');
                }
            }
            
            handleDragLeave(e) {
                const card = e.target.closest('.activity-card');
                if (card) {
                    card.classList.remove('drag-over');
                }
            }
            
            handleDrop(e) {
                if (e.stopPropagation) {
                    e.stopPropagation(); // Stops some browsers from redirecting
                }
                
                const dropCard = e.target.closest('.activity-card');
                if (!dropCard || dropCard === this.draggedElement) return false;
                
                // Make sure we have a dragged activity
                if (!this.draggedActivity) return false;
                
                // Get the dropped position
                const dropActivityId = this.getActivityIdFromCard(dropCard);
                if (!dropActivityId) return false;
                
                const activities = this.getCurrentActivities();
                const dragIndex = activities.findIndex(a => a.id === this.draggedActivity.id);
                const dropIndex = activities.findIndex(a => a.id === dropActivityId);
                
                if (dragIndex !== -1 && dropIndex !== -1) {
                    // Reorder the activities
                    this.reorderActivities(dragIndex, dropIndex);
                }
                
                return false;
            }
            
            handleDragEnd(e) {
                // Clean up
                const cards = document.querySelectorAll('.activity-card');
                cards.forEach(card => {
                    card.classList.remove('dragging', 'drag-over');
                });
                
                this.draggedActivity = null;
                this.draggedElement = null;
            }
            
            getActivityIdFromCard(card) {
                // First try to get ID from data attribute (most reliable)
                const dataId = card.getAttribute('data-activity-id');
                if (dataId) return dataId;
                
                // Fallback: Extract activity ID from onclick attribute
                const onclickAttr = card.getAttribute('onclick');
                if (onclickAttr) {
                    const match = onclickAttr.match(/['"]([^'"]*activity_[^'"]*)['"]/);
                    if (match) return match[1];
                }
                
                // Last resort: Check child elements for activity ID
                const cardHtml = card.innerHTML;
                const match = cardHtml.match(/activity_\d+/);
                return match ? match[0] : null;
            }
            
            reorderActivities(fromIndex, toIndex) {
                const user = this.getCurrentUser();
                if (!user) return;
                
                const day = this.getCurrentDay();
                const activities = user.days[day].activities;
                
                // Remove and insert at new position
                const [movedActivity] = activities.splice(fromIndex, 1);
                activities.splice(toIndex, 0, movedActivity);
                
                this.saveData();
                this.render();
            }
            
            promptReorderActivity(activityId, currentPosition, event) {
                event.stopPropagation();
                
                const activities = this.getCurrentActivities();
                const newPosition = prompt(`Move to position (1-${activities.length}):`, currentPosition);
                
                if (newPosition && !isNaN(newPosition)) {
                    const newIndex = parseInt(newPosition) - 1;
                    const currentIndex = activities.findIndex(a => a.id === activityId);
                    
                    if (newIndex >= 0 && newIndex < activities.length && currentIndex !== -1) {
                        this.reorderActivities(currentIndex, newIndex);
                    }
                }
            }
            
            // ===== PANEL MANAGEMENT =====
            openPanel(panelType) {
                // Trigger haptic feedback for panel open
                this.triggerHaptic('light');
                
                if (panelType === 'preferences') {
                    this.activePanel = 'preferences';
                    this.elements.preferencesPanel.classList.add('open');
                    this.renderPreferencesContent();
                } else if (panelType === 'edit') {
                    this.activePanel = 'edit';
                    this.elements.editPanel.classList.add('open');
                    this.renderEditContent();
                } else if (panelType === 'userDay') {
                    this.activePanel = 'userDay';
                    this.elements.userDayPanel.classList.add('open');
                    this.renderUserDayContent();
                } else if (panelType === 'activityLibrary') {
                    this.activePanel = 'activityLibrary';
                    this.elements.activityLibraryPanel.classList.add('open');
                    this.setupActivityLibrary();
                }
                
                document.body.classList.add('panel-open');
                this.elements.backdrop.classList.add('active');
            }
            
            closePanel() {
                if (this.activePanel) {
                    this.elements.preferencesPanel.classList.remove('open');
                    this.elements.editPanel.classList.remove('open');
                    this.elements.userDayPanel.classList.remove('open');
                    this.elements.activityLibraryPanel.classList.remove('open');
                    
                    // Reset library state when closing
                    if (this.activePanel === 'activityLibrary') {
                        this.clearSelection();
                        this.librarySearchTerm = '';
                        const searchInput = document.getElementById('librarySearchInput');
                        if (searchInput) searchInput.value = '';
                    }
                    
                    this.activePanel = null;
                }
                
                document.body.classList.remove('panel-open');
                this.elements.backdrop.classList.remove('active');
            }
            
            // ===== PWA INSTALLATION =====
            checkAndShowInstallOption() {
                // Check if PWA can be installed and update preferences panel if it's open
                if (this.deferredPrompt && this.activePanel === 'preferences') {
                    this.renderPreferencesContent();
                }
            }
            
            showInstallPrompt() {
                if (!this.deferredPrompt) {
                    return;
                }
                
                // Show the install prompt
                this.deferredPrompt.prompt();
                
                // Wait for the user to respond to the prompt
                this.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    
                    // Clear the deferred prompt
                    this.deferredPrompt = null;
                    
                    // Update the preferences panel if it's open
                    if (this.activePanel === 'preferences') {
                        this.renderPreferencesContent();
                    }
                });
            }
            
            // ===== CONTENT RENDERING =====
            renderPreferencesContent() {
                this.elements.preferencesContent.innerHTML = `
                    <div class="form-group">
                        <label class="form-label">Theme Color</label>
                        <div class="color-grid" id="colorGrid">
                            ${this.getColorPickerHTML()}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Display Mode</label>
                        <div class="segmented-control" id="displayModeControl">
                            ${this.getDisplayModeHTML()}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Banner Position</label>
                        <div class="segmented-control">
                            <button class="segment ${(!this.data.globalSettings.headerPosition || this.data.globalSettings.headerPosition === 'top') ? 'segment--active' : ''}"
                                    onclick="app.setHeaderPosition('top')">
                                <span>Top</span>
                            </button>
                            <button class="segment ${this.data.globalSettings.headerPosition === 'bottom' ? 'segment--active' : ''}"
                                    onclick="app.setHeaderPosition('bottom')">
                                <span>Bottom</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Celebration Settings</label>
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" id="soundEnabled" 
                                       ${this.getCurrentUser()?.settings?.soundEnabled ? 'checked' : ''}
                                       onchange="app.toggleSound(this.checked)"
                                       style="width: 20px; height: 20px;">
                                <span>Enable sounds</span>
                            </label>
                            
                            <div>
                                <label class="form-label" style="font-size: 0.9rem; margin-bottom: 0.5rem;">Task Celebration</label>
                                <select class="form-select" id="taskCelebration" onchange="app.setTaskCelebration(this.value)">
                                    ${this.getCelebrationOptionsHTML('task')}
                                </select>
                            </div>
                            
                            <div>
                                <label class="form-label" style="font-size: 0.9rem; margin-bottom: 0.5rem;">All Tasks Celebration</label>
                                <select class="form-select" id="routineCelebration" onchange="app.setRoutineCelebration(this.value)">
                                    ${this.getCelebrationOptionsHTML('routine')}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    ${this.deferredPrompt ? `
                        <div class="form-group">
                            <label class="form-label">Install App</label>
                            <button class="btn btn-primary" onclick="app.showInstallPrompt()" style="width: 100%;">
                                <span class="material-icons" style="vertical-align: middle; margin-right: 0.5rem;">download</span>
                                Install StackMap
                            </button>
                            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem; margin-bottom: 0;">
                                Install StackMap as an app for easier access and offline use.
                            </p>
                        </div>
                    ` : ''}
                `;
                this.setupColorPicker();
            }
            
            renderUserDayContent() {
                const users = Object.values(this.data.users);
                const currentUserId = this.data.currentUserId;
                const currentDay = this.getCurrentDay();
                
                this.elements.userDayContent.innerHTML = `
                    <div class="form-group">
                        <label class="form-label">Select User</label>
                        <div class="user-selector">
                            ${users.map(user => {
                                const isActive = user.id === currentUserId;
                                return `
                                    <button class="user-option ${isActive ? 'user-option--active' : ''}" 
                                            onclick="${isActive ? 'app.editCurrentUserFromSelect()' : `app.switchUser('${user.id}'); app.closePanel();`}">
                                        <span class="user-avatar">${user.icon}</span>
                                        <span class="user-details">
                                            <span class="user-name">${user.name}</span>
                                        </span>
                                        ${isActive ? `<span class="user-actions">
                                            <span class="material-icons user-edit">edit</span>
                                        </span>` : ''}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    ${this.data.globalSettings.enableDayManagement ? `
                        <div class="form-group">
                            <label class="form-label">Select Day</label>
                            <div class="segmented-control">
                                <button class="segment ${currentDay === 'today' ? 'segment--active' : ''}"
                                        onclick="app.setCurrentDay('today'); app.closePanel();">
                                    <span>Today</span>
                                </button>
                                <button class="segment ${currentDay === 'tomorrow' ? 'segment--active' : ''}"
                                        onclick="app.setCurrentDay('tomorrow'); app.closePanel();">
                                    <span>Tomorrow</span>
                                </button>
                            </div>
                        </div>
                    ` : ''}
                `;
            }
            
            toggleSound(enabled) {
                const user = this.getCurrentUser();
                if (user) {
                    user.settings.soundEnabled = enabled;
                    this.saveData();
                }
            }
            
            toggleConfetti(enabled) {
                const user = this.getCurrentUser();
                if (user) {
                    user.settings.celebration = enabled ? 'confetti' : 'none';
                    this.saveData();
                }
            }
            
            getCelebrationOptionsHTML(type) {
                if (!this.celebrationManager) return '<option value="none">None</option>';
                
                const user = this.getCurrentUser();
                const currentValue = type === 'task' ? 
                    user?.settings?.taskCelebration || 'rainbow' : 
                    user?.settings?.routineCelebration || 'rainbow';
                
                const options = this.celebrationManager.animations[type];
                return Object.entries(options).map(([key, value]) => {
                    return `<option value="${key}" ${currentValue === key ? 'selected' : ''}>${value.name}</option>`;
                }).join('');
            }
            
            setTaskCelebration(value) {
                const user = this.getCurrentUser();
                if (user) {
                    if (!user.settings) user.settings = {};
                    user.settings.taskCelebration = value;
                    this.saveData();
                }
            }
            
            setRoutineCelebration(value) {
                const user = this.getCurrentUser();
                if (user) {
                    if (!user.settings) user.settings = {};
                    user.settings.routineCelebration = value;
                    this.saveData();
                }
            }
            
            toggleDayManagement(enabled) {
                this.data.globalSettings.enableDayManagement = enabled;
                this.saveData();
                this.render();
            }
            
            setHeaderPosition(position) {
                this.data.globalSettings.headerPosition = position;
                this.saveData();
                
                // Apply the position change immediately
                const headerWrapper = document.querySelector('.header-wrapper');
                const mainContent = document.querySelector('.main-content');
                const leftFab = document.querySelector('.fab-container.left');
                const rightFab = document.querySelector('.fab-container.right');
                
                if (position === 'bottom') {
                    document.body.classList.add('banner-bottom');
                    headerWrapper.style.bottom = '0';
                    headerWrapper.style.top = 'auto';
                    if (mainContent) {
                        mainContent.style.paddingTop = '20px';
                        mainContent.style.paddingBottom = '130px'; // Header height + some padding
                    }
                    // Position FABs to align with header center when at bottom
                    if (leftFab) {
                        leftFab.style.position = 'fixed';
                        leftFab.style.top = 'auto';
                        leftFab.style.bottom = '25px'; // Center vertically in 110px header (25px + 60px fab + 25px = 110px)
                        leftFab.style.left = '20px';
                        leftFab.style.transform = 'none';
                    }
                    if (rightFab) {
                        rightFab.style.position = 'fixed';
                        rightFab.style.top = 'auto';
                        rightFab.style.bottom = '25px'; // Center vertically in 110px header
                        rightFab.style.right = '20px';
                        rightFab.style.transform = 'none';
                    }
                } else {
                    document.body.classList.remove('banner-bottom');
                    headerWrapper.style.top = '0';
                    headerWrapper.style.bottom = 'auto';
                    if (mainContent) {
                        mainContent.style.paddingTop = '130px'; // Header height + some padding
                        mainContent.style.paddingBottom = '20px';
                    }
                    // Position FABs to align with header center when at top
                    if (leftFab) {
                        leftFab.style.position = 'fixed';
                        leftFab.style.bottom = 'auto';
                        leftFab.style.top = '25px'; // Center vertically in 110px header (25px + 60px fab + 25px = 110px)
                        leftFab.style.left = '20px';
                        leftFab.style.transform = 'none';
                    }
                    if (rightFab) {
                        rightFab.style.position = 'fixed';
                        rightFab.style.bottom = 'auto';
                        rightFab.style.top = '25px'; // Center vertically in 110px header
                        rightFab.style.right = '20px';
                        rightFab.style.transform = 'none';
                    }
                }
                
                // Update segmented control UI if preferences panel is open
                const bannerGroups = document.querySelectorAll('.form-group');
                bannerGroups.forEach(group => {
                    const label = group.querySelector('.form-label');
                    if (label && label.textContent === 'Banner Position') {
                        const segments = group.querySelectorAll('.segment');
                        if (segments.length === 2) {
                            segments[0].classList.toggle('segment--active', position === 'top');
                            segments[1].classList.toggle('segment--active', position === 'bottom');
                        }
                    }
                });
            }
            
            getUserSelectorHTML() {
                const users = Object.values(this.data.users);
                const currentUserId = this.data.currentUserId;
                
                if (users.length === 0) {
                    return '<p style="color: #666; text-align: center;">No users yet</p>';
                }
                
                return users.map(user => {
                    const isActive = user.id === currentUserId;
                    return `
                        <button class="user-option ${isActive ? 'user-option--active' : ''}" 
                                onclick="app.switchUser('${user.id}')">
                            <span class="user-avatar">${user.icon}</span>
                            <span class="user-details">
                                <span class="user-name">${user.name}</span>
                            </span>
                            <span class="user-actions">
                                <span class="material-icons user-edit" onclick="event.stopPropagation(); app.editUser('${user.id}')">edit</span>
                                ${users.length > 1 ? `<span class="material-icons user-delete" onclick="event.stopPropagation(); app.confirmDeleteUser('${user.id}')">delete</span>` : ''}
                            </span>
                        </button>
                    `;
                }).join('');
            }
            
            getSimpleUserSelectorHTML() {
                const users = Object.values(this.data.users);
                const currentUserId = this.data.currentUserId;
                
                if (users.length === 0) {
                    return '<p style="color: #666; text-align: center;">No users yet</p>';
                }
                
                return users.map(user => {
                    const isActive = user.id === currentUserId;
                    return `
                        <button class="user-option ${isActive ? 'user-option--active' : ''}" 
                                onclick="${isActive ? 'app.editCurrentUser()' : `app.switchUser('${user.id}')`}">
                            <span class="user-avatar">${user.icon}</span>
                            <span class="user-details">
                                <span class="user-name">${user.name}</span>
                            </span>
                            ${isActive ? `<span class="user-actions">
                                <span class="material-icons user-edit">edit</span>
                            </span>` : ''}
                        </button>
                    `;
                }).join('');
            }
            
            setupUserManagement() {
                // No longer needed - handled inline
            }
            
            editCurrentUser() {
                const user = this.getCurrentUser();
                if (!user) return;
                
                const newName = prompt('Edit your name:', user.name);
                if (newName && newName.trim()) {
                    const newEmoji = prompt('Edit your emoji:', user.icon) || user.icon;
                    
                    user.name = newName.trim();
                    user.icon = newEmoji;
                    user.lastActive = new Date().toISOString();
                    
                    this.saveData();
                    this.renderPreferencesContent();
                    this.render(); // Update subtitle
                }
            }
            
            editCurrentUserFromSelect() {
                const user = this.getCurrentUser();
                if (!user) return;
                
                const newName = prompt('Edit your name:', user.name);
                if (newName && newName.trim()) {
                    const newEmoji = prompt('Edit your emoji:', user.icon) || user.icon;
                    
                    user.name = newName.trim();
                    user.icon = newEmoji;
                    user.lastActive = new Date().toISOString();
                    
                    this.saveData();
                    this.renderUserDayContent(); // Update the select panel
                    this.render(); // Update subtitle
                }
            }
            
            confirmDeleteUser(userId) {
                // No longer using confirmation - deleteUser handles it
                this.deleteUser(userId);
            }
            
            editUser(userId) {
                const user = this.data.users[userId];
                if (!user) return;
                
                const newName = prompt('Edit user name:', user.name);
                if (newName && newName.trim()) {
                    const newEmoji = prompt('Edit user emoji:', user.icon) || user.icon;
                    
                    user.name = newName.trim();
                    user.icon = newEmoji;
                    user.lastActive = new Date().toISOString();
                    
                    this.saveData();
                    this.renderEditContent();
                    this.render(); // Update subtitle if this is current user
                }
            }
            
            renderUserList() {
                const users = Object.values(this.data.users);
                return users.map(user => {
                    const isCurrentUser = user.id === this.data.currentUserId;
                    return `
                        <div class="user-item ${isCurrentUser ? 'current' : ''}">
                            <div class="user-info">
                                <span class="user-emoji">${user.icon}</span>
                                <span class="user-name">${user.name}</span>
                            </div>
                            <div class="user-actions">
                                <button class="btn-icon" onclick="app.editUser('${user.id}')" title="Edit user">
                                    <span class="material-icons">edit</span>
                                </button>
                                ${users.length > 1 ? `<button class="btn-icon" onclick="app.deleteUser('${user.id}')" title="Delete user">
                                    <span class="material-icons">delete</span>
                                </button>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            editUserName(userId) {
                const user = this.data.users[userId];
                if (!user) return;
                
                const newName = prompt('Enter new name:', user.name);
                if (newName && newName.trim() && newName !== user.name) {
                    user.name = newName.trim();
                    this.saveData();
                    this.renderEditContent();
                    this.render();
                }
            }
            
            editUserEmoji(userId) {
                const user = this.data.users[userId];
                if (!user) return;
                
                const newIcon = prompt('Enter new emoji:', user.icon);
                if (newIcon && newIcon !== user.icon) {
                    user.icon = newIcon;
                    this.saveData();
                    this.renderEditContent();
                    this.render();
                }
            }
            
            editMainTitle() {
                const titleElement = document.getElementById('mainTitle');
                const originalText = titleElement.textContent;
                const logoElement = document.querySelector('.stackmap-logo');
                
                // Create inline input
                const container = document.createElement('div');
                container.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 10px;
                `;
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = originalText;
                input.style.cssText = `
                    font-size: 2rem;
                    font-family: inherit;
                    font-weight: 900;
                    color: white;
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.5);
                    border-radius: 8px;
                    padding: 4px 12px;
                    width: 200px;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                `;
                
                container.appendChild(input);
                
                // Replace title with input
                titleElement.style.display = 'none';
                titleElement.parentNode.insertBefore(container, titleElement);
                input.focus();
                input.select();
                
                // Handle save
                const saveTitle = () => {
                    const newTitle = input.value.trim() || originalText;
                    titleElement.textContent = newTitle;
                    titleElement.style.display = '';
                    container.remove();
                    
                    // Show/hide logo based on title
                    if (logoElement) {
                        logoElement.style.display = (newTitle === 'StackMap') ? '' : 'none';
                    }
                    
                    // Save to localStorage
                    if (newTitle !== 'StackMap') {
                        localStorage.setItem('stackmap_custom_title', newTitle);
                    } else {
                        localStorage.removeItem('stackmap_custom_title');
                    }
                };
                
                // Event handlers
                input.addEventListener('blur', saveTitle);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveTitle();
                    } else if (e.key === 'Escape') {
                        titleElement.style.display = '';
                        container.remove();
                    }
                });
            }
            
            getColorPickerHTML() {
                const currentColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
                
                // Rainbow-organized color palette (4 rows x 4 columns = 16 colors)
                const colors = [
                    // Row 1: Reds to Oranges
                    '#DC143C', '#E91E63', '#FF5722', '#F57C00',
                    // Row 2: Yellows to Greens  
                    '#F9A825', '#689F38', '#388E3C', '#00796B',
                    // Row 3: Blues to Purples
                    '#0277BD', '#1976D2', '#303F9F', '#512DA8',
                    // Row 4: Deep colors + custom
                    '#7B1FA2', '#C2185B', '#1A237E', '#000000'
                ];
                
                return colors.map(color => {
                    if (color === '#000000') {
                        // Custom color picker
                        return `
                            <button class="color-option color-option--custom"
                                    style="background: ${color};"
                                    onclick="app.openCustomColorPicker()"
                                    aria-label="Custom color picker">
                                <span class="material-icons" style="color: white; font-size: 18px;">palette</span>
                            </button>
                        `;
                    } else {
                        const isSelected = color === currentColor;
                        return `
                            <button class="color-option ${isSelected ? 'color-option--selected' : ''}"
                                    style="background: ${color};"
                                    onclick="app.selectColor('${color}')"
                                    aria-label="Select ${color} theme">
                                ${isSelected ? '<span class="color-checkmark">✓</span>' : ''}
                            </button>
                        `;
                    }
                }).join('');
            }
            
            setupColorPicker() {
                // Color picker is set up via onclick handlers in HTML
            }
            
            getDisplayModeHTML() {
                const currentMode = this.data.globalSettings.displayMode || 'numbers';
                
                return `
                    <button class="segment ${currentMode === 'none' ? 'segment--active' : ''}"
                            onclick="app.selectDisplayMode('none')">
                        <span class="material-icons">visibility_off</span>
                        <span>None</span>
                    </button>
                    <button class="segment ${currentMode === 'numbers' ? 'segment--active' : ''}"
                            onclick="app.selectDisplayMode('numbers')">
                        <span class="material-icons">format_list_numbered</span>
                        <span>Numbers</span>
                    </button>
                    <button class="segment ${currentMode === 'time' ? 'segment--active' : ''}"
                            onclick="app.selectDisplayMode('time')">
                        <span class="material-icons">schedule</span>
                        <span>Time</span>
                    </button>
                `;
            }
            
            selectDisplayMode(mode) {
                // Save preference
                this.data.globalSettings.displayMode = mode;
                this.saveData();
                
                // Update body class for CSS styling
                document.body.classList.remove('display-mode-none', 'display-mode-numbers', 'display-mode-time');
                document.body.classList.add(`display-mode-${mode}`);
                
                // Update segmented control UI
                const segments = document.querySelectorAll('#displayModeControl .segment');
                segments.forEach(segment => {
                    const isActive = segment.textContent.toLowerCase().includes(mode === 'none' ? 'none' : mode);
                    segment.classList.toggle('segment--active', isActive);
                });
                
                // Re-render activities to update badges
                this.render();
            }
            
            renderEditContent() {
                if (!this.isEditMode) {
                    // Show question validation
                    this.elements.editContent.innerHTML = this.getValidationHTML();
                    this.setupValidation();
                } else {
                    // Show edit controls
                    document.body.classList.add('edit-mode');
                    this.elements.editContent.innerHTML = this.getEditControlsHTML();
                    this.setupEditControls();
                }
            }
            
            getValidationHTML() {
                return `
                    <div class="form-group">
                        <label class="form-label">What color is the sky?</label>
                        <input type="text" class="form-input" id="validationInput" 
                               placeholder="Type your answer" autocomplete="off">
                        <div class="validation-error hidden" id="validationError">
                            Incorrect answer. Please try again.
                        </div>
                    </div>
                    <button class="btn btn-primary" id="validationSubmit" style="width: 100%;">
                        <span class="material-icons">check</span> Submit
                    </button>
                    
                    <!-- Info Links Available Without Verification -->
                    <div class="info-links" style="margin-top: 30px;">
                        <button class="btn-link" onclick="app.showPrivacyPolicy()">
                            <span class="material-icons">privacy_tip</span>
                            <span>Privacy Policy</span>
                        </button>
                        <button class="btn-link" onclick="app.showSupportUs()">
                            <span class="material-icons">favorite</span>
                            <span>Support Us</span>
                        </button>
                    </div>
                `;
            }
            
            getEditControlsHTML() {
                return `
                    <!-- Primary Actions - Large Buttons -->
                    <div class="edit-actions-primary">
                        <button class="btn-large btn-primary-action" id="addActivityBtn">
                            <span class="material-icons">add_circle</span>
                            <span>Add Activity</span>
                        </button>
                        <button class="btn-large btn-primary-action" id="activityLibraryBtn">
                            <span class="material-icons">apps</span>
                            <span>Activity Library</span>
                        </button>
                        <button class="btn-wide btn-primary-action" id="completeDayBtn">
                            <span class="material-icons">done_all</span>
                            <span>Complete Day</span>
                        </button>
                    </div>
                    
                    <!-- Quick Actions Grid -->
                    <div class="edit-actions-grid">
                        <button class="btn-grid-item" id="shareBtn">
                            <span class="material-icons">share</span>
                            <span>Share</span>
                        </button>
                        <button class="btn-grid-item" id="importDataBtn">
                            <span class="material-icons">upload_file</span>
                            <span>Import</span>
                        </button>
                    </div>
                    
                    <!-- User Management -->
                    <div class="user-management-section">
                        <label class="day-toggle-label">Users</label>
                        <div class="user-list" id="userList">
                            ${this.renderUserList()}
                        </div>
                        <button class="btn-add-user" id="addUserBtn">
                            <span class="material-icons">person_add</span>
                            <span>Add New User</span>
                        </button>
                    </div>
                    
                    <!-- Day Toggle -->
                    <div class="day-toggle-section">
                        <label class="day-toggle-label">Day Management</label>
                        <div class="day-toggle">
                            <button class="day-option ${!this.data.globalSettings.enableDayManagement ? 'active' : ''}" 
                                    onclick="app.toggleDayManagement(false); app.renderEditContent();">
                                <span>Today Only</span>
                            </button>
                            <button class="day-option ${this.data.globalSettings.enableDayManagement ? 'active' : ''}" 
                                    onclick="app.toggleDayManagement(true); app.renderEditContent();">
                                <span>Today + Tomorrow</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Info Links -->
                    <div class="info-links">
                        <button class="btn-link" onclick="app.showPrivacyPolicy()">
                            <span class="material-icons">privacy_tip</span>
                            <span>Privacy Policy</span>
                        </button>
                        <button class="btn-link" onclick="app.showSupportUs()">
                            <span class="material-icons">favorite</span>
                            <span>Support Us</span>
                        </button>
                    </div>
                `;
            }
            
            setupValidation() {
                const input = document.getElementById('validationInput');
                const submit = document.getElementById('validationSubmit');
                const error = document.getElementById('validationError');
                
                const checkAnswer = () => {
                    const answer = input.value.toLowerCase().trim();
                    
                    // Accept various forms of "blue" - case insensitive
                    const validAnswers = [
                        'blue', 'b', 'blue sky', 'sky blue', 'light blue', 'azure'
                    ];
                    
                    // Check if answer matches any valid answer (case insensitive)
                    const isCorrect = validAnswers.includes(answer);
                    
                    if (isCorrect) {
                        this.enterEditMode();
                        error.classList.add('hidden');
                    } else {
                        error.classList.remove('hidden');
                        input.value = '';
                        input.focus();
                    }
                };
                
                submit.addEventListener('click', checkAnswer);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        checkAnswer();
                    }
                });
                
                // Focus input
                setTimeout(() => input.focus(), 100);
            }
            
            setupEditControls() {
                const exitBtn = document.getElementById('exitEditMode');
                const addBtn = document.getElementById('addActivityBtn');
                const completeBtn = document.getElementById('completeDayBtn');
                
                exitBtn?.addEventListener('click', () => {
                    this.exitEditMode();
                });
                
                addBtn?.addEventListener('click', () => {
                    this.showAddActivityDialog();
                });
                
                const libraryBtn = document.getElementById('activityLibraryBtn');
                libraryBtn?.addEventListener('click', () => {
                    this.openPanel('activityLibrary');
                });
                
                completeBtn?.addEventListener('click', () => {
                    this.completeDay();
                });
                
                const addUserBtn = document.getElementById('addUserBtn');
                addUserBtn?.addEventListener('click', () => {
                    const name = prompt('User name:');
                    const icon = prompt('User emoji:') || '👤';
                    
                    if (name) {
                        this.createUser(name, icon);
                        this.renderEditContent();
                        this.render();
                        this.showToast(`User "${name}" created!`);
                    }
                });
                
                // No longer needed - user list is always visible
                
                // Setup data management buttons
                const shareBtn = document.getElementById('shareBtn');
                shareBtn?.addEventListener('click', () => {
                    this.shareData();
                });
                
                const importBtn = document.getElementById('importDataBtn');
                importBtn?.addEventListener('click', () => {
                    this.importData();
                });
            }
            
            shareData() {
                const dataStr = JSON.stringify(this.data, null, 2);
                const timestamp = new Date().toISOString().split('T')[0];
                const filename = `stackmap-backup-${timestamp}.json`;
                
                // Check if Web Share API is available (mobile browsers)
                if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    // Create a blob and file for sharing
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const file = new File([blob], filename, { type: 'application/json' });
                    
                    navigator.share({
                        title: 'StackMap Backup',
                        text: `StackMap backup from ${timestamp}`,
                        files: [file]
                    }).catch(err => {
                        // Fallback to download if share fails
                        // console.log('Share failed, falling back to download:', err);
                        this.downloadBackup(dataStr, filename);
                    });
                } else {
                    // Desktop or browsers without share API - download file
                    this.downloadBackup(dataStr, filename);
                }
            }
            
            downloadBackup(dataStr, filename) {
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                alert(`Backup saved as ${filename}`);
            }
            
            enterEditMode() {
                this.isEditMode = true;
                document.body.classList.add('edit-mode');
                
                // Show header exit button
                const headerExitBtn = document.getElementById('headerExitEditMode');
                if (headerExitBtn) {
                    headerExitBtn.style.display = 'flex';
                    headerExitBtn.addEventListener('click', () => this.exitEditMode());
                }
                
                this.renderEditContent();
                this.render(); // Re-render cards to show edit buttons
                this.enableDragAndDrop(); // Enable drag and drop
            }
            
            exitEditMode() {
                this.isEditMode = false;
                document.body.classList.remove('edit-mode');
                
                // Hide header exit button
                const headerExitBtn = document.getElementById('headerExitEditMode');
                if (headerExitBtn) {
                    headerExitBtn.style.display = 'none';
                }
                
                this.render(); // Re-render cards to hide edit buttons
                this.closePanel();
            }
            
            // ===== DAY MANAGEMENT ACTIONS =====
            completeDay() {
                const user = this.getCurrentUser();
                if (!user) return;
                
                // Rate limiting - prevent rapid clicks
                const now = Date.now();
                const lastClick = this.lastClickTimes.get('complete-day') || 0;
                if (now - lastClick < 1000) { // 1 second cooldown for Complete Day
                    // console.log('Click rate limited for Complete Day');
                    return; // Too soon, ignore this click
                }
                this.lastClickTimes.set('complete-day', now);
                
                const todayActivities = user.days?.today?.activities || [];
                const pinnedActivities = todayActivities.filter(a => a.pinned);
                
                if (confirm(`Complete the day? This will:\n- Keep ${pinnedActivities.length} pinned activities\n- Remove ${todayActivities.length - pinnedActivities.length} unpinned activities`)) {
                    // Move tomorrow to today
                    user.days.today = user.days.tomorrow || { activities: [] };
                    
                    // Add pinned activities to the new today
                    pinnedActivities.forEach(activity => {
                        const newActivity = { ...activity, completed: false };
                        user.days.today.activities.push(newActivity);
                    });
                    
                    // Clear tomorrow
                    user.days.tomorrow = { activities: [] };
                    
                    // Reset to today view
                    this.setCurrentDay('today');
                    
                    alert('Day completed! Pinned activities kept for today.');
                    this.closePanel();
                }
            }
            
            // ===== RENDERING HELPERS =====
            renderCardButtons(activity) {
                const checkboxChecked = activity.completed ? 'checked' : '';
                const keepPinned = activity.pinned ? 'pinned' : '';
                
                return `
                    <button class="btn--round btn--checkbox ${checkboxChecked}" 
                            onclick="app.toggleActivityComplete('${activity.id}')" 
                            title="${activity.completed ? 'Mark incomplete' : 'Mark complete'}">
                        ✓
                    </button>
                    <button class="btn--round btn--keep ${keepPinned}" 
                            onclick="app.toggleActivityPin('${activity.id}')" 
                            title="${activity.pinned ? 'Card will be kept' : 'Card will be discarded'}">
                        <span class="material-icons">push_pin</span>
                    </button>
                    <button class="btn--round btn--delete" 
                            onclick="app.deleteActivity('${activity.id}')" 
                            title="Delete activity">
                        <span class="material-icons">delete</span>
                    </button>
                    <button class="btn--round btn--menu" 
                            onclick="app.openCardMenu(event, '${activity.id}')" 
                            title="More actions">
                        <span class="material-icons">more_vert</span>
                    </button>
                `;
            }
            
            // ===== UI HELPERS =====
            showAddActivityDialog() {
                // Create a temporary activity card for inline editing
                const tempId = 'temp_' + Date.now();
                const tempActivity = {
                    id: tempId,
                    text: 'New Activity',
                    emoji: '📝',
                    description: '',
                    time: null
                };
                
                // Add a temporary card to the list
                const list = this.elements.activityList;
                const tempCard = document.createElement('div');
                tempCard.className = 'activity-card activity-card--editing';
                tempCard.innerHTML = `
                    <div class="activity-emoji" style="cursor: pointer;">📝</div>
                    <input type="text" class="activity-title-input" value="New Activity" 
                           style="width: 100%; font-size: inherit; font-family: inherit; font-weight: inherit; 
                                  text-align: center; border: 2px solid var(--primary-color); 
                                  border-radius: 8px; padding: 4px 8px; background: white; color: #333;">
                    <textarea class="activity-description-input" placeholder="Add description..." 
                              style="width: 100%; font-size: 0.9rem; font-family: inherit; text-align: center; 
                                     border: 2px solid var(--primary-color); border-radius: 8px; padding: 4px 8px; 
                                     background: white; color: #666; resize: vertical; min-height: 50px; margin-top: 8px;"></textarea>
                    <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center;">
                        <button class="btn btn-primary" style="padding: 8px 16px;">Save</button>
                        <button class="btn btn-secondary" style="padding: 8px 16px;">Cancel</button>
                    </div>
                `;
                
                // Insert at the beginning of the list
                if (list.firstChild) {
                    list.insertBefore(tempCard, list.firstChild);
                } else {
                    list.appendChild(tempCard);
                }
                
                // Focus the title input
                const titleInput = tempCard.querySelector('.activity-title-input');
                const descInput = tempCard.querySelector('.activity-description-input');
                const emojiDiv = tempCard.querySelector('.activity-emoji');
                const saveBtn = tempCard.querySelector('.btn-primary');
                const cancelBtn = tempCard.querySelector('.btn-secondary');
                
                titleInput.focus();
                titleInput.select();
                
                // Emoji click handler
                emojiDiv.addEventListener('click', () => {
                    const newEmoji = prompt('Enter emoji:', emojiDiv.textContent);
                    if (newEmoji) {
                        emojiDiv.textContent = newEmoji;
                    }
                });
                
                // Save handler
                const save = () => {
                    const title = titleInput.value.trim();
                    if (title) {
                        this.addActivity(
                            title,
                            emojiDiv.textContent,
                            null,
                            'normal',
                            descInput.value.trim()
                        );
                    }
                    tempCard.remove();
                };
                
                // Cancel handler
                const cancel = () => {
                    tempCard.remove();
                };
                
                saveBtn.addEventListener('click', save);
                cancelBtn.addEventListener('click', cancel);
                
                // Keyboard shortcuts
                titleInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        descInput.focus();
                    } else if (e.key === 'Escape') {
                        cancel();
                    }
                });
                
                descInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        save();
                    } else if (e.key === 'Escape') {
                        cancel();
                    }
                });
            }
            
            // ===== EDIT MODE ACTIONS =====
            editActivity(activityId) {
                const user = this.getCurrentUser();
                if (!user) return;
                
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                if (!activity) return;
                
                const newText = prompt('Activity title:', activity.text);
                if (newText !== null && newText.trim()) {
                    const newEmoji = prompt('Activity emoji:', activity.emoji) || activity.emoji;
                    const newDescription = prompt('Activity description:', activity.description || '') || '';
                    const newTime = prompt('Activity time (e.g. 9:00 AM):', activity.time || '') || null;
                    
                    this.updateActivity(activityId, {
                        text: newText.trim(),
                        emoji: newEmoji,
                        description: newDescription,
                        time: newTime
                    });
                }
            }
            
            editActivityTitle(activityId) {
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                if (!activity) return;
                
                // Find the title element
                const cards = document.querySelectorAll('.activity-card');
                let titleElement = null;
                
                cards.forEach(card => {
                    if (card.innerHTML.includes(activityId)) {
                        titleElement = card.querySelector('.activity-title');
                    }
                });
                
                if (!titleElement) return;
                
                // Create inline input
                const input = document.createElement('input');
                input.type = 'text';
                input.value = activity.text;
                input.className = 'activity-title-input';
                input.style.cssText = `
                    width: 100%;
                    font-size: inherit;
                    font-family: inherit;
                    font-weight: inherit;
                    text-align: center;
                    border: 2px solid var(--primary-color);
                    border-radius: 8px;
                    padding: 4px 8px;
                    background: white;
                    color: #333;
                `;
                
                // Replace title with input
                titleElement.style.display = 'none';
                titleElement.parentNode.insertBefore(input, titleElement.nextSibling);
                input.focus();
                input.select();
                
                // Handle save
                const saveTitle = () => {
                    const newText = input.value.trim();
                    if (newText && newText !== activity.text) {
                        this.updateActivity(activityId, { text: newText });
                    } else {
                        // Restore original if empty or unchanged
                        titleElement.style.display = '';
                        input.remove();
                    }
                };
                
                // Event handlers
                input.addEventListener('blur', saveTitle);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveTitle();
                    } else if (e.key === 'Escape') {
                        titleElement.style.display = '';
                        input.remove();
                    }
                });
            }
            
            editActivityEmoji(activityId) {
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                if (!activity) return;
                
                // For now, use a simple prompt (can be replaced with emoji picker later)
                const newEmoji = prompt('Enter emoji:', activity.emoji);
                if (newEmoji && newEmoji !== activity.emoji) {
                    this.updateActivity(activityId, { emoji: newEmoji });
                }
            }
            
            editActivityTime(activityId, event) {
                if (event) {
                    event.stopPropagation();
                }
                
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                if (!activity) return;
                
                const newTime = prompt('Enter time (e.g., 9:00 AM, 2:30 PM):', activity.time || '');
                if (newTime !== null) {
                    // If empty string is entered, clear the time
                    this.updateActivity(activityId, { time: newTime.trim() || null });
                }
            }
            
            editActivityDescription(activityId) {
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                if (!activity) return;
                
                // Find the description element
                const cards = document.querySelectorAll('.activity-card');
                let descElement = null;
                
                cards.forEach(card => {
                    if (card.innerHTML.includes(activityId)) {
                        descElement = card.querySelector('.activity-description');
                    }
                });
                
                if (!descElement) return;
                
                // Create inline textarea
                const textarea = document.createElement('textarea');
                textarea.value = activity.description || '';
                textarea.className = 'activity-description-input';
                textarea.style.cssText = `
                    width: 100%;
                    font-size: inherit;
                    font-family: inherit;
                    text-align: center;
                    border: 2px solid var(--primary-color);
                    border-radius: 8px;
                    padding: 4px 8px;
                    background: white;
                    color: #666;
                    resize: vertical;
                    min-height: 50px;
                `;
                
                // Replace description with textarea
                descElement.style.display = 'none';
                descElement.parentNode.insertBefore(textarea, descElement.nextSibling);
                textarea.focus();
                textarea.select();
                
                // Auto-resize textarea
                const autoResize = () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                };
                autoResize();
                textarea.addEventListener('input', autoResize);
                
                // Handle save
                const saveDescription = () => {
                    const newDescription = textarea.value.trim();
                    this.updateActivity(activityId, { description: newDescription });
                };
                
                // Event handlers
                textarea.addEventListener('blur', saveDescription);
                textarea.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        saveDescription();
                    } else if (e.key === 'Escape') {
                        descElement.style.display = '';
                        textarea.remove();
                    }
                });
            }
            
            confirmDeleteActivity(activityId) {
                // No longer using confirmation - delete directly with undo option
                this.deleteActivity(activityId);
            }
            
            duplicateActivity(activityId) {
                const user = this.getCurrentUser();
                if (!user) return;
                
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                if (!activity) return;
                
                const newActivity = {
                    ...activity,
                    id: 'activity_' + Date.now(),
                    text: activity.text + ' (copy)',
                    completed: false,
                    pinned: false,
                    createdAt: new Date().toISOString()
                };
                
                const day = this.getCurrentDay();
                user.days[day].activities.push(newActivity);
                this.saveData();
                this.render();
            }
            
            // ===== TOAST NOTIFICATIONS =====
            showToast(message, actionText, actionCallback) {
                // Clear any existing toast timeout
                if (this.toastTimeout) {
                    clearTimeout(this.toastTimeout);
                }
                
                const container = document.getElementById('toastContainer');
                
                // Remove any existing toasts
                container.innerHTML = '';
                
                // Create new toast element
                const toast = document.createElement('div');
                toast.className = 'toast';
                toast.innerHTML = `
                    <span class="toast-message">${message}</span>
                    ${actionText ? `<button class="toast-action">${actionText}</button>` : ''}
                `;
                
                // Add action handler if provided
                if (actionText && actionCallback) {
                    const actionBtn = toast.querySelector('.toast-action');
                    actionBtn.addEventListener('click', () => {
                        actionCallback();
                        this.hideToast();
                    });
                }
                
                container.appendChild(toast);
                
                // Auto-dismiss after 3 seconds
                this.toastTimeout = setTimeout(() => {
                    this.hideToast();
                }, 3000);
            }
            
            hideToast() {
                const container = document.getElementById('toastContainer');
                const toast = container.querySelector('.toast');
                if (toast) {
                    toast.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        container.innerHTML = '';
                    }, 300);
                }
                if (this.toastTimeout) {
                    clearTimeout(this.toastTimeout);
                    this.toastTimeout = null;
                }
            }
            
            undoDelete() {
                if (!this.lastDeletedActivity || !this.lastDeletedActivityDay) return;
                
                const user = this.getCurrentUser();
                if (!user) return;
                
                // Re-add the activity to the appropriate day
                const activities = user.days[this.lastDeletedActivityDay].activities;
                activities.push(this.lastDeletedActivity);
                
                // Clear the stored deleted activity
                this.lastDeletedActivity = null;
                this.lastDeletedActivityDay = null;
                
                // Save and render
                this.saveData();
                this.render();
                
                // Show confirmation
                this.showToast('Activity restored', null, null);
            }
            
            // ===== CARD MENU =====
            openCardMenu(event, activityId) {
                event.stopPropagation();
                
                const menu = document.getElementById('cardMenu');
                const button = event.currentTarget;
                const buttonRect = button.getBoundingClientRect();
                
                // Store the current activity ID for menu actions
                this.currentMenuActivityId = activityId;
                
                // Position menu near the button
                menu.style.left = `${buttonRect.left - 100}px`; // Offset to left
                menu.style.top = `${buttonRect.bottom + 5}px`;
                
                // Ensure menu doesn't go off screen
                const menuRect = menu.getBoundingClientRect();
                if (menuRect.right > window.innerWidth) {
                    menu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
                }
                if (menuRect.bottom > window.innerHeight) {
                    menu.style.top = `${buttonRect.top - menuRect.height - 5}px`;
                }
                
                // Show menu
                menu.classList.add('active');
                
                // Close menu when clicking outside
                const closeMenu = (e) => {
                    if (!menu.contains(e.target)) {
                        menu.classList.remove('active');
                        document.removeEventListener('click', closeMenu);
                    }
                };
                
                setTimeout(() => document.addEventListener('click', closeMenu), 0);
            }
            
            editActivityFromMenu() {
                const menu = document.getElementById('cardMenu');
                menu.classList.remove('active');
                
                if (this.currentMenuActivityId) {
                    this.editActivity(this.currentMenuActivityId);
                }
            }
            
            duplicateActivityFromMenu() {
                const menu = document.getElementById('cardMenu');
                menu.classList.remove('active');
                
                if (this.currentMenuActivityId) {
                    this.duplicateActivity(this.currentMenuActivityId);
                }
            }
            
            deleteActivityFromMenu() {
                const menu = document.getElementById('cardMenu');
                menu.classList.remove('active');
                
                if (this.currentMenuActivityId) {
                    this.confirmDeleteActivity(this.currentMenuActivityId);
                }
            }
            
            saveAsTemplateFromMenu() {
                const menu = document.getElementById('cardMenu');
                menu.classList.remove('active');
                
                if (this.currentMenuActivityId) {
                    this.saveActivityAsTemplate(this.currentMenuActivityId);
                }
            }
            
            // ===== ACTIVITY LIBRARY =====
            getDefaultActivities() {
                return {
                    'Morning Routine': [
                        { emoji: '🌞', text: 'Wake Up', description: 'Time to start the day!' },
                        { emoji: '🦷', text: 'Brush Teeth', description: 'Clean those pearly whites' },
                        { emoji: '🚿', text: 'Take Shower', description: 'Get fresh and clean' },
                        { emoji: '👕', text: 'Get Dressed', description: 'Pick out clothes and get dressed' },
                        { emoji: '🥣', text: 'Eat Breakfast', description: 'Fuel up for the day' }
                    ],
                    'School': [
                        { emoji: '🎒', text: 'Pack Backpack', description: 'Get all school supplies ready' },
                        { emoji: '📚', text: 'Do Homework', description: 'Complete assignments' },
                        { emoji: '📖', text: 'Read for 20 mins', description: 'Daily reading time' },
                        { emoji: '✏️', text: 'Study', description: 'Review class materials' }
                    ],
                    'Chores': [
                        { emoji: '🧹', text: 'Clean Room', description: 'Tidy up your space' },
                        { emoji: '🗑️', text: 'Take Out Trash', description: 'Empty all trash bins' },
                        { emoji: '🧺', text: 'Do Laundry', description: 'Wash, dry, and fold clothes' },
                        { emoji: '🍽️', text: 'Set Table', description: 'Prepare table for meal' },
                        { emoji: '🧽', text: 'Wash Dishes', description: 'Clean up after meals' }
                    ],
                    'Self Care': [
                        { emoji: '💊', text: 'Take Medicine', description: 'Remember your medications' },
                        { emoji: '💧', text: 'Drink Water', description: 'Stay hydrated' },
                        { emoji: '🧘', text: 'Deep Breathing', description: '5 minutes of calm breathing' },
                        { emoji: '🚶', text: 'Take a Walk', description: 'Get some fresh air' },
                        { emoji: '😴', text: 'Rest Time', description: 'Take a break and relax' }
                    ],
                    'Evening': [
                        { emoji: '🛁', text: 'Bath Time', description: 'Relax in the tub' },
                        { emoji: '🦷', text: 'Brush Teeth', description: 'Evening teeth cleaning' },
                        { emoji: '📖', text: 'Bedtime Story', description: 'Read or listen to a story' },
                        { emoji: '🌙', text: 'Get Ready for Bed', description: 'Put on pajamas' },
                        { emoji: '😴', text: 'Lights Out', description: 'Time to sleep' }
                    ],
                    'Therapy & Support': [
                        { emoji: '🏃', text: 'Physical Therapy (PT)', description: 'Exercises and movement therapy' },
                        { emoji: '✋', text: 'Occupational Therapy (OT)', description: 'Fine motor and daily living skills' },
                        { emoji: '🗣️', text: 'Speech Therapy', description: 'Communication and language practice' },
                        { emoji: '🧘', text: 'Sensory Break', description: 'Time to regulate sensory needs' },
                        { emoji: '🎨', text: 'Art Therapy', description: 'Creative expression time' },
                        { emoji: '🎵', text: 'Music Therapy', description: 'Musical activities and listening' },
                        { emoji: '🐴', text: 'Equine Therapy', description: 'Horse therapy session' },
                        { emoji: '💆', text: 'Deep Pressure', description: 'Calming pressure input' },
                        { emoji: '🏃‍♀️', text: 'Movement Break', description: 'Get the wiggles out' },
                        { emoji: '🧩', text: 'Social Skills Practice', description: 'Practice social interactions' }
                    ],
                    'Sensory Activities': [
                        { emoji: '🎧', text: 'Quiet Time', description: 'Noise-cancelling headphones time' },
                        { emoji: '🕶️', text: 'Dim Lights', description: 'Reduce visual stimulation' },
                        { emoji: '🧸', text: 'Weighted Blanket', description: 'Calming pressure input' },
                        { emoji: '🏀', text: 'Therapy Ball', description: 'Bouncing or rolling exercises' },
                        { emoji: '🎯', text: 'Heavy Work', description: 'Push, pull, or carry activities' },
                        { emoji: '💨', text: 'Breathing Exercise', description: 'Deep breathing practice' },
                        { emoji: '🛋️', text: 'Calm Corner', description: 'Quiet space to regulate' },
                        { emoji: '🎪', text: 'Swing Time', description: 'Vestibular input on swing' },
                        { emoji: '🖐️', text: 'Fidget Time', description: 'Use fidget tools' },
                        { emoji: '🌊', text: 'Water Play', description: 'Calming water activities' }
                    ],
                    'Medical & Health': [
                        { emoji: '💊', text: 'Morning Meds', description: 'Take morning medications' },
                        { emoji: '💉', text: 'Medical Procedure', description: 'Doctor visit or treatment' },
                        { emoji: '🩺', text: 'Doctor Appointment', description: 'Healthcare visit' },
                        { emoji: '🦷', text: 'Dentist Visit', description: 'Dental appointment' },
                        { emoji: '👁️', text: 'Vision Therapy', description: 'Eye exercises and therapy' },
                        { emoji: '📊', text: 'Track Symptoms', description: 'Record how you\'re feeling' },
                        { emoji: '🩹', text: 'Wound Care', description: 'Clean and dress wounds' },
                        { emoji: '🌡️', text: 'Check Temperature', description: 'Monitor body temperature' },
                        { emoji: '💧', text: 'Stay Hydrated', description: 'Drink water regularly' },
                        { emoji: '🍎', text: 'Healthy Snack', description: 'Nutritious food break' }
                    ],
                    'Communication': [
                        { emoji: '📱', text: 'AAC Device Time', description: 'Practice with communication device' },
                        { emoji: '🤟', text: 'Sign Language', description: 'Practice signing' },
                        { emoji: '📇', text: 'PECS Cards', description: 'Use picture exchange cards' },
                        { emoji: '👆', text: 'Choice Board', description: 'Make choices from board' },
                        { emoji: '🎯', text: 'Eye Gaze Practice', description: 'Communication with eye gaze' },
                        { emoji: '📝', text: 'Visual Schedule', description: 'Review daily visual schedule' },
                        { emoji: '🔤', text: 'Letter Board', description: 'Spell on letter board' },
                        { emoji: '👍', text: 'Yes/No Questions', description: 'Practice responding' },
                        { emoji: '🖼️', text: 'Social Story', description: 'Read social story together' },
                        { emoji: '💬', text: 'Conversation Practice', description: 'Practice back-and-forth talking' }
                    ]
                };
            }
            
            setupActivityLibrary() {
                // Set up the activity library content when panel opens
                const defaultTab = document.getElementById('defaultActivitiesTab');
                const templatesTab = document.getElementById('myTemplatesTab');
                const searchInput = document.getElementById('librarySearchInput');
                
                if (!defaultTab || !templatesTab) return;
                
                // Set up search functionality
                if (searchInput) {
                    searchInput.value = this.librarySearchTerm;
                    searchInput.addEventListener('input', (e) => {
                        this.librarySearchTerm = e.target.value;
                        this.renderCurrentLibraryTab();
                    });
                }
                
                defaultTab.onclick = () => {
                    // Update active styles
                    defaultTab.style.background = 'white';
                    defaultTab.style.color = 'var(--primary-color)';
                    defaultTab.style.border = 'none';
                    defaultTab.style.fontWeight = '600';
                    
                    templatesTab.style.background = 'rgba(255,255,255,0.2)';
                    templatesTab.style.color = 'white';
                    templatesTab.style.border = '1px solid rgba(255,255,255,0.3)';
                    templatesTab.style.fontWeight = '500';
                    
                    this.currentLibraryTab = 'default';
                    this.clearSelection();
                    this.renderDefaultActivities();
                };
                
                templatesTab.onclick = () => {
                    // Update active styles
                    templatesTab.style.background = 'white';
                    templatesTab.style.color = 'var(--primary-color)';
                    templatesTab.style.border = 'none';
                    templatesTab.style.fontWeight = '600';
                    
                    defaultTab.style.background = 'rgba(255,255,255,0.2)';
                    defaultTab.style.color = 'white';
                    defaultTab.style.border = '1px solid rgba(255,255,255,0.3)';
                    defaultTab.style.fontWeight = '500';
                    
                    this.currentLibraryTab = 'templates';
                    this.clearSelection();
                    this.renderMyTemplates();
                };
                
                // Show default activities by default
                this.renderDefaultActivities();
            }
            
            // Activity Library is now handled by closePanel()
            
            renderDefaultActivities() {
                const body = document.getElementById('activityLibraryBody');
                const categories = this.getDefaultActivities();
                const searchTerm = this.librarySearchTerm.toLowerCase();
                
                let html = '';
                let hasVisibleActivities = false;
                
                // Sort categories by user preference
                const sortedCategories = this.sortCategoriesByOrder(categories);
                
                // Start HTML without container wrapper
                html = '';
                
                sortedCategories.forEach(([category, activities]) => {
                    // Filter activities based on search term
                    const filteredActivities = activities.filter(activity => 
                        searchTerm === '' || 
                        activity.text.toLowerCase().includes(searchTerm) ||
                        activity.emoji.includes(searchTerm) ||
                        (activity.description && activity.description.toLowerCase().includes(searchTerm))
                    );
                    
                    if (filteredActivities.length > 0) {
                        hasVisibleActivities = true;
                        const isCollapsed = this.collapsedCategories.has(category);
                        const categoryId = category.replace(/[^a-zA-Z0-9]/g, '_');
                        
                        html += `
                            <div class="activity-category" data-category="${category}" draggable="true" ondragstart="app.handleCategoryDragStart(event, '${category}')" ondragover="app.handleCategoryDragOver(event)" ondrop="app.handleCategoryDrop(event, '${category}')" ondragend="app.handleCategoryDragEnd(event)">
                                <h3 class="activity-category-title">
                                    <span class="category-drag-handle material-icons">drag_indicator</span>
                                    <span class="category-name" onclick="app.toggleCategory('${category}')">${category}</span>
                                    <span class="category-toggle material-icons" onclick="app.toggleCategory('${category}')">${isCollapsed ? 'expand_more' : 'expand_less'}</span>
                                    <span class="category-checkbox" onclick="app.toggleCategorySelection('${category}', event)">
                                        <span class="material-icons">${this.isCategorySelected(category) ? 'check_box' : 'check_box_outline_blank'}</span>
                                    </span>
                                </h3>
                                <div class="library-activities ${isCollapsed ? 'collapsed' : ''}" id="category_${categoryId}">
                                    ${filteredActivities.map(activity => {
                                        const activityId = `default_${activity.emoji}_${activity.text}`;
                                        const isSelected = this.selectedActivities.has(activityId);
                                        return `
                                            <div class="library-activity ${isSelected ? 'selected' : ''}" 
                                                 onclick="app.toggleActivitySelection('${activityId}', '${activity.emoji}', '${activity.text.replace(/'/g, "\\'")}', '${(activity.description || '').replace(/'/g, "\\'")}')">
                                                <div class="library-activity-checkbox">
                                                    <span class="material-icons">${isSelected ? 'check_box' : 'check_box_outline_blank'}</span>
                                                </div>
                                                <div class="library-activity-emoji">${activity.emoji}</div>
                                                <div class="library-activity-title">${activity.text}</div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }
                });
                
                // No closing div needed
                
                if (!hasVisibleActivities) {
                    html = `
                        <div style="text-align: center; padding: 40px; color: white;">
                            <p>No activities found matching "${searchTerm}"</p>
                        </div>
                    `;
                }
                
                body.innerHTML = html;
                this.updateBatchControls();
            }
            
            renderMyTemplates() {
                const body = document.getElementById('activityLibraryBody');
                const templates = this.data.templates || [];
                const searchTerm = this.librarySearchTerm.toLowerCase();
                
                // Filter templates based on search term
                const filteredTemplates = templates.filter(template => 
                    searchTerm === '' || 
                    template.text.toLowerCase().includes(searchTerm) ||
                    template.emoji.includes(searchTerm) ||
                    (template.description && template.description.toLowerCase().includes(searchTerm))
                );
                
                if (filteredTemplates.length === 0) {
                    if (templates.length === 0) {
                        body.innerHTML = `
                            <div style="text-align: center; padding: 40px; color: white;">
                                <p>No saved templates yet!</p>
                                <p style="font-size: 0.9rem; margin-top: 10px; color: rgba(255,255,255,0.8);">Use the menu on any activity card to save it as a template.</p>
                            </div>
                        `;
                    } else {
                        body.innerHTML = `
                            <div style="text-align: center; padding: 40px; color: white;">
                                <p>No templates found matching "${searchTerm}"</p>
                            </div>
                        `;
                    }
                    this.updateBatchControls();
                    return;
                }
                
                body.innerHTML = `
                    <div class="activity-category">
                        <h3 class="activity-category-title">My Templates</h3>
                        <div class="library-activities">
                            ${filteredTemplates.map((template, index) => {
                                const activityId = `template_${index}`;
                                const isSelected = this.selectedActivities.has(activityId);
                                return `
                                    <div class="library-activity ${isSelected ? 'selected' : ''}" 
                                         onclick="app.toggleActivitySelection('${activityId}', '${template.emoji}', '${template.text.replace(/'/g, "\\'")}', '${(template.description || '').replace(/'/g, "\\'")}')">
                                        <div class="library-activity-checkbox">
                                            <span class="material-icons">${isSelected ? 'check_box' : 'check_box_outline_blank'}</span>
                                        </div>
                                        <div class="library-activity-emoji">${template.emoji}</div>
                                        <div class="library-activity-title">${template.text}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
                this.updateBatchControls();
            }
            
            toggleActivitySelection(activityId, emoji, text, description) {
                if (this.selectedActivities.has(activityId)) {
                    this.selectedActivities.delete(activityId);
                } else {
                    this.selectedActivities.set(activityId, { emoji, text, description });
                }
                this.renderCurrentLibraryTab();
            }
            
            updateBatchControls() {
                const batchControls = document.getElementById('libraryBatchControls');
                const selectedCount = document.querySelector('.selected-count');
                
                if (batchControls && selectedCount) {
                    const count = this.selectedActivities.size;
                    if (count > 0) {
                        batchControls.style.display = 'flex';
                        selectedCount.textContent = count;
                    } else {
                        batchControls.style.display = 'none';
                    }
                }
            }
            
            selectAllActivities() {
                const activities = document.querySelectorAll('.library-activity');
                activities.forEach(activity => {
                    const onclick = activity.getAttribute('onclick');
                    if (onclick && !activity.classList.contains('selected')) {
                        // Extract parameters from onclick and add to selection
                        eval(onclick.replace('app.toggleActivitySelection', 'this.addToSelection'));
                    }
                });
                this.renderCurrentLibraryTab();
            }
            
            addToSelection(activityId, emoji, text, description) {
                this.selectedActivities.set(activityId, { emoji, text, description });
            }
            
            clearSelection() {
                this.selectedActivities.clear();
                this.renderCurrentLibraryTab();
            }
            
            isCategorySelected(category) {
                // Get all activities in this category
                const categoryActivities = this.getDefaultActivities()[category] || [];
                if (categoryActivities.length === 0) return false;
                
                // Check if all activities in the category are selected
                return categoryActivities.every(activity => {
                    const activityId = `default_${activity.emoji}_${activity.text}`;
                    return this.selectedActivities.has(activityId);
                });
            }
            
            toggleCategorySelection(category, event) {
                event.stopPropagation();
                const categoryActivities = this.getDefaultActivities()[category] || [];
                const isSelected = this.isCategorySelected(category);
                
                categoryActivities.forEach(activity => {
                    const activityId = `default_${activity.emoji}_${activity.text}`;
                    if (isSelected) {
                        // Deselect all
                        this.selectedActivities.delete(activityId);
                    } else {
                        // Select all
                        this.selectedActivities.set(activityId, {
                            emoji: activity.emoji,
                            text: activity.text,
                            description: activity.description || ''
                        });
                    }
                });
                
                this.renderCurrentLibraryTab();
            }
            
            addSelectedActivities() {
                const activities = [];
                this.selectedActivities.forEach((value, key) => {
                    if (value && typeof value === 'object') {
                        activities.push(value);
                    }
                });
                
                // Add all selected activities
                activities.forEach(activity => {
                    if (activity && activity.text) {
                        this.addActivity(
                            activity.text, 
                            activity.emoji || '📝', 
                            null, 
                            'normal', 
                            activity.description || ''
                        );
                    }
                });
                
                // Clear selection and close panel
                this.clearSelection();
                this.closePanel();
                
                // Show toast
                this.showToast(`Added ${activities.length} activities`);
                
                // Scroll to the last added activity
                setTimeout(() => {
                    const activityCards = document.querySelectorAll('.activity-card');
                    const lastActivity = activityCards[activityCards.length - 1];
                    if (lastActivity) {
                        lastActivity.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
            
            renderCurrentLibraryTab() {
                if (this.currentLibraryTab === 'templates') {
                    this.renderMyTemplates();
                } else {
                    this.renderDefaultActivities();
                }
            }
            
            addActivityFromLibrary(emoji, text, description) {
                this.addActivity(text, emoji, null, 'normal', description);
                this.closePanel();
                // Flash or highlight the new activity
                setTimeout(() => {
                    const cards = document.querySelectorAll('.activity-card');
                    if (cards.length > 0) {
                        cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
            
            // ===== CATEGORY MANAGEMENT =====
            loadCategoryOrder() {
                const saved = localStorage.getItem('stackmap_category_order');
                return saved ? JSON.parse(saved) : [];
            }
            
            saveCategoryOrder() {
                localStorage.setItem('stackmap_category_order', JSON.stringify(this.categoryOrder));
            }
            
            loadCollapsedCategories() {
                const saved = localStorage.getItem('stackmap_collapsed_categories');
                const hasVisited = localStorage.getItem('stackmap_library_visited');
                
                if (saved && hasVisited) {
                    return new Set(JSON.parse(saved));
                } else {
                    // First time - all categories collapsed by default
                    const allCategories = Object.keys(this.getDefaultActivities());
                    const collapsedSet = new Set(allCategories);
                    
                    // Mark as visited
                    localStorage.setItem('stackmap_library_visited', 'true');
                    
                    return collapsedSet;
                }
            }
            
            saveCollapsedCategories() {
                localStorage.setItem('stackmap_collapsed_categories', JSON.stringify([...this.collapsedCategories]));
            }
            
            sortCategoriesByOrder(categories) {
                const entries = Object.entries(categories);
                
                // If no saved order, return default order
                if (this.categoryOrder.length === 0) {
                    return entries;
                }
                
                // Sort by saved order
                return entries.sort((a, b) => {
                    const aIndex = this.categoryOrder.indexOf(a[0]);
                    const bIndex = this.categoryOrder.indexOf(b[0]);
                    
                    // If both are in saved order, sort by that
                    if (aIndex !== -1 && bIndex !== -1) {
                        return aIndex - bIndex;
                    }
                    
                    // If only one is in saved order, it comes first
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                    
                    // Neither in saved order, maintain original order
                    return 0;
                });
            }
            
            toggleCategory(category) {
                if (this.collapsedCategories.has(category)) {
                    this.collapsedCategories.delete(category);
                } else {
                    this.collapsedCategories.add(category);
                }
                this.saveCollapsedCategories();
                
                // Toggle the visual state
                const categoryId = category.replace(/[^a-zA-Z0-9]/g, '_');
                const activitiesDiv = document.getElementById(`category_${categoryId}`);
                const toggleIcon = event.target.closest('.activity-category-title').querySelector('.category-toggle');
                
                if (activitiesDiv) {
                    activitiesDiv.classList.toggle('collapsed');
                }
                if (toggleIcon) {
                    toggleIcon.textContent = this.collapsedCategories.has(category) ? 'expand_more' : 'expand_less';
                }
            }
            
            // Drag and drop for categories
            draggedCategory = null;
            
            handleCategoryDragStart(event, category) {
                this.draggedCategory = category;
                event.dataTransfer.effectAllowed = 'move';
                event.target.closest('.activity-category').classList.add('dragging');
            }
            
            handleCategoryDragOver(event) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                
                const draggedOver = event.target.closest('.activity-category');
                if (draggedOver && !draggedOver.classList.contains('dragging')) {
                    draggedOver.classList.add('drag-over');
                }
            }
            
            handleCategoryDrop(event, targetCategory) {
                event.preventDefault();
                
                if (this.draggedCategory && this.draggedCategory !== targetCategory) {
                    // Update category order
                    const categories = Object.keys(this.getDefaultActivities());
                    const newOrder = [];
                    
                    categories.forEach(cat => {
                        if (cat === targetCategory) {
                            newOrder.push(this.draggedCategory);
                        }
                        if (cat !== this.draggedCategory) {
                            newOrder.push(cat);
                        }
                    });
                    
                    this.categoryOrder = newOrder;
                    this.saveCategoryOrder();
                    this.renderDefaultActivities();
                }
            }
            
            handleCategoryDragEnd(event) {
                // Clean up
                const categories = document.querySelectorAll('.activity-category');
                categories.forEach(cat => {
                    cat.classList.remove('dragging', 'drag-over');
                });
                this.draggedCategory = null;
            }
            
            saveActivityAsTemplate(activityId) {
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                if (!activity) return;
                
                // Check if template already exists
                const exists = this.data.templates.some(t => 
                    t.text === activity.text && t.emoji === activity.emoji
                );
                
                if (exists) {
                    alert('This activity is already saved as a template!');
                    return;
                }
                
                // Add to templates
                this.data.templates.push({
                    text: activity.text,
                    emoji: activity.emoji,
                    description: activity.description || '',
                    createdAt: new Date().toISOString()
                });
                
                this.saveData();
                alert('Activity saved as template!');
            }
            
            // ===== CELEBRATION SYSTEM =====
            initializeCelebrations() {
                if (window.CelebrationManager) {
                    this.celebrationManager = new CelebrationManager(this);
                    // Add appState reference for CelebrationManager compatibility
                    this.appState = this;
                }
            }
            
            checkAllActivitiesCompleted() {
                const activities = this.getCurrentActivities();
                if (activities.length === 0) return;
                
                const allCompleted = activities.every(a => a.completed);
                // console.log('Checking all activities completed:', allCompleted, 'Total:', activities.length, 'Completed:', activities.filter(a => a.completed).length);
                if (allCompleted && this.celebrationManager) {
                    // Trigger routine celebration
                    const container = document.querySelector('.main-content') || document.body;
                    const user = this.getCurrentUser();
                    // console.log('Triggering routine celebration, preference:', user.settings?.routineCelebration);
                    this.celebrationManager.celebrateRoutine(container, user.id);
                }
            }
            
            // ===== EXPORT/IMPORT =====
            exportData() {
                // Redirect to shareData for consistency
                this.shareData();
            }
            
            convertAndImportOldFormat(oldData) {
                // Field mapping from old to new format:
                // Old Format -> New Format
                // title -> text (main activity name)
                // icon -> emoji (visual representation)
                // description -> description (additional details)
                // keep -> pinned (priority/persistent flag)
                // cardType -> activityType (recurring/frequent/task)
                // cardNumber -> metadata.cardNumber (ordering)
                // color -> metadata.color (visual styling)
                // visible -> metadata.visible (display flag)
                // completedAt -> metadata.completedAt (timestamp)
                
                // Create new format structure
                const newData = {
                    version: 3,
                    currentUserId: oldData.users.currentUserId,
                    currentDay: oldData.ui?.currentDay || 'today',
                    users: {},
                    globalSettings: {
                        themeColor: '#667eea',
                        displayMode: 'numbers',
                        enableDayManagement: true
                    },
                    templates: []
                };
                
                // Convert each user profile
                for (const [userId, profile] of Object.entries(oldData.users.profiles)) {
                    const newUser = {
                        id: userId,
                        name: profile.name,
                        icon: profile.icon || '👤',
                        days: {
                            today: { activities: [] },
                            tomorrow: { activities: [] }
                        },
                        settings: {
                            taskCelebration: profile.settings?.taskCelebration || 'rainbow',
                            routineCelebration: profile.settings?.routineCelebration || 'rainbow',
                            soundEnabled: profile.settings?.soundEnabled !== false
                        },
                        createdAt: new Date().toISOString(),
                        lastActive: new Date().toISOString()
                    };
                    
                    // Preserve custom day titles if available
                    if (profile.dayTitles || profile.daySubtitles) {
                        newUser.dayTitles = profile.dayTitles;
                        newUser.daySubtitles = profile.daySubtitles;
                    }
                    
                    // Preserve custom title and subtitle
                    if (profile.customTitle || profile.customSubtitle) {
                        newUser.customTitle = profile.customTitle;
                        newUser.customSubtitle = profile.customSubtitle;
                    }
                    
                    // Convert activities to today's activities
                    if (profile.activities && profile.activities.length > 0) {
                        newUser.days.today.activities = profile.activities.map(activity => ({
                            id: activity.id,
                            text: activity.title || '',
                            emoji: activity.icon || '📝',
                            description: activity.description || '',
                            time: activity.time || '',
                            completed: activity.completed || false,
                            pinned: activity.keep || false,
                            activityType: activity.cardType || 'task',
                            createdAt: activity.createdDate || new Date().toISOString(),
                            // Preserve additional metadata from old format
                            metadata: {
                                cardNumber: activity.cardNumber,
                                color: activity.color,
                                visible: activity.visible,
                                completedAt: activity.completedAt,
                                originalCardType: activity.cardType
                            }
                        }));
                    }
                    
                    // Convert tomorrow activities
                    if (profile.tomorrowActivities && profile.tomorrowActivities.length > 0) {
                        newUser.days.tomorrow.activities = profile.tomorrowActivities.map(activity => ({
                            id: activity.id,
                            text: activity.title || '',
                            emoji: activity.icon || '📝',
                            description: activity.description || '',
                            time: activity.time || '',
                            completed: activity.completed || false,
                            pinned: activity.keep || false,
                            activityType: activity.cardType || 'task',
                            createdAt: activity.createdDate || new Date().toISOString(),
                            // Preserve additional metadata from old format
                            metadata: {
                                cardNumber: activity.cardNumber,
                                color: activity.color,
                                visible: activity.visible,
                                completedAt: activity.completedAt,
                                originalCardType: activity.cardType
                            }
                        }));
                    }
                    
                    newData.users[userId] = newUser;
                }
                
                // Extract theme color from first user's settings if available
                const firstUser = Object.values(oldData.users.profiles)[0];
                if (firstUser?.settings?.backgroundColor) {
                    newData.globalSettings.themeColor = firstUser.settings.backgroundColor;
                }
                
                // Extract display mode
                if (firstUser?.settings?.showNumbers !== undefined) {
                    newData.globalSettings.displayMode = firstUser.settings.showNumbers ? 'numbers' : 'icons';
                }
                
                // Convert templates from library
                if (oldData.users.groupLibrary && oldData.users.groupLibrary.length > 0) {
                    newData.templates = oldData.users.groupLibrary.map(item => ({
                        id: item.id,
                        text: item.title,
                        emoji: item.icon || '📝',
                        description: item.description || '',
                        activityType: item.cardType || 'task',
                        createdAt: item.addedDate || new Date().toISOString()
                    }));
                }
                
                // Apply the converted data
                this.data = newData;
                this.saveData();
                this.loadTheme();
                this.loadDisplayMode();
                
                // Apply custom title if present
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.customTitle) {
                    localStorage.setItem('stackmap_custom_title', currentUser.customTitle);
                    const mainTitle = document.getElementById('mainTitle');
                    if (mainTitle) {
                        mainTitle.textContent = currentUser.customTitle;
                    }
                }
                
                this.render();
            }
            
            showMigrationNotification() {
                // Create a friendly modal to inform user about the migration
                const modal = document.createElement('div');
                modal.className = 'migration-modal';
                modal.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 12px;
                    padding: 24px;
                    max-width: 400px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    text-align: center;
                `;
                
                modal.innerHTML = `
                    <h2 style="color: #333; margin: 0 0 16px 0;">Welcome Back! 🎉</h2>
                    <p style="color: #666; margin: 0 0 20px 0; line-height: 1.5;">
                        Your data has been automatically updated to work with the new StackMap. 
                        All your activities, settings, and templates have been preserved.
                    </p>
                    <button onclick="this.parentElement.remove()" style="
                        background: var(--primary-color);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Got it!</button>
                `;
                
                document.body.appendChild(modal);
                
                // Auto-remove after 10 seconds
                setTimeout(() => {
                    if (modal.parentElement) {
                        modal.remove();
                    }
                }, 10000);
            }
            
            showPrivacyPolicy() {
                // Create a modal for privacy policy
                const modal = document.createElement('div');
                modal.className = 'info-modal';
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    overflow-y: auto;
                `;
                
                modal.innerHTML = `
                    <div class="info-content" style="
                        background: rgba(255, 255, 255, 0.95);
                        border-radius: 12px;
                        padding: 24px;
                        max-width: 800px;
                        max-height: 80vh;
                        overflow-y: auto;
                        color: #333;
                    ">
                        <button onclick="this.closest('.info-modal').remove()" style="
                            float: right;
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            color: #666;
                        ">×</button>
                        
                        <h1 style="color: var(--primary-color); margin: 0 0 10px 0; font-size: 2rem;">Privacy Policy</h1>
                        <p style="color: #666; font-style: italic; margin-bottom: 30px;">Last updated: June 18, 2025</p>
                        
                        <h2 style="color: var(--primary-color); margin: 30px 0 15px 0;">Overview</h2>
                        <p>StackMap is designed with privacy as a core principle. We believe families, especially those with special needs children, deserve tools that respect their privacy and give them control over their data.</p>
                        
                        <h2 style="color: var(--primary-color); margin: 30px 0 15px 0;">Data Collection</h2>
                        <p><strong>We collect NO personal data by default.</strong> StackMap works entirely offline on your device.</p>
                        
                        <h2 style="color: var(--primary-color); margin: 30px 0 15px 0;">Data Storage</h2>
                        <ul style="line-height: 1.8;">
                            <li>All routine data is stored locally on your device</li>
                            <li>No data is sent to our servers</li>
                            <li>Your routines, progress, and settings stay on your device</li>
                        </ul>
                        
                        <h2 style="color: var(--primary-color); margin: 30px 0 15px 0;">Children's Privacy</h2>
                        <p>StackMap is designed for use by children with adult supervision:</p>
                        <ul style="line-height: 1.8;">
                            <li>We don't collect any information from children</li>
                            <li>No accounts or sign-ups required</li>
                            <li>No social features or communication between users</li>
                            <li>No behavioral tracking or analytics</li>
                        </ul>
                        
                        <h2 style="color: var(--primary-color); margin: 30px 0 15px 0;">Third-Party Services</h2>
                        <p>StackMap uses minimal third-party services:</p>
                        <ul style="line-height: 1.8;">
                            <li><strong>No analytics</strong> - We don't track usage</li>
                            <li><strong>No advertising</strong> - We don't show ads</li>
                            <li><strong>No external APIs</strong> - Everything runs locally</li>
                        </ul>
                        
                        <h2 style="color: var(--primary-color); margin: 30px 0 15px 0;">Your Rights</h2>
                        <p>You have complete control:</p>
                        <ul style="line-height: 1.8;">
                            <li>Export your data anytime</li>
                            <li>Delete your data anytime</li>
                            <li>Use the app without any account</li>
                            <li>Sync is always optional</li>
                        </ul>
                        
                        <h2 style="color: var(--primary-color); margin: 30px 0 15px 0;">Future Changes</h2>
                        <p>If we ever need to update this policy, we will:</p>
                        <ul style="line-height: 1.8;">
                            <li>Notify you in the app</li>
                            <li>Give you time to review changes</li>
                            <li>Allow you to export your data if you disagree</li>
                        </ul>
                        
                        <h2 style="color: var(--primary-color); margin: 30px 0 15px 0;">Contact</h2>
                        <p>Questions about privacy? Email: <a href="mailto:privacy@stackmap.app" style="color: var(--primary-color);">privacy@stackmap.app</a></p>
                        
                        <h2 style="color: var(--primary-color); margin: 30px 0 15px 0;">Open Source</h2>
                        <p>StackMap's code is open source. You can verify our privacy practices at: <a href="https://github.com/ajstack22/StackMap" target="_blank" style="color: var(--primary-color);">github.com/ajstack22/StackMap</a></p>
                        
                        <button onclick="this.closest('.info-modal').remove()" style="
                            background: var(--primary-color);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                            font-weight: 500;
                            margin-top: 30px;
                            width: 100%;
                        ">Close</button>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Close on backdrop click
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
            }
            
            showSupportUs() {
                // Create a modal for support
                const modal = document.createElement('div');
                modal.className = 'info-modal';
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    overflow-y: auto;
                `;
                
                modal.innerHTML = `
                    <div class="info-content" style="
                        background: rgba(255, 255, 255, 0.95);
                        border-radius: 12px;
                        padding: 24px;
                        max-width: 600px;
                        max-height: 80vh;
                        overflow-y: auto;
                        color: #333;
                    ">
                        <button onclick="this.closest('.info-modal').remove()" style="
                            float: right;
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            color: #666;
                        ">×</button>
                        
                        <h1 style="color: var(--primary-color); margin: 0 0 16px 0; font-size: 2rem;">Support Us</h1>
                        
                        <p style="margin-bottom: 20px;">StackMap is a free tool designed to help families manage daily routines. If you find it helpful, here are ways you can support the project:</p>
                        
                        <h2 style="color: var(--primary-color); margin: 20px 0 10px 0;">Contact</h2>
                        <p>Need help or have questions? Email us at: <a href="mailto:support@stackmap.app" style="color: var(--primary-color);">support@stackmap.app</a></p>
                        
                        <h2 style="color: var(--primary-color); margin: 20px 0 10px 0;">Ways to Support</h2>
                        <p>If you'd like to support StackMap's mission, here are some ways you can help:</p>
                        
                        <div style="display: flex; flex-direction: column; gap: 15px; margin: 20px 0;">
                            <a href="https://paypal.me/stackadamj" target="_blank" style="
                                display: flex;
                                align-items: center;
                                gap: 15px;
                                padding: 15px;
                                background: white;
                                border: 2px solid #e0e0e0;
                                border-radius: 8px;
                                text-decoration: none;
                                color: #333;
                                transition: all 0.3s ease;
                            " onmouseover="this.style.borderColor='var(--primary-color)'" onmouseout="this.style.borderColor='#e0e0e0'">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    background: var(--primary-color);
                                    color: white;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 20px;
                                ">💳</div>
                                <div>
                                    <h3 style="margin: 0 0 5px 0; color: var(--primary-color);">PayPal</h3>
                                    <p style="margin: 0; font-size: 0.9rem; color: #666;">Quick and secure contributions</p>
                                </div>
                            </a>
                            
                            <a href="https://www.venmo.com/u/stackadamj" target="_blank" style="
                                display: flex;
                                align-items: center;
                                gap: 15px;
                                padding: 15px;
                                background: white;
                                border: 2px solid #e0e0e0;
                                border-radius: 8px;
                                text-decoration: none;
                                color: #333;
                                transition: all 0.3s ease;
                            " onmouseover="this.style.borderColor='var(--primary-color)'" onmouseout="this.style.borderColor='#e0e0e0'">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    background: var(--primary-color);
                                    color: white;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 20px;
                                ">📱</div>
                                <div>
                                    <h3 style="margin: 0 0 5px 0; color: var(--primary-color);">Venmo</h3>
                                    <p style="margin: 0; font-size: 0.9rem; color: #666;">Easy mobile contributions</p>
                                </div>
                            </a>
                            
                            <a href="https://patreon.com/StackMap" target="_blank" style="
                                display: flex;
                                align-items: center;
                                gap: 15px;
                                padding: 15px;
                                background: white;
                                border: 2px solid #e0e0e0;
                                border-radius: 8px;
                                text-decoration: none;
                                color: #333;
                                transition: all 0.3s ease;
                            " onmouseover="this.style.borderColor='var(--primary-color)'" onmouseout="this.style.borderColor='#e0e0e0'">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    background: var(--primary-color);
                                    color: white;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 20px;
                                ">🎁</div>
                                <div>
                                    <h3 style="margin: 0 0 5px 0; color: var(--primary-color);">Patreon</h3>
                                    <p style="margin: 0; font-size: 0.9rem; color: #666;">Join our community of supporters</p>
                                </div>
                            </a>
                        </div>
                        
                        <h2 style="color: var(--primary-color); margin: 20px 0 10px 0;">Other Ways to Help</h2>
                        <ul style="line-height: 1.8;">
                            <li>Tell other families about StackMap</li>
                            <li>Share in support groups and forums</li>
                            <li>Leave a review if you downloaded from an app store</li>
                            <li>Provide feedback to help us improve</li>
                        </ul>
                        
                        <p style="margin-top: 20px;">Every contribution helps us continue our mission of supporting families with special needs children. Thank you for being part of the StackMap community!</p>
                        
                        <button onclick="this.closest('.info-modal').remove()" style="
                            background: var(--primary-color);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                            font-weight: 500;
                            margin-top: 20px;
                            width: 100%;
                        ">Close</button>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Close on backdrop click
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
            }
            
            importData() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                
                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importedData = JSON.parse(e.target.result);
                            
                            // Check if this is the new format (version 2 or 3)
                            if ((importedData.version === 2 || importedData.version === 3) && importedData.users) {
                                if (confirm('This will replace all current data. Continue?')) {
                                    this.data = importedData;
                                    this.saveData();
                                    this.loadTheme();
                                    this.loadDisplayMode();
                                    this.render();
                                    alert('Data imported successfully!');
                                }
                            } 
                            // Check if this is the old format (version 1.0)
                            else if (importedData.version === "1.0" && importedData.users && importedData.users.profiles) {
                                if (confirm('This will import data from the old StackMap format. Continue?')) {
                                    this.convertAndImportOldFormat(importedData);
                                    alert('Data imported successfully from old format!');
                                }
                            } else {
                                alert('Invalid backup file format.');
                            }
                        } catch (error) {
                            console.error('Import error:', error);
                            alert('Failed to import data. Please check the file.');
                        }
                    };
                    
                    reader.readAsText(file);
                });
                
                input.click();
            }
            
            render() {
                const list = this.elements.activityList;
                const activities = this.getCurrentActivities();
                const user = this.getCurrentUser();
                
                // Use activities in their current order (respects drag and drop)
                const sortedActivities = [...activities];
                
                // Update header with user info and day
                const subtitle = document.getElementById('subtitle');
                if (subtitle && user) {
                    const dayText = this.getCurrentDay().charAt(0).toUpperCase() + this.getCurrentDay().slice(1);
                    subtitle.innerHTML = `<span class="subtitle-emoji">${user.icon}</span> ${dayText}`;
                }
                
                // Update day selector visibility and label
                if (this.data.globalSettings.enableDayManagement && this.elements.daySelector) {
                    this.elements.daySelector.style.display = 'flex';
                    const day = this.getCurrentDay();
                    if (this.elements.dayLabel) {
                        this.elements.dayLabel.textContent = day.charAt(0).toUpperCase() + day.slice(1);
                    }
                } else if (this.elements.daySelector) {
                    this.elements.daySelector.style.display = 'none';
                }
                
                // Calculate completion
                const completedCount = sortedActivities.filter(a => a.completed).length;
                const totalCount = sortedActivities.length;
                const completionPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                const allComplete = totalCount > 0 && completedCount === totalCount;
                
                
                // Check for all complete
                if (allComplete && totalCount > 0) {
                    this.triggerCelebration();
                }
                
                if (sortedActivities.length === 0) {
                    list.innerHTML = `
                        <div class="empty-state">
                            <h3>No activities yet</h3>
                            <p>Use the edit button to add your first activity</p>
                        </div>
                    `;
                    return;
                }
                
                list.innerHTML = sortedActivities.map((activity, index) => {
                    const displayMode = this.data.globalSettings.displayMode || 'numbers';
                    const isEditMode = this.isEditMode;
                    
                    return `
                        <div class="activity-card ${activity.completed ? 'completed' : ''}" 
                             data-activity-id="${activity.id}"
                             ${!isEditMode ? `onclick="app.toggleActivityComplete('${activity.id}')"`  : ''}>
                            
                            ${displayMode === 'numbers' ? `
                                <div class="activity-number-badge" ${isEditMode ? `onclick="app.promptReorderActivity('${activity.id}', ${index + 1}, event)"` : ''}>
                                    ${index + 1}
                                </div>
                            ` : displayMode === 'time' && activity.time ? `
                                <div class="activity-number-badge" ${isEditMode ? `onclick="app.editActivityTime('${activity.id}', event)" style="cursor: pointer;"` : ''}>
                                    ${activity.time}
                                </div>
                            ` : displayMode === 'time' ? `
                                <div class="activity-number-badge" ${isEditMode ? `onclick="app.editActivityTime('${activity.id}', event)" style="cursor: pointer;"` : ''}>
                                    --:--
                                </div>
                            ` : ''}
                            
                            <div class="activity-emoji" ${isEditMode ? `onclick="app.editActivityEmoji('${activity.id}')" style="cursor: pointer;"` : ''}>${activity.emoji}</div>
                            <div class="activity-title" ${isEditMode ? `onclick="app.editActivityTitle('${activity.id}')" style="cursor: pointer;"` : ''}>${activity.text}</div>
                            ${activity.description ? 
                                `<div class="activity-description" ${isEditMode ? `onclick="app.editActivityDescription('${activity.id}')" style="cursor: pointer;"` : ''}>${activity.description}</div>` : 
                                (isEditMode ? `<div class="activity-description activity-description--placeholder" onclick="app.editActivityDescription('${activity.id}')" style="cursor: pointer;">Add description...</div>` : '')
                            }
                            
                            ${isEditMode ? this.renderCardButtons(activity) : ''}
                        </div>
                    `;
                }).join('');
                
                // Enable drag and drop if in edit mode
                if (this.isEditMode) {
                    setTimeout(() => this.enableDragAndDrop(), 100);
                }
            }
            
            // ===== THEME MANAGEMENT =====
            selectColor(color) {
                // Calculate color variations
                const darkerColor = this.adjustColorBrightness(color, -15);
                const lighterColor = this.adjustColorBrightness(color, 20);
                
                // Update CSS variables
                document.documentElement.style.setProperty('--primary-color', color);
                document.documentElement.style.setProperty('--primary-dark', darkerColor);
                document.documentElement.style.setProperty('--primary-light', lighterColor);
                document.documentElement.style.setProperty('--background-gradient-start', color);
                document.documentElement.style.setProperty('--background-gradient-end', darkerColor);
                document.documentElement.style.setProperty('--background-main', lighterColor);
                document.documentElement.style.setProperty('--header-shadow', `${darkerColor}66`);
                
                // Update body background gradient
                document.body.style.background = `linear-gradient(to bottom, ${color} 0%, ${lighterColor} 100%)`;
                
                // Update header background and shadow
                const headerWrapper = document.querySelector('.header-wrapper');
                if (headerWrapper) {
                    headerWrapper.style.background = `linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%)`;
                    headerWrapper.style.boxShadow = `0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 8px ${darkerColor}66`;
                }
                
                // Save to data structure
                this.data.globalSettings.themeColor = color;
                this.saveData();
                
                // Update status bar color on Android
                this.updateStatusBar();
                
                // Update color picker UI
                this.updateColorPickerSelection(color);
            }
            
            adjustColorBrightness(color, percent) {
                // Convert hex to RGB
                const hex = color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                
                // Adjust brightness
                const factor = (100 + percent) / 100;
                const newR = Math.round(Math.min(255, Math.max(0, r * factor)));
                const newG = Math.round(Math.min(255, Math.max(0, g * factor)));
                const newB = Math.round(Math.min(255, Math.max(0, b * factor)));
                
                // Convert back to hex
                return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
            }
            
            updateColorPickerSelection(selectedColor) {
                const colorOptions = document.querySelectorAll('.color-option:not(.color-option--custom)');
                colorOptions.forEach(option => {
                    const optionColor = option.style.backgroundColor;
                    const isSelected = option.onclick.toString().includes(selectedColor);
                    
                    if (isSelected) {
                        option.classList.add('color-option--selected');
                        if (!option.querySelector('.color-checkmark')) {
                            option.innerHTML = '<span class="color-checkmark">✓</span>';
                        }
                    } else {
                        option.classList.remove('color-option--selected');
                        const checkmark = option.querySelector('.color-checkmark');
                        if (checkmark) checkmark.remove();
                    }
                });
            }
            
            openCustomColorPicker() {
                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.value = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
                colorInput.style.display = 'none';
                
                colorInput.addEventListener('change', (e) => {
                    this.selectColor(e.target.value);
                    document.body.removeChild(colorInput);
                });
                
                document.body.appendChild(colorInput);
                colorInput.click();
            }
            
            loadTheme() {
                const savedColor = this.data.globalSettings.themeColor;
                if (savedColor) {
                    this.selectColor(savedColor);
                }
            }
            
            loadDisplayMode() {
                const savedMode = this.data.globalSettings.displayMode || 'numbers';
                document.body.classList.add(`display-mode-${savedMode}`);
            }
            
            loadCustomTitle() {
                const customTitle = localStorage.getItem('stackmap_custom_title');
                const titleElement = document.getElementById('mainTitle');
                const logoElement = document.querySelector('.stackmap-logo');
                
                if (customTitle && titleElement) {
                    titleElement.textContent = customTitle;
                    // Hide logo if title is not StackMap
                    if (logoElement) {
                        logoElement.style.display = 'none';
                    }
                } else if (logoElement) {
                    // Ensure logo is visible when title is StackMap
                    logoElement.style.display = '';
                }
            }
            
            loadHeaderPosition() {
                const savedPosition = this.data.globalSettings.headerPosition;
                if (savedPosition === 'bottom') {
                    this.setHeaderPosition('bottom');
                } else {
                    // Ensure FABs are in correct position on load even for default 'top'
                    this.setHeaderPosition('top');
                }
            }
            
            // ===== DATA PERSISTENCE =====
            loadData() {
                try {
                    // First check if we've already migrated
                    const migrationFlag = localStorage.getItem('stackmap_migration_completed');
                    
                    // Check for old format data (version 1.0) from the previous app
                    if (!migrationFlag) {
                        // Look for common localStorage keys from the old app
                        const possibleKeys = [
                            'stackMapData',
                            'stackmap_data',
                            'stackmap-data',
                            'stackMapUserData',
                            'stackmap'
                        ];
                        
                        // Also check all keys that might contain old data
                        const allKeys = Object.keys(localStorage);
                        const oldDataKeys = allKeys.filter(key => 
                            (key.toLowerCase().includes('stackmap') || possibleKeys.includes(key)) && 
                            !key.includes('_v3') && 
                            !key.includes('migration') &&
                            !key.includes('theme_color') &&
                            !key.includes('custom_title') &&
                            !key.includes('header_position')
                        );
                        
                        // Look for the old format data structure
                        for (const key of oldDataKeys) {
                            try {
                                const data = JSON.parse(localStorage.getItem(key));
                                if (data && data.version === "1.0" && data.users && data.users.profiles) {
                                    // console.log('Found old format data, migrating...');
                                    
                                    // Backup the old data first
                                    localStorage.setItem('stackmap_backup_pre_migration', JSON.stringify(data));
                                    
                                    // Perform migration
                                    this.convertAndImportOldFormat(data);
                                    
                                    // Set migration flag
                                    localStorage.setItem('stackmap_migration_completed', 'true');
                                    
                                    // Clean up old data to prevent confusion
                                    localStorage.removeItem(key);
                                    
                                    // console.log('Migration completed successfully');
                                    
                                    // Show a brief notification
                                    this.showMigrationNotification();
                                    
                                    return; // Exit after successful migration
                                }
                            } catch (e) {
                                // Skip invalid data
                            }
                        }
                    }
                    
                    const saved = localStorage.getItem('stackmap_data_v3');
                    if (saved) {
                        const loadedData = JSON.parse(saved);
                        
                        // Handle different versions
                        if (loadedData.version === 3) {
                            this.data = loadedData;
                            // Ensure templates array exists for older v3 data
                            if (!this.data.templates) {
                                this.data.templates = [];
                            }
                            
                            // Don't create default user - let setup wizard handle it
                            // if (!this.data.users || Object.keys(this.data.users).length === 0) {
                            //     this.createDefaultUser();
                            // }
                        } else {
                            // Try v2
                            const savedV2 = localStorage.getItem('stackmap_data_v2');
                            if (savedV2) {
                                this.migrateFromV2(JSON.parse(savedV2));
                            } else {
                                // Check for legacy data
                                const legacyActivities = localStorage.getItem('stackmap_simple_activities');
                                if (legacyActivities) {
                                    this.migrateFromLegacy({ activities: JSON.parse(legacyActivities) });
                                } else {
                                    // First time - don't create default user, let setup wizard handle it
                                    // this.createDefaultUser();
                                }
                            }
                        }
                    } else {
                        // Check for v2 data
                        const savedV2 = localStorage.getItem('stackmap_data_v2');
                        if (savedV2) {
                            this.migrateFromV2(JSON.parse(savedV2));
                        } else {
                            // Check for legacy data
                            const legacyActivities = localStorage.getItem('stackmap_simple_activities');
                            if (legacyActivities) {
                                this.migrateFromLegacy({ activities: JSON.parse(legacyActivities) });
                            } else {
                                // First time - don't create default user, let setup wizard handle it
                                // this.createDefaultUser();
                            }
                        }
                    }
                    
                    // Load theme and display mode
                    this.loadTheme();
                    this.loadDisplayMode();
                    this.loadHeaderPosition();
                } catch (error) {
                    console.error('Error loading data:', error);
                    
                    // Don't create default user - let setup wizard handle it
                    // if (!this.data.users || Object.keys(this.data.users).length === 0) {
                    //     this.createDefaultUser();
                    // }
                }
            }
            
            migrateFromV2(v2Data) {
                this.data = {
                    version: 3,
                    currentUserId: v2Data.currentUserId,
                    currentDay: 'today',
                    users: {},
                    globalSettings: v2Data.globalSettings || {
                        themeColor: '#667eea',
                        displayMode: 'numbers',
                        enableDayManagement: true
                    },
                    templates: v2Data.templates || []
                };
                
                // Migrate users
                Object.entries(v2Data.users).forEach(([userId, user]) => {
                    this.data.users[userId] = {
                        ...user,
                        days: {
                            today: { activities: user.activities || [] },
                            tomorrow: { activities: [] }
                        }
                    };
                    delete this.data.users[userId].activities;
                });
                
                this.saveData();
            }
            
            migrateFromLegacy(oldData) {
                // Check if we already have users to prevent duplicate migration
                if (this.data.users && Object.keys(this.data.users).length > 0) {
                    return;
                }
                
                // Create default user with legacy activities
                const userId = this.createUser('My Tasks', '😊');
                const user = this.data.users[userId];
                
                if (oldData.activities) {
                    user.days.today.activities = oldData.activities.map(act => ({
                        id: 'activity_' + (act.id || Date.now() + Math.random()),
                        text: act.title || act.text || 'Activity',
                        emoji: act.emoji || '📝',
                        time: act.time || null,
                        completed: act.completed || false,
                        pinned: false,
                        activityType: 'normal',
                        createdAt: act.createdAt || new Date().toISOString()
                    }));
                }
                
                this.saveData();
                
                // Clear legacy data to prevent re-migration
                localStorage.removeItem('stackmap_simple_activities');
            }
            
            createDefaultUser() {
                // Check if we already have a "My Tasks" user to prevent duplicates
                const existingUser = Object.values(this.data.users).find(u => u.name === 'My Tasks');
                if (existingUser) {
                    this.data.currentUserId = Object.keys(this.data.users).find(id => this.data.users[id].name === 'My Tasks');
                    return;
                }
                
                const userId = this.createUser('My Tasks', '😊');
                const user = this.data.users[userId];
                
                // Add default activities
                user.days.today.activities = [
                    {
                        id: 'activity_' + Date.now() + '_1',
                        text: 'Morning Stretch',
                        emoji: '🌞',
                        time: null,
                        completed: false,
                        pinned: false,
                        activityType: 'normal',
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'activity_' + Date.now() + '_2',
                        text: 'Brush Teeth',
                        emoji: '🦷',
                        time: null,
                        completed: false,
                        pinned: false,
                        activityType: 'normal',
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'activity_' + Date.now() + '_3',
                        text: 'Get Dressed',
                        emoji: '👕',
                        time: null,
                        completed: false,
                        pinned: false,
                        activityType: 'normal',
                        createdAt: new Date().toISOString()
                    }
                ];
                
                this.saveData();
            }
            
            saveData() {
                try {
                    localStorage.setItem('stackmap_data_v3', JSON.stringify(this.data));
                    
                    // Also save global settings separately for quick access
                    if (this.data.globalSettings.themeColor) {
                        localStorage.setItem('stackmap_theme_color', this.data.globalSettings.themeColor);
                    }
                    if (this.data.globalSettings.displayMode) {
                        localStorage.setItem('stackmap_display_mode', this.data.globalSettings.displayMode);
                    }
                    
                } catch (error) {
                    console.error('Error saving data:', error);
                }
            }
            
            // Emergency cache clear function for support
            emergencyCacheClear() {
                // console.log('Starting emergency cache clear...');
                
                // Clear all caches
                if ('caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => {
                            // console.log('Deleting cache:', name);
                            caches.delete(name);
                        });
                    });
                }
                
                // Preserve critical data
                const preserveKeys = [
                    'stackmap_data_v3', 
                    'stackmap_backup_pre_migration', 
                    'stackmap_migration_completed',
                    'stackmap_custom_title'
                ];
                
                // Clear non-critical localStorage
                const allKeys = Object.keys(localStorage);
                allKeys.forEach(key => {
                    if (!preserveKeys.includes(key)) {
                        // console.log('Removing localStorage key:', key);
                        localStorage.removeItem(key);
                    }
                });
                
                // Unregister service worker
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                        registrations.forEach(registration => {
                            registration.unregister();
                        });
                    });
                }
                
                alert('Cache cleared! The page will now reload with the latest version.');
                
                // Force hard reload
                setTimeout(() => {
                    window.location.reload(true);
                }, 500);
            }
        }
        
        // Initialize app when DOM is loaded
        let app;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                app = new StackMapApp();
                // Make emergency cache clear available globally
                window.emergencyCacheClear = () => app.emergencyCacheClear();
            });
        } else {
            app = new StackMapApp();
            // Make emergency cache clear available globally
            window.emergencyCacheClear = () => app.emergencyCacheClear();
        }
