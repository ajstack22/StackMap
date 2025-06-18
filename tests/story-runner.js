#!/usr/bin/env node

/**
 * Story-based test runner for StackMap
 * Extends existing Puppeteer test infrastructure with BDD-style stories
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Reuse existing test infrastructure
const { createServer, runBrowser } = require('./run-tests');

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
        await createServer();

        // Launch browser
        const browser = await puppeteer.launch({
            headless: options.debug ? false : true,
            slowMo: options.debug ? 100 : 0,
            devtools: options.debug
        });

        const page = await browser.newPage();
        
        // Capture console logs and errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Navigate to app
        await page.goto('http://localhost:5500', { 
            waitUntil: 'networkidle2' 
        });

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

    runner.runAllStories(options)
        .then(exitCode => process.exit(exitCode))
        .catch(error => {
            console.error(chalk.red('Test runner failed:'), error);
            process.exit(1);
        });
}

module.exports = StoryRunner;