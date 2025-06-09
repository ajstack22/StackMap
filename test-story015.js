// Story 015: Settings Footer Links Validation Script

function validateLearnMoreButton() {
    console.log('=== Story 015: Learn More Button Validation ===');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Check Preferences Panel Structure
    const leftPanel = document.querySelector('#hybridLeftPanel');
    const learnMoreButton = leftPanel?.querySelector('.learn-more-button');
    
    if (learnMoreButton) {
        console.log('✅ Learn More button exists in Preferences panel');
        passed++;
        
        // Check positioning
        const computedStyle = window.getComputedStyle(learnMoreButton);
        if (computedStyle.position === 'absolute' && computedStyle.top === '16px' && computedStyle.right === '16px') {
            console.log('✅ Button positioned in top-right corner');
            passed++;
        } else {
            console.log('❌ Button not properly positioned');
            failed++;
        }
    } else {
        console.log('❌ Learn More button not found in Preferences panel');
        failed += 2;
    }
    
    // Test 2: Validate Learn More Button
    const buttonLink = document.querySelector('.learn-more-button');
    
    if (buttonLink) {
        console.log('✅ Learn More button present');
        passed++;
        
        const linkText = buttonLink.textContent.trim();
        
        // Check text content
        if (linkText === 'Learn More') {
            console.log('✅ Link text correct');
            passed++;
        } else {
            console.log(`❌ Link text incorrect (got: "${linkText}")`);
            failed++;
        }
        
        // Check href
        if (buttonLink.getAttribute('href') === 'support.html') {
            console.log('✅ Button URL correct');
            passed++;
        } else {
            console.log('❌ Button URL incorrect');
            failed++;
        }
        
        // Check target attribute
        if (buttonLink.getAttribute('target') === '_blank') {
            console.log('✅ Button opens in new tab');
            passed++;
        } else {
            console.log('❌ Button missing target="_blank"');
            failed++;
        }
        
        // Check security attributes
        if (buttonLink.getAttribute('rel') === 'noopener noreferrer') {
            console.log('✅ Button has security attributes');
            passed++;
        } else {
            console.log('❌ Button missing security attributes');
            failed++;
        }
        
        // Check ARIA label
        if (buttonLink.getAttribute('aria-label')) {
            console.log('✅ Button has ARIA label');
            passed++;
        } else {
            console.log('❌ Button missing ARIA label');
            failed++;
        }
        
        // Check touch target (minimum height)
        const linkHeight = buttonLink.offsetHeight;
        if (linkHeight >= 36) {
            console.log(`✅ Button meets touch target (${linkHeight}px)`);
            passed++;
        } else {
            console.log(`❌ Button too small (${linkHeight}px, needs 36px minimum)`);
            failed++;
        }
    } else {
        console.log('❌ Learn More link not found');
        failed += 7;
    }
    
    // Test 3: Check Icon Presence
    const icon = buttonLink?.querySelector('.material-icons');
    if (icon && icon.textContent === 'info') {
        console.log('✅ Info icon present');
        passed++;
    } else {
        console.log('❌ Info icon missing or incorrect');
        failed++;
    }
    
    // Summary
    console.log(`\n📊 Learn More Button Results: ${passed} passed, ${failed} failed`);
    console.log(`✨ Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    return failed === 0;
}

// Helper function to open preferences panel for testing
function openPreferencesPanel() {
    if (window.hybridPanelManager) {
        window.hybridPanelManager.openPanel('left');
        console.log('Preferences panel opened for testing');
        
        // Wait for panel to fully open before running validation
        setTimeout(() => {
            validateLearnMoreButton();
        }, 500);
    } else {
        console.error('HybridPanelManager not found. Make sure the app is loaded.');
    }
}

// Add to global scope for easy testing
window.validateLearnMoreButton = validateLearnMoreButton;
window.testStory015 = openPreferencesPanel;

console.log('Story 015 validation script loaded.');
console.log('Use testStory015() to open preferences panel and run validation');