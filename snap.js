#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the reference name from command line
const reference = process.argv[2];

if (!reference) {
  console.log('Usage: node snap.js <reference-name>');
  console.log('Example: node snap.js home-screen');
  process.exit(1);
}

// Create output directory
const outputDir = path.join(__dirname, 'app-screenshots');
fs.mkdirSync(outputDir, { recursive: true });

console.log(`📸 Capturing screenshots with reference: "${reference}"\n`);

// Capture iOS screenshots
try {
  const iosDevices = execSync('xcrun simctl list devices -j', { encoding: 'utf8' });
  const devices = JSON.parse(iosDevices).devices;
  
  for (const runtime of Object.values(devices)) {
    for (const device of runtime) {
      if (device.state === 'Booted') {
        const deviceName = device.name.replace(/[\s\(\)]/g, '_');
        const filename = `iOS_${deviceName}_${reference}.png`;
        const filepath = path.join(outputDir, filename);
        
        execSync(`xcrun simctl io ${device.udid} screenshot "${filepath}"`);
        console.log(`✓ iOS ${device.name}`);
        
        // Rotate iPad Pro 13-inch to landscape
        if (device.name.includes('iPad') && device.name.includes('13')) {
          execSync(`sips -r 90 "${filepath}"`);
          console.log(`  ↻ Rotated to landscape`);
        }
      }
    }
  }
} catch (error) {
  console.error('iOS capture error:', error.message);
}

// Capture Android screenshots
try {
  const androidDevices = execSync('adb devices', { encoding: 'utf8' })
    .split('\n')
    .slice(1)
    .map(line => line.split('\t')[0])
    .filter(id => id && id.trim());
  
  // Map device IDs to known device names based on order
  const deviceMapping = {
    'emulator-5554': 'Pixel_9_Pro_XL',
    'emulator-5556': 'Pixel_Tablet',
    'emulator-5558': 'Pixel_9'
  };
  
  androidDevices.forEach((deviceId, index) => {
    // Try to get device model name
    let deviceName = deviceMapping[deviceId];
    
    if (!deviceName) {
      try {
        const model = execSync(`adb -s ${deviceId} shell getprop ro.product.model`, { encoding: 'utf8' }).trim();
        deviceName = model.replace(/[\s\(\)]/g, '_');
        
        // If we get generic names, use size to determine device
        if (model.includes('sdk_gphone64')) {
          // Capture and check file size to determine which phone it is
          const tempFile = `/tmp/android_temp_${index}.png`;
          execSync(`adb -s ${deviceId} shell screencap -p /sdcard/temp.png`);
          execSync(`adb -s ${deviceId} pull /sdcard/temp.png "${tempFile}" 2>/dev/null`);
          const stats = fs.statSync(tempFile);
          const fileSize = stats.size;
          fs.unlinkSync(tempFile);
          execSync(`adb -s ${deviceId} shell rm /sdcard/temp.png`);
          
          // Determine device by file size
          if (fileSize > 230000) {
            deviceName = 'Pixel_9_Pro_XL';
          } else if (fileSize > 170000) {
            deviceName = 'Pixel_9';
          } else {
            deviceName = `Phone_${index + 1}`;
          }
        }
      } catch (e) {
        deviceName = `Device_${index + 1}`;
      }
    }
    
    const filename = `Android_${deviceName}_${reference}.png`;
    const tempPath = `/sdcard/screenshot_${Date.now()}.png`;
    const filepath = path.join(outputDir, filename);
    
    execSync(`adb -s ${deviceId} shell screencap -p ${tempPath}`);
    execSync(`adb -s ${deviceId} pull ${tempPath} "${filepath}" 2>/dev/null`);
    execSync(`adb -s ${deviceId} shell rm ${tempPath}`);
    
    console.log(`✓ Android ${deviceName} (${deviceId})`);
  });
} catch (error) {
  console.error('Android capture error:', error.message);
}

console.log(`\n✅ Done! Screenshots saved to: ${outputDir}`);
console.log(`   Pattern: OS_Device_${reference}.png`);