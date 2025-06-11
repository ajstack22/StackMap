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
        console.log('DynamicMenuSystem.renderMenu called:', { menuId, side, menuConfigs: Object.keys(this.menuConfigs) });
        const config = this.menuConfigs[menuId];
        if (!config) {
            console.error(`Menu configuration not found for: ${menuId}`, 'Available menus:', Object.keys(this.menuConfigs));
            return '<div class="panel-section">Menu not found</div>';
        }

        this.activeMenus[side] = { id: menuId, config, state };

        let html = '';
        
        // Render title if provided
        if (config.title) {
            html += `<h3>${config.title}</h3>`;
        }

        // Render based on layout type
        const layout = config.layout || 'sections';
        
        if (layout === 'sections') {
            html += this.renderSectionsLayout(config, state);
        } else if (layout === 'flex-column') {
            html += this.renderFlexLayout(config, state);
        } else if (layout === 'form') {
            html += this.renderFormLayout(config, state);
        }

        // Render footer if provided
        if (config.footer) {
            html += this.renderFooter(config.footer, state);
        }

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
}

// Export for use in other modules
window.DynamicMenuSystem = DynamicMenuSystem;