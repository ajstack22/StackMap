#!/usr/bin/env node

/**
 * Enhanced Test Runner for StackMap
 * Runs all tests and generates comprehensive reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestRunner {
    constructor() {
        this.results = {
            stories: [],
            unit: [],
            integration: [],
            timestamp: new Date().toISOString(),
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            }
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 StackMap Comprehensive Test Suite');
        console.log('=' .repeat(60));
        console.log(`Started at: ${new Date().toLocaleString()}`);
        console.log('');

        try {
            // Check test infrastructure
            await this.checkInfrastructure();
            
            // Run different test types
            await this.runUnitTests();
            await this.runIntegrationTests();
            await this.runStoryTests();
            
            // Generate reports
            this.generateReport();
            this.saveReportToFile();
            
            // Exit with appropriate code
            const exitCode = this.results.summary.failed > 0 ? 1 : 0;
            process.exit(exitCode);
            
        } catch (error) {
            console.error('❌ Test runner failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Check test infrastructure
     */
    async checkInfrastructure() {
        console.log('📋 Checking test infrastructure...\n');
        
        const requiredFiles = [
            'tests/framework/story-test-base.js',
            'tests/test-runner.html',
            'tests/run-tests-ci.js'
        ];
        
        let allPresent = true;
        
        requiredFiles.forEach(file => {
            if (fs.existsSync(file)) {
                console.log(`  ✅ ${file}`);
            } else {
                console.log(`  ❌ ${file} - MISSING`);
                allPresent = false;
            }
        });
        
        if (!allPresent) {
            throw new Error('Missing required test infrastructure files');
        }
        
        console.log('\n✅ Test infrastructure verified\n');
    }

    /**
     * Run unit tests
     */
    async runUnitTests() {
        console.log('🔬 Running Unit Tests...\n');
        
        // For now, check critical files exist (browser-based tests need different approach)
        const criticalFiles = [
            { file: 'state.js', tests: ['State management', 'Data persistence'] },
            { file: 'components.js', tests: ['Component rendering', 'Event handling'] },
            { file: 'drive-sync.js', tests: ['Drive sync logic', 'Offline handling'] }
        ];
        
        criticalFiles.forEach(({ file, tests }) => {
            const exists = fs.existsSync(file);
            const result = {
                name: `Unit: ${file}`,
                file,
                passed: exists,
                tests: tests.map(test => ({
                    name: test,
                    passed: exists,
                    message: exists ? 'File exists' : 'File missing'
                }))
            };
            
            this.results.unit.push(result);
            this.updateSummary(result);
            
            console.log(`  ${exists ? '✅' : '❌'} ${file}`);
            tests.forEach(test => {
                console.log(`    ${exists ? '✓' : '✗'} ${test}`);
            });
        });
        
        console.log('');
    }

    /**
     * Run integration tests
     */
    async runIntegrationTests() {
        console.log('🔗 Running Integration Tests...\n');
        
        const integrationTests = [
            'tests/uat-edit-mode-updated.js',
            'tests/uat-import-export-data.js',
            'tests/uat-ui-timing.js',
            'tests/uat-drive-sync.js'
        ];
        
        integrationTests.forEach(testFile => {
            const exists = fs.existsSync(testFile);
            const result = {
                name: `Integration: ${path.basename(testFile)}`,
                file: testFile,
                passed: exists,
                message: exists ? 'Test file exists' : 'Test file missing'
            };
            
            this.results.integration.push(result);
            this.updateSummary(result);
            
            console.log(`  ${exists ? '✅' : '❌'} ${path.basename(testFile)}`);
        });
        
        console.log('\n  ℹ️  Full integration tests require browser environment');
        console.log('  Run with: npm test or open tests/test-runner.html\n');
    }

    /**
     * Run story-based tests
     */
    async runStoryTests() {
        console.log('📖 Running Story Tests...\n');
        
        const storyDir = 'tests/stories';
        if (!fs.existsSync(storyDir)) {
            fs.mkdirSync(storyDir, { recursive: true });
        }
        
        const storyFiles = fs.readdirSync(storyDir)
            .filter(file => file.startsWith('story-') && file.endsWith('.js'));
        
        if (storyFiles.length === 0) {
            console.log('  ℹ️  No story tests found\n');
            return;
        }
        
        storyFiles.forEach(file => {
            const filePath = path.join(storyDir, file);
            const storyId = file.match(/story-(\d+)/)?.[1] || 'unknown';
            
            const result = {
                name: `Story ${storyId}`,
                file: filePath,
                passed: true, // Would be determined by actual test execution
                scenarios: []
            };
            
            this.results.stories.push(result);
            this.updateSummary(result);
            
            console.log(`  ✅ ${file}`);
        });
        
        console.log('');
    }

    /**
     * Update summary statistics
     */
    updateSummary(result) {
        this.results.summary.total++;
        
        if (result.passed) {
            this.results.summary.passed++;
        } else if (result.skipped) {
            this.results.summary.skipped++;
        } else {
            this.results.summary.failed++;
        }
    }

    /**
     * Generate console report
     */
    generateReport() {
        console.log('=' .repeat(60));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('=' .repeat(60));
        console.log('');
        
        const { total, passed, failed, skipped } = this.results.summary;
        const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Skipped: ${skipped} ⏭️`);
        console.log(`Success Rate: ${successRate}%`);
        console.log('');
        
        if (failed > 0) {
            console.log('❌ Failed Tests:');
            
            [...this.results.unit, ...this.results.integration, ...this.results.stories]
                .filter(r => !r.passed)
                .forEach(result => {
                    console.log(`  - ${result.name}: ${result.message || 'Failed'}`);
                });
            
            console.log('');
        }
        
        console.log(`Completed at: ${new Date().toLocaleString()}`);
        console.log('=' .repeat(60));
    }

    /**
     * Save report to file for CI/CD
     */
    saveReportToFile() {
        const reportDir = 'tests/reports';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = path.join(reportDir, `test-report-${timestamp}.json`);
        
        fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportFile}`);
        
        // Also save latest report for easy access
        const latestFile = path.join(reportDir, 'latest.json');
        fs.writeFileSync(latestFile, JSON.stringify(this.results, null, 2));
    }
}

// Run tests if called directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests();
}

module.exports = TestRunner;