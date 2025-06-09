// Story 015: Settings Footer Links Validation Script

function validateSettingsFooterLinks() {
    console.log('=== Story 015: Settings Footer Links Validation ===');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Check Right Panel Structure
    const rightPanel = document.querySelector('#hybridRightPanel');
    const doneButton = rightPanel?.querySelector('.panel-close');
    const footerLinks = rightPanel?.querySelector('.panel-footer-links');
    
    if (footerLinks) {
        console.log('✅ Footer links section exists');
        passed++;
        
        // Check if footer is after Done button
        let nextElement = doneButton?.nextElementSibling;
        while (nextElement && nextElement.nodeType !== 1) {
            nextElement = nextElement.nextElementSibling;
        }
        
        if (nextElement === footerLinks) {
            console.log('✅ Links positioned after Done button');
            passed++;
        } else {
            console.log('❌ Links not properly positioned after Done button');
            failed++;
        }
    } else {
        console.log('❌ Footer links section not found');
        failed += 2;
    }
    
    // Test 2: Validate All Three Links
    const expectedLinks = [
        { text: '💖 Support Us', href: 'support.html', hasEmoji: true },
        { text: 'Terms of Service', href: 'terms.html', hasEmoji: false },
        { text: 'Privacy Policy', href: 'privacy.html', hasEmoji: false }
    ];
    
    const footerLinksElements = document.querySelectorAll('.panel-footer-link');
    
    if (footerLinksElements.length === 3) {
        console.log('✅ All three links present');
        passed++;
        
        footerLinksElements.forEach((link, index) => {
            const expected = expectedLinks[index];
            const linkText = link.textContent.trim();
            
            // Check text content
            if (linkText === expected.text) {
                console.log(`✅ ${expected.text} text correct`);
                passed++;
            } else {
                console.log(`❌ ${expected.text} text incorrect (got: "${linkText}")`);
                failed++;
            }
            
            // Check href
            if (link.getAttribute('href') === expected.href) {
                console.log(`✅ ${expected.text} URL correct`);
                passed++;
            } else {
                console.log(`❌ ${expected.text} URL incorrect`);
                failed++;
            }
            
            // Check target attribute
            if (link.getAttribute('target') === '_blank') {
                console.log(`✅ ${expected.text} opens in new tab`);
                passed++;
            } else {
                console.log(`❌ ${expected.text} missing target="_blank"`);
                failed++;
            }
            
            // Check security attributes
            if (link.getAttribute('rel') === 'noopener noreferrer') {
                console.log(`✅ ${expected.text} has security attributes`);
                passed++;
            } else {
                console.log(`❌ ${expected.text} missing security attributes`);
                failed++;
            }
            
            // Check ARIA label
            if (link.getAttribute('aria-label')) {
                console.log(`✅ ${expected.text} has ARIA label`);
                passed++;
            } else {
                console.log(`❌ ${expected.text} missing ARIA label`);
                failed++;
            }
            
            // Check touch target
            const linkHeight = link.offsetHeight;
            if (linkHeight >= 44) {
                console.log(`✅ ${expected.text} meets touch target (${linkHeight}px)`);
                passed++;
            } else {
                console.log(`❌ ${expected.text} too small (${linkHeight}px, needs 44px)`);
                failed++;
            }
        });
    } else {
        console.log(`❌ Expected 3 links, found ${footerLinksElements.length}`);
        failed++;
    }
    
    // Test 3: Visual Separator
    const separator = document.querySelector('.panel-links-separator');
    if (separator) {
        console.log('✅ Visual separator present');
        passed++;
    } else {
        console.log('❌ Visual separator missing');
        failed++;
    }
    
    // Test 4: Check CSS styling
    if (footerLinksElements.length > 0) {
        const firstLink = footerLinksElements[0];
        const computedStyle = window.getComputedStyle(firstLink);
        
        // Check basic styling
        if (computedStyle.display === 'block') {
            console.log('✅ Links have correct display property');
            passed++;
        } else {
            console.log('❌ Links have incorrect display property');
            failed++;
        }
        
        if (computedStyle.textAlign === 'center') {
            console.log('✅ Links have centered text');
            passed++;
        } else {
            console.log('❌ Links text not centered');
            failed++;
        }
    }
    
    // Summary
    console.log(`\n📊 Settings Footer Links Results: ${passed} passed, ${failed} failed`);
    console.log(`✨ Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    return failed === 0;
}

// Helper function to open right panel for testing
function openSettingsPanel() {
    if (window.hybridPanelManager) {
        window.hybridPanelManager.openPanel('right');
        console.log('Settings panel opened for testing');
        
        // Wait for panel to fully open before running validation
        setTimeout(() => {
            validateSettingsFooterLinks();
        }, 500);
    } else {
        console.error('HybridPanelManager not found. Make sure the app is loaded.');
    }
}

// Add to global scope for easy testing
window.validateSettingsFooterLinks = validateSettingsFooterLinks;
window.testStory015 = openSettingsPanel;

console.log('Story 015 validation script loaded.');
console.log('Use testStory015() to open settings panel and run validation');