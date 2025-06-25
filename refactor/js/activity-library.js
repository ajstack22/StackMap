/**
 * Activity Library for StackMap
 * Browse and add pre-made activities to task list
 * ES5 compliant - no const/let, arrow functions, or modern syntax
 */

(function() {
    'use strict';
    
    const ActivityLibrary = {
        // State
        isInitialized: false,
        activities: [],
        templates: [],
        categories: {},
        currentCategory: 'all',
        searchQuery: '',
        searchTimer: null,
        showTemplates: true, // Toggle between default activities and personal templates
        
        /**
         * Initialize the activity library
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return Promise.resolve();
            
            return new Promise(function(resolve, reject) {
                // Load default activities
                if (window.StackMapDefaultActivities) {
                    self.loadActivities();
                }
                
                // Initialize template system if available
                if (window.TemplateManager) {
                    window.TemplateManager.init()
                        .then(function() {
                            return self.loadTemplates();
                        })
                        .then(function() {
                            self.isInitialized = true;
                            console.log('ActivityLibrary: Initialized with templates');
                            resolve();
                        })
                        .catch(function(error) {
                            console.warn('ActivityLibrary: Template initialization failed, using defaults only', error);
                            self.isInitialized = true;
                            resolve();
                        });
                } else {
                    self.isInitialized = true;
                    console.log('ActivityLibrary: Initialized without templates');
                    resolve();
                }
            });
        },
        
        /**
         * Load activities from default activities
         */
        loadActivities: function() {
            const self = this;
            
            // Get categories
            self.categories = window.StackMapDefaultActivities.CATEGORIES;
            
            // Use progressive loading if available
            if (window.StackMapDefaultActivities.loadProgressive) {
                // Load activities progressively
                window.StackMapDefaultActivities.loadProgressive(function(activities) {
                    self.activities = activities;
                    console.log(`ActivityLibrary: Loaded ${self.activities.length} activities progressively`);
                    
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
                console.log(`ActivityLibrary: Loaded ${self.activities.length} activities`);
            }
        },
        
        /**
         * Load templates from template manager
         */
        loadTemplates: function() {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                if (!window.TemplateManager) {
                    resolve([]);
                    return;
                }
                
                window.TemplateManager.search('', { sortBy: 'recent' })
                    .then(function(templates) {
                        self.templates = templates || [];
                        console.log(`ActivityLibrary: Loaded ${self.templates.length} templates`);
                        resolve(templates);
                    })
                    .catch(function(error) {
                        console.error('ActivityLibrary: Failed to load templates', error);
                        self.templates = [];
                        reject(error);
                    });
            });
        },
        
        /**
         * Show the activity library modal
         */
        show: function(options) {
            const self = this;
            options = options || {};
            
            // Initialize if needed
            if (!self.isInitialized) {
                self.init().then(function() {
                    self.show(options);
                });
                return;
            }
            
            // Check if Modal is available
            if (!window.Modal) {
                console.error('ActivityLibrary: Modal system not found');
                return;
            }
            
            // Set initial display mode
            self.showTemplates = options.showTemplates !== undefined ? options.showTemplates : true;
            
            // Build modal content
            const content = self.buildLibraryUI();
            
            // Show modal
            window.Modal.show({
                title: self.showTemplates ? 'Template Library' : 'Activity Library',
                content: content,
                className: 'activity-library-modal enhanced',
                closeOnBackdrop: true,
                showCloseButton: true,
                size: 'large'
            });
            
            // Setup event handlers after modal is shown
            setTimeout(function() {
                self.setupEventHandlers();
                self.renderDisplayItems(self.currentCategory);
            }, 100);
        },
        
        /**
         * Build the library UI structure
         */
        buildLibraryUI: function() {
            const self = this;
            
            let html = '';
            
            // Header with mode toggle
            html += '<div class="activity-library-header">';
            
            // Mode toggle (templates vs default activities)
            html += '<div class="library-mode-toggle">';
            html += `<button type="button" id="toggle-templates" class="mode-toggle-btn${self.showTemplates ? ' active' : ''}" data-mode="templates">`;
            html += '📋 My Templates';
            html += '</button>';
            html += `<button type="button" id="toggle-activities" class="mode-toggle-btn${!self.showTemplates ? ' active' : ''}" data-mode="activities">`;
            html += '⭐ Default Activities';
            html += '</button>';
            html += '</div>';
            
            // Template management buttons (only show in template mode)
            if (self.showTemplates) {
                html += '<div class="template-actions">';
                html += '<button type="button" id="create-template-btn" class="btn-secondary" title="Create template from current activity">+ Create Template</button>';
                html += '<button type="button" id="browse-templates-btn" class="btn-secondary" title="Open advanced template browser">Browse All</button>';
                html += '</div>';
            }
            
            html += '</div>'; // End header
            
            // Search bar
            html += '<div class="activity-search-container">';
            html += `<input type="text" id="activity-search" class="activity-search" placeholder="${self.showTemplates ? 'Search templates...' : 'Search activities...'}" autocomplete="off">`;
            html += '<button type="button" id="activity-search-clear" class="activity-search-clear" aria-label="Clear search">×</button>';
            html += '</div>';
            
            // Category tabs container
            html += '<div class="activity-categories-wrapper">';
            html += '<div id="activity-categories" class="activity-categories">';
            html += '</div>';
            html += '</div>';
            
            // Items grid container
            html += '<div id="activity-grid" class="activity-grid">';
            html += `<div class="activity-loading">Loading ${self.showTemplates ? 'templates' : 'activities'}...</div>`;
            html += '</div>';
            
            return html;
        },
        
        /**
         * Setup event handlers
         */
        setupEventHandlers: function() {
            const self = this;
            
            // Mode toggle buttons
            const templatesBtn = document.getElementById('toggle-templates');
            const activitiesBtn = document.getElementById('toggle-activities');
            
            if (templatesBtn) {
                templatesBtn.addEventListener('click', function() {
                    self.toggleMode('templates');
                });
            }
            
            if (activitiesBtn) {
                activitiesBtn.addEventListener('click', function() {
                    self.toggleMode('activities');
                });
            }
            
            // Template management buttons
            const createTemplateBtn = document.getElementById('create-template-btn');
            const browseTemplatesBtn = document.getElementById('browse-templates-btn');
            
            if (createTemplateBtn) {
                createTemplateBtn.addEventListener('click', function() {
                    self.showCreateTemplateDialog();
                });
            }
            
            if (browseTemplatesBtn) {
                browseTemplatesBtn.addEventListener('click', function() {
                    self.openAdvancedBrowser();
                });
            }
            
            // Search input
            const searchInput = document.getElementById('activity-search');
            if (searchInput) {
                searchInput.addEventListener('input', function(e) {
                    self.handleSearch(e.target.value);
                });
            }
            
            // Search clear button
            const clearButton = document.getElementById('activity-search-clear');
            if (clearButton) {
                clearButton.addEventListener('click', function() {
                    self.clearSearch();
                });
            }
            
            // Render categories
            self.renderCategories();
        },
        
        /**
         * Toggle between templates and activities mode
         */
        toggleMode: function(mode) {
            const self = this;
            
            self.showTemplates = (mode === 'templates');
            
            // Update button states
            const templatesBtn = document.getElementById('toggle-templates');
            const activitiesBtn = document.getElementById('toggle-activities');
            
            if (templatesBtn && activitiesBtn) {
                if (self.showTemplates) {
                    templatesBtn.classList.add('active');
                    activitiesBtn.classList.remove('active');
                } else {
                    templatesBtn.classList.remove('active');
                    activitiesBtn.classList.add('active');
                }
            }
            
            // Update modal title
            const modalTitle = document.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = self.showTemplates ? 'Template Library' : 'Activity Library';
            }
            
            // Update search placeholder
            const searchInput = document.getElementById('activity-search');
            if (searchInput) {
                searchInput.placeholder = self.showTemplates ? 'Search templates...' : 'Search activities...';
            }
            
            // Re-render content
            self.currentCategory = 'all';
            self.searchQuery = '';
            self.renderCategories();
            self.renderDisplayItems(self.currentCategory);
        },
        
        /**
         * Show create template dialog
         */
        showCreateTemplateDialog: function() {
            const self = this;
            
            // Simple implementation - could be enhanced with a proper modal
            const title = prompt('Enter template title:');
            if (!title) return;
            
            const description = prompt('Enter template description (optional):') || '';
            const category = prompt('Enter category (optional):') || 'general';
            
            // Create a basic template
            const activityData = {
                title: title,
                description: description,
                category: category,
                icon: '📝'
            };
            
            if (window.TemplateManager) {
                window.TemplateManager.create(activityData, {
                    title: title,
                    description: description,
                    category: category
                })
                .then(function(template) {
                    self.loadTemplates().then(function() {
                        self.renderDisplayItems(self.currentCategory);
                    });
                    self.showSuccessMessage(`Template "${template.title}" created`);
                })
                .catch(function(error) {
                    console.error('ActivityLibrary: Template creation failed', error);
                    alert('Failed to create template. Please try again.');
                });
            }
        },
        
        /**
         * Open advanced template browser
         */
        openAdvancedBrowser: function() {
            const self = this;
            
            if (window.LibraryBrowser) {
                // Close current modal first
                window.Modal.close();
                
                // Open advanced browser
                window.LibraryBrowser.showLibrary();
            } else {
                alert('Advanced template browser is not available');
            }
        },
        
        /**
         * Render display items (activities or templates based on mode)
         */
        renderDisplayItems: function(category) {
            const self = this;
            
            if (self.showTemplates) {
                self.renderTemplates(category);
            } else {
                self.renderActivities(category);
            }
        },
        
        /**
         * Render templates grid
         */
        renderTemplates: function(category) {
            const self = this;
            
            const container = document.getElementById('activity-grid');
            if (!container) return;
            
            // Filter templates
            const filtered = self.filterTemplates(category);
            
            if (filtered.length === 0) {
                container.innerHTML = '<div class="activity-empty">No templates found. <button type="button" onclick="document.getElementById(\'create-template-btn\').click()">Create your first template</button></div>';
                return;
            }
            
            // Build template cards
            let html = '';
            for (let i = 0; i < filtered.length; i++) {
                const template = filtered[i];
                html += self.createTemplateCard(template, i);
            }
            
            container.innerHTML = html;
            
            // Add click handlers to use buttons
            const useButtons = container.querySelectorAll('.template-use-btn');
            for (let j = 0; j < useButtons.length; j++) {
                (function(index) {
                    useButtons[index].addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const template = filtered[index];
                        self.useTemplate(template);
                    });
                })(j);
            }
            
            // Add click handlers to save as template buttons
            const saveButtons = container.querySelectorAll('.template-save-btn');
            for (let k = 0; k < saveButtons.length; k++) {
                (function(index) {
                    saveButtons[index].addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const template = filtered[index];
                        self.saveAsTemplate(template);
                    });
                })(k);
            }
        },
        
        /**
         * Filter templates by category and search query
         */
        filterTemplates: function(category) {
            const self = this;
            const filtered = [];
            
            for (let i = 0; i < self.templates.length; i++) {
                const template = self.templates[i];
                
                // Check category
                if (category !== 'all' && template.category !== category) {
                    continue;
                }
                
                // Check search query
                if (self.searchQuery) {
                    const query = self.searchQuery.toLowerCase();
                    const title = (template.title || '').toLowerCase();
                    const description = (template.description || '').toLowerCase();
                    const tags = (template.metadata.tags || []).join(' ').toLowerCase();
                    
                    if (!title.includes(query) && !description.includes(query) && !tags.includes(query)) {
                        continue;
                    }
                }
                
                filtered.push(template);
            }
            
            return filtered;
        },
        
        /**
         * Create template card HTML
         */
        createTemplateCard: function(template, index) {
            const self = this;
            
            let html = '<div class="activity-card template-card">';
            
            // Icon with type indicator
            html += '<div class="activity-icon-container">';
            html += `<div class="activity-icon">${template.icon || '📝'}</div>`;
            
            // Type indicator
            if (template.type && template.type.category) {
                const typeInfo = self.getTypeInfo(template.type.category);
                html += `<div class="template-type-indicator ${template.type.category}" title="${typeInfo.description}">`;
                html += typeInfo.icon;
                html += '</div>';
            }
            html += '</div>';
            
            // Content
            html += '<div class="activity-content">';
            html += `<div class="activity-title">${self.escapeHtml(template.title)}</div>`;
            html += `<div class="activity-description">${self.escapeHtml(template.description || '')}</div>`;
            
            // Metadata
            html += '<div class="template-metadata">';
            html += `<span class="template-category">${self.escapeHtml(template.category)}</span>`;
            if (template.metadata.usageCount > 0) {
                html += `<span class="template-usage">Used ${template.metadata.usageCount} times</span>`;
            }
            html += '</div>';
            
            html += '</div>';
            
            // Use button
            html += `<button type="button" class="template-use-btn activity-add-btn" data-index="${index}" aria-label="Use ${self.escapeHtml(template.title)}">`;
            html += 'Use';
            html += '</button>';
            
            html += '</div>';
            
            return html;
        },
        
        /**
         * Get type information for templates
         */
        getTypeInfo: function(typeCategory) {
            const typeMap = {
                'recurring': { icon: '↻', description: 'Recurring activity' },
                'frequent': { icon: '⭐', description: 'Frequent activity' },
                'single-use': { icon: '○', description: 'Single-use activity' }
            };
            
            return typeMap[typeCategory] || { icon: '?', description: 'Unknown type' };
        },
        
        /**
         * Use template to create activity
         */
        useTemplate: function(template) {
            const self = this;
            
            if (!window.TemplateManager) {
                console.error('ActivityLibrary: TemplateManager not available');
                return;
            }
            
            // Record usage
            window.TemplateManager.recordUsage(template.id)
                .then(function() {
                    // Create activity from template
                    return self.createActivityFromTemplate(template);
                })
                .then(function() {
                    // Close modal
                    window.Modal.close();
                    self.showSuccessMessage(`Created activity from template "${template.title}"`);
                })
                .catch(function(error) {
                    console.error('ActivityLibrary: Template usage failed', error);
                    alert('Failed to create activity from template. Please try again.');
                });
        },
        
        /**
         * Create activity from template
         */
        createActivityFromTemplate: function(template) {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                // Check if in edit mode
                if (!window.EditMode || !window.EditMode.isActive()) {
                    alert('Please enable edit mode to add activities');
                    reject(new Error('Edit mode not active'));
                    return;
                }
                
                // Check if ActivityDisplay is available
                if (!window.ActivityDisplay && !window.TaskDisplay) {
                    console.error('ActivityLibrary: Activity system not found');
                    reject(new Error('Activity system not available'));
                    return;
                }
                
                // Create new activity from template
                const newActivity = {
                    id: `activity_${Date.now()}`,
                    title: template.template.title,
                    description: template.template.description || '',
                    icon: template.icon || '✓',
                    category: template.category,
                    priority: 'medium',
                    completed: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    user_id: null,
                    due_date: null,
                    reminder: null,
                    tags: template.metadata.tags || [],
                    order: Date.now()
                };
                
                // Add type information if available
                if (template.type) {
                    newActivity.type = template.type;
                }
                
                // Get current user if available
                if (window.UserManager) {
                    const currentUser = window.UserManager.getCurrentUser();
                    if (currentUser) {
                        newActivity.user_id = currentUser.id;
                    }
                }
                
                // Add to activities
                const display = window.ActivityDisplay || window.TaskDisplay;
                if (display.tasks) {
                    display.tasks.unshift(newActivity);
                    if (display.saveTasks) display.saveTasks();
                    if (display.render) display.render();
                }
                
                resolve(newActivity);
            });
        },
        
        /**
         * Render category tabs
         */
        renderCategories: function() {
            const self = this;
            
            const container = document.getElementById('activity-categories');
            if (!container) return;
            
            let html = '';
            let categories = {};
            let items = [];
            
            // Get items and categories based on current mode
            if (self.showTemplates) {
                items = self.templates;
                // Get template categories
                const templateCategories = new Set();
                self.templates.forEach(function(template) {
                    if (template.category) {
                        templateCategories.add(template.category);
                    }
                });
                
                Array.from(templateCategories).forEach(function(cat, index) {
                    categories[index] = cat;
                });
            } else {
                items = self.activities;
                categories = self.categories;
            }
            
            // Add "All" category first
            const allCount = items.length;
            html += `<button type="button" class="activity-category${self.currentCategory === 'all' ? ' active' : ''}" data-category="all">`;
            html += `All <span class="category-count">${allCount}</span>`;
            html += '</button>';
            
            // Add other categories
            for (const key in categories) {
                if (categories.hasOwnProperty(key)) {
                    const categoryName = categories[key];
                    const count = self.getItemCountByCategory(categoryName, items);
                    
                    if (count > 0) {
                        html += `<button type="button" class="activity-category${self.currentCategory === categoryName ? ' active' : ''}" data-category="${categoryName}">`;
                        html += `${categoryName} <span class="category-count">${count}</span>`;
                        html += '</button>';
                    }
                }
            }
            
            container.innerHTML = html;
            
            // Add click handlers to category buttons
            const categoryButtons = container.querySelectorAll('.activity-category');
            for (let i = 0; i < categoryButtons.length; i++) {
                categoryButtons[i].addEventListener('click', function(e) {
                    const category = this.getAttribute('data-category');
                    self.selectCategory(category);
                });
            }
        },
        
        /**
         * Get activity count for a category
         */
        getActivityCountByCategory: function(category) {
            const self = this;
            let count = 0;
            
            for (let i = 0; i < self.activities.length; i++) {
                if (self.activities[i].category === category) {
                    count++;
                }
            }
            
            return count;
        },
        
        /**
         * Get item count for a category (works for both activities and templates)
         */
        getItemCountByCategory: function(category, items) {
            let count = 0;
            
            for (let i = 0; i < items.length; i++) {
                if (items[i].category === category) {
                    count++;
                }
            }
            
            return count;
        },
        
        /**
         * Select a category
         */
        selectCategory: function(category) {
            const self = this;
            
            self.currentCategory = category;
            
            // Update active state
            const buttons = document.querySelectorAll('.activity-category');
            for (let i = 0; i < buttons.length; i++) {
                const btn = buttons[i];
                if (btn.getAttribute('data-category') === category) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
            
            // Render items for this category (activities or templates)
            self.renderDisplayItems(category);
        },
        
        /**
         * Render activities grid
         */
        renderActivities: function(category) {
            const self = this;
            
            const container = document.getElementById('activity-grid');
            if (!container) return;
            
            // Filter activities
            const filtered = self.filterActivities(category);
            
            if (filtered.length === 0) {
                container.innerHTML = '<div class="activity-empty">No activities found</div>';
                return;
            }
            
            // Build activity cards
            let html = '';
            for (let i = 0; i < filtered.length; i++) {
                const activity = filtered[i];
                html += self.createActivityCard(activity);
            }
            
            container.innerHTML = html;
            
            // Add click handlers to add buttons
            const addButtons = container.querySelectorAll('.activity-add-btn');
            for (let j = 0; j < addButtons.length; j++) {
                (function(index) {
                    addButtons[index].addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const activityIndex = parseInt(this.getAttribute('data-index'), 10);
                        self.addActivity(filtered[activityIndex]);
                    });
                })(j);
            }
        },
        
        /**
         * Filter activities by category and search query
         */
        filterActivities: function(category) {
            const self = this;
            const filtered = [];
            
            for (let i = 0; i < self.activities.length; i++) {
                const activity = self.activities[i];
                
                // Check category
                if (category !== 'all' && activity.category !== category) {
                    continue;
                }
                
                // Check search query
                if (self.searchQuery) {
                    const query = self.searchQuery.toLowerCase();
                    const title = (activity.title || '').toLowerCase();
                    const description = (activity.description || '').toLowerCase();
                    
                    if (!title.includes(query) && !description.includes(query)) {
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
            let html = '<div class="activity-card">';
            
            // Icon
            html += `<div class="activity-icon">${activity.icon || '✓'}</div>`;
            
            // Content
            html += '<div class="activity-content">';
            html += `<div class="activity-title">${this.escapeHtml(activity.title)}</div>`;
            html += `<div class="activity-description">${this.escapeHtml(activity.description)}</div>`;
            html += '</div>';
            
            // Add button
            html += `<button type="button" class="activity-add-btn" data-index="${this.activities.indexOf(activity)}" aria-label="Add ${this.escapeHtml(activity.title)}">`;
            html += '+';
            html += '</button>';
            
            html += '</div>';
            
            return html;
        },
        
        /**
         * Handle search input with debounce
         */
        handleSearch: function(query) {
            const self = this;
            
            // Clear existing timer
            if (self.searchTimer) {
                clearTimeout(self.searchTimer);
            }
            
            // Set new timer for 300ms debounce
            self.searchTimer = setTimeout(function() {
                self.searchQuery = query.trim();
                self.renderActivities(self.currentCategory);
                
                // Show/hide clear button
                const clearButton = document.getElementById('activity-search-clear');
                if (clearButton) {
                    clearButton.style.display = self.searchQuery ? 'block' : 'none';
                }
            }, 300);
        },
        
        /**
         * Clear search
         */
        clearSearch: function() {
            const self = this;
            
            self.searchQuery = '';
            
            const searchInput = document.getElementById('activity-search');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            
            const clearButton = document.getElementById('activity-search-clear');
            if (clearButton) {
                clearButton.style.display = 'none';
            }
            
            self.renderActivities(self.currentCategory);
        },
        
        /**
         * Add activity to task list
         */
        addActivity: function(activity) {
            const self = this;
            
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
            const userTasks = window.TaskDisplay.getUserTasks();
            for (let i = 0; i < userTasks.length; i++) {
                const existingTask = userTasks[i];
                if (existingTask.title === activity.title && 
                    existingTask.description === activity.description &&
                    !existingTask.completed) {
                    // Found duplicate - show message and don't add
                    self.showDuplicateMessage(`Activity "${activity.title}" already exists`);
                    return;
                }
            }
            
            // Create new task from activity
            const newTask = {
                id: `task_${Date.now()}`,
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
                const currentUser = window.UserManager.getCurrentUser();
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
            self.showSuccessMessage(`Added "${activity.title}" to your activities`);
        },
        
        /**
         * Show success message
         */
        showSuccessMessage: function(message) {
            const notification = document.createElement('div');
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
            const notification = document.createElement('div');
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
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }
    };
    
    // Export to global scope
    window.ActivityLibrary = ActivityLibrary;
    
})();