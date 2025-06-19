const { getTestUrl } = require('./config');

module.exports = {
    title: 'Debug panel opening mechanism',
    issue: '#debug',
    priority: 'critical',
    tags: ['debug'],
    
    scenarios: [
        {
            given: 'User is on the main page',
            when: 'User clicks the FAB button',
            then: 'Panel should open with correct class',
            test: async (page) => {
                // Navigate to app
                await page.goto(getTestUrl(), { 
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
                
                // Wait for app to load
                await page.waitForSelector('.main-container', { timeout: 10000 });
                
                // Wait longer for full initialization
                await page.waitForTimeout(2000);
                
                // Debug: Check FAB button state
                const fabState = await page.evaluate(() => {
                    const rightFab = document.getElementById('hybridManageBtn');
                    const leftFab = document.getElementById('hybridPreferencesBtn');
                    
                    // Check if click handlers are attached
                    const hasClickHandler = (elem) => {
                        if (!elem) return false;
                        // Check for onclick attribute
                        if (elem.onclick) return true;
                        // Check for event listeners (this is approximate)
                        const events = elem._events || window.getEventListeners?.(elem);
                        return !!events;
                    };
                    
                    return {
                        rightFab: {
                            exists: !!rightFab,
                            id: rightFab?.id,
                            className: rightFab?.className,
                            onclick: !!rightFab?.onclick,
                            hasHandler: hasClickHandler(rightFab),
                            disabled: rightFab?.disabled
                        },
                        leftFab: {
                            exists: !!leftFab,
                            id: leftFab?.id,
                            className: leftFab?.className,
                            onclick: !!leftFab?.onclick,
                            hasHandler: hasClickHandler(leftFab),
                            disabled: leftFab?.disabled
                        },
                        hybridPanelManager: {
                            exists: typeof window.hybridPanelManager !== 'undefined',
                            initialized: window.hybridPanelManager?.initialized
                        }
                    };
                });
                
                console.log('FAB State:', JSON.stringify(fabState, null, 2));
                
                // Try clicking with different methods
                console.log('Attempting click via page.click()...');
                await page.click('#hybridManageBtn');
                await page.waitForTimeout(1000);
                
                // Check panel state after click
                let panelState = await page.evaluate(() => {
                    const panel = document.getElementById('hybridRightPanel');
                    return {
                        exists: !!panel,
                        className: panel?.className,
                        hasOpenClass: panel?.classList.contains('open'),
                        display: window.getComputedStyle(panel)?.display,
                        visibility: window.getComputedStyle(panel)?.visibility
                    };
                });
                
                console.log('Panel state after page.click():', JSON.stringify(panelState, null, 2));
                
                if (!panelState.hasOpenClass) {
                    console.log('Panel did not open with page.click(), trying evaluate click...');
                    
                    // Try clicking via evaluate
                    await page.evaluate(() => {
                        const btn = document.getElementById('hybridManageBtn');
                        if (btn) {
                            btn.click();
                        }
                    });
                    
                    await page.waitForTimeout(1000);
                    
                    panelState = await page.evaluate(() => {
                        const panel = document.getElementById('hybridRightPanel');
                        return {
                            exists: !!panel,
                            className: panel?.className,
                            hasOpenClass: panel?.classList.contains('open'),
                            display: window.getComputedStyle(panel)?.display,
                            visibility: window.getComputedStyle(panel)?.visibility
                        };
                    });
                    
                    console.log('Panel state after evaluate click:', JSON.stringify(panelState, null, 2));
                }
                
                if (!panelState.hasOpenClass) {
                    console.log('Panel still not open, trying direct method call...');
                    
                    // Try calling the method directly
                    await page.evaluate(() => {
                        if (window.hybridPanelManager && window.hybridPanelManager.openPanel) {
                            window.hybridPanelManager.openPanel('right');
                        }
                    });
                    
                    await page.waitForTimeout(1000);
                    
                    panelState = await page.evaluate(() => {
                        const panel = document.getElementById('hybridRightPanel');
                        return {
                            exists: !!panel,
                            className: panel?.className,
                            hasOpenClass: panel?.classList.contains('open'),
                            display: window.getComputedStyle(panel)?.display,
                            visibility: window.getComputedStyle(panel)?.visibility
                        };
                    });
                    
                    console.log('Panel state after direct method call:', JSON.stringify(panelState, null, 2));
                }
                
                // Final check
                if (!panelState.hasOpenClass) {
                    throw new Error('Panel failed to open with any method');
                }
            }
        }
    ]
};