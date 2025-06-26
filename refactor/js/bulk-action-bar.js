/**
 * Bulk Action Bar Component
 * Part of Story #120: Bulk Operations
 * Provides floating action bar for bulk operations
 */
(function() {
    'use strict';
    
    const BulkActionBar = {
        element: null,
        selectionManager: null,
        bulkOperationsManager: null,
        
        /**
         * Initialize the bulk action bar
         */
        init: function(selectionManager, bulkOperationsManager) {
            this.selectionManager = selectionManager;
            this.bulkOperationsManager = bulkOperationsManager;
            
            // Listen for selection events
            document.addEventListener('selectionModeChanged', this.handleSelectionModeChange.bind(this));
            document.addEventListener('selectionChanged', this.handleSelectionChange.bind(this));
            
            // Listen for activity events to update UI
            document.addEventListener('activities-deleted', this.hide.bind(this));
            document.addEventListener('activities-updated', this.hide.bind(this));
            document.addEventListener('activities-restored', this.show.bind(this));
        },
        
        /**
         * Handle selection mode changes
         */
        handleSelectionModeChange: function(e) {
            if (e.detail.enabled) {
                this.createSelectionToolbar();
            } else {
                this.removeSelectionToolbar();
                this.hide();
            }
        },
        
        /**
         * Handle selection changes
         */
        handleSelectionChange: function(e) {
            const count = e.detail.count;
            
            if (count > 0) {
                this.show();
                this.updateCount(count);
            } else {
                this.hide();
            }
        },
        
        /**
         * Create selection toolbar (top bar)
         */
        createSelectionToolbar: function() {
            // Remove existing toolbar
            this.removeSelectionToolbar();
            
            const toolbar = document.createElement('div');
            toolbar.className = 'selection-toolbar';
            toolbar.innerHTML = `
                <div class="selection-toolbar-left">
                    <button class="selection-close-button" aria-label="Exit selection mode">✕</button>
                    <span class="selection-title">Select Activities</span>
                </div>
                <div class="selection-toolbar-right">
                    <button class="select-all-button">Select All</button>
                </div>
            `;
            
            // Add event handlers
            const closeButton = toolbar.querySelector('.selection-close-button');
            closeButton.onclick = () => {
                if (window.EditMode) {
                    window.EditMode.toggleSelectionMode();
                }
            };
            
            const selectAllButton = toolbar.querySelector('.select-all-button');
            selectAllButton.onclick = () => {
                this.selectionManager.toggleSelectAll();
            };
            
            document.body.appendChild(toolbar);
        },
        
        /**
         * Remove selection toolbar
         */
        removeSelectionToolbar: function() {
            const toolbar = document.querySelector('.selection-toolbar');
            if (toolbar) {
                toolbar.remove();
            }
        },
        
        /**
         * Show the action bar
         */
        show: function() {
            if (!this.element) {
                this.create();
            }
            
            if (this.element && !this.element.parentNode) {
                document.body.appendChild(this.element);
            }
        },
        
        /**
         * Hide the action bar
         */
        hide: function() {
            if (this.element && this.element.parentNode) {
                this.element.remove();
            }
        },
        
        /**
         * Create the action bar element
         */
        create: function() {
            this.element = document.createElement('div');
            this.element.className = 'bulk-action-bar';
            this.element.innerHTML = `
                <span class="bulk-selection-count">0 selected</span>
                <button class="bulk-action-button" data-action="toggleComplete">
                    <span>✓</span> Complete
                </button>
                <button class="bulk-action-button" data-action="togglePin">
                    <span>📌</span> Pin
                </button>
                <button class="bulk-action-button" data-action="assignType">
                    <span>🏷️</span> Type
                </button>
                <button class="bulk-action-button" data-action="updateTime">
                    <span>🕐</span> Time
                </button>
                <button class="bulk-action-button destructive" data-action="delete">
                    <span>🗑️</span> Delete
                </button>
            `;
            
            // Add event handlers
            const buttons = this.element.querySelectorAll('.bulk-action-button');
            buttons.forEach(button => {
                button.onclick = this.handleAction.bind(this);
            });
        },
        
        /**
         * Update selection count
         */
        updateCount: function(count) {
            if (!this.element) return;
            
            const countElement = this.element.querySelector('.bulk-selection-count');
            if (countElement) {
                countElement.textContent = `${count} selected`;
            }
        },
        
        /**
         * Handle action button clicks
         */
        handleAction: function(e) {
            const button = e.target.closest('.bulk-action-button');
            if (!button) return;
            
            const action = button.dataset.action;
            
            switch (action) {
                case 'delete':
                    this.confirmDelete();
                    break;
                case 'toggleComplete':
                    this.bulkOperationsManager.performBulkAction('toggleComplete');
                    break;
                case 'togglePin':
                    this.bulkOperationsManager.performBulkAction('togglePin');
                    break;
                case 'assignType':
                    this.showTypeSelector();
                    break;
                case 'updateTime':
                    this.showTimeSelector();
                    break;
            }
        },
        
        /**
         * Confirm deletion
         */
        async confirmDelete: function() {
            const count = this.selectionManager.getSelectedCount();
            
            if (this.bulkOperationsManager.showConfirmation) {
                const confirmed = await this.bulkOperationsManager.showConfirmation('delete', count);
                if (confirmed) {
                    this.bulkOperationsManager.performBulkAction('delete');
                }
            } else {
                // Fallback to native confirm
                const message = `Delete ${count} selected activities? This can be undone within 5 seconds.`;
                if (confirm(message)) {
                    this.bulkOperationsManager.performBulkAction('delete');
                }
            }
        },
        
        /**
         * Show type selector dialog
         */
        showTypeSelector: function() {
            // Create simple type selector
            const types = window.ActivityTypes ? window.ActivityTypes.getAllTypes() : [];
            
            if (types.length === 0) {
                alert('No activity types available');
                return;
            }
            
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'bulk-type-modal';
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #2a2a2a;
                border: 1px solid #444;
                border-radius: 12px;
                padding: 20px;
                z-index: 2000;
                max-width: 400px;
                width: 90%;
            `;
            
            modal.innerHTML = `
                <h3 style="margin: 0 0 16px 0; color: #fff;">Select Activity Type</h3>
                <div class="type-list" style="max-height: 300px; overflow-y: auto;">
                    ${types.map(type => `
                        <button class="type-option" data-type-id="${type.id}" style="
                            display: block;
                            width: 100%;
                            padding: 12px;
                            margin-bottom: 8px;
                            background: #333;
                            border: 1px solid #555;
                            border-radius: 8px;
                            color: #fff;
                            text-align: left;
                            cursor: pointer;
                        ">
                            <span style="font-size: 20px; margin-right: 8px;">${type.icon}</span>
                            ${type.name}
                        </button>
                    `).join('')}
                </div>
                <button class="cancel-button" style="
                    margin-top: 16px;
                    padding: 8px 16px;
                    background: #444;
                    border: 1px solid #666;
                    border-radius: 6px;
                    color: #ccc;
                    cursor: pointer;
                ">Cancel</button>
            `;
            
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1999;
            `;
            
            // Add event handlers
            modal.querySelectorAll('.type-option').forEach(button => {
                button.onclick = () => {
                    const typeId = button.dataset.typeId;
                    this.bulkOperationsManager.performBulkAction('assignType', { typeId: typeId });
                    backdrop.remove();
                    modal.remove();
                };
            });
            
            modal.querySelector('.cancel-button').onclick = () => {
                backdrop.remove();
                modal.remove();
            };
            
            backdrop.onclick = () => {
                backdrop.remove();
                modal.remove();
            };
            
            document.body.appendChild(backdrop);
            document.body.appendChild(modal);
        },
        
        /**
         * Show time selector dialog
         */
        showTimeSelector: function() {
            // Create simple time input
            const modal = document.createElement('div');
            modal.className = 'bulk-time-modal';
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #2a2a2a;
                border: 1px solid #444;
                border-radius: 12px;
                padding: 20px;
                z-index: 2000;
                max-width: 300px;
                width: 90%;
            `;
            
            modal.innerHTML = `
                <h3 style="margin: 0 0 16px 0; color: #fff;">Set Time</h3>
                <input type="time" class="time-input" style="
                    width: 100%;
                    padding: 12px;
                    background: #1a1a1a;
                    border: 1px solid #555;
                    border-radius: 6px;
                    color: #fff;
                    font-size: 16px;
                ">
                <div style="margin-top: 16px; display: flex; gap: 8px;">
                    <button class="apply-button" style="
                        flex: 1;
                        padding: 10px;
                        background: #4CAF50;
                        border: none;
                        border-radius: 6px;
                        color: white;
                        cursor: pointer;
                    ">Apply</button>
                    <button class="cancel-button" style="
                        flex: 1;
                        padding: 10px;
                        background: #444;
                        border: 1px solid #666;
                        border-radius: 6px;
                        color: #ccc;
                        cursor: pointer;
                    ">Cancel</button>
                </div>
            `;
            
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1999;
            `;
            
            // Add event handlers
            const timeInput = modal.querySelector('.time-input');
            const applyButton = modal.querySelector('.apply-button');
            const cancelButton = modal.querySelector('.cancel-button');
            
            applyButton.onclick = () => {
                const time = timeInput.value;
                if (time) {
                    this.bulkOperationsManager.performBulkAction('updateTime', { time: time });
                    backdrop.remove();
                    modal.remove();
                }
            };
            
            cancelButton.onclick = () => {
                backdrop.remove();
                modal.remove();
            };
            
            backdrop.onclick = () => {
                backdrop.remove();
                modal.remove();
            };
            
            document.body.appendChild(backdrop);
            document.body.appendChild(modal);
            
            // Focus time input
            timeInput.focus();
        },
        
        /**
         * Destroy the action bar
         */
        destroy: function() {
            this.removeSelectionToolbar();
            this.hide();
            this.element = null;
        }
    };
    
    // Export
    window.BulkActionBar = BulkActionBar;
})();