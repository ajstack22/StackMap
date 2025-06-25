/**
 * Keyboard Navigation Module for StackMap
 * Implements roving tabindex pattern for accessible list navigation
 * 
 * @module KeyboardNav
 */

(function() {
    'use strict';
    
    const KeyboardNav = {
        // Configuration - optimized for ADHD users
        NAVIGATION_DEBOUNCE: 16,  // ms - one frame for instant response
        ACTION_DEBOUNCE: 50,      // ms - reduced from 100ms for better feel
        
        // State
        currentFocus: -1,
        focusableElements: [],
        container: null,
        debounceTimer: null,
        isInitialized: false,
        
        // Keyboard shortcuts - removed two-key combos per PM review
        shortcuts: {
            'T': 'addNewTask',        // Changed from 'n' to 'T'
            'e': 'editCurrentTask',
            'D': 'markTaskDone',      // Changed from delete to mark done (safer)
            't': 'setTimerForCurrentTask',
            '/': 'focusSearch',
            '?': 'showHelp',
            'F': 'toggleFocusMode',   // New: focus mode
            ' ': 'toggleCheckbox'     // New: space for checkbox
        },
        
        // Undo system for ADHD users
        undoStack: [],
        MAX_UNDO: 5,
        
        // Focus preservation for virtual scrolling
        preservedFocusId: null,
        
        // Mobile keyboard detection
        virtualKeyboardActive: false,
        lastWindowHeight: 0,
        
        // Shortcut conflict tracking
        conflictingShortcuts: {},
        
        // Emergency escape tracking
        escapeCount: 0,
        escapeTimer: null,
        shortcutsDisabled: false,
        
        /**
         * Initialize keyboard navigation
         */
        init: function() {
            if (this.isInitialized) return;
            
            this.container = document.getElementById('task-container');
            if (!this.container) {
                console.warn('KeyboardNav: task-container not found');
                return;
            }
            
            this.detectShortcutConflicts();
            this.addSkipLinks();
            this.updateFocusableElements();
            this.setupEventListeners();
            this.initializeTabindex();
            this.setupAriaAttributes();
            this.setupMobileKeyboardDetection();
            this.addVisualShortcutHints();
            
            this.isInitialized = true;
            console.log(`KeyboardNav: Initialized with ${this.focusableElements.length} focusable elements`);
        },
        
        /**
         * Update the list of focusable elements
         */
        updateFocusableElements: function() {
            // Find all task cards that can receive focus
            const cards = this.container.querySelectorAll('.task-card:not(.task-placeholder)');
            this.focusableElements = [...cards];
            
            // Reset focus if current element no longer exists
            if (this.currentFocus >= this.focusableElements.length) {
                this.currentFocus = this.focusableElements.length - 1;
            }
        },
        
        /**
         * Initialize tabindex on elements
         */
        initializeTabindex: function() {
            const self = this;
            
            this.focusableElements.forEach(function(element, index) {
                // Only the first element or currently focused element should be in tab order
                if (index === 0 || index === self.currentFocus) {
                    element.setAttribute('tabindex', '0');
                } else {
                    element.setAttribute('tabindex', '-1');
                }
            });
        },
        
        /**
         * Setup ARIA attributes for screen readers
         */
        setupAriaAttributes: function() {
            // Container attributes
            this.container.setAttribute('role', 'listbox');
            this.container.setAttribute('aria-label', 'Activity list');
            
            // Task card attributes
            const self = this;
            this.focusableElements.forEach(function(element, index) {
                element.setAttribute('role', 'option');
                element.setAttribute('aria-posinset', index + 1);
                element.setAttribute('aria-setsize', self.focusableElements.length);
                element.setAttribute('aria-selected', 'false');
            });
        },
        
        /**
         * Add skip links for quick navigation
         */
        addSkipLinks: function() {
            // Check if skip links already exist
            if (document.querySelector('.skip-links')) {
                return;
            }
            
            const skipNav = document.createElement('nav');
            skipNav.className = 'skip-links';
            skipNav.setAttribute('aria-label', 'Skip links');
            
            const links = [
                { href: '#main', text: 'Skip to main content' },
                { href: '#task-container', text: 'Skip to tasks' },
                { href: '#add-activity', text: 'Skip to add activity' },
                { href: '#settings', text: 'Skip to settings' }
            ];
            
            links.forEach(function(link) {
                const a = document.createElement('a');
                a.href = link.href;
                a.className = 'skip-link';
                a.textContent = link.text;
                
                // Add keyboard event handling for skip links
                a.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Sanitize the selector to prevent XSS
                    const targetId = link.href.replace(/[^\w\-#]/g, '');
                    if (!targetId.startsWith('#')) {
                        console.warn('Invalid skip link target:', link.href);
                        return;
                    }
                    
                    try {
                        const target = document.querySelector(targetId);
                        if (target) {
                            target.setAttribute('tabindex', '-1');
                            target.focus();
                            target.removeAttribute('tabindex');
                        }
                    } catch (err) {
                        console.error('Invalid selector in skip link:', err);
                    }
                });
                
                skipNav.appendChild(a);
            });
            
            // Insert at the beginning of body
            document.body.insertBefore(skipNav, document.body.firstChild);
        },
        
        /**
         * Setup event listeners using event delegation
         */
        setupEventListeners: function() {
            const self = this;
            
            // Create bound functions for cleanup
            this._handleKeyDown = function(e) {
                self.handleKeyDown(e);
            };
            
            this._handleGlobalKeyDown = function(e) {
                // Skip if user is typing in an input field
                const tagName = e.target.tagName.toLowerCase();
                if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
                    return;
                }
                
                // Handle Ctrl+Z for undo
                if (e.ctrlKey && e.key === 'z') {
                    self.handleUndo(e);
                    return;
                }
                
                // Skip other modifier combinations (except shift for ?)
                if (e.ctrlKey || e.altKey || e.metaKey) {
                    return;
                }
                
                // Handle escape key
                if (e.key === 'Escape') {
                    // First check if we're in focus mode
                    if (document.body.classList.contains('focus-mode')) {
                        e.preventDefault();
                        self.toggleFocusMode();
                        return;
                    }
                    // Otherwise handle emergency escape (3x ESC)
                    self.handleEmergencyEscape();
                }
                
                // Skip if shortcuts are disabled
                if (self.shortcutsDisabled) {
                    return;
                }
                
                self.handleGlobalShortcut(e);
            };
            
            this._handleFocusIn = function(e) {
                self.handleFocusIn(e);
            };
            
            this._handleClick = function(e) {
                const card = e.target.closest('.task-card');
                if (card && self.focusableElements.includes(card)) {
                    self.setFocus(self.focusableElements.indexOf(card));
                }
            };
            
            this._handleTasksUpdated = function() {
                self.refresh();
            };
            
            // Add event listeners
            this.container.addEventListener('keydown', this._handleKeyDown);
            document.addEventListener('keydown', this._handleGlobalKeyDown);
            this.container.addEventListener('focusin', this._handleFocusIn);
            this.container.addEventListener('click', this._handleClick);
            document.addEventListener('tasksUpdated', this._handleTasksUpdated);
        },
        
        /**
         * Handle keydown events with debouncing
         */
        handleKeyDown: function(e) {
            const self = this;
            
            // Clear existing timer
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            
            // Keys that should work immediately (no debounce)
            const immediateKeys = ['Tab', 'Escape'];
            if (immediateKeys.includes(e.key)) {
                return; // Let default behavior handle these
            }
            
            // Navigation keys get faster debounce
            const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'j', 'k', 'h', 'l'];
            const isNavigationKey = navigationKeys.includes(e.key);
            const debounceTime = isNavigationKey ? this.NAVIGATION_DEBOUNCE : this.ACTION_DEBOUNCE;
            
            // Debounce with appropriate timing
            this.debounceTimer = setTimeout(function() {
                self.processKeyPress(e);
            }, debounceTime);
        },
        
        /**
         * Process keyboard input
         */
        processKeyPress: function(e) {
            let handled = false;
            
            switch(e.key) {
                case 'ArrowDown':
                case 'j': // Vim-style navigation
                    this.focusNext();
                    handled = true;
                    break;
                    
                case 'ArrowUp':
                case 'k': // Vim-style navigation
                    this.focusPrevious();
                    handled = true;
                    break;
                    
                case 'Home':
                    this.focusFirst();
                    handled = true;
                    break;
                    
                case 'End':
                    this.focusLast();
                    handled = true;
                    break;
                    
                case 'Enter':
                case ' ': // Space
                    this.activateCurrent();
                    handled = true;
                    break;
            }
            
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        
        /**
         * Handle focus entering the container
         */
        handleFocusIn: function(e) {
            const card = e.target.closest('.task-card');
            if (card && this.focusableElements.includes(card)) {
                this.currentFocus = this.focusableElements.indexOf(card);
                this.updateRovingTabindex();
                this.updateAriaSelected();
            }
        },
        
        /**
         * Move focus to next element
         */
        focusNext: function() {
            if (this.focusableElements.length === 0) return;
            
            this.currentFocus = (this.currentFocus + 1) % this.focusableElements.length;
            this.setFocus(this.currentFocus);
        },
        
        /**
         * Move focus to previous element
         */
        focusPrevious: function() {
            if (this.focusableElements.length === 0) return;
            
            this.currentFocus = this.currentFocus - 1;
            if (this.currentFocus < 0) {
                this.currentFocus = this.focusableElements.length - 1;
            }
            this.setFocus(this.currentFocus);
        },
        
        /**
         * Move focus to first element
         */
        focusFirst: function() {
            if (this.focusableElements.length === 0) return;
            this.setFocus(0);
        },
        
        /**
         * Move focus to last element
         */
        focusLast: function() {
            if (this.focusableElements.length === 0) return;
            this.setFocus(this.focusableElements.length - 1);
        },
        
        /**
         * Set focus to specific index
         */
        setFocus: function(index) {
            if (index < 0 || index >= this.focusableElements.length) return;
            
            this.currentFocus = index;
            this.updateRovingTabindex();
            this.updateAriaSelected();
            
            // Focus the element
            const element = this.focusableElements[index];
            if (element) {
                element.focus();
                
                // Ensure element is visible (scroll into view if needed)
                if (element.scrollIntoViewIfNeeded) {
                    element.scrollIntoViewIfNeeded(false); // false = smooth scroll
                } else {
                    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        },
        
        /**
         * Update roving tabindex pattern
         */
        updateRovingTabindex: function() {
            const self = this;
            
            this.focusableElements.forEach(function(element, index) {
                if (index === self.currentFocus) {
                    element.setAttribute('tabindex', '0');
                } else {
                    element.setAttribute('tabindex', '-1');
                }
            });
        },
        
        /**
         * Update ARIA selected state
         */
        updateAriaSelected: function() {
            const self = this;
            
            this.focusableElements.forEach(function(element, index) {
                const isSelected = index === self.currentFocus;
                element.setAttribute('aria-selected', isSelected ? 'true' : 'false');
                
                // Announce position for selected item
                if (isSelected) {
                    self.announcePosition(index + 1, self.focusableElements.length);
                }
            });
        },
        
        /**
         * Announce position to screen readers
         */
        announcePosition: function(current, total) {
            const announcement = `Task ${current} of ${total}`;
            this.announce(announcement);
        },
        
        /**
         * Create or get ARIA live region for announcements
         */
        getAnnouncementRegion: function() {
            let announcer = document.getElementById('keyboard-nav-announcer');
            if (!announcer) {
                announcer = document.createElement('div');
                announcer.id = 'keyboard-nav-announcer';
                announcer.className = 'sr-only';
                announcer.setAttribute('aria-live', 'polite');
                announcer.setAttribute('aria-atomic', 'true');
                announcer.setAttribute('role', 'status');
                document.body.appendChild(announcer);
            }
            return announcer;
        },
        
        /**
         * Announce message to screen readers
         */
        announce: function(message) {
            const announcer = this.getAnnouncementRegion();
            
            // Clear and set new message
            announcer.textContent = '';
            
            // Use setTimeout to ensure screen readers pick up the change
            setTimeout(function() {
                announcer.textContent = message;
            }, 100);
            
            // Clear after announcement
            setTimeout(function() {
                announcer.textContent = '';
            }, 1000);
        },
        
        /**
         * Activate the currently focused element
         */
        activateCurrent: function() {
            if (this.currentFocus < 0 || this.currentFocus >= this.focusableElements.length) {
                return;
            }
            
            const element = this.focusableElements[this.currentFocus];
            if (element) {
                // Get task title for announcement
                const taskTitle = element.querySelector('h3, .task-title');
                const activityName = activityTitle ? activityTitle.textContent : 'Activity';
                
                // Find and click the first interactive element (button, link, etc.)
                const interactive = element.querySelector('button, a, input, [role="button"]');
                if (interactive) {
                    interactive.click();
                    this.announce(`Activated: ${taskName}`);
                } else {
                    // Fallback: click the card itself
                    element.click();
                    this.announce(`Selected: ${taskName}`);
                }
            }
        },
        
        /**
         * Handle global keyboard shortcuts
         */
        handleGlobalShortcut: function(e) {
            let key = e.key;
            
            // Handle shift+? for help
            if (key === '?' && e.shiftKey) {
                key = '?';
            }
            
            // Check for conflicting shortcuts
            if (this.conflictingShortcuts[key]) {
                console.warn('Shortcut conflict detected:', key, this.conflictingShortcuts[key]);
                // Could show user warning here
            }
            
            // Simple single-key shortcuts only (removed combo support)
            if (this.shortcuts[key] || this.shortcuts[key.toUpperCase()]) {
                e.preventDefault();
                this.executeShortcut(this.shortcuts[key] || this.shortcuts[key.toUpperCase()]);
            }
        },
        
        /**
         * Execute a keyboard shortcut command
         */
        executeShortcut: function(command) {
            console.log('Executing shortcut:', command);
            
            switch(command) {
                case 'addNewTask':
                    this.addNewTask();
                    break;
                case 'editCurrentTask':
                    this.editCurrentTask();
                    break;
                case 'markTaskDone':
                    this.markTaskDone();
                    break;
                case 'setTimerForCurrentTask':
                    this.setTimerForCurrentTask();
                    break;
                case 'focusSearch':
                    this.focusSearch();
                    break;
                case 'showHelp':
                    this.showKeyboardHelp();
                    break;
                case 'toggleFocusMode':
                    this.toggleFocusMode();
                    break;
                case 'toggleCheckbox':
                    this.toggleCheckbox();
                    break;
            }
        },
        
        /**
         * Shortcut: Add new task
         */
        addNewTask: function() {
            const addButton = document.getElementById('add-task-button');
            if (addButton) {
                addButton.click();
                this.announce('Adding new task');
            }
        },
        
        /**
         * Shortcut: Edit current task
         */
        editCurrentTask: function() {
            if (this.currentFocus < 0 || this.currentFocus >= this.focusableElements.length) {
                this.announce('No task selected');
                return;
            }
            
            const element = this.focusableElements[this.currentFocus];
            const editButton = element.querySelector('.edit-button, [aria-label*="Edit"]');
            if (editButton) {
                editButton.click();
                this.announce('Editing task');
            }
        },
        
        /**
         * Shortcut: Delete current task
         */
        deleteCurrentTask: function() {
            if (this.currentFocus < 0 || this.currentFocus >= this.focusableElements.length) {
                this.announce('No task selected');
                return;
            }
            
            // Confirm before deleting
            if (confirm('Are you sure you want to delete this task?')) {
                const element = this.focusableElements[this.currentFocus];
                const deleteButton = element.querySelector('.delete-button, [aria-label*="Delete"]');
                if (deleteButton) {
                    deleteButton.click();
                    this.announce('Task deleted');
                }
            }
        },
        
        /**
         * Shortcut: Set timer for current task
         */
        setTimerForCurrentTask: function() {
            if (this.currentFocus < 0 || this.currentFocus >= this.focusableElements.length) {
                this.announce('No task selected');
                return;
            }
            
            const element = this.focusableElements[this.currentFocus];
            const taskId = element.getAttribute('data-task-id');
            
            if (taskId && window.TaskTimer) {
                const timerButton = element.querySelector('.task-timer-button');
                if (timerButton) {
                    timerButton.click();
                    this.announce('Opening timer menu');
                } else {
                    this.announce('Timer not available for this task');
                }
            }
        },
        
        /**
         * Shortcut: Focus search
         */
        focusSearch: function() {
            const searchInput = document.querySelector('#search-input, [type="search"], [role="searchbox"]');
            if (searchInput) {
                searchInput.focus();
                this.announce('Search focused');
            }
        },
        
        /**
         * Shortcut: Show keyboard help
         */
        showKeyboardHelp: function() {
            this.createHelpOverlay();
        },
        
        /**
         * Navigate to a specific view
         */
        navigateTo: function(viewId) {
            // Use StackMapApp's view controller if available
            if (window.StackMapApp && window.StackMapApp.ViewController) {
                window.StackMapApp.ViewController.show(viewId);
                this.announce(`Navigated to ${viewId.replace('-view', '')}`);
            }
        },
        
        /**
         * Create and show keyboard help overlay
         */
        createHelpOverlay: function() {
            // Check if help already exists
            const existingHelp = document.getElementById('keyboard-help-overlay');
            if (existingHelp) {
                existingHelp.remove();
            }
            
            const overlay = document.createElement('div');
            overlay.id = 'keyboard-help-overlay';
            overlay.className = 'modal-overlay active';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-label', 'Keyboard shortcuts help');
            
            const content = document.createElement('div');
            content.className = 'modal-content keyboard-help';
            
            const header = document.createElement('h2');
            header.textContent = 'Keyboard Shortcuts';
            content.appendChild(header);
            
            const shortcuts = [
                { key: '↓/j', description: 'Next task' },
                { key: '↑/k', description: 'Previous task' },
                { key: 'Home', description: 'First task' },
                { key: 'End', description: 'Last task' },
                { key: 'Enter/Space', description: 'Select/activate task' },
                { key: 'T', description: 'Create new task' },
                { key: 'e', description: 'Edit current task' },
                { key: 'D', description: 'Mark task as done' },
                { key: 't', description: 'Set timer' },
                { key: 'F', description: 'Toggle focus mode' },
                { key: '/', description: 'Search tasks' },
                { key: '?', description: 'Show this help' },
                { key: 'Ctrl+Z', description: 'Undo last action' },
                { key: 'Esc×3', description: 'Disable all shortcuts' },
                { key: 'Tab', description: 'Navigate sections' }
            ];
            
            const list = document.createElement('dl');
            list.className = 'keyboard-shortcuts-list';
            
            shortcuts.forEach(function(shortcut) {
                const dt = document.createElement('dt');
                dt.className = 'shortcut-key';
                dt.textContent = shortcut.key;
                
                const dd = document.createElement('dd');
                dd.className = 'shortcut-description';
                dd.textContent = shortcut.description;
                
                list.appendChild(dt);
                list.appendChild(dd);
            });
            
            content.appendChild(list);
            
            const closeButton = document.createElement('button');
            closeButton.className = 'modal-close';
            closeButton.textContent = 'Close';
            closeButton.onclick = function() {
                overlay.remove();
            };
            content.appendChild(closeButton);
            
            overlay.appendChild(content);
            document.body.appendChild(overlay);
            
            // Focus the close button
            closeButton.focus();
            
            // Close on Escape
            const self = this;
            overlay.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    overlay.remove();
                    self.announce('Help closed');
                }
            });
        },
        
        /**
         * Refresh navigation after content changes
         */
        refresh: function() {
            const previousCount = this.focusableElements.length;
            this.updateFocusableElements();
            
            // Only reinitialize if elements changed
            if (previousCount !== this.focusableElements.length) {
                this.initializeTabindex();
                this.setupAriaAttributes();
                
                // Maintain focus position if possible
                if (this.currentFocus >= this.focusableElements.length) {
                    this.currentFocus = this.focusableElements.length - 1;
                }
                
                if (this.currentFocus >= 0 && document.activeElement === this.container) {
                    this.setFocus(this.currentFocus);
                }
            }
        },
        
        /**
         * Detect potential shortcut conflicts
         */
        detectShortcutConflicts: function() {
            const userAgent = navigator.userAgent.toLowerCase();
            
            // Firefox conflicts
            if (userAgent.includes('firefox')) {
                this.conflictingShortcuts['/'] = 'Firefox Quick Find';
            }
            
            // Browser find-as-you-type
            if (userAgent.includes('chrome') || userAgent.includes('safari')) {
                // T might conflict with find-as-you-type in some configs
                // But we'll use it anyway as it's not a default
            }
            
            // Log detected conflicts
            if (Object.keys(this.conflictingShortcuts).length > 0) {
                console.log('KeyboardNav: Detected potential conflicts:', this.conflictingShortcuts);
            }
        },
        
        /**
         * Add visual shortcut hints to buttons
         */
        addVisualShortcutHints: function() {
            // Add data-shortcut attributes to buttons
            const hints = [
                { selector: '#add-task-button, .task-add-button', shortcut: 'T' },
                { selector: '.task-timer-button', shortcut: 't' },
                { selector: '[aria-label*="Edit"]', shortcut: 'e' },
                { selector: '#search-input', shortcut: '/' }
            ];
            
            hints.forEach(function(hint) {
                const elements = document.querySelectorAll(hint.selector);
                [...elements].forEach(function(el) {
                    el.setAttribute('data-shortcut', hint.shortcut);
                    // Could add tooltip here
                });
            });
        },
        
        /**
         * Setup mobile keyboard detection
         */
        setupMobileKeyboardDetection: function() {
            const self = this;
            this.lastWindowHeight = window.innerHeight;
            
            // Detect virtual keyboard by window resize
            window.addEventListener('resize', function() {
                const currentHeight = window.innerHeight;
                const threshold = 150; // px
                
                // Keyboard likely appeared
                if (self.lastWindowHeight - currentHeight > threshold) {
                    self.virtualKeyboardActive = true;
                    console.log('Virtual keyboard detected');
                }
                // Keyboard likely hidden
                else if (currentHeight - self.lastWindowHeight > threshold) {
                    self.virtualKeyboardActive = false;
                    console.log('Virtual keyboard hidden');
                }
                
                self.lastWindowHeight = currentHeight;
            });
        },
        
        /**
         * Handle emergency escape (3x ESC)
         */
        handleEmergencyEscape: function() {
            const self = this;
            
            this.escapeCount++;
            
            // Clear previous timer
            if (this.escapeTimer) {
                clearTimeout(this.escapeTimer);
            }
            
            // Check for triple escape
            if (this.escapeCount >= 3) {
                this.disableAllShortcuts();
                this.escapeCount = 0;
                return;
            }
            
            // Reset count after 1 second
            this.escapeTimer = setTimeout(function() {
                self.escapeCount = 0;
            }, 1000);
        },
        
        /**
         * Disable all shortcuts (emergency escape)
         */
        disableAllShortcuts: function() {
            this.shortcutsDisabled = true;
            this.announce('Keyboard shortcuts disabled. Refresh page to re-enable.');
            
            // Show visual indicator
            const indicator = document.createElement('div');
            indicator.className = 'shortcuts-disabled-indicator';
            indicator.textContent = 'Keyboard shortcuts disabled';
            indicator.style.cssText = 'position:fixed;top:10px;right:10px;background:#ff0000;color:white;padding:10px;border-radius:5px;z-index:9999';
            document.body.appendChild(indicator);
        },
        
        /**
         * Handle undo (Ctrl+Z)
         */
        handleUndo: function(e) {
            e.preventDefault();
            
            // Check if the new undo system is available
            if (window.UndoManager && window.UndoManager.canUndo()) {
                // Use the new comprehensive undo system
                window.UndoManager.undo();
                return;
            }
            
            // Fallback to simple keyboard nav undo
            if (this.undoStack.length === 0) {
                this.announce('Nothing to undo');
                return;
            }
            
            const lastAction = this.undoStack.pop();
            console.log('Undoing action:', lastAction);
            
            // Execute undo based on action type
            switch(lastAction.type) {
                case 'delete':
                    // Restore the deleted task
                    if (lastAction.data && window.TaskDisplay) {
                        window.TaskDisplay.restoreTaskDirect(lastAction.data);
                        this.announce('Task restored');
                    } else {
                        this.announce('Cannot restore task');
                    }
                    break;
                case 'edit':
                    // Restore previous value
                    if (lastAction.data && window.TaskDisplay) {
                        window.TaskDisplay.updateTaskTextDirect(
                            lastAction.data.taskId, 
                            lastAction.data.oldText
                        );
                        this.announce('Edit undone');
                    } else {
                        this.announce('Cannot undo edit');
                    }
                    break;
                case 'complete':
                    // Toggle completion state back
                    if (lastAction.data && window.TaskDisplay) {
                        window.TaskDisplay.toggleTaskDirect(lastAction.data.taskId);
                        this.announce('Completion undone');
                    } else {
                        this.announce('Cannot undo completion');
                    }
                    break;
                default:
                    this.announce('Unknown action type');
            }
            
            // Refresh the view after undo
            if (window.TaskDisplay) {
                window.TaskDisplay.render();
            }
        },
        
        /**
         * Add action to undo stack
         */
        addToUndoStack: function(action) {
            this.undoStack.push(action);
            
            // Limit stack size
            if (this.undoStack.length > this.MAX_UNDO) {
                this.undoStack.shift();
            }
        },
        
        /**
         * Preserve focus before virtual scroll update
         */
        beforeVirtualUpdate: function() {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.hasAttribute('data-task-id')) {
                this.preservedFocusId = activeElement.getAttribute('data-task-id');
                // Also store scroll position
                this.preservedScrollTop = this.container ? this.container.scrollTop : 0;
                // Store the relative position of the element
                const rect = activeElement.getBoundingClientRect();
                this.preservedRelativeTop = rect.top;
            }
        },
        
        /**
         * Restore focus after virtual scroll update
         */
        afterVirtualUpdate: function() {
            const self = this;
            
            if (!this.preservedFocusId) return;
            
            // Use requestAnimationFrame for better timing
            requestAnimationFrame(function() {
                // Update focusable elements first
                self.updateFocusableElements();
                
                // Sanitize the task ID to prevent injection
                const safeId = self.preservedFocusId.replace(/[^\w\-]/g, '');
                
                try {
                    const element = document.querySelector(`[data-task-id="${safeId}"]`);
                    if (element) {
                        // Find index in new focusable elements
                        const index = [...self.focusableElements].indexOf(element);
                        if (index !== -1) {
                            // Set focus without scrolling
                            element.setAttribute('tabindex', '0');
                            element.focus({ preventScroll: true });
                            self.currentFocus = index;
                            
                            // Restore scroll position if needed
                            if (self.container && self.preservedScrollTop !== undefined) {
                                // Calculate new scroll position to maintain visual position
                                const newRect = element.getBoundingClientRect();
                                const scrollAdjustment = newRect.top - self.preservedRelativeTop;
                                self.container.scrollTop = self.preservedScrollTop + scrollAdjustment;
                            }
                        } else {
                            console.warn('Element found but not in focusable list');
                        }
                    } else {
                        console.warn('Could not find element with task-id:', safeId);
                    }
                } catch (err) {
                    console.error('Error restoring focus:', err);
                }
                
                // Clear preserved state
                self.preservedFocusId = null;
                self.preservedScrollTop = null;
                self.preservedRelativeTop = null;
            });
        },
        
        /**
         * Mark current task as done (safer than delete)
         */
        markTaskDone: function() {
            if (this.currentFocus < 0 || this.currentFocus >= this.focusableElements.length) {
                this.announce('No task selected');
                return;
            }
            
            const element = this.focusableElements[this.currentFocus];
            const checkbox = element.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.click();
                this.announce('Task marked as done');
            }
        },
        
        /**
         * Toggle focus mode (hide distractions)
         */
        toggleFocusMode: function() {
            const self = this;
            const isEnabled = document.body.classList.contains('focus-mode');
            
            if (!isEnabled) {
                // Entering focus mode
                document.body.classList.add('focus-mode');
                
                // Add exit instructions
                const exitInstructions = document.createElement('div');
                exitInstructions.id = 'focus-mode-exit';
                exitInstructions.className = 'focus-mode-indicator';
                exitInstructions.innerHTML = 'Focus Mode Active - Press F or ESC to exit';
                exitInstructions.setAttribute('role', 'status');
                exitInstructions.setAttribute('aria-live', 'polite');
                document.body.appendChild(exitInstructions);
                
                this.announce('Focus mode enabled. Press F or Escape to exit.');
            } else {
                // Exiting focus mode
                document.body.classList.remove('focus-mode');
                
                // Remove exit instructions
                const exitIndicator = document.getElementById('focus-mode-exit');
                if (exitIndicator) {
                    exitIndicator.remove();
                }
                
                this.announce('Focus mode disabled');
            }
        },
        
        /**
         * Toggle checkbox with space key
         */
        toggleCheckbox: function() {
            if (this.currentFocus < 0 || this.currentFocus >= this.focusableElements.length) {
                return;
            }
            
            const element = this.focusableElements[this.currentFocus];
            const checkbox = element.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.click();
                this.announce(`Task ${checkbox.checked ? 'completed' : 'uncompleted'}`);
            }
        },
        
        /**
         * Destroy and cleanup
         */
        destroy: function() {
            const self = this;
            
            // Clear all timers
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = null;
            }
            
            if (this.escapeTimer) {
                clearTimeout(this.escapeTimer);
                this.escapeTimer = null;
            }
            
            // Remove all event listeners (store references during setup)
            if (this.container) {
                // Remove container event listeners
                this.container.removeEventListener('keydown', this._handleKeyDown);
                this.container.removeEventListener('focusin', this._handleFocusIn);
                this.container.removeEventListener('click', this._handleClick);
                
                // Remove attributes
                this.container.removeAttribute('role');
                this.container.removeAttribute('aria-label');
            }
            
            // Remove document event listeners
            document.removeEventListener('keydown', this._handleGlobalKeyDown);
            document.removeEventListener('tasksUpdated', this._handleTasksUpdated);
            
            // Remove skip links
            const skipNav = document.querySelector('.skip-links');
            if (skipNav) {
                skipNav.remove();
            }
            
            // Remove focus mode indicator if exists
            const focusModeIndicator = document.getElementById('focus-mode-exit');
            if (focusModeIndicator) {
                focusModeIndicator.remove();
            }
            
            // Remove shortcuts disabled indicator if exists
            const shortcutsIndicator = document.querySelector('.shortcuts-disabled-indicator');
            if (shortcutsIndicator) {
                shortcutsIndicator.remove();
            }
            
            // Reset all state
            this.currentFocus = -1;
            this.focusableElements = [];
            this.container = null;
            this.isInitialized = false;
            this.shortcutsDisabled = false;
            this.escapeCount = 0;
            this.preservedFocusId = null;
            this.undoStack = [];
            this.conflictingShortcuts = {};
            
            // Clear bound functions
            this._handleKeyDown = null;
            this._handleGlobalKeyDown = null;
            this._handleFocusIn = null;
            this._handleClick = null;
            this._handleTasksUpdated = null;
            
            console.log('KeyboardNav: Destroyed and cleaned up');
        }
    };
    
    // Export to global namespace
    window.StackMapKeyboardNav = KeyboardNav;
    
})();