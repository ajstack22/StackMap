#!/usr/bin/env node

/**
 * Verify Error Handling Implementation
 * Checks that all required components have error boundaries
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying StackMap Error Handling Implementation...\n');

let passed = 0;
let failed = 0;

function check(description, condition) {
    if (condition) {
        console.log(`✅ ${description}`);
        passed++;
    } else {
        console.log(`❌ ${description}`);
        failed++;
    }
}

// Check 1: Component error handler exists
const errorHandlerPath = path.join(__dirname, 'js/component-error-handler.js');
check('Component error handler file exists', fs.existsSync(errorHandlerPath));

// Check 2: Error handler is included in index.html
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
check('Component error handler is included in index.html', 
    indexHtml.includes('component-error-handler.js'));

// Check 3: Fallback UI for each component in HTML
const components = [
    'user-switcher-wrapper',
    'task-display-wrapper', 
    'edit-mode-wrapper',
    'theme-settings-wrapper',
    'data-management-wrapper'
];

components.forEach(wrapperId => {
    check(`Fallback UI exists for ${wrapperId}`,
        indexHtml.includes(`id="${wrapperId}"`) && 
        indexHtml.includes('component-wrapper'));
});

// Check 4: CSS classes for error states
const baseCss = fs.readFileSync(path.join(__dirname, 'css/base.css'), 'utf8');
check('CSS contains component-wrapper styles', 
    baseCss.includes('.component-wrapper'));
check('CSS contains error state styles',
    baseCss.includes('.component-wrapper.component-error-active'));

// Check 5: App.js initializes components with error boundaries
const appJs = fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf8');
check('App.js has initComponentsWithErrorBoundaries function',
    appJs.includes('function initComponentsWithErrorBoundaries'));
check('App.js wraps TaskDisplay with error handler',
    appJs.includes("wrapInit(\n                        'TaskDisplay'"));
check('App.js wraps UserManager with error handler',
    appJs.includes("wrapInit(\n                'UserManager'"));
check('App.js wraps EditMode with error handler',
    appJs.includes("wrapInit(\n                'EditMode'"));

// Check 6: Inline styles in index.html support fallback UI
check('Index.html has inline fallback styles',
    indexHtml.includes('.component-fallback') && 
    indexHtml.includes('.component-error-active'));

// Summary
console.log('\n📊 Summary:');
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
console.log(`   Total:  ${passed + failed}`);

if (failed === 0) {
    console.log('\n✨ All error handling checks passed!');
    process.exit(0);
} else {
    console.log('\n⚠️  Some checks failed. Please review the implementation.');
    process.exit(1);
}