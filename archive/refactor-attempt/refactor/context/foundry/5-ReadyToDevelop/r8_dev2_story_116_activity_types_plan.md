# REVISED Implementation Plan: Activity Types & Categories

**Story**: r8_dev2_story_116_activity_types.md
**Team**: 2 (PM2 + Dev2)
**Generated**: 2025-06-26 (REVISED after PM feedback)

## Detailed Code Changes

### File: `/refactor/js/activity-types.js`

#### **Lines 24-47: Replace ACTIVITY_TYPES.frequent with template**
```javascript
// CURRENT (Lines 24-35):
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

// NEW REPLACEMENT:
template: {
    id: 'template',
    icon: '📄',
    label: 'Template',
    description: 'Reusable activity templates',
    color: '#7c3aed', // Purple-600  
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    defaultPinned: false,
    canInstantiate: true,
    trackUsage: true,
    behaviors: ['saveAsTemplate', 'instantiateMultiple', 'trackUsage'],
    priority: 2
},
```

#### **Lines 47-48: Add Project type after single-use**
```javascript
// INSERT AFTER Line 47 (after singleUse definition):
project: {
    id: 'project',
    icon: '📊',
    label: 'Project',
    description: 'Multi-step projects with sub-activities',
    color: '#059669', // Emerald-600
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    defaultPinned: true,
    hasSubActivities: true,
    trackProgress: true,
    behaviors: ['trackProgress', 'manageSubActivities', 'autoPin'],
    priority: 1
}
```

#### **Lines 59-63: Update TYPE_KEYWORDS.frequent to template**
```javascript
// CURRENT (Lines 59-63):
frequent: [
    'often', 'usually', 'frequently', 'regular', 'common',
    'meeting', 'check', 'review', 'call', 'email', 'practice',
    'study', 'work on', 'update', 'clean', 'organize'
],

// NEW REPLACEMENT:
template: [
    'template', 'reuse', 'copy', 'duplicate', 'pattern', 'format',
    'form', 'standard', 'typical', 'usual format', 'same as',
    'like last time', 'repeat format', 'use template'
],
```

#### **Lines 69-70: Add project keywords**
```javascript
// INSERT AFTER Line 69 (after singleUse keywords):
project: [
    'project', 'plan', 'multi-step', 'phase', 'milestone', 'epic',
    'initiative', 'campaign', 'launch', 'build', 'develop',
    'implement', 'create system', 'organize event', 'research study'
]
```

#### **Lines 112: Update default type fallback**
```javascript
// CURRENT (Line 112):
return ACTIVITY_TYPES[typeId] || ACTIVITY_TYPES.frequent; // Default to frequent

// NEW:
return ACTIVITY_TYPES[typeId] || ACTIVITY_TYPES['single-use']; // Default to single-use
```

#### **Lines 188-192: Update suggestType scores object**
```javascript
// CURRENT (Lines 188-192):
const scores = {
    recurring: 0,
    frequent: 0,
    singleUse: 0
};

// NEW:
const scores = {
    recurring: 0,
    template: 0,
    singleUse: 0,
    project: 0
};
```

#### **Lines 224: Update default suggestion**
```javascript
// CURRENT (Line 224):
let suggestedType = 'frequent'; // Default

// NEW:
let suggestedType = 'single-use'; // Default
```

