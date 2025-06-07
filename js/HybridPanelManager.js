// HybridPanelManager.js - Modern panel system with JavaScript state management
// Combines the best CSS design patterns with explicit JavaScript logic

class HybridPanelManager {
    constructor(app) {
        this.app = app;
        this.state = {
            leftPanelOpen: false,
            rightPanelOpen: false,
            activePanel: null
        };
        
        this.initializePanels();
        this.setupEventListeners();
    }

    initializePanels() {
        // Create floating action buttons
        this.createFloatingButtons();
        
        // Create side panels
        this.createSidePanels();
        
        // Create backdrop
        this.createBackdrop();
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
        
        // Render content
        this.renderPanelContent(side);
        
        // Mobile scroll lock
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
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
    }

    renderPanelContent(side) {
        const contentDiv = document.getElementById(`hybrid${side.charAt(0).toUpperCase() + side.slice(1)}Content`);
        
        if (side === 'left') {
            contentDiv.innerHTML = this.renderPreferencesContent();
        } else {
            contentDiv.innerHTML = this.renderManagementContent();
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
        const currentDay = this.app.appState.getCurrentDay();
        
        return `
            <div class="panel-section">
                <label>Current View</label>
                ${this.renderDaySelector(currentDay)}
            </div>
            
            <div class="panel-section">
                <label>Edit Mode</label>
                ${this.renderEditModeToggle()}
            </div>
            
            ${this.app.grownupMode ? `
            <div class="panel-section">
                <label>Admin Tools</label>
                ${this.renderAdminButtons()}
            </div>
            ` : ''}
        `;
    }

    renderColorPicker() {
        const currentColor = this.app.appState.settings.backgroundColor;
        const colors = window.THEMES?.COLORS || [];
        
        return `
            <div class="color-grid">
                ${colors.map(color => `
                    <button class="color-option ${color === currentColor ? 'color-option--selected' : ''}"
                            style="background: ${color};"
                            onclick="hybridPanelManager.selectColor('${color}')"
                            aria-label="Select ${color} theme">
                        ${color === currentColor ? '<span class="color-checkmark">✓</span>' : ''}
                    </button>
                `).join('')}
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

    renderDaySelector(currentDay) {
        return `
            <div class="segmented-control" data-control="day">
                <button class="segment ${currentDay === 'Today' ? 'segment--active' : ''}" 
                        onclick="hybridPanelManager.switchDay('today')"
                        aria-pressed="${currentDay === 'Today'}">
                    <span class="material-icons">today</span>
                    <span>Today</span>
                </button>
                <button class="segment ${currentDay === 'Tomorrow' ? 'segment--active' : ''}" 
                        onclick="hybridPanelManager.switchDay('tomorrow')"
                        aria-pressed="${currentDay === 'Tomorrow'}">
                    <span class="material-icons">tomorrow</span>
                    <span>Tomorrow</span>
                </button>
            </div>
        `;
    }

    renderEditModeToggle() {
        const editMode = this.app.grownupMode;
        
        return `
            <div class="segmented-control" data-control="editMode">
                <button class="segment ${!editMode ? 'segment--active' : ''}" 
                        onclick="hybridPanelManager.toggleEditMode(false)"
                        aria-pressed="${!editMode}">
                    <span class="material-icons">visibility</span>
                    <span>View</span>
                </button>
                <button class="segment ${editMode ? 'segment--active' : ''}" 
                        onclick="hybridPanelManager.toggleEditMode(true)"
                        aria-pressed="${editMode}">
                    <span class="material-icons">edit</span>
                    <span>Edit</span>
                </button>
            </div>
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
        
        // Re-render color picker to update selection
        this.renderPanelContent('left');
        
        // Update cards
        if (this.app.renderer) {
            this.app.renderer.renderCards();
        }
        
        console.log('Color changed to:', color);
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

    switchDay(day) {
        this.app.switchDay(day);
        
        // Re-render to update button states
        this.renderPanelContent('right');
        
        console.log('Switched to:', day);
    }

    toggleEditMode(editMode) {
        if (editMode) {
            this.app.enterGrownupMode();
        } else {
            this.app.exitGrownupMode();
        }
        
        // Re-render both panels to update states
        if (this.state.leftPanelOpen) this.renderPanelContent('left');
        if (this.state.rightPanelOpen) this.renderPanelContent('right');
        
        console.log('Edit mode toggled to:', editMode);
    }

    // Admin actions
    addNewCard() {
        this.closeAllPanels();
        // Delegate to existing functionality
        if (this.app.showNewCardForm) {
            this.app.showNewCardForm();
        }
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
        this.closeAllPanels();
        // Delegate to existing functionality
        if (this.app.addNewUser) {
            this.app.addNewUser();
        }
    }

    // ===== HELPER METHODS =====

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
}

// Global instance for onclick handlers
window.hybridPanelManager = null;