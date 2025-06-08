/**
 * CELEBRATION MANAGER - Core animation system for StackMap
 * Handles all task and routine completion celebrations
 * Designed for special needs accessibility and customization
 */
class CelebrationManager {
    constructor(app) {
        this.app = app;
        this.animations = this.initializeAnimations();
        this.setupAccessibilityFeatures();
        this.injectAnimationStyles();
        console.log('🎉 Celebration Manager initialized');
    }

    /**
     * Initialize all available animations
     * Based on research for special needs users
     */
    initializeAnimations() {
        return {
            task: {
                'none': { name: '❌ No Celebration', func: this.noAnimation },
                'random': { name: '🎲 Random', func: this.randomTaskCelebration },
                'rainbow': { name: '🌈 Rainbow Confetti', func: this.rainbowConfetti },
                'ocean': { name: '🌊 Ocean Blue Confetti', func: this.oceanConfetti },
                'sunset': { name: '🌅 Sunset Orange Confetti', func: this.sunsetConfetti },
                'spring': { name: '🌸 Spring Pastel Confetti', func: this.springConfetti },
                'gold': { name: '⭐ Gold Star Confetti', func: this.goldConfetti },
                'heart': { name: '💖 Pink Heart Confetti', func: this.heartConfetti },
                'cosmic': { name: '🌌 Cosmic Purple Confetti', func: this.cosmicConfetti }
            },
            routine: {
                'none': { name: '❌ No Celebration', func: this.noAnimation },
                'random': { name: '🎲 Random', func: this.randomRoutineCelebration },
                'rainbow': { name: '🌈 Rainbow Fireworks', func: this.rainbowFireworks },
                'ocean': { name: '🌊 Ocean Blue Fireworks', func: this.oceanFireworks },
                'sunset': { name: '🌅 Sunset Orange Fireworks', func: this.sunsetFireworks },
                'spring': { name: '🌸 Spring Pastel Fireworks', func: this.springFireworks },
                'gold': { name: '⭐ Gold Star Fireworks', func: this.goldFireworks },
                'cosmic': { name: '🌌 Cosmic Purple Fireworks', func: this.cosmicFireworks },
                'ultimate': { name: '🎆 Ultimate Fireworks', func: this.ultimateFireworks }
            }
        };
    }

    /**
     * No animation - still provide subtle feedback
     */
    noAnimation(element) {
        element.style.transition = 'background-color 0.5s ease-out';
        element.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        setTimeout(() => {
            element.style.backgroundColor = '';
            element.style.transition = '';
        }, 500);
    }

    /**
     * Random selection with smart logic to avoid recent repeats
     */
    randomTaskCelebration(element) {
        const taskAnimations = Object.keys(this.animations.task)
            .filter(key => key !== 'none' && key !== 'random');
        
        // Simple random for now - could enhance with recent history tracking
        const randomKey = taskAnimations[Math.floor(Math.random() * taskAnimations.length)];
        this.animations.task[randomKey].func.call(this, element);
    }

    randomRoutineCelebration(element) {
        const routineAnimations = Object.keys(this.animations.routine)
            .filter(key => key !== 'none' && key !== 'random');
        
        const randomKey = routineAnimations[Math.floor(Math.random() * routineAnimations.length)];
        this.animations.routine[randomKey].func.call(this, element);
    }

    /**
     * ORIGINAL ANIMATIONS - Full screen celebrations
     */
    
    /**
     * TASK ANIMATIONS - Different colored confetti
     */
    