#### **Lines 650: Add new template management functions**
```javascript
// INSERT BEFORE Line 650 (before closing methods):

/**
 * Create template from existing activity
 */
createTemplate: function(activity, templateOptions) {
    if (!activity || !activity.title) {
        throw new Error('ActivityTypes.createTemplate: Invalid activity provided');
    }
    
    const templateId = 'template_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const template = {
        id: templateId,
        title: templateOptions.title || (activity.title + ' Template'),
        description: templateOptions.description || activity.description,
        originalActivityId: activity.id,
        type: { category: 'template' },
        isTemplate: true,
        templateData: {
            placeholders: templateOptions.placeholders || [],
            defaultValues: {
                title: activity.title,
                description: activity.description,
                priority: activity.priority || 'medium',
                estimatedMinutes: activity.estimatedMinutes
            },
            usageCount: 0,
            lastUsed: null,
            category: templateOptions.category || 'general'
        },
        created: Date.now(),
        modified: Date.now()
    };
    
    // Store template in localStorage
    this.storeTemplate(template);
    
    console.log(`ActivityTypes: Created template "${template.title}" from activity "${activity.title}"`);
    
    // Dispatch template created event
    document.dispatchEvent(new CustomEvent('templateCreated', {
        detail: { template: template, sourceActivity: activity }
    }));
    
    return template;
},

/**
 * Instantiate template into new activity
 */
instantiateTemplate: function(templateId, customValues) {
    const template = this.getTemplate(templateId);
    if (!template) {
        throw new Error(`ActivityTypes.instantiateTemplate: Template ${templateId} not found`);
    }
    
    const activityId = 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const activity = {
        id: activityId,
        title: customValues.title || template.templateData.defaultValues.title,
        description: customValues.description || template.templateData.defaultValues.description,
        priority: customValues.priority || template.templateData.defaultValues.priority,
        estimatedMinutes: customValues.estimatedMinutes || template.templateData.defaultValues.estimatedMinutes,
        templateId: templateId,
        type: { 
            category: customValues.type || 'single-use',
            assignedBy: 'template',
            assignedAt: new Date().toISOString()
        },
        completed: false,
        created: Date.now(),
        modified: Date.now(),
        day: customValues.day || 'today'
    };
    
    // Update template usage
    template.templateData.usageCount++;
    template.templateData.lastUsed = Date.now();
    this.storeTemplate(template);
    
    console.log(`ActivityTypes: Instantiated template "${template.title}" as activity "${activity.title}"`);
    
    // Dispatch template instantiated event
    document.dispatchEvent(new CustomEvent('templateInstantiated', {
        detail: { activity: activity, template: template }
    }));
    
    return activity;
},

/**
 * Store template in localStorage
 */
storeTemplate: function(template) {
    try {
        let templates = this.getStoredTemplates();
        templates[template.id] = template;
        localStorage.setItem('stackmap_templates', JSON.stringify(templates));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.warn('ActivityTypes: Storage quota exceeded, cleaning old templates');
            this.cleanupOldTemplates();
            // Retry once
            try {
                let templates = this.getStoredTemplates();
                templates[template.id] = template;
                localStorage.setItem('stackmap_templates', JSON.stringify(templates));
            } catch (retryError) {
                throw new Error('ActivityTypes.storeTemplate: Storage quota exceeded even after cleanup');
            }
        } else {
            throw error;
        }
    }
},

/**
 * Get template by ID
 */
getTemplate: function(templateId) {
    const templates = this.getStoredTemplates();
    return templates[templateId] || null;
},

/**
 * Get all stored templates
 */
getStoredTemplates: function() {
    try {
        const stored = localStorage.getItem('stackmap_templates');
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('ActivityTypes.getStoredTemplates: Error reading templates', error);
        return {};
    }
},

/**
 * Cleanup old unused templates
 */
cleanupOldTemplates: function() {
    const templates = this.getStoredTemplates();
    const cutoffDate = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days ago
    
    let cleaned = 0;
    Object.keys(templates).forEach(templateId => {
        const template = templates[templateId];
        if (!template.templateData.lastUsed || template.templateData.lastUsed < cutoffDate) {
            delete templates[templateId];
            cleaned++;
        }
    });
    
    localStorage.setItem('stackmap_templates', JSON.stringify(templates));
    console.log(`ActivityTypes: Cleaned up ${cleaned} old templates`);
},

/**
 * Create project with sub-activities
 */
createProject: function(projectData) {
    if (!projectData || !projectData.title) {
        throw new Error('ActivityTypes.createProject: Invalid project data provided');
    }
    
    const projectId = 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const project = {
        id: projectId,
        title: projectData.title,
        description: projectData.description || '',
        type: { 
            category: 'project',
            assignedBy: 'user',
            assignedAt: new Date().toISOString()
        },
        subActivities: [],
        projectStatus: 'planning',
        priority: projectData.priority || 'medium',
        completed: false,
        created: Date.now(),
        modified: Date.now(),
        day: projectData.day || 'today'
    };
    
    console.log(`ActivityTypes: Created project "${project.title}"`);
    
    // Dispatch project created event
    document.dispatchEvent(new CustomEvent('projectCreated', {
        detail: { project: project }
    }));
    
    return project;
},

/**
 * Add sub-activity to project
 */
addSubActivity: function(projectId, subActivityData) {
    // Implementation for adding sub-activities to projects
    const subActivityId = 'subactivity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const subActivity = {
        id: subActivityId,
        title: subActivityData.title,
        description: subActivityData.description || '',
        parentProjectId: projectId,
        type: { 
            category: subActivityData.type || 'single-use',
            assignedBy: 'user',
            assignedAt: new Date().toISOString()
        },
        completed: false,
        created: Date.now(),
        modified: Date.now(),
        day: subActivityData.day || 'today'
    };
    
    console.log(`ActivityTypes: Added sub-activity "${subActivity.title}" to project ${projectId}`);
    
    return subActivity;
},

/**
 * Bulk assign type to multiple activities
 */
bulkAssignType: function(activityIds, typeId) {
    if (!Array.isArray(activityIds) || activityIds.length === 0) {
        throw new Error('ActivityTypes.bulkAssignType: Invalid activity IDs provided');
    }
    
    if (!ACTIVITY_TYPES[typeId]) {
        throw new Error(`ActivityTypes.bulkAssignType: Invalid type ${typeId}`);
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    activityIds.forEach(activityId => {
        try {
            // Get activity from ActivityDisplay
            const activity = this.getActivityById(activityId);
            if (activity) {
                this.assignType(activity, typeId, 1.0, 'user');
                successCount++;
            } else {
                failureCount++;
            }
        } catch (error) {
            console.error(`ActivityTypes.bulkAssignType: Error assigning type to ${activityId}:`, error);
            failureCount++;
        }
    });
    
    console.log(`ActivityTypes: Bulk assigned type ${typeId} to ${successCount} activities (${failureCount} failures)`);
    
    // Dispatch bulk assignment event
    document.dispatchEvent(new CustomEvent('bulkTypeAssigned', {
        detail: { 
            typeId: typeId, 
            successCount: successCount, 
            failureCount: failureCount,
            activityIds: activityIds
        }
    }));
    
    return { successCount, failureCount };
},

/**
 * Get activity by ID (helper for bulk operations)
 */
getActivityById: function(activityId) {
    if (window.ActivityDisplay && window.ActivityDisplay.getActivityById) {
        return window.ActivityDisplay.getActivityById(activityId);
    } else if (window.ActivityDisplay && window.ActivityDisplay.activities) {
        return window.ActivityDisplay.activities.find(a => a.id === activityId);
    }
    return null;
},
```

