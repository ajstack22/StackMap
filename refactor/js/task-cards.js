/**
 * Task Cards UI for StackMap Mobile Refactor
 * Handles card-based rendering of tasks
 */

(function() {
    'use strict';
    
    var TaskCards = {
        /**
         * Enable card view in TaskDisplay
         */
        init: function() {
            var self = this;
            
            // Override TaskDisplay render method
            if (window.TaskDisplay) {
                // Store original methods
                window.TaskDisplay._originalRender = window.TaskDisplay.render;
                window.TaskDisplay._originalCreateTaskElement = window.TaskDisplay.createTaskElement;
                
                // Replace with card versions
                window.TaskDisplay.render = self.renderCards.bind(self);
                window.TaskDisplay.createTaskElement = self.createTaskCard.bind(self);
                window.TaskDisplay.createTaskCard = self.createTaskCard.bind(self);
                
                // Add helper methods
                window.TaskDisplay.createAddTaskCard = self.createAddTaskCard.bind(self);
                window.TaskDisplay.createEmptyState = self.createEmptyState.bind(self);
                
                // Initialize task card pool if available
                if (window.TaskCardPool) {
                    window.TaskCardPool.init();
                }
            }
        },
        
        /**
         * Release all task cards back to pool
         */
        releaseAllCards: function(container) {
            if (!window.TaskCardPool || !window.TaskCardPool.initialized) return;
            
            var cards = container.querySelectorAll('.task-card[data-pooled="true"]');
            for (var i = 0; i < cards.length; i++) {
                window.TaskCardPool.release(cards[i]);
            }
        },
        
        /**
         * Render tasks as cards
         */
        renderCards: function() {
            var self = this;
            var taskDisplay = window.TaskDisplay;
            var container = taskDisplay.container;
            
            // Clear container and release cards to pool
            self.releaseAllCards(container);
            container.innerHTML = '';
            
            // Clear timer button cache when re-rendering
            if (window.TaskTimer && window.TaskTimer.clearButtonCache) {
                window.TaskTimer.clearButtonCache();
            }
            
            // Create cards grid container
            var cardsGrid = document.createElement('div');
            cardsGrid.className = 'cards-grid';
            
            // Filter tasks for current user
            var userTasks = taskDisplay.getUserTasks();
            
            // Add new task card (only in edit mode)
            if (window.EditMode && window.EditMode.isActive()) {
                var addCard = this.createAddTaskCard();
                cardsGrid.appendChild(addCard);
            }
            
            // Render tasks or empty state
            if (userTasks.length === 0 && (!window.EditMode || !window.EditMode.isActive())) {
                var emptyState = this.createEmptyState();
                container.appendChild(emptyState);
            } else {
                // Add task cards using DocumentFragment for better performance
                var self = this;
                var fragment = document.createDocumentFragment();
                
                userTasks.forEach(function(task, index) {
                    var taskCard = self.createTaskCard(task, index + 1);
                    fragment.appendChild(taskCard);
                });
                
                // Batch append all cards at once
                cardsGrid.appendChild(fragment);
                container.appendChild(cardsGrid);
                
                // Pre-warm timer button cache after render
                if (window.TaskTimer && window.TaskTimer.prewarmButtonCache) {
                    // Small delay to ensure DOM is ready
                    setTimeout(function() {
                        window.TaskTimer.prewarmButtonCache();
                    }, 50);
                }
            }
        },
        
        /**
         * Create task card element
         */
        createTaskCard: function(task, number) {
            var taskDisplay = window.TaskDisplay;
            var self = this;
            
            // Determine card state
            var cardState = '';
            if (task.completed) {
                cardState = 'task-card--completed';
            } else if (task.in_progress) {
                cardState = 'task-card--in-progress';
            } else {
                cardState = 'task-card--pending';
            }
            
            // Get card from pool if available
            var card;
            if (window.TaskCardPool && window.TaskCardPool.initialized) {
                card = window.TaskCardPool.acquire();
                card.className = 'task-card ' + cardState;
            } else {
                // Fallback to creating new card
                card = document.createElement('div');
                card.className = 'task-card ' + cardState;
            }
            
            card.setAttribute('data-task-id', task.id);
            
            // ARIA attributes for screen readers
            card.setAttribute('role', 'option');
            card.setAttribute('aria-label', (task.title || 'Untitled Task') + ', ' + (task.completed ? 'completed' : 'not completed'));
            
            // Check if using pooled card
            var isPooled = card.getAttribute('data-pooled') === 'true';
            
            if (isPooled) {
                // Update existing elements in pooled card
                var checkbox = card.querySelector('.task-checkbox');
                if (checkbox) {
                    checkbox.checked = task.completed;
                    checkbox.setAttribute('aria-label', 'Mark ' + (task.title || 'task') + ' as ' + (task.completed ? 'incomplete' : 'complete'));
                    
                    // Remove old listener if exists
                    if (checkbox._taskHandler) {
                        checkbox.removeEventListener('change', checkbox._taskHandler);
                    }
                    
                    // Add new listener
                    checkbox._taskHandler = function() {
                        task.completed = checkbox.checked;
                        taskDisplay.updateTask(task);
                        
                        // Update card ARIA label
                        card.setAttribute('aria-label', (task.title || 'Untitled Task') + ', ' + (task.completed ? 'completed' : 'not completed'));
                        
                        // Announce state change
                        if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                            window.StackMapKeyboardNav.announce(task.title + ' marked as ' + (task.completed ? 'complete' : 'incomplete'));
                        }
                    };
                    checkbox.addEventListener('change', checkbox._taskHandler);
                    
                    // Store cleanup function
                    card._cleanup = function() {
                        if (checkbox._taskHandler) {
                            checkbox.removeEventListener('change', checkbox._taskHandler);
                            delete checkbox._taskHandler;
                        }
                    };
                }
                
                // Update title
                var title = card.querySelector('.task-title');
                if (title) title.textContent = task.title || 'Untitled Task';
                
                // Update description
                var description = card.querySelector('.task-description');
                if (description) description.textContent = task.notes || '';
                
                // Update category
                var category = card.querySelector('.task-category');
                if (category && task.activity_name) {
                    category.textContent = task.activity_name;
                    category.className = 'task-category category-' + (task.category || 'general').toLowerCase();
                }
                
                // Update priority
                var priority = card.querySelector('.task-priority');
                if (priority && task.priority) {
                    priority.textContent = task.priority;
                    priority.className = 'task-priority priority-' + task.priority.toLowerCase();
                }
            } else {
                // Create new structure for non-pooled cards
                // Completion indicator
                var completion = document.createElement('div');
                completion.className = 'task-card__completion';
                
                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.completed;
                checkbox.setAttribute('aria-label', 'Mark ' + (task.title || 'task') + ' as ' + (task.completed ? 'incomplete' : 'complete'));
                checkbox.onchange = function() {
                    task.completed = checkbox.checked;
                    taskDisplay.updateTask(task);
                    
                    // Update card ARIA label
                    card.setAttribute('aria-label', (task.title || 'Untitled Task') + ', ' + (task.completed ? 'completed' : 'not completed'));
                    
                    // Announce state change
                    if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                        window.StackMapKeyboardNav.announce(task.title + ' marked as ' + (task.completed ? 'complete' : 'incomplete'));
                    }
                };
                
                completion.appendChild(checkbox);
                
                var checkIcon = document.createElement('span');
                checkIcon.className = 'task-card__completion-icon';
                checkIcon.textContent = '✓';
                checkIcon.setAttribute('aria-hidden', 'true');
                completion.appendChild(checkIcon);
                
                card.appendChild(completion);
            }
            
            // Number badge (if provided)
            if (number) {
                var numberBadge = document.createElement('div');
                numberBadge.className = 'task-card__number';
                numberBadge.textContent = number;
                card.appendChild(numberBadge);
            }
            
            // Card header with icon
            var header = document.createElement('div');
            header.className = 'task-card__header';
            
            var icon = document.createElement('div');
            icon.className = 'task-card__icon';
            icon.textContent = task.icon || '✓';
            header.appendChild(icon);
            
            card.appendChild(header);
            
            // Card content
            var content = document.createElement('div');
            content.className = 'task-card__content';
            
            var title = document.createElement('h3');
            title.className = 'task-card__title';
            title.textContent = task.title || 'Untitled Task';
            content.appendChild(title);
            
            if (task.description) {
                var description = document.createElement('p');
                description.className = 'task-card__description';
                description.textContent = task.description;
                content.appendChild(description);
            }
            
            // Progress indicator for subtasks
            if (task.subtasks && task.subtasks.length > 0) {
                var progress = this.createProgressIndicator(task);
                content.appendChild(progress);
            }
            
            card.appendChild(content);
            
            // Photo attachments section
            if (window.PhotoAttachmentUI && window.PhotoAttachmentStorage) {
                var photoSection = document.createElement('div');
                photoSection.className = 'task-card__photos';
                
                // Use singleton instance of photo storage
                var photoStorage = window.PhotoAttachmentStorage.getInstance();
                var photoUI = new window.PhotoAttachmentUI(photoStorage);
                photoUI.createAttachmentUI(task.id, photoSection);
                
                card.appendChild(photoSection);
            }
            
            // Card footer with metadata
            var footer = document.createElement('div');
            footer.className = 'task-card__footer';
            
            // Time estimate
            if (task.time_estimate) {
                var time = document.createElement('div');
                time.className = 'task-card__time';
                time.innerHTML = '⏱ ' + task.time_estimate + ' min';
                footer.appendChild(time);
            }
            
            // Timer button
            if (window.TaskTimer) {
                var timerBtn = document.createElement('button');
                timerBtn.className = 'task-timer-button';
                timerBtn.setAttribute('aria-label', 'Set timer for task');
                timerBtn.setAttribute('data-task-id', task.id);
                
                // Check if there's an active timer
                var existingTimer = window.TaskTimer.getTimer(task.id);
                if (existingTimer) {
                    timerBtn.innerHTML = '⏱️ ' + window.TaskTimer.formatTime(existingTimer.remaining);
                    timerBtn.classList.add('active');
                    if (existingTimer.remaining === 0) {
                        timerBtn.classList.add('complete');
                    } else if (existingTimer.remaining <= 60) {
                        timerBtn.classList.add('warning');
                    }
                    if (existingTimer.isPaused) {
                        timerBtn.classList.add('paused');
                    }
                } else {
                    timerBtn.innerHTML = '⏱️';
                }
                
                timerBtn.onclick = function(e) {
                    e.stopPropagation();
                    window.TaskTimer.showTimerMenu(task.id, timerBtn);
                };
                
                footer.appendChild(timerBtn);
            }
            
            // Category
            if (task.category) {
                var category = document.createElement('div');
                category.className = 'task-card__category';
                category.textContent = this.getCategoryName(task.category);
                footer.appendChild(category);
            }
            
            if (footer.children.length > 0) {
                card.appendChild(footer);
            }
            
            // Edit mode buttons
            if (window.EditMode && window.EditMode.isActive()) {
                var editButtons = this.createEditButtons(task);
                card.appendChild(editButtons);
            }
            
            // Card click handler (edit in modal)
            card.onclick = function(e) {
                // Don't trigger on button clicks
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
                    return;
                }
                
                if (window.EditMode && window.EditMode.isActive()) {
                    taskDisplay.startEditing(task);
                }
            };
            
            return card;
        },
        
        /**
         * Create progress indicator
         */
        createProgressIndicator: function(task) {
            var completed = 0;
            var total = task.subtasks.length;
            
            task.subtasks.forEach(function(subtask) {
                if (subtask.completed) completed++;
            });
            
            var progress = document.createElement('div');
            progress.className = 'task-card__progress';
            
            var progressBar = document.createElement('div');
            progressBar.className = 'task-card__progress-bar';
            
            var progressFill = document.createElement('div');
            progressFill.className = 'task-card__progress-fill';
            progressFill.style.width = (completed / total * 100) + '%';
            
            progressBar.appendChild(progressFill);
            progress.appendChild(progressBar);
            
            var progressText = document.createElement('div');
            progressText.className = 'task-card__progress-text';
            progressText.textContent = completed + ' of ' + total + ' steps complete';
            progress.appendChild(progressText);
            
            return progress;
        },
        
        /**
         * Create edit mode buttons
         */
        createEditButtons: function(task) {
            var taskDisplay = window.TaskDisplay;
            var self = this;
            
            var container = document.createElement('div');
            container.className = 'task-card__edit-buttons';
            
            // Create arrow buttons container
            var arrowContainer = document.createElement('div');
            arrowContainer.className = 'task-arrows';
            
            // Up arrow button
            var upBtn = document.createElement('button');
            upBtn.className = 'task-arrow-up';
            upBtn.innerHTML = '↑';
            upBtn.setAttribute('aria-label', 'Move task up');
            
            // Check if task can move up
            if (window.TaskReorder && window.TaskReorder.canMoveUp(task)) {
                upBtn.onclick = function(e) {
                    e.stopPropagation();
                    window.TaskReorder.moveUp(task);
                };
            } else {
                upBtn.disabled = true;
                upBtn.classList.add('disabled');
            }
            
            // Down arrow button
            var downBtn = document.createElement('button');
            downBtn.className = 'task-arrow-down';
            downBtn.innerHTML = '↓';
            downBtn.setAttribute('aria-label', 'Move task down');
            
            // Check if task can move down
            if (window.TaskReorder && window.TaskReorder.canMoveDown(task)) {
                downBtn.onclick = function(e) {
                    e.stopPropagation();
                    window.TaskReorder.moveDown(task);
                };
            } else {
                downBtn.disabled = true;
                downBtn.classList.add('disabled');
            }
            
            arrowContainer.appendChild(upBtn);
            arrowContainer.appendChild(downBtn);
            container.appendChild(arrowContainer);
            
            // Delete button
            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-card__delete-btn';
            deleteBtn.innerHTML = '🗑';
            deleteBtn.setAttribute('aria-label', 'Delete task');
            deleteBtn.onclick = function(e) {
                e.stopPropagation();
                if (confirm('Delete this task?')) {
                    taskDisplay.deleteTask(task);
                }
            };
            container.appendChild(deleteBtn);
            
            // Menu button
            var menuBtn = document.createElement('button');
            menuBtn.className = 'task-card__menu-btn';
            menuBtn.innerHTML = '⋯';
            menuBtn.setAttribute('aria-label', 'Task options');
            menuBtn.onclick = function(e) {
                e.stopPropagation();
                // TODO: Show task options menu
            };
            container.appendChild(menuBtn);
            
            return container;
        },
        
        /**
         * Create add task card
         */
        createAddTaskCard: function() {
            var taskDisplay = window.TaskDisplay;
            
            var card = document.createElement('div');
            card.className = 'task-card add-task-card';
            card.setAttribute('aria-label', 'Add new task');
            
            var content = document.createElement('div');
            content.className = 'add-task-card__content';
            
            var icon = document.createElement('div');
            icon.className = 'add-task-card__icon';
            icon.textContent = '+';
            
            var text = document.createElement('div');
            text.className = 'add-task-card__text';
            text.textContent = 'Add Task';
            
            content.appendChild(icon);
            content.appendChild(text);
            card.appendChild(content);
            
            card.onclick = function() {
                taskDisplay.addTask();
            };
            
            return card;
        },
        
        /**
         * Create empty state
         */
        createEmptyState: function() {
            var container = document.createElement('div');
            container.className = 'tasks-empty';
            
            var icon = document.createElement('div');
            icon.className = 'tasks-empty__icon';
            icon.textContent = '📝';
            
            var text = document.createElement('div');
            text.className = 'tasks-empty__text';
            text.textContent = 'No tasks yet. Get started by adding your first task!';
            
            var button = document.createElement('button');
            button.className = 'tasks-empty__button';
            button.innerHTML = '<span>+</span> Add Your First Task';
            button.onclick = function() {
                if (window.EditMode) {
                    window.EditMode.toggle();
                }
            };
            
            container.appendChild(icon);
            container.appendChild(text);
            
            // Only show button if not in edit mode
            if (!window.EditMode || !window.EditMode.isActive()) {
                container.appendChild(button);
            }
            
            return container;
        },
        
        /**
         * Get category name
         */
        getCategoryName: function(categoryId) {
            if (!window.defaultActivities || !window.defaultActivities.categories) {
                return categoryId;
            }
            
            for (var i = 0; i < window.defaultActivities.categories.length; i++) {
                if (window.defaultActivities.categories[i].id === categoryId) {
                    return window.defaultActivities.categories[i].name;
                }
            }
            
            return categoryId;
        }
    };
    
    // Export to global scope
    window.TaskCards = TaskCards;
    
    // Auto-initialize when TaskDisplay is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                if (window.TaskDisplay) {
                    TaskCards.init();
                    // Re-render with cards
                    window.TaskDisplay.render();
                }
            }, 100);
        });
    } else {
        setTimeout(function() {
            if (window.TaskDisplay) {
                TaskCards.init();
                // Re-render with cards
                window.TaskDisplay.render();
            }
        }, 100);
    }
})();