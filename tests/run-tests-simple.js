#!/usr/bin/env node

/**
 * Simple test runner that opens the test page in the default browser
 * This is a fallback for when Puppeteer has issues
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5501;
const TEST_URL = `http://localhost:${PORT}/tests/test-runner.html`;

console.log('🧪 StackMap Test Runner (Simple Mode)\n');

// Check if server is running
exec(`lsof -i :${PORT}`, (error, stdout) => {
    if (error || !stdout) {
        console.error('❌ Error: Development server is not running');
        console.log('Please start the server first with: npm run serve');
        process.exit(1);
    }
    
    console.log('✅ Development server detected');
    console.log(`Opening test runner at ${TEST_URL}\n`);
    
    // Open in default browser
    const opener = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open';
    
    exec(`${opener} ${TEST_URL}`, (err) => {
        if (err) {
            console.error('❌ Failed to open browser');
            console.log(`Please manually open: ${TEST_URL}`);
        } else {
            console.log('📋 Test runner opened in browser');
            console.log('\nPlease:');
            console.log('1. Wait for the app to load');
            console.log('2. Click "Run Tests"');
            console.log('3. Check if all tests pass');
            console.log('\nFor automated testing, we recommend fixing the Puppeteer setup.');
        }
    });
});