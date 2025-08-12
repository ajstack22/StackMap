#!/usr/bin/env node

/**
 * Build script to update version number
 * Format: YY.MM.DD.#
 * Automatically increments build counter for the day
 */

const fs = require('fs');
const path = require('path');

// Path to version.js file
const versionFilePath = path.join(__dirname, '..', 'src', 'utils', 'version.js');

// Read current version file
let versionFileContent = fs.readFileSync(versionFilePath, 'utf8');

// Get current date
const now = new Date();
const yy = String(now.getFullYear()).slice(-2);
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const today = `${yy}.${mm}.${dd}`;

// Extract current version from file
const versionMatch = versionFileContent.match(/BUILD_VERSION = '([^']+)'/);
let currentVersion = versionMatch ? versionMatch[1] : '25.01.12.1';

// Parse current version
const versionParts = currentVersion.split('.');
const currentDate = `${versionParts[0]}.${versionParts[1]}.${versionParts[2]}`;
let buildCounter = parseInt(versionParts[3] || '1', 10);

// If it's a new day, reset counter to 1
if (currentDate !== today) {
  buildCounter = 1;
} else {
  // Same day, increment counter
  buildCounter++;
}

// Create new version
const newVersion = `${today}.${buildCounter}`;

// Update the version in the file
versionFileContent = versionFileContent.replace(
  /BUILD_VERSION = '[^']+'/,
  `BUILD_VERSION = '${newVersion}'`
);

// Write back to file
fs.writeFileSync(versionFilePath, versionFileContent);

console.log(`✅ Version updated to: ${newVersion}`);

// Also update package.json if it exists
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('✅ package.json updated');
}

// Store build information for reference
const buildInfoPath = path.join(__dirname, '..', '.build-info.json');
const buildInfo = {
  version: newVersion,
  date: now.toISOString(),
  timestamp: Date.now(),
  buildCounter: buildCounter,
  environment: process.env.NODE_ENV || 'development'
};

fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2) + '\n');
console.log('✅ Build info saved to .build-info.json');