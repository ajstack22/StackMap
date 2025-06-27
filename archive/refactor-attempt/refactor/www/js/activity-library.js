/**
 * Activity Library for StackMap
 * Browse and add pre-made activities to task list
 * ES5 compliant - no const/let, arrow functions, or modern syntax
 */

(function() {
    'use strict';
    
    var ActivityLibrary = {
        // State
        isInitialized: false,
        activities: [],
        categories: {},
        currentCategory: 'all',
        searchQuery: '',
        searchTimer: null,
        
        /**
         * Initialize the activity library
         */
        init: function() {
            var self = this;
            
            if (self.isInitialized) return;
            
            // Load activities and categories
            if (window.StackMapDefaultActivities) {
                self.loadActivities();
                self.isInitialized = true;
            } else {
                console.error('ActivityLibrary: Default activities not found');
            }
        },
        
        /**
         * Load activities from default activities
         */
        loadActivities: function() {
            var self = this;
            
            // Get categories
            self.categories = window.StackMapDefaultActivities.CATEGORIES;
            
            // Use progressive loading if available
            if (window.StackMapDefaultActivities.loadProgressive) {
                // Load activities progressively
                window.StackMapDefaultActivities.loadProgressive(function(activities) {
                    self.activities = activities;
                    console.log('ActivityLibrary: Loaded ' + self.activities.length + ' activities progressively');
                    
                    // Re-render if modal is open
                    if (document.querySelector('.activity-library-modal')) {
                        self.renderActivities(self.currentCategory);
                    }
                });
                
                // Use currently loaded activities immediately
                self.activities = window.StackMapDefaultActivities.getLoadedActivities();
            } else {
                // Fallback to loading all at once
                self.activities = window.StackMapDefaultActivities.getAllActivities();
                console.log('ActivityLibrary: Loaded ' + self.activities.length + ' activities');
            }
        },
        
        /**
         * Show the activity library modal
         */
        show: function() {
            var self = this;
            
            // Initialize if needed
            if (!self.isInitialized) {
                self.init();
            }
            
            // Check if Modal is available
            if (!window.Modal) {
                console.error('ActivityLibrary: Modal system not found');
                return;
            }
            
            // Build modal content
            var content = self.buildLibraryUI();
            
            // Show modal
            window.Modal.show({
                title: 'Activity Library',
                content: content,
                className: 'activity-library-modal',
                closeOnBackdrop: true,
                showCloseButton: true
            });
            
            // Setup event handlers after modal is shown
            setTimeout(function() {
                self.setupEventHandlers();
                self.renderActivities(self.currentCategory);
            }, 100);
        },
        
        /**
         * Build the library UI structure
         */
        buildLibraryUI: function() {
            var self = this;
            
            var html = '';
            
            // Search bar
            html += '<div class="activity-search-container">';
            html += '<input type="text" id="activity-search" class="activity-search" placeholder="Search activities..." autocomplete="off">';
            html += '<button type="button" id="activity-search-clear" class="activity-search-clear" aria-label="Clear search">×</button>';
            html += '</div>';
            
            // Category tabs container
            html += '<div class="activity-categories-wrapper">';
            html += '<div id="activity-categories" class="activity-categories">';
            html += '</div>';
            html += '</div>';
            
            // Activities grid container
            html += '<div id="activity-grid" class="activity-grid">';
            html += '<div class="activity-loading">Loading activities...</div>';
            html += '</div>';
            
            return html;
        },
        
        /**
         * Setup event handlers
         */
        setupEventHandlers: function() {
            var self = this;
            
            // Search input
            var searchInput = document.getElementById('activity-search');
            if (searchInput) {
                searchInput.addEventListener('input', function(e) {
                    self.handleSearch(e.target.value);
                });
            }
            
            // Search clear button
            var clearButton = document.getElementById('activity-search-clear');
            if (clearButton) {
                clearButton.addEventListener('click', function() {
                    self.clearSearch();
                });
            }
            
            // Render categories
            self.renderCategories();
        },
        
        /**
         * Render category tabs
         */
        renderCategories: function() {
            var self = this;
            
            var container = document.getElementById('activity-categories');
            if (!container) return;
            
            var html = '';
            
            // Add "All" category first
            var allCount = self.activities.length;
            html += '<button type="button" class="activity-category' + (self.currentCategory === 'all' ? ' active' : '') + '" data-category="all">';
            html += 'All <span class="category-count">' + allCount + '</span>';
            html += '</button>';
            
            // Add other categories
            for (var key in self.categories) {
                if (self.categories.hasOwnProperty(key)) {
                    var categoryName = self.categories[key];
                    var count = self.getActivityCountByCategory(categoryName);
                    
                    if (count > 0) {
                        html += '<button type="button" class="activity-category' + (self.currentCategory === categoryName ? ' active' : '') + '" data-category="' + categoryName + '">';
                        html += categoryName + ' <span class="category-count">' + count + '</span>';
                        html += '</button>';
                    }
                }
            }
            
            container.innerHTML = html;
            
            // Add click handlers to category buttons
            var categoryButtons = container.querySelectorAll('.activity-category');
            for (var i = 0; i < categoryButtons.length; i++) {
                categoryButtons[i].addEventListener('click', function(e) {
                    var category = this.getAttribute('data-category');
                    self.selectCategory(category);
                });
            }
        },
        
        /**
         * Get activity count for a category
         */
        getActivityCountByCategory: function(category) {
            var self = this;
            var count = 0;
            
            for (var i = 0; i < self.activities.length; i++) {
                if (self.activities[i].category === category) {
                    count++;
                }
            }
            
            return count;
        },
        
        /**
         * Select a category
         */
        selectCategory: function(category) {
            var self = this;
            
            self.currentCategory = category;
            
            // Update active state
            var buttons = document.querySelectorAll('.activity-category');
            for (var i = 0; i < buttons.length; i++) {
                var btn = buttons[i];
                if (btn.getAttribute('data-category') === category) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
            
            // Render activities for this category
            self.renderActivities(category);
        },
        
        /**
         * Render activities grid
         */
        renderActivities: function(category) {
            var self = this;
            
            var container = document.getElementById('activity-grid');
            if (!container) return;
            
            // Filter activities
            var filtered = self.filterActivities(category);
            
            if (filtered.length === 0) {
                container.innerHTML = '<div class="activity-empty">No activities found</div>';
                return;
            }
            
            // Build activity cards
            var html = '';
            for (var i = 0; i < filtered.length; i++) {
                var activity = filtered[i];
                html += self.createActivityCard(activity);
            }
            
            container.innerHTML = html;
            
            // Add click handlers to add buttons
            var addButtons = container.querySelectorAll('.activity-add-btn');
            for (var j = 0; j < addButtons.length; j++) {
                (function(index) {
                    addButtons[index].addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var activityIndex = parseInt(this.getAttribute('data-index'), 10);
                        self.addActivity(filtered[activityIndex]);
                    });
                })(j);
            }
        },
        
        /**
         * Filter activities by category and search query
         */
        filterActivities: function(category) {
            var self = this;
            var filtered = [];
            
            for (var i = 0; i < self.activities.length; i++) {
                var activity = self.activities[i];
                
                // Check category
                if (category !== 'all' && activity.category !== category) {
                    continue;
                }
                
                // Check search query
                if (self.searchQuery) {
                    var query = self.searchQuery.toLowerCase();
                    var title = (activity.title || '').toLowerCase();
                    var description = (activity.description || '').toLowerCase();
                    
                    if (title.indexOf(query) === -1 && description.indexOf(query) === -1) {
                        continue;
                    }
                }
                
                filtered.push(activity);
            }
            
            return filtered;
        },
        
        /**
         * Create activity card HTML
         */
        createActivityCard: function(activity) {
            var html = '<div class="activity-card">';
            
            // Icon
            html += '<div class="activity-icon">' + (activity.icon || '✓') + '</div>';
            
            // Content
            html += '<div class="activity-content">';
            html += '<div class="activity-title">' + self.escapeHtml(activity.title) + '</div>';
            html += '<div class="activity-description">' + self.escapeHtml(activity.description) + '</div>';
            html += '</div>';
            
            // Add button
            html += '<button type="button" class="activity-add-btn" data-index="' + self.activities.indexOf(activity) + '" aria-label="Add ' + self.escapeHtml(activity.title) + '">';
            html += '+';
            html += '</button>';
            
            html += '</div>';
            
            return html;
        },
        
        /**
         * Handle search input with debounce
         */
        handleSearch: function(query) {
            var self = this;
            
            // Clear existing timer
            if (self.searchTimer) {
                clearTimeout(self.searchTimer);
            }
            
            // Set new timer for 300ms debounce
            self.searchTimer = setTimeout(function() {
                self.searchQuery = query.trim();
                self.renderActivities(self.currentCategory);
                
                // Show/hide clear button
                var clearButton = document.getElementById('activity-search-clear');
                if (clearButton) {
                    clearButton.style.display = self.searchQuery ? 'block' : 'none';
                }
            }, 300);
        },
        
        /**
         * Clear search
         */
        clearSearch: function() {
            var self = this;
            
            self.searchQuery = '';
            
            var searchInput = document.getElementById('activity-search');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            
            var clearButton = document.getElementById('activity-search-clear');
            if (clearButton) {
                clearButton.style.display = 'none';
            }
            
            self.renderActivities(self.currentCategory);
        },
        
        /**
         * Add activity to task list
         */
        addActivity: function(activity) {
            var self = this;
            
            // Check if in edit mode
            if (!window.EditMode || !window.EditMode.isActive()) {
                alert('Please enable edit mode to add activities');
                return;
            }
            
            // Check if TaskDisplay is available
            if (!window.TaskDisplay) {
                console.error('ActivityLibrary: TaskDisplay not found');
                return;
            }
            
            // Check for exact duplicates in current user's tasks
            var userTasks = window.TaskDisplay.getUserTasks();
            for (var i = 0; i < userTasks.length; i++) {
                var existingTask = userTasks[i];
                if (existingTask.title === activity.title && 
                    existingTask.description === activity.description &&
                    !existingTask.completed) {
                    // Found duplicate - show message and don't add
                    self.showDuplicateMessage('Task "' + activity.title + '" already exists');
                    return;
                }
            }
            
            // Create new task from activity
            var newTask = {
                id: 'task_' + Date.now(),
                title: activity.title,
                description: activity.description,
                icon: activity.icon || '✓',
                category: activity.category,
                priority: 'medium',
                completed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                user_id: null,
                due_date: null,
                reminder: null,
                tags: [],
                order: Date.now()
            };
            
            // Get current user if available
            if (window.UserManager) {
                var currentUser = window.UserManager.getCurrentUser();
                if (currentUser) {
                    newTask.user_id = currentUser.id;
                }
            }
            
            // Add to tasks
            window.TaskDisplay.tasks.unshift(newTask);
            window.TaskDisplay.saveTasks();
            window.TaskDisplay.render();
            
            // Close modal
            window.Modal.close();
            
            // Show success message
            self.showSuccessMessage('Added "' + activity.title + '" to your tasks');
        },
        
        /**
         * Show success message
         */
        showSuccessMessage: function(message) {
            var notification = document.createElement('div');
            notification.className = 'activity-success-message';
            notification.setAttribute('role', 'status');
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        },
        
        /**
         * Show duplicate message
         */
        showDuplicateMessage: function(message) {
            var notification = document.createElement('div');
            notification.className = 'activity-duplicate-message';
            notification.setAttribute('role', 'alert');
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        },
        
        /**
         * Escape HTML for safe display
         */
        escapeHtml: function(text) {
            var div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }
    };
    
    // Export to global scope
    window.ActivityLibrary = ActivityLibrary;
    
})();