    // 🌈 Rainbow Confetti
    rainbowConfetti(element) {
        const colors = ['#ff6b9d', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        this.createConfetti(colors, 60);
    }
    
    // 🌊 Ocean Blue Confetti
    oceanConfetti(element) {
        const colors = ['#0077be', '#4ecdc4', '#87ceeb', '#00ced1', '#20b2aa', '#48d1cc'];
        this.createConfetti(colors, 60);
    }
    
    // 🌅 Sunset Orange Confetti
    sunsetConfetti(element) {
        const colors = ['#ff6b35', '#ffa726', '#ffeb3b', '#ff5722', '#ffcc02', '#ff8c00'];
        this.createConfetti(colors, 60);
    }
    
    // 🌸 Spring Pastel Confetti
    springConfetti(element) {
        const colors = ['#ff9ff3', '#96ceb4', '#ffeaa7', '#fd79a8', '#a8e6cf', '#ffcccc'];
        this.createConfetti(colors, 60);
    }
    
    // ⭐ Gold Star Confetti
    goldConfetti(element) {
        const colors = ['#ffd700', '#ffb300', '#ff8f00', '#ffc107', '#ffed4e', '#f9a825'];
        this.createConfetti(colors, 60);
    }
    
    // 💖 Pink Heart Confetti
    heartConfetti(element) {
        const colors = ['#ff6b9d', '#ff1744', '#e91e63', '#ff9ff3', '#ffb6c1', '#ff69b4'];
        this.createConfetti(colors, 60);
    }
    
    // 🌌 Cosmic Purple Confetti
    cosmicConfetti(element) {
        const colors = ['#9b59b6', '#8e44ad', '#bf55ec', '#dda0dd', '#da70d6', '#ba55d3'];
        this.createConfetti(colors, 60);
    }
    
    // Helper method to create confetti
    createConfetti(colors, count) {
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = (12 + Math.random() * 8) + 'px';
            confetti.style.height = confetti.style.width;
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animation = `confetti-fall ${confetti.style.animationDuration} linear forwards`;
            confetti.style.boxShadow = `0 0 6px ${confetti.style.background}`;
            
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
    }
    
    /**
     * ROUTINE ANIMATIONS - Different colored fireworks
     */
    
    // 🌈 Rainbow Fireworks
    rainbowFireworks(element) {
        const colors = ['#ff6b9d', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', 
                       '#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#FFA500'];
        this.createFireworks(colors, 15); // 25% more than original 12
    }
    
    // 🌊 Ocean Blue Fireworks
    oceanFireworks(element) {
        const colors = ['#0077be', '#4ecdc4', '#87ceeb', '#00ced1', '#20b2aa', '#48d1cc',
                       '#5f9ea0', '#00bfff', '#1e90ff', '#4682b4'];
        this.createFireworks(colors, 15);
    }
    
    // 🌅 Sunset Orange Fireworks
    sunsetFireworks(element) {
        const colors = ['#ff6b35', '#ffa726', '#ffeb3b', '#ff5722', '#ffcc02', '#ff8c00',
                       '#ff7f50', '#ff6347', '#ffa500', '#ff4500'];
        this.createFireworks(colors, 15);
    }
    
    // 🌸 Spring Pastel Fireworks
    springFireworks(element) {
        const colors = ['#ff9ff3', '#96ceb4', '#ffeaa7', '#fd79a8', '#a8e6cf', '#ffcccc',
                       '#ffb6c1', '#dda0dd', '#f0e68c', '#e6e6fa'];
        this.createFireworks(colors, 15);
    }
    
    // ⭐ Gold Star Fireworks
    goldFireworks(element) {
        const colors = ['#ffd700', '#ffb300', '#ff8f00', '#ffc107', '#ffed4e', '#f9a825',
                       '#ffd54f', '#ffee58', '#fff176', '#fff59d'];
        this.createFireworks(colors, 15);
    }
    
    // 🌌 Cosmic Purple Fireworks
    cosmicFireworks(element) {
        const colors = ['#9b59b6', '#8e44ad', '#bf55ec', '#dda0dd', '#da70d6', '#ba55d3',
                       '#9370db', '#8b7dd8', '#7b68ee', '#6a5acd'];
        this.createFireworks(colors, 15);
    }
    
    // 🎆 Ultimate Fireworks - all colors!
    ultimateFireworks(element) {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
                       '#FF6348', '#DDA0DD', '#98FB98', '#87CEEB', '#FF69B4', '#00CED1',
                       '#FF1493', '#00FA9A', '#FFB6C1', '#20B2AA', '#FFA500', '#ADFF2F'];
        this.createFireworks(colors, 20); // Even more for ultimate celebration
    }

    // Helper method to create fireworks with 25% increased size and rate
    createFireworks(colors, burstCount) {
        for (let burst = 0; burst < burstCount; burst++) {
            setTimeout(() => {
                const x = 10 + Math.random() * 80;
                const y = 10 + Math.random() * 60;
                const burstColor = colors[Math.floor(Math.random() * colors.length)];
                const particleCount = 19 + Math.floor(Math.random() * 13); // 25% more particles (was 15-25, now 19-31)
                const burstSize = 1 + Math.random() * 0.75; // 25% larger (was 0.8-1.4, now 1-1.75)
                
                // Create burst center flash - 25% larger
                const flash = document.createElement('div');
                flash.className = 'firework-burst';
                flash.style.left = x + '%';
                flash.style.top = y + '%';
                flash.style.width = '25px'; // 25% larger (was 20px)
                flash.style.height = '25px';
                flash.style.background = burstColor;
                flash.style.boxShadow = `0 0 25px ${burstColor}, 0 0 50px ${burstColor}`;
                flash.style.transform = 'translate(-50%, -50%)';
                
                document.body.appendChild(flash);
                
                flash.animate([
                    { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                    { transform: 'translate(-50%, -50%) scale(2.5)', opacity: 0 } // 25% larger scale
                ], {
                    duration: 300,
                    easing: 'ease-out'
                });
                
                setTimeout(() => flash.remove(), 300);
                
                // Create particles
                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'firework-particle';
                    const angle = (Math.PI * 2 * i) / particleCount;
                    const velocity = (50 + Math.random() * 50) * burstSize; // 25% more velocity
                    const particleSize = (5 + Math.random() * 7.5) + 'px'; // 25% larger particles
                    const particleColor = Math.random() > 0.5 ? burstColor : colors[Math.floor(Math.random() * colors.length)];
                    
                    particle.style.left = x + '%';
                    particle.style.top = y + '%';
                    particle.style.width = particleSize;
                    particle.style.height = particleSize;
                    particle.style.background = particleColor;
                    particle.style.boxShadow = `0 0 8px ${particleColor}`;
                    
                    const endX = Math.cos(angle) * velocity;
                    const endY = Math.sin(angle) * velocity;
                    
                    document.body.appendChild(particle);
                    
                    particle.animate([
                        { 
                            transform: `translate(-50%, -50%)`,
                            opacity: 1
                        },
                        { 
                            transform: `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px))`,
                            opacity: 0
                        }
                    ], {
                        duration: 1500,
                        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    });
                    
                    setTimeout(() => particle.remove(), 1500);
                }
            }, burst * 160); // 25% faster rate (was 200ms)
        }
    }



