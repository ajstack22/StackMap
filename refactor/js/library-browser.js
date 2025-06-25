/**
 * Library Browser for StackMap Card Library System
 * Enhanced browsing interface for activity templates
 * Grid-based display with advanced search and filtering
 */

(function() {
    'use strict';
    
    const LibraryBrowser = {
        // State
        isInitialized: false,
        isVisible: false,
        templates: [],
        filteredTemplates: [],
        searchQuery: '',
        currentCategory: 'all',
        currentSort: 'recent',
        searchTimer: null,
        
        // UI Elements
        modal: null,
        searchInput: null,
        categoryContainer: null,
        templateGrid: null,
        
        /**
         * Initialize the library browser
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return Promise.resolve();
            
            return new Promise(function(resolve, reject) {
                // Ensure TemplateManager is available
                if (!window.TemplateManager) {
                    console.error('LibraryBrowser: TemplateManager not available');
                    reject(new Error('TemplateManager not available'));
                    return;
                }
                
                // Initialize TemplateManager if needed
                window.TemplateManager.init()
                    .then(function() {
                        self.isInitialized = true;
                        self.setupEventListeners();
                        console.log('LibraryBrowser: Initialized');
                        resolve();
                    })
                    .catch(function(error) {
                        console.error('LibraryBrowser: Initialization failed', error);
                        reject(error);
                    });
            });
        },
        
        /**
         * Show the library browser modal
         */
        showLibrary: function(options) {
            const self = this;
            options = options || {};
            
            // Initialize if needed
            if (!self.isInitialized) {
                self.init().then(function() {
                    self.showLibrary(options);
                });
                return;
            }
            
            // Check if Modal is available
            if (!window.Modal) {
                console.error('LibraryBrowser: Modal system not found');
                return;
            }
            
            // Set initial filters from options
            self.currentCategory = options.category || 'all';
            self.currentSort = options.sort || 'recent';
            self.searchQuery = options.search || '';
            
            // Build modal content
            const content = self.buildLibraryUI();
            
            // Show modal
            window.Modal.show({
                title: 'Template Library',
                content: content,
                className: 'template-library-modal',
                closeOnBackdrop: true,
                showCloseButton: true,
                size: 'large'
            });
            
            self.isVisible = true;
            
            // Setup UI after modal is shown
            setTimeout(function() {
                self.setupUIReferences();
                self.loadAndDisplayTemplates();
            }, 100);
        },
        
        /**
         * Hide the library browser
         */
        hideLibrary: function() {
            const self = this;
            
            if (window.Modal) {
                window.Modal.close();
            }
            
            self.isVisible = false;
            self.resetState();
        },
        
        /**
         * Refresh the display
         */
        refreshDisplay: function() {
            const self = this;
            
            if (!self.isVisible) return;
            
            self.loadAndDisplayTemplates();
        },
        
        /**
         * Build the library UI structure
         */
        buildLibraryUI: function() {
            let html = '';
            
            // Search and filters container
            html += '<div class="template-browser-header">';
            
            // Search bar
            html += '<div class="template-search-container">';
            html += '<input type="text" id="template-search" class="template-search" placeholder="Search templates..." autocomplete="off">';
            html += '<button type="button" id="template-search-clear" class="template-search-clear" aria-label="Clear search">×</button>';
            html += '</div>';
            
            // Sort controls
            html += '<div class="template-sort-container">';
            html += '<label for="template-sort-select" class="template-sort-label">Sort by:</label>';
            html += '<select id="template-sort-select" class="template-sort-select">';
            html += '<option value="recent">Recently Used</option>';
            html += '<option value="popularity">Most Popular</option>';
            html += '<option value="name">Name (A-Z)</option>';
            html += '<option value="category">Category</option>';
            html += '</select>';
            html += '</div>';
            
            html += '</div>'; // End header
            
            // Category filters
            html += '<div class="template-categories-wrapper">';
            html += '<div id="template-categories" class="template-categories">';
            html += '</div>';
            html += '</div>';
            
            // Template grid
            html += '<div id="template-grid" class="template-grid">';
            html += '<div class="template-loading">Loading templates...</div>';
            html += '</div>';
            
            // Template preview area (initially hidden)
            html += '<div id="template-preview" class="template-preview hidden">';
            html += '<div class="template-preview-header">';
            html += '<h3 id="template-preview-title">Template Preview</h3>';
            html += '<button type="button" id="template-preview-close" class="template-preview-close" aria-label="Close preview">×</button>';
            html += '</div>';
            html += '<div id="template-preview-content" class="template-preview-content">';
            html += '</div>';
            html += '<div class="template-preview-actions">';
            html += '<button type="button" id="template-use-btn" class="btn-primary">Use This Template</button>';
            html += '<button type="button" id="template-edit-btn" class="btn-secondary">Edit Template</button>';
            html += '<button type="button" id="template-duplicate-btn" class="btn-secondary">Duplicate</button>';
            html += '</div>';
            html += '</div>';
            
            return html;
        },
        
        /**
         * Setup UI element references
         */
        setupUIReferences: function() {
            const self = this;
            
            self.searchInput = document.getElementById('template-search');
            self.categoryContainer = document.getElementById('template-categories');
            self.templateGrid = document.getElementById('template-grid');
            
            // Setup search
            if (self.searchInput) {
                self.searchInput.value = self.searchQuery;
                self.searchInput.addEventListener('input', function(e) {
                    self.handleSearch(e.target.value);
                });
            }
            
            // Setup search clear
            const clearButton = document.getElementById('template-search-clear');
            if (clearButton) {
                clearButton.addEventListener('click', function() {
                    self.clearSearch();
                });
            }
            
            // Setup sort selector
            const sortSelect = document.getElementById('template-sort-select');
            if (sortSelect) {
                sortSelect.value = self.currentSort;
                sortSelect.addEventListener('change', function(e) {
                    self.sortTemplates(e.target.value);
                });
            }
            
            // Setup preview controls
            self.setupPreviewControls();
        },
        
        /**
         * Setup preview controls
         */
        setupPreviewControls: function() {
            const self = this;
            
            // Close preview
            const closeBtn = document.getElementById('template-preview-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    self.hidePreview();
                });
            }
            
            // Use template
            const useBtn = document.getElementById('template-use-btn');
            if (useBtn) {
                useBtn.addEventListener('click', function() {
                    const templateId = this.getAttribute('data-template-id');
                    if (templateId) {
                        self.useTemplate(templateId);
                    }
                });
            }
            
            // Edit template
            const editBtn = document.getElementById('template-edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', function() {
                    const templateId = this.getAttribute('data-template-id');
                    if (templateId) {
                        self.editTemplate(templateId);
                    }
                });
            }
            
            // Duplicate template
            const duplicateBtn = document.getElementById('template-duplicate-btn');
            if (duplicateBtn) {
                duplicateBtn.addEventListener('click', function() {
                    const templateId = this.getAttribute('data-template-id');
                    if (templateId) {
                        self.duplicateTemplate(templateId);
                    }
                });
            }
        },
        
        /**
         * Setup global event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Listen for template events
            document.addEventListener('template-saved', function(e) {
                if (self.isVisible) {
                    self.refreshDisplay();
                }
            });
            
            document.addEventListener('template-deleted', function(e) {
                if (self.isVisible) {
                    self.refreshDisplay();
                }
            });
            
            document.addEventListener('template-used', function(e) {
                if (self.isVisible) {
                    self.refreshDisplay();
                }
            });
        },
        
        /**
         * Load and display templates
         */
        loadAndDisplayTemplates: function() {
            const self = this;
            
            // Load all templates
            window.TemplateManager.search(self.searchQuery, {
                category: self.currentCategory,
                sortBy: self.currentSort
            }).then(function(templates) {
                self.templates = templates;
                self.filteredTemplates = templates;
                
                self.renderCategories();
                self.renderTemplates();
            }).catch(function(error) {
                console.error('LibraryBrowser: Failed to load templates', error);
                self.showError('Failed to load templates');
            });
        },
        
        /**
         * Render category filters
         */
        renderCategories: function() {
            const self = this;
            
            if (!self.categoryContainer) return;
            
            // Get all categories
            const categories = window.TemplateManager.getCategories();
            const allCount = self.templates.length;
            
            let html = '';
            
            // Add "All" category
            html += `<button type="button" class="template-category${self.currentCategory === 'all' ? ' active' : ''}" data-category="all">`;
            html += `All <span class="category-count">${allCount}</span>`;
            html += '</button>';
            
            // Add other categories
            categories.forEach(function(category) {
                const count = self.templates.filter(function(t) {
                    return t.category === category;
                }).length;
                
                if (count > 0) {
                    html += `<button type="button" class="template-category${self.currentCategory === category ? ' active' : ''}" data-category="${category}">`;
                    html += `${self.escapeHtml(category)} <span class="category-count">${count}</span>`;
                    html += '</button>';
                }
            });
            
            self.categoryContainer.innerHTML = html;
            
            // Add click handlers
            const categoryButtons = self.categoryContainer.querySelectorAll('.template-category');
            categoryButtons.forEach(function(button) {
                button.addEventListener('click', function() {
                    const category = this.getAttribute('data-category');
                    self.filterByCategory(category);
                });
            });
        },
        
        /**
         * Render templates grid
         */
        renderTemplates: function() {
            const self = this;
            
            if (!self.templateGrid) return;
            
            if (self.filteredTemplates.length === 0) {
                self.templateGrid.innerHTML = '<div class="template-empty">No templates found</div>';
                return;
            }
            
            // Build template cards
            let html = '';
            self.filteredTemplates.forEach(function(template, index) {
                html += self.createTemplateCard(template, index);
            });
            
            self.templateGrid.innerHTML = html;
            
            // Add click handlers
            const templateCards = self.templateGrid.querySelectorAll('.template-card');
            templateCards.forEach(function(card, index) {
                card.addEventListener('click', function() {
                    const template = self.filteredTemplates[index];
                    self.previewTemplate(template.id);
                });
            });
            
            // Add action button handlers
            const useButtons = self.templateGrid.querySelectorAll('.template-use-btn');
            useButtons.forEach(function(button, index) {
                button.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const template = self.filteredTemplates[index];
                    self.useTemplate(template.id);
                });
            });
        },
        
        /**
         * Create template card HTML
         */
        createTemplateCard: function(template, index) {
            const self = this;
            
            let html = '<div class="template-card" tabindex="0" role="button">';
            
            // Header with icon and type indicator
            html += '<div class="template-card-header">';
            html += `<div class="template-icon">${template.icon || '📝'}</div>`;
            
            // Type indicator
            if (template.type && template.type.category) {
                const typeInfo = self.getTypeInfo(template.type.category);
                html += `<div class="template-type-indicator ${template.type.category}" title="${typeInfo.description}">`;
                html += typeInfo.icon;
                html += '</div>';
            }
            
            html += '</div>';
            
            // Content
            html += '<div class="template-card-content">';
            html += `<h4 class="template-title">${self.escapeHtml(template.title)}</h4>`;
            html += `<p class="template-description">${self.escapeHtml(template.description || '')}</p>`;
            
            // Metadata
            html += '<div class="template-metadata">';
            html += `<span class="template-category">${self.escapeHtml(template.category)}</span>`;
            
            if (template.timeEstimate) {
                html += `<span class="template-time">${template.timeEstimate}m</span>`;
            }
            
            if (template.metadata && template.metadata.usageCount > 0) {
                html += `<span class="template-usage">Used ${template.metadata.usageCount} times</span>`;
            }
            
            html += '</div>';
            html += '</div>';
            
            // Actions
            html += '<div class="template-card-actions">';
            html += `<button type="button" class="template-use-btn btn-small btn-primary" data-index="${index}" aria-label="Use ${self.escapeHtml(template.title)}">`;
            html += 'Use';
            html += '</button>';
            html += '</div>';
            
            html += '</div>';
            
            return html;
        },
        
        /**
         * Get type information for display
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
         * Filter templates by category
         */
        filterByCategory: function(category) {
            const self = this;
            
            self.currentCategory = category;
            
            // Update active state
            const buttons = self.categoryContainer.querySelectorAll('.template-category');
            buttons.forEach(function(button) {
                if (button.getAttribute('data-category') === category) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
            
            // Re-search with new category
            self.searchTemplates();
        },
        
        /**
         * Search templates with current query
         */
        searchTemplates: function() {
            const self = this;
            
            window.TemplateManager.search(self.searchQuery, {
                category: self.currentCategory,
                sortBy: self.currentSort
            }).then(function(templates) {
                self.filteredTemplates = templates;
                self.renderTemplates();
            }).catch(function(error) {
                console.error('LibraryBrowser: Search failed', error);
            });
        },
        
        /**
         * Sort templates by specified criteria
         */
        sortTemplates: function(sortBy) {
            const self = this;
            
            self.currentSort = sortBy;
            self.searchTemplates();
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
                self.searchTemplates();
                
                // Show/hide clear button
                const clearButton = document.getElementById('template-search-clear');
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
            
            if (self.searchInput) {
                self.searchInput.value = '';
                self.searchInput.focus();
            }
            
            const clearButton = document.getElementById('template-search-clear');
            if (clearButton) {
                clearButton.style.display = 'none';
            }
            
            self.searchTemplates();
        },
        
        /**
         * Preview template
         */
        previewTemplate: function(templateId) {
            const self = this;
            
            window.TemplateManager.load(templateId)
                .then(function(template) {
                    self.showPreview(template);
                })
                .catch(function(error) {
                    console.error('LibraryBrowser: Preview failed', error);
                    self.showError('Failed to load template preview');
                });
        },
        
        /**
         * Show template preview
         */
        showPreview: function(template) {
            const self = this;
            
            const previewEl = document.getElementById('template-preview');
            const contentEl = document.getElementById('template-preview-content');
            const titleEl = document.getElementById('template-preview-title');
            
            if (!previewEl || !contentEl || !titleEl) return;
            
            // Set title
            titleEl.textContent = template.title;
            
            // Build preview content
            let html = '<div class="template-preview-details">';
            
            // Basic info
            html += '<div class="template-info-section">';
            html += `<h4>Description</h4>`;
            html += `<p>${self.escapeHtml(template.description || 'No description provided')}</p>`;
            html += '</div>';
            
            // Template structure
            html += '<div class="template-info-section">';
            html += '<h4>Activity Template</h4>';
            html += `<p><strong>Title:</strong> ${self.escapeHtml(template.template.title)}</p>`;
            if (template.template.description) {
                html += `<p><strong>Description:</strong> ${self.escapeHtml(template.template.description)}</p>`;
            }
            
            // Placeholders
            if (template.template.placeholders && template.template.placeholders.length > 0) {
                html += '<p><strong>Customizable fields:</strong></p>';
                html += '<ul>';
                template.template.placeholders.forEach(function(placeholder) {
                    html += `<li>${self.escapeHtml(placeholder)}</li>`;
                });
                html += '</ul>';
            }
            html += '</div>';
            
            // Metadata
            html += '<div class="template-info-section">';
            html += '<h4>Details</h4>';
            html += `<p><strong>Category:</strong> ${self.escapeHtml(template.category)}</p>`;
            if (template.timeEstimate) {
                html += `<p><strong>Estimated time:</strong> ${template.timeEstimate} minutes</p>`;
            }
            if (template.metadata.usageCount > 0) {
                html += `<p><strong>Used:</strong> ${template.metadata.usageCount} times</p>`;
            }
            if (template.metadata.tags && template.metadata.tags.length > 0) {
                html += `<p><strong>Tags:</strong> ${template.metadata.tags.join(', ')}</p>`;
            }
            html += '</div>';
            
            html += '</div>';
            
            contentEl.innerHTML = html;
            
            // Set up action buttons with template ID
            const useBtn = document.getElementById('template-use-btn');
            const editBtn = document.getElementById('template-edit-btn');
            const duplicateBtn = document.getElementById('template-duplicate-btn');
            
            if (useBtn) useBtn.setAttribute('data-template-id', template.id);
            if (editBtn) editBtn.setAttribute('data-template-id', template.id);
            if (duplicateBtn) duplicateBtn.setAttribute('data-template-id', template.id);
            
            // Show preview
            previewEl.classList.remove('hidden');
        },
        
        /**
         * Hide template preview
         */
        hidePreview: function() {
            const previewEl = document.getElementById('template-preview');
            if (previewEl) {
                previewEl.classList.add('hidden');
            }
        },
        
        /**
         * Use template to create activity
         */
        useTemplate: function(templateId) {
            const self = this;
            
            window.TemplateManager.load(templateId)
                .then(function(template) {
                    // Record usage
                    return window.TemplateManager.recordUsage(templateId);
                })
                .then(function() {
                    // Create activity from template
                    return self.createActivityFromTemplate(templateId);
                })
                .then(function() {
                    // Close library
                    self.hideLibrary();
                    self.showSuccessMessage('Activity created from template');
                })
                .catch(function(error) {
                    console.error('LibraryBrowser: Template usage failed', error);
                    self.showError('Failed to create activity from template');
                });
        },
        
        /**
         * Create activity from template
         */
        createActivityFromTemplate: function(templateId) {
            return new Promise(function(resolve, reject) {
                // This would integrate with the activity creation system
                // For now, we'll simulate the process
                
                window.TemplateManager.load(templateId)
                    .then(function(template) {
                        // Check if activity system is available
                        if (!window.ActivityDisplay && !window.TaskDisplay) {
                            throw new Error('Activity system not available');
                        }
                        
                        // Create new activity from template
                        const activity = {
                            id: `activity_${Date.now()}`,
                            title: template.template.title,
                            description: template.template.description || '',
                            category: template.category,
                            icon: template.icon,
                            priority: 'medium',
                            completed: false,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            order: Date.now()
                        };
                        
                        // Add type information if available
                        if (template.type) {
                            activity.type = template.type;
                        }
                        
                        // Add to activity system
                        const display = window.ActivityDisplay || window.TaskDisplay;
                        if (display && display.tasks) {
                            display.tasks.unshift(activity);
                            if (display.saveTasks) display.saveTasks();
                            if (display.render) display.render();
                        }
                        
                        resolve(activity);
                    })
                    .catch(function(error) {
                        reject(error);
                    });
            });
        },
        
        /**
         * Edit template
         */
        editTemplate: function(templateId) {
            const self = this;
            
            // This would open a template editing interface
            console.log('LibraryBrowser: Edit template not yet implemented', templateId);
            self.showError('Template editing will be available in a future update');
        },
        
        /**
         * Duplicate template
         */
        duplicateTemplate: function(templateId) {
            const self = this;
            
            const newTitle = prompt('Enter title for the duplicated template:');
            if (!newTitle) return;
            
            window.TemplateManager.duplicate(templateId, newTitle)
                .then(function(duplicatedTemplate) {
                    self.showSuccessMessage(`Template "${duplicatedTemplate.title}" created`);
                    self.refreshDisplay();
                })
                .catch(function(error) {
                    console.error('LibraryBrowser: Duplication failed', error);
                    self.showError('Failed to duplicate template');
                });
        },
        
        /**
         * Show success message
         */
        showSuccessMessage: function(message) {
            const notification = document.createElement('div');
            notification.className = 'template-success-message';
            notification.setAttribute('role', 'status');
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        },
        
        /**
         * Show error message
         */
        showError: function(message) {
            const notification = document.createElement('div');
            notification.className = 'template-error-message';
            notification.setAttribute('role', 'alert');
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        },
        
        /**
         * Reset browser state
         */
        resetState: function() {
            const self = this;
            
            self.searchQuery = '';
            self.currentCategory = 'all';
            self.currentSort = 'recent';
            self.filteredTemplates = [];
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
    window.LibraryBrowser = LibraryBrowser;
    
})();