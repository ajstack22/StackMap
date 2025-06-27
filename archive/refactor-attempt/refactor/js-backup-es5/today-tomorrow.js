/**
 * Today/Tomorrow View for StackMap
 * ADHD-friendly time management with binary choices
 * Implements gentle rollover and RSD-aware messaging
 */

(function() {
    'use strict';
    
    // Constants
    var TASK_TIMEFRAMES = {
        TODAY: 'today',
        TOMORROW: 'tomorrow',
        SOMEDAY: 'someday'
    };
    
    // RSD-aware messages (positive and gentle)
    var ROLLOVER_MESSAGES = {
        single: "Brought 1 task forward - fresh start! 🌅",
        multiple: "{count} tasks came along for today's journey",
        allDone: "Yesterday complete! Today is yours ✨",
        multiDay: "Welcome back! I've organized your tasks",
        firstTime: "Good morning! Let's see what today brings",
        welcome: "Ready when you are!"
    };
    
    // View sections configuration
    var SECTIONS = {
        today: {
            id: 'today-section',
            title: 'Today',
            icon: '☀️',
            emptyMessage: 'A clear day - add something if you\'d like',
            className: 'today-section'
        },
        tomorrow: {
            id: 'tomorrow-section', 
            title: 'Tomorrow',
            icon: '🌙',
            emptyMessage: 'Tomorrow is open',
            className: 'tomorrow-section'
        }
    };
    
    var TodayTomorrowView = {
        container: null,
        isInitialized: false,
        currentView: 'today', // 'today', 'tomorrow', 'all'
        tasks: [],
        draggedTask: null,
        lastRolloverCheck: null,
        // Cached filtered arrays for performance
        cachedFilters: {
            today: [],
            tomorrow: [],
            completedToday: [],
            lastUpdate: 0
        },
        
        /**
         * Initialize the view
         */
        init: function() {
            var self = this;
            
            // Find or create container
            self.container = document.getElementById('today-tomorrow-container');
            if (!self.container) {
                // Create container if it doesn't exist
                var mainView = document.getElementById('main-view');
                if (mainView) {
                    self.container = document.createElement('div');
                    self.container.id = 'today-tomorrow-container';
                    self.container.className = 'today-tomorrow-container';
                    
                    // Find task display wrapper or create one
                    var taskWrapper = mainView.querySelector('.task-display-wrapper');
                    if (taskWrapper) {
                        taskWrapper.appendChild(self.container);
                    } else {
                        mainView.appendChild(self.container);
                    }
                }
            }
            
            if (!self.container) {
                console.error('TodayTomorrow: Could not create container');
                return;
            }
            
            // Load tasks and render (rollover is handled by RolloverManager)
            self.loadTasks(function() {
                self.render();
                self.setupEventListeners();
                self.isInitialized = true;
                
                // Listen for rollover events
                document.addEventListener('tasksRolledOver', function(e) {
                    console.log('TodayTomorrow: Rollover event received', e.detail);
                    self.loadTasks(function() {
                        self.render();
                    });
                });
            });
        },
        
        /**
         * Load tasks from storage
         */
        loadTasks: function(callback) {
            var self = this;
            
            // Get tasks from TaskDisplay if available
            if (window.TaskDisplay && window.TaskDisplay.tasks) {
                self.tasks = window.TaskDisplay.tasks;
                self.migrateTasksIfNeeded();
                if (callback) callback();
            } else {
                // Load from storage directly
                if (window.StorageAdapter) {
                    window.StorageAdapter.get('tasks', function(err, data) {
                        if (!err && data && data.data) {
                            self.tasks = data.data || [];
                        } else {
                            self.tasks = [];
                        }
                        self.migrateTasksIfNeeded();
                        if (callback) callback();
                    });
                } else {
                    // Fallback to localStorage
                    try {
                        var stored = localStorage.getItem('stackmap_tasks');
                        self.tasks = stored ? JSON.parse(stored) : [];
                    } catch (e) {
                        self.tasks = [];
                    }
                    self.migrateTasksIfNeeded();
                    if (callback) callback();
                }
            }
        },
        
        /**
         * Migrate existing tasks to have timeframe field
         */
        migrateTasksIfNeeded: function() {
            var self = this;
            var needsSave = false;
            
            self.tasks.forEach(function(task) {
                // Add timeframe if missing
                if (!task.timeframe) {
                    task.timeframe = TASK_TIMEFRAMES.SOMEDAY;
                    task.originalDate = task.created_at || new Date().toISOString();
                    task.rolloverCount = 0;
                    task.lastRolloverDate = null;
                    needsSave = true;
                }
            });
            
            // Save if we made changes
            if (needsSave) {
                console.log('TodayTomorrow: Migrated tasks to include timeframe');
                self.saveTasks();
            }
        },
        
        
        /**
         * Show rollover message (RSD-aware)
         */
        showRolloverMessage: function(count) {
            var message;
            
            if (count === 0) {
                message = ROLLOVER_MESSAGES.allDone;
            } else if (count === 1) {
                message = ROLLOVER_MESSAGES.single;
            } else {
                message = ROLLOVER_MESSAGES.multiple.replace('{count}', count);
            }
            
            // Show gentle notification
            this.showNotification(message, 'rollover');
        },
        
        /**
         * Show notification
         */
        showNotification: function(message, type) {
            try {
                var notification = document.createElement('div');
                notification.className = 'today-tomorrow-notification ' + (type || '');
                notification.textContent = message;
                notification.setAttribute('role', 'status');
                notification.setAttribute('aria-live', 'polite');
                
                // Add to container
                if (this.container) {
                    this.container.appendChild(notification);
                    
                    // Fade in
                    setTimeout(function() {
                        notification.classList.add('visible');
                    }, 10);
                    
                    // Remove after delay
                    setTimeout(function() {
                        notification.classList.remove('visible');
                        setTimeout(function() {
                            if (notification.parentNode) {
                                notification.parentNode.removeChild(notification);
                            }
                        }, 300);
                    }, 3000);
                }
            } catch (e) {
                console.warn('Could not show notification:', e);
            }
        },
        
        /**
         * Render the view
         */
        render: function() {
            var self = this;
            
            if (!self.container) return;
            
            // Clear container
            self.container.innerHTML = '';
            
            // Create navigation tabs
            var nav = self.createNavigation();
            self.container.appendChild(nav);
            
            // Create sections container
            var sectionsContainer = document.createElement('div');
            sectionsContainer.className = 'today-tomorrow-sections';
            
            // Render based on current view
            if (self.currentView === 'all') {
                // Show all tasks view (existing functionality)
                self.renderAllTasksView(sectionsContainer);
            } else {
                // Show Today/Tomorrow view
                self.renderTodayTomorrowView(sectionsContainer);
            }
            
            self.container.appendChild(sectionsContainer);
            
            // Add panic button for today view
            if (self.currentView === 'today') {
                // Use cached today tasks
                if (self.cachedFilters.today.length > 3) { // Only show if overwhelmed
                    var panicButton = self.createPanicButton();
                    self.container.appendChild(panicButton);
                }
            }
        },
        
        /**
         * Create navigation tabs
         */
        createNavigation: function() {
            var self = this;
            
            var nav = document.createElement('nav');
            nav.className = 'today-tomorrow-nav';
            nav.setAttribute('role', 'tablist');
            
            // Today tab
            var todayTab = document.createElement('button');
            todayTab.className = 'tab-btn' + (self.currentView === 'today' ? ' active' : '');
            todayTab.textContent = 'Today';
            todayTab.setAttribute('role', 'tab');
            todayTab.setAttribute('aria-selected', self.currentView === 'today');
            todayTab.setAttribute('data-view', 'today');
            
            // Tomorrow tab
            var tomorrowTab = document.createElement('button');
            tomorrowTab.className = 'tab-btn' + (self.currentView === 'tomorrow' ? ' active' : '');
            tomorrowTab.textContent = 'Tomorrow';
            tomorrowTab.setAttribute('role', 'tab');
            tomorrowTab.setAttribute('aria-selected', self.currentView === 'tomorrow');
            tomorrowTab.setAttribute('data-view', 'tomorrow');
            
            // All tasks tab (hidden by default per PM review)
            var allTab = document.createElement('button');
            allTab.className = 'tab-btn' + (self.currentView === 'all' ? ' active' : '');
            allTab.textContent = 'All (' + self.getSomedayCount() + ')';
            allTab.setAttribute('role', 'tab');
            allTab.setAttribute('aria-selected', self.currentView === 'all');
            allTab.setAttribute('data-view', 'all');
            allTab.style.display = 'none'; // Hidden per PM review
            
            nav.appendChild(todayTab);
            nav.appendChild(tomorrowTab);
            nav.appendChild(allTab);
            
            return nav;
        },
        
        /**
         * Get count of someday tasks
         */
        getSomedayCount: function() {
            return this.tasks.filter(function(task) {
                return !task.completed && 
                       (!task.timeframe || task.timeframe === TASK_TIMEFRAMES.SOMEDAY);
            }).length;
        },
        
        /**
         * Update cached filters
         */
        updateCachedFilters: function() {
            var self = this;
            
            self.cachedFilters.today = self.tasks.filter(function(task) {
                return !task.completed && task.timeframe === TASK_TIMEFRAMES.TODAY;
            });
            
            self.cachedFilters.tomorrow = self.tasks.filter(function(task) {
                return !task.completed && task.timeframe === TASK_TIMEFRAMES.TOMORROW;
            });
            
            self.cachedFilters.completedToday = self.getCompletedTodayTasks();
            self.cachedFilters.lastUpdate = Date.now();
        },
        
        /**
         * Render Today/Tomorrow view
         */
        renderTodayTomorrowView: function(container) {
            var self = this;
            
            // Update cached filters if tasks have changed
            self.updateCachedFilters();
            
            // Use cached filters
            var todayTasks = self.cachedFilters.today;
            var tomorrowTasks = self.cachedFilters.tomorrow;
            var completedTodayTasks = self.cachedFilters.completedToday;
            
            // Show appropriate section based on current view
            if (self.currentView === 'today') {
                var todaySection = self.createSection(SECTIONS.today, todayTasks);
                container.appendChild(todaySection);
                
                // Add Done Today section if there are completed tasks
                if (completedTodayTasks.length > 0) {
                    var doneSection = self.createDoneTodaySection(completedTodayTasks);
                    container.appendChild(doneSection);
                }
            } else if (self.currentView === 'tomorrow') {
                var tomorrowSection = self.createSection(SECTIONS.tomorrow, tomorrowTasks);
                container.appendChild(tomorrowSection);
            }
        },
        
        /**
         * Get tasks completed today
         */
        getCompletedTodayTasks: function() {
            var self = this;
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            
            return self.tasks.filter(function(task) {
                if (!task.completed || !task.completed_at) return false;
                
                var completedDate = new Date(task.completed_at);
                completedDate.setHours(0, 0, 0, 0);
                
                return completedDate.getTime() === today.getTime();
            });
        },
        
        /**
         * Create Done Today section
         */
        createDoneTodaySection: function(tasks) {
            var self = this;
            
            var section = document.createElement('section');
            section.className = 'timeframe-section done-today-section';
            section.setAttribute('data-timeframe', 'done-today');
            
            // Header
            var header = document.createElement('div');
            header.className = 'section-header done-header';
            
            var icon = document.createElement('span');
            icon.className = 'section-icon';
            icon.textContent = '✅';
            
            var title = document.createElement('h2');
            title.className = 'section-title';
            title.textContent = 'Done Today (' + tasks.length + ')';
            
            // Celebration message if many tasks completed
            if (tasks.length >= 5) {
                var celebrationMsg = document.createElement('span');
                celebrationMsg.className = 'celebration-msg';
                celebrationMsg.textContent = ' 🎉 Amazing progress!';
                title.appendChild(celebrationMsg);
            }
            
            header.appendChild(icon);
            header.appendChild(title);
            section.appendChild(header);
            
            // Completed task list
            var taskList = document.createElement('div');
            taskList.className = 'task-list completed-list';
            
            tasks.forEach(function(task) {
                var taskElement = self.createCompletedTaskElement(task);
                taskList.appendChild(taskElement);
            });
            
            section.appendChild(taskList);
            
            // Auto-hide after 24h message
            var hideNote = document.createElement('div');
            hideNote.className = 'done-today-note';
            hideNote.textContent = 'These will clear tomorrow morning';
            section.appendChild(hideNote);
            
            return section;
        },
        
        /**
         * Create completed task element
         */
        createCompletedTaskElement: function(task) {
            var element = document.createElement('div');
            element.className = 'task-item completed-task';
            element.setAttribute('data-task-id', task.id);
            
            // Checkbox (checked and disabled)
            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.disabled = true;
            checkbox.className = 'task-checkbox';
            
            // Label with strikethrough
            var label = document.createElement('label');
            label.className = 'task-label completed';
            label.textContent = task.title || 'Untitled task';
            
            // Time completed
            if (task.completed_at) {
                var completedTime = new Date(task.completed_at);
                var hours = completedTime.getHours();
                var minutes = completedTime.getMinutes();
                var ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // 0 should be 12
                minutes = minutes < 10 ? '0' + minutes : minutes;
                
                var timeSpan = document.createElement('span');
                timeSpan.className = 'completed-time';
                timeSpan.textContent = ' at ' + hours + ':' + minutes + ' ' + ampm;
                label.appendChild(timeSpan);
            }
            
            element.appendChild(checkbox);
            element.appendChild(label);
            
            return element;
        },
        
        /**
         * Create a section (Today or Tomorrow)
         */
        createSection: function(config, tasks) {
            var self = this;
            
            var section = document.createElement('section');
            section.id = config.id;
            section.className = 'timeframe-section ' + config.className;
            section.setAttribute('data-timeframe', config.id.replace('-section', ''));
            
            // Header
            var header = document.createElement('div');
            header.className = 'section-header';
            
            var icon = document.createElement('span');
            icon.className = 'section-icon';
            icon.textContent = config.icon;
            
            var title = document.createElement('h2');
            title.className = 'section-title';
            title.textContent = config.title + ' (' + tasks.length + ')';
            
            header.appendChild(icon);
            header.appendChild(title);
            section.appendChild(header);
            
            // Task list or empty state
            if (tasks.length === 0) {
                var emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.textContent = config.emptyMessage;
                section.appendChild(emptyState);
            } else {
                var taskList = document.createElement('div');
                taskList.className = 'task-list';
                
                tasks.forEach(function(task) {
                    var taskElement = self.createTaskElement(task);
                    taskList.appendChild(taskElement);
                });
                
                section.appendChild(taskList);
            }
            
            // Add task button
            var addButton = document.createElement('button');
            addButton.className = 'add-task-btn';
            addButton.textContent = '+ Add task for ' + config.title.toLowerCase();
            addButton.setAttribute('data-timeframe', config.id.replace('-section', ''));
            section.appendChild(addButton);
            
            return section;
        },
        
        /**
         * Create task element
         */
        createTaskElement: function(task) {
            var element = document.createElement('div');
            element.className = 'task-item';
            element.setAttribute('data-task-id', task.id);
            element.setAttribute('draggable', 'true');
            element.setAttribute('tabindex', '0');
            element.setAttribute('role', 'listitem');
            element.setAttribute('aria-label', task.title || 'Untitled task');
            
            // Checkbox
            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.className = 'task-checkbox';
            checkbox.id = 'task-check-' + task.id;
            
            // Label
            var label = document.createElement('label');
            label.className = 'task-label';
            label.setAttribute('for', checkbox.id);
            label.textContent = task.title || 'Untitled task';
            
            // Rollover indicator and visual aging
            if (task.rolloverCount > 0) {
                var rolloverBadge = document.createElement('span');
                rolloverBadge.className = 'rollover-badge';
                rolloverBadge.title = 'Rolled over ' + task.rolloverCount + ' time' + 
                                    (task.rolloverCount > 1 ? 's' : '');
                
                // Visual aging (per PM review)
                if (task.rolloverCount <= 3) {
                    rolloverBadge.className += ' normal';
                } else if (task.rolloverCount <= 7) {
                    rolloverBadge.className += ' aging';
                } else {
                    rolloverBadge.className += ' old';
                }
                
                element.appendChild(rolloverBadge);
                
                // Add subtle visual aging to the entire task
                if (task.rolloverCount > 3) {
                    element.classList.add('task-aging');
                    if (task.rolloverCount > 7) {
                        element.classList.add('task-old');
                    }
                }
            }
            
            element.appendChild(checkbox);
            element.appendChild(label);
            
            return element;
        },
        
        /**
         * Render all tasks view
         */
        renderAllTasksView: function(container) {
            // This will show the existing task display
            // For now, just show a placeholder
            var placeholder = document.createElement('div');
            placeholder.className = 'all-tasks-placeholder';
            placeholder.textContent = 'All tasks view - to be implemented';
            container.appendChild(placeholder);
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            var self = this;
            
            // Tab navigation
            self.container.addEventListener('click', function(e) {
                if (e.target.classList.contains('tab-btn')) {
                    var view = e.target.getAttribute('data-view');
                    self.switchView(view);
                }
                
                // Add task button
                if (e.target.classList.contains('add-task-btn')) {
                    var timeframe = e.target.getAttribute('data-timeframe');
                    self.addTask(timeframe);
                }
                
                // Task checkbox
                if (e.target.classList.contains('task-checkbox')) {
                    var taskId = e.target.closest('.task-item').getAttribute('data-task-id');
                    self.toggleTask(taskId);
                }
            });
            
            // Drag and drop (will be implemented in Phase 3)
            if (window.EditMode && window.EditMode.isActive()) {
                self.setupDragAndDrop();
            }
        },
        
        /**
         * Switch view
         */
        switchView: function(view) {
            var self = this;
            
            self.currentView = view;
            self.render();
            
            // Update active tab
            var tabs = self.container.querySelectorAll('.tab-btn');
            tabs.forEach(function(tab) {
                var isActive = tab.getAttribute('data-view') === view;
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', isActive);
            });
        },
        
        /**
         * Add new task with timeframe
         */
        addTask: function(timeframe) {
            var self = this;
            
            // Create new task with appropriate timeframe
            if (window.TaskDisplay && window.TaskDisplay.addTask) {
                // Let TaskDisplay handle creation, then update timeframe
                window.TaskDisplay.addTask();
                
                // Find the newly created task and update its timeframe
                setTimeout(function() {
                    if (window.TaskDisplay.tasks.length > 0) {
                        var newTask = window.TaskDisplay.tasks[0];
                        newTask.timeframe = timeframe;
                        self.saveTasks();
                    }
                }, 100);
            }
        },
        
        /**
         * Toggle task completion
         */
        toggleTask: function(taskId) {
            var self = this;
            
            var task = self.tasks.find(function(t) {
                return t.id === taskId;
            });
            
            if (task) {
                task.completed = !task.completed;
                task.updated_at = new Date().toISOString();
                
                if (task.completed) {
                    // Set completion time
                    task.completed_at = new Date().toISOString();
                    
                    // Count completed tasks today for milestone celebration
                    var completedToday = self.getCompletedTodayTasks();
                    var completedCount = completedToday.length + 1; // +1 for current task
                    
                    // Celebration based on milestone
                    if (window.CelebrationSystem) {
                        var celebrationType = 'small';
                        var celebrationMessage = 'Task completed! ✅';
                        
                        // Check for milestones
                        if (completedCount === 5) {
                            celebrationType = 'medium';
                            celebrationMessage = '5 tasks done today! Amazing! 🎉';
                        } else if (completedCount === 10) {
                            celebrationType = 'medium';
                            celebrationMessage = '10 tasks! You\'re on fire! 🔥';
                        } else if (completedCount === 15) {
                            celebrationType = 'medium';
                            celebrationMessage = '15 tasks! Incredible focus! 💪';
                        }
                        
                        var event;
                        try {
                            event = new CustomEvent('celebrate', {
                                detail: {
                                    type: celebrationType,
                                    message: celebrationMessage
                                }
                            });
                        } catch (e) {
                            event = document.createEvent('CustomEvent');
                            event.initCustomEvent('celebrate', true, true, {
                                type: celebrationType,
                                message: celebrationMessage
                            });
                        }
                        document.dispatchEvent(event);
                    }
                    
                    // Check if all today tasks are complete
                    if (task.timeframe === TASK_TIMEFRAMES.TODAY) {
                        var remainingToday = self.tasks.filter(function(t) {
                            return !t.completed && t.timeframe === TASK_TIMEFRAMES.TODAY;
                        });
                        
                        if (remainingToday.length === 0) {
                            // Big celebration!
                            setTimeout(function() {
                                self.celebrateCompletion();
                            }, 500); // Small delay for effect
                        }
                    }
                } else {
                    // Uncompleting a task
                    task.completed_at = null;
                }
                
                self.saveTasks(function() {
                    self.render();
                });
            }
        },
        
        /**
         * Celebrate completing all today tasks
         */
        celebrateCompletion: function() {
            var self = this;
            
            // Show notification
            self.showNotification(ROLLOVER_MESSAGES.allDone, 'celebration');
            
            // Trigger celebration system if available
            if (window.CelebrationSystem) {
                // Dispatch celebration event
                var event;
                try {
                    event = new CustomEvent('celebrate', {
                        detail: {
                            type: 'large',
                            message: 'All tasks complete! Amazing work! 🌟'
                        }
                    });
                } catch (e) {
                    // Fallback for older browsers
                    event = document.createEvent('CustomEvent');
                    event.initCustomEvent('celebrate', true, true, {
                        type: 'large',
                        message: 'All tasks complete! Amazing work! 🌟'
                    });
                }
                document.dispatchEvent(event);
            }
            
            // Add visual celebration
            if (self.container) {
                self.container.classList.add('celebrating');
                setTimeout(function() {
                    self.container.classList.remove('celebrating');
                }, 2000);
            }
        },
        
        /**
         * Save tasks
         */
        saveTasks: function(callback) {
            var self = this;
            
            // Update TaskDisplay if available
            if (window.TaskDisplay) {
                window.TaskDisplay.tasks = self.tasks;
                if (window.TaskDisplay.saveTasks) {
                    window.TaskDisplay.saveTasks(callback);
                    return;
                }
            }
            
            // Save directly
            if (window.StorageAdapter) {
                window.StorageAdapter.save('tasks', self.tasks, callback);
            } else {
                try {
                    localStorage.setItem('stackmap_tasks', JSON.stringify(self.tasks));
                    if (callback) callback();
                } catch (e) {
                    console.error('Failed to save tasks:', e);
                    if (callback) callback(e);
                }
            }
        },
        
        /**
         * Create panic button (Move all to tomorrow)
         */
        createPanicButton: function() {
            var self = this;
            
            var button = document.createElement('button');
            button.className = 'bulk-move-btn panic-button';
            button.innerHTML = '😰 Move all to tomorrow';
            button.title = 'Feeling overwhelmed? Move everything to tomorrow and start fresh';
            
            button.onclick = function() {
                self.moveAllToTomorrow();
            };
            
            return button;
        },
        
        /**
         * Move all today tasks to tomorrow
         */
        moveAllToTomorrow: function() {
            var self = this;
            
            var todayTasks = self.tasks.filter(function(task) {
                return !task.completed && task.timeframe === TASK_TIMEFRAMES.TODAY;
            });
            
            if (todayTasks.length === 0) return;
            
            // Confirm with gentle message
            var message = 'Move all ' + todayTasks.length + ' tasks to tomorrow? ' +
                         'No judgment - sometimes we need a fresh start! 💙';
            
            if (confirm(message)) {
                // Move tasks
                todayTasks.forEach(function(task) {
                    task.timeframe = TASK_TIMEFRAMES.TOMORROW;
                    task.updated_at = new Date().toISOString();
                });
                
                // Save and refresh
                self.saveTasks(function() {
                    self.render();
                    self.showNotification('All tasks moved to tomorrow. Today is yours! 🌅', 'success');
                });
            }
        },
        
        /**
         * Setup drag and drop for task movement between sections
         */
        setupDragAndDrop: function() {
            var self = this;
            
            // Touch support detection
            var supportsTouch = 'ontouchstart' in window;
            
            // Drag start handler
            self.container.addEventListener('dragstart', function(e) {
                var taskItem = e.target.closest('.task-item');
                if (!taskItem || !taskItem.getAttribute('draggable')) return;
                
                var taskId = taskItem.getAttribute('data-task-id');
                var task = self.tasks.find(function(t) {
                    return t.id === taskId;
                });
                
                if (task) {
                    self.draggedTask = task;
                    taskItem.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', taskId);
                }
            });
            
            // Drag end handler
            self.container.addEventListener('dragend', function(e) {
                var taskItem = e.target.closest('.task-item');
                if (taskItem) {
                    taskItem.classList.remove('dragging');
                }
                self.draggedTask = null;
            });
            
            // Drag over handler for sections
            self.container.addEventListener('dragover', function(e) {
                if (!self.draggedTask) return;
                
                var section = e.target.closest('.timeframe-section');
                if (section) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    
                    // Visual feedback
                    section.classList.add('drag-over');
                }
            });
            
            // Drag leave handler
            self.container.addEventListener('dragleave', function(e) {
                var section = e.target.closest('.timeframe-section');
                if (section && !section.contains(e.relatedTarget)) {
                    section.classList.remove('drag-over');
                }
            });
            
            // Drop handler
            self.container.addEventListener('drop', function(e) {
                e.preventDefault();
                
                var section = e.target.closest('.timeframe-section');
                if (!section || !self.draggedTask) return;
                
                section.classList.remove('drag-over');
                
                var newTimeframe = section.getAttribute('data-timeframe');
                if (newTimeframe && newTimeframe !== self.draggedTask.timeframe) {
                    // Update task timeframe
                    self.draggedTask.timeframe = newTimeframe;
                    self.draggedTask.updated_at = new Date().toISOString();
                    
                    // Save and refresh
                    self.saveTasks(function() {
                        self.render();
                        
                        // Show feedback
                        var message = 'Task moved to ' + newTimeframe;
                        self.showNotification(message, 'success');
                    });
                }
            });
            
            // Touch drag support using pointer events (more compatible than touch events)
            if (supportsTouch) {
                self.setupTouchDrag();
            }
            
            // Keyboard shortcuts for quick moves
            document.addEventListener('keydown', function(e) {
                // Only in edit mode and when no input is focused
                if (!window.EditMode || !window.EditMode.isActive()) return;
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                
                var selectedTask = document.querySelector('.task-item:focus');
                if (!selectedTask) return;
                
                var taskId = selectedTask.getAttribute('data-task-id');
                var task = self.tasks.find(function(t) {
                    return t.id === taskId;
                });
                
                if (!task) return;
                
                // T = move to Today
                if (e.key === 't' || e.key === 'T') {
                    e.preventDefault();
                    self.moveTaskToTimeframe(task, 'today');
                }
                // M = move to toMorrow
                else if (e.key === 'm' || e.key === 'M') {
                    e.preventDefault();
                    self.moveTaskToTimeframe(task, 'tomorrow');
                }
            });
        },
        
        /**
         * Setup touch drag support
         */
        setupTouchDrag: function() {
            var self = this;
            var draggedElement = null;
            var touchOffset = { x: 0, y: 0 };
            var dragGhost = null;
            
            // Long press to start drag
            var longPressTimer = null;
            var longPressDuration = 500; // 500ms long press
            
            self.container.addEventListener('touchstart', function(e) {
                var taskItem = e.target.closest('.task-item');
                if (!taskItem || !taskItem.getAttribute('draggable')) return;
                
                var touch = e.touches[0];
                touchOffset.x = touch.clientX;
                touchOffset.y = touch.clientY;
                
                // Start long press timer
                longPressTimer = setTimeout(function() {
                    // Haptic feedback if available
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    
                    draggedElement = taskItem;
                    taskItem.classList.add('dragging');
                    
                    // Create visual ghost
                    dragGhost = taskItem.cloneNode(true);
                    dragGhost.style.position = 'fixed';
                    dragGhost.style.zIndex = '9999';
                    dragGhost.style.opacity = '0.8';
                    dragGhost.style.pointerEvents = 'none';
                    dragGhost.style.width = taskItem.offsetWidth + 'px';
                    document.body.appendChild(dragGhost);
                    
                    self.updateDragGhostPosition(touch.clientX, touch.clientY, dragGhost);
                }, longPressDuration);
            });
            
            self.container.addEventListener('touchmove', function(e) {
                if (longPressTimer && !draggedElement) {
                    // Cancel long press if moved too much
                    var touch = e.touches[0];
                    var moveThreshold = 10;
                    if (Math.abs(touch.clientX - touchOffset.x) > moveThreshold ||
                        Math.abs(touch.clientY - touchOffset.y) > moveThreshold) {
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                    }
                }
                
                if (draggedElement && dragGhost) {
                    e.preventDefault();
                    var touch = e.touches[0];
                    
                    self.updateDragGhostPosition(touch.clientX, touch.clientY, dragGhost);
                    
                    // Find drop target
                    var dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
                    var section = dropTarget ? dropTarget.closest('.timeframe-section') : null;
                    
                    // Update visual feedback
                    var sections = self.container.querySelectorAll('.timeframe-section');
                    sections.forEach(function(s) {
                        s.classList.toggle('drag-over', s === section);
                    });
                }
            });
            
            self.container.addEventListener('touchend', function(e) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
                
                if (draggedElement && dragGhost) {
                    var touch = e.changedTouches[0];
                    var dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
                    var section = dropTarget ? dropTarget.closest('.timeframe-section') : null;
                    
                    if (section) {
                        var taskId = draggedElement.getAttribute('data-task-id');
                        var task = self.tasks.find(function(t) {
                            return t.id === taskId;
                        });
                        
                        var newTimeframe = section.getAttribute('data-timeframe');
                        if (task && newTimeframe && newTimeframe !== task.timeframe) {
                            self.moveTaskToTimeframe(task, newTimeframe);
                        }
                    }
                    
                    // Cleanup
                    draggedElement.classList.remove('dragging');
                    draggedElement = null;
                    
                    if (dragGhost && dragGhost.parentNode) {
                        dragGhost.parentNode.removeChild(dragGhost);
                    }
                    dragGhost = null;
                    
                    // Remove all drag-over classes
                    var sections = self.container.querySelectorAll('.timeframe-section');
                    sections.forEach(function(s) {
                        s.classList.remove('drag-over');
                    });
                }
            });
            
            // Cancel on touch cancel
            self.container.addEventListener('touchcancel', function() {
                clearTimeout(longPressTimer);
                longPressTimer = null;
                
                if (draggedElement) {
                    draggedElement.classList.remove('dragging');
                    draggedElement = null;
                }
                
                if (dragGhost && dragGhost.parentNode) {
                    dragGhost.parentNode.removeChild(dragGhost);
                }
                dragGhost = null;
            });
        },
        
        /**
         * Update drag ghost position
         */
        updateDragGhostPosition: function(x, y, ghost) {
            if (!ghost) return;
            
            ghost.style.left = (x - 20) + 'px';
            ghost.style.top = (y - 20) + 'px';
        },
        
        /**
         * Move task to different timeframe
         */
        moveTaskToTimeframe: function(task, newTimeframe) {
            var self = this;
            
            if (task.timeframe === newTimeframe) return;
            
            task.timeframe = newTimeframe;
            task.updated_at = new Date().toISOString();
            
            self.saveTasks(function() {
                self.render();
                
                var message = 'Task moved to ' + newTimeframe;
                self.showNotification(message, 'success');
            });
        }
    };
    
    // Expose to global scope
    window.TodayTomorrowView = TodayTomorrowView;
    
    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            TodayTomorrowView.init();
        });
    } else {
        // DOM already loaded
        setTimeout(function() {
            TodayTomorrowView.init();
        }, 100);
    }
})();