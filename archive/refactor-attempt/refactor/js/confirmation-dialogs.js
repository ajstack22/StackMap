/**
 * Confirmation Dialogs System
 * Delete confirmation, unsaved changes warnings, and bulk operation confirmations
 * Story #98 - Round 6 Dev2
 */

(function() {
    'use strict';
    
    const ConfirmationDialogs = {
        container: null,
        activeDialog: null,
        pendingAction: null,
        
        /**
         * Initialize the confirmation dialog system
         */
        init: function() {
            const self = this;
            
            // Create dialog container
            this.createDialogContainer();
            
            // Setup interceptors
            this.setupInterceptors();
            
            // Listen for dialog events
            this.setupEventListeners();
            
            console.log('Confirmation dialogs initialized');
        },
        
        /**
         * Create the dialog container element
         */
        createDialogContainer: function() {
            this.container = document.createElement('div');
            this.container.className = 'confirmation-dialog-container';
            this.container.setAttribute('role', 'dialog');
            this.container.setAttribute('aria-modal', 'true');
            this.container.setAttribute('aria-hidden', 'true');
            
            document.body.appendChild(this.container);
        },
        
        /**
         * Setup action interceptors
         */
        setupInterceptors: function() {
            const self = this;
            
            // Intercept delete actions
            document.addEventListener('activity-delete-request', function(e) {
                e.preventDefault();
                self.showDeleteConfirmation(e.detail);
            });
            
            // Intercept bulk operations
            document.addEventListener('bulk-operation-request', function(e) {
                e.preventDefault();
                self.showBulkOperationConfirmation(e.detail);
            });
            
            // Intercept edit mode exit with unsaved changes
            if (window.EditMode) {
                const originalToggle = window.EditMode.toggle;
                window.EditMode.toggle = function() {
                    if (window.EditMode.isActive() && self.hasUnsavedChanges()) {
                        self.showUnsavedChangesConfirmation(function() {
                            originalToggle.call(window.EditMode);
                        });
                    } else {
                        originalToggle.call(window.EditMode);
                    }
                };
            }
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Dialog interactions
            this.container.addEventListener('click', function(e) {
                const action = e.target.getAttribute('data-action');
                if (action) {
                    self.handleDialogAction(action);
                }
                
                // Close on backdrop click
                if (e.target === self.container) {
                    self.handleDialogAction('cancel');
                }
            });
            
            // Keyboard handling
            document.addEventListener('keydown', function(e) {
                if (self.activeDialog) {
                    if (e.key === 'Escape') {
                        self.handleDialogAction('cancel');
                    } else if (e.key === 'Enter') {
                        self.handleDialogAction('confirm');
                    }
                }
            });
        },
        
        /**
         * Show delete confirmation dialog
         */
        showDeleteConfirmation: function(detail) {
            const activity = detail.activity;
            const callback = detail.callback;
            
            const dialogHtml = `
                <div class="confirmation-dialog delete-confirmation">
                    <div class="dialog-icon">
                        <span class="icon-warning">⚠️</span>
                    </div>
                    <h2 class="dialog-title">Delete Activity?</h2>
                    <p class="dialog-message">
                        Are you sure you want to delete "<strong>${this.escapeHtml(activity.text || activity.description)}</strong>"?
                    </p>
                    <div class="dialog-info">
                        <p class="info-text">This action can be undone for 30 seconds.</p>
                    </div>
                    <div class="dialog-actions">
                        <button class="dialog-btn btn-cancel" data-action="cancel">Cancel</button>
                        <button class="dialog-btn btn-confirm btn-destructive" data-action="confirm">Delete</button>
                    </div>
                </div>
            `;
            
            this.pendingAction = function() {
                callback();
                self.showUndoToast('Activity deleted', function() {
                    // Undo action
                    if (window.UndoManager) {
                        window.UndoManager.undo();
                    }
                });
            };
            
            this.showDialog(dialogHtml);
        },
        
        /**
         * Show bulk operation confirmation
         */
        showBulkOperationConfirmation: function(detail) {
            const operation = detail.operation;
            const count = detail.count;
            const callback = detail.callback;
            
            let title, message, confirmText;
            
            switch (operation) {
                case 'delete':
                    title = 'Delete Multiple Activities?';
                    message = `Are you sure you want to delete ${count} activities?`;
                    confirmText = 'Delete All';
                    break;
                    
                case 'complete':
                    title = 'Complete All Activities?';
                    message = `Mark ${count} activities as completed?`;
                    confirmText = 'Complete All';
                    break;
                    
                case 'pin':
                    title = 'Pin All Activities?';
                    message = `Pin ${count} activities to the top?`;
                    confirmText = 'Pin All';
                    break;
                    
                default:
                    title = 'Confirm Bulk Operation';
                    message = `Apply this operation to ${count} activities?`;
                    confirmText = 'Confirm';
            }
            
            const dialogHtml = `
                <div class="confirmation-dialog bulk-confirmation">
                    <div class="dialog-icon">
                        <span class="icon-info">ℹ️</span>
                    </div>
                    <h2 class="dialog-title">${title}</h2>
                    <p class="dialog-message">${message}</p>
                    <div class="dialog-stats">
                        <div class="stat-item">
                            <span class="stat-number">${count}</span>
                            <span class="stat-label">activities selected</span>
                        </div>
                    </div>
                    <div class="dialog-actions">
                        <button class="dialog-btn btn-cancel" data-action="cancel">Cancel</button>
                        <button class="dialog-btn btn-confirm ${operation === 'delete' ? 'btn-destructive' : ''}" data-action="confirm">${confirmText}</button>
                    </div>
                </div>
            `;
            
            this.pendingAction = callback;
            this.showDialog(dialogHtml);
        },
        
        /**
         * Show unsaved changes confirmation
         */
        showUnsavedChangesConfirmation: function(callback) {
            const dialogHtml = `
                <div class="confirmation-dialog unsaved-changes">
                    <div class="dialog-icon">
                        <span class="icon-warning">⚠️</span>
                    </div>
                    <h2 class="dialog-title">Unsaved Changes</h2>
                    <p class="dialog-message">
                        You have unsaved changes in edit mode. Do you want to save them before exiting?
                    </p>
                    <div class="dialog-actions">
                        <button class="dialog-btn btn-secondary" data-action="discard">Discard Changes</button>
                        <button class="dialog-btn btn-cancel" data-action="cancel">Keep Editing</button>
                        <button class="dialog-btn btn-confirm" data-action="save">Save & Exit</button>
                    </div>
                </div>
            `;
            
            this.pendingAction = {
                save: function() {
                    // Save all pending changes
                    self.saveAllChanges();
                    callback();
                },
                discard: function() {
                    // Discard changes and exit
                    self.discardAllChanges();
                    callback();
                }
            };
            
            this.showDialog(dialogHtml);
        },
        
        /**
         * Show generic dialog
         */
        showDialog: function(html) {
            this.container.innerHTML = html;
            this.container.classList.add('visible');
            this.container.setAttribute('aria-hidden', 'false');
            this.activeDialog = this.container.querySelector('.confirmation-dialog');
            
            // Focus management
            const firstButton = this.activeDialog.querySelector('button');
            if (firstButton) {
                firstButton.focus();
            }
            
            // Trap focus
            this.trapFocus();
            
            // Announce to screen readers
            this.announce('Confirmation dialog opened');
        },
        
        /**
         * Hide dialog
         */
        hideDialog: function() {
            this.container.classList.remove('visible');
            this.container.setAttribute('aria-hidden', 'true');
            this.activeDialog = null;
            this.pendingAction = null;
            
            // Restore focus
            if (this.previousFocus) {
                this.previousFocus.focus();
            }
            
            // Announce to screen readers
            this.announce('Dialog closed');
        },
        
        /**
         * Handle dialog action
         */
        handleDialogAction: function(action) {
            switch (action) {
                case 'confirm':
                    if (this.pendingAction) {
                        if (typeof this.pendingAction === 'function') {
                            this.pendingAction();
                        } else if (this.pendingAction.save) {
                            this.pendingAction.save();
                        }
                    }
                    this.hideDialog();
                    break;
                    
                case 'cancel':
                    this.hideDialog();
                    break;
                    
                case 'discard':
                    if (this.pendingAction && this.pendingAction.discard) {
                        this.pendingAction.discard();
                    }
                    this.hideDialog();
                    break;
                    
                case 'save':
                    if (this.pendingAction && this.pendingAction.save) {
                        this.pendingAction.save();
                    }
                    this.hideDialog();
                    break;
            }
        },
        
        /**
         * Check for unsaved changes
         */
        hasUnsavedChanges: function() {
            // Check for any active inline editors
            const activeEditors = document.querySelectorAll('.inline-editing');
            if (activeEditors.length > 0) return true;
            
            // Check for modified fields
            const modifiedFields = document.querySelectorAll('[data-modified="true"]');
            return modifiedFields.length > 0;
        },
        
        /**
         * Save all pending changes
         */
        saveAllChanges: function() {
            // Trigger save on all inline editors
            const editors = document.querySelectorAll('.inline-editing');
            editors.forEach(function(editor) {
                const saveEvent = new Event('blur', { bubbles: true });
                editor.dispatchEvent(saveEvent);
            });
        },
        
        /**
         * Discard all pending changes
         */
        discardAllChanges: function() {
            // Reset all modified fields
            const modifiedFields = document.querySelectorAll('[data-modified="true"]');
            modifiedFields.forEach(function(field) {
                field.removeAttribute('data-modified');
                if (field.hasAttribute('data-original-value')) {
                    field.value = field.getAttribute('data-original-value');
                }
            });
            
            // Cancel all inline editors
            const editors = document.querySelectorAll('.inline-editing');
            editors.forEach(function(editor) {
                editor.classList.remove('inline-editing');
            });
        },
        
        /**
         * Show undo toast
         */
        showUndoToast: function(message, undoCallback) {
            const toast = document.createElement('div');
            toast.className = 'undo-toast';
            toast.innerHTML = `
                <span class="toast-message">${message}</span>
                <button class="toast-action" data-action="undo">Undo</button>
            `;
            
            const container = document.getElementById('undo-toast-container') || document.body;
            container.appendChild(toast);
            
            // Add visible class after DOM insertion
            setTimeout(function() {
                toast.classList.add('visible');
            }, 10);
            
            // Handle undo click
            const undoBtn = toast.querySelector('[data-action="undo"]');
            undoBtn.onclick = function() {
                undoCallback();
                toast.remove();
            };
            
            // Auto-dismiss after 5 seconds
            setTimeout(function() {
                toast.classList.remove('visible');
                setTimeout(function() {
                    toast.remove();
                }, 300);
            }, 5000);
        },
        
        /**
         * Trap focus within dialog
         */
        trapFocus: function() {
            const self = this;
            const focusableElements = this.activeDialog.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            
            this.previousFocus = document.activeElement;
            
            this.activeDialog.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    if (e.shiftKey && document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            });
        },
        
        /**
         * Escape HTML for safe display
         */
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        /**
         * Announce to screen readers
         */
        announce: function(message) {
            const announcement = document.createElement('div');
            announcement.className = 'sr-only';
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'assertive');
            announcement.textContent = message;
            
            document.body.appendChild(announcement);
            setTimeout(function() {
                announcement.remove();
            }, 1000);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            ConfirmationDialogs.init();
        });
    } else {
        ConfirmationDialogs.init();
    }
    
    // Export for external use
    window.ConfirmationDialogs = ConfirmationDialogs;
})();