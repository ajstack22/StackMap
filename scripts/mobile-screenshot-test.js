#!/usr/bin/env node

// Take screenshots of mobile view for visual validation
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function takeMobileScreenshots(url, outputDir = 'screenshots') {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    // Define device viewports to test
    const devices = [
      { name: 'iphone-x', width: 375, height: 812 },
      { name: 'pixel-5', width: 393, height: 851 },
      { name: 'iphone-se', width: 320, height: 568 },
      { name: 'ipad', width: 768, height: 1024 }
    ];
    
    console.log(`📸 Taking screenshots of ${url}`);
    console.log('');
    
    for (const device of devices) {
      await page.setViewport({
        width: device.width,
        height: device.height,
        deviceScaleFactor: 2
      });
      
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Wait for any animations
      await page.waitForTimeout(1000);
      
      // Take full page screenshot
      const screenshotPath = path.join(outputDir, `${device.name}-${timestamp}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      
      console.log(`✓ ${device.name} (${device.width}x${device.height}) - ${screenshotPath}`);
      
      // Also take a screenshot focused on cards if they exist
      const hasCards = await page.$('.card');
      if (hasCards) {
        await page.evaluate(() => {
          const card = document.querySelector('.card');
          if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        
        await page.waitForTimeout(500);
        
        const cardScreenshotPath = path.join(outputDir, `${device.name}-cards-${timestamp}.png`);
        await page.screenshot({
          path: cardScreenshotPath,
          fullPage: false
        });
        
        console.log(`✓ ${device.name} cards view - ${cardScreenshotPath}`);
      }
    }
    
    console.log('');
    console.log(`📁 Screenshots saved to: ${path.resolve(outputDir)}`);
    console.log('');
    console.log('Visual checks to perform:');
    console.log('- [ ] Cards are centered with equal margins');
    console.log('- [ ] Material Icons are displaying correctly');
    console.log('- [ ] No horizontal scrolling on mobile');
    console.log('- [ ] FAB positioning looks correct');
    console.log('- [ ] Text is readable and not cut off');
    
  } catch (error) {
    console.error('❌ Error taking screenshots:', error.message);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  const url = process.argv[2] || 'https://stackmap.app/qual/';
  const outputDir = process.argv[3] || 'screenshots';
  takeMobileScreenshots(url, outputDir);
}