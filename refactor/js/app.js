/**
 * StackMap Mobile-First Application
 * Main entry point
 */

// Import modules (using script tags in HTML for now)
// Later can use ES6 modules if needed

(function() {
    'use strict';
    
    // Application state
    const App = {
        currentView: 'loading-view',
        platform: null,
        views: {}
    };
    
    // View Controller
    const ViewController = {
        init: function() {
            // Cache all view elements
            const viewElements = document.querySelectorAll('.view');
            viewElements.forEach(function(view) {
                App.views[view.id] = view;
            });
        },
        
        show: function(viewId, options) {
            options = options || {};
            const fromView = App.views[App.currentView];
            const toView = App.views[viewId];
            
            if (!toView || fromView === toView) return;
            
            // Handle transition
            if (options.animate && fromView) {
                fromView.classList.add('sliding-out');
                toView.classList.remove('hidden');
                toView.classList.add('sliding-in');
                
                setTimeout(function() {
                    fromView.classList.add('hidden');
                    fromView.classList.remove('sliding-out');
                    toView.classList.remove('sliding-in');
                }, 300);
            } else {
                // Instant transition
                fromView.classList.add('hidden');
                toView.classList.remove('hidden');
            }
            
            App.currentView = viewId;
            
            // Update history for web
            if (Platform.isWeb() && options.updateHistory !== false) {
                const path = viewId === 'main-view' ? '/' : '#' + viewId.replace('-view', '');
                history.pushState({ view: viewId }, '', path);
            }
        }
    };
    
    // Platform Detection and Adaptation
    const Platform = {
        detect: function() {
            const ua = navigator.userAgent;
            App.platform = {
                isCapacitor: typeof window.Capacitor !== 'undefined',
                isAndroid: false,
                isIOS: false,
                isPWA: window.matchMedia('(display-mode: standalone)').matches,
                isTV: ua.includes('TV') || window.innerWidth > 1920,
                isWeb: false
            };
            
            if (App.platform.isCapacitor) {
                const platform = window.Capacitor.getPlatform();
                App.platform.isAndroid = platform === 'android';
                App.platform.isIOS = platform === 'ios';
            } else if (!App.platform.isPWA) {
                App.platform.isWeb = true;
            }
            
            return App.platform;
        },
        
        isWeb: function() {
            return App.platform && App.platform.isWeb;
        },
        
        isTV: function() {
            return App.platform && App.platform.isTV;
        },
        
        isMobile: function() {
            return App.platform && (App.platform.isCapacitor || App.platform.isPWA);
        }
    };
    
    // Navigation Handler
    const Navigation = {
        init: function() {
            // Handle all link clicks
            document.addEventListener('click', this.handleClick.bind(this));
            
            // Handle back button
            window.addEventListener('popstate', this.handlePopState.bind(this));
            
            // Set up view navigation buttons
            this.setupViewButtons();
            
            // TV remote navigation
            if (Platform.isTV()) {
                TVNavigation.init();
            }
        },
        
        handleClick: function(e) {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href || href === '#') return;
            
            e.preventDefault();
            
            // Internal navigation
            if (href.startsWith('#')) {
                const viewId = href.substring(1) + '-view';
                ViewController.show(viewId, { animate: true });
            }
            // External links
            else if (href.startsWith('http')) {
                this.openExternal(href);
            }
        },
        
        handlePopState: function(e) {
            if (e.state && e.state.view) {
                ViewController.show(e.state.view, { animate: true, updateHistory: false });
            }
        },
        
        setupViewButtons: function() {
            // Menu button
            const menuBtn = document.getElementById('menu-button');
            if (menuBtn) {
                menuBtn.addEventListener('click', function() {
                    ViewController.show('settings-view', { animate: true });
                });
            }
            
            // Back buttons
            const backButtons = document.querySelectorAll('[id$="-back"]');
            backButtons.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (Platform.isWeb()) {
                        history.back();
                    } else {
                        ViewController.show('main-view', { animate: true });
                    }
                });
            });
        },
        
        openExternal: function(url) {
            if (App.platform.isCapacitor && window.Capacitor.Plugins.Browser) {
                window.Capacitor.Plugins.Browser.open({ url: url });
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }
    };
    
    // TV Navigation Support
    const TVNavigation = {
        init: function() {
            document.addEventListener('keydown', this.handleKeyPress.bind(this));
            this.ensureFocusable();
        },
        
        handleKeyPress: function(e) {
            switch(e.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    e.preventDefault();
                    this.moveFocus(e.key);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (document.activeElement) {
                        document.activeElement.click();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Go back
                    const backBtn = document.querySelector('[id$="-back"]:not(.hidden [id$="-back"])');
                    if (backBtn) backBtn.click();
                    break;
            }
        },
        
        ensureFocusable: function() {
            // Make all interactive elements focusable
            const elements = document.querySelectorAll('button, a, input, select, textarea');
            elements.forEach(function(el) {
                if (!el.hasAttribute('tabindex')) {
                    el.setAttribute('tabindex', '0');
                }
            });
        },
        
        moveFocus: function(direction) {
            // Simple spatial navigation
            // TODO: Implement proper spatial navigation algorithm
            const focusable = Array.from(document.querySelectorAll(
                ':not(.hidden) button:not([disabled]), ' +
                ':not(.hidden) a[href], ' +
                ':not(.hidden) input:not([disabled]), ' +
                ':not(.hidden) select:not([disabled]), ' +
                ':not(.hidden) textarea:not([disabled]), ' +
                ':not(.hidden) [tabindex="0"]'
            ));
            
            const current = document.activeElement;
            const currentIndex = focusable.indexOf(current);
            
            let nextIndex;
            if (direction === 'ArrowDown' || direction === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % focusable.length;
            } else {
                nextIndex = currentIndex - 1;
                if (nextIndex < 0) nextIndex = focusable.length - 1;
            }
            
            if (focusable[nextIndex]) {
                focusable[nextIndex].focus();
            }
        }
    };
    
    // Storage Manager (for offline support)
    const Storage = {
        init: function() {
            // Initialize storage
            this.loadSettings();
            this.loadTasks();
        },
        
        loadSettings: function() {
            try {
                const settings = localStorage.getItem('stackmap-settings');
                if (settings) {
                    // Apply settings
                    console.log('Settings loaded');
                }
            } catch (e) {
                console.warn('Could not load settings:', e);
            }
        },
        
        loadTasks: function() {
            try {
                const tasks = localStorage.getItem('stackmap-tasks');
                if (tasks) {
                    // Load tasks into UI
                    console.log('Tasks loaded');
                }
            } catch (e) {
                console.warn('Could not load tasks:', e);
            }
        },
        
        save: function(key, data) {
            try {
                localStorage.setItem('stackmap-' + key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        }
    };
    
    // Content Manager
    const Content = {
        load: function() {
            // Load content for views that need it
            this.loadPrivacy();
            this.loadTerms();
            this.loadSupport();
        },
        
        loadPrivacy: function() {
            const container = document.querySelector('#privacy-view .content');
            if (container) {
                container.innerHTML = `
                    <h2>Privacy Policy</h2>
                    <p>Last updated: December 2024</p>
                    <h3>Data Collection</h3>
                    <p>StackMap stores all data locally on your device. We do not collect, transmit, or store any personal information on our servers.</p>
                    <h3>Local Storage</h3>
                    <p>Your tasks and preferences are saved in your browser's local storage and remain on your device.</p>
                    <h3>Analytics</h3>
                    <p>We use privacy-focused analytics to improve the app. No personal data is collected.</p>
                `;
            }
        },
        
        loadTerms: function() {
            const container = document.querySelector('#terms-view .content');
            if (container) {
                container.innerHTML = `
                    <h2>Terms of Service</h2>
                    <p>Last updated: December 2024</p>
                    <h3>Usage</h3>
                    <p>StackMap is provided as-is for personal task management.</p>
                    <h3>Liability</h3>
                    <p>We are not responsible for data loss. Please maintain backups of important information.</p>
                `;
            }
        },
        
        loadSupport: function() {
            const container = document.querySelector('#support-view .content');
            if (container) {
                container.innerHTML = `
                    <h2>Support StackMap</h2>
                    <p>StackMap is free and open source. Your support helps maintain and improve the app.</p>
                    <div class="support-options">
                        <a href="https://paypal.me/stackadamj" class="support-link">PayPal</a>
                        <a href="https://venmo.com/u/stackadamj" class="support-link">Venmo</a>
                        <a href="https://patreon.com/StackMap" class="support-link">Patreon</a>
                    </div>
                `;
            }
        }
    };
    
    // Initialize Application
    function init() {
        // Detect platform
        Platform.detect();
        
        // Initialize modules
        ViewController.init();
        Navigation.init();
        Storage.init();
        Content.load();
        
        // Show main view
        setTimeout(function() {
            ViewController.show('main-view', { animate: true });
        }, 500);
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose API for debugging
    window.StackMapApp = {
        App: App,
        ViewController: ViewController,
        Platform: Platform,
        Navigation: Navigation,
        Storage: Storage
    };
})();