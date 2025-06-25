/**
 * Task Display Module for StackMap
 * Handles rendering and CRUD operations for tasks
 * Mobile-first design with ADHD/autism accommodations
 */

(function() {
    'use strict';
    
    // Today/Tomorrow constants
    const TASK_TIMEFRAMES = {
        TODAY: 'today',
        TOMORROW: 'tomorrow',
        SOMEDAY: 'someday'
    };
    
    const TaskDisplay = {
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
            const self = this;
            
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
            const self = this;
            
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
            const self = this;
            
            try {
                const stored = localStorage.getItem('stackmap_tasks');
                const allTasks = stored ? JSON.parse(stored) : [];
                
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
            const self = this;
            
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
            const self = this;
            
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
            const self = this;
            
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
            const self = this;
            const startTime = performance.now();
            
            // Show skeleton screens immediately
            if (self.tasks.length > 0 && window.StackMapFeatureFlags && 
                window.StackMapFeatureFlags.isEnabled('skeleton-screens')) {
                self.showSkeletonTasks(self.container, Math.min(self.tasks.length, 5));
            }
            
            // Use requestAnimationFrame for smooth rendering
            requestAnimationFrame(function() {
                // Clear container
                self.container.innerHTML = '';
                
                // Clear timer button cache when re-rendering
            if (window.TaskTimer && window.TaskTimer.clearButtonCache) {
                window.TaskTimer.clearButtonCache();
            }
            
            // Add new task button and browse activities button (only in edit mode)
            if (window.EditMode && window.EditMode.isActive()) {
                const editButtonsContainer = document.createElement('div');
                editButtonsContainer.className = 'edit-buttons-container';
                editButtonsContainer.style.cssText = 'display: flex; gap: 12px; margin-bottom: 16px;';
                
                // Add Task button
                const addButton = self.createAddButton();
                addButton.style.marginBottom = '0';
                editButtonsContainer.appendChild(addButton);
                
                // Browse Activities button
                const browseButton = self.createBrowseActivitiesButton();
                editButtonsContainer.appendChild(browseButton);
                
                self.container.appendChild(editButtonsContainer);
            }
            
            // Filter tasks for current user
            const userTasks = self.getUserTasks();
            
            // Render tasks
            if (userTasks.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'task-empty-message';
                emptyMessage.textContent = 'No tasks yet. Tap + to add one.';
                emptyMessage.style.cssText = 'text-align: center; padding: 40px 20px; color: #999;';
                self.container.appendChild(emptyMessage);
            } else {
                // Try virtual scrolling for large task lists
                if (window.VirtualScrollAdapter && window.VirtualScrollAdapter.shouldEnable(userTasks.length)) {
                    // Create a wrapper div for virtual scrolling
                    const virtualContainer = document.createElement('div');
                    virtualContainer.className = 'virtual-scroll-container';
                    virtualContainer.style.cssText = 'height: 100%; position: relative;';
                    self.container.appendChild(virtualContainer);
                    
                    // Initialize virtual scrolling
                    const initialized = window.VirtualScrollAdapter.init(virtualContainer, userTasks);
                    
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
            
            // Track render performance
            if (window.StackMapPerformanceMonitor) {
                window.StackMapPerformanceMonitor.trackInteraction('render-tasks', startTime);
            }
            }); // End requestAnimationFrame
        },
        
        /**
         * Traditional rendering for small task lists
         */
        renderTraditional: function(userTasks) {
            const self = this;
            
            // Use DocumentFragment for batch DOM operations
            const fragment = document.createDocumentFragment();
            
            userTasks.forEach(function(task) {
                const taskElement = self.createTaskElement(task);
                fragment.appendChild(taskElement);
            });
            
            // Single DOM operation instead of N operations
            self.container.appendChild(fragment);
        },
        
        /**
         * Create add task button
         */
        createAddButton: function() {
            const self = this;
            
            const button = document.createElement('button');
            button.className = 'task-add-button';
            button.setAttribute('aria-label', 'Add new task');
            button.textContent = '+ Add Task';
            
            // Apply safe mode styles
            button.style.cssText = 
                `width: 100%;min-height: ${self.touchTargetSize}px;padding: 16px;margin-bottom: 16px;background: #333;border: 2px dashed #666;border-radius: 8px;color: #fff;font-size: 16px;cursor: pointer;transition: ${self.safeMode ? 'none' : 'all 0.2s ease;'}`;
            
            // Use optimized button response if available
            if (self.optimizeButtonResponse) {
                self.optimizeButtonResponse(button, function() {
                    self.addTask();
                });
            } else {
                // Fallback to regular onclick
                button.onclick = function() {
                    self.addTask();
                };
            }
            
            return button;
        },
        
        /**
         * Create browse activities button
         */
        createBrowseActivitiesButton: function() {
            const self = this;
            
            const button = document.createElement('button');
            button.className = 'browse-activities-button';
            button.setAttribute('aria-label', 'Browse activity library');
            button.textContent = '📚 Browse Activities';
            
            // Apply safe mode styles
            button.style.cssText = 
                `width: 100%;min-height: ${self.touchTargetSize}px;padding: 16px;margin-bottom: 16px;background: #4a90e2;border: none;border-radius: 8px;color: #fff;font-size: 16px;cursor: pointer;transition: ${self.safeMode ? 'none' : 'all 0.2s ease;'}`;
            
            // Use optimized button response if available
            const browseHandler = function() {
                if (window.ActivityLibrary) {
                    window.ActivityLibrary.show();
                } else {
                    console.error('Activity Library not loaded');
                }
            };
            
            if (self.optimizeButtonResponse) {
                self.optimizeButtonResponse(button, browseHandler);
            } else {
                button.onclick = browseHandler;
            }
            
            return button;
        },
        
        /**
         * Create task element
         */
        createTaskElement: function(task) {
            const self = this;
            
            const taskEl = document.createElement('div');
            taskEl.className = 'task-item';
            taskEl.setAttribute('data-task-id', task.id);
            
            // Apply safe mode styles
            taskEl.style.cssText = 
                `background: #2a2a2a;border-radius: 8px;padding: 16px;margin-bottom: 12px;min-height: ${self.touchTargetSize}px;display: flex;align-items: center;gap: 12px;`;
            
            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.setAttribute('aria-label', `Mark task as ${task.completed ? 'incomplete' : 'complete'}`);
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
            const content = document.createElement('div');
            content.className = 'task-content';
            content.style.cssText = 'flex: 1; min-width: 0;';
            
            if (self.editingTaskId === task.id) {
                // Edit mode
                const input = document.createElement('input');
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
                const titleContainer = document.createElement('div');
                titleContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';
                
                // Task icon
                if (task.icon) {
                    const icon = document.createElement('span');
                    icon.className = 'task-icon';
                    icon.textContent = task.icon;
                    icon.style.cssText = 'font-size: 20px; flex-shrink: 0;';
                    titleContainer.appendChild(icon);
                }
                
                const title = document.createElement('div');
                title.className = 'task-title';
                title.textContent = task.title;
                title.style.cssText = 
                    `font-size: 16px;color: ${task.completed ? '#666' : '#fff'};text-decoration: ${task.completed ? 'line-through' : 'none'};cursor: pointer;word-break: break-word;flex: 1;`;
                
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
                    const priority = document.createElement('div');
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
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'task-actions';
            actionsContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';
            
            // Add timer button (always visible, not just in edit mode)
            if (window.TaskTimer) {
                const timerButton = document.createElement('button');
                timerButton.className = 'task-timer-button';
                timerButton.setAttribute('data-task-id', task.id);
                
                const existingTimer = window.TaskTimer.getTimer(task.id);
                if (existingTimer) {
                    timerButton.innerHTML = `⏱️ ${window.TaskTimer.formatTime(existingTimer.remaining)}`;
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
                const reorderHandle = document.createElement('div');
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
                const editBtn = document.createElement('button');
                editBtn.className = 'task-edit';
                editBtn.setAttribute('aria-label', 'Edit task');
                editBtn.innerHTML = '✏️';
                editBtn.style.cssText = 
                    `width: ${self.touchTargetSize}px;height: ${self.touchTargetSize}px;background: #444;border: none;border-radius: 50%;color: #fff;font-size: 20px;cursor: pointer;flex-shrink: 0;display: flex;align-items: center;justify-content: center;`;
                
                editBtn.onclick = function() {
                    self.startEditing(task);
                };
                
                actionsContainer.appendChild(editBtn);
                
                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'task-delete';
                deleteBtn.setAttribute('aria-label', 'Delete task');
                deleteBtn.textContent = '×';
                deleteBtn.style.cssText = 
                    `width: ${self.touchTargetSize}px;height: ${self.touchTargetSize}px;background: #444;border: none;border-radius: 50%;color: #fff;font-size: 24px;cursor: pointer;flex-shrink: 0;display: flex;align-items: center;justify-content: center;`;
                
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
         * Add new task (with undo support)
         */
        addTask: function() {
            const self = this;
            
            // Get current user ID
            let userId = null;
            if (window.UserManager) {
                const currentUser = window.UserManager.getCurrentUser();
                userId = currentUser ? currentUser.id : null;
            }
            
            const taskData = {
                title: '',
                description: '',
                icon: '✓',  // Default checkmark icon
                category: '',
                priority: 'medium',  // low, medium, high
                completed: false,
                user_id: userId,
                // Optional fields
                due_date: null,
                reminder: null,
                tags: [],
                order: Date.now(),  // For manual sorting
                attachments: [],  // Array of attachment IDs
                // Today/Tomorrow support
                timeframe: 'today',  // 'today', 'tomorrow', 'someday'
                originalDate: new Date().toISOString(),  // When first assigned timeframe
                rolloverCount: 0,  // Number of times task rolled forward
                lastRolloverDate: null  // Last time task was rolled over
            };
            
            // Use command pattern if available
            if (window.UndoManager && window.TaskCommands) {
                const command = window.TaskCommands.createAddCommand(taskData);
                window.UndoManager.execute(command).then(function(success) {
                    if (success && command.data.generatedId) {
                        // Start editing the newly created task
                        const newTask = self.getTaskById(command.data.generatedId);
                        if (newTask) {
                            self.startEditing(newTask);
                        }
                    }
                });
            } else {
                // Fallback to direct method
                const generatedId = self.addTaskDirect(taskData);
                const newTask = self.getTaskById(generatedId);
                if (newTask) {
                    self.startEditing(newTask);
                }
            }
        },
        
        /**
         * Add task directly (for undo system)
         */
        addTaskDirect: function(taskData) {
            const self = this;
            
            const newTask = Object.assign({
                id: `task_${Date.now()}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, taskData);
            
            self.tasks.unshift(newTask);
            self.render();
            
            return newTask.id;
        },
        
        /**
         * Start editing a task
         */
        startEditing: function(task) {
            const self = this;
            
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
            const self = this;
            
            // Create form content
            const formHtml = self.createEditForm(task);
            
            // Show modal
            const modal = window.Modal.show({
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
            const self = this;
            
            let html = '<form id="task-edit-form" class="task-edit-form">';
            
            // Title field
            html += '<div class="form-field">';
            html += '<label for="task-title">Title <span class="required">*</span></label>';
            html += `<input type="text" id="task-title" name="title" value="${task.title || ''}" required>`;
            html += '</div>';
            
            // Icon picker
            html += '<div class="form-field">';
            html += '<label>Icon</label>';
            html += '<div class="icon-picker" id="icon-picker">';
            const icons = ['✓', '🌅', '☕', '🚿', '🪥', '🍳', '💊', '🏃', '📚', '🎮', '📱', '💻', '🛏️', '🍽️', '📝', '🎯', '⏰', '💤', '🧘'];
            for (let i = 0; i < icons.length; i++) {
                const selected = icons[i] === task.icon ? ' selected' : '';
                html += `<button type="button" class="icon-option${selected}" data-icon="${icons[i]}">${icons[i]}</button>`;
            }
            html += '</div>';
            html += '</div>';
            
            // Category dropdown
            html += '<div class="form-field">';
            html += '<label for="task-category">Category</label>';
            html += '<select id="task-category" name="category">';
            html += '<option value="">No category</option>';
            if (window.defaultActivities && window.defaultActivities.categories) {
                for (let j = 0; j < window.defaultActivities.categories.length; j++) {
                    const cat = window.defaultActivities.categories[j];
                    const catSelected = cat.id === task.category ? ' selected' : '';
                    html += `<option value="${cat.id}"${catSelected}>${cat.name}</option>`;
                }
            }
            html += '</select>';
            html += '</div>';
            
            // Priority radio buttons
            html += '<div class="form-field">';
            html += '<label>Priority</label>';
            html += '<div class="priority-options">';
            const priorities = [
                { value: 'high', label: 'High', color: '#e53e3e' },
                { value: 'medium', label: 'Medium', color: '#ed8936' },
                { value: 'low', label: 'Low', color: '#48bb78' }
            ];
            for (let k = 0; k < priorities.length; k++) {
                const p = priorities[k];
                const pChecked = task.priority === p.value ? ' checked' : '';
                html += '<label class="priority-option">';
                html += `<input type="radio" name="priority" value="${p.value}"${pChecked}>`;
                html += `<span style="color: ${p.color}">${p.label}</span>`;
                html += '</label>';
            }
            html += '</div>';
            html += '</div>';
            
            // Timeframe selection (Today/Tomorrow)
            html += '<div class="form-field">';
            html += '<label>When</label>';
            html += '<div class="timeframe-options">';
            const timeframes = [
                { value: TASK_TIMEFRAMES.TODAY, label: 'Today', icon: '☀️' },
                { value: TASK_TIMEFRAMES.TOMORROW, label: 'Tomorrow', icon: '🌙' },
                { value: TASK_TIMEFRAMES.SOMEDAY, label: 'Someday', icon: '📅' }
            ];
            for (let t = 0; t < timeframes.length; t++) {
                const tf = timeframes[t];
                const tfChecked = task.timeframe === tf.value ? ' checked' : '';
                html += '<label class="timeframe-option">';
                html += `<input type="radio" name="timeframe" value="${tf.value}"${tfChecked}>`;
                html += `<span>${tf.icon} ${tf.label}</span>`;
                html += '</label>';
            }
            html += '</div>';
            html += '</div>';
            
            // Description
            html += '<div class="form-field">';
            html += '<label for="task-description">Description</label>';
            html += `<textarea id="task-description" name="description" rows="4">${task.description || ''}</textarea>`;
            html += '</div>';
            
            // Attachments section
            html += '<div class="form-field attachments-section">';
            html += '<label>Attachments</label>';
            html += '<div id="attachment-container" class="attachment-container">';
            html += '<div id="attachment-list" class="attachment-list"></div>';
            html += '<div class="attachment-actions">';
            html += '<button type="button" class="add-attachment-btn photo-btn" data-type="photo">';
            html += '<span>📷 Photo</span>';
            html += '</button>';
            html += '<button type="button" class="add-attachment-btn voice-btn" data-type="voice">';
            html += '<span>🎤 Voice</span>';
            html += '</button>';
            html += '</div>';
            html += '<div id="attachment-hint" class="attachment-hint"></div>';
            html += '</div>';
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
            const self = this;
            
            // Get form element
            const form = modal.querySelector('#task-edit-form');
            if (!form) return;
            
            // Auto-save on input
            const autoSaveInputs = form.querySelectorAll('input, textarea, select');
            const autoSaveHandler = function() {
                self.saveDraft(task.id, form);
            };
            
            for (let i = 0; i < autoSaveInputs.length; i++) {
                autoSaveInputs[i].addEventListener('input', autoSaveHandler);
                self.trackEventListener(autoSaveInputs[i], 'input', autoSaveHandler);
            }
            
            // Icon picker
            const iconButtons = form.querySelectorAll('.icon-option');
            const iconClickHandler = function(e) {
                e.preventDefault();
                // Remove selected from all
                for (let k = 0; k < iconButtons.length; k++) {
                    iconButtons[k].classList.remove('selected');
                }
                // Add selected to this one
                this.classList.add('selected');
                // Save draft
                self.saveDraft(task.id, form);
            };
            
            for (let j = 0; j < iconButtons.length; j++) {
                iconButtons[j].addEventListener('click', iconClickHandler);
                self.trackEventListener(iconButtons[j], 'click', iconClickHandler);
            }
            
            // Cancel button
            const cancelBtn = form.querySelector('#cancel-btn');
            if (cancelBtn) {
                const cancelHandler = function() {
                    // Check if new task without title
                    if (!task.title && !form.title.value.trim()) {
                        // Remove the task
                        const index = self.tasks.indexOf(task);
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
            
            // Initialize attachment UI
            self.initializeAttachmentUI(modal, task);
            
            // Form submit
            const submitHandler = function(e) {
                e.preventDefault();
                
                // Get form data
                const formData = self.getFormData(form);
                
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
                
                // Get timeframe if present
                const timeframeInput = form.querySelector('input[name="timeframe"]:checked');
                if (timeframeInput) {
                    task.timeframe = timeframeInput.value;
                }
                
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
            const data = {
                title: form.title.value || '',
                description: form.description.value || '',
                category: form.category.value || '',
                priority: form.priority.value || 'medium',
                icon: '✓'
            };
            
            // Get selected icon
            const selectedIcon = form.querySelector('.icon-option.selected');
            if (selectedIcon) {
                data.icon = selectedIcon.getAttribute('data-icon');
            }
            
            return data;
        },
        
        /**
         * Save draft to localStorage
         */
        saveDraft: function(taskId, form) {
            const self = this;
            const draftKey = `stackmap_task_draft_${taskId}`;
            
            try {
                const draftData = self.getFormData(form);
                localStorage.setItem(draftKey, JSON.stringify(draftData));
            } catch (error) {
                console.warn('Failed to save draft:', error);
            }
        },
        
        /**
         * Load draft from localStorage
         */
        loadDraft: function(taskId) {
            const self = this;
            const draftKey = `stackmap_task_draft_${taskId}`;
            
            try {
                const draftData = localStorage.getItem(draftKey);
                if (draftData) {
                    const draft = JSON.parse(draftData);
                    const form = document.getElementById('task-edit-form');
                    if (form && draft) {
                        // Restore form values
                        if (draft.title) form.title.value = draft.title;
                        if (draft.description) form.description.value = draft.description;
                        if (draft.category) form.category.value = draft.category;
                        if (draft.priority) form.priority.value = draft.priority;
                        
                        // Restore icon selection
                        if (draft.icon) {
                            const iconButtons = form.querySelectorAll('.icon-option');
                            for (let i = 0; i < iconButtons.length; i++) {
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
            const draftKey = `stackmap_task_draft_${taskId}`;
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
            const self = this;
            
            newTitle = newTitle.trim();
            
            if (newTitle) {
                task.title = newTitle;
                task.updated_at = new Date().toISOString();
                self.saveTasks();
            } else if (!task.title) {
                // Remove empty new task
                const index = self.tasks.indexOf(task);
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
            const self = this;
            
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
            const self = this;
            const wasCompleted = task.completed_at ? true : false;
            
            // Use command pattern if available for completion toggling
            if (window.UndoManager && window.TaskCommands) {
                const command = window.TaskCommands.createCompleteCommand(task.id, wasCompleted);
                window.UndoManager.execute(command);
            } else {
                // Fallback to direct method
                const isFirstCompletion = !wasCompleted && task.completed;
                
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
                    const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                    if (taskElement) {
                        window.CelebrationSystem.celebrate(taskElement, true);
                    }
                }
                
                // Check if virtual scrolling is active
                if (window.VirtualScrollAdapter && window.VirtualScrollAdapter.isActive()) {
                    // Update virtual scrolling without full re-render
                    const userTasks = self.getUserTasks();
                    window.VirtualScrollAdapter.update(userTasks);
                } else {
                    // Full re-render for traditional view
                    self.render();
                }
            }
        },
        
        /**
         * Delete task
         */
        deleteTask: function(task) {
            const self = this;
            
            // Use command pattern if available
            if (window.UndoManager && window.TaskCommands) {
                const command = window.TaskCommands.createDeleteCommand(task.id);
                window.UndoManager.execute(command);
            } else {
                // Fallback to direct method
                self.deleteTaskDirect(task.id);
            }
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
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
            const self = this;
            
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
            const self = this;
            
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
            const self = this;
            
            const error = document.createElement('div');
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
            const self = this;
            
            if (!window.UserManager) {
                return tasks;
            }
            
            const currentUser = window.UserManager.getCurrentUser();
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
            const self = this;
            const userTasks = self.filterTasksByUser(self.tasks);
            
            // Sort by order field (higher values first)
            userTasks.sort(function(a, b) {
                // If order fields exist, use them
                if (a.order !== undefined && b.order !== undefined) {
                    return b.order - a.order;
                }
                // Fallback to created_at
                const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
                const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
                return bTime - aTime;
            });
            
            return userTasks;
        },
        
        /**
         * Get task by ID
         */
        getTaskById: function(taskId) {
            const self = this;
            for (let i = 0; i < self.tasks.length; i++) {
                if (self.tasks[i].id === taskId) {
                    return self.tasks[i];
                }
            }
            return null;
        },
        
        /**
         * Initialize attachment UI in the edit modal
         */
        initializeAttachmentUI: function(modal, task) {
            const self = this;
            
            // Initialize attachment manager if not already done
            if (window.AttachmentManager && !window.AttachmentManager.photoStorage) {
                window.AttachmentManager.init();
            }
            
            const attachmentList = modal.querySelector('#attachment-list');
            const attachmentHint = modal.querySelector('#attachment-hint');
            const photoBtn = modal.querySelector('.photo-btn');
            const voiceBtn = modal.querySelector('.voice-btn');
            
            if (!attachmentList || !window.AttachmentManager) return;
            
            // Load existing attachments
            self.loadAttachments(task, attachmentList);
            
            // Update hint
            self.updateAttachmentHint(task, attachmentHint);
            
            // Photo button handler
            if (photoBtn) {
                const photoHandler = function(e) {
                    e.preventDefault();
                    self.handleAddPhoto(task, attachmentList, attachmentHint);
                };
                photoBtn.addEventListener('click', photoHandler);
                self.trackEventListener(photoBtn, 'click', photoHandler);
            }
            
            // Voice button handler
            if (voiceBtn) {
                const voiceHandler = function(e) {
                    e.preventDefault();
                    self.handleAddVoice(task, attachmentList, attachmentHint, voiceBtn);
                };
                voiceBtn.addEventListener('click', voiceHandler);
                self.trackEventListener(voiceBtn, 'click', voiceHandler);
            }
        },
        
        /**
         * Load and display existing attachments
         */
        loadAttachments: function(task, container) {
            const self = this;
            
            if (!window.AttachmentManager) return;
            
            // Clear container
            container.innerHTML = '';
            
            // Get attachments
            window.AttachmentManager.getAttachments(task.id, function(attachments) {
                attachments.forEach(function(attachment) {
                    const el = self.createAttachmentElement(attachment, task);
                    container.appendChild(el);
                });
            });
        },
        
        /**
         * Create attachment element
         */
        createAttachmentElement: function(attachment, task) {
            const self = this;
            const div = document.createElement('div');
            div.className = `attachment-item ${attachment.type}`;
            div.setAttribute('data-attachment-id', attachment.id);
            
            // Icon
            const icon = document.createElement('span');
            icon.className = 'attachment-icon';
            icon.textContent = attachment.type === 'photo' ? '📷' : '🎤';
            div.appendChild(icon);
            
            // Info
            const info = document.createElement('span');
            info.className = 'attachment-info';
            if (attachment.type === 'photo') {
                info.textContent = 'Photo';
            } else {
                const duration = Math.round(attachment.data.duration || 0);
                info.textContent = `Voice (${duration}s)`;
            }
            div.appendChild(info);
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'attachment-delete';
            deleteBtn.textContent = '×';
            deleteBtn.onclick = function(e) {
                e.preventDefault();
                self.deleteAttachment(attachment, task, div);
            };
            div.appendChild(deleteBtn);
            
            return div;
        },
        
        /**
         * Update attachment hint
         */
        updateAttachmentHint: function(task, hintElement) {
            if (!window.AttachmentManager || !hintElement) return;
            
            window.AttachmentManager.getAttachments(task.id, function(attachments) {
                const hint = window.AttachmentManager.getAttachmentHint(attachments.length);
                hintElement.textContent = hint;
            });
        },
        
        /**
         * Handle add photo
         */
        handleAddPhoto: function(task, listContainer, hintElement) {
            const self = this;
            
            // Create file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment'; // Prefer rear camera
            
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file');
                    return;
                }
                
                // Add photo
                window.AttachmentManager.addAttachment(task.id, 'photo', {
                    uri: URL.createObjectURL(file),
                    size: file.size,
                    mimeType: file.type,
                    filename: file.name
                }, function(result) {
                    if (result.success) {
                        // Reload attachments
                        self.loadAttachments(task, listContainer);
                        self.updateAttachmentHint(task, hintElement);
                        
                        // Update task
                        if (!task.attachments) task.attachments = [];
                        task.attachments.push(result.photo.id);
                        self.saveTasks();
                    } else {
                        alert(result.error || 'Failed to add photo');
                    }
                });
            };
            
            input.click();
        },
        
        /**
         * Handle add voice memo
         */
        handleAddVoice: function(task, listContainer, hintElement, button) {
            const self = this;
            
            if (!window.VoiceAttachmentHandler || !window.VoiceAttachmentHandler.isInitialized) {
                alert('Voice recording is not available');
                return;
            }
            
            // Create voice recording UI in a modal or inline
            const container = document.createElement('div');
            container.className = 'voice-recording-modal-content';
            
            // Create recording UI
            window.VoiceAttachmentHandler.createRecordingUI(container, task.id);
            
            // Show in modal if available
            if (window.Modal) {
                const modal = window.Modal.show({
                    title: 'Record Voice Memo',
                    content: container,
                    className: 'voice-recording-modal',
                    onClose: function() {
                        // Clean up
                        window.VoiceAttachmentHandler.destroy();
                    }
                });
                
                // Listen for attachment added
                const attachmentHandler = function(e) {
                    if (e.detail.taskId === task.id && e.detail.type === 'voice') {
                        // Reload attachments
                        self.loadAttachments(task, listContainer);
                        self.updateAttachmentHint(task, hintElement);
                        
                        // Update task
                        if (!task.attachments) task.attachments = [];
                        task.attachments.push(e.detail.attachment.id);
                        self.saveTasks();
                        
                        // Close modal
                        window.Modal.close();
                    }
                };
                
                document.addEventListener('attachmentAdded', attachmentHandler);
                self.trackEventListener(document, 'attachmentAdded', attachmentHandler);
            } else {
                // Fallback: append to button's parent
                button.parentElement.appendChild(container);
            }
        },
        
        
        /**
         * Delete attachment
         */
        deleteAttachment: function(attachment, task, element) {
            const self = this;
            
            if (!confirm(`Delete this ${attachment.type}?`)) return;
            
            window.AttachmentManager.deleteAttachment(attachment.id, attachment.type, function(result) {
                if (result.success) {
                    // Remove from DOM
                    element.remove();
                    
                    // Update task
                    if (task.attachments) {
                        const index = task.attachments.indexOf(attachment.id);
                        if (index > -1) {
                            task.attachments.splice(index, 1);
                            self.saveTasks();
                        }
                    }
                    
                    // Update hint
                    const hintElement = document.querySelector('#attachment-hint');
                    self.updateAttachmentHint(task, hintElement);
                }
            });
        },
        
        /**
         * Cleanup modal-specific event listeners
         */
        cleanupModalListeners: function() {
            const self = this;
            
            // Remove listeners that were added to modal elements
            const modalListeners = self.eventListeners.filter(function(listener) {
                // Check if element is inside a modal
                const modal = listener.element.closest('.modal');
                return modal !== null;
            });
            
            // Remove these listeners
            modalListeners.forEach(function(listener) {
                listener.element.removeEventListener(listener.event, listener.handler);
                // Remove from tracking array
                const index = self.eventListeners.indexOf(listener);
                if (index > -1) {
                    self.eventListeners.splice(index, 1);
                }
            });
        },
        
        // Optimize button response for ADHD users (sub-200ms target)
        optimizeButtonResponse: function(button, handler) {
            const self = this;
            let startTime;
            
            // Remove any existing onclick handler
            button.onclick = null;
            
            // Add optimized event listener
            const optimizedHandler = function(e) {
                startTime = performance.now();
                
                // Immediate visual feedback (<100ms requirement)
                button.classList.add('button-pressed');
                
                // Haptic feedback if available
                if (window.StackMapHapticFeedback) {
                    window.StackMapHapticFeedback.trigger('buttonPress');
                }
                
                // Use requestAnimationFrame for optimal timing
                if (window.requestAnimationFrame) {
                    requestAnimationFrame(function() {
                        // Execute the actual handler
                        handler.call(button, e);
                        
                        // Remove visual feedback after a short delay
                        setTimeout(function() {
                            button.classList.remove('button-pressed');
                        }, 150);
                        
                        // Track performance
                        if (window.StackMapPerformanceMonitor) {
                            window.StackMapPerformanceMonitor.trackInteraction(
                                `button-${button.id || button.className}`, 
                                startTime
                            );
                        }
                    });
                } else {
                    // Fallback for older browsers
                    setTimeout(function() {
                        handler.call(button, e);
                        button.classList.remove('button-pressed');
                        
                        if (window.StackMapPerformanceMonitor) {
                            window.StackMapPerformanceMonitor.trackInteraction(
                                `button-${button.id || button.className}`, 
                                startTime
                            );
                        }
                    }, 0);
                }
            };
            
            button.addEventListener('click', optimizedHandler);
            
            // Track this listener for cleanup
            this.eventListeners.push({
                element: button,
                event: 'click',
                handler: optimizedHandler
            });
        },
        
        // Show skeleton screens while loading
        showSkeletonTasks: function(container, count) {
            // Check if skeleton screens are enabled
            if (window.StackMapFeatureFlags && 
                window.StackMapFeatureFlags.isDisabled('skeleton-screens')) {
                return;
            }
            
            // Clear existing content
            container.innerHTML = '';
            
            // Create skeleton container
            const skeletonContainer = document.createElement('div');
            skeletonContainer.className = 'skeleton-container';
            
            // Add skeleton tasks
            for (let i = 0; i < count; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'skeleton skeleton-task';
                skeletonContainer.appendChild(skeleton);
            }
            
            container.appendChild(skeletonContainer);
        },
        
        // Apply optimization to all buttons
        optimizeAllButtons: function() {
            const self = this;
            
            // Optimize add task button
            const addButton = document.querySelector('.add-task-button');
            if (addButton && addButton.onclick) {
                const addHandler = addButton.onclick;
                this.optimizeButtonResponse(addButton, addHandler);
            }
            
            // Optimize browse activities button
            const browseButton = document.querySelector('.browse-activities-button');
            if (browseButton && browseButton.onclick) {
                const browseHandler = browseButton.onclick;
                this.optimizeButtonResponse(browseButton, browseHandler);
            }
            
            // Optimize all task buttons
            document.querySelectorAll('.edit-button, .delete-button, .timer-button').forEach(function(btn) {
                if (btn.onclick) {
                    const handler = btn.onclick;
                    self.optimizeButtonResponse(btn, handler);
                }
            });
        },
        
        /**
         * Direct methods for undo system - bypass command pattern
         */
        
        // Get task by ID
        getTaskById: function(taskId) {
            const self = this;
            return self.tasks.find(function(task) {
                return task.id === taskId;
            });
        },
        
        // Remove task without command pattern
        removeTaskDirect: function(taskId) {
            const self = this;
            const index = self.tasks.findIndex(function(task) {
                return task.id === taskId;
            });
            
            if (index > -1) {
                self.tasks.splice(index, 1);
                self.saveTasks();
                self.render();
            }
        },
        
        // Toggle task completion without command pattern
        toggleTaskDirect: function(taskId) {
            const self = this;
            const task = self.getTaskById(taskId);
            
            if (task) {
                task.completed = !task.completed;
                task.updated_at = new Date().toISOString();
                
                if (task.completed) {
                    task.completed_at = new Date().toISOString();
                } else {
                    task.completed_at = null;
                }
                
                self.saveTasks();
                self.render();
            }
        },
        
        // Update task text without command pattern
        updateTaskTextDirect: function(taskId, newText) {
            const self = this;
            const task = self.getTaskById(taskId);
            
            if (task) {
                task.text = newText;
                task.title = newText; // Some tasks use title instead of text
                task.updated_at = new Date().toISOString();
                self.saveTasks();
                self.render();
            }
        },
        
        // Delete task permanently without command pattern
        deleteTaskDirect: function(taskId) {
            const self = this;
            const index = self.tasks.findIndex(function(task) {
                return task.id === taskId;
            });
            
            if (index > -1) {
                // Clean up any active timer
                if (window.TaskTimer && window.TaskTimer.cancelTimer) {
                    window.TaskTimer.cancelTimer(taskId);
                }
                
                self.tasks.splice(index, 1);
                self.saveTasks();
                self.render();
            }
        },
        
        // Restore task without command pattern
        restoreTaskDirect: function(taskData) {
            const self = this;
            const restoredTask = Object.assign({}, taskData);
            
            // Ensure task has proper timestamps
            if (!restoredTask.created_at) {
                restoredTask.created_at = new Date().toISOString();
            }
            restoredTask.updated_at = new Date().toISOString();
            
            // Insert at original position if possible
            const originalIndex = self.tasks.findIndex(function(task) {
                return task.created_at > restoredTask.created_at;
            });
            
            if (originalIndex === -1) {
                self.tasks.push(restoredTask);
            } else {
                self.tasks.splice(originalIndex, 0, restoredTask);
            }
            
            self.saveTasks();
            self.render();
        },
        
        // Toggle task completion without command pattern
        toggleTaskDirect: function(taskId) {
            const self = this;
            const task = self.getTaskById(taskId);
            
            if (task) {
                task.completed = !task.completed;
                task.updated_at = new Date().toISOString();
                
                if (task.completed) {
                    task.completed_at = new Date().toISOString();
                } else {
                    task.completed_at = null;
                }
                
                self.saveTasks();
                self.render();
            }
        },
        
        // Complete task without command pattern
        completeTaskDirect: function(taskId) {
            const self = this;
            const task = self.getTaskById(taskId);
            
            if (task && !task.completed) {
                task.completed = true;
                task.completed_at = new Date().toISOString();
                task.updated_at = new Date().toISOString();
                self.saveTasks();
                self.render();
            }
        },
        
        // Set task completion state without command pattern
        setTaskCompleteDirect: function(taskId, completed) {
            const self = this;
            const task = self.getTaskById(taskId);
            
            if (task) {
                task.completed = completed;
                task.updated_at = new Date().toISOString();
                
                if (completed) {
                    task.completed_at = new Date().toISOString();
                } else {
                    task.completed_at = null;
                }
                
                self.saveTasks();
                self.render();
            }
        },
        
        // Move task to new position without command pattern
        moveTaskDirect: function(taskId, newIndex) {
            const self = this;
            const currentIndex = self.tasks.findIndex(function(task) {
                return task.id === taskId;
            });
            
            if (currentIndex > -1 && currentIndex !== newIndex) {
                const task = self.tasks.splice(currentIndex, 1)[0];
                self.tasks.splice(newIndex, 0, task);
                task.updated_at = new Date().toISOString();
                self.saveTasks();
                self.render();
            }
        },
        
        // Update specific field without command pattern
        updateTaskFieldDirect: function(taskId, field, value) {
            const self = this;
            const task = self.getTaskById(taskId);
            
            if (task) {
                task[field] = value;
                task.updated_at = new Date().toISOString();
                self.saveTasks();
                self.render();
            }
        },
        
        // Add attachment without command pattern
        addAttachmentDirect: function(taskId, attachmentData) {
            const self = this;
            const task = self.getTaskById(taskId);
            
            if (task) {
                if (!task.attachments) {
                    task.attachments = [];
                }
                
                const attachmentId = `attach_${Date.now()}`;
                const attachment = Object.assign({
                    id: attachmentId,
                    created_at: new Date().toISOString()
                }, attachmentData);
                
                task.attachments.push(attachment);
                task.updated_at = new Date().toISOString();
                self.saveTasks();
                self.render();
                
                return attachmentId;
            }
        },
        
        // Remove attachment without command pattern
        removeAttachmentDirect: function(taskId, attachmentId) {
            const self = this;
            const task = self.getTaskById(taskId);
            
            if (task && task.attachments) {
                const index = task.attachments.findIndex(function(attach) {
                    return attach.id === attachmentId;
                });
                
                if (index > -1) {
                    task.attachments.splice(index, 1);
                    task.updated_at = new Date().toISOString();
                    self.saveTasks();
                    self.render();
                }
            }
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