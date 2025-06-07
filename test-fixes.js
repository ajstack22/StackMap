// DORMANT-2025-01-06: Generic fixes file, no clear purpose
// Test script to verify the fixes
(function() {
    'use strict';
    
    const TestFixes = {
        run() {
            console.log('=== TESTING STACKMAP FIXES ===\n');
            
            const results = {
                passed: 0,
                failed: 0,
                tests: []
            };
            
            // Test 1: Purple card type button size
            this.testCardTypeButtonSize(results);
            
            // Test 2: Drawer functionality
            this.testDrawerFunctionality(results);
            
            // Test 3: Tomorrow activities
            this.testTomorrowActivities(results);
            
            // Test 4: Header-drawer gap
            this.testHeaderDrawerGap(results);
            
            // Display results
            this.displayResults(results);
        },
        
        testCardTypeButtonSize(results) {
            const testName = 'Card Type Button Size';
            try {
                // Switch to grownup mode to see the button
                if (window.appInstance && !window.appInstance.grownupMode) {
                    window.appInstance.enterGrownupMode();
                }
                
                setTimeout(() => {
                    const typeButton = document.querySelector('.card__type-indicator');
                    if (typeButton) {
                        const styles = window.getComputedStyle(typeButton);
                        const width = parseFloat(styles.width);
                        const height = parseFloat(styles.height);
                        
                        if (width >= 44 && height >= 44) {
                            results.passed++;
                            results.tests.push({ 
                                name: testName, 
                                status: 'PASS', 
                                message: `Button size: ${width}x${height}px (should be 44x44)` 
                            });
                        } else {
                            results.failed++;
                            results.tests.push({ 
                                name: testName, 
                                status: 'FAIL', 
                                message: `Button size: ${width}x${height}px (expected 44x44)` 
                            });
                        }
                    } else {
                        results.failed++;
                        results.tests.push({ 
                            name: testName, 
                            status: 'FAIL', 
                            message: 'Card type button not found' 
                        });
                    }
                }, 500);
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testDrawerFunctionality(results) {
            const testName = 'Drawer Open/Close';
            try {
                const drawerHandle = document.getElementById('drawerHandle');
                const drawerExtension = document.getElementById('drawerExtension');
                const backdrop = document.querySelector('.drawer-backdrop');
                
                if (drawerHandle && drawerExtension && backdrop) {
                    // Test opening
                    drawerHandle.click();
                    
                    setTimeout(() => {
                        const isOpen = drawerExtension.classList.contains('open');
                        const backdropVisible = backdrop.classList.contains('visible');
                        
                        if (isOpen && backdropVisible) {
                            results.passed++;
                            results.tests.push({ 
                                name: testName, 
                                status: 'PASS', 
                                message: 'Drawer opens correctly' 
                            });
                            
                            // Close drawer
                            const doneBtn = document.getElementById('drawerDone');
                            if (doneBtn) doneBtn.click();
                        } else {
                            results.failed++;
                            results.tests.push({ 
                                name: testName, 
                                status: 'FAIL', 
                                message: `Open: ${isOpen}, Backdrop: ${backdropVisible}` 
                            });
                        }
                    }, 500);
                } else {
                    results.failed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'FAIL', 
                        message: 'Drawer elements not found' 
                    });
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testTomorrowActivities(results) {
            const testName = 'Tomorrow Activities';
            try {
                if (window.appInstance && window.appInstance.appState) {
                    const currentUser = window.appInstance.appState.getCurrentUser();
                    const tomorrowActivities = currentUser.tomorrowActivities || [];
                    
                    if (tomorrowActivities.length > 0) {
                        results.passed++;
                        results.tests.push({ 
                            name: testName, 
                            status: 'PASS', 
                            message: `${tomorrowActivities.length} tomorrow activities found` 
                        });
                    } else {
                        results.failed++;
                        results.tests.push({ 
                            name: testName, 
                            status: 'FAIL', 
                            message: 'No tomorrow activities found' 
                        });
                    }
                } else {
                    throw new Error('App instance not available');
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testHeaderDrawerGap(results) {
            const testName = 'Header-Drawer Gap';
            try {
                const header = document.getElementById('appHeader');
                const drawerExtension = document.getElementById('drawerExtension');
                
                if (header && drawerExtension) {
                    const headerRect = header.getBoundingClientRect();
                    const drawerStyles = window.getComputedStyle(drawerExtension);
                    const drawerTop = drawerStyles.top;
                    
                    // Check if drawer is positioned to prevent gap
                    if (drawerTop.includes('calc') || drawerTop === 'calc(100% - 1px)') {
                        results.passed++;
                        results.tests.push({ 
                            name: testName, 
                            status: 'PASS', 
                            message: 'Drawer positioned to prevent gap' 
                        });
                    } else {
                        results.failed++;
                        results.tests.push({ 
                            name: testName, 
                            status: 'FAIL', 
                            message: `Drawer top: ${drawerTop}` 
                        });
                    }
                } else {
                    results.failed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'FAIL', 
                        message: 'Header or drawer not found' 
                    });
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        displayResults(results) {
            setTimeout(() => {
                console.log('\n=== TEST RESULTS ===');
                console.log(`Total Tests: ${results.tests.length}`);
                console.log(`Passed: ${results.passed} ✅`);
                console.log(`Failed: ${results.failed} ❌`);
                console.log(`Success Rate: ${results.tests.length > 0 ? ((results.passed / results.tests.length) * 100).toFixed(1) : 0}%\n`);
                
                console.log('Detailed Results:');
                results.tests.forEach(test => {
                    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
                    console.log(`${icon} ${test.name}: ${test.message}`);
                });
                
                console.log('\n=== END OF TEST SUITE ===');
            }, 1500); // Wait for all async tests to complete
        }
    };
    
    // Make available globally
    window.TestFixes = TestFixes;
    
    // Auto-run if requested
    if (window.location.search.includes('test=fixes')) {
        setTimeout(() => TestFixes.run(), 1000);
    }
})();

// Quick test command
window.testFixes = function() {
    return window.TestFixes.run();
};