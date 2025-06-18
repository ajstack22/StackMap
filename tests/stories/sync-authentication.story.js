const { getTestUrl } = require('./config');

module.exports = {
    title: 'User can toggle sync without authentication errors',
    issue: '#sync-auth-fix',
    priority: 'critical',
    tags: ['sync', 'authentication', 'regression'],
    
    scenarios: [
        {
            given: 'User is on the main page with app loaded',
            when: 'User opens settings and toggles sync on',
            then: 'No authentication errors should occur',
            test: async (page) => {
                // Set up error capture
                const errors = [];
                page.on('console', msg => {
                    if (msg.type() === 'error') {
                        errors.push(msg.text());
                    }
                });
                
                page.on('pageerror', error => {
                    errors.push(error.message);
                });

                // Navigate to app
                await page.goto(getTestUrl(), { 
                    waitUntil: 'networkidle2' 
                });
                
                // Wait for app to fully load
                await page.waitForSelector('.main-container', { timeout: 10000 });
                
                // Wait for FABs to be created
                await page.waitForSelector('.floating-nav--right', { timeout: 10000 });
                
                // Open settings - click the right FAB (grown-up mode button)
                await page.click('.floating-nav--right .fab');
                
                // Wait for panel to open
                await page.waitForSelector('.side-panel.open', { timeout: 10000 });
                
                // Find and click Settings menu item
                await page.evaluate(() => {
                    const menuItems = Array.from(document.querySelectorAll('.menu-item'));
                    const settingsItem = menuItems.find(item => 
                        item.textContent.includes('Settings')
                    );
                    if (settingsItem) {
                        settingsItem.click();
                    } else {
                        throw new Error('Settings menu item not found');
                    }
                });
                
                // Wait for sync toggle to appear
                await page.waitForSelector('#syncToggle', { timeout: 5000 });
                
                // Clear any existing errors
                errors.length = 0;
                
                // Toggle sync
                await page.click('#syncToggle');
                
                // Wait for any async operations
                await page.waitForTimeout(2000);
                
                // Check for authentication errors
                const authErrors = errors.filter(e => 
                    e.includes('authenticate is not a function') ||
                    e.includes('driveSync?.authenticate')
                );
                
                if (authErrors.length > 0) {
                    throw new Error(`Authentication error found: ${authErrors[0]}`);
                }
            }
        },
        {
            given: 'User has toggled sync on',
            when: 'User toggles sync off',
            then: 'Disconnect should work without errors',
            test: async (page) => {
                // Sync should already be on from previous test
                const syncToggle = await page.$('#syncToggle');
                const isChecked = await page.evaluate(el => el.checked, syncToggle);
                
                if (!isChecked) {
                    // Turn it on first
                    await syncToggle.click();
                    await page.waitForTimeout(1000);
                }
                
                
                // Set up error capture for disconnect
                const disconnectErrors = [];
                page.on('console', msg => {
                    if (msg.type() === 'error' && msg.text().includes('disconnect')) {
                        disconnectErrors.push(msg.text());
                    }
                });
                
                // Now turn it off
                await page.click('#syncToggle');
                await page.waitForTimeout(1000);
                
                // Check that no errors occurred
                const errors = disconnectErrors;
                
                if (errors.length > 0) {
                    throw new Error(`Disconnect error: ${errors[0]}`);
                }
            }
        }
    ]
};