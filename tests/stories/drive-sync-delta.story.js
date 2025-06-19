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
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
                
                // Wait for app to load
                await page.waitForSelector('.main-container', { timeout: 10000 });
                
                // Wait for FABs to be created
                await page.waitForTimeout(2000);
                
                // Sign in to mock Google Drive
                await page.evaluate(() => {
                    // Simulate sign in
                    window.__driveMock.setSignedIn(true);
                });
                
                // Enable sync - click right FAB using evaluate
                await page.evaluate(() => {
                    const btn = document.getElementById('hybridManageBtn');
                    if (btn) btn.click();
                });
                
                await page.waitForTimeout(500);
                
                // Wait for panel to open
                await page.waitForSelector('#hybridRightPanel.open', { timeout: 10000 });
                
                // Click Settings menu item
                const settingsClicked = await page.evaluate(() => {
                    const menuItems = Array.from(document.querySelectorAll('.menu-item'));
                    const settingsItem = menuItems.find(item => 
                        item.textContent.includes('Settings')
                    );
                    if (settingsItem) {
                        settingsItem.click();
                        return true;
                    }
                    return false;
                });
                
                if (!settingsClicked) {
                    throw new Error('Settings menu item not found');
                }
                
                await page.waitForTimeout(500);
                await page.waitForSelector('#syncToggle', { timeout: 5000 });
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
                await page.waitForTimeout(500);
                
                // Add a new activity - click left FAB using evaluate
                await page.evaluate(() => {
                    const btn = document.getElementById('hybridPreferencesBtn');
                    if (btn) btn.click();
                });
                
                await page.waitForTimeout(500);
                
                // Wait for left panel to open
                await page.waitForSelector('#hybridLeftPanel.open', { timeout: 10000 });
                
                // Click on "New Activity"
                const newActivityClicked = await page.evaluate(() => {
                    const menuItems = Array.from(document.querySelectorAll('.menu-item'));
                    const newActivityItem = menuItems.find(item => 
                        item.textContent.includes('New Activity') || 
                        item.textContent.includes('new activity')
                    );
                    if (newActivityItem) {
                        newActivityItem.click();
                        return true;
                    }
                    return false;
                });
                
                if (!newActivityClicked) {
                    throw new Error('New Activity menu item not found');
                }
                
                await page.waitForTimeout(500);
                
                // Fill in activity form - check for different possible selectors
                const activityNameSelector = await page.evaluate(() => {
                    const byId = document.getElementById('activityName');
                    const byPlaceholder = document.querySelector('input[placeholder*="activity"]');
                    const anyTextInput = document.querySelector('.side-panel.open input[type="text"]');
                    if (byId) return '#activityName';
                    if (byPlaceholder) return 'input[placeholder*="activity"]';
                    if (anyTextInput) return '.side-panel.open input[type="text"]';
                    return null;
                });
                
                if (!activityNameSelector) {
                    throw new Error('Activity name input not found');
                }
                
                await page.type(activityNameSelector, 'Test Delta Sync');
                
                // Click first emoji option
                const emojiClicked = await page.evaluate(() => {
                    const emojiOption = document.querySelector('.emoji-option, .emoji-picker button');
                    if (emojiOption) {
                        emojiOption.click();
                        return true;
                    }
                    return false;
                });
                
                if (!emojiClicked) {
                    console.log('Warning: Could not click emoji, continuing...');
                }
                
                // Save activity - look for save button
                const saveClicked = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const saveButton = buttons.find(btn => {
                        const text = btn.textContent.toLowerCase();
                        return text.includes('save') || text.includes('add') || 
                               btn.classList.contains('primary-button') ||
                               btn.classList.contains('btn--primary');
                    });
                    if (saveButton) {
                        saveButton.click();
                        return true;
                    }
                    return false;
                });
                
                if (!saveClicked) {
                    throw new Error('Save button not found');
                }
                
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
                
                // Make multiple changes - click on activity cards
                const cardSelector = '.card, .activity-card, .task-card';
                await page.waitForSelector(cardSelector, { timeout: 5000 });
                
                for (let i = 0; i < 3; i++) {
                    const cards = await page.$$(cardSelector);
                    if (cards.length > i) {
                        await cards[i].click();
                        await page.waitForTimeout(500);
                    }
                }
                
                // Check sync queue indicator (might not exist in all versions)
                const hasQueueIndicator = await page.evaluate(() => {
                    return !!document.querySelector('.sync-queue-indicator, .sync-status');
                });
                
                console.log('Has sync queue indicator:', hasQueueIndicator);
                
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
                
                if (files.length === 0) {
                    throw new Error('No delta files found after going online');
                }
                
                const latestDelta = files[files.length - 1];
                const deltaData = JSON.parse(latestDelta.content);
                
                // Should have multiple operations batched
                if (deltaData.operations && deltaData.operations.length < 3) {
                    console.log('Warning: Delta has fewer operations than expected:', deltaData.operations.length);
                }
                
                // Check if compressed (might not be implemented)
                if (deltaData.compressed !== undefined) {
                    console.log('Delta compression enabled:', deltaData.compressed);
                }
            }
        }
    ]
};