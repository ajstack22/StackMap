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
                'gentle-glow': { name: '🌟 Gentle Glow', func: this.gentleGlow },
                'peaceful-wave': { name: '🌊 Peaceful Wave', func: this.peacefulWave },
                'soft-breathe': { name: '💚 Soft Breathe', func: this.softBreathe },
                'floating-stars': { name: '⭐ Floating Stars', func: this.floatingStars },
                'floating-hearts': { name: '💖 Floating Hearts', func: this.floatingHearts },
                'gentle-ripple': { name: '💫 Gentle Ripple', func: this.gentleRipple },
                'nature-growth': { name: '🌸 Nature Growth', func: this.natureGrowth },
                'gentle-spiral': { name: '🌀 Gentle Spiral', func: this.gentleSpiral },
                'progress-fill': { name: '📊 Progress Fill', func: this.progressFill }
            },
            routine: {
                'none': { name: '❌ No Celebration', func: this.noAnimation },
                'random': { name: '🎲 Random', func: this.randomRoutineCelebration },
                'sunrise-glow': { name: '🌅 Sunrise Glow', func: this.sunriseGlow },
                'garden-growth': { name: '🌿 Garden Growth', func: this.gardenGrowth },
                'star-shower': { name: '✨ Star Shower', func: this.starShower },
                'victory-rainbow': { name: '🌈 Victory Rainbow', func: this.victoryRainbow },
                'gentle-fireworks': { name: '🎆 Gentle Fireworks', func: this.gentleFireworks },
                'achievement-glow': { name: '🏆 Achievement Glow', func: this.achievementGlow }
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
     * TASK ANIMATIONS - Gentle, calming celebrations
     */
    
    gentleGlow(element) {
        console.log('🎉 Triggering gentle glow animation on:', element);
        this.addAnimationClass(element, 'celebrate-gentle-glow');
        this.cleanupAfterAnimation(element, 700);
    }

    peacefulWave(element) {
        this.addAnimationClass(element, 'celebrate-peaceful-wave');
        this.cleanupAfterAnimation(element, 800);
    }

    softBreathe(element) {
        this.addAnimationClass(element, 'celebrate-soft-breathe');
        this.cleanupAfterAnimation(element, 1200);
    }

    floatingStars(element) {
        this.createParticles(element, '⭐', 3, 'float-up-fade');
        this.addAnimationClass(element, 'celebrate-subtle-scale');
        this.cleanupAfterAnimation(element, 1500);
    }

    floatingHearts(element) {
        this.createParticles(element, '💖', 3, 'float-up-fade');
        this.addAnimationClass(element, 'celebrate-subtle-scale');
        this.cleanupAfterAnimation(element, 1500);
    }

    gentleRipple(element) {
        this.addAnimationClass(element, 'celebrate-gentle-ripple');
        this.cleanupAfterAnimation(element, 1000);
    }

    natureGrowth(element) {
        this.createParticles(element, '🌱', 2, 'grow-fade');
        this.addAnimationClass(element, 'celebrate-nature-growth');
        this.cleanupAfterAnimation(element, 1200);
    }

    gentleSpiral(element) {
        this.addAnimationClass(element, 'celebrate-gentle-spiral');
        this.cleanupAfterAnimation(element, 1000);
    }

    progressFill(element) {
        this.addAnimationClass(element, 'celebrate-progress-fill');
        this.cleanupAfterAnimation(element, 800);
    }

    /**
     * ROUTINE ANIMATIONS - Special end-of-day celebrations
     */
    
    sunriseGlow(element) {
        this.addOverlayAnimation(element, 'overlay-sunrise-glow');
    }

    gardenGrowth(element) {
        this.createParticles(element, '🌸', 5, 'bloom-fade', true);
        this.addOverlayAnimation(element, 'overlay-garden-growth');
    }

    starShower(element) {
        this.createParticles(element, '✨', 8, 'star-fall', true);
        this.addOverlayAnimation(element, 'overlay-star-shower');
    }

    victoryRainbow(element) {
        this.addOverlayAnimation(element, 'overlay-victory-rainbow');
    }

    gentleFireworks(element) {
        this.createParticles(element, '✨', 6, 'gentle-burst', true);
        this.addOverlayAnimation(element, 'overlay-gentle-fireworks');
    }

    achievementGlow(element) {
        this.addOverlayAnimation(element, 'overlay-achievement-glow');
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
        const preference = currentUser.settings?.taskCelebration || 'gentle-glow';
        
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
        const preference = currentUser.settings?.routineCelebration || 'garden-growth';
        
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