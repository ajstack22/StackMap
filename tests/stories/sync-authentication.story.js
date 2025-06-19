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
                
                // Click the right FAB using evaluate
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
                
                // Enter grownup mode by answering validation question
                const validationAnswered = await page.evaluate(() => {
                    const input = document.getElementById('validationInput');
                    const submit = document.getElementById('validationSubmit');
                    const questionLabel = document.getElementById('validationQuestionLabel');
                    
                    if (!input || !submit || !questionLabel) return false;
                    
                    const question = questionLabel.textContent;
                    let answer = '';
                    
                    // Answer based on the specific questions used in StackMap
                    if (question.includes("What's the first letter of the alphabet")) {
                        answer = "A";
                    } else if (question.includes("What comes after 2")) {
                        answer = "3";
                    } else if (question.includes("How many days are in a week")) {
                        answer = "7";
                    } else if (question.includes("What color do you get when you mix red and blue")) {
                        answer = "PURPLE";
                    } else if (question.includes("What's 5 + 5")) {
                        answer = "10";
                    } else if (question.includes("What's the opposite of 'hot'")) {
                        answer = "COLD";
                    }
                    
                    if (answer) {
                        input.value = answer;
                        submit.click();
                        return true;
                    }
                    return false;
                });
                
                if (!validationAnswered) {
                    throw new Error('Could not answer validation question');
                }
                
                // Wait for edit mode to activate
                await page.waitForTimeout(1000);
                
                // Now click on Google Drive Sync
                const syncClicked = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('.admin-btn'));
                    const syncButton = buttons.find(btn => 
                        btn.textContent.includes('Google Drive Sync')
                    );
                    if (syncButton) {
                        syncButton.click();
                        return true;
                    }
                    return false;
                });
                
                if (!syncClicked) {
                    throw new Error('Google Drive Sync button not found');
                }
                
                // Wait for sync settings to load
                await page.waitForTimeout(500);
                
                // Look for sign in button or sync status
                const hasSignInButton = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.some(btn => btn.textContent.includes('Sign in with Google'));
                });
                
                // Clear any existing errors
                errors.length = 0;
                
                if (hasSignInButton) {
                    // Click sign in button
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const signInBtn = buttons.find(btn => btn.textContent.includes('Sign in with Google'));
                        if (signInBtn) signInBtn.click();
                    });
                } else {
                    // Already signed in, click sync now
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const syncBtn = buttons.find(btn => btn.textContent.includes('Sync Now'));
                        if (syncBtn) syncBtn.click();
                    });
                }
                
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
            given: 'User can interact with sync settings',
            when: 'User clicks sync-related buttons',
            then: 'No errors should occur',
            test: async (page) => {
                // Check if we're still on the sync settings page
                const isOnSyncSettings = await page.evaluate(() => {
                    return !!document.querySelector('.sync-settings');
                });
                
                if (!isOnSyncSettings) {
                    throw new Error('Sync settings page closed - test cannot continue');
                }
                
                // Set up error capture
                const syncErrors = [];
                page.on('console', msg => {
                    if (msg.type() === 'error') {
                        syncErrors.push(msg.text());
                    }
                });
                
                // Check what buttons are available
                const availableButtons = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('.sync-settings button'));
                    return buttons.map(btn => btn.textContent.trim());
                });
                
                console.log('Available sync buttons:', availableButtons);
                
                // Try clicking the first non-back button if available
                const clicked = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('.sync-settings button'));
                    const actionBtn = buttons.find(btn => 
                        !btn.textContent.includes('Back') && 
                        !btn.disabled
                    );
                    if (actionBtn) {
                        actionBtn.click();
                        return true;
                    }
                    return false;
                });
                
                if (clicked) {
                    await page.waitForTimeout(1000);
                }
                
                // Check that no critical errors occurred
                const criticalErrors = syncErrors.filter(e => 
                    e.includes('authenticate is not a function') ||
                    e.includes('disconnect is not a function') ||
                    e.includes('Cannot read properties of undefined')
                );
                
                if (criticalErrors.length > 0) {
                    throw new Error(`Sync error: ${criticalErrors[0]}`);
                }
            }
        }
    ]
};