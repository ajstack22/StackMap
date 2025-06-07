// DORMANT-2025-01-06: Old header implementation
/**
 * Test for unified header implementation
 */

function testUnifiedHeader() {
    console.log('🧪 Testing Unified Header Implementation...\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Check for single app header
    const appHeader = document.querySelector('.app-header');
    const oldStaticHeader = document.querySelector('.static-header');
    const oldFixedHeader = document.querySelector('.fixed-header');
    
    if (appHeader && !oldStaticHeader && !oldFixedHeader) {
        console.log('✅ Single unified header exists');
        passed++;
    } else {
        console.log('❌ Header structure incorrect');
        console.log('  - app-header:', !!appHeader);
        console.log('  - static-header (should be false):', !!oldStaticHeader);
        console.log('  - fixed-header (should be false):', !!oldFixedHeader);
        failed++;
    }
    
    // Test 2: Check if header is fixed
    if (appHeader) {
        const styles = window.getComputedStyle(appHeader);
        if (styles.position === 'fixed') {
            console.log('✅ Header is fixed positioned');
            passed++;
        } else {
            console.log('❌ Header is not fixed positioned:', styles.position);
            failed++;
        }
    }
    
    // Test 3: Check drawer functionality
    const drawerHandle = document.getElementById('drawerHandle');
    const drawerExtension = document.getElementById('drawerExtension');
    
    if (drawerHandle && drawerExtension) {
        console.log('✅ Drawer elements present');
        passed++;
    } else {
        console.log('❌ Drawer elements missing');
        failed++;
    }
    
    // Test 4: Check body padding
    const bodyStyles = window.getComputedStyle(document.body);
    const bodyPaddingTop = parseInt(bodyStyles.paddingTop);
    
    if (bodyPaddingTop > 80) {
        console.log('✅ Body has appropriate top padding:', bodyPaddingTop + 'px');
        passed++;
    } else {
        console.log('❌ Body padding too small:', bodyPaddingTop + 'px');
        failed++;
    }
    
    // Test 5: Check drawer open/close functionality
    if (drawerHandle && drawerExtension && appHeader) {
        drawerHandle.click();
        setTimeout(() => {
            if (drawerExtension.classList.contains('open') && appHeader.classList.contains('drawer-open')) {
                console.log('✅ Drawer opens correctly');
                passed++;
                
                // Close drawer
                const doneBtn = document.getElementById('drawerDone');
                if (doneBtn) doneBtn.click();
            } else {
                console.log('❌ Drawer does not open correctly');
                failed++;
            }
            
            // Final results
            console.log('\n📊 Unified Header Test Results:');
            console.log(`   Passed: ${passed}`);
            console.log(`   Failed: ${failed}`);
            console.log(`   Total: ${passed + failed}`);
            console.log(`   Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
            
            if (failed === 0) {
                console.log('\n🎉 All unified header tests passed!');
            } else {
                console.log('\n⚠️  Some tests failed. Please check the implementation.');
            }
        }, 300);
    }
}

// Make it available globally
window.testUnifiedHeader = testUnifiedHeader;

// Auto-run if called directly
if (typeof module === 'undefined') {
    console.log('Run testUnifiedHeader() to test the unified header implementation');
}