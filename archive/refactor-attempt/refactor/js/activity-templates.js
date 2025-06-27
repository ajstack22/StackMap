/**
 * Activity Templates & Quick Add for StackMap
 * Mobile-first quick access templates for rapid activity creation
 * ADHD-optimized with minimal typing, visual design, and time-based suggestions
 */

(function() {
    'use strict';
    
    const ActivityTemplates = {
        isInitialized: false,
        container: null,
        searchTimer: null,
        recentActivities: [],
        currentView: 'templates', // 'templates', 'search', 'recent'
        
        // Time-based categories
        TIME_CATEGORIES: {
            MORNING: { start: 5, end: 10, label: 'Morning', icon: '🌅' },
            MIDDAY: { start: 10, end: 14, label: 'Midday', icon: '☀️' },
            AFTERNOON: { start: 14, end: 18, label: 'Afternoon', icon: '🌤️' },
            EVENING: { start: 18, end: 21, label: 'Evening', icon: '🌙' },
            NIGHT: { start: 21, end: 5, label: 'Night', icon: '🌌' }
        },
        
        /**
         * Initialize the template system
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Load recent activities from storage
            self.loadRecentActivities();
            
            self.isInitialized = true;
            console.log('ActivityTemplates: Initialized');
        },
        
        /**
         * Show quick add template modal
         */
        show: function() {
            const self = this;
            
            if (!self.isInitialized) {
                self.init();
            }
            
            if (!window.Modal) {
                console.error('ActivityTemplates: Modal system not found');
                return;
            }
            
            // Build modal content
            const content = self.buildTemplateUI();
            
            // Show modal
            window.Modal.show({
                title: 'Quick Add Activity',
                content: content,
                className: 'activity-templates-modal',
                closeOnBackdrop: true,
                showCloseButton: true,
                onClose: function() {
                    // Clear search on close
                    self.searchTimer = null;
                }
            });
            
            // Setup event handlers after modal is shown
            setTimeout(function() {
                self.setupEventHandlers();
                self.showTemplateView();
            }, 100);
        },
        
        /**
         * Build the template UI structure
         */
        buildTemplateUI: function() {
            const self = this;
            
            let html = '<div class="activity-templates-container">';
            
            // View switcher tabs
            html += '<div class="template-tabs">';
            html += '<button type="button" class="template-tab active" data-view="templates">';
            html += '<span class="tab-icon">⚡</span>';
            html += '<span class="tab-label">Quick Add</span>';
            html += '</button>';
            html += '<button type="button" class="template-tab" data-view="recent">';
            html += '<span class="tab-icon">🕐</span>';
            html += '<span class="tab-label">Recent</span>';
            html += '</button>';
            html += '<button type="button" class="template-tab" data-view="search">';
            html += '<span class="tab-icon">🔍</span>';
            html += '<span class="tab-label">Search</span>';
            html += '</button>';
            html += '</div>';
            
            // Search bar (hidden by default)
            html += '<div id="template-search-container" class="template-search-container" style="display: none;">';
            html += '<input type="text" id="template-search" class="template-search" placeholder="Type to search activities..." autocomplete="off">';
            html += '<button type="button" id="template-search-clear" class="template-search-clear" aria-label="Clear search">×</button>';
            html += '</div>';
            
            // Content area
            html += '<div id="template-content" class="template-content">';
            html += '<div class="template-loading">Loading templates...</div>';
            html += '</div>';
            
            html += '</div>';
            
            return html;
        },
        
        /**
         * Setup event handlers
         */
        setupEventHandlers: function() {
            const self = this;
            
            // Tab switching
            const tabs = document.querySelectorAll('.template-tab');
            tabs.forEach(function(tab) {
                tab.addEventListener('click', function() {
                    const view = this.getAttribute('data-view');
                    self.switchView(view);
                });
            });
            
            // Search input
            const searchInput = document.getElementById('template-search');
            if (searchInput) {
                searchInput.addEventListener('input', function(e) {
                    self.handleSearch(e.target.value);
                });
                
                // Focus search when search tab is clicked
                searchInput.addEventListener('focus', function() {
                    this.select();
                });
            }
            
            // Search clear button
            const clearButton = document.getElementById('template-search-clear');
            if (clearButton) {
                clearButton.addEventListener('click', function() {
                    self.clearSearch();
                });
            }
        },
        
        /**
         * Switch between views
         */
        switchView: function(view) {
            const self = this;
            
            self.currentView = view;
            
            // Update tab states
            const tabs = document.querySelectorAll('.template-tab');
            tabs.forEach(function(tab) {
                if (tab.getAttribute('data-view') === view) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            
            // Show/hide search bar
            const searchContainer = document.getElementById('template-search-container');
            const searchInput = document.getElementById('template-search');
            
            if (view === 'search') {
                searchContainer.style.display = 'block';
                // Focus search input with slight delay for animation
                setTimeout(function() {
                    searchInput.focus();
                }, 100);
            } else {
                searchContainer.style.display = 'none';
                self.clearSearch();
            }
            
            // Show appropriate content
            switch (view) {
                case 'templates':
                    self.showTemplateView();
                    break;
                case 'recent':
                    self.showRecentView();
                    break;
                case 'search':
                    self.showSearchView();
                    break;
            }
        },
        
        /**
         * Show template grid view
         */
        showTemplateView: function() {
            const self = this;
            const container = document.getElementById('template-content');
            if (!container) return;
            
            // Get current time category
            const timeCategory = self.getCurrentTimeCategory();
            const suggestions = self.getTimeSuggestions(timeCategory);
            
            let html = '';
            
            // Time-based suggestions section
            if (suggestions.length > 0) {
                html += '<div class="template-section">';
                html += `<h3 class="template-section-title">${timeCategory.icon} ${timeCategory.label} Suggestions</h3>`;
                html += '<div class="template-grid">';
                
                suggestions.forEach(function(activity) {
                    html += self.createTemplateCard(activity);
                });
                
                html += '</div>';
                html += '</div>';
            }
            
            // Popular templates section
            html += '<div class="template-section">';
            html += '<h3 class="template-section-title">⭐ Popular Activities</h3>';
            html += '<div class="template-grid">';
            
            const popularTemplates = self.getPopularTemplates();
            popularTemplates.forEach(function(activity) {
                html += self.createTemplateCard(activity);
            });
            
            html += '</div>';
            html += '</div>';
            
            // Browse by category button
            html += '<div class="template-browse-section">';
            html += '<button type="button" class="template-browse-btn" id="browse-all-btn">';
            html += '📚 Browse All Activities';
            html += '</button>';
            html += '</div>';
            
            container.innerHTML = html;
            
            // Add click handlers
            self.attachTemplateHandlers();
            
            // Browse all button
            const browseBtn = document.getElementById('browse-all-btn');
            if (browseBtn) {
                browseBtn.addEventListener('click', function() {
                    // Close this modal and open activity library
                    window.Modal.close();
                    if (window.ActivityLibrary) {
                        window.ActivityLibrary.show();
                    }
                });
            }
        },
        
        /**
         * Show recent activities view
         */
        showRecentView: function() {
            const self = this;
            const container = document.getElementById('template-content');
            if (!container) return;
            
            let html = '';
            
            if (self.recentActivities.length === 0) {
                html += '<div class="template-empty">';
                html += '<div class="template-empty-icon">🕐</div>';
                html += '<div class="template-empty-text">No recent activities yet</div>';
                html += '<div class="template-empty-hint">Your recently used activities will appear here</div>';
                html += '</div>';
            } else {
                html += '<div class="template-section">';
                html += '<div class="template-list">';
                
                self.recentActivities.forEach(function(activity) {
                    html += self.createRecentCard(activity);
                });
                
                html += '</div>';
                html += '</div>';
            }
            
            container.innerHTML = html;
            
            // Add click handlers
            self.attachTemplateHandlers();
        },
        
        /**
         * Show search view
         */
        showSearchView: function(results) {
            const self = this;
            const container = document.getElementById('template-content');
            if (!container) return;
            
            let html = '';
            
            if (!results) {
                // Initial search view
                html += '<div class="template-search-hint">';
                html += '<div class="template-search-icon">🔍</div>';
                html += '<div class="template-search-text">Start typing to search activities</div>';
                html += '</div>';
            } else if (results.length === 0) {
                // No results
                html += '<div class="template-empty">';
                html += '<div class="template-empty-icon">😕</div>';
                html += '<div class="template-empty-text">No activities found</div>';
                html += '<div class="template-empty-hint">Try a different search term</div>';
                html += '</div>';
            } else {
                // Show results
                html += '<div class="template-section">';
                html += '<div class="template-search-results">';
                
                results.forEach(function(activity) {
                    html += self.createSearchResultCard(activity);
                });
                
                html += '</div>';
                html += '</div>';
            }
            
            container.innerHTML = html;
            
            // Add click handlers
            self.attachTemplateHandlers();
        },
        
        /**
         * Create template card HTML
         */
        createTemplateCard: function(activity) {
            const self = this;
            
            let html = '<button type="button" class="template-card" data-activity="' + self.escapeHtml(JSON.stringify(activity)) + '">';
            html += '<div class="template-card-icon">' + (activity.icon || '✓') + '</div>';
            html += '<div class="template-card-title">' + self.escapeHtml(activity.title) + '</div>';
            html += '</button>';
            
            return html;
        },
        
        /**
         * Create recent activity card HTML
         */
        createRecentCard: function(activity) {
            const self = this;
            
            let html = '<button type="button" class="template-recent-card" data-activity="' + self.escapeHtml(JSON.stringify(activity)) + '">';
            html += '<div class="template-recent-icon">' + (activity.icon || '✓') + '</div>';
            html += '<div class="template-recent-content">';
            html += '<div class="template-recent-title">' + self.escapeHtml(activity.title) + '</div>';
            if (activity.lastUsed) {
                html += '<div class="template-recent-time">' + self.formatRelativeTime(activity.lastUsed) + '</div>';
            }
            html += '</div>';
            html += '<div class="template-recent-add">+</div>';
            html += '</button>';
            
            return html;
        },
        
        /**
         * Create search result card HTML
         */
        createSearchResultCard: function(activity) {
            const self = this;
            
            let html = '<button type="button" class="template-search-result" data-activity="' + self.escapeHtml(JSON.stringify(activity)) + '">';
            html += '<div class="template-search-icon">' + (activity.icon || '✓') + '</div>';
            html += '<div class="template-search-content">';
            html += '<div class="template-search-title">' + self.escapeHtml(activity.title) + '</div>';
            if (activity.category) {
                html += '<div class="template-search-category">' + activity.category + '</div>';
            }
            html += '</div>';
            html += '<div class="template-search-add">+</div>';
            html += '</button>';
            
            return html;
        },
        
        /**
         * Attach click handlers to template cards
         */
        attachTemplateHandlers: function() {
            const self = this;
            
            // Template cards
            const cards = document.querySelectorAll('.template-card, .template-recent-card, .template-search-result');
            cards.forEach(function(card) {
                card.addEventListener('click', function() {
                    const activityData = this.getAttribute('data-activity');
                    if (activityData) {
                        try {
                            const activity = JSON.parse(activityData);
                            self.addActivity(activity);
                        } catch (e) {
                            console.error('Failed to parse activity data:', e);
                        }
                    }
                });
            });
        },
        
        /**
         * Get current time category
         */
        getCurrentTimeCategory: function() {
            const hour = new Date().getHours();
            
            for (const key in this.TIME_CATEGORIES) {
                const category = this.TIME_CATEGORIES[key];
                if (category.start <= category.end) {
                    // Normal range (e.g., 5-10)
                    if (hour >= category.start && hour < category.end) {
                        return category;
                    }
                } else {
                    // Overnight range (e.g., 21-5)
                    if (hour >= category.start || hour < category.end) {
                        return category;
                    }
                }
            }
            
            return this.TIME_CATEGORIES.MIDDAY; // Default
        },
        
        /**
         * Get time-based activity suggestions
         */
        getTimeSuggestions: function(timeCategory) {
            const suggestions = [];
            
            // Map time categories to activity patterns
            const timeMappings = {
                'Morning': ['wake', 'breakfast', 'brush', 'dressed', 'morning', 'shower'],
                'Midday': ['lunch', 'school', 'homework', 'play', 'snack'],
                'Afternoon': ['snack', 'homework', 'play', 'exercise', 'therapy'],
                'Evening': ['dinner', 'bath', 'quiet', 'family'],
                'Night': ['pajama', 'brush', 'story', 'bedtime', 'sleep']
            };
            
            const patterns = timeMappings[timeCategory.label] || [];
            
            // Get activities from default activities that match patterns
            if (window.StackMapDefaultActivities) {
                const allActivities = window.StackMapDefaultActivities.getAllActivities();
                
                patterns.forEach(function(pattern) {
                    allActivities.forEach(function(activity) {
                        if (suggestions.length < 6) { // Limit to 6 suggestions
                            const titleLower = activity.title.toLowerCase();
                            const descLower = (activity.description || '').toLowerCase();
                            if (titleLower.includes(pattern) || descLower.includes(pattern)) {
                                // Check if not already in suggestions
                                const exists = suggestions.some(function(s) {
                                    return s.title === activity.title;
                                });
                                if (!exists) {
                                    suggestions.push(activity);
                                }
                            }
                        }
                    });
                });
            }
            
            return suggestions;
        },
        
        /**
         * Get popular templates
         */
        getPopularTemplates: function() {
            const templates = [];
            
            // Define popular quick-add templates
            const popularList = [
                { icon: '🦷', title: 'Brush Teeth', category: 'Daily Care' },
                { icon: '🍎', title: 'Snack Time', category: 'Meals' },
                { icon: '🧘', title: 'Quiet Time', category: 'Calming' },
                { icon: '🎮', title: 'Play Time', category: 'Play' },
                { icon: '📚', title: 'Homework', category: 'School' },
                { icon: '🛏️', title: 'Bedtime', category: 'Daily Care' },
                { icon: '💊', title: 'Medicine', category: 'Health' },
                { icon: '🚿', title: 'Shower', category: 'Daily Care' },
                { icon: '🧹', title: 'Clean Up', category: 'Chores' }
            ];
            
            // Return a subset for the grid
            return popularList.slice(0, 9);
        },
        
        /**
         * Handle search with debounce
         */
        handleSearch: function(query) {
            const self = this;
            
            // Clear existing timer
            if (self.searchTimer) {
                clearTimeout(self.searchTimer);
            }
            
            // Show/hide clear button
            const clearButton = document.getElementById('template-search-clear');
            if (clearButton) {
                clearButton.style.display = query ? 'block' : 'none';
            }
            
            // Debounce search
            self.searchTimer = setTimeout(function() {
                const results = self.searchActivities(query.trim());
                self.showSearchView(results);
            }, 300);
        },
        
        /**
         * Search activities
         */
        searchActivities: function(query) {
            if (!query) return null;
            
            const results = [];
            const queryLower = query.toLowerCase();
            
            // Search in default activities
            if (window.StackMapDefaultActivities) {
                const allActivities = window.StackMapDefaultActivities.getAllActivities();
                
                allActivities.forEach(function(activity) {
                    const titleLower = (activity.title || '').toLowerCase();
                    const descLower = (activity.description || '').toLowerCase();
                    const categoryLower = (activity.category || '').toLowerCase();
                    
                    if (titleLower.includes(queryLower) || 
                        descLower.includes(queryLower) || 
                        categoryLower.includes(queryLower)) {
                        results.push(activity);
                    }
                });
            }
            
            // Limit results for performance
            return results.slice(0, 20);
        },
        
        /**
         * Clear search
         */
        clearSearch: function() {
            const searchInput = document.getElementById('template-search');
            const clearButton = document.getElementById('template-search-clear');
            
            if (searchInput) {
                searchInput.value = '';
            }
            
            if (clearButton) {
                clearButton.style.display = 'none';
            }
            
            // Show initial search view
            this.showSearchView();
        },
        
        /**
         * Add activity from template
         */
        addActivity: function(template) {
            const self = this;
            
            // Check if in edit mode
            if (!window.EditMode || !window.EditMode.isActive()) {
                alert('Please enable edit mode to add activities');
                return;
            }
            
            // Check if TaskDisplay is available
            if (!window.TaskDisplay) {
                console.error('ActivityTemplates: TaskDisplay not found');
                return;
            }
            
            // Get selected day from DaySelector
            let selectedDay = 'today';
            if (window.DaySelector && window.DaySelector.isReady()) {
                selectedDay = window.DaySelector.getCurrentDay();
            }
            
            // Create new activity from template
            const newActivity = {
                id: `task_${Date.now()}`,
                title: template.title,
                description: template.description || '',
                icon: template.icon || '✓',
                category: template.category || '',
                priority: 'medium',
                completed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                user_id: null,
                due_date: null,
                reminder: null,
                tags: [],
                order: Date.now(),
                timeframe: selectedDay,
                day: selectedDay // Ensure compatibility with both field names
            };
            
            // Get current user if available
            if (window.UserManager) {
                const currentUser = window.UserManager.getCurrentUser();
                if (currentUser) {
                    newActivity.user_id = currentUser.id;
                }
            }
            
            // Add to tasks
            window.TaskDisplay.tasks.unshift(newActivity);
            window.TaskDisplay.saveTasks();
            window.TaskDisplay.render();
            
            // Add to recent activities
            self.addToRecent(template);
            
            // Close modal
            window.Modal.close();
            
            // Show success message
            self.showSuccessMessage(`Added "${template.title}" to your activities`);
        },
        
        /**
         * Add activity to recent list
         */
        addToRecent: function(activity) {
            const self = this;
            
            // Remove if already exists
            self.recentActivities = self.recentActivities.filter(function(a) {
                return a.title !== activity.title;
            });
            
            // Add to beginning with timestamp
            self.recentActivities.unshift({
                ...activity,
                lastUsed: new Date().toISOString()
            });
            
            // Keep only last 10
            self.recentActivities = self.recentActivities.slice(0, 10);
            
            // Save to storage
            self.saveRecentActivities();
        },
        
        /**
         * Load recent activities from storage
         */
        loadRecentActivities: function() {
            try {
                const stored = localStorage.getItem('stackmap_recent_activities');
                this.recentActivities = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.warn('Failed to load recent activities:', e);
                this.recentActivities = [];
            }
        },
        
        /**
         * Save recent activities to storage
         */
        saveRecentActivities: function() {
            try {
                localStorage.setItem('stackmap_recent_activities', JSON.stringify(this.recentActivities));
            } catch (e) {
                console.warn('Failed to save recent activities:', e);
            }
        },
        
        /**
         * Format relative time
         */
        formatRelativeTime: function(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return diffMins + ' min ago';
            if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
            if (diffDays < 7) return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
            
            return date.toLocaleDateString();
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
    window.ActivityTemplates = ActivityTemplates;
    
})();