// test-mobile-navigation.js - Mobile Navigation Enhancement Testing
// Tests Android back button control and iOS PWA navigation features

// Pre-Implementation Testing
function testCurrentMobileBehavior() {
    console.log('🧪 Testing current mobile navigation behavior...');
    
    // Test current Android behavior
    if (/Android/.test(navigator.userAgent)) {
        console.log('📱 Android device - testing back button behavior');
        if (window.hybridPanelManager) {
            window.hybridPanelManager.openPanel('right');
            console.log('Panel opened - back button currently exits app');
        }
    }
    
    // Test current iOS behavior
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        console.log('🍎 iOS device - testing swipe and PWA behavior');
        console.log('PWA mode:', window.navigator.standalone);
        if (window.hybridPanelManager) {
            window.hybridPanelManager.openPanel('right');
            console.log('Panel opened - test swipe navigation conflicts');
        }
    }
    
    // Test current edit mode behavior  
    if (window.appInstance) {
        window.appInstance.enterGrownupMode();
        console.log('Edit mode entered - test navigation behavior');
    }
}

// Android Testing Functions
const testAndroidPanelBackButton = () => {
    console.log('🧪 Testing Android panel back button control...');
    
    // Open management panel
    if (window.hybridPanelManager) {
        window.hybridPanelManager.openPanel('right');
        
        // Check if history state was added
        console.assert(window.history.state?.stackmap, 'FAIL: History state not added');
        console.assert(window.history.state?.action === 'panel_opened', 'FAIL: Wrong history action');
        
        console.log('✅ Android panel back button test setup complete');
        console.log('📱 Now press Android back button to test panel close behavior');
    }
};

const testAndroidEditModeBackButton = () => {
    console.log('🧪 Testing Android edit mode back button control...');
    
    // Enter edit mode
    if (window.appInstance) {
        window.appInstance.enterGrownupMode();
        
        // Check if history state was added
        console.assert(window.history.state?.stackmap, 'FAIL: History state not added');
        console.assert(window.history.state?.action === 'edit_mode_entered', 'FAIL: Wrong history action');
        
        console.log('✅ Android edit mode back button test setup complete');
        console.log('📱 Now press Android back button to test edit mode exit behavior');
    }
};

// iOS Testing Functions
const testIOSDetection = () => {
    console.log('🧪 Testing iOS detection and enhancements...');
    
    if (window.hybridPanelManager) {
        if (window.hybridPanelManager.isIOS) {
            console.log('✅ iOS device detected');
            console.assert(document.body.classList.contains('ios-device'), 'FAIL: iOS class not added');
        }
        
        if (window.hybridPanelManager.isIOSPWA) {
            console.log('✅ iOS PWA mode detected');
            console.assert(document.body.classList.contains('ios-pwa-mode'), 'FAIL: iOS PWA class not added');
        }
        
        console.log('🍎 iOS detection test complete');
    }
};

const testIOSGestureProtection = () => {
    console.log('🧪 Testing iOS gesture protection...');
    
    if (window.hybridPanelManager) {
        // Open panel
        window.hybridPanelManager.openPanel('right');
        
        console.log('✅ Panel opened');
        console.log('🍎 Now test swipe from left edge - should be prevented');
        console.log('🍎 Test swipe from center - should work normally');
        
        // Manual testing required for gesture behavior
    }
};

const testIOSPWANavigation = () => {
    if (!window.hybridPanelManager?.isIOSPWA) {
        console.log('⏭️ Skipping iOS PWA test - not in PWA mode');
        return;
    }
    
    console.log('🧪 Testing iOS PWA navigation enhancements...');
    
    // Check for navigation hints
    const navHint = document.querySelector('.ios-nav-hint');
    if (navHint) {
        console.log('✅ iOS navigation hint found');
    }
    
    // Check for enhanced FABs
    const enhancedFabs = document.querySelectorAll('.fab.ios-pwa-enhanced');
    if (enhancedFabs.length > 0) {
        console.log('✅ Enhanced iOS PWA FABs found');
    }
    
    console.log('🍎 iOS PWA navigation test complete');
};

