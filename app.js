// === MAIN STACKMAP APPLICATION ===
class StackMapApp {
    constructor() {
        // Initialize core state and renderer
        this.appState = new AppState();
        this.renderer = new AppRenderer(this.appState, this);
        
        // Initialize Google Drive sync
        this.driveSync = new GoogleDriveSync(this);
        
        // Initialize managers
        this.preferencesManager = new PreferencesManager(this);
        this.validationManager = new ValidationManager(this);
        
        // App state
        this.grownupMode = false;
        
        // Auto-sync debouncing
        this.autoSyncTimeout = null;
        
        // SET UP AUTO-SAVE
        this.appState.onStateChange = () => {
            this.saveToLocalStorage();
            // Auto-sync to Drive if enabled and signed in
            if (CONFIG.AUTO_SYNC_ENABLED) {
                this.debouncedAutoSync();
            }
        };
        
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.appState.applyTheme();
        this.setupEventListeners();
        this.setupInlineEditor();
        this.render();
        
        // Check for first-time visit and show welcome splash
        this.checkFirstTimeVisit();
        
        // Setup scroll header after everything is loaded
        setTimeout(() => {
            this.setupScrollHeader();
        }, 100);
        
        // Ensure proper icon state on load
        this.updateGrownupModeButton();
        
        // Set initial tab title
        this.updateTabTitle();
        
        // Fade in body after theme is applied
        requestAnimationFrame(() => {
            document.body.classList.add('loaded');
        });
        
        // Setup auto-sync interval if enabled
        if (CONFIG.AUTO_SYNC_ENABLED && CONFIG.AUTO_SYNC_INTERVAL) {
            this.setupAutoSyncInterval();
        }
    }

    setupAutoSyncInterval() {
        setInterval(() => {
            if (this.driveSync.isSignedIn && this.grownupMode) {
                this.driveSync.autoSync();
            }
        }, CONFIG.AUTO_SYNC_INTERVAL);
    }

    debouncedAutoSync() {
        if (this.autoSyncTimeout) {
            clearTimeout(this.autoSyncTimeout);
        }
        
        // Wait 5 seconds after last change before auto-syncing
        this.autoSyncTimeout = setTimeout(() => {
            this.driveSync.autoSync();
        }, 5000);
    }

    setupScrollHeader() {
        const staticHeader = document.querySelector('.static-header');
        const fixedHeader = document.querySelector('.fixed-header');
        
        if (!staticHeader || !fixedHeader) return;
        
        let ticking = false;

        const updateHeader = () => {
            const staticHeaderRect = staticHeader.getBoundingClientRect();
            const shouldShowFixed = staticHeaderRect.bottom <= 0;

            if (shouldShowFixed !== fixedHeader.classList.contains('visible')) {
                if (shouldShowFixed) {
                    fixedHeader.classList.add('visible');
                    document.body.classList.add('fixed-header-visible');
                } else {
                    fixedHeader.classList.remove('visible');
                    document.body.classList.remove('fixed-header-visible');
                }
                // Sync content when visibility changes
                this.syncFixedHeader();
            }
            
            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateHeader);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick, { passive: true });
        window.addEventListener('resize', requestTick, { passive: true });
        
