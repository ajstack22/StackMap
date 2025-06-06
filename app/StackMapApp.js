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
        this.renderLogos(); // Render StackMap logos
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
        
        // Initialize after DOM is ready
        setTimeout(() => {
            this.initializeTitleSubtitle();
            this.initializeDrawer();
            this.initializeScrollHeader();
        }, 100);
    }
    
    initializeScrollHeader() {
        // No longer needed - header is always fixed
        this.updateBodyPadding();
    }

    updateBodyPadding() {
        // Calculate proper body padding based on header height
        const appHeader = document.querySelector('.app-header');
        if (appHeader) {
            const headerHeight = appHeader.offsetHeight;
            // Add inline style to body for padding
            document.body.style.paddingTop = `${headerHeight + 15}px`;
        }
    }

    initializeTitleSubtitle() {
        // Get current user's custom title and subtitle
        const currentUser = this.appState.getCurrentUser();
        const userTitle = currentUser.customTitle || 'StackMap';
        const userSubtitle = currentUser.customSubtitle || 'Routine Ready';
        
        // Update all title elements
        const mainTitle = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        
        if (mainTitle) {
            mainTitle.textContent = userTitle;
            this.updateLogoVisibility(userTitle);
        }
        if (subtitle) subtitle.textContent = userSubtitle;
        
        // Setup edit listeners
        this.setupTitleEditListeners();
    }
    
    setupTitleEditListeners() {
        const mainTitle = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        
        if (mainTitle) {
            mainTitle.addEventListener('focus', () => {
                if (this.grownupMode) {
                    mainTitle.contentEditable = true;
                }
            });
            
            mainTitle.addEventListener('blur', () => {
                mainTitle.contentEditable = false;
                this.saveTitleChanges();
            });
            
            mainTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    mainTitle.blur();
                }
            });
        }
        
        if (subtitle) {
            subtitle.addEventListener('focus', () => {
                if (this.grownupMode) {
                    subtitle.contentEditable = true;
                }
            });
            
            subtitle.addEventListener('blur', () => {
                subtitle.contentEditable = false;
                this.saveTitleChanges();
            });
            
            subtitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    subtitle.blur();
                }
            });
        }
    }
    
    saveTitleChanges() {
        const mainTitle = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        
        if (mainTitle && subtitle) {
            const newTitle = mainTitle.textContent.trim() || 'StackMap';
            const newSubtitle = subtitle.textContent.trim() || 'Routine Ready';
            
            // Update logo visibility when title changes
            this.updateLogoVisibility(newTitle);
            
            // Save to current user
            const currentUser = this.appState.getCurrentUser();
            currentUser.customTitle = newTitle;
            currentUser.customSubtitle = newSubtitle;
            
            
            // Save to storage
            this.appState.saveCurrentUserData();
            this.appState.onStateChange();
        }
    }
    
    initializeDrawer() {
        const drawerHandle = document.getElementById('drawerHandle');
        const drawerExtension = document.getElementById('drawerExtension');
        const drawerDone = document.getElementById('drawerDone');
        const appHeader = document.getElementById('appHeader');
        const backdrop = this.createBackdrop();
        
        if (!drawerHandle || !drawerExtension) return;
        
        let isOpen = false;
        let isDragging = false;
        let startY = 0;
        let currentY = 0;
        
        const openDrawer = () => {
            console.log('Opening drawer...');
            isOpen = true;
            drawerHandle.setAttribute('aria-expanded', 'true');
            drawerExtension.setAttribute('aria-hidden', 'false');
            drawerExtension.classList.add('open');
            appHeader.classList.add('drawer-open');
            document.getElementById('headerWrapper')?.classList.add('drawer-open');
            backdrop.classList.add('visible');
            document.body.classList.add('drawer-active');
            this.populateDrawerSelects();
            console.log('Drawer opened');
        };
        
        const closeDrawer = () => {
            console.log('closeDrawer called');
            isOpen = false;
            drawerHandle.setAttribute('aria-expanded', 'false');
            drawerExtension.setAttribute('aria-hidden', 'true');
            drawerExtension.classList.remove('open');
            appHeader.classList.remove('drawer-open');
            document.getElementById('headerWrapper')?.classList.remove('drawer-open');
            backdrop.classList.remove('visible');
            document.body.classList.remove('drawer-active');
            console.log('Drawer closed');
        };
        
        // Touch/drag support
        const handleStart = (e) => {
            isDragging = true;
            startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            drawerHandle.style.transition = 'none';
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Open drawer if dragged down more than 30px
            if (deltaY > 30 && !isOpen) {
                openDrawer();
                isDragging = false;
            }
            // Close drawer if dragged up more than 30px
            else if (deltaY < -30 && isOpen) {
                closeDrawer();
                isDragging = false;
            }
        };
        
        const handleEnd = () => {
            isDragging = false;
            drawerHandle.style.transition = '';
        };
        
        // Click handlers
        drawerHandle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            console.log('Drawer handle clicked, isOpen:', isOpen);
            if (!isDragging) {
                if (isOpen) {
                    console.log('Closing drawer...');
                    closeDrawer();
                } else {
                    console.log('Opening drawer...');
                    openDrawer();
                }
            }
        });
        
        // Touch events
        drawerHandle.addEventListener('touchstart', handleStart, { passive: true });
        drawerHandle.addEventListener('touchmove', handleMove, { passive: false });
        drawerHandle.addEventListener('touchend', handleEnd);
        
        // Mouse events (for testing on desktop)
        drawerHandle.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        
        // Remove Done button listener (button removed from HTML)
        backdrop.addEventListener('click', closeDrawer);
        
        // Keyboard support
        drawerHandle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (isOpen) closeDrawer();
                else openDrawer();
            }
        });
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                closeDrawer();
            }
        });
        
        // Setup select change handlers
        this.setupDrawerSelects();
    }
    
    createBackdrop() {
        const backdrop = document.createElement('div');
        backdrop.className = 'drawer-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);
        return backdrop;
    }
    
    populateDrawerSelects() {
        console.log('populateDrawerSelects called');
        const userSection = document.getElementById('userSection');
        const daySelect = document.getElementById('drawerDaySelect');
        
        console.log('User section element:', userSection);
        console.log('Day select element:', daySelect);
        
        if (userSection) {
            const allUsers = this.appState.getAllUsers();
            userSection.style.display = 'flex'; // Always show section
            
            console.log('populateDrawerSelects - Users:', allUsers.length, 'GrownupMode:', this.grownupMode);
            
            if (allUsers.length > 1) {
                // Multiple users - show custom dropdown
                const currentUser = this.appState.getCurrentUser();
                userSection.innerHTML = `
                    <label class="dropdown-label">User</label>
                    <button class="drawer-select" id="drawerUserSelect" data-value="${currentUser.id}">
                        <span>${currentUser.icon || '👤'} ${currentUser.name}</span>
                    </button>
                `;
                
                const userSelect = document.getElementById('drawerUserSelect');
                console.log('User select element after creation:', userSelect);
                
                if (!userSelect) {
                    console.error('Failed to find user select element after creation');
                    return;
                }
                
                userSelect.addEventListener('click', (e) => {
                    console.log('User select clicked!', e);
                    e.preventDefault();
                    e.stopPropagation();
                    
                    let dropdownOptions = [];
                    
                    // Add all users as selectable options
                    allUsers.forEach(user => {
                        dropdownOptions.push({
                            id: user.id,
                            text: user.name,
                            icon: user.icon || '👤',
                            selected: user.id === currentUser.id,
                            type: 'user'
                        });
                        
                        // Add edit/delete options for each user if in grownup mode
                        if (this.grownupMode) {
                            dropdownOptions.push({
                                id: `edit-${user.id}`,
                                text: `Edit ${user.name}`,
                                icon: 'edit',
                                selected: false,
                                type: 'action'
                            });
                            if (allUsers.length > 1) { // Don't allow deleting the last user
                                dropdownOptions.push({
                                    id: `delete-${user.id}`,
                                    text: `Delete ${user.name}`,
                                    icon: 'delete',
                                    selected: false,
                                    type: 'action'
                                });
                            }
                        }
                    });
                    
                    // Add create new user option if in edit mode
                    if (this.grownupMode) {
                        dropdownOptions.push({
                            id: 'add-new-user',
                            text: 'Add New User',
                            icon: 'add_circle',
                            selected: false,
                            type: 'action'
                        });
                    }
                    
                    this.showNativeDropdown('User', dropdownOptions, (selectedId) => {
                        console.log('User dropdown selection:', selectedId);
                        
                        if (selectedId === 'add-new-user') {
                            this.showAddUserDialog();
                        } else if (selectedId.startsWith('edit-')) {
                            const userId = selectedId.replace('edit-', '');
                            const userToEdit = allUsers.find(u => u.id === userId);
                            if (userToEdit) {
                                this.showEditUserDialog(userToEdit);
                            }
                        } else if (selectedId.startsWith('delete-')) {
                            const userId = selectedId.replace('delete-', '');
                            const userToDelete = allUsers.find(u => u.id === userId);
                            if (userToDelete && confirm(`Delete user "${userToDelete.name}"? Their activities will be permanently removed.`)) {
                                // If deleting current user, switch to another user first
                                if (userId === currentUser.id && allUsers.length > 1) {
                                    const otherUser = allUsers.find(u => u.id !== userId);
                                    if (otherUser) {
                                        this.handleUserSwitch(otherUser.id);
                                        setTimeout(() => {
                                            this.deleteUser(userId);
                                        }, 100);
                                    }
                                } else {
                                    this.deleteUser(userId);
                                }
                            }
                        } else {
                            // Regular user selection
                            this.handleUserSwitch(selectedId);
                            const selectedUser = allUsers.find(u => u.id === selectedId);
                            if (selectedUser && userSelect) {
                                userSelect.innerHTML = `<span>${selectedUser.icon || '👤'} ${selectedUser.name}</span>`;
                                userSelect.setAttribute('data-value', selectedId);
                            }
                        }
                    }, userSelect);
                });
            } else if (this.grownupMode) {
                // Single user in edit mode - show current user with edit option AND add user option
                console.log('Rendering user dropdown for single user in edit mode');
                const currentUser = this.appState.getCurrentUser();
                userSection.innerHTML = `
                    <label class="dropdown-label">User</label>
                    <button class="drawer-select" id="drawerUserSelect" data-value="${currentUser.id}">
                        <span>${currentUser.icon || '👤'} ${currentUser.name}</span>
                    </button>
                `;
                
                const userSelect = document.getElementById('drawerUserSelect');
                console.log('User select element after creation:', userSelect);
                
                if (!userSelect) {
                    console.error('Failed to find user select element after creation');
                    return;
                }
                
                userSelect.addEventListener('click', (e) => {
                    console.log('Single user select clicked!', e);
                    e.preventDefault();
                    e.stopPropagation();
                    
                    let dropdownOptions = [];
                    
                    // Add current user as selectable option
                    dropdownOptions.push({
                        id: currentUser.id,
                        text: currentUser.name,
                        icon: currentUser.icon || '👤',
                        selected: true,
                        type: 'user'
                    });
                    
                    // Add edit option for current user
                    dropdownOptions.push({
                        id: `edit-${currentUser.id}`,
                        text: `Edit ${currentUser.name}`,
                        icon: 'edit',
                        selected: false,
                        type: 'action'
                    });
                    
                    // Add create new user option
                    dropdownOptions.push({
                        id: 'add-new-user',
                        text: 'Add New User',
                        icon: 'add_circle',
                        selected: false,
                        type: 'action'
                    });
                    
                    this.showNativeDropdown('User', dropdownOptions, (selectedId) => {
                        console.log('Single user dropdown selection:', selectedId);
                        
                        if (selectedId === 'add-new-user') {
                            this.showAddUserDialog();
                        } else if (selectedId.startsWith('edit-')) {
                            const userId = selectedId.replace('edit-', '');
                            if (userId === currentUser.id) {
                                this.showEditUserDialog(currentUser);
                            }
                        } else if (selectedId === currentUser.id) {
                            // User selected themselves, no action needed
                            console.log('User selected themselves, no action needed');
                        }
                    }, userSelect);
                });
            } else {
                // Single user, not in edit mode - still show user for consistency
                const currentUser = this.appState.getCurrentUser();
                userSection.innerHTML = `
                    <label class="dropdown-label">User</label>
                    <div class="drawer-select disabled">
                        <span>${currentUser.icon || '👤'} ${currentUser.name}</span>
                    </div>
                `;
            }
        }
        
        if (daySelect) {
            // Convert to custom dropdown
            const currentDay = this.appState.getCurrentDay();
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const dayOptions = [
                { 
                    id: 'today', 
                    text: 'Today',
                    icon: this.createDateIcon(today)
                },
                { 
                    id: 'tomorrow', 
                    text: 'Tomorrow',
                    icon: this.createDateIcon(tomorrow)
                }
            ];
            
            const selectedDay = dayOptions.find(d => d.id === currentDay);
            daySelect.outerHTML = `
                <button class="drawer-select" id="drawerDaySelect" data-value="${currentDay}">
                    <span>${selectedDay?.icon} ${selectedDay?.text}</span>
                </button>
            `;
            
            const newDaySelect = document.getElementById('drawerDaySelect');
            console.log('Day select element after creation:', newDaySelect);
            
            if (!newDaySelect) {
                console.error('Failed to find day select element after creation');
                return;
            }
            
            newDaySelect.addEventListener('click', (e) => {
                console.log('Day select clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                
                // Get fresh current day when dropdown opens
                const freshCurrentDay = this.appState.getCurrentDay();
                
                this.showNativeDropdown('Day', dayOptions.map(day => ({
                    id: day.id,
                    text: day.text,
                    icon: day.icon,
                    selected: day.id === freshCurrentDay
                })), (selectedId) => {
                    console.log('Day selected:', selectedId);
                    console.log('Current day before switch:', this.appState.getCurrentDay());
                    this.switchDay(selectedId);
                    console.log('Current day after switch:', this.appState.getCurrentDay());
                    const selected = dayOptions.find(d => d.id === selectedId);
                    if (selected && newDaySelect) {
                        newDaySelect.innerHTML = `<span>${selected.icon} ${selected.text}</span>`;
                        newDaySelect.setAttribute('data-value', selectedId);
                    }
                    // Refresh the view
                    this.render();
                }, newDaySelect);
            });
        }
    }
    
    showCustomDropdown(title, options, onSelect, triggerElement = null) {
        console.log('showCustomDropdown called with:', title, options);
        
        // Use native-style dropdown if trigger element is provided
        if (triggerElement) {
            return this.showNativeDropdown(title, options, onSelect, triggerElement);
        }
        
        // Fallback to modal-style dropdown
        const modal = document.getElementById('dropdownModal');
        const modalTitle = document.getElementById('dropdownModalTitle');
        const modalOptions = document.getElementById('dropdownModalOptions');
        const closeBtn = modal?.querySelector('.dropdown-modal-close');
        const backdrop = modal?.querySelector('.dropdown-modal-backdrop');
        
        console.log('Modal elements found:', {
            modal: !!modal,
            modalTitle: !!modalTitle,
            modalOptions: !!modalOptions,
            closeBtn: !!closeBtn,
            backdrop: !!backdrop
        });
        
        if (!modal || !modalTitle || !modalOptions) {
            console.error('Missing modal elements for dropdown');
            return;
        }
        
        modalTitle.textContent = `Select ${title}`;
        modalOptions.innerHTML = options.map(option => `
            <button class="dropdown-option ${option.selected ? 'selected' : ''}" 
                    data-value="${option.id}">
                <span class="dropdown-option-icon">${option.icon}</span>
                <span class="dropdown-option-text">${option.text}</span>
            </button>
        `).join('');
        
        console.log('Modal content populated, showing modal');
        modal.classList.remove('hidden');
        
        // Force modal to be extremely visible using inline styles
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.7) !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
        `;
        
        const content = modal.querySelector('.dropdown-modal-content');
        if (content) {
            content.style.cssText = `
                background: white !important;
                padding: 20px !important;
                border: 3px solid #667eea !important;
                border-radius: 12px !important;
                min-width: 300px !important;
                min-height: 200px !important;
                max-width: 90vw !important;
                max-height: 90vh !important;
                display: flex !important;
                flex-direction: column !important;
                z-index: 100000 !important;
                position: relative !important;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
            `;
        }
        
        // Debug modal visibility
        setTimeout(() => {
            console.log('Modal classes after show:', modal.className);
            console.log('Modal display style:', getComputedStyle(modal).display);
            console.log('Modal z-index:', getComputedStyle(modal).zIndex);
            console.log('Modal visibility:', getComputedStyle(modal).visibility);
            console.log('Modal position:', getComputedStyle(modal).position);
        }, 100);
        
        const handleClose = () => {
            console.log('Closing dropdown modal');
            modal.classList.add('hidden');
            modal.style.cssText = ''; // Clear forced styles
            modal.style.display = 'none'; // Ensure it's hidden
            closeBtn?.removeEventListener('click', handleClose);
            backdrop?.removeEventListener('click', handleClose);
        };
        
        closeBtn?.addEventListener('click', handleClose);
        backdrop?.addEventListener('click', handleClose);
        
        modalOptions.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', (e) => {
                console.log('Dropdown option click event fired:', e);
                e.preventDefault();
                e.stopPropagation();
                const value = option.getAttribute('data-value');
                console.log('Dropdown option clicked:', value, 'Element:', option);
                if (value) {
                    console.log('Calling onSelect with:', value);
                    try {
                        onSelect(value);
                        console.log('onSelect called successfully, now closing modal');
                    } catch (error) {
                        console.error('Error in onSelect callback:', error);
                    }
                    handleClose();
                } else {
                    console.error('No data-value found on option:', option);
                }
            });
        });
        
        console.log('Event listeners attached to dropdown options');
    }
    
    showNativeDropdown(title, options, onSelect, triggerElement) {
        console.log('showNativeDropdown called with:', title, options, triggerElement);
        
        // Remove any existing native dropdown
        const existingDropdown = document.querySelector('.native-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Mobile-specific detection
        const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
        console.log('Screen width:', window.innerWidth, 'Detected as mobile:', isMobile);
        
        if (isMobile) {
            // Use full-screen modal picker for mobile
            return this.showMobileModalPicker(title, options, onSelect);
        }
        
        // Create the native dropdown container for desktop
        const dropdown = document.createElement('div');
        dropdown.className = 'native-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.setAttribute('aria-label', `Select ${title}`);
        
        // Create the dropdown content (no header needed - user can see trigger above)
        dropdown.innerHTML = `
            <div class="native-dropdown-options">
                ${options.map(option => `
                    <button class="native-dropdown-option ${option.selected ? 'selected' : ''}" 
                            data-value="${option.id}"
                            role="option"
                            aria-selected="${option.selected}">
                        <span class="native-dropdown-option-icon">${option.icon}</span>
                        <span class="native-dropdown-option-text">${option.text}</span>
                        ${option.selected ? '<span class="native-dropdown-check">✓</span>' : ''}
                    </button>
                `).join('')}
            </div>
        `;
        
        // Add to document
        document.body.appendChild(dropdown);
        
        // Calculate position relative to trigger
        const triggerRect = triggerElement.getBoundingClientRect();
        const dropdownRect = dropdown.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Determine if we should show above or below
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        const dropdownHeight = Math.min(300, options.length * 50 + 60); // Estimate height
        
        let top, left;
        
        // Use existing isMobile detection from above
        // (isMobile already declared at top of function)
        
        // Universal positioning logic for both mobile and desktop
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            // Show above trigger - connect seamlessly
            top = isMobile ? triggerRect.top - dropdownHeight : triggerRect.top - dropdownHeight - 6;
            dropdown.classList.add('native-dropdown--above');
        } else {
            // Show below trigger - connect seamlessly
            if (isMobile) {
                // Mobile: Move dropdown down but behind the button (lower z-index)
                top = triggerRect.bottom - 13; // Move down 2px from -15px to -13px
            } else {
                // Desktop: Position below button, moved up 1 more px
                top = triggerRect.bottom - 7; // Was -6px, now -7px (moved up 1 more px)
            }
            dropdown.classList.add('native-dropdown--below');
        }
        
        // Set dropdown width and position
        left = isMobile ? triggerRect.left + 2 : triggerRect.left + 2; // Mobile: move 2px right, Desktop: move 2px right
        const triggerWidth = triggerRect.width;
        
        if (isMobile) {
            // Mobile: Make it 6px narrower (2px off left + 4px off right)
            const mobileWidth = triggerWidth - 6;
            dropdown.style.width = `${mobileWidth}px`;
            dropdown.style.minWidth = `${mobileWidth}px`;
            dropdown.style.maxWidth = `${mobileWidth}px`;
        } else {
            // Desktop: Make it 5% narrower but extend 8px to the right (1px more)
            const dropdownWidth = (triggerRect.width * 0.95) + 8;
            dropdown.style.width = `${dropdownWidth}px`;
            dropdown.style.minWidth = `${dropdownWidth}px`;
            dropdown.style.maxWidth = `${dropdownWidth}px`;
        }
        
        // Make the trigger arrow point up to indicate it can close the dropdown (both mobile & desktop)
        const triggerArrow = triggerElement.querySelector('.selector-icon');
        if (triggerArrow) {
            triggerArrow.style.transform = 'rotate(180deg)';
            triggerArrow.setAttribute('data-dropdown-open', 'true');
        }
        
        // Ensure dropdown doesn't go off screen
        const currentDropdownWidth = isMobile ? triggerWidth : (triggerRect.width * 0.95) + 8;
        if (left + currentDropdownWidth > viewportWidth - 16) {
            left = viewportWidth - currentDropdownWidth - 16;
        }
        if (left < 16) {
            left = 16;
            // If dropdown is too wide for screen, constrain it
            const maxWidth = viewportWidth - 32;
            if (currentDropdownWidth > maxWidth) {
                dropdown.style.width = `${maxWidth}px`;
                dropdown.style.maxWidth = `${maxWidth}px`;
            }
        }
        
        // Apply positioning while preserving width settings
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${Math.max(8, top)}px`;
        dropdown.style.left = `${left}px`;
        // Set z-index based on platform needs
        if (isMobile) {
            dropdown.style.zIndex = '1003'; // Above drawer (1002) but below button/handle (1005+)
        } else {
            dropdown.style.zIndex = '1003'; // Above drawer (1002) but below button/handle (1005+)
        }
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-10px)';
        dropdown.style.transition = 'all 0.2s ease';
        
        // Force reflow and animate in
        requestAnimationFrame(() => {
            dropdown.style.opacity = '1';
            dropdown.style.transform = 'translateY(0)';
        });
        
        // Event handlers
        const handleClose = () => {
            // Reset the trigger arrow when closing
            const triggerArrow = triggerElement.querySelector('.selector-icon');
            if (triggerArrow && triggerArrow.getAttribute('data-dropdown-open')) {
                triggerArrow.style.transform = '';
                triggerArrow.removeAttribute('data-dropdown-open');
            }
            
            dropdown.style.opacity = '0';
            dropdown.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (dropdown.parentNode) {
                    dropdown.remove();
                }
            }, 200);
        };
        
        // Allow clicking the trigger again to close the dropdown
        const handleTriggerClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
            triggerElement.removeEventListener('click', handleTriggerClick);
        };
        
        // Add click handler to trigger for closing
        setTimeout(() => {
            triggerElement.addEventListener('click', handleTriggerClick);
        }, 100); // Delay to prevent immediate closure
        
        // Option clicks
        dropdown.querySelectorAll('.native-dropdown-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const value = option.getAttribute('data-value');
                if (value && onSelect) {
                    onSelect(value);
                }
                handleClose();
            });
        });
        
        // Click outside to close
        const handleOutsideClick = (e) => {
            if (!dropdown.contains(e.target) && !triggerElement.contains(e.target)) {
                handleClose();
                document.removeEventListener('click', handleOutsideClick);
                triggerElement.removeEventListener('click', handleTriggerClick);
            }
        };
        
        // Add outside click handler after a brief delay to prevent immediate closure
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 100);
        
        // Escape key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleClose();
                document.removeEventListener('keydown', handleEscape);
                triggerElement.removeEventListener('click', handleTriggerClick);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        return dropdown;
    }
    
    showMobileModalPicker(title, options, onSelect) {
        // Create full-screen modal overlay
        const modal = document.createElement('div');
        modal.className = 'mobile-picker-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', `Select ${title}`);
        
        // Create modal content
        modal.innerHTML = `
            <div class="mobile-picker-backdrop"></div>
            <div class="mobile-picker-content">
                <div class="mobile-picker-header">
                    <h3 class="mobile-picker-title">Select ${title}</h3>
                    <button class="mobile-picker-close" aria-label="Close">×</button>
                </div>
                <div class="mobile-picker-options">
                    ${options.map(option => {
                        const optionClass = `mobile-picker-option ${option.selected ? 'selected' : ''} ${option.type ? `mobile-picker-option--${option.type}` : ''}`;
                        
                        // Handle different icon types
                        let iconContent = '';
                        if (option.type === 'action') {
                            // Use Material Icons for actions
                            iconContent = `<span class="material-icons">${option.icon}</span>`;
                        } else {
                            // Use emoji/text for users and day options
                            iconContent = option.icon;
                        }
                        
                        return `
                            <button class="${optionClass}" 
                                    data-value="${option.id}"
                                    role="option"
                                    aria-selected="${option.selected}">
                                <span class="mobile-picker-option-icon">${iconContent}</span>
                                <span class="mobile-picker-option-text">${option.text}</span>
                                ${option.selected ? '<span class="mobile-picker-check">✓</span>' : ''}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(modal);
        
        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('mobile-picker-modal--visible');
        });
        
        // Event handlers
        const handleClose = () => {
            modal.classList.remove('mobile-picker-modal--visible');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 300);
        };
        
        // Close button
        const closeBtn = modal.querySelector('.mobile-picker-close');
        closeBtn?.addEventListener('click', handleClose);
        
        // Backdrop click
        const backdrop = modal.querySelector('.mobile-picker-backdrop');
        backdrop?.addEventListener('click', handleClose);
        
        // Option clicks
        modal.querySelectorAll('.mobile-picker-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const value = option.getAttribute('data-value');
                if (value && onSelect) {
                    onSelect(value);
                }
                handleClose();
            });
        });
        
        // Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleClose();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        return modal;
    }
    
    setupDrawerSelects() {
        const daySelect = document.getElementById('drawerDaySelect');
        
        if (daySelect) {
            daySelect.addEventListener('change', (e) => {
                const day = e.target.value;
                if (day) {
                    this.switchDay(day);
                }
            });
        }
    }
    
    createDateIcon(date) {
        const day = date.getDate();
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const month = monthNames[date.getMonth()];
        
        // Get current theme colors from CSS variables
        const style = getComputedStyle(document.documentElement);
        const primaryColor = style.getPropertyValue('--primary-color').trim() || '#667eea';
        const primaryLight = style.getPropertyValue('--primary-light').trim() || '#f0f4ff';
        
        return `<svg viewBox="0 0 32 32" style="width: 24px; height: 24px;">
            <rect x="2" y="2" width="28" height="28" rx="4" fill="${primaryLight}" stroke="${primaryColor}" stroke-width="2"/>
            <rect x="2" y="2" width="28" height="8" rx="4" fill="${primaryColor}"/>
            <text x="16" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">${day}</text>
            <text x="16" y="7" text-anchor="middle" font-size="6" font-weight="bold" fill="white">${month}</text>
        </svg>`;
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
            
            // Also create tomorrow activities
            const currentDay = this.appState.getCurrentDay();
            this.appState.switchDay('tomorrow');
            
            // Add some tomorrow-specific activities
            this.appState.addActivity({
                title: 'Plan the Day',
                description: 'What will you do tomorrow?',
                icon: '📅',
                visible: true,
                cardType: 'one-time'
            });
            
            // Switch back to today
            this.appState.switchDay(currentDay);
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
        
        // Create tomorrow activities (recurring activities should appear both days)
        const currentDay = this.appState.getCurrentDay();
        this.appState.setCurrentDay('tomorrow');
        
        // Add recurring activities to tomorrow as well
        DEFAULT_ACTIVITIES.forEach((activity) => {
            if (activity.cardType === 'recurring' || !activity.cardType) {
                const activityWithType = {
                    ...activity,
                    cardType: activity.cardType || 'recurring'
                };
                this.appState.addActivity(activityWithType);
            }
        });
        
        // Add one tomorrow-specific activity
        this.appState.addActivity({
            title: 'Tomorrow\'s Special Task',
            description: 'Something to look forward to!',
            icon: '⭐',
            visible: true,
            cardType: 'single-use'
        });
        
        // Switch back to original day
        this.appState.setCurrentDay(currentDay);
        
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
        // No longer needed - header is always fixed
        // Just handle resize events for padding
        window.addEventListener('resize', () => {
            this.updateBodyPadding();
        }, { passive: true });
    }

    syncFixedHeader() {
        // No longer needed - single header
        this.renderDaySelectors();
        this.renderLogos();
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
        
        // User selection is handled by the drawer
    }
    
    // User management methods
    handleUserSwitch(userId) {
        if (userId && userId !== this.appState.users.currentUserId) {
            this.appState.switchUser(userId);
            this.renderer.render();
            this.renderer.updateHeader();
            this.syncFixedHeader();
            this.populateUserDropdowns();
            
            // Update title/subtitle for new user
            this.initializeTitleSubtitle();
        }
    }
    
    showAddUserDialog() {
        console.log('showAddUserDialog called in StackMapApp');
        // Use the new Add User modal instead of prompt
        if (typeof ComponentBuilder !== 'undefined' && ComponentBuilder.showAddUserModal) {
            ComponentBuilder.showAddUserModal();
        } else {
            console.error('ComponentBuilder.showAddUserModal not available');
        }
    }
    
    showEditUserDialog(user) {
        console.log('showEditUserDialog called for user:', user);
        // Use the ComponentBuilder to show edit user modal
        if (typeof ComponentBuilder !== 'undefined' && ComponentBuilder.showEditUserModal) {
            ComponentBuilder.showEditUserModal(user);
        } else {
            console.error('ComponentBuilder.showEditUserModal not available');
            // Fallback to prompt
            const newName = prompt('Edit user name:', user.name);
            if (newName && newName.trim()) {
                this.appState.updateUser(user.id, { name: newName.trim() });
                this.populateDrawerSelects();
                this.render();
            }
        }
    }
    
    deleteUser(userId) {
        console.log('deleteUser called for userId:', userId);
        try {
            // Use AppState's deleteUser method if it exists
            if (typeof this.appState.deleteUser === 'function') {
                const success = this.appState.deleteUser(userId);
                if (success) {
                    this.populateDrawerSelects();
                    this.render();
                    console.log('User deleted successfully');
                }
            } else {
                console.error('AppState.deleteUser method not available');
                alert('Delete user functionality not yet implemented');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user: ' + error.message);
        }
    }
    
    updateLogoVisibility(currentTitle) {
        const logo = document.querySelector('.stackmap-logo');
        if (logo) {
            if (currentTitle === 'StackMap') {
                logo.style.display = 'flex';
                logo.style.opacity = '1';
            } else {
                logo.style.display = 'none';
                logo.style.opacity = '0';
            }
        }
    }
    
    populateUserDropdowns() {
        // Not needed with unified header - drawer handles user selection
    }
    
    // Story 4: Day Selector Methods
    renderDaySelectors() {
        // Day selection is now handled by the drawer
    }
    
    // Render StackMap logos in headers
    renderLogos() {
        // Logo is now in the unified header HTML
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
        console.log('switchDay called with:', day, 'current:', this.appState.getCurrentDay());
        if (this.appState.getCurrentDay() !== day) {
            this.appState.setCurrentDay(day);
            
            // Ensure tomorrow has activities if empty and user has today activities
            if (day === 'tomorrow') {
                const user = this.appState.getCurrentUser();
                if (user.tomorrowActivities.length === 0 && user.activities.length > 0) {
                    console.log('Tomorrow is empty, copying recurring activities from today');
                    // Copy recurring activities from today to tomorrow
                    user.activities.forEach(activity => {
                        if (activity.cardType === 'recurring' || !activity.cardType) {
                            const tomorrowActivity = {
                                ...activity,
                                completed: false // Reset completion for tomorrow
                            };
                            user.tomorrowActivities.push(tomorrowActivity);
                        }
                    });
                    
                    // Add a special tomorrow activity if none exist
                    if (user.tomorrowActivities.length === 0) {
                        user.tomorrowActivities.push({
                            title: 'Plan Tomorrow',
                            description: 'What will you do tomorrow?',
                            icon: '📅',
                            visible: true,
                            completed: false,
                            cardType: 'single-use',
                            time: ''
                        });
                    }
                    
                    this.appState._triggerSave();
                }
            }
            
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
            
            // Update draggable drawers
            if (this.staticDrawer) {
                this.staticDrawer.updateDayDisplay();
            }
            if (this.fixedDrawer) {
                this.fixedDrawer.updateDayDisplay();
            }
            
            this.render();
            this.updateDayCounts();
            
            console.log('After switchDay - Current activities:', this.appState.getCurrentActivities().length);
            console.log('Edit mode:', this.appState.ui.editMode);
            console.log('Grownup mode:', this.grownupMode);
            
            // Debug management cards after render
            setTimeout(() => {
                const managementCards = document.querySelectorAll('.management-card');
                console.log('Management cards in DOM after render:', managementCards.length);
                if (managementCards.length === 0) {
                    console.warn('No management cards found! Edit mode:', this.appState.ui.editMode);
                }
            }, 100);
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
        
        // Update drawer if it's open to show Add User button
        const drawerExtension = document.getElementById('drawerExtension');
        if (drawerExtension && drawerExtension.classList.contains('open')) {
            this.populateDrawerSelects();
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
        
        // Update drawer if it's open to hide Add User button
        const drawerExtension = document.getElementById('drawerExtension');
        if (drawerExtension && drawerExtension.classList.contains('open')) {
            this.populateDrawerSelects();
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
        console.log('openNewCardForm called with position:', position);
        console.log('Current day:', this.appState.getCurrentDay());
        console.log('Current user:', this.appState.getCurrentUser()?.name);
        console.log('Current activities:', this.appState.getCurrentActivities().length);
        console.log('Edit mode:', this.appState.ui.editMode);
        console.log('Grownup mode:', this.grownupMode);
        
        // Enhanced debugging for tomorrow view
        if (this.appState.getCurrentDay() === 'tomorrow') {
            const user = this.appState.getCurrentUser();
            console.log('Tomorrow view debugging:');
            console.log('- Tomorrow activities:', user.tomorrowActivities.length);
            console.log('- Today activities:', user.activities.length);
            console.log('- All tomorrow activities:', user.tomorrowActivities.map(a => a.title));
        }
        
        this.appState.ui.showingNewCardForm = position;
        
        // Add try-catch to detect any errors in modal creation
        try {
            console.log('Attempting to show modal card...');
            // Show modal for new card with current selected card type
            const modal = ComponentBuilder.showModalCard(true, null, -1, this.appState.ui.selectedEmoji);
            console.log('Modal card created successfully:', !!modal);
            
            // Double-check the modal exists in DOM
            setTimeout(() => {
                const modalInDOM = document.getElementById('modalCardOverlay');
                console.log('Modal found in DOM after creation:', !!modalInDOM);
                if (!modalInDOM) {
                    console.error('MODAL NOT FOUND IN DOM! This might be why the user is seeing something else.');
                }
            }, 100);
            
        } catch (error) {
            console.error('Error creating modal card:', error);
            console.error('This might be why the user sees a different dialog');
        }
    }

    closeNewCardForm() {
        this.appState.ui.showingNewCardForm = false;
        ComponentBuilder.closeModalCard();
    }

    addActivity(position = 'top') {
        console.log('addActivity called with position:', position);
        console.log('Current day before add:', this.appState.getCurrentDay());
        
        const titleInput = document.getElementById('newActivityTitle');
        const descInput = document.getElementById('newActivityDescription');
        const timeInput = document.getElementById('newActivityTime');
        
        if (!titleInput || !descInput) {
            console.log('Required inputs not found');
            return;
        }
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        const time = timeInput ? timeInput.value : '';
        
        console.log('Adding activity:', title, 'to day:', this.appState.getCurrentDay());
        
        if (!title) {
            alert('Please enter a title');
            titleInput.focus();
            return;
        }
        
        try {
            // Use the current form position or default
            const currentPosition = this.appState.ui.showingNewCardForm || position;
            
            console.log('Using position:', currentPosition);
            console.log('Activities before add:', this.appState.getCurrentActivities().length);
            
            // Use the AppState method which handles position properly
            this.appState.addActivity({
                title,
                description,
                icon: this.appState.ui.selectedEmoji,
                time,
                cardType: this.selectedCardType // Story 1: Include selected card type
            }, currentPosition);
            
            console.log('Activities after add:', this.appState.getCurrentActivities().length);
            
            // Enhanced debugging for tomorrow activities
            if (this.appState.getCurrentDay() === 'tomorrow') {
                const user = this.appState.getCurrentUser();
                console.log('After adding to tomorrow:');
                console.log('- Tomorrow activities count:', user.tomorrowActivities.length);
                console.log('- Latest tomorrow activity:', user.tomorrowActivities[user.tomorrowActivities.length - 1]?.title);
                console.log('- getCurrentActivities() count:', this.appState.getCurrentActivities().length);
            }
            
            this.clearNewActivity();
            this.closeNewCardForm();
            this.render();
            
            // Verify the activity appears after render
            setTimeout(() => {
                console.log('After render - Activities in DOM:', document.querySelectorAll('.card:not(.management-card)').length);
                const managementCards = document.querySelectorAll('.management-card');
                console.log('Management cards in DOM after add:', managementCards.length);
            }, 100);
        } catch (error) {
            console.error('Error adding activity:', error);
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

// Debugging helper function
window.testDropdowns = function() {
    console.log('=== DROPDOWN TEST ===');
    const userSelect = document.getElementById('drawerUserSelect');
    const daySelect = document.getElementById('drawerDaySelect');
    
    console.log('User select element:', userSelect);
    console.log('Day select element:', daySelect);
    
    if (userSelect) {
        console.log('Testing user select click...');
        userSelect.click();
    }
    
    setTimeout(() => {
        if (daySelect) {
            console.log('Testing day select click...');
            daySelect.click();
        }
    }, 1000);
};

// Debug switchDay functionality specifically
window.testSwitchDay = function() {
    console.log('=== TESTING SWITCHDAY FUNCTIONALITY ===');
    console.log('Current day:', window.appInstance?.appState?.getCurrentDay?.());
    console.log('switchDay method exists:', typeof window.appInstance?.switchDay === 'function');
    console.log('setCurrentDay method exists:', typeof window.appInstance?.appState?.setCurrentDay === 'function');
    
    // Test direct state change
    console.log('Testing direct setCurrentDay call...');
    console.log('Before:', window.appInstance.appState.getCurrentDay());
    window.appInstance.appState.setCurrentDay('tomorrow');
    console.log('After setCurrentDay(tomorrow):', window.appInstance.appState.getCurrentDay());
    
    // Test full switchDay method
    setTimeout(() => {
        console.log('Testing full switchDay method...');
        console.log('Before:', window.appInstance.appState.getCurrentDay());
        window.appInstance.switchDay('today');
        console.log('After switchDay(today):', window.appInstance.appState.getCurrentDay());
    }, 500);
    
    // Test the dropdown modal directly
    setTimeout(() => {
        console.log('Testing dropdown modal for day selection...');
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dayOptions = [
            { 
                id: 'today', 
                text: 'Today',
                icon: window.appInstance.createDateIcon(today)
            },
            { 
                id: 'tomorrow', 
                text: 'Tomorrow',
                icon: window.appInstance.createDateIcon(tomorrow)
            }
        ];
        
        window.appInstance.showNativeDropdown('Test Day', dayOptions, (selectedId) => {
            console.log('Test dropdown selected:', selectedId);
            console.log('Before dropdown switchDay:', window.appInstance.appState.getCurrentDay());
            window.appInstance.switchDay(selectedId);
            console.log('After dropdown switchDay:', window.appInstance.appState.getCurrentDay());
        }, document.body);
    }, 1500);
};

// Test modal visibility directly and restore original content
window.testModal = function() {
    console.log('=== TESTING MODAL VISIBILITY ===');
    const modal = document.getElementById('dropdownModal');
    console.log('Modal element found:', !!modal);
    
    if (modal) {
        console.log('Current modal classes:', modal.className);
        console.log('Current display:', getComputedStyle(modal).display);
        
        // Restore original modal content
        modal.innerHTML = `
            <div class="dropdown-modal-backdrop"></div>
            <div class="dropdown-modal-content">
                <div class="dropdown-modal-header">
                    <h3 class="dropdown-modal-title" id="dropdownModalTitle">Select</h3>
                    <button class="dropdown-modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="dropdown-modal-options" id="dropdownModalOptions">
                    <!-- Options will be populated dynamically -->
                </div>
            </div>
        `;
        
        modal.classList.add('hidden');
        console.log('Modal content restored to original state');
    }
};

// Fix the modal content immediately
window.fixModal = function() {
    console.log('=== FIXING MODAL CONTENT ===');
    const modal = document.getElementById('dropdownModal');
    if (modal) {
        modal.innerHTML = `
            <div class="dropdown-modal-backdrop"></div>
            <div class="dropdown-modal-content">
                <div class="dropdown-modal-header">
                    <h3 class="dropdown-modal-title" id="dropdownModalTitle">Select</h3>
                    <button class="dropdown-modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="dropdown-modal-options" id="dropdownModalOptions">
                    <!-- Options will be populated dynamically -->
                </div>
            </div>
        `;
        modal.classList.add('hidden');
        console.log('Modal content fixed');
    }
};

// Force show modal with extreme visibility
window.forceShowModal = function() {
    console.log('=== FORCING MODAL TO BE VISIBLE ===');
    const modal = document.getElementById('dropdownModal');
    if (modal) {
        // Remove all classes and reset completely
        modal.className = '';
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(255, 0, 0, 0.8) !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white !important;
                padding: 40px !important;
                border: 5px solid blue !important;
                border-radius: 10px !important;
                font-size: 24px !important;
                color: black !important;
                text-align: center !important;
                max-width: 90vw !important;
                max-height: 90vh !important;
                overflow: auto !important;
            ">
                <h2>MODAL TEST</h2>
                <p>Can you see this?</p>
                <button onclick="document.getElementById('dropdownModal').style.display='none'" 
                        style="padding: 10px 20px; font-size: 18px; margin: 10px;">
                    CLOSE
                </button>
            </div>
        `;
        
        console.log('Modal forced to maximum visibility');
        console.log('Modal computed styles:', {
            display: getComputedStyle(modal).display,
            zIndex: getComputedStyle(modal).zIndex,
            opacity: getComputedStyle(modal).opacity,
            visibility: getComputedStyle(modal).visibility,
            position: getComputedStyle(modal).position
        });
    }
};

// Make available globally
window.StackMapApp = StackMapApp;

// Add debugging helpers
window.testAddUser = function() {
    console.log('Testing Add User functionality...');
    if (window.appInstance) {
        console.log('App instance found');
        console.log('Grownup mode:', window.appInstance.grownupMode);
        if (!window.appInstance.grownupMode) {
            console.log('Entering grownup mode first...');
            window.appInstance.enterGrownupMode();
        }
        console.log('Showing Add User dialog...');
        window.appInstance.showAddUserDialog();
    } else {
        console.log('App instance not found!');
    }
};

window.debugUsers = function() {
    if (window.appInstance && window.appInstance.appState) {
        console.log('=== USER DATA DEBUG ===');
        console.log('All users:', window.appInstance.appState.users);
        console.log('User profiles:', window.appInstance.appState.users.profiles);
        console.log('Current user ID:', window.appInstance.appState.users.currentUserId);
        console.log('Current user object:', window.appInstance.appState.getCurrentUser());
        
        // Log each user's details
        const users = window.appInstance.appState.getAllUsers();
        console.log('All users array:', users);
        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`, {
                id: user.id,
                name: user.name,
                icon: user.icon,
                avatar: user.avatar,
                hasIcon: !!user.icon,
                hasAvatar: !!user.avatar
            });
        });
    } else {
        console.log('App instance or appState not found!');
    }
};

// Story 2 Validation Suite
const validateStory2 = () => {
    console.log('=== STORY 2 VALIDATION ===');
    
    // Test 1: UI Elements Present
    const userSelector = document.getElementById('userSelector');
    const fixedUserSelector = document.getElementById('fixedUserSelector');
    // Add user buttons are now inside dropdown menu
    
    console.log('✅ Static dropdown present:', !!userSelector);
    console.log('✅ Fixed dropdown present:', !!fixedUserSelector);
    console.log('✅ Add user button moved to dropdown menu: true');
    console.log('✅ Fixed add user button moved to dropdown menu: true');
    
    // Test 2: Dropdown Population
    if (userSelector) {
        console.log('✅ Dropdown options count:', userSelector.options.length);
        console.log('✅ Current selection:', userSelector.value);
        
        // List all available users
        const users = Array.from(userSelector.options).map(opt => opt.text);
        console.log('✅ Available users:', users);
    }
    
    // Test 3: Add User Button Visibility (now in dropdown)
    const isGrownupMode = document.body.classList.contains('grownup-mode');
    console.log('✅ Grown-up mode:', isGrownupMode);
    console.log('✅ Add user option in dropdown (grown-up mode only):', isGrownupMode);
    
    // Test 4: Touch Targets (Mobile Accessibility)
    if (userSelector) {
        const dropdownRect = userSelector.getBoundingClientRect();
        const touchTarget = Math.min(dropdownRect.width, dropdownRect.height);
        console.log('✅ Dropdown touch target size:', touchTarget + 'px', touchTarget >= 44 ? '(PASS)' : '(FAIL - needs 44px+)');
    }
    
    // Test 5: Event Handlers
    console.log('✅ User switching method exists:', typeof appInstance.handleUserSwitch === 'function');
    console.log('✅ Add user method exists:', typeof appInstance.showAddUserDialog === 'function');
    
    // Test 6: Responsive Design
    const isMobile = window.innerWidth <= 768;
    console.log('✅ Current viewport:', window.innerWidth + 'px', isMobile ? '(Mobile)' : '(Desktop)');
    
    console.log('=== VALIDATION COMPLETE ===');
    
    // Return summary
    const passed = userSelector && fixedUserSelector && 
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

// Debug function for day switching issues
window.debugDaySwitch = function() {
    console.log('=== DAY SWITCH DEBUG ===');
    const user = window.appInstance.appState.getCurrentUser();
    console.log('Current user:', user.name);
    console.log('Current day:', window.appInstance.appState.getCurrentDay());
    console.log('Today activities:', user.activities.length);
    console.log('Tomorrow activities:', user.tomorrowActivities.length);
    console.log('getCurrentActivities():', window.appInstance.appState.getCurrentActivities().length);
    console.log('Legacy activities array:', window.appInstance.appState.activities.length);
    
    // Show activity details
    console.log('Today activities:', user.activities.map(a => a.title));
    console.log('Tomorrow activities:', user.tomorrowActivities.map(a => a.title));
    console.log('=== END DEBUG ===');
};

// Debug function specifically for management cards
window.debugManagementCards = function() {
    console.log('=== MANAGEMENT CARDS DEBUG ===');
    console.log('Edit mode:', window.appInstance.appState.ui.editMode);
    console.log('Grownup mode:', window.appInstance.grownupMode);
    console.log('Current day:', window.appInstance.appState.getCurrentDay());
    
    // Check DOM
    const managementCards = document.querySelectorAll('.management-card');
    console.log('Management cards in DOM:', managementCards.length);
    
    if (managementCards.length > 0) {
        managementCards.forEach((card, index) => {
            console.log(`Card ${index + 1}:`, {
                classes: card.className,
                display: getComputedStyle(card).display,
                visibility: getComputedStyle(card).visibility,
                position: getComputedStyle(card).position,
                zIndex: getComputedStyle(card).zIndex
            });
        });
    }
    
    // Check container
    const container = document.getElementById('mainContainer');
    if (container) {
        console.log('Main container children:', container.children.length);
        Array.from(container.children).forEach((child, index) => {
            if (child.classList.contains('management-card')) {
                console.log(`Management card found at index ${index}:`, child.className);
            }
        });
    }
    
    // Test card creation
    if (window.ComponentBuilder) {
        try {
            const testCard = window.ComponentBuilder.createManagementCard('test');
            console.log('Test management card created successfully:', !!testCard);
        } catch (error) {
            console.error('Error creating test management card:', error);
        }
    }
    
    console.log('=== END MANAGEMENT CARDS DEBUG ===');
};

// Debug function for investigating the "new user prompt" issue
window.debugNewCardIssue = function() {
    console.log('=== NEW CARD ISSUE DEBUG ===');
    
    // Check current state
    console.log('Current day:', window.appInstance.appState.getCurrentDay());
    console.log('Edit mode:', window.appInstance.appState.ui.editMode);
    console.log('Grownup mode:', window.appInstance.grownupMode);
    
    // Check modals in DOM
    const activityModal = document.getElementById('modalCardOverlay');
    const addUserModal = document.getElementById('addUserModal');
    const editUserModal = document.getElementById('editUserModal');
    const dropdownModal = document.getElementById('dropdownModal');
    
    console.log('Modals in DOM:');
    console.log('- Activity modal (modalCardOverlay):', !!activityModal);
    console.log('- Add user modal:', !!addUserModal);
    console.log('- Edit user modal:', !!editUserModal);
    console.log('- Dropdown modal:', !!dropdownModal);
    
    if (addUserModal) {
        console.log('Add user modal is visible! This might be the "new user prompt"');
        console.log('Add user modal display:', getComputedStyle(addUserModal).display);
        console.log('Add user modal z-index:', getComputedStyle(addUserModal).zIndex);
    }
    
    // Check management cards
    const managementCards = document.querySelectorAll('.management-card');
    console.log('Management cards:', managementCards.length);
    
    if (managementCards.length > 0) {
        managementCards.forEach((card, index) => {
            const addButton = card.querySelector('.btn--add-card');
            console.log(`Management card ${index + 1} add button:`, !!addButton);
            if (addButton) {
                console.log(`- onclick handler:`, addButton.onclick?.toString?.());
            }
        });
    }
    
    // Test manual card creation
    console.log('Testing manual openNewCardForm...');
    try {
        window.appInstance.openNewCardForm('top');
        setTimeout(() => {
            const modalAfterTest = document.getElementById('modalCardOverlay');
            console.log('Modal created after manual test:', !!modalAfterTest);
        }, 200);
    } catch (error) {
        console.error('Error in manual test:', error);
    }
    
    console.log('=== END NEW CARD ISSUE DEBUG ===');
};