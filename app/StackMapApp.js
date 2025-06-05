// app/StackMapApp.js - Main application controller with card type and management card support
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
        
        // Card type selection for new cards (Story 1)
        this.selectedCardType = 'recurring';
        
        // Auto-sync debouncing
        this.autoSyncTimeout = null;
        
        // SET UP AUTO-SAVE
        this.appState.onStateChange = () => {
            // Save current user data before saving to storage
            this.appState.saveCurrentUserData();
            this.saveToLocalStorage();
            // Auto-sync to Drive if enabled and signed in
            if (CONFIG.AUTO_SYNC_ENABLED) {
                this.debouncedAutoSync();
            }
        };
        
        this.init();
    }

    init() {
        // Load data FIRST
        const hasData = this.loadFromLocalStorage();
        
        // Ensure user data is loaded
        if (!hasData) {
            // First time - load default user data
            this.appState.loadUserData();
        }
        
        // If no saved data, create default activities
        if (!hasData || this.appState.activities.length === 0) {
            this.createDefaultActivities();
        }
        
        // ALWAYS apply theme to ensure CSS variables are set
        this.appState.applyTheme();
        
        this.setupEventListeners();
        this.populateUserDropdowns();
        this.renderDaySelectors(); // Story 4: Initialize day selectors
        this.render();
        
        // Check for first-time visit and show welcome splash
        this.checkFirstTimeVisit();
        
        // Setup scroll header after everything is loaded
        setTimeout(() => {
            this.setupScrollHeader();
        }, 100);
        
        // Ensure proper icon state on load
        this.updateGrownupModeButton();
        
        // Force correct icons immediately
        setTimeout(() => {
            this.updateGrownupModeButton();
        }, 100);
        
        // Set initial tab title
        this.updateTabTitle();
        
        // Story 4: Set initial day context
        document.body.classList.add(`viewing-${this.appState.getCurrentDay()}`);
        
        // Fade in body after theme is applied
        requestAnimationFrame(() => {
            document.body.classList.add('loaded');
        });
        
        // Setup auto-sync interval if enabled
        if (CONFIG.AUTO_SYNC_ENABLED && CONFIG.AUTO_SYNC_INTERVAL) {
            this.setupAutoSyncInterval();
        }
    }

    createDefaultActivities() {
        // Check if DEFAULT_ACTIVITIES is available
        if (typeof DEFAULT_ACTIVITIES === 'undefined') {
            console.error('DEFAULT_ACTIVITIES not found. Make sure default-activities.js is loaded.');
            // Fallback to basic activities with card types
            this.appState.addActivity({
                title: 'Morning Stretch',
                description: 'Wake up your body!',
                icon: '🌞',
                visible: true,
                cardType: 'recurring'
            });
            this.appState.addActivity({
                title: 'Brush Teeth',
                description: 'Keep them clean and shiny!',
                icon: '🦷',
                visible: true,
                cardType: 'recurring'
            });
            this.appState.addActivity({
                title: 'Get Dressed',
                description: 'Pick your favorite outfit!',
                icon: '👕',
                visible: true,
                cardType: 'recurring'
            });
            return;
        }
        
        console.log('DEFAULT_ACTIVITIES found, loading', DEFAULT_ACTIVITIES.length, 'activities');
        
        // Load all default activities from the external data file
        DEFAULT_ACTIVITIES.forEach((activity, index) => {
            console.log(`Adding activity ${index + 1}:`, activity.title, 'visible:', activity.visible);
            // Ensure all default activities have a card type
            const activityWithType = {
                ...activity,
                cardType: activity.cardType || 'recurring'
            };
            this.appState.addActivity(activityWithType);
        });
        
        console.log('Total activities after loading defaults:', this.appState.activities.length);
        console.log('Visible activities:', this.appState.activities.filter(a => a.visible).length);
        console.log('Hidden activities:', this.appState.activities.filter(a => !a.visible).length);
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
        // Story 4: Sync day selectors and user dropdown
        this.renderDaySelectors();
        
        // Sync user dropdown selection
        const userSelector = document.getElementById('userSelector');
        const fixedUserSelector = document.getElementById('fixedUserSelector');
        const currentUserId = this.appState.users.currentUserId;
        
        if (userSelector && fixedUserSelector) {
            fixedUserSelector.value = currentUserId;
            userSelector.value = currentUserId;
        }
    }

    updateGrownupModeButton() {
        const btn = document.getElementById('grownupBtn');
        const icon = btn?.querySelector('.material-icons');
        
        if (btn && icon) {
            if (this.grownupMode) {
                icon.textContent = 'face';
                btn.title = 'User Mode';
                btn.setAttribute('aria-label', 'Switch to user mode');
            } else {
                icon.textContent = 'edit';
                btn.title = 'Edit Mode';
                btn.setAttribute('aria-label', 'Switch to edit mode');
            }
        }
        
        // Update preferences button icon based on mode
        const prefBtn = document.getElementById('preferencesBtn');
        const prefIcon = prefBtn?.querySelector('.material-icons');
        if (prefBtn && prefIcon) {
            if (this.grownupMode) {
                // Edit mode: show settings cog
                prefIcon.textContent = 'settings';
                prefBtn.title = 'Settings';
                prefBtn.setAttribute('aria-label', 'Open settings');
            } else {
                // User mode: show palette for colors
                prefIcon.textContent = 'palette';
                prefBtn.title = 'Preferences';
                prefBtn.setAttribute('aria-label', 'Open preferences and color settings');
            }
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
        
        // Import/Export file handling
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.importFromFile(e));
        }
        
        // User dropdown handlers
        const userSelector = document.getElementById('userSelector');
        const fixedUserSelector = document.getElementById('fixedUserSelector');
        const addUserBtn = document.getElementById('addUserBtn');
        const fixedAddUserBtn = document.getElementById('fixedAddUserBtn');
        
        // Handle user selection change
        [userSelector, fixedUserSelector].forEach(selector => {
            if (selector) {
                selector.addEventListener('change', (e) => this.handleUserSwitch(e.target.value));
            }
        });
        
        // Handle add user button clicks
        [addUserBtn, fixedAddUserBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.showAddUserDialog());
            }
        });
    }
    
    // User management methods
    handleUserSwitch(userId) {
        if (userId && userId !== this.appState.users.currentUserId) {
            this.appState.switchUser(userId);
            this.renderer.render();
            this.renderer.updateHeader();
            this.syncFixedHeader();
            this.populateUserDropdowns();
        }
    }
    
    showAddUserDialog() {
        const name = prompt('Enter name for new user (max 20 characters):');
        if (name && name.trim()) {
            const trimmedName = name.trim().substring(0, CONFIG.USER_NAME_MAX_LENGTH);
            if (trimmedName) {
                try {
                    const newUserId = this.appState.addUser(trimmedName);
                    this.handleUserSwitch(newUserId);
                    this.populateUserDropdowns();
                } catch (error) {
                    alert(error.message);
                }
            }
        }
    }
    
    populateUserDropdowns() {
        const userSelector = document.getElementById('userSelector');
        const fixedUserSelector = document.getElementById('fixedUserSelector');
        const currentUserId = this.appState.users.currentUserId;
        const users = this.appState.getAllUsers();
        
        [userSelector, fixedUserSelector].forEach(selector => {
            if (selector) {
                // Clear existing options
                selector.innerHTML = '';
                
                // Add options for each user
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    if (user.id === currentUserId) {
                        option.selected = true;
                    }
                    selector.appendChild(option);
                });
            }
        });
        
        // Initialize modern selectors if available
        if (window.ModernUserSelector && !this.modernUserSelector) {
            // Get containers
            const staticContainer = document.querySelector('.static-header .user-selector-container');
            const fixedContainer = document.querySelector('.fixed-header .user-selector-container');
            
            // Initialize static header selector
            if (staticContainer && userSelector) {
                this.modernUserSelector = new ModernUserSelector(staticContainer, userSelector, this);
            }
            
            // Initialize fixed header selector
            if (fixedContainer && fixedUserSelector) {
                this.modernFixedUserSelector = new ModernUserSelector(fixedContainer, fixedUserSelector, this);
            }
        }
    }
    
    // Story 4: Day Selector Methods
    renderDaySelectors() {
        const staticContainer = document.getElementById('daySelectorContainer');
        const fixedContainer = document.getElementById('fixedDaySelectorContainer');
        
        // Initialize modern day selectors if available
        if (window.ModernDaySelector) {
            if (staticContainer && !this.modernDaySelector) {
                this.modernDaySelector = new ModernDaySelector(staticContainer, this);
            }
            if (fixedContainer && !this.modernFixedDaySelector) {
                this.modernFixedDaySelector = new ModernDaySelector(fixedContainer, this);
            }
            
            // Update displays if already initialized
            if (this.modernDaySelector) {
                this.modernDaySelector.updateDisplay();
            }
            if (this.modernFixedDaySelector) {
                this.modernFixedDaySelector.updateDisplay();
            }
        } else {
            // Fallback to old selector
            if (staticContainer) {
                staticContainer.innerHTML = '';
                const counts = this.getDayCounts();
                const selector = ComponentBuilder.createDaySelector(
                    this.appState.getCurrentDay(),
                    counts.today,
                    counts.tomorrow
                );
                staticContainer.appendChild(selector);
            }
            
            if (fixedContainer) {
                fixedContainer.innerHTML = '';
                const counts = this.getDayCounts();
                const fixedSelector = ComponentBuilder.createDaySelector(
                    this.appState.getCurrentDay(),
                    counts.today,
                    counts.tomorrow
                );
                fixedContainer.appendChild(fixedSelector);
            }
        }
    }
    
    // Story 4: Get activity counts for each day
    getDayCounts() {
        const user = this.appState.getCurrentUser();
        return {
            today: user.activities.filter(a => a.visible).length,
            tomorrow: user.tomorrowActivities.filter(a => a.visible).length
        };
    }
    
    // Story 4: Update day count displays
    updateDayCounts() {
        const counts = this.getDayCounts();
        
        // Update all count displays
        document.querySelectorAll('#todayCount').forEach(el => {
            el.textContent = counts.today;
        });
        document.querySelectorAll('#tomorrowCount').forEach(el => {
            el.textContent = counts.tomorrow;
        });
    }
    
    // Story 4: Switch between today and tomorrow
    switchDay(day) {
        if (this.appState.getCurrentDay() !== day) {
            this.appState.setCurrentDay(day);
            
            // Update body class for visual distinction
            document.body.classList.remove('viewing-today', 'viewing-tomorrow');
            document.body.classList.add(`viewing-${day}`);
            
            // Update day selector visuals
            document.querySelectorAll('.day-option').forEach(option => {
                option.classList.remove('active');
                if (option.getAttribute('data-day') === day) {
                    option.classList.add('active');
                }
            });
            
            // Clear any filters when switching days
            this.clearAllFilters();
            
            this.render();
            this.updateDayCounts();
        }
    }
    
    // Helper method to clear all filters
    clearAllFilters() {
        this.filterCards('');
        this.appState.ui.filterSourcePosition = null;
        document.querySelectorAll('.filter-input').forEach(input => {
            input.value = '';
            const clearButton = input.parentElement.querySelector('.btn--clear-filter');
            if (clearButton) {
                clearButton.style.display = 'none';
            }
        });
    }

    // Story 4: Inline editing removed - subtitle replaced with day selector
    setupInlineEditing() {
        // No longer needed - day selector is not editable
    }

    selectText(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    // Story 4: saveInlineEdit removed - no longer needed without subtitle

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

    // EDIT MODE MANAGEMENT
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
        
        // Close any open modal
        ComponentBuilder.closeModalCard();
        
        // Remove body class
        document.body.classList.remove('grownup-mode');
        
        this.updateGrownupModeButton();
        this.updateInlineEditability();
        
        // Update preferences panel if it's open
        if (!document.getElementById('preferencesPanel')?.classList.contains('hidden')) {
            this.preferencesManager.updatePreferencesPanel();
        }
        
        // === STORY 2: Clear any active filters when exiting edit mode ===
        this.filterCards('');
        this.appState.ui.filterSourcePosition = null;
        document.querySelectorAll('.filter-input').forEach(input => {
            input.value = '';
        });
        
        this.render();
        this.syncFixedHeader();
    }

    updateInlineEditability() {
        const title = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        const fixedTitle = document.getElementById('fixedTitle');
        const fixedSubtitle = document.getElementById('fixedSubtitle');
        
        [title, fixedTitle].forEach(titleElement => {
            if (titleElement) {
                if (this.grownupMode) {
                    titleElement.title = 'Click to edit title';
                    titleElement.style.cursor = 'pointer';
                } else {
                    titleElement.removeAttribute('title');
                    titleElement.contentEditable = "false";
                    titleElement.style.cursor = 'default';
                }
            }
        });
        
        [subtitle, fixedSubtitle].forEach(subtitleElement => {
            if (subtitleElement) {
                if (this.grownupMode) {
                    subtitleElement.title = 'Click to edit subtitle';
                    subtitleElement.style.cursor = 'pointer';
                } else {
                    subtitleElement.removeAttribute('title');
                    subtitleElement.contentEditable = "false";
                    subtitleElement.style.cursor = 'default';
                }
            }
        });
    }

    render() {
        this.renderer.render();
        setTimeout(() => {
            this.syncFixedHeader();
            // Reapply filter if one exists
            this.reapplyFilter();
        }, 0);
    }

    // NEW CARD FUNCTIONALITY - Now uses modal
    openNewCardForm(position = 'top') {
        this.appState.ui.showingNewCardForm = position;
        
        // Show modal for new card with current selected card type
        ComponentBuilder.showModalCard(true, null, -1, this.appState.ui.selectedEmoji);
    }

    closeNewCardForm() {
        this.appState.ui.showingNewCardForm = false;
        ComponentBuilder.closeModalCard();
    }

    addActivity(position = 'top') {
        const titleInput = document.getElementById('newActivityTitle');
        const descInput = document.getElementById('newActivityDescription');
        const timeInput = document.getElementById('newActivityTime');
        
        if (!titleInput || !descInput) return;
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        const time = timeInput ? timeInput.value : '';
        
        if (!title) {
            alert('Please enter a title');
            titleInput.focus();
            return;
        }
        
        try {
            // Use the current form position or default
            const currentPosition = this.appState.ui.showingNewCardForm || position;
            
            // Use the AppState method which handles position properly
            this.appState.addActivity({
                title,
                description,
                icon: this.appState.ui.selectedEmoji,
                time,
                cardType: this.selectedCardType // Story 1: Include selected card type
            }, currentPosition);
            
            this.clearNewActivity();
            this.closeNewCardForm();
            this.render();
        } catch (error) {
            alert(error.message);
        }
    }

    clearNewActivity() {
        this.appState.ui.selectedEmoji = CONFIG.DEFAULT_EMOJI;
        this.selectedCardType = 'recurring'; // Story 1: Reset card type
        this.closeNewCardForm();
    }

    selectNewEmoji(emoji) {
        this.appState.ui.selectedEmoji = emoji;
        const iconElement = document.getElementById('newActivityIcon');
        if (iconElement) iconElement.textContent = emoji;
    }

    // STORY 1: Card Type Management
    cycleCardType(index) {
        if (index >= 0 && index < this.appState.activities.length) {
            this.appState.cycleCardType(index);
            this.render();
        }
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

    // EDIT MODE: Toggle completion without celebration
    toggleGrownupCompletion(index) {
        this.appState.toggleActivityCompletion(index);
        this.render(); // Re-render to update the checkbox
    }

    // STORY 2: Filter Functionality
    filterCards(searchTerm, sourcePosition = null) {
        const normalizedTerm = searchTerm.toLowerCase().trim();
        
        // Store current filter in app state
        this.appState.ui.cardFilter = normalizedTerm;
        this.appState.ui.filterSourcePosition = sourcePosition; // Track which management card is filtering
        
        // Debug log
        console.log('Filtering:', normalizedTerm, 'from position:', sourcePosition);
        
        // Hide/show management cards based on filter state
        if (normalizedTerm && sourcePosition) {
            // When filtering, hide the OTHER management card
            this.hideOtherManagementCards(sourcePosition);
        } else if (!normalizedTerm) {
            // When clearing filter, show all management cards
            this.showAllManagementCards();
        }
        
        // Apply filter to all activity cards
        document.querySelectorAll('.card:not(.management-card)').forEach((card, index) => {
            const activity = this.appState.activities[index];
            if (!activity) return;
            
            const matches = !normalizedTerm || 
                           activity.title.toLowerCase().includes(normalizedTerm) ||
                           activity.description.toLowerCase().includes(normalizedTerm);
            
            if (matches) {
                card.style.display = '';
                card.classList.remove('card--filtered');
            } else {
                card.style.display = 'none';
                card.classList.add('card--filtered');
            }
        });
        
        // Update filter count indicator
        this.updateFilterIndicator(normalizedTerm);
    }
    
    // Reapply existing filter (used after render)
    reapplyFilter() {
        if (this.appState.ui.cardFilter) {
            this.filterCards(this.appState.ui.cardFilter, this.appState.ui.filterSourcePosition);
            
            // Restore filter input values
            document.querySelectorAll('.filter-input').forEach(input => {
                if (input.id === `cardFilter${this.appState.ui.filterSourcePosition}`) {
                    input.value = this.appState.ui.cardFilter;
                    const clearButton = input.parentElement.querySelector('.btn--clear-filter');
                    if (clearButton) {
                        clearButton.style.display = 'flex';
                    }
                }
            });
        }
    }

    updateFilterIndicator(searchTerm) {
        const totalCards = this.appState.activities.length;
        const visibleCards = document.querySelectorAll('.card:not(.management-card):not([style*="display: none"])').length;
        
        // Update filter inputs with result count
        document.querySelectorAll('.filter-input').forEach(input => {
            if (searchTerm) {
                input.setAttribute('data-results', `${visibleCards}/${totalCards}`);
                input.classList.add('filter-input--active');
            } else {
                input.removeAttribute('data-results');
                input.classList.remove('filter-input--active');
            }
        });
    }

    // Management card filtering methods
    hideOtherManagementCards(activePosition) {
        console.log('Hiding other management cards, active position:', activePosition);
        document.querySelectorAll('.management-card').forEach(card => {
            const isActiveCard = card.classList.contains(`management-card--${activePosition}`);
            console.log('Card classes:', card.className, 'Is active?', isActiveCard);
            if (!isActiveCard) {
                card.style.display = 'none';
            }
        });
    }

    showAllManagementCards() {
        console.log('Showing all management cards');
        document.querySelectorAll('.management-card').forEach(card => {
            card.style.display = '';
        });
    }

    // Story 4: COMPLETE DAY FUNCTIONALITY
    showCompleteDayConfirmation() {
        if (confirm('Complete today and plan tomorrow?\n\nThis will:\n• Move tomorrow\'s activities to today\n• Create new tomorrow from today\'s recurring/frequent cards\n• Remove completed single-use cards')) {
            
            // 0.25 second delay before processing
            setTimeout(() => {
                this.completeDayTransition();
                
                // Show success message
                this.showSuccessToast('✨ Day completed! Ready for tomorrow.');
                
            }, 250); // 0.25 second delay as requested
        }
    }

    // Story 4: Complete day transition - move tomorrow to today, process today to new tomorrow
    completeDayTransition() {
        const user = this.appState.getCurrentUser();
        
        // Save current today activities for processing
        const todayActivities = [...user.activities];
        
        // Move tomorrow to today
        user.activities = [...user.tomorrowActivities];
        
        // Process today's activities for new tomorrow
        const newTomorrow = [];
        todayActivities.forEach(activity => {
            const cardType = activity.cardType || 'recurring';
            
            if (cardType === 'recurring') {
                // Recurring cards go to tomorrow, reset to incomplete
                newTomorrow.push({
                    ...activity,
                    completed: false,
                    visible: true
                });
            } else if (cardType === 'frequent') {
                // Frequent cards go to tomorrow, hidden and incomplete
                newTomorrow.push({
                    ...activity,
                    completed: false,
                    visible: false
                });
            }
            // Single-use cards are not carried forward
        });
        
        // Set new tomorrow
        user.tomorrowActivities = newTomorrow;
        
        // Switch to today view
        this.appState.setCurrentDay('today');
        document.body.classList.remove('viewing-today', 'viewing-tomorrow');
        document.body.classList.add('viewing-today');
        
        // Update UI
        this.renderDaySelectors();
        this.render();
        this.updateDayCounts();
        
        // Trigger save
        this.appState._triggerSave();
    }
    
    // Legacy method for backward compatibility (still used in some places)
    processCardsForNewDay() {
        const activeCards = [];      // recurring + single-use (stay visible and on top)
        const frequentCards = [];    // move to bottom and hide
        let deletedCount = 0;
        let hiddenCount = 0;
        
        this.appState.activities.forEach((activity) => {
            const cardType = activity.cardType || 'recurring';
            
            switch (cardType) {
                case 'recurring':
                    // Mark as incomplete and keep at top
                    activeCards.push({
                        ...activity,
                        completed: false
                    });
                    break;
                    
                case 'frequent':
                    // Mark as incomplete, hide, and move to bottom
                    frequentCards.push({
                        ...activity,
                        completed: false,
                        visible: false
                    });
                    hiddenCount++;
                    break;
                    
                case 'single-use':
                    // Delete by not adding to any array
                    deletedCount++;
                    break;
                    
                default:
                    // Fallback to recurring behavior
                    activeCards.push({
                        ...activity,
                        completed: false
                    });
            }
        });
        
        // Rebuild array: active cards first (maintaining their order), then hidden frequent cards
        this.appState.activities = [...activeCards, ...frequentCards];
        
        // Trigger save
        this.appState._triggerSave();
        
        return { frequentCount: hiddenCount, deletedCount };
    }

    // New method for the sorting wave animation
    showSortingWaveAnimation(counts) {
        const { frequentCount, deletedCount } = counts;
        
        // Get all visible activity cards (not management cards)
        const cards = document.querySelectorAll('.card:not(.management-card):not(.card--hidden)');
        
        // Apply sorting wave animation with 0.25s delay after confirmation
        cards.forEach((card, index) => {
            setTimeout(() => {
                // Add highlight effect
                card.style.transform = 'scale(1.02)';
                card.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                card.style.transition = 'all 0.15s ease-out';
                
                // Remove highlight after brief moment
                setTimeout(() => {
                    card.style.transform = '';
                    card.style.boxShadow = '';
                    card.style.transition = '';
                }, 150);
            }, index * 50); // Stagger each card by 50ms for wave effect
        });
        
        // Show success message after animation completes
        const totalAnimationTime = cards.length * 50 + 150;
        setTimeout(() => {
            this.showDayResetSuccess(frequentCount, deletedCount);
        }, totalAnimationTime);
    }

    // New method for the success feedback
    showDayResetSuccess(frequentCount, deletedCount) {
        let message = '✨ Day reset! Ready for new routine.';
        let details = [];
        
        if (frequentCount > 0) {
            details.push(`${frequentCount} frequent card${frequentCount > 1 ? 's' : ''} moved to bottom`);
        }
        if (deletedCount > 0) {
            details.push(`${deletedCount} single-use card${deletedCount > 1 ? 's' : ''} deleted`);
        }
        
        if (details.length > 0) {
            message += '\n' + details.join(' • ');
        }
        
        // Use a simple toast-like notification
        this.showSuccessToast(message);
    }

    // New method for the success toast
    showSuccessToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: #28a745;
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 10001;
            max-width: 90vw;
            text-align: center;
            transition: transform 0.3s ease-out, opacity 0.3s ease-out;
            opacity: 0;
            white-space: pre-line;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
            toast.style.opacity = '1';
        });
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            toast.style.opacity = '0';
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    // Card editing is now handled via modal - these methods are simplified
    startCardEdit(index, focusField = null) {
        if (this.appState.ui.editMode) {
            const activity = this.appState.activities[index];
            if (activity) {
                const modal = ComponentBuilder.showModalCard(false, activity, index);
                
                // Focus on specific field if requested
                if (focusField) {
                    setTimeout(() => {
                        let targetInput = null;
                        switch (focusField) {
                            case 'title':
                                targetInput = document.getElementById(`editTitle${index}`);
                                break;
                            case 'description':
                                targetInput = document.getElementById(`editDescription${index}`);
                                break;
                            case 'time':
                                targetInput = document.getElementById(`editTime${index}`);
                                break;
                            case 'emoji':
                                targetInput = document.getElementById(`cardEmoji${index}`);
                                break;
                        }
                        
                        if (targetInput) {
                            targetInput.focus();
                            // Select text for text inputs (but not time inputs)
                            if (focusField === 'title' || focusField === 'description') {
                                targetInput.select();
                            }
                        }
                    }, 100); // Wait for modal to be fully rendered
                }
            }
        }
    }

    cancelCardEdit() {
        this.appState.ui.editingCardIndex = -1;
        ComponentBuilder.closeModalCard();
    }

    saveCardEdit(index) {
        const titleInput = document.getElementById(`editTitle${index}`);
        const descInput = document.getElementById(`editDescription${index}`);
        const timeInput = document.getElementById(`editTime${index}`);
        
        if (!titleInput || !descInput) return;
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        const time = timeInput ? timeInput.value : '';
        
        if (!title) {
            alert('Please enter a title');
            return;
        }
        
        // Story 1: Card type is handled in the modal component
        this.appState.updateActivity(index, { title, description, time });
        this.appState.ui.editingCardIndex = -1;
        ComponentBuilder.closeModalCard();
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
    
    // Story 3: Export individual user
    exportUser(userId) {
        const user = this.appState.users.profiles[userId];
        if (!user) {
            alert('User not found');
            return;
        }
        
        const exportData = {
            version: CONFIG.DATA_VERSION,
            exportType: 'single-user',
            exportDate: new Date().toISOString(),
            user: {
                id: userId,
                name: user.name,
                activities: user.activities,
                settings: user.settings,
                metadata: {
                    activityCount: user.activities.length,
                    lastModified: new Date().toISOString()
                }
            }
        };
        
        const filename = `stackmap-${user.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        this.downloadFile(exportData, filename);
    }
    
    // Story 3: Export all users with manifest
    exportAllUsers() {
        const users = this.appState.getAllUsers();
        const exportData = {
            version: CONFIG.DATA_VERSION,
            exportType: 'multi-user',
            exportDate: new Date().toISOString(),
            manifest: {
                userCount: users.length,
                totalActivities: users.reduce((sum, user) => sum + user.activities.length, 0),
                users: users.map(user => ({
                    id: user.id,
                    name: user.name,
                    activityCount: user.activities.length
                }))
            },
            users: this.appState.users
        };
        
        const filename = `stackmap-family-${users.length}users-${new Date().toISOString().split('T')[0]}.json`;
        this.downloadFile(exportData, filename);
    }
    
    // Story 3: Helper method for exporting selected user from dropdown
    exportSelectedUser() {
        const userExportSelect = document.getElementById('userExportSelect');
        if (userExportSelect && userExportSelect.value) {
            this.exportUser(userExportSelect.value);
        } else {
            alert('Please select a user to export');
        }
    }
    
    // Story 3: Helper method for downloading files
    downloadFile(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.currentImportFileName = file.name;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.showImportPreview(data);
            } catch (error) {
                alert('Error importing file. Please ensure it\'s a valid StackMap file.');
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    }
    
    // Story 3: Show import preview before applying
    showImportPreview(fileData) {
        const modal = document.getElementById('importPreviewModal');
        const fileNameSpan = document.getElementById('importFileName');
        const fileTypeSpan = document.getElementById('importFileType');
        const userCountSpan = document.getElementById('importUserCount');
        const userListDiv = document.getElementById('importUserList');
        const conflictsDiv = document.getElementById('importConflicts');
        
        // Analyze import file
        const analysis = this.analyzeImportFile(fileData);
        this.pendingImportData = { analysis, fileData };
        
        // Populate preview information
        fileNameSpan.textContent = analysis.fileName;
        fileTypeSpan.textContent = analysis.type;
        userCountSpan.textContent = analysis.userCount;
        
        // Show user selection checkboxes
        userListDiv.innerHTML = analysis.users.map(user => `
            <label class="import-user-option">
                <input type="checkbox" value="${user.id}" checked>
                <span class="user-info">
                    <strong>${user.name}</strong>
                    <small>${user.activityCount} activities</small>
                </span>
            </label>
        `).join('');
        
        // Show conflicts if any
        if (analysis.conflicts.length > 0) {
            conflictsDiv.innerHTML = `
                <div class="conflict-warning">
                    <h4>⚠️ Name Conflicts</h4>
                    <ul>${analysis.conflicts.map(conflict => `<li>${conflict}</li>`).join('')}</ul>
                    <p>Existing users with same names will be renamed with "-imported" suffix.</p>
                </div>
            `;
        } else {
            conflictsDiv.innerHTML = '';
        }
        
        // Set up event handlers
        document.getElementById('confirmImport').onclick = () => this.confirmImport();
        document.getElementById('cancelImport').onclick = () => this.cancelImport();
        
        modal.classList.remove('hidden');
    }
    
    // Story 3: Analyze import file and detect conflicts
    analyzeImportFile(data) {
        const existingUsers = this.appState.getAllUsers();
        const existingNames = existingUsers.map(u => u.name.toLowerCase());
        
        let users = [];
        let type = 'unknown';
        
        if (data.exportType === 'single-user' && data.user) {
            users = [data.user];
            type = 'Single User';
        } else if (data.exportType === 'multi-user' && data.users) {
            users = Object.values(data.users.profiles);
            type = 'Multi-User Family';
        } else if (data.users && data.users.profiles) {
            // Legacy multi-user format
            users = Object.values(data.users.profiles);
            type = 'Multi-User (Legacy)';
        } else if (data.activities) {
            // Legacy single-user format
            users = [{
                id: 'imported-' + Date.now(),
                name: data.settings?.title || 'Imported User',
                activities: data.activities,
                settings: data.settings || {}
            }];
            type = 'Single User (Legacy)';
        }
        
        // Detect name conflicts
        const conflicts = users
            .filter(user => existingNames.includes(user.name.toLowerCase()))
            .map(user => `"${user.name}" already exists`);
        
        return {
            fileName: this.currentImportFileName || 'uploaded-file.json',
            type,
            userCount: users.length,
            users: users.map(user => ({
                id: user.id || 'new-' + Date.now() + Math.random(),
                name: user.name,
                activityCount: user.activities?.length || 0
            })),
            conflicts,
            rawData: data
        };
    }
    
    // Story 3: Confirm import with selected users
    confirmImport() {
        if (!this.pendingImportData) return;
        
        const { analysis, fileData } = this.pendingImportData;
        const selectedCheckboxes = document.querySelectorAll('#importUserList input[type="checkbox"]:checked');
        const selectedUserIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
        if (selectedUserIds.length === 0) {
            alert('Please select at least one user to import');
            return;
        }
        
        // Process the import
        try {
            this.processSelectiveImport(fileData, selectedUserIds, analysis);
            this.updateTabTitle();
            this.populateUserDropdowns();
            this.render();
            
            // Show success message
            const importedCount = selectedUserIds.length;
            const message = importedCount === 1 
                ? '1 user imported successfully!' 
                : `${importedCount} users imported successfully!`;
            alert(message);
            
            this.cancelImport();
        } catch (error) {
            alert('Error during import: ' + error.message);
        }
    }
    
    // Story 3: Process selective import
    processSelectiveImport(fileData, selectedUserIds, analysis) {
        const existingUsers = this.appState.getAllUsers();
        const existingNames = existingUsers.map(u => u.name.toLowerCase());
        
        if (fileData.exportType === 'single-user' && fileData.user) {
            if (selectedUserIds.includes(fileData.user.id)) {
                this.importSingleUser(fileData.user, existingNames);
            }
        } else if (fileData.exportType === 'multi-user' && fileData.users) {
            // Import selected users from multi-user export
            selectedUserIds.forEach(userId => {
                const user = fileData.users.profiles[userId];
                if (user) {
                    this.importSingleUser(user, existingNames);
                }
            });
        } else if (fileData.users && fileData.users.profiles) {
            // Legacy multi-user format
            selectedUserIds.forEach(userId => {
                const user = fileData.users.profiles[userId];
                if (user) {
                    this.importSingleUser(user, existingNames);
                }
            });
        } else if (fileData.activities && selectedUserIds.length > 0) {
            // Legacy single-user format
            const user = {
                name: fileData.settings?.title || 'Imported User',
                activities: fileData.activities,
                settings: fileData.settings || {}
            };
            this.importSingleUser(user, existingNames);
        }
    }
    
    // Story 3: Import a single user with conflict resolution
    importSingleUser(userData, existingNames) {
        let userName = userData.name;
        
        // Handle name conflicts
        if (existingNames.includes(userName.toLowerCase())) {
            userName = userName + '-imported';
            // Keep adding numbers if still conflicts
            let counter = 1;
            while (existingNames.includes(userName.toLowerCase())) {
                userName = userData.name + '-imported' + counter;
                counter++;
            }
        }
        
        // Add user to state
        const newUserId = this.appState.addUser(userName);
        
        // Update the user's data
        this.appState.users.profiles[newUserId] = {
            id: newUserId,
            name: userName,
            activities: userData.activities || [],
            settings: userData.settings || {
                ...this.appState.settings,
                title: userName
            }
        };
        
        // Add the new name to existing names to prevent duplicates within this import
        existingNames.push(userName.toLowerCase());
        
        this.appState._triggerSave();
    }
    
    // Story 3: Cancel import
    cancelImport() {
        const modal = document.getElementById('importPreviewModal');
        modal.classList.add('hidden');
        this.pendingImportData = null;
        this.currentImportFileName = null;
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

// Make available globally
window.StackMapApp = StackMapApp;

// Story 2 Validation Suite
const validateStory2 = () => {
    console.log('=== STORY 2 VALIDATION ===');
    
    // Test 1: UI Elements Present
    const userSelector = document.getElementById('userSelector');
    const fixedUserSelector = document.getElementById('fixedUserSelector');
    const addUserBtn = document.getElementById('addUserBtn');
    const fixedAddUserBtn = document.getElementById('fixedAddUserBtn');
    
    console.log('✅ Static dropdown present:', !!userSelector);
    console.log('✅ Fixed dropdown present:', !!fixedUserSelector);
    console.log('✅ Add user button present:', !!addUserBtn);
    console.log('✅ Fixed add user button present:', !!fixedAddUserBtn);
    
    // Test 2: Dropdown Population
    if (userSelector) {
        console.log('✅ Dropdown options count:', userSelector.options.length);
        console.log('✅ Current selection:', userSelector.value);
        
        // List all available users
        const users = Array.from(userSelector.options).map(opt => opt.text);
        console.log('✅ Available users:', users);
    }
    
    // Test 3: Add User Button Visibility
    const isGrownupMode = document.body.classList.contains('grownup-mode');
    const addBtnVisible = addUserBtn && getComputedStyle(addUserBtn).display !== 'none';
    console.log('✅ Grown-up mode:', isGrownupMode);
    console.log('✅ Add button visible in grown-up mode:', isGrownupMode ? addBtnVisible : 'N/A (child mode)');
    
    // Test 4: Touch Targets (Mobile Accessibility)
    if (userSelector) {
        const dropdownRect = userSelector.getBoundingClientRect();
        const touchTarget = Math.min(dropdownRect.width, dropdownRect.height);
        console.log('✅ Dropdown touch target size:', touchTarget + 'px', touchTarget >= 44 ? '(PASS)' : '(FAIL - needs 44px+)');
    }
    
    if (addUserBtn) {
        const btnRect = addUserBtn.getBoundingClientRect();
        const btnTouchTarget = Math.min(btnRect.width, btnRect.height);
        console.log('✅ Add button touch target:', btnTouchTarget + 'px', btnTouchTarget >= 44 ? '(PASS)' : '(FAIL - needs 44px+)');
    }
    
    // Test 5: Event Handlers
    console.log('✅ User switching method exists:', typeof appInstance.handleUserSwitch === 'function');
    console.log('✅ Add user method exists:', typeof appInstance.showAddUserDialog === 'function');
    
    // Test 6: Responsive Design
    const isMobile = window.innerWidth <= 768;
    console.log('✅ Current viewport:', window.innerWidth + 'px', isMobile ? '(Mobile)' : '(Desktop)');
    
    console.log('=== VALIDATION COMPLETE ===');
    
    // Return summary
    const passed = userSelector && fixedUserSelector && addUserBtn && 
                  userSelector.options.length > 0 && 
                  typeof appInstance.handleUserSwitch === 'function';
    
    return passed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌';
};

// Make validation function globally available
window.validateStory2 = validateStory2;

// Story 3 Validation Suite
const validateStory3 = () => {
    console.log('=== STORY 3 VALIDATION ===');
    
    // Test 1: Export Interface Present
    const exportAllBtn = document.querySelector('.export-all-btn');
    const exportUserBtn = document.querySelector('.export-user-btn');
    const userExportSelect = document.querySelector('.user-export-select');
    
    console.log('✅ Export all button present:', !!exportAllBtn);
    console.log('✅ Export user button present:', !!exportUserBtn);
    console.log('✅ User export dropdown present:', !!userExportSelect);
    
    // Test 2: Export Methods Exist
    console.log('✅ Export user method exists:', typeof appInstance.exportUser === 'function');
    console.log('✅ Export all users method exists:', typeof appInstance.exportAllUsers === 'function');
    
    // Test 3: Import Preview Modal
    const importModal = document.getElementById('importPreviewModal');
    console.log('✅ Import preview modal present:', !!importModal);
    
    // Test 4: Import Analysis Methods
    console.log('✅ Import preview method exists:', typeof appInstance.showImportPreview === 'function');
    console.log('✅ Import analysis method exists:', typeof appInstance.analyzeImportFile === 'function');
    
    // Test 5: File Naming Functions
    console.log('✅ Download file method exists:', typeof appInstance.downloadFile === 'function');
    
    // Test 6: User Export Dropdown Population
    if (userExportSelect) {
        const optionCount = userExportSelect.options.length;
        console.log('✅ Export dropdown populated:', optionCount > 1);
        console.log('✅ Export dropdown user count:', optionCount - 1, '(excluding placeholder)');
    }
    
    console.log('=== VALIDATION COMPLETE ===');
    
    const passed = exportAllBtn && exportUserBtn && importModal && 
                  typeof appInstance.exportUser === 'function' &&
                  typeof appInstance.showImportPreview === 'function';
    
    return passed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌';
};

// Test export functionality
const testExport = () => {
    console.log('=== EXPORT FUNCTIONALITY TEST ===');
    
    const users = appInstance.appState.getAllUsers();
    console.log('Available users for export:', users.map(u => u.name));
    
    if (users.length > 0) {
        console.log('✅ Ready to test individual user export');
        console.log('✅ Ready to test all users export');
    } else {
        console.log('❌ No users available for export testing');
    }
};

// Make validation functions globally available
window.validateStory3 = validateStory3;
window.testExport = testExport;

// Story 4 Validation Suite
const validateStory4 = () => {
    console.log('=== STORY 4 VALIDATION ===');
    
    // Test 1: Day Selector Present
    const daySelector = document.getElementById('daySelectorContainer');
    const todayOption = document.querySelector('.day-option--today');
    const tomorrowOption = document.querySelector('.day-option--tomorrow');
    
    console.log('✅ Day selector container present:', !!daySelector);
    console.log('✅ Today option present:', !!todayOption);
    console.log('✅ Tomorrow option present:', !!tomorrowOption);
    
    // Test 2: Day Switching Methods
    console.log('✅ Switch day method exists:', typeof appInstance.switchDay === 'function');
    console.log('✅ Complete day method exists:', typeof appInstance.completeDayTransition === 'function');
    
    // Test 3: Data Structure
    const user = appInstance.appState.getCurrentUser();
    console.log('✅ Tomorrow activities array exists:', Array.isArray(user.tomorrowActivities));
    console.log('✅ Current day tracking:', appInstance.appState.getCurrentDay());
    
    // Test 4: Day Counts
    const todayCount = document.getElementById('todayCount');
    const tomorrowCount = document.getElementById('tomorrowCount');
    console.log('✅ Today count element:', !!todayCount);
    console.log('✅ Tomorrow count element:', !!tomorrowCount);
    
    // Test 5: Complete Day Button
    const completeDayBtn = document.querySelector('.btn--complete-day');
    console.log('✅ Complete day button present:', !!completeDayBtn);
    
    // Test 6: Visual Context
    const bodyClasses = document.body.className;
    console.log('✅ Body has day context class:', bodyClasses.includes('viewing-'));
    
    // Test 7: Touch Targets (Mobile Accessibility)
    if (todayOption) {
        const optionRect = todayOption.getBoundingClientRect();
        const touchTarget = Math.min(optionRect.width, optionRect.height);
        console.log('✅ Day option touch target:', touchTarget + 'px', touchTarget >= 44 ? '(PASS)' : '(FAIL)');
    }
    
    console.log('=== VALIDATION COMPLETE ===');
    
    const passed = daySelector && todayOption && tomorrowOption &&
                  typeof appInstance.switchDay === 'function' &&
                  Array.isArray(user.tomorrowActivities) &&
                  completeDayBtn;
    
    return passed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌';
};

// Test day transition functionality
const testDayTransition = () => {
    console.log('=== DAY TRANSITION TEST ===');
    
    const user = appInstance.appState.getCurrentUser();
    
    console.log('Current day:', appInstance.appState.getCurrentDay());
    console.log('Today activities:', user.activities.length);
    console.log('Tomorrow activities:', user.tomorrowActivities.length);
    
    // Test card type distribution
    const todayTypes = user.activities.reduce((acc, activity) => {
        acc[activity.cardType || 'recurring'] = (acc[activity.cardType || 'recurring'] || 0) + 1;
        return acc;
    }, {});
    
    console.log('Today card types:', todayTypes);
    
    if (user.tomorrowActivities.length > 0) {
        const tomorrowTypes = user.tomorrowActivities.reduce((acc, activity) => {
            acc[activity.cardType || 'recurring'] = (acc[activity.cardType || 'recurring'] || 0) + 1;
            return acc;
        }, {});
        
        console.log('Tomorrow card types:', tomorrowTypes);
    }
    
    console.log('✅ Ready for day transition testing');
    console.log('=== TEST COMPLETE ===');
};

// Make validation functions globally available
window.validateStory4 = validateStory4;
window.testDayTransition = testDayTransition;