        // Initial sync
        this.syncFixedHeader();
    }

    syncFixedHeader() {
        const { title, subtitle, isDefaultTitle } = this.appState.settings;
        const fixedTitle = document.getElementById('fixedTitle');
        const fixedSubtitle = document.getElementById('fixedSubtitle');
        
        if (!fixedTitle || !fixedSubtitle) return;
        
        // Update title
        if (isDefaultTitle) {
            fixedTitle.innerHTML = `
                <svg style="width: 1em; height: 1em; vertical-align: middle; margin-right: 0.3em;" xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>
                    <circle cx='16' cy='16' r='15' fill='rgba(255,255,255,0.9)' stroke='rgba(255,255,255,0.7)' stroke-width='1'/>
                    <rect x='7' y='10' width='18' height='2.5' fill='#4a90e2' rx='1.25'/>
                    <rect x='7' y='14.5' width='18' height='2.5' fill='#4a90e2' rx='1.25'/>
                    <rect x='7' y='19' width='18' height='5' fill='#2c5aa0' rx='2.5'/>
                </svg>StackMap
            `;
        } else {
            fixedTitle.textContent = title;
        }
        
        // Update subtitle
        fixedSubtitle.textContent = subtitle;
        
        // Handle subtitle visibility
        if (this.grownupMode) {
            fixedSubtitle.style.display = 'inline-block';
            fixedSubtitle.setAttribute('data-placeholder', 'Tap to add subtitle');
        } else {
            if (!subtitle.trim()) {
                fixedSubtitle.style.display = 'none';
            } else {
                fixedSubtitle.style.display = 'inline-block';
            }
            fixedSubtitle.removeAttribute('data-placeholder');
        }
    }

    updateGrownupModeButton() {
        const btn = document.getElementById('grownupBtn');
        if (!btn) return;
        
        const icon = btn.querySelector('.material-icons');
        if (!icon) return;
        
        if (this.grownupMode) {
            icon.textContent = 'child_care';
            btn.title = 'Switch to Kid Mode';
            btn.setAttribute('aria-label', 'Switch to kid mode');
        } else {
            icon.textContent = 'support_agent';
            btn.title = 'Grown-up Mode';
            btn.setAttribute('aria-label', 'Switch to grown-up mode for editing');
        }
    }

    updateTabTitle() {
        const { isDefaultTitle, title } = this.appState.settings;
        document.title = isDefaultTitle ? 'StackMap' : title;
    }

    setupEventListeners() {
        // Grown-up mode toggle
        const grownupBtn = document.getElementById('grownupBtn');
        if (grownupBtn) {
            grownupBtn.addEventListener('click', () => this.requestGrownupMode());
        }
        
        // File input for import (triggered from preferences panel)
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.importFromFile(e));
        }
    }

    setupInlineEditor() {
        const title = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        
        if (!title || !subtitle) return;
        
        // Title editing
        title.addEventListener('click', () => {
            if (!this.grownupMode) return;
            title.contentEditable = "true";
            title.textContent = this.appState.settings.title === 'My StackMap' ? 'My StackMap' : this.appState.settings.title;
            title.focus();
            this.selectText(title);
        });
        
        title.addEventListener('blur', () => {
            title.contentEditable = "false";
            this.saveInlineEdit('title', title);
            this.renderer.updateHeader();
            this.syncFixedHeader();
        });
        
        title.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                title.blur();
            }
        });
        
        // Subtitle editing
        subtitle.addEventListener('click', () => {
            if (!this.grownupMode) return;
            subtitle.contentEditable = "true";
            subtitle.focus();
            this.selectText(subtitle);
        });
        
        subtitle.addEventListener('blur', () => {
            subtitle.contentEditable = "false";
            this.saveInlineEdit('subtitle', subtitle);
            this.syncFixedHeader();
        });
        
        subtitle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                subtitle.blur();
            }
        });
    }

    selectText(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    saveInlineEdit(field, element) {
        const value = element.textContent.trim();
        if (field === 'title') {
            if (value) {
                this.appState.updateTitle(value);
                this.updateTabTitle();
            } else {
                this.appState.updateTitle('My StackMap');
                this.updateTabTitle();
            }
        } else if (field === 'subtitle') {
            this.appState.settings.subtitle = value;
            this.appState._triggerSave();
        }
        
        if (this.renderer.updateButtonPositioning) {
            this.renderer.updateButtonPositioning();
        }
    }

    // WELCOME SPLASH MANAGEMENT
    checkFirstTimeVisit() {
        const hasSeenWelcome = localStorage.getItem('stackmap-welcome-seen');
        if (!hasSeenWelcome) {
            this.showWelcomeSplash();
        }
    }

    showWelcomeSplash() {
        const welcomeSplash = document.getElementById('welcomeSplash');
        if (welcomeSplash) {
            // Add body class for button glow effect
            document.body.classList.add('showing-welcome');
            
            // Show the splash with a slight delay for better UX
            setTimeout(() => {
                welcomeSplash.classList.remove('hidden');
                
                // Set up event listeners for dismissal
                welcomeSplash.addEventListener('click', (e) => {
                    // Only dismiss if clicking outside the content
                    if (e.target === welcomeSplash) {
                        this.dismissWelcome();
                    }
                });
                
                // Escape key dismissal
                const handleEscape = (e) => {
                    if (e.key === 'Escape') {
                        this.dismissWelcome();
                        document.removeEventListener('keydown', handleEscape);
                    }
                };
                document.addEventListener('keydown', handleEscape);
            }, 500);
        }
    }

    dismissWelcome() {
        const welcomeSplash = document.getElementById('welcomeSplash');
        if (welcomeSplash) {
            // Fade out the welcome splash
            welcomeSplash.style.animation = 'welcomeFadeOut 0.3s ease-out forwards';
            
            // Remove from DOM and body class after animation
            setTimeout(() => {
                welcomeSplash.classList.add('hidden');
                document.body.classList.remove('showing-welcome');
                
                // Mark as seen in localStorage
                localStorage.setItem('stackmap-welcome-seen', 'true');
            }, 300);
        }
    }

    showWelcomeAgain() {
        // Close preferences panel first
        this.preferencesManager.closePreferences();
        
        // Show welcome splash again (temporarily reset the localStorage flag)
        const originalFlag = localStorage.getItem('stackmap-welcome-seen');
        localStorage.removeItem('stackmap-welcome-seen');
        
        setTimeout(() => {
            this.showWelcomeSplash();
            
            // Override the dismissWelcome method temporarily to restore the flag
            const originalDismiss = this.dismissWelcome.bind(this);
            this.dismissWelcome = () => {
                originalDismiss();
                if (originalFlag) {
                    localStorage.setItem('stackmap-welcome-seen', originalFlag);
                }
                // Restore original method
                this.dismissWelcome = originalDismiss;
            };
        }, 100);
    }

    // GROWN-UP MODE MANAGEMENT
    requestGrownupMode() {
        if (this.grownupMode) {
            this.exitGrownupMode();
        } else {
            this.validationManager.showValidation();
        }
    }

    enterGrownupMode() {
        this.grownupMode = true;
        this.appState.ui.editMode = true;
        
        // Add body class for CSS targeting
        document.body.classList.add('grownup-mode');
        
        this.updateGrownupModeButton();
        this.updateInlineEditability();
        
        // Update preferences panel if it's open
        if (!document.getElementById('preferencesPanel')?.classList.contains('hidden')) {
            this.preferencesManager.updatePreferencesPanel();
        }
        
        this.render();
        this.syncFixedHeader();
    }

    exitGrownupMode() {
        this.grownupMode = false;
        this.appState.ui.editMode = false;
        this.appState.ui.editingCardIndex = -1;
        this.appState.ui.showingNewCardForm = false;
        
        // Remove body class
        document.body.classList.remove('grownup-mode');
        
        this.updateGrownupModeButton();
        this.updateInlineEditability();
        
        // Update preferences panel if it's open
        if (!document.getElementById('preferencesPanel')?.classList.contains('hidden')) {
            this.preferencesManager.updatePreferencesPanel();
        }
        
        this.render();
        this.syncFixedHeader();
    }

    updateInlineEditability() {
        const title = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        
        if (title) {
            if (this.grownupMode) {
                title.title = 'Click to edit title';
            } else {
                title.removeAttribute('title');
                title.contentEditable = "false";
            }
        }
        
        if (subtitle) {
            if (this.grownupMode) {
                subtitle.title = 'Click to edit subtitle';
            } else {
                subtitle.removeAttribute('title');
                subtitle.contentEditable = "false";
            }
        }
    }

    render() {
        this.renderer.render();
        setTimeout(() => {
            this.syncFixedHeader();
        }, 0);
    }

    // NEW CARD FUNCTIONALITY
    openNewCardForm(position = 'top') {
        this.appState.ui.showingNewCardForm = position;
        this.render();
        
        // Focus on title input after render
        setTimeout(() => {
            const titleInput = document.getElementById('newActivityTitle');
            if (titleInput) {
                titleInput.focus();
            }
        }, 100);
    }

    closeNewCardForm() {
        this.appState.ui.showingNewCardForm = false;
        this.render();
    }

    addActivity(position = 'top') {
        const titleInput = document.getElementById('newActivityTitle');
        const descInput = document.getElementById('newActivityDescription');
        
        if (!titleInput || !descInput) return;
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        
        if (!title) {
            alert('Please enter a title');
            titleInput.focus();
            return;
        }
        
        try {
            // Use the AppState method which handles position properly
            this.appState.addActivity({
                title,
                description,
                icon: this.appState.ui.selectedEmoji
            }, position);
            
            this.clearNewActivity();
            this.closeNewCardForm();
            this.render();
        } catch (error) {
            alert(error.message);
        }
    }

    clearNewActivity() {
        const titleInput = document.getElementById('newActivityTitle');
        const descInput = document.getElementById('newActivityDescription');
        if (titleInput) titleInput.value = '';
        if (descInput) descInput.value = '';
        this.appState.ui.selectedEmoji = CONFIG.DEFAULT_EMOJI;
        this.closeNewCardForm();
    }

    selectNewEmoji(emoji) {
        this.appState.ui.selectedEmoji = emoji;
        const iconElement = document.getElementById('newActivityIcon');
        if (iconElement) iconElement.textContent = emoji;
    }

    // COLOR SELECTION - Delegate to PreferencesManager
    selectColor(color) {
        this.preferencesManager.selectColor(color);
    }

    // ACTIVITY MANAGEMENT
    duplicateActivity(index) {
        if (index >= 0 && index < this.appState.activities.length) {
            const originalActivity = this.appState.activities[index];
            const duplicatedActivity = {
                ...originalActivity,
                title: originalActivity.title + ' (Copy)',
                completed: false // Reset completion state
            };
            
            // Insert after the original
            this.appState.activities.splice(index + 1, 0, duplicatedActivity);
            this.appState._triggerSave();
            this.render();
        }
    }

    toggleVisibility(index) {
        this.appState.toggleActivityVisibility(index);
        this.render();
    }

    deleteActivity(index) {
        if (confirm('Are you sure you want to delete this activity?')) {
            this.appState.removeActivity(index);
            this.render();
        }
    }

    startCardEdit(index) {
        if (this.appState.ui.editMode) {
            this.appState.ui.editingCardIndex = index;
            this.render();
        }
    }

    cancelCardEdit() {
        this.appState.ui.editingCardIndex = -1;
        this.render();
    }

    saveCardEdit(index) {
        const titleInput = document.getElementById(`editTitle${index}`);
        const descInput = document.getElementById(`editDescription${index}`);
        
        if (!titleInput || !descInput) return;
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        
        if (!title) {
            alert('Please enter a title');
            return;
        }
        
        this.appState.updateActivity(index, { title, description });
        this.appState.ui.editingCardIndex = -1;
        this.render();
    }

    // DATA MANAGEMENT
    exportToFile() {
        const data = this.appState.exportData();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `stackmap-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.appState.importData(data);
                this.updateTabTitle();
                this.render();
                alert('StackMap imported successfully!');
            } catch (error) {
                alert('Error importing file. Please ensure it\'s a valid StackMap file.');
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    }

    // LOCAL STORAGE
    saveToLocalStorage() {
        const data = this.appState.exportData();
        try {
            localStorage.setItem('stackMapData', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('stackMapData');
            if (saved) {
                const data = JSON.parse(saved);
                this.appState.importData(data);
                return true;
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
            localStorage.removeItem('stackMapData');
        }
        return false;
    }
}