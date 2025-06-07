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
        
        // Initialize FAB visibility (show FABs by default)
        this.handleFABVisibility(false);
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
        
        if (!this.app.grownupMode) {
            // View mode: Show validation question and Edit button
            return `
                <div class="panel-section">
                    <label>Access Edit Mode</label>
                    ${this.renderValidationSection()}
                </div>
            `;
        } else {
            // Edit mode: Show View button and admin tools
            return `
                <div class="panel-section">
                    <label>Edit Mode</label>
                    ${this.renderViewModeButton()}
                </div>
                
                <div class="panel-section">
                    <label>Admin Tools</label>
                    ${this.renderAdminButtons()}
                </div>
            `;
        }
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
        
        // Close the management panel since there's nothing else to do in view mode
        this.closePanel('right');
        
        console.log('Exited edit mode and closed panel');
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
                    
                    mouseStartX = e.clientX;
                    mouseStartTime = Date.now();
                    isMouseDown = true;
                    
                    // Prevent text selection during swipe
                    e.preventDefault();
                }, { passive: false });
                
                panel.addEventListener('mousemove', (e) => {
                    if (!this.state.activePanel || !isMouseDown) return;
                    
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
}

// Global instance for onclick handlers
window.hybridPanelManager = null;