    /**
     * Helper methods for animations
     */
    
    addAnimationClass(element, className) {
        element.classList.add('celebration-animation', className);
    }
    

    cleanupAfterAnimation(element, duration) {
        setTimeout(() => {
            element.classList.remove('celebration-animation');
            element.className = element.className.replace(/celebrate-[\w-]+/g, '').trim();
        }, duration);
    }

    createParticles(element, emoji, count, animationClass, isFullScreen = false) {
        const container = isFullScreen ? document.body : element;
        const rect = element.getBoundingClientRect();
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = `celebration-particle ${animationClass}`;
            particle.textContent = emoji;
            particle.setAttribute('aria-hidden', 'true');
            
            if (isFullScreen) {
                particle.style.left = `${rect.left + rect.width / 2}px`;
                particle.style.top = `${rect.top + rect.height / 2}px`;
                particle.style.position = 'fixed';
            } else {
                particle.style.left = '50%';
                particle.style.top = '50%';
                particle.style.position = 'absolute';
            }
            
            // Add slight randomness to position
            const randomX = (Math.random() - 0.5) * 40;
            const randomY = (Math.random() - 0.5) * 20;
            particle.style.transform = `translate(${randomX}px, ${randomY}px)`;
            
            container.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2000);
        }
    }

    createVisibleParticles(element, emoji, count, animationClass) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = `visible-particle ${animationClass}`;
            particle.textContent = emoji;
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.position = 'fixed';
            particle.style.fontSize = '24px';
            particle.style.zIndex = '10000';
            particle.style.pointerEvents = 'none';
            
            // Random starting position offset
            const angle = (Math.PI * 2 * i) / count;
            const offsetX = Math.cos(angle) * 20;
            const offsetY = Math.sin(angle) * 20;
            particle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            
            document.body.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => particle.remove(), 2000);
        }
    }

    addOverlayAnimation(element, overlayClass) {
        const overlay = document.createElement('div');
        overlay.className = `celebration-overlay ${overlayClass}`;
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 3000);
    }

    /**
     * Trigger celebration based on user preference
     */
    celebrateTask(element, userId) {
        const currentUser = this.app.appState.getCurrentUser();
        const preference = currentUser.settings?.taskCelebration || 'rainbow';
        
        if (this.shouldSkipAnimation()) {
            this.noAnimation(element);
            return;
        }

        const animation = this.animations.task[preference];
        if (animation && animation.func) {
            animation.func.call(this, element);
        }
    }

    celebrateRoutine(containerElement, userId) {
        const currentUser = this.app.appState.getCurrentUser();
        const preference = currentUser.settings?.routineCelebration || 'rainbow';
        
        if (this.shouldSkipAnimation()) {
            this.noAnimation(containerElement);
            return;
        }

        const animation = this.animations.routine[preference];
        if (animation && animation.func) {
            animation.func.call(this, containerElement);
        }
    }

    /**
     * Check if animations should be skipped (accessibility)
     */
    shouldSkipAnimation() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Setup accessibility features
     */
    setupAccessibilityFeatures() {
        // Listen for changes to motion preferences
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionQuery.addListener((e) => {
            console.log('Motion preference changed:', e.matches ? 'reduced' : 'normal');
        });
    }

    /**
     * Preview animation for testing (doesn't change state)
     */
    previewAnimation(type, animationKey, element) {
        if (type === 'task') {
            const animation = this.animations.task[animationKey];
            if (animation && animation.func) {
                animation.func.call(this, element);
            }
        } else {
            const animation = this.animations.routine[animationKey];
            if (animation && animation.func) {
                animation.func.call(this, element);
            }
        }
    }

    /**
     * Inject required CSS for animations
     */
    injectAnimationStyles() {
        if (document.getElementById('celebration-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'celebration-styles';
        style.textContent = `
            /* Base celebration styles */
            .celebration-animation {
                position: relative;
                overflow: visible;
                will-change: transform, opacity;
                transform: translateZ(0);
            }

            /* Particle styles */
            .celebration-particle {
                position: absolute;
                pointer-events: none;
                z-index: 1000;
                font-size: 1.5rem;
                user-select: none;
            }

            /* Overlay styles */
            .celebration-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
                opacity: 0;
            }

            /* Respect reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .celebration-animation,
                .celebration-particle,
                .celebration-overlay {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Export for global access
window.CelebrationManager = CelebrationManager;