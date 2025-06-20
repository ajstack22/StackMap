#!/usr/bin/env node

// Check for JavaScript errors on deployed site
const puppeteer = require('puppeteer');

async function checkJSErrors(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const errors = [];
  const warnings = [];
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  try {
    // Visit the page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Check for Material Icons
    const hasIcons = await page.evaluate(() => {
      const icons = document.querySelectorAll('.material-icons');
      return icons.length > 0;
    });
    
    // Check card alignment on mobile viewport
    await page.setViewport({ width: 375, height: 812 }); // iPhone X size
    const cardAlignment = await page.evaluate(() => {
      const card = document.querySelector('.card');
      if (!card) return 'No cards found';
      
      const rect = card.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();
      const leftMargin = rect.left;
      const rightMargin = bodyRect.right - rect.right;
      
      return {
        leftMargin: Math.round(leftMargin),
        rightMargin: Math.round(rightMargin),
        centered: Math.abs(leftMargin - rightMargin) < 5
      };
    });
    
    // Report results
    if (errors.length === 0) {
      console.log('\x1b[32m✓\x1b[0m No JavaScript errors detected');
    } else {
      console.log(`\x1b[31m✗\x1b[0m Found ${errors.length} JavaScript error(s):`);
      errors.forEach(err => console.log(`  - ${err}`));
    }
    
    if (warnings.length > 0) {
      console.log(`\x1b[33m⚠\x1b[0m ${warnings.length} warning(s)`);
    }
    
    console.log(`\x1b[34mℹ\x1b[0m Material Icons: ${hasIcons ? 'Found' : 'Not found'}`);
    
    if (typeof cardAlignment === 'object') {
      console.log(`\x1b[34mℹ\x1b[0m Card alignment: Left=${cardAlignment.leftMargin}px, Right=${cardAlignment.rightMargin}px`);
      if (cardAlignment.centered) {
        console.log('\x1b[32m✓\x1b[0m Cards appear centered');
      } else {
        console.log('\x1b[33m⚠\x1b[0m Cards may not be centered');
      }
    }
    
  } catch (error) {
    console.error('\x1b[31m✗\x1b[0m Error checking page:', error.message);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  const url = process.argv[2] || 'https://stackmap.app/qual/';
  checkJSErrors(url);
}