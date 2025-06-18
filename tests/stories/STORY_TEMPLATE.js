/**
 * Story Test Template
 * Copy this file to create new story tests
 */

// Import any mocks needed
// const GoogleDriveMock = require('../mocks/google-drive-mock');

module.exports = {
    // Required: Clear title describing what the user can do
    title: 'User can [action] without [problem]',
    
    // Required: GitHub issue number or identifier
    issue: '#123',
    
    // Required: Priority level
    // - 'critical': Blocks commits/deployments if failing
    // - 'high': Important but doesn't block
    // - 'medium': Standard priority
    // - 'low': Nice to have
    priority: 'medium',
    
    // Optional: Tags for categorization
    tags: ['feature-area', 'test-type'],
    
    // Optional: Setup function runs before scenarios
    setup: async (page) => {
        // Inject mocks, set up test data, etc.
        // Example:
        // const mock = new GoogleDriveMock();
        // await mock.inject(page);
    },
    
    // Optional: Teardown function runs after all scenarios
    teardown: async (page) => {
        // Clean up test data, reset state, etc.
    },
    
    // Required: Array of test scenarios
    scenarios: [
        {
            // Required: Initial state/context
            given: 'User is on the main page',
            
            // Required: Action the user takes
            when: 'User clicks the settings button',
            
            // Required: Expected outcome
            then: 'Settings panel should open',
            
            // Required: Puppeteer test implementation
            test: async (page) => {
                // Navigate to app
                await page.goto('http://localhost:5500', { 
                    waitUntil: 'networkidle2' 
                });
                
                // Wait for app to load
                await page.waitForSelector('.main-container');
                
                // Perform the action
                await page.click('[data-test="settings-button"]');
                
                // Verify the outcome
                await page.waitForSelector('.side-panel--open', {
                    timeout: 5000
                });
                
                // Additional assertions
                const isPanelOpen = await page.$('.side-panel--open');
                if (!isPanelOpen) {
                    throw new Error('Settings panel did not open');
                }
            }
        },
        {
            // Add more scenarios as needed
            given: 'Settings panel is open',
            when: 'User presses Escape key',
            then: 'Settings panel should close',
            test: async (page) => {
                // Assuming previous scenario ran
                await page.keyboard.press('Escape');
                
                // Wait for panel to close
                await page.waitForSelector('.side-panel:not(.side-panel--open)');
            }
        }
    ]
};

/**
 * Best Practices:
 * 
 * 1. Use data-test attributes for reliable selectors:
 *    <button data-test="save-button">Save</button>
 * 
 * 2. Always wait for elements before interacting:
 *    await page.waitForSelector('.element');
 *    await page.click('.element');
 * 
 * 3. Use meaningful error messages:
 *    throw new Error('Expected 3 columns but found 2');
 * 
 * 4. Test both success and failure paths
 * 
 * 5. Keep scenarios focused on single behaviors
 * 
 * 6. Use mocks for external dependencies (APIs, etc)
 * 
 * 7. Clean up test data in teardown if needed
 */