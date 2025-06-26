/**
 * Card Library System for StackMap
 * Centralized library for browsing and adding activities from templates
 * Mobile-first, ADHD-friendly design with offline support
 */

(function() {
    'use strict';
    
    const CardLibrary = {
        // State management
        isInitialized: false,
        templates: [],
        categories: {},
        currentCategory: 'all',
        searchQuery: '',
        searchDebounceTimer: null,
        favoriteTemplates: new Set(),
        recentTemplates: [],
        cache: {
            templates: null,
            categories: null,
            lastUpdated: null
        },
        
        // Configuration
        config: {
            maxRecentTemplates: 5,
            searchDebounceDelay: 300,
            cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
            lazyLoadThreshold: 20,
            touchTargetSize: 44 // Will be 60 in safe mode
        },
        
        /**
         * Initialize the card library system
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return Promise.resolve();
            
            // Check safe mode
            if (window.StackMapSafeMode) {
                self.config.touchTargetSize = 60;
            }
            
            return new Promise(function(resolve, reject) {
                // Load cached data first for instant display
                self.loadFromCache()
                    .then(function() {
                        // Load favorites and recent from storage
                        return self.loadUserPreferences();
                    })
                    .then(function() {
                        // Load fresh templates in background
                        self.loadTemplates();
                        self.isInitialized = true;
                        resolve();
                    })
                    .catch(function(error) {
                        console.error('CardLibrary: Initialization failed', error);
                        reject(error);
                    });
            });
        },
        
        /**
         * Load templates from cache for offline support
         */
        loadFromCache: function() {
            const self = this;
            
            return new Promise(function(resolve) {
                try {
                    const cached = localStorage.getItem('library-templates-v1');
                    if (cached) {
                        const data = JSON.parse(cached);
                        if (data.timestamp && (Date.now() - data.timestamp < self.config.cacheExpiration)) {
                            self.cache.templates = data.templates;
                            self.cache.categories = data.categories;
                            self.cache.lastUpdated = data.timestamp;
                            console.log('CardLibrary: Loaded from cache');
                        }
                    }
                } catch (error) {
                    console.warn('CardLibrary: Cache load failed', error);
                }
                resolve();
            });
        },
        
        /**
         * Save templates to cache
         */
        saveToCache: function() {
            const self = this;
            
            try {
                const data = {
                    templates: self.templates,
                    categories: self.categories,
                    timestamp: Date.now()
                };
                localStorage.setItem('library-templates-v1', JSON.stringify(data));
            } catch (error) {
                console.warn('CardLibrary: Cache save failed', error);
            }
        },
        
        /**
         * Load user preferences (favorites, recent)
         */
        loadUserPreferences: function() {
            const self = this;
            
            return new Promise(function(resolve) {
                try {
                    // Load favorites
                    const favorites = localStorage.getItem('library-favorites-v1');
                    if (favorites) {
                        self.favoriteTemplates = new Set(JSON.parse(favorites));
                    }
                    
                    // Load recent templates
                    const recent = localStorage.getItem('library-recent-v1');
                    if (recent) {
                        self.recentTemplates = JSON.parse(recent);
                    }
                } catch (error) {
                    console.warn('CardLibrary: Preferences load failed', error);
                }
                resolve();
            });
        },
        
        /**
         * Save user preferences
         */
        saveUserPreferences: function() {
            const self = this;
            
            try {
                localStorage.setItem('library-favorites-v1', JSON.stringify(Array.from(self.favoriteTemplates)));
                localStorage.setItem('library-recent-v1', JSON.stringify(self.recentTemplates));
            } catch (error) {
                console.warn('CardLibrary: Preferences save failed', error);
            }
        },
        
        /**
         * Load templates (will be populated by library-templates.js)
         */
        loadTemplates: function() {
            const self = this;
            
            // This will be populated by library-templates.js
            if (window.LibraryTemplates) {
                self.templates = window.LibraryTemplates.getTemplates();
                self.categories = window.LibraryTemplates.getCategories();
                self.saveToCache();
                console.log(`CardLibrary: Loaded ${self.templates.length} templates`);
            }
        },
        
        /**
         * Show the card library modal
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
                console.error('CardLibrary: Modal system not found');
                return;
            }
            
            // Build modal content
            const content = self.buildLibraryUI();
            
            // Show modal
            window.Modal.show({
                title: 'Activity Library',
                content: content,
                className: 'card-library-modal',
                closeOnBackdrop: true,
                showCloseButton: true,
                size: 'large'
            });
            
            // Setup event handlers after modal is shown
            setTimeout(function() {
                self.setupEventHandlers();
                self.renderCategories();
                self.renderTemplates(self.currentCategory);
            }, 100);
        },
        
        /**
         * Build the library UI structure
         */
        buildLibraryUI: function() {
            const self = this;
            
            let html = '';
            
            // Header with quick filters
            html += '<div class="library-header">';
            html += '<div class="library-quick-filters">';
            html += '<button type="button" class="quick-filter-btn active" data-filter="all">All</button>';
            html += '<button type="button" class="quick-filter-btn" data-filter="recent">Recent</button>';
            html += '<button type="button" class="quick-filter-btn" data-filter="favorites">Favorites</button>';
            html += '</div>';
            html += '</div>';
            
            // Search bar
            html += '<div class="library-search-container">';
            html += '<input type="text" id="library-search" class="library-search" placeholder="Search activities..." autocomplete="off">';
            html += '<button type="button" id="library-search-clear" class="library-search-clear" aria-label="Clear search">×</button>';
            html += '</div>';
            
            // Category navigation
            html += '<div class="library-categories-wrapper">';
            html += '<div id="library-categories" class="library-categories"></div>';
            html += '</div>';
            
            // Templates grid
            html += '<div id="library-grid" class="library-grid">';
            html += '<div class="library-loading">Loading templates...</div>';
            html += '</div>';
            
            return html;
        },
        
        /**
         * Setup event handlers
         */
        setupEventHandlers: function() {
            const self = this;
            
            // Quick filter buttons
            const filterButtons = document.querySelectorAll('.quick-filter-btn');
            filterButtons.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    self.handleQuickFilter(this.getAttribute('data-filter'));
                });
            });
            
            // Search input
            const searchInput = document.getElementById('library-search');
            if (searchInput) {
                searchInput.addEventListener('input', function(e) {
                    self.handleSearch(e.target.value);
                });
            }
            
            // Search clear button
            const clearButton = document.getElementById('library-search-clear');
            if (clearButton) {
                clearButton.addEventListener('click', function() {
                    self.clearSearch();
                });
            }
        },
        
        /**
         * Handle quick filter selection
         */
        handleQuickFilter: function(filter) {
            const self = this;
            
            // Update active state
            document.querySelectorAll('.quick-filter-btn').forEach(function(btn) {
                btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
            });
            
            // Apply filter
            switch (filter) {
                case 'recent':
                    self.showRecentTemplates();
                    break;
                case 'favorites':
                    self.showFavoriteTemplates();
                    break;
                default:
                    self.currentCategory = 'all';
                    self.renderTemplates('all');
            }
        },
        
        /**
         * Show recent templates
         */
        showRecentTemplates: function() {
            const self = this;
            const container = document.getElementById('library-grid');
            if (!container) return;
            
            const recentTemplates = self.templates.filter(function(template) {
                return self.recentTemplates.includes(template.id);
            });
            
            if (recentTemplates.length === 0) {
                container.innerHTML = '<div class="library-empty">No recent activities. Start browsing to build your history!</div>';
                return;
            }
            
            self.renderTemplateCards(recentTemplates);
        },
        
        /**
         * Show favorite templates
         */
        showFavoriteTemplates: function() {
            const self = this;
            const container = document.getElementById('library-grid');
            if (!container) return;
            
            const favoriteTemplates = self.templates.filter(function(template) {
                return self.favoriteTemplates.has(template.id);
            });
            
            if (favoriteTemplates.length === 0) {
                container.innerHTML = '<div class="library-empty">No favorites yet. Click the star icon to save your favorite activities!</div>';
                return;
            }
            
            self.renderTemplateCards(favoriteTemplates);
        },
        
        /**
         * Render category navigation
         */
        renderCategories: function() {
            const self = this;
            const container = document.getElementById('library-categories');
            if (!container) return;
            
            let html = '';
            
            // All category
            html += `<button type="button" class="library-category${self.currentCategory === 'all' ? ' active' : ''}" data-category="all">`;
            html += `<span class="category-icon">📚</span>`;
            html += `<span class="category-name">All</span>`;
            html += `<span class="category-count">${self.templates.length}</span>`;
            html += '</button>';
            
            // Other categories
            Object.keys(self.categories).forEach(function(key) {
                const category = self.categories[key];
                const count = self.getTemplateCountByCategory(category.name);
                
                if (count > 0) {
                    html += `<button type="button" class="library-category${self.currentCategory === category.name ? ' active' : ''}" data-category="${category.name}">`;
                    html += `<span class="category-icon">${category.icon}</span>`;
                    html += `<span class="category-name">${category.name}</span>`;
                    html += `<span class="category-count">${count}</span>`;
                    html += '</button>';
                }
            });
            
            container.innerHTML = html;
            
            // Add click handlers
            container.querySelectorAll('.library-category').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    self.selectCategory(this.getAttribute('data-category'));
                });
            });
        },
        
        /**
         * Get template count by category
         */
        getTemplateCountByCategory: function(category) {
            const self = this;
            return self.templates.filter(function(template) {
                return template.category === category;
            }).length;
        },
        
        /**
         * Select category
         */
        selectCategory: function(category) {
            const self = this;
            
            self.currentCategory = category;
            
            // Update active state
            document.querySelectorAll('.library-category').forEach(function(btn) {
                btn.classList.toggle('active', btn.getAttribute('data-category') === category);
            });
            
            // Clear quick filters
            document.querySelectorAll('.quick-filter-btn').forEach(function(btn) {
                btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
            });
            
            self.renderTemplates(category);
        },
        
        /**
         * Render templates grid
         */
        renderTemplates: function(category) {
            const self = this;
            
            const filtered = self.filterTemplates(category);
            self.renderTemplateCards(filtered);
        },
        
        /**
         * Filter templates by category and search
         */
        filterTemplates: function(category) {
            const self = this;
            
            return self.templates.filter(function(template) {
                // Category filter
                if (category !== 'all' && template.category !== category) {
                    return false;
                }
                
                // Search filter
                if (self.searchQuery) {
                    const query = self.searchQuery.toLowerCase();
                    const searchableText = [
                        template.title,
                        template.description,
                        template.tags.join(' ')
                    ].join(' ').toLowerCase();
                    
                    return searchableText.includes(query);
                }
                
                return true;
            });
        },
        
        /**
         * Render template cards
         */
        renderTemplateCards: function(templates) {
            const self = this;
            const container = document.getElementById('library-grid');
            if (!container) return;
            
            if (templates.length === 0) {
                container.innerHTML = '<div class="library-empty">No activities found. Try a different category or search term.</div>';
                return;
            }
            
            let html = '';
            templates.forEach(function(template, index) {
                html += self.createTemplateCard(template, index);
            });
            
            container.innerHTML = html;
            
            // Add event handlers
            self.attachCardEventHandlers();
        },
        
        /**
         * Create template card HTML
         */
        createTemplateCard: function(template) {
            const self = this;
            const isFavorite = self.favoriteTemplates.has(template.id);
            
            let html = '<div class="library-card" data-template-id="' + template.id + '">';
            
            // Card header
            html += '<div class="card-header">';
            html += '<div class="card-icon">' + template.icon + '</div>';
            html += '<button type="button" class="card-favorite-btn' + (isFavorite ? ' active' : '') + '" aria-label="Toggle favorite">';
            html += isFavorite ? '⭐' : '☆';
            html += '</button>';
            html += '</div>';
            
            // Card content
            html += '<div class="card-content">';
            html += '<h3 class="card-title">' + self.escapeHtml(template.title) + '</h3>';
            html += '<p class="card-description">' + self.escapeHtml(template.description) + '</p>';
            
            // Tags
            if (template.tags && template.tags.length > 0) {
                html += '<div class="card-tags">';
                template.tags.forEach(function(tag) {
                    html += '<span class="card-tag">' + self.escapeHtml(tag) + '</span>';
                });
                html += '</div>';
            }
            
            html += '</div>';
            
            // Card actions
            html += '<div class="card-actions">';
            html += '<button type="button" class="card-preview-btn">Preview</button>';
            html += '<button type="button" class="card-add-btn">Add to Day</button>';
            html += '</div>';
            
            html += '</div>';
            
            return html;
        },
        
        /**
         * Attach event handlers to card elements
         */
        attachCardEventHandlers: function() {
            const self = this;
            
            // Favorite buttons
            document.querySelectorAll('.card-favorite-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const card = this.closest('.library-card');
                    const templateId = card.getAttribute('data-template-id');
                    self.toggleFavorite(templateId, this);
                });
            });
            
            // Preview buttons
            document.querySelectorAll('.card-preview-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const card = this.closest('.library-card');
                    const templateId = card.getAttribute('data-template-id');
                    self.previewTemplate(templateId);
                });
            });
            
            // Add buttons
            document.querySelectorAll('.card-add-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const card = this.closest('.library-card');
                    const templateId = card.getAttribute('data-template-id');
                    self.addTemplate(templateId);
                });
            });
        },
        
        /**
         * Toggle favorite status
         */
        toggleFavorite: function(templateId, button) {
            const self = this;
            
            if (self.favoriteTemplates.has(templateId)) {
                self.favoriteTemplates.delete(templateId);
                button.classList.remove('active');
                button.textContent = '☆';
            } else {
                self.favoriteTemplates.add(templateId);
                button.classList.add('active');
                button.textContent = '⭐';
            }
            
            self.saveUserPreferences();
        },
        
        /**
         * Preview template
         */
        previewTemplate: function(templateId) {
            const self = this;
            const template = self.templates.find(function(t) {
                return t.id === templateId;
            });
            
            if (!template) return;
            
            // Show preview in a smaller modal
            if (window.Modal) {
                let previewHtml = '<div class="template-preview">';
                previewHtml += '<div class="preview-icon">' + template.icon + '</div>';
                previewHtml += '<h3>' + self.escapeHtml(template.title) + '</h3>';
                previewHtml += '<p>' + self.escapeHtml(template.description) + '</p>';
                
                if (template.fields && template.fields.length > 0) {
                    previewHtml += '<div class="preview-fields">';
                    previewHtml += '<h4>Customizable Fields:</h4>';
                    previewHtml += '<ul>';
                    template.fields.forEach(function(field) {
                        previewHtml += '<li>' + self.escapeHtml(field.label) + '</li>';
                    });
                    previewHtml += '</ul>';
                    previewHtml += '</div>';
                }
                
                previewHtml += '</div>';
                
                window.Modal.show({
                    title: 'Activity Preview',
                    content: previewHtml,
                    size: 'small',
                    buttons: [
                        {
                            text: 'Add to Day',
                            className: 'btn-primary',
                            onClick: function() {
                                window.Modal.close();
                                self.addTemplate(templateId);
                            }
                        }
                    ]
                });
            }
        },
        
        /**
         * Add template to current day
         */
        addTemplate: function(templateId) {
            const self = this;
            const template = self.templates.find(function(t) {
                return t.id === templateId;
            });
            
            if (!template) return;
            
            // Check if template has customizable fields
            if (template.fields && template.fields.length > 0) {
                self.showCustomizationDialog(template);
            } else {
                self.createActivityFromTemplate(template);
            }
        },
        
        /**
         * Show customization dialog for template
         */
        showCustomizationDialog: function(template) {
            const self = this;
            
            let customHtml = '<div class="template-customize">';
            customHtml += '<p>Customize this activity for your needs:</p>';
            customHtml += '<form id="template-customize-form">';
            
            template.fields.forEach(function(field, index) {
                customHtml += '<div class="form-group">';
                customHtml += '<label for="field-' + index + '">' + self.escapeHtml(field.label) + '</label>';
                customHtml += '<input type="text" id="field-' + index + '" class="form-control" ';
                customHtml += 'placeholder="' + self.escapeHtml(field.placeholder || '') + '" ';
                customHtml += 'value="' + self.escapeHtml(field.defaultValue || '') + '">';
                customHtml += '</div>';
            });
            
            customHtml += '</form>';
            customHtml += '</div>';
            
            window.Modal.show({
                title: 'Customize Activity',
                content: customHtml,
                buttons: [
                    {
                        text: 'Cancel',
                        className: 'btn-secondary'
                    },
                    {
                        text: 'Add Activity',
                        className: 'btn-primary',
                        onClick: function() {
                            const values = {};
                            template.fields.forEach(function(field, index) {
                                const input = document.getElementById('field-' + index);
                                values[field.name] = input ? input.value : field.defaultValue;
                            });
                            
                            window.Modal.close();
                            self.createActivityFromTemplate(template, values);
                        }
                    }
                ]
            });
        },
        
        /**
         * Create activity from template
         */
        createActivityFromTemplate: function(template, customValues) {
            const self = this;
            
            // Process template with custom values
            let title = template.title;
            let description = template.description;
            
            if (customValues) {
                Object.keys(customValues).forEach(function(key) {
                    const placeholder = '{{' + key + '}}';
                    title = title.replace(placeholder, customValues[key]);
                    description = description.replace(placeholder, customValues[key]);
                });
            }
            
            // Create new activity
            const newActivity = {
                id: 'activity_' + Date.now(),
                title: title,
                description: description,
                icon: template.icon,
                category: template.category,
                type: template.type || 'single-use',
                priority: 'medium',
                completed: false,
                pinned: template.pinned || false,
                tags: template.tags || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Add to recent templates
            self.addToRecent(template.id);
            
            // Dispatch event for activity system to handle
            document.dispatchEvent(new CustomEvent('addActivity', {
                detail: { activity: newActivity }
            }));
            
            // Close modal
            window.Modal.close();
            
            // Show success message
            self.showSuccessMessage('Added "' + title + '" to your day');
        },
        
        /**
         * Add template to recent list
         */
        addToRecent: function(templateId) {
            const self = this;
            
            // Remove if already in list
            const index = self.recentTemplates.indexOf(templateId);
            if (index > -1) {
                self.recentTemplates.splice(index, 1);
            }
            
            // Add to beginning
            self.recentTemplates.unshift(templateId);
            
            // Keep only max recent
            if (self.recentTemplates.length > self.config.maxRecentTemplates) {
                self.recentTemplates = self.recentTemplates.slice(0, self.config.maxRecentTemplates);
            }
            
            self.saveUserPreferences();
        },
        
        /**
         * Handle search with debounce
         */
        handleSearch: function(query) {
            const self = this;
            
            clearTimeout(self.searchDebounceTimer);
            
            self.searchDebounceTimer = setTimeout(function() {
                self.searchQuery = query.trim();
                self.renderTemplates(self.currentCategory);
                
                // Show/hide clear button
                const clearButton = document.getElementById('library-search-clear');
                if (clearButton) {
                    clearButton.style.display = self.searchQuery ? 'block' : 'none';
                }
            }, self.config.searchDebounceDelay);
        },
        
        /**
         * Clear search
         */
        clearSearch: function() {
            const self = this;
            
            self.searchQuery = '';
            const searchInput = document.getElementById('library-search');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            
            const clearButton = document.getElementById('library-search-clear');
            if (clearButton) {
                clearButton.style.display = 'none';
            }
            
            self.renderTemplates(self.currentCategory);
        },
        
        /**
         * Show success message
         */
        showSuccessMessage: function(message) {
            const notification = document.createElement('div');
            notification.className = 'library-success-message';
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
         * Escape HTML for safe display
         */
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }
    };
    
    // Export to global scope
    window.CardLibrary = CardLibrary;
    
})();