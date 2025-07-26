import { AppRegistry, Platform } from 'react-native';
import App from './App';

// Disable useNativeDriver warnings on web
if (Platform.OS === 'web') {
  // Store the original console.warn
  const originalWarn = console.warn;
  
  // Override console.warn to filter out useNativeDriver warnings
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('useNativeDriver')) {
      return; // Suppress useNativeDriver warnings
    }
    originalWarn.apply(console, args);
  };
}

// Import Comic Relief fonts
import ComicReliefRegular from './fonts/ComicRelief-Regular.ttf';
import ComicReliefBold from './fonts/ComicRelief-Bold.ttf';

// Create font face styles
const fontStyles = document.createElement('style');
fontStyles.innerHTML = `
  @font-face {
    font-family: 'Comic Relief';
    src: url(${ComicReliefRegular}) format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Comic Relief';
    src: url(${ComicReliefBold}) format('truetype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }
  
  /* Critical: Ensure React Native Web respects viewport constraints */
  #root > div:first-child {
    height: 100% !important;
    max-height: 100% !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  /* Ensure nested containers also respect height */
  #root > div > div {
    height: 100% !important;
    max-height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  /* Force Comic Relief everywhere - override any Comic Neue */
  body, div:not([style*="Material Icons"]), span:not([style*="Material Icons"]), 
  p, h1, h2, h3, h4, h5, h6, button, input, textarea, select {
    font-family: 'Comic Relief', 'Comic Sans MS', cursive !important;
  }
  
  /* Preserve Material Icons font - must not override inline styles */
  [style*="Material Icons"] {
    font-family: 'Material Icons' !important;
    font-weight: normal !important;
    font-style: normal !important;
    letter-spacing: normal !important;
    text-transform: none !important;
    white-space: nowrap !important;
    word-wrap: normal !important;
    direction: ltr !important;
    -webkit-font-feature-settings: 'liga' !important;
    -webkit-font-smoothing: antialiased !important;
  }
`;
document.head.appendChild(fontStyles);

// Register the app
AppRegistry.registerComponent('StackMap', () => App);

// Run the app on web
AppRegistry.runApplication('StackMap', {
  initialProps: {},
  rootTag: document.getElementById('root')
});

// Register service worker for PWA
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    // First, clear any existing caches if there's a version mismatch
    // This ensures we always use the latest bundle
    const clearOldCaches = async () => {
      const cacheNames = await caches.keys();
      
      // Get the current bundle name from the script tag
      const scripts = document.getElementsByTagName('script');
      let currentBundleHash = null;
      for (const script of scripts) {
        const match = script.src.match(/bundle\.([a-f0-9]+)\.js/);
        if (match) {
          currentBundleHash = match[1];
          break;
        }
      }
      
      if (!currentBundleHash) {
        console.log('Could not determine current bundle hash');
        return false;
      }
      
      // Check if any cache contains old bundles
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const cachedRequests = await cache.keys();
        
        for (const request of cachedRequests) {
          // If we find an old bundle in cache, clear all caches
          if (request.url.includes('bundle.') && !request.url.includes(currentBundleHash)) {
            console.log('Found old bundle in cache, clearing all caches...');
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            return true;
          }
        }
      }
      return false;
    };
    
    clearOldCaches().then(cleared => {
      if (cleared) {
        console.log('Old caches cleared, registering service worker...');
      }
      
      return navigator.serviceWorker.register('./service-worker.js');
    }).then((registration) => {
        console.log('PWA service worker registered:', registration);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              // New content available - clear all caches and reload
              console.log('New app version available! Clearing caches and reloading...');
              
              // Clear all caches
              caches.keys().then(cacheNames => {
                return Promise.all(
                  cacheNames.map(cacheName => {
                    console.log('Clearing cache:', cacheName);
                    return caches.delete(cacheName);
                  })
                );
              }).then(() => {
                // Force reload
                window.location.reload(true);
              });
            }
          });
        });
      })
      .catch((error) => {
        console.log('Service worker registration failed:', error);
      });
  });
}