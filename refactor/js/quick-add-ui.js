/**
 * Quick Add UI - Slide-up Panel Implementation
 * Provides rapid activity addition from templates
 * Mobile-first design with ADHD/autism accommodations
 */

(function() {
    'use strict';
    
    const QuickAddUI = {
        isInitialized: false,
        isOpen: false,
        container: null,
        buttonElement: null,
        panelElement: null,
        currentCategory: null,
        recentlyUsed: [],
        categorizedTemplates: {},
        
        // Constants
        RECENT_STORAGE_KEY: 'stackmap-quick-add-recent',
        MAX_RECENT: 5,
        
        /**
         * Initialize the quick add system
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Only initialize in edit mode
            if (!window.EditMode || !window.EditMode.isActive()) {
                // Listen for edit mode changes
                if (window.EditMode) {
                    window.EditMode.on('change', function(isActive) {
                        if (isActive && !self.isInitialized) {
                            self.actualInit();
                        } else if (!isActive && self.isOpen) {
                            self.closePanel();
                        }
                    });
                }
                return;
            }
            
            self.actualInit();
        },
        
        /**
         * Actual initialization when edit mode is active
         */
        actualInit: function() {
            const self = this;
            
            // Load recently used
            self.loadRecentlyUsed();
            
            // Create quick add button
            self.createQuickAddButton();
            
            // Listen for edit mode changes
            if (window.EditMode) {
                window.EditMode.on('change', function(isActive) {
                    self.updateVisibility(isActive);
                });
            }
            
            self.isInitialized = true;
            console.log('QuickAddUI: Initialized');
        },
        
        /**
         * Create the floating action button
         */
        createQuickAddButton: function() {
            const self = this;
            
            // Create FAB
            const button = document.createElement('button');
            button.className = 'quick-add-fab';
            button.innerHTML = '⚡';
            button.setAttribute('aria-label', 'Quick add activities');
            
            // Store reference
            self.buttonElement = button;
            
            // Position near bottom right
            document.body.appendChild(button);
            
            button.onclick = function() {
                self.togglePanel();
            };
            
            // Show only in edit mode
            self.updateVisibility(window.EditMode.isActive());
        },
        
        /**
         * Update visibility based on edit mode
         */
        updateVisibility: function(isEditMode) {
            const self = this;
            
            if (self.buttonElement) {
                self.buttonElement.style.display = isEditMode ? 'flex' : 'none';
            }
            
            // Close panel if edit mode is disabled
            if (!isEditMode && self.isOpen) {
                self.closePanel();
            }
        },
        
        /**
         * Toggle panel open/close
         */
        togglePanel: function() {
            const self = this;
            
            if (self.isOpen) {
                self.closePanel();
            } else {
                self.openPanel();
            }
        },
        
        /**
         * Open the quick add panel
         */
        openPanel: function() {
            const self = this;
            
            try {
                // Create panel if not exists
                if (!self.panelElement) {
                    self.panelElement = self.createPanel();
                    document.body.appendChild(self.panelElement);
                }
                
                // Load templates
                self.loadTemplates();
                
                // Animate in
                requestAnimationFrame(function() {
                    self.panelElement.classList.add('open');
                    self.isOpen = true;
                    
                    // Focus first category
                    const firstTab = self.panelElement.querySelector('.category-tab');
                    if (firstTab) {
                        firstTab.focus();
                    }
                });
                
                // Add backdrop handler
                document.addEventListener('click', self.backdropHandler);
                
                // Add escape key handler
                document.addEventListener('keydown', self.escapeHandler);
                
            } catch (error) {
                console.error('Failed to open quick add panel:', error);
                self.showError('Unable to open quick add panel');
            }
        },
        
        /**
         * Close the panel
         */
        closePanel: function() {
            const self = this;
            
            if (!self.panelElement || !self.isOpen) return;
            
            self.panelElement.classList.remove('open');
            self.isOpen = false;
            
            // Remove event handlers
            document.removeEventListener('click', self.backdropHandler);
            document.removeEventListener('keydown', self.escapeHandler);
            
            // Hide after animation
            setTimeout(function() {
                if (self.panelElement) {
                    self.panelElement.style.display = 'none';
                }
            }, 300);
        },
        
        /**
         * Backdrop click handler
         */
        backdropHandler: function(e) {
            const self = window.QuickAddUI;
            if (!self.panelElement.contains(e.target) && 
                !self.buttonElement.contains(e.target)) {
                self.closePanel();
            }
        },
        
        /**
         * Escape key handler
         */
        escapeHandler: function(e) {
            if (e.key === 'Escape') {
                window.QuickAddUI.closePanel();
            }
        },
        
        /**
         * Create the slide-up panel
         */
        createPanel: function() {
            const self = this;
            
            const panel = document.createElement('div');
            panel.className = 'quick-add-panel';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-label', 'Quick add activities');
            
            // Header with close button
            const header = document.createElement('div');
            header.className = 'quick-add-header';
            
            const title = document.createElement('h3');
            title.textContent = '⚡ Quick Add';
            header.appendChild(title);
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.innerHTML = '×';
            closeBtn.setAttribute('aria-label', 'Close quick add');
            closeBtn.onclick = function() {
                self.closePanel();
            };
            header.appendChild(closeBtn);
            
            panel.appendChild(header);
            
            // Category tabs
            const tabs = document.createElement('div');
            tabs.className = 'quick-add-tabs';
            tabs.setAttribute('role', 'tablist');
            panel.appendChild(tabs);
            
            // Template grid
            const grid = document.createElement('div');
            grid.className = 'quick-add-grid';
            grid.setAttribute('role', 'tabpanel');
            panel.appendChild(grid);
            
            // Add swipe to dismiss
            self.addSwipeHandler(panel);
            
            return panel;
        },
        
        /**
         * Add swipe down to dismiss
         */
        addSwipeHandler: function(panel) {
            const self = this;
            let startY = 0;
            let currentY = 0;
            let isDragging = false;
            
            const handleTouchStart = function(e) {
                startY = e.touches[0].clientY;
                isDragging = true;
                panel.style.transition = 'none';
            };
            
            const handleTouchMove = function(e) {
                if (!isDragging) return;
                
                currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;
                
                // Only allow downward swipe
                if (deltaY > 0) {
                    panel.style.transform = 'translateY(' + deltaY + 'px)';
                }
            };
            
            const handleTouchEnd = function(e) {
                if (!isDragging) return;
                
                isDragging = false;
                panel.style.transition = '';
                
                const deltaY = currentY - startY;
                
                // If swiped down more than 100px, close
                if (deltaY > 100) {
                    self.closePanel();
                } else {
                    panel.style.transform = '';
                }
            };
            
            panel.addEventListener('touchstart', handleTouchStart, { passive: true });
            panel.addEventListener('touchmove', handleTouchMove, { passive: true });
            panel.addEventListener('touchend', handleTouchEnd, { passive: true });
        },
        
        /**
         * Load templates and organize by category
         */
        loadTemplates: function() {
            const self = this;
            
            try {
                // Get templates
                const templates = self.getQuickTemplates();
                
                // Categorize
                self.categorizeTemplates(templates);
                
                // Render tabs
                self.renderCategoryTabs();
                
                // Show first category or recently used
                if (self.recentlyUsed.length > 0) {
                    self.showCategory('recent');
                } else {
                    const firstCategory = Object.keys(self.categorizedTemplates)[0];
                    if (firstCategory) {
                        self.showCategory(firstCategory);
                    }
                }
                
            } catch (error) {
                console.error('Failed to load templates:', error);
                self.showError('Unable to load activity templates');
            }
        },
        
        /**
         * Get quick templates from default activities
         */
        getQuickTemplates: function() {
            const self = this;
            
            if (!window.StackMapDefaultActivities) {
                console.warn('Default activities not loaded');
                return [];
            }
            
            // Get visible defaults
            const defaults = window.StackMapDefaultActivities.getVisibleActivities() || [];
            
            // Get library activities
            const library = window.StackMapDefaultActivities.ACTIVITY_LIBRARY || [];
            
            // Priority activities for quick access
            const priorityKeys = [
                'wake_up', 'brush_teeth', 'get_dressed', 'breakfast',
                'school_bus', 'homework_time', 'dinner_time', 
                'bath_time', 'pajama_time', 'bedtime',
                'snack_time', 'play_time', 'quiet_time',
                'therapy_session', 'medication_time'
            ];
            
            // Combine and filter
            const allActivities = [...defaults];
            
            // Add priority activities from library
            library.forEach(function(activity) {
                if (priorityKeys.indexOf(activity.key) !== -1) {
                    // Avoid duplicates
                    const exists = allActivities.some(function(a) {
                        return a.title === activity.title;
                    });
                    if (!exists) {
                        allActivities.push(activity);
                    }
                }
            });
            
            // Limit to reasonable number
            return allActivities.slice(0, 50);
        },
        
        /**
         * Categorize templates
         */
        categorizeTemplates: function(templates) {
            const self = this;
            
            self.categorizedTemplates = {};
            
            // Add recently used category if applicable
            if (self.recentlyUsed.length > 0) {
                self.categorizedTemplates['recent'] = {
                    name: 'Recently Used',
                    icon: '🕐',
                    templates: self.recentlyUsed
                };
            }
            
            // Organize by category
            templates.forEach(function(template) {
                const category = template.category || 'General';
                
                if (!self.categorizedTemplates[category]) {
                    self.categorizedTemplates[category] = {
                        name: category,
                        icon: self.getCategoryIcon(category),
                        templates: []
                    };
                }
                
                self.categorizedTemplates[category].templates.push(template);
            });
        },
        
        /**
         * Get category icon
         */
        getCategoryIcon: function(category) {
            const icons = {
                'Daily Care': '🧼',
                'School & Learning': '📚',
                'Therapy & Health': '🏥',
                'Sensory & Breaks': '🌈',
                'Social Skills': '👥',
                'Play & Fun': '🎮',
                'Meals & Snacks': '🍽️',
                'Transitions': '🚶',
                'Chores & Responsibilities': '🧹',
                'Exercise & Movement': '🏃',
                'Calming & Regulation': '🧘'
            };
            
            return icons[category] || '📌';
        },
        
        /**
         * Render category tabs
         */
        renderCategoryTabs: function() {
            const self = this;
            const tabsContainer = self.panelElement.querySelector('.quick-add-tabs');
            
            // Clear existing
            tabsContainer.innerHTML = '';
            
            // Create tabs
            Object.keys(self.categorizedTemplates).forEach(function(categoryKey) {
                const category = self.categorizedTemplates[categoryKey];
                
                const tab = document.createElement('button');
                tab.className = 'category-tab';
                tab.setAttribute('role', 'tab');
                tab.setAttribute('aria-selected', 'false');
                tab.setAttribute('data-category', categoryKey);
                
                const icon = document.createElement('span');
                icon.className = 'category-icon';
                icon.textContent = category.icon;
                tab.appendChild(icon);
                
                const label = document.createElement('span');
                label.className = 'category-label';
                label.textContent = category.name;
                tab.appendChild(label);
                
                tab.onclick = function() {
                    self.showCategory(categoryKey);
                };
                
                tabsContainer.appendChild(tab);
            });
        },
        
        /**
         * Show templates for a category
         */
        showCategory: function(categoryKey) {
            const self = this;
            const category = self.categorizedTemplates[categoryKey];
            
            if (!category) return;
            
            // Update active tab
            const tabs = self.panelElement.querySelectorAll('.category-tab');
            tabs.forEach(function(tab) {
                const isActive = tab.getAttribute('data-category') === categoryKey;
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
            
            self.currentCategory = categoryKey;
            
            // Render templates
            self.renderTemplates(category.templates);
        },
        
        /**
         * Render template grid
         */
        renderTemplates: function(templates) {
            const self = this;
            const grid = self.panelElement.querySelector('.quick-add-grid');
            
            // Clear existing
            grid.innerHTML = '';
            
            // Create template tiles
            templates.forEach(function(template) {
                const tile = self.createTemplateTile(template);
                grid.appendChild(tile);
            });
        },
        
        /**
         * Create template tile
         */
        createTemplateTile: function(template) {
            const self = this;
            
            const tile = document.createElement('button');
            tile.className = 'template-tile';
            tile.setAttribute('aria-label', 'Add ' + template.title);
            
            const icon = document.createElement('div');
            icon.className = 'template-icon';
            icon.textContent = template.icon || '✓';
            tile.appendChild(icon);
            
            const title = document.createElement('div');
            title.className = 'template-title';
            title.textContent = template.title;
            tile.appendChild(title);
            
            // Click handler
            tile.onclick = function() {
                self.addTemplate(template, tile);
            };
            
            return tile;
        },
        
        /**
         * Add template as new task with error handling
         */
        addTemplate: function(template, tileElement) {
            const self = this;
            
            try {
                // Check prerequisites
                if (!window.ActivityDisplay && !window.TaskDisplay) {
                    throw new Error('ActivityDisplay not initialized');
                }
                
                // Use ActivityDisplay if available, otherwise TaskDisplay for backward compatibility
                const display = window.ActivityDisplay || window.TaskDisplay;
                
                // Visual feedback
                tileElement.classList.add('adding');
                
                // Haptic feedback if available
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(50);
                }
                
                // Create new task from template
                const newTask = {
                    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    title: template.title,
                    description: template.description || '',
                    icon: template.icon || '✓',
                    category: template.category,
                    completed: false,
                    created_at: new Date().toISOString(),
                    user_id: window.UserManager ? window.UserManager.getCurrentUser().id : 'default'
                };
                
                // Add to current day
                const currentDay = window.TodayTomorrow ? 
                    window.TodayTomorrow.getCurrentDay() : 'today';
                newTask.day = currentDay;
                
                // Use proper API method if available
                if (display.addActivity) {
                    display.addActivity(newTask);
                } else if (display.addTask) {
                    display.addTask(newTask);
                } else if (display.addTaskDirect) {
                    display.addTaskDirect(newTask);
                } else {
                    // Fallback with proper saving
                    display.activities = display.activities || display.tasks || [];
                    display.activities.unshift(newTask);
                    if (display.saveActivities) {
                        display.saveActivities();
                    } else if (display.saveTasks) {
                        display.saveTasks();
                    }
                    if (display.displayActivities) {
                        display.displayActivities();
                    } else if (display.displayTasks) {
                        display.displayTasks();
                    } else {
                        display.render();
                    }
                }
                
                // Add undo support if available
                if (window.UndoManager) {
                    window.UndoManager.recordAction({
                        type: 'add_task',
                        taskId: newTask.id,
                        undo: function() {
                            if (display.removeActivity) {
                                display.removeActivity(newTask.id);
                            } else if (display.removeTask) {
                                display.removeTask(newTask.id);
                            } else if (display.deleteActivity) {
                                display.deleteActivity(newTask);
                            } else if (display.deleteTask) {
                                display.deleteTask(newTask);
                            }
                        },
                        redo: function() {
                            if (display.addActivity) {
                                display.addActivity(newTask);
                            } else if (display.addTask) {
                                display.addTask(newTask);
                            } else if (display.addTaskDirect) {
                                display.addTaskDirect(newTask);
                            }
                        }
                    });
                }
                
                // Update recently used
                self.updateRecentlyUsed(template);
                
                // Show feedback
                self.showAddedFeedback(template);
                
                // Announce to screen readers
                if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                    window.StackMapKeyboardNav.announce('Added ' + template.title);
                }
                
            } catch (error) {
                console.error('Failed to add template:', error);
                self.showError('Unable to add activity. Please try again.');
            } finally {
                // Remove visual feedback
                setTimeout(function() {
                    tileElement.classList.remove('adding');
                }, 300);
            }
        },
        
        /**
         * Update recently used templates
         */
        updateRecentlyUsed: function(template) {
            const self = this;
            
            // Remove if already in list
            self.recentlyUsed = self.recentlyUsed.filter(function(t) {
                return t.title !== template.title;
            });
            
            // Add to front
            self.recentlyUsed.unshift(template);
            
            // Limit to max
            if (self.recentlyUsed.length > self.MAX_RECENT) {
                self.recentlyUsed = self.recentlyUsed.slice(0, self.MAX_RECENT);
            }
            
            // Save to storage
            self.saveRecentlyUsed();
            
            // Update categories
            self.categorizeTemplates(self.getQuickTemplates());
        },
        
        /**
         * Show added feedback
         */
        showAddedFeedback: function(template) {
            const toast = document.createElement('div');
            toast.className = 'quick-add-toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            toast.innerHTML = '✓ Added ' + (template.icon || '') + ' ' + template.title;
            
            document.body.appendChild(toast);
            
            // Animate in
            requestAnimationFrame(function() {
                toast.classList.add('show');
            });
            
            // Remove after delay
            setTimeout(function() {
                toast.classList.remove('show');
                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 2000);
        },
        
        /**
         * Show error message
         */
        showError: function(message) {
            const toast = document.createElement('div');
            toast.className = 'quick-add-toast error';
            toast.setAttribute('role', 'alert');
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            // Animate in
            requestAnimationFrame(function() {
                toast.classList.add('show');
            });
            
            // Remove after delay
            setTimeout(function() {
                toast.classList.remove('show');
                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        },
        
        /**
         * Load recently used from storage
         */
        loadRecentlyUsed: function() {
            const self = this;
            
            try {
                const stored = localStorage.getItem(self.RECENT_STORAGE_KEY);
                if (stored) {
                    self.recentlyUsed = JSON.parse(stored);
                }
            } catch (e) {
                console.warn('Could not load recently used templates:', e);
                self.recentlyUsed = [];
            }
        },
        
        /**
         * Save recently used to storage
         */
        saveRecentlyUsed: function() {
            const self = this;
            
            try {
                localStorage.setItem(self.RECENT_STORAGE_KEY, 
                    JSON.stringify(self.recentlyUsed));
            } catch (e) {
                console.warn('Could not save recently used templates:', e);
            }
        },
        
        /**
         * Destroy and clean up
         */
        destroy: function() {
            const self = this;
            
            // Remove event listeners
            if (self.buttonElement) {
                self.buttonElement.onclick = null;
                if (self.buttonElement.parentNode) {
                    self.buttonElement.parentNode.removeChild(self.buttonElement);
                }
                self.buttonElement = null;
            }
            
            // Remove panel if open
            if (self.panelElement) {
                if (self.isOpen) {
                    self.closePanel();
                }
                if (self.panelElement.parentNode) {
                    self.panelElement.parentNode.removeChild(self.panelElement);
                }
                self.panelElement = null;
            }
            
            // Remove event handlers
            document.removeEventListener('click', self.backdropHandler);
            document.removeEventListener('keydown', self.escapeHandler);
            
            // Unsubscribe from EditMode events
            if (window.EditMode && window.EditMode.off) {
                window.EditMode.off('change');
            }
            
            // Reset state
            self.isInitialized = false;
            self.isOpen = false;
            self.currentCategory = null;
        }
    };
    
    // Export to global scope
    window.QuickAddUI = QuickAddUI;
    
})();