## Mobile-First UI Implementation

### File: `/refactor/css/activity-types.css` (NEW)
```css
/* Activity Types Mobile-First Styling */

/* Type indicators - optimized for touch */
.activity-type-indicator {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    min-height: 44px; /* WCAG touch target */
    min-width: 44px;
    justify-content: center;
    transition: all 0.2s ease;
}

.activity-type-indicator--recurring {
    background: rgba(139, 92, 246, 0.1);
    color: #8b5cf6;
    border: 1px solid rgba(139, 92, 246, 0.2);
}

.activity-type-indicator--template {
    background: rgba(124, 58, 237, 0.1);
    color: #7c3aed;
    border: 1px solid rgba(124, 58, 237, 0.2);
}

.activity-type-indicator--single-use {
    background: rgba(109, 40, 217, 0.1);
    color: #6d28d9;
    border: 1px solid rgba(109, 40, 217, 0.2);
}

.activity-type-indicator--project {
    background: rgba(5, 150, 105, 0.1);
    color: #059669;
    border: 1px solid rgba(5, 150, 105, 0.2);
}

/* Mobile type selector */
.type-selector-mobile {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    margin: 16px 0;
}

.type-option-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    min-height: 80px;
    min-width: 120px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.type-option-mobile:hover,
.type-option-mobile:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    outline: none;
}

.type-option-mobile.selected {
    border-color: #3b82f6;
    background: #eff6ff;
}

.type-option-icon {
    font-size: 24px;
    margin-bottom: 8px;
    display: block;
}

.type-option-label {
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 4px;
}

.type-option-description {
    font-size: 11px;
    color: #64748b;
    text-align: center;
    line-height: 1.3;
}

/* Template library mobile layout */
.template-library-mobile {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.template-library-mobile.open {
    transform: translateX(0);
}

.template-library-header {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #e2e8f0;
    min-height: 60px;
}

.template-library-close {
    background: none;
    border: none;
    font-size: 24px;
    padding: 8px;
    margin-right: 16px;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.template-library-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.template-library-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

.template-card-mobile {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 12px;
    background: white;
    min-height: 60px;
}

.template-card-icon {
    font-size: 20px;
    margin-right: 12px;
    width: 32px;
    text-align: center;
}

.template-card-content {
    flex: 1;
}

.template-card-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
}

.template-card-meta {
    font-size: 12px;
    color: #64748b;
}

.template-card-action {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    min-width: 60px;
    min-height: 44px;
}

/* Bulk selection mobile */
.bulk-selection-mobile {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #e2e8f0;
    padding: 16px;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(100%);
    transition: transform 0.3s ease;
}

.bulk-selection-mobile.active {
    transform: translateY(0);
}

.bulk-selection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.bulk-selection-count {
    font-size: 16px;
    font-weight: 500;
}

.bulk-selection-cancel {
    background: none;
    border: none;
    color: #64748b;
    font-size: 14px;
    padding: 8px;
    min-height: 44px;
}

.bulk-type-options {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
}

.bulk-type-button {
    flex-shrink: 0;
    padding: 8px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    background: white;
    font-size: 14px;
    min-height: 44px;
    white-space: nowrap;
}

.bulk-type-button:hover {
    background: #f8fafc;
    border-color: #3b82f6;
}

/* Safe mode adjustments */
.safe-mode .activity-type-indicator,
.safe-mode .type-option-mobile,
.safe-mode .template-card-mobile,
.safe-mode .bulk-type-button {
    min-height: 60px; /* Larger touch targets in safe mode */
    transition: none; /* No animations in safe mode */
}

.safe-mode .type-selector-mobile {
    grid-template-columns: 1fr; /* Single column in safe mode */
    gap: 16px;
}

/* Tablet adjustments */
@media (min-width: 768px) {
    .type-selector-mobile {
        grid-template-columns: 1fr 1fr 1fr 1fr;
    }
    
    .template-library-mobile {
        position: relative;
        transform: none;
        max-width: 400px;
        margin: 0 auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    }
}
```

