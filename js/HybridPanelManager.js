// HybridPanelManager.js - Modern panel system with JavaScript state management
// Combines the best CSS design patterns with explicit JavaScript logic

class HybridPanelManager {
    constructor(app) {
        this.app = app;
        this.state = {
            leftPanelOpen: false,
            rightPanelOpen: false,
            activePanel: null,
            showingActivityForm: false,
            editingActivity: null,
            editingIndex: -1,
            showingUserForm: false,
            editingUser: null,
            editingUserId: null,
            showingSyncSettings: false
        };
        
        // Default values for new activity
        this.newActivityDefaults = {
            emoji: CONFIG.DEFAULT_EMOJI || '📝',
            cardType: 'recurring'
        };
        
        // Default values for new user
        this.newUserDefaults = {
            icon: '👤'
        };
        
        this.initializePanels();
        this.setupEventListeners();
        
        // Initialize FAB visibility (show FABs by default)
        this.handleFABVisibility(false);
        
        // Initialize mobile navigation enhancements
        this.initializeBackButtonHandling();
        this.initializeIOSEnhancements();
    }

    initializePanels() {
        // Create floating action buttons
        this.createFloatingButtons();
        
        // Create side panels
        this.createSidePanels();
        
        // Create backdrop
        this.createBackdrop();
        
        // Initialize subtitle with user's name and day
        this.updateSubtitle();
    }

    createFloatingButtons() {
        // Create left side preferences button
        const leftNav = document.createElement('nav');
        leftNav.className = 'floating-nav floating-nav--left';
        leftNav.innerHTML = `
            <button id="hybridPreferencesBtn" class="fab" 
                    aria-label="Open preferences" title="Preferences">
                <span class="material-icons">palette</span>
            </button>
        `;
        
        // Create right side management button
        const rightNav = document.createElement('nav');
        rightNav.className = 'floating-nav floating-nav--right';
        rightNav.innerHTML = `
            <button id="hybridManageBtn" class="fab" 
                    aria-label="Open management panel" title="Manage">
                <span class="material-icons">settings</span>
            </button>
        `;
        
        document.body.appendChild(leftNav);
        document.body.appendChild(rightNav);
    }

    createSidePanels() {
        // Left panel (Preferences)
        const leftPanel = document.createElement('div');
        leftPanel.id = 'hybridLeftPanel';
        leftPanel.className = 'side-panel side-panel--left';
        leftPanel.innerHTML = `
            <div class="mobile-handle" onclick="hybridPanelManager.closePanel('left')" aria-label="Close panel"></div>
            <div class="desktop-handle" onclick="hybridPanelManager.closePanel('left')" aria-label="Close panel"></div>
            <div class="side-panel__content">
                <h3>Preferences</h3>
                <div id="hybridLeftContent">
                    <!-- Content will be rendered here -->
                </div>
                <button class="panel-close" onclick="hybridPanelManager.closePanel('left')">
                    Done
                </button>
            </div>
        `;
        
        // Right panel (Management)
        const rightPanel = document.createElement('div');
        rightPanel.id = 'hybridRightPanel';
        rightPanel.className = 'side-panel side-panel--right';
        rightPanel.innerHTML = `
            <div class="mobile-handle" onclick="hybridPanelManager.closePanel('right')" aria-label="Close panel"></div>
            <div class="desktop-handle" onclick="hybridPanelManager.closePanel('right')" aria-label="Close panel"></div>
            <div class="side-panel__content">
                <h3>Manage</h3>
                <div id="hybridRightContent">
                    <!-- Content will be rendered here -->
                </div>
                <button class="panel-close" onclick="hybridPanelManager.closePanel('right')">
                    Done
                </button>
            </div>
        `;
        
        document.body.appendChild(leftPanel);
        document.body.appendChild(rightPanel);
    }

    createBackdrop() {
        const backdrop = document.createElement('div');
        backdrop.id = 'hybridBackdrop';
        backdrop.className = 'panel-backdrop';
        backdrop.addEventListener('click', () => this.closeAllPanels());
        document.body.appendChild(backdrop);
    }

    setupEventListeners() {
        // Floating button handlers
        document.getElementById('hybridPreferencesBtn').addEventListener('click', () => {
            this.togglePanel('left');
        });
        
        document.getElementById('hybridManageBtn').addEventListener('click', () => {
            this.togglePanel('right');
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.activePanel) {
                this.closeAllPanels();
            }
            
            // Enter key support for validation input
            if (e.key === 'Enter') {
                const validationInput = document.getElementById('hybridValidationInput');
                if (validationInput && document.activeElement === validationInput) {
                    e.preventDefault();
                    this.checkValidationAnswer();
                }
            }
        });
        
        // Mobile swipe-down to close
        this.setupSwipeToClose();
        
