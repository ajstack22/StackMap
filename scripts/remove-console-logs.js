#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files and directories to skip
const SKIP_PATHS = [
  'node_modules',
  'android/build',
  'ios/build',
  'web/build',
  '.git',
  'bundle.js',
  'scripts/remove-console-logs.js'
];

// File extensions to process
const PROCESS_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

let filesProcessed = 0;
let consolesRemoved = 0;

function shouldSkipPath(filePath) {
  return SKIP_PATHS.some(skip => filePath.includes(skip));
}

function processFile(filePath) {
  if (shouldSkipPath(filePath)) return;
  
  const ext = path.extname(filePath);
  if (!PROCESS_EXTENSIONS.includes(ext)) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Count console statements before removal
    const consoleMatches = content.match(/console\.(log|warn|error|debug|info|trace|time|timeEnd|group|groupEnd|table|assert|count|clear|dir|dirxml|profile|profileEnd|timeStamp)/g);
    const beforeCount = consoleMatches ? consoleMatches.length : 0;
    
    // Remove standalone console.log statements (entire lines)
    content = content.replace(/^\s*console\.(log|debug|info|trace|time|timeEnd|group|groupEnd|table|count|dir|dirxml|profile|profileEnd|timeStamp)\([^)]*\);?\s*$/gm, '');
    
    // Keep console.error and console.warn but wrap them in __DEV__ check if not already wrapped
    // First, check if __DEV__ is imported/available
    const hasDevCheck = content.includes('__DEV__');
    
    if (hasDevCheck) {
      // Replace unwrapped console.error and console.warn with wrapped versions
      content = content.replace(
        /^(\s*)(console\.(error|warn)\([^)]*\);?)$/gm,
        (match, indent, statement) => {
          // Check if already wrapped (look at previous line)
          const lines = originalContent.split('\n');
          const currentLineIndex = lines.findIndex(line => line.includes(match));
          if (currentLineIndex > 0) {
            const prevLine = lines[currentLineIndex - 1];
            if (prevLine.includes('__DEV__') || prevLine.includes('if (')) {
              return match; // Already wrapped
            }
          }
          return `${indent}if (__DEV__) {\n${indent}  ${statement}\n${indent}}`;
        }
      );
    } else {
      // If no __DEV__ available, just comment them out
      content = content.replace(/^\s*console\.(error|warn)\([^)]*\);?\s*$/gm, '// $&');
    }
    
    // Remove console statements from JSX (be more careful here)
    content = content.replace(/{console\.(log|debug|info|trace)\([^)]*\)}/g, '{null}');
    
    // Clean up empty blocks that might be left
    content = content.replace(/{\s*}/g, '{}');
    
    // Clean up multiple empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      const afterCount = (content.match(/console\./g) || []).length;
      const removed = beforeCount - afterCount;
      consolesRemoved += removed;
      filesProcessed++;
      console.log(`✓ ${filePath} - Removed ${removed} console statements`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  if (shouldSkipPath(dirPath)) return;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        processDirectory(fullPath);
      } else if (stat.isFile()) {
        processFile(fullPath);
      }
    });
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Start processing
console.log('🧹 Starting console.log cleanup...\n');

const srcPath = path.join(__dirname, '..', 'src');
const appPath = path.join(__dirname, '..', 'App.js');

// Process src directory
if (fs.existsSync(srcPath)) {
  processDirectory(srcPath);
}

// Process App.js
if (fs.existsSync(appPath)) {
  processFile(appPath);
}

console.log('\n' + '='.repeat(50));
console.log(`✅ Cleanup complete!`);
console.log(`📁 Files processed: ${filesProcessed}`);
console.log(`🗑️  Console statements removed: ${consolesRemoved}`);
console.log('='.repeat(50));

console.log('\n⚠️  Note: console.error and console.warn statements have been wrapped in __DEV__ checks where possible');
console.log('   Please review critical error handling to ensure proper user feedback');