## Detailed Test Cases with Expected Results

### 1. Template Creation Test
**Setup:**
1. Navigate to activity list
2. Create activity: "Morning workout routine" with description "30 min cardio + stretching"
3. Open activity options menu

**Action:**
1. Click "Save as Template" button
2. Enter template name: "Daily Workout Template"
3. Set placeholders: [{field: 'duration', label: 'Duration (minutes)', default: '30'}]
4. Select category: 'health'
5. Click "Create Template"

**Expected Results:**
- Template saved with ID matching pattern `template_[timestamp]_[random]`
- Original activity unchanged (still shows "Morning workout routine")
- Template appears in template library under 'health' category
- Template shows usage count: 0
- Console log: "ActivityTypes: Created template "Daily Workout Template" from activity "Morning workout routine""
- Event dispatched: `templateCreated` with template and source activity data

**Verification Steps:**
1. Open template library → should show "Daily Workout Template"
2. Check localStorage → key `stackmap_templates` should contain new template
3. Template data should include placeholders array with duration field

### 2. Template Instantiation Test
**Setup:**
1. Have template "Daily Workout Template" in library (from Test 1)
2. Navigate to quick-add activity

**Action:**
1. Click "Use Template" button
2. Select "Daily Workout Template"
3. Fill placeholder: duration = "45"
4. Change title to "Morning cardio session"
5. Click "Create Activity"

