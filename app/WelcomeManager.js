// app/WelcomeManager.js - Welcome splash functionality
// === WELCOME SPLASH MANAGER ===
export class WelcomeManager {
    constructor(app) {
        this.app = app;
    }

    // WELCOME SPLASH MANAGEMENT
    checkFirstTimeVisit() {
        const hasSeenWelcome = localStorage.getItem('stackmap-welcome-seen');
        if (!hasSeenWelcome) {
            this.showWelcomeSplash();
        }
    }

    showWelcomeSplash() {
        const welcomeSplash = document.getElementById('welcomeSplash');
        if (welcomeSplash) {
            // Add body class for button glow effect
            document.body.classList.add('showing-welcome');
            
            // Show the splash with a slight delay for better UX
            setTimeout(() => {
                welcomeSplash.classList.remove('hidden');
                
                // Set up event listeners for dismissal
                welcomeSplash.addEventListener('click', (e) => {
                    // Only dismiss if clicking outside the content
                    if (e.target === welcomeSplash) {
                        this.dismissWelcome();
                    }
                });
                
                // Escape key dismissal
                const handleEscape = (e) => {
                    if (e.key === 'Escape') {
                        this.dismissWelcome();
                        document.removeEventListener('keydown', handleEscape);
                    }
                };
                document.addEventListener('keydown', handleEscape);
            }, 500);
        }
    }

    dismissWelcome() {
        const welcomeSplash = document.getElementById('welcomeSplash');
        if (welcomeSplash) {
            // Fade out the welcome splash
            welcomeSplash.style.animation = 'welcomeFadeOut 0.3s ease-out forwards';
            
            // Remove from DOM and body class after animation
            setTimeout(() => {
                welcomeSplash.classList.add('hidden');
                document.body.classList.remove('showing-welcome');
                
                // Mark as seen in localStorage
                localStorage.setItem('stackmap-welcome-seen', 'true');
            }, 300);
        }
    }

    showWelcomeAgain() {
        // Close preferences panel first
        this.app.preferencesManager.closePreferences();
        
        // Show welcome splash again (temporarily reset the localStorage flag)
        const originalFlag = localStorage.getItem('stackmap-welcome-seen');
        localStorage.removeItem('stackmap-welcome-seen');
        
        setTimeout(() => {
            this.showWelcomeSplash();
            
            // Override the dismissWelcome method temporarily to restore the flag
            const originalDismiss = this.dismissWelcome.bind(this);
            this.dismissWelcome = () => {
                originalDismiss();
                if (originalFlag) {
                    localStorage.setItem('stackmap-welcome-seen', originalFlag);
                }
                // Restore original method
                this.dismissWelcome = originalDismiss;
            };
        }, 100);
    }
}