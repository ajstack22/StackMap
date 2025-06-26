# Implementation Plan: Activity Types & Categories

**Story**: r8_dev2_story_116_activity_types.md
**Team**: 2 (PM2 + Dev2)
**Generated**: 2025-06-26

## Overview
The activity types system has already been partially implemented in `/refactor/js/activity-types.js`. This plan focuses on completing the missing features from the story requirements, particularly the 4-type system (Recurring, Template, Single-use, Project) and the template management system.

## Gap Analysis

### Current Implementation
✅ **Existing Features:**
- 3-type system (Recurring, Frequent, Single-use)
- Auto-assignment based on keywords
- Type indicators and visual differentiation
- Type selector UI for manual changes
- Migration system for existing activities
- Type-specific behaviors (auto-pin, archive on complete)
- Integration with activity display system

### Missing Features from Story #116
❌ **Required but Missing:**
1. **Template Type**: Not implemented (story requires Template instead of Frequent)
2. **Project Type**: Completely missing
3. **Template System**: No template creation, storage, or instantiation
4. **Category System**: No work/personal/health categorization
5. **CSS Styling**: No dedicated activity-types.css file
6. **Export/Import**: No template sharing functionality
7. **Bulk Operations**: No bulk type assignment
8. **Sub-activities**: No support for project sub-activities

## Technical Approach

### 1. File Structure
```
/refactor/
├── js/
│   ├── activity-types.js         # UPDATE: Add Project type, fix Template
│   ├── template-system.js        # NEW: Template management
│   └── activity-categories.js    # NEW: Category system
├── css/
│   └── activity-types.css        # NEW: Type-specific styling
└── tests/
    ├── activity-types.test.js    # UPDATE: Add new type tests
    └── template-system.test.js   # NEW: Template tests
```

### 2. Key Components

#### A. Enhanced Activity Types System
- Replace "Frequent" with "Template" type
- Add "Project" type with sub-activity support
- Update type behaviors and visual properties
- Enhance type assignment logic

#### B. Template Management System
- Template creation from existing activities
- Template storage and retrieval
- Template instantiation with customization
- Template library UI component
- Export/import functionality

#### C. Category System
- Predefined categories (work, personal, health, etc.)
- Category assignment and filtering
- Visual category indicators
- Category-based organization

### 3. Data Model

```javascript
// Enhanced activity schema
{
  id: 'string',
  type: 'recurring|template|single-use|project',
  category: 'work|personal|health|learning|social|other',
  
  // Template-specific fields
  isTemplate: false,              // True for template activities
  templateId: 'string',           // If created from template
  templateData: {                 // For template activities
    placeholders: [],             // Customizable fields
    defaultValues: {},
    usageCount: 0,
    lastUsed: null
  },
  
  // Project-specific fields
  subActivities: [],              // Array of activity IDs
  parentProjectId: 'string',      // If this is a sub-activity
  projectStatus: 'planning|active|completed|archived',
  
  // Type metadata (existing, enhanced)
  typeMetadata: {
    category: 'string',           // Type category
    assignedAt: 'ISO timestamp',
    confidence: 0.9,
    assignedBy: 'auto|user|suggested',
    recurringPattern: 'daily|weekly|custom',
    behaviors: []                 // Type-specific behaviors
  },
  
  // Existing fields
  title: 'string',
  description: 'string',
  icon: 'emoji',
  priority: 'low|medium|high',
  completed: false,
  pinned: false,
  // ... other existing fields
}
```

### 4. API Design

```javascript
// ActivityTypes API (enhanced)
ActivityTypes.assignType(activity, type, metadata)
ActivityTypes.changeType(activityId, newType)
ActivityTypes.bulkAssignType(activityIds, type)
ActivityTypes.getTypeDefinition(type)
ActivityTypes.filterByType(activities, types[])

// TemplateSystem API
TemplateSystem.init()
TemplateSystem.createTemplate(activity)
TemplateSystem.getTemplates(category?)
TemplateSystem.instantiateTemplate(templateId, customValues)
TemplateSystem.updateTemplate(templateId, updates)
TemplateSystem.deleteTemplate(templateId)
TemplateSystem.exportTemplate(templateId)
TemplateSystem.importTemplate(templateData)

// ActivityCategories API
ActivityCategories.getCategories()
ActivityCategories.assignCategory(activity, category)
ActivityCategories.filterByCategory(activities, categories[])
ActivityCategories.getCategoryIcon(category)
ActivityCategories.getCategoryColor(category)
```

