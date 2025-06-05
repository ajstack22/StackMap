// Automated Story 5 Test Runner
// This script will run all Story 5 tests and output results

async function runStory5TestsAutomated() {
    console.log('🚀 Starting Story 5 Automated Tests...\n');
    
    // Wait for app to be fully loaded
    await new Promise(resolve => {
        if (window.appInstance && window.appInstance.appState) {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });
    
    // Give UI time to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Run the tests
    console.log('📊 Test Results:\n');
    
    // 1. Check if Story 5 components are loaded
    const hasModernUserSelector = typeof window.ModernUserSelector === 'function';
    const hasModernDaySelector = typeof window.ModernDaySelector === 'function';
    const hasStory5Tests = typeof window.testStory5 === 'function';
    
    console.log('Component Loading:');
    console.log(`  - ModernUserSelector: ${hasModernUserSelector ? '✅ Loaded' : '❌ Not loaded'}`);
    console.log(`  - ModernDaySelector: ${hasModernDaySelector ? '✅ Loaded' : '❌ Not loaded'}`);
    console.log(`  - Story5 Test Suite: ${hasStory5Tests ? '✅ Loaded' : '❌ Not loaded'}`);
    
    // 2. Check if components are rendered
    const userSelectorRendered = document.querySelector('.user-selector-modern');
    const daySelectorRendered = document.querySelector('.day-selector-modern');
    
    console.log('\nComponent Rendering:');
    console.log(`  - User Selector: ${userSelectorRendered ? '✅ Rendered' : '❌ Not rendered'}`);
    console.log(`  - Day Selector: ${daySelectorRendered ? '✅ Rendered' : '❌ Not rendered'}`);
    
    // 3. Run full test suite if available
    if (hasStory5Tests) {
        console.log('\n🧪 Running Full Test Suite...\n');
        await window.testStory5();
    } else {
        console.log('\n⚠️ Story 5 test suite not available, running basic checks...\n');
        
        // Basic functionality checks
        if (userSelectorRendered) {
            console.log('User Selector Basic Checks:');
            const dropdown = userSelectorRendered.querySelector('.dropdown-modal');
            console.log(`  - Has dropdown modal: ${dropdown ? '✅' : '❌'}`);
            
            const ariaAttrs = userSelectorRendered.getAttribute('aria-haspopup') && 
                            userSelectorRendered.getAttribute('role');
            console.log(`  - Has ARIA attributes: ${ariaAttrs ? '✅' : '❌'}`);
            
            const rect = userSelectorRendered.getBoundingClientRect();
            console.log(`  - Touch target size: ${rect.height >= 44 ? '✅' : '❌'} (${rect.height}px)`);
        }
        
        if (daySelectorRendered) {
            console.log('\nDay Selector Basic Checks:');
            const modal = document.querySelector('.day-modal');
            console.log(`  - Has day modal: ${modal ? '✅' : '❌'}`);
            
            const ariaAttrs = daySelectorRendered.getAttribute('aria-haspopup') && 
                            daySelectorRendered.getAttribute('role');
            console.log(`  - Has ARIA attributes: ${ariaAttrs ? '✅' : '❌'}`);
            
            const rect = daySelectorRendered.getBoundingClientRect();
            console.log(`  - Touch target size: ${rect.height >= 44 ? '✅' : '❌'} (${rect.height}px)`);
        }
    }
    
    // 4. Test grownup mode for Add User option
    console.log('\n🔐 Testing Grownup Mode Integration...');
    const wasInGrownupMode = window.appInstance && window.appInstance.grownupMode;
    
    if (window.appInstance && !wasInGrownupMode) {
        // Enter grownup mode
        window.appInstance.enterGrownupMode();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if Add User option appears
        if (userSelectorRendered) {
            userSelectorRendered.click(); // Open dropdown
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const addUserOption = document.querySelector('[data-action="add-user"]');
            console.log(`  - Add User option in grownup mode: ${addUserOption ? '✅ Present' : '❌ Missing'}`);
            
            // Close dropdown
            userSelectorRendered.click();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Exit grownup mode
        window.appInstance.exitGrownupMode();
    } else {
        console.log('  - Grownup mode test skipped (already in grownup mode or app not loaded)');
    }
    
    // 5. Mobile responsiveness check
    console.log('\n📱 Mobile Responsiveness Check:');
    const viewport = document.querySelector('meta[name="viewport"]');
    console.log(`  - Viewport meta tag: ${viewport ? '✅' : '❌'}`);
    
    const isMobile = window.innerWidth < 768;
    console.log(`  - Current viewport: ${window.innerWidth}px (${isMobile ? 'Mobile' : 'Desktop'})`);
    
    // Summary
    console.log('\n📋 TEST SUMMARY:');
    console.log('==================');
    
    const allComponentsLoaded = hasModernUserSelector && hasModernDaySelector;
    const allComponentsRendered = userSelectorRendered && daySelectorRendered;
    
    if (allComponentsLoaded && allComponentsRendered) {
        console.log('✅ Story 5 implementation is working correctly!');
        console.log('   - All components loaded');
        console.log('   - All components rendered');
        console.log('   - Modern UI selectors are active');
    } else {
        console.log('❌ Story 5 implementation has issues:');
        if (!allComponentsLoaded) {
            console.log('   - Some components failed to load');
        }
        if (!allComponentsRendered) {
            console.log('   - Some components failed to render');
        }
    }
    
    console.log('\n🏁 Test run complete!');
    
    return {
        componentsLoaded: allComponentsLoaded,
        componentsRendered: allComponentsRendered,
        success: allComponentsLoaded && allComponentsRendered
    };
}

// Run tests automatically
runStory5TestsAutomated().then(result => {
    window.story5TestResult = result;
    console.log('\nTest result saved to window.story5TestResult');
});