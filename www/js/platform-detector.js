/**
 * Platform Detection Module for StackMap
 * Detects whether app is running as PWA, iOS app, or Android app
 */

export class PlatformDetector {
  constructor() {
    this.isCapacitor = window.Capacitor !== undefined;
    this.platform = this.detectPlatform();
    this.setupPlatformClasses();
  }

  detectPlatform() {
    if (!this.isCapacitor) {
      return { 
        type: 'web', 
        isInstalled: this.isPWAInstalled(),
        isStandalone: this.isStandalone() 
      };
    }
    
    const platform = window.Capacitor.getPlatform();
    return {
      type: platform, // 'ios', 'android', or 'web'
      isInstalled: true,
      version: window.Capacitor.version,
      isNative: platform !== 'web'
    };
  }

  isPWAInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  }

  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  setupPlatformClasses() {
    const body = document.body;
    
    // Remove any existing platform classes
    body.classList.remove('platform-web', 'platform-ios', 'platform-android', 'platform-pwa', 'native-app');
    
    // Add appropriate classes
    if (this.isCapacitor) {
      body.classList.add('native-app');
      body.classList.add(`platform-${this.platform.type}`);
    } else {
      body.classList.add('platform-web');
      if (this.platform.isInstalled) {
        body.classList.add('platform-pwa');
      }
    }
  }

  // Check if running in school network (basic detection)
  isSchoolNetwork() {
    // Common school network patterns
    const schoolPatterns = [
      /\.edu$/,
      /\.k12\./,
      /school/i,
      /district/i
    ];
    
    const hostname = window.location.hostname;
    return schoolPatterns.some(pattern => pattern.test(hostname));
  }

  // Get storage quota for offline capabilities
  async getStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentUsed: ((estimate.usage || 0) / (estimate.quota || 1)) * 100
      };
    }
    return null;
  }

  // Check if update is available (for native apps)
  async checkForUpdate() {
    if (this.isCapacitor && window.Capacitor.Plugins?.App) {
      try {
        const info = await window.Capacitor.Plugins.App.getInfo();
        // In production, compare with server version
        console.log('App version:', info.version);
        return false; // Placeholder
      } catch (error) {
        console.error('Error checking for update:', error);
        return false;
      }
    }
    return false;
  }

  // Platform-specific features
  async requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    }
    return false;
  }

  // Get platform-specific info for debugging
  getDebugInfo() {
    return {
      platform: this.platform,
      isCapacitor: this.isCapacitor,
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine,
      language: navigator.language,
      isSchoolNetwork: this.isSchoolNetwork()
    };
  }
}

// Create singleton instance
const platformDetector = new PlatformDetector();

// Export for use in other modules
export default platformDetector;