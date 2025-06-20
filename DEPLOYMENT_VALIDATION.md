# Post-Deployment Validation Guide

## Automated Validation Tools

### 1. Basic Validation Script
```bash
./scripts/validate-deployment.sh qual  # For staging
./scripts/validate-deployment.sh prod  # For production
```

Checks:
- ✅ HTTP connectivity
- ✅ Core resources loading
- ✅ Android fixes present
- ✅ Material Icons configuration
- ✅ Basic performance metrics

### 2. Quick Validation
```bash
./scripts/quick-validate.sh https://stackmap.app/qual/
```

Fast check for critical resources.

### 3. JavaScript Error Check (requires Puppeteer)
```bash
node scripts/check-js-errors.js https://stackmap.app/qual/
```

Checks:
- JavaScript console errors
- Material Icons rendering
- Mobile card alignment

### 4. Mobile Screenshots (requires Puppeteer)
```bash
node scripts/mobile-screenshot-test.js https://stackmap.app/qual/
```

Takes screenshots on:
- iPhone X (375x812)
- Pixel 5 (393x851)
- iPhone SE (320x568)
- iPad (768x1024)

## Manual Validation Checklist

### Desktop Browser
- [ ] Visit deployment URL
- [ ] Open DevTools Console - no errors
- [ ] Check Network tab - all resources load
- [ ] Test responsive view at 375px width

### Mobile Device (Critical)
- [ ] Open on Android device
- [ ] Material Icons display correctly
- [ ] Cards are centered (equal left/right margins)
- [ ] No horizontal scrolling
- [ ] FAB buttons positioned correctly
- [ ] Can enter edit mode
- [ ] PWA install prompt appears

### PWA Specific
- [ ] Service worker registered
- [ ] Offline mode works
- [ ] App can be installed
- [ ] App icon appears correctly
- [ ] Splash screen displays

## Online Testing Tools

### Mobile Preview
- BrowserStack Responsive: https://www.browserstack.com/responsive
- Responsinator: http://www.responsinator.com/
- Chrome DevTools Device Mode

### Performance
- PageSpeed Insights: https://pagespeed.web.dev/
- GTmetrix: https://gtmetrix.com/

### PWA Validation
- PWA Builder: https://www.pwabuilder.com/
- Lighthouse (in Chrome DevTools)

## Common Issues & Solutions

### Material Icons Not Showing
1. Check Network tab for font loading
2. Verify CSP headers allow fonts.gstatic.com
3. Check android-app-fixes.css is loaded
4. Hard refresh the page

### Cards Not Centered on Mobile
1. Check viewport meta tag
2. Verify body padding is symmetric
3. Check for transform or margin on cards
4. Use mobile screenshot tool to capture

### Service Worker Not Updating
1. Hard refresh (Ctrl+Shift+R)
2. Clear site data in DevTools
3. Unregister old service worker
4. Check cache version in sw.js

## Deployment Verification Flow

1. **Immediate (< 1 min)**
   - Run quick-validate.sh
   - Check deployment succeeded in GitHub Actions

2. **Quick Test (< 5 min)**
   - Open on mobile device
   - Check Material Icons
   - Verify card alignment
   - Test basic functionality

3. **Full Validation (< 15 min)**
   - Run validate-deployment.sh
   - Complete manual checklist
   - Take screenshots for comparison
   - Run Lighthouse audit

## Rollback if Needed

If validation fails:
```bash
# Check deployment script output for rollback command
# Usually: ssh stackmap-cpanel "cd ~ && tar -xzf ~/backups/production-TIMESTAMP.tar.gz"
```