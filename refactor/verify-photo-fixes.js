#!/usr/bin/env node

// Verification script for Issue #53 Photo Attachments
const fs = require('fs');
const path = require('path');

console.log('=== Photo Attachments Verification ===\n');

let passCount = 0;
let failCount = 0;
const issues = [];

// Helper functions
function checkFile(filePath, checks) {
    console.log(`Checking ${path.basename(filePath)}...`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        checks.forEach(check => {
            if (check.test(content)) {
                console.log(`  ✓ ${check.name}`);
                passCount++;
            } else {
                console.log(`  ✗ ${check.name}`);
                issues.push(`${path.basename(filePath)}: ${check.issue}`);
                failCount++;
            }
        });
    } catch (e) {
        console.log(`  ✗ File not found: ${filePath}`);
        failCount++;
    }
    
    console.log('');
}

// Check photo-attachment-ui.js
checkFile(path.join(__dirname, 'js/photo-attachment-ui.js'), [
    {
        name: '_toggleZoom method exists',
        test: content => content.includes('_toggleZoom: function(photo)'),
        issue: '_toggleZoom method not found - will cause runtime error on double-tap'
    },
    {
        name: 'Caption placeholder hardcoded',
        test: content => content.includes("placeholder = 'Brief description (optional)'") || 
                        content.includes('placeholder = "Brief description (optional)"'),
        issue: 'Caption placeholder uses undefined window.CaptionInput.PLACEHOLDER'
    },
    {
        name: 'Lazy loading implemented',
        test: content => content.includes('_lazyLoadThumbnails') && content.includes('IntersectionObserver'),
        issue: 'Lazy loading not implemented - will impact performance'
    },
    {
        name: 'Stress detector implemented',
        test: content => content.includes('StressDetector') && content.includes('recordError'),
        issue: 'Stress detection not implemented'
    }
]);

// Check photo-attachment-storage.js
checkFile(path.join(__dirname, 'js/photo-attachment-storage.js'), [
    {
        name: 'Service worker check properly implemented',
        test: content => content.includes('navigator.serviceWorker.ready.then'),
        issue: 'Service worker registration uses undefined self.registration'
    },
    {
        name: 'RGB_565 optimization (alpha: false)',
        test: content => content.includes('alpha: false'),
        issue: 'Memory optimization not implemented - missing alpha: false'
    },
    {
        name: 'Blob cleanup implemented',
        test: content => content.includes('URL.revokeObjectURL'),
        issue: 'Blob URLs not cleaned up - will cause memory leaks'
    },
    {
        name: 'Photo limit enforced',
        test: content => content.includes('MAX_PHOTOS_PER_TASK') && content.includes('>= CONFIG.MAX_PHOTOS_PER_TASK'),
        issue: 'Photo limit not enforced'
    }
]);

// Check CSS
checkFile(path.join(__dirname, 'css/photo-attachments.css'), [
    {
        name: '64x64px thumbnail size defined',
        test: content => content.includes('width: 64px') && content.includes('height: 64px'),
        issue: 'Thumbnail size not set to 64x64px'
    },
    {
        name: '3x2 grid layout defined',
        test: content => content.includes('grid-template-columns: repeat(3, 1fr)'),
        issue: 'Grid layout not properly defined'
    },
    {
        name: 'Touch targets minimum 48px',
        test: content => content.includes('min-width: 48px') && content.includes('min-height: 48px'),
        issue: 'Touch targets too small for ADHD accessibility'
    },
    {
        name: 'Stress mode styles defined',
        test: content => content.includes('.photo-stress-mode'),
        issue: 'Stress mode styles not defined'
    }
]);

// Check integration
checkFile(path.join(__dirname, 'index.html'), [
    {
        name: 'Photo CSS included',
        test: content => content.includes('photo-attachments.css'),
        issue: 'Photo CSS not included in index.html'
    },
    {
        name: 'Photo scripts included',
        test: content => content.includes('photo-attachment-storage.js') && 
                        content.includes('photo-attachment-ui.js'),
        issue: 'Photo scripts not included in index.html'
    }
]);

checkFile(path.join(__dirname, 'js/task-cards.js'), [
    {
        name: 'Photo UI integrated with task cards',
        test: content => content.includes('PhotoAttachmentUI') && content.includes('createAttachmentUI'),
        issue: 'Photo UI not integrated with task cards'
    }
]);

// Summary
console.log('=== Summary ===');
console.log(`Total checks: ${passCount + failCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);

if (failCount > 0) {
    console.log('\n=== Issues to Fix ===');
    issues.forEach(issue => console.log(`- ${issue}`));
    console.log('\n❌ Photo attachment implementation has issues that need fixing.');
    process.exit(1);
} else {
    console.log('\n✅ All photo attachment checks passed!');
    console.log('\nNext steps:');
    console.log('1. Open photo-verification-test.html in a browser');
    console.log('2. Click "Run All Tests" to verify runtime behavior');
    console.log('3. Test adding photos to the demo task');
    console.log('4. Check browser console for any errors');
    process.exit(0);
}