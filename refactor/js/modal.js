/**
 * Modal Component for StackMap
 * Accessible, mobile-first modal system
 * ES5 compliant with ADHD/autism accommodations
 */

(function() {
    'use strict';
    
    const Modal = {
        activeModal: null,
        previousFocus: null,
        escapeHandler: null,
        clickHandler: null,
        tabHandler: null,
        
        /**
         * Create and show a modal
         * @param {Object} options - Modal configuration
         * @param {string} options.title - Modal title
         * @param {string} options.content - HTML content
         * @param {Function} options.onClose - Close callback
         * @param {boolean} options.closeOnBackdrop - Close on backdrop click
         * @param {boolean} options.showCloseButton - Show X button
         * @param {string} options.className - Additional CSS class
         */
        show: function(options) {
            const self = this;
            
            // Default options
            options = options || {};
            options.closeOnBackdrop = options.closeOnBackdrop !== false;
            options.showCloseButton = options.showCloseButton !== false;
            
            // Close any existing modal
            if (self.activeModal) {
                self.close();
            }
            
            // Store current focus
            self.previousFocus = document.activeElement;
            
            // Create modal structure
            const modal = self.createModalElement(options);
            
            // Add to DOM
            document.body.appendChild(modal);
            
            // Force reflow for animation
            modal.offsetHeight;
            
            // Add active class for animation
            modal.classList.add('modal-active');
            
            // Store reference
            self.activeModal = modal;
            
            // Setup event handlers
            self.setupEventHandlers(options);
            
            // Focus management
            self.trapFocus(modal);
            
            // Announce to screen readers
            self.announceModal(options.title);
            
            return modal;
        },
        
        /**
         * Create modal DOM element
         */
        createModalElement: function(options) {
            const self = this;
            
            // Modal container
            const modal = document.createElement('div');
            modal.className = 'modal';
            if (options.className) {
                modal.className += ` ${options.className}`;
            }
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            if (options.title) {
                modal.setAttribute('aria-labelledby', 'modal-title');
            }
            
            // Backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            
            // Dialog
            const dialog = document.createElement('div');
            dialog.className = 'modal-dialog';
            
            // Header
            if (options.title || options.showCloseButton) {
                const header = document.createElement('div');
                header.className = 'modal-header';
                
                if (options.title) {
                    const title = document.createElement('h2');
                    title.id = 'modal-title';
                    title.className = 'modal-title';
                    title.textContent = options.title;
                    header.appendChild(title);
                }
                
                if (options.showCloseButton) {
                    const closeBtn = document.createElement('button');
                    closeBtn.className = 'modal-close';
                    closeBtn.setAttribute('aria-label', 'Close modal');
                    closeBtn.innerHTML = '&times;';
                    closeBtn.onclick = function() {
                        self.close();
                    };
                    header.appendChild(closeBtn);
                }
                
                dialog.appendChild(header);
            }
            
            // Content
            const content = document.createElement('div');
            content.className = 'modal-content';
            if (typeof options.content === 'string') {
                content.innerHTML = options.content;
            } else if (options.content) {
                content.appendChild(options.content);
            }
            dialog.appendChild(content);
            
            // Assemble
            modal.appendChild(backdrop);
            modal.appendChild(dialog);
            
            return modal;
        },
        
        /**
         * Setup event handlers
         */
        setupEventHandlers: function(options) {
            const self = this;
            
            // Escape key handler
            self.escapeHandler = function(e) {
                if (e.key === 'Escape' || e.keyCode === 27) {
                    e.preventDefault();
                    self.close();
                }
            };
            document.addEventListener('keydown', self.escapeHandler);
            
            // Backdrop click handler
            if (options.closeOnBackdrop) {
                self.clickHandler = function(e) {
                    if (e.target.classList.contains('modal-backdrop')) {
                        self.close();
                    }
                };
                self.activeModal.addEventListener('click', self.clickHandler);
            }
        },
        
        /**
         * Close the active modal
         */
        close: function() {
            const self = this;
            
            if (!self.activeModal) return;
            
            // Remove active class for animation
            self.activeModal.classList.remove('modal-active');
            
            // Remove after animation
            setTimeout(function() {
                if (self.activeModal && self.activeModal.parentNode) {
                    self.activeModal.parentNode.removeChild(self.activeModal);
                }
                
                // Cleanup
                if (self.escapeHandler) {
                    document.removeEventListener('keydown', self.escapeHandler);
                }
                if (self.clickHandler && self.activeModal) {
                    self.activeModal.removeEventListener('click', self.clickHandler);
                }
                if (self.tabHandler && self.activeModal) {
                    self.activeModal.removeEventListener('keydown', self.tabHandler);
                }
                
                // Restore focus
                if (self.previousFocus && self.previousFocus.focus) {
                    self.previousFocus.focus();
                }
                
                // Clear references
                self.activeModal = null;
                self.previousFocus = null;
                self.escapeHandler = null;
                self.clickHandler = null;
                self.tabHandler = null;
            }, window.StackMapSafeMode ? 0 : 200);
        },
        
        /**
         * Trap focus within modal
         */
        trapFocus: function(modal) {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) return;
            
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            
            // Focus first element
            setTimeout(function() {
                firstFocusable.focus();
            }, 100);
            
            // Create tab handler
            this.tabHandler = function(e) {
                if (e.key !== 'Tab' && e.keyCode !== 9) return;
                
                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            };
            
            // Trap tab navigation
            modal.addEventListener('keydown', this.tabHandler);
        },
        
        /**
         * Announce modal to screen readers
         */
        announceModal: function(title) {
            let announcer = document.getElementById('modal-announcer');
            if (!announcer) {
                announcer = document.createElement('div');
                announcer.id = 'modal-announcer';
                announcer.setAttribute('aria-live', 'assertive');
                announcer.setAttribute('aria-atomic', 'true');
                announcer.style.position = 'absolute';
                announcer.style.left = '-10000px';
                document.body.appendChild(announcer);
            }
            
            announcer.textContent = title ? `${title} dialog opened` : 'Dialog opened';
        }
    };
    
    // Export to global scope
    window.Modal = Modal;
})();