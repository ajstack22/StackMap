/**
 * Activity Types System for StackMap
 * Provides sophisticated activity categorization with recurring, frequent, and single-use types
 * Mobile-first design with ADHD/autism accommodations
 */

(function() {
    'use strict';
    
    // Type definitions with behaviors and visual properties
    const ACTIVITY_TYPES = {
        recurring: {
            id: 'recurring',
            icon: '↻',
            label: 'Recurring',
            description: 'Daily/weekly routines',
            color: '#8b5cf6', // Purple-500
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            defaultPinned: true,
            autoSuggest: true,
            behaviors: ['carryOver', 'autoPin', 'suggestTomorrow'],
            priority: 1 // Higher priority for default assignment
        },
        frequent: {
            id: 'frequent',
            icon: '⭐',
            label: 'Frequent',
            description: 'Often-used activities',
            color: '#7c3aed', // Purple-600
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            defaultPinned: false,
            trackUsage: true,
            behaviors: ['trackUsage', 'suggestBasedOnPattern'],
            priority: 2
        },
        singleUse: {
            id: 'single-use',
            icon: '📅',
            label: 'Single-use',
            description: 'One-time activities',
            color: '#6d28d9', // Purple-700
            backgroundColor: 'rgba(109, 40, 217, 0.1)',
            defaultPinned: false,
            archiveOnComplete: true,
            behaviors: ['archiveOnComplete', 'neverAutoPin'],
            priority: 3
        }
    };
    
    // Keywords that suggest specific activity types
    const TYPE_KEYWORDS = {
        recurring: [
            'daily', 'every day', 'routine', 'habit', 'morning', 'evening',
            'wake up', 'brush', 'shower', 'breakfast', 'lunch', 'dinner',
            'exercise', 'workout', 'walk', 'meditation', 'prayer',
            'weekly', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
            'weekend', 'always', 'recurring', 'repeat'
        ],
        frequent: [
            'often', 'usually', 'frequently', 'regular', 'common',
            'meeting', 'check', 'review', 'call', 'email', 'practice',
            'study', 'work on', 'update', 'clean', 'organize'
        ],
        singleUse: [
            'appointment', 'doctor', 'dentist', 'meeting with', 'birthday',
            'event', 'party', 'deadline', 'due', 'submit', 'pay',
            'buy', 'purchase', 'book', 'schedule', 'cancel', 'once',
            'today only', 'tomorrow only', 'specific'
        ]
    };
    
    const ActivityTypes = {
        isInitialized: false,
        
        /**
         * Initialize the activity types system
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Listen for activity creation events
            document.addEventListener('activityCreated', function(e) {
                if (e.detail && e.detail.activity) {
                    self.autoAssignType(e.detail.activity);
                }
            });
            
            // Listen for activity updates
            document.addEventListener('activityUpdated', function(e) {
                if (e.detail && e.detail.activity) {
                    self.updateTypeUsage(e.detail.activity);
                }
            });
            
            // Listen for activity completion
            document.addEventListener('activityCompleted', function(e) {
                if (e.detail && e.detail.activity) {
                    self.handleTypeSpecificCompletion(e.detail.activity);
                }
            });
            
            self.isInitialized = true;
            console.log('ActivityTypes: Initialized');
        },
        
        /**
         * Get type definition by ID
         */
        getTypeDefinition: function(typeId) {
            return ACTIVITY_TYPES[typeId] || ACTIVITY_TYPES.frequent; // Default to frequent
        },
        
        /**
         * Get all available types
         */
        getAllTypes: function() {
            return Object.values(ACTIVITY_TYPES);
        },
        
        /**
         * Assign type to an activity
         */
        assignType: function(activity, typeId, confidence, assignedBy) {
            if (!activity || !typeId) return false;
            
            const typeDef = this.getTypeDefinition(typeId);
            if (!typeDef) return false;
            
            // Initialize type object if it doesn't exist
            if (!activity.type) {
                activity.type = {};
            }
            
            // Update type information
            activity.type.category = typeId;
            activity.type.assignedAt = new Date().toISOString();
            activity.type.confidence = confidence || 1.0;
            activity.type.assignedBy = assignedBy || 'user';
            activity.type.lastUsed = null;
            activity.type.usageCount = activity.type.usageCount || 0;
            activity.type.patternScore = 0;
            
            // Apply type-specific defaults
            if (typeDef.defaultPinned && activity.pinned === undefined) {
                activity.pinned = true;
            }
            
            // Update activity timestamp
            activity.updated_at = new Date().toISOString();
            
            console.log(`ActivityTypes: Assigned type '${typeId}' to activity '${activity.title}'`);
            
            // Dispatch type assignment event
            document.dispatchEvent(new CustomEvent('activityTypeAssigned', {
                detail: { activity: activity, type: typeDef }
            }));
            
            return true;
        },
        
        /**
         * Auto-assign type based on activity content and patterns
         */
        autoAssignType: function(activity) {
            if (!activity) return;
            
            // Skip if type already assigned by user
            if (activity.type && activity.type.assignedBy === 'user') return;
            
            const suggestedType = this.suggestType(activity);
            if (suggestedType) {
                this.assignType(activity, suggestedType.type, suggestedType.confidence, 'auto');
            }
        },
        
        /**
         * Suggest activity type based on content analysis
         */
        suggestType: function(activity) {
            if (!activity || !activity.title) return null;
            
            const title = activity.title.toLowerCase();
            const description = (activity.description || activity.notes || '').toLowerCase();
            const content = title + ' ' + description;
            
            const scores = {
                recurring: 0,
                frequent: 0,
                singleUse: 0
            };
            
            // Analyze content for type keywords
            Object.keys(TYPE_KEYWORDS).forEach(function(type) {
                TYPE_KEYWORDS[type].forEach(function(keyword) {
                    if (content.includes(keyword)) {
                        scores[type] += 1;
                        // Give title keywords more weight
                        if (title.includes(keyword)) {
                            scores[type] += 0.5;
                        }
                    }
                });
            });
            
            // Check for time-based patterns
            if (this.hasTimePattern(content)) {
                scores.recurring += 2;
            }
            
            // Check for deadline indicators
            if (this.hasDeadlinePattern(content)) {
                scores.singleUse += 2;
            }
            
            // Check for frequency indicators
            if (this.hasFrequencyPattern(content)) {
                scores.frequent += 1;
            }
            
            // Find highest scoring type
            let maxScore = 0;
            let suggestedType = 'frequent'; // Default
            
            Object.keys(scores).forEach(function(type) {
                if (scores[type] > maxScore) {
                    maxScore = scores[type];
                    suggestedType = type;
                }
            });
            
            // Convert singleUse to single-use for consistency
            if (suggestedType === 'singleUse') {
                suggestedType = 'single-use';
            }
            
            // Calculate confidence based on score strength
            const confidence = Math.min(maxScore / 3, 1.0); // Max confidence at 3+ keyword matches
            
            return {
                type: suggestedType,
                confidence: confidence,
                scores: scores
            };
        },
        
        /**
         * Check for time-based patterns (recurring indicators)
         */
        hasTimePattern: function(content) {
            const timePatterns = [
                /\bevery\s+(day|morning|evening|week|month)/,
                /\bdaily\b/,
                /\bweekly\b/,
                /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/,
                /\b\d+\s*(am|pm)\b/,
                /\broutine\b/,
                /\bhabit\b/
            ];
            
            return timePatterns.some(function(pattern) {
                return pattern.test(content);
            });
        },
        
        /**
         * Check for deadline patterns (single-use indicators)
         */
        hasDeadlinePattern: function(content) {
            const deadlinePatterns = [
                /\bdue\b/,
                /\bdeadline\b/,
                /\bby\s+\w+day\b/,
                /\bappointment\b/,
                /\bevent\b/,
                /\bmeet\s+with\b/,
                /\bonce\b/,
                /\btoday\s+only\b/,
                /\btomorrow\s+only\b/
            ];
            
            return deadlinePatterns.some(function(pattern) {
                return pattern.test(content);
            });
        },
        
        /**
         * Check for frequency patterns
         */
        hasFrequencyPattern: function(content) {
            const frequencyPatterns = [
                /\boften\b/,
                /\busually\b/,
                /\bfrequently\b/,
                /\bregular\b/,
                /\bsometimes\b/,
                /\boccasionally\b/
            ];
            
            return frequencyPatterns.some(function(pattern) {
                return pattern.test(content);
            });
        },
        
        /**
         * Update usage tracking for frequent activities
         */
        updateTypeUsage: function(activity) {
            if (!activity || !activity.type) return;
            
            const typeDef = this.getTypeDefinition(activity.type.category);
            if (typeDef.trackUsage) {
                activity.type.lastUsed = new Date().toISOString();
                activity.type.usageCount = (activity.type.usageCount || 0) + 1;
                
                // Update pattern score based on usage frequency
                const daysSinceCreated = this.getDaysSince(activity.created_at || activity.created);
                if (daysSinceCreated > 0) {
                    activity.type.patternScore = Math.min(activity.type.usageCount / daysSinceCreated, 1.0);
                }
            }
        },
        
        /**
         * Handle type-specific completion behaviors
         */
        handleTypeSpecificCompletion: function(activity) {
            if (!activity || !activity.type) return;
            
            const typeDef = this.getTypeDefinition(activity.type.category);
            
            // Handle single-use archiving
            if (typeDef.archiveOnComplete) {
                this.archiveActivity(activity);
            }
            
            // Handle recurring activity suggestions
            if (typeDef.autoSuggest) {
                this.suggestRecurringActivity(activity);
            }
            
            // Update usage patterns
            this.updateTypeUsage(activity);
        },
        
        /**
         * Archive completed single-use activity
         */
        archiveActivity: function(activity) {
            activity.status = 'archived';
            activity.archivedAt = new Date().toISOString();
            
            console.log(`ActivityTypes: Archived single-use activity '${activity.title}'`);
            
            // Dispatch archival event
            document.dispatchEvent(new CustomEvent('activityArchived', {
                detail: { activity: activity }
            }));
        },
        
        /**
         * Suggest recurring activity for tomorrow
         */
        suggestRecurringActivity: function(activity) {
            if (!activity || activity.timeframe !== 'today') return;
            
            // Check if already exists for tomorrow
            const existingTomorrow = this.findTomorrowActivity(activity);
            if (existingTomorrow) return;
            
            // Create suggestion for tomorrow
            const suggestion = {
                originalActivity: activity,
                suggestedFor: 'tomorrow',
                confidence: 0.9,
                reason: 'recurring_activity_completed'
            };
            
            console.log(`ActivityTypes: Suggesting recurring activity '${activity.title}' for tomorrow`);
            
            // Dispatch suggestion event
            document.dispatchEvent(new CustomEvent('activitySuggested', {
                detail: suggestion
            }));
        },
        
        /**
         * Find matching activity in tomorrow's timeframe
         */
        findTomorrowActivity: function(activity) {
            const activities = this.getAllActivities();
            if (!activities) return null;
            
            return activities.find(function(a) {
                return a.timeframe === 'tomorrow' && 
                       a.title === activity.title &&
                       a.id !== activity.id;
            });
        },
        
        /**
         * Get all activities from the current system
         */
        getAllActivities: function() {
            if (window.ActivityDisplay && window.ActivityDisplay.getActivities) {
                return window.ActivityDisplay.getActivities();
            } else if (window.TaskDisplay && window.TaskDisplay.getTasks) {
                return window.TaskDisplay.getTasks();
            }
            return [];
        },
        
        /**
         * Filter activities by type
         */
        filterByType: function(activities, typeFilter) {
            if (!activities || !typeFilter) return activities;
            
            return activities.filter(function(activity) {
                return activity.type && activity.type.category === typeFilter;
            });
        },
        
        /**
         * Get type statistics
         */
        getTypeStatistics: function() {
            const activities = this.getAllActivities();
            if (!activities) return null;
            
            const stats = {
                total: activities.length,
                byType: {
                    recurring: 0,
                    frequent: 0,
                    'single-use': 0,
                    untyped: 0
                },
                averageConfidence: 0,
                autoAssigned: 0,
                userAssigned: 0
            };
            
            let totalConfidence = 0;
            
            activities.forEach(function(activity) {
                if (activity.type && activity.type.category) {
                    stats.byType[activity.type.category]++;
                    totalConfidence += activity.type.confidence || 0;
                    
                    if (activity.type.assignedBy === 'auto') {
                        stats.autoAssigned++;
                    } else {
                        stats.userAssigned++;
                    }
                } else {
                    stats.byType.untyped++;
                }
            });
            
            stats.averageConfidence = stats.total > 0 ? totalConfidence / stats.total : 0;
            
            return stats;
        },
        
        /**
         * Create type indicator element
         */
        createTypeIndicator: function(activity, options) {
            options = options || {};
            
            if (!activity || !activity.type || !activity.type.category) {
                return null;
            }
            
            const typeDef = this.getTypeDefinition(activity.type.category);
            const targetSize = window.StackMapSafeMode ? 60 : 44;
            
            const indicator = document.createElement('button');
            indicator.className = 'activity-type-indicator';
            indicator.setAttribute('data-type', activity.type.category);
            indicator.setAttribute('aria-label', `Activity type: ${typeDef.label} - ${typeDef.description}`);
            indicator.setAttribute('title', `${typeDef.label}: ${typeDef.description}`);
            
            // Set size for touch targets
            indicator.style.width = targetSize + 'px';
            indicator.style.height = targetSize + 'px';
            indicator.style.backgroundColor = typeDef.backgroundColor;
            indicator.style.color = typeDef.color;
            indicator.style.borderColor = typeDef.color;
            
            // Add icon
            const icon = document.createElement('span');
            icon.className = 'activity-type-icon';
            icon.textContent = typeDef.icon;
            icon.setAttribute('aria-hidden', 'true');
            indicator.appendChild(icon);
            
            // Add click handler for type changing (if not readonly)
            if (!options.readonly) {
                indicator.onclick = function(e) {
                    e.stopPropagation();
                    ActivityTypes.showTypeSelector(activity, indicator);
                };
            }
            
            return indicator;
        },
        
        /**
         * Show type selector menu
         */
        showTypeSelector: function(activity, triggerElement) {
            const self = this;
            
            // Remove existing selector
            const existing = document.querySelector('.activity-type-selector');
            if (existing) {
                existing.remove();
            }
            
            const selector = document.createElement('div');
            selector.className = 'activity-type-selector';
            
            // Create type options
            Object.values(ACTIVITY_TYPES).forEach(function(typeDef) {
                const option = document.createElement('button');
                option.className = 'type-selector-option';
                option.setAttribute('data-type', typeDef.id);
                
                if (activity.type && activity.type.category === typeDef.id) {
                    option.classList.add('selected');
                }
                
                option.innerHTML = `<span class="type-option-icon">${typeDef.icon}</span><span class="type-option-label">${typeDef.label}</span>`;
                option.setAttribute('aria-label', `Set type to ${typeDef.label}: ${typeDef.description}`);
                
                option.onclick = function() {
                    self.assignType(activity, typeDef.id, 1.0, 'user');
                    
                    // Update activity display
                    const display = window.ActivityDisplay || window.TaskDisplay;
                    if (display && display.updateActivity) {
                        display.updateActivity(activity);
                    } else if (display && display.updateTask) {
                        display.updateTask(activity);
                    }
                    
                    // Re-render cards to show new type
                    if (display && display.render) {
                        display.render();
                    }
                    
                    selector.remove();
                };
                
                selector.appendChild(option);
            });
            
            // Position selector
            const rect = triggerElement.getBoundingClientRect();
            selector.style.position = 'fixed';
            selector.style.top = (rect.bottom + 5) + 'px';
            selector.style.left = rect.left + 'px';
            selector.style.minWidth = '200px';
            
            document.body.appendChild(selector);
            
            // Close on outside click
            setTimeout(function() {
                document.addEventListener('click', function closeSelector(e) {
                    if (!selector.contains(e.target) && e.target !== triggerElement) {
                        selector.remove();
                        document.removeEventListener('click', closeSelector);
                    }
                });
            }, 0);
        },
        
        /**
         * Migrate existing activities to include types
         */
        migrateExistingActivities: function() {
            const activities = this.getAllActivities();
            if (!activities) return;
            
            let migrated = 0;
            
            activities.forEach(function(activity) {
                if (!activity.type) {
                    const suggestion = ActivityTypes.suggestType(activity);
                    if (suggestion) {
                        ActivityTypes.assignType(activity, suggestion.type, suggestion.confidence, 'auto');
                        migrated++;
                    }
                }
            });
            
            console.log(`ActivityTypes: Migrated ${migrated} activities with auto-assigned types`);
            
            // Dispatch migration complete event
            document.dispatchEvent(new CustomEvent('activityTypesMigrated', {
                detail: { migratedCount: migrated }
            }));
        },
        
        /**
         * Helper: Get days since a date
         */
        getDaysSince: function(dateString) {
            if (!dateString) return 0;
            
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        },
        
        /**
         * Helper: Get type-specific CSS class
         */
        getTypeClass: function(typeId) {
            return `activity-type--${typeId}`;
        },
        
        /**
         * Helper: Get type icon
         */
        getTypeIcon: function(typeId) {
            const typeDef = this.getTypeDefinition(typeId);
            return typeDef ? typeDef.icon : '⭐';
        },
        
        /**
         * Helper: Get type color
         */
        getTypeColor: function(typeId) {
            const typeDef = this.getTypeDefinition(typeId);
            return typeDef ? typeDef.color : '#7c3aed';
        }
    };
    
    // Export to global scope
    window.ActivityTypes = ActivityTypes;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            ActivityTypes.init();
        });
    } else {
        ActivityTypes.init();
    }
    
})();