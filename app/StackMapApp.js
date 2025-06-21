// app/StackMapApp.js - Main application controller with card type and management card support
// === MAIN STACKMAP APPLICATION ===

class StackMapApp {
    constructor() {
        // Initialize core state and renderer
        this.appState = new AppState();
        this.renderer = new AppRenderer(this.appState, this);
        
        // Create a placeholder object that will be replaced when sync initializes
        this.driveSync = null;
        this.isInitializing = true; // Flag to prevent auto-sync during initial load
        
        // Defer Google Drive sync initialization to not block startup
        const urlParams = new URLSearchParams(window.location.search);
        // Always enable sync since we have hardcoded credentials (unless in demo mode)
        const syncEnabled = !window.DEMO_MODE;
        
        if (syncEnabled) {
            // Initialize Google Drive sync after app loads and Google APIs are ready
            this.initializeDriveSync();
        }
        
        // Initialize managers
        // PreferencesManager removed - all functionality now handled by HybridPanelManager
        
        // Edit FAB removed - edit mode now accessed through main menu
        
        // DataManagementPanel removed - functionality moved to HybridPanelManager
        // this.dataPanel = new window.DataManagementPanel(this);
        // this.dataPanel.init();
        
        // App state
        this.grownupMode = false;
        this.splashShown = false;
        
        // Card type selection for new cards (Story 1)
        this.selectedCardType = 'recurring';
        
        // Auto-sync debouncing
        this.autoSyncTimeout = null;
        
        // SET UP AUTO-SAVE
        this.appState.onStateChange = () => {
            // Save current user data before saving to storage
            this.appState.saveCurrentUserData();
            this.saveToLocalStorage();
            
            // Process granular sync operations
            this.processGranularSync();
            
            // Auto-sync to Drive if enabled and signed in (but not during initial load)
            if (CONFIG.AUTO_SYNC_ENABLED && !this.isInitializing) {
                this.debouncedAutoSync();
            }
        };
        
        this.init();
    }

    // Helper method to get the appropriate storage key based on demo mode
    getStorageKey(baseKey) {
        const isDemo = localStorage.getItem('stackMapDemoMode') === 'true';
        // Some keys should remain shared between demo and main app
        const sharedKeys = ['stackmap-device-id', 'stackmap-google-token', 'ios-nav-shown'];
        if (sharedKeys.includes(baseKey)) {
            return baseKey;
        }
        return isDemo ? `${baseKey}-demo` : baseKey;
    }
    
    // Clean up demo mode when navigating away
    static cleanupDemoMode() {
        // Only clean up if we're actually in demo mode
        if (localStorage.getItem('stackMapDemoMode') === 'true') {
            localStorage.removeItem('stackMapDemoMode');
            // Demo data is kept separate, so no need to clear it
        }
    }

    init() {
        // Load data FIRST
        const hasData = this.loadFromLocalStorage();
        
        // Ensure user data is loaded
        if (!hasData) {
            // First time - load default user data
            this.appState.loadUserData();
        }
        
        // Initialize universal modal outside-click behavior
        this.initializeModalBehavior();
        
        // Default activities are now loaded from Card Library, not automatically
        // if (!hasData || this.appState.activities.length === 0) {
        //     this.createDefaultActivities();
        // }
        
        // ALWAYS apply theme to ensure CSS variables are set
        this.appState.applyTheme();
        
        // Apply user settings to body classes
        this.appState.applyUserSettings();
        
        this.setupEventListeners();
        this.populateUserDropdowns();
        this.renderDaySelectors(); // Story 4: Initialize day selectors
        this.renderLogos(); // Render StackMap logos
        this.render();
        
        // Check for first-time visit and show welcome splash
        this.checkFirstTimeVisit();
        
        // Setup scroll header immediately
        requestAnimationFrame(() => {
            this.setupScrollHeader();
        });
        
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
        
        // Initialize immediately
        this.initializeTitleSubtitle();
        this.initializeDrawer();
        this.initializeScrollHeader();
        this.initializeCelebrationSystem();
        this.initializeKeyboardShortcuts();
        
        // Add cleanup handler for page unload
        window.addEventListener('beforeunload', () => {
            if (this.driveSync) {
                this.driveSync.cleanup();
            }
        });
        
        // Mark initialization complete after a short delay
        // This prevents auto-sync from triggering during initial data load
        setTimeout(() => {
            this.isInitializing = false;
            
            // If Drive sync is ready and signed in, trigger initial sync
            if (this.driveSync && this.driveSync.isSignedIn) {
                this.debouncedAutoSync();
            }
        }, 1000);
    }
    
