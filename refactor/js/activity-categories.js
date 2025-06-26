/**
 * Activity Categories System for StackMap
 * Provides categorization for activities with work/personal/health/etc.
 * Story #116 - Round 8 Dev2
 */

(function() {
    'use strict';
    
    // Category definitions
    const CATEGORIES = {
        work: {
            id: 'work',
            label: 'Work',
            icon: '💼',
            color: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            description: 'Professional tasks and projects'
        },
        personal: {
            id: 'personal',
            label: 'Personal',
            icon: '🏠',
            color: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            description: 'Personal life and household tasks'
        },
        health: {
            id: 'health',
            label: 'Health',
            icon: '🏥',
            color: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            description: 'Health, fitness, and medical activities'
        },
        learning: {
            id: 'learning',
            label: 'Learning',
            icon: '📚',
            color: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            description: 'Education, training, and skill development'
        },
        social: {
            id: 'social',
            label: 'Social',
            icon: '👥',
            color: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            description: 'Social activities and relationships'
        },
        finance: {
            id: 'finance',
            label: 'Finance',
            icon: '💰',
            color: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            description: 'Financial planning and money management'
        },
        creative: {
            id: 'creative',
            label: 'Creative',
            icon: '🎨',
            color: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            description: 'Creative projects and artistic pursuits'
        },
        maintenance: {
            id: 'maintenance',
            label: 'Maintenance',
            icon: '🔧',
            color: '#6b7280',
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            description: 'Maintenance and upkeep tasks'
        },
        routines: {
            id: 'routines',
            label: 'Routines',
            icon: '🔄',
            color: '#9c27b0',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            description: 'Daily and weekly routines'
        },
        focus: {
            id: 'focus',
            label: 'Focus',
            icon: '🎯',
            color: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            description: 'Deep work and concentration tasks'
        },
        breaks: {
            id: 'breaks',
            label: 'Breaks',
            icon: '☕',
            color: '#00bcd4',
            backgroundColor: 'rgba(0, 188, 212, 0.1)',
            description: 'Rest and recovery activities'
        },
        other: {
            id: 'other',
            label: 'Other',
            icon: '📌',
            color: '#6b7280',
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            description: 'Miscellaneous activities'
        }
    };
    
    // Keywords for auto-categorization
    const CATEGORY_KEYWORDS = {
        work: [
            'meeting', 'project', 'deadline', 'presentation', 'report', 'email',
            'call', 'client', 'boss', 'colleague', 'office', 'conference',
            'proposal', 'contract', 'budget', 'schedule', 'business'
        ],
        personal: [
            'family', 'home', 'house', 'clean', 'organize', 'laundry',
            'grocery', 'shopping', 'dinner', 'lunch', 'cook', 'personal',
            'chore', 'errands', 'pets', 'garden', 'maintenance'
        ],
        health: [
            'doctor', 'dentist', 'appointment', 'medicine', 'exercise',
            'workout', 'gym', 'run', 'walk', 'therapy', 'health',
            'medical', 'checkup', 'surgery', 'treatment', 'diet'
        ],
        learning: [
            'study', 'learn', 'course', 'class', 'training', 'research',
            'read', 'book', 'education', 'skill', 'practice', 'tutorial',
            'workshop', 'seminar', 'certification', 'exam'
        ],
        social: [
            'friend', 'family', 'party', 'birthday', 'anniversary',
            'date', 'hangout', 'visit', 'social', 'community',
            'volunteer', 'event', 'gathering', 'celebration'
        ],
        finance: [
            'budget', 'money', 'bank', 'payment', 'bill', 'invoice',
            'tax', 'investment', 'savings', 'financial', 'loan',
            'insurance', 'expense', 'income', 'purchase'
        ],
        creative: [
            'art', 'paint', 'draw', 'write', 'music', 'photo',
            'design', 'craft', 'hobby', 'creative', 'project',
            'blog', 'story', 'poem', 'video', 'edit'
        ],
        maintenance: [
            'fix', 'repair', 'maintenance', 'update', 'backup',
            'clean', 'organize', 'install', 'setup', 'configure',
            'troubleshoot', 'service', 'replace', 'upgrade'
        ],
        routines: [
            'morning', 'evening', 'daily', 'weekly', 'routine',
            'habit', 'schedule', 'regular', 'recurring', 'always',
            'every day', 'wake up', 'bedtime', 'breakfast', 'lunch'
        ],
        focus: [
            'focus', 'concentrate', 'deep work', 'study', 'analyze',
            'research', 'write', 'code', 'design', 'plan',
            'strategy', 'think', 'solve', 'create', 'develop'
        ],
        breaks: [
            'break', 'rest', 'relax', 'pause', 'coffee',
            'tea', 'snack', 'walk', 'stretch', 'breathe',
            'meditate', 'nap', 'recharge', 'refresh'
        ]
    };
    
    const ActivityCategories = {
        isInitialized: false,
        
        /**
         * Initialize the categories system
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Listen for activity creation events to auto-categorize
            document.addEventListener('activityCreated', function(e) {
                if (e.detail && e.detail.activity) {
                    self.autoAssignCategory(e.detail.activity);
                }
            });
            
            self.isInitialized = true;
            console.log('ActivityCategories: Initialized');
        },
        
        /**
         * Get all available categories
         */
        getCategories: function() {
            return Object.values(CATEGORIES);
        },
        
        /**
         * Get category definition by ID
         */
        getCategory: function(categoryId) {
            return CATEGORIES[categoryId] || CATEGORIES.other;
        },
        
        /**
         * Assign category to activity
         */
        assignCategory: function(activity, categoryId) {
            if (!activity) return false;
            
            const category = this.getCategory(categoryId);
            if (!category) return false;
            
            activity.category = categoryId;
            activity.modified = Date.now();
            
            console.log(`ActivityCategories: Assigned category '${categoryId}' to activity '${activity.title}'`);
            
            // Dispatch category assignment event
            document.dispatchEvent(new CustomEvent('activityCategoryAssigned', {
                detail: { 
                    activity: activity, 
                    category: category 
                }
            }));
            
            return true;
        },
        
        /**
         * Auto-assign category based on activity content
         */
        autoAssignCategory: function(activity) {
            if (!activity || activity.category) return; // Skip if already categorized
            
            const suggestedCategory = this.suggestCategory(activity);
            if (suggestedCategory) {
                this.assignCategory(activity, suggestedCategory);
            }
        },
        
        /**
         * Suggest category based on activity content
         */
        suggestCategory: function(activity) {
            if (!activity || !activity.title) return 'other';
            
            const title = activity.title.toLowerCase();
            const description = (activity.description || activity.notes || '').toLowerCase();
            const content = title + ' ' + description;
            
            const scores = {};
            Object.keys(CATEGORY_KEYWORDS).forEach(category => {
                scores[category] = 0;
            });
            
            // Analyze content for category keywords
            Object.keys(CATEGORY_KEYWORDS).forEach(category => {
                CATEGORY_KEYWORDS[category].forEach(keyword => {
                    if (content.includes(keyword)) {
                        scores[category] += 1;
                        // Give title keywords more weight
                        if (title.includes(keyword)) {
                            scores[category] += 0.5;
                        }
                    }
                });
            });
            
            // Find highest scoring category
            let maxScore = 0;
            let suggestedCategory = 'other';
            
            Object.keys(scores).forEach(category => {
                if (scores[category] > maxScore) {
                    maxScore = scores[category];
                    suggestedCategory = category;
                }
            });
            
            // Only suggest if we have confidence (at least 1 keyword match)
            return maxScore >= 1 ? suggestedCategory : 'other';
        },
        
        /**
         * Filter activities by category
         */
        filterByCategory: function(activities, categories) {
            if (!Array.isArray(categories)) {
                categories = [categories];
            }
            
            return activities.filter(activity => {
                return categories.includes(activity.category || 'other');
            });
        },
        
        /**
         * Group activities by category
         */
        groupByCategory: function(activities) {
            const groups = {};
            
            activities.forEach(activity => {
                const categoryId = activity.category || 'other';
                if (!groups[categoryId]) {
                    groups[categoryId] = {
                        category: this.getCategory(categoryId),
                        activities: []
                    };
                }
                groups[categoryId].activities.push(activity);
            });
            
            return groups;
        },
        
        /**
         * Get category statistics
         */
        getCategoryStats: function(activities) {
            const stats = {};
            
            Object.keys(CATEGORIES).forEach(categoryId => {
                stats[categoryId] = {
                    category: CATEGORIES[categoryId],
                    count: 0,
                    completed: 0,
                    percentage: 0
                };
            });
            
            activities.forEach(activity => {
                const categoryId = activity.category || 'other';
                if (stats[categoryId]) {
                    stats[categoryId].count++;
                    if (activity.completed) {
                        stats[categoryId].completed++;
                    }
                }
            });
            
            // Calculate percentages
            const totalActivities = activities.length;
            Object.keys(stats).forEach(categoryId => {
                if (totalActivities > 0) {
                    stats[categoryId].percentage = Math.round((stats[categoryId].count / totalActivities) * 100);
                }
            });
            
            return stats;
        },
        
        /**
         * Show category selector modal
         */
        showCategorySelector: function(activity, callback) {
            const modal = document.createElement('div');
            modal.className = 'category-selector-modal';
            modal.innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Select Category</h3>
                            <button class="modal-close" aria-label="Close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="category-grid">
                                ${this.renderCategoryOptions(activity.category)}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-cancel">Cancel</button>
                            <button class="btn btn-primary" disabled>Apply</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            let selectedCategory = activity.category;
            
            // Setup event listeners
            const closeButton = modal.querySelector('.modal-close');
            const cancelButton = modal.querySelector('.btn-cancel');
            const applyButton = modal.querySelector('.btn-primary');
            
            const closeModal = function() {
                document.body.removeChild(modal);
            };
            
            closeButton.addEventListener('click', closeModal);
            cancelButton.addEventListener('click', closeModal);
            
            // Category selection
            modal.querySelectorAll('.category-option').forEach(option => {
                option.addEventListener('click', function() {
                    // Remove previous selection
                    modal.querySelectorAll('.category-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // Select current option
                    this.classList.add('selected');
                    selectedCategory = this.dataset.categoryId;
                    applyButton.disabled = false;
                });
            });
            
            applyButton.addEventListener('click', function() {
                if (selectedCategory) {
                    closeModal();
                    if (callback) callback(selectedCategory);
                }
            });
        },
        
        /**
         * Render category options
         */
        renderCategoryOptions: function(currentCategory) {
            return Object.values(CATEGORIES).map(category => `
                <div class="category-option ${currentCategory === category.id ? 'selected' : ''}" 
                     data-category-id="${category.id}">
                    <div class="category-icon">${category.icon}</div>
                    <div class="category-label">${category.label}</div>
                    <div class="category-description">${category.description}</div>
                </div>
            `).join('');
        },
        
        /**
         * Create category indicator element
         */
        createCategoryIndicator: function(activity) {
            const categoryId = activity.category || 'other';
            const category = this.getCategory(categoryId);
            
            const indicator = document.createElement('span');
            indicator.className = `category-indicator category-${categoryId}`;
            indicator.innerHTML = `${category.icon} ${category.label}`;
            indicator.title = category.description;
            
            return indicator;
        },
        
        /**
         * Get category icon
         */
        getCategoryIcon: function(categoryId) {
            const category = this.getCategory(categoryId);
            return category.icon;
        },
        
        /**
         * Get category color
         */
        getCategoryColor: function(categoryId) {
            const category = this.getCategory(categoryId);
            return category.color;
        },
        
        /**
         * Get category background color
         */
        getCategoryBackgroundColor: function(categoryId) {
            const category = this.getCategory(categoryId);
            return category.backgroundColor;
        },
        
        /**
         * Bulk assign category to multiple activities
         */
        bulkAssignCategory: function(activityIds, categoryId) {
            const self = this;
            let successCount = 0;
            let failureCount = 0;
            
            activityIds.forEach(activityId => {
                try {
                    // Get activity from ActivityDisplay
                    const activity = this.getActivityById(activityId);
                    if (activity) {
                        self.assignCategory(activity, categoryId);
                        successCount++;
                    } else {
                        failureCount++;
                    }
                } catch (error) {
                    console.error(`ActivityCategories.bulkAssignCategory: Error assigning category to ${activityId}:`, error);
                    failureCount++;
                }
            });
            
            console.log(`ActivityCategories: Bulk assigned category ${categoryId} to ${successCount} activities (${failureCount} failures)`);
            
            // Dispatch bulk assignment event
            document.dispatchEvent(new CustomEvent('bulkCategoryAssigned', {
                detail: { 
                    categoryId: categoryId, 
                    successCount: successCount, 
                    failureCount: failureCount,
                    activityIds: activityIds
                }
            }));
            
            return { successCount, failureCount };
        },
        
        /**
         * Get activity by ID (helper)
         */
        getActivityById: function(activityId) {
            if (window.ActivityDisplay && window.ActivityDisplay.getActivityById) {
                return window.ActivityDisplay.getActivityById(activityId);
            } else if (window.ActivityDisplay && window.ActivityDisplay.activities) {
                return window.ActivityDisplay.activities.find(a => a.id === activityId);
            }
            return null;
        }
    };
    
    // Export to global scope
    window.ActivityCategories = ActivityCategories;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            ActivityCategories.init();
        });
    } else {
        ActivityCategories.init();
    }
    
})();