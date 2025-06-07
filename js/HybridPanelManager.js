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
        
        // Initialize footer color picker
        this.initializeFooterColorPicker();
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
            <div class="color-grid" style="grid-template-columns: repeat(6, 1fr); gap: ${isMobile ? '6px' : '8px'};">
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
                    <span class="material-icons">event</span>
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
        
        // Update color picker selection state
        this.updateColorPickerState(color);
        
        // Update footer color picker
        this.updateFooterColorPicker(color);
        
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

    initializeFooterColorPicker() {
        const footerColorPicker = document.getElementById('footerColorPicker');
        const colorPickerFooter = document.getElementById('colorPickerFooter');
        
        if (footerColorPicker && colorPickerFooter) {
            // Popular colors subset for footer (most used colors)
            const footerColors = [
                '#1976D2', // Blue
                '#388E3C', // Green  
                '#F57C00', // Orange
                '#7B1FA2', // Purple
                '#DC143C', // Red
                '#00695C', // Teal
                '#5D4037', // Brown
                '#455A64'  // Blue Grey
            ];
            
            const currentColor = this.app.appState.settings.backgroundColor;
            
            footerColorPicker.innerHTML = footerColors.map(color => {
                const isSelected = color === currentColor;
                return `
                    <button class="color-option ${isSelected ? 'color-option--selected' : ''}"
                            style="background: ${color};"
                            onclick="hybridPanelManager.selectColor('${color}')"
                            aria-label="Select ${color} theme">
                        ${isSelected ? '<span class="color-checkmark">✓</span>' : ''}
                    </button>
                `;
            }).join('');
            
            // Show footer after a brief delay
            setTimeout(() => {
                colorPickerFooter.classList.add('visible');
            }, 500);
        }
    }

    updateFooterColorPicker(selectedColor) {
        const footerColorPicker = document.getElementById('footerColorPicker');
        if (!footerColorPicker) return;
        
        // Update footer color picker states
        footerColorPicker.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('color-option--selected');
            const checkmark = option.querySelector('.color-checkmark');
            if (checkmark) checkmark.remove();
            
            // Check if this option matches the selected color
            const style = option.getAttribute('style');
            if (style && style.includes(selectedColor)) {
                option.classList.add('color-option--selected');
                option.innerHTML += '<span class="color-checkmark">✓</span>';
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
}

// Global instance for onclick handlers
window.hybridPanelManager = null;