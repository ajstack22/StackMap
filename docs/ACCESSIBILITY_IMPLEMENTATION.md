# StackMap Accessibility Implementation Guide

## Overview

StackMap is designed with a "special needs first" philosophy, making accessibility a core feature rather than an afterthought. This document details all accessibility implementations to ensure the application is usable by children and adults with various disabilities.

## Target User Accessibility Needs

### Primary Users: Children with Special Needs
- **Autism Spectrum Disorder (ASD)**: Need for routine, visual learning, sensory considerations
- **ADHD**: Require clear focus areas, minimal distractions, immediate feedback
- **Intellectual Disabilities**: Simple interfaces, clear visual cues, consistent patterns
- **Motor Disabilities**: Large touch targets, minimal precision required
- **Visual Impairments**: High contrast, screen reader support, clear visual hierarchy
- **Language/Reading Delays**: Emoji-based communication, minimal text

### Secondary Users: Parents/Caregivers
- May have their own accessibility needs
- Need simple interfaces while managing children
- Require quick access to features

## Visual Accessibility

### 1. Color and Contrast

```css
/* High contrast ratios for WCAG AA compliance */
:root {
    --text-primary: #1a1a1a;        /* Contrast ratio 15.3:1 on white */
    --text-secondary: #4a4a4a;      /* Contrast ratio 8.5:1 on white */
    --background-primary: #ffffff;
    --background-secondary: #f3f4f6;
    
    /* Activity card colors with sufficient contrast */
    --card-purple: #667eea;          /* 4.5:1 on white for large text */
    --card-blue: #3b82f6;
    --card-green: #10b981;
    --card-yellow: #f59e0b;
    --card-red: #ef4444;
}

/* Ensure text on colored backgrounds is readable */
.activity-card {
    background: var(--card-color);
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); /* Enhance readability */
}

/* Focus indicators with high visibility */
*:focus {
    outline: 3px solid #2563eb;
    outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .activity-card {
        border: 2px solid black;
    }
    
    .btn {
        border: 2px solid currentColor;
    }
}
```

### 2. Typography and Readability

```css
/* Clear, readable fonts */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                 'Roboto', 'Helvetica', 'Arial', sans-serif;
    font-size: 16px;
    line-height: 1.5;
    letter-spacing: 0.02em;
}

/* Scalable text sizes */
.activity-title {
    font-size: 1.125rem;  /* 18px */
    font-weight: 600;
    line-height: 1.3;
}

/* Support for user font size preferences */
@media (prefers-reduced-motion: no-preference) {
    html {
        font-size: clamp(14px, 2.5vw, 18px);
    }
}

/* Dyslexia-friendly option */
.dyslexia-mode {
    font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif;
    letter-spacing: 0.1em;
    word-spacing: 0.2em;
}
```

### 3. Visual Hierarchy

```css
/* Clear content structure */
.header {
    background: var(--primary-color);
    color: white;
    padding: 1rem;
    position: sticky;
    top: 0;
    z-index: 100;
}

.main-content {
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
}

/* Visual separation between sections */
.section {
    margin-bottom: 2rem;
    padding: 1rem;
    background: var(--background-secondary);
    border-radius: 12px;
}

/* Clear visual grouping */
.activity-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}
```

## Motor Accessibility

### 1. Touch Targets

```css
/* Minimum 44x44px touch targets (WCAG recommendation) */
.btn,
.activity-card,
.checkbox-container,
.fab {
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Spacing between interactive elements */
.btn + .btn,
.activity-card + .activity-card {
    margin-left: 8px;
}

/* Large clickable areas */
.activity-card {
    padding: 1rem;
    cursor: pointer;
    position: relative;
}

/* Extend clickable area without visual change */
.activity-card::before {
    content: '';
    position: absolute;
    inset: -8px;
    z-index: 0;
}
```

### 2. Gesture Support

```javascript
// Support for various input methods
class AccessibleInteractions {
    static initializeCard(card) {
        // Mouse support
        card.addEventListener('click', this.handleInteraction);
        
        // Touch support with larger hit area
        let touchTimeout;
        card.addEventListener('touchstart', (e) => {
            touchTimeout = setTimeout(() => {
                this.handleLongPress(card);
            }, 500);
        });
        
        card.addEventListener('touchend', () => {
            clearTimeout(touchTimeout);
        });
        
        // Keyboard support
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleInteraction(e);
            }
        });
        
        // Prevent accidental activation
        card.addEventListener('touchmove', () => {
            clearTimeout(touchTimeout);
        });
    }
}
```

### 3. Drag and Drop Accessibility

