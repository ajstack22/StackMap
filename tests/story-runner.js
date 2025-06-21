#!/usr/bin/env node

/**
 * Story-based test runner for StackMap
 * Extends existing Puppeteer test infrastructure with BDD-style stories
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Server management
const { exec } = require('child_process');
const http = require('http');

class StoryRunner {
    constructor() {
        this.stories = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            blocked: [],
            warnings: []
        };
        this.serverPort = 5502; // Default port
    }

    // Load all story files
    async loadStories(storyPath = './tests/stories') {
        const storyDir = path.resolve(storyPath);
        
        if (!fs.existsSync(storyDir)) {
            console.log(chalk.yellow('Creating stories directory...'));
            fs.mkdirSync(storyDir, { recursive: true });
        }

        const files = fs.readdirSync(storyDir)
            .filter(f => f.endsWith('.story.js'));

        for (const file of files) {
            try {
                const story = require(path.join(storyDir, file));
                this.stories.push({
                    ...story,
                    filename: file
                });
            } catch (error) {
                console.error(chalk.red(`Failed to load story ${file}:`), error);
            }
        }

        return this.stories;
    }

    // Run a single story
    async runStory(story, page) {
        console.log(chalk.blue(`\n📖 Story: ${story.title}`));
        
        const storyResult = {
            title: story.title,
            filename: story.filename,
            priority: story.priority || 'medium',
            scenarios: []
        };

        // Run story setup if provided
        if (story.setup) {
            try {
                await story.setup(page);
                console.log(chalk.gray('  ✓ Story setup completed'));
            } catch (error) {
                console.log(chalk.red(`  ✗ Story setup failed: ${error.message}`));
                return storyResult;
            }
        }

        for (const scenario of story.scenarios) {
            console.log(chalk.gray(`  Given: ${scenario.given}`));
            console.log(chalk.gray(`  When: ${scenario.when}`));
            console.log(chalk.gray(`  Then: ${scenario.then}`));

            try {
                // Run the actual test
                await scenario.test(page);
                
                console.log(chalk.green(`  ✓ Scenario passed`));
                storyResult.scenarios.push({
                    ...scenario,
                    passed: true
                });
            } catch (error) {
                console.log(chalk.red(`  ✗ Scenario failed: ${error.message}`));
                storyResult.scenarios.push({
                    ...scenario,
                    passed: false,
                    error: error.message
                });
            }
        }

        return storyResult;
    }

    // Run all stories
    async runAllStories(options = {}) {
        const { criticalOnly = false, storyName = null } = options;

        await this.loadStories();

        if (this.stories.length === 0) {
            console.log(chalk.yellow('No stories found. Creating example story...'));
            await this.createExampleStory();
            return;
        }

        // Filter stories based on options
        let storiesToRun = this.stories;
        
        if (criticalOnly) {
            storiesToRun = this.stories.filter(s => s.priority === 'critical');
        }
        
        if (storyName) {
            storiesToRun = this.stories.filter(s => 
                s.filename.includes(storyName) || s.title.includes(storyName)
            );
        }

        console.log(chalk.cyan(`🧪 Running ${storiesToRun.length} stories...`));

        // Start server if needed
        await this.createServer();

        // Launch browser with retry mechanism
        let browser;
        let retries = 3;
        let lastError;
        
        // Use Brave browser if available
        const executablePath = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
        const userDataDir = path.join(__dirname, '.test-browser-profile');
        
        while (retries > 0 && !browser) {
            try {
                browser = await puppeteer.launch({
                    headless: options.debug ? false : 'new',
                    slowMo: options.debug ? 100 : 0,
                    devtools: options.debug,
                    executablePath: fs.existsSync(executablePath) ? executablePath : undefined,
                    userDataDir: userDataDir,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu',
                        '--allow-insecure-localhost',
                        '--disable-web-security',
                        '--disable-features=IsolateOrigins',
                        '--disable-site-isolation-trials'
                    ],
                    ignoreHTTPSErrors: true,
                    timeout: 30000
                });
            } catch (error) {
                lastError = error;
                retries--;
                if (retries > 0) {
                    console.log(chalk.yellow(`Browser launch failed, retrying... (${retries} attempts left)`));
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        if (!browser) {
            console.error(chalk.red('Failed to launch browser after multiple attempts:'), lastError.message);
            if (this.serverProcess) {
                this.serverProcess.kill();
            }
            throw new Error('Browser launch failed: ' + lastError.message);
        }

        const page = await browser.newPage();
        
        // Capture console logs and errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Set the test port environment variable for stories to use
        const port = this.serverPort || 5502;
        process.env.TEST_PORT = port;
        
        // Navigate to app using detected port
        try {
            await page.goto(`http://localhost:${port}`, { 
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Wait for app to be fully initialized
            try {
                await page.waitForFunction(() => {
                    // Check if the app instance exists or if main container is ready
                    return (window.appInstance && window.appInstance.initialized !== false) || 
                           document.querySelector('.main-container');
                }, { timeout: 10000 });
            } catch (waitError) {
                console.log(chalk.yellow('App initialization check timed out, proceeding anyway'));
                
                // Debug: Check what's actually on the page
                const pageContent = await page.evaluate(() => {
                    return {
                        title: document.title,
                        hasMainContainer: !!document.querySelector('.main-container'),
                        hasMainContainerId: !!document.getElementById('mainContainer'),
                        bodyClasses: document.body.className,
                        appInstance: typeof window.appInstance !== 'undefined',
                        url: window.location.href
                    };
                });
                console.log(chalk.gray('Page state:'), pageContent);
            }
            
        } catch (error) {
            console.error(chalk.red(`Failed to navigate to http://localhost:${port}: ${error.message}`));
            await browser.close();
            if (this.serverProcess) {
                this.serverProcess.kill();
            }
            throw error;
        }

        // Run each story
        for (const story of storiesToRun) {
            const result = await this.runStory(story, page);
            
            const allPassed = result.scenarios.every(s => s.passed);
            
            if (allPassed) {
                this.results.passed++;
            } else {
                this.results.failed++;
                
                if (story.priority === 'critical') {
                    this.results.blocked.push(result);
                } else {
                    this.results.warnings.push(result);
                }
            }
            
            this.results.total++;
        }

        await browser.close();

        // Clean up server if we started it
        if (this.serverProcess) {
            console.log(chalk.gray('Stopping test server...'));
            this.serverProcess.kill();
        }

        // Generate report
        this.generateReport();

        // Return exit code based on critical failures
        return this.results.blocked.length > 0 ? 1 : 0;
    }

    // Generate test report
    generateReport() {
        const reportPath = './test-results/story-report.json';
        const reportDir = path.dirname(reportPath);

        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            summary: this.results,
            details: {
                blocked: this.results.blocked,
                warnings: this.results.warnings
            }
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Console summary
        console.log(chalk.cyan('\n📊 Test Summary'));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(`Total Stories: ${this.results.total}`);
        console.log(chalk.green(`Passed: ${this.results.passed}`));
        console.log(chalk.red(`Failed: ${this.results.failed}`));
        
        if (this.results.blocked.length > 0) {
            console.log(chalk.red(`\n❌ BLOCKED: ${this.results.blocked.length} critical stories failed`));
            this.results.blocked.forEach(story => {
                console.log(chalk.red(`  - ${story.title}`));
            });
        }

        if (this.results.warnings.length > 0) {
            console.log(chalk.yellow(`\n⚠️  Warnings: ${this.results.warnings.length} non-critical stories failed`));
        }

        console.log(chalk.gray('\nFull report: test-results/story-report.json'));
    }

    // Start local server if needed
    async createServer() {
        const PORTS = [5502, 5500, 5501];  // Removed 5000 - conflicts with macOS AirPlay
        const HOST = 'localhost';
        
        // Check if any dev server is already running
        for (const port of PORTS) {
            const isRunning = await this.checkPortWithAppVerification(port);
            if (isRunning) {
                console.log(chalk.gray(`Using existing dev server on port ${port}`));
                this.serverPort = port;
                return;
            }
        }
        
        // No server found, start new one on first available port
        const PORT = PORTS[0];
        console.log(chalk.gray(`Starting test server on port ${PORT}...`));
        
        return new Promise((resolve, reject) => {
            this.serverProcess = exec(`npm run serve`, {
                cwd: path.resolve(__dirname, '..')
            });
            
            this.serverProcess.on('error', (error) => {
                console.error(chalk.red('Server error:'), error);
                reject(error);
            });
            
            // Poll for server to be ready
            const startTime = Date.now();
            const timeout = 30000; // 30 seconds max
            
            const checkServer = async () => {
                const isReady = await this.checkPort(PORT);
                
                if (isReady) {
                    console.log(chalk.gray(`Server running at http://${HOST}:${PORT}`));
                    this.serverPort = PORT;
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Server failed to start within 30 seconds'));
                } else {
                    setTimeout(checkServer, 500); // Check every 500ms
                }
            };
            
            // Start checking after a brief delay
            setTimeout(checkServer, 1000);
        });
    }
    
    // Check if a port is in use (cross-platform)
    async checkPort(port) {
        return new Promise((resolve) => {
            const options = {
                host: 'localhost',
                port: port,
                timeout: 1000
            };
            
            const req = http.request(options, (res) => {
                resolve(true); // Port is in use
            });
            
            req.on('error', () => {
                resolve(false); // Port is not in use
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    }

    // Check if port is running our app specifically
    async checkPortWithAppVerification(port) {
        const browser = await puppeteer.launch({ headless: true });
        try {
            const page = await browser.newPage();
            await page.goto(`http://localhost:${port}`, { 
                waitUntil: 'domcontentloaded',
                timeout: 5000 
            });
            
            // Check if it's actually our StackMap app
            const isStackMap = await page.evaluate(() => {
                return document.title.includes('StackMap') || 
                       document.querySelector('.main-container') !== null ||
                       document.querySelector('link[rel="manifest"]') !== null;
            });
            
            await browser.close();
            return isStackMap;
        } catch (error) {
            await browser.close();
            return false;
        }
    }

    // Create example story
    async createExampleStory() {
        const exampleStory = `module.exports = {
    title: 'User can toggle sync without errors',
    issue: '#sync-auth-fix',
    priority: 'critical',
    tags: ['sync', 'authentication'],
    
    scenarios: [
        {
            given: 'User is on the main page',
            when: 'User opens settings and toggles sync',
            then: 'No authentication errors should occur',
            test: async (page) => {
                // Wait for app to load
                await page.waitForSelector('.main-container');
                
                // Open settings menu
                await page.click('[data-test="settings-button"]');
                await page.waitForSelector('.side-panel--open');
                
                // Check for console errors before toggle
                const errorsBefore = await page.evaluate(() => 
                    window.__consoleErrors || []
                );
                
                // Toggle sync
                await page.click('#syncToggle');
                
                // Wait a bit for any errors to appear
                await page.waitForTimeout(1000);
                
                // Check for authentication errors
                const errorsAfter = await page.evaluate(() => 
                    window.__consoleErrors || []
                );
                
                const newErrors = errorsAfter.slice(errorsBefore.length);
                const authErrors = newErrors.filter(e => 
                    e.includes('authenticate is not a function')
                );
                
                if (authErrors.length > 0) {
                    throw new Error('Authentication error found: ' + authErrors[0]);
                }
            }
        }
    ]
};`;

        const storyPath = './tests/stories/sync-authentication.story.js';
        fs.mkdirSync(path.dirname(storyPath), { recursive: true });
        fs.writeFileSync(storyPath, exampleStory);
        
        console.log(chalk.green(`Created example story: ${storyPath}`));
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const runner = new StoryRunner();

    const options = {
        criticalOnly: args.includes('--critical-only'),
        debug: args.includes('--debug'),
        storyName: args.find((a, i) => args[i-1] === '--story')
    };

    // Handle process termination
    const cleanup = () => {
        if (runner.serverProcess) {
            console.log(chalk.gray('\nCleaning up...'));
            runner.serverProcess.kill();
        }
        process.exit(1);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('unhandledRejection', (error) => {
        console.error(chalk.red('Unhandled rejection:'), error);
        cleanup();
    });

    runner.runAllStories(options)
        .then(exitCode => {
            if (runner.serverProcess) {
                runner.serverProcess.kill();
            }
            process.exit(exitCode);
        })
        .catch(error => {
            console.error(chalk.red('Test runner failed:'), error);
            cleanup();
        });
}

module.exports = StoryRunner;