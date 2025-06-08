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
        // Create multiple colorful expanding rings
        const rect = element.getBoundingClientRect();
        const colors = ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD'];
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const glow = document.createElement('div');
                glow.className = 'glow-ring';
                glow.style.left = rect.left + rect.width / 2 + 'px';
                glow.style.top = rect.top + rect.height / 2 + 'px';
                glow.style.borderColor = colors[i % colors.length];
                glow.style.animationDelay = '0s';
                document.body.appendChild(glow);
                setTimeout(() => glow.remove(), 1500);
            }, i * 150);
        }
        
        // Add sparkles around the card
        this.createSparkles(element, 8);
    }

    peacefulWave(element) {
        // Create a wave that passes through the card
        const rect = element.getBoundingClientRect();
        const wave = document.createElement('div');
        wave.className = 'peaceful-wave-effect';
        wave.style.left = rect.left - 50 + 'px';
        wave.style.top = rect.top + 'px';
        wave.style.width = rect.width + 100 + 'px';
        wave.style.height = rect.height + 'px';
        document.body.appendChild(wave);
        
        setTimeout(() => wave.remove(), 1000);
    }

    softBreathe(element) {
        // Create breathing circles
        const rect = element.getBoundingClientRect();
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const breathe = document.createElement('div');
                breathe.className = 'breathe-circle';
                breathe.style.left = rect.left + rect.width / 2 + 'px';
                breathe.style.top = rect.top + rect.height / 2 + 'px';
                document.body.appendChild(breathe);
                setTimeout(() => breathe.remove(), 1500);
            }, i * 300);
        }
    }

    floatingStars(element) {
        // Create a burst of colorful stars like confetti
        const rect = element.getBoundingClientRect();
        const stars = ['⭐', '✨', '💫', '🌟'];
        
        for (let i = 0; i < 20; i++) {
            const star = document.createElement('div');
            star.className = 'confetti-star';
            star.textContent = stars[Math.floor(Math.random() * stars.length)];
            star.style.left = rect.left + rect.width / 2 + 'px';
            star.style.top = rect.top + rect.height / 2 + 'px';
            star.style.fontSize = (16 + Math.random() * 16) + 'px';
            star.style.animationDuration = (1 + Math.random() * 1) + 's';
            star.style.animationDelay = Math.random() * 0.3 + 's';
            document.body.appendChild(star);
            setTimeout(() => star.remove(), 2500);
        }
        
        this.createSparkles(element, 10);
    }

    floatingHearts(element) {
        // Create colorful hearts that float up and wiggle
        const rect = element.getBoundingClientRect();
        const hearts = ['💖', '💕', '💗', '💝', '❤️'];
        const colors = ['#FF1493', '#FF69B4', '#FFB6C1', '#FF6B6B', '#FF4444'];
        
        for (let i = 0; i < 15; i++) {
            const heart = document.createElement('div');
            heart.className = 'confetti-heart';
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.left = rect.left + rect.width / 2 + 'px';
            heart.style.top = rect.top + rect.height / 2 + 'px';
            heart.style.color = colors[Math.floor(Math.random() * colors.length)];
            heart.style.fontSize = (20 + Math.random() * 20) + 'px';
            heart.style.animationDuration = (1.5 + Math.random() * 1) + 's';
            heart.style.animationDelay = Math.random() * 0.3 + 's';
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 3000);
        }
    }

    gentleRipple(element) {
        // Create expanding ripples
        const rect = element.getBoundingClientRect();
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ripple = document.createElement('div');
                ripple.className = 'gentle-ripple-ring';
                ripple.style.left = rect.left + rect.width / 2 + 'px';
                ripple.style.top = rect.top + rect.height / 2 + 'px';
                document.body.appendChild(ripple);
                setTimeout(() => ripple.remove(), 1000);
            }, i * 200);
        }
    }

    natureGrowth(element) {
        // Create a garden of colorful flowers and plants
        const rect = element.getBoundingClientRect();
        const plants = ['🌸', '🌺', '🌻', '🌷', '🌹', '🌿', '🌱', '🌼'];
        const butterflies = ['🦋', '🐝', '🐞'];
        
        // Growing flowers
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const plant = document.createElement('div');
                plant.className = 'nature-plant';
                plant.textContent = plants[Math.floor(Math.random() * plants.length)];
                plant.style.left = rect.left + (Math.random() * rect.width) + 'px';
                plant.style.top = rect.bottom + 'px';
                plant.style.fontSize = (24 + Math.random() * 16) + 'px';
                plant.style.animationDelay = '0s';
                plant.style.animationDuration = (1.5 + Math.random() * 0.5) + 's';
                document.body.appendChild(plant);
                setTimeout(() => plant.remove(), 2500);
            }, i * 100);
        }
        
        // Flying creatures
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const creature = document.createElement('div');
                creature.className = 'nature-creature';
                creature.textContent = butterflies[Math.floor(Math.random() * butterflies.length)];
                creature.style.left = rect.left + rect.width / 2 + 'px';
                creature.style.top = rect.top + rect.height / 2 + 'px';
                creature.style.fontSize = '24px';
                document.body.appendChild(creature);
                setTimeout(() => creature.remove(), 3000);
            }, i * 400);
        }
        
        this.createSparkles(element, 6);
    }

    gentleSpiral(element) {
        // Create spiral particles
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'spiral-particle';
            particle.textContent = '✨';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.animationDelay = (i * 0.1) + 's';
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }
    }

    progressFill(element) {
        // Create a progress bar that fills
        const rect = element.getBoundingClientRect();
        const progress = document.createElement('div');
        progress.className = 'progress-fill-bar';
        progress.style.left = rect.left + 'px';
        progress.style.top = rect.bottom - 5 + 'px';
        progress.style.width = rect.width + 'px';
        document.body.appendChild(progress);
        
        setTimeout(() => progress.remove(), 1000);
    }

    /**
     * ROUTINE ANIMATIONS - Special end-of-day celebrations
     */
    
    sunriseGlow(element) {
        // Create multiple expanding sun rays
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 12; i++) {
            const ray = document.createElement('div');
            ray.className = 'sun-ray';
            ray.style.left = centerX + 'px';
            ray.style.top = centerY + 'px';
            ray.style.transform = `rotate(${i * 30}deg)`;
            document.body.appendChild(ray);
            setTimeout(() => ray.remove(), 2000);
        }
        
        this.addOverlayAnimation(element, 'overlay-sunrise-glow');
    }

    gardenGrowth(element) {
        // Create growing flowers
        const flowers = ['🌸', '🌺', '🌻', '🌷', '🌹'];
        const rect = element.getBoundingClientRect();
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const flower = document.createElement('div');
                flower.className = 'garden-flower';
                flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
                flower.style.left = rect.left + Math.random() * rect.width + 'px';
                flower.style.top = rect.bottom + 'px';
                document.body.appendChild(flower);
                setTimeout(() => flower.remove(), 2500);
            }, i * 200);
        }
        
        this.createVisibleParticles(element, '🦋', 3, 'butterfly-float');
    }

    starShower(element) {
        // Create a magical shower of colorful stars
        const stars = ['⭐', '✨', '💫', '🌟', '⚡'];
        const colors = ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#FFA500'];
        
        // Create falling stars from top
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const star = document.createElement('div');
                star.className = 'falling-star-enhanced';
                star.textContent = stars[Math.floor(Math.random() * stars.length)];
                star.style.left = Math.random() * window.innerWidth + 'px';
                star.style.top = '-50px';
                star.style.color = colors[Math.floor(Math.random() * colors.length)];
                star.style.fontSize = (20 + Math.random() * 20) + 'px';
                star.style.animationDelay = Math.random() * 0.5 + 's';
                star.style.animationDuration = (2 + Math.random() * 1) + 's';
                document.body.appendChild(star);
                setTimeout(() => star.remove(), 4000);
            }, i * 50);
        }
        
        // Add colorful background flash
        const flash = document.createElement('div');
        flash.className = 'color-flash';
        flash.style.background = `radial-gradient(circle at center, ${colors[0]}20, transparent)`;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 1000);
    }

    victoryRainbow(element) {
        // Create rainbow arc
        const rainbow = document.createElement('div');
        rainbow.className = 'victory-rainbow-arc';
        document.body.appendChild(rainbow);
        
        // Add clouds at the ends
        const cloudLeft = document.createElement('div');
        cloudLeft.className = 'rainbow-cloud cloud-left';
        cloudLeft.textContent = '☁️';
        document.body.appendChild(cloudLeft);
        
        const cloudRight = document.createElement('div');
        cloudRight.className = 'rainbow-cloud cloud-right';
        cloudRight.textContent = '☁️';
        document.body.appendChild(cloudRight);
        
        setTimeout(() => {
            rainbow.remove();
            cloudLeft.remove();
            cloudRight.remove();
        }, 3000);
    }

    gentleFireworks(element) {
        // Create multiple firework bursts
        const colors = ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD'];
        
        for (let burst = 0; burst < 5; burst++) {
            setTimeout(() => {
                const x = 20 + Math.random() * 60;
                const y = 20 + Math.random() * 60;
                
                // Create burst center
                const center = document.createElement('div');
                center.className = 'firework-center';
                center.style.left = x + '%';
                center.style.top = y + '%';
                center.style.backgroundColor = colors[burst % colors.length];
                document.body.appendChild(center);
                
                // Create particles
                for (let i = 0; i < 12; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'firework-spark';
                    particle.style.left = x + '%';
                    particle.style.top = y + '%';
                    particle.style.backgroundColor = colors[burst % colors.length];
                    particle.style.transform = `rotate(${i * 30}deg)`;
                    document.body.appendChild(particle);
                    setTimeout(() => particle.remove(), 1500);
                }
                
                setTimeout(() => center.remove(), 1500);
            }, burst * 400);
        }
    }

    achievementGlow(element) {
        // Create trophy and stars
        const rect = element.getBoundingClientRect();
        const trophy = document.createElement('div');
        trophy.className = 'achievement-trophy';
        trophy.textContent = '🏆';
        trophy.style.left = rect.left + rect.width / 2 + 'px';
        trophy.style.top = rect.top + rect.height / 2 + 'px';
        document.body.appendChild(trophy);
        
        // Create orbiting stars
        for (let i = 0; i < 6; i++) {
            const star = document.createElement('div');
            star.className = 'achievement-star';
            star.textContent = '⭐';
            star.style.left = rect.left + rect.width / 2 + 'px';
            star.style.top = rect.top + rect.height / 2 + 'px';
            star.style.animationDelay = (i * 0.2) + 's';
            document.body.appendChild(star);
            setTimeout(() => star.remove(), 2000);
        }
        
        setTimeout(() => trophy.remove(), 2000);
    }

    /**
     * Helper methods for animations
     */
    
    addAnimationClass(element, className) {
        element.classList.add('celebration-animation', className);
    }
    
    createSparkles(element, count) {
        const rect = element.getBoundingClientRect();
        const colors = ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD', '#FFA500', '#FF6B6B'];
        
        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle-particle';
            sparkle.style.left = rect.left + rect.width / 2 + 'px';
            sparkle.style.top = rect.top + rect.height / 2 + 'px';
            sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            sparkle.style.animationDelay = Math.random() * 0.5 + 's';
            
            // Random spread direction
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            sparkle.style.setProperty('--spread-x', Math.cos(angle) * distance + 'px');
            sparkle.style.setProperty('--spread-y', Math.sin(angle) * distance + 'px');
            
            document.body.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 2000);
        }
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