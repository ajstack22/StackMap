// app/PreferencesManager.js - Preferences panel management with settings
// === PREFERENCES PANEL MANAGER ===
class PreferencesManager {
    constructor(app) {
        this.app = app;
        this.scrollPosition = 0;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // OLD SYSTEM DISABLED - Using hybrid panel system now
        // The hybrid panel manager handles all preferences UI
        console.log('PreferencesManager: Old system disabled, using HybridPanelManager');
        
        // Legacy preferences button should not interfere with new system
        const preferencesBtn = document.getElementById('preferencesBtn');
        if (preferencesBtn) {
            // Remove any existing listeners and disable the old button
            preferencesBtn.style.display = 'none';
            console.log('PreferencesManager: Old preferences button hidden');
        }
    }

    // PREFERENCES PANEL MANAGEMENT - DISABLED (Using hybrid system)
    togglePreferences() {
        console.log('PreferencesManager: togglePreferences called but disabled - using HybridPanelManager');
        // Redirect to hybrid panel system if available
        if (window.hybridPanelManager) {
            window.hybridPanelManager.togglePanel('left');
        }
        return;
    }

    showPreferences() {
        console.log('PreferencesManager: showPreferences called but disabled - using HybridPanelManager');
        // Redirect to hybrid panel system if available
        if (window.hybridPanelManager) {
            window.hybridPanelManager.openPanel('left');
        }
        return;
        
        // Create and show backdrop overlay
        this.createBackdrop();
        
        // Prevent background scrolling on mobile while preserving gradient
        if (window.innerWidth <= 768) {
            // Store current scroll position
            this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            
            // Get the current background before making changes
            const bodyStyle = window.getComputedStyle(document.body);
            const currentBackground = bodyStyle.backgroundImage || bodyStyle.background;
            
            // Set overflow hidden on html element to prevent scroll
            document.documentElement.style.overflow = 'hidden';
            document.documentElement.style.height = '100%';
            
            // Keep body in normal flow but prevent scroll
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100%';
            
            // Ensure background gradient stays intact
            if (currentBackground && currentBackground !== 'none') {
                document.body.style.backgroundImage = currentBackground;
            }
        }
    }

    closePreferences() {
        const panel = document.getElementById('preferencesPanel');
        panel.classList.add('hidden');
        
        // Remove backdrop overlay
        this.removeBackdrop();
        
        // Restore scrolling
        if (window.innerWidth <= 768) {
            // Remove overflow restrictions
            document.documentElement.style.overflow = '';
            document.documentElement.style.height = '';
            document.body.style.overflow = '';
            document.body.style.height = '';
            
            // Restore scroll position
            if (this.scrollPosition !== undefined) {
                window.scrollTo(0, this.scrollPosition);
                this.scrollPosition = undefined;
            }
        }
    }

