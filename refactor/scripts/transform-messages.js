#!/usr/bin/env node

/**
 * Build-time message transformation for RSD safety
 * Scans all JS files and transforms error messages to prevent triggering RSD
 * Usage: node scripts/transform-messages.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    sourceDir: path.join(__dirname, '..'),
    outputDir: path.join(__dirname, '..', 'dist'),
    extensions: ['.js', '.mjs'],
    excludeDirs: ['node_modules', '.git', 'dist', 'scripts'],
    dryRun: process.argv.includes('--dry-run')
};

// Trigger words to replace (case-sensitive for performance)
const REPLACEMENTS = {
    // Exact word replacements
    'Error': 'Issue',
    'error': 'issue',
    'ERROR': 'ISSUE',
    'Failed': 'Needs attention',
    'failed': 'needs attention',
    'FAILED': 'NEEDS ATTENTION',
    'Invalid': 'Needs adjustment',
    'invalid': 'needs adjustment',
    'INVALID': 'NEEDS ADJUSTMENT',
    'Wrong': 'Different',
    'wrong': 'different',
    'WRONG': 'DIFFERENT',
    'Bad': 'Needs improvement',
    'bad': 'needs improvement',
    'BAD': 'NEEDS IMPROVEMENT',
    'Incorrect': 'Needs correction',
    'incorrect': 'needs correction',
    'INCORRECT': 'NEEDS CORRECTION',
    'Failure': 'Incomplete',
    'failure': 'incomplete',
    'FAILURE': 'INCOMPLETE'
};

// Patterns to replace (regex-based)
const PATTERNS = [
    // Error types
    { pattern: /TypeError/g, replacement: 'TypeIssue' },
    { pattern: /ReferenceError/g, replacement: 'ReferenceIssue' },
    { pattern: /SyntaxError/g, replacement: 'SyntaxIssue' },
    { pattern: /RangeError/g, replacement: 'RangeIssue' },
    
    // Common error messages
    { pattern: /cannot\s+read\s+property/gi, replacement: 'unable to access property' },
    { pattern: /is\s+not\s+defined/gi, replacement: 'needs to be defined' },
    { pattern: /is\s+not\s+a\s+function/gi, replacement: 'needs to be a function' },
    { pattern: /unexpected\s+token/gi, replacement: 'syntax needs adjustment' },
    
    // Form validation
    { pattern: /Please\s+fill\s+out\s+this\s+field/gi, replacement: 'This field needs your input' },
    { pattern: /Please\s+enter\s+a\s+valid/gi, replacement: 'This needs a different format for' },
    { pattern: /required/gi, replacement: 'needed' }
];

// Files to skip transformation
const SKIP_FILES = [
    'rsd-safe-init.js', // Already handles transformations
    'messaging.js', // Message transformation system itself
    'transform-messages.js' // This file
];

// Statistics
let stats = {
    filesProcessed: 0,
    filesTransformed: 0,
    totalReplacements: 0
};

/**
 * Transform a string by replacing trigger words
 */
function transformContent(content, filePath) {
    let transformed = content;
    let replacementCount = 0;
    
    // Skip if file is in skip list
    const fileName = path.basename(filePath);
    if (SKIP_FILES.includes(fileName)) {
        return { content: content, count: 0 };
    }
    
    // Apply exact replacements
    for (const [trigger, replacement] of Object.entries(REPLACEMENTS)) {
        const regex = new RegExp(`\\b${trigger}\\b`, 'g');
        const matches = transformed.match(regex);
        if (matches) {
            replacementCount += matches.length;
            transformed = transformed.replace(regex, replacement);
        }
    }
    
    // Apply pattern replacements
    for (const { pattern, replacement } of PATTERNS) {
        const matches = transformed.match(pattern);
        if (matches) {
            replacementCount += matches.length;
            transformed = transformed.replace(pattern, replacement);
        }
    }
    
    return {
        content: transformed,
        count: replacementCount
    };
}

/**
 * Process a single file
 */
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const { content: transformed, count } = transformContent(content, filePath);
        
        stats.filesProcessed++;
        
        if (count > 0) {
            stats.filesTransformed++;
            stats.totalReplacements += count;
            
            console.log(`✓ ${filePath}: ${count} replacements`);
            
            if (!CONFIG.dryRun) {
                // Create output directory if needed
                const outputPath = filePath.replace(CONFIG.sourceDir, CONFIG.outputDir);
                const outputDir = path.dirname(outputPath);
                
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                
                // Write transformed file
                fs.writeFileSync(outputPath, transformed, 'utf8');
            }
        } else if (!CONFIG.dryRun) {
            // Copy unchanged files to output
            const outputPath = filePath.replace(CONFIG.sourceDir, CONFIG.outputDir);
            const outputDir = path.dirname(outputPath);
            
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            fs.copyFileSync(filePath, outputPath);
        }
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
    }
}

/**
 * Walk directory tree and process files
 */
function walkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip excluded directories
            if (!CONFIG.excludeDirs.includes(file)) {
                walkDirectory(filePath);
            }
        } else if (stat.isFile()) {
            // Process JavaScript files
            const ext = path.extname(file);
            if (CONFIG.extensions.includes(ext)) {
                processFile(filePath);
            }
        }
    }
}

/**
 * Main execution
 */
function main() {
    console.log('RSD-Safe Message Transformation');
    console.log('================================');
    console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'TRANSFORM'}`);
    console.log(`Source: ${CONFIG.sourceDir}`);
    console.log(`Output: ${CONFIG.outputDir}`);
    console.log('');
    
    // Create output directory if needed
    if (!CONFIG.dryRun && !fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    // Process all files
    walkDirectory(path.join(CONFIG.sourceDir, 'js'));
    
    // Copy other necessary files (HTML, CSS, etc.)
    if (!CONFIG.dryRun) {
        // Copy HTML
        const htmlFiles = ['index.html', 'emergency-static.html'];
        for (const file of htmlFiles) {
            const src = path.join(CONFIG.sourceDir, file);
            const dst = path.join(CONFIG.outputDir, file);
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dst);
                console.log(`✓ Copied ${file}`);
            }
        }
        
        // Copy CSS directory
        const cssDir = path.join(CONFIG.sourceDir, 'css');
        const cssDest = path.join(CONFIG.outputDir, 'css');
        if (fs.existsSync(cssDir) && !fs.existsSync(cssDest)) {
            fs.mkdirSync(cssDest, { recursive: true });
        }
        
        if (fs.existsSync(cssDir)) {
            const cssFiles = fs.readdirSync(cssDir);
            for (const file of cssFiles) {
                if (file.endsWith('.css')) {
                    fs.copyFileSync(
                        path.join(cssDir, file),
                        path.join(cssDest, file)
                    );
                    console.log(`✓ Copied css/${file}`);
                }
            }
        }
    }
    
    // Print summary
    console.log('\nSummary:');
    console.log(`Files processed: ${stats.filesProcessed}`);
    console.log(`Files transformed: ${stats.filesTransformed}`);
    console.log(`Total replacements: ${stats.totalReplacements}`);
    
    if (CONFIG.dryRun) {
        console.log('\nThis was a dry run. Use without --dry-run to actually transform files.');
    }
}

// Run the transformation
main();