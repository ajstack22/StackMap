const GoogleDriveMock = require('../mocks/google-drive-mock');
const { getTestUrl } = require('./config');

module.exports = {
    title: 'Drive sync uses delta sync for incremental updates',
    issue: '#drive-sync-phase3',
    priority: 'critical',
    tags: ['sync', 'delta-sync', 'performance'],
    
    setup: async (page) => {
        // Inject Google Drive mock before page loads
        const mock = new GoogleDriveMock();
        await mock.inject(page);
    },
    
    scenarios: [
        {
            given: 'User is signed in with initial data synced',
            when: 'User adds a new activity',
            then: 'Only delta changes should be uploaded, not full data',
            test: async (page) => {
                // Navigate to app
                await page.goto(getTestUrl(), { 
                    waitUntil: 'networkidle2' 
                });
                
                // Wait for app to load
                await page.waitForSelector('.main-container');
                
                // Sign in to mock Google Drive
                await page.evaluate(() => {
                    // Simulate sign in
                    window.__driveMock.setSignedIn(true);
                });
                
                // Enable sync
                await page.click('.floating-nav--right .fab');
                await page.waitForSelector('.side-panel.open', { timeout: 30000 });
                
                await page.evaluate(() => {
                    const menuItems = Array.from(document.querySelectorAll('.menu-item'));
                    const settingsItem = menuItems.find(item => 
                        item.textContent.includes('Settings')
                    );
                    settingsItem?.click();
                });
                
                await page.waitForSelector('#syncToggle');
                await page.click('#syncToggle');
                
                // Wait for initial sync
                await page.waitForTimeout(2000);
                
                // Check that full data was uploaded initially
                const initialFiles = await page.evaluate(() => {
                    return Array.from(window.__driveMock.files.values())
                        .map(f => ({ name: f.name, size: f.content.length }));
                });
                
                const fullDataFile = initialFiles.find(f => f.name === 'stackmap-data.json');
                if (!fullDataFile) {
                    throw new Error('Initial full sync did not occur');
                }
                
                // Close settings
                await page.keyboard.press('Escape');
                await page.waitForSelector('.side-panel:not(.open)');
                
                // Add a new activity
                await page.click('.floating-nav--left .fab');
                await page.waitForSelector('.side-panel.open', { timeout: 30000 });
                
                // Click on "New Activity"
                await page.evaluate(() => {
                    const menuItems = Array.from(document.querySelectorAll('.menu-item'));
                    const newActivityItem = menuItems.find(item => 
                        item.textContent.includes('New Activity')
                    );
                    newActivityItem?.click();
                });
                
                // Fill in activity form
                await page.type('#activityName', 'Test Delta Sync');
                await page.click('.activity-emoji-selector .emoji-option');
                
                // Save activity
                await page.click('.primary-button');
                
                // Wait for sync
                await page.waitForTimeout(2000);
                
                // Check that delta file was created
                const afterFiles = await page.evaluate(() => {
                    return Array.from(window.__driveMock.files.values())
                        .map(f => ({ 
                            name: f.name, 
                            size: f.content.length,
                            content: f.content
                        }));
                });
                
                const deltaFiles = afterFiles.filter(f => 
                    f.name.includes('delta-') && f.name.endsWith('.json')
                );
                
                if (deltaFiles.length === 0) {
                    throw new Error('No delta sync file was created');
                }
                
                // Verify delta contains only the change
                const deltaContent = JSON.parse(deltaFiles[0].content);
                
                if (!deltaContent.operations || deltaContent.operations.length === 0) {
                    throw new Error('Delta file has no operations');
                }
                
                const addOp = deltaContent.operations.find(op => 
                    op.type === 'add' && op.path.includes('activities')
                );
                
                if (!addOp) {
                    throw new Error('Delta does not contain add activity operation');
                }
                
                // Verify delta is much smaller than full data
                if (deltaFiles[0].size > fullDataFile.size * 0.1) {
                    throw new Error('Delta file is too large - should be <10% of full data');
                }
            }
        },
        {
            given: 'Multiple changes have been made offline',
            when: 'Connection is restored',
            then: 'Changes should be batched into a single compressed delta',
            test: async (page) => {
                // Simulate offline mode
                await page.evaluate(() => {
                    window.__driveMock.setResponseSuccess(false);
                });
                
                // Make multiple changes
                for (let i = 0; i < 3; i++) {
                    await page.click('.card__icon');
                    await page.waitForTimeout(500);
                }
                
                // Check sync queue indicator
                const queueIndicator = await page.$('.sync-queue-indicator');
                if (!queueIndicator) {
                    throw new Error('Sync queue indicator not shown while offline');
                }
                
                // Restore connection
                await page.evaluate(() => {
                    window.__driveMock.setResponseSuccess(true);
                });
                
                // Trigger sync
                await page.evaluate(() => {
                    window.dispatchEvent(new Event('online'));
                });
                
                // Wait for sync
                await page.waitForTimeout(2000);
                
                // Verify batched delta was uploaded
                const files = await page.evaluate(() => {
                    return Array.from(window.__driveMock.files.values())
                        .filter(f => f.name.includes('delta-'))
                        .map(f => ({
                            name: f.name,
                            content: f.content
                        }));
                });
                
                const latestDelta = files[files.length - 1];
                const deltaData = JSON.parse(latestDelta.content);
                
                // Should have multiple operations batched
                if (deltaData.operations.length < 3) {
                    throw new Error('Delta should contain multiple batched operations');
                }
                
                // Check if compressed (has compression flag)
                if (deltaData.compressed === undefined) {
                    throw new Error('Large delta should be compressed');
                }
            }
        }
    ]
};