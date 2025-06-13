#!/usr/bin/env node

/**
 * Run tests on specific port
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
    console.log(chalk.bold.blue('\n🧪 StackMap UAT Test Runner\n'));
    
    let browser;
    let testsPassed = true;
    
    try {
        log.info(`Connecting to server at port ${PORT}...`);
        
        // Launch browser
        log.test('Launching browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Set longer timeout
        page.setDefaultTimeout(120000);
        
        // Capture console output
        page.on('console', msg => {
            const text = msg.text();
            console.log(text);
        });

        // Navigate to test runner
        log.info(`Opening test runner at ${TEST_URL}`);
        await page.goto(TEST_URL, { waitUntil: 'networkidle0' });
        
        // Wait for app to load
        log.info('Waiting for app to load in iframe...');
        await page.waitForFunction(() => {
            const iframe = document.getElementById('appFrame');
            if (!iframe) return false;
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            return iframeDoc && iframeDoc.readyState === 'complete';
        });
        
        // Wait for test scripts to load
        await page.waitForFunction(() => {
            const output = document.getElementById('testOutput');
            return output && output.textContent.includes('All test scripts loaded');
        }, { timeout: 30000 });
        
        // Additional wait for initialization
        await page.waitForTimeout(3000);
        
        // Run all tests
        log.test('Running all UAT tests...');
        await page.evaluate(() => {
            document.getElementById('testSuite').value = 'all';
            document.getElementById('runTests').click();
        });
        
        // Wait for tests to complete
        await page.waitForFunction(() => {
            const output = document.getElementById('testOutput');
            return output && output.textContent.includes('All test suites completed');
        }, { timeout: 180000 });
        
        // Get test results
        const results = await page.evaluate(() => {
            const outputEl = document.getElementById('testOutput');
            return outputEl.textContent;
        });
        
        // Close browser
        await browser.close();
        
        // Check for failures
        if (results.includes('FAILED')) {
            testsPassed = false;
        }
        
        // Exit with appropriate code
        if (testsPassed && !results.includes('❌')) {
            log.success('All tests passed! ✅');
            process.exit(0);
        } else {
            log.error('Some tests failed! ❌');
            process.exit(1);
        }
        
    } catch (error) {
        log.error(`Test execution error: ${error.message}`);
        if (browser) await browser.close();
        process.exit(1);
    }
}

// Run tests
runTests();