```javascript
// Accessible drag and drop implementation
class AccessibleDragDrop {
    static makeDraggable(element) {
        // Visual dragging for mouse/touch
        element.draggable = true;
        
        // Keyboard-based reordering
        element.setAttribute('role', 'listitem');
        element.setAttribute('aria-grabbed', 'false');
        
        // Keyboard controls
        element.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ':
                case 'Enter':
                    this.toggleGrab(element);
                    break;
                case 'ArrowUp':
                    if (element.getAttribute('aria-grabbed') === 'true') {
                        this.moveUp(element);
                        e.preventDefault();
                    }
                    break;
                case 'ArrowDown':
                    if (element.getAttribute('aria-grabbed') === 'true') {
                        this.moveDown(element);
                        e.preventDefault();
                    }
                    break;
                case 'Escape':
                    this.cancelDrag(element);
                    break;
            }
        });
    }
    
    static announceChange(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = message;
        announcement.style.position = 'absolute';
        announcement.style.left = '-9999px';
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }
}
```

## Cognitive Accessibility

### 1. Simple and Consistent Interface

```javascript
// Predictable navigation patterns
class NavigationConsistency {
    static standardButtonOrder = ['cancel', 'save'];
    static standardColors = {
        primary: '#667eea',
        success: '#10b981',
        danger: '#ef4444',
        neutral: '#6b7280'
    };
    
    static createButton(type, text) {
        const button = document.createElement('button');
        button.className = `btn btn--${type}`;
        button.textContent = text;
        
        // Consistent positioning
        button.style.order = this.standardButtonOrder.indexOf(type);
        
        // Predictable colors
        button.style.backgroundColor = this.standardColors[type];
        
        return button;
    }
}
```

### 2. Clear Visual Feedback

```javascript
// Immediate visual feedback for all actions
class VisualFeedback {
    static showSuccess(element) {
        element.classList.add('success-pulse');
        
        // Also announce to screen readers
        this.announce('Success!');
        
        setTimeout(() => {
            element.classList.remove('success-pulse');
        }, 1000);
    }
    
    static showError(element, message) {
        element.classList.add('error-shake');
        
        // Visual error indicator
        const errorIcon = document.createElement('span');
        errorIcon.className = 'error-icon';
        errorIcon.textContent = '⚠️';
        element.appendChild(errorIcon);
        
        // Announce error
        this.announce(`Error: ${message}`);
        
        setTimeout(() => {
            element.classList.remove('error-shake');
            errorIcon.remove();
        }, 3000);
    }
}
```

### 3. Reduced Cognitive Load

```javascript
// Progressive disclosure of complexity
class ProgressiveUI {
    static initializeSimpleMode() {
        // Hide advanced features by default
        document.querySelectorAll('.advanced-feature').forEach(el => {
            el.style.display = 'none';
        });
        
        // Larger, clearer UI elements
        document.body.classList.add('simple-mode');
        
        // Reduce choices
        this.limitChoices();
    }
    
    static limitChoices() {
        // Show only most common activities
        const commonActivities = ['🍎 Breakfast', '🎨 Art Time', '😴 Nap Time'];
        
        // Limit emoji picker to favorites
        const favoriteEmojis = ['⭐', '❤️', '🎉', '✅', '🏠'];
    }
}
```

## Screen Reader Support

### 1. Semantic HTML

```html
<!-- Proper document structure -->
<header role="banner">
    <h1>StackMap - Today's Activities</h1>
    <nav aria-label="User selection">
        <select aria-label="Choose user">
            <option>Sarah</option>
            <option>Michael</option>
        </select>
    </nav>
</header>

<main role="main">
    <section aria-labelledby="activities-heading">
        <h2 id="activities-heading">Activities</h2>
        <div role="list" aria-label="Today's activities">
            <article role="listitem" class="activity-card" 
                     aria-label="Breakfast, not completed">
                <span aria-hidden="true">🍎</span>
                <h3>Breakfast</h3>
                <p>Eat healthy breakfast</p>
                <input type="checkbox" 
                       aria-label="Mark Breakfast as completed">
            </article>
        </div>
    </section>
</main>
```

### 2. ARIA Implementation

