/**
 * Keyboard Navigation Module for StackMap
 * Implements roving tabindex pattern for accessible list navigation
 * 
 * @module KeyboardNav
 */

(function() {
    'use strict';
    
    var KeyboardNav = {
        // Configuration
        DEBOUNCE_DELAY: 100, // ms - adjust for ADHD users
        
        // State
        currentFocus: -1,
        focusableElements: [],
        container: null,
        debounceTimer: null,
        isInitialized: false,
        
        // Keyboard shortcuts
        shortcuts: {
            'n': 'addNewTask',
            'e': 'editCurrentTask',
            'd': 'deleteCurrentTask',
            't': 'setTimerForCurrentTask',
            '/': 'focusSearch',
            '?': 'showHelp',
            'g h': 'goHome',
            'g t': 'goToTasks',
            'g s': 'goToSettings'
        },
        comboBuffer: [],
        comboTimeout: null,
        
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
            
            this.addSkipLinks();
            this.updateFocusableElements();
            this.setupEventListeners();
            this.initializeTabindex();
            this.setupAriaAttributes();
            
            this.isInitialized = true;
            console.log('KeyboardNav: Initialized with ' + this.focusableElements.length + ' focusable elements');
        },
        
        /**
         * Update the list of focusable elements
         */
        updateFocusableElements: function() {
            // Find all task cards that can receive focus
            var cards = this.container.querySelectorAll('.task-card:not(.task-placeholder)');
            this.focusableElements = Array.prototype.slice.call(cards);
            
            // Reset focus if current element no longer exists
            if (this.currentFocus >= this.focusableElements.length) {
                this.currentFocus = this.focusableElements.length - 1;
            }
        },
        
        /**
         * Initialize tabindex on elements
         */
        initializeTabindex: function() {
            var self = this;
            
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
            this.container.setAttribute('aria-label', 'Task list');
            
            // Task card attributes
            var self = this;
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
            
            var skipNav = document.createElement('nav');
            skipNav.className = 'skip-links';
            skipNav.setAttribute('aria-label', 'Skip links');
            
            var links = [
                { href: '#main', text: 'Skip to main content' },
                { href: '#task-container', text: 'Skip to tasks' },
                { href: '#add-task', text: 'Skip to add task' },
                { href: '#settings', text: 'Skip to settings' }
            ];
            
            links.forEach(function(link) {
                var a = document.createElement('a');
                a.href = link.href;
                a.className = 'skip-link';
                a.textContent = link.text;
                
                // Add keyboard event handling for skip links
                a.addEventListener('click', function(e) {
                    e.preventDefault();
                    var target = document.querySelector(link.href);
                    if (target) {
                        target.setAttribute('tabindex', '-1');
                        target.focus();
                        target.removeAttribute('tabindex');
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
            var self = this;
            
            // Keyboard navigation on container
            this.container.addEventListener('keydown', function(e) {
                self.handleKeyDown(e);
            });
            
            // Global keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                // Skip if user is typing in an input field
                var tagName = e.target.tagName.toLowerCase();
                if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
                    return;
                }
                
                // Skip if modifier keys are pressed (except shift for ?)
                if (e.ctrlKey || e.altKey || e.metaKey) {
                    return;
                }
                
                self.handleGlobalShortcut(e);
            });
            
            // Focus event handling
            this.container.addEventListener('focusin', function(e) {
                self.handleFocusIn(e);
            });
            
            // Click to focus
            this.container.addEventListener('click', function(e) {
                var card = e.target.closest('.task-card');
                if (card && self.focusableElements.indexOf(card) !== -1) {
                    self.setFocus(self.focusableElements.indexOf(card));
                }
            });
            
            // Listen for dynamic content changes
            document.addEventListener('tasksUpdated', function() {
                self.refresh();
            });
        },
        
        /**
         * Handle keydown events with debouncing
         */
        handleKeyDown: function(e) {
            var self = this;
            
            // Clear existing timer
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            
            // Keys that should work immediately (no debounce)
            var immediateKeys = ['Tab', 'Escape'];
            if (immediateKeys.indexOf(e.key) !== -1) {
                return; // Let default behavior handle these
            }
            
            // Debounce other keys
            this.debounceTimer = setTimeout(function() {
                self.processKeyPress(e);
            }, this.DEBOUNCE_DELAY);
        },
        
        /**
         * Process keyboard input
         */
        processKeyPress: function(e) {
            var handled = false;
            
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
            var card = e.target.closest('.task-card');
            if (card && this.focusableElements.indexOf(card) !== -1) {
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
            var element = this.focusableElements[index];
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
            var self = this;
            
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
            var self = this;
            
            this.focusableElements.forEach(function(element, index) {
                var isSelected = index === self.currentFocus;
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
            var announcement = 'Task ' + current + ' of ' + total;
            this.announce(announcement);
        },
        
        /**
         * Create or get ARIA live region for announcements
         */
        getAnnouncementRegion: function() {
            var announcer = document.getElementById('keyboard-nav-announcer');
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
            var announcer = this.getAnnouncementRegion();
            
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
            
            var element = this.focusableElements[this.currentFocus];
            if (element) {
                // Get task title for announcement
                var taskTitle = element.querySelector('h3, .task-title');
                var taskName = taskTitle ? taskTitle.textContent : 'Task';
                
                // Find and click the first interactive element (button, link, etc.)
                var interactive = element.querySelector('button, a, input, [role="button"]');
                if (interactive) {
                    interactive.click();
                    this.announce('Activated: ' + taskName);
                } else {
                    // Fallback: click the card itself
                    element.click();
                    this.announce('Selected: ' + taskName);
                }
            }
        },
        
        /**
         * Handle global keyboard shortcuts
         */
        handleGlobalShortcut: function(e) {
            var self = this;
            var key = e.key;
            
            // Handle shift+? for help
            if (key === '?' && e.shiftKey) {
                key = '?';
            }
            
            // Clear existing combo timeout
            if (this.comboTimeout) {
                clearTimeout(this.comboTimeout);
            }
            
            // Add to buffer
            this.comboBuffer.push(key.toLowerCase());
            
            // Check for match
            var combo = this.comboBuffer.join(' ');
            
            // Check for exact match
            if (this.shortcuts[combo]) {
                e.preventDefault();
                this.executeShortcut(this.shortcuts[combo]);
                this.comboBuffer = [];
                return;
            }
            
            // Check if this could be part of a combo
            var possibleCombo = false;
            for (var shortcut in this.shortcuts) {
                if (shortcut.indexOf(combo) === 0 && shortcut !== combo) {
                    possibleCombo = true;
                    break;
                }
            }
            
            if (possibleCombo) {
                // Wait for more keys
                this.comboTimeout = setTimeout(function() {
                    self.comboBuffer = [];
                }, 500);
            } else {
                // Not a valid combo start, clear buffer
                this.comboBuffer = [];
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
                case 'deleteCurrentTask':
                    this.deleteCurrentTask();
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
                case 'goHome':
                    this.navigateTo('home-view');
                    break;
                case 'goToTasks':
                    this.navigateTo('tasks-view');
                    break;
                case 'goToSettings':
                    this.navigateTo('settings-view');
                    break;
            }
        },
        
        /**
         * Shortcut: Add new task
         */
        addNewTask: function() {
            var addButton = document.getElementById('add-task-button');
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
            
            var element = this.focusableElements[this.currentFocus];
            var editButton = element.querySelector('.edit-button, [aria-label*="Edit"]');
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
                var element = this.focusableElements[this.currentFocus];
                var deleteButton = element.querySelector('.delete-button, [aria-label*="Delete"]');
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
            
            var element = this.focusableElements[this.currentFocus];
            var taskId = element.getAttribute('data-task-id');
            
            if (taskId && window.TaskTimer) {
                var timerButton = element.querySelector('.task-timer-button');
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
            var searchInput = document.querySelector('#search-input, [type="search"], [role="searchbox"]');
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
                this.announce('Navigated to ' + viewId.replace('-view', ''));
            }
        },
        
        /**
         * Create and show keyboard help overlay
         */
        createHelpOverlay: function() {
            // Check if help already exists
            var existingHelp = document.getElementById('keyboard-help-overlay');
            if (existingHelp) {
                existingHelp.remove();
            }
            
            var overlay = document.createElement('div');
            overlay.id = 'keyboard-help-overlay';
            overlay.className = 'modal-overlay active';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-label', 'Keyboard shortcuts help');
            
            var content = document.createElement('div');
            content.className = 'modal-content keyboard-help';
            
            var header = document.createElement('h2');
            header.textContent = 'Keyboard Shortcuts';
            content.appendChild(header);
            
            var shortcuts = [
                { key: '↓/j', description: 'Next task' },
                { key: '↑/k', description: 'Previous task' },
                { key: 'Enter/Space', description: 'Select task' },
                { key: 'n', description: 'New task' },
                { key: 'e', description: 'Edit task' },
                { key: 'd', description: 'Delete task' },
                { key: 't', description: 'Set timer' },
                { key: '/', description: 'Search' },
                { key: 'g h', description: 'Go home' },
                { key: 'g t', description: 'Go to tasks' },
                { key: 'g s', description: 'Go to settings' },
                { key: '?', description: 'Show this help' },
                { key: 'Esc', description: 'Close dialogs' }
            ];
            
            var list = document.createElement('dl');
            list.className = 'keyboard-shortcuts-list';
            
            shortcuts.forEach(function(shortcut) {
                var dt = document.createElement('dt');
                dt.className = 'shortcut-key';
                dt.textContent = shortcut.key;
                
                var dd = document.createElement('dd');
                dd.className = 'shortcut-description';
                dd.textContent = shortcut.description;
                
                list.appendChild(dt);
                list.appendChild(dd);
            });
            
            content.appendChild(list);
            
            var closeButton = document.createElement('button');
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
            var self = this;
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
            var previousCount = this.focusableElements.length;
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
         * Destroy and cleanup
         */
        destroy: function() {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            
            // Remove attributes
            if (this.container) {
                this.container.removeAttribute('role');
                this.container.removeAttribute('aria-label');
            }
            
            // Reset state
            this.currentFocus = -1;
            this.focusableElements = [];
            this.container = null;
            this.isInitialized = false;
        }
    };
    
    // Export to global namespace
    window.StackMapKeyboardNav = KeyboardNav;
    
})();