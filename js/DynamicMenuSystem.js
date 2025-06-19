class DynamicMenuSystem {
    constructor(app) {
        this.app = app;
        this.menuConfigs = {};
        this.activeMenus = {
            left: null,
            right: null
        };
    }

    registerMenu(id, config) {
        this.menuConfigs[id] = config;
    }

    renderMenu(menuId, side, state = {}) {
        // console.log('DynamicMenuSystem.renderMenu called:', { menuId, side, menuConfigs: Object.keys(this.menuConfigs) });
        const config = this.menuConfigs[menuId];
        if (!config) {
            console.error(`Menu configuration not found for: ${menuId}`, 'Available menus:', Object.keys(this.menuConfigs));
            return '<div class="panel-section">Menu not found</div>';
        }

        this.activeMenus[side] = { id: menuId, config, state };

        let html = '';
        
        // Create fixed header with title and back button
        html += '<div class="panel-fixed-header">';
        
        // Back button
        const backButtonClass = side === 'left' ? 'back-button-left' : 'back-button-right';
        html += `<button class="panel-back-button ${backButtonClass}" onclick="window.hybridPanelManager.navigateBack('${side}')">
            <span class="material-icons">arrow_back</span>
            <span class="back-text">Back</span>
        </button>`;
        
        // Title with icon
        if (config.title) {
            const titleText = typeof config.title === 'function' ? config.title(this.app, state) : config.title;
            const titleIcon = this.getMenuIcon(menuId);
            html += `<h3><span class="material-icons menu-title-icon">${titleIcon}</span> ${titleText}</h3>`;
        }
        
        html += '</div>'; // End fixed header
        
        // Create scrollable content area
        html += '<div class="panel-scrollable-content">';
        
        // Render based on layout type
        const layout = config.layout || 'sections';
        
        if (layout === 'sections') {
            html += this.renderSectionsLayout(config, state);
        } else if (layout === 'flex-column') {
            html += this.renderFlexLayout(config, state);
        } else if (layout === 'form') {
            html += this.renderFormLayout(config, state);
        }
        
        html += '</div>'; // End scrollable content
        
        // Create fixed footer
        html += '<div class="panel-fixed-footer">';
        
        // Check if config has a custom footer
        if (config.footer) {
            // Render custom footer
            if (config.footer.type === 'custom' && config.footer.render) {
                html += config.footer.render(state, this);
            } else {
                html += this.renderFooter(config.footer, state);
            }
        } else {
            // Default Exit button (changes to Save & Exit if there are changes)
            const hasChanges = this.checkForUnsavedChanges(menuId, state);
            const buttonText = hasChanges ? 'Save & Exit' : 'Exit';
            const iconName = hasChanges ? 'save' : 'close';
            
            html += `<button class="save-exit-button" onclick="window.hybridPanelManager.saveAndExit('${side}', '${menuId}')">
                <span class="material-icons">${iconName}</span>
                <span>${buttonText}</span>
            </button>`;
        }
        
        html += '</div>'; // End fixed footer

        return html;
    }

    renderSectionsLayout(config, state) {
        let html = '<div class="panel-sections">';
        
        config.sections.forEach(section => {
            html += this.renderSection(section, state);
        });
        
        html += '</div>';
        return html;
    }

    renderFlexLayout(config, state) {
        let html = '<div class="flex-layout">';
        
        config.sections.forEach(section => {
            const flex = section.flex || 'none';
            html += `<div class="flex-section" style="flex: ${flex}">`;
            html += this.renderSection(section, state);
            html += '</div>';
        });
        
        html += '</div>';
        return html;
    }

    renderFormLayout(config, state) {
        let html = '<form class="panel-form">';
        
        config.sections.forEach(section => {
            html += this.renderSection(section, state);
        });
        
        html += '</form>';
        return html;
    }

    renderSection(section, state) {
        let html = '';
        
        // Section wrapper
        html += '<div class="panel-section">';
        
        // Section label
        if (section.label) {
            html += `<div class="section-label">${section.label}</div>`;
        }

        // Render based on section type
        switch (section.type) {
            case 'selector':
                html += this.renderSelector(section, state);
                break;
            case 'input-group':
                html += this.renderInputGroup(section, state);
                break;
            case 'menu-list':
                html += this.renderMenuList(section, state);
                break;
            case 'scrollable-grid':
                html += this.renderScrollableGrid(section, state);
                break;
            case 'toggle':
                html += this.renderToggle(section, state);
                break;
            case 'button':
                html += this.renderButton(section, state);
                break;
            case 'custom':
                html += this.renderCustom(section, state);
                break;
            default:
                console.warn(`Unknown section type: ${section.type}`);
        }
        
        html += '</div>';
        return html;
    }

    renderSelector(section, state) {
        const data = this.getData(section.data, state);
        const currentValue = this.getValue(section.currentValue, state);
        const id = section.id || `selector-${Date.now()}`;
        
        let html = `<select id="${id}" class="panel-select">`;
        
        if (Array.isArray(data)) {
            data.forEach(item => {
                const value = item.value || item;
                const label = item.label || item;
                const selected = value === currentValue ? 'selected' : '';
                html += `<option value="${value}" ${selected}>${label}</option>`;
            });
        } else if (typeof data === 'object') {
            Object.entries(data).forEach(([value, label]) => {
                const selected = value === currentValue ? 'selected' : '';
                html += `<option value="${value}" ${selected}>${label}</option>`;
            });
        }
        
        html += '</select>';
        
        // Add change handler
        if (section.onChange) {
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('change', (e) => {
                        this.handleAction(section.onChange, { value: e.target.value, section });
                    });
                }
            }, 0);
        }
        
        return html;
    }

    renderInputGroup(section, state) {
        let html = '<div class="input-group">';
        
        section.fields.forEach(field => {
            html += '<div class="input-field">';
            html += `<label for="${field.id}">${field.label}</label>`;
            
            if (field.computed) {
                const value = this.getValue(field.id, state);
                html += `<div class="computed-value">${value || ''}</div>`;
            } else if (field.editable) {
                const value = this.getValue(field.id, state);
                html += `<input type="text" id="${field.id}" value="${value || ''}" />`;
                
                // Add change handler
                if (field.onChange) {
                    setTimeout(() => {
                        const element = document.getElementById(field.id);
                        if (element) {
                            element.addEventListener('change', (e) => {
                                this.handleAction(field.onChange, { value: e.target.value, field });
                            });
                        }
                    }, 0);
                }
            }
            
            html += '</div>';
        });
        
        html += '</div>';
        return html;
    }

    renderMenuList(section, state) {
        let html = '<div class="menu-list">';
        
        section.items.forEach(item => {
            const id = `menu-item-${Date.now()}-${Math.random()}`;
            html += `<div class="menu-item" id="${id}">`;
            
            if (item.icon) {
                html += `<span class="menu-icon">${item.icon}</span>`;
            }
            
            html += `<span class="menu-label">${item.label}</span>`;
            html += '</div>';
            
            // Add click handler
            if (item.action) {
                setTimeout(() => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.addEventListener('click', () => {
                            this.handleAction(item.action, { item });
                        });
                    }
                }, 0);
            }
        });
        
        html += '</div>';
        return html;
    }

    renderScrollableGrid(section, state) {
        const data = this.getData(section.data, state);
        let html = '<div class="scrollable-grid">';
        
        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                const id = `grid-item-${index}`;
                const selected = state.selectedItems && state.selectedItems.includes(index);
                
                html += `<div class="grid-item ${selected ? 'selected' : ''}" id="${id}">`;
                
                if (section.selectable) {
                    html += `<input type="checkbox" ${selected ? 'checked' : ''} />`;
                }
                
                html += `<div class="item-content">${this.renderItem(item, section.itemTemplate)}</div>`;
                html += '</div>';
                
                // Add selection handler
                if (section.selectable) {
                    setTimeout(() => {
                        const element = document.getElementById(id);
                        if (element) {
                            element.addEventListener('click', () => {
                                this.handleSelection(index, section, state);
                            });
                        }
                    }, 0);
                }
            });
        }
        
        html += '</div>';
        return html;
    }

    renderToggle(section, state) {
        const value = this.getValue(section.setting, state);
        const id = section.id || `toggle-${Date.now()}`;
        
        let html = '<div class="toggle-container">';
        html += `<label class="toggle-label">${section.label}</label>`;
        html += `<input type="checkbox" id="${id}" ${value ? 'checked' : ''} />`;
        html += '</div>';
        
        // Add change handler
        if (section.onChange) {
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('change', (e) => {
                        this.handleAction(section.onChange, { value: e.target.checked, section });
                    });
                }
            }, 0);
        }
        
        return html;
    }

    renderButton(section, state) {
        const id = section.id || `button-${Date.now()}`;
        let html = `<button id="${id}" class="panel-button">${section.label}</button>`;
        
        // Add click handler
        if (section.action) {
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('click', () => {
                        this.handleAction(section.action, { section });
                    });
                }
            }, 0);
        }
        
        return html;
    }

    renderCustom(section, state) {
        if (section.render && typeof section.render === 'function') {
            return section.render(state, this);
        }
        return '';
    }

    renderFooter(footer, state) {
        let html = '<div class="panel-footer">';
        
        if (footer.type === 'dynamic-button') {
            const count = state.selectedCount || 0;
            const text = footer.textTemplate.replace('{count}', count);
            const id = `footer-button-${Date.now()}`;
            
            html += `<button id="${id}" class="footer-button" ${count === 0 ? 'disabled' : ''}>${text}</button>`;
            
            // Add click handler
            if (footer.action) {
                setTimeout(() => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.addEventListener('click', () => {
                            this.handleAction(footer.action, { state });
                        });
                    }
                }, 0);
            }
        } else if (footer.type === 'action-button') {
            const id = `footer-button-${Date.now()}`;
            html += `<button id="${id}" class="footer-button">${footer.text}</button>`;
            
            // Add click handler
            if (footer.action) {
                setTimeout(() => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.addEventListener('click', () => {
                            this.handleAction(footer.action, { state });
                        });
                    }
                }, 0);
            }
        }
        
        html += '</div>';
        return html;
    }

    renderItem(item, template) {
        if (template && typeof template === 'function') {
            return template(item);
        }
        
        // Default rendering
        if (typeof item === 'string') {
            return item;
        } else if (item.label) {
            return item.label;
        } else if (item.title) {
            return item.title;
        }
        
        return JSON.stringify(item);
    }

    getData(dataPath, state) {
        if (typeof dataPath === 'function') {
            return dataPath(this.app, state);
        }
        
        // Handle predefined data sources
        switch (dataPath) {
            case 'users':
                return this.getUsersData();
            case 'days':
                return this.getDaysData();
            case 'libraryActivities':
                return this.getLibraryActivities();
            default:
                return [];
        }
    }

    getValue(valuePath, state) {
        if (typeof valuePath === 'function') {
            return valuePath(this.app, state);
        }
        
        // Handle predefined value sources
        switch (valuePath) {
            case 'currentUser':
                return this.app.appState.users.currentId;
            case 'currentDay':
                return this.app.appState.currentDay;
            case 'title':
                return document.getElementById('customTitle')?.textContent || '';
            case 'subtitle':
                return document.getElementById('customSubtitle')?.textContent || '';
            default:
                return state[valuePath];
        }
    }

    handleAction(action, data) {
        if (typeof action === 'function') {
            action(this.app, data);
            return;
        }
        
        // Handle predefined actions
        if (this.app.hybridPanelManager && this.app.hybridPanelManager[action]) {
            this.app.hybridPanelManager[action](data);
        }
    }

    handleSelection(index, section, state) {
        if (!state.selectedItems) {
            state.selectedItems = [];
        }
        
        const idx = state.selectedItems.indexOf(index);
        if (idx > -1) {
            state.selectedItems.splice(idx, 1);
        } else {
            if (!section.multiSelect) {
                state.selectedItems = [index];
            } else {
                state.selectedItems.push(index);
            }
        }
        
        state.selectedCount = state.selectedItems.length;
        
        // Re-render the menu to update selection state
        this.updateActiveMenu();
    }

    updateActiveMenu() {
        // This will be called by HybridPanelManager to refresh the current menu
        if (this.app.hybridPanelManager) {
            this.app.hybridPanelManager.refreshCurrentPanel();
        }
    }
    
    updateFooterButton(side) {
        // Update the footer button text based on current state
        const activeMenu = this.activeMenus[side];
        if (!activeMenu) return;
        
        const { id: menuId, state } = activeMenu;
        const hasChanges = this.checkForUnsavedChanges(menuId, state);
        const buttonText = hasChanges ? 'Save & Exit' : 'Exit';
        const iconName = hasChanges ? 'save' : 'close';
        
        // Find and update the button
        const panel = document.querySelector(`.side-panel--${side}`);
        if (!panel) return;
        
        const button = panel.querySelector('.save-exit-button');
        if (!button) return;
        
        const icon = button.querySelector('.material-icons');
        const text = button.querySelector('span:not(.material-icons)');
        
        if (icon) icon.textContent = iconName;
        if (text) text.textContent = buttonText;
    }

    getUsersData() {
        const users = [];
        const profiles = this.app.appState.users.profiles;
        
        Object.keys(profiles).forEach(id => {
            users.push({
                value: id,
                label: profiles[id].name
            });
        });
        
        return users;
    }

    getDaysData() {
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    }

    getLibraryActivities() {
        // This would return formatted activities for the library
        // For now, return empty array
        return [];
    }
    
    getMenuIcon(menuId) {
        const iconMap = {
            'preferences': 'palette',
            'settings': 'edit',
            'activityLibrary': 'library_books',
            'activityForm': 'add_circle',
            'userForm': 'person_add',
            'userManagement': 'manage_accounts',
            'userDaySelector': 'calendar_today',
            'syncSettings': 'cloud_sync'
        };
        
        return iconMap[menuId] || 'menu';
    }
    
    checkForUnsavedChanges(menuId, state) {
        // Check for unsaved changes based on menu type
        switch (menuId) {
            case 'preferences':
                // Preferences save immediately, no unsaved changes
                return false;
                
            case 'activityForm':
                // Check if any form fields have been filled
                const titleInput = document.getElementById('activityTitle');
                const descInput = document.getElementById('activityDescription');
                const timeInput = document.getElementById('activityTime');
                const hasTitle = titleInput && titleInput.value.trim() !== '';
                const hasDesc = descInput && descInput.value.trim() !== '';
                const hasTime = timeInput && timeInput.value.trim() !== '';
                
                if (state.editingActivity) {
                    // Editing mode - check if values differ from original
                    const activity = state.editingActivity;
                    const titleChanged = titleInput && titleInput.value !== activity.title;
                    const descChanged = descInput && descInput.value !== (activity.description || '');
                    const timeChanged = timeInput && timeInput.value !== (activity.time || '');
                    const iconChanged = state.selectedEmoji && state.selectedEmoji !== activity.icon;
                    return titleChanged || descChanged || timeChanged || iconChanged;
                } else {
                    // New activity - check if any field has content
                    return hasTitle || hasDesc || hasTime || (state.selectedEmoji && state.selectedEmoji !== this.app.newActivityDefaults.emoji);
                }
                
            case 'userForm':
                // Check if user form has changes
                const nameInput = document.getElementById('userName');
                const hasName = nameInput && nameInput.value.trim() !== '';
                
                if (state.editingUser) {
                    // Editing mode - check if values differ
                    const user = state.editingUser;
                    const nameChanged = nameInput && nameInput.value !== user.name;
                    const iconChanged = state.selectedIcon && state.selectedIcon !== user.icon;
                    return nameChanged || iconChanged;
                } else {
                    // New user - check if name is filled
                    return hasName || (state.selectedIcon && state.selectedIcon !== '👤');
                }
                
            case 'activityLibrary':
                // Check if any activities are selected
                return state.selectedCount > 0;
                
            case 'syncSettings':
                // Sync settings save immediately
                return false;
                
            case 'userDaySelector':
                // No changes to save in this menu
                return false;
                
            case 'settings':
                // Settings/Edit menu has no saveable state
                return false;
                
            default:
                return false;
        }
    }
}

// Export for use in other modules
window.DynamicMenuSystem = DynamicMenuSystem;