# Implementation Plan: Story #99 - Card Library System

## Overview
Enhance the existing activity library system to create a sophisticated card library with template creation, management, and intelligent features. This will restore StackMap's powerful template capabilities for users who frequently perform similar activities, particularly beneficial for users with ADHD who benefit from consistent structure and reduced cognitive load.

## Current State Analysis
- Basic activity library exists (`js/activity-library.js`) with category browsing
- Default activities system provides base templates (`js/default-activities.js`) 
- Activity types system in place (Story #97) for intelligent categorization
- Card system supports type indicators and edit controls
- Need to enhance with template creation, personalization, and intelligence features

## Files to Create/Modify

### New Files
1. **js/template-manager.js** - Core template CRUD operations
   - Template creation from existing activities
   - Template saving, loading, and deletion
   - Template duplication and versioning
   - Template data validation and sanitization

2. **js/library-browser.js** - Enhanced library browsing interface
   - Grid-based template browser
   - Advanced search and filtering
   - Category organization and navigation
   - Template preview and selection

3. **js/template-intelligence.js** - Smart suggestions and learning
   - Usage pattern analysis
   - Auto-suggestion algorithms
   - Smart categorization for new templates
   - Learning from user customization patterns

4. **css/template-browser.css** - Template browsing UI styling
   - Grid layout for template cards
   - Search and filter interface styling
   - Mobile-responsive design
   - Template preview modal styling

### Enhanced Files
1. **js/activity-library.js** - Enhance existing library functionality
   - Integration with template manager
   - Enhanced search capabilities
   - Usage tracking integration
   - Personal template storage

2. **css/activity-library.css** - Enhanced library styling
   - Template card enhancements
   - Category navigation improvements
   - Search interface styling
   - Mobile optimizations

3. **js/db-schema.js** - Template storage schema
   - Add template table structure
   - Template metadata fields
   - Usage tracking schema
   - Version control fields

4. **index.html** - Include new script and style files
   - Add template-manager.js
   - Add library-browser.js
   - Add template-intelligence.js
   - Add template-browser.css

## Implementation Steps

### Phase 1: Core Template System Infrastructure

1. **Enhance Database Schema** (js/db-schema.js)
   - Add template table structure with versioning
   - Include usage tracking and metadata fields
   - Add template category and type relationships
   - Implement template data validation

2. **Create Template Manager** (js/template-manager.js)
   - Implement template CRUD operations
   - Add template creation from activities
   - Include template duplication and editing
   - Add import/export functionality

3. **Template Storage Integration**
   - SQLite template table creation
   - Template persistence and retrieval
   - Template backup and restore
   - Data migration for existing patterns

### Phase 2: Enhanced Library Interface

1. **Create Library Browser** (js/library-browser.js)
   - Grid-based template display
   - Category-based organization
   - Advanced search and filtering
   - Template selection and preview

2. **Enhance Activity Library** (js/activity-library.js)
   - Integrate personal template storage
   - Add template creation workflows
   - Enhanced template browsing
   - Usage tracking integration

3. **Template Browser Styling** (css/template-browser.css)
   - Responsive grid layout
   - Template card design
   - Search interface styling
   - Mobile-optimized interactions

### Phase 3: Template Usage & Integration

1. **Template Instantiation System**
   - Create activities from templates
   - Handle template placeholders
   - Customization prompts
   - Integration with Quick Add

2. **Edit Mode Integration**
   - "Save as Template" functionality
   - Template management from cards
   - Bulk template operations
   - Template sharing preparation

3. **Usage Tracking Implementation**
   - Track template usage frequency
   - Record customization patterns
   - Popularity-based sorting
   - Usage analytics

### Phase 4: Intelligence Features

1. **Create Template Intelligence** (js/template-intelligence.js)
   - Auto-suggestion algorithms
   - Pattern recognition for templates
   - Smart categorization system
   - Time-based recommendations

2. **Learning System Implementation**
   - User behavior analysis
   - Customization pattern learning
   - Adaptive suggestions
   - Preference learning

3. **Smart Integration Features**
   - Context-aware suggestions
   - Type-based recommendations
   - Time and day pattern recognition
   - User habit analysis

## Technical Architecture

### Template Data Model
```javascript
const TemplateSchema = {
  // Core identification
  id: { type: 'string', required: true },
  title: { type: 'string', required: true, maxLength: 200 },
  description: { type: 'string', maxLength: 1000 },
  category: { type: 'string', required: true },
  
  // Activity type integration
  type: {
    type: 'object',
    fields: {
      category: { type: 'enum', values: ['recurring', 'frequent', 'single-use'] },
      confidence: { type: 'number', min: 0, max: 1 }
    }
  },
  
  // Template configuration
  timeEstimate: { type: 'number', min: 0, max: 1440 },
  icon: { type: 'string', default: '📝' },
  template: {
    type: 'object',
    fields: {
      title: { type: 'string', required: true },
      description: { type: 'string' },
      placeholders: { type: 'array', itemType: 'string' },
      defaultValues: { type: 'object' }
    }
  },
  
  // Metadata and tracking
  metadata: {
    type: 'object',
    fields: {
      created: { type: 'timestamp', required: true, autoSet: true },
      modified: { type: 'timestamp', required: true, autoUpdate: true },
      usageCount: { type: 'number', default: 0 },
      lastUsed: { type: 'timestamp', nullable: true },
      createdBy: { type: 'enum', values: ['user', 'system'], default: 'user' },
      version: { type: 'number', default: 1 },
      tags: { type: 'array', itemType: 'string', maxItems: 10 }
    }
  }
};
```

### Template Manager API
```javascript
class TemplateManager {
  // Core CRUD operations
  static async create(activity, options = {}) { }
  static async save(template) { }
  static async load(templateId) { }
  static async delete(templateId) { }
  static async duplicate(templateId, newTitle) { }
  
  // Search and filtering
  static async search(query, filters = {}) { }
  static async getByCategory(category) { }
  static async getPopular(limit = 10) { }
  static async getRecent(limit = 10) { }
  
  // Usage tracking
  static async recordUsage(templateId, customizations = {}) { }
  static async getUsageStats(templateId) { }
  
  // Import/export
  static async exportTemplates(templateIds) { }
  static async importTemplates(templateData) { }
}
```

### Library Browser Interface
```javascript
class LibraryBrowser {
  // Display management
  static showLibrary(options = {}) { }
  static hideLibrary() { }
  static refreshDisplay() { }
  
  // Navigation and filtering
  static filterByCategory(category) { }
  static searchTemplates(query) { }
  static sortTemplates(sortBy) { }
  
  // Template interaction
  static previewTemplate(templateId) { }
  static selectTemplate(templateId) { }
  static addFromTemplate(templateId) { }
  
  // Management operations
  static editTemplate(templateId) { }
  static deleteTemplate(templateId) { }
  static duplicateTemplate(templateId) { }
}
```

### Intelligence System
```javascript
class TemplateIntelligence {
  // Suggestion algorithms
  static getSuggestions(context = {}) { }
  static getTimeBasedSuggestions() { }
  static getPatternBasedSuggestions() { }
  
  // Learning and adaptation
  static learnFromUsage(templateId, customizations) { }
  static updateUserPreferences(preferences) { }
  
  // Categorization
  static autoCategotize(template) { }
  static suggestTags(template) { }
  
  // Analytics
  static getUsagePatterns() { }
  static getUserInsights() { }
}
```

## Enhanced Default Template Library

### Work Category
- "Daily Standup Meeting" (15m, recurring) - "Attend daily team standup"
- "Code Review Session" (30m, frequent) - "Review team member's code changes"
- "Client Meeting" (60m, single-use) - "Meet with [CLIENT_NAME] about [PROJECT]"
- "Email Processing" (20m, recurring) - "Process and respond to inbox"
- "Sprint Planning" (120m, single-use) - "Plan activities for upcoming sprint"

### Personal Category  
- "Morning Routine" (45m, recurring) - "Complete morning preparation routine"
- "Exercise Session" (45m, frequent) - "[EXERCISE_TYPE] workout session"
- "Grocery Shopping" (60m, frequent) - "Shop for groceries at [STORE]"
- "Family Time" (60m, frequent) - "Spend quality time with family"
- "Meal Preparation" (45m, frequent) - "Prepare [MEAL_TYPE] for [NUMBER] people"

### Health Category
- "Take Medication" (5m, recurring) - "Take [MEDICATION_NAME] as prescribed"
- "Doctor Appointment" (90m, single-use) - "Appointment with [DOCTOR] for [REASON]"
- "Meditation Session" (20m, frequent) - "[MEDITATION_TYPE] meditation practice"
- "Hydration Break" (2m, recurring) - "Drink water and check hydration"
- "Mental Health Check" (15m, frequent) - "Check in with mental state and well-being"

### Learning Category
- "Study Session" (60m, frequent) - "Study [SUBJECT] for [DURATION]"
- "Online Course" (45m, frequent) - "Continue [COURSE_NAME] on [PLATFORM]"
- "Reading Time" (30m, frequent) - "Read [BOOK/ARTICLE] for [PURPOSE]"
- "Skill Practice" (45m, frequent) - "Practice [SKILL] for improvement"
- "Tutorial Follow-along" (60m, single-use) - "Complete [TUTORIAL_NAME] tutorial"

## Mobile-First Design Considerations

### Template Browser Layout
- Grid layout optimized for touch interactions
- Minimum 44px touch targets (60px in safe mode)
- Swipe gestures for category navigation
- Pull-to-refresh for template updates
- Responsive card sizing for different screen widths

### Template Creation Interface
- Modal-based template creation form
- Auto-complete for categories and tags
- Template preview before saving
- Easy placeholder creation with visual indicators
- Touch-optimized controls

### Search and Navigation
- Instant search with debounced queries
- Filter chips for easy category selection
- Recent searches and suggestions
- Voice input support where available
- Keyboard-friendly navigation

## Integration Points

### Activity Types System (Story #97)
- Automatic type assignment for new templates
- Type-based template suggestions
- Type-specific template behaviors
- Visual type indicators on template cards

### Edit Mode Integration
- "Save as Template" button in card edit controls
- Template management through edit mode menu
- Bulk template operations support
- Template sharing preparation

### Quick Add System
- Template suggestions in Quick Add interface
- One-click template instantiation
- Smart template recommendations
- Recent template quick access

## Performance Optimizations

### Template Loading
- Progressive loading for large template libraries
- Lazy loading of template details
- Efficient search indexing
- Template image optimization

### Search Performance
- Debounced search queries (300ms)
- Client-side search caching
- Efficient filtering algorithms
- Result pagination for large datasets

### Memory Management
- Template data cleanup after usage
- Efficient template card recycling
- Smart preloading of likely-needed templates
- Memory pressure monitoring

## Accessibility Requirements

### Screen Reader Support
- Proper ARIA labels for template cards
- Template description announcements
- Category navigation landmarks
- Search result announcements

### Keyboard Navigation
- Full keyboard navigation support
- Logical tab order through templates
- Keyboard shortcuts for common actions
- Escape key handling for modals

### Visual Accessibility
- High contrast mode support
- Clear focus indicators
- Sufficient color contrast (4.5:1 minimum)
- Alternative text for template icons

## Testing Strategy

### Unit Tests
- Template CRUD operations
- Search and filtering functions
- Intelligence algorithm accuracy
- Data validation and sanitization
- Import/export functionality

### Integration Tests
- Template creation from activities
- Library browsing performance
- Integration with activity types
- Quick Add template selection
- Edit mode template management

### Manual Testing
- [ ] Template creation from various activity types
- [ ] Library browsing with large datasets
- [ ] Search functionality with edge cases
- [ ] Template usage and customization flows
- [ ] Mobile interface testing across devices
- [ ] Accessibility testing with screen readers

## Risk Mitigation

### Performance Risks
- **Risk**: Large template libraries affecting performance
- **Mitigation**: Progressive loading, search indexing, result pagination

### Data Integrity Risks
- **Risk**: Template corruption or loss
- **Mitigation**: Template versioning, backup systems, validation

### User Experience Risks
- **Risk**: Complex interface overwhelming users
- **Mitigation**: Progressive disclosure, smart defaults, clear navigation

### Intelligence Accuracy Risks
- **Risk**: Poor template suggestions
- **Mitigation**: Conservative initial algorithms, user feedback integration

## Definition of Done

### Functional Requirements
- [ ] Templates can be created from any activity
- [ ] Library browsing is fast and responsive
- [ ] Search and filtering work accurately
- [ ] Template usage creates proper activities
- [ ] Intelligence features provide relevant suggestions
- [ ] Data persists correctly across app restarts

### Quality Requirements
- [ ] Mobile-first responsive design
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Performance benchmarks maintained
- [ ] Comprehensive error handling
- [ ] Clean, maintainable code

### User Experience Requirements
- [ ] Template creation takes under 10 seconds
- [ ] Library browsing feels intuitive
- [ ] Template selection is one-click simple
- [ ] Smart suggestions improve relevance over time
- [ ] Mobile experience is touch-optimized

## Future Enhancement Opportunities

### Advanced Features (Out of Scope)
- Template sharing between users
- Collaborative template editing
- Template marketplace
- Advanced analytics dashboard
- AI-powered template generation

### Integration Opportunities
- Calendar integration for template scheduling
- Template-based habit tracking
- Team template libraries
- Template performance analytics

---

**This plan implements a comprehensive card library system that restores StackMap's template capabilities while adding modern intelligence features, providing users with efficient tools for managing recurring activities and routines.**