/**
 * Celebration System for StackMap
 * Provides gentle, ADHD-friendly celebrations for task completion
 * Respects sensory preferences and safe mode
 */

(function() {
    'use strict';
    
    const CelebrationSystem = {
        isInitialized: false,
        isCelebrating: false,
        
        /**
         * Initialize the celebration system
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            self.isInitialized = true;
            
            // Create celebration container
            self.createCelebrationContainer();
            
            // Listen for celebration events
            document.addEventListener('celebrate', function(e) {
                self.celebrate(e.detail);
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
            const self = this;
            
            // Skip if already celebrating or in safe mode
            if (self.isCelebrating) return;
            if (document.body.classList.contains('safe-mode')) {
                // In safe mode, just show a simple message
                self.showSimpleMessage(options.message || 'Great job! ✨');
                return;
            }
            
            self.isCelebrating = true;
            
            // Default options
            options = options || {};
            const type = options.type || 'small'; // small, medium, large
            const message = options.message || 'Nice work!';
            const duration = options.duration || 2000;
            
            // Show celebration based on type
            switch (type) {
                case 'large':
                    self.largeSuccess(message, duration);
                    break;
                case 'medium':
                    self.mediumSuccess(message, duration);
                    break;
                default:
                    self.smallSuccess(message, duration);
            }
            
            // Reset flag after celebration
            setTimeout(function() {
                self.isCelebrating = false;
            }, duration + 500);
        },
        
        /**
         * Small celebration - single task complete
         */
        smallSuccess: function(message, duration) {
            const self = this;
            
            // Create floating emoji
            const emoji = document.createElement('div');
            emoji.className = 'celebration-emoji small-celebration';
            emoji.textContent = '✅';
            emoji.style.left = `${Math.random() * 80 + 10}%`;
            
            self.container.appendChild(emoji);
            
            // Animate and remove
            setTimeout(function() {
                emoji.classList.add('floating');
            }, 10);
            
            setTimeout(function() {
                if (emoji.parentNode) {
                    emoji.parentNode.removeChild(emoji);
                }
            }, duration);
            
            // Show message
            self.showMessage(message, 'success', duration);
        },
        
        /**
         * Medium celebration - multiple tasks or milestone
         */
        mediumSuccess: function(message, duration) {
            const self = this;
            const emojis = ['🎉', '✨', '🌟', '💫', '⭐'];
            const count = 5;
            
            // Create multiple floating elements
            for (let i = 0; i < count; i++) {
                (function(index) {
                    setTimeout(function() {
                        const emoji = document.createElement('div');
                        emoji.className = 'celebration-emoji medium-celebration';
                        emoji.textContent = emojis[index % emojis.length];
                        emoji.style.left = `${Math.random() * 80 + 10}%`;
                        emoji.style.animationDelay = `${index * 100}ms`;
                        
                        self.container.appendChild(emoji);
                        
                        setTimeout(function() {
                            emoji.classList.add('floating');
                        }, 10);
                        
                        setTimeout(function() {
                            if (emoji.parentNode) {
                                emoji.parentNode.removeChild(emoji);
                            }
                        }, duration + (index * 100));
                    }, index * 100);
                })(i);
            }
            
            // Show message
            self.showMessage(message, 'celebration', duration);
        },
        
        /**
         * Large celebration - all tasks complete
         */
        largeSuccess: function(message, duration) {
            const self = this;
            
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
            const self = this;
            
            const message = document.createElement('div');
            message.className = 'celebration-message simple';
            message.textContent = text;
            message.setAttribute('role', 'status');
            
            self.container.appendChild(message);
            
            // Show briefly
            setTimeout(function() {
                message.classList.add('visible');
            }, 10);
            
            setTimeout(function() {
                message.classList.remove('visible');
                setTimeout(function() {
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
            const self = this;
            
            console.log('Testing celebrations...');
            
            // Test small
            self.celebrate({ type: 'small', message: 'Task completed!' });
            
            setTimeout(function() {
                // Test medium
                self.celebrate({ type: 'medium', message: '5 tasks done today! 🎉' });
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