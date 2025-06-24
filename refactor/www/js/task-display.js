/**
 * Task Display Module for StackMap
 * Handles rendering and CRUD operations for tasks
 * Mobile-first design with ADHD/autism accommodations
 */

(function() {
    'use strict';
    
    var TaskDisplay = {
        container: null,
        tasks: [],
        editingTaskId: null,
        autoSaveTimer: null,
        isInitialized: false,
        
        // Safe mode configuration
        safeMode: window.StackMapSafeMode || false,
        touchTargetSize: window.StackMapSafeMode ? 60 : 44,
        
        // Event listener tracking for cleanup
        eventListeners: [],
        globalKeyHandler: null,
        
        /**
         * Initialize the task display
         */
        init: function() {
            var self = this;
            
            // Find container
            self.container = document.getElementById('task-container');
            if (!self.container) {
                console.error('TaskDisplay: Container not found');
                return;
            }
            
            // Load tasks from storage
            self.loadTasks(function(success) {
                if (success) {
                    self.render();
                    self.setupEventListeners();
                    self.isInitialized = true;
                    
                    // Listen for edit mode changes
                    if (window.EditMode) {
                        window.EditMode.on('change', function() {
                            self.render();
                        });
                    }
                } else {
                    self.showError('Unable to load tasks');
                }
            });
        },
        
        /**
         * Load tasks from storage (SQLite or localStorage)
         */
        loadTasks: function(callback) {
            var self = this;
            
            // Try SQLite first if available
            if (window.TaskSQLite && window.TaskSQLite.isReady) {
                window.TaskSQLite.getTasks(function(tasks, error) {
                    if (error) {
                        console.warn('TaskDisplay: SQLite error, falling back to localStorage', error);
                        self.loadFromLocalStorage(callback);
                    } else {
                        self.tasks = tasks || [];
                        if (callback) callback(true);
                    }
                });
            } else {
                // Fallback to localStorage
                self.loadFromLocalStorage(callback);
            }
        },
        
        /**
         * Load tasks from localStorage fallback
         */
        loadFromLocalStorage: function(callback) {
            var self = this;
            
            try {
                var stored = localStorage.getItem('stackmap_tasks');
                var allTasks = stored ? JSON.parse(stored) : [];
                
                // Filter tasks by current user
                self.tasks = self.filterTasksByUser(allTasks);
                
                if (callback) callback(true);
            } catch (error) {
                console.error('TaskDisplay: localStorage error', error);
                self.tasks = [];
                if (callback) callback(false);
            }
        },
        
        /**
         * Save tasks to storage
         */
        saveTasks: function(callback) {
            var self = this;
            
            // Clear any existing auto-save timer
            if (self.autoSaveTimer) {
                clearTimeout(self.autoSaveTimer);
            }
            
            // Set new auto-save timer (2 seconds)
            self.autoSaveTimer = setTimeout(function() {
                self.performSave(callback);
            }, 2000);
        },
        
        /**
         * Perform the actual save operation
         */
        performSave: function(callback) {
            var self = this;
            
            // Try SQLite first if available
            if (window.TaskSQLite && window.TaskSQLite.isReady) {
                // For now, save to localStorage as SQLite implementation needs the full CRUD
                self.saveToLocalStorage(callback);
            } else {
                self.saveToLocalStorage(callback);
            }
        },
        
        /**
         * Save to localStorage
         */
        saveToLocalStorage: function(callback) {
            var self = this;
            
            try {
                localStorage.setItem('stackmap_tasks', JSON.stringify(self.tasks));
                if (callback) callback(true);
            } catch (error) {
                console.error('TaskDisplay: Save failed', error);
                if (callback) callback(false);
            }
        },
        
        /**
         * Render all tasks
         */
        render: function() {
            var self = this;
            
            // Clear container
            self.container.innerHTML = '';
            
            // Clear timer button cache when re-rendering
            if (window.TaskTimer && window.TaskTimer.clearButtonCache) {
                window.TaskTimer.clearButtonCache();
            }
            
            // Add new task button and browse activities button (only in edit mode)
            if (window.EditMode && window.EditMode.isActive()) {
                var editButtonsContainer = document.createElement('div');
                editButtonsContainer.className = 'edit-buttons-container';
                editButtonsContainer.style.cssText = 'display: flex; gap: 12px; margin-bottom: 16px;';
                
                // Add Task button
                var addButton = self.createAddButton();
                addButton.style.marginBottom = '0';
                editButtonsContainer.appendChild(addButton);
                
                // Browse Activities button
                var browseButton = self.createBrowseActivitiesButton();
                editButtonsContainer.appendChild(browseButton);
                
                self.container.appendChild(editButtonsContainer);
            }
            
            // Filter tasks for current user
            var userTasks = self.getUserTasks();
            
            // Render tasks
            if (userTasks.length === 0) {
                var emptyMessage = document.createElement('div');
                emptyMessage.className = 'task-empty-message';
                emptyMessage.textContent = 'No tasks yet. Tap + to add one.';
                emptyMessage.style.cssText = 'text-align: center; padding: 40px 20px; color: #999;';
                self.container.appendChild(emptyMessage);
            } else {
                // Try virtual scrolling for large task lists
                if (window.VirtualScrollAdapter && window.VirtualScrollAdapter.shouldEnable(userTasks.length)) {
                    // Create a wrapper div for virtual scrolling
                    var virtualContainer = document.createElement('div');
                    virtualContainer.className = 'virtual-scroll-container';
                    virtualContainer.style.cssText = 'height: 100%; position: relative;';
                    self.container.appendChild(virtualContainer);
                    
                    // Initialize virtual scrolling
                    var initialized = window.VirtualScrollAdapter.init(virtualContainer, userTasks);
                    
                    if (!initialized) {
                        // Fallback to traditional rendering if virtual scrolling fails
                        self.container.removeChild(virtualContainer);
                        self.renderTraditional(userTasks);
                    }
                } else {
                    // Use traditional rendering for small lists
                    self.renderTraditional(userTasks);
                }
            }
            
            // Notify keyboard navigation that tasks have been updated
            document.dispatchEvent(new CustomEvent('tasksUpdated'));
        },
        
        /**
         * Traditional rendering for small task lists
         */
        renderTraditional: function(userTasks) {
            var self = this;
            
            // Use DocumentFragment for batch DOM operations
            var fragment = document.createDocumentFragment();
            
            userTasks.forEach(function(task) {
                var taskElement = self.createTaskElement(task);
                fragment.appendChild(taskElement);
            });
            
            // Single DOM operation instead of N operations
            self.container.appendChild(fragment);
        },
        
        /**
         * Create add task button
         */
        createAddButton: function() {
            var self = this;
            
            var button = document.createElement('button');
            button.className = 'task-add-button';
            button.setAttribute('aria-label', 'Add new task');
            button.textContent = '+ Add Task';
            
            // Apply safe mode styles
            button.style.cssText = 
                'width: 100%;' +
                'min-height: ' + self.touchTargetSize + 'px;' +
                'padding: 16px;' +
                'margin-bottom: 16px;' +
                'background: #333;' +
                'border: 2px dashed #666;' +
                'border-radius: 8px;' +
                'color: #fff;' +
                'font-size: 16px;' +
                'cursor: pointer;' +
                'transition: ' + (self.safeMode ? 'none' : 'all 0.2s ease;');
            
            button.onclick = function() {
                self.addTask();
            };
            
            return button;
        },
        
        /**
         * Create browse activities button
         */
        createBrowseActivitiesButton: function() {
            var self = this;
            
            var button = document.createElement('button');
            button.className = 'browse-activities-button';
            button.setAttribute('aria-label', 'Browse activity library');
            button.textContent = '📚 Browse Activities';
            
            // Apply safe mode styles
            button.style.cssText = 
                'width: 100%;' +
                'min-height: ' + self.touchTargetSize + 'px;' +
                'padding: 16px;' +
                'margin-bottom: 16px;' +
                'background: #4a90e2;' +
                'border: none;' +
                'border-radius: 8px;' +
                'color: #fff;' +
                'font-size: 16px;' +
                'cursor: pointer;' +
                'transition: ' + (self.safeMode ? 'none' : 'all 0.2s ease;');
            
            button.onclick = function() {
                if (window.ActivityLibrary) {
                    window.ActivityLibrary.show();
                } else {
                    console.error('Activity Library not loaded');
                }
            };
            
            return button;
        },
        
        /**
         * Create task element
         */
        createTaskElement: function(task) {
            var self = this;
            
            var taskEl = document.createElement('div');
            taskEl.className = 'task-item';
            taskEl.setAttribute('data-task-id', task.id);
            
            // Apply safe mode styles
            taskEl.style.cssText = 
                'background: #2a2a2a;' +
                'border-radius: 8px;' +
                'padding: 16px;' +
                'margin-bottom: 12px;' +
                'min-height: ' + self.touchTargetSize + 'px;' +
                'display: flex;' +
                'align-items: center;' +
                'gap: 12px;';
            
            // Checkbox
            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.setAttribute('aria-label', 'Mark task as ' + (task.completed ? 'incomplete' : 'complete'));
            checkbox.style.cssText = 
                'width: 24px;' +
                'height: 24px;' +
                'flex-shrink: 0;' +
                'cursor: pointer;';
            
            checkbox.onchange = function() {
                task.completed = checkbox.checked;
                self.updateTask(task);
            };
            
            // Task content
            var content = document.createElement('div');
            content.className = 'task-content';
            content.style.cssText = 'flex: 1; min-width: 0;';
            
            if (self.editingTaskId === task.id) {
                // Edit mode
                var input = document.createElement('input');
                input.type = 'text';
                input.value = task.title;
                input.className = 'task-edit-input';
                input.style.cssText = 
                    'width: 100%;' +
                    'padding: 8px;' +
                    'background: #1a1a1a;' +
                    'border: 1px solid #444;' +
                    'border-radius: 4px;' +
                    'color: #fff;' +
                    'font-size: 16px;';
                
                input.onblur = function() {
                    self.finishEditing(task, input.value);
                };
                
                input.onkeydown = function(e) {
                    if (e.key === 'Enter') {
                        self.finishEditing(task, input.value);
                    } else if (e.key === 'Escape') {
                        self.cancelEditing();
                    }
                };
                
                content.appendChild(input);
                
                // Focus input after render
                setTimeout(function() {
                    input.focus();
                    input.select();
                }, 0);
            } else {
                // View mode - show icon and title
                var titleContainer = document.createElement('div');
                titleContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';
                
                // Task icon
                if (task.icon) {
                    var icon = document.createElement('span');
                    icon.className = 'task-icon';
                    icon.textContent = task.icon;
                    icon.style.cssText = 'font-size: 20px; flex-shrink: 0;';
                    titleContainer.appendChild(icon);
                }
                
                var title = document.createElement('div');
                title.className = 'task-title';
                title.textContent = task.title;
                title.style.cssText = 
                    'font-size: 16px;' +
                    'color: ' + (task.completed ? '#666' : '#fff') + ';' +
                    'text-decoration: ' + (task.completed ? 'line-through' : 'none') + ';' +
                    'cursor: pointer;' +
                    'word-break: break-word;' +
                    'flex: 1;';
                
                title.onclick = function() {
                    // Only allow editing in edit mode
                    if (window.EditMode && window.EditMode.isActive()) {
                        self.startEditing(task);
                    }
                };
                
                titleContainer.appendChild(title);
                content.appendChild(titleContainer);
                
                // Show priority indicator if high priority
                if (task.priority === 'high') {
                    var priority = document.createElement('div');
                    priority.className = 'task-priority';
                    priority.style.cssText = 
                        'font-size: 12px;' +
                        'color: #e53e3e;' +
                        'margin-top: 4px;' +
                        'font-weight: 600;';
                    priority.textContent = 'High Priority';
                    content.appendChild(priority);
                }
            }
            
            // Task actions container (delete, edit, reorder, timer)
            var actionsContainer = document.createElement('div');
            actionsContainer.className = 'task-actions';
            actionsContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';
            
            // Add timer button (always visible, not just in edit mode)
            if (window.TaskTimer) {
                var timerButton = document.createElement('button');
                timerButton.className = 'task-timer-button';
                timerButton.setAttribute('data-task-id', task.id);
                
                var existingTimer = window.TaskTimer.getTimer(task.id);
                if (existingTimer) {
                    timerButton.innerHTML = '⏱️ ' + window.TaskTimer.formatTime(existingTimer.remaining);
                    timerButton.classList.add('active');
                    if (existingTimer.remaining === 0) {
                        timerButton.classList.add('complete');
                    } else if (existingTimer.remaining <= 60) {
                        timerButton.classList.add('warning');
                    }
                    if (existingTimer.isPaused) {
                        timerButton.classList.add('paused');
                    }
                } else {
                    timerButton.innerHTML = '⏱️';
                }
                
                timerButton.onclick = function(e) {
                    e.stopPropagation();
                    window.TaskTimer.showTimerMenu(task.id, timerButton);
                };
                
                actionsContainer.appendChild(timerButton);
            }
            
            // Only show edit/delete actions in edit mode
            if (window.EditMode && window.EditMode.isActive()) {
                // Reorder handle
                var reorderHandle = document.createElement('div');
                reorderHandle.className = 'reorder-handle';
                reorderHandle.innerHTML = '≡';
                reorderHandle.setAttribute('aria-label', 'Reorder task');
                reorderHandle.style.cssText = 
                    'width: 32px;' +
                    'height: 32px;' +
                    'display: flex;' +
                    'align-items: center;' +
                    'justify-content: center;' +
                    'color: #666;' +
                    'cursor: grab;' +
                    'font-size: 18px;' +
                    'user-select: none;';
                actionsContainer.appendChild(reorderHandle);
                
                // Edit button
                var editBtn = document.createElement('button');
                editBtn.className = 'task-edit';
                editBtn.setAttribute('aria-label', 'Edit task');
                editBtn.innerHTML = '✏️';
                editBtn.style.cssText = 
                    'width: ' + self.touchTargetSize + 'px;' +
                    'height: ' + self.touchTargetSize + 'px;' +
                    'background: #444;' +
                    'border: none;' +
                    'border-radius: 50%;' +
                    'color: #fff;' +
                    'font-size: 20px;' +
                    'cursor: pointer;' +
                    'flex-shrink: 0;' +
                    'display: flex;' +
                    'align-items: center;' +
                    'justify-content: center;';
                
                editBtn.onclick = function() {
                    self.startEditing(task);
                };
                
                actionsContainer.appendChild(editBtn);
                
                // Delete button
                var deleteBtn = document.createElement('button');
                deleteBtn.className = 'task-delete';
                deleteBtn.setAttribute('aria-label', 'Delete task');
                deleteBtn.textContent = '×';
                deleteBtn.style.cssText = 
                    'width: ' + self.touchTargetSize + 'px;' +
                    'height: ' + self.touchTargetSize + 'px;' +
                    'background: #444;' +
                    'border: none;' +
                    'border-radius: 50%;' +
                    'color: #fff;' +
                    'font-size: 24px;' +
                    'cursor: pointer;' +
                    'flex-shrink: 0;' +
                    'display: flex;' +
                    'align-items: center;' +
                    'justify-content: center;';
                
                deleteBtn.onclick = function() {
                    self.deleteTask(task);
                };
                
                actionsContainer.appendChild(deleteBtn);
            }
            
            taskEl.appendChild(checkbox);
            taskEl.appendChild(content);
            taskEl.appendChild(actionsContainer);
            
            return taskEl;
        },
        
        /**
         * Add new task
         */
        addTask: function() {
            var self = this;
            
            // Get current user ID
            var userId = null;
            if (window.UserManager) {
                var currentUser = window.UserManager.getCurrentUser();
                userId = currentUser ? currentUser.id : null;
            }
            
            var newTask = {
                id: 'task_' + Date.now(),
                title: '',
                description: '',
                icon: '✓',  // Default checkmark icon
                category: '',
                priority: 'medium',  // low, medium, high
                completed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                user_id: userId,
                // Optional fields
                due_date: null,
                reminder: null,
                tags: [],
                order: Date.now(),  // For manual sorting
                attachments: []  // Array of attachment IDs
            };
            
            self.tasks.unshift(newTask);
            self.render();
            
            // Start editing immediately
            self.startEditing(newTask);
        },
        
        /**
         * Start editing a task
         */
        startEditing: function(task) {
            var self = this;
            
            // Use modal for full edit form
            if (window.Modal) {
                self.showEditModal(task);
            } else {
                // Fallback to inline editing
                self.editingTaskId = task.id;
                self.render();
            }
        },
        
        /**
         * Show edit modal with full form
         */
        showEditModal: function(task) {
            var self = this;
            
            // Create form content
            var formHtml = self.createEditForm(task);
            
            // Show modal
            var modal = window.Modal.show({
                title: task.title ? 'Edit Task' : 'New Task',
                content: formHtml,
                className: 'task-edit-modal',
                onClose: function() {
                    // Clean up auto-save draft
                    self.clearDraft(task.id);
                    // Clean up modal-specific event listeners
                    self.cleanupModalListeners();
                }
            });
            
            // Setup form handlers
            self.setupEditFormHandlers(modal, task);
            
            // Load draft if exists
            self.loadDraft(task.id);
        },
        
        /**
         * Create edit form HTML
         */
        createEditForm: function(task) {
            var self = this;
            
            var html = '<form id="task-edit-form" class="task-edit-form">';
            
            // Title field
            html += '<div class="form-field">';
            html += '<label for="task-title">Title <span class="required">*</span></label>';
            html += '<input type="text" id="task-title" name="title" value="' + (task.title || '') + '" required>';
            html += '</div>';
            
            // Icon picker
            html += '<div class="form-field">';
            html += '<label>Icon</label>';
            html += '<div class="icon-picker" id="icon-picker">';
            var icons = ['✓', '🌅', '☕', '🚿', '🪥', '🍳', '💊', '🏃', '📚', '🎮', '📱', '💻', '🛏️', '🍽️', '📝', '🎯', '⏰', '💤', '🧘'];
            for (var i = 0; i < icons.length; i++) {
                var selected = icons[i] === task.icon ? ' selected' : '';
                html += '<button type="button" class="icon-option' + selected + '" data-icon="' + icons[i] + '">' + icons[i] + '</button>';
            }
            html += '</div>';
            html += '</div>';
            
            // Category dropdown
            html += '<div class="form-field">';
            html += '<label for="task-category">Category</label>';
            html += '<select id="task-category" name="category">';
            html += '<option value="">No category</option>';
            if (window.defaultActivities && window.defaultActivities.categories) {
                for (var j = 0; j < window.defaultActivities.categories.length; j++) {
                    var cat = window.defaultActivities.categories[j];
                    var catSelected = cat.id === task.category ? ' selected' : '';
                    html += '<option value="' + cat.id + '"' + catSelected + '>' + cat.name + '</option>';
                }
            }
            html += '</select>';
            html += '</div>';
            
            // Priority radio buttons
            html += '<div class="form-field">';
            html += '<label>Priority</label>';
            html += '<div class="priority-options">';
            var priorities = [
                { value: 'high', label: 'High', color: '#e53e3e' },
                { value: 'medium', label: 'Medium', color: '#ed8936' },
                { value: 'low', label: 'Low', color: '#48bb78' }
            ];
            for (var k = 0; k < priorities.length; k++) {
                var p = priorities[k];
                var pChecked = task.priority === p.value ? ' checked' : '';
                html += '<label class="priority-option">';
                html += '<input type="radio" name="priority" value="' + p.value + '"' + pChecked + '>';
                html += '<span style="color: ' + p.color + '">' + p.label + '</span>';
                html += '</label>';
            }
            html += '</div>';
            html += '</div>';
            
            // Description
            html += '<div class="form-field">';
            html += '<label for="task-description">Description</label>';
            html += '<textarea id="task-description" name="description" rows="4">' + (task.description || '') + '</textarea>';
            html += '</div>';
            
            // Form actions
            html += '<div class="form-actions">';
            html += '<button type="button" class="btn-secondary" id="cancel-btn">Cancel</button>';
            html += '<button type="submit" class="btn-primary">Save</button>';
            html += '</div>';
            
            html += '</form>';
            
            return html;
        },
        
        /**
         * Setup edit form handlers
         */
        setupEditFormHandlers: function(modal, task) {
            var self = this;
            
            // Get form element
            var form = modal.querySelector('#task-edit-form');
            if (!form) return;
            
            // Auto-save on input
            var autoSaveInputs = form.querySelectorAll('input, textarea, select');
            var autoSaveHandler = function() {
                self.saveDraft(task.id, form);
            };
            
            for (var i = 0; i < autoSaveInputs.length; i++) {
                autoSaveInputs[i].addEventListener('input', autoSaveHandler);
                self.trackEventListener(autoSaveInputs[i], 'input', autoSaveHandler);
            }
            
            // Icon picker
            var iconButtons = form.querySelectorAll('.icon-option');
            var iconClickHandler = function(e) {
                e.preventDefault();
                // Remove selected from all
                for (var k = 0; k < iconButtons.length; k++) {
                    iconButtons[k].classList.remove('selected');
                }
                // Add selected to this one
                this.classList.add('selected');
                // Save draft
                self.saveDraft(task.id, form);
            };
            
            for (var j = 0; j < iconButtons.length; j++) {
                iconButtons[j].addEventListener('click', iconClickHandler);
                self.trackEventListener(iconButtons[j], 'click', iconClickHandler);
            }
            
            // Cancel button
            var cancelBtn = form.querySelector('#cancel-btn');
            if (cancelBtn) {
                var cancelHandler = function() {
                    // Check if new task without title
                    if (!task.title && !form.title.value.trim()) {
                        // Remove the task
                        var index = self.tasks.indexOf(task);
                        if (index > -1) {
                            self.tasks.splice(index, 1);
                        }
                    }
                    window.Modal.close();
                    self.render();
                };
                
                cancelBtn.addEventListener('click', cancelHandler);
                self.trackEventListener(cancelBtn, 'click', cancelHandler);
            }
            
            // Form submit
            var submitHandler = function(e) {
                e.preventDefault();
                
                // Get form data
                var formData = self.getFormData(form);
                
                // Validate
                if (!formData.title.trim()) {
                    alert('Title is required');
                    return;
                }
                
                // Update task
                task.title = formData.title.trim();
                task.description = formData.description;
                task.icon = formData.icon;
                task.category = formData.category;
                task.priority = formData.priority;
                task.updated_at = new Date().toISOString();
                
                // Save and close
                self.saveTasks();
                self.clearDraft(task.id);
                window.Modal.close();
                self.render();
            };
            
            form.addEventListener('submit', submitHandler);
            self.trackEventListener(form, 'submit', submitHandler);
        },
        
        /**
         * Get form data
         */
        getFormData: function(form) {
            var data = {
                title: form.title.value || '',
                description: form.description.value || '',
                category: form.category.value || '',
                priority: form.priority.value || 'medium',
                icon: '✓'
            };
            
            // Get selected icon
            var selectedIcon = form.querySelector('.icon-option.selected');
            if (selectedIcon) {
                data.icon = selectedIcon.getAttribute('data-icon');
            }
            
            return data;
        },
        
        /**
         * Save draft to localStorage
         */
        saveDraft: function(taskId, form) {
            var self = this;
            var draftKey = 'stackmap_task_draft_' + taskId;
            
            try {
                var draftData = self.getFormData(form);
                localStorage.setItem(draftKey, JSON.stringify(draftData));
            } catch (error) {
                console.warn('Failed to save draft:', error);
            }
        },
        
        /**
         * Load draft from localStorage
         */
        loadDraft: function(taskId) {
            var self = this;
            var draftKey = 'stackmap_task_draft_' + taskId;
            
            try {
                var draftData = localStorage.getItem(draftKey);
                if (draftData) {
                    var draft = JSON.parse(draftData);
                    var form = document.getElementById('task-edit-form');
                    if (form && draft) {
                        // Restore form values
                        if (draft.title) form.title.value = draft.title;
                        if (draft.description) form.description.value = draft.description;
                        if (draft.category) form.category.value = draft.category;
                        if (draft.priority) form.priority.value = draft.priority;
                        
                        // Restore icon selection
                        if (draft.icon) {
                            var iconButtons = form.querySelectorAll('.icon-option');
                            for (var i = 0; i < iconButtons.length; i++) {
                                if (iconButtons[i].getAttribute('data-icon') === draft.icon) {
                                    iconButtons[i].classList.add('selected');
                                } else {
                                    iconButtons[i].classList.remove('selected');
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to load draft:', error);
            }
        },
        
        /**
         * Clear draft
         */
        clearDraft: function(taskId) {
            var draftKey = 'stackmap_task_draft_' + taskId;
            try {
                localStorage.removeItem(draftKey);
            } catch (error) {
                console.warn('Failed to clear draft:', error);
            }
        },
        
        /**
         * Finish editing (inline mode)
         */
        finishEditing: function(task, newTitle) {
            var self = this;
            
            newTitle = newTitle.trim();
            
            if (newTitle) {
                task.title = newTitle;
                task.updated_at = new Date().toISOString();
                self.saveTasks();
            } else if (!task.title) {
                // Remove empty new task
                var index = self.tasks.indexOf(task);
                if (index > -1) {
                    self.tasks.splice(index, 1);
                }
            }
            
            self.editingTaskId = null;
            self.render();
        },
        
        /**
         * Cancel editing
         */
        cancelEditing: function() {
            var self = this;
            
            // Remove empty new tasks
            self.tasks = self.tasks.filter(function(task) {
                return task.title || task.id !== self.editingTaskId;
            });
            
            self.editingTaskId = null;
            self.render();
        },
        
        /**
         * Update task
         */
        updateTask: function(task) {
            var self = this;
            var wasCompleted = task.completed_at ? true : false;
            var isFirstCompletion = !wasCompleted && task.completed;
            
            task.updated_at = new Date().toISOString();
            if (task.completed) {
                task.completed_at = new Date().toISOString();
            } else {
                task.completed_at = null;
            }
            
            // Save first to ensure data persistence
            self.saveTasks();
            
            // Trigger celebration for first-time completion
            if (isFirstCompletion && window.CelebrationSystem) {
                // Find the task element in DOM before re-render
                var taskElement = document.querySelector('[data-task-id="' + task.id + '"]');
                if (taskElement) {
                    window.CelebrationSystem.celebrate(taskElement, true);
                }
            }
            
            // Check if virtual scrolling is active
            if (window.VirtualScrollAdapter && window.VirtualScrollAdapter.isActive()) {
                // Update virtual scrolling without full re-render
                var userTasks = self.getUserTasks();
                window.VirtualScrollAdapter.update(userTasks);
            } else {
                // Full re-render for traditional view
                self.render();
            }
        },
        
        /**
         * Delete task
         */
        deleteTask: function(task) {
            var self = this;
            
            var index = self.tasks.indexOf(task);
            if (index > -1) {
                // Clean up any active timer for this task
                if (window.TaskTimer && window.TaskTimer.cancelTimer) {
                    window.TaskTimer.cancelTimer(task.id);
                }
                
                self.tasks.splice(index, 1);
                self.saveTasks();
                self.render();
            }
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            var self = this;
            
            // Create and store global key handler
            self.globalKeyHandler = function(e) {
                if (e.key === 'Escape' && self.editingTaskId) {
                    self.cancelEditing();
                }
            };
            
            // Add with tracking
            document.addEventListener('keydown', self.globalKeyHandler);
            self.trackEventListener(document, 'keydown', self.globalKeyHandler);
        },
        
        /**
         * Track event listener for cleanup
         */
        trackEventListener: function(element, event, handler) {
            this.eventListeners.push({
                element: element,
                event: event,
                handler: handler
            });
        },
        
        /**
         * Remove all tracked event listeners
         */
        removeAllEventListeners: function() {
            var self = this;
            
            // Remove all tracked listeners
            self.eventListeners.forEach(function(listener) {
                listener.element.removeEventListener(listener.event, listener.handler);
            });
            
            // Clear the array
            self.eventListeners = [];
            
            // Clear stored references
            self.globalKeyHandler = null;
        },
        
        /**
         * Destroy the module and clean up
         */
        destroy: function() {
            var self = this;
            
            // Clear any pending timers
            if (self.autoSaveTimer) {
                clearTimeout(self.autoSaveTimer);
                self.autoSaveTimer = null;
            }
            
            // Destroy virtual scrolling if active
            if (window.VirtualScrollAdapter && window.VirtualScrollAdapter.isActive()) {
                window.VirtualScrollAdapter.destroy();
            }
            
            // Remove all event listeners
            self.removeAllEventListeners();
            
            // Clear container reference
            self.container = null;
            
            // Reset state
            self.isInitialized = false;
            self.editingTaskId = null;
        },
        
        /**
         * Show error message
         */
        showError: function(message) {
            var self = this;
            
            var error = document.createElement('div');
            error.className = 'task-error';
            error.textContent = message;
            error.style.cssText = 
                'background: #d32f2f;' +
                'color: #fff;' +
                'padding: 16px;' +
                'border-radius: 8px;' +
                'margin-bottom: 16px;' +
                'text-align: center;';
            
            self.container.insertBefore(error, self.container.firstChild);
            
            // Remove after 5 seconds
            setTimeout(function() {
                if (error.parentNode) {
                    error.parentNode.removeChild(error);
                }
            }, 5000);
        },
        
        /**
         * Filter tasks by current user
         */
        filterTasksByUser: function(tasks) {
            var self = this;
            
            if (!window.UserManager) {
                return tasks;
            }
            
            var currentUser = window.UserManager.getCurrentUser();
            if (!currentUser) {
                return tasks;
            }
            
            return tasks.filter(function(task) {
                // Ensure backward compatibility - add missing fields
                self.ensureTaskFields(task);
                // Show tasks that belong to current user or have no user_id (legacy tasks)
                return task.user_id === currentUser.id || !task.user_id;
            });
        },
        
        /**
         * Ensure task has all required fields (backward compatibility)
         */
        ensureTaskFields: function(task) {
            // Add missing fields with defaults
            if (!task.icon) task.icon = '✓';
            if (!task.description) task.description = '';
            if (!task.category) task.category = '';
            if (!task.priority) task.priority = 'medium';
            if (!task.order) task.order = task.created_at ? new Date(task.created_at).getTime() : Date.now();
            if (!task.tags) task.tags = [];
            if (!task.due_date) task.due_date = null;
            if (!task.reminder) task.reminder = null;
            if (!task.attachments) task.attachments = [];
            
            return task;
        },
        
        /**
         * Get tasks for current user
         */
        getUserTasks: function() {
            var self = this;
            var userTasks = self.filterTasksByUser(self.tasks);
            
            // Sort by order field (higher values first)
            userTasks.sort(function(a, b) {
                // If order fields exist, use them
                if (a.order !== undefined && b.order !== undefined) {
                    return b.order - a.order;
                }
                // Fallback to created_at
                var aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
                var bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
                return bTime - aTime;
            });
            
            return userTasks;
        },
        
        /**
         * Get task by ID
         */
        getTaskById: function(taskId) {
            var self = this;
            for (var i = 0; i < self.tasks.length; i++) {
                if (self.tasks[i].id === taskId) {
                    return self.tasks[i];
                }
            }
            return null;
        },
        
        /**
         * Cleanup modal-specific event listeners
         */
        cleanupModalListeners: function() {
            var self = this;
            
            // Remove listeners that were added to modal elements
            var modalListeners = self.eventListeners.filter(function(listener) {
                // Check if element is inside a modal
                var modal = listener.element.closest('.modal');
                return modal !== null;
            });
            
            // Remove these listeners
            modalListeners.forEach(function(listener) {
                listener.element.removeEventListener(listener.event, listener.handler);
                // Remove from tracking array
                var index = self.eventListeners.indexOf(listener);
                if (index > -1) {
                    self.eventListeners.splice(index, 1);
                }
            });
        }
    };
    
    // Export to global scope
    window.TaskDisplay = TaskDisplay;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            TaskDisplay.init();
        });
    } else {
        // DOM already loaded
        TaskDisplay.init();
    }
})();