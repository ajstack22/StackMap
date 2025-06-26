/**
 * Pre-built Activity Templates for StackMap
 * ADHD-friendly activities and routines
 */

(function() {
    'use strict';
    
    const LibraryTemplates = {
        // Template categories with icons
        categories: {
            health: { name: 'Health', icon: '💊', color: '#4CAF50' },
            work: { name: 'Work', icon: '💼', color: '#2196F3' },
            personal: { name: 'Personal', icon: '🏠', color: '#FF9800' },
            routines: { name: 'Routines', icon: '🔄', color: '#9C27B0' },
            focus: { name: 'Focus', icon: '🎯', color: '#F44336' },
            breaks: { name: 'Breaks', icon: '☕', color: '#00BCD4' },
            social: { name: 'Social', icon: '👥', color: '#E91E63' },
            creative: { name: 'Creative', icon: '🎨', color: '#795548' }
        },
        
        // Pre-built templates
        templates: [
            // Health Templates
            {
                id: 'health-meds',
                title: 'Take Medication',
                description: 'Remember to take your medication',
                icon: '💊',
                category: 'Health',
                type: 'recurring',
                tags: ['health', 'daily', 'important'],
                pinned: true,
                fields: []
            },
            {
                id: 'health-water',
                title: 'Drink Water',
                description: 'Stay hydrated - drink a glass of water',
                icon: '💧',
                category: 'Health',
                type: 'frequent',
                tags: ['health', 'hydration', 'self-care'],
                fields: []
            },
            {
                id: 'health-stretch',
                title: '5-Minute Stretch',
                description: 'Quick stretching routine to reduce tension',
                icon: '🧘',
                category: 'Health',
                type: 'frequent',
                tags: ['health', 'movement', 'quick'],
                fields: []
            },
            {
                id: 'health-walk',
                title: 'Take a Walk',
                description: 'Get some fresh air and movement',
                icon: '🚶',
                category: 'Health',
                type: 'single-use',
                tags: ['health', 'exercise', 'outdoor'],
                fields: [
                    { name: 'duration', label: 'Duration', placeholder: 'e.g., 15 minutes', defaultValue: '10 minutes' }
                ]
            },
            {
                id: 'health-meal',
                title: 'Eat a Healthy Meal',
                description: 'Take time for a proper meal',
                icon: '🥗',
                category: 'Health',
                type: 'recurring',
                tags: ['health', 'nutrition', 'self-care'],
                fields: []
            },
            
            // Work Templates
            {
                id: 'work-focus-block',
                title: 'Focus Block',
                description: '25-minute focused work session',
                icon: '⏱️',
                category: 'Work',
                type: 'frequent',
                tags: ['work', 'focus', 'productivity'],
                fields: [
                    { name: 'task', label: 'Task to focus on', placeholder: 'e.g., Write report', defaultValue: '' }
                ]
            },
            {
                id: 'work-email-check',
                title: 'Check Email',
                description: 'Dedicated time to process emails',
                icon: '📧',
                category: 'Work',
                type: 'recurring',
                tags: ['work', 'communication', 'routine'],
                fields: []
            },
            {
                id: 'work-meeting-prep',
                title: 'Meeting Prep',
                description: 'Prepare for upcoming meeting',
                icon: '📋',
                category: 'Work',
                type: 'single-use',
                tags: ['work', 'meeting', 'preparation'],
                fields: [
                    { name: 'meeting', label: 'Meeting name', placeholder: 'e.g., Team standup', defaultValue: '' }
                ]
            },
            {
                id: 'work-task-review',
                title: 'Review Tasks',
                description: 'Review and prioritize today\'s tasks',
                icon: '📝',
                category: 'Work',
                type: 'recurring',
                tags: ['work', 'planning', 'organization'],
                fields: []
            },
            {
                id: 'work-project-time',
                title: 'Project Work',
                description: 'Dedicated time for {{project}}',
                icon: '🎯',
                category: 'Work',
                type: 'single-use',
                tags: ['work', 'project', 'deep-work'],
                fields: [
                    { name: 'project', label: 'Project name', placeholder: 'e.g., Website redesign', defaultValue: 'current project' }
                ]
            },
            
            // Personal Templates
            {
                id: 'personal-tidy',
                title: '10-Minute Tidy',
                description: 'Quick declutter of immediate space',
                icon: '🧹',
                category: 'Personal',
                type: 'frequent',
                tags: ['personal', 'cleaning', 'quick'],
                fields: []
            },
            {
                id: 'personal-call',
                title: 'Call {{person}}',
                description: 'Connect with someone important',
                icon: '📞',
                category: 'Personal',
                type: 'single-use',
                tags: ['personal', 'social', 'connection'],
                fields: [
                    { name: 'person', label: 'Who to call', placeholder: 'e.g., Mom, friend', defaultValue: 'a friend' }
                ]
            },
            {
                id: 'personal-hobby',
                title: 'Hobby Time',
                description: 'Spend time on {{hobby}}',
                icon: '🎨',
                category: 'Personal',
                type: 'single-use',
                tags: ['personal', 'hobby', 'relaxation'],
                fields: [
                    { name: 'hobby', label: 'Your hobby', placeholder: 'e.g., reading, gaming', defaultValue: 'favorite hobby' }
                ]
            },
            {
                id: 'personal-journal',
                title: 'Journal Entry',
                description: 'Write thoughts and reflections',
                icon: '📔',
                category: 'Personal',
                type: 'single-use',
                tags: ['personal', 'reflection', 'mindfulness'],
                fields: []
            },
            
            // Routines Templates
            {
                id: 'routine-morning',
                title: 'Morning Routine',
                description: 'Complete morning essentials',
                icon: '☀️',
                category: 'Routines',
                type: 'recurring',
                tags: ['routine', 'morning', 'daily'],
                pinned: true,
                fields: []
            },
            {
                id: 'routine-evening',
                title: 'Evening Wind-down',
                description: 'Prepare for restful sleep',
                icon: '🌙',
                category: 'Routines',
                type: 'recurring',
                tags: ['routine', 'evening', 'daily'],
                pinned: true,
                fields: []
            },
            {
                id: 'routine-workday-start',
                title: 'Start Workday',
                description: 'Set up for productive work',
                icon: '💻',
                category: 'Routines',
                type: 'recurring',
                tags: ['routine', 'work', 'morning'],
                fields: []
            },
            {
                id: 'routine-workday-end',
                title: 'End Workday',
                description: 'Wrap up work and transition',
                icon: '🏁',
                category: 'Routines',
                type: 'recurring',
                tags: ['routine', 'work', 'evening'],
                fields: []
            },
            
            // Focus Templates
            {
                id: 'focus-brain-dump',
                title: 'Brain Dump',
                description: 'Clear your mind onto paper',
                icon: '🧠',
                category: 'Focus',
                type: 'single-use',
                tags: ['focus', 'adhd', 'clarity'],
                fields: []
            },
            {
                id: 'focus-priority-set',
                title: 'Set Top 3 Priorities',
                description: 'Choose 3 most important tasks',
                icon: '🎯',
                category: 'Focus',
                type: 'recurring',
                tags: ['focus', 'planning', 'priorities'],
                fields: []
            },
            {
                id: 'focus-distraction-list',
                title: 'Distraction List',
                description: 'Write down distracting thoughts',
                icon: '📌',
                category: 'Focus',
                type: 'single-use',
                tags: ['focus', 'adhd', 'productivity'],
                fields: []
            },
            
            // Breaks Templates
            {
                id: 'break-coffee',
                title: 'Coffee Break',
                description: 'Step away and enjoy a beverage',
                icon: '☕',
                category: 'Breaks',
                type: 'frequent',
                tags: ['break', 'rest', 'refresh'],
                fields: []
            },
            {
                id: 'break-breathe',
                title: 'Breathing Exercise',
                description: '3 minutes of deep breathing',
                icon: '🫁',
                category: 'Breaks',
                type: 'frequent',
                tags: ['break', 'mindfulness', 'calm'],
                fields: []
            },
            {
                id: 'break-eyes',
                title: 'Eye Break',
                description: 'Look away from screen for 20 seconds',
                icon: '👁️',
                category: 'Breaks',
                type: 'frequent',
                tags: ['break', 'health', 'quick'],
                fields: []
            },
            {
                id: 'break-dance',
                title: 'Dance Break',
                description: 'Move to your favorite song',
                icon: '💃',
                category: 'Breaks',
                type: 'single-use',
                tags: ['break', 'movement', 'fun'],
                fields: []
            },
            
            // Social Templates
            {
                id: 'social-checkin',
                title: 'Check in with {{person}}',
                description: 'Send a quick message to connect',
                icon: '💬',
                category: 'Social',
                type: 'single-use',
                tags: ['social', 'connection', 'communication'],
                fields: [
                    { name: 'person', label: 'Person to contact', placeholder: 'e.g., friend, family', defaultValue: 'friend' }
                ]
            },
            {
                id: 'social-gratitude',
                title: 'Express Gratitude',
                description: 'Thank someone or appreciate something',
                icon: '🙏',
                category: 'Social',
                type: 'single-use',
                tags: ['social', 'gratitude', 'positivity'],
                fields: []
            },
            
            // Creative Templates
            {
                id: 'creative-doodle',
                title: 'Quick Doodle',
                description: 'Draw or sketch for 5 minutes',
                icon: '✏️',
                category: 'Creative',
                type: 'single-use',
                tags: ['creative', 'art', 'relaxation'],
                fields: []
            },
            {
                id: 'creative-write',
                title: 'Free Writing',
                description: 'Write whatever comes to mind',
                icon: '✍️',
                category: 'Creative',
                type: 'single-use',
                tags: ['creative', 'writing', 'expression'],
                fields: []
            },
            {
                id: 'creative-photo',
                title: 'Take a Photo',
                description: 'Capture something interesting',
                icon: '📸',
                category: 'Creative',
                type: 'single-use',
                tags: ['creative', 'photography', 'observation'],
                fields: []
            }
        ],
        
        /**
         * Get all templates
         */
        getTemplates: function() {
            return this.templates;
        },
        
        /**
         * Get all categories
         */
        getCategories: function() {
            return this.categories;
        },
        
        /**
         * Get templates by category
         */
        getTemplatesByCategory: function(category) {
            return this.templates.filter(function(template) {
                return template.category === category;
            });
        },
        
        /**
         * Get template by ID
         */
        getTemplateById: function(id) {
            return this.templates.find(function(template) {
                return template.id === id;
            });
        },
        
        /**
         * Search templates
         */
        searchTemplates: function(query) {
            const lowerQuery = query.toLowerCase();
            return this.templates.filter(function(template) {
                return template.title.toLowerCase().includes(lowerQuery) ||
                       template.description.toLowerCase().includes(lowerQuery) ||
                       template.tags.some(function(tag) {
                           return tag.toLowerCase().includes(lowerQuery);
                       });
            });
        }
    };
    
    // Export to global scope
    window.LibraryTemplates = LibraryTemplates;
    
})();