        // Handle window resize for platform-specific behavior
        window.addEventListener('resize', () => {
            // Update FAB visibility based on current state and new screen size
            this.handleFABVisibility(this.state.activePanel !== null);
        });
    }

    togglePanel(side) {
        if (this.state.activePanel === side) {
            this.closePanel(side);
        } else {
            this.openPanel(side);
        }
    }

    openPanel(side) {
        // NEW: Push history state BEFORE opening panel (Android back button)
        this.pushBackButtonState('panel_opened', side);
        
        // Close other panel first
        this.closeAllPanels();
        
        // Update state
        this.state[`${side}PanelOpen`] = true;
        this.state.activePanel = side;
        
        // Update UI
        const panel = document.getElementById(`hybrid${side.charAt(0).toUpperCase() + side.slice(1)}Panel`);
        const button = document.getElementById(`hybrid${side === 'left' ? 'Preferences' : 'Manage'}Btn`);
        const backdrop = document.getElementById('hybridBackdrop');
        
        panel.classList.add('open');
        button.classList.add('fab--active');
        backdrop.classList.add('active');
        
        // Platform-specific FAB behavior
        this.handleFABVisibility(true);
        
        // Render content
        this.renderPanelContent(side);
        
        // Focus validation input if opening management panel in view mode
        if (side === 'right' && !this.app.grownupMode) {
            setTimeout(() => {
                const validationInput = document.getElementById('hybridValidationInput');
                if (validationInput) {
                    validationInput.focus();
                }
            }, 300); // Small delay to ensure panel animation is complete
        }
        
        // Mobile scroll lock
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
        
        // NEW: iOS-specific enhancements
        if (this.isIOS) {
            // Mark navigation help as shown since user found panels
            this.markIOSNavigationHelpShown();
            
            // Hide any navigation hints
            const navHint = document.querySelector('.ios-nav-hint');
            if (navHint) {
                navHint.style.display = 'none';
            }
        }
        
        console.log(`Opened ${side} panel`);
    }

    closePanel(side) {
        // Update state
        this.state[`${side}PanelOpen`] = false;
        if (this.state.activePanel === side) {
            this.state.activePanel = null;
        }
        
        // Update UI
        const panel = document.getElementById(`hybrid${side.charAt(0).toUpperCase() + side.slice(1)}Panel`);
        const button = document.getElementById(`hybrid${side === 'left' ? 'Preferences' : 'Manage'}Btn`);
        
        panel.classList.remove('open');
        button.classList.remove('fab--active');
        
        // Hide backdrop if no panels are open
        if (!this.state.leftPanelOpen && !this.state.rightPanelOpen) {
            document.getElementById('hybridBackdrop').classList.remove('active');
            
            // Platform-specific FAB behavior - show FABs when all panels closed
            this.handleFABVisibility(false);
            
            // Restore mobile scroll
            if (window.innerWidth <= 768) {
                document.body.style.overflow = '';
            }
        }
        
        console.log(`Closed ${side} panel`);
    }

    closeAllPanels() {
        if (this.state.leftPanelOpen) this.closePanel('left');
        if (this.state.rightPanelOpen) this.closePanel('right');
        
        // Ensure FABs are shown when all panels are closed
        if (!this.state.leftPanelOpen && !this.state.rightPanelOpen) {
            this.handleFABVisibility(false);
        }
    }

    renderPanelContent(side) {
        const contentDiv = document.getElementById(`hybrid${side.charAt(0).toUpperCase() + side.slice(1)}Content`);
        
        if (side === 'left') {
            contentDiv.innerHTML = this.renderPreferencesContent();
        } else {
            contentDiv.innerHTML = this.renderManagementContent();
            
            // Setup input event listeners after rendering
            if (this.app.grownupMode) {
                setTimeout(() => {
                    this.setupTitleSubtitleInputs();
                }, 0);
            }
        }
    }

    renderPreferencesContent() {
        const currentUser = this.app.appState.getCurrentUser();
        const settings = this.app.appState.settings;
        
        return `
            <div class="panel-section">
                <label>Theme Colors</label>
                ${this.renderColorPicker()}
            </div>
            
            <div class="panel-section">
                <label>Card Display</label>
                ${this.renderDisplayModeSelector()}
            </div>
            
            <div class="panel-section">
                <label>Completion Indicators</label>
                ${this.renderCompletionToggle()}
            </div>
        `;
    }

    renderManagementContent() {
        const allUsers = this.app.appState.getAllUsers();
        
        // If showing activity form, render that instead
        if (this.state.showingActivityForm) {
            return this.renderActivityForm();
        }
        
        // If showing user form, render that instead
        if (this.state.showingUserForm) {
            return this.renderUserForm();
        }
        
        // If showing sync settings, render that instead
        if (this.state.showingSyncSettings) {
            return this.renderSyncSettings();
        }
        
        // Always show user and day selection at the top
        let content = `
            <div class="panel-section">
                <label>Current User</label>
                ${this.renderUserSelector()}
            </div>
            
            <div class="panel-section">
                <label>Day Selection</label>
                ${this.renderDaySelector()}
            </div>
        `;
        
        if (!this.app.grownupMode) {
            // View mode: Add validation section for edit functions
            content += `
                <div class="panel-section">
                    <label>Edit Functions</label>
                    ${this.renderValidationSection()}
                </div>
            `;
        } else {
            // Edit mode: Show edit functions
            content += `
                <div class="panel-section">
                    <label>Edit Mode</label>
                    ${this.renderViewModeButton()}
                </div>
                
                <div class="panel-section">
                    ${this.renderTitleSubtitleEditor()}
                </div>
                
                <div class="panel-section">
                    <label>Admin Tools</label>
                    ${this.renderAdminButtons()}
                </div>
            `;
        }
        
        return content;
    }

    renderColorPicker() {
        const currentColor = this.app.appState.settings.backgroundColor;
        const isMobile = window.innerWidth <= 768;
        
        // Rainbow-organized color palette (4 full rows) with colors dark enough for white text
        const rainbowColors = [
            // ROW 1: Reds to Oranges to Yellows
            '#DC143C', // Crimson Red
            '#E91E63', // Pink/Magenta
            '#FF5722', // Deep Orange
            '#FF8F00', // Dark Orange
            '#F57C00', // Amber
            '#FBC02D', // Dark Yellow
            
            // ROW 2: Greens to Blues to Teals
            '#689F38', // Light Green (dark enough)
            '#388E3C', // Green
            '#00695C', // Dark Teal
            '#0097A7', // Cyan (darker)
            '#1976D2', // Blue
            '#303F9F', // Indigo
            
            // ROW 3: Purples to Browns to Greys
            '#512DA8', // Deep Purple
            '#7B1FA2', // Purple
            '#C2185B', // Deep Pink
            '#5D4037', // Brown
            '#455A64', // Blue Grey (darker)
            '#424242', // Dark Grey
            
            // ROW 4: Additional colors + Custom picker
            '#B71C1C', // Dark Red
            '#4A148C', // Deep Purple
            '#1A237E', // Deep Blue
            '#0D5302', // Dark Green
            '#3E2723', // Dark Brown
            '#000000'  // Custom color picker (palette icon) - last position
        ];
        
        const isCustomColor = !rainbowColors.slice(0, -1).includes(currentColor);
        
        return `
            <div class="color-grid">
                ${rainbowColors.map(color => {
                    if (color === '#000000') {
                        // Custom color picker
                        const displayColor = isCustomColor ? currentColor : '#000000';
                        return `
                            <button class="color-option color-option--custom ${isCustomColor ? 'color-option--selected' : ''}"
                                    style="background: ${displayColor}; position: relative;"
                                    onclick="hybridPanelManager.openCustomColorPicker()"
                                    aria-label="Custom color picker">
                                <span class="material-icons" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: ${isMobile ? '14px' : '18px'}; text-shadow: 0 0 3px rgba(0,0,0,0.8);">palette</span>
                            </button>
                        `;
                    } else {
                        // Regular color swatches
                        const isSelected = color === currentColor && !isCustomColor;
                        return `
                            <button class="color-option ${isSelected ? 'color-option--selected' : ''}"
                                    style="background: ${color};"
                                    onclick="hybridPanelManager.selectColor('${color}')"
                                    aria-label="Select ${color} theme">
                                ${isSelected ? '<span class="color-checkmark">✓</span>' : ''}
                            </button>
                        `;
                    }
                }).join('')}
            </div>
        `;
    }

    renderDisplayModeSelector() {
        const currentMode = this.getUserSetting('displayMode') || 'numbers';
        
        return `
            <div class="segmented-control" data-control="displayMode">
                <button class="segment ${currentMode === 'none' ? 'segment--active' : ''}" 
                        onclick="hybridPanelManager.selectDisplayMode('none')"
                        aria-pressed="${currentMode === 'none'}">
                    <span class="material-icons">visibility_off</span>
                    <span>None</span>
                </button>
                <button class="segment ${currentMode === 'numbers' ? 'segment--active' : ''}" 
                        onclick="hybridPanelManager.selectDisplayMode('numbers')"
                        aria-pressed="${currentMode === 'numbers'}">
                    <span class="material-icons">format_list_numbered</span>
                    <span>Numbers</span>
                </button>
                <button class="segment ${currentMode === 'times' ? 'segment--active' : ''}" 
                        onclick="hybridPanelManager.selectDisplayMode('times')"
                        aria-pressed="${currentMode === 'times'}">
                    <span class="material-icons">schedule</span>
                    <span>Times</span>
                </button>
            </div>
        `;
    }

    renderCompletionToggle() {
        const showIndicators = this.getUserSetting('showCompletionIndicators') !== false;
        
        return `
            <div class="segmented-control" data-control="completion">
                <button class="segment ${!showIndicators ? 'segment--active' : ''}" 
                        onclick="hybridPanelManager.toggleCompletionIndicators(false)"
                        aria-pressed="${!showIndicators}">
                    <span class="material-icons">visibility_off</span>
                    <span>Off</span>
                </button>
                <button class="segment ${showIndicators ? 'segment--active' : ''}" 
                        onclick="hybridPanelManager.toggleCompletionIndicators(true)"
                        aria-pressed="${showIndicators}">
                    <span class="material-icons">check_circle</span>
                    <span>On</span>
                </button>
            </div>
        `;
    }
    
    renderUserSelector() {
        const currentUser = this.app.appState.getCurrentUser();
        const allUsers = this.app.appState.getAllUsers();
        
        return `
            <div class="user-selector-grid">
                ${allUsers.map(user => `
                    <button class="user-option ${user.id === currentUser.id ? 'user-option--active' : ''}" 
                            onclick="hybridPanelManager.selectUser('${user.id}')"
                            title="${user.name}">
                        <span class="user-icon">${user.icon || '👤'}</span>
                        <span class="user-name">${user.name}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    renderDaySelector() {
        const currentDay = this.app.appState.ui.currentDay || 'today';
        
        return `
            <div class="segmented-control" data-control="day">
                <button class="segment ${currentDay === 'today' ? 'segment--active' : ''}" 
                        onclick="hybridPanelManager.selectDay('today')"
                        aria-pressed="${currentDay === 'today'}">
                    <span class="material-icons">today</span>
                    <span>Today</span>
                </button>
                <button class="segment ${currentDay === 'tomorrow' ? 'segment--active' : ''}" 
                        onclick="hybridPanelManager.selectDay('tomorrow')"
                        aria-pressed="${currentDay === 'tomorrow'}">
                    <span class="material-icons">event</span>
                    <span>Tomorrow</span>
                </button>
            </div>
        `;
    }


    renderValidationSection() {
        // Get a random validation question
        const questions = [
            { question: "What's the first letter of the alphabet?", answer: "A" },
            { question: "What comes after 2?", answer: "3" },
            { question: "How many days are in a week?", answer: "7" },
            { question: "What color do you get when you mix red and blue?", answer: "PURPLE" },
            { question: "What's 5 + 5?", answer: "10" },
            { question: "What's the opposite of 'hot'?", answer: "COLD" }
        ];
        
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        return `
            <div class="validation-section">
                <div class="validation-question">
                    <p>${randomQuestion.question}</p>
                </div>
                <div class="validation-input">
                    <input type="text" id="hybridValidationInput" placeholder="Type your answer" 
                           data-answer="${randomQuestion.answer.toUpperCase()}"
                           autofocus
                           style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); 
                                  border-radius: 8px; background: rgba(255,255,255,0.2); 
                                  color: white; font-size: 1rem; margin-bottom: 12px;
                                  font-family: inherit;">
                </div>
                <button class="segment segment--edit-mode" onclick="hybridPanelManager.checkValidationAnswer()"
                        style="width: 100%; background: rgba(255,255,255,0.3); border: none; 
                               border-radius: 8px; padding: 14px; color: white; font-weight: 600;
                               cursor: pointer; transition: all 0.2s ease;">
                    <span class="material-icons">edit</span>
                    <span>Enter Edit Mode</span>
                </button>
            </div>
        `;
    }
    
    renderViewModeButton() {
        return `
            <button class="segment segment--active" onclick="hybridPanelManager.exitEditMode()"
                    style="width: 100%; background: white; border: none; border-radius: 8px; 
                           padding: 14px; color: var(--primary-color); font-weight: 600;
                           cursor: pointer; transition: all 0.2s ease;">
                <span class="material-icons">visibility</span>
                <span>Return to View Mode</span>
            </button>
        `;
    }

    renderAdminButtons() {
        return `
            <div class="admin-buttons">
                <button class="admin-btn" onclick="hybridPanelManager.addNewCard()">
                    <span class="material-icons">add</span>
                    Add Activity
                </button>
                <button class="admin-btn" onclick="hybridPanelManager.exportData()">
                    <span class="material-icons">download</span>
                    Export Data
                </button>
                <button class="admin-btn" onclick="hybridPanelManager.importData()">
                    <span class="material-icons">upload</span>
                    Import Data
                </button>
                <button class="admin-btn" onclick="hybridPanelManager.addNewUser()">
                    <span class="material-icons">person_add</span>
                    Add User
                </button>
                <button class="admin-btn" onclick="hybridPanelManager.openSyncSettings()">
                    <span class="material-icons">cloud_sync</span>
                    Google Drive Sync
                </button>
            </div>
        `;
    }

    /**
     * Render Activity Form for creating/editing activities
     */
    renderActivityForm() {
        const isEditing = this.state.editingIndex >= 0;
        const activity = this.state.editingActivity;
        
        // Default values for new activity
        const emoji = isEditing ? activity.icon : this.newActivityDefaults.emoji;
        const title = isEditing ? activity.title : '';
        const description = isEditing ? activity.description : '';
        const time = isEditing ? (activity.time || '') : '';
        const cardType = isEditing ? (activity.cardType || 'recurring') : this.newActivityDefaults.cardType;
        
        // Generate card type buttons
        const cardTypeButtons = Object.keys(CARD_TYPE_ICONS).map(type => {
            const icon = CARD_TYPE_ICONS[type];
            const label = CARD_TYPE_LABELS[type];
            const selectedClass = cardType === type ? 'segment--active' : '';
            
            return `
                <button type="button" class="segment ${selectedClass}" 
                        onclick="hybridPanelManager.selectCardType('${type}')"
                        data-card-type="${type}">
                    <span class="material-icons">${icon}</span>
                    <span>${label}</span>
                </button>
            `;
        }).join('');
        
        return `
            <div class="activity-form">
                <div class="panel-section">
                    <button class="admin-btn" onclick="hybridPanelManager.backToManagement()">
                        <span class="material-icons">arrow_back</span>
                        Back to Management
                    </button>
                </div>
                
                <div class="panel-section">
                    <label>${isEditing ? 'Edit Activity' : 'New Activity'}</label>
                    
                    <div class="activity-emoji-selector">
                        <button class="emoji-button" id="activityEmojiButton" 
                                onclick="hybridPanelManager.showEmojiPicker()">
                            <span class="emoji-display">${emoji}</span>
                        </button>
                        <input type="hidden" id="activityEmoji" value="${emoji}">
                    </div>
                    
                    <div class="editor-field">
                        <label for="activityTitle">Title</label>
                        <input type="text" 
                               id="activityTitle" 
                               value="${this.escapeHtml(title)}" 
                               placeholder="Activity name"
                               class="panel-input"
                               maxlength="100">
                    </div>
                    
                    <div class="editor-field">
                        <label for="activityDescription">Description</label>
                        <textarea id="activityDescription" 
                                  placeholder="Additional details (optional)"
                                  class="panel-input"
                                  rows="3"
                                  maxlength="500">${this.escapeHtml(description)}</textarea>
                    </div>
                    
                    <div class="editor-field">
                        <label for="activityTime">Time (optional)</label>
                        <input type="time" 
                               id="activityTime" 
                               value="${time}"
                               class="panel-input">
                    </div>
                </div>
                
                <div class="panel-section">
                    <label>Activity Type</label>
                    <div class="segmented-control">
                        ${cardTypeButtons}
                    </div>
                </div>
                
                <div class="panel-section">
                    <button class="save-settings-btn" onclick="hybridPanelManager.saveActivity()">
                        <span class="material-icons">check</span>
                        <span>${isEditing ? 'Update Activity' : 'Create Activity'}</span>
                    </button>
                    
                    ${isEditing ? `
                        <button class="admin-btn" style="background: rgba(255, 100, 100, 0.2); margin-top: 12px;" 
                                onclick="hybridPanelManager.deleteActivity()">
                            <span class="material-icons">delete</span>
                            Delete Activity
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render User Form for creating/editing users
     */
    renderUserForm() {
        const isEditing = this.state.editingUserId !== null;
        const user = this.state.editingUser;
        
        // Default values
        const icon = isEditing ? user.icon : this.newUserDefaults.icon;
        const name = isEditing ? user.name : '';
        
        // Common user icons
        const userIcons = ['👤', '👨', '👩', '👦', '👧', '🧑', '👶', '🧒', '👴', '👵', '🎅', '🦸', '🦹', '👮', '👷', '👨‍🎓', '👩‍🎓', '🧙', '🧛', '🧚'];
        
        return `
            <div class="user-form">
                <div class="panel-section">
                    <button class="admin-btn" onclick="hybridPanelManager.backToManagement()">
                        <span class="material-icons">arrow_back</span>
                        Back to Management
                    </button>
                </div>
                
                <div class="panel-section">
                    <label>${isEditing ? 'Edit User' : 'New User'}</label>
                    
                    <div class="user-icon-selector">
                        <button class="emoji-button" id="userIconButton" 
                                onclick="hybridPanelManager.showUserIconPicker()">
                            <span class="emoji-display">${icon}</span>
                        </button>
                        <input type="hidden" id="userIcon" value="${icon}">
                    </div>
                    
                    <div class="editor-field">
                        <label for="userName">Name</label>
                        <input type="text" 
                               id="userName" 
                               value="${this.escapeHtml(name)}" 
                               placeholder="Enter user name"
                               class="panel-input"
                               maxlength="50">
                    </div>
                </div>
                
                <div class="panel-section">
                    <label>Quick Icons</label>
                    <div class="quick-icons-grid">
                        ${userIcons.map(emoji => `
                            <button class="emoji-option" onclick="hybridPanelManager.selectUserIcon('${emoji}')">
                                ${emoji}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="panel-section">
                    <button class="save-settings-btn" onclick="hybridPanelManager.saveUser()">
                        <span class="material-icons">check</span>
                        <span>${isEditing ? 'Update User' : 'Create User'}</span>
                    </button>
                    
                    ${isEditing && this.app.appState.getAllUsers().length > 1 ? `
                        <button class="admin-btn" style="background: rgba(255, 100, 100, 0.2); margin-top: 12px;" 
                                onclick="hybridPanelManager.deleteUser()">
                            <span class="material-icons">delete</span>
                            Delete User
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Title/Subtitle Editor for Management Panel
     * Simple form-based editing that saves per user
     */
    renderTitleSubtitleEditor() {
        const currentUser = this.app.appState.getCurrentUser();
        const currentTitle = currentUser.customTitle || 'StackMap';
        const currentSubtitle = currentUser.customSubtitle || 'Routine Ready';
        
        return `
            <div class="title-subtitle-editor">
                <div class="editor-field">
                    <label for="hybridTitleInput">Title</label>
                    <input type="text" 
                           id="hybridTitleInput" 
                           value="${this.escapeHtml(currentTitle)}" 
                           placeholder="Enter app title"
                           class="panel-input"
                           maxlength="50">
                </div>
                
                <div class="editor-field">
                    <label for="hybridSubtitleInput">Subtitle</label>
                    <input type="text" 
                           id="hybridSubtitleInput" 
                           value="${this.escapeHtml(currentSubtitle)}" 
                           placeholder="Enter app subtitle"
                           class="panel-input"
                           maxlength="50">
                </div>
                
                <button class="save-settings-btn" onclick="hybridPanelManager.saveTitleSubtitle()">
                    <span class="material-icons">check</span>
                    <span>Save</span>
                </button>
            </div>
        `;
    }

    // ===== EVENT HANDLERS =====

    selectColor(color) {
        // Update app state
        this.app.appState.settings.backgroundColor = color;
        this.app.appState._triggerSave();
        
        // Apply theme
        this.app.appState.applyTheme();
        
        // Update color picker selection state
        this.updateColorPickerState(color);
        
        // Update card elements immediately
        this.updateCardColors(color);
        
        // Update logo colors
        this.updateLogoColors(color);
        
        console.log('Color changed to:', color);
    }
    
    openCustomColorPicker() {
        // Create a temporary color input
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = this.app.appState.settings.backgroundColor;
        colorInput.style.display = 'none';
        
        colorInput.addEventListener('change', (e) => {
            const selectedColor = e.target.value;
            
            // Update the custom picker appearance immediately
            this.updateCustomPickerCell(selectedColor);
            
            // Apply the color to the theme
            this.selectColor(selectedColor);
            
            // Clean up
            document.body.removeChild(colorInput);
        });
        
        // Handle blur event for better browser compatibility
        colorInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (colorInput.parentNode) {
                    document.body.removeChild(colorInput);
                }
            }, 100);
        });
        
        document.body.appendChild(colorInput);
        colorInput.click();
    }
    
    updateCustomPickerCell(color) {
        const customPicker = document.querySelector('.color-option--custom');
        if (customPicker) {
            const isMobile = window.innerWidth <= 768;
            customPicker.style.backgroundColor = color;
            customPicker.classList.add('color-option--selected');
            
            // Update the palette icon
            customPicker.innerHTML = `<span class="material-icons" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: ${isMobile ? '14px' : '18px'}; text-shadow: 0 0 3px rgba(0,0,0,0.8);">palette</span>`;
        }
    }
    
    updateColorPickerState(color) {
        const colorGrid = document.querySelector('.color-grid');
        if (!colorGrid) return;
        
        const rainbowColors = [
            '#DC143C', '#E91E63', '#FF5722', '#FF8F00', '#F57C00', '#FBC02D',
            '#689F38', '#388E3C', '#00695C', '#0097A7', '#1976D2', '#303F9F',
            '#512DA8', '#7B1FA2', '#C2185B', '#5D4037', '#455A64', '#424242',
            '#B71C1C', '#4A148C', '#1A237E', '#0D5302', '#3E2723'
        ];
        
        const isCustomColor = !rainbowColors.includes(color);
        
        // Clear all selections
        colorGrid.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('color-option--selected');
            const checkmark = option.querySelector('.color-checkmark');
            if (checkmark) checkmark.remove();
        });
        
        // Handle custom color picker
        const customPicker = colorGrid.querySelector('.color-option--custom');
        if (customPicker) {
            if (isCustomColor) {
                customPicker.style.backgroundColor = color;
                customPicker.classList.add('color-option--selected');
            } else {
                customPicker.style.backgroundColor = '#000000';
                customPicker.classList.remove('color-option--selected');
            }
        }
        
        // Handle regular color options
        if (!isCustomColor) {
            const selectedOption = Array.from(colorGrid.querySelectorAll('.color-option'))
                .find(option => {
                    const style = option.getAttribute('style');
                    return style && style.includes(color) && !option.classList.contains('color-option--custom');
                });
                
            if (selectedOption) {
                selectedOption.classList.add('color-option--selected');
                selectedOption.innerHTML += '<span class="color-checkmark">✓</span>';
            }
        }
    }
    
    updateCardColors(color) {
        // Update card numbers with new theme color
        document.querySelectorAll('.card__number').forEach(numberElement => {
            numberElement.style.background = color;
        });
        
        // Update time pills with new theme color
        document.querySelectorAll('.card__time-pill').forEach(timePill => {
            timePill.style.background = color;
        });
        
        // Update edit mode time pills
        document.querySelectorAll('.card__time-pill--edit').forEach(editTimePill => {
            editTimePill.style.background = color;
        });
    }
    
    updateLogoColors(primaryColor) {
        // Create darker variant for bottom rect
        const hex = primaryColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Create darker color for gradient effect
        const darkerR = Math.max(0, r - 60);
        const darkerG = Math.max(0, g - 60);
        const darkerB = Math.max(0, b - 60);
        const darkerColor = `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
        
        // Update all logo instances
        document.querySelectorAll('svg').forEach(svg => {
            const rects = svg.querySelectorAll('rect');
            if (rects.length >= 3) {
                // Top two rects use primary color
                rects[0].setAttribute('fill', primaryColor);
                rects[1].setAttribute('fill', primaryColor);
                // Bottom rect uses darker color
                rects[2].setAttribute('fill', darkerColor);
            }
        });
    }

    selectDisplayMode(mode) {
        // Update both global and current user settings
        const currentUser = this.app.appState.getCurrentUser();
        if (currentUser) {
            currentUser.settings = currentUser.settings || {};
            currentUser.settings.displayMode = mode;
        }
        this.app.appState.settings.displayMode = mode;
        this.app.appState._triggerSave();
        
        // Re-render to update button states
        this.renderPanelContent('left');
        
        // Update cards
        if (this.app.renderer) {
            this.app.renderer.renderCards();
        }
        
        console.log('Display mode changed to:', mode);
    }

    toggleCompletionIndicators(show) {
        // Update both global and current user settings
        const currentUser = this.app.appState.getCurrentUser();
        if (currentUser) {
            currentUser.settings = currentUser.settings || {};
            currentUser.settings.showCompletionIndicators = show;
        }
        this.app.appState.settings.showCompletionIndicators = show;
        this.app.appState._triggerSave();
        
        // Re-render to update button states
        this.renderPanelContent('left');
        
        // Update cards
        if (this.app.renderer) {
            this.app.renderer.renderCards();
        }
        
        console.log('Completion indicators toggled to:', show);
    }
    
    selectUser(userId) {
        if (this.app.appState.users.profiles[userId]) {
            this.app.appState.switchUser(userId);
            this.app.render();
            this.app.initializeTitleSubtitle(); // Update title and subtitle
            
            // Re-render both panels to show updated selection
            if (this.state.leftPanelOpen) {
                this.renderPanelContent('left');
            }
            if (this.state.rightPanelOpen) {
                this.renderPanelContent('right');
            }
            
            console.log('Switched to user:', userId);
        }
    }
    
    selectDay(day) {
        this.app.appState.ui.currentDay = day;
        this.app.appState._triggerSave();
        this.app.render();
        this.app.initializeTitleSubtitle(); // Update title and subtitle
        
        // Re-render both panels to show updated selection
        if (this.state.leftPanelOpen) {
            this.renderPanelContent('left');
        }
        if (this.state.rightPanelOpen) {
            this.renderPanelContent('right');
        }
        
        console.log('Switched to day:', day);
    }
    
    updateSubtitle() {
        const currentUser = this.app.appState.getCurrentUser();
        const currentDay = this.app.appState.ui.currentDay || 'today';
        const dayText = currentDay === 'today' ? 'Today' : 'Tomorrow';
        
        // Update subtitle to show user's name and day
        const subtitle = document.getElementById('subtitle');
        if (subtitle) {
            subtitle.textContent = `${currentUser.name}'s ${dayText}`;
        }
    }


    checkValidationAnswer() {
        const input = document.getElementById('hybridValidationInput');
        const userAnswer = input.value.trim().toUpperCase();
        const correctAnswer = input.getAttribute('data-answer');
        
        if (userAnswer === correctAnswer || userAnswer === '') {
            // Correct answer or empty (shortcut) - enter edit mode
            this.app.enterGrownupMode();
            
            // Re-render management panel to show edit mode UI
            this.renderPanelContent('right');
            
            console.log('Validation successful - entered edit mode');
        } else {
            // Wrong answer - clear input and show feedback
            input.value = '';
            input.style.border = '2px solid rgba(255, 100, 100, 0.8)';
            input.placeholder = 'Try again...';
            
            setTimeout(() => {
                input.style.border = '2px solid rgba(255,255,255,0.3)';
                input.placeholder = 'Type your answer';
            }, 2000);
        }
    }
    
    exitEditMode() {
        this.app.exitGrownupMode();
        
        // NEW: Close any open panels when exiting edit mode
        this.closeAllPanels();
        
        console.log('Exited edit mode and closed panels');
    }

    // Admin actions
    addNewCard() {
        // Don't close panels - show activity form in the same panel
        this.state.showingActivityForm = true;
        this.state.editingActivity = null;
        this.state.editingIndex = -1;
        
        // Re-render the management panel with activity form
        this.renderPanelContent('right');
        
        // Focus on title input after rendering
        setTimeout(() => {
            const titleInput = document.getElementById('activityTitle');
            if (titleInput) {
                titleInput.focus();
            }
        }, 100);
    }

    exportData() {
        this.closeAllPanels();
        // Delegate to existing functionality
        if (this.app.exportData) {
            this.app.exportData();
        }
    }

    importData() {
        this.closeAllPanels();
        // Trigger file input
        document.getElementById('fileInput')?.click();
    }

    addNewUser() {
        // Don't close panels - show user form in the same panel
        this.state.showingUserForm = true;
        this.state.editingUser = null;
        this.state.editingUserId = null;
        
        // Re-render the management panel with user form
        this.renderPanelContent('right');
        
        // Focus on name input after rendering
        setTimeout(() => {
            const nameInput = document.getElementById('userName');
            if (nameInput) {
                nameInput.focus();
            }
        }, 100);
    }

    /**
     * Save title/subtitle from panel inputs
     */
    saveTitleSubtitle() {
        const titleInput = document.getElementById('hybridTitleInput');
        const subtitleInput = document.getElementById('hybridSubtitleInput');
        
        if (!titleInput || !subtitleInput) {
            console.error('Title/subtitle inputs not found');
            return;
        }
        
        // Get values and sanitize
        const newTitle = this.sanitizeText(titleInput.value.trim() || 'StackMap', 50);
        const newSubtitle = this.sanitizeText(subtitleInput.value.trim() || 'Routine Ready', 50);
        
        // Update current user settings
        const currentUser = this.app.appState.getCurrentUser();
        currentUser.customTitle = newTitle;
        currentUser.customSubtitle = newSubtitle;
        
        // Update app settings for consistency
        this.app.appState.settings.title = newTitle;
        this.app.appState.settings.subtitle = newSubtitle;
        this.app.appState.settings.isDefaultTitle = (newTitle === 'StackMap');
        this.app.appState.settings.isDefaultSubtitle = (newSubtitle === 'Routine Ready');
        
        // Persist to localStorage
        this.app.appState._triggerSave();
        
        // Update header elements immediately
        this.updateHeaderElements(newTitle, newSubtitle);
        
        // Update browser tab title
        this.app.updateTabTitle();
        
        // Update logo visibility
        this.app.updateLogoVisibility(newTitle);
        
        // Visual feedback
        this.showSaveSuccess();
        
        console.log('Title/subtitle updated from management panel:', { title: newTitle, subtitle: newSubtitle });
    }


    /**
     * Update header elements from panel
     */
    updateHeaderElements(title, subtitle) {
        const mainTitle = document.getElementById('mainTitle');
        const mainSubtitle = document.getElementById('subtitle');
        
        if (mainTitle) mainTitle.textContent = title;
        if (mainSubtitle) mainSubtitle.textContent = subtitle;
        
        // Update any duplicate header elements if they exist
        const fixedTitle = document.getElementById('fixedTitle');
        const fixedSubtitle = document.getElementById('fixedSubtitle');
        
        if (fixedTitle) fixedTitle.textContent = title;
        if (fixedSubtitle) fixedSubtitle.textContent = subtitle;
    }

    /**
     * Show save success feedback
     */
    showSaveSuccess() {
        const saveBtn = document.querySelector('.save-settings-btn');
        if (saveBtn) {
            const originalContent = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="material-icons">check_circle</span><span>Saved!</span>';
            saveBtn.style.background = 'rgba(76, 175, 80, 0.3)';
            
            setTimeout(() => {
                saveBtn.innerHTML = originalContent;
                saveBtn.style.background = '';
            }, 2000);
        }
    }

    /**
     * Setup input handling - Enter key to save
     */
    setupTitleSubtitleInputs() {
        const titleInput = document.getElementById('hybridTitleInput');
        const subtitleInput = document.getElementById('hybridSubtitleInput');
        
        if (titleInput) {
            // Save on Enter key
            titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveTitleSubtitle();
                }
            });
        }
        
        if (subtitleInput) {
            // Save on Enter key
            subtitleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveTitleSubtitle();
                }
            });
        }
    }

    /**
     * Utility: Text sanitization
     */
    sanitizeText(text, maxLength) {
        return text.replace(/[<>]/g, '').substring(0, maxLength).trim();
    }

    /**
     * Activity form methods
     */
    editActivity(activity, index) {
        // Open right panel and show activity form in edit mode
        this.state.showingActivityForm = true;
        this.state.editingActivity = activity;
        this.state.editingIndex = index;
        
        // Open the management panel
        this.openPanel('right');
        
        // Focus on title input after rendering
        setTimeout(() => {
            const titleInput = document.getElementById('activityTitle');
            if (titleInput) {
                titleInput.focus();
            }
        }, 300);
    }
    
    backToManagement() {
        // Reset all form states
        this.state.showingActivityForm = false;
        this.state.editingActivity = null;
        this.state.editingIndex = -1;
        this.state.showingUserForm = false;
        this.state.editingUser = null;
        this.state.editingUserId = null;
        this.state.showingSyncSettings = false;
        this.renderPanelContent('right');
    }
    
    selectCardType(type) {
        this.newActivityDefaults.cardType = type;
        
        // Update button states
        document.querySelectorAll('.segmented-control .segment').forEach(btn => {
            const btnType = btn.getAttribute('data-card-type');
            if (btnType === type) {
                btn.classList.add('segment--active');
            } else {
                btn.classList.remove('segment--active');
            }
        });
    }
    
    showEmojiPicker() {
        const currentEmoji = document.getElementById('activityEmoji').value;
        const button = document.getElementById('activityEmojiButton');
        
        // Create a simple emoji picker inline
        const emojiGrid = document.createElement('div');
        emojiGrid.className = 'emoji-picker-inline';
        emojiGrid.innerHTML = `
            <div class="emoji-grid">
                ${EMOJIS.slice(0, 48).map(emoji => `
                    <button class="emoji-option" data-emoji="${emoji}">
                        ${emoji}
                    </button>
                `).join('')}
            </div>
        `;
        
        // Insert after the emoji button
        button.parentElement.appendChild(emojiGrid);
        
        // Handle emoji selection
        emojiGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-option')) {
                const selectedEmoji = e.target.getAttribute('data-emoji');
                document.getElementById('activityEmoji').value = selectedEmoji;
                button.querySelector('.emoji-display').textContent = selectedEmoji;
                this.newActivityDefaults.emoji = selectedEmoji;
                emojiGrid.remove();
            }
        });
        
        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeEmojiPicker(e) {
                if (!emojiGrid.contains(e.target) && e.target !== button) {
                    emojiGrid.remove();
                    document.removeEventListener('click', closeEmojiPicker);
                }
            });
        }, 100);
    }
    
    saveActivity() {
        const title = document.getElementById('activityTitle').value.trim();
        const description = document.getElementById('activityDescription').value.trim();
        const time = document.getElementById('activityTime').value;
        const emoji = document.getElementById('activityEmoji').value;
        const cardType = this.newActivityDefaults.cardType;
        
        if (!title) {
            alert('Please enter an activity title');
            return;
        }
        
        const activity = {
            title,
            description,
            icon: emoji,
            time: time || null,
            cardType,
            completed: false,
            visible: true
        };
        
        if (this.state.editingIndex >= 0) {
            // Update existing activity
            this.app.appState.activities[this.state.editingIndex] = {
                ...this.app.appState.activities[this.state.editingIndex],
                ...activity
            };
        } else {
            // Add new activity
            this.app.appState.activities.push(activity);
        }
        
        // Save and re-render
        this.app.appState._triggerSave();
        this.app.render();
        
        // Go back to management panel
        this.backToManagement();
        
        // Show success message
        this.showSaveSuccess();
    }
    
    deleteActivity() {
        if (this.state.editingIndex >= 0) {
            if (confirm('Are you sure you want to delete this activity?')) {
                this.app.appState.activities.splice(this.state.editingIndex, 1);
                this.app.appState._triggerSave();
                this.app.render();
                this.backToManagement();
            }
        }
    }

    /**
     * User form methods
     */
    selectUserIcon(icon) {
        document.getElementById('userIcon').value = icon;
        document.getElementById('userIconButton').querySelector('.emoji-display').textContent = icon;
        this.newUserDefaults.icon = icon;
    }
    
    showUserIconPicker() {
        const currentIcon = document.getElementById('userIcon').value;
        const button = document.getElementById('userIconButton');
        
        // Create a simple emoji picker inline
        const emojiGrid = document.createElement('div');
        emojiGrid.className = 'emoji-picker-inline';
        emojiGrid.innerHTML = `
            <div class="emoji-grid">
                ${EMOJIS.slice(0, 48).map(emoji => `
                    <button class="emoji-option" data-emoji="${emoji}">
                        ${emoji}
                    </button>
                `).join('')}
            </div>
        `;
        
        // Insert after the icon button
        button.parentElement.appendChild(emojiGrid);
        
        // Handle emoji selection
        emojiGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-option')) {
                const selectedEmoji = e.target.getAttribute('data-emoji');
                this.selectUserIcon(selectedEmoji);
                emojiGrid.remove();
            }
        });
        
        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeEmojiPicker(e) {
                if (!emojiGrid.contains(e.target) && e.target !== button) {
                    emojiGrid.remove();
                    document.removeEventListener('click', closeEmojiPicker);
                }
            });
        }, 100);
    }
    
    saveUser() {
        const name = document.getElementById('userName').value.trim();
        const icon = document.getElementById('userIcon').value;
        
        if (!name) {
            alert('Please enter a user name');
            return;
        }
        
        try {
            if (this.state.editingUserId) {
                // Update existing user
                const user = this.app.appState.users.profiles[this.state.editingUserId];
                if (user) {
                    user.name = name;
                    user.icon = icon;
                    this.app.appState._triggerSave();
                    
                    // Update UI if this is the current user
                    if (this.state.editingUserId === this.app.appState.users.currentUserId) {
                        this.app.populateUserDropdowns();
                        this.app.render();
                    }
                }
            } else {
                // Create new user
                const newUserId = this.app.appState.addUser(name, icon);
                
                // Switch to the new user
                this.app.appState.switchUser(newUserId);
                this.app.populateUserDropdowns();
                this.app.populateDrawerSelects();
                this.app.render();
            }
            
            // Go back to management panel
            this.backToManagement();
            
            // Show success message
            this.showSaveSuccess();
        } catch (error) {
            alert(error.message);
        }
    }
    
    deleteUser() {
        if (this.state.editingUserId && this.app.appState.getAllUsers().length > 1) {
            const user = this.app.appState.users.profiles[this.state.editingUserId];
            if (confirm(`Are you sure you want to delete user "${user.name}"?`)) {
                try {
                    // If deleting current user, switch to another user first
                    if (this.state.editingUserId === this.app.appState.users.currentUserId) {
                        const otherUsers = Object.keys(this.app.appState.users.profiles)
                            .filter(id => id !== this.state.editingUserId);
                        if (otherUsers.length > 0) {
                            this.app.appState.switchUser(otherUsers[0]);
                        }
                    }
                    
                    // Delete the user
                    delete this.app.appState.users.profiles[this.state.editingUserId];
                    this.app.appState._triggerSave();
                    
                    // Update UI
                    this.app.populateUserDropdowns();
                    this.app.populateDrawerSelects();
                    this.app.render();
                    
                    // Go back to management
                    this.backToManagement();
                } catch (error) {
                    alert('Error deleting user: ' + error.message);
                }
            }
        }
    }

    /**
     * Render Google Drive Sync Settings
     */
    renderSyncSettings() {
        const isSignedIn = this.app.driveSync?.isSignedIn || false;
        const isSyncing = this.app.driveSync?.isSyncing || false;
        
        return `
            <div class="sync-settings">
                <div class="panel-section">
                    <button class="admin-btn" onclick="hybridPanelManager.backToManagement()">
                        <span class="material-icons">arrow_back</span>
                        Back to Management
                    </button>
                </div>
                
                <div class="panel-section">
                    <label>Google Drive Sync</label>
                    
                    ${!isSignedIn ? `
                        <div class="sync-status-card">
                            <div class="sync-icon">
                                <span class="material-icons" style="font-size: 48px; color: rgba(255,255,255,0.8);">cloud_off</span>
                            </div>
                            <h3 style="color: white; margin: 16px 0 8px 0;">Not Connected</h3>
                            <p style="color: rgba(255,255,255,0.8); margin-bottom: 20px;">
                                Sign in to sync your StackMap data across devices
                            </p>
                            <button class="save-settings-btn" onclick="hybridPanelManager.signInToGoogle()">
                                <span class="material-icons">login</span>
                                <span>Sign in with Google</span>
                            </button>
                        </div>
                    ` : `
                        <div class="sync-status-card">
                            <div class="sync-icon">
                                <span class="material-icons" style="font-size: 48px; color: rgba(255,255,255,0.8);">cloud_done</span>
                            </div>
                            <h3 style="color: white; margin: 16px 0 8px 0;">Connected</h3>
                            <p style="color: rgba(255,255,255,0.8); margin-bottom: 20px;">
                                Your data syncs automatically across all your devices
                            </p>
                            
                            <div class="sync-actions" style="display: flex; flex-direction: column; gap: 12px;">
                                <button class="admin-btn" onclick="hybridPanelManager.syncNow()" 
                                        ${isSyncing ? 'disabled' : ''}>
                                    <span class="material-icons ${isSyncing ? 'spinning' : ''}">sync</span>
                                    ${isSyncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                                
                                <button class="admin-btn" onclick="hybridPanelManager.downloadFromDrive()">
                                    <span class="material-icons">cloud_download</span>
                                    Download from Drive
                                </button>
                                
                                <button class="admin-btn" style="background: rgba(255, 100, 100, 0.2);" 
                                        onclick="hybridPanelManager.signOutFromGoogle()">
                                    <span class="material-icons">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    `}
                </div>
                
                <div class="panel-section">
                    <label>How Sync Works</label>
                    <div class="sync-info" style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px;">
                        <ul style="margin: 0; padding-left: 20px; color: rgba(255,255,255,0.9);">
                            <li>Your data is stored in your personal Google Drive</li>
                            <li>Changes sync automatically every 10 seconds</li>
                            <li>Work offline and sync when reconnected</li>
                            <li>All devices stay perfectly in sync</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Open sync settings
     */
    openSyncSettings() {
        // Show sync settings form in the same panel
        this.state.showingSyncSettings = true;
        this.state.showingActivityForm = false;
        this.state.showingUserForm = false;
        
        // Re-render the management panel with sync settings
        this.renderPanelContent('right');
    }

    /**
     * Google Drive sync methods
     */
    signInToGoogle() {
        if (this.app.driveSync) {
            this.app.driveSync.signIn();
            // Re-render after a delay to show status change
            setTimeout(() => {
                this.renderPanelContent('right');
            }, 1000);
        }
    }
    
    signOutFromGoogle() {
        if (confirm('Are you sure you want to sign out from Google Drive sync?')) {
            if (this.app.driveSync) {
                this.app.driveSync.signOut();
                // Re-render to show disconnected state
                setTimeout(() => {
                    this.renderPanelContent('right');
                }, 500);
            }
        }
    }
    
    syncNow() {
        if (this.app.driveSync && this.app.driveSync.isSignedIn) {
            this.app.driveSync.uploadData();
            // Re-render to show syncing state
            this.renderPanelContent('right');
            
            // Re-render again after sync completes
            setTimeout(() => {
                this.renderPanelContent('right');
            }, 3000);
        }
    }
    
    downloadFromDrive() {
        if (this.app.driveSync && this.app.driveSync.isSignedIn) {
            if (confirm('This will replace your local data with the version from Google Drive. Continue?')) {
                this.app.driveSync.downloadData();
            }
        }
    }

    /**
     * Utility: HTML escaping for security
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== HELPER METHODS =====

    handleFABVisibility(panelsOpen) {
        const isMobile = window.innerWidth <= 768;
        const floatingNavs = document.querySelectorAll('.floating-nav');
        
        floatingNavs.forEach(nav => {
            if (isMobile) {
                // Mobile: Hide FABs when panels are open
                if (panelsOpen) {
                    nav.style.opacity = '0';
                    nav.style.visibility = 'hidden';
                    nav.style.pointerEvents = 'none';
                    nav.style.transform = 'translateY(-20px)';
                    nav.style.transition = 'all 0.3s ease';
                } else {
                    nav.style.opacity = '1';
                    nav.style.visibility = 'visible';
                    nav.style.pointerEvents = 'auto';
                    nav.style.transform = 'translateY(0)';
                    nav.style.transition = 'all 0.3s ease';
                }
            } else {
                // Desktop: Always show FABs but reset styling when panels open
                nav.style.opacity = '1';
                nav.style.visibility = 'visible';
                nav.style.pointerEvents = 'auto';
                nav.style.transform = 'translateY(0)';
                
                const fabs = nav.querySelectorAll('.fab');
                fabs.forEach(fab => {
                    if (panelsOpen) {
                        // Reset to default styling
                        fab.style.background = 'rgba(255, 255, 255, 0.9)';
                        fab.style.color = 'var(--primary-color)';
                        fab.style.transform = 'scale(1)';
                        fab.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        fab.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                        
                        const icons = fab.querySelectorAll('.material-icons');
                        icons.forEach(icon => {
                            icon.style.color = 'var(--primary-color)';
                        });
                    } else {
                        // Clear inline styles to use CSS defaults
                        fab.style.background = '';
                        fab.style.color = '';
                        fab.style.transform = '';
                        fab.style.boxShadow = '';
                        fab.style.border = '';
                        
                        const icons = fab.querySelectorAll('.material-icons');
                        icons.forEach(icon => {
                            icon.style.color = '';
                        });
                    }
                });
            }
        });
    }

    getUserSetting(settingName) {
        // Try to get from current user settings first, then fall back to global settings
        const currentUser = this.app?.appState?.getCurrentUser();
        if (currentUser && currentUser.settings && currentUser.settings[settingName] !== undefined) {
            return currentUser.settings[settingName];
        }
        return this.app?.appState?.settings?.[settingName];
    }

    updateSegmentedControl(controlType, activeValue) {
        const segments = document.querySelectorAll(`[data-control="${controlType}"] .segment`);
        segments.forEach(segment => {
            const isActive = segment.onclick.toString().includes(`'${activeValue}'`);
            segment.classList.toggle('segment--active', isActive);
            segment.setAttribute('aria-pressed', isActive);
        });
    }
    
    setupSwipeToClose() {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let startTime = 0;
        let isAtTop = false;
        let isMobile = window.innerWidth <= 768;
        
        // Add touch event listeners to both panels
        ['hybridLeftPanel', 'hybridRightPanel'].forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (!panel) return;
            
            const isLeftPanel = panelId === 'hybridLeftPanel';
            
            // Check if panel is scrolled to top (mobile only)
            const checkScrollPosition = () => {
                isAtTop = panel.scrollTop <= 10; // Allow small tolerance
            };
            
            panel.addEventListener('scroll', checkScrollPosition);
            
            panel.addEventListener('touchstart', (e) => {
                if (!this.state.activePanel) return;
                
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startTime = Date.now();
                isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    checkScrollPosition();
                }
            }, { passive: true });
            
            panel.addEventListener('touchmove', (e) => {
                if (!this.state.activePanel) return;
                
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                
                if (isMobile) {
                    // Mobile: Vertical swipe down when at top
                    if (isAtTop && deltaY > 20 && Math.abs(deltaX) < Math.abs(deltaY)) {
                        // Add visual feedback - slight panel movement
                        const moveDistance = Math.min(deltaY * 0.3, 30);
                        panel.style.transform = `translateY(${moveDistance}px)`;
                    }
                } else {
                    // Desktop: Horizontal swipe gestures
                    const absX = Math.abs(deltaX);
                    const absY = Math.abs(deltaY);
                    
                    // Only handle horizontal swipes (more horizontal than vertical)
                    if (absX > absY && absX > 20) {
                        let shouldShowFeedback = false;
                        let moveDistance = 0;
                        
                        if (isLeftPanel && deltaX < -20) {
                            // Left panel: swipe left to close
                            shouldShowFeedback = true;
                            moveDistance = Math.max(deltaX * 0.3, -50);
                        } else if (!isLeftPanel && deltaX > 20) {
                            // Right panel: swipe right to close
                            shouldShowFeedback = true;
                            moveDistance = Math.min(deltaX * 0.3, 50);
                        }
                        
                        if (shouldShowFeedback) {
                            // Add visual feedback - slight panel movement
                            if (isLeftPanel) {
                                panel.style.transform = `translateX(${moveDistance}px)`;
                            } else {
                                panel.style.transform = `translateX(${moveDistance}px)`;
                            }
                        }
                    }
                }
            }, { passive: true });
            
            panel.addEventListener('touchend', (e) => {
                if (!this.state.activePanel) return;
                
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                const deltaTime = Date.now() - startTime;
                const velocityX = Math.abs(deltaX) / deltaTime;
                const velocityY = Math.abs(deltaY) / deltaTime;
                
                // Reset panel transform
                panel.style.transform = '';
                
                let shouldClose = false;
                
                if (isMobile) {
                    // Mobile: Close panel if at top, swiped down significantly, and fast enough
                    if (isAtTop && deltaY > 50 && velocityY > 0.3 && Math.abs(deltaX) < Math.abs(deltaY)) {
                        shouldClose = true;
                    }
                } else {
                    // Desktop: Close panel based on horizontal swipe direction
                    const absX = Math.abs(deltaX);
                    const absY = Math.abs(deltaY);
                    
                    // Only handle horizontal swipes
                    if (absX > absY && absX > 60 && velocityX > 0.4) {
                        if (isLeftPanel && deltaX < -60) {
                            // Left panel: swipe left to close
                            shouldClose = true;
                        } else if (!isLeftPanel && deltaX > 60) {
                            // Right panel: swipe right to close
                            shouldClose = true;
                        }
                    }
                }
                
                if (shouldClose) {
                    this.closeAllPanels();
                }
                
                // Reset values
                startX = 0;
                startY = 0;
                currentX = 0;
                currentY = 0;
                startTime = 0;
            }, { passive: true });
            
            // Add mouse event support for desktop trackpad/touchscreen gestures
            if (!isMobile) {
                let mouseStartX = 0;
                let mouseCurrentX = 0;
                let mouseStartTime = 0;
                let isMouseDown = false;
                
                panel.addEventListener('mousedown', (e) => {
                    if (!this.state.activePanel) return;
                    
                    // Don't interfere with input fields, buttons, or other interactive elements
                    const target = e.target;
                    const isInteractive = target.tagName === 'INPUT' || 
                                        target.tagName === 'TEXTAREA' || 
                                        target.tagName === 'BUTTON' ||
                                        target.tagName === 'SELECT' ||
                                        target.closest('button') ||
                                        target.closest('.segment') ||
                                        target.closest('.color-option');
                    
                    if (isInteractive) {
                        return; // Let the interaction happen normally
                    }
                    
                    mouseStartX = e.clientX;
                    mouseStartTime = Date.now();
                    isMouseDown = true;
                    
                    // Prevent text selection during swipe
                    e.preventDefault();
                }, { passive: false });
                
                panel.addEventListener('mousemove', (e) => {
                    if (!this.state.activePanel || !isMouseDown) return;
                    
                    // Don't track movement if started on an interactive element
                    if (!mouseStartX) return;
                    
                    mouseCurrentX = e.clientX;
                    const deltaX = mouseCurrentX - mouseStartX;
                    
                    // Only handle horizontal movements > 20px
                    if (Math.abs(deltaX) > 20) {
                        let shouldShowFeedback = false;
                        let moveDistance = 0;
                        
                        if (isLeftPanel && deltaX < -20) {
                            // Left panel: swipe left to close
                            shouldShowFeedback = true;
                            moveDistance = Math.max(deltaX * 0.2, -30); // Less sensitive for mouse
                        } else if (!isLeftPanel && deltaX > 20) {
                            // Right panel: swipe right to close
                            shouldShowFeedback = true;
                            moveDistance = Math.min(deltaX * 0.2, 30); // Less sensitive for mouse
                        }
                        
                        if (shouldShowFeedback) {
                            panel.style.transform = `translateX(${moveDistance}px)`;
                            panel.style.cursor = 'grabbing';
                        }
                    }
                });
                
                panel.addEventListener('mouseup', (e) => {
                    if (!this.state.activePanel || !isMouseDown) return;
                    
                    const deltaX = mouseCurrentX - mouseStartX;
                    const deltaTime = Date.now() - mouseStartTime;
                    const velocityX = Math.abs(deltaX) / deltaTime;
                    
                    // Reset panel transform and cursor
                    panel.style.transform = '';
                    panel.style.cursor = '';
                    
                    let shouldClose = false;
                    
                    // Desktop mouse: Close panel based on horizontal swipe direction
                    if (Math.abs(deltaX) > 80 && velocityX > 0.3) { // Higher threshold for mouse
                        if (isLeftPanel && deltaX < -80) {
                            // Left panel: swipe left to close
                            shouldClose = true;
                        } else if (!isLeftPanel && deltaX > 80) {
                            // Right panel: swipe right to close
                            shouldClose = true;
                        }
                    }
                    
                    if (shouldClose) {
                        this.closeAllPanels();
                    }
                    
                    // Reset values
                    mouseStartX = 0;
                    mouseCurrentX = 0;
                    mouseStartTime = 0;
                    isMouseDown = false;
                });
                
                // Handle mouse leave to reset state
                panel.addEventListener('mouseleave', () => {
                    if (isMouseDown) {
                        panel.style.transform = '';
                        panel.style.cursor = '';
                        isMouseDown = false;
                    }
                });
            }
        });
    }


    // Hide old floating buttons
    hideOldButtons() {
        const oldNav = document.getElementById('main-navigation');
        if (oldNav) {
            oldNav.style.display = 'none';
        }
    }

    // Show old floating buttons (for fallback)
    showOldButtons() {
        const oldNav = document.getElementById('main-navigation');
        if (oldNav) {
            oldNav.style.display = '';
        }
    }

    /**
     * Initialize Android back button handling
     * Sets up history manipulation to control back button behavior
     */
    initializeBackButtonHandling() {
        // Prevent immediate app exit on first back press
        this.addInitialHistoryState();
        
        // Listen for back button presses
        this.setupBackButtonListener();
        
        console.log('🔙 Android back button handling initialized');
    }

    /**
     * Add initial history state to prevent immediate app exit
     */
    addInitialHistoryState() {
        // Only add if we're at the start of history
        if (window.history.length === 1) {
            window.history.pushState({ 
                stackmap: true, 
                action: 'initial' 
            }, '', window.location.href);
            
            console.log('📱 Initial history state added for back button control');
        }
    }

    /**
     * Listen for popstate events (back button presses)
     */
    setupBackButtonListener() {
        window.addEventListener('popstate', (event) => {
            console.log('🔙 Back button pressed, state:', event.state);
            
            // Check if any panels are open
            if (this.state.leftPanelOpen || this.state.rightPanelOpen) {
                // Close the open panel instead of navigating
                this.handleBackButtonPanelClose();
                return;
            }
            
            // Check if we're in edit mode
            if (this.app.grownupMode) {
                // Exit edit mode instead of navigating
                this.handleBackButtonEditModeExit();
                return;
            }
            
            // If nothing is open, allow normal back behavior
            this.handleBackButtonDefaultBehavior(event);
        });
    }

    /**
     * Handle back button when panels are open
     */
    handleBackButtonPanelClose() {
        console.log('🔙 Closing panel with back button');
        
        // Close any open panels
        this.closeAllPanels();
        
        // Push a new state to maintain back button control
        this.pushBackButtonState('panel_closed');
    }

    /**
     * Handle back button when in edit mode
     */
    handleBackButtonEditModeExit() {
        console.log('🔙 Exiting edit mode with back button');
        
        // Exit edit mode
        this.app.exitGrownupMode();
        
        // Push a new state to maintain back button control
        this.pushBackButtonState('edit_mode_exited');
    }

    /**
     * Handle back button default behavior
     */
    handleBackButtonDefaultBehavior(event) {
        // If this is our initial state, prevent app exit
        if (event.state?.stackmap && event.state?.action === 'initial') {
            console.log('🔙 Preventing app exit, adding new history state');
            
            // Add another state to prevent immediate exit
            this.pushBackButtonState('back_pressed');
            return;
        }
        
        // Allow normal navigation if user really wants to leave
        console.log('🔙 Allowing normal back navigation');
    }

    /**
     * Push a history state for back button tracking
     */
    pushBackButtonState(action, data = null) {
        const state = {
            stackmap: true,
            action: action,
            data: data,
            timestamp: Date.now()
        };
        
        window.history.pushState(state, '', window.location.href);
        console.log('📱 Pushed history state:', state);
    }

    /**
     * Initialize iOS-specific navigation enhancements
     */
    initializeIOSEnhancements() {
        this.detectIOSMode();
        this.setupIOSGestureProtection();
        this.enhanceIOSNavigation();
        
        console.log('🍎 iOS navigation enhancements initialized');
    }

    /**
     * Detect iOS device and PWA mode
     */
    detectIOSMode() {
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isPWA = window.navigator.standalone === true;
        this.isIOSPWA = this.isIOS && this.isPWA;
        
        if (this.isIOSPWA) {
            document.body.classList.add('ios-pwa-mode');
            console.log('🍎 iOS PWA mode detected - enhanced navigation enabled');
        }
        
        if (this.isIOS) {
            document.body.classList.add('ios-device');
            console.log('🍎 iOS device detected');
        }
    }

    /**
     * Protect against accidental iOS swipe navigation during panel interactions
     */
    setupIOSGestureProtection() {
        if (!this.isIOS) return;
        
        // Prevent swipe navigation when panels are open
        document.addEventListener('touchstart', (e) => {
            // Only prevent if near screen edge AND panel is open
            const nearLeftEdge = e.touches[0].pageX < 20;
            const nearRightEdge = e.touches[0].pageX > window.innerWidth - 20;
            const panelOpen = this.state.leftPanelOpen || this.state.rightPanelOpen;
            
            if ((nearLeftEdge || nearRightEdge) && panelOpen) {
                console.log('🍎 Preventing iOS swipe navigation during panel interaction');
                e.preventDefault();
            }
        }, { passive: false });
        
        console.log('🍎 iOS gesture protection enabled');
    }

    /**
     * Enhance navigation for iOS PWA mode
     */
    enhanceIOSNavigation() {
        if (!this.isIOSPWA) return;
        
        // Add persistent navigation hints for PWA mode
        this.addIOSNavigationHints();
        
        // Ensure panels are more discoverable in PWA mode
        this.enhanceIOSPWADiscoverability();
    }

    /**
     * Add navigation hints for iOS PWA users
     */
    addIOSNavigationHints() {
        // Add subtle navigation hints in the header
        const header = document.querySelector('.app-header');
        if (header && !document.querySelector('.ios-nav-hint')) {
            const navHint = document.createElement('div');
            navHint.className = 'ios-nav-hint';
            navHint.innerHTML = '⚙️ Tap corners for options';
            navHint.style.cssText = `
                position: absolute;
                top: 5px;
                right: 10px;
                font-size: 0.7rem;
                color: rgba(255,255,255,0.6);
                pointer-events: none;
                z-index: 10;
            `;
            header.appendChild(navHint);
            
            // Hide hint after user interacts
            setTimeout(() => {
                navHint.style.opacity = '0';
                navHint.style.transition = 'opacity 1s ease';
            }, 5000);
        }
    }

    /**
     * Enhance panel discoverability for iOS PWA mode
     */
    enhanceIOSPWADiscoverability() {
        // Make floating action buttons slightly more prominent in PWA mode
        const fabs = document.querySelectorAll('.fab');
        fabs.forEach(fab => {
            fab.classList.add('ios-pwa-enhanced');
        });
        
        console.log('🍎 Enhanced iOS PWA discoverability');
    }

    /**
     * Check if user needs iOS navigation assistance
     */
    shouldShowIOSNavigationHelp() {
        // Show help if in PWA mode and user hasn't interacted recently
        return this.isIOSPWA && !localStorage.getItem('ios-nav-shown');
    }

    /**
     * Mark iOS navigation help as shown
     */
    markIOSNavigationHelpShown() {
        if (this.isIOS) {
            localStorage.setItem('ios-nav-shown', Date.now().toString());
        }
    }
}

// Global instance for onclick handlers
window.hybridPanelManager = null;