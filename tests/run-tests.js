#!/usr/bin/env node

/**
 * Automated test runner for StackMap UAT tests
 * Uses Puppeteer to run tests in a headless browser
 */

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { spawn } = require('child_process');

// Configuration
const PORT = 5501; // Different from default dev server
const HOST = 'localhost';
const TEST_URL = `http://${HOST}:${PORT}/tests/test-runner.html`;
const APP_ROOT = path.join(__dirname, '..');

// Test results
let testsPassed = true;
let server = null;
let serverProcess = null;

// Colors for output
const log = {
    info: (msg) => console.log(chalk.blue('ℹ'), msg),
    success: (msg) => console.log(chalk.green('✓'), msg),
    error: (msg) => console.log(chalk.red('✗'), msg),
    warn: (msg) => console.log(chalk.yellow('⚠'), msg),
    test: (msg) => console.log(chalk.cyan('🧪'), msg)
};

// Simple static file server
function createServer() {
    return new Promise((resolve, reject) => {
        const express = require('http').createServer((req, res) => {
            let filePath = path.join(APP_ROOT, req.url === '/' ? '/index.html' : req.url);
            
            // Security: prevent directory traversal
            if (!filePath.startsWith(APP_ROOT)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }

            // Check if file exists
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not Found');
                    return;
                }

                // Determine content type
                const ext = path.extname(filePath);
                const contentTypes = {
                    '.html': 'text/html',
                    '.js': 'application/javascript',
                    '.css': 'text/css',
                    '.json': 'application/json',
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.svg': 'image/svg+xml'
                };
                const contentType = contentTypes[ext] || 'text/plain';

                // Serve file
                res.writeHead(200, { 'Content-Type': contentType });
                fs.createReadStream(filePath).pipe(res);
            });
        });

        server = express.listen(PORT, HOST, () => {
            log.info(`Test server running at http://${HOST}:${PORT}`);
            resolve();
        });

        server.on('error', reject);
    });
}

// Run tests using Puppeteer
async function runTests() {
    let browser;
    
    try {
        log.test('Launching browser...');
        browser = await puppeteer.launch({
            headless: 'new', // Use new headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // For CI environments
        });

        const page = await browser.newPage();
        
        // Capture console output from the page
        page.on('console', msg => {
            const text = msg.text();
            
            // Parse test output
            if (text.includes('✓')) {
                log.success(text);
            } else if (text.includes('✗') || text.includes('FAILED')) {
                log.error(text);
                testsPassed = false;
            } else if (text.includes('⚠')) {
                log.warn(text);
            } else if (text.includes('TEST RESULTS SUMMARY')) {
                console.log(chalk.bold('\n' + text));
            } else if (text.includes('All tests passed!')) {
                console.log(chalk.green.bold(text));
            } else {
                console.log(text);
            }
        });

        // Capture page errors
        page.on('error', error => {
            log.error(`Page error: ${error.message}`);
            testsPassed = false;
        });

        page.on('pageerror', error => {
            log.error(`Page error: ${error.message}`);
            testsPassed = false;
        });

        // Navigate to test runner
        log.info(`Opening test runner at ${TEST_URL}`);
        await page.goto(TEST_URL, { waitUntil: 'networkidle0' });

        // Wait for app to load in iframe
        log.info('Waiting for app to load...');
        await page.waitForFunction(() => {
            const iframe = document.getElementById('appFrame');
            return iframe && iframe.contentDocument && 
                   iframe.contentDocument.readyState === 'complete';
        }, { timeout: 30000 });

        // Additional wait for app initialization
        await page.waitForTimeout(2000);

        // Run all tests
        log.test('Running Edit Mode tests...');
        
        // Click the Run Tests button
        await page.evaluate(() => {
            // Set test suite to "Edit Mode Tests"
            document.getElementById('testSuite').value = 'edit-mode';
            // Click run button
            document.getElementById('runTests').click();
        });

        // Wait for tests to complete
        await page.waitForFunction(() => {
            const statusEl = document.getElementById('testStatus');
            return statusEl && statusEl.style.display !== 'none' && 
                   (statusEl.classList.contains('success') || statusEl.classList.contains('failure'));
        }, { timeout: 60000 });

        // Get final test status
        const testResult = await page.evaluate(() => {
            const statusEl = document.getElementById('testStatus');
            const output = document.getElementById('testOutput').textContent;
            return {
                success: statusEl.classList.contains('success'),
                message: statusEl.textContent,
                output: output
            };
        });

        // Check results
        if (!testResult.success) {
            testsPassed = false;
            log.error('Some tests failed!');
            
            // Extract failed tests from output
            const failedTests = testResult.output.match(/❌ .+ - FAILED: .+/g);
            if (failedTests) {
                console.log(chalk.red('\nFailed Tests:'));
                failedTests.forEach(test => console.log(chalk.red(test)));
            }
        }

        // Take screenshot if tests failed
        if (!testsPassed) {
            const screenshotPath = path.join(__dirname, 'test-failure.png');
            await page.screenshot({ path: screenshotPath, fullPage: true });
            log.warn(`Screenshot saved to ${screenshotPath}`);
        }

    } catch (error) {
        log.error(`Test execution failed: ${error.message}`);
        testsPassed = false;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Main execution
async function main() {
    console.log(chalk.bold.blue('\n🧪 StackMap Automated Test Runner\n'));

    try {
        // Start server
        await createServer();
        
        // Run tests
        await runTests();
        
        // Clean up
        if (server) {
            server.close();
        }
        
        // Exit with appropriate code
        if (testsPassed) {
            log.success('All tests passed! ✨');
            process.exit(0);
        } else {
            log.error('Tests failed! Please fix the issues above.');
            process.exit(1);
        }
    } catch (error) {
        log.error(`Fatal error: ${error.message}`);
        if (server) server.close();
        process.exit(1);
    }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
    if (server) server.close();
    process.exit(1);
});

process.on('SIGTERM', () => {
    if (server) server.close();
    process.exit(1);
});

// Check if Puppeteer is installed
try {
    require.resolve('puppeteer');
    require.resolve('chalk');
} catch (error) {
    console.error('Dependencies not installed. Please run: npm install');
    process.exit(1);
}

// Run tests
main();