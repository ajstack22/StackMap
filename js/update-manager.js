/**
 * Update Manager for StackMap
 * Handles Service Worker updates for both PWA and wrapped app versions
 */

export class UpdateManager {
  constructor() {
    this.checkInterval = 3600000; // 1 hour
    this.registration = null;
    this.updateAvailable = false;
    this.setupUpdateChecking();
  }

  async setupUpdateChecking() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready;
        
        // Check for updates periodically
        this.startPeriodicChecks();
        
        // Handle update found
        this.registration.addEventListener('updatefound', () => {
          this.handleUpdateFound();
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'UPDATE_AVAILABLE') {
            this.updateAvailable = true;
            this.showUpdatePrompt();
          }
        });

        // Check immediately on load
        this.checkForUpdate();
      } catch (error) {
        console.error('Error setting up update checking:', error);
      }
    }
  }

  startPeriodicChecks() {
    // Initial check after 5 minutes
    setTimeout(() => {
      this.checkForUpdate();
    }, 300000);

    // Then check every hour
    setInterval(() => {
      this.checkForUpdate();
    }, this.checkInterval);
  }

  async checkForUpdate() {
    if (this.registration) {
      try {
        await this.registration.update();
        console.log('Checked for updates');
      } catch (error) {
        console.error('Update check failed:', error);
      }
    }
  }

  handleUpdateFound() {
    const newWorker = this.registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is ready
        this.updateAvailable = true;
        this.showUpdatePrompt();
      }
    });
  }

  showUpdatePrompt() {
    // Create non-intrusive update notification
    const updateBanner = this.createUpdateBanner();
    document.body.appendChild(updateBanner);
    
    // Auto-hide after 30 seconds if not acted upon
    setTimeout(() => {
      if (updateBanner.parentNode) {
        updateBanner.style.opacity = '0';
        setTimeout(() => updateBanner.remove(), 300);
      }
    }, 30000);
  }

  createUpdateBanner() {
    const banner = document.createElement('div');
    banner.className = 'stackmap-update-banner';
    banner.innerHTML = `
      <div class="update-content">
        <span class="update-icon">🆕</span>
        <span class="update-text">A new version of StackMap is ready!</span>
        <button class="update-button" onclick="updateManager.performUpdate()">Update Now</button>
        <button class="dismiss-button" onclick="this.parentElement.parentElement.remove()">Later</button>
      </div>
    `;
    
    // Add styles if not already present
    if (!document.getElementById('update-banner-styles')) {
      const styles = document.createElement('style');
      styles.id = 'update-banner-styles';
      styles.textContent = `
        .stackmap-update-banner {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #4CAF50;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          animation: slideUp 0.3s ease-out;
          transition: opacity 0.3s ease;
        }
        
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100%);
          }
          to {
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .update-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .update-icon {
          font-size: 20px;
        }
        
        .update-text {
          flex: 1;
          margin-right: 10px;
        }
        
        .update-button, .dismiss-button {
          background: white;
          color: #4CAF50;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        
        .dismiss-button {
          background: transparent;
          color: white;
          text-decoration: underline;
        }
        
        .update-button:hover {
          opacity: 0.9;
        }
        
        .dismiss-button:hover {
          opacity: 0.8;
        }
        
        @media (max-width: 600px) {
          .stackmap-update-banner {
            left: 10px;
            right: 10px;
            transform: none;
            bottom: 10px;
          }
          
          .update-content {
            flex-wrap: wrap;
          }
          
          .update-text {
            width: 100%;
            margin-bottom: 10px;
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
    return banner;
  }

  async performUpdate() {
    if (this.registration && this.registration.waiting) {
      // Tell the waiting service worker to activate
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Show loading state
      const banner = document.querySelector('.stackmap-update-banner');
      if (banner) {
        banner.innerHTML = '<div class="update-content">Updating... Please wait...</div>';
      }
      
      // Reload when the new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  // Get update status for debugging
  getUpdateStatus() {
    return {
      updateAvailable: this.updateAvailable,
      hasServiceWorker: 'serviceWorker' in navigator,
      registration: this.registration ? {
        scope: this.registration.scope,
        active: this.registration.active?.state,
        waiting: this.registration.waiting?.state,
        installing: this.registration.installing?.state
      } : null
    };
  }

  // Force check for updates (for testing)
  async forceUpdateCheck() {
    console.log('Forcing update check...');
    await this.checkForUpdate();
    return this.updateAvailable;
  }
}

// Create singleton instance
const updateManager = new UpdateManager();

// Make it globally available for the onclick handler
window.updateManager = updateManager;

export default updateManager;