    updatePreferencesPanel() {
        const contentDiv = document.getElementById('preferencesContent');
        
        if (this.app.grownupMode) {
            // Grown-up mode: Settings with data management and sync
            contentDiv.innerHTML = `
                <h3>Settings</h3>
                <div class="preferences-section">
                    <label>Data Management</label>
                    <div class="data-management-controls" style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="btn btn--primary" onclick="document.getElementById('fileInput').click()" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span class="material-icons">inbox</span>
                            Import StackMap
                        </button>
                        
                        <div class="export-section">
                            <h4 style="margin: 12px 0 8px 0; font-size: 0.9rem; color: #666;">Export Options</h4>
                            
                            <button class="btn btn--primary export-all-btn" onclick="appInstance.exportAllUsers()" style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
                                <span class="material-icons">download</span>
                                Export All Users
                            </button>
                            
                            <div class="export-individual" style="display: flex; gap: 8px;">
                                <select class="user-export-select" id="userExportSelect" style="flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
                                    <option value="">Select user to export...</option>
                                </select>
                                <button class="btn btn--secondary export-user-btn" onclick="appInstance.exportSelectedUser()" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                                    <span class="material-icons">person_pin</span>
                                    Export User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="preferences-section">
                    <label>Google Drive Sync</label>
                    <div class="sync-controls">
                        <button class="btn btn--secondary" id="googleSignInBtn" onclick="appInstance.driveSync.signIn()" style="background: #888; color: white;">
                            Connect Google Drive
                        </button>
                        <div class="sync-status" id="syncStatus" style="display: none;">
                            <div class="sync-user" id="syncUser">Connected to Google Drive</div>
                        </div>
                        <div class="sync-actions" id="syncActions" style="display: none; flex-direction: column; gap: 8px;">
                            <button class="btn btn--secondary btn--small" onclick="appInstance.driveSync.uploadData()">
                                <span class="material-icons">cloud_upload</span>
                                Save to Drive
                            </button>
                            <button class="btn btn--secondary btn--small" onclick="appInstance.driveSync.downloadData()">
                                <span class="material-icons">cloud_download</span>
                                Load from Drive
                            </button>
                            <button class="btn btn--secondary btn--small" onclick="appInstance.driveSync.signOut()">
                                <span class="material-icons">logout</span>
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
                <div class="preferences-hint" style="background: rgba(255, 193, 7, 0.1); padding: 12px; border-radius: 8px; font-size: 0.9rem; color: #856404; text-align: center; margin: 20px 0; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem;">💡</span>
                    Tap the title or subtitle above to edit them!
                </div>
                <div class="preferences-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                    <button class="btn btn--primary" onclick="console.log('Old preferences system - use hybrid panels')">Done</button>
                    <button class="btn btn--link" onclick="appInstance.showWelcomeAgain?.()" title="Show welcome tutorial again" style="display: flex; align-items: center; gap: 4px;">
                        <span class="material-icons" style="font-size: 1.1rem;">help_outline</span>
                        Welcome Guide
                    </button>
                </div>
                <div class="preferences-legal" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                    <a href="/blog.html" target="_blank" style="color: #666; font-size: 0.85rem; text-decoration: none; margin: 0 8px; padding: 8px;">Blog</a>
                    <span style="color: #ccc;">•</span>
                    <a href="/privacy-policy.html" target="_blank" style="color: #666; font-size: 0.85rem; text-decoration: none; margin: 0 8px; padding: 8px;">Privacy Policy</a>
                    <span style="color: #ccc;">•</span>
                    <a href="/terms-of-service.html" target="_blank" style="color: #666; font-size: 0.85rem; text-decoration: none; margin: 0 8px; padding: 8px;">Terms of Service</a>
                </div>
            `;
        } else {
            // Kid mode: Mobile-optimized preferences panel
            const isMobile = window.innerWidth <= 768;
            
            contentDiv.innerHTML = `
                <h3 style="margin: 0 0 ${isMobile ? '8px' : '20px'} 0; font-size: ${isMobile ? '1.2rem' : '1.6rem'}; text-align: center; color: #333;">Preferences</h3>
                
                <div class="preferences-section" style="margin-bottom: ${isMobile ? '8px' : '20px'};">
                    <label style="display: block; margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '0.8rem' : '0.95rem'}; font-weight: 600; color: #333;">Choose Your Theme Color</label>
                    <div class="color-picker" id="preferencesColorPicker" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: ${isMobile ? '3px' : '6px'};"></div>
                </div>
                
                <div class="preferences-section" style="margin-bottom: ${isMobile ? '6px' : '16px'};">
                    <label style="display: block; margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '0.8rem' : '0.95rem'}; font-weight: 600; color: #333;">Card Display Options</label>
                    <div class="display-mode-options" style="display: flex; gap: ${isMobile ? '4px' : '6px'}; justify-content: center;">
                        <button class="display-mode-btn ${this.app.appState.settings.displayMode === 'none' ? 'display-mode-btn--selected' : ''}" 
                                data-mode="none" 
                                style="flex: 1; padding: ${isMobile ? '6px 8px' : '8px 12px'}; border: 2px solid #ddd; border-radius: 12px; background: ${this.app.appState.settings.displayMode === 'none' ? 'var(--primary-color)' : 'white'}; color: ${this.app.appState.settings.displayMode === 'none' ? 'white' : '#666'}; font-size: ${isMobile ? '0.75rem' : '0.85rem'}; font-weight: 500; cursor: pointer; transition: all 0.2s ease; border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            Hide
                        </button>
                        <button class="display-mode-btn ${this.app.appState.settings.displayMode === 'numbers' ? 'display-mode-btn--selected' : ''}" 
                                data-mode="numbers" 
                                style="flex: 1; padding: ${isMobile ? '6px 8px' : '8px 12px'}; border: 2px solid #ddd; border-radius: 12px; background: ${this.app.appState.settings.displayMode === 'numbers' ? 'var(--primary-color)' : 'white'}; color: ${this.app.appState.settings.displayMode === 'numbers' ? 'white' : '#666'}; font-size: ${isMobile ? '0.75rem' : '0.85rem'}; font-weight: 500; cursor: pointer; transition: all 0.2s ease; border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            Numbers
                        </button>
                        <button class="display-mode-btn ${this.app.appState.settings.displayMode === 'times' ? 'display-mode-btn--selected' : ''}" 
                                data-mode="times" 
                                style="flex: 1; padding: ${isMobile ? '6px 8px' : '8px 12px'}; border: 2px solid #ddd; border-radius: 12px; background: ${this.app.appState.settings.displayMode === 'times' ? 'var(--primary-color)' : 'white'}; color: ${this.app.appState.settings.displayMode === 'times' ? 'white' : '#666'}; font-size: ${isMobile ? '0.75rem' : '0.85rem'}; font-weight: 500; cursor: pointer; transition: all 0.2s ease; border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            Times
                        </button>
                    </div>
                </div>
                
                <div class="preferences-section" style="margin-bottom: ${isMobile ? '12px' : '24px'};">
                    <label class="preferences-checkbox" style="display: flex; align-items: center; gap: ${isMobile ? '6px' : '10px'}; font-size: ${isMobile ? '0.8rem' : '0.95rem'}; cursor: pointer;">
                        <input type="checkbox" id="preferencesCompletionToggle" ${this.app.appState.settings.showCompletionIndicators !== false ? 'checked' : ''} style="width: ${isMobile ? '16px' : '18px'}; height: ${isMobile ? '16px' : '18px'}; cursor: pointer; flex-shrink: 0;">
                        <span style="color: #333; font-weight: 500;">Show Completion Checkmarks</span>
                    </label>
                </div>
                
                <div class="preferences-footer" style="display: flex; justify-content: center;">
                    <button class="btn btn--primary" onclick="console.log('Old preferences system - use hybrid panels')" style="padding: ${isMobile ? '6px 20px' : '10px 28px'}; font-size: ${isMobile ? '0.9rem' : '1.05rem'}; font-weight: 600;">Done</button>
                </div>
                
                <div class="preferences-legal" style="margin-top: ${isMobile ? '16px' : '24px'}; padding-top: ${isMobile ? '16px' : '24px'}; border-top: 1px solid #e0e0e0; text-align: center;">
                    <a href="/blog.html" target="_blank" style="color: #666; font-size: ${isMobile ? '0.75rem' : '0.85rem'}; text-decoration: none; margin: 0 8px; padding: ${isMobile ? '12px 8px' : '8px'}; display: inline-block;">Blog</a>
                    <span style="color: #ccc;">•</span>
                    <a href="/privacy-policy.html" target="_blank" style="color: #666; font-size: ${isMobile ? '0.75rem' : '0.85rem'}; text-decoration: none; margin: 0 8px; padding: ${isMobile ? '12px 8px' : '8px'}; display: inline-block;">Privacy Policy</a>
                    <span style="color: #ccc;">•</span>
                    <a href="/terms-of-service.html" target="_blank" style="color: #666; font-size: ${isMobile ? '0.75rem' : '0.85rem'}; text-decoration: none; margin: 0 8px; padding: ${isMobile ? '12px 8px' : '8px'}; display: inline-block;">Terms of Service</a>
                </div>
            `;
            
            // Setup color picker and controls for kid mode
            setTimeout(() => {
                this.setupKidModeControls();
            }, 0);
        }
        
        // Update sync controls if in grown-up mode
        if (this.app.grownupMode) {
            setTimeout(() => {
                this.updateSyncControls();
                this.populateExportUserDropdown();
            }, 0);
        }
    }
    
