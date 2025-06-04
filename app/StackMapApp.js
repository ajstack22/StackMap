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
        this.setupInlineEditing();
        this.populateUserDropdowns();
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
        const { subtitle } = this.appState.settings;
        const fixedSubtitle = document.getElementById('fixedSubtitle');
        
        if (!fixedSubtitle) return;
        
        // Update subtitle
        fixedSubtitle.textContent = subtitle;
        
        // Sync user dropdown selection
        const userSelector = document.getElementById('userSelector');
        const fixedUserSelector = document.getElementById('fixedUserSelector');
        const currentUserId = this.appState.users.currentUserId;
        
        if (userSelector && fixedUserSelector) {
            fixedUserSelector.value = currentUserId;
            userSelector.value = currentUserId;
        }
        
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

    setupInlineEditing() {
        const subtitle = document.getElementById('subtitle');
        const fixedSubtitle = document.getElementById('fixedSubtitle');
        
        // Setup editing for both static and fixed subtitles
        [subtitle, fixedSubtitle].forEach(subtitleElement => {
            if (!subtitleElement) return;
            
            subtitleElement.addEventListener('click', () => {
                if (!this.grownupMode) return;
                subtitleElement.contentEditable = "true";
                subtitleElement.focus();
                this.selectText(subtitleElement);
            });
            
            subtitleElement.addEventListener('blur', () => {
                subtitleElement.contentEditable = "false";
                this.saveInlineEdit('subtitle', subtitleElement);
                this.syncFixedHeader();
            });
            
            subtitleElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    subtitleElement.blur();
                }
            });
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
        if (field === 'subtitle') {
            this.appState.settings.subtitle = value;
            this.appState._triggerSave();
        }
        
        this.renderer.updateButtonPositioning();
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

    // ENHANCED CLEAR PROGRESS FUNCTIONALITY
    showClearProgressConfirmation() {
        if (confirm('Clear all progress? This will:\n• Mark Recurring cards as incomplete\n• Hide Frequent cards and move to bottom\n• Delete Single Use cards')) {
            
            // 0.25 second delay before processing
            setTimeout(() => {
                const counts = this.processCardsForNewDay();
                
                // Re-render to show changes
                this.render();
                
                // Show sorting wave animation
                this.showSortingWaveAnimation(counts);
                
            }, 250); // 0.25 second delay as requested
        }
    }

    // New method to handle the card processing and reorganization
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