    // Initialize Google Drive sync with proper timing
    async initializeDriveSync() {
        
        // Wait for Google APIs with extended timeout and retry
        let retryCount = 0;
        const maxRetries = 100; // 10 seconds total
        
        const waitForGoogleAPIs = async () => {
            while (retryCount < maxRetries) {
                if (window.gapi && window.google && window.google.accounts) {
                    try {
                        this.driveSync = new GoogleDriveSync(this);
                        
                        // If drive sync initialized and user is already signed in,
                        // clear the initialization flag early
                        if (this.driveSync.isSignedIn) {
                            this.isInitializing = false;
                        }
                        
                        return true;
                    } catch (error) {
                        console.error('[StackMapApp] Failed to initialize Drive sync:', error);
                        return false;
                    }
                }
                
                // Check if scripts are blocked
                if (retryCount === 20) { // After 2 seconds
                    const gapiScript = document.querySelector('script[src*="apis.google.com"]');
                    const gsiScript = document.querySelector('script[src*="accounts.google.com"]');
                    
                    if (!gapiScript || !gsiScript) {
                        console.error('[StackMapApp] Google API scripts not found in DOM');
                        return false;
                    }
                    
                    // Check if scripts failed to load
                    if (gapiScript.onerror || gsiScript.onerror) {
                        console.error('[StackMapApp] Google API scripts failed to load - may be blocked');
                        return false;
                    }
                }
                
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.warn('[StackMapApp] Google APIs did not load after 10 seconds');
            console.warn('Possible causes:');
            console.warn('1. Scripts blocked by ad blocker or firewall');
            console.warn('2. Network connectivity issues');
            console.warn('3. Content Security Policy blocking scripts');
            console.warn('4. Domain not authorized in Google Cloud Console');
            return false;
        };
        
        // Use requestIdleCallback if available, otherwise immediate
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => waitForGoogleAPIs(), { timeout: 1000 });
        } else {
            waitForGoogleAPIs();
        }
    }
    
    // PWA Update Prompt
    showUpdatePrompt() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-banner-content">
                <span class="material-icons">system_update</span>
                <span>A new version of StackMap is available!</span>
                <button class="btn btn--small" onclick="window.location.reload()">Update Now</button>
            </div>
        `;
        updateBanner.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(102, 126, 234, 0.95);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideDown 0.3s ease-out;
        `;
        
        document.body.appendChild(updateBanner);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            updateBanner.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => updateBanner.remove(), 300);
        }, 10000);
    }
    
    // iOS PWA Features
    initializeIOSPWAFeatures() {
        // Prevent rubber band scrolling on iOS
        document.body.addEventListener('touchmove', (e) => {
            if (e.target.closest('.scrollable')) return;
            e.preventDefault();
        }, { passive: false });
        
        // Handle iOS safe areas
        if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
            document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
        }
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
            // Reduced padding in user mode to move cards up
            const isEditMode = document.body.classList.contains('grownup-mode');
            const extraPadding = isEditMode ? 15 : -40; // Move cards up 55px in user mode
            document.body.style.paddingTop = `${headerHeight + extraPadding}px`;
        }
    }

    setupTitleEditing(titleElement) {
        // Remove any existing click handlers
        const newTitle = titleElement.cloneNode(true);
        titleElement.parentNode.replaceChild(newTitle, titleElement);
        
        // Add click handler that only works in edit mode
        newTitle.addEventListener('click', (e) => {
            if (!this.grownupMode) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const currentText = newTitle.textContent;
            
            // Create character counter
            const charCounter = document.createElement('div');
            charCounter.className = 'title-char-counter';
            charCounter.style.cssText = `
                position: absolute;
                bottom: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.75rem;
                padding: 2px 8px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.9);
                transition: all 0.2s ease;
                z-index: 1050;
                white-space: nowrap;
            `;
            
            // Update character counter
            const updateCharCounter = () => {
                const length = newTitle.textContent.length;
                const maxLength = CONFIG.MAX_TITLE_LENGTH || 13;
                
                // Only show counter when approaching or at limit
                if (length >= maxLength - 2) {
                    charCounter.style.display = 'block';
                    charCounter.textContent = `${length}/${maxLength} characters`;
                    
                    if (length < maxLength) {
                        charCounter.style.color = '#FF9800';
                        charCounter.style.background = 'rgba(255, 243, 224, 0.95)';
                    } else {
                        charCounter.style.color = '#F44336';
                        charCounter.style.background = 'rgba(255, 235, 238, 0.95)';
                        charCounter.textContent = `${maxLength}/${maxLength} - Maximum reached`;
                    }
                } else {
                    charCounter.style.display = 'none';
                }
            };
            
            // Add counter to header
            const headerText = newTitle.parentElement;
            headerText.style.position = 'relative';
            headerText.appendChild(charCounter);
            updateCharCounter();
            
            // Make the title editable
            newTitle.contentEditable = true;
            newTitle.style.cursor = 'text';
            newTitle.style.outline = '2px solid var(--primary-color)';
            newTitle.style.borderRadius = '4px';
            newTitle.style.padding = '2px 8px';
            
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(newTitle);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Update counter on input and enforce limit
            newTitle.addEventListener('input', (e) => {
                const maxLength = CONFIG.MAX_TITLE_LENGTH || 13;
                
                // Enforce character limit
                if (newTitle.textContent.length > maxLength) {
                    // Prevent the input
                    newTitle.textContent = newTitle.textContent.substring(0, maxLength);
                    
                    // Move cursor to end
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(newTitle);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                
                updateCharCounter();
            });
            
            // Handle save on blur or enter
            const saveTitle = () => {
                newTitle.contentEditable = false;
                newTitle.style.cursor = 'pointer';
                newTitle.style.outline = 'none';
                newTitle.style.padding = '0';
                
                // Remove character counter
                if (charCounter.parentNode) {
                    charCounter.remove();
                }
                
                const newText = newTitle.textContent.trim();
                if (newText && newText !== currentText) {
                    // Save the new title
                    const currentUser = this.appState.getCurrentUser();
                    if (currentUser) {
                        currentUser.customTitle = newText;
                        this.appState.saveCurrentUserData();
                        this.updateLogoVisibility(newText);
                        this.updateTabTitle();
                    }
                } else if (!newText) {
                    // Restore original text if empty
                    newTitle.textContent = currentText;
                }
            };
            
            // Save on blur
            newTitle.addEventListener('blur', saveTitle, { once: true });
            
            // Save on Enter, cancel on Escape
            newTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    newTitle.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    newTitle.textContent = currentText;
                    newTitle.blur();
                }
            });
        });
        
        // Visual indicator in edit mode
        if (this.grownupMode) {
            newTitle.style.cursor = 'pointer';
            newTitle.setAttribute('title', 'Click to edit title');
        }
    }

    initializeTitleSubtitle() {
        // Get current user and day
        const currentUser = this.appState.getCurrentUser();
        if (!currentUser) {
            console.error('[StackMapApp] No current user for title initialization');
            return;
        }
        
        const currentDay = this.appState.ui.currentDay || 'today';
        
        // Title remains customizable with 13-character limit
        let userTitle = currentUser.customTitle || 'StackMap';
        
        // Subtitle (pill) shows emoji + day format
        const dayText = currentDay === 'today' ? 'Today' : 'Tomorrow';
        const userSubtitle = `<span style="font-size: 1.3em;">${currentUser.icon}</span> ${dayText}`;
        
        // Update all title elements
        const mainTitle = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        
        if (mainTitle) {
            mainTitle.textContent = userTitle;
            this.updateLogoVisibility(userTitle);
            
            // Make title editable in edit mode with 13-character limit
            this.setupTitleEditing(mainTitle);
        }
        if (subtitle) {
            subtitle.innerHTML = userSubtitle;
            
            // Remove any existing click handlers
            subtitle.replaceWith(subtitle.cloneNode(true));
            const newSubtitle = document.getElementById('subtitle');
            
            // Always clickable - users can switch in both modes
            newSubtitle.setAttribute('role', 'button');
            newSubtitle.setAttribute('aria-label', 'Click to change user or day');
            
            // Add click handler
            newSubtitle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showSelectorPanel();
            });
        }
    }
    
    initializeDrawer() {
        const drawerHandle = document.getElementById('drawerHandle');
        const drawerExtension = document.getElementById('drawerExtension');
        const drawerDone = document.getElementById('drawerDone');
        const appHeader = document.getElementById('appHeader');
        const backdrop = this.createBackdrop();
        const headerShadow = this.createHeaderShadow();
        
        if (!drawerHandle || !drawerExtension) return;
        
        // Check initial state based on preferences and edit mode
        let isOpen = this.shouldDrawerBeOpen();
        let isDragging = false;
        let startY = 0;
        let currentY = 0;
        
        const openDrawer = (savePreference = true) => {
        // 
            isOpen = true;
            drawerHandle.setAttribute('aria-expanded', 'true');
            drawerExtension.setAttribute('aria-hidden', 'false');
            drawerExtension.classList.add('open');
            appHeader.classList.add('drawer-open');
            document.getElementById('headerWrapper')?.classList.add('drawer-open');
            
            // ENHANCED: Brief backdrop during transition, then hide
            backdrop.classList.add('visible');
            document.body.classList.add('drawer-active');
            
            // Hide backdrop after transition completes (drawer fully open)
            setTimeout(() => {
                backdrop.classList.remove('visible');
            }, 400); // Match CSS transition timing
            
            // Save preference unless specified otherwise (e.g., during initialization)
            if (savePreference) {
                this.setDrawerPreference(true);
            }
            
            // Setup staggered animations for dropdowns
            const dropdownGroups = drawerExtension.querySelectorAll('.dropdown-group');
            dropdownGroups.forEach((group, index) => {
                group.style.transitionDelay = `${(index + 1) * 0.1}s`;
            });
            
            this.populateDrawerSelects();
        // 
        };
        
        const closeDrawer = (savePreference = true) => {
        // 
            
            // Check if drawer is locked in edit mode
            if (this.grownupMode && drawerExtension.classList.contains('edit-mode-locked')) {
        // 
                return;
            }
            
            isOpen = false;
            drawerHandle.setAttribute('aria-expanded', 'false');
            drawerExtension.setAttribute('aria-hidden', 'true');
            drawerExtension.classList.remove('open');
            appHeader.classList.remove('drawer-open');
            document.getElementById('headerWrapper')?.classList.remove('drawer-open');
            
            // NO BACKDROP: Remove any backdrop during close
            backdrop.classList.remove('visible');
            
            document.body.classList.remove('drawer-active');
            
            // Save preference unless specified otherwise
            if (savePreference) {
                this.setDrawerPreference(false);
            }
            
            // Fast exit animations for dropdowns
            const dropdownGroups = drawerExtension.querySelectorAll('.dropdown-group');
            dropdownGroups.forEach(group => {
                group.style.transitionDelay = '0s';
                group.style.transitionDuration = '0.2s';
            });
            
        // 
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
        // 
            if (!isDragging) {
                if (isOpen) {
        // 
                    closeDrawer();
                } else {
        // 
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
        
        // Force drawer open event (for edit mode)
        drawerHandle.addEventListener('forceDrawerOpen', () => {
            if (!isOpen) {
                openDrawer(false); // Don't save preference when forced
            }
        });
        
        // Force drawer close event (for exiting edit mode)
        drawerHandle.addEventListener('closeDrawer', () => {
            if (isOpen) {
                closeDrawer(false); // Don't save preference when forced
            }
        });
        
        // Setup select change handlers
        this.setupDrawerSelects();
        
        // Set initial state based on preferences (after all event listeners are set up)
        if (isOpen) {
            openDrawer(false); // Don't save preference on initialization
        // 
        } else {
        // 
        }
    }
    
    createBackdrop() {
        const backdrop = document.createElement('div');
        backdrop.className = 'drawer-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);
        return backdrop;
    }
    
    createHeaderShadow() {
        const shadow = document.createElement('div');
        shadow.className = 'header-shadow';
        shadow.setAttribute('aria-hidden', 'true');
        document.body.appendChild(shadow);
        return shadow;
    }
    
    populateDrawerSelects() {
        // 
        const userSection = document.getElementById('userSection');
        const daySelect = document.getElementById('drawerDaySelect');
        
        // 
        // 
        
        if (userSection) {
            const allUsers = this.appState.getAllUsers();
        // 
            userSection.style.display = 'flex'; // Always show section

        // 
            
            if (allUsers.length > 1) {
                // Multiple users - show custom dropdown (no label for cleaner look)
                const currentUser = this.appState.getCurrentUser();
                userSection.innerHTML = `
                    <button class="drawer-select" id="drawerUserSelect" data-value="${SecurityUtils.escapeHtml(currentUser.id)}">
                        <span>${SecurityUtils.escapeHtml(currentUser.icon || '👤')} ${SecurityUtils.escapeHtml(currentUser.name)}</span>
                    </button>
                `;
                
                const userSelect = document.getElementById('drawerUserSelect');
        // 
                
                if (!userSelect) {
                    console.error('Failed to find user select element after creation');
                    return;
                }
                
                userSelect.addEventListener('click', (e) => {
        // 
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
                    });
                    
                    // Add edit option in edit mode
                    if (this.grownupMode) {
                        dropdownOptions.push({
                            id: 'edit-current-user',
                            text: 'Edit ' + currentUser.name,
                            icon: '✏️',
                            selected: false,
                            type: 'action'
                        });
                    }
                    
                    this.showNativeDropdown('User', dropdownOptions, (selectedId) => {
        // 
                        
                        // Check if it's an edit action
                        if (selectedId === 'edit-current-user') {
                            // Open user edit form in panel
                            const user = this.appState.getCurrentUser();
                            window.hybridPanelManager.state.showingUserForm = true;
                            window.hybridPanelManager.state.editingUser = user;
                            window.hybridPanelManager.state.editingUserId = user.id;
                            window.hybridPanelManager.openPanel('right');
                        } else {
                            // Handle user selection (navigation)
                            this.handleUserSwitch(selectedId);
                            const selectedUser = allUsers.find(u => u.id === selectedId);
                            if (selectedUser && userSelect) {
                                userSelect.innerHTML = `<span>${SecurityUtils.escapeHtml(selectedUser.icon || '👤')} ${SecurityUtils.escapeHtml(selectedUser.name)}</span>`;
                                userSelect.setAttribute('data-value', selectedId);
                            }
                        }
                    }, userSelect);
                });
            } else {
                // CRITICAL FIX: Single user, not in edit mode - HIDE completely to save space
                userSection.style.display = 'none';
                userSection.innerHTML = '';
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
                <button class="drawer-select" id="drawerDaySelect" data-value="${SecurityUtils.escapeHtml(currentDay)}">
                    <span>${SecurityUtils.escapeHtml(selectedDay?.icon)} ${SecurityUtils.escapeHtml(selectedDay?.text)}</span>
                </button>
            `;
            
            const newDaySelect = document.getElementById('drawerDaySelect');
        // 
            
            if (!newDaySelect) {
                console.error('Failed to find day select element after creation');
                return;
            }
            
            newDaySelect.addEventListener('click', (e) => {
        // 
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
        // 
        // );
                    this.switchDay(selectedId);
        // );
                    const selected = dayOptions.find(d => d.id === selectedId);
                    if (selected && newDaySelect) {
                        newDaySelect.innerHTML = `<span>${SecurityUtils.escapeHtml(selected.icon)} ${SecurityUtils.escapeHtml(selected.text)}</span>`;
                        newDaySelect.setAttribute('data-value', selectedId);
                    }
                    // Refresh the view
                    this.render();
                }, newDaySelect);
            });
        }
    }
    
    showCustomDropdown(title, options, onSelect, triggerElement = null) {
        // 
        
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
        
        // console.log('Modal elements found:', {
        //     modal: !!modal,
        //     modalTitle: !!modalTitle,
        //     modalOptions: !!modalOptions,
        //     closeBtn: !!closeBtn,
        //     backdrop: !!backdrop
        // });
        
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
        
        // 
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
        // 
        // .display);
        // .zIndex);
        // .visibility);
        // .position);
        }, 100);
        
        const handleClose = () => {
        // 
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
        // 
                e.preventDefault();
                e.stopPropagation();
                const value = option.getAttribute('data-value');
        // 
                if (value) {
        // 
                    try {
                        onSelect(value);
        // 
                    } catch (error) {
                        console.error('Error in onSelect callback:', error);
                    }
                    handleClose();
                } else {
                    console.error('No data-value found on option:', option);
                }
            });
        });
        
        // 
    }
    
    showNativeDropdown(title, options, onSelect, triggerElement) {
        // 
        
        // Remove any existing native dropdown
        const existingDropdown = document.querySelector('.native-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Mobile-specific detection
        const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
        // 
        
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
                ${options.map(option => {
                    const optionClass = `native-dropdown-option ${option.selected ? 'selected' : ''} ${option.type ? `native-dropdown-option--${option.type}` : ''}`;
                    
                    // Handle different icon types
                    let iconContent = '';
                    if (option.type === 'action') {
                        // Use Material Icons for actions
                        iconContent = `<span class="material-icons">${SecurityUtils.escapeHtml(option.icon)}</span>`;
                    } else {
                        // Use emoji/text for users and day options
                        iconContent = SecurityUtils.escapeHtml(option.icon);
                    }
                    
                    return `
                        <button class="${SecurityUtils.escapeHtml(optionClass)}" 
                                data-value="${SecurityUtils.escapeHtml(option.id)}"
                                role="option"
                                aria-selected="${option.selected}">
                            <span class="native-dropdown-option-icon">${iconContent}</span>
                            <span class="native-dropdown-option-text">${SecurityUtils.escapeHtml(option.text)}</span>
                            ${option.selected ? '<span class="native-dropdown-check">✓</span>' : ''}
                        </button>
                    `;
                }).join('')}
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
        
        // 
        
        // Load all default activities from the external data file
        DEFAULT_ACTIVITIES.forEach((activity, index) => {
        // 
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
        
        // 
        // .length);
        // .length);
    }
    
    setupAutoSyncInterval() {
        setInterval(() => {
            if (this.driveSync && this.driveSync.isSignedIn && this.grownupMode) {
                // Silently sync in the background
                this.driveSync.autoSync(true);
            }
        }, CONFIG.AUTO_SYNC_INTERVAL);
    }

    processGranularSync() {
        // If drive sync is not available, skip
        if (!this.driveSync || !this.driveSync.isSignedIn) {
            return;
        }
        
        // Get unsynced operations from the operation log
        const unsyncedOps = this.appState._getUnsyncedOperations();
        
        if (unsyncedOps.length === 0) {
            return;
        }
        
        // Process each operation and queue it for sync
        unsyncedOps.forEach(op => {
            switch(op.type) {
                case 'add-activity':
                case 'update-activity':
                    this.driveSync.queueActivityUpdate(
                        op.data.userId,
                        op.data.activityId,
                        op.data
                    );
                    break;
                    
                case 'remove-activity':
                    this.driveSync.queueActivityDelete(
                        op.data.userId,
                        op.data.activityId
                    );
                    break;
                    
                case 'move-activity':
                    this.driveSync.queueActivityMove(
                        op.data.userId,
                        op.data.activityId,
                        op.data.fromIndex,
                        op.data.toIndex
                    );
                    break;
                    
                case 'add-user':
                case 'update-user':
                    // For now, queue a full sync for user operations
                    // This will be optimized in Phase 3
                    this.driveSync.queueBatchUpdate(
                        op.data.userId,
                        [],
                        { userOperation: op.type, data: op.data }
                    );
                    break;
                    
                case 'switch-user':
                    this.driveSync.queueUserSwitch(op.data.newUserId);
                    break;
            }
        });
        
        // Mark operations as queued (they'll be marked synced when processed)
        const operationIds = unsyncedOps.map(op => op.id);
        this.appState._markOperationsSynced(operationIds);
    }
    
    debouncedAutoSync() {
        if (this.autoSyncTimeout) {
            clearTimeout(this.autoSyncTimeout);
        }
        
        // Wait 30 seconds after last change before auto-syncing
        // This prevents constant sync notifications during active use
        this.autoSyncTimeout = setTimeout(() => {
            if (this.driveSync && this.driveSync.autoSync && this.driveSync.isSignedIn && !this.isInitializing) {
                // For backward compatibility, still do a full sync
                // Once granular sync is fully tested, we can remove this
                this.driveSync.autoSync(true); // Pass silent flag
            }
        }, 30000);
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
        // OLD SYSTEM DISABLED - Using hybrid panel system now
        // 
        
        // Hide old button if it exists
        const btn = document.getElementById('grownupBtn');
        if (btn) {
            btn.style.display = 'none';
        }
        
        // Edit mode toggling is now handled by hybrid panel system
        return;
    }

    updateTabTitle() {
        document.title = 'StackMap';
    }

    setupEventListeners() {
        // OLD BUTTON SYSTEM DISABLED - Using hybrid panel system now
        const grownupBtn = document.getElementById('grownupBtn');
        if (grownupBtn) {
            // Disable old button - edit mode is now handled by hybrid panels
            grownupBtn.style.display = 'none';
        // 
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
            
            // Default activities are now loaded from Card Library, not automatically
            // if (this.appState.activities.length === 0) {
            //     this.createDefaultActivities();
            // }
            
            // Apply user settings to body classes
            this.appState.applyUserSettings();
            
            this.renderer.render();
            this.renderer.updateHeader();
            this.syncFixedHeader();
            this.populateUserDropdowns();
            
            // Update title/subtitle for new user
            this.initializeTitleSubtitle();
        }
    }
    
    showAddUserDialog() {
        // 
        // Use the hybrid panel manager for adding users
        window.hybridPanelManager.showAddUserPanel();
    }
    
    showEditUserDialog(user) {
        // 
        // Use the hybrid panel manager for editing users
        window.hybridPanelManager.showEditUserPanel(user);
    }
    
    deleteUser(userId) {
        // 
        try {
            // Use AppState's deleteUser method if it exists
            if (typeof this.appState.deleteUser === 'function') {
                const success = this.appState.deleteUser(userId);
                if (success) {
                    this.populateDrawerSelects();
                    this.render();
        // 
                }
            } else {
                console.error('AppState.deleteUser method not available');
                this.showToast('Delete user functionality not yet implemented', 'info');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showToast('Error deleting user: ' + error.message, 'error');
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
    
    // Selector Panel Methods
    showSelectorPanel() {
        // Open the user/day selector in the left panel
        if (window.hybridPanelManager) {
            window.hybridPanelManager.showUserDaySelector();
        }
    }
    
    // Story 4: Get activity counts for each day
    getDayCounts() {
        const user = this.appState.getCurrentUser();
        return {
            today: user.activities.length,
            tomorrow: user.tomorrowActivities.length
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
        // );
        if (this.appState.getCurrentDay() !== day) {
            // Save current scroll position
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            
            this.appState.setCurrentDay(day);
            
            // Update title/subtitle for the new day
            this.initializeTitleSubtitle();
            
            // Refresh preferences panel if open to show correct day's values
            if (window.hybridPanelManager && window.hybridPanelManager.state && window.hybridPanelManager.state.leftPanelOpen) {
                window.hybridPanelManager.renderPanelContent('left', false);
            }
            
            // Ensure tomorrow has activities if empty and user has today activities
            if (day === 'tomorrow') {
                const user = this.appState.getCurrentUser();
                if (user.tomorrowActivities.length === 0 && user.activities.length > 0) {
        // 
                    // Copy recurring activities from today to tomorrow
                    user.activities.forEach(activity => {
                        if (activity.cardType === 'recurring' || !activity.cardType) {
                            // Deep clone the activity to avoid shared references
                            const tomorrowActivity = this.appState.deepCloneActivity(activity, true); // true = generate new ID
                            // Reset completion for tomorrow
                            tomorrowActivity.completed = false;
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
            
            // Restore scroll position after render
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: currentScroll,
                    left: 0,
                    behavior: 'instant'
                });
            });
            
        // .length);
        // 
        // 
            
            // Debug management cards after render
            setTimeout(() => {
                const managementCards = document.querySelectorAll('.management-card');
        // 
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
        // In demo mode, always show welcome splash if not seen
        if (window.DEMO_MODE) {
            const hasSeenDemoWelcome = localStorage.getItem(this.getStorageKey('stackmap-welcome-seen'));
            if (!hasSeenDemoWelcome) {
                setTimeout(() => {
                    this.showWelcomeSplash();
                }, 500);
            }
            return;
        }
        
        // Check if user still has default name
        const currentUser = this.appState.getCurrentUser();
        const hasDefaultName = currentUser.name === 'StackMap User' || currentUser.name === 'You';
        
        // If user has default name, they should go through the full flow
        // regardless of what flags are set - this ensures consistent experience
        if (hasDefaultName) {
            // Clear the welcome seen flag to show full flow
            localStorage.removeItem(this.getStorageKey('stackmap-welcome-seen'));
            localStorage.removeItem(this.getStorageKey('stackmap-splash-seen'));
        }
        
        // Check if welcome splash has been seen
        const hasSeenWelcome = localStorage.getItem(this.getStorageKey('stackmap-welcome-seen'));
        
        if (!hasSeenWelcome) {
            // Show the simple welcome splash for all first-time visitors
            setTimeout(() => {
                this.showWelcomeSplash();
            }, 500);
            return;
        }
        
        // Check if setup splash has been seen
        const hasSeenSplash = localStorage.getItem(this.getStorageKey('stackmap-splash-seen'));
        
        if (!hasSeenSplash) {
            this.showSplashScreen();
        }
    }

    showSplashScreen() {
        const splashScreen = document.getElementById('splashScreen');
        if (!splashScreen) return;
        
        // Reset pages to initial state
        const page1 = document.getElementById('splashPage1');
        const page2 = document.getElementById('splashPage2');
        page1.classList.remove('hidden', 'splash-page-transition-out', 'splash-page-transition-in');
        page2.classList.add('hidden');
        page2.classList.remove('splash-page-transition-out', 'splash-page-transition-in');
        
        // Reset fade-out class
        splashScreen.classList.remove('fade-out');
        
        // Set up the splash screen
        this.setupSplashScreen();
        
        // Show splash screen
        splashScreen.classList.remove('hidden');
        this.splashShown = true;
    }
    
    setupSplashScreen() {
        const nameInput = document.getElementById('splashUserName');
        const emojiInput = document.getElementById('splashUserEmoji');
        const startButton = document.getElementById('splashStartButton');
        const refreshButton = document.getElementById('splashEmojiRefresh');
        const optionsContainer = document.getElementById('splashEmojiOptions');
        const nextButton = document.getElementById('splashNextButton');
        const backButton = document.getElementById('splashBackButton');
        const page1 = document.getElementById('splashPage1');
        const page2 = document.getElementById('splashPage2');
        const splashScreen = document.getElementById('splashScreen');
        
        // Common emojis for user avatars
        this.userEmojis = [
            '😊', '😎', '🤩', '😄', '😁', '🥳', '🤗', '😇', '🙂', '😋',
            '🦄', '🐶', '🐱', '🐼', '🐨', '🦁', '🐯', '🦊', '🐻', '🐸',
            '🦋', '🌈', '⭐', '🌟', '✨', '🌺', '🌻', '🌸', '🌼', '🌷',
            '🎨', '🎯', '🎪', '🎭', '🎬', '🎮', '🎸', '🎺', '🎹', '🎤',
            '🚀', '✈️', '🚁', '🚂', '🏎️', '🏍️', '🛸', '🛶', '⛵', '🚤',
            '🍎', '🍓', '🍊', '🍋', '🍌', '🍉', '🍇', '🥝', '🍑', '🍒',
            '🏈', '🏀', '⚽', '🎾', '🏐', '🎱', '🏓', '🏸', '🥏', '🎳',
            '💜', '💙', '💚', '💛', '🧡', '❤️', '🤍', '🖤', '💝', '💖'
        ];
        
        // Initialize with default emoji
        this.selectedEmoji = '👤';
        
        // Next button handler (Page 1 -> Page 2)
        nextButton.addEventListener('click', () => {
            // Add transitioning class to prevent initial animation interference
            page1.classList.add('transitioning');
            page2.classList.add('transitioning');
            
            // Animate page transition
            page1.classList.add('slide-out-left');
            
            setTimeout(() => {
                page1.classList.add('hidden');
                page1.classList.remove('slide-out-left');
                page2.classList.remove('hidden');
                page2.classList.add('slide-in-right');
                
                // Show random emojis when entering page 2
                this.showRandomEmojis();
                
                // Focus on name input and cleanup animation classes
                setTimeout(() => {
                    nameInput.focus();
                    page2.classList.remove('slide-in-right', 'transitioning');
                    page1.classList.remove('transitioning');
                }, 400);
            }, 400);
        });
        
        // Back button handler (Page 2 -> Page 1)
        backButton.addEventListener('click', () => {
            // Add transitioning class to prevent initial animation interference
            page1.classList.add('transitioning');
            page2.classList.add('transitioning');
            
            // Animate page transition back
            page2.classList.add('slide-out-right');
            
            setTimeout(() => {
                page2.classList.add('hidden');
                page2.classList.remove('slide-out-right');
                page1.classList.remove('hidden');
                page1.classList.add('slide-in-left');
                
                // Cleanup animation classes
                setTimeout(() => {
                    page1.classList.remove('slide-in-left', 'transitioning');
                    page2.classList.remove('transitioning');
                }, 400);
            }, 400);
        });
        
        // Enable/disable start button based on name input
        const checkCanStart = () => {
            const hasName = nameInput.value.trim().length > 0;
            startButton.disabled = !hasName;
        };
        
        // Name input handler
        nameInput.addEventListener('input', checkCanStart);
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !startButton.disabled) {
                this.completeSplashScreen();
            }
        });
        
        // Refresh button handler
        refreshButton.addEventListener('click', () => {
            this.showRandomEmojis();
        });
        
        // Start button handler
        startButton.addEventListener('click', () => {
            this.completeSplashScreen();
        });
        
        // Keyboard navigation
        const handleKeyDown = (e) => {
            // Escape key handling
            if (e.key === 'Escape') {
                // Don't allow closing on first visit
                if (!localStorage.getItem(this.getStorageKey('stackmap-splash-seen'))) {
                    return;
                }
                
                // Close splash screen
                splashScreen.classList.add('fade-out');
                setTimeout(() => {
                    splashScreen.classList.add('hidden');
                    this.splashShown = false;
                    document.removeEventListener('keydown', handleKeyDown);
                }, 300);
            }
        };
        
        // Add keyboard listener when splash is shown
        if (this.splashShown) {
            document.addEventListener('keydown', handleKeyDown);
        }
    }
    
    showRandomEmojis() {
        const optionsContainer = document.getElementById('splashEmojiOptions');
        const emojiInput = document.getElementById('splashUserEmoji');
        
        // Get 5 random emojis
        const randomEmojis = [];
        const tempEmojis = [...this.userEmojis];
        
        for (let i = 0; i < 5 && tempEmojis.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * tempEmojis.length);
            randomEmojis.push(tempEmojis.splice(randomIndex, 1)[0]);
        }
        
        // Clear current options
        optionsContainer.innerHTML = '';
        
        // Create emoji buttons
        randomEmojis.forEach(emoji => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'splash-emoji-option';
            button.textContent = emoji;
            button.setAttribute('aria-label', `Select ${emoji} as your emoji`);
            
            // Check if this emoji is currently selected
            if (emoji === this.selectedEmoji) {
                button.classList.add('selected');
            }
            
            button.addEventListener('click', () => {
                // Remove selected class from all buttons
                optionsContainer.querySelectorAll('.splash-emoji-option').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // Add selected class to clicked button
                button.classList.add('selected');
                
                // Update selected emoji
                this.selectedEmoji = emoji;
                emojiInput.value = emoji;
            });
            
            optionsContainer.appendChild(button);
        });
    }
    
    completeSplashScreen() {
        const nameInput = document.getElementById('splashUserName');
        const emojiInput = document.getElementById('splashUserEmoji');
        const splashScreen = document.getElementById('splashScreen');
        
        const userName = nameInput.value.trim();
        const userEmoji = this.selectedEmoji || emojiInput.value || '👤';
        
        if (!userName) return;
        
        // Update the default user with the new name and emoji
        const currentUser = this.appState.getCurrentUser();
        currentUser.name = userName;
        currentUser.icon = userEmoji;
        
        // Keep title as StackMap, don't change it
        // Title should only change if user manually edits it
        // The subtitle will show the user's name and day
        
        // Save the changes
        this.appState._triggerSave();
        
        // Mark splash as seen
        localStorage.setItem(this.getStorageKey('stackmap-splash-seen'), 'true');
        
        // Fade out and hide splash screen
        splashScreen.classList.add('fade-out');
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            this.splashShown = false;
            
            // Update the UI
            this.initializeTitleSubtitle();
            this.render();
            
            // Update user dropdowns
            this.populateUserDropdowns();
            window.hybridPanelManager.updateSubtitle();
        }, 300);
    }
    
    showWelcomeSplash() {
        // Legacy method - kept for compatibility
        const welcomeSplash = document.getElementById('welcomeSplash');
        if (welcomeSplash) {
            // Customize content for demo mode
            if (window.DEMO_MODE) {
                const title = welcomeSplash.querySelector('#welcome-title');
                const message = welcomeSplash.querySelector('.welcome-message p');
                if (title) {
                    title.textContent = 'Welcome to the Mushroom Kingdom Demo!';
                }
                if (message) {
                    message.innerHTML = '<strong>Explore StackMap with Mario\'s daily routine!</strong> This demo shows how families in the Mushroom Kingdom use StackMap to manage their daily activities.';
                }
            }
            
            // Add body class for button glow effect
            document.body.classList.add('showing-welcome');
            
            // Show the splash immediately
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
                localStorage.setItem(this.getStorageKey('stackmap-welcome-seen'), 'true');
            }, 300);
        }
    }

    showWelcomeAgain() {
        // Close preferences panel first (now handled by HybridPanelManager)
        window.hybridPanelManager.closeAllPanels();
        
        // Show welcome splash again (temporarily reset the localStorage flag)
        const originalFlag = localStorage.getItem(this.getStorageKey('stackmap-welcome-seen'));
        localStorage.removeItem(this.getStorageKey('stackmap-welcome-seen'));
        
        setTimeout(() => {
            this.showWelcomeSplash();
            
            // Override the dismissWelcome method temporarily to restore the flag
            const originalDismiss = this.dismissWelcome.bind(this);
            this.dismissWelcome = () => {
                originalDismiss();
                if (originalFlag) {
                    localStorage.setItem(this.getStorageKey('stackmap-welcome-seen'), originalFlag);
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
            // Open management panel for validation (handled by HybridPanelManager)
            window.hybridPanelManager.openPanel('right');
        }
    }

    enterGrownupMode() {
        // 
        
        // Ensure any validation modals are removed
        if (this.hybridPanelManager) {
            this.hybridPanelManager.removeValidationModal();
        }
        
        this.grownupMode = true;
        this.appState.ui.editMode = true;
        
        // Add body class for CSS targeting
        document.body.classList.add('grownup-mode');
        
        // Update subtitle to reflect edit mode
        this.initializeTitleSubtitle();
        
        // Update body padding for edit mode
        this.updateBodyPadding();
        
        // FAB removed - edit mode now accessed through main menu
        
        // NEW: Push history state for edit mode (Android back button)
        // Note: pushBackButtonState doesn't exist on hybridPanelManager
        // This functionality may need to be implemented differently
        
        // Force drawer open and lock it for edit mode
        this.forceDrawerOpen();
        
        // Old grownup button update removed - using hybrid panels
        
        // Update preferences panel if it's open (now handled by HybridPanelManager)
        // Old system disabled - HybridPanelManager handles panel updates automatically
        
        // Update drawer to show Add User button and edit options
        this.populateDrawerSelects();
        
        // Force complete re-render to ensure edit controls appear
        this.render();
        this.syncFixedHeader();
        
        // Double-check edit mode is set
        if (!this.appState.ui.editMode) {
            console.error('Edit mode not properly set!');
            this.appState.ui.editMode = true;
            // Try rendering again
            this.render();
        }
        
        // 
        
        // 
    }

    exitGrownupMode() {
        // 
        
        this.grownupMode = false;
        this.appState.ui.editMode = false;
        this.appState.ui.editingCardIndex = -1;
        this.appState.ui.showingNewCardForm = false;
        
        // Update subtitle to reflect normal mode
        this.initializeTitleSubtitle();
        
        // Modal system was removed in cleanup - no longer needed
        
        // Close any open native dropdowns
        const openDropdown = document.querySelector('.native-dropdown');
        if (openDropdown) {
            openDropdown.remove();
        }
        
        // Remove body class
        document.body.classList.remove('grownup-mode');
        
        // Update body padding for user mode
        this.updateBodyPadding();
        
        // FAB removed - edit mode now accessed through main menu
        
        // Close data panel if open
        if (this.dataPanel && this.dataPanel.isOpen) {
            this.dataPanel.close();
        }
        
        // NEW: Close any open panels when exiting edit mode
        if (this.hybridPanelManager && this.hybridPanelManager.closeAllPanels) {
            this.hybridPanelManager.closeAllPanels();
        }
        
        // Unlock drawer and return to user preference
        this.unlockDrawer();
        
        const userPref = this.getDrawerPreference();
        if (!userPref.drawerOpen) {
            // User prefers drawer closed, close it without saving preference
            const drawerExtension = document.getElementById('drawerExtension');
            if (drawerExtension && drawerExtension.classList.contains('open')) {
                // Trigger close via click event to use existing logic
                const drawerHandle = document.getElementById('drawerHandle');
                if (drawerHandle) {
                    const closeEvent = new CustomEvent('closeDrawer');
                    drawerHandle.dispatchEvent(closeEvent);
                }
            }
        }
        
        // Old grownup button update removed - using hybrid panels
        
        // Update preferences panel if it's open (now handled by HybridPanelManager)
        // Old system disabled - HybridPanelManager handles panel updates automatically
        
        // Update drawer to hide Add User button and edit options
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
        
        // Force immediate render to update UI
        this.render();
        this.syncFixedHeader();
        
        // Double-check the body class was removed
        if (document.body.classList.contains('grownup-mode')) {
            console.warn('Body class grownup-mode still present after exit!');
            document.body.classList.remove('grownup-mode');
        }
        
        // Force another render to ensure cards resize properly
        setTimeout(() => {
            this.render();
        }, 50);
        
        // 
    }

    // Data management panel removed - functionality in HybridPanelManager

    /**
     * Initialize iOS PWA-specific features
     */
    initializeIOSPWAFeatures() {
        // Ensure critical navigation is always accessible
        this.ensureIOSNavigationAccessibility();
        
        // Add iOS-specific keyboard handling if needed
        this.setupIOSKeyboardHandling();
    }

    /**
     * Ensure navigation remains accessible in iOS PWA mode
     */
    ensureIOSNavigationAccessibility() {
        // Add any additional navigation safeguards for iOS PWA
        // 
    }

    /**
     * Setup iOS-specific keyboard handling
     */
    setupIOSKeyboardHandling() {
        // Handle iOS keyboard quirks that might affect navigation
        if (window.hybridPanelManager.isIOSPWA) {
            // Add viewport adjustments for iOS keyboard if needed
        // 
        }
    }

    render(preserveScroll = false) {
        let currentScroll = 0;
        if (preserveScroll) {
            currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        }
        
        this.renderer.render();
        setTimeout(() => {
            this.syncFixedHeader();
            // Reapply filter if one exists
            this.reapplyFilter();
            
            if (preserveScroll && currentScroll > 0) {
                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: currentScroll,
                        left: 0,
                        behavior: 'instant'
                    });
                });
            }
        }, 0);
    }

    // NEW CARD FUNCTIONALITY - Now uses side menu
    openNewCardForm(position = 'top') {
        // 
        
        // Store the position for later use if needed
        this.appState.ui.showingNewCardForm = position;
        
        // Open the management panel and show the add activity form
        window.hybridPanelManager.addNewCard();
    }

    closeNewCardForm() {
        this.appState.ui.showingNewCardForm = false;
        // No longer needed - hybrid panel handles this
    }

    addActivity(position = 'top') {
        // 
        // );
        
        const titleInput = document.getElementById('newActivityTitle');
        const descInput = document.getElementById('newActivityDescription');
        const timeInput = document.getElementById('newActivityTime');
        
        if (!titleInput || !descInput) {
        // 
            return;
        }
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        const time = timeInput ? timeInput.value : '';
        
        // );
        
        if (!title) {
            this.showToast('Please enter a title', 'warning');
            titleInput.focus();
            return;
        }
        
        try {
            // Use the current form position or default
            const currentPosition = this.appState.ui.showingNewCardForm || position;
            
        // 
        // .length);
            
            // Use the AppState method which handles position properly
            this.appState.addActivity({
                title,
                description,
                icon: this.appState.ui.selectedEmoji,
                time,
                cardType: this.selectedCardType // Story 1: Include selected card type
            }, currentPosition);
            
        // .length);
            
            // Enhanced debugging for tomorrow activities
            if (this.appState.getCurrentDay() === 'tomorrow') {
                const user = this.appState.getCurrentUser();
        // 
        // 
        // 
        //  count:', this.appState.getCurrentActivities().length);
            }
            
            this.clearNewActivity();
            this.closeNewCardForm();
            this.render();
            
            // Verify the activity appears after render
            setTimeout(() => {
        // ').length);
                const managementCards = document.querySelectorAll('.management-card');
        // 
            }, 100);
        } catch (error) {
            console.error('Error adding activity:', error);
            this.showToast(error.message, 'error');
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

    // COLOR SELECTION - Delegate to HybridPanelManager
    selectColor(color) {
        window.hybridPanelManager.selectColor(color);
    }

    // ACTIVITY MANAGEMENT
    duplicateActivity(index) {
        if (index >= 0 && index < this.appState.activities.length) {
            const originalActivity = this.appState.activities[index];
            // Deep clone the activity to avoid shared references
            const duplicatedActivity = this.appState.deepCloneActivity(originalActivity);
            
            // Customize the duplicate
            duplicatedActivity.title = originalActivity.title + ' (Copy)';
            duplicatedActivity.completed = false;
            // Generate new unique ID
            duplicatedActivity.id = 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Insert after the original
            this.appState.activities.splice(index + 1, 0, duplicatedActivity);
            this.appState.saveCurrentUserData(); // Save the modified activities back to user profile
            this.appState._triggerSave();
            this.render();
        }
    }

    toggleVisibility(index) {
        this.appState.toggleActivityVisibility(index);
        this.render();
    }

    toggleKeep(index) {
        const user = this.appState.getCurrentUser();
        const currentDay = this.appState.getCurrentDay();
        
        if (currentDay === 'today') {
            // Handle pinning on Today view
            const activities = user.activities;
            if (activities[index]) {
                const activity = activities[index];
                const newKeepValue = !activity.keep;
                
                // Update the activity using the state method
                this.appState.updateActivity(index, { keep: newKeepValue });
                
                if (newKeepValue) {
                    // When pinning, also add to tomorrow - use deep clone with new ID
                    const updatedActivity = user.activities[index]; // Get the updated activity
                    const tomorrowCopy = this.appState.deepCloneActivity(updatedActivity, true); // true = generate new ID
                    tomorrowCopy.completed = false;
                    tomorrowCopy.keep = true; // Keep the pin status on tomorrow's copy so it's visible
                    tomorrowCopy.cardNumber = user.tomorrowActivities.length + 1;
                    user.tomorrowActivities.push(tomorrowCopy);
                } else {
                    // When unpinning, remove from tomorrow if it exists
                    const activityTitle = activity.title;
                    const activityIcon = activity.icon;
                    user.tomorrowActivities = user.tomorrowActivities.filter(
                        a => !(a.title === activityTitle && a.icon === activityIcon)
                    );
                }
            }
        } else if (currentDay === 'tomorrow') {
            // Handle pinning on Tomorrow view
            const activities = user.tomorrowActivities;
            if (activities[index]) {
                const activity = activities[index];
                const newKeepValue = !activity.keep;
                
                // Update the activity using the state method
                this.appState.updateActivity(index, { keep: newKeepValue });
            }
        }
        
        this.appState._triggerSave();
        this.render(true); // Preserve scroll when toggling pins
        this.updateDayCounts();
    }

    editCardNumber(index) {
        const activities = this.appState.getCurrentActivities();
        const activity = activities[index];
        if (!activity) return;

        const currentNumber = activity.cardNumber || index + 1;
        const newNumber = prompt(`Enter new position for "${activity.title}" (1-${activities.length}):`, currentNumber);
        
        if (newNumber && !isNaN(newNumber)) {
            const num = parseInt(newNumber);
            if (num >= 1 && num <= activities.length) {
                // Update card numbers and resort
                this.appState.updateCardPosition(index, num - 1);
                this.render();
            } else {
                this.showToast(`Please enter a number between 1 and ${activities.length}`, 'warning');
            }
        }
    }

    deleteActivity(index) {
        if (confirm('Are you sure you want to delete this activity?')) {
            this.appState.removeActivity(index);
            this.render();
        }
    }

    // CARD MENU
    openCardMenu(index, event) {
        // Close any existing menu
        this.closeCardMenu();
        
        // Get card element position
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        
        // Create menu container
        const menu = document.createElement('div');
        menu.className = 'card-menu';
        menu.setAttribute('data-card-index', index);
        
        // Create menu options
        const menuOptions = [
            {
                icon: 'content_copy',
                label: 'Duplicate',
                action: () => {
                    this.duplicateActivity(index);
                    this.closeCardMenu();
                }
            },
            {
                icon: 'person_add',
                label: 'Add to User Library',
                action: () => {
                    this.addToLibrary(index, 'user');
                    this.closeCardMenu();
                }
            },
            {
                icon: 'group_add',
                label: 'Add to Group Library',
                action: () => {
                    this.addToLibrary(index, 'group');
                    this.closeCardMenu();
                }
            },
            {
                icon: 'delete',
                label: 'Delete',
                action: () => {
                    this.deleteActivity(index);
                    this.closeCardMenu();
                },
                className: 'card-menu__option--danger'
            }
        ];
        
        // Build menu HTML
        menu.innerHTML = menuOptions.map(option => `
            <div class="card-menu__option ${option.className || ''}">
                <span class="material-icons">${option.icon}</span>
                <span>${option.label}</span>
            </div>
        `).join('');
        
        // Add click handlers
        menuOptions.forEach((option, i) => {
            menu.children[i].addEventListener('click', (e) => {
                e.stopPropagation();
                option.action();
            });
        });
        
        // Position menu
        document.body.appendChild(menu);
        
        // Calculate position (show above button if near bottom)
        const menuHeight = menu.offsetHeight;
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - rect.bottom;
        
        if (spaceBelow < menuHeight + 10) {
            // Position above
            menu.style.bottom = (windowHeight - rect.top + 5) + 'px';
            menu.style.top = 'auto';
        } else {
            // Position below
            menu.style.top = (rect.bottom + 5) + 'px';
            menu.style.bottom = 'auto';
        }
        
        // Horizontal position (align to right edge of button)
        menu.style.right = (window.innerWidth - rect.right) + 'px';
        menu.style.left = 'auto';
        
        // Show menu with animation
        requestAnimationFrame(() => {
            menu.classList.add('card-menu--open');
        });
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'card-menu-backdrop';
        backdrop.addEventListener('click', () => this.closeCardMenu());
        document.body.appendChild(backdrop);
        
        // Close on escape key
        this.cardMenuEscapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeCardMenu();
            }
        };
        document.addEventListener('keydown', this.cardMenuEscapeHandler);
    }
    
    closeCardMenu() {
        const menu = document.querySelector('.card-menu');
        const backdrop = document.querySelector('.card-menu-backdrop');
        
        if (menu) {
            menu.classList.remove('card-menu--open');
            setTimeout(() => menu.remove(), 200);
        }
        
        if (backdrop) {
            backdrop.remove();
        }
        
        if (this.cardMenuEscapeHandler) {
            document.removeEventListener('keydown', this.cardMenuEscapeHandler);
            this.cardMenuEscapeHandler = null;
        }
    }
    
    // CARD LIBRARY
    addToLibrary(index, libraryType) {
        const activity = this.appState.activities[index];
        if (!activity) return;
        
        // Create a clean copy of the activity without user-specific data
        const libraryCard = {
            title: activity.title,
            description: activity.description,
            icon: activity.icon,
            cardType: activity.cardType || 'recurring',
            time: activity.time || ''
        };
        
        // Add to the appropriate library
        const success = this.appState.addToLibrary(libraryCard, libraryType);
        
        if (success) {
            // Show confirmation
            const message = libraryType === 'user' 
                ? 'Added to your personal library' 
                : 'Added to group library';
            this.showNotification(message, 'success');
        } else {
            this.showNotification('Failed to add to library', 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('notification--show');
        });
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('notification--show');
            setTimeout(() => notification.remove(), 300);
        }, 2500);
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
        // 
        
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
        // 
        document.querySelectorAll('.management-card').forEach(card => {
            const isActiveCard = card.classList.contains(`management-card--${activePosition}`);
        // 
            if (!isActiveCard) {
                card.style.display = 'none';
            }
        });
    }

    showAllManagementCards() {
        // 
        document.querySelectorAll('.management-card').forEach(card => {
            card.style.display = '';
        });
    }

    // Story 4: COMPLETE DAY FUNCTIONALITY
    showCompleteDayConfirmation() {
        const user = this.appState.getCurrentUser();
        
        // Check if there are any activities to process
        if (!user.activities || user.activities.length === 0) {
            this.showSuccessToast('No cards to process. Add some cards first!');
            return;
        }
        
        // Count pinned cards
        const pinnedCount = user.activities.filter(a => a.keep === true).length;
        const tomorrowCount = user.tomorrowActivities ? user.tomorrowActivities.length : 0;
        
        if (confirm(`Complete today and move to tomorrow?\n\nThis will:\n• Move tomorrow's ${tomorrowCount} cards to today\n• Keep ${pinnedCount} pinned cards for tomorrow\n• Discard ${user.activities.length - pinnedCount} unpinned cards`)) {
            
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
        
        // Deep clone tomorrow activities to today to avoid shared references
        user.activities = this.appState.deepCloneActivities(user.tomorrowActivities);
        
        // Process today's activities for new tomorrow
        const newTomorrow = [];
        todayActivities.forEach((activity, index) => {
            // Keep cards that have the keep flag set to true
            if (activity.keep === true) {
                // Deep clone the activity to avoid shared references
                const tomorrowActivity = this.appState.deepCloneActivity(activity);
                tomorrowActivity.completed = false;
                tomorrowActivity.keep = false; // Reset keep flag for next day
                tomorrowActivity.cardNumber = newTomorrow.length + 1; // Assign new card numbers
                newTomorrow.push(tomorrowActivity);
            }
            // Cards without keep flag are discarded
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
    
    // Process cards for new day - handles keep/discard logic
    processCardsForNewDay() {
        const keptCards = [];
        let discardedCount = 0;
        
        // Get current user and current day's activities
        const user = this.appState.getCurrentUser();
        const currentActivities = this.appState.getCurrentDay() === 'today' 
            ? user.activities 
            : user.tomorrowActivities;
        
        currentActivities.forEach((activity, index) => {
            if (activity.keep === true) {
                // Keep the card and reset for next day - use deep clone
                const keptCard = this.appState.deepCloneActivity(activity);
                keptCard.completed = false;
                keptCard.keep = false;
                keptCard.cardNumber = keptCards.length + 1;
                keptCards.push(keptCard);
            } else {
                // Discard the card
                discardedCount++;
            }
        });
        
        // Update the correct day's activities with kept cards
        if (this.appState.getCurrentDay() === 'today') {
            user.activities = keptCards;
            this.appState.activities = keptCards; // Update legacy array
        } else {
            user.tomorrowActivities = keptCards;
            this.appState.activities = keptCards; // Update legacy array
        }
        
        // Trigger save
        this.appState._triggerSave();
        
        return { keptCount: keptCards.length, discardedCount };
    }

    // New method for the sorting wave animation
    showSortingWaveAnimation(counts) {
        const { keptCount, discardedCount } = counts;
        
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
            this.showDayResetSuccess(keptCount, discardedCount);
        }, totalAnimationTime);
    }

    // New method for the success feedback
    showDayResetSuccess(keptCount, discardedCount) {
        let message = '✨ Day reset! Ready for new routine.';
        let details = [];
        
        if (keptCount > 0) {
            details.push(`${keptCount} card${keptCount > 1 ? 's' : ''} kept`);
        }
        if (discardedCount > 0) {
            details.push(`${discardedCount} card${discardedCount > 1 ? 's' : ''} discarded`);
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
            this.showToast('Please enter a title', 'warning');
            return;
        }
        
        // Story 1: Card type is handled in the modal component
        this.appState.updateActivity(index, { title, description, time });
        this.appState.ui.editingCardIndex = -1;
        ComponentBuilder.closeModalCard();
        this.render();
    }

    // USER MANAGEMENT
    addNewUser() {
        try {
            // Get name from user
            const userName = prompt('Enter new user name:');
            if (!userName || userName.trim() === '') {
                return; // User cancelled or entered empty name
            }
            
            // Sanitize user name
            const sanitizedName = SecurityUtils.sanitizeUserInput(userName.trim(), CONFIG.USER_NAME_MAX_LENGTH);
            
            // Get emoji icon (optional)
            const userIcon = prompt('Enter an emoji for the user (or leave blank for default):', '👤') || '👤';
            const sanitizedIcon = SecurityUtils.sanitizeUserInput(userIcon, 2); // Emojis can be up to 2 chars
            
            // Add the user through AppState
            const newUserId = this.appState.addUser(sanitizedName, sanitizedIcon);
            
            // Switch to the new user
            this.appState.switchUser(newUserId);
            
            // Default activities are now loaded from Card Library, not automatically
            // if (this.appState.activities.length === 0) {
            //     this.createDefaultActivities();
            // }
            
            // Update UI
            this.populateUserDropdowns();
            
            // Force drawer to refresh if it's open
            const drawerExtension = document.getElementById('drawerExtension');
            if (drawerExtension && drawerExtension.classList.contains('open')) {
                this.populateDrawerSelects();
            }
            
            // Also populate drawer selects after a short delay to ensure DOM is ready
            setTimeout(() => {
                this.populateDrawerSelects();
                
                // Force drawer open if we now have multiple users
                const allUsers = this.appState.getAllUsers();
                if (allUsers.length > 1) {
                    const drawerHandle = document.getElementById('drawerHandle');
                    const drawerExtension = document.getElementById('drawerExtension');
                    if (drawerHandle && drawerExtension && !drawerExtension.classList.contains('open')) {
        // 
                        drawerHandle.click();
                    }
                }
            }, 100);
            
            this.render();
            
        // .length);
            
        } catch (error) {
            this.showToast(error.message, 'error');
            console.error('Error adding user:', error);
        }
    }

    // DATA MANAGEMENT
    exportData() {
        // Export full application data
        this.exportToFile();
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
    
    // Story 3: Export individual user
    exportUser(userId) {
        const user = this.appState.users.profiles[userId];
        if (!user) {
            this.showToast('User not found', 'error');
            return;
        }
        
        const exportData = {
            version: CONFIG.DATA_VERSION,
            exportType: 'single-user',
            exportDate: new Date().toISOString(),
            user: {
                id: userId,
                name: user.name,
                icon: user.icon || '👤',  // Include user icon
                activities: user.activities,
                tomorrowActivities: user.tomorrowActivities || [],  // Include tomorrow activities
                settings: user.settings,
                customTitle: user.customTitle,  // Include custom title
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
            this.showToast('Please select a user to export', 'warning');
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
                // console.log('Import file loaded:', {
                //     version: data.version,
                //     hasActivities: !!data.activities,
                //     hasUsers: !!data.users,
                //     hasSettings: !!data.settings,
                //     exportType: data.exportType
                // });
                this.showImportPreview(data);
            } catch (error) {
                console.error('[StackMapApp] Error parsing import file:', error);
                this.showToast('Error importing file. Please ensure it\'s a valid StackMap JSON file.', 'error');
            }
        };
        reader.onerror = (error) => {
            console.error('[StackMapApp] Error reading file:', error);
            this.showToast('Error reading file. Please try again.', 'error');
        };
        reader.readAsText(file);
        
        event.target.value = '';
    }
    
    // Story 3: Show import preview before applying
    showImportPreview(fileData) {
        
        try {
            // Analyze import file
            const analysis = this.analyzeImportFile(fileData);
            this.pendingImportData = { analysis, fileData };
            
            // Use hybrid panel manager to show import preview
            if (window.hybridPanelManager) {
                window.hybridPanelManager.showImportPreview(analysis, fileData);
            } else {
                console.error('[StackMapApp] HybridPanelManager not available');
                this.showToast('Import preview not available. The file will be imported directly.', 'info');
                // Fallback to direct import
                this.appState.importData(fileData);
                this.updateTabTitle();
                this.populateUserDropdowns();
                this.render();
            }
            
        } catch (error) {
            console.error('[StackMapApp] Error showing import preview:', error);
            this.showToast('Error preparing import preview: ' + error.message, 'error');
            this.cancelImport();
        }
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
            // Legacy single-user format (v1.0)
            const userName = data.settings?.title || 'My StackMap';
            users = [{
                id: 'imported-' + Date.now(),
                name: userName,
                icon: '👤', // Default icon for legacy imports
                activities: data.activities,
                tomorrowActivities: [], // Initialize for Story 4
                settings: data.settings || {
                    title: userName,
                    subtitle: 'Routine Ready',
                    isDefaultTitle: true,
                    backgroundColor: '#667eea',
                    showCompletionIndicators: true
                },
                metadata: {
                    activityCount: data.activities?.length || 0,
                    lastModified: new Date().toISOString()
                }
            }];
            type = 'Single User (Legacy v' + (data.version || '1.0') + ')';
        } else {
            console.error('[StackMapApp] Unrecognized file format:', data);
            throw new Error('Unrecognized file format');
        }
        
        // Detect name conflicts
        const conflicts = users
            .filter(user => existingNames.includes(user.name.toLowerCase()))
            .map(user => `"${user.name}" already exists`);
        
        // console.log('Import analysis:', {
        //     type,
        //     userCount: users.length,
        //     conflicts: conflicts.length
        // });
        
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
        
        // Get selected user IDs from hybrid panel manager
        let selectedUserIds;
        if (window.hybridPanelManager && window.hybridPanelManager.state.importPreviewData) {
            selectedUserIds = window.hybridPanelManager.state.importPreviewData.selectedUserIds;
        } else {
            // Fallback: try to get from DOM (shouldn't happen)
            const selectedCheckboxes = document.querySelectorAll('.import-checkbox:checked');
            selectedUserIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        }
        
        if (!selectedUserIds || selectedUserIds.length === 0) {
            this.showToast('Please select at least one user to import', 'warning');
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
            this.showToast(message, 'info');
            
            // Clean up
            this.pendingImportData = null;
            this.currentImportFileName = null;
            
            // Close the import panel
            if (window.hybridPanelManager) {
                window.hybridPanelManager.backToManagement();
                window.hybridPanelManager.closeAllPanels();
            }
        } catch (error) {
            this.showToast('Error during import: ' + error.message, 'error');
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
        
        // Ensure all required fields are properly initialized
        const userProfile = {
            id: newUserId,
            name: userName,
            icon: userData.icon || '👤', // Default icon for imports
            activities: userData.activities || [],
            tomorrowActivities: userData.tomorrowActivities || [], // Story 4 support
            settings: userData.settings || {
                ...this.appState.settings,
                title: userName,
                subtitle: userData.settings?.subtitle || 'Routine Ready',
                backgroundColor: userData.settings?.backgroundColor || '#667eea',
                showCompletionIndicators: userData.settings?.showCompletionIndicators !== false
            },
            customTitle: userData.customTitle || null, // Import custom title
            library: userData.library || [] // Import user library
        };
        
        // Update the user's data
        this.appState.users.profiles[newUserId] = userProfile;
        
        // Add the new name to existing names to prevent duplicates within this import
        existingNames.push(userName.toLowerCase());
        
        this.appState._triggerSave();
    }
    
    // Story 3: Cancel import
    cancelImport() {
        this.pendingImportData = null;
        this.currentImportFileName = null;
        // Hybrid panel handles closing itself
    }

    // CARD MANAGEMENT
    showNewCardForm(position = 'bottom') {
        // Use the new panel-based form instead of modal
        // Open management panel and show activity form
        window.hybridPanelManager.openPanel('right');
        window.hybridPanelManager.addNewCard();
    }
    
    // User creation is now handled by HybridPanelManager
    
    completeAllActivities() {
        const activities = this.appState.getCurrentActivities();
        const incompleteCount = activities.filter(activity => !activity.completed).length;
        
        if (incompleteCount === 0) {
            this.showToast('All activities are already completed! 🎉', 'success');
            return;
        }
        
        const confirmMessage = `Complete day and reset for tomorrow? This will:\n• Keep recurring cards\n• Hide frequent cards\n• Remove single-use cards`;
        if (confirm(confirmMessage)) {
            // First mark all as complete
            activities.forEach(activity => {
                if (!activity.completed) {
                    activity.completed = true;
                    activity.completedAt = new Date().toISOString();
                }
            });
            
            // Process cards for new day (handles card types and sorting)
            const counts = this.processCardsForNewDay();
            
            // Save state
            this.appState._triggerSave();
            
            // Re-render
            this.render();
            
            // Show sorting wave animation and success message
            setTimeout(() => {
                this.showSortingWaveAnimation(counts);
            }, 250);
            
            // Show celebration
            if (window.celebrationManager) {
                window.celebrationManager.triggerRoutineCompletion();
            }
            
        // 
        }
    }
    
    // LOCAL STORAGE
    saveToLocalStorage() {
        const data = this.appState.exportData();
        try {
            // Check if we're in demo mode and use appropriate key
            const isDemo = localStorage.getItem('stackMapDemoMode') === 'true';
            const dataKey = isDemo ? 'stackMapData-demo' : 'stackMapData';
            localStorage.setItem(dataKey, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            // Check if we're in demo mode and use appropriate key
            const isDemo = localStorage.getItem('stackMapDemoMode') === 'true';
            const dataKey = isDemo ? 'stackMapData-demo' : 'stackMapData';
            const saved = localStorage.getItem(dataKey);
            
            if (saved) {
                const data = JSON.parse(saved);
                this.appState.importData(data);
                return true;
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
            const isDemo = localStorage.getItem('stackMapDemoMode') === 'true';
            const dataKey = isDemo ? 'stackMapData-demo' : 'stackMapData';
            localStorage.removeItem(dataKey);
        }
        return false;
    }
    
    // ===== DRAWER PREFERENCE MANAGEMENT =====
    
    getDrawerPreference() {
        try {
            const pref = localStorage.getItem(this.getStorageKey('stackmap-drawer-preference'));
            return pref ? JSON.parse(pref) : { drawerOpen: true }; // Default open for discoverability
        } catch (error) {
            console.error('Error reading drawer preference:', error);
            return { drawerOpen: true }; // Default to open
        }
    }
    
    setDrawerPreference(isOpen) {
        try {
            localStorage.setItem(this.getStorageKey('stackmap-drawer-preference'), JSON.stringify({
                drawerOpen: isOpen
            }));
        // 
        } catch (error) {
            console.error('Error saving drawer preference:', error);
        }
    }
    
    shouldDrawerBeOpen() {
        const isEditMode = this.grownupMode;
        const userPref = this.getDrawerPreference();
        // 
        return isEditMode || userPref.drawerOpen;
    }
    
    forceDrawerOpen() {
        // Find drawer elements
        const drawerExtension = document.getElementById('drawerExtension');
        const drawerHandle = document.getElementById('drawerHandle');
        
        // Check if already open
        if (!drawerExtension?.classList.contains('open')) {
            // Trigger drawer open without saving preference
            const openEvent = new CustomEvent('forceDrawerOpen');
            drawerHandle?.dispatchEvent(openEvent);
        }
        
        // Add visual locked state
        drawerExtension?.classList.add('edit-mode-locked');
        drawerHandle?.classList.add('edit-mode-locked');
        // 
    }
    
    unlockDrawer() {
        const drawerExtension = document.getElementById('drawerExtension');
        const drawerHandle = document.getElementById('drawerHandle');
        
        drawerExtension?.classList.remove('edit-mode-locked');
        drawerHandle?.classList.remove('edit-mode-locked');
        // 
    }
    
    // CRITICAL UX FIX: Universal modal outside-click behavior
    initializeModalBehavior() {
        // Set up outside-click handlers for all modals
        this.setupModalOutsideClickHandlers();
        
        // Set up escape key handler for all modals
        this.setupModalEscapeKeyHandler();
        
        // 
    }
    
    setupModalOutsideClickHandlers() {
        // Define all modal selectors and their close methods
        const modalConfigs = [
            // ValidationModal removed - validation now handled by HybridPanelManager
            // PreferencesPanel disabled - preferences now handled by HybridPanelManager
            // {
            //     selector: '#preferencesPanel',
            //     closeMethod: () => this.preferencesManager?.closePreferences?.(),
            //     contentSelector: '.preferences-content'
            // },
            {
                selector: '#welcomeSplash',
                closeMethod: () => this.hideWelcome?.(),
                contentSelector: '.welcome-content'
            },
            {
                selector: '#importPreviewModal',
                closeMethod: () => {
                    const modal = document.getElementById('importPreviewModal');
                    modal?.classList?.add('hidden');
                },
                contentSelector: '.modal-content'
            },
            {
                selector: '.mobile-picker-modal',
                closeMethod: () => {
                    const modal = document.querySelector('.mobile-picker-modal');
                    if (modal) {
                        modal.classList.remove('mobile-picker-modal--visible');
                        setTimeout(() => modal.remove(), 300);
                    }
                },
                contentSelector: '.mobile-picker-content'
            },
            {
                selector: '.dropdown-modal',
                closeMethod: () => {
                    const modal = document.querySelector('.dropdown-modal');
                    modal?.classList?.add('hidden');
                },
                contentSelector: '.dropdown-modal-content'
            }
        ];
        
        // Add click handlers for each modal
        modalConfigs.forEach(config => {
            // Use event delegation to handle dynamically created modals
            document.addEventListener('click', (e) => {
                const modal = e.target.closest(config.selector);
                if (!modal) return;
                
                // Check if modal is currently visible
                const isVisible = !modal.classList.contains('hidden') && 
                                modal.style.display !== 'none' &&
                                getComputedStyle(modal).display !== 'none';
                
                if (!isVisible) return;
                
                // Check if click was outside the modal content
                const content = modal.querySelector(config.contentSelector);
                if (content && !content.contains(e.target)) {
                    // Click was on backdrop/overlay area - close modal
                    if (config.closeMethod) {
                        config.closeMethod();
                    }
                }
            });
        });
        
        // 
    }
    
    setupModalEscapeKeyHandler() {
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            
            // Find currently visible modal and close it
            const modalSelectors = [
                '#validationModal',
                '#preferencesPanel', 
                '#welcomeSplash',
                '#importPreviewModal',
                '.mobile-picker-modal',
                '.dropdown-modal'
            ];
            
            for (const selector of modalSelectors) {
                const modal = document.querySelector(selector);
                if (!modal) continue;
                
                const isVisible = !modal.classList.contains('hidden') && 
                                modal.style.display !== 'none' &&
                                getComputedStyle(modal).display !== 'none';
                
                if (isVisible) {
                    // Close the first visible modal found
                    // ValidationModal and PreferencesPanel removed - now handled by HybridPanelManager
                    if (selector === '#welcomeSplash') {
                        this.hideWelcome?.();
                    } else if (selector === '#importPreviewModal') {
                        modal.classList.add('hidden');
                    } else if (selector === '.mobile-picker-modal') {
                        modal.classList.remove('mobile-picker-modal--visible');
                        setTimeout(() => modal.remove(), 300);
                    } else if (selector === '.dropdown-modal') {
                        modal.classList.add('hidden');
                    }
                    
                    // Prevent default and stop propagation
                    e.preventDefault();
                    e.stopPropagation();
                    break; // Only close one modal at a time
                }
            }
        });
        
        // 
    }

    /**
     * Initialize celebration system
     */
    initializeCelebrationSystem() {
        // Load the celebration manager
        if (typeof CelebrationManager !== 'undefined') {
            window.celebrationManager = new CelebrationManager(this);
        // 
        } else {
            console.warn('CelebrationManager not loaded - celebrations disabled');
        }
    }
    
    /**
     * Initialize keyboard shortcuts for the application
     */
    initializeKeyboardShortcuts() {
        // Add keyboard shortcut for toggling edit mode
        document.addEventListener('keydown', (e) => {
            // Check for Ctrl+E (Windows/Linux) or Cmd+E (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault(); // Prevent default browser behavior
                
                // Don't toggle if user is typing in an input field
                const activeElement = document.activeElement;
                const isTyping = activeElement && (
                    activeElement.tagName === 'INPUT' || 
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.contentEditable === 'true'
                );
                
                if (!isTyping) {
                    // Toggle edit mode
                    if (this.grownupMode) {
                        this.exitGrownupMode();
                    } else {
                        this.enterGrownupMode();
                    }
                }
            }
        });
    }
}

