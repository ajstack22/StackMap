/**
 * Activity Cards UI for StackMap Mobile Refactor
 * Handles card-based rendering of activities
 * Integrates with Visual Card System for activity cards
 */

(function() {
    'use strict';
    
    const ActivityCards = {
        visualMode: false, // Toggle between visual cards and activity cards
        
        /**
         * Enable card view in ActivityDisplay
         */
        init: function() {
            const self = this;
            
            // Initialize visual card manager if available
            if (window.VisualCardManager) {
                window.VisualCardManager.init();
                this.visualMode = true;
            }
            
            // Override ActivityDisplay render method
            if (window.ActivityDisplay || window.TaskDisplay) {
                // Store original methods
                const display = window.ActivityDisplay || window.TaskDisplay;
                display._originalRender = display.render;
                display._originalCreateActivityElement = display.createActivityElement || display.createTaskElement;
                
                // Replace with card versions
                display.render = self.renderCards.bind(self);
                display.createActivityElement = self.createActivityCard.bind(self);
                display.createTaskElement = self.createActivityCard.bind(self); // Backward compatibility
                display.createActivityCard = self.createActivityCard.bind(self);
                
                // Add helper methods
                display.createAddActivityCard = self.createAddActivityCard.bind(self);
                display.createAddTaskCard = self.createAddActivityCard.bind(self); // Backward compatibility
                display.createEmptyState = self.createEmptyState.bind(self);
                display.createVisualCard = self.createVisualCard.bind(self);
                
                // Initialize activity card pool if available
                if (window.ActivityCardPool || window.TaskCardPool) {
                    const pool = window.ActivityCardPool || window.TaskCardPool;
                    pool.init();
                }
            }
            
            // Listen for card events
            this.setupCardEventListeners();
        },
        
        /**
         * Release all activity cards back to pool
         */
        releaseAllCards: function(container) {
            if (!window.TaskCardPool || !window.TaskCardPool.initialized) return;
            
            const cards = container.querySelectorAll('.activity-card[data-pooled="true"], .task-card[data-pooled="true"]');
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
         * Render activities as cards
         */
        renderCards: function() {
            let self = this;
            const activityDisplay = window.ActivityDisplay || window.TaskDisplay;
            const container = activityDisplay.container;
            
            // Clear container and release cards to pool
            self.releaseAllCards(container);
            container.innerHTML = '';
            
            // Clear timer button cache when re-rendering
            if (window.ActivityTimer && window.ActivityTimer.clearButtonCache) {
                window.ActivityTimer.clearButtonCache();
            } else if (window.TaskTimer && window.TaskTimer.clearButtonCache) {
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
            
            // Filter activities for current user
            const userActivities = activityDisplay.getUserActivities ? activityDisplay.getUserActivities() : activityDisplay.getUserTasks();
            
            // Add new activity card (only in edit mode)
            if (window.EditMode && window.EditMode.isActive()) {
                const addCard = this.createAddActivityCard();
                cardsGrid.appendChild(addCard);
            }
            
            // Render activities or empty state
            if (userActivities.length === 0 && (!window.EditMode || !window.EditMode.isActive())) {
                const emptyState = this.createEmptyState();
                container.appendChild(emptyState);
            } else {
                // Add activity cards using DocumentFragment for better performance
                let self = this;
                const fragment = document.createDocumentFragment();
                
                userActivities.forEach(function(activity, index) {
                    const activityCard = self.createActivityCard(activity, index + 1);
                    fragment.appendChild(activityCard);
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
            viewToggle.innerHTML = '📝 Switch to Activity View';
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
         * Create activity card element
         */
        createActivityCard: function(activity, number) {
            const activityDisplay = window.ActivityDisplay || window.TaskDisplay;
            const self = this;
            
            // Determine card state
            let cardState = '';
            if (activity.completed) {
                cardState = 'activity-card--completed';
            } else if (activity.in_progress) {
                cardState = 'activity-card--in-progress';
            } else {
                cardState = 'activity-card--pending';
            }
            
            // Get card from pool if available
            let card;
            const cardPool = window.ActivityCardPool || window.TaskCardPool;
            if (cardPool && cardPool.initialized) {
                card = cardPool.acquire();
                card.className = `activity-card ${cardState}`;
            } else {
                // Fallback to creating new card
                card = document.createElement('div');
                card.className = `activity-card ${cardState}`;
            }
            
            card.setAttribute('data-activity-id', activity.id);
            
            // ARIA attributes for screen readers
            card.setAttribute('role', 'option');
            card.setAttribute('aria-label', `${activity.title || 'Untitled Activity'}, ${activity.completed ? 'completed' : 'not completed'}`);
            
            // Check if using pooled card
            const isPooled = card.getAttribute('data-pooled') === 'true';
            
            if (isPooled) {
                // Update existing elements in pooled card
                let checkbox = card.querySelector('.activity-checkbox');
                if (checkbox) {
                    checkbox.checked = activity.completed;
                    checkbox.setAttribute('aria-label', `Mark ${activity.title || 'activity'} as ${activity.completed ? 'incomplete' : 'complete'}`);
                    
                    // Remove old listener if exists
                    if (checkbox._activityHandler) {
                        checkbox.removeEventListener('change', checkbox._activityHandler);
                    }
                    
                    // Add new listener
                    checkbox._activityHandler = function() {
                        activity.completed = checkbox.checked;
                        activityDisplay.updateActivity ? activityDisplay.updateActivity(activity) : activityDisplay.updateTask(activity);
                        
                        // Update card ARIA label
                        card.setAttribute('aria-label', `${activity.title || 'Untitled Activity'}, ${activity.completed ? 'completed' : 'not completed'}`);
                        
                        // Announce state change
                        if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                            window.StackMapKeyboardNav.announce(`${activity.title} marked as ${activity.completed ? 'complete' : 'incomplete'}`);
                        }
                    };
                    checkbox.addEventListener('change', checkbox._activityHandler);
                    
                    // Store cleanup function
                    card._cleanup = function() {
                        if (checkbox._activityHandler) {
                            checkbox.removeEventListener('change', checkbox._activityHandler);
                            delete checkbox._activityHandler;
                        }
                    };
                }
                
                // Update title
                let title = card.querySelector('.activity-title');
                if (title) title.textContent = activity.title || 'Untitled Activity';
                
                // Update description
                let description = card.querySelector('.activity-description');
                if (description) description.textContent = activity.notes || '';
                
                // Update category
                let category = card.querySelector('.activity-category');
                if (category && activity.activity_name) {
                    category.textContent = activity.activity_name;
                    category.className = `task-category category-${(activity.category || 'general').toLowerCase()}`;
                }
                
                // Update priority
                const priority = card.querySelector('.task-priority');
                if (priority && activity.priority) {
                    priority.textContent = activity.priority;
                    priority.className = `task-priority priority-${activity.priority.toLowerCase()}`;
                }
            } else {
                // Create new structure for non-pooled cards
                // Completion indicator
                const completion = document.createElement('div');
                completion.className = 'task-card__completion';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = activity.completed;
                checkbox.setAttribute('aria-label', `Mark ${activity.title || 'activity'} as ${activity.completed ? 'incomplete' : 'complete'}`);
                checkbox.onchange = function() {
                    activity.completed = checkbox.checked;
                    activityDisplay.updateActivity ? activityDisplay.updateActivity(activity) : activityDisplay.updateTask(activity);
                    
                    // Update card ARIA label
                    card.setAttribute('aria-label', `${activity.title || 'Untitled Activity'}, ${activity.completed ? 'completed' : 'not completed'}`);
                    
                    // Announce state change
                    if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                        window.StackMapKeyboardNav.announce(`${activity.title} marked as ${activity.completed ? 'complete' : 'incomplete'}`);
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
            icon.textContent = activity.icon || '✓';
            header.appendChild(icon);
            
            card.appendChild(header);
            
            // Card content
            const content = document.createElement('div');
            content.className = 'task-card__content';
            
            let title = document.createElement('h3');
            title.className = 'task-card__title';
            title.textContent = activity.title || 'Untitled Activity';
            content.appendChild(title);
            
            if (activity.description || activity.notes) {
                const description = document.createElement('p');
                description.className = 'task-card__description';
                description.textContent = activity.description || activity.notes;
                content.appendChild(description);
            }
            
            // Progress indicator for subtasks
            if (activity.subtasks && activity.subtasks.length > 0) {
                const progress = this.createProgressIndicator(activity);
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
                photoUI.createAttachmentUI(activity.id, photoSection);
                
                card.appendChild(photoSection);
            }
            
            // Card footer with metadata
            const footer = document.createElement('div');
            footer.className = 'task-card__footer';
            
            // Time estimate
            if (activity.time_estimate || activity.estimatedMinutes) {
                const time = document.createElement('div');
                time.className = 'task-card__time';
                const estimate = activity.time_estimate || activity.estimatedMinutes;
                time.innerHTML = `⏱ ${estimate} min`;
                footer.appendChild(time);
            }
            
            // Timer button
            if (window.TaskTimer) {
                const timerBtn = document.createElement('button');
                timerBtn.className = 'task-timer-button';
                timerBtn.setAttribute('aria-label', 'Set timer for activity');
                timerBtn.setAttribute('data-task-id', activity.id);
                
                // Check if there's an active timer
                const existingTimer = window.TaskTimer.getTimer(activity.id);
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
                    window.TaskTimer.showTimerMenu(activity.id, timerBtn);
                };
                
                footer.appendChild(timerBtn);
            }
            
            // Category
            if (activity.category) {
                const category = document.createElement('div');
                category.className = 'task-card__category';
                category.textContent = this.getCategoryName(activity.category);
                footer.appendChild(category);
            }
            
            if (footer.children.length > 0) {
                card.appendChild(footer);
            }
            
            // Card edit controls (always create, visibility controlled by CardEditControls integration)
            const editControls = this.createCardEditControls(activity);
            card.appendChild(editControls);
            
            // Type indicator (if activity has type and ActivityTypes is available)
            if (window.ActivityTypes && activity.type && activity.type.category) {
                const typeIndicator = window.ActivityTypes.createTypeIndicator(activity);
                if (typeIndicator) {
                    card.appendChild(typeIndicator);
                    // Add type class to card for additional styling
                    card.classList.add(window.ActivityTypes.getTypeClass(activity.type.category));
                    card.setAttribute('data-activity-type', activity.type.category);
                }
            }
            
            // Card click handler (delegated to CardEditControls for edit mode gating)
            card.onclick = function(e) {
                // Don't trigger on button clicks or other interactive elements
                if (e.target.tagName === 'BUTTON' || 
                    e.target.tagName === 'INPUT' || 
                    e.target.closest('button') ||
                    e.target.closest('.card-edit-controls')) {
                    return;
                }
                
                // CardEditControls integration will handle edit mode checks
                // This provides fallback behavior when integration is not available
                if (window.EditMode && window.EditMode.isActive()) {
                    if (activityDisplay.startEditing) {
                        activityDisplay.startEditing(activity);
                    }
                }
            };
            
            return card;
        },
        
        /**
         * Create progress indicator
         */
        createProgressIndicator: function(activity) {
            let completed = 0;
            const total = activity.subtasks.length;
            
            activity.subtasks.forEach(function(subtask) {
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
         * Create card edit controls (new direct manipulation system)
         */
        createCardEditControls: function(activity) {
            const self = this;
            const targetSize = window.StackMapSafeMode ? 60 : 44;
            
            const container = document.createElement('div');
            container.className = 'card-edit-controls';
            container.style.display = 'none'; // Hidden by default, shown in edit mode
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'card-edit-btn card-action-btn';
            editBtn.innerHTML = '✏️';
            editBtn.setAttribute('aria-label', 'Edit activity');
            editBtn.style.minWidth = targetSize + 'px';
            editBtn.style.minHeight = targetSize + 'px';
            editBtn.onclick = function(e) {
                e.stopPropagation();
                self.handleCardEdit(activity);
            };
            container.appendChild(editBtn);
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'card-delete-btn card-action-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.setAttribute('aria-label', 'Delete activity');
            deleteBtn.style.minWidth = targetSize + 'px';
            deleteBtn.style.minHeight = targetSize + 'px';
            deleteBtn.onclick = function(e) {
                e.stopPropagation();
                self.handleCardDelete(activity);
            };
            container.appendChild(deleteBtn);
            
            // Duplicate button
            const duplicateBtn = document.createElement('button');
            duplicateBtn.className = 'card-duplicate-btn card-action-btn';
            duplicateBtn.innerHTML = '📋';
            duplicateBtn.setAttribute('aria-label', 'Duplicate activity');
            duplicateBtn.style.minWidth = targetSize + 'px';
            duplicateBtn.style.minHeight = targetSize + 'px';
            duplicateBtn.onclick = function(e) {
                e.stopPropagation();
                self.handleCardDuplicate(activity);
            };
            container.appendChild(duplicateBtn);
            
            // Move button (quick day switcher)
            const moveBtn = document.createElement('button');
            moveBtn.className = 'card-move-btn card-action-btn';
            moveBtn.innerHTML = activity.timeframe === 'today' ? '🌙' : '☀️';
            moveBtn.setAttribute('aria-label', activity.timeframe === 'today' ? 'Move to tomorrow' : 'Move to today');
            moveBtn.style.minWidth = targetSize + 'px';
            moveBtn.style.minHeight = targetSize + 'px';
            moveBtn.onclick = function(e) {
                e.stopPropagation();
                self.handleCardMove(activity);
            };
            container.appendChild(moveBtn);
            
            return container;
        },
        
        /**
         * Handle card edit action
         */
        handleCardEdit: function(activity) {
            // Start inline editing or show edit modal
            if (window.InlineCardEdit) {
                window.InlineCardEdit.startEdit(activity);
            } else {
                // Fallback to existing edit functionality
                const display = window.ActivityDisplay || window.TaskDisplay;
                if (display.startEditing) {
                    display.startEditing(activity);
                } else if (display.showEditModal) {
                    display.showEditModal(activity);
                }
            }
        },
        
        /**
         * Handle card delete action
         */
        handleCardDelete: function(activity) {
            // Show confirmation dialog
            const confirmed = confirm(`Delete "${activity.title || 'Untitled Activity'}"?`);
            if (confirmed) {
                const display = window.ActivityDisplay || window.TaskDisplay;
                if (display.deleteActivity) {
                    display.deleteActivity(activity);
                } else if (display.deleteTask) {
                    display.deleteTask(activity);
                }
                
                // Show undo option if undo system is available
                if (window.UndoManager) {
                    window.UndoManager.showUndoToast('Activity deleted');
                }
            }
        },
        
        /**
         * Handle card duplicate action
         */
        handleCardDuplicate: function(activity) {
            // Create a copy of the activity
            const duplicate = Object.assign({}, activity);
            duplicate.id = 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            duplicate.title = (duplicate.title || 'Untitled Activity') + ' (Copy)';
            duplicate.created_at = new Date().toISOString();
            duplicate.updated_at = new Date().toISOString();
            duplicate.completed = false;
            duplicate.status = 'pending';
            
            // Auto-assign type to duplicate if ActivityTypes is available
            if (window.ActivityTypes) {
                window.ActivityTypes.autoAssignType(duplicate);
            }
            
            const display = window.ActivityDisplay || window.TaskDisplay;
            if (display.addActivity) {
                display.addActivity(duplicate);
            } else if (display.addTask) {
                display.addTask(duplicate);
            }
            
            console.log('Activity duplicated:', duplicate.title);
        },
        
        /**
         * Handle card move action (today/tomorrow toggle)
         */
        handleCardMove: function(activity) {
            const newTimeframe = activity.timeframe === 'today' ? 'tomorrow' : 'today';
            activity.timeframe = newTimeframe;
            activity.day = newTimeframe;
            activity.updated_at = new Date().toISOString();
            
            const display = window.ActivityDisplay || window.TaskDisplay;
            if (display.updateActivity) {
                display.updateActivity(activity);
            } else if (display.updateTask) {
                display.updateTask(activity);
            }
            
            // Re-render to reflect changes
            if (display.render) {
                display.render();
            }
            
            console.log(`Activity moved to ${newTimeframe}:`, activity.title);
        },
        
        /**
         * Edit mode change handler
         */
        onEditModeChange: function(isEditMode) {
            // Update all card edit controls visibility
            const editControls = document.querySelectorAll('.card-edit-controls');
            editControls.forEach(function(controls) {
                controls.style.display = isEditMode ? 'flex' : 'none';
            });
        },
        
        /**
         * Legacy edit buttons (kept for backward compatibility)
         */
        createEditButtons: function(task) {
            // Use new createCardEditControls instead
            return this.createCardEditControls(task);
        },
        
        /**
         * Create add activity card
         */
        createAddActivityCard: function() {
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
                const display = window.ActivityDisplay || window.TaskDisplay;
                if (display.addActivity) {
                    display.addActivity();
                } else {
                    display.addTask();
                }
            };
            
            return card;
        },
        
        /**
         * Create empty state
         */
        createEmptyState: function() {
            const container = document.createElement('div');
            container.className = 'activities-empty';
            
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
        },
        
        // BACKWARD COMPATIBILITY ALIASES
        createTaskCard: function() { return this.createActivityCard.apply(this, arguments); },
        createAddTaskCard: function() { return this.createAddActivityCard.apply(this, arguments); }
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