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
        title: 'Edit',
        layout: 'sections',
        sections: [
            {
                type: 'custom',
                render: function(state, menuSystem) {
                    const app = menuSystem.app;
                    let html = '';
                    
                    // Show different content based on mode
                    if (app.grownupMode) {
                        // In edit mode - show "Return to User Mode" button
                        html += `
                            <div class="panel-section" style="padding-top: 0;">
                                <div class="admin-buttons">
                                    <button type="button" class="admin-btn admin-btn--white" id="returnToViewBtn" style="font-weight: bold;">
                                        <span class="material-icons" style="font-weight: bold;">face</span>
                                        Return to User Mode
                                    </button>
                                </div>
                            </div>
                        `;
                    } else {
                        // In view mode - show validation to enter edit mode
                        html += `
                            <div class="panel-section" style="padding-top: 0; padding-bottom: 20px;">
                                <div id="validationSection">
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
                    }
                    
                    // Only show actions in edit mode
                    if (app.grownupMode) {
                        // Card Actions
                        html += `
                            <div class="panel-section">
                                <label>Card Actions</label>
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
                        `;
                        
                        // User Actions
                        const allUsers = app.appState.getAllUsers();
                        const currentUser = app.appState.getCurrentUser();
                        
                        html += `
                            <div class="panel-section">
                                <label>User Actions</label>
                                <div class="admin-buttons">
                                    <button class="admin-btn" onclick="hybridPanelManager.addNewUser()">
                                        <span class="material-icons">person_add</span>
                                        Add User
                                    </button>
                                </div>
                                <div class="user-action-list">
                        `;
                        
                        // Add each user with edit/delete buttons
                        allUsers.forEach(user => {
                            const isCurrentUser = user.id === currentUser.id;
                            const canDelete = !isCurrentUser && allUsers.length > 1;
                            
                            html += `
                                <div class="user-action-item">
                                    <div class="user-action-info">
                                        <span class="user-action-icon">${user.icon || '👤'}</span>
                                        <span class="user-action-name">${user.name}</span>
                                    </div>
                                    <div class="user-action-buttons">
                                        <button class="user-action-btn user-action-btn--edit" 
                                                onclick="window.hybridPanelManager.editExistingUser('${user.id}')"
                                                title="Edit ${user.name}">
                                            <span class="material-icons">edit</span>
                                        </button>
                                        ${canDelete ? `
                                            <button class="user-action-btn user-action-btn--delete" 
                                                    onclick="window.hybridPanelManager._handleDeleteUser('${user.id}', '${user.name.replace(/'/g, "\\'")}')"
                                                    title="Delete ${user.name}">
                                                <span class="material-icons">delete</span>
                                            </button>
                                        ` : `
                                            <button class="user-action-btn user-action-btn--delete user-action-btn--disabled" 
                                                    disabled
                                                    title="Cannot delete current user">
                                                <span class="material-icons">delete</span>
                                            </button>
                                        `}
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += `
                                </div>
                            </div>
                        `;
                        
                        // Data Tools
                        html += `
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
                    
                    // Add version info at the bottom (only in edit mode)
                    if (app.grownupMode) {
                        html += `
                            <div class="panel-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                                <div style="color: rgba(255,255,255,0.6); font-size: 0.85rem;">
                                    Version ${CONFIG.APP_VERSION || '1.5.4'}<br>
                                    <span style="font-size: 0.75rem;">Build ${CONFIG.APP_BUILD_DATE || '2025-06-15'}</span>
                                </div>
                            </div>
                        `;
                    }
                    
                    // Add event listeners
                    setTimeout(() => {
                        const returnToViewBtn = document.getElementById('returnToViewBtn');
                        const validationInput = document.getElementById('validationInput');
                        const validationSubmit = document.getElementById('validationSubmit');
                        const validationError = document.getElementById('validationError');
                        const settingsContent = document.getElementById('settingsContent');
                        
                        // Return to View Mode button (in edit mode)
                        if (returnToViewBtn) {
                            returnToViewBtn.addEventListener('click', () => {
                                // Close the panel first
                                window.hybridPanelManager.closePanel('right');
                                // Then exit edit mode after a delay to avoid flash
                                setTimeout(() => {
                                    window.hybridPanelManager.handleEditModeSwitch(false);
                                }, 300);
                            });
                        }
                        
                        // In view mode - show validation question after a delay
                        if (!app.grownupMode) {
                            // Wait for any closing animations to finish
                            setTimeout(() => {
                                // Generate random question
                                const questions = window.hybridPanelManager.getValidationQuestions();
                                const randomQ = questions[Math.floor(Math.random() * questions.length)];
                                state.currentQuestion = randomQ;
                                
                                document.getElementById('validationQuestionLabel').textContent = randomQ.question;
                                if (validationInput) {
                                    validationInput.value = '';
                                    validationInput.focus();
                                }
                                if (validationError) {
                                    validationError.style.display = 'none';
                                }
                            }, 300); // Wait 300ms for panel transitions
                        }
                        
                        if (validationSubmit) {
                            const submitValidation = () => {
                                const answer = validationInput.value.trim().toUpperCase();
                                const correctAnswer = state.currentQuestion.answer.toUpperCase();
                                
                                if (answer === correctAnswer || answer === 'A') {
                                    // Correct answer
                                    window.hybridPanelManager.handleEditModeSwitch(true);
                                    
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
                    
                    // Add search field
                    html += `
                        <div style="padding: 12px 16px 8px;">
                            <input type="text" 
                                id="librarySearchInput" 
                                class="form-field" 
                                placeholder="Type to search cards..." 
                                value="${state.searchTerm || ''}"
                                style="width: 100%; margin: 0;"
                                autocomplete="off" />
                        </div>
                    `;
                    
                    // Add hint
                    html += '<div class="library-hint">Select cards to add to your stack</div>';
                    
                    // Get libraries using the correct method
                    const userActivities = app.appState.getLibrary('user');
                    const groupActivities = app.appState.getLibrary('group');
                    const baseActivities = app.appState.getLibrary('base');
                    
                    // Filter activities based on search term
                    const searchTerm = (state.searchTerm || '').toLowerCase();
                    const filterActivities = (activities) => {
                        if (!searchTerm) return activities;
                        return activities.filter(activity => 
                            activity.title.toLowerCase().includes(searchTerm) ||
                            (activity.description && activity.description.toLowerCase().includes(searchTerm)) ||
                            (activity.icon && activity.icon.includes(searchTerm))
                        );
                    };
                    
                    const filteredUserActivities = filterActivities(userActivities || []);
                    const filteredGroupActivities = filterActivities(groupActivities || []);
                    const filteredBaseActivities = filterActivities(baseActivities || []);
                    
                    // User Activities
                    if (userActivities && userActivities.length > 0 && filteredUserActivities.length > 0) {
                        const isUserCollapsed = state.collapsedSections && state.collapsedSections.user;
                        html += '<div class="library-section">';
                        html += `<h4 class="collapsible-header ${isUserCollapsed ? 'collapsed' : ''}" data-section="user">
                            <span class="collapse-icon">${isUserCollapsed ? '▶' : '▼'}</span>
                            My Cards
                            <span class="section-count">(${filteredUserActivities.length}${searchTerm ? '/' + userActivities.length : ''})</span>
                        </h4>`;
                        html += `<div class="activity-grid ${isUserCollapsed ? 'collapsed' : ''}">`;
                        
                        userActivities.forEach((activity, originalIndex) => {
                            // Skip if filtered out
                            if (!filteredUserActivities.includes(activity)) return;
                            
                            const id = `user-activity-${originalIndex}`;
                            const isSelected = state.selectedActivities && state.selectedActivities.user && state.selectedActivities.user.includes(originalIndex);
                            
                            html += `<div class="library-activity ${isSelected ? 'selected' : ''}" id="${id}">`;
                            html += `<input type="checkbox" ${isSelected ? 'checked' : ''} tabindex="-1" />`;
                            html += `<span class="activity-icon">${activity.icon || '📌'}</span>`;
                            html += `<span class="activity-title">${activity.title}</span>`;
                            html += '</div>';
                        });
                        
                        html += '</div></div>';
                    }
                    
                    // Group Activities
                    if (groupActivities && groupActivities.length > 0 && filteredGroupActivities.length > 0) {
                        const isGroupCollapsed = state.collapsedSections && state.collapsedSections.group;
                        html += '<div class="library-section">';
                        html += `<h4 class="collapsible-header ${isGroupCollapsed ? 'collapsed' : ''}" data-section="group">
                            <span class="collapse-icon">${isGroupCollapsed ? '▶' : '▼'}</span>
                            Group Cards
                            <span class="section-count">(${filteredGroupActivities.length}${searchTerm ? '/' + groupActivities.length : ''})</span>
                        </h4>`;
                        html += `<div class="activity-grid ${isGroupCollapsed ? 'collapsed' : ''}">`;
                        
                        groupActivities.forEach((activity, originalIndex) => {
                            // Skip if filtered out
                            if (!filteredGroupActivities.includes(activity)) return;
                            
                            const id = `group-activity-${originalIndex}`;
                            const isSelected = state.selectedActivities && state.selectedActivities.group && state.selectedActivities.group.includes(originalIndex);
                            
                            html += `<div class="library-activity ${isSelected ? 'selected' : ''}" id="${id}">`;
                            html += `<input type="checkbox" ${isSelected ? 'checked' : ''} tabindex="-1" />`;
                            html += `<span class="activity-icon">${activity.icon || '📌'}</span>`;
                            html += `<span class="activity-title">${activity.title}</span>`;
                            html += '</div>';
                        });
                        
                        html += '</div></div>';
                    }
                    
                    // Base Activities
                    if (baseActivities && baseActivities.length > 0 && filteredBaseActivities.length > 0) {
                        const isBaseCollapsed = state.collapsedSections && state.collapsedSections.base;
                        html += '<div class="library-section">';
                        html += `<h4 class="collapsible-header ${isBaseCollapsed ? 'collapsed' : ''}" data-section="base">
                            <span class="collapse-icon">${isBaseCollapsed ? '▶' : '▼'}</span>
                            StackMap Cards
                            <span class="section-count">(${filteredBaseActivities.length}${searchTerm ? '/' + baseActivities.length : ''})</span>
                        </h4>`;
                        html += `<div class="activity-grid ${isBaseCollapsed ? 'collapsed' : ''}">`;
                        
                        baseActivities.forEach((activity, originalIndex) => {
                            // Skip if filtered out
                            if (!filteredBaseActivities.includes(activity)) return;
                            
                            const id = `base-activity-${originalIndex}`;
                            const isSelected = state.selectedActivities && state.selectedActivities.base && state.selectedActivities.base.includes(originalIndex);
                            
                            html += `<div class="library-activity ${isSelected ? 'selected' : ''}" id="${id}">`;
                            html += `<input type="checkbox" ${isSelected ? 'checked' : ''} tabindex="-1" />`;
                            html += `<span class="activity-icon">${activity.icon || '📌'}</span>`;
                            html += `<span class="activity-title">${activity.title}</span>`;
                            html += '</div>';
                        });
                        
                        html += '</div></div>';
                    }
                    
                    // Show message if no results
                    if (searchTerm && filteredUserActivities.length === 0 && filteredGroupActivities.length === 0 && filteredBaseActivities.length === 0) {
                        html += '<div style="padding: 20px; text-align: center; color: #666;">No cards found matching "' + searchTerm + '"</div>';
                    }
                    
                    html += '</div>';
                    
                    // Add click handlers after rendering
                    setTimeout(() => {
                        // Handle search input
                        const searchInput = document.getElementById('librarySearchInput');
                        if (searchInput) {
                            searchInput.addEventListener('input', (e) => {
                                const value = e.target.value;
                                state.searchTerm = value;
                                
                                // Update just the library cards without refreshing the whole panel
                                window.hybridPanelManager.updateLibrarySearch(value);
                            });
                            
                            // Only focus if no search term (initial load)
                            if (!state.searchTerm) {
                                searchInput.focus();
                            }
                        }
                        
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
                    
                    // Emoji picker - always visible
                    html += '<div class="activity-emoji-selector">';
                    html += `<div id="activityEmojiPickerContainer"></div>`;
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
                const buttonText = state.editingActivity ? 'Save & Close' : 'Add Card';
                
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
                    // Check both state and user for icon, preferring state.selectedIcon if available
                    const selectedIcon = state.selectedIcon || state.editingUser?.icon || user.icon || '👤';
                    
                    console.log('User form render - state:', state);
                    console.log('User form render - user:', user);
                    console.log('User form render - selectedIcon:', selectedIcon);
                    
                    let html = '';
                    
                    // Icon picker - always visible
                    html += '<div class="user-icon-selector">';
                    html += `<div id="userIconPickerContainer"></div>`;
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
            }
        ],
        footer: {
            type: 'custom',
            render: function(state, menuSystem) {
                const buttonText = state.editingUser ? 'Save User' : 'Add User';
                
                return `
                    <button class="footer-button primary-button" onclick="console.log('[USER FORM] Save button clicked'); console.log('hybridPanelManager exists:', !!window.hybridPanelManager); console.log('saveUser exists:', !!(window.hybridPanelManager && window.hybridPanelManager.saveUser)); if (window.hybridPanelManager && window.hybridPanelManager.saveUser) { window.hybridPanelManager.saveUser(); } else { console.error('Cannot find saveUser method!'); }">
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

    userDaySelector: {
        id: 'userDaySelector',
        title: function(app) {
            const allUsers = app.appState.getAllUsers();
            return allUsers.length > 1 ? 'User & Day' : 'Day';
        },
        layout: 'sections',
        sections: [
            {
                type: 'custom',
                render: function(state, menuSystem) {
                    const app = menuSystem.app;
                    const allUsers = app.appState.getAllUsers();
                    const currentUser = app.appState.getCurrentUser();
                    const currentDay = app.appState.getCurrentDay();
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    let html = '';
                    
                    // User section (only show if multiple users)
                    if (allUsers.length > 1) {
                        html += '<div class="panel-section">';
                        html += '<label>Select User</label>';
                        html += '<div class="selector-options">';
                        
                        allUsers.forEach(user => {
                            const isActive = user.id === currentUser.id;
                            html += `
                                <button class="selector-option ${isActive ? 'active' : ''}" 
                                        onclick="appInstance.handleUserSwitch('${user.id}'); window.hybridPanelManager.closePanel('left');">
                                    <span class="selector-option-icon">${user.icon || '👤'}</span>
                                    <span class="selector-option-name">${user.name}</span>
                                </button>
                            `;
                        });
                        
                        html += '</div>';
                        html += '</div>';
                    }
                    
                    // Day section
                    html += '<div class="panel-section">';
                    html += '<label>Select Day</label>';
                    html += '<div class="selector-options selector-options-horizontal">';
                    
                    // Today button
                    html += `
                        <button class="selector-option selector-option-day ${currentDay === 'today' ? 'active' : ''}" 
                                onclick="appInstance.switchDay('today'); window.hybridPanelManager.closePanel('left');">
                            <span class="selector-option-icon">${app.createDateIcon(today)}</span>
                            <span class="selector-option-name">Today</span>
                        </button>
                    `;
                    
                    // Tomorrow button
                    html += `
                        <button class="selector-option selector-option-day ${currentDay === 'tomorrow' ? 'active' : ''}" 
                                onclick="appInstance.switchDay('tomorrow'); window.hybridPanelManager.closePanel('left');">
                            <span class="selector-option-icon">${app.createDateIcon(tomorrow)}</span>
                            <span class="selector-option-name">Tomorrow</span>
                        </button>
                    `;
                    
                    html += '</div>';
                    html += '</div>';
                    
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
                    const driveSync = app.driveSync;
                    const isSignedIn = driveSync && driveSync.isSignedIn;
                    const syncEnabled = app.appState.syncSettings?.enabled || false;
                    const lastSync = app.appState.syncSettings?.lastSync;
                    
                    let html = '<div class="sync-settings">';
                    
                    // Check if Google Drive is connected
                    if (!isSignedIn) {
                        // Show connect button
                        html += '<div class="sync-connect">';
                        html += '<p>Connect to Google Drive to enable automatic backup and sync across devices.</p>';
                        html += '<button class="btn btn--primary" onclick="appInstance.driveSync && appInstance.driveSync.signIn()">';
                        html += '<span class="material-icons">cloud</span> Connect Google Drive';
                        html += '</button>';
                        html += '</div>';
                    } else {
                        // Sync status
                        html += '<div class="sync-status">';
                        if (syncEnabled) {
                            html += '<div class="status-indicator active">✓ Sync Enabled</div>';
                            if (lastSync) {
                                const date = new Date(lastSync);
                                html += `<div class="last-sync">Last sync: ${date.toLocaleString()}</div>`;
                            }
                        } else {
                            html += '<div class="status-indicator">Sync Connected but Disabled</div>';
                        }
                        html += '</div>';
                    
                        // Sync toggle
                        html += '<div class="sync-toggle">';
                        html += `<label class="toggle-switch">`;
                        html += `<input type="checkbox" id="syncToggle" ${syncEnabled ? 'checked' : ''} />`;
                        html += `<span class="toggle-slider"></span>`;
                        html += `</label>`;
                        html += `<span class="toggle-label">Enable Automatic Sync</span>`;
                        html += '</div>';
                        
                        // Sync actions
                        html += '<div class="sync-actions">';
                        if (syncEnabled) {
                            html += '<button id="syncNowBtn" class="sync-button">Sync Now</button>';
                        }
                        html += '<button id="uploadBtn" class="sync-button" onclick="appInstance.driveSync && appInstance.driveSync.syncNow()">';
                        html += '<span class="material-icons">cloud_upload</span> Save to Drive';
                        html += '</button>';
                        html += '<button id="downloadBtn" class="sync-button" onclick="appInstance.driveSync && appInstance.driveSync.downloadData()">';
                        html += '<span class="material-icons">cloud_download</span> Load from Drive';
                        html += '</button>';
                        html += '<button id="disconnectBtn" class="disconnect-button" onclick="appInstance.driveSync && appInstance.driveSync.signOut()">';
                        html += '<span class="material-icons">logout</span> Disconnect';
                        html += '</button>';
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