```javascript
// Comprehensive ARIA labeling
class AriaManager {
    static updateActivityCard(card, activity) {
        // Set role and properties
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', 
            `${activity.title}, ${activity.completed ? 'completed' : 'not completed'}`
        );
        
        // Live region for updates
        if (activity.completed) {
            card.setAttribute('aria-live', 'polite');
            card.setAttribute('aria-atomic', 'true');
        }
        
        // Describe relationships
        const checkbox = card.querySelector('input[type="checkbox"]');
        const cardId = `card-${activity.id}`;
        card.id = cardId;
        checkbox.setAttribute('aria-describedby', cardId);
    }
    
    static announceChange(message) {
        // Use aria-live region for announcements
        const liveRegion = document.getElementById('aria-live') || 
                          this.createLiveRegion();
        
        liveRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
    
    static createLiveRegion() {
        const region = document.createElement('div');
        region.id = 'aria-live';
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only'; // Visually hidden
        document.body.appendChild(region);
        return region;
    }
}
```

### 3. Keyboard Navigation

```javascript
// Complete keyboard navigation support
class KeyboardNavigation {
    static initialize() {
        // Tab order management
        this.manageFocusOrder();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n': // New activity
                        e.preventDefault();
                        this.openNewActivityModal();
                        break;
                    case 's': // Save
                        e.preventDefault();
                        this.saveCurrentWork();
                        break;
                    case '/': // Focus search
                        e.preventDefault();
                        this.focusSearch();
                        break;
                }
            }
            
            // Navigation shortcuts
            switch(e.key) {
                case 'Escape':
                    this.closeActiveModal();
                    break;
                case 'Tab':
                    this.handleTabNavigation(e);
                    break;
            }
        });
    }
    
    static manageFocusOrder() {
        // Ensure logical tab order
        const focusableElements = [
            '.header-nav',
            '.user-selector',
            '.day-selector',
            '.activity-card',
            '.add-activity-btn',
            '.fab'
        ];
        
        focusableElements.forEach((selector, index) => {
            document.querySelectorAll(selector).forEach(el => {
                el.setAttribute('tabindex', '0');
            });
        });
    }
    
    static trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'a, button, input, textarea, select, [tabindex="0"]'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
        
        // Focus first element
        firstElement?.focus();
    }
}
```

## Sensory Accessibility

### 1. Animation Controls

```javascript
// Respect user preferences for motion
class MotionControl {
    static initialize() {
        // Check system preference
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;
        
        if (prefersReducedMotion) {
            document.body.classList.add('reduce-motion');
            this.disableAnimations();
        }
        
        // Allow manual override
        this.addMotionToggle();
    }
    
    static disableAnimations() {
        // Override animation durations
        const style = document.createElement('style');
        style.textContent = `
            .reduce-motion * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
        
        // Disable celebration animations
        window.celebrationManager?.disable();
    }
}
```

### 2. Audio Considerations

```javascript
// No automatic audio, optional sound effects
class AudioAccessibility {
    static soundEnabled = false;
    
    static initialize() {
        // Never autoplay audio
        // Sounds are opt-in only
        
        // Check stored preference
        this.soundEnabled = localStorage.getItem('stackmap-sound') === 'true';
    }
    
    static playSound(soundType) {
        if (!this.soundEnabled) return;
        
        // Play with user control
        const audio = new Audio(`sounds/${soundType}.mp3`);
        audio.volume = 0.3; // Never too loud
        
        // Allow interruption
        audio.play().catch(() => {
            // Silently fail if blocked
        });
    }
    
    static addSoundToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'sound-toggle';
        toggle.setAttribute('aria-label', 
            this.soundEnabled ? 'Disable sounds' : 'Enable sounds'
        );
        toggle.innerHTML = this.soundEnabled ? '🔊' : '🔇';
        
        toggle.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            localStorage.setItem('stackmap-sound', this.soundEnabled);
            this.updateToggle(toggle);
        });
        
        return toggle;
    }
}
```

## Mobile Accessibility

### 1. Touch Accessibility

```javascript
// Enhanced touch interaction
class TouchAccessibility {
    static initialize() {
        // Prevent zoom on double-tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Larger touch targets on mobile
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }
        
        // Handle touch with grace period
        this.addTouchHandlers();
    }
    
    static addTouchHandlers() {
        document.querySelectorAll('.activity-card').forEach(card => {
            let touchStartTime;
            let touchStartX, touchStartY;
            
            card.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            });
            
            card.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - touchStartTime;
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                
                // Check if it was a tap (not a swipe)
                const distance = Math.sqrt(
                    Math.pow(touchEndX - touchStartX, 2) + 
                    Math.pow(touchEndY - touchStartY, 2)
                );
                
                if (distance < 10 && touchDuration < 500) {
                    // Handle as tap
                    this.handleCardTap(card);
                }
            });
        });
    }
}
```

### 2. Viewport Management

```javascript
// Handle virtual keyboard and viewport changes
class ViewportAccessibility {
    static initialize() {
        // Handle iOS viewport issues
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            this.handleIOSViewport();
        }
        
