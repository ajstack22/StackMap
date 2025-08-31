#!/usr/bin/env node

/**
 * Improved method validation script that works with TypeScript
 * and reduces false positives
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Services to check with their file paths
const SERVICES = {
  syncService: 'src/services/sync/syncStoreIntegration.js', // Updated to actual sync service
  minimalSync: 'src/services/sync/minimalSyncService.js',
  encryptionService: 'src/services/sync/encryptionService.ts',
  dataNormalizer: 'src/utils/dataNormalizer.js'
};

// Known Zustand store methods (built-in)
const ZUSTAND_METHODS = ['getState', 'setState', 'subscribe', 'destroy'];

// Known React/RN methods to ignore
const FRAMEWORK_METHODS = ['render', 'componentDidMount', 'componentWillUnmount', 'forceUpdate'];

console.log(`${colors.blue}🔍 Enhanced Method Validator${colors.reset}`);
console.log('=' .repeat(40));
console.log();

/**
 * Extract methods from a JavaScript file
 */
function extractMethods(filePath) {
  if (!fs.existsSync(filePath)) {
    return new Set();
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const methods = new Set();
  
  // Pattern 1: Class methods (async methodName() or methodName())
  // Updated to handle TypeScript return types: methodName(): ReturnType {
  const classMethodRegex = /^\s*(async\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*(:.*?)?\s*{/gm;
  let match;
  while ((match = classMethodRegex.exec(content)) !== null) {
    methods.add(match[2]);
  }
  
  // Pattern 2: Object methods (methodName: function() or methodName: async function())
  const objectMethodRegex = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(async\s+)?function\s*\(/gm;
  while ((match = objectMethodRegex.exec(content)) !== null) {
    methods.add(match[1]);
  }
  
  // Pattern 3: Arrow function properties (methodName: () => or methodName: async () =>)
  const arrowMethodRegex = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(async\s*)?\([^)]*\)\s*=>/gm;
  while ((match = arrowMethodRegex.exec(content)) !== null) {
    methods.add(match[1]);
  }
  
  // Pattern 4: Exported functions (export function methodName or export const methodName = )
  const exportFunctionRegex = /export\s+(async\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gm;
  while ((match = exportFunctionRegex.exec(content)) !== null) {
    methods.add(match[2]);
  }
  
  const exportConstRegex = /export\s+const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(async\s*)?\(/gm;
  while ((match = exportConstRegex.exec(content)) !== null) {
    methods.add(match[1]);
  }
  
  // Pattern 5: Methods added to exports (exports.methodName = )
  const exportsMethodRegex = /exports\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm;
  while ((match = exportsMethodRegex.exec(content)) !== null) {
    methods.add(match[1]);
  }
  
  return methods;
}

/**
 * Find all calls to a service in the codebase
 */
function findServiceCalls(serviceName) {
  const calls = new Set();
  
  try {
    // Use grep to find all calls
    const grepCommand = `grep -r "${serviceName}\\.[a-zA-Z_][a-zA-Z0-9_]*\\s*(" src/ --include="*.js" --include="*.jsx" 2>/dev/null || true`;
    const output = execSync(grepCommand, { encoding: 'utf8' });
    
    const lines = output.split('\n').filter(line => line.trim());
    const callRegex = new RegExp(`${serviceName}\\.([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(`, 'g');
    
    for (const line of lines) {
      let match;
      while ((match = callRegex.exec(line)) !== null) {
        calls.add(match[1]);
      }
    }
  } catch (error) {
    // Ignore errors from grep
  }
  
  return calls;
}

/**
 * Check if TypeScript is available and run type checking
 */
function runTypeCheck() {
  try {
    console.log(`${colors.blue}Running TypeScript type check...${colors.reset}`);
    execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
    console.log(`${colors.green}✅ TypeScript check passed${colors.reset}`);
    return true;
  } catch (error) {
    if (error.stdout) {
      console.log(`${colors.yellow}⚠️  TypeScript found issues:${colors.reset}`);
      console.log(error.stdout);
    }
    return false;
  }
}

// Main execution
let totalIssues = 0;
const issues = [];

// Run TypeScript check first
const typeCheckPassed = runTypeCheck();
console.log();

console.log('Analyzing service methods...');
console.log('-'.repeat(40));

for (const [serviceName, filePath] of Object.entries(SERVICES)) {
  const fullPath = path.join(process.cwd(), filePath);
  const methods = extractMethods(fullPath);
  const calls = findServiceCalls(serviceName);
  
  // Special handling for useAppStore (Zustand)
  if (serviceName === 'useAppStore') {
    ZUSTAND_METHODS.forEach(m => methods.add(m));
  }
  
  // Find undefined calls
  const undefinedCalls = [...calls].filter(call => !methods.has(call));
  
  if (undefinedCalls.length > 0) {
    console.log(`${colors.red}❌ ${serviceName}:${colors.reset}`);
    for (const call of undefinedCalls) {
      console.log(`   ${colors.red}• ${call}()${colors.reset}`);
      issues.push({ service: serviceName, method: call });
      totalIssues++;
    }
  } else if (methods.size > 0 && calls.size > 0) {
    console.log(`${colors.green}✅ ${serviceName}: All ${calls.size} calls are valid${colors.reset}`);
  }
}

console.log();
console.log('Summary');
console.log('-'.repeat(40));

if (totalIssues === 0) {
  console.log(`${colors.green}✅ No undefined method calls found!${colors.reset}`);
  
  if (typeCheckPassed) {
    console.log(`${colors.green}✅ TypeScript validation passed!${colors.reset}`);
  }
} else {
  console.log(`${colors.red}❌ Found ${totalIssues} undefined method call(s)${colors.reset}`);
  console.log();
  console.log('To fix these issues:');
  console.log('1. Check if the method name is spelled correctly');
  console.log('2. Verify the method exists in the service');
  console.log('3. Consider adding TypeScript types to catch these at compile time');
  
  // Generate fix suggestions
  console.log();
  console.log('Quick fixes:');
  for (const issue of issues.slice(0, 5)) { // Show first 5
    console.log(`${colors.yellow}  ${issue.service}.${issue.method}() - Check ${SERVICES[issue.service]}${colors.reset}`);
  }
}

// Check for potential typos
console.log();
console.log('Checking for common typos...');
console.log('-'.repeat(40));

const COMMON_TYPOS = {
  'lenght': 'length',
  'heigth': 'height',
  'widht': 'width',
  'recieve': 'receive',
  'occured': 'occurred',
  'cancle': 'cancel',
  'delelte': 'delete',
  'udpate': 'update'
};

let typoCount = 0;
for (const [typo, correct] of Object.entries(COMMON_TYPOS)) {
  try {
    const grepCmd = `grep -r "\\b${typo}\\b" src/ --include="*.js" --include="*.jsx" 2>/dev/null | wc -l`;
    const count = parseInt(execSync(grepCmd, { encoding: 'utf8' }).trim());
    if (count > 0) {
      console.log(`${colors.yellow}  ⚠️  Found "${typo}" (should be "${correct}") in ${count} location(s)${colors.reset}`);
      typoCount++;
    }
  } catch (error) {
    // Ignore grep errors
  }
}

if (typoCount === 0) {
  console.log(`${colors.green}✅ No common typos found${colors.reset}`);
}

console.log();
console.log(`${colors.blue}Done! 🎉${colors.reset}`);

// Exit with error code if issues found
process.exit(totalIssues > 0 ? 1 : 0);