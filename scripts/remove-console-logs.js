#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// console.log('🔍 Analyzing console.log statements...\n');

// Find all JS files (excluding node_modules and tests)
const jsFiles = execSync('find . -name "*.js" -not -path "./node_modules/*" -not -path "./tests/*" -not -path "./.backup/*"')
    .toString()
    .trim()
    .split('\n')
    .filter(f => f);

let totalCount = 0;
let commentedCount = 0;
let activeCount = 0;
const filesToFix = [];

// Analyze each file
jsFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let fileHasActive = false;
    
    lines.forEach((line, index) => {
        // if (line.includes('console.log')) {
            totalCount++;
            
            // Check if it's already commented
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                commentedCount++;
            } else {
                activeCount++;
                fileHasActive = true;
            }
        }
    });
    
    if (fileHasActive) {
        filesToFix.push(file);
    }
});

// console.log(`Total console.log found: ${totalCount}`);
// console.log(`Already commented: ${commentedCount}`);
// console.log(`Active (need removal): ${activeCount}`);
// console.log(`Files with active logs: ${filesToFix.length}\n`);

if (activeCount === 0) {
    // console.log('✅ No active console.log statements to remove!');
    process.exit(0);
}

// Show files that need fixing
// console.log('Files with active console.log statements:');
// filesToFix.slice(0, 10).forEach(f => console.log(`  - ${f}`));
if (filesToFix.length > 10) {
    // console.log(`  ... and ${filesToFix.length - 10} more`);
}

// console.log('\nWould you like to:');
// console.log('1. Comment out all console.log statements (preserves for debugging)');
// console.log('2. Remove all console.log statements completely');
// console.log('3. Cancel\n');

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Choose option (1-3): ', (answer) => {
    if (answer === '3') {
        // console.log('Cancelled.');
        process.exit(0);
    }
    
    // Create backup
    // console.log('\nCreating backup...');
    execSync('mkdir -p .backup');
    const backupName = `.backup/before-console-removal-${Date.now()}.tar.gz`;
    execSync(`tar -czf ${backupName} --exclude=node_modules --exclude=.git --exclude=.backup .`);
    // console.log(`Backup created: ${backupName}`);
    
    // Process files
    // console.log('\nProcessing files...');
    let fixedCount = 0;
    
    filesToFix.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        let modified = false;
        
        const newLines = lines.map(line => {
            // if (line.includes('console.log') && !line.trim().startsWith('//') && !line.trim().startsWith('/*')) {
                modified = true;
                
                if (answer === '1') {
                    // Comment out - preserve indentation
                    const leadingWhitespace = line.match(/^(\s*)/)[1];
                    return leadingWhitespace + '// ' + line.trim();
                } else {
                    // Remove completely - leave empty line to preserve line numbers
                    return '';
                }
            }
            return line;
        });
        
        if (modified) {
            fs.writeFileSync(file, newLines.join('\n'));
            fixedCount++;
        }
    });
    
    // console.log(`\n✅ Fixed ${fixedCount} files`);
    // console.log('\nNext steps:');
    // console.log('1. Review changes with: git diff');
    // console.log('2. Run tests: npm test');
    // console.log('3. Check deployment status: npm run tollgate:check');
    
    rl.close();
});