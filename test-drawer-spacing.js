// DORMANT-2025-01-06: Spacing tests integrated elsewhere
// Console verification commands for drawer spacing and alignment fixes

// Test user mode day dropdown spacing
function testUserModeSpacing() {
    const subtitle = document.querySelector('.subtitle, .stackmap-subtitle');
    const daySelector = document.querySelector('.day-selector-container, .day-selector');
    const handle = document.querySelector('.drawer-handle');
    
    console.log('=== USER MODE SPACING TEST ===');
    
    if (!subtitle || !daySelector || !handle) {
        console.log('❌ Required elements not found');
        console.log('Subtitle:', !!subtitle, 'Day selector:', !!daySelector, 'Handle:', !!handle);
        return false;
    }
    
    const subtitleRect = subtitle.getBoundingClientRect();
    const dayRect = daySelector.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    
    const spacing1 = dayRect.top - subtitleRect.bottom;
    const spacing2 = handleRect.top - dayRect.bottom;
    
    console.log('Subtitle to Day Selector spacing:', spacing1.toFixed(1) + 'px');
    console.log('Day Selector to Handle spacing:', spacing2.toFixed(1) + 'px');
    console.log('Spacing balance:', Math.abs(spacing1 - spacing2) < 10 ? '✅ BALANCED' : '❌ UNBALANCED');
    
    return spacing1 > 15 && spacing2 > 15 && Math.abs(spacing1 - spacing2) < 10;
}

// Test edit mode dropdown alignment
function testEditModeAlignment() {
    console.log('=== EDIT MODE ALIGNMENT TEST ===');
    
    // Check if we're in edit mode by looking for multiple dropdown groups
    const dropdownGroups = document.querySelectorAll('.dropdown-group');
    if (dropdownGroups.length < 2) {
        console.log('⚠️ Not in edit mode or only one dropdown found');
        return true; // Not applicable
    }
    
    const userDropdown = document.querySelector('#drawerUserSelect, .drawer-select');
    const dayDropdown = document.querySelector('#drawerDaySelect');
    const addUserButton = document.querySelector('.drawer-add-user');
    
    console.log('Found elements:');
    console.log('- User dropdown:', !!userDropdown);
    console.log('- Day dropdown:', !!dayDropdown);
    console.log('- Add user button:', !!addUserButton);
    
    // Check for User label (should be hidden)
    const userLabel = document.querySelector('.dropdown-label');
    const hasUserLabel = userLabel && userLabel.textContent.includes('User');
    console.log('- User label visible:', hasUserLabel ? '❌ VISIBLE' : '✅ HIDDEN');
    
    // Test dropdown heights and alignment
    const dropdowns = [userDropdown, dayDropdown, addUserButton].filter(Boolean);
    if (dropdowns.length >= 2) {
        const heights = dropdowns.map(dd => dd.getBoundingClientRect().height);
        const tops = dropdowns.map(dd => dd.getBoundingClientRect().top);
        
        console.log('Dropdown heights:', heights.map(h => h.toFixed(1) + 'px'));
        console.log('Dropdown top positions:', tops.map(t => t.toFixed(1) + 'px'));
        
        const heightConsistency = heights.every(h => Math.abs(h - heights[0]) < 2);
        const topAlignment = Math.abs(tops[1] - tops[0]) < 2;
        
        console.log('Height consistency:', heightConsistency ? '✅ CONSISTENT' : '❌ INCONSISTENT');
        console.log('Top alignment:', topAlignment ? '✅ ALIGNED' : '❌ MISALIGNED');
        
        return !hasUserLabel && heightConsistency && topAlignment;
    }
    
    return !hasUserLabel;
}

// Test drawer height consistency across modes
function testDrawerHeights() {
    const header = document.querySelector('.header-wrapper');
    
    console.log('=== DRAWER HEIGHT CONSISTENCY TEST ===');
    
    if (!header) {
        console.log('❌ Header wrapper not found');
        return false;
    }
    
    // Get current state
    const isOpen = header.classList.contains('drawer-open');
    console.log('Current state:', isOpen ? 'OPEN' : 'CLOSED');
    
    const currentHeight = parseInt(getComputedStyle(header).height);
    console.log('Current height:', currentHeight + 'px');
    
    // Expected heights
    const isMobile = window.innerWidth <= 768;
    const expectedClosed = isMobile ? 120 : 150;
    const expectedOpen = isMobile ? 200 : 220;
    const expected = isOpen ? expectedOpen : expectedClosed;
    
    console.log('Expected height:', expected + 'px');
    console.log('Height accuracy:', Math.abs(currentHeight - expected) < 5 ? '✅ ACCURATE' : '❌ INACCURATE');
    
    const difference = Math.abs(currentHeight - expected);
    return difference < 5;
}

// Test responsive spacing on different screen sizes
function testResponsiveSpacing() {
    console.log('=== RESPONSIVE SPACING TEST ===');
    console.log('Current viewport:', window.innerWidth + 'x' + window.innerHeight);
    
    let deviceType = 'Desktop';
    if (window.innerWidth <= 480) deviceType = 'Mobile';
    else if (window.innerWidth <= 768) deviceType = 'Tablet';
    
    console.log('Device type:', deviceType);
    
    const userTest = testUserModeSpacing();
    const editTest = testEditModeAlignment();
    const heightTest = testDrawerHeights();
    
    console.log('\nResponsive test results:');
    console.log('User mode spacing:', userTest ? '✅ PASS' : '❌ FAIL');
    console.log('Edit mode alignment:', editTest ? '✅ PASS' : '❌ FAIL');
    console.log('Drawer heights:', heightTest ? '✅ PASS' : '❌ FAIL');
    
    return userTest && editTest && heightTest;
}

// Comprehensive test suite
function runDrawerSpacingTests() {
    console.log('🔍 Running comprehensive drawer spacing and alignment tests...\n');
    
    const userModeTest = testUserModeSpacing();
    console.log('');
    
    const editModeTest = testEditModeAlignment();
    console.log('');
    
    const heightTest = testDrawerHeights();
    console.log('');
    
    const responsiveTest = testResponsiveSpacing();
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('User mode spacing:', userModeTest ? '✅ PASS' : '❌ FAIL');
    console.log('Edit mode alignment:', editModeTest ? '✅ PASS' : '❌ FAIL');
    console.log('Drawer height consistency:', heightTest ? '✅ PASS' : '❌ FAIL');
    console.log('Responsive behavior:', responsiveTest ? '✅ PASS' : '❌ FAIL');
    
    const allPassed = userModeTest && editModeTest && heightTest && responsiveTest;
    console.log('Overall status:', allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ ISSUES DETECTED');
    
    return allPassed;
}

// Auto-run verification if loaded in browser
if (typeof window !== 'undefined') {
    console.log('Drawer spacing test functions loaded. Run runDrawerSpacingTests() to verify fixes.');
}