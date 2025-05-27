// app/PreferencesManager.js - Preferences panel management
// === PREFERENCES PANEL MANAGER ===
export class PreferencesManager {
    constructor(app) {
        this.app = app;
    }

    // PREFERENCES PANEL MANAGEMENT
    togglePreferences() {
        const panel = document.getElementById('preferencesPanel');
        
        if (panel.classList.contains('hidden')) {
            this.showPreferences();
        } else {
            this.closePreferences();
        }
    }

    showPreferences() {
        const panel = document.getElementById('preferencesPanel');
        this.updatePreferencesPanel();
        panel.classList.remove('hidden');
    }

    closePreferences() {
        const panel = document.getElementById('preferencesPanel');
        panel.classList.add('hidden');
    }

    updatePreferencesPanel() {
        const contentDiv = document.getElementById('preferencesContent');
        
        if (this.app.grownupMode) {
            // Grown-up mode: Settings without theme preferences
            contentDiv.innerHTML = `
                <h3>Settings</h3>
                <div class="preferences-section">
                    <label>Data Management</label>
                    <div class="data-management-controls">
                        <button class="btn btn--primary" onclick="document.getElementById('fileInput').click()">
                            <span class="material-icons">inbox</span>
                            Import StackMap
                        </button>
                        <button class="btn btn--primary" onclick="appInstance.exportToFile()">
                            <span class="material-icons">outbox</span>
                            Export StackMap
                        </button>
                    </div>
                </div>
                <div class="preferences-section">
                    <label>Google Drive Sync</label>
                    <div class="sync-controls">
                        <button class="btn btn--secondary" id="googleSignInBtn" onclick="appInstance.driveSync.signIn()" style="display: none;">
                            Connect Google Drive
                        </button>
                        <div class="sync-status" id="syncStatus" style="display: none;">
                            <span class="sync-user" id="syncUser"></span>
                            <button class="btn btn--link" onclick="appInstance.driveSync.signOut()">Disconnect</button>
                        </div>
                        <div class="sync-actions" id="syncActions" style="display: none;">
                            <button class="btn btn--primary" onclick="appInstance.driveSync.uploadData()">
                                <span class="material-icons">cloud_upload</span>
                                Save to Drive
                            </button>
                            <button class="btn btn--secondary" onclick="appInstance.driveSync.downloadData()">
                                <span class="material-icons">cloud_download</span>
                                Load from Drive
                            </button>
                        </div>
                    </div>
                </div>
                <div class="preferences-section">
                    <p class="preferences-hint">💡 Tap the title or subtitle above to edit them!</p>
                </div>
                <div class="preferences-footer">
                    <button class="btn btn--primary" onclick="window.appInstance?.preferencesManager?.closePreferences()">Done</button>
                    <button class="btn btn--link" onclick="window.appInstance?.welcomeManager?.showWelcomeAgain()" title="Show welcome tutorial again">
                        <span class="material-icons">help_outline</span>
                        Welcome Guide
                    </button>
                </div>
            `;
        } else {
            // Kid mode: Theme preferences only
            contentDiv.innerHTML = `
                <h3>Preferences</h3>
                <div class="preferences-section">
                    <label>Choose Your Colors</label>
                    <div class="color-picker" id="preferencesColorPicker"></div>
                </div>
                <div class="preferences-section">
                    <label class="preferences-checkbox">
                        <input type="checkbox" id="preferencesNumberToggle">
                        <span>Show Card Numbers</span>
                    </label>
                </div>
                <div class="preferences-section">
                    <p class="preferences-hint">🎨 Pick your favorite colors to make the app your own!</p>
                </div>
                <div class="preferences-footer">
                    <button class="btn btn--primary" onclick="window.appInstance?.preferencesManager?.closePreferences()">Done</button>
                </div>
            `;
            
            // Setup color picker for kid mode
            setTimeout(() => {
                const colorPicker = document.getElementById('preferencesColorPicker');
                if (colorPicker) {
                    colorPicker.innerHTML = this.createColorPickerHTML(this.app.appState.settings.backgroundColor);
                }
                
                // Setup checkbox for kid mode
                const numberToggle = document.getElementById('preferencesNumberToggle');
                if (numberToggle) {
                    numberToggle.checked = this.app.appState.settings.showNumbers;
                }
            }, 0);
        }
        
        // Update sync controls if in grown-up mode
        if (this.app.grownupMode) {
            setTimeout(() => {
                this.updateSyncControls();
            }, 0);
        }
    }

    updateSyncControls() {
        const signInBtn = document.getElementById('googleSignInBtn');
        const syncStatus = document.getElementById('syncStatus');
        const syncActions = document.getElementById('syncActions');
        
        if (this.app.driveSync.isSignedIn) {
            signInBtn.style.display = 'none';
            syncStatus.style.display = 'flex';
            syncActions.style.display = 'flex';
        } else {
            signInBtn.style.display = 'block';
            syncStatus.style.display = 'none';
            syncActions.style.display = 'none';
        }
    }

    createColorPickerHTML(selectedColor) {
        return THEMES.COLORS.map(color => {
            const isSelected = color === selectedColor ? 'color-picker__option--selected' : '';
            return `<div class="color-picker__option ${isSelected}" 
                         style="background-color: ${color};" 
                         onclick="appInstance.selectColor('${color}')" 
                         title="${color}"></div>`;
        }).join('');
    }
}