    populateExportUserDropdown() {
        const userExportSelect = document.getElementById('userExportSelect');
        if (userExportSelect) {
            const users = this.app.appState.getAllUsers();
            
            // Clear existing options except the placeholder
            userExportSelect.innerHTML = '<option value="">Select user to export...</option>';
            
            // Add options for each user
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                userExportSelect.appendChild(option);
            });
        }
    }

    setupKidModeControls() {
        const isMobile = window.innerWidth <= 768;
        
        // Setup color picker with improved styling
        const colorPicker = document.getElementById('preferencesColorPicker');
        if (colorPicker && THEMES && THEMES.COLORS) {
            colorPicker.innerHTML = THEMES.COLORS.map(color => {
                const isSelected = color === this.app.appState.settings.backgroundColor;
                const size = isMobile ? '28px' : '45px';
                
                // Special handling for custom color picker (black #000000)
                if (color === '#000000') {
                    // If a custom color is currently selected, show it with palette icon
                    const currentColor = this.app.appState.settings.backgroundColor;
                    const isCustomColor = !THEMES.COLORS.includes(currentColor) || currentColor === '#000000';
                    const displayColor = isCustomColor ? currentColor : '#000000';
                    
                    return `<div class="color-picker__option color-picker__option--custom" 
                                 style="background-color: ${displayColor}; width: 100%; height: ${size}; border-radius: ${isMobile ? '4px' : '6px'}; cursor: pointer; transition: all 0.2s ease; border: 2px solid ${isCustomColor ? '#333' : 'transparent'}; position: relative; box-sizing: border-box;" 
                                 onclick="console.log('Old color picker - use hybrid panels')" 
                                 title="Custom Color Picker">
                                 <span class="material-icons" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: ${isMobile ? '12px' : '18px'}; text-shadow: 0 0 3px rgba(0,0,0,0.8);">palette</span>
                            </div>`;
                }
                
                // Regular color swatches
                return `<div class="color-picker__option ${isSelected ? 'color-picker__option--selected' : ''}" 
                             style="background-color: ${color}; width: 100%; height: ${size}; border-radius: ${isMobile ? '4px' : '6px'}; cursor: pointer; transition: all 0.2s ease; border: 2px solid ${isSelected ? '#333' : 'transparent'}; position: relative; box-sizing: border-box;" 
                             onclick="appInstance.selectColor('${color}')" 
                             title="${color}">
                             ${isSelected ? `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: ${isMobile ? '12px' : '16px'}; font-weight: bold; text-shadow: 0 0 3px rgba(0,0,0,0.8);">✔</div>` : ''}
                        </div>`;
            }).join('');
        }
        
        // Setup display mode toggle buttons
        const displayModeButtons = document.querySelectorAll('.display-mode-btn');
        displayModeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const mode = e.target.getAttribute('data-mode');
                
                // Update app state
                this.app.appState.settings.displayMode = mode;
                this.app.appState._triggerSave();
                
                // Update button states
                displayModeButtons.forEach(btn => {
                    btn.classList.remove('display-mode-btn--selected');
                    btn.style.background = 'white';
                    btn.style.color = '#666';
                });
                
                // Highlight selected button
                e.target.classList.add('display-mode-btn--selected');
                e.target.style.background = 'var(--primary-color)';
                e.target.style.color = 'white';
                
                // Re-render cards
                this.app.render();
            });
        });
        
        // Setup completion indicators toggle
        const completionToggle = document.getElementById('preferencesCompletionToggle');
        if (completionToggle) {
            // Remove any existing event listeners to prevent duplicates
            const newCompletionToggle = completionToggle.cloneNode(true);
            completionToggle.parentNode.replaceChild(newCompletionToggle, completionToggle);
            
            // Add event listener to the new element
            newCompletionToggle.addEventListener('change', (e) => {
                this.app.appState.settings.showCompletionIndicators = e.target.checked;
                this.app.appState._triggerSave();
                
                // Update body class to hide/show completion indicators
                if (e.target.checked) {
                    document.body.classList.remove('hide-completion-indicators');
                } else {
                    document.body.classList.add('hide-completion-indicators');
                }
                
                this.app.render();
            });
        }
    }

    // Direct color picker - no modal needed
    openColorPicker() {
        // Create a temporary color input
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = this.app.appState.settings.backgroundColor;
        colorInput.style.display = 'none';
        
        colorInput.addEventListener('change', (e) => {
            const selectedColor = e.target.value;
            this.selectColor(selectedColor);
            document.body.removeChild(colorInput);
        });
        
        colorInput.addEventListener('cancel', () => {
            document.body.removeChild(colorInput);
        });
        
        document.body.appendChild(colorInput);
        colorInput.click();
    }

    updateSyncControls() {
        const signInBtn = document.getElementById('googleSignInBtn');
        const syncStatus = document.getElementById('syncStatus');
        const syncActions = document.getElementById('syncActions');
        
        if (this.app.driveSync.isSignedIn) {
            if (signInBtn) signInBtn.style.display = 'none';
            if (syncStatus) syncStatus.style.display = 'flex';
            if (syncActions) syncActions.style.display = 'flex';
        } else {
            if (signInBtn) signInBtn.style.display = 'block';
            if (syncStatus) syncStatus.style.display = 'none';
            if (syncActions) syncActions.style.display = 'none';
        }
    }

    createColorPickerHTML(selectedColor) {
        if (!THEMES || !THEMES.COLORS) return '';
        return THEMES.COLORS.map(color => {
            const isSelected = color === selectedColor;
            return `<div class="color-picker__option ${isSelected ? 'color-picker__option--selected' : ''}" 
                         style="background-color: ${color}; width: 100%; aspect-ratio: 1; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: 3px solid ${isSelected ? '#333' : 'transparent'}; position: relative;" 
                         onclick="appInstance.selectColor('${color}')" 
                         title="${color}">
                         ${isSelected ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 20px; font-weight: bold; text-shadow: 0 0 4px rgba(0,0,0,0.5);">✔</div>' : ''}
                    </div>`;
        }).join('');
    }

    // Color selection handler
    selectColor(color) {
        const isMobile = window.innerWidth <= 768;
        this.app.appState.updateTheme(color);
        
        // Update color picker selection state
        const colorPicker = document.getElementById('preferencesColorPicker');
        if (colorPicker) {
            // Check if this is a custom color (not in the predefined list, excluding #000000)
            const isCustomColor = !THEMES.COLORS.includes(color) || color === '#000000';
            
            // Remove selected state from all options
            colorPicker.querySelectorAll('.color-picker__option').forEach(option => {
                option.style.border = '2px solid transparent';
                
                // Reset content based on option type
                if (option.classList.contains('color-picker__option--custom')) {
                    // Update custom picker with new color if it's a custom color
                    if (isCustomColor) {
                        option.style.backgroundColor = color;
                        option.style.border = '2px solid #333';
                    } else {
                        option.style.backgroundColor = '#000000';
                    }
                    // Always keep the palette icon
                    option.innerHTML = `<span class="material-icons" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: ${isMobile ? '12px' : '18px'}; text-shadow: 0 0 3px rgba(0,0,0,0.8);">palette</span>`;
                } else {
                    // Regular color options
                    option.innerHTML = '';
                }
            });
            
            // Add selected state to clicked option (only for predefined colors)
            if (!isCustomColor) {
                const selectedOption = Array.from(colorPicker.querySelectorAll('.color-picker__option'))
                    .find(option => option.style.backgroundColor === color);
                if (selectedOption && !selectedOption.classList.contains('color-picker__option--custom')) {
                    selectedOption.style.border = '2px solid #333';
                    selectedOption.innerHTML = `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: ${isMobile ? '12px' : '16px'}; font-weight: bold; text-shadow: 0 0 3px rgba(0,0,0,0.8);">✔</div>`;
                }
            }
        }
        
        // Update card numbers with new theme color
        document.querySelectorAll('.card__number').forEach(numberElement => {
            numberElement.style.background = color;
        });
        
        // Update time pills with new theme color IMMEDIATELY
        document.querySelectorAll('.card__time-pill').forEach(timePill => {
            timePill.style.background = color;
        });
        
        // Update edit mode time pills with new theme color IMMEDIATELY  
        document.querySelectorAll('.card__time-pill--edit').forEach(editTimePill => {
            editTimePill.style.background = color;
        });
        
        // Update StackMap logo colors
        this.updateLogoColors(color);
        
        // Update header if needed
        if (this.app.syncFixedHeader) {
            this.app.syncFixedHeader();
        }
    }

    // Update StackMap logo colors to match the selected theme
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
        this.updateLogoInstance('mainTitle', primaryColor, darkerColor);
        this.updateLogoInstance('fixedTitle', primaryColor, darkerColor);
        
        // Update welcome screen logo if it exists
        const welcomeLogo = document.querySelector('.welcome-logo svg');
        if (welcomeLogo) {
            this.updateSVGColors(welcomeLogo, primaryColor, darkerColor);
        }
    }

    updateLogoInstance(titleId, primaryColor, darkerColor) {
        const titleElement = document.getElementById(titleId);
        if (titleElement && titleElement.innerHTML.includes('svg')) {
            const svg = titleElement.querySelector('svg');
            if (svg) {
                this.updateSVGColors(svg, primaryColor, darkerColor);
            }
        }
    }

    updateSVGColors(svg, primaryColor, darkerColor) {
        // Update the rect colors in the logo
        const rects = svg.querySelectorAll('rect');
        if (rects.length >= 3) {
            // Top two rects use primary color
            rects[0].setAttribute('fill', primaryColor);
            rects[1].setAttribute('fill', primaryColor);
            // Bottom rect uses darker color
            rects[2].setAttribute('fill', darkerColor);
        }
    }

    // Create backdrop overlay for dimming background
    createBackdrop() {
        // Remove any existing backdrop first
        this.removeBackdrop();
        
        // Create backdrop element
        const backdrop = document.createElement('div');
        backdrop.id = 'preferencesBackdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            z-index: 998;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Add click handler to close preferences
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                this.closePreferences();
            }
        });
        
        // Add to body
        document.body.appendChild(backdrop);
        
        // Trigger animation
        setTimeout(() => {
            backdrop.style.opacity = '1';
        }, 10);
    }

    // Remove backdrop overlay
    removeBackdrop() {
        const backdrop = document.getElementById('preferencesBackdrop');
        if (backdrop) {
            backdrop.style.opacity = '0';
            setTimeout(() => {
                backdrop.remove();
            }, 300);
        }
    }
}