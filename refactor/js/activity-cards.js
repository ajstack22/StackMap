/**
 * Activity Cards UI for StackMap Mobile Refactor
 * Handles card-based rendering of activities
 * Integrates with Visual Card System for activity cards
 */

(function() {
    'use strict';
    
    const ActivityCards = {
        visualMode: false, // Toggle between visual cards and task cards
        
        /**
         * Enable card view in TaskDisplay
         */
        init: function() {
            const self = this;
            
            // Initialize visual card manager if available
            if (window.VisualCardManager) {
                window.VisualCardManager.init();
                this.visualMode = true;
            }
            
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
                window.TaskDisplay.createVisualCard = self.createVisualCard.bind(self);
                
                // Initialize task card pool if available
                if (window.TaskCardPool) {
                    window.TaskCardPool.init();
                }
            }
            
            // Listen for card events
            this.setupCardEventListeners();
        },
        
        /**
         * Release all task cards back to pool
         */
        releaseAllCards: function(container) {
            if (!window.TaskCardPool || !window.TaskCardPool.initialized) return;
            
            const cards = container.querySelectorAll('.task-card[data-pooled="true"]');
            for (let i = 0; i < cards.length; i++) {
                window.TaskCardPool.release(cards[i]);
            }
        },
        
        /**
         * Set up event listeners for card system
         */
        setupCardEventListeners: function() {
            const self = this;
            
            // Listen for card updates
            document.addEventListener('card-created', function(e) {
                self.renderCards();
            });
            
            document.addEventListener('card-updated', function(e) {
                self.renderCards();
            });
            
            document.addEventListener('card-deleted', function(e) {
                self.renderCards();
            });
            
            document.addEventListener('card-toggled', function(e) {
                self.renderCards();
            });
        },
        
        /**
         * Render tasks as cards
         */
        renderCards: function() {
            let self = this;
            const taskDisplay = window.TaskDisplay;
            const container = taskDisplay.container;
            
            // Clear container and release cards to pool
            self.releaseAllCards(container);
            container.innerHTML = '';
            
            // Clear timer button cache when re-rendering
            if (window.TaskTimer && window.TaskTimer.clearButtonCache) {
                window.TaskTimer.clearButtonCache();
            }
            
            // Check if we should render visual cards
            if (this.visualMode && window.VisualCardManager) {
                this.renderVisualCards(container);
                return;
            }
            
            // Create cards grid container
            const cardsGrid = document.createElement('div');
            cardsGrid.className = 'cards-grid';
            
            // Filter tasks for current user
            const userTasks = taskDisplay.getUserTasks();
            
            // Add new task card (only in edit mode)
            if (window.EditMode && window.EditMode.isActive()) {
                const addCard = this.createAddTaskCard();
                cardsGrid.appendChild(addCard);
            }
            
            // Render tasks or empty state
            if (userTasks.length === 0 && (!window.EditMode || !window.EditMode.isActive())) {
                const emptyState = this.createEmptyState();
                container.appendChild(emptyState);
            } else {
                // Add task cards using DocumentFragment for better performance
                let self = this;
                const fragment = document.createDocumentFragment();
                
                userTasks.forEach(function(task, index) {
                    const taskCard = self.createTaskCard(task, index + 1);
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
         * Render visual activity cards
         */
        renderVisualCards: function(container) {
            const self = this;
            const cardManager = window.VisualCardManager;
            
            // Create visual cards container
            const visualContainer = document.createElement('div');
            visualContainer.className = 'visual-cards-container';
            
            // Add view toggle button
            const viewToggle = document.createElement('button');
            viewToggle.className = 'view-toggle-btn';
            viewToggle.innerHTML = '📝 Switch to Task View';
            viewToggle.onclick = function() {
                self.visualMode = false;
                window.TaskDisplay.render();
            };
            visualContainer.appendChild(viewToggle);
            
            // Create cards grid
            const cardsGrid = document.createElement('div');
            cardsGrid.className = 'visual-cards-grid';
            
            // Get all visual cards
            const cards = cardManager.getAllCards();
            
            // Add create card button (only in edit mode)
            if (window.EditMode && window.EditMode.isActive()) {
                const addCard = this.createAddVisualCard();
                cardsGrid.appendChild(addCard);
            }
            
            // Render cards or empty state
            if (cards.length === 0 && (!window.EditMode || !window.EditMode.isActive())) {
                const emptyState = this.createVisualEmptyState();
                visualContainer.appendChild(emptyState);
            } else {
                // Add visual cards
                cards.forEach(function(card) {
                    const visualCard = self.createVisualCard(card);
                    cardsGrid.appendChild(visualCard);
                });
                
                visualContainer.appendChild(cardsGrid);
            }
            
            container.appendChild(visualContainer);
        },
        
        /**
         * Create task card element
         */
        createTaskCard: function(task, number) {
            const taskDisplay = window.TaskDisplay;
            const self = this;
            
            // Determine card state
            let cardState = '';
            if (task.completed) {
                cardState = 'task-card--completed';
            } else if (task.in_progress) {
                cardState = 'task-card--in-progress';
            } else {
                cardState = 'task-card--pending';
            }
            
            // Get card from pool if available
            let card;
            if (window.TaskCardPool && window.TaskCardPool.initialized) {
                card = window.TaskCardPool.acquire();
                card.className = `task-card ${cardState}`;
            } else {
                // Fallback to creating new card
                card = document.createElement('div');
                card.className = `task-card ${cardState}`;
            }
            
            card.setAttribute('data-task-id', task.id);
            
            // ARIA attributes for screen readers
            card.setAttribute('role', 'option');
            card.setAttribute('aria-label', `${task.title || 'Untitled Activity'}, ${task.completed ? 'completed' : 'not completed'}`);
            
            // Check if using pooled card
            const isPooled = card.getAttribute('data-pooled') === 'true';
            
            if (isPooled) {
                // Update existing elements in pooled card
                let checkbox = card.querySelector('.task-checkbox');
                if (checkbox) {
                    checkbox.checked = task.completed;
                    checkbox.setAttribute('aria-label', `Mark ${task.title || 'activity'} as ${task.completed ? 'incomplete' : 'complete'}`);
                    
                    // Remove old listener if exists
                    if (checkbox._taskHandler) {
                        checkbox.removeEventListener('change', checkbox._taskHandler);
                    }
                    
                    // Add new listener
                    checkbox._taskHandler = function() {
                        task.completed = checkbox.checked;
                        taskDisplay.updateTask(task);
                        
                        // Update card ARIA label
                        card.setAttribute('aria-label', `${task.title || 'Untitled Activity'}, ${task.completed ? 'completed' : 'not completed'}`);
                        
                        // Announce state change
                        if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                            window.StackMapKeyboardNav.announce(`${task.title} marked as ${task.completed ? 'complete' : 'incomplete'}`);
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
                let title = card.querySelector('.task-title');
                if (title) title.textContent = activity.title || 'Untitled Activity';
                
                // Update description
                let description = card.querySelector('.task-description');
                if (description) description.textContent = activity.notes || '';
                
                // Update category
                let category = card.querySelector('.task-category');
                if (category && activity.activity_name) {
                    category.textContent = activity.activity_name;
                    category.className = `task-category category-${(activity.category || 'general').toLowerCase()}`;
                }
                
                // Update priority
                const priority = card.querySelector('.task-priority');
                if (priority && task.priority) {
                    priority.textContent = task.priority;
                    priority.className = `task-priority priority-${task.priority.toLowerCase()}`;
                }
            } else {
                // Create new structure for non-pooled cards
                // Completion indicator
                const completion = document.createElement('div');
                completion.className = 'task-card__completion';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.completed;
                checkbox.setAttribute('aria-label', `Mark ${task.title || 'task'} as ${task.completed ? 'incomplete' : 'complete'}`);
                checkbox.onchange = function() {
                    task.completed = checkbox.checked;
                    taskDisplay.updateTask(task);
                    
                    // Update card ARIA label
                    card.setAttribute('aria-label', `${task.title || 'Untitled Activity'}, ${task.completed ? 'completed' : 'not completed'}`);
                    
                    // Announce state change
                    if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                        window.StackMapKeyboardNav.announce(`${task.title} marked as ${task.completed ? 'complete' : 'incomplete'}`);
                    }
                };
                
                completion.appendChild(checkbox);
                
                const checkIcon = document.createElement('span');
                checkIcon.className = 'task-card__completion-icon';
                checkIcon.textContent = '✓';
                checkIcon.setAttribute('aria-hidden', 'true');
                completion.appendChild(checkIcon);
                
                card.appendChild(completion);
            }
            
            // Number badge (if provided)
            if (number) {
                const numberBadge = document.createElement('div');
                numberBadge.className = 'task-card__number';
                numberBadge.textContent = number;
                card.appendChild(numberBadge);
            }
            
            // Card header with icon
            const header = document.createElement('div');
            header.className = 'task-card__header';
            
            const icon = document.createElement('div');
            icon.className = 'task-card__icon';
            icon.textContent = task.icon || '✓';
            header.appendChild(icon);
            
            card.appendChild(header);
            
            // Card content
            const content = document.createElement('div');
            content.className = 'task-card__content';
            
            let title = document.createElement('h3');
            title.className = 'task-card__title';
            title.textContent = activity.title || 'Untitled Activity';
            content.appendChild(title);
            
            if (task.description) {
                const description = document.createElement('p');
                description.className = 'task-card__description';
                description.textContent = task.description;
                content.appendChild(description);
            }
            
            // Progress indicator for subtasks
            if (task.subtasks && task.subtasks.length > 0) {
                const progress = this.createProgressIndicator(task);
                content.appendChild(progress);
            }
            
            card.appendChild(content);
            
            // Photo attachments section
            if (window.PhotoAttachmentUI && window.PhotoAttachmentStorage) {
                const photoSection = document.createElement('div');
                photoSection.className = 'task-card__photos';
                
                // Use singleton instance of photo storage
                const photoStorage = window.PhotoAttachmentStorage.getInstance();
                const photoUI = new window.PhotoAttachmentUI(photoStorage);
                photoUI.createAttachmentUI(task.id, photoSection);
                
                card.appendChild(photoSection);
            }
            
            // Card footer with metadata
            const footer = document.createElement('div');
            footer.className = 'task-card__footer';
            
            // Time estimate
            if (task.time_estimate) {
                const time = document.createElement('div');
                time.className = 'task-card__time';
                time.innerHTML = `⏱ ${task.time_estimate} min`;
                footer.appendChild(time);
            }
            
            // Timer button
            if (window.TaskTimer) {
                const timerBtn = document.createElement('button');
                timerBtn.className = 'task-timer-button';
                timerBtn.setAttribute('aria-label', 'Set timer for activity');
                timerBtn.setAttribute('data-task-id', task.id);
                
                // Check if there's an active timer
                const existingTimer = window.TaskTimer.getTimer(task.id);
                if (existingTimer) {
                    timerBtn.innerHTML = `⏱️ ${window.TaskTimer.formatTime(existingTimer.remaining)}`;
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
                const category = document.createElement('div');
                category.className = 'task-card__category';
                category.textContent = this.getCategoryName(task.category);
                footer.appendChild(category);
            }
            
            if (footer.children.length > 0) {
                card.appendChild(footer);
            }
            
            // Edit mode buttons
            if (window.EditMode && window.EditMode.isActive()) {
                const editButtons = this.createEditButtons(task);
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
            let completed = 0;
            const total = task.subtasks.length;
            
            task.subtasks.forEach(function(subtask) {
                if (subtask.completed) completed++;
            });
            
            const progress = document.createElement('div');
            progress.className = 'task-card__progress';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'task-card__progress-bar';
            
            const progressFill = document.createElement('div');
            progressFill.className = 'task-card__progress-fill';
            progressFill.style.width = `${completed / total * 100}%`;
            
            progressBar.appendChild(progressFill);
            progress.appendChild(progressBar);
            
            const progressText = document.createElement('div');
            progressText.className = 'task-card__progress-text';
            progressText.textContent = `${completed} of ${total} steps complete`;
            progress.appendChild(progressText);
            
            return progress;
        },
        
        /**
         * Create edit mode buttons
         */
        createEditButtons: function(task) {
            const taskDisplay = window.TaskDisplay;
            const self = this;
            
            const container = document.createElement('div');
            container.className = 'task-card__edit-buttons';
            
            // Create arrow buttons container
            const arrowContainer = document.createElement('div');
            arrowContainer.className = 'task-arrows';
            
            // Up arrow button
            const upBtn = document.createElement('button');
            upBtn.className = 'task-arrow-up';
            upBtn.innerHTML = '↑';
            upBtn.setAttribute('aria-label', 'Move activity up');
            
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
            const downBtn = document.createElement('button');
            downBtn.className = 'task-arrow-down';
            downBtn.innerHTML = '↓';
            downBtn.setAttribute('aria-label', 'Move activity down');
            
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
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-card__delete-btn';
            deleteBtn.innerHTML = '🗑';
            deleteBtn.setAttribute('aria-label', 'Delete activity');
            deleteBtn.onclick = function(e) {
                e.stopPropagation();
                if (confirm('Delete this task?')) {
                    taskDisplay.deleteTask(task);
                }
            };
            container.appendChild(deleteBtn);
            
            // Menu button
            const menuBtn = document.createElement('button');
            menuBtn.className = 'task-card__menu-btn';
            menuBtn.innerHTML = '⋯';
            menuBtn.setAttribute('aria-label', 'Activity options');
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
            const taskDisplay = window.TaskDisplay;
            
            const card = document.createElement('div');
            card.className = 'task-card add-task-card';
            card.setAttribute('aria-label', 'Add new activity');
            
            const content = document.createElement('div');
            content.className = 'add-task-card__content';
            
            const icon = document.createElement('div');
            icon.className = 'add-task-card__icon';
            icon.textContent = '+';
            
            const text = document.createElement('div');
            text.className = 'add-task-card__text';
            text.textContent = 'Add Activity';
            
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
            const container = document.createElement('div');
            container.className = 'tasks-empty';
            
            const icon = document.createElement('div');
            icon.className = 'tasks-empty__icon';
            icon.textContent = '📝';
            
            const text = document.createElement('div');
            text.className = 'tasks-empty__text';
            text.textContent = 'No activities yet. Get started by adding your first activity!';
            
            const button = document.createElement('button');
            button.className = 'tasks-empty__button';
            button.innerHTML = '<span>+</span> Add Your First Activity';
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
            
            for (let i = 0; i < window.defaultActivities.categories.length; i++) {
                if (window.defaultActivities.categories[i].id === categoryId) {
                    return window.defaultActivities.categories[i].name;
                }
            }
            
            return categoryId;
        },
        
        /**
         * Create visual activity card
         */
        createVisualCard: function(card) {
            const self = this;
            const cardManager = window.VisualCardManager;
            
            const cardEl = document.createElement('div');
            cardEl.className = `visual-card visual-card--${card.state} visual-card--${card.type}`;
            cardEl.setAttribute('data-card-id', card.id);
            cardEl.style.backgroundColor = card.color;
            
            // ARIA attributes
            cardEl.setAttribute('role', 'button');
            cardEl.setAttribute('tabindex', '0');
            cardEl.setAttribute('aria-label', card.ariaLabel);
            
            // Emoji display
            const emoji = document.createElement('div');
            emoji.className = 'visual-card__emoji';
            emoji.textContent = card.emoji;
            emoji.setAttribute('aria-hidden', 'true');
            cardEl.appendChild(emoji);
            
            // Title (optional)
            if (card.title) {
                const title = document.createElement('div');
                title.className = 'visual-card__title';
                title.textContent = card.title;
                cardEl.appendChild(title);
            }
            
            // Add description as title attribute for tooltip
            if (card.description) {
                cardEl.setAttribute('title', card.description);
            }
            
            // Completion indicator
            const completion = document.createElement('div');
            completion.className = 'visual-card__completion';
            completion.setAttribute('aria-hidden', 'true');
            
            if (card.state === 'completed') {
                completion.innerHTML = '✓';
            } else if (card.state === 'in-progress') {
                completion.innerHTML = '⏳';
            }
            
            cardEl.appendChild(completion);
            
            // Type indicator
            if (card.type !== 'single') {
                const typeIcon = document.createElement('div');
                typeIcon.className = 'visual-card__type';
                typeIcon.textContent = card.type === 'recurring' ? '🔄' : '♾️';
                typeIcon.setAttribute('aria-hidden', 'true');
                cardEl.appendChild(typeIcon);
            }
            
            // Click handler
            cardEl.onclick = function(e) {
                e.preventDefault();
                
                if (window.EditMode && window.EditMode.isActive()) {
                    // Edit mode - show edit menu
                    self.showCardEditMenu(card, cardEl);
                } else {
                    // Normal mode - toggle completion
                    cardManager.toggleCardCompletion(card.id);
                }
            };
            
            // Keyboard support
            cardEl.onkeydown = function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    cardEl.click();
                }
            };
            
            // Long press for edit (touch devices)
            let pressTimer;
            cardEl.addEventListener('touchstart', function(e) {
                pressTimer = setTimeout(function() {
                    if (window.EditMode && window.EditMode.isActive()) {
                        self.showCardEditMenu(card, cardEl);
                    }
                }, 500);
            });
            
            cardEl.addEventListener('touchend', function() {
                clearTimeout(pressTimer);
            });
            
            cardEl.addEventListener('touchmove', function() {
                clearTimeout(pressTimer);
            });
            
            return cardEl;
        },
        
        /**
         * Create add visual card button
         */
        createAddVisualCard: function() {
            const self = this;
            
            const card = document.createElement('div');
            card.className = 'visual-card visual-card--add';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', 'Create new activity card');
            
            const icon = document.createElement('div');
            icon.className = 'visual-card__add-icon';
            icon.textContent = '+';
            card.appendChild(icon);
            
            const text = document.createElement('div');
            text.className = 'visual-card__add-text';
            text.textContent = 'Add Card';
            card.appendChild(text);
            
            card.onclick = function() {
                if (window.CardCreationUI) {
                    window.CardCreationUI.open();
                }
            };
            
            card.onkeydown = function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            };
            
            return card;
        },
        
        /**
         * Create visual cards empty state
         */
        createVisualEmptyState: function() {
            const container = document.createElement('div');
            container.className = 'visual-empty-state';
            
            const icon = document.createElement('div');
            icon.className = 'visual-empty__icon';
            icon.textContent = '🎯';
            container.appendChild(icon);
            
            const title = document.createElement('h2');
            title.className = 'visual-empty__title';
            title.textContent = 'No Activity Cards Yet';
            container.appendChild(title);
            
            const text = document.createElement('p');
            text.className = 'visual-empty__text';
            text.textContent = 'Create visual cards for your daily activities. Perfect for quick tasks that don\'t need words!';
            container.appendChild(text);
            
            const button = document.createElement('button');
            button.className = 'visual-empty__button';
            button.innerHTML = '<span>+</span> Create Your First Card';
            button.onclick = function() {
                if (window.EditMode) {
                    window.EditMode.toggle();
                }
            };
            
            if (!window.EditMode || !window.EditMode.isActive()) {
                container.appendChild(button);
            }
            
            return container;
        },
        
        /**
         * Show card edit menu
         */
        showCardEditMenu: function(card, cardEl) {
            const self = this;
            const cardManager = window.VisualCardManager;
            
            // Remove existing menu
            const existingMenu = document.querySelector('.visual-card-menu');
            if (existingMenu) {
                existingMenu.remove();
            }
            
            // Create menu
            const menu = document.createElement('div');
            menu.className = 'visual-card-menu';
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'visual-card-menu__item';
            editBtn.innerHTML = '✏️ Edit Card';
            editBtn.onclick = function() {
                menu.remove();
                if (window.CardCreationUI) {
                    window.CardCreationUI.open(card);
                }
            };
            menu.appendChild(editBtn);
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'visual-card-menu__item visual-card-menu__item--danger';
            deleteBtn.innerHTML = '🗑️ Delete Card';
            deleteBtn.onclick = function() {
                if (confirm('Delete this card?')) {
                    cardManager.deleteCard(card.id);
                }
                menu.remove();
            };
            menu.appendChild(deleteBtn);
            
            // Cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'visual-card-menu__item';
            cancelBtn.innerHTML = '❌ Cancel';
            cancelBtn.onclick = function() {
                menu.remove();
            };
            menu.appendChild(cancelBtn);
            
            // Position menu
            const rect = cardEl.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.top = rect.bottom + 'px';
            menu.style.left = rect.left + 'px';
            menu.style.minWidth = rect.width + 'px';
            
            document.body.appendChild(menu);
            
            // Close on outside click
            setTimeout(function() {
                document.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target) && e.target !== cardEl) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                });
            }, 0);
        }
    };
    
    // Export to global scope
    window.ActivityCards = ActivityCards;
    
    // BACKWARD COMPATIBILITY - Keep old name working
    window.TaskCards = ActivityCards;
    
    // Auto-initialize when TaskDisplay is ready
    function initializeTaskCards() {
        if (window.TaskDisplay) {
            TaskCards.init();
            // Only render if TaskDisplay is initialized
            if (window.TaskDisplay.isInitialized) {
                window.TaskDisplay.render();
            }
        } else {
            // Try again in 100ms
            setTimeout(initializeTaskCards, 100);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initializeTaskCards, 100);
        });
    } else {
        setTimeout(initializeTaskCards, 100);
    }
})();