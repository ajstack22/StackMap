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
                
                // Load data and initialize
                this.loadData();
                this.initializeElements();
                this.setupEventListeners();
                this.setupDragAndDrop();
                this.loadCustomTitle();
                this.render();
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
                        celebration: 'confetti',
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
                return this.data.users[this.data.currentUserId];
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
                if (userId === this.data.currentUserId) {
                    // Find another user to switch to
                    const userIds = Object.keys(this.data.users).filter(id => id !== userId);
                    this.data.currentUserId = userIds[0] || null;
                }
                
                delete this.data.users[userId];
                this.saveData();
                this.render();
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
                    activities.splice(index, 1);
                    this.saveData();
                    this.render();
                    return true;
                }
                return false;
            }
            
            toggleActivityComplete(activityId) {
                const user = this.getCurrentUser();
                if (!user) return;
                
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                if (activity) {
                    const wasCompleted = activity.completed;
                    activity.completed = !activity.completed;
                    this.saveData();
                    this.render();
                    
                    // Play sound if enabled and just completed
                    if (!wasCompleted && activity.completed && user.settings.soundEnabled) {
                        this.playCompletionSound();
                    }
                    
                    return true;
                }
                return false;
            }
            
            toggleActivityPin(activityId) {
                const user = this.getCurrentUser();
                if (!user) return;
                
                const activity = this.getCurrentActivities().find(a => a.id === activityId);
                if (activity) {
                    activity.pinned = !activity.pinned;
                    this.saveData();
                    this.render();
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
                    console.log('Audio not available');
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
                    console.log('Audio not available');
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
                
                // Get the dropped position
                const dropActivityId = this.getActivityIdFromCard(dropCard);
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
                // Extract activity ID from onclick or other attributes
                const onclickAttr = card.getAttribute('onclick');
                if (onclickAttr) {
                    const match = onclickAttr.match(/['"]([^'"]*activity_[^'"]*)['"]/);
                    if (match) return match[1];
                }
                
                // Check child elements for activity ID
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
                    this.activePanel = null;
                }
                
                document.body.classList.remove('panel-open');
                this.elements.backdrop.classList.remove('active');
            }
            
            // ===== CONTENT RENDERING =====
            renderPreferencesContent() {
                this.elements.preferencesContent.innerHTML = `
                    <div class="form-group">
                        <label class="form-label">User Management</label>
                        <div class="user-selector" id="userSelector">
                            ${this.getUserSelectorHTML()}
                        </div>
                        <button class="btn btn-secondary mt-1" id="addUserBtn" style="width: 100%;">
                            <span class="material-icons">person_add</span> Add User
                        </button>
                    </div>
                    
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
                        <label class="form-label">Day Management</label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="dayManagementEnabled" 
                                   ${this.data.globalSettings.enableDayManagement ? 'checked' : ''}
                                   onchange="app.toggleDayManagement(this.checked)"
                                   style="width: 20px; height: 20px;">
                            <span>Enable Today/Tomorrow</span>
                        </label>
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
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" id="soundEnabled" 
                                       ${this.getCurrentUser()?.settings?.soundEnabled ? 'checked' : ''}
                                       onchange="app.toggleSound(this.checked)"
                                       style="width: 20px; height: 20px;">
                                <span>Enable sounds</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" id="confettiEnabled" 
                                       ${this.getCurrentUser()?.settings?.celebration === 'confetti' ? 'checked' : ''}
                                       onchange="app.toggleConfetti(this.checked)"
                                       style="width: 20px; height: 20px;">
                                <span>Enable confetti celebration</span>
                            </label>
                        </div>
                    </div>
                `;
                this.setupColorPicker();
                this.setupUserManagement();
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
                                            onclick="app.switchUser('${user.id}'); app.closePanel();">
                                        <span class="user-avatar">${user.icon}</span>
                                        <span class="user-details">
                                            <span class="user-name">${user.name}</span>
                                        </span>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                        <button class="btn btn-secondary mt-1" onclick="const name = prompt('User name:'); const icon = prompt('User emoji:') || '👤'; if (name) { app.createUser(name, icon); app.renderUserDayContent(); }" style="width: 100%;">
                            <span class="material-icons">person_add</span> Add User
                        </button>
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
            
            setupUserManagement() {
                const addUserBtn = document.getElementById('addUserBtn');
                addUserBtn?.addEventListener('click', () => {
                    const name = prompt('User name:');
                    const icon = prompt('User emoji:') || '👤';
                    
                    if (name) {
                        this.createUser(name, icon);
                        this.renderPreferencesContent();
                    }
                });
            }
            
            confirmDeleteUser(userId) {
                const user = this.data.users[userId];
                if (!user) return;
                
                if (confirm(`Delete user "${user.name}"? This will remove all their activities.`)) {
                    this.deleteUser(userId);
                    this.renderPreferencesContent();
                }
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
                    this.renderPreferencesContent();
                    this.render(); // Update subtitle if this is current user
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
                    // Show validation
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
                `;
            }
            
            getEditControlsHTML() {
                return `
                    <div class="edit-section">
                        <button class="btn btn-exit-mode" id="exitEditMode">
                            <span class="material-icons">person</span> Return to User Mode
                        </button>
                    </div>
                    
                    <div class="edit-section">
                        <h3 class="edit-section-title">Activity Management</h3>
                        <div class="edit-button-group">
                            <button class="btn btn-add-activity" id="addActivityBtn">
                                <span class="material-icons">add</span> Add Activity
                            </button>
                            <button class="btn btn-secondary" id="activityLibraryBtn">
                                <span class="material-icons">library_books</span> Activity Library
                            </button>
                            <button class="btn btn-secondary" id="completeDayBtn">
                                <span class="material-icons">check_circle</span> Complete Day
                            </button>
                        </div>
                    </div>
                    
                    <div class="edit-section">
                        <h3 class="edit-section-title">Data Management</h3>
                        <div class="edit-button-group">
                            <button class="btn btn-secondary" id="exportDataBtn">
                                <span class="material-icons">file_download</span> Export Data
                            </button>
                            <button class="btn btn-secondary" id="importDataBtn">
                                <span class="material-icons">file_upload</span> Import Data
                            </button>
                        </div>
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
                        this.isEditMode = true;
                        this.renderEditContent();
                        this.render(); // Re-render cards to show edit buttons
                        this.enableDragAndDrop(); // Enable drag and drop
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
                    this.isEditMode = false;
                    document.body.classList.remove('edit-mode');
                    this.render(); // Re-render cards to hide edit buttons
                    this.closePanel();
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
                
                const exportBtn = document.getElementById('exportDataBtn');
                const importBtn = document.getElementById('importDataBtn');
                
                exportBtn?.addEventListener('click', () => {
                    this.exportData();
                });
                
                importBtn?.addEventListener('click', () => {
                    this.importData();
                });
            }
            
            // ===== DAY MANAGEMENT ACTIONS =====
            completeDay() {
                const user = this.getCurrentUser();
                if (!user) return;
                
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
                if (confirm('Delete this activity?')) {
                    this.deleteActivity(activityId);
                }
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
                    ]
                };
            }
            
            setupActivityLibrary() {
                // Set up the activity library content when panel opens
                const defaultTab = document.getElementById('defaultActivitiesTab');
                const templatesTab = document.getElementById('myTemplatesTab');
                
                if (!defaultTab || !templatesTab) return;
                
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
                    
                    this.renderMyTemplates();
                };
                
                // Show default activities by default
                this.renderDefaultActivities();
            }
            
            // Activity Library is now handled by closePanel()
            
            renderDefaultActivities() {
                const body = document.getElementById('activityLibraryBody');
                const categories = this.getDefaultActivities();
                
                body.innerHTML = Object.entries(categories).map(([category, activities]) => `
                    <div class="activity-category">
                        <h3 class="activity-category-title">${category}</h3>
                        <div class="library-activities">
                            ${activities.map(activity => `
                                <div class="library-activity" onclick="app.addActivityFromLibrary('${activity.emoji}', '${activity.text.replace(/'/g, "\\'")}', '${(activity.description || '').replace(/'/g, "\\'")}')">
                                    <div class="library-activity-emoji">${activity.emoji}</div>
                                    <div class="library-activity-title">${activity.text}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            }
            
            renderMyTemplates() {
                const body = document.getElementById('activityLibraryBody');
                const templates = this.data.templates || [];
                
                console.log('Templates in data:', templates); // Debug log
                
                if (templates.length === 0) {
                    body.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: white;">
                            <p>No saved templates yet!</p>
                            <p style="font-size: 0.9rem; margin-top: 10px; color: rgba(255,255,255,0.8);">Use the menu on any activity card to save it as a template.</p>
                        </div>
                    `;
                    return;
                }
                
                body.innerHTML = `
                    <div class="activity-category">
                        <h3 class="activity-category-title">My Templates</h3>
                        <div class="library-activities">
                            ${templates.map(template => `
                                <div class="library-activity" onclick="app.addActivityFromLibrary('${template.emoji}', '${template.text.replace(/'/g, "\\'")}', '${(template.description || '').replace(/'/g, "\\'")}')">
                                    <div class="library-activity-emoji">${template.emoji}</div>
                                    <div class="library-activity-title">${template.text}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
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
            
            // ===== EXPORT/IMPORT =====
            exportData() {
                const dataStr = JSON.stringify(this.data, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `stackmap_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
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
                            
                            if ((importedData.version === 2 || importedData.version === 3) && importedData.users) {
                                if (confirm('This will replace all current data. Continue?')) {
                                    this.data = importedData;
                                    this.saveData();
                                    this.loadTheme();
                                    this.loadDisplayMode();
                                    this.render();
                                    alert('Data imported successfully!');
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
                
                // Sort activities: pinned first, then by creation order
                const sortedActivities = [...activities].sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return 0; // Maintain original order for same pin status
                });
                
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
                             ${!isEditMode ? `onclick="app.toggleActivityComplete('${activity.id}')"`  : ''}>
                            
                            ${activity.pinned && !isEditMode ? `
                                <div class="pin-indicator">
                                    <span class="material-icons">push_pin</span>
                                </div>
                            ` : ''}
                            
                            ${displayMode === 'numbers' ? `
                                <div class="activity-number-badge" ${isEditMode ? `onclick="app.promptReorderActivity('${activity.id}', ${index + 1}, event)"` : ''}>
                                    ${index + 1}
                                </div>
                            ` : displayMode === 'time' && activity.time ? `
                                <div class="activity-number-badge">
                                    ${activity.time}
                                </div>
                            ` : displayMode === 'time' ? `
                                <div class="activity-number-badge">
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
                            
                            // Ensure we have valid data structure
                            if (!this.data.users || Object.keys(this.data.users).length === 0) {
                                this.createDefaultUser();
                            }
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
                                    // First time - create default user
                                    this.createDefaultUser();
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
                                // First time - create default user
                                this.createDefaultUser();
                            }
                        }
                    }
                    
                    // Load theme and display mode
                    this.loadTheme();
                    this.loadDisplayMode();
                    this.loadHeaderPosition();
                } catch (error) {
                    console.error('Error loading data:', error);
                    
                    // Only create default user if we don't have any data at all
                    if (!this.data.users || Object.keys(this.data.users).length === 0) {
                        this.createDefaultUser();
                    }
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
        }
        
        // Initialize app when DOM is loaded
        let app;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                app = new StackMapApp();
            });
        } else {
            app = new StackMapApp();
        }