## Implementation Steps

### Phase 1: Core Type System Enhancement (Day 1)
1. [x] Analyze existing implementation
2. [ ] Update activity-types.js to replace Frequent with Template
3. [ ] Add Project type definition and behaviors
4. [ ] Create activity-types.css with visual styling
5. [ ] Update type assignment logic for 4 types
6. [ ] Add bulk type assignment functionality
7. [ ] Write unit tests for new types

### Phase 2: Template System (Day 2)
1. [ ] Create template-system.js module
2. [ ] Implement template creation from activities
3. [ ] Add template storage mechanism
4. [ ] Build template instantiation logic
5. [ ] Create template library UI component
6. [ ] Add template search and filtering
7. [ ] Implement export/import functionality
8. [ ] Write template system tests

### Phase 3: Categories & Integration (Day 3)
1. [ ] Create activity-categories.js module
2. [ ] Define category system and icons
3. [ ] Add category assignment to activities
4. [ ] Integrate categories with templates
5. [ ] Update UI for category indicators
6. [ ] Add category-based filtering
7. [ ] Test integration with existing features
8. [ ] Update activity creation flow

### Phase 4: Project Type Features
1. [ ] Implement sub-activity support
2. [ ] Create project status tracking
3. [ ] Add project-specific UI elements
4. [ ] Enable sub-activity management
5. [ ] Test project functionality

## Testing Strategy

### Unit Tests
- Type assignment and detection
- Template creation and instantiation
- Category assignment and filtering
- Project sub-activity management
- Bulk operations

### Integration Tests
- Activity creation with types
- Template library functionality
- Type changes and updates
- Category-based organization
- Export/import workflow

### Platform Testing
- Mobile: Touch interactions for type selection
- TV: Keyboard navigation for type/category filters
- PWA: Offline template access
- Safe Mode: Simplified type indicators

### User Flow Testing
1. Create activity → Select type → Assign category
2. Convert activity to template → Use template
3. Create project → Add sub-activities
4. Bulk assign types to multiple activities
5. Filter by type and category

## Risk Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation**: 
- Keep existing 3-type system working during transition
- Add feature flags for gradual rollout
- Comprehensive testing before replacing Frequent with Template

### Risk 2: Performance Impact
**Mitigation**:
- Lazy load template library
- Index activities by type and category
- Cache type statistics
- Optimize bulk operations

### Risk 3: User Confusion with Type Changes
**Mitigation**:
- Provide migration path from Frequent to Template
- Clear visual indicators for each type
- In-app help for type selection
- Default to Single-use if uncertain

### Risk 4: Storage Limitations
**Mitigation**:
- Limit template library size
- Compress template data
- Clean up unused templates
- Warn before storage full

## Dependencies
- Existing modules: 
  - activity-display.js (for rendering)
  - activity-sqlite.js (for storage)
  - quick-add-ui.js (for creation flow)
  - db-schema.js (for data model)
- External libraries: None (vanilla JS)

## Success Criteria
- [ ] All 4 activity types working correctly
- [ ] Template system fully functional
- [ ] Categories integrated throughout
- [ ] Visual differentiation clear
- [ ] No regression in existing features
- [ ] Works on all platforms
- [ ] Performance targets met (<100ms type assignment)
- [ ] Safe mode compatibility maintained

## Definition of Done
1. All acceptance criteria from Story #116 met
2. Unit tests passing (>90% coverage)
3. Integration tests passing
4. Platform testing completed
5. No console errors or warnings
6. Documentation updated
7. Code reviewed and approved
8. Performance benchmarks met

---

## Notes for PM2 Review
- The existing implementation provides a solid foundation
- Main work is enhancing from 3 to 4 types and adding templates
- Category system can leverage existing default-activities.js categories
- Project type with sub-activities is the most complex new feature
- Template export/import needs careful security consideration

*This plan requires PM2 review before proceeding to development*