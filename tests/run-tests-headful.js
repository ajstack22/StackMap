#!/usr/bin/env node

/**
 * Automated test runner with visible browser (headful mode)
 * This often works better on macOS than headless mode
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');

const PORT = process.env.PORT || 5501;
const HOST = 'localhost';
const TEST_URL = `http://${HOST}:${PORT}/tests/test-runner.html`;

// Colors for output
const log = {
    info: (msg) => console.log(chalk.blue('ℹ'), msg),
    success: (msg) => console.log(chalk.green('✓'), msg),
    error: (msg) => console.log(chalk.red('✗'), msg),
    warn: (msg) => console.log(chalk.yellow('⚠'), msg),
    test: (msg) => console.log(chalk.cyan('🧪'), msg)
};

async function runTests() {
    console.log(chalk.bold.blue('\n🧪 StackMap Automated Test Runner (Visible Mode)\n'));
    
    let browser;
    try {
        log.test('Launching browser...');
        browser = await puppeteer.launch({
            headless: false, // Show the browser
            devtools: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1200, height: 800 });
        
        // Capture console output
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('✓')) {
                log.success(text);
            } else if (text.includes('✗') || text.includes('FAILED')) {
                log.error(text);
            } else if (text.includes('⚠')) {
                log.warn(text);
            } else {
                console.log(text);
            }
        });

        // Navigate to test runner
        log.info(`Opening ${TEST_URL}`);
        await page.goto(TEST_URL, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Wait for iframe to load
        log.info('Waiting for app to load...');
        await page.waitForFunction(() => {
            const iframe = document.getElementById('appFrame');
            return iframe && iframe.contentDocument && 
                   iframe.contentDocument.readyState === 'complete';
        }, { timeout: 30000 });
        
        // Wait for test script to load
        await page.waitForFunction(() => {
            const output = document.getElementById('testOutput');
            return output && output.textContent.includes('Test script loaded');
        }, { timeout: 10000 });
        
        log.success('Test environment ready');
        
        // Wait a bit more for full initialization
        await page.waitForTimeout(2000);
        
        // Click run tests
        log.test('Running tests...');
        await page.click('#runTests');
        
        // Wait for tests to complete
        await page.waitForFunction(() => {
            const statusEl = document.getElementById('testStatus');
            return statusEl && statusEl.style.display !== 'none';
        }, { timeout: 60000 });
        
        // Get results
        const results = await page.evaluate(() => {
            const statusEl = document.getElementById('testStatus');
            const outputEl = document.getElementById('testOutput');
            return {
                success: statusEl.classList.contains('success'),
                statusText: statusEl.textContent,
                output: outputEl.textContent
            };
        });
        
        // Display summary
        console.log('\n' + chalk.bold('Test Results:'));
        console.log(results.statusText);
        
        if (results.success) {
            log.success('All tests passed! 🎉');
            await browser.close();
            process.exit(0);
        } else {
            log.error('Some tests failed');
            
            // Keep browser open for debugging
            log.info('Browser will remain open for debugging. Press Ctrl+C to exit.');
            
            // Wait indefinitely
            await new Promise(() => {});
        }
        
    } catch (error) {
        log.error(`Test execution failed: ${error.message}`);
        if (browser) await browser.close();
        process.exit(1);
    }
}

// Run the tests
runTests();