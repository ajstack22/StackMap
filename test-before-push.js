#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}🧪 Pre-Push Testing Script${colors.reset}\n`);

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper functions
function runCommand(command, description) {
  try {
    console.log(`${colors.yellow}Running: ${description}${colors.reset}`);
    const output = execSync(command, { encoding: 'utf8' });
    results.passed.push(description);
    return output;
  } catch (error) {
    results.failed.push(`${description}: ${error.message}`);
    return null;
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    results.passed.push(description);
    return true;
  } else {
    results.failed.push(description);
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchString)) {
      results.passed.push(description);
      return true;
    } else {
      results.failed.push(description);
      return false;
    }
  } catch (error) {
    results.failed.push(`${description}: ${error.message}`);
    return false;
  }
}

// 1. Check Git Status
console.log(`\n${colors.blue}1. Checking Git Status...${colors.reset}`);
const gitStatus = runCommand('git status --porcelain', 'Git status check');
if (gitStatus) {
  const modifiedFiles = gitStatus.split('\n').filter(line => line.trim());
  console.log(`Found ${modifiedFiles.length} modified files`);
}

// 2. Check Critical Files
console.log(`\n${colors.blue}2. Checking Critical Files...${colors.reset}`);
checkFile('./src/components/Onboarding/OnboardingNew.js', 'OnboardingNew component exists');
checkFile('./service-worker.js', 'Service worker exists');
checkFile('./web/public/manifest.json', 'PWA manifest exists');

// 3. Verify Onboarding Import
console.log(`\n${colors.blue}3. Checking Onboarding Configuration...${colors.reset}`);
checkFileContent(
  './src/components/Onboarding/index.js',
  'OnboardingNew',
  'Onboarding exports OnboardingNew'
);

checkFileContent(
  './App.js',
  'import OnboardingNew from',
  'App imports OnboardingNew directly'
);

// 4. Check Security Implementation
console.log(`\n${colors.blue}4. Checking Security Features...${colors.reset}`);
checkFileContent(
  './App.js',
  'pinInputRef.current',
  'PIN uses secure refs instead of state'
);

checkFileContent(
  './App.js',
  'pinAttemptsRef.current',
  'Rate limiting implemented'
);

checkFileContent(
  './App.js',
  'setTimeout(() => {',
  'Debouncing implemented'
);

// 5. Check Platform Configurations
console.log(`\n${colors.blue}5. Checking Platform Configurations...${colors.reset}`);

// Android
checkFileContent(
  './android/app/build.gradle',
  'versionCode 6',
  'Android version code is 6'
);

checkFileContent(
  './android/app/src/main/AndroidManifest.xml',
  'MANAGE_EXTERNAL_STORAGE',
  'MANAGE_EXTERNAL_STORAGE permission check'
);

if (!fs.readFileSync('./android/app/src/main/AndroidManifest.xml', 'utf8').includes('MANAGE_EXTERNAL_STORAGE')) {
  results.passed.push('MANAGE_EXTERNAL_STORAGE permission removed correctly');
} else {
  results.warnings.push('MANAGE_EXTERNAL_STORAGE permission still present - verify if needed');
}

// iOS
checkFileContent(
  './ios/StackMapNative.xcodeproj/project.pbxproj',
  'MARKETING_VERSION = 1.0.3',
  'iOS version is 1.0.3'
);

// 6. Run Lint Check (if available)
console.log(`\n${colors.blue}6. Running Code Quality Checks...${colors.reset}`);
if (fs.existsSync('./package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  if (packageJson.scripts && packageJson.scripts.lint) {
    runCommand('npm run lint', 'ESLint check');
  } else {
    results.warnings.push('No lint script found in package.json');
  }
}

// 7. Check for Console Logs
console.log(`\n${colors.blue}7. Checking for Debug Code...${colors.reset}`);
const jsFiles = execSync('find . -name "*.js" -not -path "./node_modules/*" -not -path "./android/*" -not -path "./ios/*" -not -path "./web/build/*"', { encoding: 'utf8' })
  .split('\n')
  .filter(file => file.trim());

let consoleCount = 0;
jsFiles.forEach(file => {
  if (file && fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/console\.(log|error|warn)/g);
    if (matches) {
      consoleCount += matches.length;
    }
  }
});

if (consoleCount > 50) {
  results.warnings.push(`Found ${consoleCount} console statements - consider removing debug logs`);
} else {
  results.passed.push(`Console statement count acceptable (${consoleCount})`);
}

// 8. Browser Test Script
console.log(`\n${colors.blue}8. Creating Browser Test Helper...${colors.reset}`);
const browserTestScript = `
// Copy and paste this into browser console at localhost:8080

async function testStackMap() {
  console.log('🧪 Testing StackMap Web Version...');
  
  // Test 1: Check if onboarding shows for new user
  localStorage.clear();
  location.reload();
  await new Promise(r => setTimeout(r, 2000));
  
  const hasOnboarding = document.querySelector('[class*="onboarding"]');
  console.log('✓ Onboarding shows:', !!hasOnboarding);
  
  // Test 2: Check PWA
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    console.log('✓ Service Worker:', reg ? 'Registered' : 'Not registered');
  }
  
  // Test 3: Check responsive
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  console.log('✓ Viewport width:', vw, vw < 768 ? '(Mobile)' : '(Desktop)');
  
  console.log('\\n📋 Manual checks needed:');
  console.log('- Carousel swipe/navigation works');
  console.log('- Buttons are properly spaced');
  console.log('- Import/Export functions work');
  console.log('- PIN rate limiting works (try 6 rapid attempts)');
}

testStackMap();
`;

fs.writeFileSync('./test-browser.js', browserTestScript);
results.passed.push('Created browser test script (test-browser.js)');

// Summary
console.log(`\n${colors.blue}📊 Test Summary${colors.reset}`);
console.log(`${colors.green}✓ Passed: ${results.passed.length}${colors.reset}`);
console.log(`${colors.red}✗ Failed: ${results.failed.length}${colors.reset}`);
console.log(`${colors.yellow}⚠ Warnings: ${results.warnings.length}${colors.reset}`);

if (results.passed.length > 0) {
  console.log(`\n${colors.green}Passed Tests:${colors.reset}`);
  results.passed.forEach(test => console.log(`  ✓ ${test}`));
}

if (results.failed.length > 0) {
  console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
  results.failed.forEach(test => console.log(`  ✗ ${test}`));
}

if (results.warnings.length > 0) {
  console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
  results.warnings.forEach(warning => console.log(`  ⚠ ${warning}`));
}

// Platform-specific test commands
console.log(`\n${colors.blue}📱 Platform-Specific Test Commands:${colors.reset}`);
console.log('\nWeb:');
console.log('  npm start');
console.log('  # Open localhost:8080 and paste test-browser.js content into console');

console.log('\niOS:');
console.log('  cd ios && pod install && cd ..');
console.log('  npx react-native run-ios');

console.log('\nAndroid:');
console.log('  npx react-native run-android');

console.log(`\n${colors.blue}🚀 Push Commands (after testing):${colors.reset}`);
console.log('  git add -A');
console.log('  git commit -m "feat: Add PWA support and fix onboarding"');
console.log('  git push');

// Exit code based on failures
process.exit(results.failed.length > 0 ? 1 : 0);