**Expected Results:**
- New activity created with title "Morning cardio session"
- Activity description includes "45 min cardio + stretching"
- Activity type assigned as 'single-use' (default)
- Template usage count incremented to 1
- Template lastUsed timestamp updated
- Console log: "ActivityTypes: Instantiated template "Daily Workout Template" as activity "Morning cardio session""
- Event dispatched: `templateInstantiated`

**Verification Steps:**
1. Check activity list → new activity appears
2. Check template library → usage count shows 1
3. Activity should have templateId field pointing to original template

### 3. Type Migration Test
**Setup:**
1. Create activities with existing types:
   - Activity A: type.category = 'frequent'
   - Activity B: type.category = 'recurring'  
   - Activity C: type.category = 'single-use'

**Action:**
1. Call `ActivityTypes.migrateExistingActivities()`
2. Inspect each activity's type.category

**Expected Results:**
- Activity A: type.category changed from 'frequent' → 'template'
- Activity B: type.category remains 'recurring' (no change)
- Activity C: type.category remains 'single-use' (no change)
- No data loss in any other fields
- All type behaviors preserved
- Console log showing migration count

**Verification Steps:**
1. Check each activity's type.category property
2. Verify type behaviors still work (e.g., recurring activities still auto-pin)
3. Visual indicators update to show new type colors/icons

### 4. Project Creation with Sub-Activities Test
**Setup:**
1. Navigate to activity creation
2. Select "Create Project" option

**Action:**
1. Enter project title: "Website Redesign"
2. Enter description: "Complete overhaul of company website"
3. Add sub-activities:
   - "Design wireframes"
   - "Create mockups"  
   - "Develop frontend"
   - "Test and deploy"
4. Set project priority: "high"
5. Click "Create Project"

**Expected Results:**
- Project created with type.category = 'project'
- Project status = 'planning'
- Four sub-activities created, each with parentProjectId pointing to project
- Project shows in activity list with project icon (📊)
- Sub-activities show as nested under project
- Console log: "ActivityTypes: Created project "Website Redesign""

**Verification Steps:**
1. Project appears in activity list with correct icon and styling
2. Clicking project expands to show sub-activities
3. Each sub-activity has parentProjectId field
4. Project completion requires all sub-activities completed

### 5. Bulk Type Assignment Test
**Setup:**
1. Create 5 test activities with mixed types
2. Enter bulk selection mode
3. Select 3 activities for bulk operation

**Action:**
1. Click bulk selection checkbox for activities 1, 3, and 5
2. Bottom sheet appears showing "3 selected"
3. Click "Assign Type" button
4. Select "Recurring" type
5. Confirm bulk assignment

**Expected Results:**
- All 3 selected activities get type.category = 'recurring'
- Type assignment timestamp updated for all 3
- assignedBy field = 'user' for all 3
- Visual indicators update immediately
- Bulk selection mode exits
- Console log: "ActivityTypes: Bulk assigned type recurring to 3 activities (0 failures)"
- Event dispatched: `bulkTypeAssigned` with success/failure counts

**Verification Steps:**
1. Check each selected activity has correct type
2. Unselected activities remain unchanged
3. Type-specific behaviors apply (e.g., activities become pinned if recurring)

## Integration Points with Exact Event Handlers

### Event Listeners Required:
```javascript
// In activity-display.js around line 150
document.addEventListener('templateCreated', function(e) {
    const template = e.detail.template;
    // Update template count in UI
    ActivityDisplay.updateTemplateCount();
    // Show success notification
    ActivityDisplay.showNotification(`Template "${template.title}" created`);
});

document.addEventListener('templateInstantiated', function(e) {
    const activity = e.detail.activity;
    // Add new activity to display
    ActivityDisplay.addActivity(activity);
    // Update activity list
    ActivityDisplay.render();
});

document.addEventListener('projectCreated', function(e) {
    const project = e.detail.project;
    // Add project to activity list
    ActivityDisplay.addActivity(project);
    // Initialize project UI features
    ProjectUI.initializeProject(project.id);
});

document.addEventListener('bulkTypeAssigned', function(e) {
    const { successCount, failureCount } = e.detail;
    // Show bulk operation result
    ActivityDisplay.showNotification(`Type assigned to ${successCount} activities`);
    // Refresh activity display
    ActivityDisplay.render();
    // Exit bulk mode
    BulkOperations.exitBulkMode();
});
```

