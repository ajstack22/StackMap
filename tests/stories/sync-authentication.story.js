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
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
                
                // Wait for app to fully load
                await page.waitForSelector('.main-container', { timeout: 10000 });
                
                // Wait for FABs to be created
                await page.waitForTimeout(2000);
                
                // Click the right FAB using evaluate (Puppeteer's click doesn't work properly)
                await page.evaluate(() => {
                    const btn = document.getElementById('hybridManageBtn');
                    if (btn) btn.click();
                });
                
                // Wait for panel animation
                await page.waitForTimeout(500);
                
                // Wait for panel to open
                await page.waitForSelector('#hybridRightPanel.open', { 
                    timeout: 10000 
                });
                
                // Find and click Settings menu item
                const settingsClicked = await page.evaluate(() => {
                    const menuItems = Array.from(document.querySelectorAll('.menu-item'));
                    const settingsItem = menuItems.find(item => {
                        const text = item.textContent || '';
                        return text.includes('Settings') || text.includes('settings');
                    });
                    
                    if (settingsItem) {
                        settingsItem.click();
                        return true;
                    }
                    
                    return false;
                });
                
                if (!settingsClicked) {
                    throw new Error('Settings menu item not found');
                }
                
                // Wait for settings content to load
                await page.waitForTimeout(500);
                
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
                // Check if sync toggle exists
                const syncToggleExists = await page.$('#syncToggle');
                
                if (!syncToggleExists) {
                    throw new Error('Sync toggle not found - settings panel may have closed');
                }
                
                // Get current state
                const isChecked = await page.evaluate(() => {
                    const toggle = document.querySelector('#syncToggle');
                    return toggle ? toggle.checked : null;
                });
                
                if (isChecked === null) {
                    throw new Error('Could not read sync toggle state');
                }
                
                if (!isChecked) {
                    // Turn it on first
                    await page.click('#syncToggle');
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
                if (disconnectErrors.length > 0) {
                    throw new Error(`Disconnect error: ${disconnectErrors[0]}`);
                }
            }
        }
    ]
};