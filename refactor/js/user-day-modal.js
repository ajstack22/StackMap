/**
 * User Modal Selector for StackMap
 * Mobile-first modal for switching between users
 * ES5 compliant with ADHD/autism accommodations
 */

(function() {
    'use strict';
    
    window.UserDayModal = {
        modal: null,
        backdrop: null,
        userGrid: null,
        userSection: null,
        isOpen: false,
        previousFocus: null,
        touchStartY: null,
        focusableElements: [],
        currentFocusIndex: 0,
        
        /**
         * Initialize the modal system
         */
        init: function() {
            var self = this;
            
            // Check dependencies
            if (!self.checkDependencies()) {
                // Retry in 100ms
                setTimeout(function() { self.init(); }, 100);
                return;
            }
            
            // Get modal elements
            self.modal = document.getElementById('user-day-modal');
            if (!self.modal) {
                console.error('UserDayModal: Modal element not found');
                return;
            }
            
            self.backdrop = self.modal.querySelector('.user-day-modal-backdrop');
            self.userGrid = document.getElementById('user-grid');
            self.userSection = document.getElementById('user-section');
            
            // Setup event listeners
            self.setupEventListeners();
            
            console.log('UserDayModal initialized');
        },
        
        /**
         * Check if required dependencies are available
         */
        checkDependencies: function() {
            if (!window.UserManager) {
                console.warn('UserDayModal: Waiting for UserManager');
                return false;
            }
            
            // Check if UserManager has required methods
            if (typeof window.UserManager.getAllUsers !== 'function' ||
                typeof window.UserManager.getCurrentUser !== 'function' ||
                typeof window.UserManager.switchUser !== 'function') {
                console.error('UserDayModal: UserManager missing required methods');
                return false;
            }
            
            return true;
        },
        
        /**
         * Open the modal
         */
        open: function() {
            var self = this;
            
            if (self.isOpen) return;
            
            // Verify dependencies again
            if (!self.checkDependencies()) {
                console.error('UserDayModal: Cannot open - dependencies not ready');
                self.showError('User switching is temporarily unavailable');
                return;
            }
            
            // Update content before showing
            self.updateContent();
            
            // Store previous focus for restoration
            self.previousFocus = document.activeElement;
            
            // Show modal
            self.modal.setAttribute('aria-hidden', 'false');
            self.modal.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            
            // Add to body class for styling hooks
            document.body.classList.add('modal-active');
            
            self.isOpen = true;
            
            // Setup focus trap
            self.setupFocusTrap();
            
            // Announce to screen readers
            self.announceModal();
        },
        
        /**
         * Close the modal
         */
        close: function() {
            var self = this;
            
            if (!self.isOpen) return;
            
            // Hide modal
            self.modal.classList.remove('modal-open');
            self.modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-active');
            
            self.isOpen = false;
            
            // Clean up focus trap
            self.cleanupFocusTrap();
            
            // Restore focus
            if (self.previousFocus && self.previousFocus.focus) {
                self.previousFocus.focus();
            }
        },
        
        /**
         * Update modal content
         */
        updateContent: function() {
            var self = this;
            
            try {
                // Get all users
                var users = window.UserManager.getAllUsers();
                
                // Check if we have users
                if (!users || users.length === 0) {
                    self.showError('No users found');
                    return;
                }
                
                // If only one user, just show message
                if (users.length === 1) {
                    self.renderSingleUserMessage(users[0]);
                } else {
                    self.renderUserGrid(users);
                }
            } catch (error) {
                console.error('UserDayModal: Error updating content', error);
                self.showError('Error loading users');
            }
        },
        
        /**
         * Show error message
         */
        showError: function(message) {
            var self = this;
            
            if (self.userGrid) {
                self.userGrid.innerHTML = '<div class="modal-error" role="alert">' + 
                    '<p>' + self.escapeHtml(message) + '</p>' +
                    '<button class="error-close-btn" data-action="close">Close</button>' +
                    '</div>';
            }
        },
        
        /**
         * Render message for single user
         */
        renderSingleUserMessage: function(user) {
            var self = this;
            
            var safeEmoji = self.escapeHtml(user.emoji || '👤');
            var safeName = self.escapeHtml(user.name);
            
            self.userGrid.innerHTML = 
                '<div class="single-user-message">' +
                    '<p>Currently signed in as:</p>' +
                    '<div class="current-user-display">' +
                        '<span class="user-emoji">' + safeEmoji + '</span>' +
                        '<span class="user-name">' + safeName + '</span>' +
                    '</div>' +
                    '<p class="add-user-hint">To add more users, go to Settings</p>' +
                '</div>';
        },
        
        /**
         * Render user grid buttons
         */
        renderUserGrid: function(users) {
            var self = this;
            var currentUser = window.UserManager.getCurrentUser();
            var currentUserId = currentUser ? currentUser.id : null;
            
            // Build user buttons HTML safely
            var html = '';
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                var isActive = user.id === currentUserId;
                
                var safeId = self.escapeHtml(user.id);
                var safeEmoji = self.escapeHtml(user.emoji || '👤');
                var safeName = self.escapeHtml(user.name);
                
                html += '<button class="user-option' + (isActive ? ' active' : '') + '"' +
                        ' data-user-id="' + safeId + '"' +
                        ' role="radio"' +
                        ' aria-checked="' + (isActive ? 'true' : 'false') + '"' +
                        ' aria-label="Switch to ' + safeName + '">' +
                        '<span class="user-emoji" aria-hidden="true">' + safeEmoji + '</span>' +
                        '<span class="user-name">' + safeName + '</span>' +
                        '</button>';
            }
            
            self.userGrid.innerHTML = html;
            self.userGrid.setAttribute('role', 'radiogroup');
            self.userGrid.setAttribute('aria-label', 'Select a user');
        },
        
        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml: function(text) {
            var div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        },
        
        /**
         * Setup focus trap
         */
        setupFocusTrap: function() {
            var self = this;
            
            // Get all focusable elements
            self.focusableElements = Array.from(
                self.modal.querySelectorAll(
                    'button:not([disabled]), [href], input:not([disabled]), ' +
                    'select:not([disabled]), textarea:not([disabled]), ' +
                    '[tabindex]:not([tabindex="-1"])'
                )
            );
            
            if (self.focusableElements.length === 0) return;
            
            // Focus first element
            setTimeout(function() {
                self.focusableElements[0].focus();
                self.currentFocusIndex = 0;
            }, 100);
            
            // Add keydown handler for tab trap
            self.handleKeyDown = self.createKeyDownHandler();
            self.modal.addEventListener('keydown', self.handleKeyDown);
        },
        
        /**
         * Create keydown handler for focus trap
         */
        createKeyDownHandler: function() {
            var self = this;
            
            return function(e) {
                if (e.key === 'Tab' || e.keyCode === 9) {
                    e.preventDefault();
                    
                    if (e.shiftKey) {
                        // Move backwards
                        self.currentFocusIndex--;
                        if (self.currentFocusIndex < 0) {
                            self.currentFocusIndex = self.focusableElements.length - 1;
                        }
                    } else {
                        // Move forwards
                        self.currentFocusIndex++;
                        if (self.currentFocusIndex >= self.focusableElements.length) {
                            self.currentFocusIndex = 0;
                        }
                    }
                    
                    self.focusableElements[self.currentFocusIndex].focus();
                }
                
                // Arrow key navigation for user grid
                if (self.userGrid && self.userGrid.contains(document.activeElement)) {
                    self.handleArrowNavigation(e);
                }
            };
        },
        
        /**
         * Handle arrow key navigation in user grid
         */
        handleArrowNavigation: function(e) {
            var self = this;
            var userButtons = Array.from(self.userGrid.querySelectorAll('.user-option'));
            var currentButton = document.activeElement;
            var currentIndex = userButtons.indexOf(currentButton);
            
            if (currentIndex === -1) return;
            
            var newIndex = currentIndex;
            var columns = Math.floor(self.userGrid.offsetWidth / userButtons[0].offsetWidth);
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    newIndex = currentIndex > 0 ? currentIndex - 1 : userButtons.length - 1;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    newIndex = currentIndex < userButtons.length - 1 ? currentIndex + 1 : 0;
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    newIndex = currentIndex - columns;
                    if (newIndex < 0) newIndex = currentIndex;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    newIndex = currentIndex + columns;
                    if (newIndex >= userButtons.length) newIndex = currentIndex;
                    break;
            }
            
            if (newIndex !== currentIndex && userButtons[newIndex]) {
                userButtons[newIndex].focus();
            }
        },
        
        /**
         * Clean up focus trap
         */
        cleanupFocusTrap: function() {
            var self = this;
            
            if (self.handleKeyDown) {
                self.modal.removeEventListener('keydown', self.handleKeyDown);
                self.handleKeyDown = null;
            }
            
            self.focusableElements = [];
            self.currentFocusIndex = 0;
        },
        
        /**
         * Setup all event listeners
         */
        setupEventListeners: function() {
            var self = this;
            
            // Close button and backdrop clicks
            var closeElements = self.modal.querySelectorAll('[data-action="close"]');
            for (var i = 0; i < closeElements.length; i++) {
                closeElements[i].addEventListener('click', function(e) {
                    e.preventDefault();
                    self.close();
                });
            }
            
            // User selection (delegated)
            if (self.userGrid) {
                self.userGrid.addEventListener('click', function(e) {
                    var btn = e.target.closest('.user-option');
                    if (btn) {
                        e.preventDefault();
                        self.handleUserSelection(btn.getAttribute('data-user-id'));
                    }
                });
                
                // Keyboard activation
                self.userGrid.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        var btn = e.target.closest('.user-option');
                        if (btn) {
                            e.preventDefault();
                            self.handleUserSelection(btn.getAttribute('data-user-id'));
                        }
                    }
                });
            }
            
            // Escape key handler
            document.addEventListener('keydown', function(e) {
                if (self.isOpen && (e.key === 'Escape' || e.keyCode === 27)) {
                    e.preventDefault();
                    self.close();
                }
            });
            
            // Touch gesture support for swipe down to close
            self.setupSwipeGestures();
        },
        
        /**
         * Handle user selection
         */
        handleUserSelection: function(userId) {
            var self = this;
            
            if (!userId) return;
            
            try {
                // Switch user via UserManager
                if (window.UserManager && window.UserManager.switchUser) {
                    window.UserManager.switchUser(userId);
                    
                    // Close modal after successful switch
                    self.close();
                    
                    // Get user info for announcement
                    var user = window.UserManager.getUserById 
                        ? window.UserManager.getUserById(userId)
                        : null;
                    
                    if (user) {
                        self.announceChange('Switched to ' + user.name);
                    }
                } else {
                    throw new Error('UserManager.switchUser not available');
                }
            } catch (error) {
                console.error('UserDayModal: Error switching user', error);
                self.showError('Could not switch user. Please try again.');
            }
        },
        
        /**
         * Setup swipe gestures for mobile
         */
        setupSwipeGestures: function() {
            var self = this;
            var modalContent = self.modal.querySelector('.user-day-modal-content');
            if (!modalContent) return;
            
            var startY = 0;
            var currentY = 0;
            var startTime = 0;
            var isDragging = false;
            
            // Touch start
            modalContent.addEventListener('touchstart', function(e) {
                var handle = e.target.closest('.modal-handle');
                if (!handle) return;
                
                startY = e.touches[0].clientY;
                startTime = Date.now();
                isDragging = true;
                modalContent.style.transition = 'none';
            });
            
            // Touch move
            modalContent.addEventListener('touchmove', function(e) {
                if (!isDragging) return;
                
                currentY = e.touches[0].clientY;
                var deltaY = currentY - startY;
                
                // Only allow downward swipe
                if (deltaY > 0) {
                    modalContent.style.transform = 'translateY(' + deltaY + 'px)';
                    
                    // Add visual feedback
                    var opacity = Math.max(0.5, 1 - (deltaY / 200));
                    modalContent.style.opacity = opacity;
                }
            });
            
            // Touch end
            modalContent.addEventListener('touchend', function(e) {
                if (!isDragging) return;
                
                isDragging = false;
                modalContent.style.transition = '';
                modalContent.style.opacity = '';
                
                var deltaY = currentY - startY;
                var deltaTime = Date.now() - startTime;
                var velocity = deltaY / deltaTime;
                
                // Close if swiped down more than 100px or with sufficient velocity
                if (deltaY > 100 || (deltaY > 50 && velocity > 0.5)) {
                    self.close();
                } else {
                    // Snap back
                    modalContent.style.transform = '';
                }
            });
        },
        
        /**
         * Announce modal opening to screen readers
         */
        announceModal: function() {
            var self = this;
            self.announce('Switch user dialog opened');
        },
        
        /**
         * Announce changes to screen readers
         */
        announceChange: function(message) {
            var self = this;
            self.announce(message, 'polite');
        },
        
        /**
         * Generic announce helper
         */
        announce: function(message, priority) {
            var announcer = document.createElement('div');
            announcer.setAttribute('aria-live', priority || 'assertive');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.position = 'absolute';
            announcer.style.left = '-10000px';
            announcer.textContent = message;
            
            document.body.appendChild(announcer);
            
            setTimeout(function() {
                if (announcer.parentNode) {
                    announcer.parentNode.removeChild(announcer);
                }
            }, 1000);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.UserDayModal.init();
        });
    } else {
        // DOM already loaded
        setTimeout(function() {
            window.UserDayModal.init();
        }, 100);
    }
})();