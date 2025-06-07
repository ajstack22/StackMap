// DORMANT-2025-01-06: Subtitle feature removed
// Console verification commands for subtitle centering fix

// AFTER FIX - Verify centering
function testSubtitleAfter() {
    const subtitle = document.querySelector('.subtitle');
    if (!subtitle) {
        console.log('❌ Subtitle element not found');
        return false;
    }
    
    const pageCenter = window.innerWidth / 2;
    const subtitleRect = subtitle.getBoundingClientRect();
    const subtitleCenter = subtitleRect.left + (subtitleRect.width / 2);
    const offset = subtitleCenter - pageCenter;
    
    console.log('=== SUBTITLE CENTERING TEST ===');
    console.log('Page center:', pageCenter + 'px');
    console.log('Subtitle center:', subtitleCenter + 'px');
    console.log('Offset from center:', offset.toFixed(1) + 'px');
    console.log('Transform applied:', getComputedStyle(subtitle).transform);
    console.log('Status:', Math.abs(offset) < 2 ? '✅ PERFECTLY CENTERED' : '❌ STILL OFF-CENTER');
    
    return Math.abs(offset) < 2; // Success if within 2px of center
}

// VISUAL ALIGNMENT TEST - Compare all header elements
function testVisualAlignment() {
    const elements = [
        { selector: '.stackmap-logo', name: 'Logo' },
        { selector: '.title', name: 'Title' }, 
        { selector: '.subtitle', name: 'Subtitle' },
        { selector: '.day-selector', name: 'Day Selector' }
    ];
    
    const pageCenter = window.innerWidth / 2;
    console.log('=== VISUAL ALIGNMENT TEST ===');
    console.log('True page center:', pageCenter + 'px');
    console.log('───────────────────────────────');
    
    elements.forEach(({ selector, name }) => {
        const el = document.querySelector(selector);
        if (el) {
            const rect = el.getBoundingClientRect();
            const elCenter = rect.left + (rect.width / 2);
            const offset = elCenter - pageCenter;
            const status = Math.abs(offset) < 5 ? '✅' : '❌';
            console.log(`${status} ${name}: center=${elCenter.toFixed(1)}px, offset=${offset.toFixed(1)}px`);
        } else {
            console.log(`❓ ${name}: element not found`);
        }
    });
    
    console.log('───────────────────────────────');
    return testSubtitleAfter();
}

// RESPONSIVE TEST - Check centering at different screen sizes
function testResponsiveCentering() {
    console.log('=== RESPONSIVE CENTERING TEST ===');
    console.log('Current viewport:', window.innerWidth + 'x' + window.innerHeight);
    
    const subtitle = document.querySelector('.subtitle');
    if (!subtitle) {
        console.log('❌ Subtitle element not found');
        return false;
    }
    
    const pageCenter = window.innerWidth / 2;
    const subtitleRect = subtitle.getBoundingClientRect();
    const subtitleCenter = subtitleRect.left + (subtitleRect.width / 2);
    const offset = subtitleCenter - pageCenter;
    
    let deviceType = 'Desktop';
    if (window.innerWidth <= 480) deviceType = 'Mobile';
    else if (window.innerWidth <= 768) deviceType = 'Tablet';
    else if (window.innerWidth <= 1024) deviceType = 'Small Desktop';
    
    console.log(`Device: ${deviceType} (${window.innerWidth}px)`);
    console.log(`Subtitle offset: ${offset.toFixed(1)}px`);
    console.log(`Status: ${Math.abs(offset) < 2 ? '✅ CENTERED' : '❌ OFF-CENTER'}`);
    
    return Math.abs(offset) < 2;
}

// COMPREHENSIVE TEST - Run all tests
function runSubtitleTests() {
    console.log('🔍 Running comprehensive subtitle centering tests...\n');
    
    const alignmentTest = testVisualAlignment();
    console.log('');
    const responsiveTest = testResponsiveCentering();
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('Visual alignment:', alignmentTest ? '✅ PASS' : '❌ FAIL');
    console.log('Responsive centering:', responsiveTest ? '✅ PASS' : '❌ FAIL');
    console.log('Overall status:', (alignmentTest && responsiveTest) ? '🎉 ALL TESTS PASSED' : '⚠️ ISSUES DETECTED');
    
    return alignmentTest && responsiveTest;
}

// Auto-run verification if loaded in browser
if (typeof window !== 'undefined') {
    console.log('Subtitle centering test functions loaded. Run runSubtitleTests() to verify fix.');
}