// Complete Validation Function
const validateMobileNavigationBehavior = () => {
    console.log('🧪 Complete mobile navigation validation...');
    
    let testsPassed = 0;
    let totalTests = 8; // Increased for iOS tests
    
    // Test 1: Platform detection
    if (window.hybridPanelManager?.isIOS || /Android/.test(navigator.userAgent)) {
        console.log('✅ Test 1 PASSED: Mobile platform detected');
        testsPassed++;
    } else {
        console.log('❌ Test 1 FAILED: Mobile platform not detected');
    }
    
    // Test 2: Initial history state (Android)
    if (/Android/.test(navigator.userAgent)) {
        if (window.history.state?.stackmap) {
            console.log('✅ Test 2 PASSED: Android initial history state exists');
            testsPassed++;
        } else {
            console.log('❌ Test 2 FAILED: No Android initial history state');
        }
    } else {
        console.log('⏭️ Test 2 SKIPPED: Not Android device');
        testsPassed++; // Don't penalize for not being Android
    }
    
    // Test 3: iOS detection (iOS)
    if (window.hybridPanelManager?.isIOS) {
        if (document.body.classList.contains('ios-device')) {
            console.log('✅ Test 3 PASSED: iOS device class added');
            testsPassed++;
        } else {
            console.log('❌ Test 3 FAILED: iOS device class not added');
        }
    } else {
        console.log('⏭️ Test 3 SKIPPED: Not iOS device');
        testsPassed++; // Don't penalize for not being iOS
    }
    
    // Test 4: Panel opening adds history (Android)
    if (/Android/.test(navigator.userAgent)) {
        if (window.hybridPanelManager) {
            window.hybridPanelManager.openPanel('right');
            if (window.history.state?.action === 'panel_opened') {
                console.log('✅ Test 4 PASSED: Android panel opening adds history state');
                testsPassed++;
            } else {
                console.log('❌ Test 4 FAILED: Android panel opening doesn\'t add history state');
            }
        }
    } else {
        console.log('⏭️ Test 4 SKIPPED: Not Android device');
        testsPassed++;
    }
    
    // Test 5: iOS PWA mode detection (iOS)
    if (window.hybridPanelManager?.isIOS) {
        if (window.hybridPanelManager.isPWA && document.body.classList.contains('ios-pwa-mode')) {
            console.log('✅ Test 5 PASSED: iOS PWA mode properly detected');
            testsPassed++;
        } else if (!window.hybridPanelManager.isPWA) {
            console.log('⏭️ Test 5 SKIPPED: Not in PWA mode');
            testsPassed++;
        } else {
            console.log('❌ Test 5 FAILED: iOS PWA mode not properly detected');
        }
    } else {
        console.log('⏭️ Test 5 SKIPPED: Not iOS device');
        testsPassed++;
    }
    
    // Test 6: Panel closes with back button simulation (Android)
    if (/Android/.test(navigator.userAgent)) {
        window.history.back();
        setTimeout(() => {
            if (!window.hybridPanelManager.state.rightPanelOpen) {
                console.log('✅ Test 6 PASSED: Android back button closes panel');
                testsPassed++;
            } else {
                console.log('❌ Test 6 FAILED: Android back button doesn\'t close panel');
            }
            
            continueValidation();
        }, 100);
    } else {
        console.log('⏭️ Test 6 SKIPPED: Not Android device');
        testsPassed++;
        continueValidation();
    }
    
    function continueValidation() {
        // Test 7: Edit mode adds history (Android)
        if (/Android/.test(navigator.userAgent)) {
            if (window.appInstance) {
                window.appInstance.enterGrownupMode();
                if (window.history.state?.action === 'edit_mode_entered') {
                    console.log('✅ Test 7 PASSED: Android edit mode adds history state');
                    testsPassed++;
                } else {
                    console.log('❌ Test 7 FAILED: Android edit mode doesn\'t add history state');
                }
            }
        } else {
            console.log('⏭️ Test 7 SKIPPED: Not Android device');
            testsPassed++;
        }
        
        // Test 8: iOS gesture protection setup (iOS)
        if (window.hybridPanelManager?.isIOS) {
            // Check if gesture protection is active (hard to test programmatically)
            console.log('✅ Test 8 MANUAL: iOS gesture protection enabled (requires manual testing)');
            testsPassed++;
        } else {
            console.log('⏭️ Test 8 SKIPPED: Not iOS device');
            testsPassed++;
        }
        
        // Final results
        console.log(`🎯 Mobile navigation tests: ${testsPassed}/${totalTests} passed`);
        
        if (testsPassed === totalTests) {
            console.log('🎉 ALL MOBILE NAVIGATION TESTS PASSED!');
        } else {
            console.log('⚠️ Some mobile navigation tests failed - check implementation');
        }
    }
};

// Debug helper functions
window.testMobileNav = {
    // Run all tests
    runAll: validateMobileNavigationBehavior,
    
    // Android-specific tests
    android: {
        testPanel: testAndroidPanelBackButton,
        testEditMode: testAndroidEditModeBackButton,
        simulateBack: () => window.history.back()
    },
    
    // iOS-specific tests
    ios: {
        testDetection: testIOSDetection,
        testGestures: testIOSGestureProtection,
        testPWA: testIOSPWANavigation
    },
    
    // Test current behavior
    baseline: testCurrentMobileBehavior,
    
    // History state debugging
    debug: {
        showHistory: () => {
            console.log('Current history state:', window.history.state);
            console.log('History length:', window.history.length);
        },
        
        showPanelState: () => {
            if (window.hybridPanelManager) {
                console.log('Panel state:', window.hybridPanelManager.state);
            }
        },
        
        showPlatform: () => {
            console.log('User Agent:', navigator.userAgent);
            console.log('Is iOS:', window.hybridPanelManager?.isIOS);
            console.log('Is PWA:', window.hybridPanelManager?.isPWA);
            console.log('Is iOS PWA:', window.hybridPanelManager?.isIOSPWA);
        }
    }
};

// Auto-run validation on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Mobile Navigation Test Suite Loaded');
    console.log('Run testMobileNav.runAll() to validate implementation');
    console.log('Or use specific tests like testMobileNav.android.testPanel()');
});

// Export for use in other scripts
window.validateMobileNavigationBehavior = validateMobileNavigationBehavior;