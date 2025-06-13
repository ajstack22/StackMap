// Menu configurations for the dynamic menu system
window.MenuConfigurations = {
    preferences: {
        id: 'preferences',
        title: 'Preferences',
        layout: 'sections',
        sections: [
            {
                type: 'custom',
                label: 'Theme Colors',
                render: function(state, menuSystem) {
                    return window.hybridPanelManager.renderColorPicker();
                }
            },
            {
                type: 'custom',
                label: 'App Title & Subtitle',
                render: function(state, menuSystem) {
                    return window.hybridPanelManager.renderTitleSubtitleEditorForPreferences();
                }
            },
            {
                type: 'custom',
                label: 'Card Display',
                render: function(state, menuSystem) {
                    return window.hybridPanelManager.renderDisplayModeSelector();
                }
            },
            {
                type: 'custom',
                label: 'Completion Indicators',
                render: function(state, menuSystem) {
                    return window.hybridPanelManager.renderCompletionToggle();
                }
            },
            {
                type: 'custom',
                render: function(state, menuSystem) {
                    return window.hybridPanelManager.renderCelebrationPreferences();
                }
            }
        ]
    },

    settings: {
        id: 'settings',
        title: 'Settings',
        layout: 'sections',
        sections: [
            {
                type: 'custom',
                render: function(state, menuSystem) {
                    const app = menuSystem.app;
                    let html = '';
                    
                    // Edit Mode toggle as segmented control
                    html += `
                        <div class="panel-section" style="padding-top: 0; padding-bottom: 20px;">
                            <label>Mode Selection</label>
                            <div class="segmented-control">
                                <button type="button" class="segment ${!app.grownupMode ? 'segment--active' : ''}" 
                                        id="viewModeBtn" data-mode="view">
                                    <span class="material-icons">visibility</span>
                                    <span>View</span>
                                </button>
                                <button type="button" class="segment ${app.grownupMode ? 'segment--active' : ''}" 
                                        id="editModeBtn" data-mode="edit">
                                    <span class="material-icons">edit</span>
                                    <span>Edit</span>
                                </button>
                            </div>
                            <div id="validationSection" style="display: none; margin-top: 16px;">
                                <div class="validation-question">
                                    <label id="validationQuestionLabel" style="color: white; font-weight: 600; margin-bottom: 8px; display: block;"></label>
                                    <input type="text" id="validationInput" class="form-field" placeholder="Type your answer" 
                                           style="margin-bottom: 12px;" autocomplete="off">
                                    <button id="validationSubmit" class="footer-button primary-button" style="width: 100%;">
                                        Submit
                                    </button>
                                    <div id="validationError" style="color: #ff6b6b; margin-top: 8px; display: none;">
                                        Incorrect answer. Please try again.
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Wrap content that should be visible based on mode
                    html += `<div id="settingsContent" style="${state.showingValidation ? 'display: none;' : ''}">`;
                    
                    // User selector with stylized current user display
                    const currentUser = app.appState.getCurrentUser();
                    html += `
                        <div class="panel-section">
                            <label>Current User</label>
                            <div class="current-user-display">
                                <span class="user-avatar">${currentUser?.icon || '👤'}</span>
                                <span class="user-name">${currentUser?.name || 'Guest'}</span>
                            </div>
                            ${app.grownupMode ? `
                                ${window.hybridPanelManager.renderUserSelector()}
                                <button class="admin-btn" style="margin-top: 12px; width: 100%;" onclick="hybridPanelManager.showUserManagement()">
                                    <span class="material-icons">manage_accounts</span>
                                    Manage Users
                                </button>
                            ` : ''}
                        </div>
                    `;
                    
                    // Day selector
                    html += `
                        <div class="panel-section">
                            <label>Day Selection</label>
                            ${window.hybridPanelManager.renderDaySelector()}
                        </div>
                    `;
                    
                    // Actions (only in edit mode)
                    if (app.grownupMode) {
                        html += `
                            <div class="panel-section">
                                <label>Actions</label>
                                <div class="admin-buttons">
                                    <button class="admin-btn" onclick="hybridPanelManager.addNewCard()">
                                        <span class="material-icons">add</span>
                                        Add Card
                                    </button>
                                    <button class="admin-btn" onclick="hybridPanelManager.showLibraryMenu()">
                                        <span class="material-icons">library_books</span>
                                        Card Library
                                    </button>
                                    <button class="admin-btn" onclick="appInstance.showCompleteDayConfirmation()">
                                        <span class="material-icons">event_available</span>
                                        Complete Day
                                    </button>
                                </div>
                            </div>
                            
                            <div class="panel-section">
                                <label>Data Tools</label>
                                <div class="admin-buttons">
                                    <button class="admin-btn" onclick="hybridPanelManager.exportData()">
                                        <span class="material-icons">download</span>
                                        Export Data
                                    </button>
                                    <button class="admin-btn" onclick="hybridPanelManager.importData()">
                                        <span class="material-icons">upload</span>
                                        Import Data
                                    </button>
                                    <button class="admin-btn" onclick="hybridPanelManager.openSyncSettings()">
                                        <span class="material-icons">cloud</span>
                                        Google Drive Sync
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                    
                    // Close the settings content div
                    html += '</div>';
                    
                    // Add event listeners
                    setTimeout(() => {
                        const viewModeBtn = document.getElementById('viewModeBtn');
                        const editModeBtn = document.getElementById('editModeBtn');
                        const validationSection = document.getElementById('validationSection');
                        const validationInput = document.getElementById('validationInput');
                        const validationSubmit = document.getElementById('validationSubmit');
                        const validationError = document.getElementById('validationError');
                        const settingsContent = document.getElementById('settingsContent');
                        
                        // View mode button
                        if (viewModeBtn) {
                            viewModeBtn.addEventListener('click', () => {
                                if (app.grownupMode) {
                                    // Exit edit mode
                                    window.hybridPanelManager.handleEditModeSwitch(false);
                                    state.showingValidation = false;
                                    validationSection.style.display = 'none';
                                    settingsContent.style.display = 'block';
                                    
                                    // Update button states
                                    viewModeBtn.classList.add('segment--active');
                                    editModeBtn.classList.remove('segment--active');
                                }
                            });
                        }
                        
                        // Edit mode button
                        if (editModeBtn) {
                            editModeBtn.addEventListener('click', () => {
                                if (!app.grownupMode) {
                                    // Show validation question
                                    state.showingValidation = true;
                                    validationSection.style.display = 'block';
                                    settingsContent.style.display = 'none';
                                    
                                    // Generate random question
                                    const questions = window.hybridPanelManager.getValidationQuestions();
                                    const randomQ = questions[Math.floor(Math.random() * questions.length)];
                                    state.currentQuestion = randomQ;
                                    
                                    document.getElementById('validationQuestionLabel').textContent = randomQ.question;
                                    validationInput.value = '';
                                    validationInput.focus();
                                    validationError.style.display = 'none';
                                }
                            });
                        }
                        
                        if (validationSubmit) {
                            const submitValidation = () => {
                                const answer = validationInput.value.trim().toUpperCase();
                                const correctAnswer = state.currentQuestion.answer.toUpperCase();
                                
                                if (answer === correctAnswer || answer === 'A') {
                                    // Correct answer
                                    window.hybridPanelManager.handleEditModeSwitch(true);
                                    state.showingValidation = false;
                                    validationSection.style.display = 'none';
                                    settingsContent.style.display = 'block';
                                    
                                    // Update button states
                                    viewModeBtn.classList.remove('segment--active');
                                    editModeBtn.classList.add('segment--active');
                                    
                                    // Refresh the panel to show edit mode content
                                    window.hybridPanelManager.refreshCurrentPanel();
                                } else {
                                    // Wrong answer
                                    validationError.style.display = 'block';
                                    validationInput.classList.add('shake');
                                    setTimeout(() => {
                                        validationInput.classList.remove('shake');
                                    }, 500);
                                }
                            };
                            
                            validationSubmit.addEventListener('click', submitValidation);
                            validationInput.addEventListener('keypress', (e) => {
                                if (e.key === 'Enter') {
                                    submitValidation();
                                }
                            });
                        }
                    }, 0);
                    
                    return html;
                }
            }
        ]
    },

    activityLibrary: {
        id: 'activityLibrary',
        title: 'Card Library',
        layout: 'flex-column',
        sections: [
            {
                type: 'custom',
                flex: 1,
                render: function(state, menuSystem) {
                    // Custom rendering for activity library
                    const app = menuSystem.app;
                    let html = '<div class="library-sections" style="height: 100%; min-height: 0;">';
                    
                    // Add hint
                    html += '<div class="library-hint">Select cards to add to your stack</div>';
                    
                    // Get libraries using the correct method
                    const userActivities = app.appState.getLibrary('user');
                    const groupActivities = app.appState.getLibrary('group');
                    const baseActivities = app.appState.getLibrary('base');
                    
                    // User Activities
                    if (userActivities && userActivities.length > 0) {
                        const isUserCollapsed = state.collapsedSections && state.collapsedSections.user;
                        html += '<div class="library-section">';
                        html += `<h4 class="collapsible-header ${isUserCollapsed ? 'collapsed' : ''}" data-section="user">
                            <span class="collapse-icon">${isUserCollapsed ? '▶' : '▼'}</span>
                            My Cards
                            <span class="section-count">(${userActivities.length})</span>
                        </h4>`;
                        html += `<div class="activity-grid ${isUserCollapsed ? 'collapsed' : ''}">`;
                        
                        userActivities.forEach((activity, index) => {
                            const id = `user-activity-${index}`;
                            const isSelected = state.selectedActivities && state.selectedActivities.user && state.selectedActivities.user.includes(index);
                            
                            html += `<div class="library-activity ${isSelected ? 'selected' : ''}" id="${id}">`;
                            html += `<input type="checkbox" ${isSelected ? 'checked' : ''} tabindex="-1" />`;
                            html += `<span class="activity-icon">${activity.icon || '📌'}</span>`;
                            html += `<span class="activity-title">${activity.title}</span>`;
                            html += '</div>';
                        });
                        
                        html += '</div></div>';
                    }
                    
                    // Group Activities
                    if (groupActivities && groupActivities.length > 0) {
                        const isGroupCollapsed = state.collapsedSections && state.collapsedSections.group;
                        html += '<div class="library-section">';
                        html += `<h4 class="collapsible-header ${isGroupCollapsed ? 'collapsed' : ''}" data-section="group">
                            <span class="collapse-icon">${isGroupCollapsed ? '▶' : '▼'}</span>
                            Group Cards
                            <span class="section-count">(${groupActivities.length})</span>
                        </h4>`;
                        html += `<div class="activity-grid ${isGroupCollapsed ? 'collapsed' : ''}">`;
                        
                        groupActivities.forEach((activity, index) => {
                            const id = `group-activity-${index}`;
                            const isSelected = state.selectedActivities && state.selectedActivities.group && state.selectedActivities.group.includes(index);
                            
                            html += `<div class="library-activity ${isSelected ? 'selected' : ''}" id="${id}">`;
                            html += `<input type="checkbox" ${isSelected ? 'checked' : ''} tabindex="-1" />`;
                            html += `<span class="activity-icon">${activity.icon || '📌'}</span>`;
                            html += `<span class="activity-title">${activity.title}</span>`;
                            html += '</div>';
                        });
                        
                        html += '</div></div>';
                    }
                    
                    // Base Activities
                    if (baseActivities && baseActivities.length > 0) {
                        const isBaseCollapsed = state.collapsedSections && state.collapsedSections.base;
                        html += '<div class="library-section">';
                        html += `<h4 class="collapsible-header ${isBaseCollapsed ? 'collapsed' : ''}" data-section="base">
                            <span class="collapse-icon">${isBaseCollapsed ? '▶' : '▼'}</span>
                            StackMap Cards
                            <span class="section-count">(${baseActivities.length})</span>
                        </h4>`;
                        html += `<div class="activity-grid ${isBaseCollapsed ? 'collapsed' : ''}">`;
                        
                        baseActivities.forEach((activity, index) => {
                            const id = `base-activity-${index}`;
                            const isSelected = state.selectedActivities && state.selectedActivities.base && state.selectedActivities.base.includes(index);
                            
                            html += `<div class="library-activity ${isSelected ? 'selected' : ''}" id="${id}">`;
                            html += `<input type="checkbox" ${isSelected ? 'checked' : ''} tabindex="-1" />`;
                            html += `<span class="activity-icon">${activity.icon || '📌'}</span>`;
                            html += `<span class="activity-title">${activity.title}</span>`;
                            html += '</div>';
                        });
                        
                        html += '</div></div>';
                    }
                    
                    html += '</div>';
                    
                    // Add click handlers after rendering
                    setTimeout(() => {
                        // Handle collapsible headers
                        document.querySelectorAll('.collapsible-header').forEach(header => {
                            header.addEventListener('click', (e) => {
                                const section = header.getAttribute('data-section');
                                if (!state.collapsedSections) {
                                    state.collapsedSections = {};
                                }
                                state.collapsedSections[section] = !state.collapsedSections[section];
                                window.hybridPanelManager.refreshCurrentPanel();
                            });
                        });
                        
                        // Re-get the libraries to ensure they're accessible in this scope
                        const userLibrary = app.appState.getLibrary('user');
                        const groupLibrary = app.appState.getLibrary('group');
                        const baseLibrary = app.appState.getLibrary('base');
                        
                        // User activities
                        userLibrary?.forEach((_, index) => {
                            const element = document.getElementById(`user-activity-${index}`);
                            if (element) {
                                element.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Save scroll position before toggling
                                    const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
                                    window.hybridPanelManager.toggleLibrarySelection('user', index);
                                    // Restore scroll position immediately
                                    window.scrollTo(0, scrollPos);
                                });
                            }
                        });
                        
                        // Group activities
                        groupLibrary?.forEach((_, index) => {
                            const element = document.getElementById(`group-activity-${index}`);
                            if (element) {
                                element.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Save scroll position before toggling
                                    const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
                                    window.hybridPanelManager.toggleLibrarySelection('group', index);
                                    // Restore scroll position immediately
                                    window.scrollTo(0, scrollPos);
                                });
                            }
                        });
                        
                        // Base activities
                        baseLibrary?.forEach((_, index) => {
                            const element = document.getElementById(`base-activity-${index}`);
                            if (element) {
                                element.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Save scroll position before toggling
                                    const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
                                    window.hybridPanelManager.toggleLibrarySelection('base', index);
                                    // Restore scroll position immediately
                                    window.scrollTo(0, scrollPos);
                                });
                            }
                        });
                    }, 0);
                    
                    return html;
                }
            }
        ],
        footer: {
            type: 'custom',
            render: function(state, menuSystem) {
                const count = state.selectedCount || 0;
                const buttonText = count === 0 ? 'Select Cards' : `Add ${count} to Day`;
                const disabled = count === 0 ? 'disabled' : '';
                
                return `
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="footer-button primary-button" ${disabled} onclick="window.hybridPanelManager.addSelectedToLibrary()">
                            ${buttonText}
                        </button>
                    </div>
                `;
            }
        }
    },

    activityForm: {
        id: 'activityForm',
        title: function(app, state) {
            return state.editingActivity ? 'Edit Card' : 'Add Card';
        },
        layout: 'sections',
        sections: [
            {
                type: 'custom',
                label: 'Card Details',
                render: function(state, menuSystem) {
                    const app = menuSystem.app;
                    const activity = state.editingActivity || {};
                    const selectedEmoji = state.selectedEmoji || activity.icon || '🎯';
                    
                    let html = '';
                    
                    // Emoji selector - large interactive button
                    html += '<div class="activity-emoji-selector">';
                    html += `<button class="emoji-button" id="activityEmojiButton" 
                            onclick="window.hybridPanelManager.showEmojiPicker()">
                        <span class="emoji-display">${selectedEmoji}</span>
                    </button>`;
                    html += `<input type="hidden" id="activityEmoji" value="${selectedEmoji}">`;
                    html += '</div>';
                    
                    // Title input
                    html += '<div class="editor-field">';
                    html += '<label for="activityTitle">Title</label>';
                    html += `<input type="text" id="activityTitle" class="form-field form-field--title" 
                            placeholder="Card name" value="${activity.title || ''}" 
                            maxlength="30" autocomplete="off" />`;
                    html += '</div>';
                    
                    // Description input
                    html += '<div class="editor-field">';
                    html += '<label for="activityDescription">Description</label>';
                    html += `<input type="text" id="activityDescription" class="form-field form-field--description" 
                            placeholder="Optional description" value="${activity.description || ''}" 
                            maxlength="50" autocomplete="off" />`;
                    html += '</div>';
                    
                    return html;
                }
            },
            {
                type: 'custom',
                label: 'Quick Select Icons',
                render: function(state, menuSystem) {
                    const selectedEmoji = state.selectedEmoji || state.editingActivity?.icon || '🎯';
                    
                    let html = '<div class="activity-icons-grid">';
                    
                    const commonIcons = ['🎯', '🏃', '💪', '🧘', '📚', '💻', '🎨', '🎵', '🍳', '🧹', '💤', '🚶', '🏋️', '📱', '✍️'];
                    commonIcons.forEach(icon => {
                        const selected = icon === selectedEmoji ? 'selected' : '';
                        html += `<button class="activity-icon-option ${selected}" 
                                data-icon="${icon}"
                                onclick="window.hybridPanelManager.selectActivityIcon('${icon}')">
                            ${icon}
                        </button>`;
                    });
                    
                    html += '</div>';
                    
                    return html;
                }
            },
            {
                type: 'custom', 
                label: 'Card Type',
                render: function(state, menuSystem) {
                    const activity = state.editingActivity || {};
                    const cardType = state.selectedCardType || activity.cardType || 'recurring';
                    
                    const CARD_TYPE_ICONS = {
                        recurring: 'repeat',
                        onetime: 'looks_one'
                    };
                    
                    const CARD_TYPE_LABELS = {
                        recurring: 'Recurring',
                        onetime: 'One-time'
                    };
                    
                    let html = '<div class="segmented-control">';
                    
                    Object.keys(CARD_TYPE_ICONS).forEach(type => {
                        const icon = CARD_TYPE_ICONS[type];
                        const label = CARD_TYPE_LABELS[type];
                        const selectedClass = cardType === type ? 'segment--active' : '';
                        
                        html += `
                            <button type="button" class="segment ${selectedClass}" 
                                    onclick="window.hybridPanelManager.selectCardType('${type}')"
                                    data-card-type="${type}">
                                <span class="material-icons">${icon}</span>
                                <span>${label}</span>
                            </button>
                        `;
                    });
                    
                    html += '</div>';
                    
                    return html;
                }
            },
            {
                type: 'custom', 
                label: 'Start Time (Optional)',
                render: function(state, menuSystem) {
                    const activity = state.editingActivity || {};
                    const time = activity.time || '';
                    
                    let html = '<div class="editor-field">';
                    html += `<input type="text" id="activityTime" class="form-field" 
                            placeholder="e.g. 8:00am, 2:30pm" value="${time}" 
                            maxlength="10" autocomplete="off" />`;
                    html += '</div>';
                    
                    return html;
                }
            }
        ],
        footer: {
            type: 'custom',
            render: function(state, menuSystem) {
                const buttonText = state.editingActivity ? 'Save Card' : 'Add Card';
                
                return `
                    <button class="footer-button primary-button" onclick="window.hybridPanelManager.saveActivity()">
                        ${buttonText}
                    </button>
                `;
            }
        }
    },

    userForm: {
        id: 'userForm',
        title: function(app, state) {
            return state.editingUser ? 'Edit User' : 'Add User';
        },
        layout: 'sections',
        sections: [
            {
                type: 'custom',
                label: 'User Profile',
                render: function(state, menuSystem) {
                    const app = menuSystem.app;
                    const user = state.editingUser || {};
                    const selectedIcon = state.selectedIcon || user.icon || '👤';
                    
                    let html = '';
                    
                    // Large icon selector button (like emoji selector in activity form)
                    html += '<div class="user-icon-selector">';
                    html += `<button class="icon-button" id="userIconButton" 
                            onclick="window.hybridPanelManager.showUserIconPicker()">
                        <span class="icon-display">${selectedIcon}</span>
                    </button>`;
                    html += `<input type="hidden" id="userIcon" value="${selectedIcon}">`;
                    html += '</div>';
                    
                    // Name input with modern styling
                    html += '<div class="editor-field">';
                    html += '<label for="userName">Name</label>';
                    html += `<input type="text" id="userName" class="form-field form-field--title" 
                            placeholder="Enter user name" value="${user.name || ''}" 
                            maxlength="20" autocomplete="off" />`;
                    html += '</div>';
                    
                    return html;
                }
            },
            {
                type: 'custom',
                label: 'Quick Select Icons',
                render: function(state, menuSystem) {
                    const selectedIcon = state.selectedIcon || state.editingUser?.icon || '👤';
                    
                    let html = '<div class="user-icons-grid">';
                    
                    const userIcons = ['👤', '👨', '👩', '👦', '👧', '🧑', '👶', '👴', '👵', '🦸', '👨‍💼', '👩‍💼', '🧑‍🎓', '👨‍🎓', '👩‍🎓'];
                    userIcons.forEach(icon => {
                        const selected = icon === selectedIcon ? 'selected' : '';
                        html += `<button class="user-icon-option ${selected}" 
                                data-icon="${icon}"
                                onclick="window.hybridPanelManager.selectUserIcon('${icon}')">
                            ${icon}
                        </button>`;
                    });
                    
                    html += '</div>';
                    
                    return html;
                }
            }
        ],
        footer: {
            type: 'custom',
            render: function(state, menuSystem) {
                const buttonText = state.editingUser ? 'Save User' : 'Add User';
                
                return `
                    <button class="footer-button primary-button" onclick="window.hybridPanelManager.saveUser()">
                        ${buttonText}
                    </button>
                `;
            }
        }
    },

    userManagement: {
        id: 'userManagement',
        title: 'User Management',
        layout: 'sections',
        sections: [
            {
                type: 'custom',
                render: function(state, menuSystem) {
                    const app = menuSystem.app;
                    let html = '<div class="user-management">';
                    
                    // Add user button
                    html += '<button class="add-user-btn" id="addUserBtn">➕ Add New User</button>';
                    
                    // User list
                    html += '<div class="user-list">';
                    
                    Object.entries(app.appState.users.profiles).forEach(([userId, user]) => {
                        const isCurrentUser = userId === app.appState.users.currentId;
                        html += `<div class="user-item ${isCurrentUser ? 'current' : ''}" data-user-id="${userId}">`;
                        html += `<span class="user-icon">${user.icon || '👤'}</span>`;
                        html += `<span class="user-name">${user.name}</span>`;
                        html += `<button class="edit-user-btn" data-user-id="${userId}">Edit</button>`;
                        html += '</div>';
                    });
                    
                    html += '</div>';
                    html += '</div>';
                    
                    // Add event handlers
                    setTimeout(() => {
                        // Add user button
                        document.getElementById('addUserBtn')?.addEventListener('click', () => {
                            window.hybridPanelManager.addNewUser();
                        });
                        
                        // Edit user buttons
                        document.querySelectorAll('.edit-user-btn').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                const userId = e.target.getAttribute('data-user-id');
                                window.hybridPanelManager.editExistingUser(userId);
                            });
                        });
                    }, 0);
                    
                    return html;
                }
            }
        ]
    },

    syncSettings: {
        id: 'syncSettings',
        title: 'Google Drive Sync',
        layout: 'sections',
        sections: [
            {
                type: 'custom',
                render: function(state, menuSystem) {
                    const app = menuSystem.app;
                    const syncEnabled = app.appState.syncSettings?.enabled || false;
                    const lastSync = app.appState.syncSettings?.lastSync;
                    
                    let html = '<div class="sync-settings">';
                    
                    // Sync status
                    html += '<div class="sync-status">';
                    if (syncEnabled) {
                        html += '<div class="status-indicator active">✓ Sync Enabled</div>';
                        if (lastSync) {
                            const date = new Date(lastSync);
                            html += `<div class="last-sync">Last sync: ${date.toLocaleString()}</div>`;
                        }
                    } else {
                        html += '<div class="status-indicator">Sync Disabled</div>';
                    }
                    html += '</div>';
                    
                    // Sync toggle
                    html += '<div class="sync-toggle">';
                    html += `<label class="toggle-switch">`;
                    html += `<input type="checkbox" id="syncToggle" ${syncEnabled ? 'checked' : ''} />`;
                    html += `<span class="toggle-slider"></span>`;
                    html += `</label>`;
                    html += `<span class="toggle-label">Enable Google Drive Sync</span>`;
                    html += '</div>';
                    
                    // Sync actions
                    if (syncEnabled) {
                        html += '<div class="sync-actions">';
                        html += '<button id="syncNowBtn" class="sync-button">Sync Now</button>';
                        html += '<button id="disconnectBtn" class="disconnect-button">Disconnect</button>';
                        html += '</div>';
                    }
                    
                    html += '</div>';
                    
                    // Add event handlers
                    setTimeout(() => {
                        document.getElementById('syncToggle')?.addEventListener('change', (e) => {
                            window.hybridPanelManager.toggleSync(e.target.checked);
                        });
                        
                        document.getElementById('syncNowBtn')?.addEventListener('click', () => {
                            window.hybridPanelManager.syncNow();
                        });
                        
                        document.getElementById('disconnectBtn')?.addEventListener('click', () => {
                            window.hybridPanelManager.disconnectSync();
                        });
                    }, 0);
                    
                    return html;
                }
            }
        ]
    }
};