// app/StackMapApp.js - Fixed Icons and Toggle Logic
// === MAIN APP ===
import { WelcomeManager } from './WelcomeManager.js';
import { PreferencesManager } from './PreferencesManager.js';
import { ValidationManager } from './ValidationManager.js';

export class StackMapApp {
    constructor() {
        this.appState = new AppState();
        this.renderer = new AppRenderer(this.appState, this);
        
        // Initialize Google Drive sync
        this.driveSync = new GoogleDriveSync(this);
        
        // Initialize managers
        this.welcomeManager = new WelcomeManager(this);
        this.preferencesManager = new PreferencesManager(this);
        this.validationManager = new ValidationManager(this);
        
        // SET UP AUTO-SAVE
        this.appState.onStateChange = () => {
            this.saveToLocalStorage();
            // Auto-sync to Drive if enabled and signed in
            if (CONFIG.AUTO_SYNC_ENABLED) {
                this.debouncedAutoSync();
            }
        };
        
        this.grownupMode = false;
        
        // Auto-sync debouncing
        this.autoSyncTimeout = null;
        
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.appState.applyTheme();
        this.setupEventListeners();
        this.setupInlineEditing();
        this.render();
        
        // Check for first-time visit and show welcome splash
        this.welcomeManager.checkFirstTimeVisit();
        
        // Setup scroll header after everything is loaded
        setTimeout(() => {
            this.setupScrollHeader();
        }, 100);
        
        // Ensure proper icon state on load
        this.updateGrownupModeButton();
        this.updatePreferencesButton();
        
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
        const icon = btn.querySelector('.material-icons');
        
        if (this.grownupMode) {
            icon.textContent = 'face';
            btn.title = 'Switch to Kid Mode';
            btn.setAttribute('aria-label', 'Switch to Kid Mode');
        } else {
            icon.textContent = 'support_agent';
            btn.title = 'Grown-up Mode';
            btn.setAttribute('aria-label', 'Grown-up Mode');
        }
    }

    updateTabTitle() {
        const { isDefaultTitle, title } = this.appState.settings;
        document.title = isDefaultTitle ? 'StackMap' : title;
    }

    setupEventListeners() {
        // Preferences toggle
        document.getElementById('preferencesBtn').addEventListener('click', () => this.preferencesManager.togglePreferences());
        
        // Grown-up mode toggle
        document.getElementById('grownupBtn').addEventListener('click', () => this.requestGrownupMode());
        
        // File input for import
        document.getElementById('fileInput').addEventListener('change', (e) => this.importFromFile(e));
        
        // Preferences panel interactions
        document.addEventListener('change', (e) => {
            if (e.target.id === 'preferencesNumberToggle') {
                this.appState.settings.showNumbers = e.target.checked;
                this.appState._triggerSave();
                this.render();
            }
        });
        
        // Close panels when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.preferences-panel') && !e.target.closest('#preferencesBtn')) {
                this.preferencesManager.closePreferences();
            }
        });
    }

    quickSync() {
        if (!this.driveSync.isSignedIn) {
            this.preferencesManager.showPreferences(); // Open preferences to show sync options
            return;
        }
        
        // Quick upload to Drive
        this.driveSync.uploadData();
    }

    setupInlineEditing() {
        const title = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        
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
        
        this.renderer.updateButtonPositioning();
    }

    selectColor(color) {
        this.appState.updateTheme(color);
        
        // Update only the color picker selection state without regenerating HTML
        const colorPicker = document.getElementById('preferencesColorPicker');
        if (colorPicker) {
            // Remove selected class from all options
            colorPicker.querySelectorAll('.color-picker__option').forEach(option => {
                option.classList.remove('color-picker__option--selected');
            });
            
            // Add selected class to clicked option
            const selectedOption = Array.from(colorPicker.querySelectorAll('.color-picker__option'))
                .find(option => option.style.backgroundColor === color);
            if (selectedOption) {
                selectedOption.classList.add('color-picker__option--selected');
            }
        }
        
        // Update card numbers with new theme color
        document.querySelectorAll('.card__number').forEach(numberElement => {
            numberElement.style.background = color;
        });
        
        this.syncFixedHeader();
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
        this.updatePreferencesButton();
        
        this.updateInlineEditability();
        
        if (!document.getElementById('preferencesPanel').classList.contains('hidden')) {
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
        this.updatePreferencesButton();
        
        this.updateInlineEditability();
        
        if (!document.getElementById('preferencesPanel').classList.contains('hidden')) {
            this.preferencesManager.updatePreferencesPanel();
        }
        
        this.render();
        this.syncFixedHeader();
    }

    updatePreferencesButton() {
        const btn = document.getElementById('preferencesBtn');
        const icon = btn.querySelector('.material-icons');
        
        if (this.grownupMode) {
            icon.textContent = 'settings';
            btn.title = 'Settings & Preferences';
            btn.setAttribute('aria-label', 'Settings & Preferences');
        } else {
            icon.textContent = 'palette';
            btn.title = 'Preferences';
            btn.setAttribute('aria-label', 'Preferences');
        }
    }

    updateInlineEditability() {
        const title = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        
        if (this.grownupMode) {
            title.title = 'Click to edit title';
            subtitle.title = 'Click to edit subtitle';
        } else {
            title.removeAttribute('title');
            subtitle.removeAttribute('title');
            title.contentEditable = "false";
            subtitle.contentEditable = "false";
        }
    }

    render() {
        this.renderer.render();
        setTimeout(() => {
            this.syncFixedHeader();
        }, 0);
    }

    openNewCardForm(position = 'top') {
        this.appState.ui.showingNewCardForm = position;
        this.render();
    }

    closeNewCardForm() {
        this.appState.ui.showingNewCardForm = false;
        this.render();
    }

    addActivity(position = 'top') {
        const titleInput = document.getElementById('newActivityTitle');
        const descInput = document.getElementById('newActivityDescription');
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        
        if (!title) {
            alert('Please enter a title');
            return;
        }
        
        try {
            this.appState.addActivity({
                title,
                description,
                icon: this.appState.ui.selectedEmoji
            }, position);
            
            this.clearNewActivity();
            this.closeNewCardForm();
            this.saveToLocalStorage();
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

    duplicateActivity(index) {
        const activity = this.appState.activities[index];
        if (!activity) return;
        
        const duplicatedActivity = {
            ...activity,
            title: activity.title + ' (Copy)',
            completed: false
        };
        
        // Add the duplicate right after the original
        this.appState.activities.splice(index + 1, 0, duplicatedActivity);
        this.appState._triggerSave();
        this.render();
    }

    toggleVisibility(index) {
        this.appState.toggleActivityVisibility(index);
        this.saveToLocalStorage();
        this.render();
    }

    deleteActivity(index) {
        if (confirm('Are you sure you want to delete this activity?')) {
            this.appState.removeActivity(index);
            this.saveToLocalStorage();
            this.render();
        }
    }

    startCardEdit(index) {
        if (this.appState.ui.editMode) {
            // If already editing this card, close edit mode
            if (this.appState.ui.editingCardIndex === index) {
                this.cancelCardEdit();
            } else {
                this.appState.ui.editingCardIndex = index;
                this.render();
            }
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
        this.saveToLocalStorage();
        this.render();
    }

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
                this.saveToLocalStorage();
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