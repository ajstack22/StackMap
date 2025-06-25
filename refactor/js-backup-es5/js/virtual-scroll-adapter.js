/**
 * Virtual Scrolling Adapter for StackMap
 * Integrates Clusterize.js with task-display.js for memory-efficient rendering
 * ES5 compatible for Android 5+ support
 */

(function() {
    'use strict';
    
    const VirtualScrollAdapter = {
        clusterize: null,
        container: null,
        scrollArea: null,
        contentArea: null,
        isEnabled: false,
        taskIdMap: {},  // Map task IDs to task objects for event handling
        taskIndexMap: {},  // Map task IDs to their position for quick lookup
        
        // Configuration
        config: {
            minTasksForVirtualScroll: 30,  // Enable virtual scrolling above this threshold
            rowsInBlock: 15,  // Number of rows to keep in DOM
            blocksInCluster: 2,  // Number of blocks in cluster
            showNoDataText: false,  // We handle empty state ourselves
            keepParity: false  // Don't maintain even/odd classes
        },
        
        /**
         * Check if virtual scrolling should be enabled
         */
        shouldEnable: function(taskCount) {
            // Check URL parameter for feature flag
            const urlParams = new URLSearchParams(window.location.search);
            const forceEnable = urlParams.get('virtual-scroll') === 'true';
            const forceDisable = urlParams.get('virtual-scroll') === 'false';
            
            if (forceDisable) return false;
            if (forceEnable) return true;
            
            // Enable for task counts above threshold
            return taskCount > this.config.minTasksForVirtualScroll;
        },
        
        /**
         * Initialize virtual scrolling for task container
         */
        init: function(container, tasks) {
            const self = this;
            
            // Check if we should enable
            if (!self.shouldEnable(tasks.length)) {
                return false;
            }
            
            // Check if Clusterize is available
            if (typeof Clusterize === 'undefined') {
                console.warn('VirtualScrollAdapter: Clusterize.js not loaded, falling back to traditional rendering');
                return false;
            }
            
            self.container = container;
            self.isEnabled = true;
            
            // Clear task maps
            self.taskIdMap = {};
            self.taskIndexMap = {};
            
            // Create scroll structure
            self.createScrollStructure();
            
            // Generate task rows
            const rows = self.generateTaskRows(tasks);
            
            // Initialize Clusterize
            try {
                self.clusterize = new Clusterize({
                    rows: rows,
                    scrollId: 'task-scroll-area',
                    contentId: 'task-content-area',
                    rows_in_block: self.config.rowsInBlock,
                    blocks_in_cluster: self.config.blocksInCluster,
                    show_no_data_text: self.config.showNoDataText,
                    keep_parity: self.config.keepParity,
                    callbacks: {
                        clusterChanged: function() {
                            self.onClusterChanged();
                        },
                        scrollingProgress: function(progress) {
                            self.updateScrollProgress(progress);
                        }
                    }
                });
                
                // Setup event delegation
                self.setupEventDelegation();
                
                // Update accessibility
                self.updateAccessibility();
                
                console.log(`VirtualScrollAdapter: Initialized with ${tasks.length} tasks`);
                return true;
                
            } catch (error) {
                console.error('VirtualScrollAdapter: Failed to initialize', error);
                self.destroy();
                return false;
            }
        },
        
        /**
         * Create the scroll structure required by Clusterize
         */
        createScrollStructure: function() {
            const self = this;
            
            // Clear container
            self.container.innerHTML = '';
            
            // Create scroll area
            self.scrollArea = document.createElement('div');
            self.scrollArea.id = 'task-scroll-area';
            self.scrollArea.className = 'clusterize-scroll task-scroll-area';
            self.scrollArea.setAttribute('role', 'region');
            self.scrollArea.setAttribute('aria-label', 'Task list');
            self.scrollArea.setAttribute('tabindex', '0');
            
            // Apply safe mode styles if needed
            if (window.StackMapSafeMode) {
                self.scrollArea.style.scrollBehavior = 'auto';  // Disable smooth scrolling
            }
            
            // Create content area
            self.contentArea = document.createElement('div');
            self.contentArea.id = 'task-content-area';
            self.contentArea.className = 'clusterize-content task-content-area';
            self.contentArea.setAttribute('role', 'list');
            
            // Assemble structure
            self.scrollArea.appendChild(self.contentArea);
            self.container.appendChild(self.scrollArea);
            
            // Add scroll progress indicator
            const progressBar = document.createElement('div');
            progressBar.className = 'scroll-progress-bar';
            progressBar.style.cssText = 'position: absolute; top: 0; left: 0; height: 2px; background: #4a90e2; width: 0%; transition: width 0.1s ease; z-index: 10;';
            self.container.insertBefore(progressBar, self.scrollArea);
        },
        
        /**
         * Generate HTML rows for tasks
         */
        generateTaskRows: function(tasks) {
            const self = this;
            const rows = [];
            
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                const row = self.taskToHTML(task);
                rows.push(row);
                
                // Store task in ID map
                self.taskIdMap[task.id] = task;
                // Store position in index map
                self.taskIndexMap[task.id] = i + 1;  // 1-based for ARIA
            }
            
            return rows;
        },
        
        /**
         * Convert task object to HTML string
         */
        taskToHTML: function(task) {
            const self = this;
            const isEditMode = window.EditMode && window.EditMode.isActive();
            const touchTargetSize = window.StackMapSafeMode ? 60 : 44;
            
            // Build HTML string (matching task-display.js structure)
            let html = `<div class="task-item" role="listitem" data-task-id="${task.id}" `;
            html += 'style="background: #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 12px; ';
            html += `min-height: ${touchTargetSize}px; display: flex; align-items: center; gap: 12px;">`;
            
            // Checkbox
            html += '<input type="checkbox" class="task-checkbox" ';
            html += `aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}" `;
            html += task.completed ? 'checked ' : '';
            html += 'style="width: 24px; height: 24px; flex-shrink: 0; cursor: pointer;">';
            
            // Task content
            html += '<div class="task-content" style="flex: 1; min-width: 0;">';
            html += '<div style="display: flex; align-items: center; gap: 8px;">';
            
            // Icon
            if (task.icon) {
                html += `<span class="task-icon" style="font-size: 20px; flex-shrink: 0;">${task.icon}</span>`;
            }
            
            // Title
            html += '<div class="task-title" style="font-size: 16px; color: ';
            html += task.completed ? '#666' : '#fff';
            html += '; text-decoration: ';
            html += task.completed ? 'line-through' : 'none';
            html += '; cursor: pointer; word-break: break-word; flex: 1;">';
            html += self.escapeHtml(task.title);
            html += '</div>';
            html += '</div>';
            
            // Priority indicator
            if (task.priority === 'high') {
                html += '<div class="task-priority" style="font-size: 12px; color: #e53e3e; margin-top: 4px; font-weight: 600;">High Priority</div>';
            }
            
            html += '</div>';
            
            // Actions (only in edit mode)
            if (isEditMode) {
                html += '<div class="task-actions" style="display: flex; align-items: center; gap: 8px;">';
                
                // Reorder handle
                html += '<div class="reorder-handle" aria-label="Reorder task" ';
                html += 'style="width: 32px; height: 32px; display: flex; align-items: center; ';
                html += 'justify-content: center; color: #666; cursor: grab; font-size: 18px; user-select: none;">≡</div>';
                
                // Edit button
                html += '<button class="task-edit" aria-label="Edit task" ';
                html += `style="width: ${touchTargetSize}px; height: ${touchTargetSize}px; `;
                html += 'background: #444; border: none; border-radius: 50%; color: #fff; font-size: 20px; ';
                html += 'cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">✏️</button>';
                
                // Delete button
                html += '<button class="task-delete" aria-label="Delete task" ';
                html += `style="width: ${touchTargetSize}px; height: ${touchTargetSize}px; `;
                html += 'background: #444; border: none; border-radius: 50%; color: #fff; font-size: 24px; ';
                html += 'cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">×</button>';
                
                html += '</div>';
            }
            
            html += '</div>';
            
            return html;
        },
        
        /**
         * Escape HTML for safe rendering
         */
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        /**
         * Setup event delegation for recycled elements
         */
        setupEventDelegation: function() {
            const self = this;
            
            // Remove any existing listeners
            if (self.contentArea._delegatedClick) {
                self.contentArea.removeEventListener('click', self.contentArea._delegatedClick);
            }
            
            // Create delegated click handler
            self.contentArea._delegatedClick = function(event) {
                const target = event.target;
                
                // Find task element
                const taskElement = target.closest('.task-item');
                if (!taskElement) return;
                
                const taskId = taskElement.getAttribute('data-task-id');
                const task = self.taskIdMap[taskId];
                if (!task) return;
                
                // Handle checkbox
                if (target.classList.contains('task-checkbox')) {
                    task.completed = target.checked;
                    if (window.TaskDisplay) {
                        window.TaskDisplay.updateTask(task);
                    }
                    return;
                }
                
                // Handle edit button
                if (target.classList.contains('task-edit')) {
                    if (window.TaskDisplay) {
                        window.TaskDisplay.startEditing(task);
                    }
                    return;
                }
                
                // Handle delete button
                if (target.classList.contains('task-delete')) {
                    if (window.TaskDisplay) {
                        window.TaskDisplay.deleteTask(task);
                    }
                    return;
                }
                
                // Handle title click (edit in edit mode)
                if (target.classList.contains('task-title')) {
                    if (window.EditMode && window.EditMode.isActive() && window.TaskDisplay) {
                        window.TaskDisplay.startEditing(task);
                    }
                    return;
                }
            };
            
            // Add delegated listener
            self.contentArea.addEventListener('click', self.contentArea._delegatedClick);
            
            // Track for cleanup
            if (window.TaskDisplay && window.TaskDisplay.trackEventListener) {
                window.TaskDisplay.trackEventListener(self.contentArea, 'click', self.contentArea._delegatedClick);
            }
        },
        
        /**
         * Handle cluster change
         */
        onClusterChanged: function() {
            const self = this;
            
            // Notify keyboard navigation before cluster change
            if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.beforeVirtualUpdate) {
                window.StackMapKeyboardNav.beforeVirtualUpdate();
            }
            
            // Update accessibility attributes
            self.updateAccessibility();
            
            // Dispatch event for other components
            document.dispatchEvent(new CustomEvent('virtualScrollClusterChanged'));
            
            // Update keyboard navigation
            document.dispatchEvent(new CustomEvent('tasksUpdated'));
            
            // Restore focus after cluster change
            setTimeout(function() {
                if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.afterVirtualUpdate) {
                    window.StackMapKeyboardNav.afterVirtualUpdate();
                }
            }, 50);
        },
        
        /**
         * Update scroll progress indicator
         */
        updateScrollProgress: function(progress) {
            const progressBar = this.container.querySelector('.scroll-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${progress * 100}%`;
            }
        },
        
        /**
         * Update accessibility attributes
         */
        updateAccessibility: function() {
            const self = this;
            const visibleTasks = self.contentArea.querySelectorAll('.task-item');
            const totalTasks = Object.keys(self.taskIdMap).length;
            
            // Update ARIA attributes on visible items
            for (let i = 0; i < visibleTasks.length; i++) {
                const taskElement = visibleTasks[i];
                const taskId = taskElement.getAttribute('data-task-id');
                
                // Use optimized index map for position lookup
                const position = self.taskIndexMap[taskId] || 0;
                
                taskElement.setAttribute('aria-posinset', position);
                taskElement.setAttribute('aria-setsize', totalTasks);
            }
            
            // Update live region with current position
            const firstVisible = visibleTasks[0];
            if (firstVisible) {
                const firstPos = firstVisible.getAttribute('aria-posinset');
                self.announcePosition(firstPos, totalTasks);
            }
        },
        
        /**
         * Announce current position for screen readers
         */
        announcePosition: function(position, total) {
            let liveRegion = document.getElementById('virtual-scroll-live-region');
            if (!liveRegion) {
                liveRegion = document.createElement('div');
                liveRegion.id = 'virtual-scroll-live-region';
                liveRegion.setAttribute('aria-live', 'polite');
                liveRegion.setAttribute('aria-atomic', 'true');
                liveRegion.className = 'sr-only';
                document.body.appendChild(liveRegion);
            }
            
            // Debounce announcements
            if (this._announceTimer) {
                clearTimeout(this._announceTimer);
            }
            
            this._announceTimer = setTimeout(function() {
                liveRegion.textContent = `Showing tasks starting from ${position} of ${total}`;
            }, 300);
        },
        
        /**
         * Update with new tasks
         */
        update: function(tasks) {
            const self = this;
            
            if (!self.isEnabled || !self.clusterize) {
                return false;
            }
            
            // Notify keyboard navigation before update
            if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.beforeVirtualUpdate) {
                window.StackMapKeyboardNav.beforeVirtualUpdate();
            }
            
            // Clear and rebuild task maps
            self.taskIdMap = {};
            self.taskIndexMap = {};
            
            // Generate new rows
            const rows = self.generateTaskRows(tasks);
            
            // Update Clusterize
            self.clusterize.update(rows);
            
            // Update accessibility
            self.updateAccessibility();
            
            // Notify keyboard navigation after update
            setTimeout(function() {
                if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.afterVirtualUpdate) {
                    window.StackMapKeyboardNav.afterVirtualUpdate();
                }
            }, 100);
            
            return true;
        },
        
        /**
         * Destroy virtual scrolling and cleanup
         */
        destroy: function() {
            const self = this;
            
            // Destroy Clusterize instance
            if (self.clusterize) {
                self.clusterize.destroy(true);
                self.clusterize = null;
            }
            
            // Remove event listeners
            if (self.contentArea && self.contentArea._delegatedClick) {
                self.contentArea.removeEventListener('click', self.contentArea._delegatedClick);
            }
            
            // Clear timers
            if (self._announceTimer) {
                clearTimeout(self._announceTimer);
            }
            
            // Clear references
            self.container = null;
            self.scrollArea = null;
            self.contentArea = null;
            self.taskIdMap = {};
            self.isEnabled = false;
        },
        
        /**
         * Check if virtual scrolling is active
         */
        isActive: function() {
            return this.isEnabled && this.clusterize !== null;
        }
    };
    
    // Export to global scope
    window.VirtualScrollAdapter = VirtualScrollAdapter;
    
})();