#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');

// Read deployment lock if it exists
let lockData = null;
if (fs.existsSync('.deployment-lock')) {
    lockData = JSON.parse(fs.readFileSync('.deployment-lock', 'utf8'));
}

// console.log('\n' + chalk.bold.white('═'.repeat(50)));
// console.log(chalk.bold.white('         STACKMAP DEPLOYMENT STATUS'));
// console.log(chalk.bold.white('═'.repeat(50)) + '\n');

if (lockData) {
    // console.log(chalk.red.bold('🚫 DEPLOYMENT IS CURRENTLY BLOCKED\n'));
    // console.log(chalk.gray(`Last check: ${new Date(lockData.date).toLocaleString()}\n`));
    
    // Show failed checks
    // console.log(chalk.yellow.bold('Failed Checks:\n'));
    
    lockData.results.forEach(result => {
        if (!result.passed && result.required) {
            // console.log(chalk.red(`  ❌ ${result.name}`));
            if (result.details) {
                // console.log(chalk.gray(`     ${result.details.split('\n')[0]}`));
            }
            // console.log('');
        }
    });
    
    // Show passed checks
    const passedChecks = lockData.results.filter(r => r.passed);
    if (passedChecks.length > 0) {
        // console.log(chalk.green.bold('\nPassed Checks:\n'));
        passedChecks.forEach(result => {
            // console.log(chalk.green(`  ✅ ${result.name}`));
        });
    }
    
    // console.log('\n' + chalk.yellow.bold('Next Steps:'));
    // console.log(chalk.white('1. Run: bash scripts/fix-deployment-blockers.sh'));
    // console.log(chalk.white('2. Fix remaining issues manually'));
    // console.log(chalk.white('3. Run: npm run tollgate:check'));
    // console.log(chalk.white('4. When all checks pass: npm run deploy\n'));
    
} else {
    // console.log(chalk.green.bold('✅ NO DEPLOYMENT BLOCKS FOUND\n'));
    // console.log(chalk.white('Run deployment checks: npm run tollgate:check'));
    // console.log(chalk.white('Deploy to production: npm run deploy\n'));
}

// Show quick stats
// console.log(chalk.bold.white('─'.repeat(50)));
// console.log(chalk.bold.white('Quick Commands:'));
// console.log(chalk.gray('  npm run tollgate:check  - Run all deployment checks'));
// console.log(chalk.gray('  npm run deploy         - Deploy (if checks pass)'));
// console.log(chalk.gray('  npm test               - Run test suite'));
// console.log(chalk.gray('  git status             - Check uncommitted changes'));
// console.log(chalk.bold.white('─'.repeat(50)) + '\n');