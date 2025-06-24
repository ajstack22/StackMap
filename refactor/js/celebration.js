/**
 * Celebration System for StackMap
 * Provides gentle, ADHD-friendly celebrations for task completion
 * Respects sensory preferences and safe mode
 */

(() => {
    'use strict';
    
    const CelebrationSystem = {
        isInitialized: false,
        isCelebrating: false,
        
        /**
         * Initialize the celebration system
         */
        init: function() {
            if (this.isInitialized) return;
            this.isInitialized = true;
            
            // Create celebration container
            this.createCelebrationContainer();
            
            // Listen for celebration events
            document.addEventListener('celebrate', (e) => {
                this.celebrate(e.detail);
            });
        },
        
        /**
         * Create the celebration container
         */
        createCelebrationContainer: function() {
            const container = document.createElement('div');
            container.id = 'celebration-container';
            container.className = 'celebration-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
            this.container = container;
        },
        
        /**
         * Trigger a celebration
         */
        celebrate: function(options) {
            // Skip if already celebrating or in safe mode
            if (this.isCelebrating) return;
            if (document.body.classList.contains('safe-mode')) {
                // In safe mode, just show a simple message
                this.showSimpleMessage(options.message || 'Great job! ✨');
                return;
            }
            
            this.isCelebrating = true;
            
            // Default options
            options = options || {};
            const type = options.type || 'small'; // small, medium, large
            const message = options.message || 'Nice work!';
            const duration = options.duration || 2000;
            
            // Show celebration based on type
            switch (type) {
                case 'large':
                    this.largeSuccess(message, duration);
                    break;
                case 'medium':
                    this.mediumSuccess(message, duration);
                    break;
                default:
                    this.smallSuccess(message, duration);
            }
            
            // Reset flag after celebration
            setTimeout(() => {
                this.isCelebrating = false;
            }, duration + 500);
        },
        
        /**
         * Small celebration - single task complete
         */
        smallSuccess: function(message, duration) {
            // Create floating emoji
            const emoji = document.createElement('div');
            emoji.className = 'celebration-emoji small-celebration';
            emoji.textContent = '✅';
            emoji.style.left = `${Math.random() * 80 + 10}%`;
            
            this.container.appendChild(emoji);
            
            // Animate and remove
            setTimeout(() => {
                emoji.classList.add('floating');
            }, 10);
            
            setTimeout(function() {
                if (emoji.parentNode) {
                    emoji.parentNode.removeChild(emoji);
                }
            }, duration);
            
            // Show message
            this.showMessage(message, 'success', duration);
        },
        
        /**
         * Medium celebration - multiple tasks or milestone
         */
        mediumSuccess: function(message, duration) {
            const emojis = ['🎉', '✨', '🌟', '💫', '⭐'];
            const count = 5;
            
            // Create multiple floating elements
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const emoji = document.createElement('div');
                    emoji.className = 'celebration-emoji medium-celebration';
                    emoji.textContent = emojis[i % emojis.length];
                    emoji.style.left = `${Math.random() * 80 + 10}%`;
                    emoji.style.animationDelay = `${i * 100}ms`;
                    
                    this.container.appendChild(emoji);
                    
                    setTimeout(() => {
                        emoji.classList.add('floating');
                    }, 10);
                    
                    setTimeout(() => {
                        if (emoji.parentNode) {
                            emoji.parentNode.removeChild(emoji);
                        }
                    }, duration + (i * 100));
                }, i * 100);
            }
            
            // Show message
            this.showMessage(message, 'celebration', duration);
        },
        
        /**
         * Large celebration - all tasks complete
         */
        largeSuccess: function(message, duration) {
            
            // Create confetti effect (CSS-only for performance)
            const confetti = document.createElement('div');
            confetti.className = 'confetti-burst';
            self.container.appendChild(confetti);
            
            // Add multiple confetti pieces
            const colors = ['#FFD700', '#FF69B4', '#00CED1', '#98FB98', '#DDA0DD'];
            for (let i = 0; i < 20; i++) {
                const piece = document.createElement('div');
                piece.className = 'confetti-piece';
                piece.style.backgroundColor = colors[i % colors.length];
                piece.style.left = `${Math.random() * 100}%`;
                piece.style.animationDelay = `${Math.random() * 0.5}s`;
                piece.style.animationDuration = `${1.5 + Math.random() * 1}s`;
                confetti.appendChild(piece);
            }
            
            // Pulse the whole interface gently
            document.body.classList.add('celebration-pulse');
            
            // Show big message
            self.showMessage(message, 'big-celebration', duration + 1000);
            
            // Cleanup
            setTimeout(function() {
                document.body.classList.remove('celebration-pulse');
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, duration + 1500);
        },
        
        /**
         * Show a celebration message
         */
        showMessage: function(text, type, duration) {
            const message = document.createElement('div');
            message.className = `celebration-message ${type}`;
            message.textContent = text;
            message.setAttribute('role', 'status');
            
            this.container.appendChild(message);
            
            // Fade in
            setTimeout(function() {
                message.classList.add('visible');
            }, 10);
            
            // Fade out and remove
            setTimeout(function() {
                message.classList.remove('visible');
                setTimeout(function() {
                    if (message.parentNode) {
                        message.parentNode.removeChild(message);
                    }
                }, 300);
            }, duration - 300);
        },
        
        /**
         * Simple message for safe mode
         */
        showSimpleMessage: function(text) {
            const message = document.createElement('div');
            message.className = 'celebration-message simple';
            message.textContent = text;
            message.setAttribute('role', 'status');
            
            this.container.appendChild(message);
            
            // Show briefly
            setTimeout(() => {
                message.classList.add('visible');
            }, 10);
            
            setTimeout(() => {
                message.classList.remove('visible');
                setTimeout(() => {
                    if (message.parentNode) {
                        message.parentNode.removeChild(message);
                    }
                }, 300);
            }, 2000);
        },
        
        /**
         * Test celebrations (for development)
         */
        test: function() {
            console.log('Testing celebrations...');
            
            // Test small
            this.celebrate({ type: 'small', message: 'Task completed!' });
            
            setTimeout(() => {
                // Test medium
                this.celebrate({ type: 'medium', message: '5 tasks done today! 🎉' });
            }, 3000);
            
            setTimeout(function() {
                // Test large
                self.celebrate({ type: 'large', message: 'All tasks complete! Amazing work! 🌟' });
            }, 6000);
        }
    };
    
    // Expose to global scope
    window.CelebrationSystem = CelebrationSystem;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            CelebrationSystem.init();
        });
    } else {
        setTimeout(function() {
            CelebrationSystem.init();
        }, 100);
    }
})();