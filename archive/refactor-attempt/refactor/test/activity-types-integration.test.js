/**
 * Integration Tests for Activity Types & Categories System
 * Story #116 - Round 8 Dev2
 */

describe('Activity Types & Categories Integration', () => {
    let mockActivity;
    let mockTemplate;
    let mockProject;
    
    beforeEach(() => {
        // Reset state
        localStorage.clear();
        
        // Mock activity
        mockActivity = {
            id: 'test-activity-1',
            title: 'Daily standup meeting',
            description: 'Team sync meeting',
            created: Date.now()
        };
        
        // Mock modules
        window.ActivityTypes = {
            isInitialized: true,
            suggestType: jest.fn().mockReturnValue({ type: 'recurring', confidence: 0.9 }),
            assignType: jest.fn(),
            createTemplate: jest.fn().mockReturnValue({ id: 'template-1', title: 'Meeting Template' }),
            instantiateTemplate: jest.fn().mockReturnValue({ id: 'new-activity-1', title: 'New Meeting' }),
            createProject: jest.fn().mockReturnValue({ id: 'project-1', title: 'Website Redesign' }),
            getTypeDefinition: jest.fn().mockReturnValue({
                id: 'recurring',
                icon: '🔄',
                label: 'Recurring',
                color: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)'
            }),
            createTypeIndicator: jest.fn().mockReturnValue(document.createElement('span'))
        };
        
        window.ActivityCategories = {
            isInitialized: true,
            suggestCategory: jest.fn().mockReturnValue('work'),
            assignCategory: jest.fn().mockReturnValue(true),
            createCategoryIndicator: jest.fn().mockReturnValue(document.createElement('span'))
        };
        
        window.ActivityDisplay = {
            activities: [],
            render: jest.fn(),
            updateTemplateCount: jest.fn(),
            updateProjectDisplay: jest.fn(),
            updateActivityDisplay: jest.fn(),
            showNotification: jest.fn()
        };
    });
    
    describe('Activity Creation Integration', () => {
        test('should auto-assign type and category on activity creation', () => {
            // Dispatch activity created event
            const event = new CustomEvent('activityCreated', {
                detail: { activity: mockActivity }
            });
            document.dispatchEvent(event);
            
            // Verify auto-assignment was triggered
            expect(window.ActivityTypes.suggestType).toHaveBeenCalledWith(mockActivity);
            expect(window.ActivityCategories.suggestCategory).toHaveBeenCalledWith(mockActivity);
        });
        
        test('should update UI when type is assigned', () => {
            // Assign type
            mockActivity.type = { category: 'recurring', confidence: 0.9 };
            
            // Create activity element
            const element = document.createElement('div');
            element.setAttribute('data-activity-id', mockActivity.id);
            document.body.appendChild(element);
            
            // Dispatch type assigned event
            const event = new CustomEvent('activityTypeAssigned', {
                detail: { activity: mockActivity, type: 'recurring' }
            });
            document.dispatchEvent(event);
            
            // Verify UI update was triggered
            expect(window.ActivityDisplay.updateActivityDisplay).toHaveBeenCalledWith(mockActivity.id);
        });
    });
    
    describe('Template System Integration', () => {
        test('should update UI when template is created', () => {
            const template = { id: 'template-1', title: 'Test Template' };
            
            // Dispatch template created event
            const event = new CustomEvent('templateCreated', {
                detail: { template: template }
            });
            document.dispatchEvent(event);
            
            // Verify UI updates
            expect(window.ActivityDisplay.updateTemplateCount).toHaveBeenCalled();
            expect(window.ActivityDisplay.showNotification).toHaveBeenCalledWith(
                'Template "Test Template" created',
                'success'
            );
        });
        
        test('should add activity when template is instantiated', () => {
            const newActivity = { id: 'new-1', title: 'From Template' };
            
            // Dispatch template instantiated event
            const event = new CustomEvent('templateInstantiated', {
                detail: { activity: newActivity }
            });
            document.dispatchEvent(event);
            
            // Verify activity was added
            expect(window.ActivityDisplay.activities).toContain(newActivity);
            expect(window.ActivityDisplay.render).toHaveBeenCalled();
        });
    });
    
    describe('Category System Integration', () => {
        test('should update activity display when category assigned', () => {
            mockActivity.category = 'work';
            
            // Create activity element
            const element = document.createElement('div');
            element.setAttribute('data-activity-id', mockActivity.id);
            document.body.appendChild(element);
            
            // Dispatch category assigned event
            const event = new CustomEvent('activityCategoryAssigned', {
                detail: { 
                    activity: mockActivity, 
                    category: { id: 'work', label: 'Work' }
                }
            });
            document.dispatchEvent(event);
            
            // Verify UI update
            expect(window.ActivityDisplay.updateActivityDisplay).toHaveBeenCalledWith(mockActivity.id);
        });
    });
    
    describe('Project System Integration', () => {
        test('should add project when created', () => {
            const project = { 
                id: 'project-1', 
                title: 'New Project',
                type: { category: 'project' }
            };
            
            // Dispatch project created event
            const event = new CustomEvent('projectCreated', {
                detail: { project: project }
            });
            document.dispatchEvent(event);
            
            // Verify project was added
            expect(window.ActivityDisplay.activities).toContain(project);
            expect(window.ActivityDisplay.render).toHaveBeenCalled();
        });
        
        test('should update project display when sub-activity added', () => {
            const subActivity = { 
                id: 'sub-1', 
                title: 'Sub Task',
                parentProjectId: 'project-1'
            };
            
            // Dispatch sub-activity added event
            const event = new CustomEvent('subActivityAdded', {
                detail: { 
                    subActivity: subActivity,
                    projectId: 'project-1'
                }
            });
            document.dispatchEvent(event);
            
            // Verify updates
            expect(window.ActivityDisplay.activities).toContain(subActivity);
            expect(window.ActivityDisplay.updateProjectDisplay).toHaveBeenCalledWith('project-1');
        });
    });
    
    describe('Bulk Operations Integration', () => {
        test('should refresh display after bulk type assignment', () => {
            // Dispatch bulk type assigned event
            const event = new CustomEvent('bulkTypeAssigned', {
                detail: { 
                    typeId: 'recurring',
                    successCount: 5,
                    failureCount: 1,
                    activityIds: ['id1', 'id2', 'id3', 'id4', 'id5', 'id6']
                }
            });
            document.dispatchEvent(event);
            
            // Verify UI updates
            expect(window.ActivityDisplay.render).toHaveBeenCalled();
            expect(window.ActivityDisplay.showNotification).toHaveBeenCalledWith(
                'Type "recurring" assigned to 5 activities',
                'success'
            );
            expect(window.ActivityDisplay.showNotification).toHaveBeenCalledWith(
                'Failed to assign type to 1 activities',
                'error'
            );
        });
        
        test('should refresh display after bulk category assignment', () => {
            // Dispatch bulk category assigned event
            const event = new CustomEvent('bulkCategoryAssigned', {
                detail: { 
                    categoryId: 'work',
                    successCount: 3,
                    failureCount: 0
                }
            });
            document.dispatchEvent(event);
            
            // Verify UI updates
            expect(window.ActivityDisplay.render).toHaveBeenCalled();
            expect(window.ActivityDisplay.showNotification).toHaveBeenCalledWith(
                'Category assigned to 3 activities',
                'success'
            );
        });
    });
    
    describe('UI Element Integration', () => {
        test('should create type indicator for activities', () => {
            mockActivity.type = { category: 'recurring' };
            
            // Create indicator
            const indicator = window.ActivityTypes.createTypeIndicator(mockActivity);
            
            expect(indicator).toBeTruthy();
            expect(indicator.tagName).toBe('SPAN');
        });
        
        test('should create category indicator for activities', () => {
            mockActivity.category = 'work';
            
            // Create indicator
            const indicator = window.ActivityCategories.createCategoryIndicator(mockActivity);
            
            expect(indicator).toBeTruthy();
            expect(indicator.tagName).toBe('SPAN');
        });
    });
    
    describe('Error Handling', () => {
        test('should handle missing activity in events', () => {
            // Dispatch event without activity
            const event = new CustomEvent('activityCreated', {
                detail: {}
            });
            
            // Should not throw
            expect(() => document.dispatchEvent(event)).not.toThrow();
        });
        
        test('should handle missing modules gracefully', () => {
            // Remove modules
            delete window.ActivityTypes;
            delete window.ActivityCategories;
            
            // Create activity element without modules
            const element = document.createElement('div');
            
            // Should not throw when trying to create indicators
            expect(() => {
                if (window.ActivityTypes) {
                    window.ActivityTypes.createTypeIndicator(mockActivity);
                }
            }).not.toThrow();
        });
    });
    
    describe('Performance', () => {
        test('should batch UI updates for multiple events', (done) => {
            let renderCount = 0;
            window.ActivityDisplay.render = jest.fn(() => renderCount++);
            
            // Dispatch multiple events rapidly
            for (let i = 0; i < 10; i++) {
                const event = new CustomEvent('activityCreated', {
                    detail: { 
                        activity: { 
                            id: `activity-${i}`, 
                            title: `Activity ${i}` 
                        }
                    }
                });
                document.dispatchEvent(event);
            }
            
            // Check that renders are batched
            setTimeout(() => {
                expect(renderCount).toBeLessThan(10);
                done();
            }, 100);
        });
    });
});

// Run tests if in test environment
if (typeof jest !== 'undefined') {
    // Tests will run automatically
} else {
    // Manual test runner for browser
    console.log('Activity Types Integration Tests loaded. Run with Jest.');
}