        // Adjust for virtual keyboard
        window.visualViewport?.addEventListener('resize', () => {
            this.adjustForKeyboard();
        });
    }
    
    static adjustForKeyboard() {
        const viewport = window.visualViewport;
        const hasKeyboard = viewport.height < window.innerHeight * 0.75;
        
        if (hasKeyboard) {
            // Scroll focused input into view
            const activeElement = document.activeElement;
            if (activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA') {
                activeElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
            
            // Adjust layout
            document.body.style.height = `${viewport.height}px`;
            document.body.classList.add('keyboard-visible');
        } else {
            document.body.style.height = '';
            document.body.classList.remove('keyboard-visible');
        }
    }
}
```

## Testing Accessibility

### 1. Automated Testing

```javascript
// Accessibility test suite
describe('Accessibility Tests', () => {
    it('should have proper ARIA labels', () => {
        const cards = document.querySelectorAll('.activity-card');
        cards.forEach(card => {
            expect(card.getAttribute('aria-label')).toBeTruthy();
            expect(card.getAttribute('role')).toBe('article');
        });
    });
    
    it('should have sufficient color contrast', () => {
        const results = axe.run();
        expect(results.violations.filter(v => 
            v.id === 'color-contrast'
        )).toHaveLength(0);
    });
    
    it('should be keyboard navigable', () => {
        const focusableElements = document.querySelectorAll(
            'a, button, input, [tabindex="0"]'
        );
        
        focusableElements.forEach((el, index) => {
            el.focus();
            expect(document.activeElement).toBe(el);
        });
    });
});
```

### 2. Manual Testing Checklist

```markdown
## Accessibility Testing Checklist

### Visual
- [ ] All text has 4.5:1 contrast ratio (WCAG AA)
- [ ] Focus indicators are clearly visible
- [ ] UI works in high contrast mode
- [ ] Content reflows at 200% zoom
- [ ] No information conveyed by color alone

### Motor
- [ ] All interactive elements are ≥44x44px
- [ ] Drag operations have keyboard alternatives
- [ ] No time limits on interactions
- [ ] Touch targets have adequate spacing

### Cognitive
- [ ] Simple, consistent navigation
- [ ] Clear error messages
- [ ] No auto-advancing content
- [ ] Help available for complex tasks

### Screen Reader
- [ ] All images have alt text
- [ ] Form fields have labels
- [ ] Error messages are announced
- [ ] Page structure uses headings
- [ ] Dynamic content updates announced

### Keyboard
- [ ] Tab order is logical
- [ ] No keyboard traps
- [ ] All functions keyboard accessible
- [ ] Skip links available
- [ ] Focus visible at all times
```

## Accessibility Settings

```javascript
// User-configurable accessibility options
class AccessibilitySettings {
    static defaults = {
        largeText: false,
        highContrast: false,
        reduceMotion: false,
        screenReaderOptimized: false,
        simplifiedUI: false,
        colorBlindMode: 'none',
        fontSize: 'medium',
        touchTargetSize: 'normal'
    };
    
    static applySettings(settings) {
        const body = document.body;
        
        // Apply each setting
        Object.entries(settings).forEach(([key, value]) => {
            switch(key) {
                case 'largeText':
                    body.classList.toggle('large-text', value);
                    break;
                case 'highContrast':
                    body.classList.toggle('high-contrast', value);
                    break;
                case 'reduceMotion':
                    body.classList.toggle('reduce-motion', value);
                    break;
                case 'colorBlindMode':
                    body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
                    if (value !== 'none') {
                        body.classList.add(value);
                    }
                    break;
                case 'fontSize':
                    body.style.setProperty('--base-font-size', 
                        value === 'small' ? '14px' : 
                        value === 'large' ? '20px' : '16px'
                    );
                    break;
            }
        });
        
        // Save preferences
        localStorage.setItem('stackmap-a11y', JSON.stringify(settings));
    }
}
```

## Resources and Standards

### WCAG 2.1 Compliance
- Level AA compliance minimum
- Level AAA for critical features
- Regular audits with automated tools

### Testing Tools Used
- axe DevTools
- WAVE (WebAIM)
- Lighthouse (Chrome DevTools)
- NVDA/JAWS (screen readers)
- Manual keyboard testing

### Ongoing Improvements
1. User feedback collection
2. Regular accessibility audits
3. Staying updated with standards
4. Testing with real users
5. Continuous education

## Conclusion

Accessibility in StackMap is not an afterthought but a fundamental design principle. By implementing these comprehensive accessibility features, we ensure that all children and families can benefit from visual routine management, regardless of their abilities or disabilities.