### API Integration Points:
```javascript
// In quick-add-ui.js - Template selection
QuickAddUI.prototype.showTemplateSelector = function() {
    const templates = ActivityTypes.getStoredTemplates();
    // Render template options
    this.renderTemplateList(Object.values(templates));
};

// In activity-cards.js - Type indicator rendering
ActivityCards.prototype.renderTypeIndicator = function(activity) {
    const typeId = activity.type?.category || 'single-use';
    const typeDef = ActivityTypes.getTypeDefinition(typeId);
    return `<span class="activity-type-indicator activity-type-indicator--${typeId}">
        ${typeDef.icon} ${typeDef.label}
    </span>`;
};

// In edit-mode-menu.js - Bulk operations
EditModeMenu.prototype.enableBulkTypeAssignment = function() {
    const selectedIds = this.getSelectedActivityIds();
    BulkOperations.showTypeSelector(selectedIds, function(typeId) {
        ActivityTypes.bulkAssignType(selectedIds, typeId);
    });
};
```

## Error Handling Specifications

### Template Creation Failures:
```javascript
// Storage quota exceeded
try {
    ActivityTypes.createTemplate(activity, options);
} catch (error) {
    if (error.message.includes('Storage quota exceeded')) {
        // Show storage warning dialog
        ActivityDisplay.showStorageWarning();
        // Offer to clean up old templates
        ActivityDisplay.showCleanupDialog();
    } else {
        // Show generic error
        ActivityDisplay.showError('Failed to create template: ' + error.message);
    }
}

// Invalid template data
try {
    ActivityTypes.createTemplate(null, options);
} catch (error) {
    if (error.message.includes('Invalid activity')) {
        ActivityDisplay.showError('Please select a valid activity to create template');
    }
}
```

### Template Instantiation Failures:
```javascript
// Template not found
try {
    ActivityTypes.instantiateTemplate('invalid-id', {});
} catch (error) {
    if (error.message.includes('not found')) {
        ActivityDisplay.showError('Template no longer available');
        // Remove from template library UI
        TemplateLibrary.removeTemplate('invalid-id');
    }
}

// Corrupted template data
try {
    const activity = ActivityTypes.instantiateTemplate(templateId, values);
} catch (error) {
    // Fallback to manual activity creation
    ActivityDisplay.showError('Template corrupted, creating manual activity');
    QuickAddUI.showManualCreation(values);
}
```

### Bulk Operation Failures:
```javascript
// Partial bulk operation failure
const result = ActivityTypes.bulkAssignType(activityIds, typeId);
if (result.failureCount > 0) {
    const message = `${result.successCount} activities updated, ${result.failureCount} failed`;
    ActivityDisplay.showWarning(message);
    // Offer to retry failed operations
    ActivityDisplay.showRetryOption(failedIds);
}

// Complete bulk operation failure
try {
    ActivityTypes.bulkAssignType([], 'invalid-type');
} catch (error) {
    ActivityDisplay.showError('Bulk operation failed: ' + error.message);
    BulkOperations.resetSelection();
}
```

### Graceful Degradation:
```javascript
// Template system unavailable
if (!window.ActivityTypes || !ActivityTypes.createTemplate) {
    // Hide template options in UI
    document.querySelectorAll('.template-option').forEach(el => el.style.display = 'none');
    // Show fallback message
    ActivityDisplay.showInfo('Template features temporarily unavailable');
}

// Storage unavailable
if (!localStorage || !localStorage.getItem) {
    // Use in-memory template storage
    ActivityTypes.useMemoryStorage();
    ActivityDisplay.showWarning('Templates will not persist between sessions');
}
```

---

**REVISED PLAN READY FOR PM2 APPROVAL**

*This plan now includes specific implementation details, exact line numbers, complete code snippets, detailed test cases, and comprehensive error handling as requested by PM feedback.*