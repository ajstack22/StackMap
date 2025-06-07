// DORMANT-2025-01-06: Header no longer expandable
// test-expandable-header.js
// Test suite for expandable header functionality (Story: Phase 6)

(function() {
    'use strict';
    
    const TestExpandableHeader = {
        run() {
            console.log('=== EXPANDABLE HEADER TEST SUITE ===');
            console.log('Running comprehensive tests...\n');
            
            const results = {
                passed: 0,
                failed: 0,
                tests: []
            };
            
            // Test 1: Component Initialization
            this.testComponentInitialization(results);
            
            // Test 2: DOM Elements Presence
            this.testDOMElements(results);
            
            // Test 3: Touch Target Sizes
            this.testTouchTargets(results);
            
            // Test 4: Calendar Icon Generation
            this.testCalendarIcons(results);
            
            // Test 5: State Integration
            this.testStateIntegration(results);
            
            // Test 6: Accessibility Compliance
            this.testAccessibility(results);
            
            // Test 7: Expansion/Collapse Functionality
            this.testExpansionFunctionality(results);
            
            // Test 8: User Selection
            this.testUserSelection(results);
            
            // Test 9: Day Selection
            this.testDaySelection(results);
            
            // Test 10: Mobile Responsiveness
            this.testMobileResponsiveness(results);
            
            // Display results
            this.displayResults(results);
        },
        
        testComponentInitialization(results) {
            const testName = 'Component Initialization';
            try {
                const staticHeader = window.appInstance?.staticExpandableHeader;
                const fixedHeader = window.appInstance?.fixedExpandableHeader;
                
                if (staticHeader && fixedHeader) {
                    results.passed++;
                    results.tests.push({ name: testName, status: 'PASS', message: 'Both headers initialized' });
                } else {
                    results.failed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'FAIL', 
                        message: `Static: ${!!staticHeader}, Fixed: ${!!fixedHeader}` 
                    });
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testDOMElements(results) {
            const testName = 'DOM Elements Presence';
            try {
                const elements = {
                    'Static Logo': document.getElementById('staticLogoContainer'),
                    'Static Indicator': document.getElementById('staticExpansionIndicator'),
                    'Static Submenu': document.getElementById('staticSubmenuContainer'),
                    'Fixed Logo': document.getElementById('fixedLogoContainer'),
                    'Fixed Indicator': document.getElementById('fixedExpansionIndicator'),
                    'Fixed Submenu': document.getElementById('fixedSubmenuContainer')
                };
                
                let allPresent = true;
                const missing = [];
                
                for (const [name, element] of Object.entries(elements)) {
                    if (!element) {
                        allPresent = false;
                        missing.push(name);
                    }
                }
                
                if (allPresent) {
                    results.passed++;
                    results.tests.push({ name: testName, status: 'PASS', message: 'All elements present' });
                } else {
                    results.failed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'FAIL', 
                        message: `Missing: ${missing.join(', ')}` 
                    });
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testTouchTargets(results) {
            const testName = 'Touch Target Sizes';
            try {
                const indicators = [
                    document.getElementById('staticExpansionIndicator'),
                    document.getElementById('fixedExpansionIndicator')
                ];
                
                let allValid = true;
                const issues = [];
                
                indicators.forEach((indicator, index) => {
                    if (indicator) {
                        const rect = indicator.getBoundingClientRect();
                        const height = rect.height;
                        
                        if (height < 44) {
                            allValid = false;
                            issues.push(`${index === 0 ? 'Static' : 'Fixed'}: ${height}px (needs 44px+)`);
                        }
                    }
                });
                
                if (allValid) {
                    results.passed++;
                    results.tests.push({ name: testName, status: 'PASS', message: 'All indicators ≥ 44px' });
                } else {
                    results.failed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'FAIL', 
                        message: issues.join(', ') 
                    });
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testCalendarIcons(results) {
            const testName = 'Calendar Icon Generation';
            try {
                const header = window.appInstance?.staticExpandableHeader;
                if (!header) {
                    throw new Error('Header not initialized');
                }
                
                // Test icon generation
                const icon = header.generateCalendarIcon(15, '#667eea');
                const hasValidSVG = icon.includes('<svg') && icon.includes('</svg>');
                const hasNumber = icon.includes('>15<');
                const hasColor = icon.includes('#667eea');
                
                if (hasValidSVG && hasNumber && hasColor) {
                    results.passed++;
                    results.tests.push({ name: testName, status: 'PASS', message: 'Icons generate correctly' });
                } else {
                    results.failed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'FAIL', 
                        message: `SVG: ${hasValidSVG}, Number: ${hasNumber}, Color: ${hasColor}` 
                    });
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testStateIntegration(results) {
            const testName = 'State Integration';
            try {
                const currentUser = window.appInstance?.appState?.getCurrentUser();
                const currentDay = window.appInstance?.appState?.getCurrentDay();
                
                if (currentUser && currentDay) {
                    results.passed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'PASS', 
                        message: `User: ${currentUser.name}, Day: ${currentDay}` 
                    });
                } else {
                    results.failed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'FAIL', 
                        message: 'Missing user or day state' 
                    });
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testAccessibility(results) {
            const testName = 'Accessibility Compliance';
            try {
                const indicator = document.getElementById('staticExpansionIndicator');
                if (!indicator) {
                    throw new Error('Indicator not found');
                }
                
                const checks = {
                    'role': indicator.getAttribute('role') === 'button',
                    'tabindex': indicator.getAttribute('tabindex') === '0',
                    'aria-label': !!indicator.getAttribute('aria-label'),
                    'aria-expanded': indicator.hasAttribute('aria-expanded')
                };
                
                const failed = Object.entries(checks)
                    .filter(([, value]) => !value)
                    .map(([key]) => key);
                
                if (failed.length === 0) {
                    results.passed++;
                    results.tests.push({ name: testName, status: 'PASS', message: 'All ARIA attributes present' });
                } else {
                    results.failed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'FAIL', 
                        message: `Missing: ${failed.join(', ')}` 
                    });
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testExpansionFunctionality(results) {
            const testName = 'Expansion/Collapse';
            try {
                const header = window.appInstance?.staticExpandableHeader;
                if (!header) {
                    throw new Error('Header not initialized');
                }
                
                // Test expansion
                const initialState = header.isExpanded;
                header.expand();
                const expandedState = header.isExpanded;
                
                // Test collapse
                header.collapse();
                const collapsedState = header.isExpanded;
                
                if (!initialState && expandedState && !collapsedState) {
                    results.passed++;
                    results.tests.push({ name: testName, status: 'PASS', message: 'Expand/collapse works' });
                } else {
                    results.failed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'FAIL', 
                        message: `Initial: ${initialState}, Expanded: ${expandedState}, Collapsed: ${collapsedState}` 
                    });
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testUserSelection(results) {
            const testName = 'User Selection Display';
            try {
                const userSelector = document.getElementById('staticSubmenuUserSelector');
                if (!userSelector) {
                    throw new Error('User selector not found');
                }
                
                const currentUserDisplay = userSelector.querySelector('.submenu-user-current');
                const userList = userSelector.querySelector('.submenu-user-list');
                
                if (currentUserDisplay && userList) {
                    results.passed++;
                    results.tests.push({ name: testName, status: 'PASS', message: 'User UI rendered' });
                } else {
                    results.failed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'FAIL', 
                        message: 'Missing user selection elements' 
                    });
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testDaySelection(results) {
            const testName = 'Day Selection Display';
            try {
                const daySelector = document.getElementById('staticSubmenuDaySelector');
                if (!daySelector) {
                    throw new Error('Day selector not found');
                }
                
                const dayOptions = daySelector.querySelectorAll('.submenu-day-option');
                const hasToday = Array.from(dayOptions).some(opt => opt.textContent.includes('Today'));
                const hasTomorrow = Array.from(dayOptions).some(opt => opt.textContent.includes('Tomorrow'));
                
                if (dayOptions.length === 2 && hasToday && hasTomorrow) {
                    results.passed++;
                    results.tests.push({ name: testName, status: 'PASS', message: 'Day options rendered' });
                } else {
                    results.failed++;
                    results.tests.push({ 
                        name: testName, 
                        status: 'FAIL', 
                        message: `Options: ${dayOptions.length}, Today: ${hasToday}, Tomorrow: ${hasTomorrow}` 
                    });
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        testMobileResponsiveness(results) {
            const testName = 'Mobile Responsiveness';
            try {
                const isMobile = window.innerWidth <= 768;
                const indicator = document.getElementById('staticExpansionIndicator');
                
                if (indicator) {
                    const styles = window.getComputedStyle(indicator);
                    const fontSize = parseFloat(styles.fontSize);
                    
                    if (isMobile && fontSize < 16) {
                        results.passed++;
                        results.tests.push({ 
                            name: testName, 
                            status: 'PASS', 
                            message: 'Mobile styles applied' 
                        });
                    } else if (!isMobile) {
                        results.passed++;
                        results.tests.push({ 
                            name: testName, 
                            status: 'PASS', 
                            message: 'Desktop mode' 
                        });
                    } else {
                        results.failed++;
                        results.tests.push({ 
                            name: testName, 
                            status: 'FAIL', 
                            message: 'Mobile styles not applied' 
                        });
                    }
                } else {
                    throw new Error('Indicator not found');
                }
            } catch (error) {
                results.failed++;
                results.tests.push({ name: testName, status: 'ERROR', message: error.message });
            }
        },
        
        displayResults(results) {
            console.log('\n=== TEST RESULTS ===');
            console.log(`Total Tests: ${results.tests.length}`);
            console.log(`Passed: ${results.passed} ✅`);
            console.log(`Failed: ${results.failed} ❌`);
            console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%\n`);
            
            console.log('Detailed Results:');
            results.tests.forEach(test => {
                const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
                console.log(`${icon} ${test.name}: ${test.message}`);
            });
            
            console.log('\n=== END OF TEST SUITE ===');
            
            return results;
        }
    };
    
    // Make available globally
    window.TestExpandableHeader = TestExpandableHeader;
    
    // Auto-run if requested
    if (window.location.search.includes('test=expandable')) {
        setTimeout(() => TestExpandableHeader.run(), 1000);
    }
})();

// Quick test command
window.testExpandable = function() {
    return window.TestExpandableHeader.run();
};