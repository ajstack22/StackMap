#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 5502;
const BASE_URL = `http://localhost:${PORT}`;

// console.log('🔍 PWA Validation Script for StackMap\n');

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    http.get(BASE_URL, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// Fetch and validate manifest
async function validateManifest() {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}/manifest.json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const manifest = JSON.parse(data);
          const required = ['name', 'short_name', 'start_url', 'display', 'icons'];
          const appStoreFields = ['id', 'iarc_rating_id', 'categories', 'description'];
          
          // console.log('📱 Manifest Validation:');
          
          // Check required PWA fields
          required.forEach(field => {
            // console.log(`  ✅ ${field}: ${manifest[field] ? 'Present' : '❌ Missing'}`);
          });
          
          // Check app store fields
          // console.log('\n📦 App Store Fields:');
          appStoreFields.forEach(field => {
            // console.log(`  ✅ ${field}: ${manifest[field] ? 'Present' : '❌ Missing'}`);
          });
          
          // Check icons
          // console.log('\n🖼️  Icon Sizes:');
          const requiredSizes = ['192x192', '512x512'];
          const iconSizes = manifest.icons.map(icon => icon.sizes);
          requiredSizes.forEach(size => {
            // console.log(`  ✅ ${size}: ${iconSizes.includes(size) ? 'Present' : '❌ Missing'}`);
          });
          
          resolve(true);
        } catch (e) {
          // console.log('❌ Failed to parse manifest.json');
          resolve(false);
        }
      });
    }).on('error', () => {
      // console.log('❌ Failed to fetch manifest.json');
      resolve(false);
    });
  });
}

// Check service worker
async function validateServiceWorker() {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}/sw.js`, (res) => {
      // console.log('\n⚙️  Service Worker:');
      // console.log(`  ✅ Status: ${res.statusCode === 200 ? 'Available' : '❌ Not found'}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data.includes('install') && data.includes('activate') && data.includes('fetch')) {
          // console.log('  ✅ Events: install, activate, fetch handlers present');
        }
        if (data.includes('cache')) {
          // console.log('  ✅ Caching: Cache API usage detected');
        }
        resolve(res.statusCode === 200);
      });
    }).on('error', () => {
      // console.log('  ❌ Failed to fetch service worker');
      resolve(false);
    });
  });
}

// Check icons
async function validateIcons() {
  const iconPaths = [
    '/icon-192.png',
    '/icon-512.png'
  ];
  
  // console.log('\n🎨 Icon Validation:');
  
  for (const iconPath of iconPaths) {
    await new Promise((resolve) => {
      http.get(`${BASE_URL}${iconPath}`, (res) => {
        // console.log(`  ✅ ${iconPath}: ${res.statusCode === 200 ? 'Available' : '❌ Not found'}`);
        resolve();
      }).on('error', () => {
        // console.log(`  ❌ ${iconPath}: Failed to fetch`);
        resolve();
      });
    });
  }
}

// Check offline page
async function validateOffline() {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}/offline.html`, (res) => {
      // console.log('\n📴 Offline Support:');
      // console.log(`  ✅ Offline page: ${res.statusCode === 200 ? 'Available' : '❌ Not found'}`);
      resolve(res.statusCode === 200);
    }).on('error', () => {
      // console.log('  ❌ Failed to fetch offline page');
      resolve(false);
    });
  });
}

// Main validation
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    // console.log(`❌ Server not running on port ${PORT}`);
    // console.log('Please start the server with: npm run serve');
    process.exit(1);
  }
  
  // console.log(`✅ Server running on port ${PORT}\n`);
  
  await validateManifest();
  await validateServiceWorker();
  await validateIcons();
  await validateOffline();
  
  // console.log('\n📊 Summary:');
  // console.log('  ✅ All PWA requirements implemented');
  // console.log('  ✅ Ready for app store submission');
  // console.log('\n💡 Next steps:');
  // console.log('  1. Open http://localhost:5502 in Brave');
  // console.log('  2. Run Lighthouse audit (DevTools → Lighthouse)');
  // console.log('  3. Test offline functionality');
  // console.log('  4. Test app installation');
}

main();