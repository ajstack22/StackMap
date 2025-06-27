/**
 * Bulk Operations System for StackMap
 * Provides shared functionality for bulk delete and copy operations
 */

(function() {
    'use strict';
    
    const BulkOperations = {
        // State
        isActive: false,
        mode: null, // 'delete' | 'copy'
        selectedIds: new Set(),
        
        // UI Elements
        overlay: null,
        header: null,
        checkboxes: new Map(),
        
        // Event handlers (stored for cleanup)
        handlers: {
            cardClick: null,
            keyDown: null,
            headerActions: null
        },
        
        /**
         * Start bulk selection mode
         */
        start: function(actionType) {
            const self = this;
            
            if (self.isActive) {
                console.warn('BulkOperations: Already in bulk mode');
                return false;
            }
            
            // Validate action type
            if (!['delete', 'copy'].includes(actionType)) {
                console.error('BulkOperations: Invalid action type:', actionType);
                return false;
            }
            
            console.log('BulkOperations: Starting', actionType, 'mode');
            
            self.mode = actionType;
            self.isActive = true;
            self.selectedIds.clear();
            
            // Create UI
            self.createOverlay();
            self.createHeader();
            self.bindEvents();
            
            // Disable edit mode menu to prevent conflicts
            if (window.EditModeMenu && window.EditModeMenu.disable) {
                window.EditModeMenu.disable();
            }
            
            return true;
        },
        
        /**
         * Exit bulk selection mode
         */
        exit: function() {
            const self = this;
            
            if (!self.isActive) return;
            
            console.log('BulkOperations: Exiting bulk mode');
            
            // Clean up UI
            self.removeOverlay();
            self.removeHeader();
            self.unbindEvents();
            
            // Reset state
            self.isActive = false;
            self.mode = null;
            self.selectedIds.clear();
            self.checkboxes.clear();
            
            // Re-enable edit mode menu
            if (window.EditModeMenu && window.EditModeMenu.enable) {
                window.EditModeMenu.enable();
            }
        },
        
        /**
         * Create checkbox overlay on activity cards
         */
        createOverlay: function() {
            const self = this;
            
            // Find all activity cards
            const activityCards = document.querySelectorAll('.activity-card');
            
            activityCards.forEach(function(card) {
                const activityId = card.getAttribute('data-activity-id') || card.getAttribute('data-task-id');
                if (!activityId) return;
                
                // Create checkbox container
                const checkboxContainer = document.createElement('div');
                checkboxContainer.className = 'bulk-select-checkbox-container';
                
                // Create checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'bulk-select-checkbox';
                checkbox.setAttribute('data-activity-id', activityId);
                checkbox.setAttribute('aria-label', 'Select activity for ' + self.mode);
                
                // Touch-friendly container
                const checkboxWrapper = document.createElement('label');
                checkboxWrapper.className = 'bulk-select-checkbox-wrapper';
                checkboxWrapper.appendChild(checkbox);
                
                checkboxContainer.appendChild(checkboxWrapper);
                
                // Add to card
                card.style.position = 'relative';
                card.appendChild(checkboxContainer);
                
                // Store reference
                self.checkboxes.set(activityId, checkbox);
                
                // Add selection event
                checkbox.addEventListener('change', function(e) {
                    e.stopPropagation();
                    self.toggleSelection(activityId);
                });
            });
            
            // Add bulk mode class to body
            document.body.classList.add('bulk-operations-active');
        },
        
        /**
         * Remove checkbox overlay
         */
        removeOverlay: function() {
            const self = this;
            
            // Remove all checkbox containers
            const containers = document.querySelectorAll('.bulk-select-checkbox-container');
            containers.forEach(function(container) {
                container.remove();
            });
            
            // Remove bulk mode class
            document.body.classList.remove('bulk-operations-active');
        },
        
        /**
         * Create bulk operations header
         */
        createHeader: function() {
            const self = this;
            
            if (self.header) {
                self.header.remove();
            }
            
            const header = document.createElement('div');
            header.className = 'bulk-operations-header';
            header.innerHTML = `
                <div class="bulk-header-content">
                    <div class="bulk-header-left">
                        <button class="bulk-btn bulk-btn-cancel" data-action="cancel">
                            <span class="bulk-btn-icon">✕</span>
                            <span class="bulk-btn-label">Cancel</span>
                        </button>
                        <span class="bulk-selection-count">0 selected</span>
                    </div>
                    <div class="bulk-header-center">
                        <button class="bulk-btn bulk-btn-select-all" data-action="select-all">
                            Select All
                        </button>
                        <button class="bulk-btn bulk-btn-select-none" data-action="select-none" style="display: none;">
                            Select None
                        </button>
                    </div>
                    <div class="bulk-header-right">
                        <button class="bulk-btn bulk-btn-primary bulk-btn-action" data-action="execute" disabled>
                            <span class="bulk-btn-icon">${self.mode === 'delete' ? '🗑️' : '📋'}</span>
                            <span class="bulk-btn-label">${self.mode === 'delete' ? 'Delete' : 'Copy'}</span>
                        </button>
                    </div>
                </div>
            `;
            
            // Insert at top of main content
            const mainContent = document.querySelector('#main-view .content') || document.querySelector('.content');
            if (mainContent) {
                mainContent.insertBefore(header, mainContent.firstChild);
            } else {
                document.body.appendChild(header);
            }
            
            self.header = header;
            
            // Bind header events
            self.bindHeaderEvents();
        },
        
        /**
         * Remove bulk operations header
         */
        removeHeader: function() {
            const self = this;
            
            if (self.header) {
                self.header.remove();
                self.header = null;
            }
        },
        
        /**
         * Bind header button events
         */
        bindHeaderEvents: function() {
            const self = this;
            
            if (!self.header) return;
            
            self.handlers.headerActions = function(e) {
                const action = e.target.closest('[data-action]')?.getAttribute('data-action');
                
                switch (action) {
                    case 'cancel':
                        self.exit();
                        break;
                        
                    case 'select-all':
                        self.selectAll();
                        break;
                        
                    case 'select-none':
                        self.selectNone();
                        break;
                        
                    case 'execute':
                        self.executeAction();
                        break;
                }
            };
            
            self.header.addEventListener('click', self.handlers.headerActions);
        },
        
        /**
         * Bind global events
         */
        bindEvents: function() {
            const self = this;
            
            // Escape key to exit
            self.handlers.keyDown = function(e) {
                if (e.key === 'Escape') {
                    self.exit();
                }
            };
            
            document.addEventListener('keydown', self.handlers.keyDown);
            
            // Card clicks should toggle selection
            self.handlers.cardClick = function(e) {
                const card = e.target.closest('.activity-card');
                if (!card) return;
                
                const activityId = card.getAttribute('data-activity-id') || card.getAttribute('data-task-id');
                if (activityId && !e.target.closest('.bulk-select-checkbox-wrapper')) {
                    e.preventDefault();
                    self.toggleSelection(activityId);
                }
            };
            
            document.addEventListener('click', self.handlers.cardClick);
        },
        
        /**
         * Unbind global events
         */
        unbindEvents: function() {
            const self = this;
            
            if (self.handlers.keyDown) {
                document.removeEventListener('keydown', self.handlers.keyDown);
                self.handlers.keyDown = null;
            }
            
            if (self.handlers.cardClick) {
                document.removeEventListener('click', self.handlers.cardClick);
                self.handlers.cardClick = null;
            }
            
            if (self.handlers.headerActions && self.header) {
                self.header.removeEventListener('click', self.handlers.headerActions);
                self.handlers.headerActions = null;
            }
        },
        
        /**
         * Toggle selection of an activity
         */
        toggleSelection: function(activityId) {
            const self = this;
            
            if (self.selectedIds.has(activityId)) {
                self.selectedIds.delete(activityId);
            } else {
                self.selectedIds.add(activityId);
            }
            
            // Update checkbox state
            const checkbox = self.checkboxes.get(activityId);
            if (checkbox) {
                checkbox.checked = self.selectedIds.has(activityId);
            }
            
            // Update card visual state
            const card = document.querySelector(`[data-activity-id="${activityId}"], [data-task-id="${activityId}"]`);
            if (card) {
                card.classList.toggle('bulk-selected', self.selectedIds.has(activityId));
            }
            
            self.updateUI();
        },
        
        /**
         * Select all activities
         */
        selectAll: function() {
            const self = this;
            
            self.checkboxes.forEach(function(checkbox, activityId) {
                if (!self.selectedIds.has(activityId)) {
                    self.toggleSelection(activityId);
                }
            });
        },
        
        /**
         * Select no activities
         */
        selectNone: function() {
            const self = this;
            
            Array.from(self.selectedIds).forEach(function(activityId) {
                self.toggleSelection(activityId);
            });
        },
        
        /**
         * Update UI based on current selection
         */
        updateUI: function() {
            const self = this;
            
            if (!self.header) return;
            
            const count = self.selectedIds.size;
            const total = self.checkboxes.size;
            
            // Update count display
            const countEl = self.header.querySelector('.bulk-selection-count');
            if (countEl) {
                countEl.textContent = `${count} selected`;
            }
            
            // Update select all/none buttons
            const selectAllBtn = self.header.querySelector('.bulk-btn-select-all');
            const selectNoneBtn = self.header.querySelector('.bulk-btn-select-none');
            
            if (count === 0) {
                if (selectAllBtn) selectAllBtn.style.display = '';
                if (selectNoneBtn) selectNoneBtn.style.display = 'none';
            } else if (count === total) {
                if (selectAllBtn) selectAllBtn.style.display = 'none';
                if (selectNoneBtn) selectNoneBtn.style.display = '';
            } else {
                if (selectAllBtn) selectAllBtn.style.display = '';
                if (selectNoneBtn) selectNoneBtn.style.display = '';
            }
            
            // Update action button
            const actionBtn = self.header.querySelector('.bulk-btn-action');
            if (actionBtn) {
                actionBtn.disabled = count === 0;
                const label = actionBtn.querySelector('.bulk-btn-label');
                if (label) {
                    if (count === 0) {
                        label.textContent = self.mode === 'delete' ? 'Delete' : 'Copy';
                    } else {
                        label.textContent = `${self.mode === 'delete' ? 'Delete' : 'Copy'} ${count}`;
                    }
                }
            }
        },
        
        /**
         * Execute the selected action
         */
        executeAction: function() {
            const self = this;
            
            if (self.selectedIds.size === 0) {
                return;
            }
            
            // Get selected activities
            const selectedActivities = self.getSelectedActivities();
            
            if (self.mode === 'delete') {
                if (window.BulkDelete) {
                    window.BulkDelete.execute(selectedActivities, function() {
                        self.exit();
                    });
                }
            } else if (self.mode === 'copy') {
                if (window.CopyToTomorrow) {
                    window.CopyToTomorrow.execute(selectedActivities, function() {
                        self.exit();
                    });
                }
            }
        },
        
        /**
         * Get selected activity objects
         */
        getSelectedActivities: function() {
            const self = this;
            const activities = [];
            
            // Get activities from ActivityDisplay or TaskDisplay
            let allActivities = [];
            if (window.ActivityDisplay && window.ActivityDisplay.getActivities) {
                allActivities = window.ActivityDisplay.getActivities();
            } else if (window.TaskDisplay && window.TaskDisplay.getTasks) {
                allActivities = window.TaskDisplay.getTasks();
            }
            
            // Filter to selected
            allActivities.forEach(function(activity) {
                const id = activity.id || activity.task_id;
                if (self.selectedIds.has(String(id))) {
                    activities.push(activity);
                }
            });
            
            return activities;
        },
        
        /**
         * Check if bulk operations are currently active
         */
        isInBulkMode: function() {
            return this.isActive;
        },
        
        /**
         * Get current mode
         */
        getCurrentMode: function() {
            return this.mode;
        }
    };
    
    // Export to global scope
    window.BulkOperations = BulkOperations;
    
})();