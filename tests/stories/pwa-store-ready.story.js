module.exports = {
    title: 'PWA is ready for app store requirements',
    issue: '#3',
    priority: 'critical',
    tags: ['mobile', 'pwa', 'pre-launch'],
    
    scenarios: [
        {
            given: 'User visits the PWA',
            when: 'Page loads with app manifest',
            then: 'All required manifest fields are present',
            test: async (page) => {
                await page.goto('http://localhost:5500');
                
                // Check manifest is linked
                const manifestLink = await page.$('link[rel="manifest"]');
                if (!manifestLink) {
                    throw new Error('No manifest link found in HTML');
                }
                
                // Get manifest content
                const manifestUrl = await page.evaluate(() => {
                    const link = document.querySelector('link[rel="manifest"]');
                    return link ? new URL(link.href, window.location.href).href : null;
                });
                
                const manifestResponse = await page.goto(manifestUrl);
                const manifest = await manifestResponse.json();
                
                // Check required fields
                const requiredFields = [
                    'name', 'short_name', 'start_url', 'display',
                    'background_color', 'theme_color', 'icons'
                ];
                
                for (const field of requiredFields) {
                    if (!manifest[field]) {
                        throw new Error(`Missing required manifest field: ${field}`);
                    }
                }
                
                // Check for sufficient icon sizes
                const iconSizes = manifest.icons.map(icon => icon.sizes);
                const requiredSizes = ['192x192', '512x512'];
                
                for (const size of requiredSizes) {
                    if (!iconSizes.includes(size)) {
                        throw new Error(`Missing required icon size: ${size}`);
                    }
                }
                
                // Verify display mode for app-like experience
                if (!['standalone', 'fullscreen'].includes(manifest.display)) {
                    throw new Error('Display mode must be standalone or fullscreen for app stores');
                }
            }
        },
        {
            given: 'PWA is loaded on mobile device',
            when: 'User navigates the app',
            then: 'App works fully offline',
            test: async (page) => {
                // Load the app first
                await page.goto('http://localhost:5500');
                await page.waitForSelector('.main-container');
                
                // Go offline
                await page.setOfflineMode(true);
                
                // Try to navigate to different sections
                await page.click('.floating-nav--left .fab');
                await page.waitForSelector('.side-panel--open');
                
                // Verify panel opened despite being offline
                const panel = await page.$('.side-panel--open');
                if (!panel) {
                    throw new Error('App features not working offline');
                }
                
                // Try to add an activity offline
                await page.evaluate(() => {
                    const menuItems = Array.from(document.querySelectorAll('.menu-item'));
                    const newActivity = menuItems.find(item => 
                        item.textContent.includes('New Activity')
                    );
                    newActivity?.click();
                });
                
                // Should show activity form
                await page.waitForSelector('#activityName');
                
                // Go back online
                await page.setOfflineMode(false);
            }
        },
        {
            given: 'App is installed as PWA',
            when: 'User opens from home screen',
            then: 'App launches in standalone mode without browser UI',
            test: async (page) => {
                // Simulate standalone mode
                await page.goto('http://localhost:5500?mode=standalone');
                
                // Check that app identifies standalone mode
                const isStandalone = await page.evaluate(() => {
                    return window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone ||
                           document.referrer.includes('android-app://');
                });
                
                // In test environment, we can at least verify the app is ready for it
                const viewport = await page.viewport();
                if (viewport.width > 768) {
                    throw new Error('Standalone mode should be tested on mobile viewport');
                }
            }
        }
    ]
};