/**
 * Activity Display Module for StackMap
 * Handles rendering and CRUD operations for activities
 * Mobile-first design with ADHD/autism accommodations
 */

(() => {
    'use strict';
    
    // Today/Tomorrow constants
    const ACTIVITY_TIMEFRAMES = {
        TODAY: 'today',
        TOMORROW: 'tomorrow',
        SOMEDAY: 'someday'
    };
    
    const ActivityDisplay = {
        container: null,
        activities: [],
        editingActivityId: null,
        autoSaveTimer: null,
        isInitialized: false,
        
        // Safe mode configuration
        safeMode: window.StackMapSafeMode || false,
        touchTargetSize: window.StackMapSafeMode ? 60 : 44,
        
        // Event listener tracking for cleanup
        eventListeners: [],
        globalKeyHandler: null,
        
        /**
         * Initialize the activity display
         */
        init: function() {
            // Find container (check both old and new IDs for compatibility)
            this.container = document.getElementById('activity-container') || document.getElementById('task-container'); // Keep task-container for backwards compatibility
            if (!this.container) {
                console.error('ActivityDisplay: Container not found');
                return;
            }
            
            // Load activities from storage
            this.loadActivities((success) => {
                if (success) {
                    this.render();
                    this.setupEventListeners();
                    this.isInitialized = true;
                    
                    // Listen for edit mode changes
                    if (window.EditMode) {
                        window.EditMode.on('change', () => {
                            this.render();
                        });
                    }
                    
                    // Listen for day view changes
                    document.addEventListener('dayViewChanged', (e) => {
                        console.log('ActivityDisplay: Day view changed, re-rendering');
                        this.render();
                    });
                } else {
                    this.showError('Unable to load activities');
                }
            });
        },
        
        /**
         * Load activities from storage (SQLite or localStorage)
         */
        loadActivities: function(callback) {
            // Try SQLite first if available
            if (window.ActivitySQLite && window.ActivitySQLite.isReady) {
                window.ActivitySQLite.getActivities((activities, error) => {
                    if (error) {
                        console.warn('ActivityDisplay: SQLite error, falling back to localStorage', error);
                        this.loadFromLocalStorage(callback);
                    } else {
                        this.activities = activities || [];
                        if (callback) callback(true);
                    }
                });
            } else {
                // Fallback to localStorage
                this.loadFromLocalStorage(callback);
            }
        },
        
        /**
         * Load activities from localStorage fallback
         */
        loadFromLocalStorage: function(callback) {
            
            try {
                // Check new key first, then fall back to old key for compatibility
                let stored = localStorage.getItem('stackmap_activities');
                if (!stored) {
                    stored = localStorage.getItem('stackmap_tasks');
                }
                const allActivities = stored ? JSON.parse(stored) : [];
                
                // Filter activities by current user
                this.activities = this.filterActivitiesByUser(allActivities);
                
                if (callback) callback(true);
            } catch (error) {
                console.error('ActivityDisplay: localStorage error', error);
                this.activities = [];
                if (callback) callback(false);
            }
        },
        
        /**
         * Save activities to storage
         */
        saveActivities: function(callback) {
            // Clear any existing auto-save timer
            if (this.autoSaveTimer) {
                clearTimeout(this.autoSaveTimer);
            }
            
            // Set new auto-save timer (2 seconds)
            this.autoSaveTimer = setTimeout(() => {
                this.performSave(callback);
            }, 2000);
        },
        
        /**
         * Perform the actual save operation
         */
        performSave: function(callback) {
            const self = this;
            
            // Save callback wrapper to dispatch event after save
            const saveCallback = function(error) {
                if (!error) {
                    // Dispatch activitiesChanged event for other components
                    document.dispatchEvent(new CustomEvent('activitiesChanged', {
                        detail: { activities: self.activities }
                    }));
                    // Also dispatch old event for backward compatibility
                    document.dispatchEvent(new CustomEvent('tasksChanged', {
                        detail: { tasks: self.activities }
                    }));
                }
                if (callback) callback(error);
            };
            
            // Try SQLite first if available
            if (window.ActivitySQLite && window.ActivitySQLite.isReady) {
                // For now, save to localStorage as SQLite implementation needs the full CRUD
                this.saveToLocalStorage(saveCallback);
            } else {
                this.saveToLocalStorage(saveCallback);
            }
        },
        
        /**
         * Save to localStorage
         */
        saveToLocalStorage: function(callback) {
            try {
                // Save to both keys during transition period
                const dataStr = JSON.stringify(this.activities);
                localStorage.setItem('stackmap_activities', dataStr);
                // Also save to old key for backward compatibility
                localStorage.setItem('stackmap_tasks', dataStr);
                if (callback) callback(true);
            } catch (error) {
                console.error('ActivityDisplay: Save failed', error);
                if (callback) callback(false);
            }
        },
        
        /**
         * Show skeleton loading screens
         */
        showSkeletonActivities: function(container, count) {
            const self = this;
            
            // Clear container
            container.innerHTML = '';
            
            // Create skeleton items
            for (let i = 0; i < count; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'activity-card skeleton-loading';
                skeleton.setAttribute('aria-hidden', 'true');
                skeleton.innerHTML = 
                    '<div class="skeleton-avatar"></div>' +
                    '<div class="skeleton-content">' +
                        '<div class="skeleton-title"></div>' +
                        '<div class="skeleton-subtitle"></div>' +
                    '</div>' +
                    '<div class="skeleton-action"></div>';
                
                container.appendChild(skeleton);
            }
        },
        
        /**
         * Render all activities
         */
        render: function() {
            const self = this;
            const startTime = performance.now();
            
            // Show skeleton screens immediately
            if (self.activities.length > 0 && window.StackMapFeatureFlags && 
                window.StackMapFeatureFlags.isEnabled('skeleton-screens')) {
                self.showSkeletonActivities(self.container, Math.min(self.activities.length, 5));
            }
            
            // Use requestAnimationFrame for smooth rendering
            requestAnimationFrame(function() {
                // Clear container
                self.container.innerHTML = '';
                
                // Clear timer button cache when re-rendering
            if (window.ActivityTimer && window.ActivityTimer.clearButtonCache) {
                window.ActivityTimer.clearButtonCache();
            }
            
            // Add new activity button and browse activities button (only in edit mode)
            if (window.EditMode && window.EditMode.isActive()) {
                const editButtonsContainer = document.createElement('div');
                editButtonsContainer.className = 'edit-buttons-container';
                editButtonsContainer.style.cssText = 'display: flex; gap: 12px; margin-bottom: 16px;';
                
                // Add Activity button
                const addButton = self.createAddButton();
                addButton.style.marginBottom = '0';
                editButtonsContainer.appendChild(addButton);
                
                // Quick Add button (replaces Browse Activities)
                const quickAddButton = self.createQuickAddButton();
                editButtonsContainer.appendChild(quickAddButton);
                
                self.container.appendChild(editButtonsContainer);
            }
            
            // Filter activities for current user
            const userActivities = self.getUserActivities();
            
            // Render activities
            if (userActivities.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'activity-empty-message';
                emptyMessage.textContent = 'No activities yet. Tap + to add one.';
                emptyMessage.style.cssText = 'text-align: center; padding: 40px 20px; color: #999;';
                self.container.appendChild(emptyMessage);
            } else {
                // Try virtual scrolling for large activity lists
                if (window.VirtualScrollAdapter && window.VirtualScrollAdapter.shouldEnable(userActivities.length)) {
                    // Create a wrapper div for virtual scrolling
                    const virtualContainer = document.createElement('div');
                    virtualContainer.className = 'virtual-scroll-container';
                    virtualContainer.style.cssText = 'height: 100%; position: relative;';
                    self.container.appendChild(virtualContainer);
                    
                    // Initialize virtual scrolling
                    const initialized = window.VirtualScrollAdapter.init(virtualContainer, userActivities);
                    
                    if (!initialized) {
                        // Fallback to traditional rendering if virtual scrolling fails
                        self.container.removeChild(virtualContainer);
                        self.renderTraditional(userActivities);
                    }
                } else {
                    // Use traditional rendering for small lists
                    self.renderTraditional(userActivities);
                }
            }
            
            // Notify keyboard navigation that activities have been updated
            document.dispatchEvent(new CustomEvent('activitiesUpdated'));
            // Also dispatch old event for backward compatibility
            document.dispatchEvent(new CustomEvent('tasksUpdated'));
            
            // Track render performance
            if (window.StackMapPerformanceMonitor) {
                window.StackMapPerformanceMonitor.trackInteraction('render-activities', startTime);
            }
            }); // End requestAnimationFrame
        },
        
        /**
         * Traditional rendering for small activity lists
         */
        renderTraditional: function(userActivities) {
            const self = this;
            
            // Use DocumentFragment for batch DOM operations
            const fragment = document.createDocumentFragment();
            
            userActivities.forEach(function(activity, index) {
                const activityElement = self.createActivityElement(activity, index + 1);
                fragment.appendChild(activityElement);
            });
            
            // Single DOM operation instead of N operations
            self.container.appendChild(fragment);
        },
        
        /**
         * Create add activity button
         */
        createAddButton: function() {
            const self = this;
            
            const button = document.createElement('button');
            button.className = 'activity-add-button';
            button.setAttribute('aria-label', 'Add new activity');
            button.textContent = '+ Add Activity';
            
            // Apply safe mode styles
            button.style.cssText = 
                `width: 100%;min-height: ${self.touchTargetSize}px;padding: 16px;margin-bottom: 16px;background: #333;border: 2px dashed #666;border-radius: 8px;color: #fff;font-size: 16px;cursor: pointer;transition: ${self.safeMode ? 'none' : 'all 0.2s ease;'}`;
            
            // Use optimized button response if available
            if (self.optimizeButtonResponse) {
                self.optimizeButtonResponse(button, function() {
                    self.addActivity();
                });
            } else {
                // Fallback to regular onclick
                button.onclick = function() {
                    self.addActivity();
                };
            }
            
            return button;
        },
        
        /**
         * Create quick add button
         */
        createQuickAddButton: function() {
            const self = this;
            
            const button = document.createElement('button');
            button.className = 'quick-add-button';
            button.setAttribute('aria-label', 'Quick add activity from templates');
            button.textContent = '⚡ Quick Add';
            
            // Apply safe mode styles
            button.style.cssText = 
                `width: 100%;min-height: ${self.touchTargetSize}px;padding: 16px;margin-bottom: 16px;background: #4a90e2;border: none;border-radius: 8px;color: #fff;font-size: 16px;cursor: pointer;transition: ${self.safeMode ? 'none' : 'all 0.2s ease;'}`;
            
            // Use optimized button response if available
            const quickAddHandler = function() {
                if (window.ActivityTemplates) {
                    window.ActivityTemplates.show();
                } else {
                    console.error('Activity Templates not loaded');
                }
            };
            
            if (self.optimizeButtonResponse) {
                self.optimizeButtonResponse(button, quickAddHandler);
            } else {
                button.onclick = quickAddHandler;
            }
            
            return button;
        },
        
        /**
         * Create activity element
         */
        createActivityElement: function(activity, displayNumber) {
            const self = this;
            
            const activityEl = document.createElement('div');
            activityEl.className = 'activity-item';
            activityEl.setAttribute('data-activity-id', activity.id);
            activityEl.setAttribute('data-display-number', displayNumber || '');
            
            // Apply safe mode styles
            activityEl.style.cssText = 
                `position: relative;background: #2a2a2a;border-radius: 8px;padding: 16px;padding-left: 60px;margin-bottom: 12px;min-height: ${self.touchTargetSize}px;display: flex;align-items: center;gap: 12px;`;
            
            // Add activity number if provided and display mode is set to numbers
            if (displayNumber && self.getDisplayMode() === 'numbers') {
                const numberEl = document.createElement('div');
                numberEl.className = 'activity-number';
                numberEl.textContent = displayNumber;
                numberEl.setAttribute('aria-label', `Activity number ${displayNumber}`);
                numberEl.style.cssText = 
                    'position: absolute;' +
                    'top: 50%;' +
                    'left: 12px;' +
                    'transform: translateY(-50%);' +
                    'width: 36px;' +
                    'height: 36px;' +
                    'display: flex;' +
                    'align-items: center;' +
                    'justify-content: center;' +
                    'font-size: 24px;' +
                    'font-weight: bold;' +
                    'color: #667eea;' +
                    'background: rgba(102, 126, 234, 0.1);' +
                    'border-radius: 50%;';
                activityEl.appendChild(numberEl);
            }
            
            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = activity.completed;
            checkbox.setAttribute('aria-label', `Mark activity as ${activity.completed ? 'incomplete' : 'complete'}`);
            checkbox.style.cssText = 
                'width: 24px;' +
                'height: 24px;' +
                'flex-shrink: 0;' +
                'cursor: pointer;';
            
            checkbox.onchange = function() {
                activity.completed = checkbox.checked;
                self.updateActivity(activity);
            };
            
            // Activity content
            const content = document.createElement('div');
            content.className = 'activity-content';
            content.style.cssText = 'flex: 1; min-width: 0;';
            
            if (self.editingActivityId === activity.id) {
                // Edit mode
                const input = document.createElement('input');
                input.type = 'text';
                input.value = activity.title;
                input.className = 'activity-edit-input';
                input.style.cssText = 
                    'width: 100%;' +
                    'padding: 8px;' +
                    'background: #1a1a1a;' +
                    'border: 1px solid #444;' +
                    'border-radius: 4px;' +
                    'color: #fff;' +
                    'font-size: 16px;';
                
                input.onblur = function() {
                    self.finishEditing(activity, input.value);
                };
                
                input.onkeydown = function(e) {
                    if (e.key === 'Enter') {
                        self.finishEditing(activity, input.value);
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
                
                // Activity icon
                if (activity.icon) {
                    const icon = document.createElement('span');
                    icon.className = 'activity-icon';
                    icon.textContent = activity.icon;
                    icon.style.cssText = 'font-size: 20px; flex-shrink: 0;';
                    titleContainer.appendChild(icon);
                }
                
                const title = document.createElement('div');
                title.className = 'activity-title';
                title.textContent = activity.title;
                title.style.cssText = 
                    `font-size: 16px;color: ${activity.completed ? '#666' : '#fff'};text-decoration: ${activity.completed ? 'line-through' : 'none'};cursor: pointer;word-break: break-word;flex: 1;`;
                
                title.onclick = function() {
                    // Only allow editing in edit mode
                    if (window.EditMode && window.EditMode.isActive()) {
                        self.startEditing(activity);
                    }
                };
                
                titleContainer.appendChild(title);
                content.appendChild(titleContainer);
                
                // Show priority indicator if high priority
                if (activity.priority === 'high') {
                    const priority = document.createElement('div');
                    priority.className = 'activity-priority';
                    priority.style.cssText = 
                        'font-size: 12px;' +
                        'color: #e53e3e;' +
                        'margin-top: 4px;' +
                        'font-weight: 600;';
                    priority.textContent = 'High Priority';
                    content.appendChild(priority);
                }
            }
            
            // Activity actions container (delete, edit, reorder, timer)
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'activity-actions';
            actionsContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';
            
            // Add timer button (always visible, not just in edit mode)
            if (window.ActivityTimer) {
                const timerButton = document.createElement('button');
                timerButton.className = 'activity-timer-button';
                timerButton.setAttribute('data-activity-id', activity.id);
                
                const existingTimer = window.ActivityTimer.getTimer(activity.id);
                if (existingTimer) {
                    timerButton.innerHTML = `⏱️ ${window.ActivityTimer.formatTime(existingTimer.remaining)}`;
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
                    window.ActivityTimer.showTimerMenu(activity.id, timerButton);
                };
                
                actionsContainer.appendChild(timerButton);
            }
            
            // Only show edit/delete actions in edit mode
            if (window.EditMode && window.EditMode.isActive()) {
                // Reorder handle
                const reorderHandle = document.createElement('div');
                reorderHandle.className = 'reorder-handle';
                reorderHandle.innerHTML = '≡';
                reorderHandle.setAttribute('aria-label', 'Reorder activity');
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
                editBtn.className = 'activity-edit';
                editBtn.setAttribute('aria-label', 'Edit activity');
                editBtn.innerHTML = '✏️';
                editBtn.style.cssText = 
                    `width: ${self.touchTargetSize}px;height: ${self.touchTargetSize}px;background: #444;border: none;border-radius: 50%;color: #fff;font-size: 20px;cursor: pointer;flex-shrink: 0;display: flex;align-items: center;justify-content: center;`;
                
                editBtn.onclick = function() {
                    self.startEditing(activity);
                };
                
                actionsContainer.appendChild(editBtn);
                
                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'activity-delete';
                deleteBtn.setAttribute('aria-label', 'Delete activity');
                deleteBtn.textContent = '×';
                deleteBtn.style.cssText = 
                    `width: ${self.touchTargetSize}px;height: ${self.touchTargetSize}px;background: #444;border: none;border-radius: 50%;color: #fff;font-size: 24px;cursor: pointer;flex-shrink: 0;display: flex;align-items: center;justify-content: center;`;
                
                deleteBtn.onclick = function() {
                    self.deleteActivity(activity);
                };
                
                actionsContainer.appendChild(deleteBtn);
            }
            
            activityEl.appendChild(checkbox);
            activityEl.appendChild(content);
            activityEl.appendChild(actionsContainer);
            
            return activityEl;
        },
        
        /**
         * Add new activity (with undo support)
         */
        addActivity: function() {
            const self = this;
            
            // Get current user ID
            let userId = null;
            if (window.UserManager) {
                const currentUser = window.UserManager.getCurrentUser();
                userId = currentUser ? currentUser.id : null;
            }
            
            // Get selected day from DaySelector
            let selectedDay = 'today';
            if (window.DaySelector && window.DaySelector.isReady()) {
                selectedDay = window.DaySelector.getCurrentDay();
            }
            
            const activityData = {
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
                timeframe: selectedDay,  // 'today', 'tomorrow', 'someday'
                day: selectedDay,  // New field for consistency with schema
                originalDate: new Date().toISOString(),  // When first assigned timeframe
                rolloverCount: 0,  // Number of times task rolled forward
                lastRolloverDate: null  // Last time task was rolled over
            };
            
            // Use command pattern if available
            if (window.UndoManager && window.ActivityCommands) {
                const command = window.ActivityCommands.createAddCommand(activityData);
                window.UndoManager.execute(command).then(function(success) {
                    if (success && command.data.generatedId) {
                        // Start editing the newly created activity
                        const newActivity = self.getActivityById(command.data.generatedId);
                        if (newActivity) {
                            self.startEditing(newActivity);
                        }
                    }
                });
            } else {
                // Fallback to direct method
                const generatedId = self.addActivityDirect(activityData);
                const newActivity = self.getActivityById(generatedId);
                if (newActivity) {
                    self.startEditing(newActivity);
                }
            }
        },
        
        /**
         * Add activity directly (for undo system)
         */
        addActivityDirect: function(activityData) {
            const self = this;
            
            const newActivity = Object.assign({
                id: `activity_${Date.now()}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, activityData);
            
            self.activities.unshift(newActivity);
            self.render();
            
            return newActivity.id;
        },
        
        /**
         * Start editing an activity
         */
        startEditing: function(activity) {
            const self = this;
            
            // Use modal for full edit form
            if (window.Modal) {
                self.showEditModal(activity);
            } else {
                // Fallback to inline editing
                self.editingActivityId = activity.id;
                self.render();
            }
        },
        
        /**
         * Show edit modal with full form
         */
        showEditModal: function(activity) {
            const self = this;
            
            // Create form content
            const formHtml = self.createEditForm(activity);
            
            // Show modal
            const modal = window.Modal.show({
                title: activity.title ? 'Edit Activity' : 'New Activity',
                content: formHtml,
                className: 'activity-edit-modal',
                onClose: function() {
                    // Clean up auto-save draft
                    self.clearDraft(activity.id);
                    // Clean up modal-specific event listeners
                    self.cleanupModalListeners();
                }
            });
            
            // Setup form handlers
            self.setupEditFormHandlers(modal, activity);
            
            // Load draft if exists
            self.loadDraft(activity.id);
        },
        
        /**
         * Create edit form HTML
         */
        createEditForm: function(activity) {
            const self = this;
            
            let html = '<form id="activity-edit-form" class="activity-edit-form">';
            
            // Title field
            html += '<div class="form-field">';
            html += '<label for="activity-title">Title <span class="required">*</span></label>';
            html += `<input type="text" id="activity-title" name="title" value="${activity.title || ''}" required>`;
            html += '</div>';
            
            // Icon picker
            html += '<div class="form-field">';
            html += '<label>Icon</label>';
            html += '<div class="icon-picker" id="icon-picker">';
            const icons = ['✓', '🌅', '☕', '🚿', '🪥', '🍳', '💊', '🏃', '📚', '🎮', '📱', '💻', '🛏️', '🍽️', '📝', '🎯', '⏰', '💤', '🧘'];
            for (let i = 0; i < icons.length; i++) {
                const selected = icons[i] === activity.icon ? ' selected' : '';
                html += `<button type="button" class="icon-option${selected}" data-icon="${icons[i]}">${icons[i]}</button>`;
            }
            html += '</div>';
            html += '</div>';
            
            // Category dropdown
            html += '<div class="form-field">';
            html += '<label for="activity-category">Category</label>';
            html += '<select id="activity-category" name="category">';
            html += '<option value="">No category</option>';
            if (window.defaultActivities && window.defaultActivities.categories) {
                for (let j = 0; j < window.defaultActivities.categories.length; j++) {
                    const cat = window.defaultActivities.categories[j];
                    const catSelected = cat.id === activity.category ? ' selected' : '';
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
                const pChecked = activity.priority === p.value ? ' checked' : '';
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
                { value: ACTIVITY_TIMEFRAMES.TODAY, label: 'Today', icon: '☀️' },
                { value: ACTIVITY_TIMEFRAMES.TOMORROW, label: 'Tomorrow', icon: '🌙' },
                { value: ACTIVITY_TIMEFRAMES.SOMEDAY, label: 'Someday', icon: '📅' }
            ];
            for (let t = 0; t < timeframes.length; t++) {
                const tf = timeframes[t];
                const tfChecked = activity.timeframe === tf.value ? ' checked' : '';
                html += '<label class="timeframe-option">';
                html += `<input type="radio" name="timeframe" value="${tf.value}"${tfChecked}>`;
                html += `<span>${tf.icon} ${tf.label}</span>`;
                html += '</label>';
            }
            html += '</div>';
            html += '</div>';
            
            // Description
            html += '<div class="form-field">';
            html += '<label for="activity-description">Description</label>';
            html += `<textarea id="activity-description" name="description" rows="4">${activity.description || ''}</textarea>`;
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
        setupEditFormHandlers: function(modal, activity) {
            const self = this;
            
            // Get form element
            const form = modal.querySelector('#activity-edit-form');
            if (!form) return;
            
            // Auto-save on input
            const autoSaveInputs = form.querySelectorAll('input, textarea, select');
            const autoSaveHandler = function() {
                self.saveDraft(activity.id, form);
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
                self.saveDraft(activity.id, form);
            };
            
            for (let j = 0; j < iconButtons.length; j++) {
                iconButtons[j].addEventListener('click', iconClickHandler);
                self.trackEventListener(iconButtons[j], 'click', iconClickHandler);
            }
            
            // Cancel button
            const cancelBtn = form.querySelector('#cancel-btn');
            if (cancelBtn) {
                const cancelHandler = function() {
                    // Check if new activity without title
                    if (!activity.title && !form.title.value.trim()) {
                        // Remove the activity
                        const index = self.activities.indexOf(activity);
                        if (index > -1) {
                            self.activities.splice(index, 1);
                        }
                    }
                    window.Modal.close();
                    self.render();
                };
                
                cancelBtn.addEventListener('click', cancelHandler);
                self.trackEventListener(cancelBtn, 'click', cancelHandler);
            }
            
            // Initialize attachment UI
            self.initializeAttachmentUI(modal, activity);
            
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
                
                // Update activity
                activity.title = formData.title.trim();
                activity.description = formData.description;
                activity.icon = formData.icon;
                activity.category = formData.category;
                activity.priority = formData.priority;
                activity.updated_at = new Date().toISOString();
                
                // Get timeframe if present
                const timeframeInput = form.querySelector('input[name="timeframe"]:checked');
                if (timeframeInput) {
                    activity.timeframe = timeframeInput.value;
                }
                
                // Save and close
                self.saveActivities();
                self.clearDraft(activity.id);
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
        saveDraft: function(activityId, form) {
            const self = this;
            const draftKey = `stackmap_activity_draft_${activityId}`;
            
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
        loadDraft: function(activityId) {
            const self = this;
            const draftKey = `stackmap_activity_draft_${activityId}`;
            
            try {
                const draftData = localStorage.getItem(draftKey);
                if (draftData) {
                    const draft = JSON.parse(draftData);
                    const form = document.getElementById('activity-edit-form');
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
        clearDraft: function(activityId) {
            const draftKey = `stackmap_activity_draft_${activityId}`;
            try {
                localStorage.removeItem(draftKey);
            } catch (error) {
                console.warn('Failed to clear draft:', error);
            }
        },
        
        /**
         * Finish editing (inline mode)
         */
        finishEditing: function(activity, newTitle) {
            const self = this;
            
            newTitle = newTitle.trim();
            
            if (newTitle) {
                activity.title = newTitle;
                activity.updated_at = new Date().toISOString();
                self.saveActivities();
            } else if (!activity.title) {
                // Remove empty new activity
                const index = self.activities.indexOf(activity);
                if (index > -1) {
                    self.activities.splice(index, 1);
                }
            }
            
            self.editingActivityId = null;
            self.render();
        },
        
        /**
         * Cancel editing
         */
        cancelEditing: function() {
            const self = this;
            
            // Remove empty new activities
            self.activities = self.activities.filter(function(activity) {
                return activity.title || activity.id !== self.editingActivityId;
            });
            
            self.editingActivityId = null;
            self.render();
        },
        
        /**
         * Update activity
         */
        updateActivity: function(activity) {
            const self = this;
            const wasCompleted = activity.completed_at ? true : false;
            
            // Use command pattern if available for completion toggling
            if (window.UndoManager && window.ActivityCommands) {
                const command = window.ActivityCommands.createCompleteCommand(activity.id, wasCompleted);
                window.UndoManager.execute(command);
            } else {
                // Fallback to direct method
                const isFirstCompletion = !wasCompleted && activity.completed;
                
                activity.updated_at = new Date().toISOString();
                if (activity.completed) {
                    activity.completed_at = new Date().toISOString();
                } else {
                    activity.completed_at = null;
                }
                
                // Save first to ensure data persistence
                self.saveActivities();
                
                // Trigger celebration for first-time completion
                if (isFirstCompletion && window.CelebrationSystem) {
                    // Find the activity element in DOM before re-render
                    const activityElement = document.querySelector(`[data-activity-id="${activity.id}"]`);
                    if (activityElement) {
                        window.CelebrationSystem.celebrate(activityElement, true);
                    }
                }
                
                // Check if virtual scrolling is active
                if (window.VirtualScrollAdapter && window.VirtualScrollAdapter.isActive()) {
                    // Update virtual scrolling without full re-render
                    const userActivities = self.getUserActivities();
                    window.VirtualScrollAdapter.update(userActivities);
                } else {
                    // Full re-render for traditional view
                    self.render();
                }
            }
        },
        
        /**
         * Delete activity
         */
        deleteActivity: function(activity) {
            const self = this;
            
            // Use command pattern if available
            if (window.UndoManager && window.ActivityCommands) {
                const command = window.ActivityCommands.createDeleteCommand(activity.id);
                window.UndoManager.execute(command);
            } else {
                // Fallback to direct method
                self.deleteActivityDirect(activity.id);
            }
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Create and store global key handler
            self.globalKeyHandler = function(e) {
                if (e.key === 'Escape' && self.editingActivityId) {
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
            self.editingActivityId = null;
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
         * Filter activities by current user
         */
        filterActivitiesByUser: function(activities) {
            const self = this;
            
            if (!window.UserManager) {
                return activities;
            }
            
            const currentUser = window.UserManager.getCurrentUser();
            if (!currentUser) {
                return activities;
            }
            
            return activities.filter(function(activity) {
                // Ensure backward compatibility - add missing fields
                self.ensureActivityFields(activity);
                // Show activities that belong to current user or have no user_id (legacy activities)
                return activity.user_id === currentUser.id || !activity.user_id;
            });
        },
        
        /**
         * Ensure activity has all required fields (backward compatibility)
         */
        ensureActivityFields: function(activity) {
            // Add missing fields with defaults
            if (!activity.icon) activity.icon = '✓';
            if (!activity.description) activity.description = '';
            if (!activity.category) activity.category = '';
            if (!activity.priority) activity.priority = 'medium';
            if (!activity.order) activity.order = activity.created_at ? new Date(activity.created_at).getTime() : Date.now();
            if (!activity.tags) activity.tags = [];
            if (!activity.due_date) activity.due_date = null;
            if (!activity.reminder) activity.reminder = null;
            if (!activity.attachments) activity.attachments = [];
            if (activity.pinned === undefined) activity.pinned = false;
            
            return activity;
        },
        
        /**
         * Get activities for current user
         */
        getUserActivities: function() {
            const self = this;
            let userActivities = self.filterActivitiesByUser(self.activities);
            
            // Filter by selected day if DaySelector is available
            if (window.DaySelector && window.DaySelector.isReady()) {
                const selectedDay = window.DaySelector.getCurrentDay();
                userActivities = userActivities.filter(function(activity) {
                    // Show activities for the selected day
                    // Check both 'day' and 'timeframe' fields for compatibility
                    const activityDay = activity.day || activity.timeframe || 'today';
                    return activityDay === selectedDay;
                });
            }
            
            // Sort by order field (higher values first)
            userActivities.sort(function(a, b) {
                // If order fields exist, use them
                if (a.order !== undefined && b.order !== undefined) {
                    return b.order - a.order;
                }
                // Fallback to created_at
                const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
                const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
                return bTime - aTime;
            });
            
            return userActivities;
        },
        
        /**
         * Get activity by ID
         */
        getActivityById: function(activityId) {
            const self = this;
            for (let i = 0; i < self.activities.length; i++) {
                if (self.activities[i].id === activityId) {
                    return self.activities[i];
                }
            }
            return null;
        },
        
        /**
         * Initialize attachment UI in the edit modal
         */
        initializeAttachmentUI: function(modal, activity) {
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
            self.loadAttachments(activity, attachmentList);
            
            // Update hint
            self.updateAttachmentHint(activity, attachmentHint);
            
            // Photo button handler
            if (photoBtn) {
                const photoHandler = function(e) {
                    e.preventDefault();
                    self.handleAddPhoto(activity, attachmentList, attachmentHint);
                };
                photoBtn.addEventListener('click', photoHandler);
                self.trackEventListener(photoBtn, 'click', photoHandler);
            }
            
            // Voice button handler
            if (voiceBtn) {
                const voiceHandler = function(e) {
                    e.preventDefault();
                    self.handleAddVoice(activity, attachmentList, attachmentHint, voiceBtn);
                };
                voiceBtn.addEventListener('click', voiceHandler);
                self.trackEventListener(voiceBtn, 'click', voiceHandler);
            }
        },
        
        /**
         * Load and display existing attachments
         */
        loadAttachments: function(activity, container) {
            const self = this;
            
            if (!window.AttachmentManager) return;
            
            // Clear container
            container.innerHTML = '';
            
            // Get attachments
            window.AttachmentManager.getAttachments(activity.id, function(attachments) {
                attachments.forEach(function(attachment) {
                    const el = self.createAttachmentElement(attachment, activity);
                    container.appendChild(el);
                });
            });
        },
        
        /**
         * Create attachment element
         */
        createAttachmentElement: function(attachment, activity) {
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
                self.deleteAttachment(attachment, activity, div);
            };
            div.appendChild(deleteBtn);
            
            return div;
        },
        
        /**
         * Update attachment hint
         */
        updateAttachmentHint: function(activity, hintElement) {
            if (!window.AttachmentManager || !hintElement) return;
            
            window.AttachmentManager.getAttachments(activity.id, function(attachments) {
                const hint = window.AttachmentManager.getAttachmentHint(attachments.length);
                hintElement.textContent = hint;
            });
        },
        
        /**
         * Handle add photo
         */
        handleAddPhoto: function(activity, listContainer, hintElement) {
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
                window.AttachmentManager.addAttachment(activity.id, 'photo', {
                    uri: URL.createObjectURL(file),
                    size: file.size,
                    mimeType: file.type,
                    filename: file.name
                }, function(result) {
                    if (result.success) {
                        // Reload attachments
                        self.loadAttachments(activity, listContainer);
                        self.updateAttachmentHint(activity, hintElement);
                        
                        // Update activity
                        if (!activity.attachments) activity.attachments = [];
                        activity.attachments.push(result.photo.id);
                        self.saveActivities();
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
        handleAddVoice: function(activity, listContainer, hintElement, button) {
            const self = this;
            
            if (!window.VoiceAttachmentHandler || !window.VoiceAttachmentHandler.isInitialized) {
                alert('Voice recording is not available');
                return;
            }
            
            // Create voice recording UI in a modal or inline
            const container = document.createElement('div');
            container.className = 'voice-recording-modal-content';
            
            // Create recording UI
            window.VoiceAttachmentHandler.createRecordingUI(container, activity.id);
            
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
                    if (e.detail.activityId === activity.id && e.detail.type === 'voice') {
                        // Reload attachments
                        self.loadAttachments(activity, listContainer);
                        self.updateAttachmentHint(activity, hintElement);
                        
                        // Update activity
                        if (!activity.attachments) activity.attachments = [];
                        activity.attachments.push(e.detail.attachment.id);
                        self.saveActivities();
                        
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
        deleteAttachment: function(attachment, activity, element) {
            const self = this;
            
            if (!confirm(`Delete this ${attachment.type}?`)) return;
            
            window.AttachmentManager.deleteAttachment(attachment.id, attachment.type, function(result) {
                if (result.success) {
                    // Remove from DOM
                    element.remove();
                    
                    // Update activity
                    if (activity.attachments) {
                        const index = activity.attachments.indexOf(attachment.id);
                        if (index > -1) {
                            activity.attachments.splice(index, 1);
                            self.saveActivities();
                        }
                    }
                    
                    // Update hint
                    const hintElement = document.querySelector('#attachment-hint');
                    self.updateAttachmentHint(activity, hintElement);
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
                self.saveActivities();
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
                
                self.saveActivities();
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
                self.saveActivities();
                self.render();
            }
        },
        
        // Delete activity permanently without command pattern
        deleteActivityDirect: function(activityId) {
            const self = this;
            const index = self.activities.findIndex(function(activity) {
                return activity.id === activityId;
            });
            
            if (index > -1) {
                // Clean up any active timer
                if (window.ActivityTimer && window.ActivityTimer.cancelTimer) {
                    window.ActivityTimer.cancelTimer(activityId);
                }
                
                self.activities.splice(index, 1);
                self.saveActivities();
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
            
            self.saveActivities();
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
                
                self.saveActivities();
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
                self.saveActivities();
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
                
                self.saveActivities();
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
                self.saveActivities();
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
                self.saveActivities();
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
                self.saveActivities();
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
                    self.saveActivities();
                    self.render();
                }
            }
        },
        
        /**
         * Get current display mode (numbers or time)
         */
        getDisplayMode: function() {
            try {
                const mode = localStorage.getItem('stackmap_display_mode');
                return mode === 'time' ? 'time' : 'numbers'; // Default to numbers
            } catch (e) {
                console.warn('Could not load display mode preference', e);
                return 'numbers';
            }
        },
        
        /**
         * Set display mode preference
         */
        setDisplayMode: function(mode) {
            const self = this;
            
            if (mode !== 'numbers' && mode !== 'time') {
                console.warn('Invalid display mode:', mode);
                return;
            }
            
            try {
                localStorage.setItem('stackmap_display_mode', mode);
                // Re-render to apply new display mode
                self.render();
            } catch (e) {
                console.warn('Could not save display mode preference', e);
            }
        },
        
        /**
         * Toggle between display modes
         */
        toggleDisplayMode: function() {
            const self = this;
            const currentMode = self.getDisplayMode();
            const newMode = currentMode === 'numbers' ? 'time' : 'numbers';
            self.setDisplayMode(newMode);
            
            // Dispatch event for other components
            document.dispatchEvent(new CustomEvent('displayModeChanged', {
                detail: { mode: newMode }
            }));
        },
        
        // BACKWARD COMPATIBILITY ALIASES
        // These ensure old code continues to work during transition
        addTask: function() { return this.addActivity.apply(this, arguments); },
        createTaskElement: function() { return this.createActivityElement.apply(this, arguments); },
        addTaskDirect: function() { return this.addActivityDirect.apply(this, arguments); },
        getUserTasks: function() { return this.getUserActivities.apply(this, arguments); },
        filterTasksByUser: function() { return this.filterActivitiesByUser.apply(this, arguments); },
        ensureTaskFields: function() { return this.ensureActivityFields.apply(this, arguments); },
        getTaskById: function() { return this.getActivityById.apply(this, arguments); },
        updateTask: function() { return this.updateActivity.apply(this, arguments); },
        deleteTask: function() { return this.deleteActivity.apply(this, arguments); },
        deleteTaskDirect: function() { return this.deleteActivityDirect.apply(this, arguments); },
        saveTasks: function() { return this.saveActivities.apply(this, arguments); }
    };
    
    // Export to global scope
    window.ActivityDisplay = ActivityDisplay;
    
    // BACKWARD COMPATIBILITY - Keep old name working
    window.TaskDisplay = ActivityDisplay;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            ActivityDisplay.init();
        });
    } else {
        // DOM already loaded
        ActivityDisplay.init();
    }
})();