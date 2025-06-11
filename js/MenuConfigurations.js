// Menu configurations for the dynamic menu system
window.MenuConfigurations = {
    preferences: {
        id: 'preferences',
        title: 'Preferences',
        layout: 'sections',
        sections: [
            {
                type: 'custom',
                render: function(state, menuSystem) {
                    // Learn More button
                    return `<a href="support.html" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="learn-more-button"
                           aria-label="Learn more about StackMap - opens in new window">
                            <span class="material-icons">info</span>
                            <span class="learn-more-text">Learn More</span>
                        </a>`;
                }
            },
            {
                type: 'custom',
                label: 'Theme Colors',
                render: function(state, menuSystem) {
                    return menuSystem.app.hybridPanelManager.renderColorPicker();
                }
            },
            {
                type: 'custom',
                label: 'App Title & Subtitle',
                render: function(state, menuSystem) {
                    return menuSystem.app.hybridPanelManager.renderTitleSubtitleEditorForPreferences();
                }
            },
            {
                type: 'custom',
                label: 'Card Display',
                render: function(state, menuSystem) {
                    return menuSystem.app.hybridPanelManager.renderDisplayModeSelector();
                }
            },
            {
                type: 'custom',
                label: 'Completion Indicators',
                render: function(state, menuSystem) {
                    return menuSystem.app.hybridPanelManager.renderCompletionToggle();
                }
            },
            {
                type: 'custom',
                render: function(state, menuSystem) {
                    return menuSystem.app.hybridPanelManager.renderCelebrationPreferences();
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
                    
                    // Edit Mode toggle
                    html += `
                        <div class="panel-section" style="padding-top: 0;">
                            <div class="edit-mode-toggle-inline">
                                <span class="setting-label">Edit Mode</span>
                                <label class="switch switch--small">
                                    <input type="checkbox" id="editModeSwitch" ${app.grownupMode ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    `;
                    
                    // User selector
                    html += `
                        <div class="panel-section">
                            <label>Current User</label>
                            ${app.hybridPanelManager.renderUserSelector()}
                            ${app.grownupMode ? `
                                <button class="admin-btn" style="margin-top: 12px; width: 100%;" onclick="hybridPanelManager.addNewUser()">
                                    <span class="material-icons">person_add</span>
                                    Add User
                                </button>
                            ` : ''}
                        </div>
                    `;
                    
                    // Day selector
                    html += `
                        <div class="panel-section">
                            <label>Day Selection</label>
                            ${app.hybridPanelManager.renderDaySelector()}
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
                                        Add Activity
                                    </button>
                                    <button class="admin-btn" onclick="hybridPanelManager.showLibraryMenu()">
                                        <span class="material-icons">library_books</span>
                                        Activity Library
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
                    
                    // Add event listener for edit mode switch
                    setTimeout(() => {
                        const editSwitch = document.getElementById('editModeSwitch');
                        if (editSwitch) {
                            editSwitch.addEventListener('change', (e) => {
                                app.hybridPanelManager.handleEditModeSwitch(e.target.checked);
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
        title: 'Activity Library',
        layout: 'flex-column',
        sections: [
            {
                type: 'custom',
                flex: 1,
                render: function(state, menuSystem) {
                    // Custom rendering for activity library
                    const app = menuSystem.app;
                    let html = '<div class="library-sections">';
                    
                    // Add hint
                    html += '<div class="library-hint">Select activities to add to your stack</div>';
                    
                    // User Activities
                    if (app.appState.userActivities && app.appState.userActivities.length > 0) {
                        html += '<div class="library-section">';
                        html += '<h4>My Activities</h4>';
                        html += '<div class="activity-grid">';
                        
                        app.appState.userActivities.forEach((activity, index) => {
                            const id = `user-activity-${index}`;
                            const isSelected = state.selectedActivities && state.selectedActivities.user && state.selectedActivities.user.includes(index);
                            
                            html += `<div class="library-activity ${isSelected ? 'selected' : ''}" id="${id}">`;
                            html += `<input type="checkbox" ${isSelected ? 'checked' : ''} />`;
                            html += `<span class="activity-icon">${activity.icon || '📌'}</span>`;
                            html += `<span class="activity-title">${activity.title}</span>`;
                            html += '</div>';
                        });
                        
                        html += '</div></div>';
                    }
                    
                    // Group Activities
                    if (app.appState.groupActivities && app.appState.groupActivities.length > 0) {
                        html += '<div class="library-section">';
                        html += '<h4>Group Activities</h4>';
                        html += '<div class="activity-grid">';
                        
                        app.appState.groupActivities.forEach((activity, index) => {
                            const id = `group-activity-${index}`;
                            const isSelected = state.selectedActivities && state.selectedActivities.group && state.selectedActivities.group.includes(index);
                            
                            html += `<div class="library-activity ${isSelected ? 'selected' : ''}" id="${id}">`;
                            html += `<input type="checkbox" ${isSelected ? 'checked' : ''} />`;
                            html += `<span class="activity-icon">${activity.icon || '📌'}</span>`;
                            html += `<span class="activity-title">${activity.title}</span>`;
                            html += '</div>';
                        });
                        
                        html += '</div></div>';
                    }
                    
                    // Base Activities
                    if (app.baseActivities && app.baseActivities.length > 0) {
                        html += '<div class="library-section">';
                        html += '<h4>StackMap Activities</h4>';
                        html += '<div class="activity-grid">';
                        
                        app.baseActivities.forEach((activity, index) => {
                            const id = `base-activity-${index}`;
                            const isSelected = state.selectedActivities && state.selectedActivities.base && state.selectedActivities.base.includes(index);
                            
                            html += `<div class="library-activity ${isSelected ? 'selected' : ''}" id="${id}">`;
                            html += `<input type="checkbox" ${isSelected ? 'checked' : ''} />`;
                            html += `<span class="activity-icon">${activity.icon || '📌'}</span>`;
                            html += `<span class="activity-title">${activity.title}</span>`;
                            html += '</div>';
                        });
                        
                        html += '</div></div>';
                    }
                    
                    html += '</div>';
                    
                    // Add click handlers after rendering
                    setTimeout(() => {
                        // User activities
                        app.appState.userActivities?.forEach((_, index) => {
                            const element = document.getElementById(`user-activity-${index}`);
                            if (element) {
                                element.addEventListener('click', () => {
                                    app.hybridPanelManager.toggleLibrarySelection('user', index);
                                });
                            }
                        });
                        
                        // Group activities
                        app.appState.groupActivities?.forEach((_, index) => {
                            const element = document.getElementById(`group-activity-${index}`);
                            if (element) {
                                element.addEventListener('click', () => {
                                    app.hybridPanelManager.toggleLibrarySelection('group', index);
                                });
                            }
                        });
                        
                        // Base activities
                        app.baseActivities?.forEach((_, index) => {
                            const element = document.getElementById(`base-activity-${index}`);
                            if (element) {
                                element.addEventListener('click', () => {
                                    app.hybridPanelManager.toggleLibrarySelection('base', index);
                                });
                            }
                        });
                    }, 0);
                    
                    return html;
                }
            }
        ],
        footer: {
            type: 'dynamic-button',
            textTemplate: 'Add {count} to Library',
            action: 'addSelectedToLibrary'
        }
    },

    activityForm: {
        id: 'activityForm',
        title: function(app, state) {
            return state.editingActivity ? 'Edit Activity' : 'Add Activity';
        },
        layout: 'form',
        sections: [
            {
                type: 'custom',
                render: function(state, menuSystem) {
                    const app = menuSystem.app;
                    const activity = state.editingActivity || {};
                    
                    let html = '<div class="activity-form">';
                    
                    // Title input
                    html += '<div class="form-group">';
                    html += '<label for="activityTitle">Title</label>';
                    html += `<input type="text" id="activityTitle" placeholder="Activity name" value="${activity.title || ''}" />`;
                    html += '</div>';
                    
                    // Icon selector
                    html += '<div class="form-group">';
                    html += '<label>Icon</label>';
                    html += '<div class="icon-selector" id="iconSelector">';
                    
                    const commonIcons = ['🏃', '💪', '🧘', '📚', '💻', '🎨', '🎵', '🍳', '🧹', '💤'];
                    commonIcons.forEach(icon => {
                        const selected = icon === activity.icon ? 'selected' : '';
                        html += `<span class="icon-option ${selected}" data-icon="${icon}">${icon}</span>`;
                    });
                    
                    html += '</div>';
                    html += '</div>';
                    
                    // Color selector
                    html += '<div class="form-group">';
                    html += '<label>Color</label>';
                    html += '<div class="color-selector" id="colorSelector">';
                    
                    const colors = ['blue', 'green', 'red', 'yellow', 'purple', 'orange'];
                    colors.forEach(color => {
                        const selected = color === activity.color ? 'selected' : '';
                        html += `<span class="color-option ${selected}" data-color="${color}" style="background-color: var(--color-${color})"></span>`;
                    });
                    
                    html += '</div>';
                    html += '</div>';
                    
                    // Action buttons
                    html += '<div class="form-actions">';
                    html += '<button id="cancelActivityBtn" class="secondary-button">Cancel</button>';
                    html += '<button id="saveActivityBtn" class="primary-button">Save</button>';
                    html += '</div>';
                    
                    html += '</div>';
                    
                    // Add event handlers
                    setTimeout(() => {
                        // Icon selection
                        document.querySelectorAll('.icon-option').forEach(option => {
                            option.addEventListener('click', (e) => {
                                document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
                                e.target.classList.add('selected');
                            });
                        });
                        
                        // Color selection
                        document.querySelectorAll('.color-option').forEach(option => {
                            option.addEventListener('click', (e) => {
                                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                                e.target.classList.add('selected');
                            });
                        });
                        
                        // Cancel button
                        document.getElementById('cancelActivityBtn')?.addEventListener('click', () => {
                            app.hybridPanelManager.cancelActivityForm();
                        });
                        
                        // Save button
                        document.getElementById('saveActivityBtn')?.addEventListener('click', () => {
                            app.hybridPanelManager.saveActivity();
                        });
                    }, 0);
                    
                    return html;
                }
            }
        ]
    },

    userForm: {
        id: 'userForm',
        title: function(app, state) {
            return state.editingUser ? 'Edit User' : 'Add User';
        },
        layout: 'form',
        sections: [
            {
                type: 'custom',
                render: function(state, menuSystem) {
                    const app = menuSystem.app;
                    const user = state.editingUser || {};
                    
                    let html = '<div class="user-form">';
                    
                    // Name input
                    html += '<div class="form-group">';
                    html += '<label for="userName">Name</label>';
                    html += `<input type="text" id="userName" placeholder="User name" value="${user.name || ''}" />`;
                    html += '</div>';
                    
                    // Icon selector
                    html += '<div class="form-group">';
                    html += '<label>Icon</label>';
                    html += '<div class="icon-selector" id="userIconSelector">';
                    
                    const userIcons = ['👤', '👨', '👩', '👦', '👧', '🧑', '👶', '👴', '👵', '🦸'];
                    userIcons.forEach(icon => {
                        const selected = icon === user.icon ? 'selected' : '';
                        html += `<span class="icon-option ${selected}" data-icon="${icon}">${icon}</span>`;
                    });
                    
                    html += '</div>';
                    html += '</div>';
                    
                    // Action buttons
                    html += '<div class="form-actions">';
                    html += '<button id="cancelUserBtn" class="secondary-button">Cancel</button>';
                    html += '<button id="saveUserBtn" class="primary-button">Save</button>';
                    html += '</div>';
                    
                    html += '</div>';
                    
                    // Add event handlers
                    setTimeout(() => {
                        // Icon selection
                        document.querySelectorAll('#userIconSelector .icon-option').forEach(option => {
                            option.addEventListener('click', (e) => {
                                document.querySelectorAll('#userIconSelector .icon-option').forEach(o => o.classList.remove('selected'));
                                e.target.classList.add('selected');
                            });
                        });
                        
                        // Cancel button
                        document.getElementById('cancelUserBtn')?.addEventListener('click', () => {
                            app.hybridPanelManager.cancelUserForm();
                        });
                        
                        // Save button
                        document.getElementById('saveUserBtn')?.addEventListener('click', () => {
                            app.hybridPanelManager.saveUser();
                        });
                    }, 0);
                    
                    return html;
                }
            }
        ]
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
                            app.hybridPanelManager.addNewUser();
                        });
                        
                        // Edit user buttons
                        document.querySelectorAll('.edit-user-btn').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                const userId = e.target.getAttribute('data-user-id');
                                app.hybridPanelManager.editExistingUser(userId);
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
                            app.hybridPanelManager.toggleSync(e.target.checked);
                        });
                        
                        document.getElementById('syncNowBtn')?.addEventListener('click', () => {
                            app.hybridPanelManager.syncNow();
                        });
                        
                        document.getElementById('disconnectBtn')?.addEventListener('click', () => {
                            app.hybridPanelManager.disconnectSync();
                        });
                    }, 0);
                    
                    return html;
                }
            }
        ]
    }
};